
import type { Config } from "tailwindcss";

export default {
  darkMode: ["class"],
  content: [
    "./pages/**/*.{ts,tsx}",
    "./components/**/*.{ts,tsx}",
    "./app/**/*.{ts,tsx}",
    "./src/**/*.{ts,tsx}",
  ],
  prefix: "",
  theme: {
    container: {
      center: true,
      padding: '1.5rem',
      screens: {
        'sm': '640px',
        'md': '768px',
        'lg': '1024px',
        'xl': '1280px',
        '2xl': '1536px'
      }
    },
    extend: {
      fontFamily: {
        sans: ['var(--theme-font-family, Inter)', '-apple-system', 'BlinkMacSystemFont', 'Segoe UI', 'sans-serif'],
        inter: ['Inter', '-apple-system', 'BlinkMacSystemFont', 'Segoe UI', 'sans-serif'],
        roboto: ['Roboto', '-apple-system', 'BlinkMacSystemFont', 'Segoe UI', 'sans-serif'],
        poppins: ['Poppins', '-apple-system', 'BlinkMacSystemFont', 'Segoe UI', 'sans-serif'],
        'open-sans': ['Open Sans', '-apple-system', 'BlinkMacSystemFont', 'Segoe UI', 'sans-serif'],
        montserrat: ['Montserrat', '-apple-system', 'BlinkMacSystemFont', 'Segoe UI', 'sans-serif'],
        'source-sans-pro': ['Source Sans Pro', '-apple-system', 'BlinkMacSystemFont', 'Segoe UI', 'sans-serif'],
      },
      fontSize: {
        'xs': ['12px', { lineHeight: 'var(--line-height-tight, 1.25)' }],
        'sm': ['14px', { lineHeight: 'var(--line-height-body, 1.5)' }],
        'base': ['var(--theme-font-size, 16px)', { lineHeight: 'var(--theme-line-height, 1.5)' }],
        'lg': ['18px', { lineHeight: 'var(--line-height-body, 1.5)' }],
        'xl': ['20px', { lineHeight: 'var(--line-height-body, 1.5)' }],
        '2xl': ['24px', { lineHeight: 'var(--line-height-heading, 1.2)' }],
        '3xl': ['30px', { lineHeight: 'var(--line-height-heading, 1.2)' }],
        '4xl': ['36px', { lineHeight: 'var(--line-height-heading, 1.2)' }],
      },
      fontWeight: {
        light: 'var(--font-weight-light, 300)',
        normal: 'var(--font-weight-normal, 400)',
        medium: 'var(--font-weight-medium, 500)',
        semibold: 'var(--font-weight-semibold, 600)',
        bold: 'var(--font-weight-bold, 700)',
        extrabold: 'var(--font-weight-extrabold, 800)',
      },
      lineHeight: {
        tight: 'var(--line-height-tight, 1.25)',
        body: 'var(--line-height-body, 1.5)',
        heading: 'var(--line-height-heading, 1.2)',
        relaxed: 'var(--line-height-relaxed, 1.75)',
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
        // Semantic spacing tokens
        'stack-xs': 'var(--spacing-stack-xs, 0.5rem)',
        'stack-sm': 'var(--spacing-stack-sm, 0.75rem)',
        'stack-md': 'var(--spacing-stack-md, 1rem)',
        'stack-lg': 'var(--spacing-stack-lg, 1.5rem)',
        'stack-xl': 'var(--spacing-stack-xl, 2rem)',
        'inline-xs': 'var(--spacing-inline-xs, 0.5rem)',
        'inline-sm': 'var(--spacing-inline-sm, 0.75rem)',
        'inline-md': 'var(--spacing-inline-md, 1rem)',
        'inline-lg': 'var(--spacing-inline-lg, 1.5rem)',
        'inline-xl': 'var(--spacing-inline-xl, 2rem)',
        'inset-xs': 'var(--spacing-inset-xs, 0.5rem)',
        'inset-sm': 'var(--spacing-inset-sm, 0.75rem)',
        'inset-md': 'var(--spacing-inset-md, 1rem)',
        'inset-lg': 'var(--spacing-inset-lg, 1.5rem)',
        'inset-xl': 'var(--spacing-inset-xl, 2rem)',
      },
      colors: {
        border: 'hsl(var(--border))',
        input: 'hsl(var(--input))',
        ring: 'hsl(var(--ring))',
        background: 'hsl(var(--background))',
        foreground: 'hsl(var(--foreground))',
        primary: {
          DEFAULT: 'hsl(var(--primary))',
          foreground: 'hsl(var(--primary-foreground))',
          hover: 'hsl(var(--primary-hover))',
          active: 'hsl(var(--primary-active))',
          focus: 'hsl(var(--primary-focus))',
          dark: '#0f172a',
        },
        secondary: {
          DEFAULT: 'hsl(var(--secondary))',
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
          DEFAULT: 'hsl(var(--success))',
          foreground: 'hsl(var(--success-foreground))',
          hover: 'hsl(var(--success-hover))',
          active: 'hsl(var(--success-active))',
          dark: '#16a34a',
          primary: '#22c55e',
          light: '#4ade80',
        },
        warning: {
          DEFAULT: 'hsl(var(--warning))',
          foreground: 'hsl(var(--warning-foreground))',
          hover: 'hsl(var(--warning-hover))',
          active: 'hsl(var(--warning-active))',
          dark: '#d97706',
          primary: '#f59e0b',
          light: '#fbbf24',
        },
        error: {
          dark: '#dc2626',
          primary: '#ef4444',
          light: '#f87171',
        },
        destructive: {
          DEFAULT: 'hsl(var(--destructive))',
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
        // Enhanced border colors
        'border-default': 'hsl(var(--border-default))',
        'border-strong': 'hsl(var(--border-strong))',
        'border-light': 'hsl(var(--border-light))',
        'border-focus': 'hsl(var(--border-focus))',
        'border-error': 'hsl(var(--border-error))',
        'border-success': 'hsl(var(--border-success))',
        'border-warning': 'hsl(var(--border-warning))',
        // Theme-aware colors
        'theme-primary': 'var(--theme-primary)',
        'theme-secondary': 'var(--theme-secondary)',
        'theme-background': 'var(--theme-background)',
        'theme-text': 'var(--theme-text)',
        'theme-border': 'var(--theme-border)',
        'theme-accent': 'var(--theme-accent)',
        'theme-muted': 'var(--theme-muted)',
        // Extended chart colors
        'chart-1': 'hsl(var(--chart-1))',
        'chart-2': 'hsl(var(--chart-2))',
        'chart-3': 'hsl(var(--chart-3))',
        'chart-4': 'hsl(var(--chart-4))',
        'chart-5': 'hsl(var(--chart-5))',
        'chart-6': 'hsl(var(--chart-6))',
        'chart-7': 'hsl(var(--chart-7))',
        'chart-8': 'hsl(var(--chart-8))',
        'chart-9': 'hsl(var(--chart-9))',
        'chart-10': 'hsl(var(--chart-10))',
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
        'button-spin': {
          to: { transform: 'rotate(360deg)' }
        }
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
        'button-spin': 'button-spin 1s linear infinite',
        'enter': 'fade-in 0.3s ease-out, scale-in 0.2s ease-out',
        'exit': 'fade-out 0.3s ease-out, scale-out 0.2s ease-out'
      },
      // Responsive grid utilities
      gridTemplateColumns: {
        'mobile-1': 'repeat(1, minmax(0, 1fr))',
        'mobile-2': 'repeat(2, minmax(0, 1fr))',
        'tablet-2': 'repeat(2, minmax(0, 1fr))',
        'tablet-3': 'repeat(3, minmax(0, 1fr))',
        'desktop-3': 'repeat(3, minmax(0, 1fr))',
        'desktop-4': 'repeat(4, minmax(0, 1fr))',
        'desktop-5': 'repeat(5, minmax(0, 1fr))',
      }
    }
  },
  plugins: [require("tailwindcss-animate")],
} satisfies Config;
