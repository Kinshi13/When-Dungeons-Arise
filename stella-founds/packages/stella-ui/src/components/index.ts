export * from './Modal';
export * from './StellaBottomSheet';
export * from './ScreenShell';
export * from './StellaBadge';
export * from './StellaButton';
export * from './StellaCalculator';
export * from './StellaCard';
export * from './StellaConfirmDialog';
export * from './StellaGlassCard';
export * from './StellaConstellationDivider';
export * from './StellaEmptyState';
export * from './StellaIconButton';
export * from './StellaInput';
export * from './StellaListItem';
export * from './StellaSectionHeader';
export * from './StellaSelect';
export * from './StellaStatusPill';
export * from './StellaToast';

// Aliases matching the Stella Design System naming (Web Fase 1.5): these are
// the same components as ScreenShell / StellaSectionHeader, kept as a single
// implementation rather than duplicating markup/CSS under a second name.
export { ScreenShell as StellaPageContainer } from './ScreenShell';
export { StellaSectionHeader as StellaPageHeader } from './StellaSectionHeader';
// Web Fase 3: spec asks for "StellaModal" — same Modal component, no duplicate CSS/markup.
export { Modal as StellaModal } from './Modal';
