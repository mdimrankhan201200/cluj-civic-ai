"use client";

import { useState, useRef, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Upload, X, ImageIcon, Loader2 } from "lucide-react";
import type { AiAnalysisResult } from "@/types";
import { toast } from "sonner";
import { useLanguage } from "@/contexts/LanguageContext";

type UploadResult = {
  imageUrl: string;
  publicId: string;
  aiResult: AiAnalysisResult;
};

type Props = {
  onUploadComplete: (result: UploadResult) => void;
  disabled?: boolean;
};

export function ImageUploader({ onUploadComplete, disabled }: Props) {
  const [preview, setPreview] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [dragOver, setDragOver] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const { t } = useLanguage();

  const handleFile = useCallback(
    async (file: File) => {
      if (!file.type.startsWith("image/")) {
        toast.error(t.uploader.notImage);
        return;
      }
      if (file.size > 10 * 1024 * 1024) {
        toast.error(t.uploader.tooLarge);
        return;
      }

      const objectUrl = URL.createObjectURL(file);
      setPreview(objectUrl);
      setUploading(true);

      try {
        const formData = new FormData();
        formData.append("image", file);

        const res = await fetch("/api/upload", { method: "POST", body: formData });

        if (!res.ok) {
          const json = await res.json();
          throw new Error(json.error ?? t.uploader.uploadError);
        }

        const data = (await res.json()) as UploadResult;
        onUploadComplete(data);
        if (data.aiResult.isDemoMode) {
          toast.warning("AI is running in demo mode — categories are estimated. Please review and correct if needed.", { duration: 6000 });
        } else {
          toast.success(t.uploader.success);
        }
      } catch (err) {
        toast.error((err as Error).message ?? t.uploader.processError);
        setPreview(null);
      } finally {
        setUploading(false);
      }
    },
    [onUploadComplete, t]
  );

  function handleInputChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (file) handleFile(file);
  }

  function handleDrop(e: React.DragEvent) {
    e.preventDefault();
    setDragOver(false);
    const file = e.dataTransfer.files?.[0];
    if (file) handleFile(file);
  }

  function clearImage() {
    setPreview(null);
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
      </div>
    );
  }

  return (
    <div
      onDrop={handleDrop}
      onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
      onDragLeave={() => setDragOver(false)}
      onClick={() => inputRef.current?.click()}
      className={`border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-colors ${
        dragOver ? "border-blue-500 bg-blue-50" : "border-border hover:border-blue-400 hover:bg-muted/30"
      } ${disabled ? "opacity-50 cursor-not-allowed" : ""}`}
    >
      <input
        ref={inputRef}
        type="file"
        accept="image/*"
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
        <Button type="button" variant="outline" size="sm" disabled={disabled}>
          <Upload className="h-4 w-4 mr-2" />
          {t.uploader.select}
        </Button>
      </div>
    </div>
  );
}
