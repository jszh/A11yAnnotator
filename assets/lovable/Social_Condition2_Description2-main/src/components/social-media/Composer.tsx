import { useState, useRef } from "react";
import { Image, Smile, Hash } from "lucide-react";

export default function Composer() {
  const [caption, setCaption] = useState("");
  const [tags, setTags] = useState("");
  const maxChars = 500;
  const remaining = maxChars - caption.length;
  const inputRef = useRef<HTMLTextAreaElement>(null);

  return (
    <div className="folia-card p-4 space-y-3">
      <h2 className="text-lg font-display text-foreground">Share Your Work</h2>
      <div>
        <label htmlFor="composer-caption" className="sr-only">
          Write a caption for your work
        </label>
        <textarea
          ref={inputRef}
          id="composer-caption"
          value={caption}
          onChange={(e) => setCaption(e.target.value)}
          placeholder="What are you working on today?"
          maxLength={maxChars}
          className="folia-input min-h-[80px] resize-none"
          aria-describedby="composer-char-count"
        />
        <p
          id="composer-char-count"
          className={`text-xs mt-1 ${remaining < 50 ? "text-destructive" : "text-muted-foreground"}`}
          aria-live="polite"
        >
          {remaining} characters remaining
        </p>
      </div>
      <div>
        <label htmlFor="composer-tags" className="sr-only">
          Add skill tags
        </label>
        <div className="flex items-center gap-2">
          <Hash className="h-4 w-4 text-muted-foreground" />
          <input
            id="composer-tags"
            type="text"
            value={tags}
            onChange={(e) => setTags(e.target.value)}
            placeholder="Add skills: illustration, procreate..."
            className="folia-input"
          />
        </div>
      </div>
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <button
            aria-label="Upload image"
            className="p-2 rounded-lg hover:bg-secondary text-muted-foreground transition-colors"
          >
            <Image className="h-5 w-5" />
          </button>
          <button
            aria-label="Add emoji"
            className="p-2 rounded-lg hover:bg-secondary text-muted-foreground transition-colors"
          >
            <Smile className="h-5 w-5" />
          </button>
        </div>
        <button className="px-5 py-2 rounded-full bg-primary text-primary-foreground text-sm font-semibold hover:opacity-90 transition-opacity">
          Share
        </button>
      </div>
    </div>
  );
}
