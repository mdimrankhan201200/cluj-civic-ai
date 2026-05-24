"use client";

import { useState, useRef, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Upload, X, ImageIcon, Loader2, Camera } from "lucide-react";
import type { AiAnalysisResult } from "@/types";
import { toast } from "sonner";
import { useLanguage } from "@/contexts/LanguageContext";

const MAX_RAW_SIZE = 10 * 1024 * 1024;  // 10MB — reject before even compressing
const TARGET_SIZE  =  3.5 * 1024 * 1024; // 3.5MB — stay under Vercel's 4.5MB limit
const MAX_DIMENSION = 1920;               // px — enough for any report photo

type UploadResult = {
  imageUrl: string;
  publicId: string;
  aiResult: AiAnalysisResult;
};

type Props = {
  onUploadComplete: (result: UploadResult) => void;
  onUploadingChange?: (uploading: boolean) => void;
  disabled?: boolean;
};

async function compressImage(file: File): Promise<File> {
  if (file.size <= TARGET_SIZE) return file;

  return new Promise((resolve, reject) => {
    const img = new Image();
    const url = URL.createObjectURL(file);

    img.onload = () => {
      URL.revokeObjectURL(url);

      let { width, height } = img;
      if (width > MAX_DIMENSION || height > MAX_DIMENSION) {
        if (width > height) {
          height = Math.round((height * MAX_DIMENSION) / width);
          width = MAX_DIMENSION;
        } else {
          width = Math.round((width * MAX_DIMENSION) / height);
          height = MAX_DIMENSION;
        }
      }

      const canvas = document.createElement("canvas");
      canvas.width = width;
      canvas.height = height;
      const ctx = canvas.getContext("2d");
      if (!ctx) { reject(new Error("Canvas not supported")); return; }
      ctx.drawImage(img, 0, 0, width, height);

      const tryCompress = (quality: number) => {
        canvas.toBlob(
          (blob) => {
            if (!blob) { reject(new Error("Compression failed")); return; }
            if (blob.size > TARGET_SIZE && quality > 0.3) {
              tryCompress(Math.round((quality - 0.1) * 10) / 10);
            } else {
              resolve(new File([blob], file.name.replace(/\.\w+$/, ".jpg"), {
                type: "image/jpeg",
                lastModified: Date.now(),
              }));
            }
          },
          "image/jpeg",
          quality
        );
      };
      tryCompress(0.85);
    };

    img.onerror = () => { URL.revokeObjectURL(url); reject(new Error("Could not read image")); };
    img.src = url;
  });
}

export function ImageUploader({ onUploadComplete, onUploadingChange, disabled }: Props) {
  const [preview, setPreview] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [uploadDone, setUploadDone] = useState(false);
  const [dragOver, setDragOver] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const cameraRef = useRef<HTMLInputElement>(null);
  const cancelledRef = useRef(false);
  const { t } = useLanguage();

  const handleFile = useCallback(
    async (file: File) => {
      if (!file.type.startsWith("image/")) {
        toast.error(t.uploader.notImage);
        return;
      }
      if (file.size > MAX_RAW_SIZE) {
        toast.error(t.uploader.tooLarge);
        return;
      }

      cancelledRef.current = false;
      setUploadDone(false);

      const objectUrl = URL.createObjectURL(file);
      setPreview(objectUrl);
      setUploading(true);
      onUploadingChange?.(true);

      try {
        const compressed = await compressImage(file);

        if (cancelledRef.current) return;

        const formData = new FormData();
        formData.append("image", compressed);

        const res = await fetch("/api/upload", { method: "POST", body: formData });

        if (cancelledRef.current) return;

        if (!res.ok) {
          const json = await res.json().catch(() => ({}));
          throw new Error(json.error ?? t.uploader.uploadError);
        }

        const data = (await res.json()) as UploadResult;
        setUploadDone(true);
        onUploadComplete(data);

        if (data.aiResult.isDemoMode) {
          toast.warning(
            "AI is running in demo mode — categories are estimated. Please review and correct if needed.",
            { duration: 6000 }
          );
        } else {
          toast.success(t.uploader.success);
        }
      } catch (err) {
        if (cancelledRef.current) return;
        toast.error((err as Error).message ?? t.uploader.processError);
        setPreview(null);
        setUploadDone(false);
      } finally {
        if (!cancelledRef.current) {
          setUploading(false);
          onUploadingChange?.(false);
        }
      }
    },
    [onUploadComplete, t]
  );

  function handleInputChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (file) handleFile(file);
    // reset input so the same file can be re-selected after clearing
    e.target.value = "";
  }

  function handleDrop(e: React.DragEvent) {
    e.preventDefault();
    setDragOver(false);
    const file = e.dataTransfer.files?.[0];
    if (file) handleFile(file);
  }

  function clearImage() {
    cancelledRef.current = true;
    setPreview(null);
    setUploading(false);
    setUploadDone(false);
    onUploadingChange?.(false);
    if (inputRef.current) inputRef.current.value = "";
  }

  if (preview) {
    return (
      <div className="relative rounded-lg overflow-hidden border border-border">
        {uploading && (
          <div className="absolute inset-0 bg-black/50 flex flex-col items-center justify-center z-10 gap-3">
            <Loader2 className="h-8 w-8 text-white animate-spin" />
            <p className="text-white text-sm font-medium">{t.uploader.analyzing}</p>
            <Skeleton className="h-2 w-48 bg-white/30" />
          </div>
        )}
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={preview} alt="Preview" className="w-full max-h-64 object-cover" />
        {!uploading && (
          <button
            type="button"
            onClick={clearImage}
            className="absolute top-2 right-2 bg-black/50 hover:bg-black/70 text-white rounded-full p-1 transition-colors"
          >
            <X className="h-4 w-4" />
          </button>
        )}
        {uploadDone && (
          <div className="absolute bottom-2 left-2 bg-green-600/90 text-white text-xs px-2 py-1 rounded-full">
            ✓ Uploaded
          </div>
        )}
      </div>
    );
  }

  return (
    <div
      onDrop={handleDrop}
      onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
      onDragLeave={() => setDragOver(false)}
      onClick={() => { /* handled by buttons below */ }}
      className={`border-2 border-dashed rounded-lg p-8 text-center transition-colors ${
        disabled ? "opacity-50 cursor-not-allowed" : "cursor-pointer"
      } ${dragOver ? "border-blue-500 bg-blue-50" : "border-border hover:border-blue-400 hover:bg-muted/30"}`}
    >
      {/* Gallery input */}
      <input
        ref={inputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp,image/gif"
        className="hidden"
        onChange={handleInputChange}
        disabled={disabled}
      />
      {/* Camera input — opens camera directly */}
      <input
        ref={cameraRef}
        type="file"
        accept="image/jpeg,image/png,image/webp"
        capture="environment"
        className="hidden"
        onChange={handleInputChange}
        disabled={disabled}
      />
      <div className="flex flex-col items-center gap-3">
        <div className="bg-blue-100 p-4 rounded-full">
          <ImageIcon className="h-8 w-8 text-blue-600" />
        </div>
        <div>
          <p className="font-medium">{t.uploader.drag}</p>
          <p className="text-sm text-muted-foreground mt-1">{t.uploader.formats}</p>
        </div>
        <div className="flex gap-2">
          <Button
            type="button"
            variant="outline"
            size="sm"
            disabled={disabled}
            onClick={(e) => { e.stopPropagation(); cameraRef.current?.click(); }}
          >
            <Camera className="h-4 w-4 mr-2" />
            Take Photo
          </Button>
          <Button
            type="button"
            variant="outline"
            size="sm"
            disabled={disabled}
            onClick={(e) => { e.stopPropagation(); inputRef.current?.click(); }}
          >
            <Upload className="h-4 w-4 mr-2" />
            {t.uploader.select}
          </Button>
        </div>
      </div>
    </div>
  );
}
