import React from 'react';
import TopHeader from './TopHeader';
import FeedComposer from './FeedComposer';
import PostCard from './PostCard';

const mockPosts = [
    {
        id: 1,
        author: 'Sarah Jenkins',
        handle: '@sarahcodes',
        time: '2h',
        content: 'Just deployed my first Vite + React app with Tailwind CSS v4! The new @tailwindcss/vite plugin makes setup so incredibly smooth compared to v3. 🚀✨\n\nReally loving the new unified token system too.',
        likes: 342,
        replies: 28,
        reposts: 15,
        views: 1205,
        isLikedByMe: false
    },
    {
        id: 2,
        author: 'Tech Insider',
        handle: '@techinsider',
        time: '4h',
        content: 'Breaking: Web design trends are shifting back towards highly structured, app-like layouts with robust keyboard accessibility. What are your thoughts on this return to fundamentals?',
        likes: 890,
        replies: 156,
        reposts: 201,
        views: 5600,
        isLikedByMe: true
    },
    {
        id: 3,
        author: 'Alex Rivera',
        handle: '@arivera_ux',
        time: '6h',
        content: 'Friendly reminder to all frontend devs: Please add visible focus rings! \n\n:focus-visible is universally supported now and it makes a world of difference for keyboard navigators. ♿️',
        likes: 1205,
        replies: 89,
        reposts: 420,
        views: 8900,
        isLikedByMe: false
    }
];

export default function Feed() {
    return (
        <div className="flex flex-col w-full h-full">
            <TopHeader />
            <div className="hidden sm:block">
                <FeedComposer />
            </div>
            <div className="flex flex-col">
                {mockPosts.map((post) => (
                    <PostCard key={post.id} {...post} />
                ))}
                {/* Subtle loading indicator or end of feed mock */}
                <div className="flex items-center justify-center p-8 text-primary-500">
                    <div className="h-6 w-6 animate-spin rounded-full border-b-2 border-primary-500"></div>
                </div>
            </div>
        </div>
    );
}
