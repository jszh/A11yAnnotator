import heroUn from "@/assets/mass-media/hero-un-session.jpg";
import storyTech from "@/assets/mass-media/story-tech.jpg";
import storyPolitics from "@/assets/mass-media/story-politics.jpg";
import storyCulture from "@/assets/mass-media/story-culture.jpg";
import storyWorld from "@/assets/mass-media/story-world.jpg";
import storyClimate from "@/assets/mass-media/story-climate.jpg";
import columnist1 from "@/assets/mass-media/columnist-1.jpg";
import columnist2 from "@/assets/mass-media/columnist-2.jpg";
import columnist3 from "@/assets/mass-media/columnist-3.jpg";
import columnist4 from "@/assets/mass-media/columnist-4.jpg";
import type { ArticleData } from "./components/ArticleCard";

export const articles: ArticleData[] = [
  {
    slug: "un-emergency-session-red-sea",
    headline: "UN Calls Emergency Session as Red Sea Tensions Escalate to Breaking Point",
    summary: "Security Council convenes emergency meeting after three cargo vessels are struck in a 48-hour period, disrupting global supply chains and sending oil futures surging.",
    category: "World",
    author: "Elena Vasquez",
    date: "Mar 13, 2026",
    readTime: "8 min read",
    image: heroUn,
    imageAlt: "Aerial view of the UN General Assembly hall during an emergency session",
  },
  {
    slug: "eu-climate-package-2035",
    headline: "EU Unveils Ambitious Climate Package Targeting Net-Zero by 2035",
    summary: "The European Commission's new directive includes sweeping regulations on industrial emissions, mandatory carbon capture for energy producers, and a €200 billion green transition fund.",
    category: "Politics",
    author: "Marcus Chen",
    date: "Mar 12, 2026",
    readTime: "6 min read",
    image: storyPolitics,
    imageAlt: "European parliament building at golden hour",
  },
  {
    slug: "ai-regulation-antitrust",
    headline: "Silicon Valley Faces Reckoning as DOJ Opens AI Antitrust Probe",
    summary: "Multiple tech giants face scrutiny over alleged monopolistic practices in AI model training data and compute resource consolidation.",
    category: "Tech",
    author: "Priya Sharma",
    date: "Mar 12, 2026",
    readTime: "5 min read",
    image: storyTech,
    imageAlt: "Busy tech conference with data visualizations on screens",
  },
  {
    slug: "global-art-renaissance",
    headline: "The New Art Renaissance: How Emerging Markets Are Reshaping Global Culture",
    summary: "From Lagos to Jakarta, a wave of contemporary artists is challenging Western-centric art narratives and commanding record prices at international auctions.",
    category: "Culture",
    author: "Amara Okafor",
    date: "Mar 11, 2026",
    readTime: "7 min read",
    image: storyCulture,
    imageAlt: "Contemporary art gallery opening with diverse crowd",
  },
  {
    slug: "shipping-crisis-red-sea",
    headline: "Shipping Firms Reroute Around Horn of Africa as Insurance Costs Triple",
    summary: "Major container lines announce indefinite diversions via the Cape of Good Hope, adding 10–14 days to Asia-Europe routes and threatening holiday supply chains.",
    category: "World",
    author: "Elena Vasquez",
    date: "Mar 11, 2026",
    readTime: "6 min read",
    image: storyWorld,
    imageAlt: "Aerial view of cargo ships in the Red Sea",
  },
  {
    slug: "climate-protest-global-march",
    headline: "Millions March Worldwide Demanding Immediate Climate Action",
    summary: "Coordinated protests across 140 countries mark the largest climate demonstration in history, with organizers calling for binding emissions cuts.",
    category: "World",
    author: "Marcus Chen",
    date: "Mar 10, 2026",
    readTime: "5 min read",
    image: storyClimate,
    imageAlt: "Climate protest march in a major city with diverse crowd",
  },
  {
    slug: "asia-semiconductor-race",
    headline: "Asia's Semiconductor Race Intensifies as Japan Pledges ¥4 Trillion in Subsidies",
    summary: "Tokyo's aggressive investment strategy aims to reclaim chip manufacturing dominance, escalating competition with South Korea and Taiwan.",
    category: "Tech",
    author: "Priya Sharma",
    date: "Mar 10, 2026",
    readTime: "4 min read",
    image: storyTech,
    imageAlt: "Tech conference displaying data charts",
  },
  {
    slug: "african-union-trade-deal",
    headline: "African Union Ratifies Landmark Continental Free Trade Agreement",
    summary: "The deal creates the world's largest free trade area by number of countries, promising to boost intra-African trade by 52% within five years.",
    category: "World",
    author: "Amara Okafor",
    date: "Mar 9, 2026",
    readTime: "6 min read",
    image: storyPolitics,
    imageAlt: "Government building exterior at sunset",
  },
  {
    slug: "digital-privacy-europe",
    headline: "Europe's New Digital Privacy Framework Sets Global Precedent",
    summary: "The landmark regulation introduces mandatory algorithmic transparency and gives citizens the right to challenge automated decisions affecting their lives.",
    category: "Politics",
    author: "Marcus Chen",
    date: "Mar 9, 2026",
    readTime: "5 min read",
    image: storyTech,
    imageAlt: "Tech conference with data on screens",
  },
];

export interface Columnist {
  name: string;
  title: string;
  image: string;
  bio: string;
}

export const columnists: Columnist[] = [
  {
    name: "Elena Vasquez",
    title: "Foreign Affairs Editor",
    image: columnist1,
    bio: "Two-time Pulitzer finalist covering international diplomacy and conflict zones for over two decades.",
  },
  {
    name: "Marcus Chen",
    title: "Political Correspondent",
    image: columnist2,
    bio: "Former Capitol Hill reporter specializing in legislative policy and democratic governance.",
  },
  {
    name: "James Whitfield",
    title: "Editor-at-Large",
    image: columnist3,
    bio: "Veteran journalist and author of four books on media ethics and the future of independent press.",
  },
  {
    name: "Amara Okafor",
    title: "Culture & Society Writer",
    image: columnist4,
    bio: "Award-winning essayist exploring the intersections of art, identity, and globalization.",
  },
];

export const opinionArticles = [
  {
    slug: "opinion-democracy-ai",
    headline: "Democracy Cannot Survive Without AI Regulation",
    summary: "The unchecked deployment of AI in political campaigns threatens the very foundations of informed consent in democratic societies.",
    columnist: columnists[1],
    date: "Mar 13, 2026",
    readTime: "10 min read",
    featured: true,
  },
  {
    slug: "opinion-climate-justice",
    headline: "Climate Justice Begins With Economic Reparations",
    summary: "Developing nations bear the brunt of a crisis they didn't create. It's time for the Global North to pay its ecological debt.",
    columnist: columnists[0],
    date: "Mar 12, 2026",
    readTime: "8 min read",
    featured: false,
  },
  {
    slug: "opinion-art-market",
    headline: "The Art Market's Obsession With Provenance Is Missing the Point",
    summary: "While galleries chase authentication, they're ignoring the revolutionary work happening outside traditional institutions.",
    columnist: columnists[3],
    date: "Mar 11, 2026",
    readTime: "6 min read",
    featured: false,
  },
  {
    slug: "opinion-press-freedom",
    headline: "Press Freedom Is Not a Western Value — It's a Human One",
    summary: "The framing of journalistic independence as a Western construct is both historically inaccurate and dangerous.",
    columnist: columnists[2],
    date: "Mar 10, 2026",
    readTime: "7 min read",
    featured: false,
  },
  {
    slug: "opinion-digital-divide",
    headline: "The Digital Divide Is the Civil Rights Issue of Our Generation",
    summary: "As governments digitize essential services, millions without internet access are being left behind.",
    columnist: columnists[3],
    date: "Mar 9, 2026",
    readTime: "5 min read",
    featured: false,
  },
];
