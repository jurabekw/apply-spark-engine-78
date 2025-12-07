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
      candidates: {
        Row: {
          id: string
          user_id: string
          name: string | null
          email: string | null
          phone: string | null
          position: string | null
          experience_years: number | null
          skills: string[] | null
          education: string | null
          work_history: string | null
          resume_file_path: string | null
          original_filename: string | null
          cover_letter: string | null
          ai_score: number | null
          ai_analysis: Json | null
          status: string
          source: string
          batch_id: string | null
          submitted_at: string | null
          created_at: string
          updated_at: string | null
        }
        Insert: {
          id?: string
          user_id: string
          name?: string | null
          email?: string | null
          phone?: string | null
          position?: string | null
          experience_years?: number | null
          skills?: string[] | null
          education?: string | null
          work_history?: string | null
          resume_file_path?: string | null
          original_filename?: string | null
          cover_letter?: string | null
          ai_score?: number | null
          ai_analysis?: Json | null
          status?: string
          source?: string
          batch_id?: string | null
          submitted_at?: string | null
          created_at?: string
          updated_at?: string | null
        }
        Update: {
          id?: string
          user_id?: string
          name?: string | null
          email?: string | null
          phone?: string | null
          position?: string | null
          experience_years?: number | null
          skills?: string[] | null
          education?: string | null
          work_history?: string | null
          resume_file_path?: string | null
          original_filename?: string | null
          cover_letter?: string | null
          ai_score?: number | null
          ai_analysis?: Json | null
          status?: string
          source?: string
          batch_id?: string | null
          submitted_at?: string | null
          created_at?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "candidates_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          }
        ]
      }
      candidate_batches: {
        Row: {
          id: string
          user_id: string
          job_title: string
          job_requirements: string
          total_candidates: number
          created_at: string
          updated_at: string | null
        }
        Insert: {
          id?: string
          user_id: string
          job_title: string
          job_requirements: string
          total_candidates: number
          created_at?: string
          updated_at?: string | null
        }
        Update: {
          id?: string
          user_id?: string
          job_title?: string
          job_requirements?: string
          total_candidates?: number
          created_at?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "candidate_batches_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          }
        ]
      }
      hh_searches: {
        Row: {
          id: string
          user_id: string
          job_title: string
          required_skills: string
          experience_level: string
          city: string | null
          candidate_count: number
          response: Json | null
          created_at: string
        }
        Insert: {
          id?: string
          user_id: string
          job_title: string
          required_skills: string
          experience_level: string
          city?: string | null
          candidate_count: number
          response?: Json | null
          created_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          job_title?: string
          required_skills?: string
          experience_level?: string
          city?: string | null
          candidate_count?: number
          response?: Json | null
          created_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "hh_searches_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          }
        ]
      }
      linkedin_searches: {
        Row: {
          id: string
          user_id: string
          job_title: string
          required_skills: string
          experience_level: string
          candidate_count: number
          response: Json | null
          created_at: string
        }
        Insert: {
          id?: string
          user_id: string
          job_title: string
          required_skills: string
          experience_level: string
          candidate_count: number
          response?: Json | null
          created_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          job_title?: string
          required_skills?: string
          experience_level?: string
          candidate_count?: number
          response?: Json | null
          created_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "linkedin_searches_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          }
        ]
      }
      job_postings: {
        Row: {
          id: string
          user_id: string
          title: string
          description: string | null
          requirements: string
          skills_required: string[] | null
          experience_level: string | null
          department: string | null
          location: string | null
          salary_range: string | null
          status: string
          created_at: string
          updated_at: string | null
        }
        Insert: {
          id?: string
          user_id: string
          title: string
          description?: string | null
          requirements: string
          skills_required?: string[] | null
          experience_level?: string | null
          department?: string | null
          location?: string | null
          salary_range?: string | null
          status?: string
          created_at?: string
          updated_at?: string | null
        }
        Update: {
          id?: string
          user_id?: string
          title?: string
          description?: string | null
          requirements?: string
          skills_required?: string[] | null
          experience_level?: string | null
          department?: string | null
          location?: string | null
          salary_range?: string | null
          status?: string
          created_at?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "job_postings_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          }
        ]
      }
      notifications: {
        Row: {
          id: string
          user_id: string
          type: string
          title: string
          message: string
          read: boolean
          created_at: string
          updated_at: string | null
        }
        Insert: {
          id?: string
          user_id: string
          type: string
          title: string
          message: string
          read?: boolean
          created_at?: string
          updated_at?: string | null
        }
        Update: {
          id?: string
          user_id?: string
          type?: string
          title?: string
          message?: string
          read?: boolean
          created_at?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "notifications_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          }
        ]
      }
      user_preferences: {
        Row: {
          id: string
          user_id: string
          theme: string
          language: string
          email_notifications: boolean
          search_preferences: Json
          created_at: string
          updated_at: string | null
        }
        Insert: {
          id?: string
          user_id: string
          theme?: string
          language?: string
          email_notifications?: boolean
          search_preferences?: Json
          created_at?: string
          updated_at?: string | null
        }
        Update: {
          id?: string
          user_id?: string
          theme?: string
          language?: string
          email_notifications?: boolean
          search_preferences?: Json
          created_at?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "user_preferences_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: true
            referencedRelation: "users"
            referencedColumns: ["id"]
          }
        ]
      }
      user_profiles: {
        Row: {
          id: string
          avatar_url: string | null
          company: string | null
          role: string
          bio: string | null
          created_at: string
          updated_at: string | null
        }
        Insert: {
          id: string
          avatar_url?: string | null
          company?: string | null
          role?: string
          bio?: string | null
          created_at?: string
          updated_at?: string | null
        }
        Update: {
          id?: string
          avatar_url?: string | null
          company?: string | null
          role?: string
          bio?: string | null
          created_at?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "user_profiles_id_fkey"
            columns: ["id"]
            isOneToOne: true
            referencedRelation: "users"
            referencedColumns: ["id"]
          }
        ]
      }
      user_trials: {
        Row: {
          id: string
          user_id: string
          trial_started_at: string
          trial_ends_at: string
          is_active: boolean
          analyses_used: number
          analyses_limit: number
          created_at: string
          updated_at: string | null
        }
        Insert: {
          id?: string
          user_id: string
          trial_started_at?: string
          trial_ends_at?: string
          is_active?: boolean
          analyses_used?: number
          analyses_limit?: number
          created_at?: string
          updated_at?: string | null
        }
        Update: {
          id?: string
          user_id?: string
          trial_started_at?: string
          trial_ends_at?: string
          is_active?: boolean
          analyses_used?: number
          analyses_limit?: number
          created_at?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "user_trials_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: true
            referencedRelation: "users"
            referencedColumns: ["id"]
          }
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      get_user_credits: {
        Args: {
          p_user_id: string
        }
        Returns: {
          success: boolean
          balance: number
          error: string | null
        }
      }
      add_credits: {
        Args: {
          p_user_id: string
          p_amount: number
          p_description: string
        }
        Returns: {
          success: boolean
          balance: number
          error: string | null
        }
      }
      deduct_credits: {
        Args: {
          p_user_id: string
          p_amount: number
          p_module_name: string
          p_description: string | null
        }
        Returns: {
          success: boolean
          balance: number
          error: string | null
        }
      }
      increment_trial_usage: {
        Args: {
          p_user_id: string
          p_module_type: string
          p_metadata: Json | null
          p_idempotency_key: string
        }
        Returns: {
          success: boolean
          message: string
          analyses_used: number
          analyses_remaining: number
        }
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

type PublicSchema = Database[Extract<keyof Database, "public">]

export type Tables<
  PublicTableNameOrOptions extends
    | keyof (PublicSchema["Tables"] & PublicSchema["Views"])
    | { schema: keyof Database },
  TableName extends PublicTableNameOrOptions extends { schema: keyof Database }
    ? keyof (Database[PublicTableNameOrOptions["schema"]]["Tables"] &
        Database[PublicTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = PublicTableNameOrOptions extends { schema: keyof Database }
  ? (Database[PublicTableNameOrOptions["schema"]]["Tables"] &
      Database[PublicTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : PublicTableNameOrOptions extends keyof (PublicSchema["Tables"] &
        PublicSchema["Views"])
    ? (PublicSchema["Tables"] &
        PublicSchema["Views"])[PublicTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  PublicTableNameOrOptions extends
    | keyof PublicSchema["Tables"]
    | { schema: keyof Database },
  TableName extends PublicTableNameOrOptions extends { schema: keyof Database }
    ? keyof Database[PublicTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = PublicTableNameOrOptions extends { schema: keyof Database }
  ? Database[PublicTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : PublicTableNameOrOptions extends keyof PublicSchema["Tables"]
    ? PublicSchema["Tables"][PublicTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  PublicTableNameOrOptions extends
    | keyof PublicSchema["Tables"]
    | { schema: keyof Database },
  TableName extends PublicTableNameOrOptions extends { schema: keyof Database }
    ? keyof Database[PublicTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = PublicTableNameOrOptions extends { schema: keyof Database }
  ? Database[PublicTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : PublicTableNameOrOptions extends keyof PublicSchema["Tables"]
    ? PublicSchema["Tables"][PublicTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  PublicEnumNameOrOptions extends
    | keyof PublicSchema["Enums"]
    | { schema: keyof Database },
  EnumName extends PublicEnumNameOrOptions extends { schema: keyof Database }
    ? keyof Database[PublicEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = PublicEnumNameOrOptions extends { schema: keyof Database }
  ? Database[PublicEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : PublicEnumNameOrOptions extends keyof PublicSchema["Enums"]
    ? PublicSchema["Enums"][PublicEnumNameOrOptions]
    : never