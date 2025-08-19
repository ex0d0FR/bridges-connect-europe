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
    PostgrestVersion: "12.2.3 (519615d)"
  }
  public: {
    Tables: {
      analytics_metrics: {
        Row: {
          campaign_id: string | null
          church_id: string | null
          contact_id: string | null
          dimensions: Json | null
          id: string
          metric_name: string
          metric_type: string
          metric_value: number | null
          recorded_at: string | null
        }
        Insert: {
          campaign_id?: string | null
          church_id?: string | null
          contact_id?: string | null
          dimensions?: Json | null
          id?: string
          metric_name: string
          metric_type: string
          metric_value?: number | null
          recorded_at?: string | null
        }
        Update: {
          campaign_id?: string | null
          church_id?: string | null
          contact_id?: string | null
          dimensions?: Json | null
          id?: string
          metric_name?: string
          metric_type?: string
          metric_value?: number | null
          recorded_at?: string | null
        }
        Relationships: []
      }
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
      campaign_tasks: {
        Row: {
          assigned_to: string | null
          campaign_id: string | null
          completed_at: string | null
          created_at: string | null
          created_by: string | null
          description: string | null
          due_date: string | null
          id: string
          priority: string | null
          progress: number | null
          status: string | null
          title: string
          updated_at: string | null
        }
        Insert: {
          assigned_to?: string | null
          campaign_id?: string | null
          completed_at?: string | null
          created_at?: string | null
          created_by?: string | null
          description?: string | null
          due_date?: string | null
          id?: string
          priority?: string | null
          progress?: number | null
          status?: string | null
          title: string
          updated_at?: string | null
        }
        Update: {
          assigned_to?: string | null
          campaign_id?: string | null
          completed_at?: string | null
          created_at?: string | null
          created_by?: string | null
          description?: string | null
          due_date?: string | null
          id?: string
          priority?: string | null
          progress?: number | null
          status?: string | null
          title?: string
          updated_at?: string | null
        }
        Relationships: []
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
      communication_schedules: {
        Row: {
          campaign_id: string | null
          created_at: string | null
          created_by: string | null
          failed_count: number | null
          id: string
          scheduled_for: string | null
          sent_count: number | null
          status: string | null
          target_contacts: string[] | null
          template_id: string | null
        }
        Insert: {
          campaign_id?: string | null
          created_at?: string | null
          created_by?: string | null
          failed_count?: number | null
          id?: string
          scheduled_for?: string | null
          sent_count?: number | null
          status?: string | null
          target_contacts?: string[] | null
          template_id?: string | null
        }
        Update: {
          campaign_id?: string | null
          created_at?: string | null
          created_by?: string | null
          failed_count?: number | null
          id?: string
          scheduled_for?: string | null
          sent_count?: number | null
          status?: string | null
          target_contacts?: string[] | null
          template_id?: string | null
        }
        Relationships: []
      }
      contact_interactions: {
        Row: {
          contact_id: string | null
          content: string | null
          created_at: string | null
          created_by: string | null
          follow_up_date: string | null
          follow_up_required: boolean | null
          id: string
          interaction_date: string | null
          interaction_type: string | null
          metadata: Json | null
          outcome: string | null
          subject: string | null
        }
        Insert: {
          contact_id?: string | null
          content?: string | null
          created_at?: string | null
          created_by?: string | null
          follow_up_date?: string | null
          follow_up_required?: boolean | null
          id?: string
          interaction_date?: string | null
          interaction_type?: string | null
          metadata?: Json | null
          outcome?: string | null
          subject?: string | null
        }
        Update: {
          contact_id?: string | null
          content?: string | null
          created_at?: string | null
          created_by?: string | null
          follow_up_date?: string | null
          follow_up_required?: boolean | null
          id?: string
          interaction_date?: string | null
          interaction_type?: string | null
          metadata?: Json | null
          outcome?: string | null
          subject?: string | null
        }
        Relationships: []
      }
      contact_scraping_jobs: {
        Row: {
          completed_at: string | null
          created_at: string | null
          created_by: string | null
          error_message: string | null
          id: string
          results_count: number | null
          search_query: string
          started_at: string | null
          status: string | null
          target_countries: string[] | null
          target_denominations: string[] | null
        }
        Insert: {
          completed_at?: string | null
          created_at?: string | null
          created_by?: string | null
          error_message?: string | null
          id?: string
          results_count?: number | null
          search_query: string
          started_at?: string | null
          status?: string | null
          target_countries?: string[] | null
          target_denominations?: string[] | null
        }
        Update: {
          completed_at?: string | null
          created_at?: string | null
          created_by?: string | null
          error_message?: string | null
          id?: string
          results_count?: number | null
          search_query?: string
          started_at?: string | null
          status?: string | null
          target_countries?: string[] | null
          target_denominations?: string[] | null
        }
        Relationships: []
      }
      contacts: {
        Row: {
          church_id: string | null
          contact_status: string | null
          created_at: string | null
          created_by: string | null
          department: string | null
          email: string | null
          first_name: string | null
          id: string
          language: string | null
          last_contact_date: string | null
          last_name: string | null
          mobile: string | null
          next_follow_up: string | null
          notes: string | null
          phone: string | null
          position: string | null
          social_media: Json | null
          tags: string[] | null
          updated_at: string | null
        }
        Insert: {
          church_id?: string | null
          contact_status?: string | null
          created_at?: string | null
          created_by?: string | null
          department?: string | null
          email?: string | null
          first_name?: string | null
          id?: string
          language?: string | null
          last_contact_date?: string | null
          last_name?: string | null
          mobile?: string | null
          next_follow_up?: string | null
          notes?: string | null
          phone?: string | null
          position?: string | null
          social_media?: Json | null
          tags?: string[] | null
          updated_at?: string | null
        }
        Update: {
          church_id?: string | null
          contact_status?: string | null
          created_at?: string | null
          created_by?: string | null
          department?: string | null
          email?: string | null
          first_name?: string | null
          id?: string
          language?: string | null
          last_contact_date?: string | null
          last_name?: string | null
          mobile?: string | null
          next_follow_up?: string | null
          notes?: string | null
          phone?: string | null
          position?: string | null
          social_media?: Json | null
          tags?: string[] | null
          updated_at?: string | null
        }
        Relationships: []
      }
      event_attendees: {
        Row: {
          attended: boolean | null
          church_id: string | null
          contact_id: string | null
          created_at: string | null
          event_id: string | null
          id: string
          notes: string | null
          registered_at: string | null
          status: string | null
        }
        Insert: {
          attended?: boolean | null
          church_id?: string | null
          contact_id?: string | null
          created_at?: string | null
          event_id?: string | null
          id?: string
          notes?: string | null
          registered_at?: string | null
          status?: string | null
        }
        Update: {
          attended?: boolean | null
          church_id?: string | null
          contact_id?: string | null
          created_at?: string | null
          event_id?: string | null
          id?: string
          notes?: string | null
          registered_at?: string | null
          status?: string | null
        }
        Relationships: []
      }
      events: {
        Row: {
          address: string | null
          campaign_id: string | null
          city: string | null
          country: string | null
          created_at: string | null
          created_by: string | null
          description: string | null
          end_date: string | null
          event_type: string | null
          id: string
          is_online: boolean | null
          location: string | null
          max_attendees: number | null
          meeting_url: string | null
          registration_required: boolean | null
          start_date: string | null
          status: string | null
          title: string
          updated_at: string | null
        }
        Insert: {
          address?: string | null
          campaign_id?: string | null
          city?: string | null
          country?: string | null
          created_at?: string | null
          created_by?: string | null
          description?: string | null
          end_date?: string | null
          event_type?: string | null
          id?: string
          is_online?: boolean | null
          location?: string | null
          max_attendees?: number | null
          meeting_url?: string | null
          registration_required?: boolean | null
          start_date?: string | null
          status?: string | null
          title: string
          updated_at?: string | null
        }
        Update: {
          address?: string | null
          campaign_id?: string | null
          city?: string | null
          country?: string | null
          created_at?: string | null
          created_by?: string | null
          description?: string | null
          end_date?: string | null
          event_type?: string | null
          id?: string
          is_online?: boolean | null
          location?: string | null
          max_attendees?: number | null
          meeting_url?: string | null
          registration_required?: boolean | null
          start_date?: string | null
          status?: string | null
          title?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      gdpr_consents: {
        Row: {
          church_id: string | null
          consent_date: string | null
          consent_type: string
          consented: boolean | null
          contact_id: string | null
          created_at: string | null
          id: string
          ip_address: unknown | null
          legal_basis: string | null
          user_agent: string | null
          withdrawal_date: string | null
        }
        Insert: {
          church_id?: string | null
          consent_date?: string | null
          consent_type: string
          consented?: boolean | null
          contact_id?: string | null
          created_at?: string | null
          id?: string
          ip_address?: unknown | null
          legal_basis?: string | null
          user_agent?: string | null
          withdrawal_date?: string | null
        }
        Update: {
          church_id?: string | null
          consent_date?: string | null
          consent_type?: string
          consented?: boolean | null
          contact_id?: string | null
          created_at?: string | null
          id?: string
          ip_address?: unknown | null
          legal_basis?: string | null
          user_agent?: string | null
          withdrawal_date?: string | null
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
          twilio_account_name: string | null
          twilio_friendly_name: string | null
          twilio_phone_number: string | null
          updated_at: string
          user_id: string
          whatsapp_business_name: string | null
          whatsapp_phone_number: string | null
          whatsapp_phone_numbers: string[] | null
        }
        Insert: {
          conference_date?: string | null
          created_at?: string
          id?: string
          organization_name?: string | null
          primary_contact_email?: string | null
          sender_email?: string | null
          sender_name?: string | null
          twilio_account_name?: string | null
          twilio_friendly_name?: string | null
          twilio_phone_number?: string | null
          updated_at?: string
          user_id: string
          whatsapp_business_name?: string | null
          whatsapp_phone_number?: string | null
          whatsapp_phone_numbers?: string[] | null
        }
        Update: {
          conference_date?: string | null
          created_at?: string
          id?: string
          organization_name?: string | null
          primary_contact_email?: string | null
          sender_email?: string | null
          sender_name?: string | null
          twilio_account_name?: string | null
          twilio_friendly_name?: string | null
          twilio_phone_number?: string | null
          updated_at?: string
          user_id?: string
          whatsapp_business_name?: string | null
          whatsapp_phone_number?: string | null
          whatsapp_phone_numbers?: string[] | null
        }
        Relationships: []
      }
      social_media_posts: {
        Row: {
          campaign_id: string | null
          content: string
          created_at: string | null
          created_by: string | null
          engagement_metrics: Json | null
          external_post_id: string | null
          id: string
          media_urls: string[] | null
          platform: string
          posted_at: string | null
          scheduled_for: string | null
          status: string | null
          updated_at: string | null
        }
        Insert: {
          campaign_id?: string | null
          content: string
          created_at?: string | null
          created_by?: string | null
          engagement_metrics?: Json | null
          external_post_id?: string | null
          id?: string
          media_urls?: string[] | null
          platform: string
          posted_at?: string | null
          scheduled_for?: string | null
          status?: string | null
          updated_at?: string | null
        }
        Update: {
          campaign_id?: string | null
          content?: string
          created_at?: string | null
          created_by?: string | null
          engagement_metrics?: Json | null
          external_post_id?: string | null
          id?: string
          media_urls?: string[] | null
          platform?: string
          posted_at?: string | null
          scheduled_for?: string | null
          status?: string | null
          updated_at?: string | null
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
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
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
