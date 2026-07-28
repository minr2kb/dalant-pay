import type { MissionType } from "@/types";

export const MISSION_TYPES: MissionType[] = [
  "user_qr",
  "upload",
  "admin_qr",
  "manual",
];

export const TYPE_DESC: Record<MissionType, string> = {
  user_qr: "상대방이 내 QR을 찍어줌",
  upload: "사진 업로드 후 관리자 QR",
  admin_qr: "관리자에게 직접 QR 인증",
  manual: "관리자가 수동 지급",
};
