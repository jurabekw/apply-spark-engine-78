export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "13.0.4"
  }
  public: {
    Tables: {
      analytics_metrics: {
        Row: {
          created_at: string
          date_period: string
          id: string
          metric_data: Json
          metric_type: string
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          date_period: string
          id?: string
          metric_data: Json
          metric_type: string
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          date_period?: string
          id?: string
          metric_data?: Json
          metric_type?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      candidate_batches: {
        Row: {
          created_at: string
          id: string
          job_requirements: string
          job_title: string
          total_candidates: number
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          job_requirements: string
          job_title: string
          total_candidates?: number
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          job_requirements?: string
          job_title?: string
          total_candidates?: number
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      candidates: {
        Row: {
          ai_analysis: Json | null
          ai_score: number | null
          batch_id: string | null
          cover_letter: string | null
          created_at: string
          education: string | null
          email: string | null
          experience_years: number | null
          id: string
          name: string
          original_filename: string | null
          phone: string | null
          position: string | null
          resume_file_path: string | null
          skills: string[] | null
          source: string
          status: string
          submitted_at: string | null
          updated_at: string
          user_id: string
          work_history: string | null
        }
        Insert: {
          ai_analysis?: Json | null
          ai_score?: number | null
          batch_id?: string | null
          cover_letter?: string | null
          created_at?: string
          education?: string | null
          email?: string | null
          experience_years?: number | null
          id?: string
          name: string
          original_filename?: string | null
          phone?: string | null
          position?: string | null
          resume_file_path?: string | null
          skills?: string[] | null
          source?: string
          status?: string
          submitted_at?: string | null
          updated_at?: string
          user_id: string
          work_history?: string | null
        }
        Update: {
          ai_analysis?: Json | null
          ai_score?: number | null
          batch_id?: string | null
          cover_letter?: string | null
          created_at?: string
          education?: string | null
          email?: string | null
          experience_years?: number | null
          id?: string
          name?: string
          original_filename?: string | null
          phone?: string | null
          position?: string | null
          resume_file_path?: string | null
          skills?: string[] | null
          source?: string
          status?: string
          submitted_at?: string | null
          updated_at?: string
          user_id?: string
          work_history?: string | null
        }
        Relationships: []
      }
      credit_transactions: {
        Row: {
          amount: number
          balance_after: number | null
          created_at: string | null
          description: string | null
          id: string
          idempotency_key: string | null
          module_name: string | null
          type: string | null
          user_id: string | null
        }
        Insert: {
          amount: number
          balance_after?: number | null
          created_at?: string | null
          description?: string | null
          id?: string
          idempotency_key?: string | null
          module_name?: string | null
          type?: string | null
          user_id?: string | null
        }
        Update: {
          amount?: number
          balance_after?: number | null
          created_at?: string | null
          description?: string | null
          id?: string
          idempotency_key?: string | null
          module_name?: string | null
          type?: string | null
          user_id?: string | null
        }
        Relationships: []
      }
      hh_searches: {
        Row: {
          candidate_count: number
          city: string | null
          created_at: string
          experience_level: string
          id: string
          job_title: string
          required_skills: string
          response: Json
          user_id: string
        }
        Insert: {
          candidate_count?: number
          city?: string | null
          created_at?: string
          experience_level: string
          id?: string
          job_title: string
          required_skills: string
          response: Json
          user_id: string
        }
        Update: {
          candidate_count?: number
          city?: string | null
          created_at?: string
          experience_level?: string
          id?: string
          job_title?: string
          required_skills?: string
          response?: Json
          user_id?: string
        }
        Relationships: []
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
          status: string
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
          status?: string
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
          status?: string
          title?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      linkedin_searches: {
        Row: {
          candidate_count: number
          created_at: string
          experience_level: string
          id: string
          job_title: string
          required_skills: string
          response: Json
          user_id: string
        }
        Insert: {
          candidate_count?: number
          created_at?: string
          experience_level: string
          id?: string
          job_title: string
          required_skills: string
          response: Json
          user_id: string
        }
        Update: {
          candidate_count?: number
          created_at?: string
          experience_level?: string
          id?: string
          job_title?: string
          required_skills?: string
          response?: Json
          user_id?: string
        }
        Relationships: []
      }
      modules: {
        Row: {
          created_at: string | null
          credit_cost: number | null
          id: string
          is_active: boolean | null
          name: string
        }
        Insert: {
          created_at?: string | null
          credit_cost?: number | null
          id?: string
          is_active?: boolean | null
          name: string
        }
        Update: {
          created_at?: string | null
          credit_cost?: number | null
          id?: string
          is_active?: boolean | null
          name?: string
        }
        Relationships: []
      }
      notifications: {
        Row: {
          created_at: string
          id: string
          message: string
          read: boolean
          title: string
          type: string
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          message: string
          read?: boolean
          title: string
          type: string
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          message?: string
          read?: boolean
          title?: string
          type?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      rate_limits: {
        Row: {
          action_type: string
          count: number
          created_at: string
          id: string
          user_id: string
          window_start: string
        }
        Insert: {
          action_type: string
          count?: number
          created_at?: string
          id?: string
          user_id: string
          window_start?: string
        }
        Update: {
          action_type?: string
          count?: number
          created_at?: string
          id?: string
          user_id?: string
          window_start?: string
        }
        Relationships: []
      }
      trial_usage_log: {
        Row: {
          action_type: string
          created_at: string
          id: string
          idempotency_key: string | null
          metadata: Json | null
          module_type: string
          trial_id: string
          user_id: string
        }
        Insert: {
          action_type?: string
          created_at?: string
          id?: string
          idempotency_key?: string | null
          metadata?: Json | null
          module_type: string
          trial_id: string
          user_id: string
        }
        Update: {
          action_type?: string
          created_at?: string
          id?: string
          idempotency_key?: string | null
          metadata?: Json | null
          module_type?: string
          trial_id?: string
          user_id?: string
        }
        Relationships: []
      }
      user_credits: {
        Row: {
          balance: number | null
          created_at: string | null
          id: string
          updated_at: string | null
          user_id: string
        }
        Insert: {
          balance?: number | null
          created_at?: string | null
          id?: string
          updated_at?: string | null
          user_id: string
        }
        Update: {
          balance?: number | null
          created_at?: string | null
          id?: string
          updated_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
      user_preferences: {
        Row: {
          created_at: string
          email_notifications: boolean
          id: string
          language: string
          search_preferences: Json
          theme: string
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          email_notifications?: boolean
          id?: string
          language?: string
          search_preferences?: Json
          theme?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          email_notifications?: boolean
          id?: string
          language?: string
          search_preferences?: Json
          theme?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      user_profiles: {
        Row: {
          avatar_url: string | null
          bio: string | null
          company: string | null
          created_at: string
          id: string
          role: string
          updated_at: string
        }
        Insert: {
          avatar_url?: string | null
          bio?: string | null
          company?: string | null
          created_at?: string
          id: string
          role?: string
          updated_at?: string
        }
        Update: {
          avatar_url?: string | null
          bio?: string | null
          company?: string | null
          created_at?: string
          id?: string
          role?: string
          updated_at?: string
        }
        Relationships: []
      }
      user_trials: {
        Row: {
          analyses_limit: number
          analyses_used: number
          created_at: string
          id: string
          is_active: boolean
          trial_ends_at: string
          trial_started_at: string
          updated_at: string
          user_id: string
        }
        Insert: {
          analyses_limit?: number
          analyses_used?: number
          created_at?: string
          id?: string
          is_active?: boolean
          trial_ends_at?: string
          trial_started_at?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          analyses_limit?: number
          analyses_used?: number
          created_at?: string
          id?: string
          is_active?: boolean
          trial_ends_at?: string
          trial_started_at?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
    }
    Views: {
      recruitment_performance: {
        Row: {
          avg_ai_score: number | null
          batches_processed: number | null
          hired: number | null
          month: string | null
          shortlisted: number | null
          source: string | null
          total_candidates: number | null
          user_id: string | null
        }
        Relationships: []
      }
      search_patterns: {
        Row: {
          avg_candidates_found: number | null
          experience_level: string | null
          job_title: string | null
          search_count: number | null
          user_id: string | null
          week: string | null
        }
        Relationships: []
      }
      skills_analysis: {
        Row: {
          avg_score: number | null
          frequency: number | null
          skill: string | null
          source: string | null
          user_id: string | null
        }
        Relationships: []
      }
    }
    Functions: {
      add_credits: {
        Args: { p_amount: number; p_description?: string; p_user_id: string }
        Returns: Json
      }
      deduct_credits: {
        Args: {
          p_amount: number
          p_description?: string
          p_module_name: string
          p_user_id: string
        }
        Returns: Json
      }
      get_user_credits: {
        Args: { p_user_id: string }
        Returns: Json
      }
      increment_trial_usage: {
        Args:
          | {
              p_idempotency_key?: string
              p_metadata?: Json
              p_module_type: string
              p_user_id: string
            }
          | { p_metadata?: Json; p_module_type: string; p_user_id: string }
        Returns: {
          analyses_remaining: number
          analyses_used: number
          message: string
          success: boolean
        }[]
      }
      refresh_analytics_views: {
        Args: Record<PropertyKey, never>
        Returns: undefined
      }
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
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
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
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
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
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
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {},
  },
} as const
