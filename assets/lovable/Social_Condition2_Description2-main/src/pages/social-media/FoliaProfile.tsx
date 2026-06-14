import FoliaLayout from "@/components/social-media/FoliaLayout";
import { MapPin, Link as LinkIcon, Calendar, Eye, Heart } from "lucide-react";
import heroBg from "@/assets/social-media/hero-bg.jpg";
import post1 from "@/assets/social-media/post1.jpg";
import post2 from "@/assets/social-media/post2.jpg";
import post3 from "@/assets/social-media/post3.jpg";
import post4 from "@/assets/social-media/post4.jpg";
import post5 from "@/assets/social-media/post5.jpg";
import post6 from "@/assets/social-media/post6.jpg";

const featuredWork = [
  { id: "f1", image: post1, title: "Solstice III", views: 1240, appreciations: 342 },
  { id: "f2", image: post3, title: "Film Portraits", views: 2100, appreciations: 521 },
];

const projectGrid = [
  { id: "p1", image: post1, title: "Solstice III", views: 1240, appreciations: 342 },
  { id: "p2", image: post2, title: "Geometric Studies", views: 890, appreciations: 189 },
  { id: "p3", image: post3, title: "Film Portraits", views: 2100, appreciations: 521 },
  { id: "p4", image: post4, title: "Watercolor Letters", views: 760, appreciations: 276 },
  { id: "p5", image: post5, title: "Iridescent Forms", views: 1580, appreciations: 403 },
  { id: "p6", image: post6, title: "Botanical Studies", views: 620, appreciations: 198 },
];

const tools = ["Procreate", "Figma", "Film Photography", "Blender", "Watercolor"];

export default function FoliaProfile() {
  return (
    <FoliaLayout title="Profile | Folia">
      <div className="pb-20 lg:pb-8">
        {/* Hero header */}
        <div className="relative h-48 lg:h-64 overflow-hidden">
          <img src={heroBg} alt="" className="w-full h-full object-cover" width={1920} height={640} />
          <div className="absolute inset-0 bg-gradient-to-t from-background/80 to-transparent" />
        </div>

        <div className="max-w-4xl mx-auto px-4 -mt-16 relative z-10 space-y-8">
          {/* Profile info */}
          <div className="flex flex-col sm:flex-row items-start gap-5">
            <div className="w-24 h-24 rounded-full bg-primary/20 border-4 border-card flex items-center justify-center text-primary font-bold text-3xl font-display shadow-lg">
              E
            </div>
            <div className="flex-1 space-y-2">
              <div className="flex items-center gap-3 flex-wrap">
                <h1 className="text-2xl font-display text-foreground">Elena Torres</h1>
                <span className="folia-tag bg-primary/10 text-primary">Open for Work</span>
              </div>
              <p className="text-sm text-muted-foreground max-w-lg">
                Multidisciplinary artist exploring the intersection of digital and analog. Focused on color theory,
                organic forms, and visual storytelling.
              </p>
              <div className="flex items-center gap-4 text-xs text-muted-foreground flex-wrap">
                <span className="flex items-center gap-1"><MapPin className="h-3 w-3" /> Barcelona, Spain</span>
                <span className="flex items-center gap-1"><LinkIcon className="h-3 w-3" /> elenatorres.art</span>
                <span className="flex items-center gap-1"><Calendar className="h-3 w-3" /> Joined March 2023</span>
              </div>
              <div className="flex items-center gap-4 text-sm">
                <span><strong className="text-foreground">847</strong> <span className="text-muted-foreground">followers</span></span>
                <span><strong className="text-foreground">234</strong> <span className="text-muted-foreground">following</span></span>
                <span><strong className="text-foreground">12.4k</strong> <span className="text-muted-foreground">appreciations</span></span>
              </div>
            </div>
          </div>

          {/* Works in */}
          <section>
            <h2 className="text-lg font-display text-foreground mb-3">Works In</h2>
            <div className="flex flex-wrap gap-2">
              {tools.map((t) => (
                <span key={t} className="folia-tag">{t}</span>
              ))}
            </div>
          </section>

          {/* Featured Work */}
          <section>
            <h2 className="text-lg font-display text-foreground mb-3">Featured Work</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {featuredWork.map((w) => (
                <article key={w.id} className="folia-card overflow-hidden" aria-label={`Featured: ${w.title}`}>
                  <img src={w.image} alt={w.title} className="w-full h-48 object-cover" loading="lazy" />
                  <div className="p-3 flex items-center justify-between">
                    <h3 className="text-sm font-semibold text-foreground">{w.title}</h3>
                    <div className="flex items-center gap-3 text-xs text-muted-foreground">
                      <span className="flex items-center gap-1"><Eye className="h-3 w-3" /> {w.views}</span>
                      <span className="flex items-center gap-1"><Heart className="h-3 w-3" /> {w.appreciations}</span>
                    </div>
                  </div>
                </article>
              ))}
            </div>
          </section>

          {/* Project Grid */}
          <section>
            <h2 className="text-lg font-display text-foreground mb-3">All Projects</h2>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
              {projectGrid.map((p) => (
                <article key={p.id} className="group folia-card overflow-hidden cursor-pointer" aria-label={p.title}>
                  <div className="relative aspect-square overflow-hidden">
                    <img
                      src={p.image}
                      alt={p.title}
                      className="w-full h-full object-cover transition-transform group-hover:scale-105"
                      loading="lazy"
                    />
                  </div>
                  <div className="p-2.5">
                    <h3 className="text-xs font-semibold text-foreground truncate">{p.title}</h3>
                    <div className="flex items-center gap-2 text-[10px] text-muted-foreground mt-0.5">
                      <span className="flex items-center gap-0.5"><Eye className="h-2.5 w-2.5" /> {p.views}</span>
                      <span className="flex items-center gap-0.5"><Heart className="h-2.5 w-2.5" /> {p.appreciations}</span>
                    </div>
                  </div>
                </article>
              ))}
            </div>
          </section>
        </div>
      </div>
    </FoliaLayout>
  );
}
