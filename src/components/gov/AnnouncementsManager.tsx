"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Megaphone, Trash2, Plus, Loader2, X } from "lucide-react";
import { toast } from "sonner";
import { formatDistanceToNow } from "date-fns";

type Announcement = {
  id: string;
  title: string;
  content: string;
  createdAt: Date;
  officer: { id: string; name: string };
};

const schema = z.object({
  title: z.string().min(3, "Title must be at least 3 characters"),
  content: z.string().min(10, "Content must be at least 10 characters"),
});
type FormValues = z.infer<typeof schema>;

export function AnnouncementsManager({
  announcements: initial,
  currentUserId,
  isAdmin,
}: {
  announcements: Announcement[];
  currentUserId: string;
  isAdmin: boolean;
}) {
  const router = useRouter();
  const [announcements, setAnnouncements] = useState(initial);
  const [showForm, setShowForm] = useState(false);
  const [deleting, setDeleting] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<FormValues>({ resolver: zodResolver(schema) });

  async function onSubmit(data: FormValues) {
    const res = await fetch("/api/gov/announcements", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });
    const json = await res.json();
    if (!res.ok) {
      toast.error(json.error ?? "Failed to publish announcement");
      return;
    }
    setAnnouncements((prev) => [json.data, ...prev]);
    reset();
    setShowForm(false);
    toast.success("Announcement published successfully!");
    router.refresh();
  }

  async function handleDelete(id: string) {
    setDeleting(id);
    try {
      const res = await fetch(`/api/gov/announcements/${id}`, { method: "DELETE" });
      if (!res.ok) {
        toast.error("Failed to delete announcement");
        return;
      }
      setAnnouncements((prev) => prev.filter((a) => a.id !== id));
      toast.success("Announcement deleted");
    } finally {
      setDeleting(null);
    }
  }

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Official Announcements</h1>
          <p className="text-muted-foreground text-sm">Publish and manage announcements visible to citizens</p>
        </div>
        <Button onClick={() => setShowForm((s) => !s)} variant={showForm ? "outline" : "default"}>
          {showForm ? (
            <>
              <X className="h-4 w-4 mr-2" />
              Cancel
            </>
          ) : (
            <>
              <Plus className="h-4 w-4 mr-2" />
              New Announcement
            </>
          )}
        </Button>
      </div>

      {showForm && (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <Megaphone className="h-4 w-4" />
              Publish New Announcement
            </CardTitle>
            <CardDescription>The announcement will be immediately visible on the public transparency page</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="title">Title</Label>
                <Input
                  id="title"
                  placeholder="e.g. Road repair works on Horea Street"
                  {...register("title")}
                />
                {errors.title && (
                  <p className="text-sm text-destructive">{errors.title.message}</p>
                )}
              </div>
              <div className="space-y-2">
                <Label htmlFor="content">Content</Label>
                <Textarea
                  id="content"
                  rows={4}
                  placeholder="Describe the planned works, traffic impact, estimated duration..."
                  {...register("content")}
                />
                {errors.content && (
                  <p className="text-sm text-destructive">{errors.content.message}</p>
                )}
              </div>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Publishing...
                  </>
                ) : (
                  <>
                    <Megaphone className="h-4 w-4 mr-2" />
                    Publish Announcement
                  </>
                )}
              </Button>
            </form>
          </CardContent>
        </Card>
      )}

      {announcements.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center gap-3 py-12 text-muted-foreground">
            <Megaphone className="h-10 w-10 opacity-30" />
            <p>No announcements published yet</p>
            <Button variant="outline" onClick={() => setShowForm(true)}>
              Publish first announcement
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {announcements.map((ann) => {
            const canDelete = isAdmin || ann.officer.id === currentUserId;
            return (
              <Card key={ann.id}>
                <CardContent className="p-4">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1 space-y-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <h3 className="font-semibold">{ann.title}</h3>
                        <Badge variant="outline" className="text-xs bg-blue-50 text-blue-700 border-blue-200">
                          Official
                        </Badge>
                      </div>
                      <p className="text-sm text-muted-foreground">{ann.content}</p>
                      <div className="flex items-center gap-3 text-xs text-muted-foreground pt-1">
                        <span>{ann.officer.name}</span>
                        <span>·</span>
                        <span>
                          {formatDistanceToNow(new Date(ann.createdAt), { addSuffix: true })}
                        </span>
                      </div>
                    </div>
                    {canDelete && (
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleDelete(ann.id)}
                        disabled={deleting === ann.id}
                        className="text-muted-foreground hover:text-destructive shrink-0"
                      >
                        {deleting === ann.id ? (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                          <Trash2 className="h-4 w-4" />
                        )}
                      </Button>
                    )}
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
