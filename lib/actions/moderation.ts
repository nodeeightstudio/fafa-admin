"use server";

import { createClient } from "@/lib/supabase-server";
import { Report, ReportStatus, ReportedType } from "@/types/moderation";
import { revalidatePath } from "next/cache";

export async function getReports(
  status?: ReportStatus,
  page = 1,
  pageSize = 10
) {
  const supabase = await createClient();

  let query = supabase
    .from("reports")
    .select("*", { count: "exact" })
    .order("created_at", { ascending: false });

  if (status && status !== "pending") {
    query = query.eq("status", status);
  }

  const from = (page - 1) * pageSize;
  const to = from + pageSize - 1;

  const { data, error, count } = await query.range(from, to);

  if (error) {
    throw new Error(error.message);
  }

  return {
    data: data as Report[],
    total: count || 0,
    page,
    pageSize,
    totalPages: Math.ceil((count || 0) / pageSize),
  };
}

export async function getSuspendedUsers(page = 1, pageSize = 10) {
  const supabase = await createClient();

  const from = (page - 1) * pageSize;
  const to = from + pageSize - 1;

  const { data, error, count } = await supabase
    .from("profiles")
    .select("*", { count: "exact" })
    .eq("is_active", false)
    .order("created_at", { ascending: false })
    .range(from, to);

  if (error) {
    throw new Error(error.message);
  }

  return {
    data: data as any[], // Typing as any for now to avoid strict profile type issues
    total: count || 0,
    page,
    pageSize,
    totalPages: Math.ceil((count || 0) / pageSize),
  };
}

export async function reinstateUser(userId: string) {
  const supabase = await createClient();

  const { error, count } = await supabase
    .from("profiles")
    .update({ is_active: true }, { count: "exact" })
    .eq("id", userId);

  if (error) {
    throw new Error(error.message);
  }

  if (count === 0) {
    throw new Error(
      "Permission denied: Could not reinstate user. Please check admin policies."
    );
  }

  revalidatePath("/dashboard/reports");
  return true;
}

export async function getReportedContent(type: ReportedType, id: string) {
  const supabase = await createClient();

  if (type === "post") {
    const { data, error } = await supabase
      .from("posts")
      .select("*")
      .eq("id", id)
      .single();
    if (error) return null;
    return data;
  }

  if (type === "comment") {
    const { data, error } = await supabase
      .from("comments")
      .select("*")
      .eq("id", id)
      .single();
    if (error) return null;
    return data;
  }

  return null;
}

export async function updateReportStatus(
  id: string,
  status: ReportStatus,
  actionTaken?: string
) {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    throw new Error("Not authenticated");
  }

  const { error } = await supabase
    .from("reports")
    .update({
      status,
      action_taken: actionTaken,
      reviewed_by: user.id,
      reviewed_at: new Date().toISOString(),
    })
    .eq("id", id);

  if (error) {
    throw new Error(error.message);
  }

  revalidatePath("/dashboard/reports");
  return true;
}

export async function deleteReportedContent(
  reportId: string,
  type: ReportedType,
  contentId: string
) {
  const supabase = await createClient();

  let result;
  if (type === "post") {
    result = await supabase
      .from("posts")
      .update({ is_deleted: true }, { count: "exact" })
      .eq("id", contentId);
  } else if (type === "comment") {
    result = await supabase
      .from("comments")
      .update({ is_deleted: true }, { count: "exact" })
      .eq("id", contentId);
  }

  if (result?.error) {
    throw new Error(result.error.message);
  }

  if (result && result.count === 0) {
    throw new Error(
      `Permission denied: Could not update ${type}. Please check admin policies.`
    );
  }

  // Update report as resolved
  await updateReportStatus(reportId, "resolved", `Deleted ${type}`);

  revalidatePath("/dashboard/reports");
  return true;
}

export async function suspendUser(reportId: string, userId: string) {
  const supabase = await createClient();

  const { error, count } = await supabase
    .from("profiles")
    .update({ is_active: false }, { count: "exact" })
    .eq("id", userId);

  if (error) {
    throw new Error(error.message);
  }

  if (count === 0) {
    throw new Error(
      "Permission denied: Could not suspend user. Please check admin policies."
    );
  }

  // Update report as resolved
  await updateReportStatus(reportId, "resolved", "Suspended author");

  revalidatePath("/dashboard/reports");
  return true;
}

export async function adminInviteModerator(userId: string) {
  const supabase = await createClient();

  const { error } = await supabase
    .from("profiles")
    .update({ is_moderator: true })
    .eq("id", userId);

  if (error) {
    throw new Error(error.message);
  }

  revalidatePath("/dashboard/users");
  return true;
}

export async function flagPostByModerator(postId: string) {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    throw new Error("Not authenticated");
  }

  const { data, error } = await supabase.rpc("flag_post_by_moderator", {
    p_post_id: postId,
    p_moderator_id: user.id,
  });

  if (error) {
    throw new Error(error.message);
  }

  revalidatePath("/dashboard/reports");
  return data;
}

export async function getEscalatedUsers(page = 1, pageSize = 10) {
  const supabase = await createClient();

  const from = (page - 1) * pageSize;
  const to = from + pageSize - 1;

  const { data, error, count } = await supabase
    .from("profiles")
    .select("*", { count: "exact" })
    .eq("escalated_for_suspension", true)
    .order("created_at", { ascending: false })
    .range(from, to);

  if (error) {
    throw new Error(error.message);
  }

  return {
    data: data as any[],
    total: count || 0,
    page,
    pageSize,
    totalPages: Math.ceil((count || 0) / pageSize),
  };
}
