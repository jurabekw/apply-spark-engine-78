export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  public: {
    Tables: {
      application_forms: {
        Row: {
          created_at: string
          description: string | null
          form_fields: Json
          id: string
          is_public: boolean | null
          job_posting_id: string | null
          public_url_slug: string | null
          status: string | null
          title: string
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          form_fields: Json
          id?: string
          is_public?: boolean | null
          job_posting_id?: string | null
          public_url_slug?: string | null
          status?: string | null
          title: string
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          description?: string | null
          form_fields?: Json
          id?: string
          is_public?: boolean | null
          job_posting_id?: string | null
          public_url_slug?: string | null
          status?: string | null
          title?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "application_forms_job_posting_id_fkey"
            columns: ["job_posting_id"]
            isOneToOne: false
            referencedRelation: "job_postings"
            referencedColumns: ["id"]
          },
        ]
      }
      candidates: {
        Row: {
          ai_analysis: Json | null
          ai_score: number | null
          cover_letter: string | null
          created_at: string
          education: string | null
          email: string
          experience_years: number | null
          id: string
          job_posting_id: string | null
          name: string
          original_filename: string | null
          phone: string | null
          position: string | null
          resume_file_path: string | null
          skills: string[] | null
          source: string | null
          status: string | null
          submitted_at: string | null
          updated_at: string
          user_id: string
          work_history: string | null
        }
        Insert: {
          ai_analysis?: Json | null
          ai_score?: number | null
          cover_letter?: string | null
          created_at?: string
          education?: string | null
          email: string
          experience_years?: number | null
          id?: string
          job_posting_id?: string | null
          name: string
          original_filename?: string | null
          phone?: string | null
          position?: string | null
          resume_file_path?: string | null
          skills?: string[] | null
          source?: string | null
          status?: string | null
          submitted_at?: string | null
          updated_at?: string
          user_id: string
          work_history?: string | null
        }
        Update: {
          ai_analysis?: Json | null
          ai_score?: number | null
          cover_letter?: string | null
          created_at?: string
          education?: string | null
          email?: string
          experience_years?: number | null
          id?: string
          job_posting_id?: string | null
          name?: string
          original_filename?: string | null
          phone?: string | null
          position?: string | null
          resume_file_path?: string | null
          skills?: string[] | null
          source?: string | null
          status?: string | null
          submitted_at?: string | null
          updated_at?: string
          user_id?: string
          work_history?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "candidates_job_posting_id_fkey"
            columns: ["job_posting_id"]
            isOneToOne: false
            referencedRelation: "job_postings"
            referencedColumns: ["id"]
          },
        ]
      }
      form_submissions: {
        Row: {
          candidate_id: string | null
          form_id: string
          id: string
          ip_address: unknown | null
          submission_data: Json
          submitted_at: string
          user_agent: string | null
        }
        Insert: {
          candidate_id?: string | null
          form_id: string
          id?: string
          ip_address?: unknown | null
          submission_data: Json
          submitted_at?: string
          user_agent?: string | null
        }
        Update: {
          candidate_id?: string | null
          form_id?: string
          id?: string
          ip_address?: unknown | null
          submission_data?: Json
          submitted_at?: string
          user_agent?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "form_submissions_candidate_id_fkey"
            columns: ["candidate_id"]
            isOneToOne: false
            referencedRelation: "candidates"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "form_submissions_form_id_fkey"
            columns: ["form_id"]
            isOneToOne: false
            referencedRelation: "application_forms"
            referencedColumns: ["id"]
          },
        ]
      }
      job_postings: {
        Row: {
          created_at: string
          department: string | null
          description: string | null
          experience_level: string | null
          id: string
          location: string | null
          requirements: string
          salary_range: string | null
          skills_required: string[] | null
          status: string | null
          title: string
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          department?: string | null
          description?: string | null
          experience_level?: string | null
          id?: string
          location?: string | null
          requirements: string
          salary_range?: string | null
          skills_required?: string[] | null
          status?: string | null
          title: string
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          department?: string | null
          description?: string | null
          experience_level?: string | null
          id?: string
          location?: string | null
          requirements?: string
          salary_range?: string | null
          skills_required?: string[] | null
          status?: string | null
          title?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      profiles: {
        Row: {
          company: string | null
          created_at: string | null
          email: string | null
          full_name: string | null
          id: string
          role: string | null
          updated_at: string | null
        }
        Insert: {
          company?: string | null
          created_at?: string | null
          email?: string | null
          full_name?: string | null
          id: string
          role?: string | null
          updated_at?: string | null
        }
        Update: {
          company?: string | null
          created_at?: string | null
          email?: string | null
          full_name?: string | null
          id?: string
          role?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DefaultSchema = Database[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof Database },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof (Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        Database[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends { schema: keyof Database }
  ? (Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      Database[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof Database },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends { schema: keyof Database }
  ? Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof Database },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends { schema: keyof Database }
  ? Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof Database },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends { schema: keyof Database }
  ? Database[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof Database },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends { schema: keyof Database }
  ? Database[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {},
  },
} as const
