import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { Resend } from "npm:resend@2.0.0";

const resend = new Resend(Deno.env.get("RESEND_API_KEY"));

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface PasswordResetRequest {
  email: string;
  language: string;
}

const handler = async (req: Request): Promise<Response> => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { email, language }: PasswordResetRequest = await req.json();

    console.log("Sending password reset email to:", email, "in language:", language);

    // Generate password reset link using Supabase admin
    const supabaseUrl = Deno.env.get("SUPABASE_URL");
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
    
    if (!supabaseUrl || !supabaseServiceKey) {
      throw new Error("Missing Supabase configuration");
    }

    // Generate reset link - this will be used in both languages
    const resetResponse = await fetch(`${supabaseUrl}/auth/v1/recover`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${supabaseServiceKey}`,
        'apikey': supabaseServiceKey
      },
      body: JSON.stringify({
        email: email,
        gotrue_meta_security: {}
      })
    });

    const resetData = await resetResponse.json();
    console.log("Supabase reset response:", resetData);

    // Create reset link for email
    const redirectUrl = `${supabaseUrl.replace('supabase.co', 'supabase.co')}/auth/v1/verify?token=${resetData.action_link?.split('token=')[1]?.split('&')[0] || 'token'}&type=recovery&redirect_to=${encodeURIComponent(`${Deno.env.get("SUPABASE_URL")?.replace('.supabase.co', '.lovableproject.com') || 'http://localhost:3000'}/auth?mode=password-reset`)}`;

    // Email templates
    const templates = {
      en: {
        subject: "Reset your password - TalentSpark",
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
            <div style="text-align: center; margin-bottom: 30px;">
              <h1 style="color: #333; margin: 0;">TalentSpark</h1>
            </div>
            
            <div style="background-color: #f9f9f9; padding: 30px; border-radius: 8px;">
              <h2 style="color: #333; margin-top: 0;">Reset Your Password</h2>
              
              <p style="color: #666; line-height: 1.6; margin-bottom: 20px;">
                We received a request to reset your password for your TalentSpark account.
              </p>
              
              <div style="text-align: center; margin: 30px 0;">
                <a href="${redirectUrl}" 
                   style="background-color: #007bff; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; display: inline-block; font-weight: bold;">
                  Reset Password
                </a>
              </div>
              
              <p style="color: #666; font-size: 14px; margin-top: 20px;">
                Or copy and paste this link in your browser:<br>
                <span style="background-color: #f0f0f0; padding: 8px; border-radius: 4px; word-break: break-all; display: inline-block; margin-top: 5px;">${redirectUrl}</span>
              </p>
              
              <p style="color: #666; font-size: 14px; margin-top: 30px; padding-top: 20px; border-top: 1px solid #ddd;">
                If you didn't request this password reset, you can safely ignore this email. Your password will remain unchanged.
              </p>
            </div>
            
            <div style="text-align: center; margin-top: 30px; color: #999; font-size: 12px;">
              <p>This email was sent by TalentSpark</p>
            </div>
          </div>
        `
      },
      ru: {
        subject: "Сброс пароля - TalentSpark",
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
            <div style="text-align: center; margin-bottom: 30px;">
              <h1 style="color: #333; margin: 0;">TalentSpark</h1>
            </div>
            
            <div style="background-color: #f9f9f9; padding: 30px; border-radius: 8px;">
              <h2 style="color: #333; margin-top: 0;">Сброс пароля</h2>
              
              <p style="color: #666; line-height: 1.6; margin-bottom: 20px;">
                Мы получили запрос на сброс пароля для вашей учетной записи TalentSpark.
              </p>
              
              <div style="text-align: center; margin: 30px 0;">
                <a href="${redirectUrl}" 
                   style="background-color: #007bff; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; display: inline-block; font-weight: bold;">
                  Сбросить пароль
                </a>
              </div>
              
              <p style="color: #666; font-size: 14px; margin-top: 20px;">
                Или скопируйте и вставьте эту ссылку в браузер:<br>
                <span style="background-color: #f0f0f0; padding: 8px; border-radius: 4px; word-break: break-all; display: inline-block; margin-top: 5px;">${redirectUrl}</span>
              </p>
              
              <p style="color: #666; font-size: 14px; margin-top: 30px; padding-top: 20px; border-top: 1px solid #ddd;">
                Если вы не запрашивали сброс пароля, вы можете безопасно проигнорировать это письмо. Ваш пароль останется неизменным.
              </p>
            </div>
            
            <div style="text-align: center; margin-top: 30px; color: #999; font-size: 12px;">
              <p>Это письмо было отправлено TalentSpark</p>
            </div>
          </div>
        `
      }
    };

    const template = templates[language as keyof typeof templates] || templates.en;

    const emailResponse = await resend.emails.send({
      from: "TalentSpark <onboarding@resend.dev>",
      to: [email],
      subject: template.subject,
      html: template.html,
    });

    console.log("Email sent successfully:", emailResponse);

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: "Password reset email sent successfully",
        emailId: emailResponse.data?.id 
      }), 
      {
        status: 200,
        headers: {
          "Content-Type": "application/json",
          ...corsHeaders,
        },
      }
    );
  } catch (error: any) {
    console.error("Error in send-password-reset-email function:", error);
    return new Response(
      JSON.stringify({ 
        success: false,
        error: error.message,
        details: "Failed to send password reset email"
      }),
      {
        status: 500,
        headers: { 
          "Content-Type": "application/json", 
          ...corsHeaders 
        },
      }
    );
  }
};

serve(handler);