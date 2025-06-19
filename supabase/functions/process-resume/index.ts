
import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.7.1';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { resumeText, jobRequirements, jobTitle, userId, resumeFilePath } = await req.json();

    console.log('Processing resume for job:', jobTitle);
    
    const openAIApiKey = Deno.env.get('OPENAI_API_KEY');
    if (!openAIApiKey) {
      throw new Error('OpenAI API key not configured');
    }

    // Create detailed prompt for resume analysis
    const prompt = `
    Analyze the following resume and extract key information. Also score this candidate against the job requirements.
    
    RESUME TEXT:
    ${resumeText}
    
    JOB TITLE: ${jobTitle}
    JOB REQUIREMENTS: ${jobRequirements}
    
    Please provide a JSON response with the following structure:
    {
      "name": "Full name of candidate",
      "email": "Email address if found",
      "phone": "Phone number if found",
      "position": "Current or most recent job title",
      "experience_years": "Estimated years of professional experience as integer",
      "skills": ["Array of technical and professional skills mentioned"],
      "education": "Educational background summary",
      "work_history": "Brief work experience summary",
      "ai_score": "Compatibility score from 0-100 based on job requirements",
      "analysis": {
        "strengths": ["Key strengths that match job requirements"],
        "gaps": ["Areas where candidate may not fully meet requirements"],
        "summary": "2-3 sentence overall assessment",
        "recommendation": "hire_recommended|consider_with_reservations|not_recommended"
      }
    }
    
    Be thorough but concise. If information is not available, use null for strings and empty arrays for arrays.
    `;

    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${openAIApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        messages: [
          { 
            role: 'system', 
            content: 'You are an expert HR professional and resume analyst. Provide accurate, unbiased candidate assessments in valid JSON format only.' 
          },
          { role: 'user', content: prompt }
        ],
        temperature: 0.3,
        max_tokens: 1500,
      }),
    });

    if (!response.ok) {
      throw new Error(`OpenAI API error: ${response.status}`);
    }

    const aiResponse = await response.json();
    const analysisText = aiResponse.choices[0].message.content;
    
    console.log('AI Analysis received:', analysisText);

    // Parse the JSON response from OpenAI
    let candidateData;
    try {
      // Clean the response to extract JSON
      const jsonMatch = analysisText.match(/\{[\s\S]*\}/);
      const jsonString = jsonMatch ? jsonMatch[0] : analysisText;
      candidateData = JSON.parse(jsonString);
    } catch (parseError) {
      console.error('Failed to parse AI response:', parseError);
      throw new Error('Failed to parse AI analysis');
    }

    // Initialize Supabase client
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_ANON_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Store candidate in database
    const { data: candidate, error: insertError } = await supabase
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
        ai_score: candidateData.ai_score,
        ai_analysis: candidateData.analysis,
        status: 'new',
        source: 'upload'
      })
      .select()
      .single();

    if (insertError) {
      console.error('Database insert error:', insertError);
      throw new Error('Failed to save candidate data');
    }

    console.log('Candidate saved successfully:', candidate.id);

    return new Response(
      JSON.stringify({ 
        success: true, 
        candidate: candidate,
        message: 'Resume processed successfully' 
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error in process-resume function:', error);
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: error.message 
      }),
      { 
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );
  }
});
