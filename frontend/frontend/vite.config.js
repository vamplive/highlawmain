import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

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
      '/api': 'http://localhost:5001',
      '/r': 'http://localhost:5001',
      '/uploads': 'http://localhost:5001',
      '/data': 'http://localhost:5001',
      '/sitemap.xml': 'http://localhost:5001',
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
