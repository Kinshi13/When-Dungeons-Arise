export type PlatformKind = 'web' | 'android' | 'ios' | 'desktop';

export interface PlatformAdapter {
  getPlatform(): PlatformKind;
  isNative(): boolean;
}
