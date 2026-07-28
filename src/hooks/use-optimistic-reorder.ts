import type { DragEndEvent } from "@dnd-kit/core";
import { arrayMove } from "@dnd-kit/sortable";
import { useQueryClient } from "@tanstack/react-query";

// DnD 순서 변경의 공통 패턴 — 로컬 순서를 먼저 낙관적으로 반영한 뒤 전체 순서를
// 통째로 서버에 덮어쓴다(항목별 부분 업데이트가 겹치며 나는 오류를 없애기 위해).
// 실패하면 이전 캐시로 롤백한다.
export function useOptimisticReorder<
  T extends { id: string; sortOrder: number },
>(
  queryKey: readonly unknown[],
  items: T[],
  reorder: (ids: string[]) => Promise<unknown>,
) {
  const queryClient = useQueryClient();

  return async function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event;
    if (!over || active.id === over.id) return;
    const oldIndex = items.findIndex((i) => i.id === active.id);
    const newIndex = items.findIndex((i) => i.id === over.id);
    if (oldIndex === -1 || newIndex === -1) return;
    const next = arrayMove(items, oldIndex, newIndex);

    const previous = queryClient.getQueryData<T[]>(queryKey);
    queryClient.setQueryData<T[]>(
      queryKey,
      next.map((it, i) => ({ ...it, sortOrder: i })),
    );
    try {
      await reorder(next.map((it) => it.id));
    } catch (e) {
      queryClient.setQueryData(queryKey, previous);
      throw e;
    }
  };
}
