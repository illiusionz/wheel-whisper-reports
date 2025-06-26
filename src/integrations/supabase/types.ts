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
      profiles: {
        Row: {
          created_at: string
          email: string
          full_name: string | null
          id: string
          subscription_tier: string | null
          updated_at: string
        }
        Insert: {
          created_at?: string
          email: string
          full_name?: string | null
          id: string
          subscription_tier?: string | null
          updated_at?: string
        }
        Update: {
          created_at?: string
          email?: string
          full_name?: string | null
          id?: string
          subscription_tier?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      reports: {
        Row: {
          created_at: string
          id: string
          report_data: Json
          symbol: string
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          report_data: Json
          symbol: string
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          report_data?: Json
          symbol?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      unusual_options_activity: {
        Row: {
          ai_analysis: string | null
          context: string
          contract_type: string
          created_at: string
          detected_at: string
          expiration: string
          id: string
          is_unusual: boolean
          open_interest: number | null
          price: number
          sentiment: string
          strike: number
          symbol: string
          updated_at: string
          user_id: string
          volume: number
          volume_ratio: number
          week_start: string
        }
        Insert: {
          ai_analysis?: string | null
          context: string
          contract_type: string
          created_at?: string
          detected_at?: string
          expiration: string
          id?: string
          is_unusual?: boolean
          open_interest?: number | null
          price: number
          sentiment: string
          strike: number
          symbol: string
          updated_at?: string
          user_id: string
          volume: number
          volume_ratio: number
          week_start: string
        }
        Update: {
          ai_analysis?: string | null
          context?: string
          contract_type?: string
          created_at?: string
          detected_at?: string
          expiration?: string
          id?: string
          is_unusual?: boolean
          open_interest?: number | null
          price?: number
          sentiment?: string
          strike?: number
          symbol?: string
          updated_at?: string
          user_id?: string
          volume?: number
          volume_ratio?: number
          week_start?: string
        }
        Relationships: []
      }
      user_settings: {
        Row: {
          created_at: string
          delivery_method: string | null
          id: string
          notifications_enabled: boolean | null
          report_frequency: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          delivery_method?: string | null
          id?: string
          notifications_enabled?: boolean | null
          report_frequency?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          delivery_method?: string | null
          id?: string
          notifications_enabled?: boolean | null
          report_frequency?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      watchlists: {
        Row: {
          change_amount: number | null
          change_percent: number | null
          created_at: string
          id: string
          name: string
          price: number | null
          symbol: string
          updated_at: string
          user_id: string
        }
        Insert: {
          change_amount?: number | null
          change_percent?: number | null
          created_at?: string
          id?: string
          name: string
          price?: number | null
          symbol: string
          updated_at?: string
          user_id: string
        }
        Update: {
          change_amount?: number | null
          change_percent?: number | null
          created_at?: string
          id?: string
          name?: string
          price?: number | null
          symbol?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      weekly_options_sentiment: {
        Row: {
          bearish_count: number
          bearish_volume: number
          bullish_count: number
          bullish_volume: number
          created_at: string
          dominant_sentiment: string
          id: string
          key_strikes: Json | null
          sentiment_strength: number
          symbol: string
          total_unusual_count: number
          updated_at: string
          user_id: string
          week_end: string
          week_start: string
          week_summary: string | null
        }
        Insert: {
          bearish_count?: number
          bearish_volume?: number
          bullish_count?: number
          bullish_volume?: number
          created_at?: string
          dominant_sentiment: string
          id?: string
          key_strikes?: Json | null
          sentiment_strength?: number
          symbol: string
          total_unusual_count?: number
          updated_at?: string
          user_id: string
          week_end: string
          week_start: string
          week_summary?: string | null
        }
        Update: {
          bearish_count?: number
          bearish_volume?: number
          bullish_count?: number
          bullish_volume?: number
          created_at?: string
          dominant_sentiment?: string
          id?: string
          key_strikes?: Json | null
          sentiment_strength?: number
          symbol?: string
          total_unusual_count?: number
          updated_at?: string
          user_id?: string
          week_end?: string
          week_start?: string
          week_summary?: string | null
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      get_week_end: {
        Args: { input_date: string }
        Returns: string
      }
      get_week_start: {
        Args: { input_date: string }
        Returns: string
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
