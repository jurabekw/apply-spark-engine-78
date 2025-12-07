import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.45.0'
import pdfParse from 'https://esm.sh/pdf-parse@1.1.1'

// Add type declarations for Deno
declare const Deno: any

// CORS headers for web requests
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
    // Parse request body
    const { 
      job_title, 
      job_requirements, 
      files, 
      batch_id, 
      user_id,
      language = 'en'
    } = await req.json()

    console.log('Processing bulk resumes for job:', job_title)
    console.log('Number of resumes:', files?.length)

    // Validate required fields
    if (!job_title || !job_requirements || !files || !user_id) {
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: 'Missing required fields: job_title, job_requirements, files, or user_id' 
        }),
        { 
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      )
    }

    // Create Supabase client
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    const supabase = createClient(supabaseUrl, supabaseKey)

    // Process each file
    const results = []
    
    for (const fileUrl of files) {
      try {
        console.log('Processing file:', fileUrl)
        
        // Step 1: Download PDF file
        const response = await fetch(fileUrl)
        if (!response.ok) {
          throw new Error(`Failed to download PDF: ${response.status} ${response.statusText}`)
        }
        
        const arrayBuffer = await response.arrayBuffer()
        const pdfBuffer = new Uint8Array(arrayBuffer)
        
        // Step 2: Extract text from PDF using pdf-parse
        const pdfData = await pdfParse(pdfBuffer)
        const resumeText = pdfData.text
        
        if (!resumeText.trim()) {
          throw new Error('Failed to extract text from PDF')
        }

        // Step 3: Analyze with AI using OpenRouter
        const openRouterKey = Deno.env.get('OPENROUTER_API_KEY')
        if (!openRouterKey) {
          throw new Error('OPENROUTER_API_KEY not configured')
        }

        const systemPrompt = `You are an HR expert. Respond only with a valid, well-formed JSON object that strictly adheres to proper JSON syntax.

No text, comments, explanations, or formatting outside the JSON object.

Do not use markdown, code blocks, or any surrounding characters.

The JSON must be syntactically correct and ready for parsing without modification.

If the webhook data is in Russian, then you must output in Russian. If in English output in English`

        const userPrompt = `You are a professional resume analyzer. Analyze the provided resume text and extract key information with scoring.

**INPUT:**
Job Title: ${job_title}
Job Requirements: ${job_requirements}
Resume Text: ${resumeText}
**TASK:**
Extract candidate information and provide AI-powered scoring against the job requirements.

Required JSON format:

{
  "status": "success",
  "candidates": [
    {
      "name": "John Smith",
      "title": "Marketing Specialist",
      "experience": "6 years",
      "education_level": "Bachelor's Degree",
      "AI_score": "95",
      "key_skills": ["Digital Marketing", "SEO/SEM", "Google Analytics", "Content Marketing", "Social Media Marketing"],
      "score_reasoning": "The candidate's resume extensively covers various marketing specializations and demonstrates a strong background in digital marketing aligned with the job requirements.",
      "strengths": ["Proven ability to drive strategic initiatives", "Extensive experience in digital marketing across various platforms"],
      "areas_for_improvement": ["Could include more specific metrics for achievements prior to 2023", "Could tailor language more specifically to 'marketing specialist' duties across all roles"],
      "recommendations": "hire",
      "email": "shokirovj35@gmail.com",
      "phone": "+998 (94) 785-66-11"
    }
  ]
}

*IMPORTANT*

1. key_skills only 5 skills
2. score reasoning must be one short sentence
3. strengths must be one short sentence
4. areas for improvement must be one short sentence
5. Experience must be only years. Example: 5 years

Return JSON only. No explanations, comments, or additional text.`

        const aiResponse = await fetch('https://openrouter.ai/api/v1/chat/completions', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${openRouterKey}`,
            'Content-Type': 'application/json',
            'HTTP-Referer': 'https://talentspark.uz', // Optional, for openrouter analytics
            'X-Title': 'TalentSpark' // Optional, for openrouter analytics
          },
          body: JSON.stringify({
            model: "google/gemini-2.5-flash",
            messages: [
              { role: "system", content: systemPrompt },
              { role: "user", content: userPrompt }
            ],
            temperature: 1,
            top_p: 1
          })
        })

        if (!aiResponse.ok) {
          const errorText = await aiResponse.text()
          throw new Error(`AI API failed with status ${aiResponse.status}: ${errorText}`)
        }

        const aiResult = await aiResponse.json()
        console.log('AI analysis completed')
        
        // Extract the JSON content from AI response
        let aiContent
        try {
          const content = aiResult.choices[0].message.content
          // Try to parse as JSON directly
          aiContent = JSON.parse(content)
        } catch (parseError) {
          // If direct parsing fails, try to extract JSON from text
          const jsonMatch = aiResult.choices[0].message.content.match(/\{[\s\S]*\}/)
          if (jsonMatch) {
            aiContent = JSON.parse(jsonMatch[0])
          } else {
            throw new Error('Failed to parse AI response as JSON')
          }
        }

        results.push(aiContent)
        console.log('File processed successfully')
        
      } catch (fileError) {
        console.error('Error processing file:', fileUrl, fileError)
        results.push({
          status: "error",
          error: fileError.message,
          file_url: fileUrl
        })
      }
    }

    // Aggregate all results
    const aggregatedResults = {
      status: "success",
      batch_id: batch_id || `batch_${Date.now()}`,
      total_files: files.length,
      processed_files: results.length,
      candidates: []
    }

    // Extract candidates from all results
    for (const result of results) {
      if (result.status === "success" && result.candidates) {
        aggregatedResults.candidates.push(...result.candidates)
      }
    }

    console.log('Bulk processing completed:', {
      total_files: files.length,
      processed_files: results.length,
      candidates_found: aggregatedResults.candidates.length
    })

    return new Response(
      JSON.stringify(aggregatedResults),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    )

  } catch (error) {
    console.error('Error in bulk-resume-analysis function:', error)
    
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: error.message,
        timestamp: new Date().toISOString()
      }),
      { 
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    )
  }
})