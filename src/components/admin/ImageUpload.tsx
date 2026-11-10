import React, { useState, useRef } from "react";
import { Upload, X, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { adminService } from "@/services/admin.service";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { normalizeImageUrl } from "@/lib/image/cdn";

export interface ImageUploadProps {
  value: string;
  onChange: (url: string) => void;
  folder: string;
  label?: string;
  hint?: string;
  className?: string;
  error?: string;
  /** Optional custom uploader; defaults to adminService.uploadImage. */
  uploadFn?: (file: File, folder: string) => Promise<any>;
}

export function ImageUpload({
  value,
  onChange,
  folder,
  label = "Upload Image",
  hint,
  className,
  error,
  uploadFn,
}: ImageUploadProps) {
  const [isUploading, setIsUploading] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [showManual, setShowManual] = useState(false);
  const [previewError, setPreviewError] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Reset preview error if value changes
  React.useEffect(() => {
    setPreviewError(false);
  }, [value]);

  const handleUpload = async (file: File) => {
    if (!file.type.startsWith("image/")) {
      toast.error("Please select a valid image file");
      return;
    }

    if (file.size > 15 * 1024 * 1024) {
      toast.error("File size should be less than 15MB");
      return;
    }

    setIsUploading(true);
    try {
      const response = await (uploadFn ? uploadFn(file, folder) : adminService.uploadImage(file, folder));
      console.log("[ImageUpload] server response:", response);

      // Support all common server response formats
      const uploadedUrl =
        (typeof response === "string" ? response : null) ||
        (response as any)?.url ||
        (response as any)?.data?.url ||
        (typeof (response as any)?.data === "string" ? (response as any).data : null) ||
        (response as any)?.secure_url ||
        (response as any)?.imageUrl ||
        "";

      if (!uploadedUrl || typeof uploadedUrl !== "string") {
        console.error("[ImageUpload] No URL found in response:", response);
        toast.error("Upload succeeded but server returned no image URL. Check console.");
        return;
      }

      setPreviewError(false);
      onChange(uploadedUrl);
      toast.success("Image uploaded successfully");
    } catch (err: any) {
      console.error("[ImageUpload] Upload error:", err);
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
      <div>
        <Label>{label}</Label>
        {hint && <p className="text-xs text-muted-foreground mt-0.5">{hint}</p>}
      </div>

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
              <p className="text-xs text-muted-foreground">PNG, JPG or WebP (max. 15MB)</p>
            </>
          )}
          <input
            type="file"
            ref={fileInputRef}
            className="hidden"
            accept="image/png, image/jpeg, image/webp, image/svg+xml"
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
          <div className="h-48 w-full flex flex-col items-center justify-center p-4">
            {previewError ? (
              <div className="text-center space-y-1.5 p-2">
                <p className="text-xs font-semibold text-amber-600 dark:text-amber-400">
                  Image uploaded, but preview URL failed to load in browser
                </p>
                <p className="text-[11px] text-muted-foreground break-all max-w-sm px-2 font-mono bg-muted/50 p-1.5 rounded">
                  {value}
                </p>
              </div>
            ) : (
              <img
                src={normalizeImageUrl(value)}
                alt="Uploaded preview"
                className="max-h-full max-w-full object-contain drop-shadow-sm"
                onError={() => {
                  setPreviewError(true);
                }}
              />
            )}
          </div>
          <input
            type="file"
            ref={fileInputRef}
            className="hidden"
            accept="image/png, image/jpeg, image/webp, image/svg+xml"
            onChange={onFileChange}
          />
        </div>
      ) : null}

      {showManual && !value && (
        <div className="flex items-center gap-2 mt-2">
          <Input
            value={value}
            onChange={(e) => onChange(e.target.value)}
            placeholder="https://batterymantra.com/uploads/image.jpg"
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

