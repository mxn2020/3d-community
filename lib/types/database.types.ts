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
      accounts: {
        Row: {
          account_type: Database["public"]["Enums"]["account_type"]
          avatar_url: string | null
          created_at: string
          created_by: string | null
          deleted_at: string | null
          deleted_by: string | null
          email: string
          id: string
          name: string | null
          owner_user_id: string | null
          subscription_plan:
            | Database["public"]["Enums"]["subscription_plan"]
            | null
          two_factor_enabled: boolean | null
          updated_at: string
          updated_by: string | null
        }
        Insert: {
          account_type?: Database["public"]["Enums"]["account_type"]
          avatar_url?: string | null
          created_at?: string
          created_by?: string | null
          deleted_at?: string | null
          deleted_by?: string | null
          email: string
          id?: string
          name?: string | null
          owner_user_id?: string | null
          subscription_plan?:
            | Database["public"]["Enums"]["subscription_plan"]
            | null
          two_factor_enabled?: boolean | null
          updated_at?: string
          updated_by?: string | null
        }
        Update: {
          account_type?: Database["public"]["Enums"]["account_type"]
          avatar_url?: string | null
          created_at?: string
          created_by?: string | null
          deleted_at?: string | null
          deleted_by?: string | null
          email?: string
          id?: string
          name?: string | null
          owner_user_id?: string | null
          subscription_plan?:
            | Database["public"]["Enums"]["subscription_plan"]
            | null
          two_factor_enabled?: boolean | null
          updated_at?: string
          updated_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "fk_accounts_profile"
            columns: ["owner_user_id"]
            isOneToOne: false
            referencedRelation: "accounts_with_profiles"
            referencedColumns: ["profile_id"]
          },
          {
            foreignKeyName: "fk_accounts_profile"
            columns: ["owner_user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      community_maps: {
        Row: {
          created_at: string | null
          description: string | null
          id: string
          is_active: boolean | null
          map_data: Json
          name: string
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          description?: string | null
          id?: string
          is_active?: boolean | null
          map_data: Json
          name: string
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          description?: string | null
          id?: string
          is_active?: boolean | null
          map_data?: Json
          name?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      plot_likes: {
        Row: {
          created_at: string
          id: string
          plot_id: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          plot_id: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          plot_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "plot_likes_plot_id_fkey"
            columns: ["plot_id"]
            isOneToOne: false
            referencedRelation: "plots"
            referencedColumns: ["id"]
          },
        ]
      }
      plot_sets: {
        Row: {
          id: string
          name: string | null
          owner_id: string | null
          created_at: string
          updated_at: string
          created_by: string | null
          updated_by: string | null
          deleted_at: string | null
          deleted_by: string | null
        }
        Insert: {
          id?: string
          name?: string | null
          owner_id?: string | null
          created_at?: string
          updated_at?: string
          created_by?: string | null
          updated_by?: string | null
          deleted_at?: string | null
          deleted_by?: string | null
        }
        Update: {
          id?: string
          name?: string | null
          owner_id?: string | null
          created_at?: string
          updated_at?: string
          created_by?: string | null
          updated_by?: string | null
          deleted_at?: string | null
          deleted_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "plot_sets_owner_id_fkey"
            columns: ["owner_id"]
            isOneToOne: false
            referencedRelation: "accounts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "plot_sets_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "plot_sets_updated_by_fkey"
            columns: ["updated_by"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "plot_sets_deleted_by_fkey"
            columns: ["deleted_by"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          }
        ]
      },
      plot_transactions: {
        Row: {
          id: string
          plot_id: string
          transaction_type: string
          previous_owner_id: string | null
          new_owner_id: string | null
          price: number | null
          transaction_date: string
          user_id: string | null
        }
        Insert: {
          id?: string
          plot_id: string
          transaction_type: string
          previous_owner_id?: string | null
          new_owner_id?: string | null
          price?: number | null
          transaction_date?: string
          user_id?: string | null
        }
        Update: {
          id?: string
          plot_id?: string
          transaction_type?: string
          previous_owner_id?: string | null
          new_owner_id?: string | null
          price?: number | null
          transaction_date?: string
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "plot_transactions_plot_id_fkey"
            columns: ["plot_id"]
            isOneToOne: false
            referencedRelation: "plots"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "plot_transactions_previous_owner_id_fkey"
            columns: ["previous_owner_id"]
            isOneToOne: false
            referencedRelation: "accounts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "plot_transactions_new_owner_id_fkey"
            columns: ["new_owner_id"]
            isOneToOne: false
            referencedRelation: "accounts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "plot_transactions_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          }
        ]
      },
      plots: {
        Row: {
          created_at: string
          created_by: string | null
          deleted_at: string | null
          deleted_by: string | null
          house_color: string | null
          house_type: string | null
          id: string
          likes_count: number | null
          map_id: string | null
          map_position: Json | null
          name: string | null
          owner_id: string | null
          plot_set_id: string | null
          position: Json
          price: number | null
          key: string | null
          status: string | null
          updated_at: string
          updated_by: string | null
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          deleted_at?: string | null
          deleted_by?: string | null
          house_color?: string | null
          house_type?: string | null
          id?: string
          likes_count?: number | null
          map_id?: string | null
          map_position?: Json | null
          name?: string | null
          owner_id?: string | null
          plot_set_id?: string | null
          position?: Json
          price?: number | null
          key?: string | null
          status?: string | null
          updated_at?: string
          updated_by?: string | null
        }
        Update: {
          created_at?: string
          created_by?: string | null
          deleted_at?: string | null
          deleted_by?: string | null
          house_color?: string | null
          house_type?: string | null
          id?: string
          likes_count?: number | null
          map_id?: string | null
          map_position?: Json | null
          name?: string | null
          owner_id?: string | null
          plot_set_id?: string | null
          position?: Json
          price?: number | null
          key?: string | null
          status?: string | null
          updated_at?: string
          updated_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "plots_owner_id_fkey"
            columns: ["owner_id"]
            isOneToOne: false
            referencedRelation: "accounts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "plots_plot_set_id_fkey"
            columns: ["plot_set_id"]
            isOneToOne: false
            referencedRelation: "plot_sets"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "plots_map_id_fkey"
            columns: ["map_id"]
            isOneToOne: false
            referencedRelation: "community_maps"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "plots_owner_id_fkey"
            columns: ["owner_id"]
            isOneToOne: true
            referencedRelation: "accounts_with_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          avatar_url: string | null
          bio: string | null
          created_at: string
          email: string
          id: string
          language: string | null
          level: number | null
          name: string | null
          raw_user_meta_data: Json | null
          theme: Database["public"]["Enums"]["theme_type"] | null
          timezone: string | null
          updated_at: string
        }
        Insert: {
          avatar_url?: string | null
          bio?: string | null
          created_at?: string
          email: string
          id: string
          language?: string | null
          level?: number | null
          name?: string | null
          raw_user_meta_data?: Json | null
          theme?: Database["public"]["Enums"]["theme_type"] | null
          timezone?: string | null
          updated_at?: string
        }
        Update: {
          avatar_url?: string | null
          bio?: string | null
          created_at?: string
          email?: string
          id?: string
          language?: string | null
          level?: number | null
          name?: string | null
          raw_user_meta_data?: Json | null
          theme?: Database["public"]["Enums"]["theme_type"] | null
          timezone?: string | null
          updated_at?: string
        }
        Relationships: []
      }
    }
    Views: {
      accounts_with_profiles: {
        Row: {
          account_avatar_url: string | null
          account_created_at: string | null
          account_name: string | null
          account_type: Database["public"]["Enums"]["account_type"] | null
          account_updated_at: string | null
          bio: string | null
          created_by: string | null
          deleted_at: string | null
          deleted_by: string | null
          email: string | null
          id: string | null
          language: string | null
          level: number | null
          owner_user_id: string | null
          profile_avatar_url: string | null
          profile_id: string | null
          profile_name: string | null
          subscription_plan:
            | Database["public"]["Enums"]["subscription_plan"]
            | null
          theme: Database["public"]["Enums"]["theme_type"] | null
          timezone: string | null
          two_factor_enabled: boolean | null
          updated_by: string | null
        }
        Relationships: [
          {
            foreignKeyName: "fk_accounts_profile"
            columns: ["owner_user_id"]
            isOneToOne: false
            referencedRelation: "accounts_with_profiles"
            referencedColumns: ["profile_id"]
          },
          {
            foreignKeyName: "fk_accounts_profile"
            columns: ["owner_user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Functions: {
      decrement_plot_likes: {
        Args: { p_plot_id: string }
        Returns: undefined
      }
      increment_plot_likes: {
        Args: { p_plot_id: string }
        Returns: undefined
      }
    }
    Enums: {
      account_type: "personal" | "team" | "reseller" | "affiliate"
      subscription_plan: "free" | "pro" | "enterprise"
      theme_type: "light" | "dark" | "system"
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
      account_type: ["personal", "team", "reseller", "affiliate"],
      subscription_plan: ["free", "pro", "enterprise"],
      theme_type: ["light", "dark", "system"],
    },
  },
} as const

