import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import "https://deno.land/x/xhr@0.1.0/mod.ts"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    const { 
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

    // Generate signed URL for the uploaded resume
    console.log('Generating signed URL for resume...')
    const { data: signedUrlData, error: signedUrlError } = await supabase.storage
      .from('resumes')
      .createSignedUrl(resumeFilePath, 3600) // 1 hour expiry

    if (signedUrlError) {
      console.error('Error generating signed URL:', signedUrlError)
      throw new Error(`Failed to generate signed URL: ${signedUrlError.message}`)
    }

    const resumeUrl = signedUrlData.signedUrl
    console.log('Generated signed URL successfully')

    // Generate unique analysis ID
    const analysisId = `analysis_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`

    // Prepare payload for Make.com webhook
    const webhookPayload = {
      job_title: jobTitle,
      job_requirements: jobRequirements,
      resume_urls: [resumeUrl],
      analysis_id: analysisId,
      user_id: userId
    }

    console.log('Calling Make.com webhook for analysis...')
    console.log('Payload:', JSON.stringify(webhookPayload, null, 2))

    // Call Make.com webhook
    const webhookResponse = await fetch('https://hook.eu2.make.com/nzl6q7ixhxglium9j8h2p3reqdtx4rax', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(webhookPayload),
      signal: AbortSignal.timeout(90000) // 90 seconds timeout
    })

    if (!webhookResponse.ok) {
      const errorText = await webhookResponse.text()
      console.error('Make.com webhook error:', webhookResponse.status, errorText)
      throw new Error(`Make.com webhook failed (${webhookResponse.status}): ${errorText}`)
    }

    const webhookResult = await webhookResponse.json()
    console.log('Make.com webhook response:', JSON.stringify(webhookResult, null, 2))

    if (webhookResult.status !== 'success' || !webhookResult.candidates || !Array.isArray(webhookResult.candidates)) {
      throw new Error('Invalid response format from Make.com webhook')
    }

    // Process candidates from Make.com response
    const candidates = []
    for (const candidateData of webhookResult.candidates) {
      console.log('Processing candidate:', candidateData.candidate_name)

      // Parse experience years (handle string format)
      let experienceYears = null
      if (candidateData.total_experience_years) {
        const parsed = parseFloat(candidateData.total_experience_years)
        if (!isNaN(parsed)) {
          experienceYears = Math.floor(parsed)
        }
      }

      // Parse AI score
      let aiScore = 50
      if (candidateData.ai_score) {
        const parsed = parseInt(candidateData.ai_score)
        if (!isNaN(parsed)) {
          aiScore = Math.max(0, Math.min(100, parsed))
        }
      }

      // Prepare candidate data for database
      const finalCandidateData = {
        user_id: userId,
        name: candidateData.candidate_name || originalFilename.replace('.pdf', '').replace(/[_-]/g, ' '),
        email: candidateData.email || null,
        phone: null, // Not provided in Make.com response format
        position: null, // Not provided in Make.com response format
        experience_years: experienceYears,
        skills: Array.isArray(candidateData.key_skills) ? candidateData.key_skills : [],
        education: null, // Not provided in Make.com response format
        work_history: null, // Not provided in Make.com response format
        resume_file_path: resumeFilePath,
        original_filename: originalFilename,
        ai_score: aiScore,
        ai_analysis: {
          strengths: [],
          weaknesses: Array.isArray(candidateData.areas_for_improvement) ? candidateData.areas_for_improvement : [],
          match_reasoning: candidateData.score_reasoning || 'Analysis completed via Make.com',
          recommendations: Array.isArray(candidateData.recommendations) ? candidateData.recommendations : []
        },
        status: 'new',
        source: 'upload'
      }

      // Insert candidate into database
      console.log('Inserting candidate into database:', finalCandidateData.name)
      const { data: candidate, error: dbError } = await supabase
        .from('candidates')
        .insert(finalCandidateData)
        .select()
        .single()

      if (dbError) {
        console.error('Database error for candidate:', finalCandidateData.name, dbError)
        throw new Error(`Database error: ${dbError.message}`)
      }

      candidates.push(candidate)
      console.log('Candidate created successfully:', candidate.id)
    }

    return new Response(
      JSON.stringify({ 
        success: true, 
        candidates: candidates,
        analysis_id: analysisId,
        message: `Successfully processed ${candidates.length} candidate(s) via Make.com analysis`
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
        timestamp: new Date().toISOString()
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