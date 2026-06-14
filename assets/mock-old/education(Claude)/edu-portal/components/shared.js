/**
 * EduPortal – Shared React Components (Reference / Source)
 * ──────────────────────────────────────────────────────────
 * Each HTML page is self-contained (all components inlined) for
 * reliable file:// protocol compatibility. This file serves as
 * the authoritative source-of-truth for all shared components.
 *
 * Components exported here:
 *   • AnnouncementBar
 *   • GlobalHeader      (navMode: 'category' | 'learning')
 *   • Footer
 *   • LogoTrustStrip
 *   • ProgressWidget    (SVG ring)
 *
 * Usage in each page — pass basePath correctly:
 *   Root (index.html):          basePath = ''
 *   Level-1 (/courses/):        basePath = '../'
 *   Level-2 (/study/flash...):  basePath = '../../'
 *
 * Tech stack: React 18 (UMD CDN) + Tailwind CSS (Play CDN) + Babel Standalone
 */

// ─── AnnouncementBar ──────────────────────────────────────────
// Thin top bar. Dismissible via close button.
// Props: message(string), link(string), linkText(string)

// ─── GlobalHeader ─────────────────────────────────────────────
// Sticky header. Two nav modes: 'category' (marketplace) and 'learning' (study tools).
// Props: navMode('category'|'learning'), basePath(string), activePage(string)
// Includes: logo, desktop nav, search bar, auth buttons, mobile hamburger

// ─── Footer ───────────────────────────────────────────────────
// Full-width dark footer with 4 link columns + brand column.
// Props: basePath(string)

// ─── LogoTrustStrip ───────────────────────────────────────────
// Horizontal row of partner/university logos using chips.
// Props: none (logos hardcoded)

// ─── ProgressWidget ───────────────────────────────────────────
// Circular SVG progress ring + stats (correct/incorrect/time).
// Props: percent(number), correct(number), incorrect(number), timeLeft(string)

// ─── Navigation Links Reference ───────────────────────────────
// Category nav (navMode='category'):
//   Courses   → courses/courses.html
//   Subjects  → subjects/subjects.html
//   Curriculum→ curriculum/curriculum.html
//   Plans     → plans/plans.html
//   Enterprise→ enterprise/enterprise.html
//   Dashboard → dashboard/dashboard.html
//
// Learning nav (navMode='learning'):
//   Study      → study/study.html
//   Flashcards → study/flashcards/flashcards.html
//   Test       → study/test/test.html
//   Match      → # (placeholder)
//   Create     → # (placeholder)

// ─── Design Tokens ────────────────────────────────────────────
// Primary:    blue-600  (#2563EB)
// Secondary:  purple-600 (#7C3AED)
// Accent:     teal (#0D9488), green (#16A34A), orange (#EA580C)
// Background: gray-50 (#F9FAFB)
// Text:       gray-900, gray-600, gray-400
// Border:     gray-200
// Card bg:    white
// Shadow:     shadow-sm, shadow-md on hover

export {}; // ESM marker — actual code is inlined per-page
