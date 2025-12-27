"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
  FormDescription,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Resource, ResourceFormData, ResourceType } from "@/types/resource";
import { createResource, updateResource } from "@/lib/actions/resources";
import { RichTextEditor } from "./rich-text-editor";
import { ImageUpload } from "./image-upload";
import { Plus, Trash2 } from "lucide-react";
import { uploadImage } from "@/lib/upload";

const formSchema = z.object({
  title: z.string().min(1, "Title is required"),
  description: z.string().optional(),
  category: z.string().min(1, "Category is required"),
  type: z.enum(["video", "article", "playlist"]),
  url: z.string().optional().or(z.literal("")),
  urls: z.array(z.string().url("Invalid URL")).optional(),
  content: z.string().optional(),
  image_url: z.string().optional().or(z.literal("")),
});

interface ResourceFormProps {
  initialData?: Resource;
}

export function ResourceForm({ initialData }: ResourceFormProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [urls, setUrls] = useState<string[]>(initialData?.urls || [""]);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      title: initialData?.title || "",
      description: initialData?.description || "",
      category: initialData?.category || "",
      type: initialData?.type || "video",
      url: initialData?.url || "",
      urls: initialData?.urls || [],
      content: initialData?.content || "",
      image_url: initialData?.image_url || "",
    },
  });

  const resourceType = form.watch("type");

  const onSubmit = async (values: z.infer<typeof formSchema>) => {
    setLoading(true);
    try {
      let finalImageUrl = values.image_url;

      // Handle image upload if a new file was selected
      if (selectedFile) {
        finalImageUrl = await uploadImage(selectedFile);
      }

      const data: ResourceFormData = {
        ...values,
        image_url: finalImageUrl,
        urls:
          resourceType === "video" || resourceType === "playlist"
            ? urls.filter((u) => u !== "")
            : [],
      };

      if (initialData) {
        await updateResource(initialData.id, data);
      } else {
        await createResource(data);
      }
      router.push("/dashboard/resources");
      router.refresh();
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const addUrl = () => {
    setUrls([...urls, ""]);
  };

  const removeUrl = (index: number) => {
    const newUrls = urls.filter((_, i) => i !== index);
    setUrls(newUrls.length ? newUrls : [""]);
  };

  const updateUrl = (index: number, value: string) => {
    const newUrls = [...urls];
    newUrls[index] = value;
    setUrls(newUrls);
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Basic Information</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <FormField
                  control={form.control}
                  name="title"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Title</FormLabel>
                      <FormControl>
                        <Input placeholder="Resource title" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="category"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Category</FormLabel>
                        <FormControl>
                          <Input
                            placeholder="e.g. Anxiety, Depression"
                            {...field}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="type"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Resource Type</FormLabel>
                        <Select
                          onValueChange={field.onChange}
                          defaultValue={field.value}
                        >
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Select type" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="video">Video</SelectItem>
                            <SelectItem value="article">Article</SelectItem>
                            <SelectItem value="playlist">Playlist</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <FormField
                  control={form.control}
                  name="description"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Short Description</FormLabel>
                      <FormControl>
                        <Textarea
                          placeholder="Explanatory text for the resource"
                          className="min-h-[100px]"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </CardContent>
            </Card>

            {resourceType === "article" && (
              <Card>
                <CardHeader>
                  <CardTitle>Article Content</CardTitle>
                </CardHeader>
                <CardContent>
                  <FormField
                    control={form.control}
                    name="content"
                    render={({ field }) => (
                      <FormItem>
                        <FormControl>
                          <RichTextEditor
                            content={field.value || ""}
                            onChange={field.onChange}
                            placeholder="Write your article content here..."
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </CardContent>
              </Card>
            )}

            {(resourceType === "video" || resourceType === "playlist") && (
              <Card>
                <CardHeader className="flex flex-row items-center justify-between">
                  <CardTitle>URLs</CardTitle>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={addUrl}
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    Add URL
                  </Button>
                </CardHeader>
                <CardContent className="space-y-4">
                  {urls.map((url, index) => (
                    <div key={index} className="flex gap-2">
                      <Input
                        placeholder="https://..."
                        value={url}
                        onChange={(e) => updateUrl(index, e.target.value)}
                      />
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        onClick={() => removeUrl(index)}
                        disabled={urls.length === 1}
                      >
                        <Trash2 className="h-4 w-4 text-destructive" />
                      </Button>
                    </div>
                  ))}
                  <FormDescription>
                    Add one or more URLs for this {resourceType}.
                  </FormDescription>
                </CardContent>
              </Card>
            )}
          </div>

          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Media</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <FormField
                  control={form.control}
                  name="image_url"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Thumbnail Image</FormLabel>
                      <FormControl>
                        <ImageUpload
                          value={field.value}
                          onChange={(file) => setSelectedFile(file)}
                          disabled={loading}
                        />
                      </FormControl>
                      <FormDescription>
                        Thumbnail for the resource.
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {resourceType === "article" && (
                  <FormField
                    control={form.control}
                    name="url"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Link (Optional)</FormLabel>
                        <FormControl>
                          <Input placeholder="https://..." {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                )}
              </CardContent>
            </Card>

            <div className="flex flex-col gap-3">
              <Button type="submit" className="w-full" disabled={loading}>
                {loading
                  ? "Saving..."
                  : initialData
                  ? "Update Resource"
                  : "Create Resource"}
              </Button>
              <Button
                type="button"
                variant="outline"
                className="w-full"
                onClick={() => router.back()}
                disabled={loading}
              >
                Cancel
              </Button>
            </div>
          </div>
        </div>
      </form>
    </Form>
  );
}
