
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

    // Enhanced prompt for more accurate resume analysis
    const prompt = `You are an expert HR assistant. Analyze this resume for the job position "${jobTitle}" with requirements: "${jobRequirements}".

Resume content:
${resumeText}

CRITICAL INSTRUCTIONS - EXTRACT INFORMATION PRECISELY:

1. CONTACT INFORMATION - Look carefully for:
   - Email addresses (look for @ symbols and common email formats)
   - Phone numbers (look for sequences of digits, may include +, -, (), spaces)
   - Full name (usually at the top of resume)

2. EXPERIENCE CALCULATION - Be very careful:
   - Look for employment dates (2020-2023, Jan 2020 - Present, etc.)
   - Calculate total years of work experience by adding up all employment periods
   - If dates are unclear, look for phrases like "3 years experience" or similar
   - If no clear experience is found, set to null (not 0)

3. SKILLS EXTRACTION:
   - Look for dedicated skills sections
   - Extract technical skills, programming languages, tools
   - Include both hard and soft skills mentioned

4. SCORING (0-100):
   - Be realistic and justified in scoring
   - Consider job requirements match
   - Factor in experience level, skills alignment, education relevance

5. LANGUAGE HANDLING:
   - Process resumes in any language (Russian, English, etc.)
   - Keep original names in their native script
   - Translate skills and job titles to English when possible

RESPOND WITH ONLY A VALID JSON OBJECT - NO OTHER TEXT:

{
  "name": "exact full name from resume",
  "email": "email address if found (null if not found)",
  "phone": "phone number if found (null if not found)", 
  "position": "current/desired position from resume",
  "experience_years": calculated total years as integer (null if unclear),
  "skills": ["skill1", "skill2", "skill3"],
  "education": "education details",
  "work_history": "brief work experience summary",
  "ai_score": score from 0-100 (integer),
  "ai_analysis": {
    "strengths": ["specific strength 1", "specific strength 2"],
    "weaknesses": ["specific weakness 1", "specific weakness 2"],
    "match_reasoning": "detailed explanation of why this score was given and how candidate matches job requirements",
    "recommendations": "specific hiring recommendations",
    "language_notes": "note if resume is in non-English language"
  }
}`

    console.log('Calling OpenAI API with enhanced prompt...')
    
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${openaiApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        messages: [
          {
            role: 'system',
            content: `You are an expert HR resume analyzer. You MUST respond with ONLY a valid JSON object, no additional text, explanations, or markdown formatting. Be extremely careful about extracting contact information and calculating experience years accurately. Look for email patterns (@), phone number patterns (digits with separators), and date ranges for experience calculation.`
          },
          {
            role: 'user',
            content: prompt
          }
        ],
        temperature: 0.1, // Lower temperature for more consistent extraction
        response_format: { type: "json_object" }
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

    // Parse the AI response with improved error handling
    let candidateData
    try {
      const cleanedText = analysisText.replace(/```json\s*|\s*```/g, '').trim()
      candidateData = JSON.parse(cleanedText)
      console.log('Successfully parsed candidate data:', candidateData)
    } catch (parseError) {
      console.error('Failed to parse AI response:', analysisText)
      console.error('Parse error:', parseError)
      
      // Fallback: create a basic candidate entry
      candidateData = {
        name: originalFilename.replace('.pdf', '').replace(/[_-]/g, ' '),
        email: null,
        phone: null,
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

    // Enhanced data validation and sanitization
    const sanitizeData = (data) => {
      return {
        name: data.name || originalFilename.replace('.pdf', '').replace(/[_-]/g, ' '),
        email: validateEmail(data.email),
        phone: validatePhone(data.phone),
        position: data.position || null,
        experience_years: validateExperience(data.experience_years),
        skills: Array.isArray(data.skills) ? data.skills.filter(skill => skill && skill.trim()) : [],
        education: data.education || null,
        work_history: data.work_history || null,
        ai_score: validateScore(data.ai_score),
        ai_analysis: validateAnalysis(data.ai_analysis)
      }
    }

    const validateEmail = (email) => {
      if (!email || email === '' || email === 'null') return null
      // Basic email validation
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
      return emailRegex.test(email) ? email : null
    }

    const validatePhone = (phone) => {
      if (!phone || phone === '' || phone === 'null') return null
      // Clean phone number and check if it has enough digits
      const cleanPhone = phone.toString().replace(/\D/g, '')
      return cleanPhone.length >= 7 ? phone : null
    }

    const validateExperience = (value) => {
      if (value === null || value === undefined || value === '' || value === 'null') {
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

    const validateAnalysis = (analysis) => {
      if (!analysis || typeof analysis !== 'object') {
        return {
          strengths: [],
          weaknesses: ['Limited analysis available'],
          match_reasoning: 'Basic analysis completed',
          recommendations: 'Consider for further review',
          language_notes: 'Standard processing'
        }
      }

      return {
        strengths: Array.isArray(analysis.strengths) ? analysis.strengths : [],
        weaknesses: Array.isArray(analysis.weaknesses) ? analysis.weaknesses : ['Analysis incomplete'],
        match_reasoning: analysis.match_reasoning || 'Score based on available information',
        recommendations: analysis.recommendations || 'Review candidate details for decision',
        language_notes: analysis.language_notes || 'Standard processing'
      }
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
