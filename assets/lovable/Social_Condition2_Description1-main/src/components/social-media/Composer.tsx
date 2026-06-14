import { Image, Smile, MapPin } from "lucide-react";
import { currentUser } from "@/data/mockData";
import { Button } from "@/components/ui/button";

export function Composer() {
  return (
    <div className="pulse-card p-4">
      <div className="flex gap-3">
        <img
          src={currentUser.avatar}
          alt={currentUser.displayName}
          className="pulse-avatar w-11 h-11"
        />
        <div className="flex-1">
          <label htmlFor="composer-input" className="sr-only">
            Create a new post
          </label>
          <textarea
            id="composer-input"
            placeholder="What's on your mind, Alex?"
            className="pulse-input min-h-[80px] resize-none mb-3"
            rows={2}
          />
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1" role="group" aria-label="Post attachments">
              <button
                className="pulse-action-btn"
                aria-label="Add image"
              >
                <Image className="w-5 h-5" aria-hidden="true" />
              </button>
              <button
                className="pulse-action-btn"
                aria-label="Add emoji"
              >
                <Smile className="w-5 h-5" aria-hidden="true" />
              </button>
              <button
                className="pulse-action-btn"
                aria-label="Add location"
              >
                <MapPin className="w-5 h-5" aria-hidden="true" />
              </button>
            </div>
            <Button size="sm" className="rounded-full px-6 font-semibold">
              Post
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
