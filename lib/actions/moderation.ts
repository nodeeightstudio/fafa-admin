"use server";

import { createClient } from "@/lib/supabase-server";
import { Report, ReportStatus, ReportedType } from "@/types/moderation";
import { revalidatePath } from "next/cache";

export async function getReports(status?: ReportStatus) {
  const supabase = await createClient();

  let query = supabase
    .from("reports")
    .select("*")
    .order("created_at", { ascending: false });

  if (status && status !== "pending") {
    query = query.eq("status", status);
  }

  const { data, error } = await query;

  if (error) {
    throw new Error(error.message);
  }

  return data as Report[];
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

  let error;
  if (type === "post") {
    const result = await supabase
      .from("posts")
      .update({ is_deleted: true })
      .eq("id", contentId);
    error = result.error;
  } else if (type === "comment") {
    const result = await supabase
      .from("comments")
      .update({ is_deleted: true })
      .eq("id", contentId);
    error = result.error;
  }

  if (error) {
    throw new Error(error.message);
  }

  // Update report as resolved
  await updateReportStatus(reportId, "resolved", `Deleted ${type}`);

  revalidatePath("/dashboard/reports");
  return true;
}

export async function suspendUser(reportId: string, userId: string) {
  const supabase = await createClient();

  const { error } = await supabase
    .from("profiles")
    .update({ is_active: false })
    .eq("id", userId);

  if (error) {
    throw new Error(error.message);
  }

  // Update report as resolved
  await updateReportStatus(reportId, "resolved", "Suspended author");

  revalidatePath("/dashboard/reports");
  return true;
}
