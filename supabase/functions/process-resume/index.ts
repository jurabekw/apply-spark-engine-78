
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

    // Call OpenAI API for resume analysis
    const prompt = `Analyze this resume for the job position "${jobTitle}" with requirements: "${jobRequirements}".

Resume content:
${resumeText}

Please extract the following information and provide a JSON response:
{
  "name": "candidate name",
  "email": "email address if found",
  "phone": "phone number if found", 
  "position": "current or desired position",
  "experience_years": number of years of experience,
  "skills": ["array", "of", "skills"],
  "education": "education background",
  "work_history": "brief work history summary",
  "ai_score": score from 0-100 based on job match,
  "ai_analysis": {
    "strengths": ["strength1", "strength2"],
    "weaknesses": ["weakness1", "weakness2"],
    "match_reasoning": "explanation of the score",
    "recommendations": "hiring recommendations"
  }
}

Focus on accuracy and be thorough in your analysis.`

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
            content: 'You are an expert HR assistant that analyzes resumes and provides structured feedback. Always respond with valid JSON.'
          },
          {
            role: 'user',
            content: prompt
          }
        ],
        temperature: 0.3,
      }),
    })

    if (!response.ok) {
      const error = await response.text()
      console.error('OpenAI API error:', error)
      throw new Error(`OpenAI API error: ${response.status}`)
    }

    const aiResponse = await response.json()
    const analysisText = aiResponse.choices[0].message.content

    // Parse the AI response
    let candidateData
    try {
      candidateData = JSON.parse(analysisText)
    } catch (parseError) {
      console.error('Failed to parse AI response:', analysisText)
      throw new Error('Invalid AI response format')
    }

    // Insert candidate into database with original filename
    const { data: candidate, error: dbError } = await supabase
      .from('candidates')
      .insert({
        user_id: userId,
        name: candidateData.name || 'Unknown',
        email: candidateData.email || '',
        phone: candidateData.phone,
        position: candidateData.position,
        experience_years: candidateData.experience_years,
        skills: candidateData.skills || [],
        education: candidateData.education,
        work_history: candidateData.work_history,
        resume_file_path: resumeFilePath,
        original_filename: originalFilename, // Store original filename
        ai_score: candidateData.ai_score,
        ai_analysis: candidateData.ai_analysis,
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
