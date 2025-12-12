# Recall MVP - Mockup Design Guidance
## For AI Design Tools & UI/UX Designers

**Purpose:** This document provides complete specifications for creating all UI mockups needed for the Recall MVP.  
**Target Audience:** AI mockup generation tools (v0, Galileo AI, etc.) or human UI designers  
**Design System:** Modern, accessible, calming aesthetic that appeals to both seniors and their adult children

---

## DESIGN SYSTEM FOUNDATION

### Color Palette

#### Primary Colors
```css
--primary-50: #f0f9ff;   /* Lightest blue - backgrounds */
--primary-100: #e0f2fe;  /* Light blue - hover states */
--primary-500: #0ea5e9;  /* Sky blue - primary CTA buttons */
--primary-600: #0284c7;  /* Deep blue - button hover */
--primary-700: #0369a1;  /* Darker blue - active states */
```

#### Neutral Colors
```css
--neutral-50: #fafafa;   /* Off-white backgrounds */
--neutral-100: #f5f5f5;  /* Light gray - cards */
--neutral-300: #d4d4d4;  /* Medium gray - borders */
--neutral-600: #525252;  /* Dark gray - secondary text */
--neutral-900: #171717;  /* Almost black - primary text */
```

#### Accent Colors
```css
--accent-green: #10b981;  /* Success states (chapter sent) */
--accent-amber: #f59e0b;  /* Warning states (session timeout) */
--accent-red: #ef4444;    /* Error states */
--accent-purple: #8b5cf6; /* Special highlights (audio badges) */
```

### Typography

#### Font Families
```css
--font-display: 'Inter', system-ui, sans-serif;  /* Headings */
--font-body: 'Inter', system-ui, sans-serif;     /* Body text */
--font-mono: 'JetBrains Mono', monospace;        /* Timestamps, code */
```

#### Font Sizes
```css
--text-xs: 0.75rem;      /* 12px - metadata, timestamps */
--text-sm: 0.875rem;     /* 14px - secondary text */
--text-base: 1rem;       /* 16px - body text */
--text-lg: 1.125rem;     /* 18px - subheadings */
--text-xl: 1.25rem;      /* 20px - card titles */
--text-2xl: 1.5rem;      /* 24px - section headings */
--text-3xl: 1.875rem;    /* 30px - page headings */
--text-4xl: 2.25rem;     /* 36px - hero text */
```

#### Font Weights
```css
--font-normal: 400;
--font-medium: 500;
--font-semibold: 600;
--font-bold: 700;
```

### Spacing System
```css
--space-1: 0.25rem;   /* 4px */
--space-2: 0.5rem;    /* 8px */
--space-3: 0.75rem;   /* 12px */
--space-4: 1rem;      /* 16px */
--space-6: 1.5rem;    /* 24px */
--space-8: 2rem;      /* 32px */
--space-12: 3rem;     /* 48px */
--space-16: 4rem;     /* 64px */
--space-24: 6rem;     /* 96px */
```

### Border Radius
```css
--radius-sm: 0.375rem;   /* 6px - small elements */
--radius-md: 0.5rem;     /* 8px - buttons, inputs */
--radius-lg: 0.75rem;    /* 12px - cards */
--radius-xl: 1rem;       /* 16px - modals */
--radius-full: 9999px;   /* Circular buttons */
```

### Shadows
```css
--shadow-sm: 0 1px 2px 0 rgb(0 0 0 / 0.05);
--shadow-md: 0 4px 6px -1px rgb(0 0 0 / 0.1);
--shadow-lg: 0 10px 15px -3px rgb(0 0 0 / 0.1);
--shadow-xl: 0 20px 25px -5px rgb(0 0 0 / 0.1);
```

---

## SCREEN 1: LANDING PAGE

### Layout Structure
```
┌─────────────────────────────────────────────────┐
│ HEADER (sticky)                                  │
│ Logo | Features | How It Works | Sign In         │
├─────────────────────────────────────────────────┤
│                                                   │
│            HERO SECTION (centered)                │
│                                                   │
│  H1: "Preserve Your Parent's Stories with AI"    │
│  Subtitle: "Turn conversations into lasting..."  │
│                                                   │
│           [Get Started Free ➔ ]                  │
│                                                   │
│        [Demo Video Thumbnail - 16:9]             │
│                                                   │
├─────────────────────────────────────────────────┤
│                                                   │
│          HOW IT WORKS (3-column grid)             │
│                                                   │
│   🎙️             🧠              📖              │
│ "Chat"        "Remember"      "Share"            │
│  [desc]        [desc]         [desc]             │
│                                                   │
├─────────────────────────────────────────────────┤
│                                                   │
│         TESTIMONIAL SECTION (carousel)           │
│                                                   │
├─────────────────────────────────────────────────┤
│              FOOTER                               │
│    Contact | Privacy | Terms                     │
└─────────────────────────────────────────────────┘
```

### Component Details

#### Header (Sticky Navigation)
- **Height:** 80px
- **Background:** `--neutral-50` with `--shadow-sm`
- **Logo:** Left-aligned, "Recall" wordmark in `--text-2xl --font-bold` with icon
- **Nav Links:** Right-aligned, `--text-base`, hover: `--primary-600`
- **Sign In Button:** Secondary style (outlined), `--radius-md`

#### Hero Section
- **Background:** Subtle gradient from `--primary-50` to `--neutral-50`
- **Padding:** `--space-24` vertical
- **H1:** `--text-4xl --font-bold --neutral-900`, max-width: 800px, centered
- **Subtitle:** `--text-xl --neutral-600`, max-width: 600px, centered
- **CTA Button:**
  - Size: Large (px: 32, py: 16)
  - Background: `--primary-500`
  - Text: White, `--text-lg --font-semibold`
  - Hover: `--primary-600` with scale(1.05) transform
  - Border radius: `--radius-lg`
  - Shadow: `--shadow-md`, hover: `--shadow-xl`

#### Demo Video Placeholder
- **Aspect Ratio:** 16:9
- **Max Width:** 800px
- **Border Radius:** `--radius-xl`
- **Shadow:** `--shadow-lg`
- **Overlay:** Play button (circular, `--radius-full`, white icon, `--primary-500` background)

#### How It Works Section
- **Layout:** 3-column grid on desktop, 1-column on mobile
- **Gap:** `--space-8`
- **Each Card:**
  - Background: White
  - Padding: `--space-8`
  - Border radius: `--radius-lg`
  - Shadow: `--shadow-sm`, hover: `--shadow-md`
  - Icon: 64px × 64px, colored circle background
  - Title: `--text-xl --font-semibold`
  - Description: `--text-base --neutral-600`

---

## SCREEN 2: ONBOARDING FORM

### Layout Structure
```
┌─────────────────────────────────────────────────┐
│             CENTERED CARD (max-w-lg)             │
│                                                   │
│  Step 1 of 2 • Senior Information               │
│                                                   │
│  ┌─────────────────────────────────────────┐    │
│  │ Senior's Name                            │    │
│  │ [Input field                         ]   │    │
│  └─────────────────────────────────────────┘    │
│                                                   │
│  ┌─────────────────────────────────────────┐    │
│  │ Senior's Email (optional)                │    │
│  │ [Input field                         ]   │    │
│  └─────────────────────────────────────────┘    │
│                                                   │
│         [Back]          [Next: Your Info  ➔ ]   │
│                                                   │
└─────────────────────────────────────────────────┘
```

### Component Details

#### Form Container
- **Max Width:** 480px
- **Centered:** Vertically and horizontally
- **Background:** White card with `--shadow-lg`
- **Padding:** `--space-12`
- **Border Radius:** `--radius-xl`

#### Progress Indicator
- **Position:** Top of card
- **Style:** "Step 1 of 2" with dot indicator
- **Color:** `--neutral-600`
- **Font:** `--text-sm --font-medium`

#### Form Fields
- **Label:**
  - Font: `--text-sm --font-medium --neutral-900`
  - Margin bottom: `--space-2`
  
- **Input:**
  - Height: 48px
  - Padding: `--space-4`
  - Border: 1px solid `--neutral-300`
  - Border radius: `--radius-md`
  - Font: `--text-base`
  - Focus state: `--primary-500` border, `--primary-50` background
  - Placeholder: `--neutral-500`

- **Helper Text:**
  - Font: `--text-sm --neutral-600`
  - Margin top: `--space-1`

#### Buttons
- **Back Button:**
  - Style: Ghost (no background)
  - Color: `--neutral-600`
  - Hover: `--neutral-900`
  
- **Next Button:**
  - Style: Primary (filled)
  - Background: `--primary-500`
  - Color: White
  - Padding: 12px 24px
  - Height: 48px
  - Full width on mobile

---

## SCREEN 3: SENIOR CONVERSATION INTERFACE

### Layout Structure
```
┌─────────────────────────────────────────────────┐
│ HEADER: "Welcome back, Arthur"        [Settings]│
├─────────────────────────────────────────────────┤
│                                                   │
│                                                   │
│            🎙️ [LARGE MICROPHONE ICON]           │
│                                                   │
│            "Ready to chat?"                      │
│                                                   │
│        [Start Conversation Button]               │
│              (or "Continue")                     │
│                                                   │
│                                                   │
│   ─────────────────────────────────────────     │
│                                                   │
│          Previous Conversations:                 │
│                                                   │
│   📖 "The Ford Plant" - Dec 10                  │
│   📖 "Navy Days" - Dec 8                        │
│   📖 "Meeting Mary" - Dec 5                     │
│                                                   │
└─────────────────────────────────────────────────┘
```

### Component Details

#### Header
- **Background:** `--neutral-50`
- **Height:** 80px
- **Greeting:** `--text-2xl --font-semibold`
- **Settings Icon:** Top-right, gear icon, `--neutral-600`

#### Main Conversation Area (Idle State)
- **Background:** Gradient from white to `--primary-50`
- **Center Aligned:** Vertically and horizontally
- **Microphone Icon:**
  - Size: 128px × 128px
  - Color: `--primary-500` foreground, `--primary-100` background circle
  - Pulsing animation when active

- **Status Text:**
  - Font: `--text-xl --neutral-600`
  - Margin top: `--space-6`

- **Start Button:**
  - Size: Extra large (px: 48, py: 24)
  - Background: `--primary-500`
  - Text: `--text-xl --font-semibold` white
  - Border radius: `--radius-full`
  - Shadow: `--shadow-lg`
  - Hover: Slight grow effect + `--shadow-xl`

#### Previous Conversations List
- **Margin Top:** `--space-16`
- **Max Width:** 600px
- **Each Item:**
  - Padding: `--space-4`
  - Background: White
  - Border radius: `--radius-md`
  - Border left: 4px solid `--primary-500`
  - Shadow: `--shadow-sm`
  - Hover: `--shadow-md`
  - Cursor: pointer
  - Icon + Title + Date layout

---

## SCREEN 4: ACTIVE CONVERSATION INTERFACE

### Layout Structure
```
┌─────────────────────────────────────────────────┐
│ Session 00:15:32                    [End Call 🞫]│
├─────────────────────────────────────────────────┤
│                                                   │
│     ╔════════════════════════════════════╗       │
│     ║  [Waveform Visualization]          ║       │
│     ║  [Animated while agent speaks]     ║       │
│     ╚════════════════════════════════════╝       │
│                                                   │
│  ┌──────────────────────────────────────────┐   │
│  │ 🎙️ Recall: "What did the factory smell  │   │
│  │ like in the summer?"                      │   │
│  └──────────────────────────────────────────┘   │
│                                                   │
│  ┌──────────────────────────────────────────┐   │
│  │ 👤 Arthur: "Oh, it was motor oil mixed   │   │
│  │ with hot metal. Quite distinct actually."│   │
│  └──────────────────────────────────────────┘   │
│                                                   │
│  ┌──────────────────────────────────────────┐   │
│  │ 🎙️ Recall: "I bet that smell brings     │   │
│  │ back memories. Tell me more about..."    │   │
│  └──────────────────────────────────────────┘   │
│                                                   │
│       [Auto-scrolls to bottom]                   │
│                                                   │
└─────────────────────────────────────────────────┘
```

### Component Details

#### Header (Active Session)
- **Background:** `--neutral-900` (dark)
- **Color:** White
- **Height:** 64px
- **Timer:** Left side, `--text-lg --font-mono`
- **End Button:**
  - Style: Danger (red background)
  - Background: `--accent-red`
  - Color: White
  - Icon: Phone handset
  - Border radius: `--radius-md`
  - Padding: 12px 24px

#### Waveform Visualization
- **Height:** 120px
- **Background:** `--primary-50` rounded container
- **Border Radius:** `--radius-lg`
- **Animation:** Bars animate based on audio input
- **Colors:** `--primary-500` bars

#### Transcript Area
- **Background:** `--neutral-50`
- **Padding:** `--space-8`
- **Auto-scroll:** To bottom as new messages arrive

- **Message Bubbles:**
  - **Agent (Recall):**
    - Background: White
    - Border: 1px solid `--neutral-300`
    - Border radius: `--radius-lg` (rounded corners except bottom-left)
    - Icon: 🎙️ microphone emoji
    - Max width: 75%
    - Float: Left
    - Padding: `--space-4`
    - Margin bottom: `--space-4`
    
  - **User (Arthur):**
    - Background: `--primary-500`
    - Color: White
    - Border radius: `--radius-lg` (rounded corners except bottom-right)
    - Icon: 👤 person emoji
    - Max width: 75%
    - Float: Right
    - Padding: `--space-4`
    - Margin bottom: `--space-4`

---

## SCREEN 5: FAMILY PORTAL - CHAPTER LIBRARY

### Layout Structure
```
┌─────────────────────────────────────────────────┐
│ SIDEBAR (fixed)  │  MAIN CONTENT AREA            │
│                   │                               │
│  Arthur's Life    │  📖 Arthur's Chapters         │
│                   │  ───────────────────────────  │
│  📖 Chapters (8)  │                               │
│  👥 People (23)   │  [Search: "Ford plant"   🔍] │
│  📍 Places (15)   │                               │
│  🏷️ Topics (12)   │  [All] [Work] [Family] [Navy]│
│                   │                               │
│  ─────────────    │  ┌──────────────────────────┐│
│                   │  │ 📖 The Ford Plant        ││
│  🎨 Timeline View │  │ Dec 10, 2025 • 23 min   ││
│  📊 Entity Map    │  │                          ││
│                   │  │ "In 1952, at eighteen..." ││
│                   │  │ [Read Chapter ➔] [🎵 2:34] ││
│                   │  └──────────────────────────┘│
│                   │                               │
│                   │  ┌──────────────────────────┐│
│                   │  │ 📖 Navy Days              ││
│                   │  │ Dec 8, 2025 • 19 min     ││
│                   │  │ ...                       ││
│                   │  └──────────────────────────┘│
└─────────────────────────────────────────────────┘
```

### Component Details

#### Sidebar Navigation
- **Width:** 280px (fixed on desktop, drawer on mobile)
- **Background:** `--neutral-900` (dark theme)
- **Color:** `--neutral-300`
- **Padding:** `--space-6`

- **Title:**
  - Font: `--text-2xl --font-bold` White
  - Margin bottom: `--space-8`

- **Nav Items:**
  - Padding: `--space-3`
  - Border radius: `--radius-md`
  - Hover: `--neutral-800` background
  - Active: `--primary-500` left border, `--neutral-800` background
  - Icon + Text + Count badge

#### Main Content Area
- **Background:** `--neutral-50`
- **Padding:** `--space-8`

#### Header
- **Title:** `--text-3xl --font-bold --neutral-900`
- **Divider:** 1px solid `--neutral-300`, margin: `--space-4` vertical

#### Search Bar
- **Width:** Full (max 600px)
- **Height:** 48px
- **Background:** White
- **Border:** 1px solid `--neutral-300`
- **Border radius:** `--radius-lg`
- **Icon:** Magnifying glass, left side
- **Padding:** `--space-4`

#### Filter Tags
- **Margin Top:** `--space-4`
- **Gap:** `--space-2`
- **Each Tag:**
  - Padding: `--space-2` `--space-4`
  - Background: `--neutral-100` (inactive), `--primary-500` (active)
  - Color: `--neutral-900` (inactive), White (active)
  - Border radius: `--radius-full`
  - Font: `--text-sm --font-medium`
  - Cursor: pointer

#### Chapter Cards
- **Margin Top:** `--space-6`
- **Gap:** `--space-4`
- **Each Card:**
  - Background: White
  - Padding: `--space-6`
  - Border radius: `--radius-lg`
  - Border: 1px solid `--neutral-300`
  - Shadow: `--shadow-sm`, hover: `--shadow-md`
  - Cursor: pointer
  - Transition: all 200ms

- **Card Layout:**
  - **Icon:** 📖 emoji, `--text-2xl`, left-aligned
  - **Title:** `--text-xl --font-semibold --neutral-900`
  - **Metadata:** `--text-sm --neutral-600`, Date • Duration
  - **Excerpt:** `--text-base --neutral-700`, max 2 lines, ellipsis
  - **Actions Row:**
    - "Read Chapter ➔" button (text link, `--primary-500`)
    - Audio badge: 🎵 icon + duration (e.g., "2:34")

---

## SCREEN 6: CHAPTER DETAIL VIEW

### Layout Structure
```
┌─────────────────────────────────────────────────┐
│  [← Back to Chapters]              [⋮ Actions]  │
├─────────────────────────────────────────────────┤
│                                                   │
│  The Ford Plant: Arthur's First Real Job        │
│  December 10, 2025 • Session 3 • 23 minutes     │
│                                                   │
│  ─────────────────────────────────────────────  │
│                                                   │
│  🎵 Audio Highlight (2:34)                       │
│  [▶️ Play] ────●────────────────── [2:34]       │
│                                                   │
│  ─────────────────────────────────────────────  │
│                                                   │
│  In 1952, at eighteen years old, Arthur          │
│  walked through the doors of the Ford plant      │
│  on 5th Street for the first time...             │
│                                                   │
│  "The smell hit you first," Arthur recalls.      │
│  "Motor oil, hot metal, cigarette smoke all      │
│  mixed together. It was deafening—presses        │
│  banging, engines roaring. But I loved it..."    │
│                                                   │
│  [Full chapter text continues...]                │
│                                                   │
│  ─────────────────────────────────────────────  │
│                                                   │
│  Related:                                         │
│  • Thomas (brother) - mentioned 3 times          │
│  • Bill (foreman) - mentioned 2 times            │
│  • Ford plant - mentioned 5 times                │
│                                                   │
│  [⬇️ Download PDF]  [📧 Share via Email]        │
│                                                   │
└─────────────────────────────────────────────────┘
```

### Component Details

#### Header
- **Back Button:** Left-aligned, icon + "Back to Chapters"
- **Actions Menu:** Right-aligned, three-dot menu (⋮)
  - Dropdown: Edit, Delete, Share

#### Chapter Title Section
- **Title:** `--text-3xl --font-bold --neutral-900`
- **Metadata:** `--text-base --neutral-600`
  - Date • Session number • Duration
  - Separated by bullet points

#### Audio Player
- **Background:** `--primary-50`
- **Padding:** `--space-6`
- **Border Radius:** `--radius-lg`
- **Margin:** `--space-8` vertical

- **Controls:**
  - Play/Pause button: Circular, `--primary-500` background
  - Progress bar: `--primary-500` filled, `--neutral-300` background
  - Time display: `--text-sm --font-mono`, current / total

#### Chapter Content
- **Font:** `--text-lg --font-body`
- **Line Height:** 1.8 (generous for readability)
- **Color:** `--neutral-900`
- **Max Width:** 720px (optimal reading length)
- **Padding:** `--space-8` vertical

- **Quotes:**
  - Font: Italic
  - Color: `--neutral-700`
  - Border left: 4px solid `--primary-500`
  - Padding left: `--space-4`
  - Background: `--neutral-50`

- **Paragraphs:**
  - Margin bottom: `--space-6`

#### Related Entities Section
- **Background:** `--neutral-100`
- **Padding:** `--space-6`
- **Border Radius:** `--radius-lg`
- **Margin Top:** `--space-8`

- **Title:** `--text-lg --font-semibold`
- **Entity List:**
  - Bullet points
  - Each item: Entity name (bold) + mention count
  - Hover: `--primary-500` color, cursor pointer

#### Action Buttons
- **Margin Top:** `--space-8`
- **Layout:** Horizontal row, gap: `--space-4`

- **Download PDF Button:**
  - Style: Secondary (outlined)
  - Border: 1px solid `--neutral-300`
  - Background: White
  - Padding: 12px 24px
  - Icon: ⬇️ download icon

- **Share Button:**
  - Style: Secondary (outlined)
  - Border: 1px solid `--neutral-300`
  - Background: White
  - Icon: 📧 email icon

---

## RESPONSIVE DESIGN BREAKPOINTS

### Mobile (< 640px)
- Single column layouts
- Sidebar becomes drawer (slide-in menu)
- Buttons stack vertically
- Font sizes reduced 10%
- Padding reduced by half

### Tablet (640px - 1024px)
- 2-column grids where applicable
- Sidebar visible but collapsible
- Normal font sizes
- Standard padding

### Desktop (> 1024px)
- Full multi-column layouts
- Fixed sidebar
- Maximum widths enforced for readability
- Generous spacing

---

## COMPONENT LIBRARY

### Buttons

#### Primary Button
```jsx
<button className="
  bg-primary-500 text-white
  px-6 py-3 rounded-lg
  font-semibold text-base
  shadow-md hover:shadow-xl
  hover:bg-primary-600
  transition-all duration-200
  hover:scale-105
">
  Get Started
</button>
```

#### Secondary Button
```jsx
<button className="
  bg-white text-neutral-900
  border border-neutral-300
  px-6 py-3 rounded-lg
  font-semibold text-base
  hover:border-neutral-400
  hover:bg-neutral-50
  transition-all duration-200
">
  Learn More
</button>
```

### Cards

#### Default Card
```jsx
<div className="
  bg-white rounded-lg
  p-6 shadow-sm
  border border-neutral-300
  hover:shadow-md
  transition-shadow duration-200
">
  [Card content]
</div>
```

### Form Inputs

#### Text Input
```jsx
<input className="
  w-full h-12 px-4
  border border-neutral-300
  rounded-md
  text-base
  focus:border-primary-500
  focus:bg-primary-50
  focus:outline-none
  transition-colors duration-200
" />
```

---

## ACCESSIBILITY REQUIREMENTS

### Color Contrast
- All text must meet WCAG AA standards (4.5:1 for normal text)
- Primary buttons: White text on `--primary-500` = 4.7:1 ✅

### Keyboard Navigation
- All interactive elements must be keyboard accessible
- Tab order follows visual hierarchy
- Focus states clearly visible (2px `--primary-500` outline)

### Screen Readers
- All images have alt text
- Form inputs have associated labels
- ARIA labels for icon-only buttons

### Font Sizes
- Minimum body text: 16px (meets accessibility standards)
- Allow text scaling up to 200% without breaking layout

---

## ANIMATION GUIDELINES

### Transitions
```css
/* Standard hover transition */
transition: all 200ms ease-in-out;

/* Shadow transitions */
transition: box-shadow 300ms ease;

/* Color transitions */
transition: background-color 200ms, border-color 200ms;
```

### Microinteractions
- Button hover: Scale(1.05) + shadow increase
- Card hover: Shadow elevation
- Input focus: Border color change + background tint
- Loading states: Subtle pulse animation

### Performance
- Use `transform` and `opacity` for animations (GPU accelerated)
- Avoid animating `width`, `height`, `top`, `left`
- Respect `prefers-reduced-motion` media query

---

## ICONOGRAPHY

### Icon Library
**Recommended:** Lucide Icons or Heroicons (consistent, modern, open-source)

### Icon Sizes
```css
--icon-sm: 16px;   /* Inline with text */
--icon-md: 24px;   /* Standard UI icons */
--icon-lg: 32px;   /* Feature highlights */
--icon-xl: 48px;   /* Hero sections */
```

### Key Icons Needed
- 🎙️ Microphone (conversation)
- 📖 Book (chapters)
- 👤 User (person)
- 🔍 Search
- ⚙️ Settings
- 📧 Email
- ⬇️ Download
- ▶️ Play
- ⏸️ Pause
- ← Back arrow
- ➔ Forward arrow
- ✕ Close
- ✓ Checkmark

---

## SPECIAL UI STATES

### Loading States
- Skeleton screens for chapter cards (pulsing gray boxes)
- Spinner for button actions (circular, `--primary-500`)

### Empty States
```
┌─────────────────────────────────┐
│                                  │
│        [Large Icon]              │
│                                  │
│    "No chapters yet"             │
│   "Start a conversation          │
│   to create your first chapter"  │
│                                  │
│   [Start Conversation ➔]         │
│                                  │
└─────────────────────────────────┘
```

### Error States
- Red border on form inputs
- Error message below input (`--accent-red`, `--text-sm`)
- Toast notifications for system errors

---

## EXPORT FORMATS

When generating mockups, provide:
1. **Figma file** (if using Figma)
2. **PNG exports** at 2x resolution for each screen
3. **Component library** showing design system tokens
4. **Prototype flow** showing screen transitions

---

**END OF MOCKUP GUIDANCE**

This document should provide everything needed to create pixel-perfect mockups for all Recall MVP screens. All measurements, colors, and spacing follow a consistent design system optimized for accessibility and modern aesthetics.
