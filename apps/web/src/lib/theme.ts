/**
 * Reference catalog for this project's design tokens.
 *
 * Per shadcn/ui's theming docs (https://ui.shadcn.com/docs/theming), the CSS
 * custom properties in `src/app/globals.css` (`:root` / `.dark`, consumed via
 * Tailwind v4's `@theme inline`) are the single source of truth for the theme.
 * This file does NOT duplicate their values — it's a typed catalog of the
 * token *names* plus a small helper to read a token's live computed value,
 * for the rare case something outside Tailwind's `bg-*`/`text-*`/etc. utility
 * classes needs a color (canvas/chart libraries, `<meta name="theme-color">`,
 * inline SVG fills, ...). If you need a value in a Client Component, prefer
 * this over copy-pasting an oklch()/hex string, since it always reflects
 * whatever globals.css currently defines for the active (light/dark) theme.
 *
 * If `globals.css`'s token *names* change, update the catalogs below to match.
 */

/** Chosen at `shadcn init` time (see components.json). */
export const themePreset = {
  style: "base-nova",
  baseColor: "neutral",
  iconLibrary: "lucide",
} as const;

export const colorTokens = {
  background: { cssVar: "--background", description: "Default app surface" },
  foreground: { cssVar: "--foreground", description: "Default text color" },
  card: { cssVar: "--card", description: "Elevated surface (cards, panels)" },
  cardForeground: {
    cssVar: "--card-foreground",
    description: "Text on card surfaces",
  },
  popover: {
    cssVar: "--popover",
    description: "Floating overlay surface (menus, dropdowns)",
  },
  popoverForeground: {
    cssVar: "--popover-foreground",
    description: "Text on popover surfaces",
  },
  primary: {
    cssVar: "--primary",
    description: "High-emphasis actions and branding",
  },
  primaryForeground: {
    cssVar: "--primary-foreground",
    description: "Text/icons on primary surfaces",
  },
  secondary: {
    cssVar: "--secondary",
    description: "Lower-emphasis filled actions",
  },
  secondaryForeground: {
    cssVar: "--secondary-foreground",
    description: "Text on secondary surfaces",
  },
  muted: {
    cssVar: "--muted",
    description: "Subtle surfaces, helper text backgrounds",
  },
  mutedForeground: {
    cssVar: "--muted-foreground",
    description: "Helper/placeholder text",
  },
  accent: {
    cssVar: "--accent",
    description: "Interactive hover/focus state surface",
  },
  accentForeground: {
    cssVar: "--accent-foreground",
    description: "Text on accent surfaces",
  },
  destructive: {
    cssVar: "--destructive",
    description: "Error and destructive actions",
  },
  border: { cssVar: "--border", description: "Default dividers and separators" },
  input: { cssVar: "--input", description: "Form control borders" },
  ring: { cssVar: "--ring", description: "Focus ring color" },
  chart1: { cssVar: "--chart-1", description: "Data viz series 1" },
  chart2: { cssVar: "--chart-2", description: "Data viz series 2" },
  chart3: { cssVar: "--chart-3", description: "Data viz series 3" },
  chart4: { cssVar: "--chart-4", description: "Data viz series 4" },
  chart5: { cssVar: "--chart-5", description: "Data viz series 5" },
  sidebar: { cssVar: "--sidebar", description: "Sidebar surface" },
  sidebarForeground: {
    cssVar: "--sidebar-foreground",
    description: "Sidebar text",
  },
  sidebarPrimary: {
    cssVar: "--sidebar-primary",
    description: "Sidebar primary action",
  },
  sidebarPrimaryForeground: {
    cssVar: "--sidebar-primary-foreground",
    description: "Text on sidebar primary",
  },
  sidebarAccent: {
    cssVar: "--sidebar-accent",
    description: "Sidebar hover/focus surface",
  },
  sidebarAccentForeground: {
    cssVar: "--sidebar-accent-foreground",
    description: "Text on sidebar accent",
  },
  sidebarBorder: {
    cssVar: "--sidebar-border",
    description: "Sidebar dividers",
  },
  sidebarRing: {
    cssVar: "--sidebar-ring",
    description: "Sidebar focus ring",
  },
} as const;

export type ColorToken = keyof typeof colorTokens;

/** `--radius` is the base; the rest are `calc()` steps off of it (see globals.css). */
export const radiusTokens = {
  sm: "--radius-sm",
  md: "--radius-md",
  lg: "--radius-lg",
  xl: "--radius-xl",
  "2xl": "--radius-2xl",
  "3xl": "--radius-3xl",
  "4xl": "--radius-4xl",
} as const;

export type RadiusToken = keyof typeof radiusTokens;

export const fontTokens = {
  sans: "--font-sans",
  mono: "--font-mono",
  heading: "--font-heading",
} as const;

export type FontToken = keyof typeof fontTokens;

/**
 * Reads a CSS custom property's live computed value off the document root.
 * Client-only: custom properties aren't resolved during server rendering.
 */
export function getCssVar(cssVar: string): string {
  if (typeof window === "undefined") {
    throw new Error("getCssVar can only be called in the browser");
  }
  return getComputedStyle(document.documentElement)
    .getPropertyValue(cssVar)
    .trim();
}

export function getThemeColor(token: ColorToken): string {
  return getCssVar(colorTokens[token].cssVar);
}

export function getThemeRadius(token: RadiusToken): string {
  return getCssVar(radiusTokens[token]);
}

export function getThemeFont(token: FontToken): string {
  return getCssVar(fontTokens[token]);
}
