/**
 * Client-only: "Don't show tutorial again" preference.
 * Stored in a cookie so returning players can skip the onboarding.
 */

export const TUTORIAL_SKIP_COOKIE_NAME = "sas_skip_tutorial";
const MAX_AGE_DAYS = 365;

export function getTutorialSkipCookie(): boolean {
  if (typeof document === "undefined") return false;
  const value = document.cookie
    .split("; ")
    .find((c) => c.startsWith(`${TUTORIAL_SKIP_COOKIE_NAME}=`))
    ?.split("=")[1];
  return value === "1";
}

export function setTutorialSkipCookie(skip: boolean): void {
  if (typeof document === "undefined") return;
  const maxAge = skip ? MAX_AGE_DAYS * 24 * 60 * 60 : 0;
  document.cookie = `${TUTORIAL_SKIP_COOKIE_NAME}=${skip ? "1" : ""}; path=/; max-age=${maxAge}; SameSite=Lax`;
}
