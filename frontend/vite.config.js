/* global process */
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// dev 서버 프록시 대상: VITE_API_TARGET 환경변수 또는 로컬 백엔드 기본값
const API_TARGET = process.env.VITE_API_TARGET || 'http://localhost:5001';

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  test: {
    globals: true,
    environment: "jsdom",
    setupFiles: ["./src/test-setup.js"],
  },
  server: {
    proxy: {
      '/api':       { target: API_TARGET, changeOrigin: true },
      '/r':         { target: API_TARGET, changeOrigin: true },
      '/uploads':   { target: API_TARGET, changeOrigin: true },
      '/data':      { target: API_TARGET, changeOrigin: true },
      '/sitemap.xml': { target: API_TARGET, changeOrigin: true },
      '/ws':        { target: API_TARGET.replace(/^http/, 'ws'), ws: true, changeOrigin: true },
    },
  },
  build: {
    rollupOptions: {
      output: {
        // 함수형 manualChunks — 객체 형태는 entry HTML의 modulepreload에 모든 청크가
        // 포함되어 lazy chunk가 사실상 prefetch되는 부작용이 있다.
        // 함수형은 dynamic import 체인의 deps를 메인 entry로 hoist하지 않으므로,
        // 첫 페이지 로드 시 vendor-tiptap(437KB) 같은 무거운 청크가 다운로드되지 않는다.
        manualChunks(id) {
          if (!id.includes("node_modules")) return undefined;
          if (id.includes("@tiptap")) return "vendor-tiptap";
          if (id.includes("react-router") || /node_modules\/(react|react-dom|scheduler)\//.test(id)) {
            return "vendor-react";
          }
          if (id.includes("lucide-react") || id.includes("marked") || id.includes("dompurify")) {
            return "vendor-utils";
          }
          return undefined;
        },
      },
    },
    chunkSizeWarningLimit: 600,
  },
})
