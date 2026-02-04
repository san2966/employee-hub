import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";

export interface Contact {
  id: string;
  name: string;
  designation: string;
  department: string;
  phone: string;
  email?: string;
  extension?: string;
  is_active: boolean;
  created_at: string;
}

export const useSupabaseContacts = () => {
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchContacts = useCallback(async () => {
    const { data, error } = await supabase
      .from("contacts")
      .select("*")
      .order("name", { ascending: true });

    if (error) {
      console.error("Error fetching contacts:", error);
      return;
    }

    setContacts(data || []);
    setLoading(false);
  }, []);

  useEffect(() => {
    fetchContacts();
  }, [fetchContacts]);

  const addContact = async (contactData: Omit<Contact, "id" | "created_at" | "is_active">) => {
    const { data, error } = await supabase
      .from("contacts")
      .insert({
        ...contactData,
        is_active: true,
      })
      .select()
      .single();

    if (error) {
      console.error("Error adding contact:", error);
      throw error;
    }

    await fetchContacts();
    return data;
  };

  const updateContact = async (id: string, updates: Partial<Contact>) => {
    const { error } = await supabase
      .from("contacts")
      .update(updates)
      .eq("id", id);

    if (error) {
      console.error("Error updating contact:", error);
      throw error;
    }

    await fetchContacts();
  };

  const deleteContact = async (id: string) => {
    const { error } = await supabase
      .from("contacts")
      .update({ is_active: false })
      .eq("id", id);

    if (error) {
      console.error("Error deleting contact:", error);
      throw error;
    }

    await fetchContacts();
  };

  return {
    contacts: contacts.filter((c) => c.is_active),
    allContacts: contacts,
    loading,
    addContact,
    updateContact,
    deleteContact,
    refreshContacts: fetchContacts,
  };
};
