import { Link } from 'react-router-dom';
import { Play } from 'lucide-react';

const VIDEOS = [
    {
        id: 1,
        title: 'Inside the World\'s Largest Solar Farm',
        duration: '12:45',
        thumbnail: 'https://images.unsplash.com/photo-1509391366360-2e959784a276?ixlib=rb-4.0.3&auto=format&fit=crop&w=600&q=80',
        hasCaptions: true
    },
    {
        id: 2,
        title: 'The Evolution of Modern Architecture',
        duration: '08:20',
        thumbnail: 'https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?ixlib=rb-4.0.3&auto=format&fit=crop&w=600&q=80',
        hasCaptions: true
    },
    {
        id: 3,
        title: 'A Conversation with the Secretary-General',
        duration: '24:15',
        thumbnail: 'https://images.unsplash.com/photo-1521790797524-b2497295b8a0?ixlib=rb-4.0.3&auto=format&fit=crop&w=600&q=80',
        hasCaptions: true
    }
];

export default function VideoModule() {
    return (
        <section className="my-12 bg-black text-white p-6 md:p-8 rounded-sm">
            <div className="flex justify-between items-end mb-6 border-b border-gray-800 pb-2">
                <h3 className="text-2xl font-serif font-black uppercase tracking-tight text-white flex items-center">
                    <Play fill="currentColor" size={20} className="mr-2 text-brand-red" aria-hidden="true" />
                    Featured Video
                </h3>
                <Link to="/video" className="text-sm font-bold uppercase tracking-wider text-brand-red hover:text-red-400 transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-black focus:ring-brand-red rounded">
                    View All Documentaries
                </Link>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="lg:col-span-2 relative group focus-within:ring-2 focus-within:ring-offset-2 focus-within:ring-offset-black focus-within:ring-brand-red rounded overflow-hidden">
                    {/* Main featured video - acting as a thumbnail player */}
                    <div className="aspect-video bg-gray-900 relative">
                        <img
                            src="https://images.unsplash.com/photo-1516110833967-0b5716ca1387?ixlib=rb-4.0.3&auto=format&fit=crop&w=1200&q=80"
                            alt="Video Thumbnail"
                            className="w-full h-full object-cover opacity-80 group-hover:opacity-100 transition-opacity"
                        />
                        <div className="absolute inset-0 flex items-center justify-center">
                            <button
                                className="bg-brand-red/90 text-white p-4 rounded-full hover:bg-brand-red hover:scale-110 transition-all focus:outline-none focus:ring-4 focus:ring-white"
                                aria-label="Play video: Exploring Deep Ocean Trenches"
                            >
                                <Play fill="currentColor" size={32} />
                            </button>
                        </div>
                        <div className="absolute bottom-4 left-4 right-4 flex justify-between items-end">
                            <div>
                                <span className="bg-black/80 px-2 py-1 text-xs font-bold uppercase tracking-wider mb-2 inline-block">
                                    Documentary
                                </span>
                                <h4 className="text-2xl font-serif font-bold text-white shadow-sm">
                                    Exploring Deep Ocean Trenches
                                </h4>
                            </div>
                            <div className="flex space-x-2">
                                <span className="bg-black/80 px-2 py-1 text-xs font-bold" aria-label="Duration 45 minutes and 12 seconds">45:12</span>
                                <span className="bg-black/80 px-2 py-1 text-xs font-bold" title="Closed Captions Available" aria-label="Closed Captions Available">CC</span>
                            </div>
                        </div>
                    </div>
                    {/* sr-only element to indicate to screen readers this is a simulated video player setup */}
                    <span className="sr-only">Caption-ready video player. Use spacebar to play.</span>
                </div>

                <div className="flex flex-col space-y-4">
                    <h4 className="text-sm font-bold uppercase tracking-wider text-gray-400 border-b border-gray-800 pb-2">Up Next</h4>
                    {VIDEOS.map(video => (
                        <Link
                            key={video.id}
                            to={`/video/${video.id}`}
                            className="group flex space-x-4 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-black focus:ring-brand-red rounded"
                        >
                            <div className="w-1/3 aspect-video relative flex-shrink-0">
                                <img
                                    src={video.thumbnail}
                                    alt=""
                                    className="w-full h-full object-cover rounded-sm group-hover:opacity-80 transition-opacity"
                                    aria-hidden="true"
                                />
                                <div className="absolute bottom-1 right-1 bg-black/80 px-1 py-0.5 text-[10px] font-bold rounded-sm">
                                    {video.duration}
                                </div>
                            </div>
                            <div className="flex flex-col justify-center">
                                <h5 className="font-serif font-bold text-sm leading-tight group-hover:text-brand-red transition-colors mb-1">
                                    {video.title}
                                </h5>
                                {video.hasCaptions && (
                                    <span className="text-[10px] bg-gray-800 text-gray-300 px-1 py-0.5 inline-block w-max rounded-sm" aria-label="Closed Captions Available">CC</span>
                                )}
                            </div>
                        </Link>
                    ))}
                </div>
            </div>
        </section>
    );
}
