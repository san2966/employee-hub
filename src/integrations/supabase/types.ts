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
    PostgrestVersion: "14.1"
  }
  public: {
    Tables: {
      admin_assets: {
        Row: {
          assigned_to: string | null
          assigned_to_name: string | null
          brand: string | null
          category: string
          condition: string | null
          created_at: string | null
          id: string
          image: string | null
          invoice_number: string | null
          location: string | null
          name: string
          purchase_date: string | null
          purchase_price: number | null
          quantity: number | null
          remarks: string | null
          serial_number: string | null
          updated_at: string | null
          vendor: string | null
          warranty_till: string | null
        }
        Insert: {
          assigned_to?: string | null
          assigned_to_name?: string | null
          brand?: string | null
          category: string
          condition?: string | null
          created_at?: string | null
          id?: string
          image?: string | null
          invoice_number?: string | null
          location?: string | null
          name: string
          purchase_date?: string | null
          purchase_price?: number | null
          quantity?: number | null
          remarks?: string | null
          serial_number?: string | null
          updated_at?: string | null
          vendor?: string | null
          warranty_till?: string | null
        }
        Update: {
          assigned_to?: string | null
          assigned_to_name?: string | null
          brand?: string | null
          category?: string
          condition?: string | null
          created_at?: string | null
          id?: string
          image?: string | null
          invoice_number?: string | null
          location?: string | null
          name?: string
          purchase_date?: string | null
          purchase_price?: number | null
          quantity?: number | null
          remarks?: string | null
          serial_number?: string | null
          updated_at?: string | null
          vendor?: string | null
          warranty_till?: string | null
        }
        Relationships: []
      }
      admin_employees: {
        Row: {
          address: string
          alternate_phone: string | null
          created_at: string
          designation: string
          id: string
          name: string
          phone: string
          photo: string | null
          updated_at: string
        }
        Insert: {
          address: string
          alternate_phone?: string | null
          created_at?: string
          designation: string
          id?: string
          name: string
          phone: string
          photo?: string | null
          updated_at?: string
        }
        Update: {
          address?: string
          alternate_phone?: string | null
          created_at?: string
          designation?: string
          id?: string
          name?: string
          phone?: string
          photo?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      admin_payments: {
        Row: {
          amount: number
          created_at: string | null
          date: string
          id: string
          paid_to: string
          payment_mode: string
          purpose: string
          receipt_url: string | null
          remarks: string | null
        }
        Insert: {
          amount: number
          created_at?: string | null
          date: string
          id?: string
          paid_to: string
          payment_mode: string
          purpose: string
          receipt_url?: string | null
          remarks?: string | null
        }
        Update: {
          amount?: number
          created_at?: string | null
          date?: string
          id?: string
          paid_to?: string
          payment_mode?: string
          purpose?: string
          receipt_url?: string | null
          remarks?: string | null
        }
        Relationships: []
      }
      admin_task: {
        Row: {
          created_at: string
          description: string | null
          employee_id: string | null
          employee_name: string | null
          id: string
          status: string
          subject: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          employee_id?: string | null
          employee_name?: string | null
          id?: string
          status?: string
          subject: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          description?: string | null
          employee_id?: string | null
          employee_name?: string | null
          id?: string
          status?: string
          subject?: string
          updated_at?: string
        }
        Relationships: []
      }
      approval_requests: {
        Row: {
          attendance_id: string | null
          created_at: string | null
          date: string
          employee_id: string
          hr_notes: string | null
          id: string
          location: string
          status: string
          updated_at: string | null
        }
        Insert: {
          attendance_id?: string | null
          created_at?: string | null
          date: string
          employee_id: string
          hr_notes?: string | null
          id?: string
          location: string
          status?: string
          updated_at?: string | null
        }
        Update: {
          attendance_id?: string | null
          created_at?: string | null
          date?: string
          employee_id?: string
          hr_notes?: string | null
          id?: string
          location?: string
          status?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "approval_requests_attendance_id_fkey"
            columns: ["attendance_id"]
            isOneToOne: false
            referencedRelation: "attendance"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "approval_requests_employee_id_fkey"
            columns: ["employee_id"]
            isOneToOne: false
            referencedRelation: "employees"
            referencedColumns: ["id"]
          },
        ]
      }
      attendance: {
        Row: {
          approved_by: string | null
          created_at: string | null
          date: string
          employee_id: string
          id: string
          in_time: string | null
          location: string
          out_time: string | null
          status: string
          updated_at: string | null
        }
        Insert: {
          approved_by?: string | null
          created_at?: string | null
          date: string
          employee_id: string
          id?: string
          in_time?: string | null
          location: string
          out_time?: string | null
          status?: string
          updated_at?: string | null
        }
        Update: {
          approved_by?: string | null
          created_at?: string | null
          date?: string
          employee_id?: string
          id?: string
          in_time?: string | null
          location?: string
          out_time?: string | null
          status?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "attendance_employee_id_fkey"
            columns: ["employee_id"]
            isOneToOne: false
            referencedRelation: "employees"
            referencedColumns: ["id"]
          },
        ]
      }
      contacts: {
        Row: {
          created_at: string | null
          department: string
          designation: string
          email: string | null
          extension: string | null
          id: string
          is_active: boolean | null
          name: string
          phone: string
        }
        Insert: {
          created_at?: string | null
          department: string
          designation: string
          email?: string | null
          extension?: string | null
          id?: string
          is_active?: boolean | null
          name: string
          phone: string
        }
        Update: {
          created_at?: string | null
          department?: string
          designation?: string
          email?: string | null
          extension?: string | null
          id?: string
          is_active?: boolean | null
          name?: string
          phone?: string
        }
        Relationships: []
      }
      daily_reports: {
        Row: {
          content: string
          created_at: string | null
          date: string
          employee_id: string
          id: string
        }
        Insert: {
          content: string
          created_at?: string | null
          date: string
          employee_id: string
          id?: string
        }
        Update: {
          content?: string
          created_at?: string | null
          date?: string
          employee_id?: string
          id?: string
        }
        Relationships: [
          {
            foreignKeyName: "daily_reports_employee_id_fkey"
            columns: ["employee_id"]
            isOneToOne: false
            referencedRelation: "employees"
            referencedColumns: ["id"]
          },
        ]
      }
      director_tasks: {
        Row: {
          completed_at: string | null
          created_at: string | null
          date: string
          department: string
          expected_days: number
          id: string
          report: string | null
          status: string
          task: string
          updated_at: string | null
        }
        Insert: {
          completed_at?: string | null
          created_at?: string | null
          date?: string
          department: string
          expected_days?: number
          id?: string
          report?: string | null
          status?: string
          task: string
          updated_at?: string | null
        }
        Update: {
          completed_at?: string | null
          created_at?: string | null
          date?: string
          department?: string
          expected_days?: number
          id?: string
          report?: string | null
          status?: string
          task?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      email_send_log: {
        Row: {
          created_at: string
          error_message: string | null
          id: string
          message_id: string | null
          metadata: Json | null
          recipient_email: string
          status: string
          template_name: string
        }
        Insert: {
          created_at?: string
          error_message?: string | null
          id?: string
          message_id?: string | null
          metadata?: Json | null
          recipient_email: string
          status: string
          template_name: string
        }
        Update: {
          created_at?: string
          error_message?: string | null
          id?: string
          message_id?: string | null
          metadata?: Json | null
          recipient_email?: string
          status?: string
          template_name?: string
        }
        Relationships: []
      }
      email_send_state: {
        Row: {
          auth_email_ttl_minutes: number
          batch_size: number
          id: number
          retry_after_until: string | null
          send_delay_ms: number
          transactional_email_ttl_minutes: number
          updated_at: string
        }
        Insert: {
          auth_email_ttl_minutes?: number
          batch_size?: number
          id?: number
          retry_after_until?: string | null
          send_delay_ms?: number
          transactional_email_ttl_minutes?: number
          updated_at?: string
        }
        Update: {
          auth_email_ttl_minutes?: number
          batch_size?: number
          id?: number
          retry_after_until?: string | null
          send_delay_ms?: number
          transactional_email_ttl_minutes?: number
          updated_at?: string
        }
        Relationships: []
      }
      email_unsubscribe_tokens: {
        Row: {
          created_at: string
          email: string
          id: string
          token: string
          used_at: string | null
        }
        Insert: {
          created_at?: string
          email: string
          id?: string
          token: string
          used_at?: string | null
        }
        Update: {
          created_at?: string
          email?: string
          id?: string
          token?: string
          used_at?: string | null
        }
        Relationships: []
      }
      employee_payments: {
        Row: {
          amount: number
          approved_by: string | null
          category: string
          created_at: string | null
          date: string
          description: string
          employee_id: string
          employee_name: string | null
          from_location: string | null
          id: string
          purpose: string | null
          receipt_url: string | null
          status: Database["public"]["Enums"]["payment_status"] | null
          to_location: string | null
          updated_at: string | null
        }
        Insert: {
          amount: number
          approved_by?: string | null
          category: string
          created_at?: string | null
          date: string
          description: string
          employee_id: string
          employee_name?: string | null
          from_location?: string | null
          id?: string
          purpose?: string | null
          receipt_url?: string | null
          status?: Database["public"]["Enums"]["payment_status"] | null
          to_location?: string | null
          updated_at?: string | null
        }
        Update: {
          amount?: number
          approved_by?: string | null
          category?: string
          created_at?: string | null
          date?: string
          description?: string
          employee_id?: string
          employee_name?: string | null
          from_location?: string | null
          id?: string
          purpose?: string | null
          receipt_url?: string | null
          status?: Database["public"]["Enums"]["payment_status"] | null
          to_location?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
      employee_settings: {
        Row: {
          created_at: string
          designation: string | null
          employee_id: string
          first_name: string | null
          id: string
          last_name: string | null
          mobile: string | null
          photo: string | null
          preferences: Json
          updated_at: string
        }
        Insert: {
          created_at?: string
          designation?: string | null
          employee_id: string
          first_name?: string | null
          id?: string
          last_name?: string | null
          mobile?: string | null
          photo?: string | null
          preferences?: Json
          updated_at?: string
        }
        Update: {
          created_at?: string
          designation?: string | null
          employee_id?: string
          first_name?: string | null
          id?: string
          last_name?: string | null
          mobile?: string | null
          photo?: string | null
          preferences?: Json
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "employee_settings_employee_id_fkey"
            columns: ["employee_id"]
            isOneToOne: true
            referencedRelation: "employees"
            referencedColumns: ["id"]
          },
        ]
      }
      employees: {
        Row: {
          aadhaar_number: string
          additional_charge: string | null
          address: string
          blood_group: string
          board_university: string
          certifications: string | null
          created_at: string | null
          date_of_joining: string
          degree_name: string
          designation: string
          email: string
          exchange_leave_balance: number | null
          father_mobile: string | null
          father_name: string
          first_name: string | null
          highest_education: string
          id: string
          is_active: boolean | null
          is_fresher: boolean | null
          job_period_from: string | null
          job_period_to: string | null
          last_name: string | null
          marks_percentage: string | null
          medical_leave_balance: number | null
          mobile: string | null
          mother_mobile: string | null
          mother_name: string
          name: string
          organization_name: string | null
          paid_leave_balance: number | null
          pan_number: string
          passed_or_appearing: string
          phone: string
          photo: string | null
          post_held: string | null
          previous_ctc: string | null
          reason_of_leaving: string | null
          responsibilities: string
          school_college: string
          specialization: string | null
          total_experience: string | null
          updated_at: string | null
          username: string
          year_of_passing: string
        }
        Insert: {
          aadhaar_number: string
          additional_charge?: string | null
          address: string
          blood_group: string
          board_university: string
          certifications?: string | null
          created_at?: string | null
          date_of_joining: string
          degree_name: string
          designation: string
          email: string
          exchange_leave_balance?: number | null
          father_mobile?: string | null
          father_name: string
          first_name?: string | null
          highest_education: string
          id?: string
          is_active?: boolean | null
          is_fresher?: boolean | null
          job_period_from?: string | null
          job_period_to?: string | null
          last_name?: string | null
          marks_percentage?: string | null
          medical_leave_balance?: number | null
          mobile?: string | null
          mother_mobile?: string | null
          mother_name: string
          name: string
          organization_name?: string | null
          paid_leave_balance?: number | null
          pan_number: string
          passed_or_appearing: string
          phone: string
          photo?: string | null
          post_held?: string | null
          previous_ctc?: string | null
          reason_of_leaving?: string | null
          responsibilities: string
          school_college: string
          specialization?: string | null
          total_experience?: string | null
          updated_at?: string | null
          username: string
          year_of_passing: string
        }
        Update: {
          aadhaar_number?: string
          additional_charge?: string | null
          address?: string
          blood_group?: string
          board_university?: string
          certifications?: string | null
          created_at?: string | null
          date_of_joining?: string
          degree_name?: string
          designation?: string
          email?: string
          exchange_leave_balance?: number | null
          father_mobile?: string | null
          father_name?: string
          first_name?: string | null
          highest_education?: string
          id?: string
          is_active?: boolean | null
          is_fresher?: boolean | null
          job_period_from?: string | null
          job_period_to?: string | null
          last_name?: string | null
          marks_percentage?: string | null
          medical_leave_balance?: number | null
          mobile?: string | null
          mother_mobile?: string | null
          mother_name?: string
          name?: string
          organization_name?: string | null
          paid_leave_balance?: number | null
          pan_number?: string
          passed_or_appearing?: string
          phone?: string
          photo?: string | null
          post_held?: string | null
          previous_ctc?: string | null
          reason_of_leaving?: string | null
          responsibilities?: string
          school_college?: string
          specialization?: string | null
          total_experience?: string | null
          updated_at?: string | null
          username?: string
          year_of_passing?: string
        }
        Relationships: []
      }
      fuel_entries: {
        Row: {
          amount: number
          created_at: string
          date: string
          id: string
          quantity: number
          vehicle_id: string | null
          vehicle_info: string | null
        }
        Insert: {
          amount?: number
          created_at?: string
          date: string
          id?: string
          quantity?: number
          vehicle_id?: string | null
          vehicle_info?: string | null
        }
        Update: {
          amount?: number
          created_at?: string
          date?: string
          id?: string
          quantity?: number
          vehicle_id?: string | null
          vehicle_info?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "fuel_entries_vehicle_id_fkey"
            columns: ["vehicle_id"]
            isOneToOne: false
            referencedRelation: "vehicles"
            referencedColumns: ["id"]
          },
        ]
      }
      inward_outward: {
        Row: {
          attachment_url: string | null
          created_at: string | null
          date: string
          document_type: string
          id: string
          reference_number: string | null
          register_type: string
          remarks: string | null
          sender_receiver: string
          subject: string
        }
        Insert: {
          attachment_url?: string | null
          created_at?: string | null
          date: string
          document_type: string
          id?: string
          reference_number?: string | null
          register_type: string
          remarks?: string | null
          sender_receiver: string
          subject: string
        }
        Update: {
          attachment_url?: string | null
          created_at?: string | null
          date?: string
          document_type?: string
          id?: string
          reference_number?: string | null
          register_type?: string
          remarks?: string | null
          sender_receiver?: string
          subject?: string
        }
        Relationships: []
      }
      it_asset_assignments: {
        Row: {
          asset_id: string
          assigned_at: string
          assigned_to: string
          created_at: string
          id: string
          record_url: string | null
          updated_at: string
        }
        Insert: {
          asset_id: string
          assigned_at?: string
          assigned_to: string
          created_at?: string
          id?: string
          record_url?: string | null
          updated_at?: string
        }
        Update: {
          asset_id?: string
          assigned_at?: string
          assigned_to?: string
          created_at?: string
          id?: string
          record_url?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "it_asset_assignments_asset_id_fkey"
            columns: ["asset_id"]
            isOneToOne: false
            referencedRelation: "it_assets"
            referencedColumns: ["id"]
          },
        ]
      }
      it_assets: {
        Row: {
          asset_type: string
          assigned_to: string | null
          brand: string
          created_at: string | null
          display_model: string | null
          display_serial: string | null
          id: string
          invoice_url: string | null
          mac_address: string | null
          model: string
          motherboard_model: string | null
          motherboard_serial: string | null
          photo: string | null
          processor: string | null
          purchase_date: string
          ram_serial: string | null
          ram_size: string | null
          registration_number: string
          serial_number: string
          storage_serial: string | null
          storage_size: string | null
          storage_type: string | null
          updated_at: string | null
          warranty_till: string
        }
        Insert: {
          asset_type: string
          assigned_to?: string | null
          brand: string
          created_at?: string | null
          display_model?: string | null
          display_serial?: string | null
          id?: string
          invoice_url?: string | null
          mac_address?: string | null
          model: string
          motherboard_model?: string | null
          motherboard_serial?: string | null
          photo?: string | null
          processor?: string | null
          purchase_date: string
          ram_serial?: string | null
          ram_size?: string | null
          registration_number: string
          serial_number: string
          storage_serial?: string | null
          storage_size?: string | null
          storage_type?: string | null
          updated_at?: string | null
          warranty_till: string
        }
        Update: {
          asset_type?: string
          assigned_to?: string | null
          brand?: string
          created_at?: string | null
          display_model?: string | null
          display_serial?: string | null
          id?: string
          invoice_url?: string | null
          mac_address?: string | null
          model?: string
          motherboard_model?: string | null
          motherboard_serial?: string | null
          photo?: string | null
          processor?: string | null
          purchase_date?: string
          ram_serial?: string | null
          ram_size?: string | null
          registration_number?: string
          serial_number?: string
          storage_serial?: string | null
          storage_size?: string | null
          storage_type?: string | null
          updated_at?: string | null
          warranty_till?: string
        }
        Relationships: [
          {
            foreignKeyName: "it_assets_assigned_to_fkey"
            columns: ["assigned_to"]
            isOneToOne: false
            referencedRelation: "employees"
            referencedColumns: ["id"]
          },
        ]
      }
      it_network_images: {
        Row: {
          created_at: string | null
          id: string
          image_type: string
          name: string
          url: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          image_type: string
          name: string
          url: string
        }
        Update: {
          created_at?: string | null
          id?: string
          image_type?: string
          name?: string
          url?: string
        }
        Relationships: []
      }
      it_passwords: {
        Row: {
          created_at: string | null
          encrypted_password: string
          id: string
          portal: string
          updated_at: string | null
          username: string
        }
        Insert: {
          created_at?: string | null
          encrypted_password: string
          id?: string
          portal: string
          updated_at?: string | null
          username: string
        }
        Update: {
          created_at?: string | null
          encrypted_password?: string
          id?: string
          portal?: string
          updated_at?: string | null
          username?: string
        }
        Relationships: []
      }
      leave_requests: {
        Row: {
          approved_by: string | null
          created_at: string | null
          date: string
          employee_id: string
          id: string
          is_add_leave: boolean | null
          leave_type: Database["public"]["Enums"]["leave_type"]
          medical_certificate: string | null
          reason: string
          rejection_reason: string | null
          status: Database["public"]["Enums"]["leave_status"] | null
          updated_at: string | null
          working_date: string | null
          working_reason: string | null
        }
        Insert: {
          approved_by?: string | null
          created_at?: string | null
          date: string
          employee_id: string
          id?: string
          is_add_leave?: boolean | null
          leave_type: Database["public"]["Enums"]["leave_type"]
          medical_certificate?: string | null
          reason: string
          rejection_reason?: string | null
          status?: Database["public"]["Enums"]["leave_status"] | null
          updated_at?: string | null
          working_date?: string | null
          working_reason?: string | null
        }
        Update: {
          approved_by?: string | null
          created_at?: string | null
          date?: string
          employee_id?: string
          id?: string
          is_add_leave?: boolean | null
          leave_type?: Database["public"]["Enums"]["leave_type"]
          medical_certificate?: string | null
          reason?: string
          rejection_reason?: string | null
          status?: Database["public"]["Enums"]["leave_status"] | null
          updated_at?: string | null
          working_date?: string | null
          working_reason?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "leave_requests_employee_id_fkey"
            columns: ["employee_id"]
            isOneToOne: false
            referencedRelation: "employees"
            referencedColumns: ["id"]
          },
        ]
      }
      leave_reset_audit: {
        Row: {
          employee_id: string
          exchange_leaves_reset: number
          id: string
          medical_leaves_reset: number
          paid_leaves_reset: number
          reset_at: string | null
          reset_year: number
        }
        Insert: {
          employee_id: string
          exchange_leaves_reset: number
          id?: string
          medical_leaves_reset: number
          paid_leaves_reset: number
          reset_at?: string | null
          reset_year: number
        }
        Update: {
          employee_id?: string
          exchange_leaves_reset?: number
          id?: string
          medical_leaves_reset?: number
          paid_leaves_reset?: number
          reset_at?: string | null
          reset_year?: number
        }
        Relationships: [
          {
            foreignKeyName: "leave_reset_audit_employee_id_fkey"
            columns: ["employee_id"]
            isOneToOne: false
            referencedRelation: "employees"
            referencedColumns: ["id"]
          },
        ]
      }
      notices: {
        Row: {
          content: string
          created_at: string | null
          created_by: string | null
          expires_at: string | null
          id: string
          is_active: boolean | null
          is_global: boolean
          notice_type: string
          recipient_employee_ids: string[]
          title: string
        }
        Insert: {
          content: string
          created_at?: string | null
          created_by?: string | null
          expires_at?: string | null
          id?: string
          is_active?: boolean | null
          is_global?: boolean
          notice_type?: string
          recipient_employee_ids?: string[]
          title: string
        }
        Update: {
          content?: string
          created_at?: string | null
          created_by?: string | null
          expires_at?: string | null
          id?: string
          is_active?: boolean | null
          is_global?: boolean
          notice_type?: string
          recipient_employee_ids?: string[]
          title?: string
        }
        Relationships: []
      }
      operations_brochures: {
        Row: {
          created_at: string | null
          created_by: string | null
          description: string | null
          file_url: string | null
          id: string
          product_name: string
        }
        Insert: {
          created_at?: string | null
          created_by?: string | null
          description?: string | null
          file_url?: string | null
          id?: string
          product_name: string
        }
        Update: {
          created_at?: string | null
          created_by?: string | null
          description?: string | null
          file_url?: string | null
          id?: string
          product_name?: string
        }
        Relationships: []
      }
      operations_events: {
        Row: {
          created_at: string | null
          created_by: string | null
          description: string | null
          event_date: string | null
          event_time: string | null
          id: string
          title: string
        }
        Insert: {
          created_at?: string | null
          created_by?: string | null
          description?: string | null
          event_date?: string | null
          event_time?: string | null
          id?: string
          title: string
        }
        Update: {
          created_at?: string | null
          created_by?: string | null
          description?: string | null
          event_date?: string | null
          event_time?: string | null
          id?: string
          title?: string
        }
        Relationships: []
      }
      operations_gr: {
        Row: {
          created_at: string | null
          created_by: string | null
          department_name: string
          file_url: string | null
          gr_date: string
          id: string
          title: string
          unique_code: string
        }
        Insert: {
          created_at?: string | null
          created_by?: string | null
          department_name: string
          file_url?: string | null
          gr_date: string
          id?: string
          title: string
          unique_code: string
        }
        Update: {
          created_at?: string | null
          created_by?: string | null
          department_name?: string
          file_url?: string | null
          gr_date?: string
          id?: string
          title?: string
          unique_code?: string
        }
        Relationships: []
      }
      operations_inwards: {
        Row: {
          created_at: string | null
          created_by: string | null
          date: string | null
          document_type: string
          e_office_number: string | null
          file_url: string | null
          id: string
          organization_name: string
          product_name: string
          subject: string
        }
        Insert: {
          created_at?: string | null
          created_by?: string | null
          date?: string | null
          document_type: string
          e_office_number?: string | null
          file_url?: string | null
          id?: string
          organization_name: string
          product_name: string
          subject: string
        }
        Update: {
          created_at?: string | null
          created_by?: string | null
          date?: string | null
          document_type?: string
          e_office_number?: string | null
          file_url?: string | null
          id?: string
          organization_name?: string
          product_name?: string
          subject?: string
        }
        Relationships: []
      }
      operations_media: {
        Row: {
          created_at: string | null
          created_by: string | null
          description: string | null
          file_url: string | null
          id: string
          media_type: string
          product_name: string | null
        }
        Insert: {
          created_at?: string | null
          created_by?: string | null
          description?: string | null
          file_url?: string | null
          id?: string
          media_type: string
          product_name?: string | null
        }
        Update: {
          created_at?: string | null
          created_by?: string | null
          description?: string | null
          file_url?: string | null
          id?: string
          media_type?: string
          product_name?: string | null
        }
        Relationships: []
      }
      operations_notes: {
        Row: {
          content: string
          created_at: string | null
          created_by: string | null
          id: string
        }
        Insert: {
          content: string
          created_at?: string | null
          created_by?: string | null
          id?: string
        }
        Update: {
          content?: string
          created_at?: string | null
          created_by?: string | null
          id?: string
        }
        Relationships: []
      }
      operations_presentations: {
        Row: {
          created_at: string | null
          created_by: string | null
          description: string | null
          file_url: string | null
          id: string
          title: string
        }
        Insert: {
          created_at?: string | null
          created_by?: string | null
          description?: string | null
          file_url?: string | null
          id?: string
          title: string
        }
        Update: {
          created_at?: string | null
          created_by?: string | null
          description?: string | null
          file_url?: string | null
          id?: string
          title?: string
        }
        Relationships: []
      }
      operations_proposals: {
        Row: {
          created_at: string | null
          created_by: string | null
          file_url: string | null
          id: string
          organization_name: string
          product_name: string
          reason: string | null
          status: string
          subject: string
          to_sender: string
          unique_id: string
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          created_by?: string | null
          file_url?: string | null
          id?: string
          organization_name: string
          product_name: string
          reason?: string | null
          status?: string
          subject: string
          to_sender: string
          unique_id: string
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          created_by?: string | null
          file_url?: string | null
          id?: string
          organization_name?: string
          product_name?: string
          reason?: string | null
          status?: string
          subject?: string
          to_sender?: string
          unique_id?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      operations_reminders: {
        Row: {
          created_at: string | null
          created_by: string | null
          date_time: string
          id: string
          notified: boolean | null
          title: string
        }
        Insert: {
          created_at?: string | null
          created_by?: string | null
          date_time: string
          id?: string
          notified?: boolean | null
          title: string
        }
        Update: {
          created_at?: string | null
          created_by?: string | null
          date_time?: string
          id?: string
          notified?: boolean | null
          title?: string
        }
        Relationships: []
      }
      operations_settings: {
        Row: {
          created_at: string | null
          designation: string | null
          first_name: string | null
          id: string
          last_name: string | null
          mobile: string | null
          profile_photo_url: string | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          created_at?: string | null
          designation?: string | null
          first_name?: string | null
          id?: string
          last_name?: string | null
          mobile?: string | null
          profile_photo_url?: string | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          created_at?: string | null
          designation?: string | null
          first_name?: string | null
          id?: string
          last_name?: string | null
          mobile?: string | null
          profile_photo_url?: string | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
      portal_users: {
        Row: {
          created_at: string | null
          employee_id: string | null
          id: string
          is_active: boolean | null
          last_login: string | null
          password_hash: string
          role: Database["public"]["Enums"]["portal_role"]
          username: string
        }
        Insert: {
          created_at?: string | null
          employee_id?: string | null
          id?: string
          is_active?: boolean | null
          last_login?: string | null
          password_hash: string
          role: Database["public"]["Enums"]["portal_role"]
          username: string
        }
        Update: {
          created_at?: string | null
          employee_id?: string | null
          id?: string
          is_active?: boolean | null
          last_login?: string | null
          password_hash?: string
          role?: Database["public"]["Enums"]["portal_role"]
          username?: string
        }
        Relationships: []
      }
      products: {
        Row: {
          category: string
          created_at: string | null
          description: string | null
          id: string
          image: string | null
          is_active: boolean | null
          name: string
          price: number | null
          stock_quantity: number | null
          unit: string | null
          updated_at: string | null
        }
        Insert: {
          category: string
          created_at?: string | null
          description?: string | null
          id?: string
          image?: string | null
          is_active?: boolean | null
          name: string
          price?: number | null
          stock_quantity?: number | null
          unit?: string | null
          updated_at?: string | null
        }
        Update: {
          category?: string
          created_at?: string | null
          description?: string | null
          id?: string
          image?: string | null
          is_active?: boolean | null
          name?: string
          price?: number | null
          stock_quantity?: number | null
          unit?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
      purchase_contacts: {
        Row: {
          created_at: string | null
          created_by: string | null
          department: string | null
          designation: string | null
          email: string | null
          id: string
          name: string
          organization: string | null
          phone: string
        }
        Insert: {
          created_at?: string | null
          created_by?: string | null
          department?: string | null
          designation?: string | null
          email?: string | null
          id?: string
          name: string
          organization?: string | null
          phone: string
        }
        Update: {
          created_at?: string | null
          created_by?: string | null
          department?: string | null
          designation?: string | null
          email?: string | null
          id?: string
          name?: string
          organization?: string | null
          phone?: string
        }
        Relationships: []
      }
      purchase_dispatches: {
        Row: {
          created_at: string | null
          created_by: string | null
          delivered_date: string | null
          dispatched_date: string
          eway_bill_no: string | null
          eway_bill_url: string | null
          expected_date: string | null
          id: string
          organization_name: string
          status: string | null
          transporter_name: string
          updated_at: string | null
          vehicle_no: string | null
          work_order_no: string
        }
        Insert: {
          created_at?: string | null
          created_by?: string | null
          delivered_date?: string | null
          dispatched_date: string
          eway_bill_no?: string | null
          eway_bill_url?: string | null
          expected_date?: string | null
          id?: string
          organization_name: string
          status?: string | null
          transporter_name: string
          updated_at?: string | null
          vehicle_no?: string | null
          work_order_no: string
        }
        Update: {
          created_at?: string | null
          created_by?: string | null
          delivered_date?: string | null
          dispatched_date?: string
          eway_bill_no?: string | null
          eway_bill_url?: string | null
          expected_date?: string | null
          id?: string
          organization_name?: string
          status?: string | null
          transporter_name?: string
          updated_at?: string | null
          vehicle_no?: string | null
          work_order_no?: string
        }
        Relationships: []
      }
      purchase_documents: {
        Row: {
          created_at: string
          created_by: string | null
          custom_type: string | null
          file_url: string | null
          id: string
          name: string
          type: string
          uploaded_at: string | null
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          custom_type?: string | null
          file_url?: string | null
          id?: string
          name: string
          type: string
          uploaded_at?: string | null
        }
        Update: {
          created_at?: string
          created_by?: string | null
          custom_type?: string | null
          file_url?: string | null
          id?: string
          name?: string
          type?: string
          uploaded_at?: string | null
        }
        Relationships: []
      }
      purchase_events: {
        Row: {
          created_at: string | null
          created_by: string | null
          description: string | null
          event_date: string | null
          id: string
          title: string
        }
        Insert: {
          created_at?: string | null
          created_by?: string | null
          description?: string | null
          event_date?: string | null
          id?: string
          title: string
        }
        Update: {
          created_at?: string | null
          created_by?: string | null
          description?: string | null
          event_date?: string | null
          id?: string
          title?: string
        }
        Relationships: []
      }
      purchase_installations: {
        Row: {
          amc: boolean | null
          amc_end: string | null
          amc_start: string | null
          created_at: string | null
          created_by: string | null
          hardware_install: boolean | null
          id: string
          organization_name: string
          product_inspection: boolean | null
          progress: number | null
          software_install: boolean | null
          training_done: boolean | null
          updated_at: string | null
          warranty_till: string | null
          work_order_no: string
        }
        Insert: {
          amc?: boolean | null
          amc_end?: string | null
          amc_start?: string | null
          created_at?: string | null
          created_by?: string | null
          hardware_install?: boolean | null
          id?: string
          organization_name: string
          product_inspection?: boolean | null
          progress?: number | null
          software_install?: boolean | null
          training_done?: boolean | null
          updated_at?: string | null
          warranty_till?: string | null
          work_order_no: string
        }
        Update: {
          amc?: boolean | null
          amc_end?: string | null
          amc_start?: string | null
          created_at?: string | null
          created_by?: string | null
          hardware_install?: boolean | null
          id?: string
          organization_name?: string
          product_inspection?: boolean | null
          progress?: number | null
          software_install?: boolean | null
          training_done?: boolean | null
          updated_at?: string | null
          warranty_till?: string | null
          work_order_no?: string
        }
        Relationships: []
      }
      purchase_products: {
        Row: {
          created_at: string | null
          created_by: string | null
          id: string
          image_url: string | null
          manufacturer: string
          model: string
          name: string
          price: number | null
          tech_specs_url: string | null
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          created_by?: string | null
          id?: string
          image_url?: string | null
          manufacturer: string
          model: string
          name: string
          price?: number | null
          tech_specs_url?: string | null
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          created_by?: string | null
          id?: string
          image_url?: string | null
          manufacturer?: string
          model?: string
          name?: string
          price?: number | null
          tech_specs_url?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
      purchase_project_images: {
        Row: {
          created_at: string
          created_by: string | null
          file_url: string | null
          id: string
          organization_name: string
          project_name: string
          uploaded_at: string | null
          work_order: string | null
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          file_url?: string | null
          id?: string
          organization_name: string
          project_name: string
          uploaded_at?: string | null
          work_order?: string | null
        }
        Update: {
          created_at?: string
          created_by?: string | null
          file_url?: string | null
          id?: string
          organization_name?: string
          project_name?: string
          uploaded_at?: string | null
          work_order?: string | null
        }
        Relationships: []
      }
      purchase_projects: {
        Row: {
          created_at: string | null
          created_by: string | null
          dc_report_done: boolean | null
          id: string
          installation_done: boolean | null
          name: string
          organization_name: string
          product_name: string
          proforma_invoice: boolean | null
          progress: number | null
          purchase_order: boolean | null
          quotes_final: boolean | null
          supply_done: boolean | null
          training_done: boolean | null
          updated_at: string | null
          vendor_discussion: boolean | null
        }
        Insert: {
          created_at?: string | null
          created_by?: string | null
          dc_report_done?: boolean | null
          id?: string
          installation_done?: boolean | null
          name: string
          organization_name: string
          product_name: string
          proforma_invoice?: boolean | null
          progress?: number | null
          purchase_order?: boolean | null
          quotes_final?: boolean | null
          supply_done?: boolean | null
          training_done?: boolean | null
          updated_at?: string | null
          vendor_discussion?: boolean | null
        }
        Update: {
          created_at?: string | null
          created_by?: string | null
          dc_report_done?: boolean | null
          id?: string
          installation_done?: boolean | null
          name?: string
          organization_name?: string
          product_name?: string
          proforma_invoice?: boolean | null
          progress?: number | null
          purchase_order?: boolean | null
          quotes_final?: boolean | null
          supply_done?: boolean | null
          training_done?: boolean | null
          updated_at?: string | null
          vendor_discussion?: boolean | null
        }
        Relationships: []
      }
      purchase_quotes: {
        Row: {
          created_at: string | null
          created_by: string | null
          description: string | null
          file_url: string | null
          id: string
          quote_id: string
          status: string | null
          subject: string
          type: string
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          created_by?: string | null
          description?: string | null
          file_url?: string | null
          id?: string
          quote_id: string
          status?: string | null
          subject: string
          type: string
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          created_by?: string | null
          description?: string | null
          file_url?: string | null
          id?: string
          quote_id?: string
          status?: string | null
          subject?: string
          type?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      purchase_settings: {
        Row: {
          created_at: string | null
          designation: string | null
          first_name: string | null
          id: string
          last_name: string | null
          mobile: string | null
          profile_photo_url: string | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          created_at?: string | null
          designation?: string | null
          first_name?: string | null
          id?: string
          last_name?: string | null
          mobile?: string | null
          profile_photo_url?: string | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          created_at?: string | null
          designation?: string | null
          first_name?: string | null
          id?: string
          last_name?: string | null
          mobile?: string | null
          profile_photo_url?: string | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
      purchase_support_tickets: {
        Row: {
          created_at: string | null
          created_by: string | null
          description: string
          id: string
          issue: string
          modified: boolean | null
          org_name: string
          priority: string | null
          report: string | null
          status: string | null
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          created_by?: string | null
          description: string
          id?: string
          issue: string
          modified?: boolean | null
          org_name: string
          priority?: string | null
          report?: string | null
          status?: string | null
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          created_by?: string | null
          description?: string
          id?: string
          issue?: string
          modified?: boolean | null
          org_name?: string
          priority?: string | null
          report?: string | null
          status?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
      purchase_tasks: {
        Row: {
          created_at: string | null
          created_by: string | null
          description: string
          id: string
          name: string
          report: string | null
          status: string | null
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          created_by?: string | null
          description: string
          id?: string
          name: string
          report?: string | null
          status?: string | null
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          created_by?: string | null
          description?: string
          id?: string
          name?: string
          report?: string | null
          status?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
      purchase_vendors: {
        Row: {
          contact_details: string | null
          created_at: string | null
          created_by: string | null
          id: string
          name: string
        }
        Insert: {
          contact_details?: string | null
          created_at?: string | null
          created_by?: string | null
          id?: string
          name: string
        }
        Update: {
          contact_details?: string | null
          created_at?: string | null
          created_by?: string | null
          id?: string
          name?: string
        }
        Relationships: []
      }
      purchase_work_completions: {
        Row: {
          created_at: string
          created_by: string | null
          file_url: string | null
          id: string
          name: string
          organization_name: string
          project_name: string
          uploaded_at: string | null
          work_order_no: string
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          file_url?: string | null
          id?: string
          name: string
          organization_name: string
          project_name: string
          uploaded_at?: string | null
          work_order_no: string
        }
        Update: {
          created_at?: string
          created_by?: string | null
          file_url?: string | null
          id?: string
          name?: string
          organization_name?: string
          project_name?: string
          uploaded_at?: string | null
          work_order_no?: string
        }
        Relationships: []
      }
      requirements: {
        Row: {
          approved_by: string | null
          created_at: string | null
          description: string
          employee_name: string | null
          expected_cost: number | null
          id: string
          link_url: string | null
          priority: Database["public"]["Enums"]["task_priority"] | null
          requested_by: string | null
          status: Database["public"]["Enums"]["task_status"] | null
          title: string
          updated_at: string | null
          why_needed: string | null
        }
        Insert: {
          approved_by?: string | null
          created_at?: string | null
          description: string
          employee_name?: string | null
          expected_cost?: number | null
          id?: string
          link_url?: string | null
          priority?: Database["public"]["Enums"]["task_priority"] | null
          requested_by?: string | null
          status?: Database["public"]["Enums"]["task_status"] | null
          title: string
          updated_at?: string | null
          why_needed?: string | null
        }
        Update: {
          approved_by?: string | null
          created_at?: string | null
          description?: string
          employee_name?: string | null
          expected_cost?: number | null
          id?: string
          link_url?: string | null
          priority?: Database["public"]["Enums"]["task_priority"] | null
          requested_by?: string | null
          status?: Database["public"]["Enums"]["task_status"] | null
          title?: string
          updated_at?: string | null
          why_needed?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "requirements_requested_by_fkey"
            columns: ["requested_by"]
            isOneToOne: false
            referencedRelation: "employees"
            referencedColumns: ["id"]
          },
        ]
      }
      suppressed_emails: {
        Row: {
          created_at: string
          email: string
          id: string
          metadata: Json | null
          reason: string
        }
        Insert: {
          created_at?: string
          email: string
          id?: string
          metadata?: Json | null
          reason: string
        }
        Update: {
          created_at?: string
          email?: string
          id?: string
          metadata?: Json | null
          reason?: string
        }
        Relationships: []
      }
      tasks: {
        Row: {
          assigned_by: string | null
          assigned_to: string | null
          completed_at: string | null
          created_at: string | null
          description: string | null
          due_date: string | null
          hidden_in_manager: boolean
          id: string
          priority: Database["public"]["Enums"]["task_priority"] | null
          status: Database["public"]["Enums"]["task_status"] | null
          title: string
          updated_at: string | null
        }
        Insert: {
          assigned_by?: string | null
          assigned_to?: string | null
          completed_at?: string | null
          created_at?: string | null
          description?: string | null
          due_date?: string | null
          hidden_in_manager?: boolean
          id?: string
          priority?: Database["public"]["Enums"]["task_priority"] | null
          status?: Database["public"]["Enums"]["task_status"] | null
          title: string
          updated_at?: string | null
        }
        Update: {
          assigned_by?: string | null
          assigned_to?: string | null
          completed_at?: string | null
          created_at?: string | null
          description?: string | null
          due_date?: string | null
          hidden_in_manager?: boolean
          id?: string
          priority?: Database["public"]["Enums"]["task_priority"] | null
          status?: Database["public"]["Enums"]["task_status"] | null
          title?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "tasks_assigned_by_fkey"
            columns: ["assigned_by"]
            isOneToOne: false
            referencedRelation: "employees"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "tasks_assigned_to_fkey"
            columns: ["assigned_to"]
            isOneToOne: false
            referencedRelation: "employees"
            referencedColumns: ["id"]
          },
        ]
      }
      telephone_directory: {
        Row: {
          created_at: string | null
          department: string
          id: string
          intercom: string
          phone_number: string
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          department: string
          id?: string
          intercom: string
          phone_number: string
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          department?: string
          id?: string
          intercom?: string
          phone_number?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      tender_companies: {
        Row: {
          address: string
          created_at: string
          created_by: string | null
          director_name: string
          gst_number: string
          id: string
          logo_url: string | null
          name: string
          updated_at: string
        }
        Insert: {
          address: string
          created_at?: string
          created_by?: string | null
          director_name: string
          gst_number: string
          id?: string
          logo_url?: string | null
          name: string
          updated_at?: string
        }
        Update: {
          address?: string
          created_at?: string
          created_by?: string | null
          director_name?: string
          gst_number?: string
          id?: string
          logo_url?: string | null
          name?: string
          updated_at?: string
        }
        Relationships: []
      }
      tender_company_links: {
        Row: {
          company_id: string
          created_at: string
          financial_status: string | null
          id: string
          technical_status: string | null
          tender_id: string
        }
        Insert: {
          company_id: string
          created_at?: string
          financial_status?: string | null
          id?: string
          technical_status?: string | null
          tender_id: string
        }
        Update: {
          company_id?: string
          created_at?: string
          financial_status?: string | null
          id?: string
          technical_status?: string | null
          tender_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "tender_company_links_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "tender_companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "tender_company_links_tender_id_fkey"
            columns: ["tender_id"]
            isOneToOne: false
            referencedRelation: "tenders"
            referencedColumns: ["id"]
          },
        ]
      }
      tender_contacts: {
        Row: {
          created_at: string
          created_by: string | null
          department: string | null
          designation: string | null
          email: string | null
          id: string
          name: string
          organization: string | null
          phone: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          department?: string | null
          designation?: string | null
          email?: string | null
          id?: string
          name: string
          organization?: string | null
          phone: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          created_by?: string | null
          department?: string | null
          designation?: string | null
          email?: string | null
          id?: string
          name?: string
          organization?: string | null
          phone?: string
          updated_at?: string
        }
        Relationships: []
      }
      tender_documents: {
        Row: {
          bid_date: string
          bid_number: string
          created_at: string
          created_by: string | null
          description: string
          id: string
          organization: string
          pdf_url: string | null
          product: string
          updated_at: string
        }
        Insert: {
          bid_date: string
          bid_number: string
          created_at?: string
          created_by?: string | null
          description: string
          id?: string
          organization: string
          pdf_url?: string | null
          product: string
          updated_at?: string
        }
        Update: {
          bid_date?: string
          bid_number?: string
          created_at?: string
          created_by?: string | null
          description?: string
          id?: string
          organization?: string
          pdf_url?: string | null
          product?: string
          updated_at?: string
        }
        Relationships: []
      }
      tender_notes: {
        Row: {
          content: string
          created_at: string
          id: string
          user_id: string
        }
        Insert: {
          content: string
          created_at?: string
          id?: string
          user_id: string
        }
        Update: {
          content?: string
          created_at?: string
          id?: string
          user_id?: string
        }
        Relationships: []
      }
      tender_payments: {
        Row: {
          amount: number
          bank_name: string | null
          company_name: string | null
          created_at: string
          emd_type: string | null
          id: string
          organization_name: string
          paid: boolean
          paid_at: string | null
          payment_date: string | null
          proof_url: string | null
          reason_for_payment: string | null
          remark: string | null
          return_date: string | null
          tender_number: string
          type: string
          updated_at: string
        }
        Insert: {
          amount: number
          bank_name?: string | null
          company_name?: string | null
          created_at?: string
          emd_type?: string | null
          id?: string
          organization_name: string
          paid?: boolean
          paid_at?: string | null
          payment_date?: string | null
          proof_url?: string | null
          reason_for_payment?: string | null
          remark?: string | null
          return_date?: string | null
          tender_number: string
          type: string
          updated_at?: string
        }
        Update: {
          amount?: number
          bank_name?: string | null
          company_name?: string | null
          created_at?: string
          emd_type?: string | null
          id?: string
          organization_name?: string
          paid?: boolean
          paid_at?: string | null
          payment_date?: string | null
          proof_url?: string | null
          reason_for_payment?: string | null
          remark?: string | null
          return_date?: string | null
          tender_number?: string
          type?: string
          updated_at?: string
        }
        Relationships: []
      }
      tender_products: {
        Row: {
          atc_url: string | null
          created_at: string
          created_by: string | null
          id: string
          image_url: string | null
          manufacturer: string
          model: string
          name: string
          specification: string | null
          updated_at: string
        }
        Insert: {
          atc_url?: string | null
          created_at?: string
          created_by?: string | null
          id?: string
          image_url?: string | null
          manufacturer: string
          model: string
          name: string
          specification?: string | null
          updated_at?: string
        }
        Update: {
          atc_url?: string | null
          created_at?: string
          created_by?: string | null
          id?: string
          image_url?: string | null
          manufacturer?: string
          model?: string
          name?: string
          specification?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      tender_reminders: {
        Row: {
          created_at: string
          description: string
          id: string
          reminder_date: string
          user_id: string
        }
        Insert: {
          created_at?: string
          description: string
          id?: string
          reminder_date: string
          user_id: string
        }
        Update: {
          created_at?: string
          description?: string
          id?: string
          reminder_date?: string
          user_id?: string
        }
        Relationships: []
      }
      tender_research: {
        Row: {
          amount: number | null
          close_date: string | null
          created_at: string
          created_by: string | null
          description: string
          id: string
          open_date: string | null
          organization: string
          subject: string
          tender_id_ref: string
          tender_number: string
          user_name: string
        }
        Insert: {
          amount?: number | null
          close_date?: string | null
          created_at?: string
          created_by?: string | null
          description: string
          id?: string
          open_date?: string | null
          organization: string
          subject: string
          tender_id_ref: string
          tender_number: string
          user_name: string
        }
        Update: {
          amount?: number | null
          close_date?: string | null
          created_at?: string
          created_by?: string | null
          description?: string
          id?: string
          open_date?: string | null
          organization?: string
          subject?: string
          tender_id_ref?: string
          tender_number?: string
          user_name?: string
        }
        Relationships: []
      }
      tender_settings: {
        Row: {
          created_at: string
          designation: string | null
          first_name: string | null
          id: string
          last_name: string | null
          mobile: string | null
          profile_photo_url: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          designation?: string | null
          first_name?: string | null
          id?: string
          last_name?: string | null
          mobile?: string | null
          profile_photo_url?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          designation?: string | null
          first_name?: string | null
          id?: string
          last_name?: string | null
          mobile?: string | null
          profile_photo_url?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      tender_tasks: {
        Row: {
          assigned_by: string
          assigned_to: string
          created_at: string
          created_by: string | null
          description: string
          id: string
          report: string | null
          status: string
          task_title: string
          updated_at: string
        }
        Insert: {
          assigned_by: string
          assigned_to: string
          created_at?: string
          created_by?: string | null
          description: string
          id?: string
          report?: string | null
          status?: string
          task_title: string
          updated_at?: string
        }
        Update: {
          assigned_by?: string
          assigned_to?: string
          created_at?: string
          created_by?: string | null
          description?: string
          id?: string
          report?: string | null
          status?: string
          task_title?: string
          updated_at?: string
        }
        Relationships: []
      }
      tenders: {
        Row: {
          bg: boolean | null
          bg_doc_url: string | null
          created_at: string
          created_by: string | null
          dd: boolean | null
          dd_doc_url: string | null
          document_id: string | null
          emd: boolean | null
          emd_doc_url: string | null
          epbg: boolean | null
          epbg_doc_url: string | null
          financial_opening_date: string | null
          gras: boolean | null
          gras_doc_url: string | null
          id: string
          status: string
          technical_opening_date: string | null
          updated_at: string
          work_order_url: string | null
        }
        Insert: {
          bg?: boolean | null
          bg_doc_url?: string | null
          created_at?: string
          created_by?: string | null
          dd?: boolean | null
          dd_doc_url?: string | null
          document_id?: string | null
          emd?: boolean | null
          emd_doc_url?: string | null
          epbg?: boolean | null
          epbg_doc_url?: string | null
          financial_opening_date?: string | null
          gras?: boolean | null
          gras_doc_url?: string | null
          id?: string
          status?: string
          technical_opening_date?: string | null
          updated_at?: string
          work_order_url?: string | null
        }
        Update: {
          bg?: boolean | null
          bg_doc_url?: string | null
          created_at?: string
          created_by?: string | null
          dd?: boolean | null
          dd_doc_url?: string | null
          document_id?: string | null
          emd?: boolean | null
          emd_doc_url?: string | null
          epbg?: boolean | null
          epbg_doc_url?: string | null
          financial_opening_date?: string | null
          gras?: boolean | null
          gras_doc_url?: string | null
          id?: string
          status?: string
          technical_opening_date?: string | null
          updated_at?: string
          work_order_url?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "tenders_document_id_fkey"
            columns: ["document_id"]
            isOneToOne: false
            referencedRelation: "tender_documents"
            referencedColumns: ["id"]
          },
        ]
      }
      tickets: {
        Row: {
          created_at: string
          description: string
          email: string
          id: string
          name: string
          problem_cause: string | null
          resolution_image_url: string | null
          resolved_at: string | null
          solution_provided: string | null
          status: string
          subject: string
          ticket_number: string
        }
        Insert: {
          created_at?: string
          description: string
          email: string
          id?: string
          name: string
          problem_cause?: string | null
          resolution_image_url?: string | null
          resolved_at?: string | null
          solution_provided?: string | null
          status?: string
          subject: string
          ticket_number: string
        }
        Update: {
          created_at?: string
          description?: string
          email?: string
          id?: string
          name?: string
          problem_cause?: string | null
          resolution_image_url?: string | null
          resolved_at?: string | null
          solution_provided?: string | null
          status?: string
          subject?: string
          ticket_number?: string
        }
        Relationships: []
      }
      user_roles: {
        Row: {
          created_at: string | null
          employee_id: string | null
          id: string
          role: string
          user_id: string
        }
        Insert: {
          created_at?: string | null
          employee_id?: string | null
          id?: string
          role: string
          user_id: string
        }
        Update: {
          created_at?: string | null
          employee_id?: string | null
          id?: string
          role?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_roles_employee_id_fkey"
            columns: ["employee_id"]
            isOneToOne: false
            referencedRelation: "employees"
            referencedColumns: ["id"]
          },
        ]
      }
      vehicle_assignments: {
        Row: {
          created_at: string
          current_km: number
          date: string
          employee_name: string
          id: string
          image: string | null
          previous_km: number
          vehicle_id: string | null
          vehicle_info: string | null
        }
        Insert: {
          created_at?: string
          current_km?: number
          date: string
          employee_name: string
          id?: string
          image?: string | null
          previous_km?: number
          vehicle_id?: string | null
          vehicle_info?: string | null
        }
        Update: {
          created_at?: string
          current_km?: number
          date?: string
          employee_name?: string
          id?: string
          image?: string | null
          previous_km?: number
          vehicle_id?: string | null
          vehicle_info?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "vehicle_assignments_vehicle_id_fkey"
            columns: ["vehicle_id"]
            isOneToOne: false
            referencedRelation: "vehicles"
            referencedColumns: ["id"]
          },
        ]
      }
      vehicles: {
        Row: {
          assigned_to: string | null
          brand: string
          created_at: string | null
          fitness_expiry: string | null
          fuel_type: string
          id: string
          insurance_expiry: string | null
          is_active: boolean | null
          last_service_date: string | null
          model: string
          next_service_due: string | null
          puc_expiry: string | null
          updated_at: string | null
          vehicle_number: string
          vehicle_type: string
        }
        Insert: {
          assigned_to?: string | null
          brand: string
          created_at?: string | null
          fitness_expiry?: string | null
          fuel_type: string
          id?: string
          insurance_expiry?: string | null
          is_active?: boolean | null
          last_service_date?: string | null
          model: string
          next_service_due?: string | null
          puc_expiry?: string | null
          updated_at?: string | null
          vehicle_number: string
          vehicle_type: string
        }
        Update: {
          assigned_to?: string | null
          brand?: string
          created_at?: string | null
          fitness_expiry?: string | null
          fuel_type?: string
          id?: string
          insurance_expiry?: string | null
          is_active?: boolean | null
          last_service_date?: string | null
          model?: string
          next_service_due?: string | null
          puc_expiry?: string | null
          updated_at?: string | null
          vehicle_number?: string
          vehicle_type?: string
        }
        Relationships: [
          {
            foreignKeyName: "vehicles_assigned_to_fkey"
            columns: ["assigned_to"]
            isOneToOne: false
            referencedRelation: "employees"
            referencedColumns: ["id"]
          },
        ]
      }
      visitors: {
        Row: {
          badge_number: string | null
          check_in: string | null
          check_out: string | null
          company: string | null
          created_at: string | null
          email: string | null
          id: string
          id_proof: string | null
          name: string
          person_to_meet: string
          phone: string
          photo: string | null
          purpose: string
          remarks: string | null
        }
        Insert: {
          badge_number?: string | null
          check_in?: string | null
          check_out?: string | null
          company?: string | null
          created_at?: string | null
          email?: string | null
          id?: string
          id_proof?: string | null
          name: string
          person_to_meet: string
          phone: string
          photo?: string | null
          purpose: string
          remarks?: string | null
        }
        Update: {
          badge_number?: string | null
          check_in?: string | null
          check_out?: string | null
          company?: string | null
          created_at?: string | null
          email?: string | null
          id?: string
          id_proof?: string | null
          name?: string
          person_to_meet?: string
          phone?: string
          photo?: string | null
          purpose?: string
          remarks?: string | null
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      current_portal_employee_id: { Args: never; Returns: string }
      delete_email: {
        Args: { message_id: number; queue_name: string }
        Returns: boolean
      }
      email_queue_dispatch: { Args: never; Returns: undefined }
      enqueue_email: {
        Args: { payload: Json; queue_name: string }
        Returns: number
      }
      get_directory_employees: {
        Args: never
        Returns: {
          address: string
          alternate_phone: string
          created_at: string
          designation: string
          id: string
          name: string
          phone: string
          photo: string
          source: string
        }[]
      }
      get_employee_id: { Args: { user_uuid: string }; Returns: string }
      get_tender_users: {
        Args: never
        Returns: {
          role: string
          username: string
        }[]
      }
      get_user_role: { Args: { user_uuid: string }; Returns: string }
      has_role: {
        Args: { check_role: string; user_uuid: string }
        Returns: boolean
      }
      hash_password: { Args: { raw_password: string }; Returns: string }
      move_to_dlq: {
        Args: {
          dlq_name: string
          message_id: number
          payload: Json
          source_queue: string
        }
        Returns: number
      }
      read_email_batch: {
        Args: { batch_size: number; queue_name: string; vt: number }
        Returns: {
          message: Json
          msg_id: number
          read_ct: number
        }[]
      }
      resolve_portal_employee: {
        Args: { _username?: string }
        Returns: {
          employee_id: string
          employee_name: string
        }[]
      }
      verify_password: {
        Args: { input_password: string; stored_hash: string }
        Returns: boolean
      }
    }
    Enums: {
      leave_status: "pending" | "approved" | "rejected"
      leave_type: "paid" | "medical" | "exchange"
      payment_status: "pending" | "approved" | "rejected"
      portal_role:
        | "director"
        | "hr"
        | "accounts"
        | "admin"
        | "ithead"
        | "employee"
        | "tender_head"
        | "tender_executive"
        | "purchase"
        | "operations"
      task_priority: "low" | "medium" | "high"
      task_status:
        | "pending"
        | "in_progress"
        | "completed"
        | "approved"
        | "rejected"
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
      leave_status: ["pending", "approved", "rejected"],
      leave_type: ["paid", "medical", "exchange"],
      payment_status: ["pending", "approved", "rejected"],
      portal_role: [
        "director",
        "hr",
        "accounts",
        "admin",
        "ithead",
        "employee",
        "tender_head",
        "tender_executive",
        "purchase",
        "operations",
      ],
      task_priority: ["low", "medium", "high"],
      task_status: [
        "pending",
        "in_progress",
        "completed",
        "approved",
        "rejected",
      ],
    },
  },
} as const
