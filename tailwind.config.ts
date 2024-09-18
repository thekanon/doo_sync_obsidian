import type { Config } from "tailwindcss";
import { ThemeConfig } from "tailwindcss/types/config";

const config: Config = {
  content: [
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        background: "var(--background)",
        foreground: "var(--foreground)",
      },
      typography: (theme: (path: string) => any) => ({
        DEFAULT: {
          css: {
            color: theme("colors.gray.800"),
            maxWidth: "65ch",
            lineHeight: "1.75",
            a: {
              color: theme("colors.blue.600"),
              textDecoration: "underline",
              fontWeight: "500",
              "&:hover": {
                color: theme("colors.blue.800"),
              },
            },
            h1: {
              color: theme("colors.gray.900"),
              fontWeight: "800",
              fontSize: theme("fontSize.3xl"),
              marginTop: theme("spacing.12"),
              marginBottom: theme("spacing.6"),
            },
            h2: {
              color: theme("colors.gray.800"),
              fontWeight: "700",
              fontSize: theme("fontSize.2xl"),
              marginTop: theme("spacing.10"),
              marginBottom: theme("spacing.4"),
            },
            h3: {
              color: theme("colors.gray.800"),
              fontWeight: "600",
              fontSize: theme("fontSize.xl"),
              marginTop: theme("spacing.8"),
              marginBottom: theme("spacing.3"),
            },
            p: {
              marginTop: theme("spacing.5"),
              marginBottom: theme("spacing.5"),
            },
            blockquote: {
              fontStyle: "italic",
              color: theme("colors.gray.700"),
              borderLeftColor: theme("colors.blue.500"),
              borderLeftWidth: "4px",
              paddingLeft: theme("spacing.4"),
              marginLeft: 0,
              marginRight: 0,
            },
            "ul > li::before": {
              backgroundColor: theme("colors.blue.500"),
            },
            "ol > li::marker": {
              color: theme("colors.blue.600"),
            },
            code: {
              color: theme("colors.pink.600"),
              backgroundColor: theme("colors.gray.100"),
              padding: theme("spacing.1"),
              borderRadius: theme("borderRadius.md"),
              fontSize: "0.875em",
            },
            pre: {
              backgroundColor: theme("colors.gray.100"),
              color: theme("colors.gray.800"),
              fontSize: "0.875em",
              lineHeight: "1.7142857",
              marginTop: theme("spacing.5"),
              marginBottom: theme("spacing.5"),
              borderRadius: theme("borderRadius.lg"),
              paddingTop: theme("spacing.3"),
              paddingRight: theme("spacing.4"),
              paddingBottom: theme("spacing.3"),
              paddingLeft: theme("spacing.4"),
            },
            "pre code": {
              backgroundColor: "transparent",
              borderWidth: "0",
              borderRadius: "0",
              padding: "0",
              fontWeight: "400",
              color: "inherit",
              fontSize: "inherit",
              fontFamily: "inherit",
              lineHeight: "inherit",
            },
            strong: {
              color: theme("colors.gray.900"),
              fontWeight: "600",
            },
            hr: {
              borderColor: theme("colors.gray.300"),
              marginTop: theme("spacing.8"),
              marginBottom: theme("spacing.8"),
            },
          },
        },
        lg: {
          css: {
            fontSize: theme("fontSize.lg"),
            h1: {
              fontSize: theme("fontSize.4xl"),
            },
            h2: {
              fontSize: theme("fontSize.3xl"),
            },
            h3: {
              fontSize: theme("fontSize.2xl"),
            },
          },
        },
      }),
    },
  },
  plugins: [require("@tailwindcss/typography")],
};

export default config;
