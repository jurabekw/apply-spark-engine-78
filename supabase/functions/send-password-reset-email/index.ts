import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.3';
import { Resend } from "npm:resend@2.0.0";

const resend = new Resend(Deno.env.get("RESEND_API_KEY"));

// Initialize Supabase Admin client
const supabaseAdmin = createClient(
  Deno.env.get('SUPABASE_URL') ?? '',
  Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
);

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

    console.log("Checking password reset for email:", email, "in language:", language);

    // First, check if the email exists in the database
    const { data: userCheck, error: userError } = await supabaseAdmin.auth.admin.listUsers({
      page: 1,
      perPage: 1
    });

    if (userError) {
      console.error("Error checking user existence:", userError);
      throw new Error(`Failed to verify email: ${userError.message}`);
    }

    // Get all users and check if email exists
    const { data: allUsers, error: getAllError } = await supabaseAdmin.auth.admin.listUsers();
    
    if (getAllError) {
      console.error("Error fetching users:", getAllError);
      throw new Error(`Failed to verify email: ${getAllError.message}`);
    }

    const emailExists = allUsers.users.some(user => 
      user.email?.toLowerCase() === email.toLowerCase()
    );

    if (!emailExists) {
      console.log("Email not registered:", email);
      
      // Return localized error for unregistered email
      const errorMessages = {
        en: {
          error: "email_not_registered",
          message: "This email address is not registered. Please check your email or sign up for a new account."
        },
        ru: {
          error: "email_not_registered", 
          message: "Этот адрес электронной почты не зарегистрирован. Пожалуйста, проверьте ваш email или зарегистрируйтесь."
        }
      };

      const errorResponse = errorMessages[language as keyof typeof errorMessages] || errorMessages.en;
      
      return new Response(
        JSON.stringify({
          success: false,
          ...errorResponse
        }),
        {
          status: 400,
          headers: {
            "Content-Type": "application/json",
            ...corsHeaders,
          },
        }
      );
    }

    console.log("Email registered, generating reset link for:", email);

    // Generate password reset link using Supabase Admin client
    // This generates the link WITHOUT sending an email
    const { data, error } = await supabaseAdmin.auth.admin.generateLink({
      type: 'recovery',
      email: email,
      options: {
        redirectTo: 'https://talentspark.uz/auth?mode=password-reset'
      }
    });

    if (error) {
      console.error("Error generating recovery link:", error);
      throw new Error(`Failed to generate recovery link: ${error.message}`);
    }

    if (!data?.properties?.action_link) {
      throw new Error("No recovery link generated");
    }

    const resetUrl = data.properties.action_link;
    console.log("Generated reset link:", resetUrl);

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
                <a href="${resetUrl}" 
                   style="background-color: #007bff; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; display: inline-block; font-weight: bold;">
                  Reset Password
                </a>
              </div>
              
              <p style="color: #666; font-size: 14px; margin-top: 20px;">
                Or copy and paste this link in your browser:<br>
                <span style="background-color: #f0f0f0; padding: 8px; border-radius: 4px; word-break: break-all; display: inline-block; margin-top: 5px;">${resetUrl}</span>
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
                <a href="${resetUrl}" 
                   style="background-color: #007bff; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; display: inline-block; font-weight: bold;">
                  Сбросить пароль
                </a>
              </div>
              
              <p style="color: #666; font-size: 14px; margin-top: 20px;">
                Или скопируйте и вставьте эту ссылку в браузер:<br>
                <span style="background-color: #f0f0f0; padding: 8px; border-radius: 4px; word-break: break-all; display: inline-block; margin-top: 5px;">${resetUrl}</span>
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

    const { data: sendData, error: sendError } = await resend.emails.send({
      from: "TalentSpark <onboarding@resend.dev>",
      to: [email],
      subject: template.subject,
      html: template.html,
    });

    if (sendError) {
      console.error("Resend error sending reset email:", sendError);
      return new Response(
        JSON.stringify({
          success: false,
          error: sendError.error ?? "Email delivery failed",
          details: sendError,
        }),
        { status: 502, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    console.log("Email sent successfully:", sendData);

    return new Response(
      JSON.stringify({
        success: true,
        message: "Password reset email sent successfully",
        emailId: sendData?.id,
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