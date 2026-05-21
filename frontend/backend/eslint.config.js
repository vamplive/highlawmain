// 백엔드 ESLint 설정 — Node.js(CommonJS) 환경 대상
// 프론트엔드 eslint.config.js와 ESLint v9(flat config) 버전을 맞추되,
// React 관련 플러그인을 제거하고 Node 친화적인 룰만 남긴다.
const js = require('@eslint/js');
const globals = require('globals');

module.exports = [
  // 빌드 산출물 및 데이터/커버리지 폴더는 검사 대상에서 제외
  {
    ignores: ['node_modules/**', 'data/**', 'coverage/**'],
  },

  // 공통 베이스 — eslint:recommended
  js.configs.recommended,

  // 프로젝트 전체 (CommonJS 소스)
  {
    files: ['**/*.js'],
    languageOptions: {
      ecmaVersion: 'latest',
      sourceType: 'commonjs',
      globals: {
        ...globals.node,
      },
    },
    rules: {
      // 사용하지 않는 변수는 경고로만 처리하되, `_`로 시작하면 무시한다.
      'no-unused-vars': ['warn', {
        varsIgnorePattern: '^_',
        argsIgnorePattern: '^_',
        caughtErrorsIgnorePattern: '^_',
        destructuredArrayIgnorePattern: '^_',
      }],
      // 정의되지 않은 식별자는 경고 (오타 방지용, 빌드를 막지는 않음)
      'no-undef': 'warn',
      // 빈 try/catch 는 의도적인 idempotency 패턴(ALTER TABLE 중복 무시 등)이므로 허용
      'no-empty': ['error', { allowEmptyCatch: true }],
    },
  },

  // 테스트 및 vitest 설정 — ESM(import/export) 사용, vitest 전역 허용
  {
    files: ['tests/**/*.js', 'vitest.config.js'],
    languageOptions: {
      ecmaVersion: 'latest',
      sourceType: 'module',
      globals: {
        ...globals.node,
        ...globals.vitest,
      },
    },
  },
];
