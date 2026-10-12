"use server";

import { createClient } from "@/lib/supabase-server";
import { Report, ReportStatus, ReportedType, SuspendedUser, UserProfile } from "@/types/moderation";
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

  if (status) {
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
    data: (data || []) as SuspendedUser[],
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

export async function adminInviteModerator(identifier: string) {
  const supabase = await createClient();
  const trimmed = identifier.trim();

  let targetUserId = trimmed;

  // If input is an email address, resolve the user ID first
  if (trimmed.includes("@")) {
    // 1. Check profiles table by email
    const { data: profile } = await supabase
      .from("profiles")
      .select("id")
      .eq("email", trimmed.toLowerCase())
      .maybeSingle();

    if (profile?.id) {
      targetUserId = profile.id;
    } else {
      // 2. Fallback to RPC get_user_by_email function if configured
      const { data: rpcUserId } = await supabase.rpc("get_user_by_email", {
        email_input: trimmed.toLowerCase(),
      });

      if (rpcUserId) {
        targetUserId = typeof rpcUserId === "string" ? rpcUserId : rpcUserId.id || rpcUserId;
      } else {
        throw new Error(`No user found registered with email "${trimmed}".`);
      }
    }
  }

  const { error } = await supabase
    .from("profiles")
    .update({ is_moderator: true })
    .eq("id", targetUserId);

  if (error) {
    throw new Error(error.message);
  }

  revalidatePath("/dashboard/reports");
  return true;
}

function quoteFilterValue(value: string) {
  return `"${value.replace(/\\/g, "\\\\").replace(/"/g, '\\"')}"`;
}

function userIdFromEmailLookup(result: unknown) {
  if (!result) return null;
  if (typeof result === "string") return result;
  if (Array.isArray(result)) {
    const first = result[0] as { id?: string } | string | undefined;
    if (!first) return null;
    return typeof first === "string" ? first : first.id ?? null;
  }
  if (typeof result === "object" && result && "id" in result) {
    const id = (result as { id?: unknown }).id;
    return typeof id === "string" ? id : null;
  }
  return null;
}

export async function searchUsersForModerator(query: string) {
  const supabase = await createClient();
  const trimmed = query.trim();

  if (!trimmed || trimmed.length < 2) {
    return [];
  }

  const pattern = quoteFilterValue(`%${trimmed}%`);
  const { data, error } = await supabase
    .from("profiles")
    .select("id, email, full_name, is_moderator")
    .or(`email.ilike.${pattern},full_name.ilike.${pattern}`)
    .limit(8);

  if (error) {
    console.error("Error searching users:", error);
  }

  const matches = new Map<string, UserProfile>();
  for (const user of (data || []) as UserProfile[]) {
    if (!user.is_moderator) matches.set(user.id, user);
  }

  // Save resolves emails through auth.users. Search has to do the same,
  // because profiles.email can be empty while the login email exists.
  if (trimmed.includes("@")) {
    const { data: rpcUser } = await supabase.rpc("get_user_by_email", {
      email_input: trimmed.toLowerCase(),
    });
    const resolvedId = userIdFromEmailLookup(rpcUser);

    if (resolvedId && !matches.has(resolvedId)) {
      const { data: profile } = await supabase
        .from("profiles")
        .select("id, email, full_name, is_moderator")
        .eq("id", resolvedId)
        .maybeSingle();

      if (profile && !profile.is_moderator) {
        matches.set(profile.id, {
          ...(profile as UserProfile),
          email: profile.email || trimmed.toLowerCase(),
        });
      }
    }
  }

  return Array.from(matches.values());
}

export async function getModerators(page = 1, pageSize = 10) {
  const supabase = await createClient();

  const from = (page - 1) * pageSize;
  const to = from + pageSize - 1;

  const { data, error, count } = await supabase
    .from("profiles")
    .select("*", { count: "exact" })
    .eq("is_moderator", true)
    .order("created_at", { ascending: false })
    .range(from, to);

  if (error) {
    throw new Error(error.message);
  }

  return {
    data: (data || []) as UserProfile[],
    total: count || 0,
    page,
    pageSize,
    totalPages: Math.ceil((count || 0) / pageSize),
  };
}

export async function revokeModerator(userId: string) {
  const supabase = await createClient();

  const { error } = await supabase
    .from("profiles")
    .update({ is_moderator: false })
    .eq("id", userId);

  if (error) {
    throw new Error(error.message);
  }

  revalidatePath("/dashboard/reports");
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
    data: (data || []) as UserProfile[],
    total: count || 0,
    page,
    pageSize,
    totalPages: Math.ceil((count || 0) / pageSize),
  };
}

export async function assignReportToCounsellor(reportId: string, counsellorId: string) {
  const supabase = await createClient();

  const { data: report, error: reportError } = await supabase
    .from("reports")
    .select("id, reported_type, reported_id")
    .eq("id", reportId)
    .single();

  if (reportError || !report) {
    throw new Error(reportError?.message || "Report not found");
  }

  let userId = report.reported_id as string;
  let postId: string | null = null;

  if (report.reported_type === "post") {
    postId = report.reported_id;
    const { data: post, error } = await supabase
      .from("posts")
      .select("user_id")
      .eq("id", report.reported_id)
      .single();
    if (error || !post?.user_id) throw new Error(error?.message || "Could not find the post author");
    userId = post.user_id;
  } else if (report.reported_type === "comment") {
    const { data: comment, error } = await supabase
      .from("comments")
      .select("user_id, post_id")
      .eq("id", report.reported_id)
      .single();
    if (error || !comment?.user_id) {
      throw new Error(error?.message || "Could not find the comment author");
    }
    userId = comment.user_id;
    postId = comment.post_id;
  }

  const { error } = await supabase.from("support_assignments").upsert(
    {
      report_id: reportId,
      user_id: userId,
      counsellor_id: counsellorId,
      post_id: postId,
      status: "open",
    },
    { onConflict: "report_id,counsellor_id" }
  );

  if (error) throw new Error(error.message);

  revalidatePath("/dashboard/reports");
}
