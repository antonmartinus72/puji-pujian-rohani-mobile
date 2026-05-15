export interface ThemeColors {
  background: string;
  card: string;
  border: string;
  iconBack: string;
  iconMuted: string;
  iconMenu: string;
  iconOnCard: string;
  iconDestructive: string;
}

export function getThemeColors(isDark: boolean): ThemeColors {
  if (isDark) {
    return {
      background: '#0f172a',
      card: '#1e293b',
      border: '#334155',
      iconBack: '#60a5fa',
      iconMuted: '#94a3b8',
      iconMenu: '#e2e8f0',
      iconOnCard: '#cbd5e1',
      iconDestructive: '#f87171',
    };
  }
  return {
    background: '#f8fafc',
    card: '#ffffff',
    border: '#e2e8f0',
    iconBack: '#2563eb',
    iconMuted: '#64748b',
    iconMenu: '#1e3a5f',
    iconOnCard: '#334155',
    iconDestructive: '#b91c1c',
  };
}
