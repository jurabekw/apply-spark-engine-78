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
      uploadedResumes 
    } = await req.json()

    console.log('Processing resumes for job:', jobTitle)
    console.log('Number of resumes:', uploadedResumes?.length)

    // Create Supabase client
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    
    const { createClient } = await import('https://esm.sh/@supabase/supabase-js@2')
    const supabase = createClient(supabaseUrl, supabaseKey)

    // Generate unique batch ID
    const batchId = `batch_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`

    // Get public URLs for all uploaded files
    console.log('Getting public URLs for uploaded files...')
    const fileUrls = []
    
    for (const resume of uploadedResumes) {
      try {
        // Get public URL for the file
        const { data } = supabase.storage
          .from('resumes')
          .getPublicUrl(resume.filePath)

        fileUrls.push(data.publicUrl)
        
        console.log(`Got URL for ${resume.originalFilename}: ${data.publicUrl}`)
        
      } catch (error) {
        console.error(`Error getting URL for ${resume.originalFilename}:`, error)
        // Continue with other files even if one fails
      }
    }

    // Prepare payload for Make.com webhook
    const webhookPayload = {
      job_title: jobTitle,
      job_requirements: jobRequirements,
      files: fileUrls,
      batch_id: batchId,
      user_id: userId
    }

    console.log('Calling Make.com webhook with file URLs...')
    console.log('Payload:', JSON.stringify(webhookPayload, null, 2))

    // Call Make.com webhook with file URLs
    const webhookResponse = await fetch('https://hook.eu2.make.com/nzl6q7ixhxglium9j8h2p3reqdtx4rax', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(webhookPayload),
      signal: AbortSignal.timeout(120000) // 2 minutes timeout for Make.com to process
    })

    if (!webhookResponse.ok) {
      const errorText = await webhookResponse.text()
      console.error('Make.com webhook error:', webhookResponse.status, errorText)
      throw new Error(`Make.com webhook failed (${webhookResponse.status}): ${errorText}`)
    }

    // Handle webhook response
    let webhookResult
    try {
      const responseText = await webhookResponse.text()
      console.log('Raw webhook response:', responseText)
      
      // Try to parse as JSON
      if (responseText.trim().startsWith('{') || responseText.trim().startsWith('[')) {
        webhookResult = JSON.parse(responseText)
      } else {
        // If response is not JSON, treat as success
        console.log('Non-JSON response from webhook (treating as success):', responseText)
        return new Response(
          JSON.stringify({ 
            success: true, 
            message: 'Files sent to Make.com for processing',
            batch_id: batchId,
            files_sent: fileUrls.length
          }),
          { 
            headers: { 
              ...corsHeaders, 
              'Content-Type': 'application/json' 
            } 
          }
        )
      }
    } catch (parseError) {
      console.error('Failed to parse webhook response:', parseError)
      throw new Error(`Invalid response format from webhook: ${parseError.message}`)
    }
    
    console.log('Make.com webhook response:', JSON.stringify(webhookResult, null, 2))

    // Handle different response formats from Make.com
    let candidatesData = []
    
    if (webhookResult.candidates && Array.isArray(webhookResult.candidates)) {
      candidatesData = webhookResult.candidates
      console.log('Using candidates array from webhook:', candidatesData)
    } else if (Array.isArray(webhookResult)) {
      candidatesData = webhookResult
      console.log('Using direct array from webhook:', candidatesData)
    } else if (webhookResult.role === 'assistant' && webhookResult.content) {
      // Parse the content field which contains JSON string
      try {
        const parsedContent = JSON.parse(webhookResult.content)
        candidatesData = Array.isArray(parsedContent) ? parsedContent : [parsedContent]
        console.log('Parsed candidate data from webhook content:', candidatesData)
      } catch (parseError) {
        console.error('Failed to parse webhook content:', parseError)
        // Return success even if we can't parse candidate data
        return new Response(
          JSON.stringify({ 
            success: true, 
            message: 'Files sent to Make.com for processing. Data will be processed asynchronously.',
            batch_id: batchId,
            files_sent: fileUrls.length
          }),
          { 
            headers: { 
              ...corsHeaders, 
              'Content-Type': 'application/json' 
            } 
          }
        )
      }
    }

    // If we have candidate data, process it immediately
    if (candidatesData.length > 0) {
      console.log('Processing candidates data immediately:', candidatesData)

      // Create batch record
      const { data: batchData, error: batchError } = await supabase
        .from('candidate_batches')
        .insert({
          user_id: userId,
          job_title: jobTitle,
          job_requirements: jobRequirements,
          total_candidates: candidatesData.length
        })
        .select()
        .single()

      if (batchError) {
        console.error('Error creating batch record:', batchError)
        throw new Error(`Failed to create batch record: ${batchError.message}`)
      }

      const batchRecordId = batchData.id
      console.log('Created batch record with ID:', batchRecordId)

      // Process candidates from Make.com response
      const candidates = []
      for (let i = 0; i < candidatesData.length; i++) {
        const candidateData = candidatesData[i]
        const resumeIndex = Math.min(i, uploadedResumes.length - 1)
        const currentResume = uploadedResumes[resumeIndex]
        
        console.log('Processing candidate:', candidateData.candidate_name || candidateData.name)

        // Parse experience years
        let experienceYears = null
        if (candidateData.total_experience_years || candidateData.experience_years) {
          const exp = candidateData.total_experience_years || candidateData.experience_years
          const parsed = parseFloat(exp.toString())
          if (!isNaN(parsed)) {
            experienceYears = Math.floor(parsed)
          }
        }

        // Parse AI score
        let aiScore = 50
        if (candidateData.ai_score || candidateData.score) {
          const score = candidateData.ai_score || candidateData.score
          const parsed = parseInt(score.toString())
          if (!isNaN(parsed)) {
            aiScore = Math.max(0, Math.min(100, parsed))
          }
        }

        // Prepare candidate data for database
        const finalCandidateData = {
          user_id: userId,
          batch_id: batchRecordId,
          name: candidateData.candidate_name || candidateData.name || currentResume.originalFilename.replace('.pdf', '').replace(/[_-]/g, ' '),
          email: candidateData.email || null,
          phone: candidateData.phone || null,
          position: candidateData.position || null,
          experience_years: experienceYears,
          skills: Array.isArray(candidateData.key_skills || candidateData.skills) ? (candidateData.key_skills || candidateData.skills) : [],
          education: candidateData.education || null,
          work_history: candidateData.work_history || null,
          resume_file_path: currentResume.filePath,
          original_filename: currentResume.originalFilename,
          ai_score: aiScore,
          ai_analysis: {
            strengths: Array.isArray(candidateData.strengths) ? candidateData.strengths : [],
            weaknesses: Array.isArray(candidateData.areas_for_improvement || candidateData.weaknesses) ? (candidateData.areas_for_improvement || candidateData.weaknesses) : [],
            match_reasoning: candidateData.score_reasoning || candidateData.reasoning || 'Analysis completed via Make.com',
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
          console.error('Candidate data that failed:', JSON.stringify(finalCandidateData, null, 2))
          // Continue with other candidates even if one fails
          continue
        }

        candidates.push(candidate)
        console.log('Candidate created successfully:', candidate.id)
      }

      return new Response(
        JSON.stringify({ 
          success: true, 
          candidates: candidates,
          batch_id: batchRecordId,
          message: `Successfully processed ${candidates.length} candidate(s) via Make.com analysis`
        }),
        { 
          headers: { 
            ...corsHeaders, 
            'Content-Type': 'application/json' 
          } 
        }
      )
    }

    // Default response when no immediate candidate data
    return new Response(
      JSON.stringify({ 
        success: true, 
        message: 'Files sent to Make.com for processing',
        batch_id: batchId,
        files_sent: fileUrls.length
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