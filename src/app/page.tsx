import Link from "next/link";
import { buttonVariants } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { MapPin, Camera, BarChart3, Zap, ShieldCheck, Users } from "lucide-react";
import { getLocale } from "@/lib/locale";
import { getTranslations } from "@/lib/i18n";
import { LanguageSwitcher } from "@/components/layout/LanguageSwitcher";

export default async function HomePage() {
  const locale = await getLocale();
  const t = getTranslations(locale);
  const f = t.landing.features;

  const features = [
    { icon: Camera, title: f.photo.title, desc: f.photo.desc },
    { icon: Zap, title: f.ai.title, desc: f.ai.desc },
    { icon: MapPin, title: f.gps.title, desc: f.gps.desc },
    { icon: BarChart3, title: f.dashboard.title, desc: f.dashboard.desc },
    { icon: ShieldCheck, title: f.safety.title, desc: f.safety.desc },
    { icon: Users, title: f.community.title, desc: f.community.desc },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 to-white">
      <header className="border-b border-border bg-white/80 backdrop-blur sticky top-0 z-10">
        <div className="max-w-6xl mx-auto px-4 h-14 flex items-center justify-between">
          <div className="flex items-center gap-2 font-semibold text-blue-700">
            <MapPin className="h-5 w-5" />
            {t.nav.appName}
          </div>
          <div className="flex items-center gap-2">
            <LanguageSwitcher />
            <Link href="/login" className={buttonVariants({ variant: "ghost", size: "sm" })}>
              {t.nav.login}
            </Link>
            <Link href="/register" className={buttonVariants({ size: "sm" })}>
              {t.nav.register}
            </Link>
          </div>
        </div>
      </header>

      <section className="max-w-6xl mx-auto px-4 py-20 text-center">
        <div className="inline-flex items-center gap-2 bg-blue-100 text-blue-700 px-4 py-1.5 rounded-full text-sm font-medium mb-6">
          <Zap className="h-3.5 w-3.5" />
          {t.landing.tagline}
        </div>
        <h1 className="text-4xl md:text-6xl font-bold text-slate-900 mb-6">
          {t.landing.heroTitle1}
          <br />
          <span className="text-blue-600">{t.landing.heroTitle2}</span>
        </h1>
        <p className="text-xl text-muted-foreground max-w-2xl mx-auto mb-8">
          {t.landing.heroSubtitle}
        </p>
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Link href="/register" className={buttonVariants({ size: "lg" })}>
            <Camera className="h-5 w-5 mr-2" />
            {t.landing.reportNow}
          </Link>
          <Link href="/map" className={buttonVariants({ size: "lg", variant: "outline" })}>
            <MapPin className="h-5 w-5 mr-2" />
            {t.landing.viewMap}
          </Link>
        </div>
      </section>

      <section className="max-w-6xl mx-auto px-4 py-16">
        <h2 className="text-3xl font-bold text-center mb-12">{t.landing.howItWorks}</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {features.map(({ icon: Icon, title, desc }) => (
            <Card key={title} className="hover:shadow-md transition-shadow">
              <CardContent className="p-6 space-y-3">
                <div className="bg-blue-100 w-10 h-10 rounded-lg flex items-center justify-center">
                  <Icon className="h-5 w-5 text-blue-600" />
                </div>
                <h3 className="font-semibold">{title}</h3>
                <p className="text-sm text-muted-foreground">{desc}</p>
              </CardContent>
            </Card>
          ))}
        </div>
      </section>

      <section className="bg-blue-600 py-16 text-center text-white">
        <h2 className="text-3xl font-bold mb-4">{t.landing.ctaTitle}</h2>
        <p className="text-blue-100 mb-8 max-w-xl mx-auto">{t.landing.ctaSubtitle}</p>
        <Link href="/register" className={buttonVariants({ size: "lg", variant: "secondary" })}>
          {t.landing.ctaButton}
        </Link>
      </section>

      <footer className="border-t border-border py-6 text-center text-sm text-muted-foreground">
        <p>{t.landing.footer}</p>
      </footer>
    </div>
  );
}
