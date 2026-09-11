"use client";

import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import {
  CounsellorFormData,
  CounsellorStatus,
  SPECIALTIES,
} from "@/types/counsellor";
import { uploadImage } from "@/lib/upload";
import { Loader2, Upload } from "lucide-react";
import Image from "next/image";
import { Institution } from "@/types/institution";
import { toast } from "sonner";
import Link from "next/link";
import { supabase } from "@/lib/supabase";
import {
  COUNSELLOR_TIER_LABELS,
  formatGhs,
  SessionPricingRow,
} from "@/lib/session-pricing";

interface CounsellorFormProps {
  initialData?: Partial<CounsellorFormData>;
  onSubmit: (data: CounsellorFormData) => Promise<void>;
  onCancel?: () => void;
  isLoading?: boolean;
  institutions?: Institution[];
  /** When set, defaults to Tier 0 support staff scoped to this institution. */
  institutionAdminInstitutionId?: string;
}

export function CounsellorForm({
  initialData,
  onSubmit,
  onCancel,
  isLoading,
  institutions = [],
  institutionAdminInstitutionId,
}: CounsellorFormProps) {
  const [selectedSpecialties, setSelectedSpecialties] = useState<string[]>(
    initialData?.specialties || []
  );
  const [selectedLanguages, setSelectedLanguages] = useState<string[]>(
    initialData?.languages || ["English"]
  );
  const [qualifications, setQualifications] = useState<string[]>(
    initialData?.qualifications || []
  );
  const [newQualification, setNewQualification] = useState("");
  const [uploading, setUploading] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(
    initialData?.avatar_url || null
  );
  const [sessionPricing, setSessionPricing] = useState<SessionPricingRow[]>([]);

  const {
    register,
    handleSubmit,
    formState: { errors },
    setValue,
    watch,
  } = useForm<CounsellorFormData>({
    defaultValues: {
      name: initialData?.name || "",
      email: initialData?.email || "",
      phone: initialData?.phone || "",
      bio: initialData?.bio || "",
      avatar_url: initialData?.avatar_url || "",
      experience: initialData?.experience || "",
      experience_years: initialData?.experience_years || 0,
      gender: initialData?.gender || "Male",
      is_active: initialData?.is_active ?? true,
      is_verified: initialData?.is_verified ?? false,
      status: initialData?.status || "pending",
      tier: initialData?.tier ?? (institutionAdminInstitutionId ? 0 : 0),
      specialties: initialData?.specialties || [],
      languages: initialData?.languages || ["English"],
      qualifications: initialData?.qualifications || [],
      institution_ids:
        initialData?.institution_ids ||
        (institutionAdminInstitutionId ? [institutionAdminInstitutionId] : []),
    },
  });

  useEffect(() => {
    supabase
      .from("session_pricing")
      .select("tier, label, amount_ghs")
      .order("tier")
      .then(({ data }) => {
        if (data) setSessionPricing(data as SessionPricingRow[]);
      });
  }, []);

  const toggleSpecialty = (specialty: string) => {
    const updated = selectedSpecialties.includes(specialty)
      ? selectedSpecialties.filter((s) => s !== specialty)
      : [...selectedSpecialties, specialty];
    setSelectedSpecialties(updated);
    setValue("specialties", updated);
  };

  const addQualification = () => {
    if (newQualification.trim()) {
      const updated = [...qualifications, newQualification.trim()];
      setQualifications(updated);
      setValue("qualifications", updated);
      setNewQualification("");
    }
  };

  const removeQualification = (index: number) => {
    const updated = qualifications.filter((_, i) => i !== index);
    setQualifications(updated);
    setValue("qualifications", updated);
  };

  const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setSelectedFile(file);
    const objectUrl = URL.createObjectURL(file);
    setPreviewUrl(objectUrl);
  };

  const handleFormSubmit = async (data: CounsellorFormData) => {
    setUploading(true);
    try {
      let finalAvatarUrl = data.avatar_url;

      if (selectedFile) {
        finalAvatarUrl = await uploadImage(selectedFile, "fafa-resources");
      }

      await onSubmit({
        ...data,
        avatar_url: finalAvatarUrl,
        specialties: selectedSpecialties,
        languages: selectedLanguages,
        qualifications,
      });
    } catch (error: any) {
      toast.error(error.message || "Failed to save counsellor");
    } finally {
      setUploading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit(handleFormSubmit)} className="space-y-6">
      {/* Basic Information */}
      <div className="space-y-4">
        <h3 className="text-lg font-semibold">Basic Information</h3>

        <div>
          <Label htmlFor="name">Name *</Label>
          <Input
            id="name"
            {...register("name", { required: "Name is required" })}
            placeholder="Dr. Jane Doe"
          />
          {errors.name && (
            <p className="text-sm text-red-500 mt-1">{errors.name.message}</p>
          )}
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              type="email"
              {...register("email")}
              placeholder="jane@example.com"
            />
          </div>

          <div>
            <Label htmlFor="phone">Phone</Label>
            <Input
              id="phone"
              {...register("phone")}
              placeholder="+233 XX XXX XXXX"
            />
          </div>
        </div>

        <div>
          <Label htmlFor="bio">Bio</Label>
          <Textarea
            id="bio"
            {...register("bio")}
            placeholder="Brief professional biography..."
            rows={4}
          />
        </div>

        <div>
          <Label>Avatar Image</Label>
          <div className="flex items-center gap-4 mt-2">
            <div className="relative h-20 w-20 rounded-full bg-muted overflow-hidden flex items-center justify-center border">
              {previewUrl ? (
                <Image
                  src={previewUrl}
                  alt="Avatar preview"
                  fill
                  className="object-cover"
                />
              ) : (
                <Upload className="h-8 w-8 text-muted-foreground" />
              )}
              {uploading && (
                <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
                  <Loader2 className="h-6 w-6 text-white animate-spin" />
                </div>
              )}
            </div>
            <div className="flex-1">
              <Input
                type="file"
                accept="image/*"
                onChange={handleAvatarUpload}
                disabled={uploading}
                className="hidden"
                id="avatar-upload"
              />
              <Label
                htmlFor="avatar-upload"
                className={`inline-flex items-center justify-center rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 border border-input bg-background hover:bg-accent hover:text-accent-foreground h-10 px-4 py-2 cursor-pointer ${
                  uploading ? "opacity-50 cursor-not-allowed" : ""
                }`}
              >
                {uploading ? "Uploading..." : "Choose Image"}
              </Label>
              <p className="text-xs text-muted-foreground mt-1">
                Max size 2MB. Recommended: Square image.
              </p>
            </div>
          </div>
          <Input
            {...register("avatar_url")}
            className="mt-2"
            placeholder="Or enter image URL manually..."
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <Label htmlFor="gender">Gender</Label>
            <Select
              value={watch("gender") || "Male"}
              onValueChange={(value) => setValue("gender", value as any)}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select gender" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="Male">Male</SelectItem>
                <SelectItem value="Female">Female</SelectItem>
                <SelectItem value="Other">Other</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      </div>

      {/* Professional Details */}
      <div className="space-y-4">
        <h3 className="text-lg font-semibold">Professional Details</h3>

        <div>
          <Label>Specialties *</Label>
          <div className="grid grid-cols-2 gap-2 mt-2">
            {SPECIALTIES.map((specialty) => (
              <div key={specialty} className="flex items-center space-x-2">
                <Checkbox
                  id={`specialty-${specialty}`}
                  checked={selectedSpecialties.includes(specialty)}
                  onCheckedChange={() => toggleSpecialty(specialty)}
                />
                <label
                  htmlFor={`specialty-${specialty}`}
                  className="text-sm cursor-pointer"
                >
                  {specialty}
                </label>
              </div>
            ))}
          </div>
          {selectedSpecialties.length === 0 && (
            <p className="text-sm text-red-500 mt-1">
              At least one specialty is required
            </p>
          )}
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <Label htmlFor="experience">Experience (Title)</Label>
            <Input
              id="experience"
              {...register("experience")}
              placeholder="10+ Years"
            />
          </div>

          <div>
            <Label htmlFor="experience_years">
              Years of Experience (Filter)
            </Label>
            <Input
              id="experience_years"
              type="number"
              {...register("experience_years", { valueAsNumber: true })}
              placeholder="10"
            />
          </div>
        </div>

        <div>
          <Label>Qualifications</Label>
          <div className="space-y-2">
            {qualifications.map((qual, index) => (
              <div key={index} className="flex items-center gap-2">
                <Input value={qual} readOnly />
                <Button
                  type="button"
                  variant="destructive"
                  size="sm"
                  onClick={() => removeQualification(index)}
                >
                  Remove
                </Button>
              </div>
            ))}
            <div className="flex gap-2">
              <Input
                value={newQualification}
                onChange={(e) => setNewQualification(e.target.value)}
                placeholder="Add qualification..."
                onKeyPress={(e) => {
                  if (e.key === "Enter") {
                    e.preventDefault();
                    addQualification();
                  }
                }}
              />
              <Button type="button" onClick={addQualification}>
                Add
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Status & Settings */}
      <div className="space-y-4">
        <h3 className="text-lg font-semibold">Status & Settings</h3>

        <div>
          <Label htmlFor="status">Status</Label>
          <Select
            value={watch("status")}
            onValueChange={(value) =>
              setValue("status", value as CounsellorStatus)
            }
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="pending">Pending</SelectItem>
              <SelectItem value="active">Active</SelectItem>
              <SelectItem value="inactive">Inactive</SelectItem>
              <SelectItem value="suspended">Suspended</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div>
          <Label htmlFor="tier">Tier</Label>
          <Select
            value={String(watch("tier") || 0)}
            onValueChange={(value) => setValue("tier", parseInt(value))}
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="0">{COUNSELLOR_TIER_LABELS[0]} (Tier 0)</SelectItem>
              <SelectItem value="1">{COUNSELLOR_TIER_LABELS[1]} (Tier 1)</SelectItem>
              <SelectItem value="2">{COUNSELLOR_TIER_LABELS[2]} (Tier 2)</SelectItem>
              <SelectItem value="3">{COUNSELLOR_TIER_LABELS[3]} (Tier 3)</SelectItem>
            </SelectContent>
          </Select>
          {watch("tier") === 0 && (
            <p className="mt-2 text-sm text-muted-foreground">
              Tier 0 staff reply in the shared institution support inbox. They cannot accept
              bookings or access session tools. Assign at least one institution below.
            </p>
          )}
          {(watch("tier") ?? 0) > 0 && (
            <p className="mt-2 text-sm text-muted-foreground">
              This tier currently charges{" "}
              {formatGhs(
                sessionPricing.find((row) => row.tier === watch("tier"))?.amount_ghs
              )}{" "}
              / session.{" "}
              <Link href="/dashboard/settings" className="underline">
                Edit rates
              </Link>
            </p>
          )}
        </div>

        <div className="flex items-center space-x-2">
          <Checkbox
            id="is_active"
            checked={watch("is_active")}
            onCheckedChange={(checked) =>
              setValue("is_active", checked as boolean)
            }
          />
          <Label htmlFor="is_active" className="cursor-pointer">
            Account Active
          </Label>
        </div>

        <div className="flex items-center space-x-2">
          <Checkbox
            id="is_verified"
            checked={watch("is_verified")}
            onCheckedChange={(checked) =>
              setValue("is_verified", checked as boolean)
            }
          />
          <Label htmlFor="is_verified" className="cursor-pointer">
            Verified Counsellor
          </Label>
        </div>

        {/* Institution Assignment */}
        <div className="space-y-4 pt-4 border-t">
          <h3 className="text-lg font-semibold">Institutional Access</h3>
          <div className="grid grid-cols-2 gap-2">
            {institutions.map((inst) => (
              <div key={inst.id} className="flex items-center space-x-2">
                <Checkbox
                  id={`inst-${inst.id}`}
                  checked={watch("institution_ids")?.includes(inst.id)}
                  onCheckedChange={(checked) => {
                    const current = watch("institution_ids") || [];
                    const updated = checked
                      ? [...current, inst.id]
                      : current.filter((id) => id !== inst.id);
                    setValue("institution_ids", updated);
                  }}
                />
                <label
                  htmlFor={`inst-${inst.id}`}
                  className="text-sm cursor-pointer"
                >
                  {inst.name}
                </label>
              </div>
            ))}
          </div>
          {institutions.length === 0 && (
            <p className="text-xs text-muted-foreground">No institutions available to assign.</p>
          )}
        </div>
      </div>

      {/* Actions */}
      <div className="flex justify-end gap-2">
        {onCancel && (
          <Button type="button" variant="outline" onClick={onCancel}>
            Cancel
          </Button>
        )}
        <Button
          type="submit"
          disabled={isLoading || selectedSpecialties.length === 0}
        >
          {isLoading
            ? "Saving..."
            : initialData
            ? "Update Counsellor"
            : "Create Counsellor"}
        </Button>
      </div>
    </form>
  );
}
