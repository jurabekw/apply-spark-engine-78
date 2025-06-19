
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import "https://deno.land/x/xhr@0.1.0/mod.ts"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const { 
      resumeText, 
      jobRequirements, 
      jobTitle, 
      userId, 
      resumeFilePath,
      originalFilename 
    } = await req.json()

    console.log('Processing resume for job:', jobTitle)
    console.log('Original filename:', originalFilename)
    console.log('Storage path:', resumeFilePath)
    console.log('Resume text length:', resumeText?.length || 0)

    // Create Supabase client
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    
    const { createClient } = await import('https://esm.sh/@supabase/supabase-js@2')
    const supabase = createClient(supabaseUrl, supabaseKey)

    // Get OpenAI API key
    const openaiApiKey = Deno.env.get('OPENAI_API_KEY')
    if (!openaiApiKey) {
      throw new Error('OpenAI API key not configured')
    }

    // Enhanced prompt for multilingual resume analysis
    const prompt = `Analyze this resume for the job position "${jobTitle}" with requirements: "${jobRequirements}".

Resume content:
${resumeText}

IMPORTANT INSTRUCTIONS:
1. This resume may be in Russian, English, or other languages - analyze it regardless of language
2. Extract ALL available information even if limited
3. For Russian names, keep them in original Cyrillic if present
4. Translate job titles and skills to English when possible, but also keep originals
5. Be aggressive in extracting information - don't be too conservative
6. If experience isn't explicitly stated, make reasonable inferences from job history
7. Extract skills from job descriptions if not explicitly listed
8. Provide a score even with limited information - don't default to null

You must respond with ONLY a valid JSON object, no additional text or markdown formatting.

Extract the following information and provide a JSON response:
{
  "name": "candidate name (keep original script/language)",
  "email": "email address if found",
  "phone": "phone number if found", 
  "position": "current or desired position (translate if needed)",
  "experience_years": estimated years of experience as a number (make reasonable inference if not explicit),
  "skills": ["array", "of", "skills", "both", "original", "and", "translated"],
  "education": "education background",
  "work_history": "brief work history summary",
  "ai_score": score from 0-100 based on job match (provide score even with limited info),
  "ai_analysis": {
    "strengths": ["identified strengths"],
    "weaknesses": ["potential gaps or weaknesses"],
    "match_reasoning": "detailed explanation of the score and match assessment",
    "recommendations": "hiring recommendations and next steps",
    "language_notes": "note if resume is in non-English language"
  }
}

CRITICAL: Respond with ONLY the JSON object, no other text.`

    console.log('Calling OpenAI API...')
    
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${openaiApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini', // Updated to current model
        messages: [
          {
            role: 'system',
            content: `You are an expert multilingual HR assistant that analyzes resumes in any language. 
            You MUST respond with ONLY a valid JSON object, no additional text, explanations, or markdown formatting.
            Extract all available information and make reasonable inferences when needed.`
          },
          {
            role: 'user',
            content: prompt
          }
        ],
        temperature: 0.2,
        response_format: { type: "json_object" } // Force JSON response
      }),
    })

    if (!response.ok) {
      const errorText = await response.text()
      console.error('OpenAI API error:', errorText)
      throw new Error(`OpenAI API error: ${response.status} - ${errorText}`)
    }

    const aiResponse = await response.json()
    console.log('OpenAI response received successfully')
    
    const analysisText = aiResponse.choices[0].message.content
    console.log('Raw AI response:', analysisText)

    // Parse the AI response with better error handling
    let candidateData
    try {
      // Clean the response text in case there are any markdown artifacts
      const cleanedText = analysisText.replace(/```json\s*|\s*```/g, '').trim()
      candidateData = JSON.parse(cleanedText)
      console.log('Successfully parsed candidate data:', candidateData)
    } catch (parseError) {
      console.error('Failed to parse AI response:', analysisText)
      console.error('Parse error:', parseError)
      
      // Fallback: create a basic candidate entry
      candidateData = {
        name: originalFilename.replace('.pdf', '').replace(/[_-]/g, ' '),
        email: '',
        phone: '',
        position: jobTitle || 'Not specified',
        experience_years: null,
        skills: [],
        education: 'Information not available',
        work_history: 'Resume processing failed - manual review required',
        ai_score: 50,
        ai_analysis: {
          strengths: [],
          weaknesses: ['Resume processing failed - requires manual review'],
          match_reasoning: 'Unable to process resume automatically. Manual review needed.',
          recommendations: 'Please review this candidate manually as automated processing failed.',
          language_notes: 'Processing error occurred'
        }
      }
    }

    // Validate and sanitize the data
    const sanitizeData = (data) => {
      return {
        name: data.name || originalFilename.replace('.pdf', '').replace(/[_-]/g, ' '),
        email: data.email || '',
        phone: data.phone || null,
        position: data.position || null,
        experience_years: validateInteger(data.experience_years),
        skills: Array.isArray(data.skills) ? data.skills : [],
        education: data.education || null,
        work_history: data.work_history || null,
        ai_score: validateScore(data.ai_score),
        ai_analysis: data.ai_analysis || {
          strengths: [],
          weaknesses: ['Limited analysis available'],
          match_reasoning: 'Basic analysis completed',
          recommendations: 'Consider for further review',
          language_notes: 'Standard processing'
        }
      }
    }

    const validateInteger = (value) => {
      if (value === null || value === undefined || value === '') {
        return null
      }
      if (typeof value === 'number' && !isNaN(value) && Number.isInteger(value)) {
        return Math.max(0, Math.min(50, value))
      }
      if (typeof value === 'string') {
        const parsed = parseInt(value.replace(/\D/g, ''))
        if (!isNaN(parsed)) {
          return Math.max(0, Math.min(50, parsed))
        }
      }
      return null
    }

    const validateScore = (value) => {
      if (value === null || value === undefined || value === '') {
        return 50 // Default score instead of null
      }
      if (typeof value === 'number' && !isNaN(value)) {
        return Math.max(0, Math.min(100, Math.round(value)))
      }
      if (typeof value === 'string') {
        const parsed = parseFloat(value.replace(/[^\d.]/g, ''))
        if (!isNaN(parsed)) {
          return Math.max(0, Math.min(100, Math.round(parsed)))
        }
      }
      return 50 // Default score
    }

    const sanitizedData = sanitizeData(candidateData)
    console.log('Sanitized candidate data:', sanitizedData)

    // Insert candidate into database
    console.log('Inserting candidate into database...')
    const { data: candidate, error: dbError } = await supabase
      .from('candidates')
      .insert({
        user_id: userId,
        name: sanitizedData.name,
        email: sanitizedData.email,
        phone: sanitizedData.phone,
        position: sanitizedData.position,
        experience_years: sanitizedData.experience_years,
        skills: sanitizedData.skills,
        education: sanitizedData.education,
        work_history: sanitizedData.work_history,
        resume_file_path: resumeFilePath,
        original_filename: originalFilename,
        ai_score: sanitizedData.ai_score,
        ai_analysis: sanitizedData.ai_analysis,
        status: 'new',
        source: 'upload'
      })
      .select()
      .single()

    if (dbError) {
      console.error('Database error:', dbError)
      throw new Error(`Database error: ${dbError.message}`)
    }

    console.log('Candidate created successfully:', candidate.id)

    return new Response(
      JSON.stringify({ 
        success: true, 
        candidate: candidate 
      }),
      { 
        headers: { 
          ...corsHeaders, 
          'Content-Type': 'application/json' 
        } 
      }
    )

  } catch (error) {
    console.error('Error in process-resume function:', error)
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: error.message,
        details: error.stack
      }),
      { 
        status: 500,
        headers: { 
          ...corsHeaders, 
          'Content-Type': 'application/json' 
        } 
      }
    )
  }
})
