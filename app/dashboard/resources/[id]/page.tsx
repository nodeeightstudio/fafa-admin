import { ResourceForm } from "@/components/resources/resource-form";
import { Button } from "@/components/ui/button";
import { getResource } from "@/lib/actions/resources";
import { ChevronLeft } from "lucide-react";
import Link from "next/link";
import { notFound } from "next/navigation";

interface EditResourcePageProps {
  params: Promise<{
    id: string;
  }>;
}

export default async function EditResourcePage({
  params,
}: EditResourcePageProps) {
  const { id } = await params;

  try {
    const resource = await getResource(id);

    if (!resource) {
      notFound();
    }

    return (
      <div className="space-y-6">
        <div className="flex items-center gap-4">
          <Link href="/dashboard/resources">
            <Button variant="ghost" size="icon">
              <ChevronLeft className="h-4 w-4" />
            </Button>
          </Link>
          <h1 className="text-3xl font-bold tracking-tight">Edit Resource</h1>
        </div>

        <ResourceForm initialData={resource} />
      </div>
    );
  } catch (error) {
    notFound();
  }
}
