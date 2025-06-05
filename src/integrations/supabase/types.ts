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
        Relationships: [
          {
            foreignKeyName: "device_history_device_id_fkey"
            columns: ["device_id"]
            isOneToOne: false
            referencedRelation: "vehicles"
            referencedColumns: ["device_id"]
          },
        ]
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
      map_api_configs: {
        Row: {
          alert_threshold_80: number | null
          alert_threshold_90: number | null
          alert_threshold_95: number | null
          api_key: string
          auto_fallback_enabled: boolean | null
          created_at: string
          fallback_priority: number
          id: string
          is_active: boolean
          last_alert_sent: string | null
          name: string
          performance_weight: number | null
          provider_type: string
          threshold_type: string
          threshold_value: number
          updated_at: string
        }
        Insert: {
          alert_threshold_80?: number | null
          alert_threshold_90?: number | null
          alert_threshold_95?: number | null
          api_key: string
          auto_fallback_enabled?: boolean | null
          created_at?: string
          fallback_priority?: number
          id?: string
          is_active?: boolean
          last_alert_sent?: string | null
          name: string
          performance_weight?: number | null
          provider_type?: string
          threshold_type?: string
          threshold_value?: number
          updated_at?: string
        }
        Update: {
          alert_threshold_80?: number | null
          alert_threshold_90?: number | null
          alert_threshold_95?: number | null
          api_key?: string
          auto_fallback_enabled?: boolean | null
          created_at?: string
          fallback_priority?: number
          id?: string
          is_active?: boolean
          last_alert_sent?: string | null
          name?: string
          performance_weight?: number | null
          provider_type?: string
          threshold_type?: string
          threshold_value?: number
          updated_at?: string
        }
        Relationships: []
      }
      map_api_usage: {
        Row: {
          api_config_id: string
          id: string
          last_updated: string
          request_count: number
          usage_date: string
        }
        Insert: {
          api_config_id: string
          id?: string
          last_updated?: string
          request_count?: number
          usage_date?: string
        }
        Update: {
          api_config_id?: string
          id?: string
          last_updated?: string
          request_count?: number
          usage_date?: string
        }
        Relationships: [
          {
            foreignKeyName: "map_api_usage_api_config_id_fkey"
            columns: ["api_config_id"]
            isOneToOne: false
            referencedRelation: "map_api_configs"
            referencedColumns: ["id"]
          },
        ]
      }
      map_performance_metrics: {
        Row: {
          api_config_id: string | null
          created_at: string
          id: string
          metadata: Json | null
          metric_type: string
          metric_value: number | null
          session_id: string
        }
        Insert: {
          api_config_id?: string | null
          created_at?: string
          id?: string
          metadata?: Json | null
          metric_type: string
          metric_value?: number | null
          session_id: string
        }
        Update: {
          api_config_id?: string | null
          created_at?: string
          id?: string
          metadata?: Json | null
          metric_type?: string
          metric_value?: number | null
          session_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "map_performance_metrics_api_config_id_fkey"
            columns: ["api_config_id"]
            isOneToOne: false
            referencedRelation: "map_api_configs"
            referencedColumns: ["id"]
          },
        ]
      }
      map_usage_analytics: {
        Row: {
          action_data: Json | null
          action_type: string
          center_lat: number | null
          center_lng: number | null
          created_at: string
          id: string
          session_id: string
          user_id: string | null
          viewport_bounds: Json | null
          zoom_level: number | null
        }
        Insert: {
          action_data?: Json | null
          action_type: string
          center_lat?: number | null
          center_lng?: number | null
          created_at?: string
          id?: string
          session_id: string
          user_id?: string | null
          viewport_bounds?: Json | null
          zoom_level?: number | null
        }
        Update: {
          action_data?: Json | null
          action_type?: string
          center_lat?: number | null
          center_lng?: number | null
          created_at?: string
          id?: string
          session_id?: string
          user_id?: string | null
          viewport_bounds?: Json | null
          zoom_level?: number | null
        }
        Relationships: []
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
      generate_invoice_number: {
        Args: Record<PropertyKey, never>
        Returns: string
      }
      generate_temp_password_hash: {
        Args: Record<PropertyKey, never>
        Returns: string
      }
      get_active_map_api: {
        Args: Record<PropertyKey, never>
        Returns: {
          api_key: string
          provider_type: string
          config_id: string
        }[]
      }
      get_map_config_usage_percentage: {
        Args: { config_id: string; check_date?: string }
        Returns: number
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
      increment_map_api_usage: {
        Args: { config_id: string }
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
