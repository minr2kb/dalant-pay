// 결제 연동 전이라 신청 CTA는 구글폼으로 받고, 상담 후 수동으로 플랜을 승격한다.
export const BETA_APPLY_URL = "https://forms.gle/oDYzStrZYhG6jJ7U7";

export interface PricingPlan {
  id: "free" | "standard" | "pro";
  name: string;
  price: string;
  originalPrice: string | null;
  period: string;
  description: string;
  features: string[];
  cta: string;
  href: string;
  highlight: boolean;
}

export const PRICING_PLANS: PricingPlan[] = [
  {
    id: "free",
    name: "무료",
    price: "0원",
    originalPrice: null,
    period: "",
    description: "가볍게 한 번 열어볼 때",
    features: ["마켓 3개", "마켓당 참가자 10명"],
    cta: "무료로 시작하기",
    href: "/login",
    highlight: false,
  },
  {
    id: "standard",
    name: "스탠다드",
    price: "0원",
    originalPrice: "11,900원",
    period: "/월",
    description: "정기적으로 여러 행사를 운영할 때",
    features: [
      "마켓 10개",
      "마켓당 참가자 50명",
      "참여자 그룹 관리",
      "빠른 응답 지원",
    ],
    cta: "베타 신청하기",
    href: BETA_APPLY_URL,
    highlight: true,
  },
  {
    id: "pro",
    name: "프로",
    price: "0원",
    originalPrice: "39,900원",
    period: "/월",
    description: "규모 제한 없이 운영할 때",
    features: [
      "마켓 무제한",
      "참가자 무제한",
      "우선 응답 지원",
      "커스텀 브랜딩(로고·컬러)",
    ],
    cta: "베타 신청하기",
    href: BETA_APPLY_URL,
    highlight: false,
  },
];
