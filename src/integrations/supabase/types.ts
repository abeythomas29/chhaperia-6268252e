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
    PostgrestVersion: "14.5"
  }
  public: {
    Tables: {
      company_clients: {
        Row: {
          created_at: string
          id: string
          name: string
          status: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          id?: string
          name: string
          status?: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          id?: string
          name?: string
          status?: string
          updated_at?: string
        }
        Relationships: []
      }
      product_categories: {
        Row: {
          created_at: string
          id: string
          name: string
          status: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          id?: string
          name: string
          status?: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          id?: string
          name?: string
          status?: string
          updated_at?: string
        }
        Relationships: []
      }
      product_codes: {
        Row: {
          category_id: string
          code: string
          created_at: string
          id: string
          status: string
          updated_at: string
        }
        Insert: {
          category_id: string
          code: string
          created_at?: string
          id?: string
          status?: string
          updated_at?: string
        }
        Update: {
          category_id?: string
          code?: string
          created_at?: string
          id?: string
          status?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "product_codes_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "product_categories"
            referencedColumns: ["id"]
          },
        ]
      }
      product_recipes: {
        Row: {
          created_at: string
          id: string
          product_code_id: string
          quantity_per_unit: number
          raw_material_id: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          id?: string
          product_code_id: string
          quantity_per_unit?: number
          raw_material_id: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          id?: string
          product_code_id?: string
          quantity_per_unit?: number
          raw_material_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "product_recipes_product_code_id_fkey"
            columns: ["product_code_id"]
            isOneToOne: false
            referencedRelation: "product_codes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "product_recipes_raw_material_id_fkey"
            columns: ["raw_material_id"]
            isOneToOne: false
            referencedRelation: "raw_materials"
            referencedColumns: ["id"]
          },
        ]
      }
      production_entries: {
        Row: {
          client_id: string | null
          created_at: string
          date: string
          elongation: number | null
          id: string
          notes: string | null
          product_code_id: string
          quantity_per_roll: number
          rolls_count: number
          surface_resistance: number | null
          swelling_height: number | null
          swelling_speed: number | null
          tensile_strength: number | null
          thickness_mm: number | null
          total_quantity: number | null
          unit: string
          updated_at: string
          worker_id: string
        }
        Insert: {
          client_id?: string | null
          created_at?: string
          date?: string
          elongation?: number | null
          id?: string
          notes?: string | null
          product_code_id: string
          quantity_per_roll: number
          rolls_count: number
          surface_resistance?: number | null
          swelling_height?: number | null
          swelling_speed?: number | null
          tensile_strength?: number | null
          thickness_mm?: number | null
          total_quantity?: number | null
          unit?: string
          updated_at?: string
          worker_id: string
        }
        Update: {
          client_id?: string | null
          created_at?: string
          date?: string
          elongation?: number | null
          id?: string
          notes?: string | null
          product_code_id?: string
          quantity_per_roll?: number
          rolls_count?: number
          surface_resistance?: number | null
          swelling_height?: number | null
          swelling_speed?: number | null
          tensile_strength?: number | null
          thickness_mm?: number | null
          total_quantity?: number | null
          unit?: string
          updated_at?: string
          worker_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "production_entries_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "company_clients"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "production_entries_product_code_id_fkey"
            columns: ["product_code_id"]
            isOneToOne: false
            referencedRelation: "product_codes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "production_entries_worker_id_profiles_fkey"
            columns: ["worker_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["user_id"]
          },
        ]
      }
      profiles: {
        Row: {
          created_at: string
          employee_id: string
          id: string
          name: string
          requested_department: Database["public"]["Enums"]["signup_department"]
          status: string
          updated_at: string
          user_id: string
          username: string
        }
        Insert: {
          created_at?: string
          employee_id: string
          id?: string
          name: string
          requested_department?: Database["public"]["Enums"]["signup_department"]
          status?: string
          updated_at?: string
          user_id: string
          username: string
        }
        Update: {
          created_at?: string
          employee_id?: string
          id?: string
          name?: string
          requested_department?: Database["public"]["Enums"]["signup_department"]
          status?: string
          updated_at?: string
          user_id?: string
          username?: string
        }
        Relationships: []
      }
      raw_material_stock_entries: {
        Row: {
          added_by: string
          created_at: string
          date: string
          id: string
          lot_number: string | null
          notes: string | null
          pallets: number | null
          quantity: number
          raw_material_id: string
          supplier: string | null
          thickness_mm: number | null
        }
        Insert: {
          added_by: string
          created_at?: string
          date?: string
          id?: string
          lot_number?: string | null
          notes?: string | null
          pallets?: number | null
          quantity?: number
          raw_material_id: string
          supplier?: string | null
          thickness_mm?: number | null
        }
        Update: {
          added_by?: string
          created_at?: string
          date?: string
          id?: string
          lot_number?: string | null
          notes?: string | null
          pallets?: number | null
          quantity?: number
          raw_material_id?: string
          supplier?: string | null
          thickness_mm?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "raw_material_stock_entries_added_by_fkey"
            columns: ["added_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "raw_material_stock_entries_raw_material_id_fkey"
            columns: ["raw_material_id"]
            isOneToOne: false
            referencedRelation: "raw_materials"
            referencedColumns: ["id"]
          },
        ]
      }
      raw_material_usage: {
        Row: {
          created_at: string
          id: string
          production_entry_id: string
          quantity_used: number
          raw_material_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          production_entry_id: string
          quantity_used?: number
          raw_material_id: string
        }
        Update: {
          created_at?: string
          id?: string
          production_entry_id?: string
          quantity_used?: number
          raw_material_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "raw_material_usage_production_entry_id_fkey"
            columns: ["production_entry_id"]
            isOneToOne: false
            referencedRelation: "production_entries"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "raw_material_usage_raw_material_id_fkey"
            columns: ["raw_material_id"]
            isOneToOne: false
            referencedRelation: "raw_materials"
            referencedColumns: ["id"]
          },
        ]
      }
      raw_materials: {
        Row: {
          created_at: string
          current_stock: number
          id: string
          name: string
          status: string
          unit: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          current_stock?: number
          id?: string
          name: string
          status?: string
          unit?: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          current_stock?: number
          id?: string
          name?: string
          status?: string
          unit?: string
          updated_at?: string
        }
        Relationships: []
      }
      sales: {
        Row: {
          client_id: string | null
          client_name: string | null
          created_at: string
          date: string
          id: string
          item_type: string
          notes: string | null
          price_per_unit: number
          product_code_id: string | null
          quantity: number
          raw_material_id: string | null
          sold_by: string
          thickness_mm: number | null
          total_amount: number | null
          unit: string
          updated_at: string
        }
        Insert: {
          client_id?: string | null
          client_name?: string | null
          created_at?: string
          date?: string
          id?: string
          item_type: string
          notes?: string | null
          price_per_unit?: number
          product_code_id?: string | null
          quantity: number
          raw_material_id?: string | null
          sold_by: string
          thickness_mm?: number | null
          total_amount?: number | null
          unit?: string
          updated_at?: string
        }
        Update: {
          client_id?: string | null
          client_name?: string | null
          created_at?: string
          date?: string
          id?: string
          item_type?: string
          notes?: string | null
          price_per_unit?: number
          product_code_id?: string | null
          quantity?: number
          raw_material_id?: string | null
          sold_by?: string
          thickness_mm?: number | null
          total_amount?: number | null
          unit?: string
          updated_at?: string
        }
        Relationships: []
      }
      slitting_entries: {
        Row: {
          created_at: string
          cut_quantity_produced: number
          cut_width_mm: number
          date: string
          id: string
          notes: string | null
          product_code_id: string
          remaining_returned: number
          slitting_manager_id: string
          source_quantity: number
          thickness_mm: number | null
          unit: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          cut_quantity_produced: number
          cut_width_mm: number
          date?: string
          id?: string
          notes?: string | null
          product_code_id: string
          remaining_returned?: number
          slitting_manager_id: string
          source_quantity: number
          thickness_mm?: number | null
          unit?: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          cut_quantity_produced?: number
          cut_width_mm?: number
          date?: string
          id?: string
          notes?: string | null
          product_code_id?: string
          remaining_returned?: number
          slitting_manager_id?: string
          source_quantity?: number
          thickness_mm?: number | null
          unit?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "slitting_entries_product_code_id_fkey"
            columns: ["product_code_id"]
            isOneToOne: false
            referencedRelation: "product_codes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "slitting_entries_slitting_manager_id_fkey"
            columns: ["slitting_manager_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["user_id"]
          },
        ]
      }
      stock_issues: {
        Row: {
          client_id: string
          created_at: string
          date: string
          id: string
          issued_by: string
          notes: string | null
          product_code_id: string
          quantity: number
          thickness_mm: number | null
          unit: string
          updated_at: string
        }
        Insert: {
          client_id: string
          created_at?: string
          date?: string
          id?: string
          issued_by: string
          notes?: string | null
          product_code_id: string
          quantity: number
          thickness_mm?: number | null
          unit?: string
          updated_at?: string
        }
        Update: {
          client_id?: string
          created_at?: string
          date?: string
          id?: string
          issued_by?: string
          notes?: string | null
          product_code_id?: string
          quantity?: number
          thickness_mm?: number | null
          unit?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "stock_issues_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "company_clients"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "stock_issues_issued_by_profiles_fkey"
            columns: ["issued_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "stock_issues_product_code_id_fkey"
            columns: ["product_code_id"]
            isOneToOne: false
            referencedRelation: "product_codes"
            referencedColumns: ["id"]
          },
        ]
      }
      user_roles: {
        Row: {
          created_at: string
          id: string
          role: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          role: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          role?: string
          user_id?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      get_user_role: { Args: { _user_id: string }; Returns: string }
      has_role: { Args: { _role: string; _user_id: string }; Returns: boolean }
      is_admin: { Args: { _user_id: string }; Returns: boolean }
    }
    Enums: {
      signup_department: "worker" | "inventory_manager" | "slitting_manager"
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
      signup_department: ["worker", "inventory_manager", "slitting_manager"],
    },
  },
} as const
