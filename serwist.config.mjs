import { serwist } from "@serwist/next/config";

// Next.js 16은 next build/dev 모두 기본으로 Turbopack을 쓰는데, @serwist/next의
// withSerwistInit(webpack 전용 훅)은 Turbopack 빌드와 충돌한다 - 그래서 이 프로젝트는
// "configurator mode"를 쓴다: next.config.ts는 건드리지 않고, next build 이후
// 별도 단계(`serwist build`)로 서비스워커를 esbuild 번들링한다. 번들러 종류를 안 타서
// Turbopack에서도 그대로 동작한다.
export default await serwist({
  swSrc: "src/sw.ts",
  swDest: "public/sw.js",
});
