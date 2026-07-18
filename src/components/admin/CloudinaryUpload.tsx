import React, { useState, useRef } from "react";
import { Upload, X, Image as ImageIcon, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { adminService } from "@/services/admin.service";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

interface CloudinaryUploadProps {
  value: string;
  onChange: (url: string) => void;
  folder: string;
  label?: string;
  className?: string;
  error?: string;
}

export function CloudinaryUpload({
  value,
  onChange,
  folder,
  label = "Upload Image",
  className,
  error,
}: CloudinaryUploadProps) {
  const [isUploading, setIsUploading] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [showManual, setShowManual] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleUpload = async (file: File) => {
    if (!file.type.startsWith("image/")) {
      toast.error("Please select a valid image file");
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      toast.error("File size should be less than 5MB");
      return;
    }

    setIsUploading(true);
    try {
      const response = await adminService.uploadImage(file, folder);
      onChange(response.url);
      toast.success("Image uploaded successfully");
    } catch (err: any) {
      toast.error(err?.message || "Failed to upload image");
    } finally {
      setIsUploading(false);
    }
  };

  const onDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const onDragLeave = () => {
    setIsDragging(false);
  };

  const onDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleUpload(e.dataTransfer.files[0]);
    }
  };

  const onFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      handleUpload(e.target.files[0]);
    }
    // Reset input so the same file can be uploaded again if needed
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  return (
    <div className={cn("space-y-2", className)}>
      <Label>{label}</Label>

      {!value && !showManual ? (
        <div
          onDragOver={onDragOver}
          onDragLeave={onDragLeave}
          onDrop={onDrop}
          onClick={() => !isUploading && fileInputRef.current?.click()}
          className={cn(
            "border-2 border-dashed rounded-xl p-8 flex flex-col items-center justify-center text-center cursor-pointer transition-colors",
            isDragging ? "border-brand bg-brand/5" : "border-muted hover:border-brand/50 hover:bg-muted/50",
            isUploading && "pointer-events-none opacity-50",
            error && "border-red-500 bg-red-50"
          )}
        >
          {isUploading ? (
            <>
              <Loader2 className="h-10 w-10 text-muted-foreground animate-spin mb-4" />
              <p className="text-sm font-medium text-foreground">Uploading image...</p>
            </>
          ) : (
            <>
              <div className="h-12 w-12 rounded-full bg-brand/10 flex items-center justify-center mb-4">
                <Upload className="h-6 w-6 text-brand" />
              </div>
              <p className="text-sm font-medium text-foreground mb-1">Click or drag image here to upload</p>
              <p className="text-xs text-muted-foreground">PNG, JPG or WebP (max. 5MB)</p>
            </>
          )}
          <input
            type="file"
            ref={fileInputRef}
            className="hidden"
            accept="image/png, image/jpeg, image/webp"
            onChange={onFileChange}
          />
        </div>
      ) : value ? (
        <div className="relative border rounded-xl overflow-hidden bg-muted/20">
          <div className="absolute top-2 right-2 flex gap-2">
            <Button
              type="button"
              variant="secondary"
              size="sm"
              onClick={() => fileInputRef.current?.click()}
              className="h-8 shadow-sm opacity-90 hover:opacity-100"
              disabled={isUploading}
            >
              {isUploading ? <Loader2 className="h-4 w-4 animate-spin" /> : "Replace"}
            </Button>
            <Button
              type="button"
              variant="destructive"
              size="icon"
              onClick={() => {
                onChange("");
                setShowManual(false);
              }}
              className="h-8 w-8 shadow-sm opacity-90 hover:opacity-100"
              disabled={isUploading}
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
          <div className="h-48 w-full flex items-center justify-center p-4">
            <img
              src={value}
              alt="Uploaded preview"
              className="max-h-full max-w-full object-contain drop-shadow-sm"
              onError={(e) => {
                e.currentTarget.style.display = "none";
              }}
            />
          </div>
          <input
            type="file"
            ref={fileInputRef}
            className="hidden"
            accept="image/png, image/jpeg, image/webp"
            onChange={onFileChange}
          />
        </div>
      ) : null}

      {showManual && !value && (
        <div className="flex items-center gap-2 mt-2">
          <Input
            value={value}
            onChange={(e) => onChange(e.target.value)}
            placeholder="https://example.com/image.jpg"
            className={cn("flex-1", error && "border-red-500")}
          />
        </div>
      )}

      {error && <p className="text-xs text-red-500">{error}</p>}

      {!value && (
        <div className="flex justify-end mt-1">
          <Button
            type="button"
            variant="link"
            size="sm"
            className="text-xs text-muted-foreground px-0 h-auto"
            onClick={() => setShowManual(!showManual)}
          >
            {showManual ? "Switch to File Upload" : "Enter URL manually"}
          </Button>
        </div>
      )}
    </div>
  );
}
