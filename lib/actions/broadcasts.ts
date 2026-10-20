"use server";

import { createClient } from "@/lib/supabase-server";

export interface BroadcastFormData {
  title: string;
  message: string;
  resourceId?: string | null;
}

export async function sendBroadcast(formData: BroadcastFormData) {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    throw new Error("Not authenticated");
  }

  const { data: adminRecord } = await supabase
    .from("admins")
    .select("role")
    .eq("id", user.id)
    .single();

  if (adminRecord?.role !== "admin") {
    throw new Error("Only FAFA admins can send broadcasts");
  }

  const { data, error } = await supabase.rpc("create_admin_broadcast", {
    p_title: formData.title,
    p_message: formData.message,
    p_resource_id: formData.resourceId || null,
  });

  if (error) {
    throw new Error(error.message);
  }

  const content = [formData.title.trim(), formData.message.trim()]
    .filter(Boolean)
    .join("\n\n");

  const { error: postError } = await supabase.from("posts").insert({
    user_id: user.id,
    content,
    category: "Broadcast",
    hashtags: ["broadcast"],
  });

  if (postError) {
    throw new Error(
      `Notifications were sent, but the feed post was not created: ${postError.message}`
    );
  }

  return data as { success: boolean; broadcast_id: string; recipient_count: number };
}

export async function getBroadcastHistory() {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("notification_broadcasts")
    .select("id, title, message, type, resource_id, recipient_count, created_at")
    .order("created_at", { ascending: false })
    .limit(20);

  if (error) {
    throw new Error(error.message);
  }

  return data || [];
}
