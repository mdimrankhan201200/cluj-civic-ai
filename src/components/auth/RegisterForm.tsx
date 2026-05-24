"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { MapPin, Loader2, User, ShieldCheck, Clock } from "lucide-react";
import { toast } from "sonner";
import { useLanguage } from "@/contexts/LanguageContext";

const registerSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters"),
  email: z.string().email("Invalid email"),
  password: z.string().min(6, "Password must be at least 6 characters"),
  role: z.enum(["CITIZEN", "GOVERNMENT_OFFICER"]),
});

type RegisterValues = z.infer<typeof registerSchema>;

export function RegisterForm() {
  const router = useRouter();
  const { t } = useLanguage();
  const [loading, setLoading] = useState(false);
  const [pendingApproval, setPendingApproval] = useState(false);

  const { register, handleSubmit, watch, setValue, formState: { errors } } = useForm<RegisterValues>({
    resolver: zodResolver(registerSchema),
    defaultValues: { role: "CITIZEN" },
  });

  const selectedRole = watch("role");

  async function onSubmit(data: RegisterValues) {
    setLoading(true);
    try {
      const res = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });

      const json = await res.json();

      if (!res.ok) {
        toast.error(json.error ?? t.auth.register.registerError);
        return;
      }

      if (json.pendingApproval) {
        setPendingApproval(true);
        return;
      }

      await signIn("credentials", {
        email: data.email,
        password: data.password,
        redirect: false,
      });

      router.push("/dashboard");
      router.refresh();
    } finally {
      setLoading(false);
    }
  }

  if (pendingApproval) {
    return (
      <Card className="w-full max-w-md shadow-lg">
        <CardContent className="p-8 text-center space-y-4">
          <div className="flex justify-center">
            <div className="bg-yellow-100 p-4 rounded-full">
              <Clock className="h-8 w-8 text-yellow-600" />
            </div>
          </div>
          <h2 className="text-xl font-bold">Account Pending Approval</h2>
          <p className="text-muted-foreground text-sm">
            {t.auth.register.pendingApproval}
          </p>
          <Link href="/login" className="block">
            <Button variant="outline" className="w-full">
              {t.auth.register.loginLink}
            </Button>
          </Link>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="w-full max-w-md shadow-lg">
      <CardHeader className="text-center">
        <div className="flex justify-center mb-2">
          <div className="bg-blue-600 p-3 rounded-full">
            <MapPin className="h-6 w-6 text-white" />
          </div>
        </div>
        <CardTitle className="text-2xl">{t.auth.register.title}</CardTitle>
        <CardDescription>{t.auth.register.subtitle}</CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          {/* Role selector */}
          <div className="space-y-2">
            <Label>{t.auth.register.role}</Label>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => setValue("role", "CITIZEN")}
                className={`flex flex-col items-center gap-1.5 p-3 rounded-lg border text-sm font-medium transition-colors ${
                  selectedRole === "CITIZEN"
                    ? "bg-green-50 border-green-500 text-green-700"
                    : "border-border text-muted-foreground hover:bg-muted"
                }`}
              >
                <User className="h-5 w-5" />
                {t.auth.register.citizen}
              </button>
              <button
                type="button"
                onClick={() => setValue("role", "GOVERNMENT_OFFICER")}
                className={`flex flex-col items-center gap-1.5 p-3 rounded-lg border text-sm font-medium transition-colors ${
                  selectedRole === "GOVERNMENT_OFFICER"
                    ? "bg-blue-50 border-blue-500 text-blue-700"
                    : "border-border text-muted-foreground hover:bg-muted"
                }`}
              >
                <ShieldCheck className="h-5 w-5" />
                {t.auth.register.govOfficer}
              </button>
            </div>
            {selectedRole === "GOVERNMENT_OFFICER" && (
              <p className="text-xs text-yellow-600 bg-yellow-50 border border-yellow-200 rounded px-3 py-2">
                Officer accounts require administrator approval before activation.
              </p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="name">{t.auth.register.name}</Label>
            <Input id="name" placeholder={t.auth.register.namePlaceholder} {...register("name")} />
            {errors.name && <p className="text-sm text-destructive">{errors.name.message}</p>}
          </div>
          <div className="space-y-2">
            <Label htmlFor="email">{t.auth.register.email}</Label>
            <Input id="email" type="email" placeholder="email@example.com" {...register("email")} />
            {errors.email && <p className="text-sm text-destructive">{errors.email.message}</p>}
          </div>
          <div className="space-y-2">
            <Label htmlFor="password">{t.auth.register.password}</Label>
            <Input id="password" type="password" placeholder="••••••••" {...register("password")} />
            {errors.password && <p className="text-sm text-destructive">{errors.password.message}</p>}
          </div>
          <Button type="submit" className="w-full" disabled={loading}>
            {loading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                {t.auth.register.loading}
              </>
            ) : (
              t.auth.register.submit
            )}
          </Button>
        </form>
      </CardContent>
      <CardFooter className="justify-center">
        <p className="text-sm text-muted-foreground">
          {t.auth.register.hasAccount}{" "}
          <Link href="/login" className="text-blue-600 hover:underline font-medium">
            {t.auth.register.loginLink}
          </Link>
        </p>
      </CardFooter>
    </Card>
  );
}
