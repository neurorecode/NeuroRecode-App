export const theme = {
  colors: {
    primary: '#0F766E',
    primaryDark: '#0B5A54',
    primarySoft: '#CCFBF1',
    success: '#16A34A',
    danger: '#DC2626',
    warning: '#F59E0B',
    muted: '#64748B',
    bg: '#F8FAFC',
    card: '#FFFFFF',
    text: '#0F172A',
    textSoft: '#475569',
    border: '#E2E8F0',
    grey: '#CBD5E1',
  },
  radius: { sm: 8, md: 12, lg: 20, pill: 999 },
  spacing: (n: number) => n * 4,
};

export type Theme = typeof theme;
