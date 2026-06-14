import { Link } from "react-router-dom";

interface StoryCardProps {
  image: string;
  category: string;
  headline: string;
  byline: string;
  timestamp: string;
  summary?: string;
  large?: boolean;
}

const StoryCard = ({ image, category, headline, byline, timestamp, summary, large }: StoryCardProps) => (
  <Link to="/mass-media/article" className="story-card group block">
    <div className={`overflow-hidden ${large ? 'aspect-[16/9]' : 'aspect-[4/3]'}`}>
      <img src={image} alt={headline} className="story-card-image w-full h-full object-cover" />
    </div>
    <div className="p-4">
      <span className="section-label text-accent">{category}</span>
      <h3 className={`mt-2 group-hover:text-accent transition-colors ${large ? 'headline-lg' : 'headline-sm'}`}>
        {headline}
      </h3>
      {summary && <p className="mt-2 text-muted-foreground font-sans text-sm line-clamp-2">{summary}</p>}
      <div className="mt-3 flex items-center gap-2 text-xs text-muted-foreground font-sans">
        <span className="font-semibold">{byline}</span>
        <span>·</span>
        <span>{timestamp}</span>
      </div>
    </div>
  </Link>
);

export default StoryCard;
