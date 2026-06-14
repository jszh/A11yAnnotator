import React, { useState } from 'react';
import { MessageCircle, Repeat2, Heart, Share, BarChart2, MoreHorizontal } from 'lucide-react';

export default function PostCard({ author, handle, time, content, isLikedByMe = false, likes = 0, replies = 0, reposts = 0, views = 0 }) {
    const [liked, setLiked] = useState(isLikedByMe);
    const [likeCount, setLikeCount] = useState(likes);

    const handleLike = () => {
        setLiked(!liked);
        setLikeCount(liked ? likeCount - 1 : likeCount + 1);
    };

    return (
        <article className="flex cursor-pointer border-b border-border-light p-4 transition-colors hover:bg-gray-50/50 dark:border-border-dark dark:hover:bg-slate-900/20">
            {/* Avatar */}
            <div className="mr-3 flex flex-col justify-start pt-1">
                <div className="h-10 w-10 shrink-0 rounded-full bg-gradient-to-br from-indigo-500 to-purple-500" />
            </div>

            {/* Post Content Area */}
            <div className="flex w-full flex-col">
                {/* Header */}
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-1 text-[15px]">
                        <span className="font-bold text-gray-900 hover:underline dark:text-white">{author}</span>
                        <span className="text-text-muted-light dark:text-text-muted-dark">{handle}</span>
                        <span className="px-1 text-text-muted-light dark:text-text-muted-dark">·</span>
                        <span className="hover:underline text-text-muted-light dark:text-text-muted-dark">{time}</span>
                    </div>
                    <button className="rounded-full p-2 text-gray-500 hover:bg-primary-50 hover:text-primary-500 dark:text-gray-400 dark:hover:bg-primary-900/30 transition-colors" aria-label="More">
                        <MoreHorizontal className="h-4 w-4" />
                    </button>
                </div>

                {/* Text Content */}
                <p className="mt-1 whitespace-pre-wrap text-[15px] leading-snug">
                    {content}
                </p>

                {/* Interaction Row */}
                <div className="mt-3 flex max-w-md justify-between text-text-muted-light dark:text-text-muted-dark">
                    {/* Reply */}
                    <button className="group flex items-center gap-2 transition-colors hover:text-blue-500" aria-label="Reply">
                        <div className="rounded-full p-2 group-hover:bg-blue-50 dark:group-hover:bg-blue-900/30">
                            <MessageCircle className="h-4 w-4" />
                        </div>
                        <span className="text-[13px]">{replies > 0 && replies}</span>
                    </button>

                    {/* Repost */}
                    <button className="group flex items-center gap-2 transition-colors hover:text-green-500" aria-label="Repost">
                        <div className="rounded-full p-2 group-hover:bg-green-50 dark:group-hover:bg-green-900/30">
                            <Repeat2 className="h-4 w-4" />
                        </div>
                        <span className="text-[13px]">{reposts > 0 && reposts}</span>
                    </button>

                    {/* Like */}
                    <button
                        onClick={(e) => { e.stopPropagation(); handleLike(); }}
                        className={`group flex items-center gap-2 transition-colors ${liked ? 'text-pink-600' : 'hover:text-pink-600'}`}
                        aria-label="Like"
                    >
                        <div className={`rounded-full p-2 group-hover:bg-pink-50 dark:group-hover:bg-pink-900/30 ${liked ? 'text-pink-600' : ''}`}>
                            <Heart className={`h-4 w-4 ${liked ? 'fill-current' : ''}`} />
                        </div>
                        <span className="text-[13px]">{likeCount > 0 && likeCount}</span>
                    </button>

                    {/* View/Stats */}
                    <button className="group flex items-center gap-2 transition-colors hover:text-primary-500" aria-label="Views">
                        <div className="rounded-full p-2 group-hover:bg-primary-50 dark:group-hover:bg-primary-900/30">
                            <BarChart2 className="h-4 w-4" />
                        </div>
                        <span className="text-[13px]">{views > 0 && views}</span>
                    </button>

                    {/* Share */}
                    <div className="flex items-center gap-2">
                        <button className="group flex items-center transition-colors hover:text-primary-500" aria-label="Share">
                            <div className="rounded-full p-2 group-hover:bg-primary-50 dark:group-hover:bg-primary-900/30">
                                <Share className="h-4 w-4" />
                            </div>
                        </button>
                    </div>
                </div>
            </div>
        </article>
    );
}
