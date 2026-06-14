import { Link } from "react-router-dom";

export interface ArticleData {
  slug: string;
  headline: string;
  summary: string;
  category: string;
  author: string;
  date: string;
  readTime: string;
  image: string;
  imageAlt: string;
}

interface Props {
  article: ArticleData;
  size?: "large" | "medium" | "small";
}

export default function ArticleCard({ article, size = "medium" }: Props) {
  const isLarge = size === "large";
  const isSmall = size === "small";

  return (
    <article className="story-card group">
      <Link
        to={`/mass-media/article/${article.slug}`}
        className="block focus:outline-none focus-visible:ring-2 focus-visible:ring-accent"
        aria-label={article.headline}
      >
        {!isSmall && (
          <div className={`overflow-hidden mb-3 ${isLarge ? "aspect-[16/9]" : "aspect-[3/2]"}`}>
            <img
              src={article.image}
              alt={article.imageAlt}
              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
              loading="lazy"
            />
          </div>
        )}
        <div className={isSmall ? "flex gap-3 items-start" : ""}>
          {isSmall && (
            <img
              src={article.image}
              alt={article.imageAlt}
              className="w-20 h-20 object-cover shrink-0"
              loading="lazy"
            />
          )}
          <div>
            <span className="section-label">{article.category}</span>
            <h3 className={`mt-1 text-foreground group-hover:text-accent transition-colors ${
              isLarge ? "headline-lg" : isSmall ? "headline-sm text-base" : "headline-md"
            }`}>
              {article.headline}
            </h3>
            {!isSmall && (
              <p className="mt-2 text-muted-foreground font-sans text-sm line-clamp-2">
                {article.summary}
              </p>
            )}
            <p className="byline mt-2">
              {article.author} · {article.date} · {article.readTime}
            </p>
          </div>
        </div>
      </Link>
    </article>
  );
}
