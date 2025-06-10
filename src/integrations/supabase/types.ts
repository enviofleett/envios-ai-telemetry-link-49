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
      admin_action_logs: {
        Row: {
          action_details: Json | null
          action_type: string
          admin_user_id: string
          created_at: string
          id: string
          ip_address: unknown | null
          performed_at: string
          session_fingerprint: string | null
          target_entity_id: string | null
          target_entity_type: string
          user_agent: string | null
        }
        Insert: {
          action_details?: Json | null
          action_type: string
          admin_user_id: string
          created_at?: string
          id?: string
          ip_address?: unknown | null
          performed_at?: string
          session_fingerprint?: string | null
          target_entity_id?: string | null
          target_entity_type: string
          user_agent?: string | null
        }
        Update: {
          action_details?: Json | null
          action_type?: string
          admin_user_id?: string
          created_at?: string
          id?: string
          ip_address?: unknown | null
          performed_at?: string
          session_fingerprint?: string | null
          target_entity_id?: string | null
          target_entity_type?: string
          user_agent?: string | null
        }
        Relationships: []
      }
      admin_role_requests: {
        Row: {
          created_at: string
          id: string
          request_reason: string | null
          requested_role: string
          reviewed_at: string | null
          reviewed_by: string | null
          status: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          request_reason?: string | null
          requested_role?: string
          reviewed_at?: string | null
          reviewed_by?: string | null
          status?: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          request_reason?: string | null
          requested_role?: string
          reviewed_at?: string | null
          reviewed_by?: string | null
          status?: string
          user_id?: string
        }
        Relationships: []
      }
      api_rate_limits: {
        Row: {
          block_expires_at: string | null
          created_at: string
          endpoint: string
          id: string
          identifier: string
          is_blocked: boolean
          request_count: number
          updated_at: string
          window_duration_seconds: number
          window_start: string
        }
        Insert: {
          block_expires_at?: string | null
          created_at?: string
          endpoint: string
          id?: string
          identifier: string
          is_blocked?: boolean
          request_count?: number
          updated_at?: string
          window_duration_seconds?: number
          window_start?: string
        }
        Update: {
          block_expires_at?: string | null
          created_at?: string
          endpoint?: string
          id?: string
          identifier?: string
          is_blocked?: boolean
          request_count?: number
          updated_at?: string
          window_duration_seconds?: number
          window_start?: string
        }
        Relationships: []
      }
      application_errors: {
        Row: {
          component_name: string | null
          created_at: string
          error_context: Json | null
          error_message: string
          error_stack: string | null
          error_type: string
          id: string
          ip_address: unknown | null
          resolved: boolean
          resolved_at: string | null
          route_path: string | null
          session_id: string | null
          severity: string
          user_agent: string | null
          user_id: string | null
        }
        Insert: {
          component_name?: string | null
          created_at?: string
          error_context?: Json | null
          error_message: string
          error_stack?: string | null
          error_type: string
          id?: string
          ip_address?: unknown | null
          resolved?: boolean
          resolved_at?: string | null
          route_path?: string | null
          session_id?: string | null
          severity?: string
          user_agent?: string | null
          user_id?: string | null
        }
        Update: {
          component_name?: string | null
          created_at?: string
          error_context?: Json | null
          error_message?: string
          error_stack?: string | null
          error_type?: string
          id?: string
          ip_address?: unknown | null
          resolved?: boolean
          resolved_at?: string | null
          route_path?: string | null
          session_id?: string | null
          severity?: string
          user_agent?: string | null
          user_id?: string | null
        }
        Relationships: []
      }
      appointment_conflicts: {
        Row: {
          appointment_id: string
          conflict_details: Json | null
          conflict_type: string
          created_at: string
          id: string
          resolution_status: string
          resolved_at: string | null
          resolved_by: string | null
        }
        Insert: {
          appointment_id: string
          conflict_details?: Json | null
          conflict_type: string
          created_at?: string
          id?: string
          resolution_status?: string
          resolved_at?: string | null
          resolved_by?: string | null
        }
        Update: {
          appointment_id?: string
          conflict_details?: Json | null
          conflict_type?: string
          created_at?: string
          id?: string
          resolution_status?: string
          resolved_at?: string | null
          resolved_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "appointment_conflicts_appointment_id_fkey"
            columns: ["appointment_id"]
            isOneToOne: false
            referencedRelation: "workshop_appointments"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "appointment_conflicts_resolved_by_fkey"
            columns: ["resolved_by"]
            isOneToOne: false
            referencedRelation: "envio_users"
            referencedColumns: ["id"]
          },
        ]
      }
      appointment_notifications: {
        Row: {
          appointment_id: string
          created_at: string
          error_message: string | null
          id: string
          notification_type: string
          recipient_email: string
          scheduled_for: string
          sent_at: string | null
          status: string
        }
        Insert: {
          appointment_id: string
          created_at?: string
          error_message?: string | null
          id?: string
          notification_type: string
          recipient_email: string
          scheduled_for: string
          sent_at?: string | null
          status?: string
        }
        Update: {
          appointment_id?: string
          created_at?: string
          error_message?: string | null
          id?: string
          notification_type?: string
          recipient_email?: string
          scheduled_for?: string
          sent_at?: string | null
          status?: string
        }
        Relationships: [
          {
            foreignKeyName: "appointment_notifications_appointment_id_fkey"
            columns: ["appointment_id"]
            isOneToOne: false
            referencedRelation: "workshop_appointments"
            referencedColumns: ["id"]
          },
        ]
      }
      backup_metadata: {
        Row: {
          backup_type: string
          can_rollback: boolean
          checksum_hash: string
          created_at: string
          description: string | null
          expires_at: string | null
          id: string
          is_verified: boolean
          name: string
          record_count: number
          size: number
          tables: Json
          tags: Json
        }
        Insert: {
          backup_type?: string
          can_rollback?: boolean
          checksum_hash: string
          created_at?: string
          description?: string | null
          expires_at?: string | null
          id?: string
          is_verified?: boolean
          name: string
          record_count?: number
          size?: number
          tables?: Json
          tags?: Json
        }
        Update: {
          backup_type?: string
          can_rollback?: boolean
          checksum_hash?: string
          created_at?: string
          description?: string | null
          expires_at?: string | null
          id?: string
          is_verified?: boolean
          name?: string
          record_count?: number
          size?: number
          tables?: Json
          tags?: Json
        }
        Relationships: []
      }
      billing_cycles: {
        Row: {
          billing_date: string
          created_at: string
          currency: string | null
          customer_id: string | null
          cycle_end_date: string
          cycle_start_date: string
          id: string
          status: string
          total_amount: number
          updated_at: string
        }
        Insert: {
          billing_date: string
          created_at?: string
          currency?: string | null
          customer_id?: string | null
          cycle_end_date: string
          cycle_start_date: string
          id?: string
          status?: string
          total_amount?: number
          updated_at?: string
        }
        Update: {
          billing_date?: string
          created_at?: string
          currency?: string | null
          customer_id?: string | null
          cycle_end_date?: string
          cycle_start_date?: string
          id?: string
          status?: string
          total_amount?: number
          updated_at?: string
        }
        Relationships: []
      }
      billing_notifications: {
        Row: {
          created_at: string
          customer_id: string | null
          id: string
          message: string
          metadata: Json | null
          notification_type: string
          scheduled_for: string | null
          sent_at: string | null
          status: string
          subject: string
        }
        Insert: {
          created_at?: string
          customer_id?: string | null
          id?: string
          message: string
          metadata?: Json | null
          notification_type: string
          scheduled_for?: string | null
          sent_at?: string | null
          status?: string
          subject: string
        }
        Update: {
          created_at?: string
          customer_id?: string | null
          id?: string
          message?: string
          metadata?: Json | null
          notification_type?: string
          scheduled_for?: string | null
          sent_at?: string | null
          status?: string
          subject?: string
        }
        Relationships: []
      }
      billing_settings: {
        Row: {
          auto_renewal: boolean | null
          billing_amount: number | null
          billing_cycle: string
          created_at: string
          currency: string | null
          current_usage: Json | null
          id: string
          next_billing_date: string | null
          payment_methods: Json | null
          subscription_plan: string
          updated_at: string
          usage_limits: Json | null
          user_id: string
        }
        Insert: {
          auto_renewal?: boolean | null
          billing_amount?: number | null
          billing_cycle?: string
          created_at?: string
          currency?: string | null
          current_usage?: Json | null
          id?: string
          next_billing_date?: string | null
          payment_methods?: Json | null
          subscription_plan?: string
          updated_at?: string
          usage_limits?: Json | null
          user_id: string
        }
        Update: {
          auto_renewal?: boolean | null
          billing_amount?: number | null
          billing_cycle?: string
          created_at?: string
          currency?: string | null
          current_usage?: Json | null
          id?: string
          next_billing_date?: string | null
          payment_methods?: Json | null
          subscription_plan?: string
          updated_at?: string
          usage_limits?: Json | null
          user_id?: string
        }
        Relationships: []
      }
      branding_settings: {
        Row: {
          accent_color: string | null
          background_color: string | null
          border_color: string | null
          button_style: string | null
          created_at: string
          custom_css: string | null
          favicon_url: string | null
          font_family_body: string | null
          font_family_heading: string | null
          font_size_scale: string | null
          id: string
          logo_url: string | null
          muted_color: string | null
          primary_color: string | null
          secondary_color: string | null
          text_color: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          accent_color?: string | null
          background_color?: string | null
          border_color?: string | null
          button_style?: string | null
          created_at?: string
          custom_css?: string | null
          favicon_url?: string | null
          font_family_body?: string | null
          font_family_heading?: string | null
          font_size_scale?: string | null
          id?: string
          logo_url?: string | null
          muted_color?: string | null
          primary_color?: string | null
          secondary_color?: string | null
          text_color?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          accent_color?: string | null
          background_color?: string | null
          border_color?: string | null
          button_style?: string | null
          created_at?: string
          custom_css?: string | null
          favicon_url?: string | null
          font_family_body?: string | null
          font_family_heading?: string | null
          font_size_scale?: string | null
          id?: string
          logo_url?: string | null
          muted_color?: string | null
          primary_color?: string | null
          secondary_color?: string | null
          text_color?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
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
      company_settings: {
        Row: {
          company_address: string | null
          company_name: string
          contact_email: string | null
          created_at: string
          fleet_size: number | null
          id: string
          logo_url: string | null
          operational_hours: string | null
          phone_number: string | null
          timezone: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          company_address?: string | null
          company_name?: string
          contact_email?: string | null
          created_at?: string
          fleet_size?: number | null
          id?: string
          logo_url?: string | null
          operational_hours?: string | null
          phone_number?: string | null
          timezone?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          company_address?: string | null
          company_name?: string
          contact_email?: string | null
          created_at?: string
          fleet_size?: number | null
          id?: string
          logo_url?: string | null
          operational_hours?: string | null
          phone_number?: string | null
          timezone?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      csv_import_jobs: {
        Row: {
          completed_at: string | null
          created_at: string
          created_by: string
          error_log: Json | null
          failed_imports: number
          file_name: string
          id: string
          import_results: Json | null
          job_name: string
          processed_rows: number
          progress_percentage: number | null
          status: string
          successful_imports: number
          total_rows: number
          updated_at: string
        }
        Insert: {
          completed_at?: string | null
          created_at?: string
          created_by: string
          error_log?: Json | null
          failed_imports?: number
          file_name: string
          id?: string
          import_results?: Json | null
          job_name: string
          processed_rows?: number
          progress_percentage?: number | null
          status?: string
          successful_imports?: number
          total_rows?: number
          updated_at?: string
        }
        Update: {
          completed_at?: string | null
          created_at?: string
          created_by?: string
          error_log?: Json | null
          failed_imports?: number
          file_name?: string
          id?: string
          import_results?: Json | null
          job_name?: string
          processed_rows?: number
          progress_percentage?: number | null
          status?: string
          successful_imports?: number
          total_rows?: number
          updated_at?: string
        }
        Relationships: []
      }
      csv_import_relationships: {
        Row: {
          created_at: string | null
          device_id: string
          gp51_device_id: string | null
          gp51_user_id: string | null
          id: string
          import_job_id: string | null
          relationship_type: string
          row_number: number
          sync_status: string
          user_identifier: string
        }
        Insert: {
          created_at?: string | null
          device_id: string
          gp51_device_id?: string | null
          gp51_user_id?: string | null
          id?: string
          import_job_id?: string | null
          relationship_type?: string
          row_number: number
          sync_status?: string
          user_identifier: string
        }
        Update: {
          created_at?: string | null
          device_id?: string
          gp51_device_id?: string | null
          gp51_user_id?: string | null
          id?: string
          import_job_id?: string | null
          relationship_type?: string
          row_number?: number
          sync_status?: string
          user_identifier?: string
        }
        Relationships: [
          {
            foreignKeyName: "csv_import_relationships_import_job_id_fkey"
            columns: ["import_job_id"]
            isOneToOne: false
            referencedRelation: "csv_import_jobs"
            referencedColumns: ["id"]
          },
        ]
      }
      csv_import_templates: {
        Row: {
          auto_username_generation: boolean | null
          column_mappings: Json
          created_at: string
          created_by: string | null
          gp51_sync_enabled: boolean | null
          id: string
          is_system_template: boolean | null
          supports_user_import: boolean | null
          template_name: string
          template_type: string
          updated_at: string
          validation_rules: Json
        }
        Insert: {
          auto_username_generation?: boolean | null
          column_mappings: Json
          created_at?: string
          created_by?: string | null
          gp51_sync_enabled?: boolean | null
          id?: string
          is_system_template?: boolean | null
          supports_user_import?: boolean | null
          template_name: string
          template_type?: string
          updated_at?: string
          validation_rules: Json
        }
        Update: {
          auto_username_generation?: boolean | null
          column_mappings?: Json
          created_at?: string
          created_by?: string | null
          gp51_sync_enabled?: boolean | null
          id?: string
          is_system_template?: boolean | null
          supports_user_import?: boolean | null
          template_name?: string
          template_type?: string
          updated_at?: string
          validation_rules?: Json
        }
        Relationships: []
      }
      csv_validation_logs: {
        Row: {
          created_at: string
          error_message: string
          field_name: string | null
          id: string
          import_job_id: string | null
          raw_data: Json | null
          row_number: number
          validation_type: string
        }
        Insert: {
          created_at?: string
          error_message: string
          field_name?: string | null
          id?: string
          import_job_id?: string | null
          raw_data?: Json | null
          row_number: number
          validation_type: string
        }
        Update: {
          created_at?: string
          error_message?: string
          field_name?: string | null
          id?: string
          import_job_id?: string | null
          raw_data?: Json | null
          row_number?: number
          validation_type?: string
        }
        Relationships: [
          {
            foreignKeyName: "csv_validation_logs_import_job_id_fkey"
            columns: ["import_job_id"]
            isOneToOne: false
            referencedRelation: "csv_import_jobs"
            referencedColumns: ["id"]
          },
        ]
      }
      data_consistency_logs: {
        Row: {
          checks_failed: number
          checks_passed: number
          checks_performed: number
          data_health: string
          id: string
          overall_score: number
          report_data: Json
          timestamp: string
        }
        Insert: {
          checks_failed?: number
          checks_passed?: number
          checks_performed?: number
          data_health: string
          id?: string
          overall_score: number
          report_data?: Json
          timestamp?: string
        }
        Update: {
          checks_failed?: number
          checks_passed?: number
          checks_performed?: number
          data_health?: string
          id?: string
          overall_score?: number
          report_data?: Json
          timestamp?: string
        }
        Relationships: []
      }
      data_reconciliation_jobs: {
        Row: {
          completed_at: string | null
          created_at: string
          error_log: Json
          failed_items: number
          id: string
          job_type: string
          processed_items: number
          progress_percentage: number
          reconciliation_rules: Json
          results: Json
          started_at: string | null
          status: string
          total_items: number
        }
        Insert: {
          completed_at?: string | null
          created_at?: string
          error_log?: Json
          failed_items?: number
          id?: string
          job_type: string
          processed_items?: number
          progress_percentage?: number
          reconciliation_rules?: Json
          results?: Json
          started_at?: string | null
          status?: string
          total_items?: number
        }
        Update: {
          completed_at?: string | null
          created_at?: string
          error_log?: Json
          failed_items?: number
          id?: string
          job_type?: string
          processed_items?: number
          progress_percentage?: number
          reconciliation_rules?: Json
          results?: Json
          started_at?: string | null
          status?: string
          total_items?: number
        }
        Relationships: []
      }
      device_configurations: {
        Row: {
          configuration_data: Json
          configuration_name: string
          created_at: string
          created_by: string | null
          device_id: string
          id: string
          is_active: boolean | null
          updated_at: string
        }
        Insert: {
          configuration_data: Json
          configuration_name: string
          created_at?: string
          created_by?: string | null
          device_id: string
          id?: string
          is_active?: boolean | null
          updated_at?: string
        }
        Update: {
          configuration_data?: Json
          configuration_name?: string
          created_at?: string
          created_by?: string | null
          device_id?: string
          id?: string
          is_active?: boolean | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "device_configurations_device_id_fkey"
            columns: ["device_id"]
            isOneToOne: false
            referencedRelation: "vehicles"
            referencedColumns: ["device_id"]
          },
        ]
      }
      device_group_assignments: {
        Row: {
          assigned_at: string
          assigned_by: string | null
          device_group_id: string
          device_id: string
          id: string
        }
        Insert: {
          assigned_at?: string
          assigned_by?: string | null
          device_group_id: string
          device_id: string
          id?: string
        }
        Update: {
          assigned_at?: string
          assigned_by?: string | null
          device_group_id?: string
          device_id?: string
          id?: string
        }
        Relationships: [
          {
            foreignKeyName: "device_group_assignments_assigned_by_fkey"
            columns: ["assigned_by"]
            isOneToOne: false
            referencedRelation: "envio_users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "device_group_assignments_device_group_id_fkey"
            columns: ["device_group_id"]
            isOneToOne: false
            referencedRelation: "device_groups"
            referencedColumns: ["id"]
          },
        ]
      }
      device_groups: {
        Row: {
          color_code: string | null
          created_at: string
          description: string | null
          gp51_group_id: number | null
          id: string
          name: string
          parent_group_id: string | null
          updated_at: string
        }
        Insert: {
          color_code?: string | null
          created_at?: string
          description?: string | null
          gp51_group_id?: number | null
          id?: string
          name: string
          parent_group_id?: string | null
          updated_at?: string
        }
        Update: {
          color_code?: string | null
          created_at?: string
          description?: string | null
          gp51_group_id?: number | null
          id?: string
          name?: string
          parent_group_id?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "device_groups_parent_group_id_fkey"
            columns: ["parent_group_id"]
            isOneToOne: false
            referencedRelation: "device_groups"
            referencedColumns: ["id"]
          },
        ]
      }
      device_history: {
        Row: {
          action_description: string | null
          action_type: string
          created_at: string
          device_id: string
          id: string
          new_values: Json | null
          old_values: Json | null
          performed_by: string | null
        }
        Insert: {
          action_description?: string | null
          action_type: string
          created_at?: string
          device_id: string
          id?: string
          new_values?: Json | null
          old_values?: Json | null
          performed_by?: string | null
        }
        Update: {
          action_description?: string | null
          action_type?: string
          created_at?: string
          device_id?: string
          id?: string
          new_values?: Json | null
          old_values?: Json | null
          performed_by?: string | null
        }
        Relationships: []
      }
      device_subscriptions: {
        Row: {
          auto_renewal: boolean | null
          billing_cycle: string
          created_at: string
          customer_id: string | null
          device_id: string
          discount_percentage: number | null
          end_date: string
          id: string
          notes: string | null
          price_override: number | null
          service_plan_id: string | null
          start_date: string
          subscription_status: string
          updated_at: string
        }
        Insert: {
          auto_renewal?: boolean | null
          billing_cycle?: string
          created_at?: string
          customer_id?: string | null
          device_id: string
          discount_percentage?: number | null
          end_date: string
          id?: string
          notes?: string | null
          price_override?: number | null
          service_plan_id?: string | null
          start_date: string
          subscription_status?: string
          updated_at?: string
        }
        Update: {
          auto_renewal?: boolean | null
          billing_cycle?: string
          created_at?: string
          customer_id?: string | null
          device_id?: string
          discount_percentage?: number | null
          end_date?: string
          id?: string
          notes?: string | null
          price_override?: number | null
          service_plan_id?: string | null
          start_date?: string
          subscription_status?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "device_subscriptions_service_plan_id_fkey"
            columns: ["service_plan_id"]
            isOneToOne: false
            referencedRelation: "service_plans"
            referencedColumns: ["id"]
          },
        ]
      }
      device_tag_assignments: {
        Row: {
          assigned_at: string
          assigned_by: string | null
          device_id: string
          id: string
          tag_id: string
        }
        Insert: {
          assigned_at?: string
          assigned_by?: string | null
          device_id: string
          id?: string
          tag_id: string
        }
        Update: {
          assigned_at?: string
          assigned_by?: string | null
          device_id?: string
          id?: string
          tag_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "device_tag_assignments_device_id_fkey"
            columns: ["device_id"]
            isOneToOne: false
            referencedRelation: "vehicles"
            referencedColumns: ["device_id"]
          },
          {
            foreignKeyName: "device_tag_assignments_tag_id_fkey"
            columns: ["tag_id"]
            isOneToOne: false
            referencedRelation: "device_tags"
            referencedColumns: ["id"]
          },
        ]
      }
      device_tags: {
        Row: {
          color: string | null
          created_at: string
          description: string | null
          id: string
          name: string
        }
        Insert: {
          color?: string | null
          created_at?: string
          description?: string | null
          id?: string
          name: string
        }
        Update: {
          color?: string | null
          created_at?: string
          description?: string | null
          id?: string
          name?: string
        }
        Relationships: []
      }
      device_types: {
        Row: {
          created_at: string
          default_id_length: number | null
          default_offline_delay: number | null
          features: Json | null
          functions: number | null
          functions_long: number | null
          gp51_device_type_id: number
          id: string
          is_active: boolean | null
          price_1_year: number | null
          price_10_year: number | null
          price_3_year: number | null
          price_5_year: number | null
          remark: string | null
          remark_en: string | null
          type_code: string | null
          type_name: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          default_id_length?: number | null
          default_offline_delay?: number | null
          features?: Json | null
          functions?: number | null
          functions_long?: number | null
          gp51_device_type_id: number
          id?: string
          is_active?: boolean | null
          price_1_year?: number | null
          price_10_year?: number | null
          price_3_year?: number | null
          price_5_year?: number | null
          remark?: string | null
          remark_en?: string | null
          type_code?: string | null
          type_name: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          default_id_length?: number | null
          default_offline_delay?: number | null
          features?: Json | null
          functions?: number | null
          functions_long?: number | null
          gp51_device_type_id?: number
          id?: string
          is_active?: boolean | null
          price_1_year?: number | null
          price_10_year?: number | null
          price_3_year?: number | null
          price_5_year?: number | null
          remark?: string | null
          remark_en?: string | null
          type_code?: string | null
          type_name?: string
          updated_at?: string
        }
        Relationships: []
      }
      email_notification_queue: {
        Row: {
          body_html: string | null
          body_text: string
          created_at: string
          error_message: string | null
          id: string
          max_retries: number
          priority: number
          recipient_email: string
          retry_count: number
          scheduled_for: string | null
          sender_email: string | null
          sent_at: string | null
          status: string
          subject: string
          template_id: string | null
          template_variables: Json | null
          updated_at: string
          user_id: string
        }
        Insert: {
          body_html?: string | null
          body_text: string
          created_at?: string
          error_message?: string | null
          id?: string
          max_retries?: number
          priority?: number
          recipient_email: string
          retry_count?: number
          scheduled_for?: string | null
          sender_email?: string | null
          sent_at?: string | null
          status?: string
          subject: string
          template_id?: string | null
          template_variables?: Json | null
          updated_at?: string
          user_id: string
        }
        Update: {
          body_html?: string | null
          body_text?: string
          created_at?: string
          error_message?: string | null
          id?: string
          max_retries?: number
          priority?: number
          recipient_email?: string
          retry_count?: number
          scheduled_for?: string | null
          sender_email?: string | null
          sent_at?: string | null
          status?: string
          subject?: string
          template_id?: string | null
          template_variables?: Json | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      email_templates: {
        Row: {
          body_html: string | null
          body_text: string
          created_at: string
          id: string
          is_active: boolean
          subject: string
          template_name: string
          template_type: string
          updated_at: string
          user_id: string
          variables: Json | null
        }
        Insert: {
          body_html?: string | null
          body_text: string
          created_at?: string
          id?: string
          is_active?: boolean
          subject: string
          template_name: string
          template_type?: string
          updated_at?: string
          user_id: string
          variables?: Json | null
        }
        Update: {
          body_html?: string | null
          body_text?: string
          created_at?: string
          id?: string
          is_active?: boolean
          subject?: string
          template_name?: string
          template_type?: string
          updated_at?: string
          user_id?: string
          variables?: Json | null
        }
        Relationships: []
      }
      envio_users: {
        Row: {
          city: string | null
          created_at: string
          email: string
          gp51_user_type: number | null
          gp51_username: string | null
          id: string
          import_source: string | null
          is_gp51_imported: boolean | null
          name: string
          needs_password_set: boolean | null
          otp_verified_at: string | null
          phone_number: string | null
          registration_status: string | null
          registration_type: string | null
          updated_at: string
        }
        Insert: {
          city?: string | null
          created_at?: string
          email: string
          gp51_user_type?: number | null
          gp51_username?: string | null
          id?: string
          import_source?: string | null
          is_gp51_imported?: boolean | null
          name: string
          needs_password_set?: boolean | null
          otp_verified_at?: string | null
          phone_number?: string | null
          registration_status?: string | null
          registration_type?: string | null
          updated_at?: string
        }
        Update: {
          city?: string | null
          created_at?: string
          email?: string
          gp51_user_type?: number | null
          gp51_username?: string | null
          id?: string
          import_source?: string | null
          is_gp51_imported?: boolean | null
          name?: string
          needs_password_set?: boolean | null
          otp_verified_at?: string | null
          phone_number?: string | null
          registration_status?: string | null
          registration_type?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      envio_users_backup_2025_06_06_09_53_33: {
        Row: {
          city: string | null
          created_at: string | null
          email: string | null
          gp51_user_type: number | null
          gp51_username: string | null
          id: string | null
          import_source: string | null
          is_gp51_imported: boolean | null
          name: string | null
          needs_password_set: boolean | null
          otp_verified_at: string | null
          phone_number: string | null
          registration_status: string | null
          registration_type: string | null
          updated_at: string | null
        }
        Insert: {
          city?: string | null
          created_at?: string | null
          email?: string | null
          gp51_user_type?: number | null
          gp51_username?: string | null
          id?: string | null
          import_source?: string | null
          is_gp51_imported?: boolean | null
          name?: string | null
          needs_password_set?: boolean | null
          otp_verified_at?: string | null
          phone_number?: string | null
          registration_status?: string | null
          registration_type?: string | null
          updated_at?: string | null
        }
        Update: {
          city?: string | null
          created_at?: string | null
          email?: string | null
          gp51_user_type?: number | null
          gp51_username?: string | null
          id?: string | null
          import_source?: string | null
          is_gp51_imported?: boolean | null
          name?: string | null
          needs_password_set?: boolean | null
          otp_verified_at?: string | null
          phone_number?: string | null
          registration_status?: string | null
          registration_type?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
      envio_users_backup_2025_06_06_10_05_23: {
        Row: {
          city: string | null
          created_at: string | null
          email: string | null
          gp51_user_type: number | null
          gp51_username: string | null
          id: string | null
          import_source: string | null
          is_gp51_imported: boolean | null
          name: string | null
          needs_password_set: boolean | null
          otp_verified_at: string | null
          phone_number: string | null
          registration_status: string | null
          registration_type: string | null
          updated_at: string | null
        }
        Insert: {
          city?: string | null
          created_at?: string | null
          email?: string | null
          gp51_user_type?: number | null
          gp51_username?: string | null
          id?: string | null
          import_source?: string | null
          is_gp51_imported?: boolean | null
          name?: string | null
          needs_password_set?: boolean | null
          otp_verified_at?: string | null
          phone_number?: string | null
          registration_status?: string | null
          registration_type?: string | null
          updated_at?: string | null
        }
        Update: {
          city?: string | null
          created_at?: string | null
          email?: string | null
          gp51_user_type?: number | null
          gp51_username?: string | null
          id?: string | null
          import_source?: string | null
          is_gp51_imported?: boolean | null
          name?: string | null
          needs_password_set?: boolean | null
          otp_verified_at?: string | null
          phone_number?: string | null
          registration_status?: string | null
          registration_type?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
      envio_users_backup_2025_06_06_10_34_58: {
        Row: {
          city: string | null
          created_at: string | null
          email: string | null
          gp51_user_type: number | null
          gp51_username: string | null
          id: string | null
          import_source: string | null
          is_gp51_imported: boolean | null
          name: string | null
          needs_password_set: boolean | null
          otp_verified_at: string | null
          phone_number: string | null
          registration_status: string | null
          registration_type: string | null
          updated_at: string | null
        }
        Insert: {
          city?: string | null
          created_at?: string | null
          email?: string | null
          gp51_user_type?: number | null
          gp51_username?: string | null
          id?: string | null
          import_source?: string | null
          is_gp51_imported?: boolean | null
          name?: string | null
          needs_password_set?: boolean | null
          otp_verified_at?: string | null
          phone_number?: string | null
          registration_status?: string | null
          registration_type?: string | null
          updated_at?: string | null
        }
        Update: {
          city?: string | null
          created_at?: string | null
          email?: string | null
          gp51_user_type?: number | null
          gp51_username?: string | null
          id?: string | null
          import_source?: string | null
          is_gp51_imported?: boolean | null
          name?: string | null
          needs_password_set?: boolean | null
          otp_verified_at?: string | null
          phone_number?: string | null
          registration_status?: string | null
          registration_type?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
      envio_users_backup_2025_06_06_16_18_27: {
        Row: {
          city: string | null
          created_at: string | null
          email: string | null
          gp51_user_type: number | null
          gp51_username: string | null
          id: string | null
          import_source: string | null
          is_gp51_imported: boolean | null
          name: string | null
          needs_password_set: boolean | null
          otp_verified_at: string | null
          phone_number: string | null
          registration_status: string | null
          registration_type: string | null
          updated_at: string | null
        }
        Insert: {
          city?: string | null
          created_at?: string | null
          email?: string | null
          gp51_user_type?: number | null
          gp51_username?: string | null
          id?: string | null
          import_source?: string | null
          is_gp51_imported?: boolean | null
          name?: string | null
          needs_password_set?: boolean | null
          otp_verified_at?: string | null
          phone_number?: string | null
          registration_status?: string | null
          registration_type?: string | null
          updated_at?: string | null
        }
        Update: {
          city?: string | null
          created_at?: string | null
          email?: string | null
          gp51_user_type?: number | null
          gp51_username?: string | null
          id?: string | null
          import_source?: string | null
          is_gp51_imported?: boolean | null
          name?: string | null
          needs_password_set?: boolean | null
          otp_verified_at?: string | null
          phone_number?: string | null
          registration_status?: string | null
          registration_type?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
      envio_users_backup_2025_06_06_16_31_04: {
        Row: {
          city: string | null
          created_at: string | null
          email: string | null
          gp51_user_type: number | null
          gp51_username: string | null
          id: string | null
          import_source: string | null
          is_gp51_imported: boolean | null
          name: string | null
          needs_password_set: boolean | null
          otp_verified_at: string | null
          phone_number: string | null
          registration_status: string | null
          registration_type: string | null
          updated_at: string | null
        }
        Insert: {
          city?: string | null
          created_at?: string | null
          email?: string | null
          gp51_user_type?: number | null
          gp51_username?: string | null
          id?: string | null
          import_source?: string | null
          is_gp51_imported?: boolean | null
          name?: string | null
          needs_password_set?: boolean | null
          otp_verified_at?: string | null
          phone_number?: string | null
          registration_status?: string | null
          registration_type?: string | null
          updated_at?: string | null
        }
        Update: {
          city?: string | null
          created_at?: string | null
          email?: string | null
          gp51_user_type?: number | null
          gp51_username?: string | null
          id?: string | null
          import_source?: string | null
          is_gp51_imported?: boolean | null
          name?: string | null
          needs_password_set?: boolean | null
          otp_verified_at?: string | null
          phone_number?: string | null
          registration_status?: string | null
          registration_type?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
      envio_users_backup_full_import: {
        Row: {
          city: string | null
          created_at: string | null
          email: string | null
          gp51_user_type: number | null
          gp51_username: string | null
          id: string | null
          import_source: string | null
          is_gp51_imported: boolean | null
          name: string | null
          needs_password_set: boolean | null
          otp_verified_at: string | null
          phone_number: string | null
          registration_status: string | null
          registration_type: string | null
          updated_at: string | null
        }
        Insert: {
          city?: string | null
          created_at?: string | null
          email?: string | null
          gp51_user_type?: number | null
          gp51_username?: string | null
          id?: string | null
          import_source?: string | null
          is_gp51_imported?: boolean | null
          name?: string | null
          needs_password_set?: boolean | null
          otp_verified_at?: string | null
          phone_number?: string | null
          registration_status?: string | null
          registration_type?: string | null
          updated_at?: string | null
        }
        Update: {
          city?: string | null
          created_at?: string | null
          email?: string | null
          gp51_user_type?: number | null
          gp51_username?: string | null
          id?: string | null
          import_source?: string | null
          is_gp51_imported?: boolean | null
          name?: string | null
          needs_password_set?: boolean | null
          otp_verified_at?: string | null
          phone_number?: string | null
          registration_status?: string | null
          registration_type?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
      geocoding_cache: {
        Row: {
          address_result: string
          cache_key: string
          confidence_score: number | null
          created_at: string
          expires_at: string
          hit_count: number
          id: string
          latitude: number | null
          longitude: number | null
          provider_name: string
        }
        Insert: {
          address_result: string
          cache_key: string
          confidence_score?: number | null
          created_at?: string
          expires_at?: string
          hit_count?: number
          id?: string
          latitude?: number | null
          longitude?: number | null
          provider_name: string
        }
        Update: {
          address_result?: string
          cache_key?: string
          confidence_score?: number | null
          created_at?: string
          expires_at?: string
          hit_count?: number
          id?: string
          latitude?: number | null
          longitude?: number | null
          provider_name?: string
        }
        Relationships: []
      }
      geocoding_configurations: {
        Row: {
          api_key_encrypted: string | null
          created_at: string
          fallback_provider: boolean
          id: string
          is_active: boolean
          last_tested_at: string | null
          primary_provider: boolean
          provider_name: string
          rate_limit_per_day: number | null
          test_error_message: string | null
          test_status: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          api_key_encrypted?: string | null
          created_at?: string
          fallback_provider?: boolean
          id?: string
          is_active?: boolean
          last_tested_at?: string | null
          primary_provider?: boolean
          provider_name: string
          rate_limit_per_day?: number | null
          test_error_message?: string | null
          test_status?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          api_key_encrypted?: string | null
          created_at?: string
          fallback_provider?: boolean
          id?: string
          is_active?: boolean
          last_tested_at?: string | null
          primary_provider?: boolean
          provider_name?: string
          rate_limit_per_day?: number | null
          test_error_message?: string | null
          test_status?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      geocoding_usage_logs: {
        Row: {
          address_input: string | null
          address_result: string | null
          cache_hit: boolean
          created_at: string
          error_message: string | null
          id: string
          latitude: number | null
          longitude: number | null
          provider_name: string
          request_type: string
          response_time_ms: number | null
          success: boolean
          user_id: string
        }
        Insert: {
          address_input?: string | null
          address_result?: string | null
          cache_hit?: boolean
          created_at?: string
          error_message?: string | null
          id?: string
          latitude?: number | null
          longitude?: number | null
          provider_name: string
          request_type: string
          response_time_ms?: number | null
          success?: boolean
          user_id: string
        }
        Update: {
          address_input?: string | null
          address_result?: string | null
          cache_hit?: boolean
          created_at?: string
          error_message?: string | null
          id?: string
          latitude?: number | null
          longitude?: number | null
          provider_name?: string
          request_type?: string
          response_time_ms?: number | null
          success?: boolean
          user_id?: string
        }
        Relationships: []
      }
      geofence_alerts: {
        Row: {
          acknowledged_at: string | null
          acknowledged_by: string | null
          alert_type: string
          created_at: string
          device_id: string
          geofence_id: string
          id: string
          is_acknowledged: boolean | null
          location: Json
          triggered_at: string
        }
        Insert: {
          acknowledged_at?: string | null
          acknowledged_by?: string | null
          alert_type: string
          created_at?: string
          device_id: string
          geofence_id: string
          id?: string
          is_acknowledged?: boolean | null
          location: Json
          triggered_at: string
        }
        Update: {
          acknowledged_at?: string | null
          acknowledged_by?: string | null
          alert_type?: string
          created_at?: string
          device_id?: string
          geofence_id?: string
          id?: string
          is_acknowledged?: boolean | null
          location?: Json
          triggered_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "geofence_alerts_geofence_id_fkey"
            columns: ["geofence_id"]
            isOneToOne: false
            referencedRelation: "geofences"
            referencedColumns: ["id"]
          },
        ]
      }
      geofences: {
        Row: {
          alert_on_enter: boolean | null
          alert_on_exit: boolean | null
          created_at: string
          created_by: string | null
          description: string | null
          fence_type: string
          geometry: Json
          id: string
          is_active: boolean
          name: string
          updated_at: string
        }
        Insert: {
          alert_on_enter?: boolean | null
          alert_on_exit?: boolean | null
          created_at?: string
          created_by?: string | null
          description?: string | null
          fence_type?: string
          geometry: Json
          id?: string
          is_active?: boolean
          name: string
          updated_at?: string
        }
        Update: {
          alert_on_enter?: boolean | null
          alert_on_exit?: boolean | null
          created_at?: string
          created_by?: string | null
          description?: string | null
          fence_type?: string
          geometry?: Json
          id?: string
          is_active?: boolean
          name?: string
          updated_at?: string
        }
        Relationships: []
      }
      gp51_connection_health: {
        Row: {
          created_at: string
          error_message: string | null
          id: string
          last_check: string
          latency: number | null
          session_info: Json | null
          status: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          error_message?: string | null
          id?: string
          last_check?: string
          latency?: number | null
          session_info?: Json | null
          status: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          error_message?: string | null
          id?: string
          last_check?: string
          latency?: number | null
          session_info?: Json | null
          status?: string
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
      gp51_data_conflicts_resolution: {
        Row: {
          conflict_entity: string
          conflict_type: string
          created_at: string | null
          existing_data: Json | null
          id: string
          incoming_data: Json | null
          resolution_action: string | null
          resolved_at: string | null
          resolved_by: string | null
          system_import_id: string | null
        }
        Insert: {
          conflict_entity: string
          conflict_type: string
          created_at?: string | null
          existing_data?: Json | null
          id?: string
          incoming_data?: Json | null
          resolution_action?: string | null
          resolved_at?: string | null
          resolved_by?: string | null
          system_import_id?: string | null
        }
        Update: {
          conflict_entity?: string
          conflict_type?: string
          created_at?: string | null
          existing_data?: Json | null
          id?: string
          incoming_data?: Json | null
          resolution_action?: string | null
          resolved_at?: string | null
          resolved_by?: string | null
          system_import_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "gp51_data_conflicts_resolution_system_import_id_fkey"
            columns: ["system_import_id"]
            isOneToOne: false
            referencedRelation: "gp51_system_imports"
            referencedColumns: ["id"]
          },
        ]
      }
      gp51_health_metrics: {
        Row: {
          created_at: string
          error_details: string | null
          id: string
          latency: number
          success: boolean
          timestamp: string
        }
        Insert: {
          created_at?: string
          error_details?: string | null
          id?: string
          latency: number
          success?: boolean
          timestamp?: string
        }
        Update: {
          created_at?: string
          error_details?: string | null
          id?: string
          latency?: number
          success?: boolean
          timestamp?: string
        }
        Relationships: []
      }
      gp51_import_audit_log: {
        Row: {
          affected_records: number | null
          created_at: string | null
          error_details: string | null
          id: string
          operation_details: Json | null
          operation_type: string
          success: boolean | null
          system_import_id: string | null
        }
        Insert: {
          affected_records?: number | null
          created_at?: string | null
          error_details?: string | null
          id?: string
          operation_details?: Json | null
          operation_type: string
          success?: boolean | null
          system_import_id?: string | null
        }
        Update: {
          affected_records?: number | null
          created_at?: string | null
          error_details?: string | null
          id?: string
          operation_details?: Json | null
          operation_type?: string
          success?: boolean | null
          system_import_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "gp51_import_audit_log_system_import_id_fkey"
            columns: ["system_import_id"]
            isOneToOne: false
            referencedRelation: "gp51_system_imports"
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
      gp51_import_progress_phases: {
        Row: {
          completed_at: string | null
          created_at: string | null
          id: string
          phase_details: Json | null
          phase_name: string
          phase_progress: number | null
          phase_status: string | null
          started_at: string | null
          system_import_id: string | null
        }
        Insert: {
          completed_at?: string | null
          created_at?: string | null
          id?: string
          phase_details?: Json | null
          phase_name: string
          phase_progress?: number | null
          phase_status?: string | null
          started_at?: string | null
          system_import_id?: string | null
        }
        Update: {
          completed_at?: string | null
          created_at?: string | null
          id?: string
          phase_details?: Json | null
          phase_name?: string
          phase_progress?: number | null
          phase_status?: string | null
          started_at?: string | null
          system_import_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "gp51_import_progress_phases_system_import_id_fkey"
            columns: ["system_import_id"]
            isOneToOne: false
            referencedRelation: "gp51_system_imports"
            referencedColumns: ["id"]
          },
        ]
      }
      gp51_polling_config: {
        Row: {
          created_at: string
          error_count: number
          id: string
          is_enabled: boolean
          last_error: string | null
          last_poll_time: string | null
          last_successful_poll: string | null
          polling_interval_seconds: number
          updated_at: string
        }
        Insert: {
          created_at?: string
          error_count?: number
          id?: string
          is_enabled?: boolean
          last_error?: string | null
          last_poll_time?: string | null
          last_successful_poll?: string | null
          polling_interval_seconds?: number
          updated_at?: string
        }
        Update: {
          created_at?: string
          error_count?: number
          id?: string
          is_enabled?: boolean
          last_error?: string | null
          last_poll_time?: string | null
          last_successful_poll?: string | null
          polling_interval_seconds?: number
          updated_at?: string
        }
        Relationships: []
      }
      gp51_sessions: {
        Row: {
          api_url: string | null
          created_at: string
          envio_user_id: string | null
          gp51_token: string | null
          id: string
          token_expires_at: string | null
          updated_at: string
          username: string
        }
        Insert: {
          api_url?: string | null
          created_at?: string
          envio_user_id?: string | null
          gp51_token?: string | null
          id?: string
          token_expires_at?: string | null
          updated_at?: string
          username: string
        }
        Update: {
          api_url?: string | null
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
            foreignKeyName: "fk_gp51_sessions_envio_user_id"
            columns: ["envio_user_id"]
            isOneToOne: false
            referencedRelation: "envio_users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "gp51_sessions_envio_user_id_fkey"
            columns: ["envio_user_id"]
            isOneToOne: false
            referencedRelation: "envio_users"
            referencedColumns: ["id"]
          },
        ]
      }
      gp51_sessions_backup_2025_06_06_09_53_33: {
        Row: {
          created_at: string | null
          envio_user_id: string | null
          gp51_token: string | null
          id: string | null
          token_expires_at: string | null
          updated_at: string | null
          username: string | null
        }
        Insert: {
          created_at?: string | null
          envio_user_id?: string | null
          gp51_token?: string | null
          id?: string | null
          token_expires_at?: string | null
          updated_at?: string | null
          username?: string | null
        }
        Update: {
          created_at?: string | null
          envio_user_id?: string | null
          gp51_token?: string | null
          id?: string | null
          token_expires_at?: string | null
          updated_at?: string | null
          username?: string | null
        }
        Relationships: []
      }
      gp51_sessions_backup_2025_06_06_10_05_23: {
        Row: {
          created_at: string | null
          envio_user_id: string | null
          gp51_token: string | null
          id: string | null
          token_expires_at: string | null
          updated_at: string | null
          username: string | null
        }
        Insert: {
          created_at?: string | null
          envio_user_id?: string | null
          gp51_token?: string | null
          id?: string | null
          token_expires_at?: string | null
          updated_at?: string | null
          username?: string | null
        }
        Update: {
          created_at?: string | null
          envio_user_id?: string | null
          gp51_token?: string | null
          id?: string | null
          token_expires_at?: string | null
          updated_at?: string | null
          username?: string | null
        }
        Relationships: []
      }
      gp51_sessions_backup_2025_06_06_10_34_58: {
        Row: {
          created_at: string | null
          envio_user_id: string | null
          gp51_token: string | null
          id: string | null
          token_expires_at: string | null
          updated_at: string | null
          username: string | null
        }
        Insert: {
          created_at?: string | null
          envio_user_id?: string | null
          gp51_token?: string | null
          id?: string | null
          token_expires_at?: string | null
          updated_at?: string | null
          username?: string | null
        }
        Update: {
          created_at?: string | null
          envio_user_id?: string | null
          gp51_token?: string | null
          id?: string | null
          token_expires_at?: string | null
          updated_at?: string | null
          username?: string | null
        }
        Relationships: []
      }
      gp51_sessions_backup_2025_06_06_16_18_27: {
        Row: {
          api_url: string | null
          created_at: string | null
          envio_user_id: string | null
          gp51_token: string | null
          id: string | null
          token_expires_at: string | null
          updated_at: string | null
          username: string | null
        }
        Insert: {
          api_url?: string | null
          created_at?: string | null
          envio_user_id?: string | null
          gp51_token?: string | null
          id?: string | null
          token_expires_at?: string | null
          updated_at?: string | null
          username?: string | null
        }
        Update: {
          api_url?: string | null
          created_at?: string | null
          envio_user_id?: string | null
          gp51_token?: string | null
          id?: string | null
          token_expires_at?: string | null
          updated_at?: string | null
          username?: string | null
        }
        Relationships: []
      }
      gp51_sessions_backup_2025_06_06_16_31_04: {
        Row: {
          api_url: string | null
          created_at: string | null
          envio_user_id: string | null
          gp51_token: string | null
          id: string | null
          token_expires_at: string | null
          updated_at: string | null
          username: string | null
        }
        Insert: {
          api_url?: string | null
          created_at?: string | null
          envio_user_id?: string | null
          gp51_token?: string | null
          id?: string | null
          token_expires_at?: string | null
          updated_at?: string | null
          username?: string | null
        }
        Update: {
          api_url?: string | null
          created_at?: string | null
          envio_user_id?: string | null
          gp51_token?: string | null
          id?: string | null
          token_expires_at?: string | null
          updated_at?: string | null
          username?: string | null
        }
        Relationships: []
      }
      gp51_sessions_backup_full_import: {
        Row: {
          created_at: string | null
          envio_user_id: string | null
          gp51_token: string | null
          id: string | null
          token_expires_at: string | null
          updated_at: string | null
          username: string | null
        }
        Insert: {
          created_at?: string | null
          envio_user_id?: string | null
          gp51_token?: string | null
          id?: string | null
          token_expires_at?: string | null
          updated_at?: string | null
          username?: string | null
        }
        Update: {
          created_at?: string | null
          envio_user_id?: string | null
          gp51_token?: string | null
          id?: string | null
          token_expires_at?: string | null
          updated_at?: string | null
          username?: string | null
        }
        Relationships: []
      }
      gp51_sync_status: {
        Row: {
          conflict_data: Json | null
          created_at: string | null
          entity_id: string
          entity_type: string
          gp51_id: string | null
          id: string
          import_job_id: string | null
          last_sync_attempt: string | null
          sync_attempts: number | null
          sync_error: string | null
          sync_status: string
          updated_at: string | null
        }
        Insert: {
          conflict_data?: Json | null
          created_at?: string | null
          entity_id: string
          entity_type: string
          gp51_id?: string | null
          id?: string
          import_job_id?: string | null
          last_sync_attempt?: string | null
          sync_attempts?: number | null
          sync_error?: string | null
          sync_status?: string
          updated_at?: string | null
        }
        Update: {
          conflict_data?: Json | null
          created_at?: string | null
          entity_id?: string
          entity_type?: string
          gp51_id?: string | null
          id?: string
          import_job_id?: string | null
          last_sync_attempt?: string | null
          sync_attempts?: number | null
          sync_error?: string | null
          sync_status?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "gp51_sync_status_import_job_id_fkey"
            columns: ["import_job_id"]
            isOneToOne: false
            referencedRelation: "csv_import_jobs"
            referencedColumns: ["id"]
          },
        ]
      }
      gp51_system_imports: {
        Row: {
          admin_gp51_username: string | null
          backup_tables: Json | null
          can_rollback: boolean | null
          completed_at: string | null
          created_at: string
          created_by: string | null
          current_phase: string | null
          data_integrity_score: number | null
          error_log: Json | null
          failed_devices: number
          failed_users: number
          id: string
          import_results: Json | null
          import_scope: string | null
          import_type: string
          job_name: string
          phase_details: string | null
          pre_import_checks: Json | null
          processed_devices: number
          processed_users: number
          progress_percentage: number | null
          rollback_data: Json | null
          status: string
          successful_devices: number
          successful_users: number
          total_devices: number
          total_users: number
          updated_at: string
          validation_results: Json | null
        }
        Insert: {
          admin_gp51_username?: string | null
          backup_tables?: Json | null
          can_rollback?: boolean | null
          completed_at?: string | null
          created_at?: string
          created_by?: string | null
          current_phase?: string | null
          data_integrity_score?: number | null
          error_log?: Json | null
          failed_devices?: number
          failed_users?: number
          id?: string
          import_results?: Json | null
          import_scope?: string | null
          import_type?: string
          job_name: string
          phase_details?: string | null
          pre_import_checks?: Json | null
          processed_devices?: number
          processed_users?: number
          progress_percentage?: number | null
          rollback_data?: Json | null
          status?: string
          successful_devices?: number
          successful_users?: number
          total_devices?: number
          total_users?: number
          updated_at?: string
          validation_results?: Json | null
        }
        Update: {
          admin_gp51_username?: string | null
          backup_tables?: Json | null
          can_rollback?: boolean | null
          completed_at?: string | null
          created_at?: string
          created_by?: string | null
          current_phase?: string | null
          data_integrity_score?: number | null
          error_log?: Json | null
          failed_devices?: number
          failed_users?: number
          id?: string
          import_results?: Json | null
          import_scope?: string | null
          import_type?: string
          job_name?: string
          phase_details?: string | null
          pre_import_checks?: Json | null
          processed_devices?: number
          processed_users?: number
          progress_percentage?: number | null
          rollback_data?: Json | null
          status?: string
          successful_devices?: number
          successful_users?: number
          total_devices?: number
          total_users?: number
          updated_at?: string
          validation_results?: Json | null
        }
        Relationships: [
          {
            foreignKeyName: "gp51_system_imports_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "envio_users"
            referencedColumns: ["id"]
          },
        ]
      }
      import_notifications: {
        Row: {
          created_at: string | null
          data: Json | null
          id: string
          is_read: boolean | null
          message: string
          notification_type: string
          title: string
          user_id: string | null
        }
        Insert: {
          created_at?: string | null
          data?: Json | null
          id?: string
          is_read?: boolean | null
          message: string
          notification_type: string
          title: string
          user_id?: string | null
        }
        Update: {
          created_at?: string | null
          data?: Json | null
          id?: string
          is_read?: boolean | null
          message?: string
          notification_type?: string
          title?: string
          user_id?: string | null
        }
        Relationships: []
      }
      import_performance_metrics: {
        Row: {
          created_at: string | null
          id: string
          import_id: string | null
          metric_data: Json | null
          metric_type: string
          metric_value: number | null
          phase: string | null
          timestamp: string | null
        }
        Insert: {
          created_at?: string | null
          id?: string
          import_id?: string | null
          metric_data?: Json | null
          metric_type: string
          metric_value?: number | null
          phase?: string | null
          timestamp?: string | null
        }
        Update: {
          created_at?: string | null
          id?: string
          import_id?: string | null
          metric_data?: Json | null
          metric_type?: string
          metric_value?: number | null
          phase?: string | null
          timestamp?: string | null
        }
        Relationships: []
      }
      import_preview_cache: {
        Row: {
          cache_key: string
          created_at: string | null
          expires_at: string
          id: string
          preview_data: Json
        }
        Insert: {
          cache_key: string
          created_at?: string | null
          expires_at: string
          id?: string
          preview_data: Json
        }
        Update: {
          cache_key?: string
          created_at?: string | null
          expires_at?: string
          id?: string
          preview_data?: Json
        }
        Relationships: []
      }
      import_templates: {
        Row: {
          configuration: Json
          created_at: string | null
          created_by: string | null
          description: string | null
          id: string
          is_active: boolean | null
          is_system_template: boolean | null
          name: string
          template_type: string
          updated_at: string | null
        }
        Insert: {
          configuration?: Json
          created_at?: string | null
          created_by?: string | null
          description?: string | null
          id?: string
          is_active?: boolean | null
          is_system_template?: boolean | null
          name: string
          template_type?: string
          updated_at?: string | null
        }
        Update: {
          configuration?: Json
          created_at?: string | null
          created_by?: string | null
          description?: string | null
          id?: string
          is_active?: boolean | null
          is_system_template?: boolean | null
          name?: string
          template_type?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      inspection_checklist_items: {
        Row: {
          category: string
          check_status: string
          checked_at: string | null
          checked_by: string | null
          created_at: string
          estimated_repair_cost: number | null
          id: string
          inspection_id: string
          inspector_notes: string | null
          is_required: boolean
          item_description: string | null
          item_name: string
          requires_repair: boolean | null
          severity_level: string | null
        }
        Insert: {
          category: string
          check_status?: string
          checked_at?: string | null
          checked_by?: string | null
          created_at?: string
          estimated_repair_cost?: number | null
          id?: string
          inspection_id: string
          inspector_notes?: string | null
          is_required?: boolean
          item_description?: string | null
          item_name: string
          requires_repair?: boolean | null
          severity_level?: string | null
        }
        Update: {
          category?: string
          check_status?: string
          checked_at?: string | null
          checked_by?: string | null
          created_at?: string
          estimated_repair_cost?: number | null
          id?: string
          inspection_id?: string
          inspector_notes?: string | null
          is_required?: boolean
          item_description?: string | null
          item_name?: string
          requires_repair?: boolean | null
          severity_level?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "inspection_checklist_items_checked_by_fkey"
            columns: ["checked_by"]
            isOneToOne: false
            referencedRelation: "workshop_users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "inspection_checklist_items_inspection_id_fkey"
            columns: ["inspection_id"]
            isOneToOne: false
            referencedRelation: "vehicle_inspections"
            referencedColumns: ["id"]
          },
        ]
      }
      inspection_form_templates: {
        Row: {
          created_at: string
          created_by: string | null
          form_fields: Json
          id: string
          is_active: boolean
          is_default: boolean
          template_description: string | null
          template_name: string
          updated_at: string
          vehicle_category: string | null
          workshop_id: string | null
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          form_fields?: Json
          id?: string
          is_active?: boolean
          is_default?: boolean
          template_description?: string | null
          template_name: string
          updated_at?: string
          vehicle_category?: string | null
          workshop_id?: string | null
        }
        Update: {
          created_at?: string
          created_by?: string | null
          form_fields?: Json
          id?: string
          is_active?: boolean
          is_default?: boolean
          template_description?: string | null
          template_name?: string
          updated_at?: string
          vehicle_category?: string | null
          workshop_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "inspection_form_templates_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "envio_users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "inspection_form_templates_workshop_id_fkey"
            columns: ["workshop_id"]
            isOneToOne: false
            referencedRelation: "workshops"
            referencedColumns: ["id"]
          },
        ]
      }
      inspection_photos: {
        Row: {
          checklist_item_id: string | null
          created_at: string
          id: string
          inspection_id: string
          photo_description: string | null
          photo_type: string | null
          photo_url: string
          uploaded_by: string | null
        }
        Insert: {
          checklist_item_id?: string | null
          created_at?: string
          id?: string
          inspection_id: string
          photo_description?: string | null
          photo_type?: string | null
          photo_url: string
          uploaded_by?: string | null
        }
        Update: {
          checklist_item_id?: string | null
          created_at?: string
          id?: string
          inspection_id?: string
          photo_description?: string | null
          photo_type?: string | null
          photo_url?: string
          uploaded_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "inspection_photos_checklist_item_id_fkey"
            columns: ["checklist_item_id"]
            isOneToOne: false
            referencedRelation: "inspection_checklist_items"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "inspection_photos_inspection_id_fkey"
            columns: ["inspection_id"]
            isOneToOne: false
            referencedRelation: "vehicle_inspections"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "inspection_photos_uploaded_by_fkey"
            columns: ["uploaded_by"]
            isOneToOne: false
            referencedRelation: "workshop_users"
            referencedColumns: ["id"]
          },
        ]
      }
      inspection_templates: {
        Row: {
          checklist_items: Json
          created_at: string
          created_by: string | null
          estimated_duration_hours: number | null
          id: string
          inspection_type: string
          is_active: boolean
          template_name: string
          updated_at: string
          vehicle_category: string | null
        }
        Insert: {
          checklist_items?: Json
          created_at?: string
          created_by?: string | null
          estimated_duration_hours?: number | null
          id?: string
          inspection_type: string
          is_active?: boolean
          template_name: string
          updated_at?: string
          vehicle_category?: string | null
        }
        Update: {
          checklist_items?: Json
          created_at?: string
          created_by?: string | null
          estimated_duration_hours?: number | null
          id?: string
          inspection_type?: string
          is_active?: boolean
          template_name?: string
          updated_at?: string
          vehicle_category?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "inspection_templates_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "workshop_users"
            referencedColumns: ["id"]
          },
        ]
      }
      inspector_assignments: {
        Row: {
          accepted_at: string | null
          assigned_at: string
          assigned_by: string | null
          assignment_status: string
          created_at: string
          id: string
          inspection_id: string | null
          inspector_id: string | null
          notes: string | null
        }
        Insert: {
          accepted_at?: string | null
          assigned_at?: string
          assigned_by?: string | null
          assignment_status?: string
          created_at?: string
          id?: string
          inspection_id?: string | null
          inspector_id?: string | null
          notes?: string | null
        }
        Update: {
          accepted_at?: string | null
          assigned_at?: string
          assigned_by?: string | null
          assignment_status?: string
          created_at?: string
          id?: string
          inspection_id?: string | null
          inspector_id?: string | null
          notes?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "inspector_assignments_assigned_by_fkey"
            columns: ["assigned_by"]
            isOneToOne: false
            referencedRelation: "envio_users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "inspector_assignments_inspection_id_fkey"
            columns: ["inspection_id"]
            isOneToOne: false
            referencedRelation: "vehicle_inspections"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "inspector_assignments_inspector_id_fkey"
            columns: ["inspector_id"]
            isOneToOne: false
            referencedRelation: "envio_users"
            referencedColumns: ["id"]
          },
        ]
      }
      invoice_line_items: {
        Row: {
          created_at: string
          description: string
          device_subscription_id: string | null
          id: string
          invoice_id: string | null
          line_total: number
          period_end: string | null
          period_start: string | null
          quantity: number | null
          unit_price: number
        }
        Insert: {
          created_at?: string
          description: string
          device_subscription_id?: string | null
          id?: string
          invoice_id?: string | null
          line_total: number
          period_end?: string | null
          period_start?: string | null
          quantity?: number | null
          unit_price: number
        }
        Update: {
          created_at?: string
          description?: string
          device_subscription_id?: string | null
          id?: string
          invoice_id?: string | null
          line_total?: number
          period_end?: string | null
          period_start?: string | null
          quantity?: number | null
          unit_price?: number
        }
        Relationships: [
          {
            foreignKeyName: "invoice_line_items_device_subscription_id_fkey"
            columns: ["device_subscription_id"]
            isOneToOne: false
            referencedRelation: "device_subscriptions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "invoice_line_items_invoice_id_fkey"
            columns: ["invoice_id"]
            isOneToOne: false
            referencedRelation: "invoices"
            referencedColumns: ["id"]
          },
        ]
      }
      invoices: {
        Row: {
          billing_cycle_id: string | null
          created_at: string
          currency: string | null
          customer_id: string | null
          due_date: string
          id: string
          invoice_data: Json | null
          invoice_date: string
          invoice_number: string
          payment_date: string | null
          payment_method: string | null
          status: string
          stripe_invoice_id: string | null
          subtotal: number
          tax_amount: number
          total_amount: number
          updated_at: string
        }
        Insert: {
          billing_cycle_id?: string | null
          created_at?: string
          currency?: string | null
          customer_id?: string | null
          due_date: string
          id?: string
          invoice_data?: Json | null
          invoice_date: string
          invoice_number: string
          payment_date?: string | null
          payment_method?: string | null
          status?: string
          stripe_invoice_id?: string | null
          subtotal?: number
          tax_amount?: number
          total_amount?: number
          updated_at?: string
        }
        Update: {
          billing_cycle_id?: string | null
          created_at?: string
          currency?: string | null
          customer_id?: string | null
          due_date?: string
          id?: string
          invoice_data?: Json | null
          invoice_date?: string
          invoice_number?: string
          payment_date?: string | null
          payment_method?: string | null
          status?: string
          stripe_invoice_id?: string | null
          subtotal?: number
          tax_amount?: number
          total_amount?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "invoices_billing_cycle_id_fkey"
            columns: ["billing_cycle_id"]
            isOneToOne: false
            referencedRelation: "billing_cycles"
            referencedColumns: ["id"]
          },
        ]
      }
      maintenance_appointments: {
        Row: {
          actual_cost: number | null
          appointment_status: string
          appointment_type: string
          cancellation_reason: string | null
          cancelled_at: string | null
          completed_at: string | null
          confirmed_at: string | null
          created_at: string
          created_by: string | null
          duration_minutes: number
          estimated_cost: number | null
          id: string
          notes: string | null
          scheduled_date: string
          service_description: string | null
          service_plan_id: string | null
          updated_at: string
          user_id: string
          vehicle_id: string
          workshop_id: string
        }
        Insert: {
          actual_cost?: number | null
          appointment_status?: string
          appointment_type: string
          cancellation_reason?: string | null
          cancelled_at?: string | null
          completed_at?: string | null
          confirmed_at?: string | null
          created_at?: string
          created_by?: string | null
          duration_minutes?: number
          estimated_cost?: number | null
          id?: string
          notes?: string | null
          scheduled_date: string
          service_description?: string | null
          service_plan_id?: string | null
          updated_at?: string
          user_id: string
          vehicle_id: string
          workshop_id: string
        }
        Update: {
          actual_cost?: number | null
          appointment_status?: string
          appointment_type?: string
          cancellation_reason?: string | null
          cancelled_at?: string | null
          completed_at?: string | null
          confirmed_at?: string | null
          created_at?: string
          created_by?: string | null
          duration_minutes?: number
          estimated_cost?: number | null
          id?: string
          notes?: string | null
          scheduled_date?: string
          service_description?: string | null
          service_plan_id?: string | null
          updated_at?: string
          user_id?: string
          vehicle_id?: string
          workshop_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "maintenance_appointments_service_plan_id_fkey"
            columns: ["service_plan_id"]
            isOneToOne: false
            referencedRelation: "maintenance_service_plans"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "maintenance_appointments_workshop_id_fkey"
            columns: ["workshop_id"]
            isOneToOne: false
            referencedRelation: "workshops"
            referencedColumns: ["id"]
          },
        ]
      }
      maintenance_notifications: {
        Row: {
          appointment_id: string | null
          created_at: string
          id: string
          is_read: boolean
          message: string
          notification_type: string
          scheduled_for: string
          sent_at: string | null
          title: string
          user_id: string
          vehicle_id: string | null
        }
        Insert: {
          appointment_id?: string | null
          created_at?: string
          id?: string
          is_read?: boolean
          message: string
          notification_type: string
          scheduled_for: string
          sent_at?: string | null
          title: string
          user_id: string
          vehicle_id?: string | null
        }
        Update: {
          appointment_id?: string | null
          created_at?: string
          id?: string
          is_read?: boolean
          message?: string
          notification_type?: string
          scheduled_for?: string
          sent_at?: string | null
          title?: string
          user_id?: string
          vehicle_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "maintenance_notifications_appointment_id_fkey"
            columns: ["appointment_id"]
            isOneToOne: false
            referencedRelation: "maintenance_appointments"
            referencedColumns: ["id"]
          },
        ]
      }
      maintenance_records: {
        Row: {
          appointment_id: string | null
          cost: number | null
          created_at: string
          description: string
          id: string
          maintenance_type: string
          next_maintenance_due: string | null
          parts_used: Json | null
          performed_at: string
          performed_by: string | null
          status: string
          updated_at: string
          vehicle_id: string
        }
        Insert: {
          appointment_id?: string | null
          cost?: number | null
          created_at?: string
          description: string
          id?: string
          maintenance_type: string
          next_maintenance_due?: string | null
          parts_used?: Json | null
          performed_at?: string
          performed_by?: string | null
          status?: string
          updated_at?: string
          vehicle_id: string
        }
        Update: {
          appointment_id?: string | null
          cost?: number | null
          created_at?: string
          description?: string
          id?: string
          maintenance_type?: string
          next_maintenance_due?: string | null
          parts_used?: Json | null
          performed_at?: string
          performed_by?: string | null
          status?: string
          updated_at?: string
          vehicle_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "maintenance_records_appointment_id_fkey"
            columns: ["appointment_id"]
            isOneToOne: false
            referencedRelation: "maintenance_appointments"
            referencedColumns: ["id"]
          },
        ]
      }
      maintenance_schedules: {
        Row: {
          created_at: string
          id: string
          interval_unit: string
          interval_value: number
          is_active: boolean
          last_performed_at: string | null
          maintenance_type: string
          next_due_date: string
          schedule_type: string
          updated_at: string
          vehicle_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          interval_unit: string
          interval_value: number
          is_active?: boolean
          last_performed_at?: string | null
          maintenance_type: string
          next_due_date: string
          schedule_type: string
          updated_at?: string
          vehicle_id: string
        }
        Update: {
          created_at?: string
          id?: string
          interval_unit?: string
          interval_value?: number
          is_active?: boolean
          last_performed_at?: string | null
          maintenance_type?: string
          next_due_date?: string
          schedule_type?: string
          updated_at?: string
          vehicle_id?: string
        }
        Relationships: []
      }
      maintenance_service_plans: {
        Row: {
          base_price: number
          created_at: string
          description: string | null
          duration_hours: number
          id: string
          is_active: boolean
          name: string
          service_types: string[]
          updated_at: string
        }
        Insert: {
          base_price?: number
          created_at?: string
          description?: string | null
          duration_hours?: number
          id?: string
          is_active?: boolean
          name: string
          service_types?: string[]
          updated_at?: string
        }
        Update: {
          base_price?: number
          created_at?: string
          description?: string | null
          duration_hours?: number
          id?: string
          is_active?: boolean
          name?: string
          service_types?: string[]
          updated_at?: string
        }
        Relationships: []
      }
      menu_permissions: {
        Row: {
          created_at: string
          description: string | null
          id: string
          is_active: boolean | null
          menu_code: string
          menu_name: string
          parent_menu_code: string | null
        }
        Insert: {
          created_at?: string
          description?: string | null
          id?: string
          is_active?: boolean | null
          menu_code: string
          menu_name: string
          parent_menu_code?: string | null
        }
        Update: {
          created_at?: string
          description?: string | null
          id?: string
          is_active?: boolean | null
          menu_code?: string
          menu_name?: string
          parent_menu_code?: string | null
        }
        Relationships: []
      }
      notification_preferences: {
        Row: {
          created_at: string
          email_notifications: boolean
          geofence_alerts: boolean
          id: string
          maintenance_alerts: boolean
          system_notifications: boolean
          updated_at: string
          user_id: string
          vehicle_alerts: boolean
        }
        Insert: {
          created_at?: string
          email_notifications?: boolean
          geofence_alerts?: boolean
          id?: string
          maintenance_alerts?: boolean
          system_notifications?: boolean
          updated_at?: string
          user_id: string
          vehicle_alerts?: boolean
        }
        Update: {
          created_at?: string
          email_notifications?: boolean
          geofence_alerts?: boolean
          id?: string
          maintenance_alerts?: boolean
          system_notifications?: boolean
          updated_at?: string
          user_id?: string
          vehicle_alerts?: boolean
        }
        Relationships: [
          {
            foreignKeyName: "notification_preferences_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: true
            referencedRelation: "envio_users"
            referencedColumns: ["id"]
          },
        ]
      }
      notification_settings: {
        Row: {
          created_at: string | null
          email_type: string
          id: string
          is_enabled: boolean | null
          retry_attempts: number | null
          retry_delay_minutes: number | null
          template_id: string | null
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          email_type: string
          id?: string
          is_enabled?: boolean | null
          retry_attempts?: number | null
          retry_delay_minutes?: number | null
          template_id?: string | null
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          email_type?: string
          id?: string
          is_enabled?: boolean | null
          retry_attempts?: number | null
          retry_delay_minutes?: number | null
          template_id?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
      otp_verifications: {
        Row: {
          attempts_count: number | null
          created_at: string
          email: string | null
          expires_at: string
          id: string
          is_used: boolean | null
          max_attempts: number | null
          otp_code: string
          otp_type: string
          phone_number: string | null
          updated_at: string
          user_id: string | null
          verified_at: string | null
        }
        Insert: {
          attempts_count?: number | null
          created_at?: string
          email?: string | null
          expires_at: string
          id?: string
          is_used?: boolean | null
          max_attempts?: number | null
          otp_code: string
          otp_type: string
          phone_number?: string | null
          updated_at?: string
          user_id?: string | null
          verified_at?: string | null
        }
        Update: {
          attempts_count?: number | null
          created_at?: string
          email?: string | null
          expires_at?: string
          id?: string
          is_used?: boolean | null
          max_attempts?: number | null
          otp_code?: string
          otp_type?: string
          phone_number?: string | null
          updated_at?: string
          user_id?: string | null
          verified_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "otp_verifications_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "envio_users"
            referencedColumns: ["id"]
          },
        ]
      }
      package_feature_assignments: {
        Row: {
          assigned_at: string
          feature_id: string
          id: string
          package_id: string
        }
        Insert: {
          assigned_at?: string
          feature_id: string
          id?: string
          package_id: string
        }
        Update: {
          assigned_at?: string
          feature_id?: string
          id?: string
          package_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "package_feature_assignments_feature_id_fkey"
            columns: ["feature_id"]
            isOneToOne: false
            referencedRelation: "package_features"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "package_feature_assignments_package_id_fkey"
            columns: ["package_id"]
            isOneToOne: false
            referencedRelation: "subscriber_packages"
            referencedColumns: ["id"]
          },
        ]
      }
      package_features: {
        Row: {
          category: string | null
          created_at: string
          description: string | null
          feature_id: string
          feature_name: string
          id: string
          is_active: boolean | null
        }
        Insert: {
          category?: string | null
          created_at?: string
          description?: string | null
          feature_id: string
          feature_name: string
          id?: string
          is_active?: boolean | null
        }
        Update: {
          category?: string | null
          created_at?: string
          description?: string | null
          feature_id?: string
          feature_name?: string
          id?: string
          is_active?: boolean | null
        }
        Relationships: []
      }
      package_menu_permissions: {
        Row: {
          assigned_at: string
          id: string
          menu_permission_id: string
          package_id: string
        }
        Insert: {
          assigned_at?: string
          id?: string
          menu_permission_id: string
          package_id: string
        }
        Update: {
          assigned_at?: string
          id?: string
          menu_permission_id?: string
          package_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "package_menu_permissions_menu_permission_id_fkey"
            columns: ["menu_permission_id"]
            isOneToOne: false
            referencedRelation: "menu_permissions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "package_menu_permissions_package_id_fkey"
            columns: ["package_id"]
            isOneToOne: false
            referencedRelation: "subscriber_packages"
            referencedColumns: ["id"]
          },
        ]
      }
      payment_methods: {
        Row: {
          billing_address: Json | null
          card_brand: string | null
          card_exp_month: number | null
          card_exp_year: number | null
          card_last_four: string | null
          created_at: string
          customer_id: string | null
          id: string
          is_active: boolean | null
          is_default: boolean | null
          method_type: string
          stripe_payment_method_id: string | null
          updated_at: string
        }
        Insert: {
          billing_address?: Json | null
          card_brand?: string | null
          card_exp_month?: number | null
          card_exp_year?: number | null
          card_last_four?: string | null
          created_at?: string
          customer_id?: string | null
          id?: string
          is_active?: boolean | null
          is_default?: boolean | null
          method_type: string
          stripe_payment_method_id?: string | null
          updated_at?: string
        }
        Update: {
          billing_address?: Json | null
          card_brand?: string | null
          card_exp_month?: number | null
          card_exp_year?: number | null
          card_last_four?: string | null
          created_at?: string
          customer_id?: string | null
          id?: string
          is_active?: boolean | null
          is_default?: boolean | null
          method_type?: string
          stripe_payment_method_id?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      pending_user_registrations: {
        Row: {
          admin_assigned_user_type: number | null
          assigned_by_admin: string | null
          city: string
          completed_at: string | null
          created_at: string
          email: string
          gp51_username: string | null
          id: string
          name: string
          otp_verification_id: string | null
          phone_number: string
          registration_source: string | null
          status: string | null
          updated_at: string
        }
        Insert: {
          admin_assigned_user_type?: number | null
          assigned_by_admin?: string | null
          city: string
          completed_at?: string | null
          created_at?: string
          email: string
          gp51_username?: string | null
          id?: string
          name: string
          otp_verification_id?: string | null
          phone_number: string
          registration_source?: string | null
          status?: string | null
          updated_at?: string
        }
        Update: {
          admin_assigned_user_type?: number | null
          assigned_by_admin?: string | null
          city?: string
          completed_at?: string | null
          created_at?: string
          email?: string
          gp51_username?: string | null
          id?: string
          name?: string
          otp_verification_id?: string | null
          phone_number?: string
          registration_source?: string | null
          status?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "pending_user_registrations_otp_verification_id_fkey"
            columns: ["otp_verification_id"]
            isOneToOne: false
            referencedRelation: "otp_verifications"
            referencedColumns: ["id"]
          },
        ]
      }
      performance_alerts: {
        Row: {
          acknowledged: boolean | null
          acknowledged_at: string | null
          alert_type: string
          created_at: string
          id: string
          message: string
          metadata: Json | null
          resolved: boolean | null
          resolved_at: string | null
          severity: string
        }
        Insert: {
          acknowledged?: boolean | null
          acknowledged_at?: string | null
          alert_type: string
          created_at?: string
          id?: string
          message: string
          metadata?: Json | null
          resolved?: boolean | null
          resolved_at?: string | null
          severity: string
        }
        Update: {
          acknowledged?: boolean | null
          acknowledged_at?: string | null
          alert_type?: string
          created_at?: string
          id?: string
          message?: string
          metadata?: Json | null
          resolved?: boolean | null
          resolved_at?: string | null
          severity?: string
        }
        Relationships: []
      }
      position_logs: {
        Row: {
          alarm: number | null
          alarm_text: string | null
          altitude: number | null
          course: number | null
          created_at: string
          device_id: string
          gps_time: string
          id: string
          latitude: number
          longitude: number
          server_time: string
          speed: number | null
          status: number | null
          status_text: string | null
          total_distance: number | null
          updated_at: string
        }
        Insert: {
          alarm?: number | null
          alarm_text?: string | null
          altitude?: number | null
          course?: number | null
          created_at?: string
          device_id: string
          gps_time: string
          id?: string
          latitude: number
          longitude: number
          server_time: string
          speed?: number | null
          status?: number | null
          status_text?: string | null
          total_distance?: number | null
          updated_at?: string
        }
        Update: {
          alarm?: number | null
          alarm_text?: string | null
          altitude?: number | null
          course?: number | null
          created_at?: string
          device_id?: string
          gps_time?: string
          id?: string
          latitude?: number
          longitude?: number
          server_time?: string
          speed?: number | null
          status?: number | null
          status_text?: string | null
          total_distance?: number | null
          updated_at?: string
        }
        Relationships: []
      }
      referral_codes: {
        Row: {
          code: string
          created_at: string
          created_by: string | null
          discount_percentage: number | null
          expires_at: string | null
          id: string
          is_active: boolean | null
          usage_count: number | null
          usage_limit: number | null
        }
        Insert: {
          code: string
          created_at?: string
          created_by?: string | null
          discount_percentage?: number | null
          expires_at?: string | null
          id?: string
          is_active?: boolean | null
          usage_count?: number | null
          usage_limit?: number | null
        }
        Update: {
          code?: string
          created_at?: string
          created_by?: string | null
          discount_percentage?: number | null
          expires_at?: string | null
          id?: string
          is_active?: boolean | null
          usage_count?: number | null
          usage_limit?: number | null
        }
        Relationships: []
      }
      registration_audit_log: {
        Row: {
          action_description: string | null
          action_type: string
          created_at: string
          id: string
          ip_address: unknown | null
          metadata: Json | null
          new_values: Json | null
          old_values: Json | null
          otp_verified: boolean | null
          performed_by: string | null
          registration_id: string | null
          registration_status: string | null
          selected_role: string | null
          user_agent: string | null
          user_email: string | null
          user_id: string | null
          user_name: string | null
        }
        Insert: {
          action_description?: string | null
          action_type: string
          created_at?: string
          id?: string
          ip_address?: unknown | null
          metadata?: Json | null
          new_values?: Json | null
          old_values?: Json | null
          otp_verified?: boolean | null
          performed_by?: string | null
          registration_id?: string | null
          registration_status?: string | null
          selected_role?: string | null
          user_agent?: string | null
          user_email?: string | null
          user_id?: string | null
          user_name?: string | null
        }
        Update: {
          action_description?: string | null
          action_type?: string
          created_at?: string
          id?: string
          ip_address?: unknown | null
          metadata?: Json | null
          new_values?: Json | null
          old_values?: Json | null
          otp_verified?: boolean | null
          performed_by?: string | null
          registration_id?: string | null
          registration_status?: string | null
          selected_role?: string | null
          user_agent?: string | null
          user_email?: string | null
          user_id?: string | null
          user_name?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "registration_audit_log_registration_id_fkey"
            columns: ["registration_id"]
            isOneToOne: false
            referencedRelation: "pending_user_registrations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "registration_audit_log_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "envio_users"
            referencedColumns: ["id"]
          },
        ]
      }
      secure_sessions: {
        Row: {
          created_at: string
          device_info: Json | null
          expires_at: string
          id: string
          ip_address: unknown | null
          is_active: boolean
          last_activity: string | null
          revoked_at: string | null
          revoked_reason: string | null
          session_fingerprint: string
          session_token: string
          user_agent: string | null
          user_id: string
        }
        Insert: {
          created_at?: string
          device_info?: Json | null
          expires_at: string
          id?: string
          ip_address?: unknown | null
          is_active?: boolean
          last_activity?: string | null
          revoked_at?: string | null
          revoked_reason?: string | null
          session_fingerprint: string
          session_token: string
          user_agent?: string | null
          user_id: string
        }
        Update: {
          created_at?: string
          device_info?: Json | null
          expires_at?: string
          id?: string
          ip_address?: unknown | null
          is_active?: boolean
          last_activity?: string | null
          revoked_at?: string | null
          revoked_reason?: string | null
          session_fingerprint?: string
          session_token?: string
          user_agent?: string | null
          user_id?: string
        }
        Relationships: []
      }
      security_audit_logs: {
        Row: {
          action_type: string
          created_at: string
          error_message: string | null
          id: string
          ip_address: unknown | null
          request_details: Json | null
          resource_id: string | null
          resource_type: string | null
          response_status: number | null
          risk_level: string
          session_id: string | null
          success: boolean
          timestamp: string
          user_agent: string | null
          user_id: string | null
        }
        Insert: {
          action_type: string
          created_at?: string
          error_message?: string | null
          id?: string
          ip_address?: unknown | null
          request_details?: Json | null
          resource_id?: string | null
          resource_type?: string | null
          response_status?: number | null
          risk_level?: string
          session_id?: string | null
          success?: boolean
          timestamp?: string
          user_agent?: string | null
          user_id?: string | null
        }
        Update: {
          action_type?: string
          created_at?: string
          error_message?: string | null
          id?: string
          ip_address?: unknown | null
          request_details?: Json | null
          resource_id?: string | null
          resource_type?: string | null
          response_status?: number | null
          risk_level?: string
          session_id?: string | null
          success?: boolean
          timestamp?: string
          user_agent?: string | null
          user_id?: string | null
        }
        Relationships: []
      }
      service_plans: {
        Row: {
          created_at: string
          description: string | null
          features: Json | null
          id: string
          is_active: boolean | null
          plan_code: string
          plan_name: string
          price_1_year: number | null
          price_10_year: number | null
          price_3_year: number | null
          price_5_year: number | null
          sort_order: number | null
          updated_at: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          features?: Json | null
          id?: string
          is_active?: boolean | null
          plan_code: string
          plan_name: string
          price_1_year?: number | null
          price_10_year?: number | null
          price_3_year?: number | null
          price_5_year?: number | null
          sort_order?: number | null
          updated_at?: string
        }
        Update: {
          created_at?: string
          description?: string | null
          features?: Json | null
          id?: string
          is_active?: boolean | null
          plan_code?: string
          plan_name?: string
          price_1_year?: number | null
          price_10_year?: number | null
          price_3_year?: number | null
          price_5_year?: number | null
          sort_order?: number | null
          updated_at?: string
        }
        Relationships: []
      }
      smtp_configurations: {
        Row: {
          created_at: string
          id: string
          is_active: boolean
          is_default: boolean
          provider_name: string
          smtp_host: string
          smtp_pass_encrypted: string
          smtp_port: number
          smtp_user: string
          updated_at: string
          use_ssl: boolean
          use_tls: boolean
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          is_active?: boolean
          is_default?: boolean
          provider_name?: string
          smtp_host: string
          smtp_pass_encrypted: string
          smtp_port?: number
          smtp_user: string
          updated_at?: string
          use_ssl?: boolean
          use_tls?: boolean
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          is_active?: boolean
          is_default?: boolean
          provider_name?: string
          smtp_host?: string
          smtp_pass_encrypted?: string
          smtp_port?: number
          smtp_user?: string
          updated_at?: string
          use_ssl?: boolean
          use_tls?: boolean
          user_id?: string
        }
        Relationships: []
      }
      subscriber_packages: {
        Row: {
          created_at: string
          created_by: string | null
          description: string | null
          id: string
          is_active: boolean | null
          package_name: string
          referral_discount_percentage: number | null
          subscription_fee_annually: number | null
          subscription_fee_monthly: number | null
          updated_at: string
          user_type: string
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          description?: string | null
          id?: string
          is_active?: boolean | null
          package_name: string
          referral_discount_percentage?: number | null
          subscription_fee_annually?: number | null
          subscription_fee_monthly?: number | null
          updated_at?: string
          user_type: string
        }
        Update: {
          created_at?: string
          created_by?: string | null
          description?: string | null
          id?: string
          is_active?: boolean | null
          package_name?: string
          referral_discount_percentage?: number | null
          subscription_fee_annually?: number | null
          subscription_fee_monthly?: number | null
          updated_at?: string
          user_type?: string
        }
        Relationships: []
      }
      subscription_history: {
        Row: {
          action_description: string | null
          action_type: string
          created_at: string
          device_subscription_id: string | null
          id: string
          new_values: Json | null
          old_values: Json | null
          performed_by: string | null
        }
        Insert: {
          action_description?: string | null
          action_type: string
          created_at?: string
          device_subscription_id?: string | null
          id?: string
          new_values?: Json | null
          old_values?: Json | null
          performed_by?: string | null
        }
        Update: {
          action_description?: string | null
          action_type?: string
          created_at?: string
          device_subscription_id?: string | null
          id?: string
          new_values?: Json | null
          old_values?: Json | null
          performed_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "subscription_history_device_subscription_id_fkey"
            columns: ["device_subscription_id"]
            isOneToOne: false
            referencedRelation: "device_subscriptions"
            referencedColumns: ["id"]
          },
        ]
      }
      theme_settings: {
        Row: {
          created_at: string
          id: string
          theme_data: Json
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          theme_data: Json
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          theme_data?: Json
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      user_email_preferences: {
        Row: {
          created_at: string
          email_notifications: boolean
          id: string
          maintenance_reminders: boolean
          marketing_emails: boolean
          system_updates: boolean
          updated_at: string
          user_id: string
          vehicle_alerts: boolean
          weekly_reports: boolean
        }
        Insert: {
          created_at?: string
          email_notifications?: boolean
          id?: string
          maintenance_reminders?: boolean
          marketing_emails?: boolean
          system_updates?: boolean
          updated_at?: string
          user_id: string
          vehicle_alerts?: boolean
          weekly_reports?: boolean
        }
        Update: {
          created_at?: string
          email_notifications?: boolean
          id?: string
          maintenance_reminders?: boolean
          marketing_emails?: boolean
          system_updates?: boolean
          updated_at?: string
          user_id?: string
          vehicle_alerts?: boolean
          weekly_reports?: boolean
        }
        Relationships: []
      }
      user_group_assignments: {
        Row: {
          assigned_at: string
          assigned_by: string | null
          id: string
          user_group_id: string
          user_id: string
        }
        Insert: {
          assigned_at?: string
          assigned_by?: string | null
          id?: string
          user_group_id: string
          user_id: string
        }
        Update: {
          assigned_at?: string
          assigned_by?: string | null
          id?: string
          user_group_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_group_assignments_assigned_by_fkey"
            columns: ["assigned_by"]
            isOneToOne: false
            referencedRelation: "envio_users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "user_group_assignments_user_group_id_fkey"
            columns: ["user_group_id"]
            isOneToOne: false
            referencedRelation: "user_groups"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "user_group_assignments_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "envio_users"
            referencedColumns: ["id"]
          },
        ]
      }
      user_groups: {
        Row: {
          created_at: string
          description: string | null
          gp51_group_id: number
          id: string
          name: string
          parent_group_id: string | null
          updated_at: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          gp51_group_id: number
          id?: string
          name: string
          parent_group_id?: string | null
          updated_at?: string
        }
        Update: {
          created_at?: string
          description?: string | null
          gp51_group_id?: number
          id?: string
          name?: string
          parent_group_id?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_groups_parent_group_id_fkey"
            columns: ["parent_group_id"]
            isOneToOne: false
            referencedRelation: "user_groups"
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
          current_step: string | null
          error_log: Json | null
          failed_imports: number
          id: string
          import_results: Json | null
          import_scope: string | null
          import_type: string
          imported_usernames: Json | null
          job_name: string
          preview_mode: boolean | null
          processed_usernames: number
          progress_percentage: number | null
          review_status: string | null
          reviewed_at: string | null
          reviewed_by: string | null
          rollback_available: boolean | null
          status: string
          step_details: string | null
          successful_imports: number
          total_devices_imported: number | null
          total_usernames: number
          total_vehicles_imported: number
          updated_at: string
        }
        Insert: {
          admin_gp51_username?: string | null
          completed_at?: string | null
          conflicts_count?: number | null
          created_at?: string
          current_step?: string | null
          error_log?: Json | null
          failed_imports?: number
          id?: string
          import_results?: Json | null
          import_scope?: string | null
          import_type?: string
          imported_usernames?: Json | null
          job_name: string
          preview_mode?: boolean | null
          processed_usernames?: number
          progress_percentage?: number | null
          review_status?: string | null
          reviewed_at?: string | null
          reviewed_by?: string | null
          rollback_available?: boolean | null
          status?: string
          step_details?: string | null
          successful_imports?: number
          total_devices_imported?: number | null
          total_usernames?: number
          total_vehicles_imported?: number
          updated_at?: string
        }
        Update: {
          admin_gp51_username?: string | null
          completed_at?: string | null
          conflicts_count?: number | null
          created_at?: string
          current_step?: string | null
          error_log?: Json | null
          failed_imports?: number
          id?: string
          import_results?: Json | null
          import_scope?: string | null
          import_type?: string
          imported_usernames?: Json | null
          job_name?: string
          preview_mode?: boolean | null
          processed_usernames?: number
          progress_percentage?: number | null
          review_status?: string | null
          reviewed_at?: string | null
          reviewed_by?: string | null
          rollback_available?: boolean | null
          status?: string
          step_details?: string | null
          successful_imports?: number
          total_devices_imported?: number | null
          total_usernames?: number
          total_vehicles_imported?: number
          updated_at?: string
        }
        Relationships: []
      }
      user_notification_preferences: {
        Row: {
          browser_notifications: boolean | null
          created_at: string | null
          email_notifications: boolean | null
          id: string
          import_completion: boolean | null
          import_failure: boolean | null
          import_progress: boolean | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          browser_notifications?: boolean | null
          created_at?: string | null
          email_notifications?: boolean | null
          id?: string
          import_completion?: boolean | null
          import_failure?: boolean | null
          import_progress?: boolean | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          browser_notifications?: boolean | null
          created_at?: string | null
          email_notifications?: boolean | null
          id?: string
          import_completion?: boolean | null
          import_failure?: boolean | null
          import_progress?: boolean | null
          updated_at?: string | null
          user_id?: string
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
      user_roles_backup_2025_06_06_09_53_33: {
        Row: {
          created_at: string | null
          id: string | null
          role: Database["public"]["Enums"]["app_role"] | null
          updated_at: string | null
          user_id: string | null
        }
        Insert: {
          created_at?: string | null
          id?: string | null
          role?: Database["public"]["Enums"]["app_role"] | null
          updated_at?: string | null
          user_id?: string | null
        }
        Update: {
          created_at?: string | null
          id?: string | null
          role?: Database["public"]["Enums"]["app_role"] | null
          updated_at?: string | null
          user_id?: string | null
        }
        Relationships: []
      }
      user_roles_backup_2025_06_06_10_05_23: {
        Row: {
          created_at: string | null
          id: string | null
          role: Database["public"]["Enums"]["app_role"] | null
          updated_at: string | null
          user_id: string | null
        }
        Insert: {
          created_at?: string | null
          id?: string | null
          role?: Database["public"]["Enums"]["app_role"] | null
          updated_at?: string | null
          user_id?: string | null
        }
        Update: {
          created_at?: string | null
          id?: string | null
          role?: Database["public"]["Enums"]["app_role"] | null
          updated_at?: string | null
          user_id?: string | null
        }
        Relationships: []
      }
      user_roles_backup_2025_06_06_10_34_58: {
        Row: {
          created_at: string | null
          id: string | null
          role: Database["public"]["Enums"]["app_role"] | null
          updated_at: string | null
          user_id: string | null
        }
        Insert: {
          created_at?: string | null
          id?: string | null
          role?: Database["public"]["Enums"]["app_role"] | null
          updated_at?: string | null
          user_id?: string | null
        }
        Update: {
          created_at?: string | null
          id?: string | null
          role?: Database["public"]["Enums"]["app_role"] | null
          updated_at?: string | null
          user_id?: string | null
        }
        Relationships: []
      }
      user_roles_backup_2025_06_06_16_18_27: {
        Row: {
          created_at: string | null
          id: string | null
          role: Database["public"]["Enums"]["app_role"] | null
          updated_at: string | null
          user_id: string | null
        }
        Insert: {
          created_at?: string | null
          id?: string | null
          role?: Database["public"]["Enums"]["app_role"] | null
          updated_at?: string | null
          user_id?: string | null
        }
        Update: {
          created_at?: string | null
          id?: string | null
          role?: Database["public"]["Enums"]["app_role"] | null
          updated_at?: string | null
          user_id?: string | null
        }
        Relationships: []
      }
      user_roles_backup_2025_06_06_16_31_04: {
        Row: {
          created_at: string | null
          id: string | null
          role: Database["public"]["Enums"]["app_role"] | null
          updated_at: string | null
          user_id: string | null
        }
        Insert: {
          created_at?: string | null
          id?: string | null
          role?: Database["public"]["Enums"]["app_role"] | null
          updated_at?: string | null
          user_id?: string | null
        }
        Update: {
          created_at?: string | null
          id?: string | null
          role?: Database["public"]["Enums"]["app_role"] | null
          updated_at?: string | null
          user_id?: string | null
        }
        Relationships: []
      }
      user_roles_backup_full_import: {
        Row: {
          created_at: string | null
          id: string | null
          role: Database["public"]["Enums"]["app_role"] | null
          updated_at: string | null
          user_id: string | null
        }
        Insert: {
          created_at?: string | null
          id?: string | null
          role?: Database["public"]["Enums"]["app_role"] | null
          updated_at?: string | null
          user_id?: string | null
        }
        Update: {
          created_at?: string | null
          id?: string | null
          role?: Database["public"]["Enums"]["app_role"] | null
          updated_at?: string | null
          user_id?: string | null
        }
        Relationships: []
      }
      user_subscriptions: {
        Row: {
          billing_cycle: string
          created_at: string
          discount_applied: number | null
          end_date: string | null
          id: string
          package_id: string
          referral_code_used: string | null
          start_date: string
          subscription_status: string
          updated_at: string
          user_id: string
        }
        Insert: {
          billing_cycle?: string
          created_at?: string
          discount_applied?: number | null
          end_date?: string | null
          id?: string
          package_id: string
          referral_code_used?: string | null
          start_date?: string
          subscription_status?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          billing_cycle?: string
          created_at?: string
          discount_applied?: number | null
          end_date?: string | null
          id?: string
          package_id?: string
          referral_code_used?: string | null
          start_date?: string
          subscription_status?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_subscriptions_package_id_fkey"
            columns: ["package_id"]
            isOneToOne: false
            referencedRelation: "subscriber_packages"
            referencedColumns: ["id"]
          },
        ]
      }
      users_backup_20250605: {
        Row: {
          city: string | null
          created_at: string | null
          email: string | null
          gp51_user_type: number | null
          gp51_username: string | null
          id: string | null
          import_source: string | null
          is_gp51_imported: boolean | null
          name: string | null
          needs_password_set: boolean | null
          otp_verified_at: string | null
          phone_number: string | null
          registration_status: string | null
          registration_type: string | null
          updated_at: string | null
        }
        Insert: {
          city?: string | null
          created_at?: string | null
          email?: string | null
          gp51_user_type?: number | null
          gp51_username?: string | null
          id?: string | null
          import_source?: string | null
          is_gp51_imported?: boolean | null
          name?: string | null
          needs_password_set?: boolean | null
          otp_verified_at?: string | null
          phone_number?: string | null
          registration_status?: string | null
          registration_type?: string | null
          updated_at?: string | null
        }
        Update: {
          city?: string | null
          created_at?: string | null
          email?: string | null
          gp51_user_type?: number | null
          gp51_username?: string | null
          id?: string | null
          import_source?: string | null
          is_gp51_imported?: boolean | null
          name?: string | null
          needs_password_set?: boolean | null
          otp_verified_at?: string | null
          phone_number?: string | null
          registration_status?: string | null
          registration_type?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
      vehicle_assignment_backup_20250605: {
        Row: {
          device_id: string | null
          device_name: string | null
          envio_user_id: string | null
          gp51_username: string | null
          id: string | null
          updated_at: string | null
        }
        Insert: {
          device_id?: string | null
          device_name?: string | null
          envio_user_id?: string | null
          gp51_username?: string | null
          id?: string | null
          updated_at?: string | null
        }
        Update: {
          device_id?: string | null
          device_name?: string | null
          envio_user_id?: string | null
          gp51_username?: string | null
          id?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
      vehicle_inspections: {
        Row: {
          actual_duration_minutes: number | null
          completed_at: string | null
          created_at: string
          created_by: string | null
          estimated_duration_hours: number | null
          id: string
          inspection_notes: string | null
          inspection_status: string
          inspection_type: string
          inspector_id: string | null
          overall_result: string | null
          scheduled_date: string
          started_at: string | null
          updated_at: string
          vehicle_id: string
          workshop_id: string
        }
        Insert: {
          actual_duration_minutes?: number | null
          completed_at?: string | null
          created_at?: string
          created_by?: string | null
          estimated_duration_hours?: number | null
          id?: string
          inspection_notes?: string | null
          inspection_status?: string
          inspection_type: string
          inspector_id?: string | null
          overall_result?: string | null
          scheduled_date: string
          started_at?: string | null
          updated_at?: string
          vehicle_id: string
          workshop_id: string
        }
        Update: {
          actual_duration_minutes?: number | null
          completed_at?: string | null
          created_at?: string
          created_by?: string | null
          estimated_duration_hours?: number | null
          id?: string
          inspection_notes?: string | null
          inspection_status?: string
          inspection_type?: string
          inspector_id?: string | null
          overall_result?: string | null
          scheduled_date?: string
          started_at?: string | null
          updated_at?: string
          vehicle_id?: string
          workshop_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "vehicle_inspections_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "workshop_users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "vehicle_inspections_inspector_id_fkey"
            columns: ["inspector_id"]
            isOneToOne: false
            referencedRelation: "workshop_users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "vehicle_inspections_workshop_id_fkey"
            columns: ["workshop_id"]
            isOneToOne: false
            referencedRelation: "workshops"
            referencedColumns: ["id"]
          },
        ]
      }
      vehicle_position_cache: {
        Row: {
          device_id: string
          last_position: Json
          last_updated: string
          metadata: Json | null
          status: string
        }
        Insert: {
          device_id: string
          last_position: Json
          last_updated?: string
          metadata?: Json | null
          status?: string
        }
        Update: {
          device_id?: string
          last_position?: Json
          last_updated?: string
          metadata?: Json | null
          status?: string
        }
        Relationships: []
      }
      vehicle_routes: {
        Row: {
          avg_speed: number | null
          created_at: string
          device_id: string
          end_location: Json | null
          id: string
          max_speed: number | null
          route_date: string
          route_points: Json
          start_location: Json | null
          total_distance: number | null
          total_duration: number | null
        }
        Insert: {
          avg_speed?: number | null
          created_at?: string
          device_id: string
          end_location?: Json | null
          id?: string
          max_speed?: number | null
          route_date: string
          route_points: Json
          start_location?: Json | null
          total_distance?: number | null
          total_duration?: number | null
        }
        Update: {
          avg_speed?: number | null
          created_at?: string
          device_id?: string
          end_location?: Json | null
          id?: string
          max_speed?: number | null
          route_date?: string
          route_points?: Json
          start_location?: Json | null
          total_distance?: number | null
          total_duration?: number | null
        }
        Relationships: []
      }
      vehicles: {
        Row: {
          created_at: string
          device_id: string
          device_name: string
          device_type: string | null
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
          device_type?: string | null
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
          device_type?: string | null
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
      vehicles_backup_2025_06_06_09_53_33: {
        Row: {
          created_at: string | null
          device_id: string | null
          device_name: string | null
          envio_user_id: string | null
          extraction_job_id: string | null
          gp51_metadata: Json | null
          gp51_username: string | null
          id: string | null
          import_job_type: string | null
          is_active: boolean | null
          last_position: Json | null
          notes: string | null
          session_id: string | null
          sim_number: string | null
          status: string | null
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          device_id?: string | null
          device_name?: string | null
          envio_user_id?: string | null
          extraction_job_id?: string | null
          gp51_metadata?: Json | null
          gp51_username?: string | null
          id?: string | null
          import_job_type?: string | null
          is_active?: boolean | null
          last_position?: Json | null
          notes?: string | null
          session_id?: string | null
          sim_number?: string | null
          status?: string | null
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          device_id?: string | null
          device_name?: string | null
          envio_user_id?: string | null
          extraction_job_id?: string | null
          gp51_metadata?: Json | null
          gp51_username?: string | null
          id?: string | null
          import_job_type?: string | null
          is_active?: boolean | null
          last_position?: Json | null
          notes?: string | null
          session_id?: string | null
          sim_number?: string | null
          status?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
      vehicles_backup_2025_06_06_10_05_23: {
        Row: {
          created_at: string | null
          device_id: string | null
          device_name: string | null
          envio_user_id: string | null
          extraction_job_id: string | null
          gp51_metadata: Json | null
          gp51_username: string | null
          id: string | null
          import_job_type: string | null
          is_active: boolean | null
          last_position: Json | null
          notes: string | null
          session_id: string | null
          sim_number: string | null
          status: string | null
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          device_id?: string | null
          device_name?: string | null
          envio_user_id?: string | null
          extraction_job_id?: string | null
          gp51_metadata?: Json | null
          gp51_username?: string | null
          id?: string | null
          import_job_type?: string | null
          is_active?: boolean | null
          last_position?: Json | null
          notes?: string | null
          session_id?: string | null
          sim_number?: string | null
          status?: string | null
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          device_id?: string | null
          device_name?: string | null
          envio_user_id?: string | null
          extraction_job_id?: string | null
          gp51_metadata?: Json | null
          gp51_username?: string | null
          id?: string | null
          import_job_type?: string | null
          is_active?: boolean | null
          last_position?: Json | null
          notes?: string | null
          session_id?: string | null
          sim_number?: string | null
          status?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
      vehicles_backup_2025_06_06_10_34_58: {
        Row: {
          created_at: string | null
          device_id: string | null
          device_name: string | null
          envio_user_id: string | null
          extraction_job_id: string | null
          gp51_metadata: Json | null
          gp51_username: string | null
          id: string | null
          import_job_type: string | null
          is_active: boolean | null
          last_position: Json | null
          notes: string | null
          session_id: string | null
          sim_number: string | null
          status: string | null
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          device_id?: string | null
          device_name?: string | null
          envio_user_id?: string | null
          extraction_job_id?: string | null
          gp51_metadata?: Json | null
          gp51_username?: string | null
          id?: string | null
          import_job_type?: string | null
          is_active?: boolean | null
          last_position?: Json | null
          notes?: string | null
          session_id?: string | null
          sim_number?: string | null
          status?: string | null
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          device_id?: string | null
          device_name?: string | null
          envio_user_id?: string | null
          extraction_job_id?: string | null
          gp51_metadata?: Json | null
          gp51_username?: string | null
          id?: string | null
          import_job_type?: string | null
          is_active?: boolean | null
          last_position?: Json | null
          notes?: string | null
          session_id?: string | null
          sim_number?: string | null
          status?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
      vehicles_backup_2025_06_06_16_18_27: {
        Row: {
          created_at: string | null
          device_id: string | null
          device_name: string | null
          envio_user_id: string | null
          extraction_job_id: string | null
          gp51_metadata: Json | null
          gp51_username: string | null
          id: string | null
          import_job_type: string | null
          is_active: boolean | null
          last_position: Json | null
          notes: string | null
          session_id: string | null
          sim_number: string | null
          status: string | null
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          device_id?: string | null
          device_name?: string | null
          envio_user_id?: string | null
          extraction_job_id?: string | null
          gp51_metadata?: Json | null
          gp51_username?: string | null
          id?: string | null
          import_job_type?: string | null
          is_active?: boolean | null
          last_position?: Json | null
          notes?: string | null
          session_id?: string | null
          sim_number?: string | null
          status?: string | null
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          device_id?: string | null
          device_name?: string | null
          envio_user_id?: string | null
          extraction_job_id?: string | null
          gp51_metadata?: Json | null
          gp51_username?: string | null
          id?: string | null
          import_job_type?: string | null
          is_active?: boolean | null
          last_position?: Json | null
          notes?: string | null
          session_id?: string | null
          sim_number?: string | null
          status?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
      vehicles_backup_2025_06_06_16_31_04: {
        Row: {
          created_at: string | null
          device_id: string | null
          device_name: string | null
          device_type: string | null
          envio_user_id: string | null
          extraction_job_id: string | null
          gp51_metadata: Json | null
          gp51_username: string | null
          id: string | null
          import_job_type: string | null
          is_active: boolean | null
          last_position: Json | null
          notes: string | null
          session_id: string | null
          sim_number: string | null
          status: string | null
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          device_id?: string | null
          device_name?: string | null
          device_type?: string | null
          envio_user_id?: string | null
          extraction_job_id?: string | null
          gp51_metadata?: Json | null
          gp51_username?: string | null
          id?: string | null
          import_job_type?: string | null
          is_active?: boolean | null
          last_position?: Json | null
          notes?: string | null
          session_id?: string | null
          sim_number?: string | null
          status?: string | null
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          device_id?: string | null
          device_name?: string | null
          device_type?: string | null
          envio_user_id?: string | null
          extraction_job_id?: string | null
          gp51_metadata?: Json | null
          gp51_username?: string | null
          id?: string | null
          import_job_type?: string | null
          is_active?: boolean | null
          last_position?: Json | null
          notes?: string | null
          session_id?: string | null
          sim_number?: string | null
          status?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
      vehicles_backup_20250605: {
        Row: {
          created_at: string | null
          device_id: string | null
          device_name: string | null
          envio_user_id: string | null
          extraction_job_id: string | null
          gp51_metadata: Json | null
          gp51_username: string | null
          id: string | null
          import_job_type: string | null
          is_active: boolean | null
          last_position: Json | null
          notes: string | null
          session_id: string | null
          sim_number: string | null
          status: string | null
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          device_id?: string | null
          device_name?: string | null
          envio_user_id?: string | null
          extraction_job_id?: string | null
          gp51_metadata?: Json | null
          gp51_username?: string | null
          id?: string | null
          import_job_type?: string | null
          is_active?: boolean | null
          last_position?: Json | null
          notes?: string | null
          session_id?: string | null
          sim_number?: string | null
          status?: string | null
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          device_id?: string | null
          device_name?: string | null
          envio_user_id?: string | null
          extraction_job_id?: string | null
          gp51_metadata?: Json | null
          gp51_username?: string | null
          id?: string | null
          import_job_type?: string | null
          is_active?: boolean | null
          last_position?: Json | null
          notes?: string | null
          session_id?: string | null
          sim_number?: string | null
          status?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
      vehicles_backup_full_import: {
        Row: {
          created_at: string | null
          device_id: string | null
          device_name: string | null
          envio_user_id: string | null
          extraction_job_id: string | null
          gp51_metadata: Json | null
          gp51_username: string | null
          id: string | null
          import_job_type: string | null
          is_active: boolean | null
          last_position: Json | null
          notes: string | null
          session_id: string | null
          sim_number: string | null
          status: string | null
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          device_id?: string | null
          device_name?: string | null
          envio_user_id?: string | null
          extraction_job_id?: string | null
          gp51_metadata?: Json | null
          gp51_username?: string | null
          id?: string | null
          import_job_type?: string | null
          is_active?: boolean | null
          last_position?: Json | null
          notes?: string | null
          session_id?: string | null
          sim_number?: string | null
          status?: string | null
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          device_id?: string | null
          device_name?: string | null
          envio_user_id?: string | null
          extraction_job_id?: string | null
          gp51_metadata?: Json | null
          gp51_username?: string | null
          id?: string | null
          import_job_type?: string | null
          is_active?: boolean | null
          last_position?: Json | null
          notes?: string | null
          session_id?: string | null
          sim_number?: string | null
          status?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
      workshop_activations: {
        Row: {
          activated_at: string | null
          activated_by: string | null
          activation_fee_paid: number | null
          activation_status: string
          created_at: string
          expires_at: string | null
          id: string
          notes: string | null
          payment_status: string | null
          service_duration_months: number | null
          updated_at: string
          vehicle_ids: Json
          workshop_id: string
        }
        Insert: {
          activated_at?: string | null
          activated_by?: string | null
          activation_fee_paid?: number | null
          activation_status?: string
          created_at?: string
          expires_at?: string | null
          id?: string
          notes?: string | null
          payment_status?: string | null
          service_duration_months?: number | null
          updated_at?: string
          vehicle_ids?: Json
          workshop_id: string
        }
        Update: {
          activated_at?: string | null
          activated_by?: string | null
          activation_fee_paid?: number | null
          activation_status?: string
          created_at?: string
          expires_at?: string | null
          id?: string
          notes?: string | null
          payment_status?: string | null
          service_duration_months?: number | null
          updated_at?: string
          vehicle_ids?: Json
          workshop_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "workshop_activations_activated_by_fkey"
            columns: ["activated_by"]
            isOneToOne: false
            referencedRelation: "envio_users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "workshop_activations_workshop_id_fkey"
            columns: ["workshop_id"]
            isOneToOne: false
            referencedRelation: "workshops"
            referencedColumns: ["id"]
          },
        ]
      }
      workshop_appointments: {
        Row: {
          actual_cost: number | null
          appointment_status: string
          appointment_type: string
          cancellation_reason: string | null
          cancelled_at: string | null
          completed_at: string | null
          confirmed_at: string | null
          created_at: string
          created_by: string | null
          duration_minutes: number
          estimated_cost: number | null
          id: string
          notes: string | null
          scheduled_date: string
          service_description: string | null
          updated_at: string
          user_id: string
          vehicle_id: string
          workshop_id: string
        }
        Insert: {
          actual_cost?: number | null
          appointment_status?: string
          appointment_type?: string
          cancellation_reason?: string | null
          cancelled_at?: string | null
          completed_at?: string | null
          confirmed_at?: string | null
          created_at?: string
          created_by?: string | null
          duration_minutes?: number
          estimated_cost?: number | null
          id?: string
          notes?: string | null
          scheduled_date: string
          service_description?: string | null
          updated_at?: string
          user_id: string
          vehicle_id: string
          workshop_id: string
        }
        Update: {
          actual_cost?: number | null
          appointment_status?: string
          appointment_type?: string
          cancellation_reason?: string | null
          cancelled_at?: string | null
          completed_at?: string | null
          confirmed_at?: string | null
          created_at?: string
          created_by?: string | null
          duration_minutes?: number
          estimated_cost?: number | null
          id?: string
          notes?: string | null
          scheduled_date?: string
          service_description?: string | null
          updated_at?: string
          user_id?: string
          vehicle_id?: string
          workshop_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "workshop_appointments_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "envio_users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "workshop_appointments_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "envio_users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "workshop_appointments_workshop_id_fkey"
            columns: ["workshop_id"]
            isOneToOne: false
            referencedRelation: "workshops"
            referencedColumns: ["id"]
          },
        ]
      }
      workshop_approval_logs: {
        Row: {
          action: string
          id: string
          notes: string | null
          performed_at: string
          performed_by: string | null
          workshop_id: string | null
        }
        Insert: {
          action: string
          id?: string
          notes?: string | null
          performed_at?: string
          performed_by?: string | null
          workshop_id?: string | null
        }
        Update: {
          action?: string
          id?: string
          notes?: string | null
          performed_at?: string
          performed_by?: string | null
          workshop_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "workshop_approval_logs_performed_by_fkey"
            columns: ["performed_by"]
            isOneToOne: false
            referencedRelation: "envio_users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "workshop_approval_logs_workshop_id_fkey"
            columns: ["workshop_id"]
            isOneToOne: false
            referencedRelation: "workshops"
            referencedColumns: ["id"]
          },
        ]
      }
      workshop_availability: {
        Row: {
          buffer_minutes: number | null
          created_at: string
          day_of_week: number
          end_time: string
          id: string
          is_available: boolean
          max_concurrent_appointments: number | null
          start_time: string
          updated_at: string
          workshop_id: string
        }
        Insert: {
          buffer_minutes?: number | null
          created_at?: string
          day_of_week: number
          end_time: string
          id?: string
          is_available?: boolean
          max_concurrent_appointments?: number | null
          start_time: string
          updated_at?: string
          workshop_id: string
        }
        Update: {
          buffer_minutes?: number | null
          created_at?: string
          day_of_week?: number
          end_time?: string
          id?: string
          is_available?: boolean
          max_concurrent_appointments?: number | null
          start_time?: string
          updated_at?: string
          workshop_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "workshop_availability_workshop_id_fkey"
            columns: ["workshop_id"]
            isOneToOne: false
            referencedRelation: "workshops"
            referencedColumns: ["id"]
          },
        ]
      }
      workshop_blackout_dates: {
        Row: {
          blackout_date: string
          created_at: string
          id: string
          is_recurring: boolean | null
          reason: string | null
          recurring_type: string | null
          workshop_id: string
        }
        Insert: {
          blackout_date: string
          created_at?: string
          id?: string
          is_recurring?: boolean | null
          reason?: string | null
          recurring_type?: string | null
          workshop_id: string
        }
        Update: {
          blackout_date?: string
          created_at?: string
          id?: string
          is_recurring?: boolean | null
          reason?: string | null
          recurring_type?: string | null
          workshop_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "workshop_blackout_dates_workshop_id_fkey"
            columns: ["workshop_id"]
            isOneToOne: false
            referencedRelation: "workshops"
            referencedColumns: ["id"]
          },
        ]
      }
      workshop_connections: {
        Row: {
          connected_at: string | null
          connection_fee_paid: number | null
          connection_status: string
          created_at: string
          id: string
          notes: string | null
          payment_status: string | null
          updated_at: string
          user_id: string
          workshop_id: string
        }
        Insert: {
          connected_at?: string | null
          connection_fee_paid?: number | null
          connection_status?: string
          created_at?: string
          id?: string
          notes?: string | null
          payment_status?: string | null
          updated_at?: string
          user_id: string
          workshop_id: string
        }
        Update: {
          connected_at?: string | null
          connection_fee_paid?: number | null
          connection_status?: string
          created_at?: string
          id?: string
          notes?: string | null
          payment_status?: string | null
          updated_at?: string
          user_id?: string
          workshop_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "workshop_connections_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "envio_users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "workshop_connections_workshop_id_fkey"
            columns: ["workshop_id"]
            isOneToOne: false
            referencedRelation: "workshops"
            referencedColumns: ["id"]
          },
        ]
      }
      workshop_permissions: {
        Row: {
          assigned_at: string
          assigned_by: string | null
          created_at: string
          id: string
          is_active: boolean
          permissions: Json
          role: string
          updated_at: string
          user_id: string | null
          workshop_id: string | null
        }
        Insert: {
          assigned_at?: string
          assigned_by?: string | null
          created_at?: string
          id?: string
          is_active?: boolean
          permissions?: Json
          role: string
          updated_at?: string
          user_id?: string | null
          workshop_id?: string | null
        }
        Update: {
          assigned_at?: string
          assigned_by?: string | null
          created_at?: string
          id?: string
          is_active?: boolean
          permissions?: Json
          role?: string
          updated_at?: string
          user_id?: string | null
          workshop_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "workshop_permissions_assigned_by_fkey"
            columns: ["assigned_by"]
            isOneToOne: false
            referencedRelation: "envio_users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "workshop_permissions_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "envio_users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "workshop_permissions_workshop_id_fkey"
            columns: ["workshop_id"]
            isOneToOne: false
            referencedRelation: "workshops"
            referencedColumns: ["id"]
          },
        ]
      }
      workshop_reviews: {
        Row: {
          created_at: string
          id: string
          rating: number
          review_text: string | null
          service_date: string | null
          updated_at: string
          user_id: string
          workshop_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          rating: number
          review_text?: string | null
          service_date?: string | null
          updated_at?: string
          user_id: string
          workshop_id: string
        }
        Update: {
          created_at?: string
          id?: string
          rating?: number
          review_text?: string | null
          service_date?: string | null
          updated_at?: string
          user_id?: string
          workshop_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "workshop_reviews_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "envio_users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "workshop_reviews_workshop_id_fkey"
            columns: ["workshop_id"]
            isOneToOne: false
            referencedRelation: "workshops"
            referencedColumns: ["id"]
          },
        ]
      }
      workshop_services: {
        Row: {
          created_at: string
          duration_hours: number | null
          id: string
          is_available: boolean | null
          price: number | null
          service_description: string | null
          service_name: string
          updated_at: string
          workshop_id: string
        }
        Insert: {
          created_at?: string
          duration_hours?: number | null
          id?: string
          is_available?: boolean | null
          price?: number | null
          service_description?: string | null
          service_name: string
          updated_at?: string
          workshop_id: string
        }
        Update: {
          created_at?: string
          duration_hours?: number | null
          id?: string
          is_available?: boolean | null
          price?: number | null
          service_description?: string | null
          service_name?: string
          updated_at?: string
          workshop_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "workshop_services_workshop_id_fkey"
            columns: ["workshop_id"]
            isOneToOne: false
            referencedRelation: "workshops"
            referencedColumns: ["id"]
          },
        ]
      }
      workshop_sessions: {
        Row: {
          created_at: string
          expires_at: string
          id: string
          is_active: boolean
          workshop_id: string
          workshop_user_id: string
        }
        Insert: {
          created_at?: string
          expires_at: string
          id?: string
          is_active?: boolean
          workshop_id: string
          workshop_user_id: string
        }
        Update: {
          created_at?: string
          expires_at?: string
          id?: string
          is_active?: boolean
          workshop_id?: string
          workshop_user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "workshop_sessions_workshop_id_fkey"
            columns: ["workshop_id"]
            isOneToOne: false
            referencedRelation: "workshops"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "workshop_sessions_workshop_user_id_fkey"
            columns: ["workshop_user_id"]
            isOneToOne: false
            referencedRelation: "workshop_users"
            referencedColumns: ["id"]
          },
        ]
      }
      workshop_transactions: {
        Row: {
          amount: number
          created_at: string
          currency: string
          customer_id: string | null
          id: string
          metadata: Json | null
          payment_method: string | null
          payment_status: string
          service_description: string | null
          stripe_charge_id: string | null
          stripe_payment_intent_id: string | null
          transaction_date: string
          transaction_type: string
          updated_at: string
          vehicle_id: string | null
          workshop_id: string | null
        }
        Insert: {
          amount: number
          created_at?: string
          currency?: string
          customer_id?: string | null
          id?: string
          metadata?: Json | null
          payment_method?: string | null
          payment_status?: string
          service_description?: string | null
          stripe_charge_id?: string | null
          stripe_payment_intent_id?: string | null
          transaction_date?: string
          transaction_type: string
          updated_at?: string
          vehicle_id?: string | null
          workshop_id?: string | null
        }
        Update: {
          amount?: number
          created_at?: string
          currency?: string
          customer_id?: string | null
          id?: string
          metadata?: Json | null
          payment_method?: string | null
          payment_status?: string
          service_description?: string | null
          stripe_charge_id?: string | null
          stripe_payment_intent_id?: string | null
          transaction_date?: string
          transaction_type?: string
          updated_at?: string
          vehicle_id?: string | null
          workshop_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "workshop_transactions_customer_id_fkey"
            columns: ["customer_id"]
            isOneToOne: false
            referencedRelation: "envio_users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "workshop_transactions_vehicle_id_fkey"
            columns: ["vehicle_id"]
            isOneToOne: false
            referencedRelation: "vehicles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "workshop_transactions_workshop_id_fkey"
            columns: ["workshop_id"]
            isOneToOne: false
            referencedRelation: "workshops"
            referencedColumns: ["id"]
          },
        ]
      }
      workshop_users: {
        Row: {
          created_at: string
          email: string
          id: string
          is_active: boolean
          name: string
          permissions: string[]
          role: string
          updated_at: string
          workshop_id: string
        }
        Insert: {
          created_at?: string
          email: string
          id?: string
          is_active?: boolean
          name: string
          permissions?: string[]
          role: string
          updated_at?: string
          workshop_id: string
        }
        Update: {
          created_at?: string
          email?: string
          id?: string
          is_active?: boolean
          name?: string
          permissions?: string[]
          role?: string
          updated_at?: string
          workshop_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "workshop_users_workshop_id_fkey"
            columns: ["workshop_id"]
            isOneToOne: false
            referencedRelation: "workshops"
            referencedColumns: ["id"]
          },
        ]
      }
      workshop_vehicle_assignments: {
        Row: {
          assigned_at: string
          assigned_by: string | null
          assignment_status: string
          created_at: string
          id: string
          notes: string | null
          updated_at: string
          vehicle_id: string
          workshop_id: string
        }
        Insert: {
          assigned_at?: string
          assigned_by?: string | null
          assignment_status?: string
          created_at?: string
          id?: string
          notes?: string | null
          updated_at?: string
          vehicle_id: string
          workshop_id: string
        }
        Update: {
          assigned_at?: string
          assigned_by?: string | null
          assignment_status?: string
          created_at?: string
          id?: string
          notes?: string | null
          updated_at?: string
          vehicle_id?: string
          workshop_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "workshop_vehicle_assignments_assigned_by_fkey"
            columns: ["assigned_by"]
            isOneToOne: false
            referencedRelation: "envio_users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "workshop_vehicle_assignments_workshop_id_fkey"
            columns: ["workshop_id"]
            isOneToOne: false
            referencedRelation: "workshops"
            referencedColumns: ["id"]
          },
        ]
      }
      workshops: {
        Row: {
          activation_fee: number | null
          address: string | null
          city: string | null
          connection_fee: number | null
          country: string | null
          created_at: string
          created_by: string | null
          email: string
          id: string
          is_active: boolean | null
          name: string
          operating_hours: string | null
          phone: string | null
          rating: number | null
          representative_name: string
          review_count: number | null
          service_types: Json | null
          updated_at: string
          verified: boolean | null
        }
        Insert: {
          activation_fee?: number | null
          address?: string | null
          city?: string | null
          connection_fee?: number | null
          country?: string | null
          created_at?: string
          created_by?: string | null
          email: string
          id?: string
          is_active?: boolean | null
          name: string
          operating_hours?: string | null
          phone?: string | null
          rating?: number | null
          representative_name: string
          review_count?: number | null
          service_types?: Json | null
          updated_at?: string
          verified?: boolean | null
        }
        Update: {
          activation_fee?: number | null
          address?: string | null
          city?: string | null
          connection_fee?: number | null
          country?: string | null
          created_at?: string
          created_by?: string | null
          email?: string
          id?: string
          is_active?: boolean | null
          name?: string
          operating_hours?: string | null
          phone?: string | null
          rating?: number | null
          representative_name?: string
          review_count?: number | null
          service_types?: Json | null
          updated_at?: string
          verified?: boolean | null
        }
        Relationships: [
          {
            foreignKeyName: "workshops_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "envio_users"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      check_rate_limit: {
        Args: {
          p_identifier: string
          p_endpoint: string
          p_max_requests?: number
          p_window_seconds?: number
        }
        Returns: boolean
      }
      check_referential_integrity: {
        Args: {
          source_table: string
          source_column: string
          target_table: string
          target_column: string
        }
        Returns: {
          id: string
        }[]
      }
      clean_expired_geocoding_cache: {
        Args: Record<PropertyKey, never>
        Returns: number
      }
      clean_expired_otps: {
        Args: Record<PropertyKey, never>
        Returns: undefined
      }
      cleanup_expired_sessions: {
        Args: Record<PropertyKey, never>
        Returns: number
      }
      create_incremental_backup: {
        Args: {
          source_table: string
          backup_table: string
          since_timestamp: string
        }
        Returns: undefined
      }
      create_system_backup_for_import: {
        Args: { import_id: string }
        Returns: Json
      }
      create_table_backup: {
        Args: { source_table: string; backup_table: string }
        Returns: undefined
      }
      drop_table_if_exists: {
        Args: { table_name: string }
        Returns: undefined
      }
      find_duplicate_device_ids: {
        Args: Record<PropertyKey, never>
        Returns: {
          device_id: string
          count: number
        }[]
      }
      generate_invoice_number: {
        Args: Record<PropertyKey, never>
        Returns: string
      }
      generate_otp_code: {
        Args: Record<PropertyKey, never>
        Returns: string
      }
      generate_temp_password_hash: {
        Args: Record<PropertyKey, never>
        Returns: string
      }
      get_geocoding_statistics: {
        Args: { p_user_id: string }
        Returns: Json
      }
      get_import_job_progress: {
        Args: { job_id: string }
        Returns: Json
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
      log_admin_action: {
        Args: {
          p_admin_user_id: string
          p_action_type: string
          p_target_entity_type: string
          p_target_entity_id?: string
          p_action_details?: Json
          p_ip_address?: unknown
          p_user_agent?: string
          p_session_fingerprint?: string
        }
        Returns: string
      }
      log_security_event: {
        Args: {
          p_user_id: string
          p_action_type: string
          p_resource_type?: string
          p_resource_id?: string
          p_ip_address?: unknown
          p_user_agent?: string
          p_session_id?: string
          p_request_details?: Json
          p_response_status?: number
          p_error_message?: string
          p_risk_level?: string
          p_success?: boolean
        }
        Returns: string
      }
      merge_table_from_backup: {
        Args: {
          backup_table: string
          target_table: string
          backup_timestamp: string
        }
        Returns: undefined
      }
      perform_safe_data_cleanup: {
        Args: { preserve_admin_email?: string }
        Returns: Json
      }
      restore_table_from_backup: {
        Args: { backup_table: string; target_table: string }
        Returns: undefined
      }
      update_polling_status: {
        Args: {
          p_last_poll_time: string
          p_success: boolean
          p_error_message?: string
        }
        Returns: undefined
      }
      upsert_geocoding_configuration: {
        Args: {
          p_provider_name: string
          p_api_key_encrypted: string
          p_is_active?: boolean
          p_primary_provider?: boolean
        }
        Returns: string
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
