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
      bulk_extraction_jobs: {
        Row: {
          completed_at: string | null
          created_at: string
          error_log: Json | null
          extracted_data: Json | null
          failed_accounts: number
          id: string
          job_name: string
          processed_accounts: number
          status: string
          successful_accounts: number
          total_accounts: number
          total_vehicles: number
          updated_at: string
        }
        Insert: {
          completed_at?: string | null
          created_at?: string
          error_log?: Json | null
          extracted_data?: Json | null
          failed_accounts?: number
          id?: string
          job_name: string
          processed_accounts?: number
          status?: string
          successful_accounts?: number
          total_accounts?: number
          total_vehicles?: number
          updated_at?: string
        }
        Update: {
          completed_at?: string | null
          created_at?: string
          error_log?: Json | null
          extracted_data?: Json | null
          failed_accounts?: number
          id?: string
          job_name?: string
          processed_accounts?: number
          status?: string
          successful_accounts?: number
          total_accounts?: number
          total_vehicles?: number
          updated_at?: string
        }
        Relationships: []
      }
      envio_users: {
        Row: {
          created_at: string
          email: string
          gp51_username: string | null
          id: string
          import_source: string | null
          is_gp51_imported: boolean | null
          name: string
          needs_password_set: boolean | null
          updated_at: string
        }
        Insert: {
          created_at?: string
          email: string
          gp51_username?: string | null
          id?: string
          import_source?: string | null
          is_gp51_imported?: boolean | null
          name: string
          needs_password_set?: boolean | null
          updated_at?: string
        }
        Update: {
          created_at?: string
          email?: string
          gp51_username?: string | null
          id?: string
          import_source?: string | null
          is_gp51_imported?: boolean | null
          name?: string
          needs_password_set?: boolean | null
          updated_at?: string
        }
        Relationships: []
      }
      gp51_data_conflicts: {
        Row: {
          conflict_details: Json | null
          conflict_type: string
          created_at: string
          existing_record_id: string | null
          id: string
          preview_id: string | null
          resolution_status: string
        }
        Insert: {
          conflict_details?: Json | null
          conflict_type: string
          created_at?: string
          existing_record_id?: string | null
          id?: string
          preview_id?: string | null
          resolution_status?: string
        }
        Update: {
          conflict_details?: Json | null
          conflict_type?: string
          created_at?: string
          existing_record_id?: string | null
          id?: string
          preview_id?: string | null
          resolution_status?: string
        }
        Relationships: [
          {
            foreignKeyName: "gp51_data_conflicts_preview_id_fkey"
            columns: ["preview_id"]
            isOneToOne: false
            referencedRelation: "gp51_import_previews"
            referencedColumns: ["id"]
          },
        ]
      }
      gp51_import_previews: {
        Row: {
          conflict_flags: Json | null
          created_at: string
          gp51_username: string
          id: string
          import_eligibility: string
          job_id: string | null
          raw_user_data: Json | null
          raw_vehicle_data: Json | null
          review_status: string
          updated_at: string
        }
        Insert: {
          conflict_flags?: Json | null
          created_at?: string
          gp51_username: string
          id?: string
          import_eligibility?: string
          job_id?: string | null
          raw_user_data?: Json | null
          raw_vehicle_data?: Json | null
          review_status?: string
          updated_at?: string
        }
        Update: {
          conflict_flags?: Json | null
          created_at?: string
          gp51_username?: string
          id?: string
          import_eligibility?: string
          job_id?: string | null
          raw_user_data?: Json | null
          raw_vehicle_data?: Json | null
          review_status?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "gp51_import_previews_job_id_fkey"
            columns: ["job_id"]
            isOneToOne: false
            referencedRelation: "user_import_jobs"
            referencedColumns: ["id"]
          },
        ]
      }
      gp51_sessions: {
        Row: {
          created_at: string
          envio_user_id: string | null
          gp51_token: string | null
          id: string
          token_expires_at: string | null
          updated_at: string
          username: string
        }
        Insert: {
          created_at?: string
          envio_user_id?: string | null
          gp51_token?: string | null
          id?: string
          token_expires_at?: string | null
          updated_at?: string
          username: string
        }
        Update: {
          created_at?: string
          envio_user_id?: string | null
          gp51_token?: string | null
          id?: string
          token_expires_at?: string | null
          updated_at?: string
          username?: string
        }
        Relationships: [
          {
            foreignKeyName: "gp51_sessions_envio_user_id_fkey"
            columns: ["envio_user_id"]
            isOneToOne: false
            referencedRelation: "envio_users"
            referencedColumns: ["id"]
          },
        ]
      }
      user_import_jobs: {
        Row: {
          admin_gp51_username: string | null
          completed_at: string | null
          conflicts_count: number | null
          created_at: string
          error_log: Json | null
          failed_imports: number
          id: string
          import_results: Json | null
          import_type: string
          imported_usernames: Json | null
          job_name: string
          preview_mode: boolean | null
          processed_usernames: number
          review_status: string | null
          reviewed_at: string | null
          reviewed_by: string | null
          status: string
          successful_imports: number
          total_usernames: number
          total_vehicles_imported: number
          updated_at: string
        }
        Insert: {
          admin_gp51_username?: string | null
          completed_at?: string | null
          conflicts_count?: number | null
          created_at?: string
          error_log?: Json | null
          failed_imports?: number
          id?: string
          import_results?: Json | null
          import_type?: string
          imported_usernames?: Json | null
          job_name: string
          preview_mode?: boolean | null
          processed_usernames?: number
          review_status?: string | null
          reviewed_at?: string | null
          reviewed_by?: string | null
          status?: string
          successful_imports?: number
          total_usernames?: number
          total_vehicles_imported?: number
          updated_at?: string
        }
        Update: {
          admin_gp51_username?: string | null
          completed_at?: string | null
          conflicts_count?: number | null
          created_at?: string
          error_log?: Json | null
          failed_imports?: number
          id?: string
          import_results?: Json | null
          import_type?: string
          imported_usernames?: Json | null
          job_name?: string
          preview_mode?: boolean | null
          processed_usernames?: number
          review_status?: string | null
          reviewed_at?: string | null
          reviewed_by?: string | null
          status?: string
          successful_imports?: number
          total_usernames?: number
          total_vehicles_imported?: number
          updated_at?: string
        }
        Relationships: []
      }
      user_roles: {
        Row: {
          created_at: string
          id: string
          role: Database["public"]["Enums"]["app_role"]
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_roles_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "envio_users"
            referencedColumns: ["id"]
          },
        ]
      }
      vehicles: {
        Row: {
          created_at: string
          device_id: string
          device_name: string
          envio_user_id: string | null
          extraction_job_id: string | null
          gp51_metadata: Json | null
          gp51_username: string | null
          id: string
          import_job_type: string | null
          is_active: boolean | null
          last_position: Json | null
          notes: string | null
          session_id: string | null
          sim_number: string | null
          status: string | null
          updated_at: string
        }
        Insert: {
          created_at?: string
          device_id: string
          device_name: string
          envio_user_id?: string | null
          extraction_job_id?: string | null
          gp51_metadata?: Json | null
          gp51_username?: string | null
          id?: string
          import_job_type?: string | null
          is_active?: boolean | null
          last_position?: Json | null
          notes?: string | null
          session_id?: string | null
          sim_number?: string | null
          status?: string | null
          updated_at?: string
        }
        Update: {
          created_at?: string
          device_id?: string
          device_name?: string
          envio_user_id?: string | null
          extraction_job_id?: string | null
          gp51_metadata?: Json | null
          gp51_username?: string | null
          id?: string
          import_job_type?: string | null
          is_active?: boolean | null
          last_position?: Json | null
          notes?: string | null
          session_id?: string | null
          sim_number?: string | null
          status?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "vehicles_envio_user_id_fkey"
            columns: ["envio_user_id"]
            isOneToOne: false
            referencedRelation: "envio_users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "vehicles_extraction_job_id_fkey"
            columns: ["extraction_job_id"]
            isOneToOne: false
            referencedRelation: "bulk_extraction_jobs"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "vehicles_session_id_fkey"
            columns: ["session_id"]
            isOneToOne: false
            referencedRelation: "gp51_sessions"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      generate_temp_password_hash: {
        Args: Record<PropertyKey, never>
        Returns: string
      }
      get_user_role: {
        Args: { _user_id: string }
        Returns: Database["public"]["Enums"]["app_role"]
      }
      has_role: {
        Args: {
          _user_id: string
          _role: Database["public"]["Enums"]["app_role"]
        }
        Returns: boolean
      }
    }
    Enums: {
      app_role: "admin" | "user"
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
    Enums: {
      app_role: ["admin", "user"],
    },
  },
} as const
