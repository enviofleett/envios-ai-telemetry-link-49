
import type { Config } from "tailwindcss";

export default {
  darkMode: ["class"],
  content: [
    "./pages/**/*.{ts,tsx}",
    "./components/**/*.{ts,tsx}",
    "./app/**/*.{ts,tsx}",
    "./src/**/*.{ts,tsx}",
    "*.{js,ts,jsx,tsx,mdx}",
  ],
  prefix: "",
  theme: {
    container: {
      center: true,
      padding: '2rem',
      screens: {
        'sm': '640px',
        'md': '768px',
        'lg': '1024px',
        'xl': '1280px',
        '2xl': '1400px'
      }
    },
    extend: {
      fontFamily: {
        sans: ['var(--theme-font-family, Inter)', '-apple-system', 'BlinkMacSystemFont', 'Segoe UI', 'sans-serif'],
        inter: ['Inter', '-apple-system', 'BlinkMacSystemFont', 'Segoe UI', 'sans-serif'],
      },
      fontSize: {
        'base': ['var(--theme-font-size, 16px)', { lineHeight: 'var(--theme-line-height, 1.5)' }],
      },
      spacing: {
        '0': '0px',
        '1': 'calc(4px * var(--theme-spacing-scale, 1))',
        '2': 'calc(8px * var(--theme-spacing-scale, 1))',
        '3': 'calc(12px * var(--theme-spacing-scale, 1))',
        '4': 'calc(16px * var(--theme-spacing-scale, 1))',
        '5': 'calc(20px * var(--theme-spacing-scale, 1))',
        '6': 'calc(24px * var(--theme-spacing-scale, 1))',
        '8': 'calc(32px * var(--theme-spacing-scale, 1))',
        '10': 'calc(40px * var(--theme-spacing-scale, 1))',
        '12': 'calc(48px * var(--theme-spacing-scale, 1))',
        '16': 'calc(64px * var(--theme-spacing-scale, 1))',
        '20': 'calc(80px * var(--theme-spacing-scale, 1))',
        '24': 'calc(96px * var(--theme-spacing-scale, 1))',
      },
      colors: {
        border: 'hsl(var(--border))',
        input: 'hsl(var(--input))',
        ring: 'hsl(var(--ring))',
        background: 'hsl(var(--background))',
        foreground: 'hsl(var(--foreground))',
        primary: {
          DEFAULT: '#007BFF',
          foreground: 'hsl(var(--primary-foreground))',
          hover: 'hsl(var(--primary-hover))',
          active: 'hsl(var(--primary-active))',
          focus: 'hsl(var(--primary-focus))',
          dark: '#0f172a',
        },
        secondary: {
          DEFAULT: '#6C757D',
          foreground: 'hsl(var(--secondary-foreground))',
          hover: 'hsl(var(--secondary-hover))',
          active: 'hsl(var(--secondary-active))',
          dark: '#1e293b',
        },
        tertiary: {
          dark: '#334155',
        },
        quaternary: {
          dark: '#475569',
        },
        gray: {
          mid: '#64748b',
          light: '#94a3b8',
          lighter: '#cbd5e1',
          'very-light': '#e2e8f0',
          background: '#f1f5f9',
        },
        'off-white': '#f8fafc',
        teal: {
          primary: '#0d9488',
          secondary: '#14b8a6',
          light: '#2dd4bf',
        },
        success: {
          DEFAULT: '#28A745',
          foreground: 'hsl(var(--success-foreground))',
          hover: 'hsl(var(--success-hover))',
          active: 'hsl(var(--success-active))',
          dark: '#16a34a',
          primary: '#22c55e',
          light: '#4ade80',
        },
        warning: {
          DEFAULT: '#FFC107',
          foreground: 'hsl(var(--warning-foreground))',
          hover: 'hsl(var(--warning-hover))',
          active: 'hsl(var(--warning-active))',
          dark: '#d97706',
          primary: '#f59e0b',
          light: '#fbbf24',
        },
        info: {
          DEFAULT: '#17A2B8',
        },
        light: {
          DEFAULT: '#F8F9FA',
        },
        error: {
          dark: '#dc2626',
          primary: '#ef4444',
          light: '#f87171',
        },
        destructive: {
          DEFAULT: '#DC3545',
          foreground: 'hsl(var(--destructive-foreground))',
          hover: 'hsl(var(--destructive-hover))',
          active: 'hsl(var(--destructive-active))',
        },
        muted: {
          DEFAULT: 'hsl(var(--muted))',
          foreground: 'hsl(var(--muted-foreground))'
        },
        accent: {
          DEFAULT: 'hsl(var(--accent))',
          foreground: 'hsl(var(--accent-foreground))'
        },
        popover: {
          DEFAULT: 'hsl(var(--popover))',
          foreground: 'hsl(var(--popover-foreground))'
        },
        card: {
          DEFAULT: 'hsl(var(--card))',
          foreground: 'hsl(var(--card-foreground))'
        },
        sidebar: {
          DEFAULT: 'hsl(var(--sidebar-background))',
          foreground: 'hsl(var(--sidebar-foreground))',
          primary: 'hsl(var(--sidebar-primary))',
          'primary-foreground': 'hsl(var(--sidebar-primary-foreground))',
          accent: 'hsl(var(--sidebar-accent))',
          'accent-foreground': 'hsl(var(--sidebar-accent-foreground))',
          border: 'hsl(var(--sidebar-border))',
          ring: 'hsl(var(--sidebar-ring))'
        },
        // Theme-aware colors
        'theme-primary': 'var(--theme-primary)',
        'theme-secondary': 'var(--theme-secondary)',
        'theme-background': 'var(--theme-background)',
        'theme-text': 'var(--theme-text)',
        'theme-border': 'var(--theme-border)',
        'theme-accent': 'var(--theme-accent)',
        'theme-muted': 'var(--theme-muted)',
        // Chart colors
        'chart-1': 'hsl(var(--chart-1))',
        'chart-2': 'hsl(var(--chart-2))',
        'chart-3': 'hsl(var(--chart-3))',
        'chart-4': 'hsl(var(--chart-4))',
        'chart-5': 'hsl(var(--chart-5))',
      },
      borderRadius: {
        'none': '0px',
        'sm': '2px',
        'base': '4px',
        'md': '6px',
        'lg': 'var(--theme-card-radius, 8px)',
        'xl': '12px',
        '2xl': '16px',
        'full': '9999px',
        DEFAULT: 'var(--radius)',
      },
      boxShadow: {
        'xs': 'var(--shadow-xs)',
        'sm': 'var(--shadow-sm)',
        'base': 'var(--shadow-sm)',
        'md': 'var(--shadow-md)',
        'lg': 'var(--shadow-lg)',
        'xl': 'var(--shadow-xl)',
      },
      screens: {
        'mobile': { 'max': 'calc(var(--breakpoint-mobile) - 1px)' },
        'tablet': { 'min': 'var(--breakpoint-mobile)', 'max': 'calc(var(--breakpoint-tablet) - 1px)' },
        'desktop': { 'min': 'var(--breakpoint-tablet)' },
        'wide': { 'min': 'var(--breakpoint-wide)' },
      },
      keyframes: {
        'accordion-down': {
          from: {
            height: '0'
          },
          to: {
            height: 'var(--radix-accordion-content-height)'
          }
        },
        'accordion-up': {
          from: {
            height: 'var(--radix-accordion-content-height)'
          },
          to: {
            height: '0'
          }
        },
        'fade-in': {
          '0%': {
            opacity: '0',
            transform: 'translateY(10px)'
          },
          '100%': {
            opacity: '1',
            transform: 'translateY(0)'
          }
        },
        'fade-out': {
          '0%': {
            opacity: '1',
            transform: 'translateY(0)'
          },
          '100%': {
            opacity: '0',
            transform: 'translateY(10px)'
          }
        },
        'scale-in': {
          '0%': {
            transform: 'scale(0.95)',
            opacity: '0'
          },
          '100%': {
            transform: 'scale(1)',
            opacity: '1'
          }
        },
        'scale-out': {
          from: { transform: 'scale(1)', opacity: '1' },
          to: { transform: 'scale(0.95)', opacity: '0' }
        },
        'slide-in-right': {
          '0%': { transform: 'translateX(100%)' },
          '100%': { transform: 'translateX(0)' }
        },
        'slide-out-right': {
          '0%': { transform: 'translateX(0)' },
          '100%': { transform: 'translateX(100%)' }
        },
      },
      animation: {
        'accordion-down': 'accordion-down 0.2s ease-out',
        'accordion-up': 'accordion-up 0.2s ease-out',
        'fade-in': 'fade-in 0.3s ease-out',
        'fade-out': 'fade-out 0.3s ease-out',
        'scale-in': 'scale-in 0.2s ease-out',
        'scale-out': 'scale-out 0.2s ease-out',
        'slide-in-right': 'slide-in-right 0.3s ease-out',
        'slide-out-right': 'slide-out-right 0.3s ease-out',
        'enter': 'fade-in 0.3s ease-out, scale-in 0.2s ease-out',
        'exit': 'fade-out 0.3s ease-out, scale-out 0.2s ease-out'
      },
    }
  },
  plugins: [require("tailwindcss-animate")],
} satisfies Config;
