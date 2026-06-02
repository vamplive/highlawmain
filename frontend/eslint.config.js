import js from '@eslint/js'
import globals from 'globals'
import reactHooks from 'eslint-plugin-react-hooks'
import reactRefresh from 'eslint-plugin-react-refresh'
import { defineConfig, globalIgnores } from 'eslint/config'

export default defineConfig([
  globalIgnores([
    'dist/**',
    'node_modules/**',
    'coverage/**',
    '.vite/**',
  ]),
  {
    files: ['**/*.{js,jsx}'],
    extends: [
      js.configs.recommended,
      reactHooks.configs.flat.recommended,
      reactRefresh.configs.vite,
    ],
    languageOptions: {
      ecmaVersion: 2020,
      globals: globals.browser,
      parserOptions: {
        ecmaVersion: 'latest',
        ecmaFeatures: { jsx: true },
        sourceType: 'module',
      },
    },
    rules: {
      'no-unused-vars': ['error', {
        varsIgnorePattern: '^[A-Z_]',
        argsIgnorePattern: '^(_|[A-Z])',
        caughtErrorsIgnorePattern: '^_',
        destructuredArrayIgnorePattern: '^_',
      }],
      // 데이터 페칭 시 로딩 플래그·응답을 useEffect 안에서 setState하는 패턴은
      // 본 프로젝트 전반에 걸쳐 쓰이는 합법적 사용례다. React 19가 권장하는
      // use()/Suspense 전환은 대규모 아키텍처 작업이라 별도 스프린트로 미루고,
      // 해당 규칙은 경고로 낮춰 노이즈를 줄인다.
      'react-hooks/set-state-in-effect': 'warn',
      // 빈 try/catch 는 의도적인 best-effort 패턴(클립보드, localStorage 등)이므로 허용
      'no-empty': ['error', { allowEmptyCatch: true }],
      // 컴포넌트 모듈에 보조 함수/상수를 함께 export하는 패턴은 본 프로젝트에서
      // 의도적으로 사용한다(HMR 일부 비용 감수). 빌드/실행에는 영향 없으므로 경고로 낮춘다.
      'react-refresh/only-export-components': 'warn',
    },
  },
  // 테스트 파일 — vitest 전역 + Node `global` 식별자 허용
  {
    files: ['**/__tests__/**/*.{js,jsx}', '**/*.test.{js,jsx}', 'src/test-setup.js'],
    languageOptions: {
      globals: {
        ...globals.browser,
        ...globals.node,
        ...globals.vitest,
      },
    },
  },
])
