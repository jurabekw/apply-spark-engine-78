
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import "https://deno.land/x/xhr@0.1.0/mod.ts"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

// Improved PDF text extraction function
const extractTextFromPDF = async (pdfBuffer: Uint8Array): Promise<string> => {
  try {
    console.log('Starting PDF text extraction, buffer size:', pdfBuffer.length);
    
    // Convert to string for parsing
    const pdfString = new TextDecoder('latin1').decode(pdfBuffer);
    
    // Look for text objects in PDF structure
    let extractedText = '';
    
    // Method 1: Extract text from BT/ET blocks (text objects)
    const textObjectRegex = /BT\s+(.*?)\s+ET/gs;
    const textObjects = pdfString.match(textObjectRegex) || [];
    
    console.log('Found text objects:', textObjects.length);
    
    for (const textObj of textObjects) {
      // Extract text from Tj and TJ operators
      const tjMatches = textObj.match(/\((.*?)\)\s*Tj/g) || [];
      const tjArrayMatches = textObj.match(/\[(.*?)\]\s*TJ/g) || [];
      
      for (const match of tjMatches) {
        const text = match.match(/\((.*?)\)/)?.[1];
        if (text && text.length > 1) {
          extractedText += text.replace(/\\[rn]/g, ' ') + ' ';
        }
      }
      
      for (const match of tjArrayMatches) {
        const content = match.match(/\[(.*?)\]/)?.[1];
        if (content) {
          // Extract strings from TJ arrays
          const strings = content.match(/\((.*?)\)/g) || [];
          for (const str of strings) {
            const text = str.slice(1, -1); // Remove parentheses
            if (text && text.length > 1) {
              extractedText += text.replace(/\\[rn]/g, ' ') + ' ';
            }
          }
        }
      }
    }
    
    // Method 2: Look for stream objects with text content
    const streamRegex = /stream\s+(.*?)\s+endstream/gs;
    const streams = pdfString.match(streamRegex) || [];
    
    console.log('Found streams:', streams.length);
    
    for (const stream of streams) {
      const content = stream.replace(/^stream\s+/, '').replace(/\s+endstream$/, '');
      
      // Try to find readable text patterns
      const readableText = content.match(/[A-Za-z0-9@.\-+\s]{3,}/g);
      if (readableText) {
        for (const text of readableText) {
          // Filter out likely non-text content
          if (!/^[\d\s.]+$/.test(text) && text.trim().length > 2) {
            extractedText += text.trim() + ' ';
          }
        }
      }
    }
    
    // Method 3: Direct text extraction from parentheses
    const directTextMatches = pdfString.match(/\(([^)]{2,})\)/g) || [];
    console.log('Found direct text matches:', directTextMatches.length);
    
    for (const match of directTextMatches) {
      const text = match.slice(1, -1); // Remove parentheses
      if (text && text.length > 2 && /[A-Za-z]/.test(text)) {
        extractedText += text.replace(/\\[rn]/g, ' ') + ' ';
      }
    }
    
    // Clean up extracted text
    extractedText = extractedText
      .replace(/\s+/g, ' ')
      .replace(/\\[rn]/g, ' ')
      .replace(/[^\x20-\x7E\u00A0-\u024F\u1E00-\u1EFF]/g, ' ')
      .trim();
    
    console.log('Extracted text length:', extractedText.length);
    console.log('Sample extracted text:', extractedText.substring(0, 500));
    
    // If we still don't have much readable text, try a more aggressive approach
    if (extractedText.length < 100) {
      console.log('Trying alternative extraction method...');
      
      // Look for any readable sequences
      const alternativeText = pdfString.match(/[A-Za-z][A-Za-z0-9@.\-+\s]{10,}/g) || [];
      let altExtracted = '';
      
      for (const text of alternativeText) {
        if (!/^[\d\s.]+$/.test(text) && text.includes(' ')) {
          altExtracted += text.trim() + ' ';
        }
      }
      
      if (altExtracted.length > extractedText.length) {
        extractedText = altExtracted.trim();
      }
    }
    
    if (extractedText.length < 50) {
      console.log('WARNING: Very little text extracted from PDF');
      return 'Limited text content found in PDF. Please ensure the PDF contains selectable text and is not a scanned image.';
    }
    
    return extractedText;
  } catch (error) {
    console.error('Error extracting text from PDF:', error);
    return 'PDF text extraction failed. Please ensure the file is a valid PDF with selectable text.';
  }
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
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

    // Enhanced prompt for more accurate resume analysis
    const prompt = `You are an expert HR assistant. Analyze this resume for the job position "${jobTitle}" with requirements: "${jobRequirements}".

Resume content:
${resumeText}

CRITICAL INSTRUCTIONS - EXTRACT INFORMATION PRECISELY:

1. CONTACT INFORMATION - Look carefully for:
   - Email addresses (look for @ symbols and common email formats like name@domain.com)
   - Phone numbers (look for sequences of digits, may include +, -, (), spaces, country codes)
   - Full name (usually at the top of resume, may be in different languages)

2. EXPERIENCE CALCULATION - Be very careful:
   - Look for employment dates (2020-2023, Jan 2020 - Present, 2020-н.в., с 2020 по 2023, etc.)
   - Calculate total years of work experience by adding up all employment periods
   - Account for overlapping positions by using the earliest start to latest end date
   - If dates are unclear, look for phrases like "3 years experience" or similar
   - If no clear experience is found, set to null (not 0)

3. SKILLS EXTRACTION:
   - Look for dedicated skills sections
   - Extract technical skills, programming languages, tools, software
   - Include both hard and soft skills mentioned
   - Look for skills in different languages and translate to English

4. SCORING (0-100):
   - Be realistic and justified in scoring
   - Consider job requirements match carefully
   - Factor in experience level, skills alignment, education relevance
   - Higher scores (80+) only for strong matches

5. LANGUAGE HANDLING:
   - Process resumes in any language (Russian, English, Uzbek, etc.)
   - Keep original names in their native script if needed
   - Translate skills and job titles to English when possible
   - Note the resume language in language_notes

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
      if (!email || email === '' || email === 'null' || email === 'undefined') return null
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
      return emailRegex.test(email.toString()) ? email.toString().trim() : null
    }

    const validatePhone = (phone) => {
      if (!phone || phone === '' || phone === 'null' || phone === 'undefined') return null
      const cleanPhone = phone.toString().replace(/\D/g, '')
      return cleanPhone.length >= 7 ? phone.toString().trim() : null
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
        return 50
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
      return 50
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
        candidate: candidate,
        message: 'Resume processed successfully'
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
    
    let errorMessage = 'An unexpected error occurred while processing the resume.'
    
    if (error.message.includes('OpenAI API')) {
      errorMessage = 'Failed to analyze resume content. Please try again.'
    } else if (error.message.includes('Database')) {
      errorMessage = 'Failed to save candidate data. Please contact support.'
    } else if (error.message.includes('API key')) {
      errorMessage = 'Service configuration error. Please contact support.'
    } else if (error.message.includes('download')) {
      errorMessage = 'Failed to access uploaded file. Please try uploading again.'
    }
    
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: errorMessage,
        details: error.message,
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
