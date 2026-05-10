export type ResourceType =
  | "video"
  | "article"
  | "playlist"
  | "audio"
  | "podcast";

export interface Resource {
  id: string;
  title: string;
  description: string | null;
  category: string;
  type: ResourceType;
  url: string | null;
  urls: string[];
  content: string | null;
  image_url: string | null;
  created_at: string;
  updated_at: string;
  scope: 'global' | 'institution';
  institution_id: string | null;
}

export interface ResourceFormData {
  title: string;
  description?: string;
  category: string;
  type: ResourceType;
  url?: string;
  urls?: string[];
  content?: string;
  image_url?: string;
  scope: 'global' | 'institution';
  institution_id?: string | null;
}
