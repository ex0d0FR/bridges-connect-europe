export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instanciate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "12.2.3 (519615d)"
  }
  public: {
    Tables: {
      campaign_churches: {
        Row: {
          added_at: string
          campaign_id: string
          church_id: string
          id: string
        }
        Insert: {
          added_at?: string
          campaign_id: string
          church_id: string
          id?: string
        }
        Update: {
          added_at?: string
          campaign_id?: string
          church_id?: string
          id?: string
        }
        Relationships: [
          {
            foreignKeyName: "campaign_churches_campaign_id_fkey"
            columns: ["campaign_id"]
            isOneToOne: false
            referencedRelation: "campaigns"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "campaign_churches_church_id_fkey"
            columns: ["church_id"]
            isOneToOne: false
            referencedRelation: "churches"
            referencedColumns: ["id"]
          },
        ]
      }
      campaigns: {
        Row: {
          created_at: string
          created_by: string
          description: string | null
          end_date: string | null
          id: string
          name: string
          start_date: string | null
          status: Database["public"]["Enums"]["campaign_status"] | null
          target_countries: string[] | null
          target_denominations: string[] | null
          updated_at: string
        }
        Insert: {
          created_at?: string
          created_by: string
          description?: string | null
          end_date?: string | null
          id?: string
          name: string
          start_date?: string | null
          status?: Database["public"]["Enums"]["campaign_status"] | null
          target_countries?: string[] | null
          target_denominations?: string[] | null
          updated_at?: string
        }
        Update: {
          created_at?: string
          created_by?: string
          description?: string | null
          end_date?: string | null
          id?: string
          name?: string
          start_date?: string | null
          status?: Database["public"]["Enums"]["campaign_status"] | null
          target_countries?: string[] | null
          target_denominations?: string[] | null
          updated_at?: string
        }
        Relationships: []
      }
      churches: {
        Row: {
          address: string | null
          city: string | null
          contact_name: string | null
          country: string
          created_at: string
          created_by: string | null
          denomination: string | null
          email: string | null
          facebook: string | null
          id: string
          instagram: string | null
          name: string
          notes: string | null
          phone: string | null
          postal_code: string | null
          size_category: string | null
          updated_at: string
          verified: boolean | null
          website: string | null
        }
        Insert: {
          address?: string | null
          city?: string | null
          contact_name?: string | null
          country?: string
          created_at?: string
          created_by?: string | null
          denomination?: string | null
          email?: string | null
          facebook?: string | null
          id?: string
          instagram?: string | null
          name: string
          notes?: string | null
          phone?: string | null
          postal_code?: string | null
          size_category?: string | null
          updated_at?: string
          verified?: boolean | null
          website?: string | null
        }
        Update: {
          address?: string | null
          city?: string | null
          contact_name?: string | null
          country?: string
          created_at?: string
          created_by?: string | null
          denomination?: string | null
          email?: string | null
          facebook?: string | null
          id?: string
          instagram?: string | null
          name?: string
          notes?: string | null
          phone?: string | null
          postal_code?: string | null
          size_category?: string | null
          updated_at?: string
          verified?: boolean | null
          website?: string | null
        }
        Relationships: []
      }
      messages: {
        Row: {
          campaign_id: string | null
          church_id: string
          clicked_at: string | null
          content: string
          created_at: string
          created_by: string
          delivered_at: string | null
          external_id: string | null
          failed_reason: string | null
          id: string
          metadata: Json | null
          opened_at: string | null
          recipient_email: string | null
          recipient_phone: string | null
          replied_at: string | null
          sent_at: string | null
          status: Database["public"]["Enums"]["message_status"] | null
          subject: string | null
          template_id: string | null
          type: Database["public"]["Enums"]["message_type"]
        }
        Insert: {
          campaign_id?: string | null
          church_id: string
          clicked_at?: string | null
          content: string
          created_at?: string
          created_by: string
          delivered_at?: string | null
          external_id?: string | null
          failed_reason?: string | null
          id?: string
          metadata?: Json | null
          opened_at?: string | null
          recipient_email?: string | null
          recipient_phone?: string | null
          replied_at?: string | null
          sent_at?: string | null
          status?: Database["public"]["Enums"]["message_status"] | null
          subject?: string | null
          template_id?: string | null
          type: Database["public"]["Enums"]["message_type"]
        }
        Update: {
          campaign_id?: string | null
          church_id?: string
          clicked_at?: string | null
          content?: string
          created_at?: string
          created_by?: string
          delivered_at?: string | null
          external_id?: string | null
          failed_reason?: string | null
          id?: string
          metadata?: Json | null
          opened_at?: string | null
          recipient_email?: string | null
          recipient_phone?: string | null
          replied_at?: string | null
          sent_at?: string | null
          status?: Database["public"]["Enums"]["message_status"] | null
          subject?: string | null
          template_id?: string | null
          type?: Database["public"]["Enums"]["message_type"]
        }
        Relationships: [
          {
            foreignKeyName: "messages_campaign_id_fkey"
            columns: ["campaign_id"]
            isOneToOne: false
            referencedRelation: "campaigns"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "messages_church_id_fkey"
            columns: ["church_id"]
            isOneToOne: false
            referencedRelation: "churches"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "messages_template_id_fkey"
            columns: ["template_id"]
            isOneToOne: false
            referencedRelation: "templates"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          approved_at: string | null
          approved_by: string | null
          created_at: string
          email: string
          full_name: string | null
          id: string
          rejection_reason: string | null
          status: Database["public"]["Enums"]["user_status"]
          updated_at: string
        }
        Insert: {
          approved_at?: string | null
          approved_by?: string | null
          created_at?: string
          email: string
          full_name?: string | null
          id: string
          rejection_reason?: string | null
          status?: Database["public"]["Enums"]["user_status"]
          updated_at?: string
        }
        Update: {
          approved_at?: string | null
          approved_by?: string | null
          created_at?: string
          email?: string
          full_name?: string | null
          id?: string
          rejection_reason?: string | null
          status?: Database["public"]["Enums"]["user_status"]
          updated_at?: string
        }
        Relationships: []
      }
      settings: {
        Row: {
          conference_date: string | null
          created_at: string
          id: string
          organization_name: string | null
          primary_contact_email: string | null
          sender_email: string | null
          sender_name: string | null
          updated_at: string
          user_id: string
          whatsapp_phone_number: string | null
        }
        Insert: {
          conference_date?: string | null
          created_at?: string
          id?: string
          organization_name?: string | null
          primary_contact_email?: string | null
          sender_email?: string | null
          sender_name?: string | null
          updated_at?: string
          user_id: string
          whatsapp_phone_number?: string | null
        }
        Update: {
          conference_date?: string | null
          created_at?: string
          id?: string
          organization_name?: string | null
          primary_contact_email?: string | null
          sender_email?: string | null
          sender_name?: string | null
          updated_at?: string
          user_id?: string
          whatsapp_phone_number?: string | null
        }
        Relationships: []
      }
      templates: {
        Row: {
          content: string
          created_at: string
          created_by: string
          id: string
          is_default: boolean | null
          language: string | null
          name: string
          subject: string | null
          type: Database["public"]["Enums"]["message_type"]
          updated_at: string
          variables: Json | null
        }
        Insert: {
          content: string
          created_at?: string
          created_by: string
          id?: string
          is_default?: boolean | null
          language?: string | null
          name: string
          subject?: string | null
          type: Database["public"]["Enums"]["message_type"]
          updated_at?: string
          variables?: Json | null
        }
        Update: {
          content?: string
          created_at?: string
          created_by?: string
          id?: string
          is_default?: boolean | null
          language?: string | null
          name?: string
          subject?: string | null
          type?: Database["public"]["Enums"]["message_type"]
          updated_at?: string
          variables?: Json | null
        }
        Relationships: []
      }
      user_roles: {
        Row: {
          assigned_at: string
          assigned_by: string | null
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          assigned_at?: string
          assigned_by?: string | null
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          assigned_at?: string
          assigned_by?: string | null
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      has_role: {
        Args: {
          _user_id: string
          _role: Database["public"]["Enums"]["app_role"]
        }
        Returns: boolean
      }
      is_user_approved: {
        Args: { _user_id: string }
        Returns: boolean
      }
    }
    Enums: {
      app_role: "admin" | "user"
      campaign_status: "draft" | "active" | "paused" | "completed" | "cancelled"
      message_status:
        | "pending"
        | "sent"
        | "delivered"
        | "opened"
        | "clicked"
        | "replied"
        | "failed"
      message_type: "email" | "sms" | "whatsapp"
      user_status: "pending" | "approved" | "rejected" | "suspended"
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
      app_role: ["admin", "user"],
      campaign_status: ["draft", "active", "paused", "completed", "cancelled"],
      message_status: [
        "pending",
        "sent",
        "delivered",
        "opened",
        "clicked",
        "replied",
        "failed",
      ],
      message_type: ["email", "sms", "whatsapp"],
      user_status: ["pending", "approved", "rejected", "suspended"],
    },
  },
} as const
