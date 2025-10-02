import type { Config } from "tailwindcss";

export default {
  darkMode: ["class"],
  content: ["./client/index.html", "./client/src/**/*.{js,jsx,ts,tsx}"],
  theme: {
    extend: {
      fontFamily: {
        sans: ["Inter", "var(--font-sans)", "system-ui", "sans-serif"],
        serif: ["var(--font-serif)", "Georgia", "serif"],
        mono: ["var(--font-mono)", "Menlo", "Monaco", "monospace"],
      },
      borderRadius: {
        lg: "var(--radius)",
        md: "calc(var(--radius) - 2px)",
        sm: "calc(var(--radius) - 4px)",
      },
      colors: {
        background: "hsl(var(--background))",
        foreground: "hsl(var(--foreground))",
        card: {
          DEFAULT: "hsl(var(--card))",
          foreground: "hsl(var(--card-foreground))",
        },
        popover: {
          DEFAULT: "hsl(var(--popover))",
          foreground: "hsl(var(--popover-foreground))",
        },
        primary: {
          DEFAULT: "hsl(var(--primary))",
          foreground: "hsl(var(--primary-foreground))",
        },
        secondary: {
          DEFAULT: "hsl(var(--secondary))",
          foreground: "hsl(var(--secondary-foreground))",
        },
        muted: {
          DEFAULT: "hsl(var(--muted))",
          foreground: "hsl(var(--muted-foreground))",
        },
        accent: {
          DEFAULT: "hsl(var(--accent))",
          foreground: "hsl(var(--accent-foreground))",
        },
        destructive: {
          DEFAULT: "hsl(var(--destructive))",
          foreground: "hsl(var(--destructive-foreground))",
        },
        border: "hsl(var(--border))",
        input: "hsl(var(--input))",
        ring: "hsl(var(--ring))",
        chart: {
          "1": "hsl(var(--chart-1))",
          "2": "hsl(var(--chart-2))",
          "3": "hsl(var(--chart-3))",
          "4": "hsl(var(--chart-4))",
          "5": "hsl(var(--chart-5))",
        },
        // Trading platform specific colors
        slate: {
          50: "hsl(210, 40%, 98%)",
          100: "hsl(210, 40%, 96%)",
          200: "hsl(214, 32%, 91%)",
          300: "hsl(213, 27%, 84%)",
          400: "hsl(215, 20%, 65%)",
          500: "hsl(215, 16%, 47%)",
          600: "hsl(215, 19%, 35%)",
          700: "hsl(215, 25%, 27%)",
          800: "hsl(217, 33%, 17%)",
          900: "hsl(222, 84%, 5%)",
        },
        blue: {
          400: "hsl(217, 91%, 60%)",
          500: "hsl(217, 91%, 60%)",
          600: "hsl(217, 91%, 50%)",
        },
        emerald: {
          400: "hsl(142, 69%, 58%)",
          500: "hsl(142, 69%, 58%)",
        },
        red: {
          400: "hsl(0, 84%, 60%)",
          500: "hsl(0, 84%, 60%)",
        },
        yellow: {
          400: "hsl(47, 96%, 89%)",
          500: "hsl(47, 96%, 89%)",
        },
        purple: {
          400: "hsl(340, 75%, 51%)",
          500: "hsl(340, 75%, 51%)",
        },
        // Glassmorphism colors
        glass: "rgba(255, 255, 255, 0.05)",
        "glass-border": "rgba(255, 255, 255, 0.1)",
      },
      keyframes: {
        "accordion-down": {
          from: {
            height: "0",
          },
          to: {
            height: "var(--radix-accordion-content-height)",
          },
        },
        "accordion-up": {
          from: {
            height: "var(--radix-accordion-content-height)",
          },
          to: {
            height: "0",
          },
        },
      },
      animation: {
        "accordion-down": "accordion-down 0.2s ease-out",
        "accordion-up": "accordion-up 0.2s ease-out",
      },
      backdropBlur: {
        glass: "16px",
      },
      backgroundImage: {
        "gradient-trading": "linear-gradient(135deg, hsl(217, 91%, 60%) 0%, hsl(142, 69%, 58%) 100%)",
        "gradient-blue-emerald": "linear-gradient(135deg, hsl(217, 91%, 60%) 0%, hsl(142, 69%, 58%) 50%, hsl(120, 93%, 79%) 100%)",
      },
      boxShadow: {
        glass: "0 4px 24px rgba(0, 0, 0, 0.1)",
        "glass-dark": "0 4px 24px rgba(0, 0, 0, 0.2)",
      },
      spacing: {
        18: "4.5rem",
        88: "22rem",
      },
    },
  },
  plugins: [
    require("tailwindcss-animate"), 
    require("@tailwindcss/typography"),
    // Custom plugin for glassmorphism utilities
    function({ addUtilities }: any) {
      const newUtilities = {
        ".glass": {
          background: "rgba(255, 255, 255, 0.05)",
          backdropFilter: "blur(16px)",
          border: "1px solid rgba(255, 255, 255, 0.1)",
          boxShadow: "0 4px 24px rgba(0, 0, 0, 0.1)",
        },
        ".glass-dark": {
          background: "rgba(15, 23, 42, 0.8)",
          backdropFilter: "blur(16px)",
          border: "1px solid rgba(255, 255, 255, 0.1)",
          boxShadow: "0 4px 24px rgba(0, 0, 0, 0.2)",
        },
        ".trading-gradient": {
          background: "linear-gradient(135deg, hsl(217, 91%, 60%) 0%, hsl(142, 69%, 58%) 100%)",
        },
      };
      addUtilities(newUtilities);
    },
  ],
} satisfies Config;
