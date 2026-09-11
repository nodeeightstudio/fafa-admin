"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { isSuperAdmin, isUserAdmin } from "@/lib/supabase";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
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
import { Skeleton } from "@/components/ui/skeleton";
import {
  getSessionPricing,
  updateSessionPricing,
} from "@/lib/actions/session-pricing";
import { formatGhs, SessionPricingRow } from "@/lib/session-pricing";
import { toast } from "sonner";

export default function SettingsPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [rows, setRows] = useState<SessionPricingRow[]>([]);
  const [amounts, setAmounts] = useState<Record<number, string>>({});

  useEffect(() => {
    const init = async () => {
      const admin = await isUserAdmin();
      if (!admin) {
        router.push("/login");
        return;
      }

      const superAdmin = await isSuperAdmin();
      if (!superAdmin) {
        toast.error("Only FAFA admins can edit session pricing.");
        router.replace("/dashboard");
        return;
      }

      try {
        const pricing = await getSessionPricing();
        setRows(pricing);
        setAmounts(
          Object.fromEntries(pricing.map((row) => [row.tier, String(row.amount_ghs)]))
        );
      } catch (error) {
        toast.error(error instanceof Error ? error.message : "Failed to load pricing");
      } finally {
        setLoading(false);
      }
    };

    init();
  }, [router]);

  const handleSave = async (event: React.FormEvent) => {
    event.preventDefault();
    setSaving(true);
    try {
      const payload = rows.map((row) => ({
        tier: row.tier,
        amount_ghs: Number(amounts[row.tier]),
      }));
      const updated = await updateSessionPricing(payload);
      setRows(updated);
      setAmounts(
        Object.fromEntries(updated.map((row) => [row.tier, String(row.amount_ghs)]))
      );
      toast.success("Session prices updated");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to save prices");
    } finally {
      setSaving(false);
    }
  };

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
                <BreadcrumbPage>Settings</BreadcrumbPage>
              </BreadcrumbItem>
            </BreadcrumbList>
          </Breadcrumb>
        </div>
      </header>

      <div className="flex flex-1 flex-col gap-6 p-4 pt-0">
        <div>
          <h1 className="text-3xl font-bold">Settings</h1>
          <p className="text-muted-foreground">
            Set the 1:1 session price charged for each counsellor tier. Amounts are in Ghana cedis.
          </p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Session pricing</CardTitle>
            <CardDescription>
              These rates apply to every counsellor in that tier. Existing bookings keep the amount
              charged at checkout.
            </CardDescription>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="space-y-4">
                <Skeleton className="h-16 w-full" />
                <Skeleton className="h-16 w-full" />
                <Skeleton className="h-16 w-full" />
              </div>
            ) : (
              <form onSubmit={handleSave} className="space-y-6">
                {rows.map((row) => (
                  <div key={row.tier} className="grid gap-2 sm:grid-cols-[1fr_180px] sm:items-end">
                    <div>
                      <Label htmlFor={`tier-${row.tier}`}>{row.label}</Label>
                      <p className="text-xs text-muted-foreground">Tier {row.tier}</p>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor={`tier-${row.tier}`}>Amount (GHS)</Label>
                      <Input
                        id={`tier-${row.tier}`}
                        type="number"
                        min={1}
                        step={1}
                        required
                        value={amounts[row.tier] ?? ""}
                        onChange={(event) =>
                          setAmounts((current) => ({
                            ...current,
                            [row.tier]: event.target.value,
                          }))
                        }
                      />
                    </div>
                  </div>
                ))}

                <Button type="submit" disabled={saving}>
                  {saving ? "Saving..." : "Save prices"}
                </Button>
              </form>
            )}
          </CardContent>
        </Card>

        {!loading && rows.length > 0 && (
          <p className="text-sm text-muted-foreground">
            Current rates:{" "}
            {rows.map((row) => `${row.label} ${formatGhs(row.amount_ghs)}`).join(" · ")}
          </p>
        )}
      </div>
    </>
  );
}
