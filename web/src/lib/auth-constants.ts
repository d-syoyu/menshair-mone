export const AUTH_SESSION_MAX_AGE = 90 * 24 * 60 * 60;

// セッションCookieの名前と secure 属性。
// Auth.js 本体・proxy・管理者ログインAPIで同じ規則を使う。
// Auth.js は既定では URL のプロトコル（https か）で決めるため、
// http の本番ビルド（CI の E2E）では他とずれて、ログインが通らなくなっていた。
export const SESSION_COOKIE_SECURE = process.env.NODE_ENV === "production";
export const SESSION_COOKIE_NAME = SESSION_COOKIE_SECURE
  ? "__Secure-authjs.session-token"
  : "authjs.session-token";
