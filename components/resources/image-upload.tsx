"use client";

import { useState, useRef, useEffect } from "react";
import { Input } from "@/components/ui/input";
import { ImagePlus, X } from "lucide-react";
import Image from "next/image";

interface ImageUploadProps {
  value?: string; // Existing image URL
  onChange: (file: File | null) => void;
  disabled?: boolean;
}

export function ImageUpload({ value, onChange, disabled }: ImageUploadProps) {
  const [preview, setPreview] = useState<string | null>(value || null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (value) {
      setPreview(value);
    }
  }, [value]);

  const handleSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Create local preview
    const previewUrl = URL.createObjectURL(file);
    setPreview(previewUrl);
    onChange(file);
  };

  const handleRemove = () => {
    setPreview(null);
    onChange(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  return (
    <div className="space-y-4 w-full flex flex-col items-center justify-center">
      <div
        onClick={() => !disabled && fileInputRef.current?.click()}
        className={`
          relative w-full aspect-video rounded-lg border-2 border-dashed 
          flex flex-col items-center justify-center cursor-pointer
          hover:opacity-70 transition duration-200
          ${disabled ? "opacity-50 cursor-not-allowed" : ""}
          ${preview ? "border-none" : "border-muted-foreground/25"}
        `}
      >
        {preview ? (
          <div className="relative w-full h-full group">
            <Image
              fill
              src={preview}
              alt="Upload"
              className="object-cover rounded-lg"
            />
            {!disabled && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  handleRemove();
                }}
                className="absolute top-2 right-2 p-1 bg-destructive text-white rounded-full opacity-0 group-hover:opacity-100 transition shadow-sm"
              >
                <X className="h-4 w-4" />
              </button>
            )}
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center gap-2 text-muted-foreground">
            <ImagePlus className="h-10 w-10" />
            <span className="text-sm">Click to select thumbnail</span>
          </div>
        )}
      </div>
      <Input
        type="file"
        accept="image/*"
        onChange={handleSelect}
        className="hidden"
        ref={fileInputRef}
        disabled={disabled}
      />
    </div>
  );
}
