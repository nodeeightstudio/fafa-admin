"use server";

import { createClient } from "@/lib/supabase-server";
import { Counsellor, CounsellorFormData } from "@/types/counsellor";

export async function getCounsellors(filters?: {
  status?: string;
  search?: string;
  specialty?: string;
  online?: boolean;
}) {
  const supabase = await createClient();

  let query = supabase
    .from("counsellors")
    .select("*")
    .order("created_at", { ascending: false });

  if (filters?.status && filters.status !== "all") {
    query = query.eq("status", filters.status);
  }

  if (filters?.search) {
    query = query.or(
      `name.ilike.%${filters.search}%,email.ilike.%${filters.search}%`
    );
  }

  if (filters?.specialty) {
    query = query.contains("specialties", [filters.specialty]);
  }

  if (filters?.online) {
    query = query.eq("is_online", true);
  }

  const { data, error } = await query;

  if (error) {
    throw new Error(error.message);
  }

  return data as Counsellor[];
}

export async function getCounsellor(id: string) {
  const supabase = await createClient();

  const { data: counsellor, error: counsellorError } = await supabase
    .from("counsellors")
    .select("*")
    .eq("id", id)
    .single();

  if (counsellorError) {
    throw new Error("Counsellor not found");
  }

  // Get availability
  const { data: availability } = await supabase
    .from("counsellor_availability")
    .select("*")
    .eq("counsellor_id", id)
    .order("day_of_week", { ascending: true });

  // Get recent reviews
  const { data: reviews } = await supabase
    .from("reviews")
    .select("rating, comment, created_at")
    .eq("counsellor_id", id)
    .eq("is_visible", true)
    .order("created_at", { ascending: false })
    .limit(10);

  return {
    ...counsellor,
    availability: availability || [],
    reviews: reviews || [],
  };
}

export async function createCounsellor(formData: CounsellorFormData) {
  const supabase = await createClient();

  // Debug: Check if user is authenticated and is admin
  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();
  console.log("🔍 User:", user?.id, user?.email);

  if (!user) {
    throw new Error("Not authenticated");
  }

  // Check if user is admin
  const { data: adminCheck, error: adminError } = await supabase
    .from("admins")
    .select("id")
    .eq("id", user.id)
    .single();

  console.log("🔍 Admin check:", adminCheck, adminError);

  if (!adminCheck) {
    throw new Error(
      "User is not an admin. Please ensure your user ID is in the admins table."
    );
  }

  // ... existing code ...

  // Try to find a user profile with the given email to link
  let profileId: string | null = null;

  if (formData.email) {
    const { data: userData, error: userError } = await supabase.rpc(
      "get_user_by_email",
      { email_input: formData.email }
    );

    if (!userError && userData && userData.length > 0) {
      profileId = userData[0].id;
      console.log("✅ Found matching profile:", profileId);
    } else {
      console.log("⚠️ No matching profile found for email:", formData.email);
    }
  }

  const { data, error } = await supabase
    .from("counsellors")
    .insert({
      name: formData.name,
      email: formData.email || null,
      phone: formData.phone || null,
      bio: formData.bio || null,
      avatar_url: formData.avatar_url || null,
      specialties: formData.specialties,
      experience: formData.experience || null,
      experience_years: formData.experience_years || 0,
      qualifications: formData.qualifications || [],
      languages: formData.languages || ["English"],
      gender: formData.gender || null,
      is_active: formData.is_active ?? true,
      is_verified: formData.is_verified ?? false,
      status: formData.status || "pending",
      tier: formData.tier || 0,
      profile_id: profileId, // Link to profile if found
    })
    .select()
    .single();

  // After creation, if linked, ensuring the profile has the counselor flag set
  if (profileId) {
    await supabase.rpc("set_counselor_role", {
      target_user_id: profileId,
      is_counselor_val: true,
    });
  }

  if (error) {
    console.error("❌ Insert error:", {
      message: error.message,
      details: error.details,
      hint: error.hint,
      code: error.code,
    });
    throw new Error(
      `Failed to create counsellor: ${error.message}${
        error.hint ? " - " + error.hint : ""
      }`
    );
  }

  return data as Counsellor;
}

export async function updateCounsellor(
  id: string,
  formData: Partial<CounsellorFormData>
) {
  const supabase = await createClient();

  const updateData: any = {
    updated_at: new Date().toISOString(),
  };

  // Only update provided fields
  if (formData.name !== undefined) updateData.name = formData.name;
  if (formData.email !== undefined) updateData.email = formData.email;
  if (formData.phone !== undefined) updateData.phone = formData.phone;
  if (formData.bio !== undefined) updateData.bio = formData.bio;
  if (formData.avatar_url !== undefined)
    updateData.avatar_url = formData.avatar_url;
  if (formData.specialties !== undefined)
    updateData.specialties = formData.specialties;
  if (formData.experience !== undefined)
    updateData.experience = formData.experience;
  if (formData.experience_years !== undefined)
    updateData.experience_years = formData.experience_years;
  if (formData.qualifications !== undefined)
    updateData.qualifications = formData.qualifications;
  if (formData.languages !== undefined)
    updateData.languages = formData.languages;
  if (formData.gender !== undefined) updateData.gender = formData.gender;
  if (formData.is_active !== undefined)
    updateData.is_active = formData.is_active;
  if (formData.is_verified !== undefined)
    updateData.is_verified = formData.is_verified;
  if (formData.status !== undefined) updateData.status = formData.status;
  if (formData.tier !== undefined) updateData.tier = formData.tier;

  const { data, error } = await supabase
    .from("counsellors")
    .update(updateData)
    .eq("id", id)
    .select()
    .single();

  if (error) {
    throw new Error(error.message);
  }

  return data as Counsellor;
}

export async function deleteCounsellor(id: string) {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("counsellors")
    .update({
      status: "inactive",
      is_active: false,
      updated_at: new Date().toISOString(),
    })
    .eq("id", id)
    .select()
    .single();

  if (error) {
    throw new Error(error.message);
  }

  return data as Counsellor;
}
