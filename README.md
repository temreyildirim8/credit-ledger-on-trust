# SaaS Boilerplate - Next.js 14 with i18n

A production-ready SaaS boilerplate featuring **Next.js 14 App Router**, **next-intl** for internationalization, and a refined editorial design aesthetic.

## Features

- 🌍 **Multi-language Support** - English, Turkish, and Spanish with next-intl
- 🎨 **Editorial Design** - Sophisticated typography with DM Sans and Space Grotesk
- 🎯 **SEO Optimized** - Dynamic metadata generation based on locale and industry
- ⚡ **Performance First** - Built on Next.js 14 App Router with Server Components
- 🔒 **TypeScript** - Fully typed for better DX and fewer bugs
- 🎭 **Dark Mode** - Automatic dark mode support via CSS variables
- 📱 **Responsive** - Mobile-first design with refined breakpoints

## Project Structure

```
src/
├── app/
│   ├── [locale]/           # Locale-based routing
│   │   ├── layout.tsx      # Dynamic layout with SEO metadata
│   │   └── page.tsx        # Home page
│   └── globals.css         # Global styles with design system
├── components/
│   ├── Navbar.tsx          # Navigation with language switcher
│   └── LanguageSwitcher.tsx # Language selection dropdown
├── messages/               # Translation files
│   ├── en.json            # English translations
│   ├── tr.json            # Turkish translations
│   └── es.json            # Spanish translations
├── i18n.ts                 # i18n configuration
└── middleware.ts           # Locale detection and routing
```

## Getting Started

1. **Install dependencies**
   ```bash
   npm install
   ```

2. **Run the development server**
   ```bash
   npm run dev
   ```

3. **Open your browser**
   Navigate to [http://localhost:3000](http://localhost:3000)

## Internationalization (i18n)

The boilerplate supports three languages out of the box:

- **English** (`/en`) - Default
- **Turkish** (`/tr`)
- **Spanish** (`/es`)

### Adding a New Language

1. Add the locale to `src/i18n.ts`:
   ```typescript
   export const locales = ['en', 'tr', 'es', 'de'] as const;
   ```

2. Create a new translation file in `src/messages/`:
   ```
   src/messages/de.json
   ```

3. Update the middleware matcher in `src/middleware.ts`:
   ```typescript
   matcher: ['/', '/(tr|en|es|de)/:path*']
   ```

## SEO & Metadata

The boilerplate includes dynamic metadata generation based on:

1. **Locale** - Generates appropriate hreflang tags and Open Graph data
2. **Industry** - Customizable via `NEXT_PUBLIC_INDUSTRY` environment variable

### Industry-Specific Metadata

Set the industry in your `.env.local`:

```env
NEXT_PUBLIC_INDUSTRY=fintech
NEXT_PUBLIC_BASE_URL=https://yourdomain.com
```

Supported industries:
- `general` (default)
- `fintech`
- `ecommerce`
- `healthcare`

Each industry has customized titles and descriptions in the translation files.

## Design System

### Color Palette

The design uses a monochromatic base with warm amber accents:

- **Background**: `#FDFBF7` (warm off-white)
- **Surface**: `#FFFFFF`
- **Text**: `#1A1614` (dark charcoal)
- **Accent**: `#D4773C` (warm amber)

### Typography

- **Display Font**: Space Grotesk (headings, bold statements)
- **Body Font**: DM Sans (body text, UI elements)

### CSS Variables

All design tokens are defined as CSS variables in `globals.css`:

```css
--color-bg
--color-text
--color-accent
--font-display
--font-body
--spacing-unit
--shadow-md
--radius-lg
```

## Customization

### Changing Colors

Edit the CSS variables in `src/app/globals.css`:

```css
:root {
  --color-accent: #YOUR_COLOR;
  --color-accent-hover: #YOUR_DARKER_COLOR;
}
```

### Changing Fonts

Update the font imports in `src/app/[locale]/layout.tsx`:

```typescript
import { Your_Font } from "next/font/google";

const yourFont = Your_Font({
  variable: "--font-display",
  // ... configuration
});
```

### Adding Content

Update the translation files in `src/messages/` to modify copy:

```json
{
  "hero": {
    "title": "Your New Title",
    "subtitle": "Your Subtitle"
  }
}
```

## Deployment

### Vercel (Recommended)

1. Push to GitHub
2. Import to Vercel
3. Set environment variables
4. Deploy

### Other Platforms

Build the production version:

```bash
npm run build
npm start
```

## Tech Stack

- **Framework**: Next.js 14 (App Router)
- **Language**: TypeScript
- **Styling**: CSS Modules + CSS Variables
- **i18n**: next-intl
- **Fonts**: Google Fonts (DM Sans, Space Grotesk)

## License

MIT

---

Built with Next.js 14 & next-intl
