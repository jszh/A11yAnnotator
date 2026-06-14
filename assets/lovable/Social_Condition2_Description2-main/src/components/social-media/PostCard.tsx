import { useState } from "react";
import { Heart, MessageCircle, Share2, Bookmark, MoreHorizontal } from "lucide-react";

export interface PostData {
  id: string;
  author: string;
  handle: string;
  avatar: string;
  discipline: string;
  caption: string;
  image: string;
  appreciateCount: number;
  commentCount: number;
  tags: string[];
  timeAgo: string;
}

export default function PostCard({ post }: { post: PostData }) {
  const [appreciated, setAppreciated] = useState(false);
  const [saved, setSaved] = useState(false);
  const [count, setCount] = useState(post.appreciateCount);

  const handleAppreciate = () => {
    setAppreciated(!appreciated);
    setCount((c) => (appreciated ? c - 1 : c + 1));
  };

  return (
    <article className="folia-card overflow-hidden" aria-label={`Post by ${post.author}`}>
      {/* Header */}
      <div className="flex items-center justify-between p-4">
        <div className="flex items-center gap-3">
          <div
            className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center text-primary font-bold text-sm"
            role="img"
            aria-label={post.author}
          >
            {post.avatar}
          </div>
          <div>
            <p className="text-sm font-semibold text-foreground">{post.author}</p>
            <p className="text-xs text-muted-foreground">{post.handle} · {post.timeAgo}</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <span className="folia-tag">{post.discipline}</span>
          <button
            aria-label={`More options for post by ${post.author}`}
            className="p-1.5 rounded-lg hover:bg-secondary text-muted-foreground transition-colors"
          >
            <MoreHorizontal className="h-4 w-4" />
          </button>
        </div>
      </div>

      {/* Image */}
      <div className="relative">
        <img
          src={post.image}
          alt={`Artwork: ${post.caption}`}
          className="w-full object-cover max-h-[500px]"
          loading="lazy"
        />
      </div>

      {/* Caption & Tags */}
      <div className="p-4 space-y-2">
        <p className="text-sm text-foreground">{post.caption}</p>
        <div className="flex flex-wrap gap-1.5">
          {post.tags.map((tag) => (
            <span key={tag} className="text-xs text-primary font-medium">#{tag}</span>
          ))}
        </div>
      </div>

      {/* Engagement */}
      <div className="px-4 pb-4 flex items-center justify-between border-t border-border pt-3">
        <div className="flex items-center gap-1">
          <button
            onClick={handleAppreciate}
            aria-label={`${appreciated ? "Remove appreciation from" : "Appreciate"} post by ${post.author} — currently ${count} appreciations`}
            aria-pressed={appreciated}
            className={`folia-btn-appreciate ${appreciated ? "animate-pulse-heart" : ""}`}
          >
            <Heart className={`h-4 w-4 ${appreciated ? "fill-current" : ""}`} />
            <span>{count}</span>
          </button>
          <button
            aria-label={`Comment on post by ${post.author} — ${post.commentCount} comments`}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-medium text-muted-foreground hover:bg-secondary transition-colors"
          >
            <MessageCircle className="h-4 w-4" />
            <span>{post.commentCount}</span>
          </button>
          <button
            aria-label={`Share post by ${post.author}`}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-medium text-muted-foreground hover:bg-secondary transition-colors"
          >
            <Share2 className="h-4 w-4" />
          </button>
        </div>
        <button
          onClick={() => setSaved(!saved)}
          aria-label={`${saved ? "Remove from" : "Save to"} collection`}
          aria-pressed={saved}
          className={`p-2 rounded-full transition-colors ${
            saved ? "text-collect" : "text-muted-foreground hover:bg-secondary"
          }`}
        >
          <Bookmark className={`h-4 w-4 ${saved ? "fill-current" : ""}`} />
        </button>
      </div>
    </article>
  );
}
