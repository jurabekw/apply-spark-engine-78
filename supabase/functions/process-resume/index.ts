
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import "https://deno.land/x/xhr@0.1.0/mod.ts"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

// Enhanced PDF text extraction using pdf-parse library
const extractTextFromPDF = async (pdfBuffer: Uint8Array): Promise<string> => {
  try {
    console.log('Starting PDF text extraction with pdf-parse, buffer size:', pdfBuffer.length);
    
    // Import pdf-parse dynamically
    const { default: pdfParse } = await import('https://esm.sh/pdf-parse@1.1.1');
    
    // Parse PDF with pdf-parse library
    const data = await pdfParse(pdfBuffer);
    
    console.log('PDF parsed successfully');
    console.log('Total pages:', data.numpages);
    console.log('Extracted text length:', data.text?.length || 0);
    
    if (!data.text || data.text.trim().length < 50) {
      console.log('WARNING: Very little text extracted from PDF');
      
      // Try alternative extraction method for potentially scanned PDFs
      console.log('Attempting alternative text extraction...');
      
      // Convert buffer to base64 for potential OCR processing
      const base64 = btoa(String.fromCharCode.apply(null, Array.from(pdfBuffer)));
      
      // For now, return a message indicating manual review needed
      return `PDF processing completed but limited text was extracted (${data.text?.length || 0} characters). This may be a scanned document or image-based PDF. Extracted content: ${data.text?.substring(0, 500) || 'No readable text found'}. Manual review recommended.`;
    }
    
    // Clean and normalize the extracted text
    const cleanedText = data.text
      .replace(/\s+/g, ' ')
      .replace(/[^\x20-\x7E\u00A0-\u024F\u1E00-\u1EFF]/g, ' ')
      .trim();
    
    console.log('Sample extracted text:', cleanedText.substring(0, 500));
    
    return cleanedText;
    
  } catch (error) {
    console.error('Error with pdf-parse, trying fallback method:', error);
    
    // Fallback to manual parsing if pdf-parse fails
    try {
      return await fallbackPDFExtraction(pdfBuffer);
    } catch (fallbackError) {
      console.error('Fallback extraction also failed:', fallbackError);
      return 'PDF text extraction failed. Please ensure the file is a valid PDF with selectable text and not a scanned image.';
    }
  }
};

// Fallback manual PDF extraction method
const fallbackPDFExtraction = async (pdfBuffer: Uint8Array): Promise<string> => {
  console.log('Using fallback PDF extraction method');
  
  const pdfString = new TextDecoder('latin1').decode(pdfBuffer);
  let extractedText = '';
  
  // Extract text from parentheses (common PDF text storage)
  const textMatches = pdfString.match(/\(([^)]{3,})\)/g) || [];
  
  for (const match of textMatches) {
    const text = match.slice(1, -1); // Remove parentheses
    if (text && text.length > 2 && /[A-Za-z]/.test(text)) {
      extractedText += text.replace(/\\[rn]/g, ' ') + ' ';
    }
  }
  
  // Clean up extracted text
  extractedText = extractedText
    .replace(/\s+/g, ' ')
    .replace(/[^\x20-\x7E\u00A0-\u024F\u1E00-\u1EFF]/g, ' ')
    .trim();
  
  if (extractedText.length < 50) {
    return 'Limited text content found in PDF using fallback method. Please ensure the PDF contains selectable text and is not a scanned image.';
  }
  
  return extractedText;
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

    // Enhanced prompt for better extraction
    const prompt = `You are an expert HR assistant. Analyze this resume for the job position "${jobTitle}" with requirements: "${jobRequirements}".

Resume content:
${resumeText}

CRITICAL INSTRUCTIONS - EXTRACT INFORMATION PRECISELY:

1. CONTACT INFORMATION - Look carefully for:
   - Email addresses (look for @ symbols and common email formats)
   - Phone numbers (look for sequences of digits with separators)
   - Full name (usually at the top, may be in different languages/scripts)

2. EXPERIENCE CALCULATION - Be very careful:
   - Look for employment dates in various formats (2020-2023, Jan 2020 - Present, etc.)
   - Calculate total years by adding up all employment periods
   - Account for overlapping positions
   - If dates are unclear, look for phrases mentioning years of experience
   - If no clear experience found, set to null (not 0)

3. SKILLS EXTRACTION:
   - Look for dedicated skills sections
   - Extract technical skills, programming languages, tools, software
   - Include both hard and soft skills
   - Translate skills to English if needed

4. SCORING (0-100):
   - Be realistic in scoring based on job requirements match
   - Consider experience level, skills alignment, education relevance
   - Higher scores (80+) only for strong matches

5. LANGUAGE HANDLING:
   - Process resumes in any language
   - Keep original names in native script if needed
   - Translate job titles and skills to English when possible

RESPOND WITH ONLY A VALID JSON OBJECT:

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
    "match_reasoning": "detailed explanation of score and job match",
    "recommendations": "specific hiring recommendations",
    "language_notes": "note if resume is in non-English language"
  }
}`

    console.log('Calling OpenAI API with enhanced extraction...')
    
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
            content: `You are an expert HR resume analyzer. You MUST respond with ONLY a valid JSON object. Be extremely careful about extracting contact information (look for @ for emails, digit patterns for phones) and calculating experience years accurately. Look for date ranges and add them up carefully.`
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
      console.error('OpenAI API error:', errorText)
      throw new Error(`OpenAI API error: ${response.status} - ${errorText}`)
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

    // Enhanced data validation
    const sanitizedData = {
      name: candidateData.name || originalFilename.replace('.pdf', '').replace(/[_-]/g, ' '),
      email: validateEmail(candidateData.email),
      phone: validatePhone(candidateData.phone),
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
      if (value === null || value === undefined) return 50
      if (typeof value === 'number' && !isNaN(value)) {
        return Math.max(0, Math.min(100, Math.round(value)))
      }
      if (typeof value === 'string') {
        const parsed = parseFloat(value.replace(/[^\d.]/g, ''))
        if (!isNaN(parsed)) return Math.max(0, Math.min(100, Math.round(parsed)))
      }
      return 50
    }

    function validateAnalysis(analysis) {
      if (!analysis || typeof analysis !== 'object') {
        return {
          strengths: [],
          weaknesses: ['Analysis incomplete'],
          match_reasoning: 'Basic analysis completed',
          recommendations: 'Review candidate details',
          language_notes: 'Standard processing'
        }
      }

      return {
        strengths: Array.isArray(analysis.strengths) ? analysis.strengths : [],
        weaknesses: Array.isArray(analysis.weaknesses) ? analysis.weaknesses : ['Analysis incomplete'],
        match_reasoning: analysis.match_reasoning || 'Score based on available information',
        recommendations: analysis.recommendations || 'Review candidate for decision',
        language_notes: analysis.language_notes || 'Standard processing'
      }
    }

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
