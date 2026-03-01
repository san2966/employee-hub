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
          category: string
          created_at: string | null
          id: string
          location: string | null
          name: string
          purchase_date: string | null
          purchase_price: number | null
          quantity: number | null
          remarks: string | null
          updated_at: string | null
          vendor: string | null
          warranty_till: string | null
        }
        Insert: {
          assigned_to?: string | null
          category: string
          created_at?: string | null
          id?: string
          location?: string | null
          name: string
          purchase_date?: string | null
          purchase_price?: number | null
          quantity?: number | null
          remarks?: string | null
          updated_at?: string | null
          vendor?: string | null
          warranty_till?: string | null
        }
        Update: {
          assigned_to?: string | null
          category?: string
          created_at?: string | null
          id?: string
          location?: string | null
          name?: string
          purchase_date?: string | null
          purchase_price?: number | null
          quantity?: number | null
          remarks?: string | null
          updated_at?: string | null
          vendor?: string | null
          warranty_till?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "admin_assets_assigned_to_fkey"
            columns: ["assigned_to"]
            isOneToOne: false
            referencedRelation: "employees"
            referencedColumns: ["id"]
          },
        ]
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
      employee_payments: {
        Row: {
          amount: number
          approved_by: string | null
          category: string
          created_at: string | null
          date: string
          description: string
          employee_id: string
          id: string
          receipt_url: string | null
          status: Database["public"]["Enums"]["payment_status"] | null
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
          id?: string
          receipt_url?: string | null
          status?: Database["public"]["Enums"]["payment_status"] | null
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
          id?: string
          receipt_url?: string | null
          status?: Database["public"]["Enums"]["payment_status"] | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "employee_payments_employee_id_fkey"
            columns: ["employee_id"]
            isOneToOne: false
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
          highest_education: string
          id: string
          is_active: boolean | null
          is_fresher: boolean | null
          job_period_from: string | null
          job_period_to: string | null
          marks_percentage: string | null
          medical_leave_balance: number | null
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
          highest_education: string
          id?: string
          is_active?: boolean | null
          is_fresher?: boolean | null
          job_period_from?: string | null
          job_period_to?: string | null
          marks_percentage?: string | null
          medical_leave_balance?: number | null
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
          highest_education?: string
          id?: string
          is_active?: boolean | null
          is_fresher?: boolean | null
          job_period_from?: string | null
          job_period_to?: string | null
          marks_percentage?: string | null
          medical_leave_balance?: number | null
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
          title: string
        }
        Insert: {
          content: string
          created_at?: string | null
          created_by?: string | null
          expires_at?: string | null
          id?: string
          is_active?: boolean | null
          title: string
        }
        Update: {
          content?: string
          created_at?: string | null
          created_by?: string | null
          expires_at?: string | null
          id?: string
          is_active?: boolean | null
          title?: string
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
          is_active?: boolean | null
          name?: string
          price?: number | null
          stock_quantity?: number | null
          unit?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
      requirements: {
        Row: {
          approved_by: string | null
          created_at: string | null
          description: string
          id: string
          priority: Database["public"]["Enums"]["task_priority"] | null
          requested_by: string | null
          status: Database["public"]["Enums"]["task_status"] | null
          title: string
          updated_at: string | null
        }
        Insert: {
          approved_by?: string | null
          created_at?: string | null
          description: string
          id?: string
          priority?: Database["public"]["Enums"]["task_priority"] | null
          requested_by?: string | null
          status?: Database["public"]["Enums"]["task_status"] | null
          title: string
          updated_at?: string | null
        }
        Update: {
          approved_by?: string | null
          created_at?: string | null
          description?: string
          id?: string
          priority?: Database["public"]["Enums"]["task_priority"] | null
          requested_by?: string | null
          status?: Database["public"]["Enums"]["task_status"] | null
          title?: string
          updated_at?: string | null
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
      tasks: {
        Row: {
          assigned_by: string | null
          assigned_to: string | null
          completed_at: string | null
          created_at: string | null
          description: string | null
          due_date: string | null
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
          id?: string
          priority?: Database["public"]["Enums"]["task_priority"] | null
          status?: Database["public"]["Enums"]["task_status"] | null
          title?: string
          updated_at?: string | null
        }
        Relationships: [
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
      get_employee_id: { Args: { user_uuid: string }; Returns: string }
      get_user_role: { Args: { user_uuid: string }; Returns: string }
      has_role: {
        Args: { check_role: string; user_uuid: string }
        Returns: boolean
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
      task_priority: "low" | "medium" | "high"
      task_status: "pending" | "in_progress" | "completed"
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
      ],
      task_priority: ["low", "medium", "high"],
      task_status: ["pending", "in_progress", "completed"],
    },
  },
} as const
