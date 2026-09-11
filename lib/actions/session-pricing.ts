"use server";

import { createClient } from "@/lib/supabase-server";
import { SessionPricingRow } from "@/lib/session-pricing";

async function requireSuperAdmin() {
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
    throw new Error("Only FAFA admins can manage session pricing");
  }

  return { supabase, user };
}

export async function getSessionPricing(): Promise<SessionPricingRow[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("session_pricing")
    .select("tier, label, amount_ghs, updated_at, updated_by")
    .order("tier", { ascending: true });

  if (error) {
    throw new Error(error.message);
  }

  return (data || []) as SessionPricingRow[];
}

export async function updateSessionPricing(
  rates: { tier: number; amount_ghs: number }[]
): Promise<SessionPricingRow[]> {
  const { supabase, user } = await requireSuperAdmin();

  for (const rate of rates) {
    if (![1, 2, 3].includes(rate.tier)) {
      throw new Error("Invalid counsellor tier");
    }
    if (!Number.isInteger(rate.amount_ghs) || rate.amount_ghs < 1) {
      throw new Error("Amount must be a whole number of cedis (at least 1)");
    }

    const { error } = await supabase
      .from("session_pricing")
      .update({
        amount_ghs: rate.amount_ghs,
        updated_at: new Date().toISOString(),
        updated_by: user.id,
      })
      .eq("tier", rate.tier);

    if (error) {
      throw new Error(error.message);
    }
  }

  return getSessionPricing();
}
