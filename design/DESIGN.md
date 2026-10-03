---
name: Warm Feline Routine
colors:
  surface: '#fff8f3'
  surface-dim: '#e2d8cf'
  surface-bright: '#fff8f3'
  surface-container-lowest: '#ffffff'
  surface-container-low: '#fcf2e8'
  surface-container: '#f6ece3'
  surface-container-high: '#f0e7dd'
  surface-container-highest: '#ebe1d7'
  on-surface: '#1f1b15'
  on-surface-variant: '#56423c'
  inverse-surface: '#353029'
  inverse-on-surface: '#f9efe5'
  outline: '#8a726a'
  outline-variant: '#ddc0b7'
  surface-tint: '#a0401c'
  primary: '#9d3e1a'
  on-primary: '#ffffff'
  primary-container: '#bd5630'
  on-primary-container: '#fffbff'
  inverse-primary: '#ffb59c'
  secondary: '#00696c'
  on-secondary: '#ffffff'
  secondary-container: '#97eef1'
  on-secondary-container: '#006e71'
  tertiary: '#845000'
  on-tertiary: '#ffffff'
  tertiary-container: '#a46710'
  on-tertiary-container: '#fffbff'
  error: '#ba1a1a'
  on-error: '#ffffff'
  error-container: '#ffdad6'
  on-error-container: '#93000a'
  primary-fixed: '#ffdbcf'
  primary-fixed-dim: '#ffb59c'
  on-primary-fixed: '#390c00'
  on-primary-fixed-variant: '#802a05'
  secondary-fixed: '#9af1f4'
  secondary-fixed-dim: '#7dd5d7'
  on-secondary-fixed: '#002021'
  on-secondary-fixed-variant: '#004f51'
  tertiary-fixed: '#ffddbb'
  tertiary-fixed-dim: '#ffb867'
  on-tertiary-fixed: '#2b1700'
  on-tertiary-fixed-variant: '#673d00'
  background: '#fff8f3'
  on-background: '#1f1b15'
  surface-variant: '#ebe1d7'
typography:
  display:
    fontFamily: Plus Jakarta Sans
    fontSize: 36px
    fontWeight: '800'
    lineHeight: 44px
    letterSpacing: -0.03em
  display-mobile:
    fontFamily: Plus Jakarta Sans
    fontSize: 28px
    fontWeight: '800'
    lineHeight: 36px
    letterSpacing: -0.02em
  headline-lg:
    fontFamily: Plus Jakarta Sans
    fontSize: 28px
    fontWeight: '700'
    lineHeight: 36px
    letterSpacing: -0.02em
  headline-lg-mobile:
    fontFamily: Plus Jakarta Sans
    fontSize: 24px
    fontWeight: '700'
    lineHeight: 32px
    letterSpacing: -0.02em
  headline-md:
    fontFamily: Plus Jakarta Sans
    fontSize: 20px
    fontWeight: '700'
    lineHeight: 28px
    letterSpacing: -0.01em
  headline-sm:
    fontFamily: Plus Jakarta Sans
    fontSize: 17px
    fontWeight: '600'
    lineHeight: 24px
  body-lg:
    fontFamily: Plus Jakarta Sans
    fontSize: 16px
    fontWeight: '400'
    lineHeight: 24px
  body-md:
    fontFamily: Plus Jakarta Sans
    fontSize: 15px
    fontWeight: '400'
    lineHeight: 22px
  body-sm:
    fontFamily: Plus Jakarta Sans
    fontSize: 13px
    fontWeight: '400'
    lineHeight: 18px
  label-lg:
    fontFamily: Plus Jakarta Sans
    fontSize: 14px
    fontWeight: '600'
    lineHeight: 20px
    letterSpacing: 0.01em
  label-md:
    fontFamily: Plus Jakarta Sans
    fontSize: 12px
    fontWeight: '600'
    lineHeight: 16px
    letterSpacing: 0.02em
  label-sm:
    fontFamily: Plus Jakarta Sans
    fontSize: 11px
    fontWeight: '700'
    lineHeight: 14px
    letterSpacing: 0.04em
  time-stamp:
    fontFamily: Plus Jakarta Sans
    fontSize: 13px
    fontWeight: '700'
    lineHeight: 18px
    letterSpacing: 0.01em
rounded:
  sm: 0.25rem
  DEFAULT: 0.5rem
  md: 0.75rem
  lg: 1rem
  xl: 1.5rem
  full: 9999px
spacing:
  gutter: 1rem
  gutter-sm: 0.75rem
  margin: 1.25rem
  margin-sm: 1rem
  space-xs: 0.25rem
  space-sm: 0.5rem
  space-md: 0.75rem
  space-lg: 1rem
  space-xl: 1.5rem
---

## Brand & Style

This design system serves cat guardians managing day-to-day care routines without clinical sterility or cognitive overload. The emotional tone is tender, reassuring, and domestic—grounded in the calming textures of home life rather than cold medical tracking. 

The aesthetic fuses modern minimalism with soft tactile warmth:
- **Atmosphere**: Gentle daylight, natural linen textures, and comforting rounded geometry that makes routine logging feel nurturing rather than chore-like.
- **Audience**: Dedicated cat parents, foster caretakers, and multi-pet households needing quick one-handed recording during frantic mornings or vet checkups.
- **Physicality**: Soft-elevation cards, squishy pill tags, and tactile controls designed for single-thumb navigation on mobile devices.

## Colors

The foundation is built upon cozy domestic neutrals—warm cream canvas, soft oat surfaces, and deep warm gray typography—paired with an intuitive semantic coding system for feline activities:

- **Canvas & Surface Base**:
  - Background Canvas: `#FAF7F2` (warm cream)
  - Surface Card (Default): `#FFFFFF`
  - Surface Muted / Well: `#F2ECE4` (soft sand)
  - Border Subdued: `#E8E0D5`

- **Core & Semantic Activity Accents**:
  - **Feeding / Food**: Primary Terracotta (`#D96B43`), soft tint `#FBEBE4`
  - **Water / Hydration**: Soft Teal (`#2B8A8D`), soft tint `#E5F4F4`
  - **Litter Box / Hygiene**: Warm Amber/Mustard (`#D9933D`), soft tint `#FAF0DF`
  - **Medication & Health**: Calming Lavender (`#7C6DAF`), soft tint `#EFEBFA`
  - **Play & Enrichment**: Playful Mint (`#43997A`), soft tint `#E4F5EE`

- **Typography & Tonal Contrast**:
  - Text Primary: `#2E2A27` (charcoal umber, never pure black)
  - Text Secondary: `#6B635B` (warm stone)
  - Text Subtle / Disabled: `#A49C93`

Use tinted background chips with corresponding full-saturation icons and text labels to preserve WCAG AA contrast while retaining a peaceful visual field.

## Typography

The design relies entirely on **Plus Jakarta Sans**, chosen for its friendly, organic geometric shapes, large x-height, and open counters that remain effortlessly legible on mobile viewports.

- **Numerics & Times**: Use tabular figures (`tnum`) for event timestamps and metric counts (e.g., "150 ml", "35 g") to maintain clean baseline alignments across lists.
- **Date Dividers**: Capitalized `label-sm` with subtle positive letter spacing (`0.04em`) centered over thin neutral hairpins.
- **Hierarchy Rules**: Log entry titles use `headline-sm` with tight vertical bounding boxes to ensure logs remain compact and glanceable.

## Layout & Spacing

A mobile-first fluid layout built on an 8pt base grid with a 4pt subgrid for micro-alignments:

- **Canvas Margins**: Default mobile screens maintain a strict outer margin of `1.25rem` (`20px`) to prevent edge taps from failing near device bezels.
- **Vertical Rhythm**: Content blocks cluster tightly using `space-sm` (`8px`) between related metadata, opening up to `space-xl` (`24px`) between distinct timeline days.
- **Action Zones**: A persistent bottom dock floats above the screen bottom, leaving a safe-area pad of `space-lg` (`16px`) plus hardware home indicators.
- **Thumb Zone Compliance**: Primary quick-entry touch targets are restricted to the lower two-fifths of the vertical screen height.

## Elevation & Depth

Visual hierarchy is maintained through soft, ambient light mimicking diffuse interior daylight. Shadows carry a subtle warm umber tint rather than cold gray or black.

- **Level 0 (Canvas Base)**: `#FAF7F2` flat background.
- **Level 1 (Cards & Feed Items)**: `#FFFFFF` with an ambient shadow `0 2px 8px -2px rgba(84, 78, 71, 0.06)` and a delicate 1px boundary stroke of `rgba(232, 224, 213, 0.8)`.
- **Level 2 (Popovers, Bottom Sheet Drawers)**: `#FFFFFF` raised with `0 12px 28px -4px rgba(84, 78, 71, 0.12)`.
- **Level 3 (Floating Quick-Action Hub)**: Sticky trigger buttons and dock surfaces use `0 8px 24px -2px rgba(217, 107, 67, 0.22)` tinted with the primary hue for a warm tactile levitation.
- **Pressed State**: Active card and button taps scale down slightly (`transform: scale(0.98)`) and reduce shadow spread to reinforce a squishy, responsive physical feel.

## Shapes

The roundedness language utilizes soft, welcoming curves that eliminate harsh corners throughout the application:

- **Base Cards & Timeline Blocks**: `rounded-lg` (16px) for an approachable, friendly silhouette that stays tidy when stacked.
- **Activity Pills & Filter Chips**: Fully circular/capsule pills (`rounded-full` / 9999px) to invite direct interaction.
- **Input Fields & Bottom Sheets**: `rounded-xl` (24px) for upper drawer corners and container groups.
- **Icons & Metric Containers**: Soft rounded squares (`rounded-md` / 10px–12px) pairing naturally with continuous corner curvature.

## Components

### Buttons
- **Primary Log Action**: Solid terracotta (`#D96B43`) background with `#FFFFFF` text. Minimum tap target is 48px high, padded with 24px horizontal space. Corners set to pill (`9999px`).
- **Secondary / Quick Log Toggles**: Light-tinted backgrounds corresponding to the specific activity color, housing matching saturated icon and label text.
- **State Feedback**: On press, applies an instant opacity drop to `0.9` and scales to `0.97` with a spring-like release curve.

### Chips & Activity Pills
- Pill-shaped tags displaying activity categories.
- Built with a subtle border, 12px height padding, and semantic background tints:
  - *Food*: `#FBEBE4` background, `#D96B43` text/icon.
  - *Water*: `#E5F4F4` background, `#2B8A8D` text/icon.
  - *Litter*: `#FAF0DF` background, `#D9933D` text/icon.
  - *Meds*: `#EFEBFA` background, `#7C6DAF` text/icon.
  - *Play*: `#E4F5EE` background, `#43997A` text/icon.

### Timeline Event Cards
- Surface: Crisp white with Level 1 warm shadow.
- Left edge features a vertical 4px rounded indicator bar matching the activity color.
- Layout: Left side holds the 40px circular semantic icon badge; center holds the activity name (`headline-sm`) and notes (`body-sm`); right side houses the bold monospace-aligned timestamp (`time-stamp`).

### Date Dividers
- Horizontal divider consisting of an inset hair-line (`#E8E0D5`) interrupted by a centered, pill-shaped oatmeal capsule (`#F2ECE4`) displaying the date (e.g., "TODAY, OCT 24") in `label-sm` uppercase.

### Inputs & Quantity Pickers
- Text Inputs: `#F2ECE4` filled background with an invisible border that shifts to a 1.5px solid Terracotta stroke on focus.
- Stepper Counters (g, ml, doses): Pill-shaped enclosure containing large tactile `-` and `+` touch circles (40px) flanking the centered numerical read-out.

### Floating Activity Dock (Sticky Action Area)
- Centered at the screen bottom, elevated with Level 3 depth.
- Includes a primary "+" button flanked by immediate 1-tap quick buttons for instant "Feed" and "Litter Cleaned" presets without needing a multi-step modal.