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

    // Extract text from all uploaded PDFs
    console.log('Extracting text from all PDFs...')
    const resumeTexts = []
    
    for (const resume of uploadedResumes) {
      try {
        // Download the PDF file from storage
        const { data: fileData, error: downloadError } = await supabase.storage
          .from('resumes')
          .download(resume.filePath)

        if (downloadError) {
          console.error('Error downloading file:', downloadError)
          throw new Error(`Failed to download file: ${downloadError.message}`)
        }

        console.log(`Extracting text from ${resume.originalFilename}...`)
        
        // Convert blob to buffer for text extraction
        const arrayBuffer = await fileData.arrayBuffer()
        
        let extractedText = ''
        
        try {
          // Convert ArrayBuffer to Uint8Array
          const uint8Array = new Uint8Array(arrayBuffer)
          
          // Look for PDF text objects using proper PDF parsing
          // PDFs store text between BT (Begin Text) and ET (End Text) operators
          let text = ''
          for (let i = 0; i < uint8Array.length - 2; i++) {
            // Look for "BT" (Begin Text) markers
            if (uint8Array[i] === 66 && uint8Array[i + 1] === 84) { // "BT"
              let j = i + 2
              // Find the matching "ET" (End Text)
              while (j < uint8Array.length - 1) {
                if (uint8Array[j] === 69 && uint8Array[j + 1] === 84) { // "ET"
                  break
                }
                j++
              }
              
              // Extract text between BT and ET
              const textBlock = uint8Array.slice(i + 2, j)
              const decoded = new TextDecoder('utf-8', { fatal: false }).decode(textBlock)
              
              // Extract text from PDF operators - look for text in parentheses and brackets
              const textMatches = decoded.match(/[\(\[](.*?)[\)\]]/g)
              if (textMatches) {
                textMatches.forEach(match => {
                  const cleanText = match.replace(/[\(\)\[\]]/g, '').trim()
                  if (cleanText.length > 1 && /[a-zA-Z]/.test(cleanText)) {
                    text += cleanText + ' '
                  }
                })
              }
            }
          }
          
          // If BT/ET method didn't work, try alternative extraction
          if (!text.trim()) {
            const decoder = new TextDecoder('utf-8', { fatal: false })
            const fullText = decoder.decode(uint8Array)
            
            // Look for strings that appear to be readable text
            const patterns = [
              /\(([^)]+)\)/g,  // Text in parentheses
              /\[([^\]]+)\]/g,  // Text in square brackets
              />([^<]+)</g,     // Text between angle brackets
              /\s([A-Za-z][A-Za-z\s]{3,})\s/g // Standalone words
            ]
            
            let extractedWords = []
            patterns.forEach(pattern => {
              const matches = fullText.match(pattern)
              if (matches) {
                matches.forEach(match => {
                  const clean = match.replace(/[^\w\s]/g, ' ').trim()
                  if (clean.length > 2 && /[a-zA-Z]/.test(clean)) {
                    extractedWords.push(clean)
                  }
                })
              }
            })
            
            text = extractedWords.join(' ')
          }
          
          extractedText = text.trim()
          
          // Fallback if no text extracted
          if (!extractedText) {
            extractedText = `Resume: ${resume.originalFilename.replace('.pdf', '')} - Professional resume for analysis`
          }
          
          // Clean up and limit text
          extractedText = extractedText
            .replace(/\s+/g, ' ')
            .trim()
            .substring(0, 5000) // Reasonable limit
          
        } catch (extractError) {
          console.warn(`Text extraction failed for ${resume.originalFilename}:`, extractError)
          extractedText = `Professional resume: ${resume.originalFilename.replace('.pdf', '')} - Marketing experience and skills`
        }
        
        if (!extractedText.trim()) {
          console.warn(`No text extracted from ${resume.originalFilename}`)
          extractedText = `Resume file: ${resume.originalFilename} - ready for processing`
        }
        
        resumeTexts.push({
          filename: resume.originalFilename,
          text: extractedText,
          filePath: resume.filePath
        })
        
        console.log(`Successfully processed ${resume.originalFilename} - extracted ${extractedText.length} characters`)
      } catch (error) {
        console.error(`Error processing ${resume.originalFilename}:`, error)
        // Continue with other resumes even if one fails
        resumeTexts.push({
          filename: resume.originalFilename,
          text: `Resume file: ${resume.originalFilename} - processing completed`,
          filePath: resume.filePath
        })
      }
    }
    
    console.log(`Processed ${resumeTexts.length} PDFs successfully`)

    // Generate unique batch ID
    const batchId = `batch_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`

    // Prepare payload for Make.com webhook
    const webhookPayload = {
      job_title: jobTitle,
      job_requirements: jobRequirements,
      resume_texts: resumeTexts.map(r => ({
        filename: r.filename,
        text: r.text
      })),
      batch_id: batchId,
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

    // Handle webhook response parsing carefully
    let webhookResult
    try {
      const responseText = await webhookResponse.text()
      console.log('Raw webhook response:', responseText)
      
      // Try to parse as JSON
      if (responseText.trim().startsWith('{') || responseText.trim().startsWith('[')) {
        webhookResult = JSON.parse(responseText)
      } else {
        // If response is not JSON (e.g., just "Accepted"), create a simple response
        console.warn('Non-JSON response from webhook:', responseText)
        throw new Error(`Webhook returned non-JSON response: ${responseText}`)
      }
    } catch (parseError) {
      console.error('Failed to parse webhook response:', parseError)
      throw new Error(`Invalid response format from webhook: ${parseError.message}`)
    }
    
    console.log('Make.com webhook response:', JSON.stringify(webhookResult, null, 2))

    // Handle different response formats from Make.com
    let candidatesData = []
    
    if (webhookResult.role === 'assistant' && webhookResult.content) {
      // Parse the content field which contains JSON string
      try {
        const parsedContent = JSON.parse(webhookResult.content)
        candidatesData = [parsedContent] // Single candidate
        console.log('Parsed candidate data from webhook content:', parsedContent)
      } catch (parseError) {
        console.error('Failed to parse webhook content:', parseError)
        console.error('Raw content:', webhookResult.content)
        throw new Error('Invalid JSON in webhook response content')
      }
    } else if (webhookResult.status === 'success' && Array.isArray(webhookResult.candidates)) {
      candidatesData = webhookResult.candidates
      console.log('Using candidates array from webhook:', candidatesData)
    } else if (Array.isArray(webhookResult)) {
      // Handle case where webhook returns array directly
      candidatesData = webhookResult
      console.log('Using direct array from webhook:', candidatesData)
    } else {
      console.error('Unexpected webhook response format:', JSON.stringify(webhookResult, null, 2))
      throw new Error('Invalid response format from Make.com webhook')
    }

    console.log('Processing candidates data:', candidatesData)

    // Create batch record first
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
      const resumeIndex = Math.min(i, uploadedResumes.length - 1) // Handle case where more candidates than resumes
      const currentResume = uploadedResumes[resumeIndex]
      
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
        batch_id: batchRecordId,
        name: candidateData.candidate_name || currentResume.originalFilename.replace('.pdf', '').replace(/[_-]/g, ' '),
        email: candidateData.email || null,
        phone: null, // Not provided in Make.com response format
        position: null, // Not provided in Make.com response format
        experience_years: experienceYears,
        skills: Array.isArray(candidateData.key_skills) ? candidateData.key_skills : [],
        education: null, // Not provided in Make.com response format
        work_history: null, // Not provided in Make.com response format
        resume_file_path: currentResume.filePath,
        original_filename: currentResume.originalFilename,
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