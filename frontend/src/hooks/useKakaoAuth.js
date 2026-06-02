/**
 * 카카오 로그인 상태 관리 훅
 * - 마운트 시 /api/auth/kakao/me로 세션 확인
 * - 카카오 미설정(enabled=false)이면 전체 비활성
 */
import { useCallback, useEffect, useState } from "react";
import { api } from "../utils/api";

export default function useKakaoAuth() {
  const [user, setUser] = useState(null);
  const [enabled, setEnabled] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        // 카카오 설정 여부 확인
        const configRes = await api.get("/auth/kakao/config");
        if (cancelled) return;
        if (!configRes.data?.enabled) {
          setEnabled(false);
          setLoading(false);
          return;
        }
        setEnabled(true);
        // 기존 세션 확인
        const meRes = await api.get("/auth/kakao/me");
        if (!cancelled && meRes.data) setUser(meRes.data);
      } catch (_) { /* 무시 */ }
      if (!cancelled) setLoading(false);
    })();
    return () => { cancelled = true; };
  }, []);

  const login = useCallback(async () => {
    try {
      const res = await api.get("/auth/kakao/login-url");
      if (res.data?.url) {
        // 현재 페이지를 세션스토리지에 저장 (콜백 후 복귀용)
        sessionStorage.setItem("kakao_return_url", window.location.pathname);
        window.location.href = res.data.url;
      }
    } catch (e) {
      console.error("카카오 로그인 URL 가져오기 실패:", e.message);
    }
  }, []);

  const logout = useCallback(async () => {
    try {
      await api.post("/auth/kakao/logout", {});
    } catch (_) { /* 무시 */ }
    setUser(null);
  }, []);

  return { user, enabled, loading, login, logout };
}
