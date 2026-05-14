---
name: Jouda World
description: Digital companion for Celiac patients in Yemen — gluten-free food scanner, store, and recipe hub
colors:
  jouda-red: "#D32F2F"
  blush-tint: "#fef2f2"
  deep-redwood: "#7f1d1d"
  cool-stone: "#f8fafc"
  surface-white: "#ffffff"
  dark-slate: "#111827"
  dark-surface: "#1f2937"
  success-green: "#22c55e"
  warning-amber: "#f59e0b"
  danger-red: "#ef4444"
  info-blue: "#3b82f6"
typography:
  display:
    fontFamily: "Cairo, sans-serif"
    fontSize: "1.5rem"
    fontWeight: 900
    lineHeight: 1.2
    letterSpacing: "-0.025em"
  headline:
    fontFamily: "Cairo, sans-serif"
    fontSize: "1.25rem"
    fontWeight: 700
    lineHeight: 1.25
    letterSpacing: "-0.0125em"
  title:
    fontFamily: "Cairo, sans-serif"
    fontSize: "1.125rem"
    fontWeight: 700
    lineHeight: 1.3
    letterSpacing: "normal"
  body:
    fontFamily: "Cairo, sans-serif"
    fontSize: "0.875rem"
    fontWeight: 500
    lineHeight: 1.6
    letterSpacing: "normal"
  label:
    fontFamily: "Cairo, sans-serif"
    fontSize: "0.75rem"
    fontWeight: 700
    lineHeight: 1.4
    letterSpacing: "0.05em"
rounded:
  xs: "8px"
  sm: "12px"
  md: "16px"
  lg: "24px"
  xl: "32px"
  full: "9999px"
spacing:
  xs: "4px"
  sm: "8px"
  md: "12px"
  lg: "16px"
  xl: "24px"
  "2xl": "32px"
components:
  button-primary:
    backgroundColor: "{colors.dark-slate}"
    textColor: "{colors.surface-white}"
    rounded: "{rounded.sm}"
    padding: "14px 32px"
  button-primary-hover:
    backgroundColor: "#000000"
  button-ghost:
    backgroundColor: "{colors.blush-tint}"
    textColor: "{colors.jouda-red}"
    rounded: "{rounded.sm}"
    padding: "12px 16px"
  input-search:
    backgroundColor: "{colors.surface-white}"
    textColor: "{colors.dark-slate}"
    rounded: "{rounded.md}"
    padding: "14px 16px 14px 44px"
---

# Design System: Jouda World

## 1. Overview

**Creative North Star: "The Safe Haven"**

Jouda World is a calm refuge from the anxiety of food uncertainty. Every surface, every interaction, every piece of text should reassure the user that they are in a safe, caring place. The visual system borrows from the warmth of a Yemeni home — familiar materials, generous proportions, gentle transitions — not the cold sterility of a medical tool or the aggressive noise of budget e-commerce.

The system uses flat tonal layering instead of shadows for depth. Cards and surfaces shift in lightness to convey hierarchy: white cards float on a cool stone background in light mode; dark surface cards sit on a darker base in night mode. This keeps the interface calm, scannable, and performant.

**Key Characteristics:**
- Warm reds, generous whites, soft rounded corners
- Flat depth via colour shifts, no shadows in normal state
- Arabic-first RTL with Cairo font throughout
- Soft, friendly interactive elements with gentle scale transitions
- Explicit rejection of urgency tricks, clinical sterility, and generic SaaS patterns

## 2. Colors

The palette is warm and restrained: one committed red accent anchors the brand, supported by cool neutrals and a full set of semantic colours for health-critical verdicts (safe, risky, unsafe).

### Primary
- **Jouda Red** (#D32F2F / Tailwind brand-600): The signature brand colour. Used for primary actions, active navigation states, and key indicators. Carries the emotional weight of trust and warmth. Never used as decoration; always signals importance.
- **Blush Tint** (#fef2f2 / brand-50): Background for brand-accented areas — active nav items, scanner highlights, subtle brand callouts. A barely-there red that warms without distracting.

### Neutral
- **Cool Stone** (#f8fafc): Page background in light mode. Slightly cool to balance the warm brand accent, keeping the interface fresh.
- **Surface White** (#ffffff / white): Card surfaces, inputs, panels. Clean and generous. In a future polish pass, consider a very slight tint toward the brand hue (chroma 0.005–0.01).
- **Dark Slate** (#111827 / gray-900): Page background in dark mode. Also used for primary button fill in light mode (inverted from the red).
- **Dark Surface** (#1f2937 / gray-800): Card surfaces in dark mode. One step lighter than the page to create tonal separation.

### Semantic
- **Success Green** (#22c55e / green-500): Only for safe verdict results. Appears sparingly and means one thing: this food is safe.
- **Warning Amber** (#f59e0b / yellow-500): For risky/uncertain verdicts. Used with restraint.
- **Danger Red** (#ef4444 / red-500): For unsafe verdicts. Distinct from brand red so users never confuse the two.
- **Info Blue** (#3b82f6 / blue-500): For guidance, tips, and alternative suggestions. Calm, helpful, never urgent.

### Named Rules
**The One Red Rule.** Brand red (Jouda Red, #D32F2F) is never used for danger or error states. Danger is a separate red (#ef4444). Users must never associate the brand colour with negative outcomes.

**The No-Pure-White Rule (future).** Surface White is #ffffff today because Tailwind's default is unfiltered. Future iterations should tint it toward the warm brand hue at very low chroma (oklch(100% 0.003 25)) so it reads as "warm white" rather than sterile white.

## 3. Typography

**Font:** Cairo (with sans-serif fallback). Cairo is an Arabic-first font that renders beautifully at all weights, with excellent RTL support. Loaded from fonts.bunny.net with weights 300, 400, 600, and 700.

**Character:** Cairo is warm, open, and generous — a humanist sans with Arabic personality. Its letterforms have gentle curves and open counters that feel approachable without sacrificing readability on small screens.

### Hierarchy
- **Display** (900, 1.5rem / text-2xl, 1.2): For top-of-page titles, onboarding headlines, and hero moments. Used sparingly. Tight tracking for impact.
- **Headline** (700, 1.25rem / text-xl, 1.25): Section headers, result titles, modal headings.
- **Title** (700, 1.125rem / text-lg, 1.3): Card titles, subsection labels, drawer headers.
- **Body** (500, 0.875rem / text-sm, 1.6): Primary reading text. Capped at 65–75ch where prose appears. Arabic text runs denser than Latin; the higher line-height compensates.
- **Label** (700, 0.75rem / text-xs, 1.4, 0.05em letter-spacing): UI labels, category tags, filter titles. Uppercase tracking in its Latin fallback.
- **Micro** (700, 0.625rem / text-[10px], 1.3): Supporting metadata, timestamps, secondary badge text.

### Named Rules
**The One-Family Rule.** Cairo only. No display/body pairing. Consistent font across all surfaces reinforces the companion feel — one voice, one face.

## 4. Elevation

Jouda uses flat tonal layering as its primary depth strategy. Light mode: white cards (Surface White) float on a Cool Stone background (#f8fafc). Dark mode: gray-800 cards on a gray-900 page. The colour shift alone conveys hierarchy without any shadow.

Shadows appear in only two narrow cases:
- **Navigation separation**: The sticky header and bottom nav use a subtle ambient shadow (`0 4px 20px -4px rgba(0,0,0,0.05)`) to communicate their fixed position without feeling heavy.
- **Hover feedback**: Cards gain a gentle shadow on hover (`shadow-lg`) combined with a 4px upward lift, giving the interaction physical presence without permanent depth.

In dark mode, shadows are largely eliminated (`dark:shadow-none`) because tonal separation is sufficient.

### Named Rules
**The Flat-By-Default Rule.** Surfaces are flat at rest. Shadows appear only as a response to state (hover, elevation, sticky position). If a component needs permanent shadow, the tonal layering is insufficient and should be reconsidered.

## 5. Components

Every interactive component has default, hover, focus, active, and disabled states. The vocabulary is consistent: same button shape, same input treatment, same icon style (Lucide, 16–20px, 1.5px stroke weight).

### Buttons
- **Shape:** Rounded-xl (12px radius). Friendly, approachable corners — never sharp, never pill-shaped.
- **Primary:** Dark Slate fill (`bg-gray-900`), white text, 14px vertical padding. In dark mode, switches to Jouda Red fill. Hover darkens (`hover:bg-black` / `hover:bg-brand-700`). Active: slight scale down (`scale-95`). Disabled: 50% opacity.
- **Secondary / Ghost:** Blush Tint background in light mode, Dark Slate/800 background in dark. Text in Jouda Red or gray-500. Used for icon buttons, filter toggles, and auxiliary actions.
- **WhatsApp Green:** `bg-[#25D366]`, hover `bg-[#128C7E]`. The only non-system colour button. Reserved exclusively for the WhatsApp checkout action.

### Inputs
- **Style:** Surface White fill (light) / Dark Surface fill (dark), 1px gray-200 border, rounded-2xl (16px radius). Icons on the trailing side (RTL: right side) positioned with absolute positioning.
- **Focus:** A 2px brand-red ring (`focus:ring-2 focus:ring-brand-500`), with background shifting to pure white (light) or lighter gray (dark).
- **Placeholder:** gray-400, medium weight. Centred text in the scanner for a search-first feel.

### Cards (Product)
- **Shape:** Rounded-3xl (24px radius) in grid, rounded-2xl (16px) in list. Generous curves for a soft, friendly feel.
- **Background:** Surface White (light), Dark Surface (dark).
- **Border:** 1px gray-100 (light) / gray-700 (dark). Popular products get an amber-200 border to catch the eye without feeling urgent.
- **Spacing:** 12px internal padding (p-3). Compact but breathable.
- **State:** Hover adds shadow-lg plus 4px upward lift. Out-of-stock: 70% opacity + grayscale filter. The image area uses a fixed 4:3 aspect ratio.

### Chips and Filters
- **Category pills:** Rounded-full, 10px vertical padding, 20px horizontal. Active: Dark Slate fill with white text. Inactive: white fill with gray-200 border. Used for horizontal scroll categories.
- **Filter tags:** Rounded-lg (8px radius). Selected: Jouda Red fill with white text. Unselected: gray-50 fill with gray-600 text. These are the small, information-dense tags.

### Navigation
- **Bottom Nav (mobile):** Fixed to viewport bottom. White/Dark Slate background with a subtle top border. Active tab: Jouda Red text + Blush Tint background pill, with a 2px upward shift. Inactive: gray-400 text. Icons at 20px with Lucide.
- **Sidebar (desktop):** 288px wide, sticky. Left border (RTL) for separation. Active item: Blush Tint background, Jouda Red text, with a small pulsing red dot at the trailing edge. Inactive: gray-500.

### Verdict Card
The system's signature component. Three colour themes map to verdicts: green (safe), yellow (risky), red (unsafe). Each has a tinted header area with a white icon circle, bold Arabic title, and light caption. The content area sits on a white/Dark Surface background. A gradient banner appears for store product matches (green gradient) or alternatives (blue-to-indigo gradient).

### Onboarding Modal
Rounded-[2rem] (32px radius) container with a generous 32px padding. Centred icon in a Blush Tint circle ringed with a lighter tint halo. Step indicators use expanding dots (2px inactive, 32px active, Jouda Red fill). A single, large rounded-xl button advances the flow.

## 6. Do's and Don'ts

### Do:
- **Do** use Jouda Red (#D32F2F) for primary actions, active navigation, and brand accents only. Never for errors.
- **Do** keep the surface flat at rest. Use tonal colour shifts (white on stone, gray-800 on gray-900) for depth.
- **Do** use Cairo at 700 weight for UI labels and 500 for body text. One font, one voice.
- **Do** apply rounded-xl (12px) to buttons, rounded-2xl (16px) to inputs, rounded-3xl (24px) to cards. Keep the radius vocabulary consistent.
- **Do** use semantic colours only for their verdict meaning: green = safe, red = unsafe, yellow = uncertain. Never repurpose them.
- **Do** keep Arabic copy warm and personal. Every word should feel like a trusted friend speaking.

### Don't:
- **Don't** use border-left or border-right greater than 1px as a coloured accent stripe.
- **Don't** apply gradient text (`background-clip: text`). Emphasis comes from weight and size.
- **Don't** use glassmorphism or backdrop-blur as default decoration.
- **Don't** use the hero-metric template — big number, small label, gradient accent, supporting stats.
- **Don't** build identical card grids with icon + heading + text repeated endlessly. Vary card content and layout.
- **Don't** open a modal before exhausting inline alternatives. Drawers and progressive disclosure first.
- **Don't** look like budget e-commerce. No aggressive sales banners, countdown timers, discount-heavy UI, or manufactured urgency.
- **Don't** look clinically sterile. No hospital-grade whites, pharmaceutical iconography, or cold medical language.
- **Don't** use decorative motion that doesn't convey state. No orchestrated page-load sequences.
- **Don't** treat Jouda Red and Danger Red as interchangeable. They serve different purposes.
