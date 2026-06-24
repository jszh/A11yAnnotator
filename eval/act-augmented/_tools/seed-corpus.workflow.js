export const meta = {
  name: 'a11y-builder-seed-corpus',
  description: 'Systematically gather common website-builder / CMS / framework / component-library inaccessibility patterns (web search + model knowledge), mapped to our 22 WCAG SCs, to seed test-page diversity',
  phases: [
    { title: 'Gather', detail: 'one agent per platform family: real-world a11y failure signatures' },
    { title: 'Organize', detail: 'dedupe + index patterns by SC into a seed corpus' },
  ],
};

const SCS = ['1.1.1','1.3.1','1.3.2','1.4.1','1.4.3','1.4.5','1.4.10','1.4.11','1.4.13','2.1.1','2.1.2','2.4.2','2.4.3','2.4.4','2.4.6','2.4.7','2.4.10','3.3.1','3.3.2','3.3.3','4.1.2','4.1.3'];

// args.families can override the default builder families with a complementary set.
let A = args;
if (typeof A === 'string') { try { A = JSON.parse(A); } catch (e) {} }
const corpusTag = (A && A.corpusTag) || 'builders';
const DEFAULT_FAMILIES = [
  { key: 'drag-drop-builders', desc: 'Hosted drag-and-drop website builders: Wix, Squarespace, Weebly, GoDaddy Website Builder, Carrd, Google Sites, Jimdo, Strikingly. Their auto-generated markup, default templates, image/gallery blocks, auto aria-labels, absolute-positioned layouts, and editor placeholder text.' },
  { key: 'wordpress-ecosystem', desc: 'WordPress core themes (Twenty* ), Gutenberg blocks, and page builders: Elementor, Divi, WPBakery, Beaver Builder, Oxygen. Theme defaults, icon boxes, accordions/tabs widgets, "read more" links, slider/carousel widgets, mega-menus, and placeholder/demo content.' },
  { key: 'ecommerce-platforms', desc: 'E-commerce: Shopify themes (Dawn, Debut), WooCommerce, BigCommerce, Magento, Wix Stores. Product grids, quick-view modals, variant swatches (color-only), star ratings, add-to-cart buttons, price/sale markup, filter facets, cart/checkout forms and error handling.' },
  { key: 'nocode-design-tools', desc: 'Modern no-code / design-to-site tools: Webflow, Framer, Bubble, Softr, Notion-published sites, Typedream, Readymag. Designer-driven absolute layouts, div-based interactions, scroll/hover animations, lightboxes, tooltips, and custom-coded widgets exported as divs.' },
  { key: 'frameworks-component-libs', desc: 'JS frameworks and component/CSS libraries: React/Vue/Angular SPAs (client-side routing, document.title and focus management on route change, toasts/snackbars, live regions), Bootstrap, Material UI / MUI, Tailwind UI / Headless UI, Ant Design, jQuery UI, icon fonts (Font Awesome) and SVG icon systems.' },
];
const FAMILIES = (A && Array.isArray(A.families) && A.families.length) ? A.families : DEFAULT_FAMILIES;

const PATTERNS_SCHEMA = {
  type: 'object', additionalProperties: false,
  required: ['family', 'patterns'],
  properties: {
    family: { type: 'string' },
    patterns: {
      type: 'array', minItems: 8,
      items: {
        type: 'object', additionalProperties: false,
        required: ['platform', 'name', 'description', 'wcagScs', 'typicalMarkup', 'humanJudgmentNeeded', 'whyAutoToolsMiss', 'realWorldNote'],
        properties: {
          platform: { type: 'string', description: 'specific product/theme/library, e.g. "Squarespace image block", "Shopify Dawn theme", "MUI Snackbar"' },
          name: { type: 'string', description: 'short name for the failure pattern' },
          description: { type: 'string', description: 'the characteristic accessibility failure this platform produces' },
          wcagScs: { type: 'array', items: { type: 'string', enum: SCS }, minItems: 1, description: 'which of our 22 SCs this pattern violates' },
          typicalMarkup: { type: 'string', description: 'a short representative HTML/CSS snippet of how it actually renders' },
          humanJudgmentNeeded: { type: 'boolean', description: 'TRUE if catching it requires human semantic/contextual/visual judgment (axe/WAVE/Lighthouse cannot reliably flag it); FALSE if a linter catches it' },
          whyAutoToolsMiss: { type: 'string' },
          realWorldNote: { type: 'string', description: 'grounding: known behavior / a source URL / audit finding / community report' },
        },
      },
    },
  },
};

phase('Gather');
const gathered = (await parallel(FAMILIES.map((fam) => () => agent(
  `You are cataloguing REAL-WORLD accessibility failure signatures produced by a family of website-building technologies, to seed a diverse WCAG test corpus. Combine WEB SEARCH (find audits, accessibility reviews, community bug reports, platform docs, WebAIM/Deque articles, GitHub issues) with your own expert knowledge.

PLATFORM FAMILY — ${fam.key}: ${fam.desc}

Produce a rich list (aim for 12+) of DISTINCT, characteristic accessibility failure patterns these platforms are KNOWN to produce in the wild. For each: the specific platform/theme/widget, the failure, which of our 22 in-scope WCAG SCs it violates (${SCS.join(', ')}), a short representative markup snippet of how it actually renders, whether catching it needs HUMAN judgment (vs. a linter), why automated tools miss it, and a real-world grounding note (cite a source URL when you found one via search).

PRIORITIZE patterns that require human semantic/contextual/visual judgment — e.g. auto-generated alt text that is the filename or "image", a title left at the template default, color-only variant swatches, "Learn more" links from a CMS widget, a SPA whose <title> never updates on route change, a toast that is not in a live region, a custom div "button" with a visual label that mismatches its accessible name. Be concrete and grounded; avoid generic platitudes. It is fine to also include some auto-detectable patterns for completeness, but flag them humanJudgmentNeeded=false.`,
  { label: `gather:${fam.key}`, phase: 'Gather', schema: PATTERNS_SCHEMA }
)))).filter(Boolean);

const allPatterns = gathered.flatMap(g => (g.patterns || []).map(p => ({ ...p, family: g.family })));
log(`Gathered ${allPatterns.length} raw patterns across ${gathered.length} families`);

phase('Organize');
// Group by SC deterministically (a pattern can land under several SCs).
const bySc = {};
for (const s of SCS) bySc[s] = [];
for (const p of allPatterns) for (const s of (p.wcagScs || [])) if (bySc[s]) bySc[s].push(p);

return { corpusTag, generatedFamilies: gathered.map(g => g.family), totalPatterns: allPatterns.length, allPatterns, bySc };
