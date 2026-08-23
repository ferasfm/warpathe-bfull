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
    PostgrestVersion: "14.15"
  }
  public: {
    Tables: {
      accounts: {
        Row: {
          created_at: string
          id: string
          name: string
          notes: string | null
          status: string | null
          updated_at: string
        }
        Insert: {
          created_at?: string
          id?: string
          name: string
          notes?: string | null
          status?: string | null
          updated_at?: string
        }
        Update: {
          created_at?: string
          id?: string
          name?: string
          notes?: string | null
          status?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      agent_commands: {
        Row: {
          agent_id: string
          command_type: string
          completed_at: string | null
          created_at: string | null
          device_id: string | null
          error_message: string | null
          id: string
          payload: Json | null
          started_at: string | null
          status: string | null
        }
        Insert: {
          agent_id: string
          command_type: string
          completed_at?: string | null
          created_at?: string | null
          device_id?: string | null
          error_message?: string | null
          id?: string
          payload?: Json | null
          started_at?: string | null
          status?: string | null
        }
        Update: {
          agent_id?: string
          command_type?: string
          completed_at?: string | null
          created_at?: string | null
          device_id?: string | null
          error_message?: string | null
          id?: string
          payload?: Json | null
          started_at?: string | null
          status?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "agent_commands_agent_id_fkey"
            columns: ["agent_id"]
            isOneToOne: false
            referencedRelation: "agents"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "agent_commands_device_id_fkey"
            columns: ["device_id"]
            isOneToOne: false
            referencedRelation: "devices"
            referencedColumns: ["id"]
          },
        ]
      }
      agent_events: {
        Row: {
          agent_id: string
          created_at: string | null
          device_id: string | null
          event_type: string
          id: string
          payload: Json | null
        }
        Insert: {
          agent_id: string
          created_at?: string | null
          device_id?: string | null
          event_type: string
          id?: string
          payload?: Json | null
        }
        Update: {
          agent_id?: string
          created_at?: string | null
          device_id?: string | null
          event_type?: string
          id?: string
          payload?: Json | null
        }
        Relationships: [
          {
            foreignKeyName: "agent_events_agent_id_fkey"
            columns: ["agent_id"]
            isOneToOne: false
            referencedRelation: "agents"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "agent_events_device_id_fkey"
            columns: ["device_id"]
            isOneToOne: false
            referencedRelation: "devices"
            referencedColumns: ["id"]
          },
        ]
      }
      agents: {
        Row: {
          created_at: string | null
          hostname: string | null
          id: string
          installation_id: string | null
          last_heartbeat: string | null
          name: string
          status: string | null
          token_hash: string | null
          updated_at: string | null
          version: string | null
        }
        Insert: {
          created_at?: string | null
          hostname?: string | null
          id?: string
          installation_id?: string | null
          last_heartbeat?: string | null
          name: string
          status?: string | null
          token_hash?: string | null
          updated_at?: string | null
          version?: string | null
        }
        Update: {
          created_at?: string | null
          hostname?: string | null
          id?: string
          installation_id?: string | null
          last_heartbeat?: string | null
          name?: string
          status?: string | null
          token_hash?: string | null
          updated_at?: string | null
          version?: string | null
        }
        Relationships: []
      }
      ai_mission_generation_logs: {
        Row: {
          admin_id: string | null
          created_at: string
          error_message: string | null
          generated_json: Json | null
          id: string
          model: string | null
          prompt: string
          provider: string | null
          status: string
        }
        Insert: {
          admin_id?: string | null
          created_at?: string
          error_message?: string | null
          generated_json?: Json | null
          id?: string
          model?: string | null
          prompt: string
          provider?: string | null
          status: string
        }
        Update: {
          admin_id?: string | null
          created_at?: string
          error_message?: string | null
          generated_json?: Json | null
          id?: string
          model?: string | null
          prompt?: string
          provider?: string | null
          status?: string
        }
        Relationships: []
      }
      ai_vision_logs: {
        Row: {
          agent_id: string | null
          confidence: number | null
          created_at: string | null
          device_id: string | null
          error: string | null
          id: string
          mission_run_id: string | null
          model: string
          processing_time_ms: number | null
          prompt: string | null
          provider: string
          result: Json | null
        }
        Insert: {
          agent_id?: string | null
          confidence?: number | null
          created_at?: string | null
          device_id?: string | null
          error?: string | null
          id?: string
          mission_run_id?: string | null
          model: string
          processing_time_ms?: number | null
          prompt?: string | null
          provider: string
          result?: Json | null
        }
        Update: {
          agent_id?: string | null
          confidence?: number | null
          created_at?: string | null
          device_id?: string | null
          error?: string | null
          id?: string
          mission_run_id?: string | null
          model?: string
          processing_time_ms?: number | null
          prompt?: string | null
          provider?: string
          result?: Json | null
        }
        Relationships: [
          {
            foreignKeyName: "ai_vision_logs_agent_id_fkey"
            columns: ["agent_id"]
            isOneToOne: false
            referencedRelation: "agents"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ai_vision_logs_mission_run_id_fkey"
            columns: ["mission_run_id"]
            isOneToOne: false
            referencedRelation: "mission_runs"
            referencedColumns: ["id"]
          },
        ]
      }
      audit_logs: {
        Row: {
          action: string
          created_at: string | null
          entity_id: string | null
          entity_type: string
          id: string
          metadata: Json | null
          user_id: string | null
        }
        Insert: {
          action: string
          created_at?: string | null
          entity_id?: string | null
          entity_type: string
          id?: string
          metadata?: Json | null
          user_id?: string | null
        }
        Update: {
          action?: string
          created_at?: string | null
          entity_id?: string | null
          entity_type?: string
          id?: string
          metadata?: Json | null
          user_id?: string | null
        }
        Relationships: []
      }
      devices: {
        Row: {
          agent_id: string
          created_at: string | null
          device_id: string
          id: string
          name: string | null
          status: string | null
          updated_at: string | null
        }
        Insert: {
          agent_id: string
          created_at?: string | null
          device_id: string
          id?: string
          name?: string | null
          status?: string | null
          updated_at?: string | null
        }
        Update: {
          agent_id?: string
          created_at?: string | null
          device_id?: string
          id?: string
          name?: string | null
          status?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "devices_agent_id_fkey"
            columns: ["agent_id"]
            isOneToOne: false
            referencedRelation: "agents"
            referencedColumns: ["id"]
          },
        ]
      }
      emulators: {
        Row: {
          adb_serial: string | null
          agent_id: string
          assigned_farm_id: string | null
          created_at: string | null
          device_id: string
          dpi: number | null
          id: string
          instance_name: string | null
          is_busy: boolean | null
          last_error: string | null
          name: string | null
          resolution: string | null
          status: string | null
          updated_at: string | null
        }
        Insert: {
          adb_serial?: string | null
          agent_id: string
          assigned_farm_id?: string | null
          created_at?: string | null
          device_id: string
          dpi?: number | null
          id?: string
          instance_name?: string | null
          is_busy?: boolean | null
          last_error?: string | null
          name?: string | null
          resolution?: string | null
          status?: string | null
          updated_at?: string | null
        }
        Update: {
          adb_serial?: string | null
          agent_id?: string
          assigned_farm_id?: string | null
          created_at?: string | null
          device_id?: string
          dpi?: number | null
          id?: string
          instance_name?: string | null
          is_busy?: boolean | null
          last_error?: string | null
          name?: string | null
          resolution?: string | null
          status?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "emulators_agent_id_fkey"
            columns: ["agent_id"]
            isOneToOne: false
            referencedRelation: "agents"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "emulators_assigned_farm_id_fkey"
            columns: ["assigned_farm_id"]
            isOneToOne: false
            referencedRelation: "farms"
            referencedColumns: ["id"]
          },
        ]
      }
      farm_users: {
        Row: {
          created_at: string
          farm_id: string
          id: string
          user_id: string
        }
        Insert: {
          created_at?: string
          farm_id: string
          id?: string
          user_id: string
        }
        Update: {
          created_at?: string
          farm_id?: string
          id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "farm_users_farm_id_fkey"
            columns: ["farm_id"]
            isOneToOne: false
            referencedRelation: "farms"
            referencedColumns: ["id"]
          },
        ]
      }
      farms: {
        Row: {
          account_id: string
          created_at: string
          id: string
          name: string
          notes: string | null
          status: string | null
          updated_at: string
        }
        Insert: {
          account_id: string
          created_at?: string
          id?: string
          name: string
          notes?: string | null
          status?: string | null
          updated_at?: string
        }
        Update: {
          account_id?: string
          created_at?: string
          id?: string
          name?: string
          notes?: string | null
          status?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "farms_account_id_fkey"
            columns: ["account_id"]
            isOneToOne: false
            referencedRelation: "accounts"
            referencedColumns: ["id"]
          },
        ]
      }
      fleet_assignments: {
        Row: {
          created_at: string
          enabled: boolean | null
          farm_id: string
          fleet_id: string
          id: string
          resource_id: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          enabled?: boolean | null
          farm_id: string
          fleet_id: string
          id?: string
          resource_id: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          enabled?: boolean | null
          farm_id?: string
          fleet_id?: string
          id?: string
          resource_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "fleet_assignments_farm_id_fkey"
            columns: ["farm_id"]
            isOneToOne: false
            referencedRelation: "farms"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fleet_assignments_fleet_id_fkey"
            columns: ["fleet_id"]
            isOneToOne: false
            referencedRelation: "fleets"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fleet_assignments_resource_id_fkey"
            columns: ["resource_id"]
            isOneToOne: false
            referencedRelation: "resources"
            referencedColumns: ["id"]
          },
        ]
      }
      fleets: {
        Row: {
          created_at: string
          farm_id: string
          fleet_number: number
          id: string
          name: string | null
          status: string | null
          updated_at: string
        }
        Insert: {
          created_at?: string
          farm_id: string
          fleet_number: number
          id?: string
          name?: string | null
          status?: string | null
          updated_at?: string
        }
        Update: {
          created_at?: string
          farm_id?: string
          fleet_number?: number
          id?: string
          name?: string | null
          status?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "fleets_farm_id_fkey"
            columns: ["farm_id"]
            isOneToOne: false
            referencedRelation: "farms"
            referencedColumns: ["id"]
          },
        ]
      }
      login_attempts: {
        Row: {
          attempt_time: string | null
          id: string
          ip_address: string
          is_successful: boolean | null
        }
        Insert: {
          attempt_time?: string | null
          id?: string
          ip_address: string
          is_successful?: boolean | null
        }
        Update: {
          attempt_time?: string | null
          id?: string
          ip_address?: string
          is_successful?: boolean | null
        }
        Relationships: []
      }
      mission_events: {
        Row: {
          created_at: string | null
          event_type: string
          id: string
          message: string | null
          mission_run_id: string | null
          payload: Json | null
          severity: string
        }
        Insert: {
          created_at?: string | null
          event_type: string
          id?: string
          message?: string | null
          mission_run_id?: string | null
          payload?: Json | null
          severity?: string
        }
        Update: {
          created_at?: string | null
          event_type?: string
          id?: string
          message?: string | null
          mission_run_id?: string | null
          payload?: Json | null
          severity?: string
        }
        Relationships: [
          {
            foreignKeyName: "mission_events_mission_run_id_fkey"
            columns: ["mission_run_id"]
            isOneToOne: false
            referencedRelation: "mission_runs"
            referencedColumns: ["id"]
          },
        ]
      }
      mission_runs: {
        Row: {
          completed_at: string | null
          created_at: string | null
          current_step_index: number | null
          error_message: string | null
          farm_id: string
          id: string
          last_event_type: string | null
          mission_id: string
          recovery_count: number | null
          started_at: string | null
          status: string
          total_steps: number | null
        }
        Insert: {
          completed_at?: string | null
          created_at?: string | null
          current_step_index?: number | null
          error_message?: string | null
          farm_id: string
          id?: string
          last_event_type?: string | null
          mission_id: string
          recovery_count?: number | null
          started_at?: string | null
          status?: string
          total_steps?: number | null
        }
        Update: {
          completed_at?: string | null
          created_at?: string | null
          current_step_index?: number | null
          error_message?: string | null
          farm_id?: string
          id?: string
          last_event_type?: string | null
          mission_id?: string
          recovery_count?: number | null
          started_at?: string | null
          status?: string
          total_steps?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "mission_runs_farm_id_fkey"
            columns: ["farm_id"]
            isOneToOne: false
            referencedRelation: "farms"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "mission_runs_mission_id_fkey"
            columns: ["mission_id"]
            isOneToOne: false
            referencedRelation: "missions"
            referencedColumns: ["id"]
          },
        ]
      }
      mission_steps: {
        Row: {
          configuration: Json | null
          created_at: string | null
          id: string
          mission_template_id: string
          name: string
          retry_count: number | null
          step_order: number
          step_type: string
          timeout_ms: number | null
          updated_at: string | null
        }
        Insert: {
          configuration?: Json | null
          created_at?: string | null
          id?: string
          mission_template_id: string
          name: string
          retry_count?: number | null
          step_order: number
          step_type: string
          timeout_ms?: number | null
          updated_at?: string | null
        }
        Update: {
          configuration?: Json | null
          created_at?: string | null
          id?: string
          mission_template_id?: string
          name?: string
          retry_count?: number | null
          step_order?: number
          step_type?: string
          timeout_ms?: number | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "mission_steps_mission_template_id_fkey"
            columns: ["mission_template_id"]
            isOneToOne: false
            referencedRelation: "mission_templates"
            referencedColumns: ["id"]
          },
        ]
      }
      mission_templates: {
        Row: {
          created_at: string | null
          description: string | null
          id: string
          mission_id: string
          status: string | null
          updated_at: string | null
          version: string
        }
        Insert: {
          created_at?: string | null
          description?: string | null
          id?: string
          mission_id: string
          status?: string | null
          updated_at?: string | null
          version: string
        }
        Update: {
          created_at?: string | null
          description?: string | null
          id?: string
          mission_id?: string
          status?: string | null
          updated_at?: string | null
          version?: string
        }
        Relationships: [
          {
            foreignKeyName: "mission_templates_mission_id_fkey"
            columns: ["mission_id"]
            isOneToOne: false
            referencedRelation: "missions"
            referencedColumns: ["id"]
          },
        ]
      }
      missions: {
        Row: {
          created_at: string | null
          description: string | null
          id: string
          name: string
          status: string | null
          updated_at: string | null
          version: string | null
        }
        Insert: {
          created_at?: string | null
          description?: string | null
          id?: string
          name: string
          status?: string | null
          updated_at?: string | null
          version?: string | null
        }
        Update: {
          created_at?: string | null
          description?: string | null
          id?: string
          name?: string
          status?: string | null
          updated_at?: string | null
          version?: string | null
        }
        Relationships: []
      }
      profiles: {
        Row: {
          created_at: string
          email: string | null
          full_name: string | null
          id: string
        }
        Insert: {
          created_at?: string
          email?: string | null
          full_name?: string | null
          id: string
        }
        Update: {
          created_at?: string
          email?: string | null
          full_name?: string | null
          id?: string
        }
        Relationships: []
      }
      recovery_rules: {
        Row: {
          active: boolean | null
          configuration: Json | null
          created_at: string | null
          id: string
          name: string
          priority: number | null
          trigger_type: string
          updated_at: string | null
        }
        Insert: {
          active?: boolean | null
          configuration?: Json | null
          created_at?: string | null
          id?: string
          name: string
          priority?: number | null
          trigger_type: string
          updated_at?: string | null
        }
        Update: {
          active?: boolean | null
          configuration?: Json | null
          created_at?: string | null
          id?: string
          name?: string
          priority?: number | null
          trigger_type?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      resource_assets: {
        Row: {
          active: boolean | null
          created_at: string
          id: string
          name: string
          resource_id: string
          storage_path: string
          updated_at: string
          version: string | null
        }
        Insert: {
          active?: boolean | null
          created_at?: string
          id?: string
          name: string
          resource_id: string
          storage_path: string
          updated_at?: string
          version?: string | null
        }
        Update: {
          active?: boolean | null
          created_at?: string
          id?: string
          name?: string
          resource_id?: string
          storage_path?: string
          updated_at?: string
          version?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "resource_assets_resource_id_fkey"
            columns: ["resource_id"]
            isOneToOne: false
            referencedRelation: "resources"
            referencedColumns: ["id"]
          },
        ]
      }
      resources: {
        Row: {
          code: string
          created_at: string
          id: string
          name: string
          status: string | null
          updated_at: string
        }
        Insert: {
          code: string
          created_at?: string
          id?: string
          name: string
          status?: string | null
          updated_at?: string
        }
        Update: {
          code?: string
          created_at?: string
          id?: string
          name?: string
          status?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      system_settings: {
        Row: {
          description: string | null
          id: string
          is_enabled: boolean | null
          is_sensitive: boolean | null
          key: string
          updated_at: string | null
          updated_by: string | null
          value: Json
        }
        Insert: {
          description?: string | null
          id?: string
          is_enabled?: boolean | null
          is_sensitive?: boolean | null
          key: string
          updated_at?: string | null
          updated_by?: string | null
          value: Json
        }
        Update: {
          description?: string | null
          id?: string
          is_enabled?: boolean | null
          is_sensitive?: boolean | null
          key?: string
          updated_at?: string | null
          updated_by?: string | null
          value?: Json
        }
        Relationships: []
      }
      user_roles: {
        Row: {
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          id?: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_roles_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      vision_assets: {
        Row: {
          active: boolean | null
          asset_type: string
          created_at: string | null
          id: string
          name: string
          storage_path: string | null
          updated_at: string | null
          version: string | null
        }
        Insert: {
          active?: boolean | null
          asset_type: string
          created_at?: string | null
          id?: string
          name: string
          storage_path?: string | null
          updated_at?: string | null
          version?: string | null
        }
        Update: {
          active?: boolean | null
          asset_type?: string
          created_at?: string | null
          id?: string
          name?: string
          storage_path?: string | null
          updated_at?: string | null
          version?: string | null
        }
        Relationships: []
      }
      vision_results: {
        Row: {
          confidence: number
          created_at: string | null
          detected: boolean
          device_id: string | null
          emulator_id: string | null
          id: string
          matches: Json | null
          processing_time_ms: number | null
          rule_id: string | null
          screenshot_height: number | null
          screenshot_width: number | null
        }
        Insert: {
          confidence: number
          created_at?: string | null
          detected: boolean
          device_id?: string | null
          emulator_id?: string | null
          id?: string
          matches?: Json | null
          processing_time_ms?: number | null
          rule_id?: string | null
          screenshot_height?: number | null
          screenshot_width?: number | null
        }
        Update: {
          confidence?: number
          created_at?: string | null
          detected?: boolean
          device_id?: string | null
          emulator_id?: string | null
          id?: string
          matches?: Json | null
          processing_time_ms?: number | null
          rule_id?: string | null
          screenshot_height?: number | null
          screenshot_width?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "vision_results_device_id_fkey"
            columns: ["device_id"]
            isOneToOne: false
            referencedRelation: "devices"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "vision_results_emulator_id_fkey"
            columns: ["emulator_id"]
            isOneToOne: false
            referencedRelation: "emulators"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "vision_results_rule_id_fkey"
            columns: ["rule_id"]
            isOneToOne: false
            referencedRelation: "vision_rules"
            referencedColumns: ["id"]
          },
        ]
      }
      vision_rules: {
        Row: {
          active: boolean | null
          asset_id: string | null
          confidence_threshold: number | null
          configuration: Json | null
          created_at: string | null
          id: string
          name: string
          updated_at: string | null
        }
        Insert: {
          active?: boolean | null
          asset_id?: string | null
          confidence_threshold?: number | null
          configuration?: Json | null
          created_at?: string | null
          id?: string
          name: string
          updated_at?: string | null
        }
        Update: {
          active?: boolean | null
          asset_id?: string | null
          confidence_threshold?: number | null
          configuration?: Json | null
          created_at?: string | null
          id?: string
          name?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "vision_rules_asset_id_fkey"
            columns: ["asset_id"]
            isOneToOne: false
            referencedRelation: "vision_assets"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      check_ip_blocked: { Args: { _ip: string }; Returns: boolean }
      get_user_role: {
        Args: { _user_id: string }
        Returns: Database["public"]["Enums"]["app_role"]
      }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
    }
    Enums: {
      app_role: "super_admin" | "station_manager" | "admin" | "user"
      fuel_type: "gasoline_95" | "gasoline_98" | "diesel" | "kerosene" | "gas"
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
    Enums: {
      app_role: ["super_admin", "station_manager", "admin", "user"],
      fuel_type: ["gasoline_95", "gasoline_98", "diesel", "kerosene", "gas"],
    },
  },
} as const
