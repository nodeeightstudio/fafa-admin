"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase, isUserAdmin } from "@/lib/supabase";
import { CounsellorFormData } from "@/types/counsellor";
import { Button } from "@/components/ui/button";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { SidebarTrigger } from "@/components/ui/sidebar";
import { CounsellorForm } from "@/components/counsellors/counsellor-form";
import { createCounsellor } from "@/lib/actions/counsellors";
import { getInstitutions } from "@/lib/actions/institutions";
import { Institution } from "@/types/institution";
import { toast } from "sonner";

export default function NewCounsellorPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [formLoading, setFormLoading] = useState(false);
  const [institutions, setInstitutions] = useState<Institution[]>([]);
  const [institutionAdminInstitutionId, setInstitutionAdminInstitutionId] = useState<
    string | undefined
  >();

  useEffect(() => {
    const checkAuth = async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        router.push("/login");
        return;
      }

      const adminStatus = await isUserAdmin();
      if (!adminStatus) {
        toast.error("Access denied. Admin privileges required.");
        await supabase.auth.signOut();
        router.push("/login");
        return;
      }

      try {
        const { data: adminRecord } = await supabase
          .from("admins")
          .select("role, institution_id")
          .eq("id", user.id)
          .single();

        if (
          adminRecord?.role === "institution_admin" &&
          adminRecord.institution_id
        ) {
          setInstitutionAdminInstitutionId(adminRecord.institution_id);
        }

        const data = await getInstitutions();
        setInstitutions(data);
      } catch (error) {
        console.error("Error fetching institutions:", error);
      } finally {
        setLoading(false);
      }
    };

    checkAuth();
  }, [router]);

  const handleCreateCounsellor = async (formData: CounsellorFormData) => {
    setFormLoading(true);
    try {
      await createCounsellor(formData);
      toast.success("Counsellor created");
      router.push("/dashboard/counsellors");
    } catch (error: unknown) {
      toast.error(error instanceof Error ? error.message : "Failed to create counsellor");
    } finally {
      setFormLoading(false);
    }
  };

  if (loading) {
    return <div>Loading...</div>;
  }

  return (
    <>
      <header className="flex h-16 shrink-0 items-center gap-2">
        <div className="flex items-center gap-2 px-4">
          <SidebarTrigger className="-ml-1" />
          <Separator orientation="vertical" className="mr-2 data-[orientation=vertical]:h-4" />
          <Breadcrumb>
            <BreadcrumbList>
              <BreadcrumbItem className="hidden md:block">
                <BreadcrumbLink href="/dashboard">Dashboard</BreadcrumbLink>
              </BreadcrumbItem>
              <BreadcrumbSeparator className="hidden md:block" />
              <BreadcrumbItem>
                <BreadcrumbLink href="/dashboard/counsellors">Counsellors</BreadcrumbLink>
              </BreadcrumbItem>
              <BreadcrumbSeparator className="hidden md:block" />
              <BreadcrumbItem>
                <BreadcrumbPage>New</BreadcrumbPage>
              </BreadcrumbItem>
            </BreadcrumbList>
          </Breadcrumb>
        </div>
      </header>

      <div className="flex flex-1 flex-col gap-4 p-4 pt-0">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">Add New Counsellor</h1>
            <p className="text-muted-foreground">Create a counsellor profile and assign institutions.</p>
          </div>
          <Button variant="outline" onClick={() => router.push("/dashboard/counsellors")}>
            Back to counsellors
          </Button>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Counsellor Details</CardTitle>
            <CardDescription>Fill in the counsellor profile information.</CardDescription>
          </CardHeader>
          <CardContent>
            <CounsellorForm
              onSubmit={handleCreateCounsellor}
              onCancel={() => router.push("/dashboard/counsellors")}
              isLoading={formLoading}
              institutions={institutions}
              institutionAdminInstitutionId={institutionAdminInstitutionId}
            />
          </CardContent>
        </Card>
      </div>
    </>
  );
}
