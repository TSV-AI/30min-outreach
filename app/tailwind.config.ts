import type { Config } from "tailwindcss";

const config: Config = {
  darkMode: ["class"],
  content: ["./src/**/*.{ts,tsx}"],
  theme: {
    container: {
      center: true,
      padding: "2rem",
      screens: {
        "2xl": "1400px",
      },
    },
    extend: {
      colors: {
        // Custom brand palette
        seasalt: {
          DEFAULT: '#fcfafa',
          100: '#3e2525',
          200: '#7d4b4b',
          300: '#b07c7c',
          400: '#d6baba',
          500: '#fcfafa',
          600: '#fcfafa',
          700: '#fdfbfb',
          800: '#fdfcfc',
          900: '#fefefe'
        },
        silver: {
          DEFAULT: '#c8d3d5',
          100: '#242d2f',
          200: '#485a5d',
          300: '#6c878c',
          400: '#9aadb1',
          500: '#c8d3d5',
          600: '#d3dcdd',
          700: '#dee5e6',
          800: '#e9edee',
          900: '#f4f6f7'
        },
        powder_blue: {
          DEFAULT: '#a4b8c4',
          100: '#1d262c',
          200: '#394c58',
          300: '#567283',
          400: '#7a96a8',
          500: '#a4b8c4',
          600: '#b7c7d0',
          700: '#c9d5dc',
          800: '#dbe3e8',
          900: '#edf1f3'
        },
        slate_gray: {
          DEFAULT: '#6e8387',
          100: '#161a1b',
          200: '#2c3436',
          300: '#424e51',
          400: '#58686c',
          500: '#6e8387',
          600: '#8a9ca0',
          700: '#a7b5b7',
          800: '#c5cdcf',
          900: '#e2e6e7'
        },
        // shadcn/ui semantic colors mapped to custom palette
        border: "hsl(var(--border))",
        input: "hsl(var(--input))",
        ring: "hsl(var(--ring))",
        background: "hsl(var(--background))",
        foreground: "hsl(var(--foreground))",
        primary: {
          DEFAULT: "hsl(var(--primary))",
          foreground: "hsl(var(--primary-foreground))",
        },
        secondary: {
          DEFAULT: "hsl(var(--secondary))",
          foreground: "hsl(var(--secondary-foreground))",
        },
        destructive: {
          DEFAULT: "hsl(var(--destructive))",
          foreground: "hsl(var(--destructive-foreground))",
        },
        muted: {
          DEFAULT: "hsl(var(--muted))",
          foreground: "hsl(var(--muted-foreground))",
        },
        accent: {
          DEFAULT: "hsl(var(--accent))",
          foreground: "hsl(var(--accent-foreground))",
        },
        popover: {
          DEFAULT: "hsl(var(--popover))",
          foreground: "hsl(var(--popover-foreground))",
        },
        card: {
          DEFAULT: "hsl(var(--card))",
          foreground: "hsl(var(--card-foreground))",
        },
      },
      borderRadius: {
        lg: "var(--radius)",
        md: "calc(var(--radius) - 2px)",
        sm: "calc(var(--radius) - 4px)",
      },
      keyframes: {
        "accordion-down": {
          from: { height: "0" },
          to: { height: "var(--radix-accordion-content-height)" },
        },
        "accordion-up": {
          from: { height: "var(--radix-accordion-content-height)" },
          to: { height: "0" },
        },
      },
      animation: {
        "accordion-down": "accordion-down 0.2s ease-out",
        "accordion-up": "accordion-up 0.2s ease-out",
      },
    },
  },
  plugins: [require("tailwindcss-animate")],
};

export default config;