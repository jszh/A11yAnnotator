# ABD Mock Websites — Project Memory

## Project Structure
Root: `/Users/mengqishi/Desktop/ABD-mock-websites/`

Each theme has 3 variants: `(claude-code)`, `(codex)`, `(mix)`.
Completed themes: e-commerce, education, government, mass-media, social-media.

## Completed Builds

### social-media(claude-code) — Nexus Social
- Path: `social-media(claude-code)/social-feed/`
- Stack: React 18 (CDN, no JSX), Tailwind-style custom CSS (`styles/main.css`)
- Pages: index.html, explore/, notifications/, messages/, bookmarks/, profile/, settings/
- Shared components in `components/components.js` (window.NexusComponents)
- Key pattern: `rootPath` prop (`'.'` for index.html, `'..'` for sub-pages) fixes relative nav links
- Design: dark theme (#0d0d0f bg), purple accent (#7c3aed), 3-column layout, WCAG AA

### education(Claude code) — edu-portal
- Path: `education(Claude code)/edu-portal/`

## Patterns & Conventions
- Standalone HTML files (no build step) — React + CSS via CDN
- Shared JS loaded as plain script tag from `components/` subfolder
- All relative links use `rootPath` prop to handle root vs sub-page depth
- Accessibility: skip links, aria-labels, focus-visible outlines on all interactive elements
- Mobile: bottom nav bar replaces left sidebar at <768px
