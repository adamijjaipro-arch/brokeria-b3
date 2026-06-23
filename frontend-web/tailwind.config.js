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
        // ── Legacy tokens (public pages) — updated to dark ──
        bg: {
          primary:   '#0A0A0A',
          secondary: '#111111',
          tertiary:  '#1A1A1A',
          card:      '#111111',
        },
        accent: {
          DEFAULT: '#3B82F6',
          light:   '#60A5FA',
          dark:    '#2563EB',
          muted:   'rgba(59,130,246,0.10)',
        },
        electric: {
          DEFAULT: '#00B8A9',
          light:   '#00D4C8',
          dark:    '#009E93',
          muted:   'rgba(0,184,169,0.08)',
        },
        gold: {
          DEFAULT: '#F59E0B',
          light:   '#FBBF24',
        },
        text: {
          primary:   '#FFFFFF',
          secondary: '#888888',
          muted:     '#666666',
        },
        border: {
          DEFAULT: '#1F1F1F',
          hover:   '#2A2A2A',
          accent:  'rgba(59,130,246,0.25)',
        },
        success: {
          DEFAULT: '#22C55E',
          light:   'rgba(34,197,94,0.12)',
          dark:    '#16a34a',
        },
        danger: {
          DEFAULT: '#EF4444',
          light:   'rgba(239,68,68,0.12)',
          dark:    '#dc2626',
        },
        warning: '#F59E0B',

        // ── New app design tokens — dark ──
        brand: {
          50:  'rgba(59,130,246,0.08)',
          100: 'rgba(59,130,246,0.14)',
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
          page:  '#0A0A0A',
          card:  '#111111',
          input: '#1A1A1A',
        },
        ink: {
          DEFAULT:   '#FFFFFF',
          secondary: '#888888',
          muted:     '#666666',
        },
      },
      boxShadow: {
        // Legacy
        'glow-sm':   '0 0 12px rgba(59,130,246,0.10)',
        'glow':      '0 0 24px rgba(59,130,246,0.12)',
        'glow-lg':   '0 0 48px rgba(59,130,246,0.15)',
        'glow-blue': '0 0 24px rgba(59,130,246,0.12)',
        'nav':       '0 1px 0 rgba(0,0,0,0.4)',
        'soft':      '0 2px 8px rgba(0,0,0,0.4)',
        // New
        'card':      '0 1px 3px 0 rgba(0,0,0,0.4), 0 1px 2px -1px rgba(0,0,0,0.3)',
        'card-hover':'0 4px 12px 0 rgba(0,0,0,0.5)',
        'sidebar':   '2px 0 8px 0 rgba(0,0,0,0.5)',
      },
      backgroundImage: {
        'gradient-radial': 'radial-gradient(var(--tw-gradient-stops))',
        'gradient-mesh':   'radial-gradient(at 40% 20%, rgba(59,130,246,0.06) 0px, transparent 50%), radial-gradient(at 80% 80%, rgba(0,184,169,0.04) 0px, transparent 50%)',
        'hero-glow':       'radial-gradient(ellipse 80% 50% at 50% -20%, rgba(59,130,246,0.10), transparent)',
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
