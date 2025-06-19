
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
    console.log('Resume text preview (first 500 chars):', resumeText?.substring(0, 500))

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

Common Russian job titles and skills to recognize:
- "Менеджер" = Manager
- "Разработчик" = Developer  
- "Специалист" = Specialist
- "Директор" = Director
- "Координатор" = Coordinator
- "Аналитик" = Analyst

Please extract the following information and provide a JSON response:
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

CRITICAL REQUIREMENTS:
- For experience_years: Return a NUMBER (estimate if needed) or null only if absolutely no work history exists
- For ai_score: Return a NUMBER between 0-100 (don't default to null - provide reasonable estimate)
- Extract information aggressively - something is better than nothing
- If resume is mostly in Russian/other language, note this in ai_analysis.language_notes
- Always return valid JSON`

    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${openaiApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-4',
        messages: [
          {
            role: 'system',
            content: `You are an expert multilingual HR assistant that analyzes resumes in any language (especially Russian, English, and other languages). 
            
            Key principles:
            - Extract ALL available information regardless of language
            - Make reasonable inferences when information isn't explicit
            - Provide scores and analysis even with limited information
            - Handle Cyrillic text, special characters, and mixed languages
            - Always respond with valid JSON
            - For numeric fields, use numbers or null only when absolutely no information exists
            - Be aggressive in information extraction - don't be overly conservative`
          },
          {
            role: 'user',
            content: prompt
          }
        ],
        temperature: 0.2, // Lower temperature for more consistent extraction
      }),
    })

    if (!response.ok) {
      const error = await response.text()
      console.error('OpenAI API error:', error)
      throw new Error(`OpenAI API error: ${response.status}`)
    }

    const aiResponse = await response.json()
    const analysisText = aiResponse.choices[0].message.content

    console.log('Raw AI response:', analysisText)

    // Parse the AI response
    let candidateData
    try {
      candidateData = JSON.parse(analysisText)
      console.log('Parsed candidate data:', candidateData)
    } catch (parseError) {
      console.error('Failed to parse AI response:', analysisText)
      console.error('Parse error:', parseError)
      throw new Error('Invalid AI response format')
    }

    // Validate and sanitize the data before database insertion
    const sanitizeData = (data) => {
      return {
        name: data.name || 'Unknown',
        email: data.email || '',
        phone: data.phone || null,
        position: data.position || null,
        experience_years: validateInteger(data.experience_years),
        skills: Array.isArray(data.skills) ? data.skills : [],
        education: data.education || null,
        work_history: data.work_history || null,
        ai_score: validateScore(data.ai_score),
        ai_analysis: data.ai_analysis || null
      }
    }

    const validateInteger = (value) => {
      if (value === null || value === undefined || value === '') {
        return null
      }
      if (typeof value === 'number' && !isNaN(value) && Number.isInteger(value)) {
        return Math.max(0, Math.min(50, value)) // Cap at reasonable range
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
        return null
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
      return null
    }

    const sanitizedData = sanitizeData(candidateData)
    console.log('Sanitized candidate data:', sanitizedData)

    // Add fallback logic for critical fields
    const finalData = {
      ...sanitizedData,
      // Ensure we have at least a basic analysis even if AI failed
      ai_analysis: sanitizedData.ai_analysis || {
        strengths: [],
        weaknesses: ["Limited information available for analysis"],
        match_reasoning: "Analysis based on available resume content. May require manual review due to language or formatting issues.",
        recommendations: "Consider manual review of this candidate's resume for complete evaluation.",
        language_notes: "Resume may contain non-English content or formatting issues."
      },
      // Provide a default score if none was given
      ai_score: sanitizedData.ai_score !== null ? sanitizedData.ai_score : 50
    }

    console.log('Final processed data:', finalData)

    // Insert candidate into database with original filename
    const { data: candidate, error: dbError } = await supabase
      .from('candidates')
      .insert({
        user_id: userId,
        name: finalData.name,
        email: finalData.email,
        phone: finalData.phone,
        position: finalData.position,
        experience_years: finalData.experience_years,
        skills: finalData.skills,
        education: finalData.education,
        work_history: finalData.work_history,
        resume_file_path: resumeFilePath,
        original_filename: originalFilename,
        ai_score: finalData.ai_score,
        ai_analysis: finalData.ai_analysis,
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
        error: error.message 
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
