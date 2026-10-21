import type { SupabaseClient } from "@supabase/supabase-js";

export async function notifyUser(
  supabase: SupabaseClient,
  userId: string | null | undefined,
  notice: {
    type: string;
    title: string;
    message: string;
    relatedId?: string | null;
  }
) {
  if (!userId) return;

  const { error } = await supabase.rpc("admin_notify_user", {
    p_user_id: userId,
    p_type: notice.type,
    p_title: notice.title,
    p_message: notice.message,
    p_related_id: notice.relatedId || null,
  });

  if (!error) return;

  const { error: insertError } = await supabase.from("notifications").insert({
    user_id: userId,
    type: notice.type,
    title: notice.title,
    message: notice.message,
    related_id: notice.relatedId || null,
  });

  if (insertError) {
    console.error("Failed to notify user:", error.message, insertError.message);
  }
}
