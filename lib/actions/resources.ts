"use server";

import { createClient } from "@/lib/supabase-server";
import { Resource, ResourceFormData } from "@/types/resource";

export async function getResources(filters?: {
  type?: string;
  category?: string;
  search?: string;
}) {
  const supabase = await createClient();

  // Get current admin info to enforce scoping
  const { data: { user } } = await supabase.auth.getUser();
  const { data: adminRecord } = await supabase
    .from('admins')
    .select('role, institution_id')
    .eq('id', user?.id)
    .single();

  let query = supabase
    .from("resources")
    .select("*")
    .order("created_at", { ascending: false });

  // If institution admin, only show resources assigned to their institution or global ones (if allowed)
  if (adminRecord?.role === 'institution_admin' && adminRecord.institution_id) {
    query = query.or(`scope.eq.global,and(scope.eq.institution,institution_id.eq.${adminRecord.institution_id})`);
  }

  if (filters?.type && filters.type !== "all") {
    query = query.eq("type", filters.type);
  }

  if (filters?.category && filters.category !== "all") {
    query = query.eq("category", filters.category);
  }

  if (filters?.search) {
    query = query.ilike("title", `%${filters.search}%`);
  }

  const { data, error } = await query;

  if (error) {
    throw new Error(error.message);
  }

  return data as Resource[];
}

export async function getResource(id: string) {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("resources")
    .select("*")
    .eq("id", id)
    .single();

  if (error) {
    throw new Error("Resource not found");
  }

  return data as Resource;
}

export async function createResource(formData: ResourceFormData) {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    throw new Error("Not authenticated");
  }

  // Check if user is admin
  const { data: adminCheck } = await supabase
    .from("admins")
    .select("id")
    .eq("id", user.id)
    .single();

  if (!adminCheck) {
    throw new Error("User is not an admin");
  }

  const { data, error } = await supabase
    .from("resources")
    .insert({
      title: formData.title,
      description: formData.description || null,
      category: formData.category,
      type: formData.type,
      url: formData.url || null,
      urls: formData.urls || [],
      content: formData.content || null,
      image_url: formData.image_url || null,
      scope: formData.scope || 'global',
      institution_id: formData.institution_id || null,
    })
    .select()
    .single();

  if (error) {
    throw new Error(`Failed to create resource: ${error.message}`);
  }

  return data as Resource;
}

export async function updateResource(
  id: string,
  formData: Partial<ResourceFormData>
) {
  const supabase = await createClient();

  const updateData: Partial<Resource> = {
    updated_at: new Date().toISOString(),
  };

  if (formData.title !== undefined) updateData.title = formData.title;
  if (formData.description !== undefined)
    updateData.description = formData.description;
  if (formData.category !== undefined) updateData.category = formData.category;
  if (formData.type !== undefined) updateData.type = formData.type;
  if (formData.url !== undefined) updateData.url = formData.url;
  if (formData.urls !== undefined) updateData.urls = formData.urls;
  if (formData.content !== undefined) updateData.content = formData.content;
  if (formData.image_url !== undefined)
    updateData.image_url = formData.image_url;
  if (formData.scope !== undefined) updateData.scope = formData.scope;
  if (formData.institution_id !== undefined)
    updateData.institution_id = formData.institution_id;

  const { data, error } = await supabase
    .from("resources")
    .update(updateData)
    .eq("id", id)
    .select()
    .single();

  if (error) {
    throw new Error(error.message);
  }

  return data as Resource;
}

export async function deleteResource(id: string) {
  const supabase = await createClient();

  const { error } = await supabase.from("resources").delete().eq("id", id);

  if (error) {
    throw new Error(error.message);
  }

  return true;
}
