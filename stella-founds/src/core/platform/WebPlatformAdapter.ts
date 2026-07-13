import type { PlatformAdapter, PlatformKind } from './PlatformAdapter';

export class WebPlatformAdapter implements PlatformAdapter {
  getPlatform(): PlatformKind {
    if (typeof navigator === 'undefined') return 'web';
    const ua = navigator.userAgent;
    if (/android/i.test(ua)) return 'android';
    if (/iphone|ipad|ipod/i.test(ua)) return 'ios';
    return 'web';
  }

  isNative(): boolean {
    return false;
  }
}
