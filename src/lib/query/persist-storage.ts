export type KVBackend = {
  get: (key: string) => Promise<string | undefined>;
  set: (key: string, value: string) => Promise<void>;
  del: (key: string) => Promise<void>;
};

export function createSafeStorage(backend: KVBackend) {
  return {
    getItem: async (key: string): Promise<string | null> => {
      try {
        return (await backend.get(key)) ?? null;
      } catch {
        return null;
      }
    },
    setItem: async (key: string, value: string): Promise<void> => {
      try {
        await backend.set(key, value);
      } catch {
        // ponytail: IndexedDB 차단 환경(사파리 프라이빗 모드 등) — 영속화 실패는
        // 무시하고 인메모리 QueryClient로만 계속 동작한다.
      }
    },
    removeItem: async (key: string): Promise<void> => {
      try {
        await backend.del(key);
      } catch {
        // 위와 동일한 이유로 무시.
      }
    },
  };
}
