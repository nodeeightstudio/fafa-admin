"use client";

import { useEffect, useState } from "react";
import { useRouter, useParams } from "next/navigation";
import { supabase, isUserAdmin } from "@/lib/supabase";
import { Counsellor } from "@/types/counsellor";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import { Separator } from "@/components/ui/separator";
import { SidebarTrigger } from "@/components/ui/sidebar";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { CounsellorForm } from "@/components/counsellors/counsellor-form";
import { AvailabilityScheduler } from "@/components/counsellors/availability-scheduler";
import { getCounsellor, updateCounsellor } from "@/lib/actions/counsellors";
import { Edit, Mail, Phone, Calendar, Star } from "lucide-react";
import { toast } from "sonner";

export default function CounsellorDetailPage() {
  const params = useParams();
  const router = useRouter();
  const counsellorId = params.id as string;

  const [counsellor, setCounsellor] = useState<Counsellor | null>(null);
  const [loading, setLoading] = useState(true);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [formLoading, setFormLoading] = useState(false);

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

      fetchCounsellor();
    };
    checkAuth();
  }, [router, counsellorId]);

  const fetchCounsellor = async () => {
    setLoading(true);
    try {
      const data = await getCounsellor(counsellorId);
      setCounsellor(data as any);
    } catch (error) {
      toast.error("Failed to load counsellor");
      router.push("/dashboard/counsellors");
    }
    setLoading(false);
  };

  const handleUpdateCounsellor = async (formData: any) => {
    setFormLoading(true);
    try {
      await updateCounsellor(counsellorId, formData);
      setIsEditModalOpen(false);
      await fetchCounsellor();
      toast.success("Counsellor updated");
    } catch (error: any) {
      toast.error(error.message || "Failed to update counsellor");
    }
    setFormLoading(false);
  };

  if (loading) {
    return <div>Loading...</div>;
  }

  if (!counsellor) {
    return <div>Counsellor not found</div>;
  }

  const initials = counsellor.name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);

  return (
    <>
      <header className="flex h-16 shrink-0 items-center gap-2 transition-[width,height] ease-linear group-has-data-[collapsible=icon]/sidebar-wrapper:h-12">
        <div className="flex items-center gap-2 px-4">
          <SidebarTrigger className="-ml-1" />
          <Separator
            orientation="vertical"
            className="mr-2 data-[orientation=vertical]:h-4"
          />
          <Breadcrumb>
            <BreadcrumbList>
              <BreadcrumbItem className="hidden md:block">
                <BreadcrumbLink href="/dashboard">Dashboard</BreadcrumbLink>
              </BreadcrumbItem>
              <BreadcrumbSeparator className="hidden md:block" />
              <BreadcrumbItem>
                <BreadcrumbLink href="/dashboard/counsellors">
                  Counsellors
                </BreadcrumbLink>
              </BreadcrumbItem>
              <BreadcrumbSeparator className="hidden md:block" />
              <BreadcrumbItem>
                <BreadcrumbPage>{counsellor.name}</BreadcrumbPage>
              </BreadcrumbItem>
            </BreadcrumbList>
          </Breadcrumb>
        </div>
      </header>

      <div className="flex flex-1 flex-col gap-4 p-4 pt-0">
        {/* Header */}
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-4">
                <Avatar className="h-20 w-20">
                  <AvatarImage
                    src={counsellor.avatar_url || undefined}
                    alt={counsellor.name}
                  />
                  <AvatarFallback className="text-2xl">
                    {initials}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <h1 className="text-2xl font-bold">{counsellor.name}</h1>
                    {counsellor.is_verified && (
                      <Badge
                        variant="outline"
                        className="text-blue-600 border-blue-600"
                      >
                        ✓ Verified
                      </Badge>
                    )}
                  </div>
                  <div className="flex items-center gap-4 text-sm text-muted-foreground">
                    {counsellor.email && (
                      <div className="flex items-center gap-1">
                        <Mail className="h-4 w-4" />
                        {counsellor.email}
                      </div>
                    )}
                    {counsellor.phone && (
                      <div className="flex items-center gap-1">
                        <Phone className="h-4 w-4" />
                        {counsellor.phone}
                      </div>
                    )}
                  </div>
                  <div className="flex flex-wrap gap-1 mt-2">
                    {counsellor.specialties.map((specialty) => (
                      <Badge key={specialty} variant="secondary">
                        {specialty}
                      </Badge>
                    ))}
                  </div>
                </div>
              </div>
              <Button onClick={() => setIsEditModalOpen(true)}>
                <Edit className="h-4 w-4 mr-2" />
                Edit Profile
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Stats */}
        <div className="grid gap-4 md:grid-cols-4">
          <Card>
            <CardHeader className="pb-2">
              <CardDescription>Total Sessions</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {counsellor.total_sessions}
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardDescription>Average Rating</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold flex items-center gap-1">
                {counsellor.average_rating.toFixed(1)}
                <Star className="h-5 w-5 fill-yellow-400 text-yellow-400" />
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardDescription>Total Reviews</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {counsellor.total_reviews}
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardDescription>Status</CardDescription>
            </CardHeader>
            <CardContent>
              <Badge className="text-sm">{counsellor.status}</Badge>
            </CardContent>
          </Card>
        </div>

        {/* Tabs */}
        <Tabs defaultValue="details" className="w-full">
          <TabsList>
            <TabsTrigger value="details">Details</TabsTrigger>
            <TabsTrigger value="availability">Availability</TabsTrigger>
            <TabsTrigger value="reviews">Reviews</TabsTrigger>
          </TabsList>

          <TabsContent value="details" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Professional Information</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {counsellor.bio && (
                  <div>
                    <h3 className="font-semibold mb-2">Bio</h3>
                    <p className="text-muted-foreground">{counsellor.bio}</p>
                  </div>
                )}
                {(counsellor.experience || counsellor.experience_years) && (
                  <div className="grid grid-cols-2 gap-4">
                    {counsellor.experience && (
                      <div>
                        <h3 className="font-semibold mb-2">
                          Experience (Title)
                        </h3>
                        <p className="text-muted-foreground">
                          {counsellor.experience}
                        </p>
                      </div>
                    )}
                    {counsellor.experience_years !== undefined && (
                      <div>
                        <h3 className="font-semibold mb-2">
                          Years of Experience
                        </h3>
                        <p className="text-muted-foreground">
                          {counsellor.experience_years}
                        </p>
                      </div>
                    )}
                  </div>
                )}
                {counsellor.gender && (
                  <div>
                    <h3 className="font-semibold mb-2">Gender</h3>
                    <p className="text-muted-foreground">{counsellor.gender}</p>
                  </div>
                )}
                {counsellor.qualifications.length > 0 && (
                  <div>
                    <h3 className="font-semibold mb-2">Qualifications</h3>
                    <ul className="list-disc list-inside text-muted-foreground">
                      {counsellor.qualifications.map((qual, index) => (
                        <li key={index}>{qual}</li>
                      ))}
                    </ul>
                  </div>
                )}
                <div>
                  <h3 className="font-semibold mb-2">Languages</h3>
                  <div className="flex flex-wrap gap-2">
                    {counsellor.languages.map((lang) => (
                      <Badge key={lang} variant="outline">
                        {lang}
                      </Badge>
                    ))}
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="availability">
            <Card>
              <CardHeader>
                <CardTitle>Weekly Schedule</CardTitle>
                <CardDescription>
                  Manage recurring weekly availability for this counsellor
                </CardDescription>
              </CardHeader>
              <CardContent>
                <AvailabilityScheduler counsellorId={counsellorId} />
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="reviews">
            <Card>
              <CardHeader>
                <CardTitle>Recent Reviews</CardTitle>
                <CardDescription>
                  {counsellor.total_reviews} total reviews
                </CardDescription>
              </CardHeader>
              <CardContent>
                {(counsellor as any).reviews &&
                (counsellor as any).reviews.length > 0 ? (
                  <div className="space-y-4">
                    {(counsellor as any).reviews.map(
                      (review: any, index: number) => (
                        <div
                          key={index}
                          className="border-b pb-4 last:border-0"
                        >
                          <div className="flex items-center gap-2 mb-2">
                            <div className="flex">
                              {Array.from({ length: review.rating }).map(
                                (_, i) => (
                                  <Star
                                    key={i}
                                    className="h-4 w-4 fill-yellow-400 text-yellow-400"
                                  />
                                )
                              )}
                            </div>
                            <span className="text-sm text-muted-foreground">
                              {new Date(review.created_at).toLocaleDateString()}
                            </span>
                          </div>
                          {review.comment && (
                            <p className="text-sm text-muted-foreground">
                              {review.comment}
                            </p>
                          )}
                        </div>
                      )
                    )}
                  </div>
                ) : (
                  <p className="text-muted-foreground">No reviews yet</p>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>

      {/* Edit Modal */}
      <Dialog open={isEditModalOpen} onOpenChange={setIsEditModalOpen}>
        <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Edit Counsellor</DialogTitle>
            <DialogDescription>
              Update counsellor profile information
            </DialogDescription>
          </DialogHeader>
          <CounsellorForm
            initialData={{
              ...counsellor,
              email: counsellor.email || undefined,
              phone: counsellor.phone || undefined,
              bio: counsellor.bio || undefined,
              avatar_url: counsellor.avatar_url || undefined,
              experience: counsellor.experience || undefined,
              experience_years: counsellor.experience_years,
              gender: counsellor.gender,
            }}
            onSubmit={handleUpdateCounsellor}
            onCancel={() => setIsEditModalOpen(false)}
            isLoading={formLoading}
          />
        </DialogContent>
      </Dialog>
    </>
  );
}
