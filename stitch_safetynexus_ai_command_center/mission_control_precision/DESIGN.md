---
name: Mission Control Precision
colors:
  surface: '#10141a'
  surface-dim: '#10141a'
  surface-bright: '#353940'
  surface-container-lowest: '#0a0e14'
  surface-container-low: '#181c22'
  surface-container: '#1c2026'
  surface-container-high: '#262a31'
  surface-container-highest: '#31353c'
  on-surface: '#dfe2eb'
  on-surface-variant: '#bac9cc'
  inverse-surface: '#dfe2eb'
  inverse-on-surface: '#2d3137'
  outline: '#849396'
  outline-variant: '#3b494c'
  surface-tint: '#00daf3'
  primary: '#c3f5ff'
  on-primary: '#00363d'
  primary-container: '#00e5ff'
  on-primary-container: '#00626e'
  inverse-primary: '#006875'
  secondary: '#bdc2ff'
  on-secondary: '#1b247f'
  secondary-container: '#343d96'
  on-secondary-container: '#a8afff'
  tertiary: '#ffe7e2'
  on-tertiary: '#621100'
  tertiary-container: '#ffc2b3'
  on-tertiary-container: '#aa2600'
  error: '#ffb4ab'
  on-error: '#690005'
  error-container: '#93000a'
  on-error-container: '#ffdad6'
  primary-fixed: '#9cf0ff'
  primary-fixed-dim: '#00daf3'
  on-primary-fixed: '#001f24'
  on-primary-fixed-variant: '#004f58'
  secondary-fixed: '#e0e0ff'
  secondary-fixed-dim: '#bdc2ff'
  on-secondary-fixed: '#000767'
  on-secondary-fixed-variant: '#343d96'
  tertiary-fixed: '#ffdad2'
  tertiary-fixed-dim: '#ffb4a2'
  on-tertiary-fixed: '#3c0700'
  on-tertiary-fixed-variant: '#8a1d00'
  background: '#10141a'
  on-background: '#dfe2eb'
  surface-variant: '#31353c'
typography:
  headline-lg:
    fontFamily: Chakra Petch
    fontSize: 48px
    fontWeight: '700'
    lineHeight: '1.1'
    letterSpacing: -0.02em
  headline-md:
    fontFamily: Chakra Petch
    fontSize: 32px
    fontWeight: '600'
    lineHeight: '1.2'
    letterSpacing: 0.01em
  headline-sm:
    fontFamily: Chakra Petch
    fontSize: 20px
    fontWeight: '500'
    lineHeight: '1.2'
    letterSpacing: 0.05em
  body-lg:
    fontFamily: Inter
    fontSize: 16px
    fontWeight: '400'
    lineHeight: '1.6'
    letterSpacing: '0'
  body-md:
    fontFamily: Inter
    fontSize: 14px
    fontWeight: '400'
    lineHeight: '1.5'
    letterSpacing: '0'
  mono-data:
    fontFamily: JetBrains Mono
    fontSize: 14px
    fontWeight: '500'
    lineHeight: '1.4'
    letterSpacing: -0.01em
  mono-label:
    fontFamily: JetBrains Mono
    fontSize: 11px
    fontWeight: '700'
    lineHeight: '1'
    letterSpacing: 0.1em
  headline-lg-mobile:
    fontFamily: Chakra Petch
    fontSize: 32px
    fontWeight: '700'
    lineHeight: '1.2'
spacing:
  unit: 4px
  gutter: 16px
  margin-desktop: 32px
  margin-mobile: 16px
  container-max: 1440px
---

## Brand & Style
The design system embodies an **Industrial High-Precision** aesthetic, designed for high-stakes environments where clarity and accuracy are paramount. The personality is authoritative, technical, and hyper-focused, catering to engineers and safety directors who require immediate, unambiguous data interpretation.

The visual style is a fusion of **Corporate Modern** and **Tactile Industrial**. It utilizes a sophisticated dark-mode environment to reduce ocular fatigue, punctuated by high-contrast data visualizations. The interface should feel like a bespoke "Mission Control" console—dense with information but meticulously organized through a strict geometric grid and sharp, intentional accents.

## Colors
The palette is rooted in a deep, "Void" navy to provide maximum depth and focus. 

*   **Primary (Cyan #00E5FF):** Used for active states, data highlights, and successful system status. It provides a luminous, "lit" effect against the dark background.
*   **Secondary (Deep Navy #1A237E):** Used for structural elements, container backgrounds, and inactive navigational states.
*   **Tertiary (Alert Orange #FF3D00):** Reserved exclusively for warnings, critical telemetry spikes, and safety-critical overrides.
*   **Neutral (Void #0A0E14):** The foundational canvas color, ensuring high contrast for all technical data.

Surface levels are established by increasing the luminosity of the navy base slightly (1-2%) to create distinct functional zones without losing the "dark-room" mission control feel.

## Typography
Typography is the primary tool for differentiation in this design system. 

*   **Headlines:** Chakra Petch provides a futuristic, squared-off industrial look. Use it for page titles, section headers, and high-level status indicators.
*   **Technical Data & Telemetry:** All variables, sensor readings, logs, and code snippets must use JetBrains Mono. This ensures character alignment and an "engineered" feel.
*   **Body Content:** Inter is used for general descriptions and documentation to maintain high legibility during long-form reading.

All technical labels (JetBrains Mono) should be rendered in uppercase with slight tracking (10%) to mimic physical hardware marking.

## Layout & Spacing
The layout follows a strict **4px baseline grid** to ensure mathematical precision in element alignment. 

The structure is a **12-column fixed grid** on desktop, transitioning to a fluid single-column layout on mobile. Spacing between data modules should be kept tight (16px) to maximize information density while using borders rather than whitespace to define boundaries. 

Components should feel "slotted" into the grid, with telemetry readouts aligned to the right-hand side of containers to facilitate quick vertical scanning of numeric values.

## Elevation & Depth
This design system eschews soft shadows in favor of **Tonal Layers** and **Subtle Outlines**. 

Depth is communicated through:
1.  **Surface Tiering:** The background is the darkest level. Panels and cards are one shade lighter.
2.  **Inset Borders:** Elements like input fields and data wells use a 1px inner border (opacity 10% white) to appear recessed into the interface.
3.  **Active Glow:** Active or high-priority elements use a very tight, high-intensity outer glow (Primary Cyan) to simulate a lighted display.

Avoid large blurs. All transitions between depths should be sharp and defined by color value changes rather than gradients.

## Shapes
The shape language is **Sharp**. 

All corners are 0px radius to emphasize the industrial, high-precision nature of the system. This creates a "monolithic" feel where panels and buttons appear as machined components. 

Buttons may use a 45-degree chamfered corner (clipped corner) for primary actions to further the aerospace/military aesthetic, but standard containers remain strictly rectangular.

## Components
*   **Buttons:** Primary buttons are solid Primary Cyan with black JetBrains Mono text. Secondary buttons are outlined in 1px cyan with no fill.
*   **Telemetry Cards:** Modular containers with a 1px stroke (#1A237E). The top-left corner should feature a small JetBrains Mono label identifying the data source.
*   **Input Fields:** Strictly rectangular. Focus states utilize a 1px Primary Cyan border and a subtle background tint change.
*   **Status Chips:** Rectangular tags with high-contrast backgrounds (Tertiary for alerts, Primary for OK).
*   **Data Lists:** Zebra-striping is used for long telemetry logs, utilizing a subtle shift in navy tones. Headers are uppercase JetBrains Mono with 1px bottom borders.
*   **Gauges:** Circular or linear indicators must use thin 1px strokes and Primary Cyan for "filled" segments.