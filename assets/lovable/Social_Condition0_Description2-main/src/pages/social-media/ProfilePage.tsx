import { FoliaLayout } from "@/components/social-media/FoliaLayout";
import { MapPin, Link as LinkIcon, Eye, Heart, Pin } from "lucide-react";
import { Button } from "@/components/ui/button";
import { motion } from "framer-motion";

const featuredWork = [
  { id: 1, title: "Solstice III", img: "https://images.unsplash.com/photo-1579783902614-a3fb3927b6a5?w=600&h=400&fit=crop", views: 1240, appreciations: 342 },
  { id: 2, title: "Golden Hour Study", img: "https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=600&h=400&fit=crop", views: 890, appreciations: 218 },
];

const projects = [
  { id: 1, title: "Neon Flora Series", img: "https://images.unsplash.com/photo-1549490349-8643362247b5?w=400&h=300&fit=crop", views: 2100, appreciations: 567 },
  { id: 2, title: "Texture Experiments", img: "https://images.unsplash.com/photo-1614850523459-c2f4c699c52e?w=400&h=300&fit=crop", views: 1340, appreciations: 389 },
  { id: 3, title: "Portrait Studies", img: "https://images.unsplash.com/photo-1504198453319-5ce911bafcde?w=400&h=300&fit=crop", views: 980, appreciations: 245 },
  { id: 4, title: "Abstract Landscapes", img: "https://images.unsplash.com/photo-1509316975850-ff9c5deb0cd9?w=400&h=300&fit=crop", views: 1560, appreciations: 412 },
  { id: 5, title: "Chromatic Studies", img: "https://images.unsplash.com/photo-1633177317976-3f9bc45e1d1d?w=400&h=300&fit=crop", views: 760, appreciations: 198 },
  { id: 6, title: "Light & Shadow", img: "https://images.unsplash.com/photo-1490750967868-88aa4f44baee?w=400&h=300&fit=crop", views: 1120, appreciations: 301 },
];

export default function ProfilePage() {
  return (
    <FoliaLayout>
      <div>
        {/* Header */}
        <div className="relative h-48 md:h-64 bg-gradient-to-r from-folia-coral/30 via-folia-gold/20 to-folia-teal/20">
          <div className="absolute inset-0 bg-foreground/5" />
        </div>
        <div className="max-w-4xl mx-auto px-4 -mt-16 relative z-10">
          <div className="flex flex-col md:flex-row md:items-end gap-4 mb-6">
            <div className="h-28 w-28 rounded-2xl bg-folia-coral text-primary-foreground flex items-center justify-center font-display text-4xl border-4 border-background shadow-lg">
              M
            </div>
            <div className="flex-1">
              <h2 className="font-display text-2xl text-foreground">Maya Chen</h2>
              <p className="text-sm text-muted-foreground">@mayachen · Digital Illustrator & Texture Artist</p>
              <div className="flex items-center gap-4 mt-1 text-xs text-muted-foreground">
                <span className="flex items-center gap-1"><MapPin className="h-3 w-3" /> Portland, OR</span>
                <span className="flex items-center gap-1"><LinkIcon className="h-3 w-3" /> mayachen.studio</span>
              </div>
            </div>
            <Button className="bg-folia-coral text-primary-foreground hover:bg-folia-coral/90 self-start md:self-end">
              Edit Profile
            </Button>
          </div>

          <p className="text-sm text-foreground leading-relaxed mb-3 max-w-2xl">
            Creating textured digital worlds inspired by nature and light. Fascinated by the intersection of traditional media and digital tools. Currently exploring generative patterns and botanical illustration.
          </p>
          <div className="flex flex-wrap gap-2 mb-6">
            {["Procreate", "Figma", "Film Photography", "Risograph"].map((tool) => (
              <span key={tool} className="text-xs px-3 py-1 rounded-full bg-secondary text-secondary-foreground">
                {tool}
              </span>
            ))}
          </div>
          <div className="flex gap-6 text-sm mb-8 border-b border-border pb-4">
            <span><strong className="text-foreground">127</strong> <span className="text-muted-foreground">projects</span></span>
            <span><strong className="text-foreground">4.2k</strong> <span className="text-muted-foreground">followers</span></span>
            <span><strong className="text-foreground">312</strong> <span className="text-muted-foreground">following</span></span>
            <span><strong className="text-foreground">8.9k</strong> <span className="text-muted-foreground">appreciations</span></span>
          </div>

          {/* Featured */}
          <div className="mb-8">
            <div className="flex items-center gap-2 mb-3">
              <Pin className="h-4 w-4 text-folia-coral" />
              <h3 className="font-display text-lg text-foreground">Featured Work</h3>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {featuredWork.map((w, i) => (
                <motion.div
                  key={w.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.1 }}
                  className="rounded-xl overflow-hidden border border-border bg-card cursor-pointer hover:shadow-md transition-shadow"
                >
                  <img src={w.img} alt={w.title} className="w-full aspect-[3/2] object-cover" />
                  <div className="p-3 flex items-center justify-between">
                    <span className="font-medium text-sm text-foreground">{w.title}</span>
                    <div className="flex items-center gap-3 text-xs text-muted-foreground">
                      <span className="flex items-center gap-1"><Eye className="h-3 w-3" /> {w.views}</span>
                      <span className="flex items-center gap-1"><Heart className="h-3 w-3" /> {w.appreciations}</span>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>

          {/* Project Grid */}
          <h3 className="font-display text-lg text-foreground mb-3">All Projects</h3>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4 pb-8">
            {projects.map((p, i) => (
              <motion.div
                key={p.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.06 }}
                className="rounded-xl overflow-hidden border border-border bg-card cursor-pointer hover:shadow-md transition-shadow"
              >
                <img src={p.img} alt={p.title} className="w-full aspect-[4/3] object-cover" />
                <div className="p-2.5">
                  <span className="font-medium text-xs text-foreground">{p.title}</span>
                  <div className="flex items-center gap-3 text-xs text-muted-foreground mt-1">
                    <span className="flex items-center gap-1"><Eye className="h-3 w-3" /> {p.views}</span>
                    <span className="flex items-center gap-1"><Heart className="h-3 w-3" /> {p.appreciations}</span>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </div>
    </FoliaLayout>
  );
}
