import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";

export interface ITPassword {
  id: string;
  portal: string;
  username: string;
  encrypted_password: string;
  created_at: string;
  updated_at: string;
}

export interface NetworkImage {
  id: string;
  name: string;
  url: string;
  image_type: "network" | "telephone";
  created_at: string;
}

export interface TelephoneEntry {
  id: string;
  department: string;
  intercom: string;
  phone_number: string;
  created_at: string;
  updated_at: string;
}

export const useSupabaseITHead = () => {
  const [passwords, setPasswords] = useState<ITPassword[]>([]);
  const [networkImages, setNetworkImages] = useState<NetworkImage[]>([]);
  const [telephoneImages, setTelephoneImages] = useState<NetworkImage[]>([]);
  const [telephoneEntries, setTelephoneEntries] = useState<TelephoneEntry[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchPasswords = useCallback(async () => {
    // Use the encrypt-password edge function to get decrypted passwords
    const { data, error } = await supabase.functions.invoke('encrypt-password', {
      body: { action: 'get' }
    });

    if (error) {
      console.error("Error fetching passwords:", error);
      return;
    }

    setPasswords(data?.passwords || []);
  }, []);

  const fetchNetworkImages = useCallback(async () => {
    const { data, error } = await supabase
      .from("it_network_images")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) {
      console.error("Error fetching network images:", error);
      return;
    }

    const mappedData = (data || []).map((img) => ({
      ...img,
      image_type: img.image_type as "network" | "telephone",
    }));

    setNetworkImages(mappedData.filter((img) => img.image_type === "network"));
    setTelephoneImages(mappedData.filter((img) => img.image_type === "telephone"));
  }, []);

  const fetchTelephoneEntries = useCallback(async () => {
    const { data, error } = await supabase
      .from("telephone_directory")
      .select("*")
      .order("department", { ascending: true });

    if (error) {
      console.error("Error fetching telephone entries:", error);
      return;
    }

    setTelephoneEntries(data || []);
  }, []);

  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      await Promise.all([
        fetchPasswords(),
        fetchNetworkImages(),
        fetchTelephoneEntries(),
      ]);
      setLoading(false);
    };
    loadData();
  }, [fetchPasswords, fetchNetworkImages, fetchTelephoneEntries]);

  // Password operations - use edge function for secure encryption
  const addPassword = async (portal: string, username: string, password: string) => {
    const { data, error } = await supabase.functions.invoke('encrypt-password', {
      body: { action: 'save', portal, username, password }
    });

    if (error) {
      console.error("Error adding password:", error);
      throw error;
    }

    if (data?.error) {
      throw new Error(data.error);
    }

    await fetchPasswords();
    return data;
  };

  const updatePassword = async (id: string, updates: { portal?: string; username?: string; encrypted_password?: string }) => {
    // For password updates, we need to re-encrypt if password changed
    if (updates.encrypted_password) {
      // Use edge function to encrypt the new password
      const { data: encryptData, error: encryptError } = await supabase.functions.invoke('encrypt-password', {
        body: { action: 'encrypt', password: updates.encrypted_password }
      });

      if (encryptError || encryptData?.error) {
        console.error("Error encrypting password:", encryptError || encryptData?.error);
        throw new Error(encryptError?.message || encryptData?.error);
      }

      updates.encrypted_password = encryptData.encrypted;
    }

    const { error } = await supabase
      .from("it_passwords")
      .update(updates)
      .eq("id", id);

    if (error) {
      console.error("Error updating password:", error);
      throw error;
    }

    await fetchPasswords();
  };

  const deletePassword = async (id: string) => {
    const { data, error } = await supabase.functions.invoke('encrypt-password', {
      body: { action: 'delete', id }
    });

    if (error) {
      console.error("Error deleting password:", error);
      throw error;
    }

    if (data?.error) {
      throw new Error(data.error);
    }

    await fetchPasswords();
  };

  // Network image operations
  const addNetworkImage = async (name: string, url: string) => {
    const { data, error } = await supabase
      .from("it_network_images")
      .insert({ name, url, image_type: "network" })
      .select()
      .single();

    if (error) {
      console.error("Error adding network image:", error);
      throw error;
    }

    await fetchNetworkImages();
    return data;
  };

  const deleteNetworkImage = async (id: string) => {
    const { error } = await supabase
      .from("it_network_images")
      .delete()
      .eq("id", id);

    if (error) {
      console.error("Error deleting network image:", error);
      throw error;
    }

    await fetchNetworkImages();
  };

  // Telephone image operations
  const addTelephoneImage = async (name: string, url: string) => {
    const { data, error } = await supabase
      .from("it_network_images")
      .insert({ name, url, image_type: "telephone" })
      .select()
      .single();

    if (error) {
      console.error("Error adding telephone image:", error);
      throw error;
    }

    await fetchNetworkImages();
    return data;
  };

  const deleteTelephoneImage = async (id: string) => {
    const { error } = await supabase
      .from("it_network_images")
      .delete()
      .eq("id", id);

    if (error) {
      console.error("Error deleting telephone image:", error);
      throw error;
    }

    await fetchNetworkImages();
  };

  // Telephone entry operations
  const addTelephoneEntry = async (department: string, intercom: string, phoneNumber: string) => {
    const { data, error } = await supabase
      .from("telephone_directory")
      .insert({ department, intercom, phone_number: phoneNumber })
      .select()
      .single();

    if (error) {
      console.error("Error adding telephone entry:", error);
      throw error;
    }

    await fetchTelephoneEntries();
    return data;
  };

  const updateTelephoneEntry = async (id: string, updates: Partial<TelephoneEntry>) => {
    const { error } = await supabase
      .from("telephone_directory")
      .update(updates)
      .eq("id", id);

    if (error) {
      console.error("Error updating telephone entry:", error);
      throw error;
    }

    await fetchTelephoneEntries();
  };

  const deleteTelephoneEntry = async (id: string) => {
    const { error } = await supabase
      .from("telephone_directory")
      .delete()
      .eq("id", id);

    if (error) {
      console.error("Error deleting telephone entry:", error);
      throw error;
    }

    await fetchTelephoneEntries();
  };

  return {
    passwords,
    networkImages,
    telephoneImages,
    telephoneEntries,
    loading,
    // Password operations
    addPassword,
    updatePassword,
    deletePassword,
    // Network image operations
    addNetworkImage,
    deleteNetworkImage,
    // Telephone image operations
    addTelephoneImage,
    deleteTelephoneImage,
    // Telephone entry operations
    addTelephoneEntry,
    updateTelephoneEntry,
    deleteTelephoneEntry,
    // Refresh
    refreshData: () => Promise.all([fetchPasswords(), fetchNetworkImages(), fetchTelephoneEntries()]),
  };
};
