import type { MissionType } from "@/types";

export const TYPE_LABEL: Record<MissionType, string> = {
  user_qr: "유저 간 인증",
  upload: "업로드형",
  admin_qr: "관리자 인증",
  manual: "상시",
};

export const TYPE_DESC: Record<MissionType, string> = {
  user_qr: "상대방이 내 QR을 찍어줌",
  upload: "사진 업로드 후 관리자 QR",
  admin_qr: "관리자에게 직접 QR 인증",
  manual: "관리자가 수동 지급",
};
