
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import "https://deno.land/x/xhr@0.1.0/mod.ts"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

// Simple PDF text extraction
const extractTextFromPDF = async (pdfBuffer: Uint8Array): Promise<string> => {
  console.log('Starting PDF text extraction, buffer size:', pdfBuffer.length);
  
  try {
    // Convert buffer to string for parsing
    const pdfString = new TextDecoder('latin1').decode(pdfBuffer);
    let extractedText = '';
    
    // Extract text from parentheses (most common text storage)
    const parenthesesMatches = pdfString.match(/\(([^)]{2,})\)/g) || [];
    for (const match of parenthesesMatches) {
      let text = match.slice(1, -1); // Remove parentheses
      // Handle escape sequences
      text = text.replace(/\\n/g, ' ').replace(/\\r/g, ' ').replace(/\\t/g, ' ');
      text = text.replace(/\\\(/g, '(').replace(/\\\)/g, ')').replace(/\\\\/g, '\\');
      if (text.length > 1 && /[A-Za-z0-9@.]/.test(text)) {
        extractedText += text + ' ';
      }
    }
    
    // Clean and normalize extracted text
    let cleanedText = extractedText
      .replace(/\s+/g, ' ')
      .replace(/[^\w\s@.\-+()]/g, ' ')
      .trim();
    
    console.log('Extracted text length:', cleanedText.length);
    
    if (cleanedText.length < 50) {
      return 'Could not extract sufficient text from PDF.';
    }
    
    return cleanedText;
    
  } catch (error) {
    console.error('PDF text extraction error:', error);
    return 'PDF text extraction failed.';
  }
};

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

    // Download the PDF file from storage
    console.log('Downloading PDF file from storage...')
    const { data: fileData, error: downloadError } = await supabase.storage
      .from('resumes')
      .download(resumeFilePath)

    if (downloadError) {
      console.error('Error downloading file:', downloadError)
      throw new Error(`Failed to download file: ${downloadError.message}`)
    }

    // Convert file to buffer and extract text
    const arrayBuffer = await fileData.arrayBuffer()
    const pdfBuffer = new Uint8Array(arrayBuffer)
    const resumeText = await extractTextFromPDF(pdfBuffer)

    console.log('Resume text extracted, length:', resumeText?.length || 0)

    if (!resumeText || resumeText.trim().length < 50) {
      throw new Error('Could not extract sufficient text from the PDF. Please ensure the file contains selectable text and is not a scanned image.')
    }

    // Get OpenAI API key
    const openaiApiKey = Deno.env.get('OPENAI_API_KEY')
    if (!openaiApiKey) {
      throw new Error('OpenAI API key not configured')
    }

    // Simple OpenAI analysis prompt
    const prompt = `Analyze this resume for the job: "${jobTitle}".

Requirements: ${jobRequirements}

Resume text:
${resumeText}

Extract candidate information and provide a match score (0-100). Return JSON:
{
  "name": "full name",
  "email": "email or null",
  "phone": "phone or null", 
  "position": "current/desired position",
  "experience_years": number_or_null,
  "skills": ["skill1", "skill2"],
  "education": "education background",
  "work_history": "work experience summary",
  "ai_score": 75,
  "ai_analysis": {
    "strengths": ["key strengths"],
    "weaknesses": ["areas for improvement"],
    "match_reasoning": "why this score",
    "recommendations": "hire recommendation"
  }
}`

    console.log('Calling OpenAI API for analysis...')
    
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
            content: 'You are an expert resume parser. Extract candidate information and return ONLY valid JSON.'
          },
          {
            role: 'user',
            content: prompt
          }
        ],
        temperature: 0.1,
        response_format: { type: "json_object" }
      }),
    })

    if (!response.ok) {
      const errorText = await response.text()
      console.error('OpenAI API error:', response.status, errorText)
      
      // Handle specific error cases with user-friendly messages
      if (response.status === 429) {
        throw new Error('OpenAI API quota exceeded. Please try again later or check your API usage.')
      } else if (response.status === 401 || response.status === 403) {
        throw new Error('OpenAI API authentication failed. Please check your API key configuration.')
      } else if (response.status >= 500) {
        throw new Error('OpenAI service temporarily unavailable. Please try again in a few minutes.')
      } else {
        throw new Error(`OpenAI API error (${response.status}): ${errorText}`)
      }
    }

    const aiResponse = await response.json()
    console.log('OpenAI response received successfully')
    
    const analysisText = aiResponse.choices[0].message.content
    console.log('Raw AI response:', analysisText)

    // Parse and validate the AI response
    let candidateData
    try {
      const cleanedText = analysisText.replace(/```json\s*|\s*```/g, '').trim()
      candidateData = JSON.parse(cleanedText)
      console.log('Successfully parsed candidate data:', candidateData)
    } catch (parseError) {
      console.error('Failed to parse AI response:', analysisText)
      throw new Error('Failed to parse AI analysis response')
    }

    // Simple data validation and preparation
    const finalData = {
      name: candidateData.name || originalFilename.replace('.pdf', '').replace(/[_-]/g, ' '),
      email: candidateData.email === 'null' ? null : candidateData.email,
      phone: candidateData.phone === 'null' ? null : candidateData.phone,
      position: candidateData.position || null,
      experience_years: candidateData.experience_years || null,
      skills: Array.isArray(candidateData.skills) ? candidateData.skills : [],
      education: candidateData.education || null,
      work_history: candidateData.work_history || null,
      ai_score: candidateData.ai_score || 50,
      ai_analysis: candidateData.ai_analysis || {
        strengths: ['Resume processed'],
        weaknesses: ['Standard processing'],
        match_reasoning: 'Basic analysis completed',
        recommendations: 'Review required'
      }
    }

    console.log('Processed candidate data:', finalData)

    // Insert candidate into database
    console.log('Inserting candidate into database...')
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
        candidate: candidate,
        message: 'Resume processed successfully with enhanced extraction'
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
