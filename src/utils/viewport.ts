import { DEXSTOORE_ARCHITECTURE } from '@/scenes/dexstoore-architecture-config';

/** Shared mobile breakpoint with Work architecture scenes. */
export const CONTACT_MOBILE_MEDIA = DEXSTOORE_ARCHITECTURE.mobileBreakpoint;

export function isContactMobileViewport(): boolean {
  return window.matchMedia(CONTACT_MOBILE_MEDIA).matches;
}
