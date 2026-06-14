import React, { useState } from 'react';
import { Image, List, Smile, Calendar, MapPin } from 'lucide-react';

export default function FeedComposer() {
    const [postText, setPostText] = useState('');

    return (
        <div className="flex border-b border-border-light p-4 dark:border-border-dark">
            {/* Avatar */}
            <div className="mr-3 h-10 w-10 shrink-0 rounded-full bg-gradient-to-r from-cyan-500 to-blue-500" />

            {/* Input Area */}
            <div className="flex w-full flex-col">
                <textarea
                    value={postText}
                    onChange={(e) => setPostText(e.target.value)}
                    placeholder="What is happening?!"
                    className="min-h-[60px] w-full resize-none border-none bg-transparent py-2 text-xl outline-none placeholder:text-gray-500"
                    rows={Math.max(2, postText.split('\n').length)}
                />

                {/* Actions Row */}
                <div className="mt-2 flex items-center justify-between border-t border-border-light dark:border-border-dark pt-3">
                    <div className="flex items-center gap-1 text-primary-500">
                        <button className="rounded-full p-2 hover:bg-primary-50 dark:hover:bg-primary-900/30 transition-colors" aria-label="Add Media">
                            <Image className="h-5 w-5" />
                        </button>
                        <button className="rounded-full p-2 hover:bg-primary-50 dark:hover:bg-primary-900/30 transition-colors hidden sm:block" aria-label="Add Poll">
                            <List className="h-5 w-5" />
                        </button>
                        <button className="rounded-full p-2 hover:bg-primary-50 dark:hover:bg-primary-900/30 transition-colors" aria-label="Add Emoji">
                            <Smile className="h-5 w-5" />
                        </button>
                        <button className="rounded-full p-2 hover:bg-primary-50 dark:hover:bg-primary-900/30 transition-colors hidden sm:block" aria-label="Schedule">
                            <Calendar className="h-5 w-5" />
                        </button>
                        <button className="rounded-full p-2 hover:bg-primary-50 dark:hover:bg-primary-900/30 transition-colors disabled:opacity-50" aria-label="Add Location" disabled>
                            <MapPin className="h-5 w-5" />
                        </button>
                    </div>

                    <button
                        disabled={!postText.trim()}
                        className="rounded-full bg-primary-500 px-4 py-1.5 font-bold text-white transition-colors hover:bg-primary-600 disabled:opacity-50"
                    >
                        Post
                    </button>
                </div>
            </div>
        </div>
    );
}
