import { Heart, MessageCircle, Share2, Bookmark } from "lucide-react";
import { Post } from "@/data/mockData";
import { useState } from "react";

interface PostCardProps {
  post: Post;
}

export function PostCard({ post }: PostCardProps) {
  const [liked, setLiked] = useState(post.isLiked ?? false);
  const [bookmarked, setBookmarked] = useState(post.isBookmarked ?? false);
  const [likeCount, setLikeCount] = useState(post.likes);

  const handleLike = () => {
    setLiked(!liked);
    setLikeCount(liked ? likeCount - 1 : likeCount + 1);
  };

  return (
    <article className="pulse-card p-4" aria-label={`Post by ${post.user.displayName}`}>
      <div className="flex gap-3">
        <img
          src={post.user.avatar}
          alt={post.user.displayName}
          className="pulse-avatar w-11 h-11"
        />
        <div className="flex-1 min-w-0">
          {/* Header */}
          <div className="flex items-center gap-2 mb-1">
            <h3 className="text-sm font-semibold text-foreground truncate">
              {post.user.displayName}
            </h3>
            <span className="text-sm text-muted-foreground truncate">
              @{post.user.handle}
            </span>
            <span className="text-muted-foreground" aria-hidden="true">·</span>
            <time className="text-sm text-muted-foreground flex-shrink-0">
              {post.timestamp}
            </time>
          </div>

          {/* Content */}
          <p className="text-foreground text-[15px] leading-relaxed mb-3">
            {post.text}
          </p>

          {/* Image */}
          {post.image && (
            <img
              src={post.image}
              alt={`Image shared by ${post.user.displayName}`}
              className="rounded-xl w-full max-h-80 object-cover mb-3 border border-border"
              loading="lazy"
            />
          )}

          {/* Actions */}
          <div className="flex items-center gap-1 -ml-2" role="group" aria-label="Post actions">
            <button
              className={`pulse-action-btn ${liked ? "text-primary" : ""}`}
              onClick={handleLike}
              aria-label={`Like post by @${post.user.handle} — currently ${likeCount} likes`}
              aria-pressed={liked}
            >
              <Heart className="w-4 h-4" fill={liked ? "currentColor" : "none"} aria-hidden="true" />
              <span className="text-xs">{likeCount.toLocaleString()}</span>
            </button>

            <button
              className="pulse-action-btn"
              aria-label={`Comment on post by @${post.user.handle} — ${post.comments} comments`}
            >
              <MessageCircle className="w-4 h-4" aria-hidden="true" />
              <span className="text-xs">{post.comments}</span>
            </button>

            <button
              className="pulse-action-btn"
              aria-label={`Share post by @${post.user.handle}`}
            >
              <Share2 className="w-4 h-4" aria-hidden="true" />
              <span className="text-xs">{post.shares}</span>
            </button>

            <button
              className={`pulse-action-btn ml-auto ${bookmarked ? "text-primary" : ""}`}
              onClick={() => setBookmarked(!bookmarked)}
              aria-label={`Bookmark post by @${post.user.handle}`}
              aria-pressed={bookmarked}
            >
              <Bookmark className="w-4 h-4" fill={bookmarked ? "currentColor" : "none"} aria-hidden="true" />
            </button>
          </div>
        </div>
      </div>
    </article>
  );
}
