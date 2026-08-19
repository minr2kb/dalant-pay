import { redirect } from "next/navigation";
import { CtaSection } from "@/components/landing/CtaSection";
import { DifferentiatorsSection } from "@/components/landing/DifferentiatorsSection";
import { FaqSection } from "@/components/landing/FaqSection";
import { FlowSection } from "@/components/landing/FlowSection";
import { GuideSection } from "@/components/landing/GuideSection";
import { HeroSection } from "@/components/landing/HeroSection";
import { HowItWorksSection } from "@/components/landing/HowItWorksSection";
import { PricingSection } from "@/components/landing/PricingSection";
import { SiteFooter } from "@/components/landing/SiteFooter";
import { SiteHeader } from "@/components/landing/SiteHeader";
import { TestimonialsSection } from "@/components/landing/TestimonialsSection";
import { getCurrentUserId } from "@/lib/auth/current-user";

export default async function LandingPage() {
  // PWA로 설치해 재방문하는 로그인 유저는 마케팅 랜딩 대신 바로 앱으로 들어가야 한다.
  const userId = await getCurrentUserId();
  if (userId) redirect("/markets");

  return (
    <div className="bg-white dark:bg-gray-950">
      <SiteHeader />
      <HeroSection />
      <FlowSection />
      <HowItWorksSection />
      <DifferentiatorsSection />
      <TestimonialsSection />
      <GuideSection />
      <PricingSection />
      <FaqSection />
      <CtaSection />
      <SiteFooter />
    </div>
  );
}
