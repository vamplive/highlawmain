/** React 앱 진입점 — DOM 렌더링 및 라우터 초기화 */
import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.jsx'

// 개발 환경에서만 axe-core 접근성 검사 활성화.
// dynamic import이므로 프로덕션 번들에는 포함되지 않는다.
if (import.meta.env.DEV) {
  import('./lib/a11yDevChecker.js').then((m) => m.start()).catch(() => {});
}

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
