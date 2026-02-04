import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";

export interface Product {
  id: string;
  name: string;
  category: string;
  description?: string;
  price?: number;
  stock_quantity: number;
  unit?: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export const useSupabaseProducts = () => {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchProducts = useCallback(async () => {
    const { data, error } = await supabase
      .from("products")
      .select("*")
      .order("name", { ascending: true });

    if (error) {
      console.error("Error fetching products:", error);
      return;
    }

    setProducts(data || []);
    setLoading(false);
  }, []);

  useEffect(() => {
    fetchProducts();
  }, [fetchProducts]);

  const addProduct = async (productData: Omit<Product, "id" | "created_at" | "updated_at" | "is_active">) => {
    const { data, error } = await supabase
      .from("products")
      .insert({
        ...productData,
        is_active: true,
      })
      .select()
      .single();

    if (error) {
      console.error("Error adding product:", error);
      throw error;
    }

    await fetchProducts();
    return data;
  };

  const updateProduct = async (id: string, updates: Partial<Product>) => {
    const { error } = await supabase
      .from("products")
      .update(updates)
      .eq("id", id);

    if (error) {
      console.error("Error updating product:", error);
      throw error;
    }

    await fetchProducts();
  };

  const deleteProduct = async (id: string) => {
    const { error } = await supabase
      .from("products")
      .update({ is_active: false })
      .eq("id", id);

    if (error) {
      console.error("Error deleting product:", error);
      throw error;
    }

    await fetchProducts();
  };

  const updateStock = async (id: string, quantity: number) => {
    const product = products.find((p) => p.id === id);
    if (!product) return;

    await updateProduct(id, { stock_quantity: product.stock_quantity + quantity });
  };

  return {
    products: products.filter((p) => p.is_active),
    allProducts: products,
    loading,
    addProduct,
    updateProduct,
    deleteProduct,
    updateStock,
    refreshProducts: fetchProducts,
  };
};
