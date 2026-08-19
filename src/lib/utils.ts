import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

// 아바타 이니셜용 - 문자열 인덱싱/slice(0,1)은 UTF-16 코드 유닛 단위라 서로게이트
// 쌍(대부분의 이모지)을 반으로 잘라버린다. 눈에 보이는 글자(그래핌 클러스터)
// 단위로 잘라야 한다.
export function firstChar(str: string): string {
  const segmenter = new Intl.Segmenter(undefined, { granularity: "grapheme" });
  const first = segmenter.segment(str)[Symbol.iterator]().next().value;
  return first?.segment ?? "";
}
