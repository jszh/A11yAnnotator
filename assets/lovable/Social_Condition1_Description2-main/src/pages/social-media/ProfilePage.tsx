import { FoliaLayout } from "@/components/social-media/FoliaLayout";
import { motion } from "framer-motion";
import { MapPin, Eye, Heart, Pin } from "lucide-react";
import profileHeader from "@/assets/profile-header.jpg";
import post1 from "@/assets/post-1.jpg";
import post2 from "@/assets/post-2.jpg";
import post3 from "@/assets/post-3.jpg";
import post4 from "@/assets/post-4.jpg";
import post5 from "@/assets/post-5.jpg";

const featuredWorks = [
  { id: 1, title: "Solstice III", image: post2, views: 4820, appreciations: 891 },
  { id: 2, title: "Organic Forms", image: post1, views: 3210, appreciations: 567 },
  { id: 3, title: "Serif Study", image: post3, views: 2890, appreciations: 342 },
];

const projectGrid = [
  { id: 1, title: "Golden Hour #04", image: post4, views: 5120, appreciations: 1203 },
  { id: 2, title: "Geometric Dreams", image: post5, views: 1890, appreciations: 445 },
  { id: 3, title: "Solstice III", image: post2, views: 4820, appreciations: 891 },
  { id: 4, title: "Organic Forms", image: post1, views: 3210, appreciations: 567 },
  { id: 5, title: "Serif Study", image: post3, views: 2890, appreciations: 342 },
  { id: 6, title: "Geometric Dreams", image: post5, views: 1670, appreciations: 298 },
];

export default function ProfilePage() {
  return (
    <FoliaLayout>
      <div className="max-w-4xl mx-auto">
        {/* Header Banner */}
        <div className="relative h-48 sm:h-64 overflow-hidden">
          <img
            src={profileHeader}
            alt="Creative workspace with art supplies and sketchbooks"
            className="w-full h-full object-cover"
            width={1200}
            height={512}
          />
          <div className="absolute inset-0 bg-gradient-to-t from-background/80 to-transparent" />
        </div>

        {/* Profile Info */}
        <div className="px-4 sm:px-6 -mt-12 relative z-10">
          <div className="flex flex-col sm:flex-row sm:items-end gap-4 mb-6">
            <div className="h-24 w-24 rounded-2xl bg-primary/10 border-4 border-background flex items-center justify-center text-2xl font-display text-primary shrink-0" aria-hidden="true">
              MC
            </div>
            <div className="flex-1">
              <h1 className="font-display text-3xl text-foreground">Mika Chen</h1>
              <p className="text-muted-foreground text-sm flex items-center gap-1.5 mt-1">
                <MapPin className="h-3.5 w-3.5" aria-hidden="true" />
                Tokyo, Japan
              </p>
            </div>
            <button className="bg-primary text-primary-foreground px-6 py-2.5 rounded-xl text-sm font-medium hover:opacity-90 transition-opacity self-start sm:self-auto focus-visible:outline-2 focus-visible:outline-primary focus-visible:outline-offset-2">
              Follow
            </button>
          </div>

          {/* Bio */}
          <p className="text-sm text-foreground leading-relaxed max-w-xl mb-4">
            Multidisciplinary artist exploring the intersection of organic forms and digital media.
            Currently focused on abstract landscapes and color theory experiments.
          </p>

          <div className="flex flex-wrap gap-2 mb-4" aria-label="Tools and mediums">
            <span className="text-xs bg-muted text-muted-foreground px-3 py-1 rounded-full">Works in: Procreate</span>
            <span className="text-xs bg-muted text-muted-foreground px-3 py-1 rounded-full">Figma</span>
            <span className="text-xs bg-muted text-muted-foreground px-3 py-1 rounded-full">Film Photography</span>
            <span className="text-xs bg-muted text-muted-foreground px-3 py-1 rounded-full">After Effects</span>
          </div>

          <div className="flex gap-6 text-sm text-muted-foreground mb-8">
            <span><strong className="text-foreground">2,340</strong> followers</span>
            <span><strong className="text-foreground">186</strong> following</span>
            <span><strong className="text-foreground">42</strong> projects</span>
          </div>

          {/* Featured Work */}
          <section aria-label="Featured work">
            <div className="flex items-center gap-2 mb-4">
              <Pin className="h-4 w-4 text-primary" aria-hidden="true" />
              <h2 className="font-display text-xl text-foreground">Featured Work</h2>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-10">
              {featuredWorks.map((work, i) => (
                <motion.div
                  key={work.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.1 }}
                  className="relative rounded-xl overflow-hidden aspect-[4/3] group cursor-pointer"
                  tabIndex={0}
                  role="article"
                  aria-label={`${work.title}: ${work.views} views, ${work.appreciations} appreciations`}
                >
                  <img src={work.image} alt={`Featured work: ${work.title}`} className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105" loading="lazy" width={400} height={300} />
                  <div className="absolute inset-0 bg-gradient-to-t from-foreground/70 to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex flex-col justify-end p-3">
                    <p className="text-sm font-medium text-primary-foreground">{work.title}</p>
                    <div className="flex items-center gap-3 text-xs text-primary-foreground/80">
                      <span className="flex items-center gap-1"><Eye className="h-3 w-3" aria-hidden="true" />{work.views.toLocaleString()}</span>
                      <span className="flex items-center gap-1"><Heart className="h-3 w-3" aria-hidden="true" />{work.appreciations}</span>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          </section>

          {/* Project Grid */}
          <section aria-label="All projects" className="pb-10">
            <h2 className="font-display text-xl text-foreground mb-4">All Projects</h2>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
              {projectGrid.map((project, i) => (
                <motion.div
                  key={`${project.id}-${i}`}
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: i * 0.05 }}
                  className="relative rounded-xl overflow-hidden aspect-square group cursor-pointer"
                  tabIndex={0}
                  role="article"
                  aria-label={`${project.title}: ${project.views} views, ${project.appreciations} appreciations`}
                >
                  <img src={project.image} alt={`Project: ${project.title}`} className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105" loading="lazy" width={400} height={400} />
                  <div className="absolute inset-0 bg-gradient-to-t from-foreground/70 to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex flex-col justify-end p-3">
                    <p className="text-sm font-medium text-primary-foreground">{project.title}</p>
                    <div className="flex items-center gap-3 text-xs text-primary-foreground/80">
                      <span className="flex items-center gap-1"><Eye className="h-3 w-3" aria-hidden="true" />{project.views.toLocaleString()}</span>
                      <span className="flex items-center gap-1"><Heart className="h-3 w-3" aria-hidden="true" />{project.appreciations}</span>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          </section>
        </div>
      </div>
    </FoliaLayout>
  );
}
