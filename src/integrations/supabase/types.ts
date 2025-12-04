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
    PostgrestVersion: "13.0.5"
  }
  public: {
    Tables: {
      activity_logs: {
        Row: {
          action: string
          created_at: string | null
          details: string | null
          id: string
          ip_address: string | null
          user_id: string | null
        }
        Insert: {
          action: string
          created_at?: string | null
          details?: string | null
          id?: string
          ip_address?: string | null
          user_id?: string | null
        }
        Update: {
          action?: string
          created_at?: string | null
          details?: string | null
          id?: string
          ip_address?: string | null
          user_id?: string | null
        }
        Relationships: []
      }
      announcements: {
        Row: {
          class_id: string | null
          content: string
          created_at: string | null
          id: string
          teacher_id: string
          title: string
          updated_at: string | null
        }
        Insert: {
          class_id?: string | null
          content: string
          created_at?: string | null
          id?: string
          teacher_id: string
          title: string
          updated_at?: string | null
        }
        Update: {
          class_id?: string | null
          content?: string
          created_at?: string | null
          id?: string
          teacher_id?: string
          title?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "announcements_class_id_fkey"
            columns: ["class_id"]
            isOneToOne: false
            referencedRelation: "classes"
            referencedColumns: ["id"]
          },
        ]
      }
      assignment_submissions: {
        Row: {
          assignment_id: string
          feedback: string | null
          graded_at: string | null
          id: string
          marks_obtained: number | null
          student_id: string
          submission_text: string | null
          submission_url: string | null
          submitted_at: string | null
        }
        Insert: {
          assignment_id: string
          feedback?: string | null
          graded_at?: string | null
          id?: string
          marks_obtained?: number | null
          student_id: string
          submission_text?: string | null
          submission_url?: string | null
          submitted_at?: string | null
        }
        Update: {
          assignment_id?: string
          feedback?: string | null
          graded_at?: string | null
          id?: string
          marks_obtained?: number | null
          student_id?: string
          submission_text?: string | null
          submission_url?: string | null
          submitted_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "assignment_submissions_assignment_id_fkey"
            columns: ["assignment_id"]
            isOneToOne: false
            referencedRelation: "assignments"
            referencedColumns: ["id"]
          },
        ]
      }
      assignments: {
        Row: {
          class_id: string
          created_at: string | null
          description: string | null
          due_date: string | null
          id: string
          teacher_id: string
          title: string
          total_marks: number | null
        }
        Insert: {
          class_id: string
          created_at?: string | null
          description?: string | null
          due_date?: string | null
          id?: string
          teacher_id: string
          title: string
          total_marks?: number | null
        }
        Update: {
          class_id?: string
          created_at?: string | null
          description?: string | null
          due_date?: string | null
          id?: string
          teacher_id?: string
          title?: string
          total_marks?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "assignments_class_id_fkey"
            columns: ["class_id"]
            isOneToOne: false
            referencedRelation: "classes"
            referencedColumns: ["id"]
          },
        ]
      }
      attendance: {
        Row: {
          class_id: string | null
          created_at: string | null
          date: string
          id: string
          marked_by: string | null
          status: string
          student_id: string
        }
        Insert: {
          class_id?: string | null
          created_at?: string | null
          date: string
          id?: string
          marked_by?: string | null
          status: string
          student_id: string
        }
        Update: {
          class_id?: string | null
          created_at?: string | null
          date?: string
          id?: string
          marked_by?: string | null
          status?: string
          student_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "attendance_class_id_fkey"
            columns: ["class_id"]
            isOneToOne: false
            referencedRelation: "classes"
            referencedColumns: ["id"]
          },
        ]
      }
      class_enrollments: {
        Row: {
          class_id: string
          enrolled_at: string | null
          id: string
          student_id: string
        }
        Insert: {
          class_id: string
          enrolled_at?: string | null
          id?: string
          student_id: string
        }
        Update: {
          class_id?: string
          enrolled_at?: string | null
          id?: string
          student_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "class_enrollments_class_id_fkey"
            columns: ["class_id"]
            isOneToOne: false
            referencedRelation: "classes"
            referencedColumns: ["id"]
          },
        ]
      }
      classes: {
        Row: {
          created_at: string | null
          created_by: string | null
          description: string | null
          id: string
          name: string
          section: string | null
          subject: string | null
          teacher_id: string | null
        }
        Insert: {
          created_at?: string | null
          created_by?: string | null
          description?: string | null
          id?: string
          name: string
          section?: string | null
          subject?: string | null
          teacher_id?: string | null
        }
        Update: {
          created_at?: string | null
          created_by?: string | null
          description?: string | null
          id?: string
          name?: string
          section?: string | null
          subject?: string | null
          teacher_id?: string | null
        }
        Relationships: []
      }
      exams: {
        Row: {
          class_id: string | null
          created_at: string | null
          created_by: string | null
          date: string
          duration_minutes: number | null
          id: string
          subject: string
          syllabus: string | null
          time: string | null
          title: string
          total_marks: number | null
          updated_at: string | null
        }
        Insert: {
          class_id?: string | null
          created_at?: string | null
          created_by?: string | null
          date: string
          duration_minutes?: number | null
          id?: string
          subject: string
          syllabus?: string | null
          time?: string | null
          title: string
          total_marks?: number | null
          updated_at?: string | null
        }
        Update: {
          class_id?: string | null
          created_at?: string | null
          created_by?: string | null
          date?: string
          duration_minutes?: number | null
          id?: string
          subject?: string
          syllabus?: string | null
          time?: string | null
          title?: string
          total_marks?: number | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "exams_class_id_fkey"
            columns: ["class_id"]
            isOneToOne: false
            referencedRelation: "classes"
            referencedColumns: ["id"]
          },
        ]
      }
      feedback: {
        Row: {
          created_at: string | null
          id: string
          message: string
          name: string
          user_id: string | null
        }
        Insert: {
          created_at?: string | null
          id?: string
          message: string
          name: string
          user_id?: string | null
        }
        Update: {
          created_at?: string | null
          id?: string
          message?: string
          name?: string
          user_id?: string | null
        }
        Relationships: []
      }
      goals: {
        Row: {
          completed: boolean | null
          created_at: string | null
          deadline: string
          hours_target: number
          id: string
          subject: string
          user_id: string
        }
        Insert: {
          completed?: boolean | null
          created_at?: string | null
          deadline: string
          hours_target: number
          id?: string
          subject: string
          user_id: string
        }
        Update: {
          completed?: boolean | null
          created_at?: string | null
          deadline?: string
          hours_target?: number
          id?: string
          subject?: string
          user_id?: string
        }
        Relationships: []
      }
      messages: {
        Row: {
          created_at: string | null
          id: string
          message: string
          read: boolean | null
          receiver_id: string
          sender_id: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          message: string
          read?: boolean | null
          receiver_id: string
          sender_id: string
        }
        Update: {
          created_at?: string | null
          id?: string
          message?: string
          read?: boolean | null
          receiver_id?: string
          sender_id?: string
        }
        Relationships: []
      }
      mood_entries: {
        Row: {
          created_at: string | null
          id: string
          mood: string
          note: string | null
          user_id: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          mood: string
          note?: string | null
          user_id: string
        }
        Update: {
          created_at?: string | null
          id?: string
          mood?: string
          note?: string | null
          user_id?: string
        }
        Relationships: []
      }
      notifications: {
        Row: {
          created_at: string | null
          id: string
          message: string
          read: boolean | null
          title: string
          type: string | null
          user_id: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          message: string
          read?: boolean | null
          title: string
          type?: string | null
          user_id: string
        }
        Update: {
          created_at?: string | null
          id?: string
          message?: string
          read?: boolean | null
          title?: string
          type?: string | null
          user_id?: string
        }
        Relationships: []
      }
      predictions: {
        Row: {
          attendance: number
          created_at: string | null
          family_income: number
          hours_studied: number
          id: string
          parental_involvement: number
          predicted_score: number
          sleep_hours: number
          user_id: string
        }
        Insert: {
          attendance: number
          created_at?: string | null
          family_income: number
          hours_studied: number
          id?: string
          parental_involvement: number
          predicted_score: number
          sleep_hours: number
          user_id: string
        }
        Update: {
          attendance?: number
          created_at?: string | null
          family_income?: number
          hours_studied?: number
          id?: string
          parental_involvement?: number
          predicted_score?: number
          sleep_hours?: number
          user_id?: string
        }
        Relationships: []
      }
      profiles: {
        Row: {
          avatar_url: string | null
          created_at: string | null
          full_name: string | null
          id: string
        }
        Insert: {
          avatar_url?: string | null
          created_at?: string | null
          full_name?: string | null
          id: string
        }
        Update: {
          avatar_url?: string | null
          created_at?: string | null
          full_name?: string | null
          id?: string
        }
        Relationships: []
      }
      progress_tracker: {
        Row: {
          created_at: string
          current_day: number
          homework_done: boolean
          id: string
          last_updated: string
          sleep_done: boolean
          streak: number
          study_done: boolean
          user_id: string
        }
        Insert: {
          created_at?: string
          current_day?: number
          homework_done?: boolean
          id?: string
          last_updated?: string
          sleep_done?: boolean
          streak?: number
          study_done?: boolean
          user_id: string
        }
        Update: {
          created_at?: string
          current_day?: number
          homework_done?: boolean
          id?: string
          last_updated?: string
          sleep_done?: boolean
          streak?: number
          study_done?: boolean
          user_id?: string
        }
        Relationships: []
      }
      reports: {
        Row: {
          class_id: string | null
          created_at: string | null
          description: string | null
          generated_by: string | null
          id: string
          report_data: Json | null
          report_type: string
          report_url: string | null
          title: string
          user_id: string | null
        }
        Insert: {
          class_id?: string | null
          created_at?: string | null
          description?: string | null
          generated_by?: string | null
          id?: string
          report_data?: Json | null
          report_type: string
          report_url?: string | null
          title: string
          user_id?: string | null
        }
        Update: {
          class_id?: string | null
          created_at?: string | null
          description?: string | null
          generated_by?: string | null
          id?: string
          report_data?: Json | null
          report_type?: string
          report_url?: string | null
          title?: string
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "reports_class_id_fkey"
            columns: ["class_id"]
            isOneToOne: false
            referencedRelation: "classes"
            referencedColumns: ["id"]
          },
        ]
      }
      resources: {
        Row: {
          class_id: string | null
          created_at: string | null
          description: string | null
          id: string
          resource_type: string | null
          resource_url: string
          subject: string | null
          title: string
          uploaded_by: string | null
        }
        Insert: {
          class_id?: string | null
          created_at?: string | null
          description?: string | null
          id?: string
          resource_type?: string | null
          resource_url: string
          subject?: string | null
          title: string
          uploaded_by?: string | null
        }
        Update: {
          class_id?: string | null
          created_at?: string | null
          description?: string | null
          id?: string
          resource_type?: string | null
          resource_url?: string
          subject?: string | null
          title?: string
          uploaded_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "resources_class_id_fkey"
            columns: ["class_id"]
            isOneToOne: false
            referencedRelation: "classes"
            referencedColumns: ["id"]
          },
        ]
      }
      student_analytics: {
        Row: {
          chapter: string | null
          created_at: string | null
          id: string
          last_activity: string | null
          learning_speed: string | null
          performance_score: number | null
          student_id: string
          subject: string | null
          weak_areas: string[] | null
        }
        Insert: {
          chapter?: string | null
          created_at?: string | null
          id?: string
          last_activity?: string | null
          learning_speed?: string | null
          performance_score?: number | null
          student_id: string
          subject?: string | null
          weak_areas?: string[] | null
        }
        Update: {
          chapter?: string | null
          created_at?: string | null
          id?: string
          last_activity?: string | null
          learning_speed?: string | null
          performance_score?: number | null
          student_id?: string
          subject?: string | null
          weak_areas?: string[] | null
        }
        Relationships: []
      }
      teacher_requests: {
        Row: {
          admin_notes: string | null
          created_at: string | null
          email: string
          experience: string | null
          full_name: string
          id: string
          phone: string | null
          qualification: string | null
          reason: string | null
          reviewed_at: string | null
          reviewed_by: string | null
          status: string | null
          subject: string | null
          user_id: string
        }
        Insert: {
          admin_notes?: string | null
          created_at?: string | null
          email: string
          experience?: string | null
          full_name: string
          id?: string
          phone?: string | null
          qualification?: string | null
          reason?: string | null
          reviewed_at?: string | null
          reviewed_by?: string | null
          status?: string | null
          subject?: string | null
          user_id: string
        }
        Update: {
          admin_notes?: string | null
          created_at?: string | null
          email?: string
          experience?: string | null
          full_name?: string
          id?: string
          phone?: string | null
          qualification?: string | null
          reason?: string | null
          reviewed_at?: string | null
          reviewed_by?: string | null
          status?: string | null
          subject?: string | null
          user_id?: string
        }
        Relationships: []
      }
      teachers: {
        Row: {
          approved_at: string | null
          created_at: string | null
          email: string
          experience: string | null
          full_name: string
          id: string
          phone: string | null
          qualification: string | null
          subject: string | null
          user_id: string | null
        }
        Insert: {
          approved_at?: string | null
          created_at?: string | null
          email: string
          experience?: string | null
          full_name: string
          id?: string
          phone?: string | null
          qualification?: string | null
          subject?: string | null
          user_id?: string | null
        }
        Update: {
          approved_at?: string | null
          created_at?: string | null
          email?: string
          experience?: string | null
          full_name?: string
          id?: string
          phone?: string | null
          qualification?: string | null
          subject?: string | null
          user_id?: string | null
        }
        Relationships: []
      }
      user_roles: {
        Row: {
          created_at: string | null
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          created_at?: string | null
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
      setup_admin_user: { Args: { admin_email: string }; Returns: undefined }
    }
    Enums: {
      app_role: "student" | "teacher" | "admin"
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
      app_role: ["student", "teacher", "admin"],
    },
  },
} as const
