import { routarQueryClient } from "@routar/react-query";
import { isServer } from "@tanstack/react-query";
import { cache } from "react";

export function makeQueryClient() {
  return routarQueryClient({
    defaultOptions: { queries: { staleTime: 60_000 } },
  });
}

let browserQC: ReturnType<typeof makeQueryClient> | undefined;

const getServerQueryClient = cache(makeQueryClient);

export function getQueryClient() {
  if (isServer) return getServerQueryClient();
  // biome-ignore lint/suspicious/noAssignInExpressions: idiomatic lazy-init memoized singleton — creates browserQC once per browser session and reuses it on subsequent calls
  return (browserQC ??= makeQueryClient());
}
