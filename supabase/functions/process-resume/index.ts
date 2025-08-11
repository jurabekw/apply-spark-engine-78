
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import "https://deno.land/x/xhr@0.1.0/mod.ts"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

// Comprehensive PDF text extraction using multiple methods
const extractTextFromPDF = async (pdfBuffer: Uint8Array): Promise<string> => {
  console.log('Starting comprehensive PDF text extraction, buffer size:', pdfBuffer.length);
  
  try {
    // Convert buffer to string for parsing
    const pdfString = new TextDecoder('latin1').decode(pdfBuffer);
    let extractedText = '';
    
    // Method 1: Extract from parentheses (most common text storage)
    console.log('Method 1: Extracting text from parentheses...');
    const parenthesesMatches = pdfString.match(/\(([^)]{2,})\)/g) || [];
    for (const match of parenthesesMatches) {
      let text = match.slice(1, -1); // Remove parentheses
      // Handle escape sequences
      text = text.replace(/\\n/g, ' ').replace(/\\r/g, ' ').replace(/\\t/g, ' ');
      text = text.replace(/\\\(/g, '(').replace(/\\\)/g, ')').replace(/\\\\/g, '\\');
      if (text.length > 1 && /[A-Za-zА-Яа-я0-9@.]/.test(text)) {
        extractedText += text + ' ';
      }
    }
    
    // Method 2: Extract from square brackets
    console.log('Method 2: Extracting text from square brackets...');
    const bracketMatches = pdfString.match(/\[([^\]]{2,})\]/g) || [];
    for (const match of bracketMatches) {
      let text = match.slice(1, -1);
      if (text.length > 1 && /[A-Za-zА-Яа-я0-9@.]/.test(text)) {
        extractedText += text + ' ';
      }
    }
    
    // Method 3: Extract from BT/ET blocks (text objects)
    console.log('Method 3: Extracting from BT/ET text objects...');
    const btEtRegex = /BT\s+(.*?)\s+ET/gs;
    const btEtMatches = pdfString.match(btEtRegex) || [];
    for (const block of btEtMatches) {
      // Look for Tj and TJ operators
      const tjMatches = block.match(/\(([^)]+)\)\s*Tj/g) || [];
      for (const match of tjMatches) {
        let text = match.match(/\(([^)]+)\)/)?.[1];
        if (text && text.length > 1 && /[A-Za-zА-Яа-я0-9@.]/.test(text)) {
          extractedText += text + ' ';
        }
      }
      
      // Handle TJ arrays
      const tjArrayMatches = block.match(/\[([^\]]+)\]\s*TJ/g) || [];
      for (const match of tjArrayMatches) {
        const content = match.match(/\[([^\]]+)\]/)?.[1];
        if (content) {
          const textParts = content.match(/\(([^)]+)\)/g) || [];
          for (const part of textParts) {
            let text = part.slice(1, -1);
            if (text.length > 1 && /[A-Za-zА-Яа-я0-9@.]/.test(text)) {
              extractedText += text + ' ';
            }
          }
        }
      }
    }
    
    // Method 4: Extract from stream objects
    console.log('Method 4: Extracting from stream objects...');
    const streamRegex = /stream\s*(.*?)\s*endstream/gs;
    const streamMatches = pdfString.match(streamRegex) || [];
    for (const stream of streamMatches) {
      // Try to find readable text in streams
      const readableText = stream.match(/[A-Za-zА-Яа-я0-9@.\s]{3,}/g) || [];
      for (const text of readableText) {
        if (text.trim().length > 2) {
          extractedText += text.trim() + ' ';
        }
      }
    }
    
    // Method 5: Direct text pattern matching
    console.log('Method 5: Direct pattern matching...');
    // Look for email patterns
    const emailMatches = pdfString.match(/[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g) || [];
    extractedText += emailMatches.join(' ') + ' ';
    
    // Look for phone patterns
    const phoneMatches = pdfString.match(/[\+]?[\d\s\-\(\)]{7,}/g) || [];
    extractedText += phoneMatches.join(' ') + ' ';
    
    // Look for year patterns (experience indicators)
    const yearMatches = pdfString.match(/20\d{2}|19\d{2}/g) || [];
    extractedText += yearMatches.join(' ') + ' ';
    
    console.log('Raw extracted text length:', extractedText.length);
    console.log('Sample extracted text:', extractedText.substring(0, 500));
    
    if (extractedText.length < 50) {
      console.log('Insufficient text extracted, trying alternative encoding...');
      
      // Try UTF-8 decoding
      try {
        const utf8String = new TextDecoder('utf-8').decode(pdfBuffer);
        const utf8Text = utf8String.match(/[A-Za-zА-Яа-я0-9@.\s]{3,}/g) || [];
        extractedText += utf8Text.join(' ') + ' ';
      } catch (e) {
        console.log('UTF-8 decoding failed:', e.message);
      }
      
      // Try Windows-1251 for Cyrillic
      try {
        const win1251String = new TextDecoder('windows-1251').decode(pdfBuffer);
        const cyrillicText = win1251String.match(/[А-Яа-я0-9@.\s]{3,}/g) || [];
        extractedText += cyrillicText.join(' ') + ' ';
      } catch (e) {
        console.log('Windows-1251 decoding failed:', e.message);
      }
    }
    
    // Clean and normalize extracted text
    let cleanedText = extractedText
      .replace(/\s+/g, ' ')
      .replace(/[^\w\s@.\-+()]/g, ' ')
      .trim();
    
    console.log('Final cleaned text length:', cleanedText.length);
    console.log('Final sample:', cleanedText.substring(0, 300));
    
    if (cleanedText.length < 50) {
      return 'PDF text extraction yielded insufficient readable content. This may be a scanned document or use unsupported text encoding.';
    }
    
    return cleanedText;
    
  } catch (error) {
    console.error('PDF text extraction error:', error);
    return 'PDF text extraction failed due to parsing error. Please ensure the file is a valid PDF.';
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

    // Get Gemini API key
    const geminiApiKey = Deno.env.get('GEMINI_API_KEY')
    if (!geminiApiKey) {
      throw new Error('Gemini API key not configured')
    }

    // Detect contact info hints from extracted text
    const emailHints = resumeText.match(/[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g) || [];
    const emailHint = emailHints.length ? emailHints[0] : null;
    const phoneCandidates = resumeText.match(/(\+?\d[\d\s().-]{7,}\d)/g) || [];
    const phoneHint = phoneCandidates.length
      ? phoneCandidates.sort((a, b) => b.replace(/\D/g, '').length - a.replace(/\D/g, '').length)[0].trim()
      : null;
    console.log('Detected contact hints:', { emailHint, phoneHint });
    
    // Enhanced aggressive extraction prompt
    const prompt = `You are an expert HR data extraction specialist. Extract maximum structured info from the resume text and prefer exact strings copied from the text. Do not hallucinate.

Job title: "${jobTitle}"
Requirements: "${jobRequirements}"

CONTACT HINTS (may be correct):
- email_hint: ${emailHint ?? 'none'}
- phone_hint: ${phoneHint ?? 'none'}

RESUME TEXT:
${resumeText}

STRICT RULES:
1) Contact: Use the hints only if they also appear in the text; otherwise extract from text. Return null if nothing reliable is present.
2) Work history: Prioritize explicit company names and titles. Aim for a concise timeline with company → title → dates (if present). Use keywords like Inc, LLC, Ltd, GmbH, Company, or recognizable org names. Avoid generic statements like "no work history" unless nothing at all exists.
3) Experience years: Derive from ranges/years; make a reasonable estimate if ranges are clear.
4) Skills: Unique, relevant skills.
5) Output must be valid JSON only.

Respond with ONLY this JSON object:
{
  "name": "best guess full name from text",
  "email": "email or null",
  "phone": "phone or null",
  "position": "job title or null",
  "experience_years": integer or null,
  "skills": ["skill1", "skill2"],
  "education": "education or null",
  "work_history": "concise timeline listing companies and roles; include dates when present or 'dates unavailable'",
  "ai_score": 25-100,
  "ai_analysis": {
    "strengths": ["strength1", "strength2"],
    "weaknesses": ["weakness1", "weakness2"],
    "match_reasoning": "why the score",
    "recommendations": "hiring recommendation",
    "extraction_notes": "note if hints were used or if text was garbled"
  }
}`

    console.log('Calling Gemini API with aggressive extraction prompt...')
    
    const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-pro:generateContent?key=${geminiApiKey}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        contents: [
          {
            parts: [
              {
                text: `You are an expert resume data extractor. Extract maximum information even from partially readable or garbled text. Be aggressive in your extraction and make educated guesses when needed. ALWAYS respond with valid JSON only.\n\n${prompt}`
              }
            ]
          }
        ],
        generationConfig: {
          temperature: 0.3,
          responseMimeType: "application/json"
        }
      }),
    })

    if (!response.ok) {
      const errorText = await response.text()
      console.error('Gemini API error:', response.status, errorText)
      
      // Handle specific error cases with user-friendly messages
      if (response.status === 429) {
        throw new Error('Gemini API quota exceeded. Please try again later or check your API usage.')
      } else if (response.status === 401 || response.status === 403) {
        throw new Error('Gemini API authentication failed. Please check your API key configuration.')
      } else if (response.status >= 500) {
        throw new Error('Gemini service temporarily unavailable. Please try again in a few minutes.')
      } else {
        throw new Error(`Gemini API error (${response.status}): ${errorText}`)
      }
    }

    const aiResponse = await response.json()
    console.log('Gemini response received successfully')
    
    const analysisText = aiResponse.candidates[0].content.parts[0].text
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

    // Prepare fallback contact info from hints
    const fallbackEmail = emailHint && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(emailHint) ? emailHint : null;
    const fallbackPhone = phoneHint && phoneHint.replace(/\D/g, '').length >= 7 ? phoneHint : null;

    // Enhanced data validation with more permissive approach
    const sanitizedData = {
      name: candidateData.name || originalFilename.replace('.pdf', '').replace(/[_-]/g, ' '),
      email: validateEmail(candidateData.email) || fallbackEmail,
      phone: validatePhone(candidateData.phone) || fallbackPhone,
      position: candidateData.position || null,
      experience_years: validateExperience(candidateData.experience_years),
      skills: Array.isArray(candidateData.skills) ? candidateData.skills.filter(skill => skill && skill.trim()) : [],
      education: candidateData.education || null,
      work_history: candidateData.work_history || null,
      ai_score: validateScore(candidateData.ai_score),
      ai_analysis: validateAnalysis(candidateData.ai_analysis)
    }

    function validateEmail(email) {
      if (!email || email === 'null' || email === 'undefined') return null
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
      return emailRegex.test(email.toString()) ? email.toString().trim() : null
    }

    function validatePhone(phone) {
      if (!phone || phone === 'null' || phone === 'undefined') return null
      const cleanPhone = phone.toString().replace(/\D/g, '')
      return cleanPhone.length >= 7 ? phone.toString().trim() : null
    }

    function validateExperience(value) {
      if (value === null || value === undefined || value === 'null') return null
      if (typeof value === 'number' && !isNaN(value) && Number.isInteger(value)) {
        return Math.max(0, Math.min(50, value))
      }
      if (typeof value === 'string') {
        const parsed = parseInt(value.replace(/\D/g, ''))
        if (!isNaN(parsed)) return Math.max(0, Math.min(50, parsed))
      }
      return null
    }

    function validateScore(value) {
      if (value === null || value === undefined) return 35 // Default to reasonable score
      if (typeof value === 'number' && !isNaN(value)) {
        return Math.max(25, Math.min(100, Math.round(value))) // Minimum 25
      }
      if (typeof value === 'string') {
        const parsed = parseFloat(value.replace(/[^\d.]/g, ''))
        if (!isNaN(parsed)) return Math.max(25, Math.min(100, Math.round(parsed)))
      }
      return 35
    }

    function validateAnalysis(analysis) {
      if (!analysis || typeof analysis !== 'object') {
        return {
          strengths: ['Resume processed'],
          weaknesses: ['Limited text quality'],
          match_reasoning: 'Score based on available information extraction',
          recommendations: 'Review candidate details for final decision',
          extraction_notes: 'Text extraction completed with standard methods'
        }
      }

      return {
        strengths: Array.isArray(analysis.strengths) ? analysis.strengths : ['Resume processed'],
        weaknesses: Array.isArray(analysis.weaknesses) ? analysis.weaknesses : ['Limited analysis available'],
        match_reasoning: analysis.match_reasoning || 'Score based on available information',
        recommendations: analysis.recommendations || 'Review candidate for decision',
        extraction_notes: analysis.extraction_notes || 'Standard text extraction completed'
      }
    }

    // Optional second pass to strengthen work_history and fill missing contact info
    let finalData = { ...sanitizedData } as typeof sanitizedData
    const weakWorkHistory = !finalData.work_history || finalData.work_history.length < 30 || !/(19|20)\d{2}/.test(finalData.work_history)
    if (weakWorkHistory) {
      console.log('Work history weak/missing. Running second-pass extraction...')
      const secondPrompt = `From the resume text below, extract ONLY these fields in JSON:\n{
  "work_history": "concise timeline listing company names and job titles; include dates if present or 'dates unavailable'",
  "email": "email or null",
  "phone": "phone or null"
}\nResume text:\n${resumeText}\nHints:\n- email_hint: ${emailHint ?? 'none'}\n- phone_hint: ${phoneHint ?? 'none'}\nRules:\n- Prefer exact strings from the text.\n- If hints appear in the text, you may use them.\n- Return valid JSON only.`
      try {
        const secondRes = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-pro:generateContent?key=${geminiApiKey}`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            contents: [
              {
                parts: [
                  {
                    text: `You extract work history and contact info from resumes. Return valid JSON only.\n\n${secondPrompt}`
                  }
                ]
              }
            ],
            generationConfig: {
              temperature: 0.2,
              responseMimeType: "application/json"
            }
          }),
        })
        if (secondRes.ok) {
          const secondJson = await secondRes.json()
          const secondText = secondJson.candidates?.[0]?.content?.parts?.[0]?.text || ''
          console.log('Second-pass raw response:', secondText)
          try {
            const parsed = JSON.parse(secondText.replace(/```json\s*|\s*```/g, '').trim())
            if (parsed.work_history && parsed.work_history.length > 20) {
              finalData.work_history = parsed.work_history
            }
            const maybeEmail = validateEmail(parsed.email)
            const maybePhone = validatePhone(parsed.phone)
            if (!finalData.email && maybeEmail) finalData.email = maybeEmail
            if (!finalData.phone && maybePhone) finalData.phone = maybePhone
          } catch (e) {
            console.warn('Second-pass parse failed')
          }
        } else {
          const errText = await secondRes.text()
          console.warn('Second-pass API error:', errText)
        }
      } catch (e) {
        console.error('Second-pass extraction error:', e)
      }
    }

    console.log('Final candidate data (after second pass if any):', finalData)

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
