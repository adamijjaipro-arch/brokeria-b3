/** @type {import('tailwindcss').Config} */
module.exports = {
  darkMode: 'class',
  content: [
    './pages/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    fontFamily: {
      sans: ['Plus Jakarta Sans', 'Inter', 'SF Pro Display', '-apple-system', 'BlinkMacSystemFont', 'sans-serif'],
      mono: ['JetBrains Mono', 'SF Mono', 'Fira Code', 'monospace'],
      display: ['Plus Jakarta Sans', 'Inter', 'SF Pro Display', 'sans-serif'],
    },
    extend: {
      colors: {
        // ── Legacy tokens (public pages) ──
        bg: {
          primary: '#FAFBFD',
          secondary: '#F1F4F8',
          tertiary: '#E8ECF2',
          card: '#FFFFFF',
        },
        accent: {
          DEFAULT: '#0066FF',
          light: '#3388FF',
          dark: '#0052CC',
          muted: 'rgba(0,102,255,0.08)',
        },
        electric: {
          DEFAULT: '#00B8A9',
          light: '#00D4C8',
          dark: '#009E93',
          muted: 'rgba(0,184,169,0.08)',
        },
        gold: {
          DEFAULT: '#F59E0B',
          light: '#FBBF24',
        },
        text: {
          primary: '#0F1729',
          secondary: '#5B6B82',
          muted: '#94A3B8',
        },
        border: {
          DEFAULT: '#E2E8F0',
          hover: '#CBD5E1',
          accent: 'rgba(0,102,255,0.2)',
        },
        success: {
          DEFAULT: '#10B981',
          light: '#d1fae5',
          dark: '#065f46',
        },
        danger: {
          DEFAULT: '#EF4444',
          light: '#fee2e2',
          dark: '#991b1b',
        },
        warning: '#F59E0B',

        // ── New app design tokens ──
        brand: {
          50:  '#eff6ff',
          100: '#dbeafe',
          500: '#3b82f6',
          600: '#2563eb',
          700: '#1d4ed8',
        },
        sidebar: {
          bg:     '#0d1117',
          hover:  '#161b22',
          active: '#2563eb',
          text:   '#e5e7eb',
          muted:  '#6b7280',
        },
        surface: {
          page:  '#f0f2f5',
          card:  '#ffffff',
          input: '#f9fafb',
        },
        ink: {
          DEFAULT: '#111827',
          secondary: '#6b7280',
          muted:     '#9ca3af',
        },
      },
      boxShadow: {
        // Legacy
        'glow-sm':   '0 0 12px rgba(0,102,255,0.08)',
        'glow':      '0 0 24px rgba(0,102,255,0.1)',
        'glow-lg':   '0 0 48px rgba(0,102,255,0.12)',
        'glow-blue': '0 0 24px rgba(0,102,255,0.1)',
        'nav':       '0 1px 0 rgba(0,0,0,0.04)',
        'soft':      '0 2px 8px rgba(0,0,0,0.04)',
        // New
        'card':      '0 1px 3px 0 rgba(0,0,0,0.07), 0 1px 2px -1px rgba(0,0,0,0.05)',
        'card-hover':'0 4px 12px 0 rgba(0,0,0,0.10)',
        'sidebar':   '2px 0 8px 0 rgba(0,0,0,0.3)',
      },
      backgroundImage: {
        'gradient-radial': 'radial-gradient(var(--tw-gradient-stops))',
        'gradient-mesh':   'radial-gradient(at 40% 20%, rgba(0,102,255,0.04) 0px, transparent 50%), radial-gradient(at 80% 80%, rgba(0,184,169,0.03) 0px, transparent 50%)',
        'hero-glow':       'radial-gradient(ellipse 80% 50% at 50% -20%, rgba(0,102,255,0.08), transparent)',
      },
      borderRadius: {
        '2xl': '1rem',
        '3xl': '1.5rem',
      },
      animation: {
        // Legacy
        'float':      'float 6s ease-in-out infinite',
        'glow-pulse': 'glow-pulse 3s ease-in-out infinite',
        'slide-down': 'slide-down 0.3s ease-out',
        'ticker':     'ticker 30s linear infinite',
        'gradient':   'gradient-shift 8s ease infinite',
        // New
        'fade-in':    'fadeIn 0.3s ease-out',
        'slide-up':   'slideUp 0.4s ease-out',
        'pulse-dot':  'pulseDot 2s ease-in-out infinite',
      },
      keyframes: {
        // Legacy
        'float': {
          '0%, 100%': { transform: 'translateY(0px)' },
          '50%':      { transform: 'translateY(-10px)' },
        },
        'glow-pulse': {
          '0%, 100%': { opacity: '0.6' },
          '50%':      { opacity: '1' },
        },
        'slide-down': {
          from: { opacity: '0', transform: 'translateY(-8px)' },
          to:   { opacity: '1', transform: 'translateY(0)' },
        },
        'ticker': {
          from: { transform: 'translateX(0)' },
          to:   { transform: 'translateX(-50%)' },
        },
        'gradient-shift': {
          '0%':   { backgroundPosition: '0% 50%' },
          '50%':  { backgroundPosition: '100% 50%' },
          '100%': { backgroundPosition: '0% 50%' },
        },
        // New
        fadeIn:   { from: { opacity: '0' },                                    to: { opacity: '1' } },
        slideUp:  { from: { opacity: '0', transform: 'translateY(8px)' },      to: { opacity: '1', transform: 'translateY(0)' } },
        pulseDot: { '0%, 100%': { opacity: '1' },                              '50%': { opacity: '0.4' } },
      },
    },
  },
  plugins: [],
}
