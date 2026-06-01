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
      iconBack: '#2dd4bf',
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
    iconBack: '#0d9488',
    iconMuted: '#64748b',
    iconMenu: '#0f766e',
    iconOnCard: '#334155',
    iconDestructive: '#b91c1c',
  };
}
