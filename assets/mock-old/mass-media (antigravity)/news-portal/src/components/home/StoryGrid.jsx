import { Link } from 'react-router-dom';

const STORIES = [
    {
        id: 1,
        category: 'Politics',
        title: 'New Policy Shifts Global Trade Dynamics',
        summary: 'A comprehensive look at the new international agreements and their potential impact on domestic markets.',
        image: 'https://images.unsplash.com/photo-1541872516559-251cdbf1b8b0?ixlib=rb-4.0.3&auto=format&fit=crop&w=600&q=80',
        time: '2h ago'
    },
    {
        id: 2,
        category: 'Technology',
        title: 'Breakthrough Quantum Chip Unveiled',
        summary: 'Researchers demonstrate a stable quantum processor that could revolutionize computing in the next decade.',
        image: 'https://images.unsplash.com/photo-1518770660439-4636190af475?ixlib=rb-4.0.3&auto=format&fit=crop&w=600&q=80',
        time: '4h ago'
    },
    {
        id: 3,
        category: 'Climate',
        title: 'Record Heat Waves Challenge Infrastructure',
        summary: 'Cities scramble to upgrade power grids as unprecedented temperatures strain resources globally.',
        image: 'https://images.unsplash.com/photo-1542385151-efd9000785a0?ixlib=rb-4.0.3&auto=format&fit=crop&w=600&q=80',
        time: '6h ago'
    },
    {
        id: 4,
        category: 'Culture',
        title: 'The Resurgence of Vinyl Records Continues',
        summary: 'Why physical media is making a massive comeback among digital natives in an era of streaming dominance.',
        image: 'https://images.unsplash.com/photo-1533227268428-f9ed0900e4ab?ixlib=rb-4.0.3&auto=format&fit=crop&w=600&q=80',
        time: '8h ago'
    }
];

export default function StoryGrid() {
    return (
        <section>
            <div className="flex items-center mb-6 border-b-2 border-black pb-2">
                <h3 className="text-2xl font-serif font-black uppercase tracking-tight">Latest Stories</h3>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                {STORIES.map((story) => (
                    <article key={story.id} className="group flex flex-col sm:flex-row gap-4">
                        <Link to={`/article/${story.id}`} className="w-full sm:w-1/3 flex-shrink-0 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-brand-red rounded h-40 overflow-hidden">
                            <img
                                src={story.image}
                                alt={story.title}
                                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500 ease-in-out"
                            />
                        </Link>
                        <div className="flex flex-col justify-between w-full sm:w-2/3">
                            <div>
                                <span className="text-xs text-brand-red font-bold uppercase tracking-wider mb-2 block">
                                    {story.category}
                                </span>
                                <Link to={`/article/${story.id}`} className="focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-brand-red rounded">
                                    <h4 className="text-xl font-serif font-bold leading-tight mb-2 group-hover:text-brand-red transition-colors">
                                        {story.title}
                                    </h4>
                                </Link>
                                <p className="text-gray-600 text-sm hidden sm:block">
                                    {story.summary}
                                </p>
                            </div>
                            <div className="text-xs text-gray-500 mt-2 sm:mt-0 font-bold uppercase">
                                {story.time}
                            </div>
                        </div>
                    </article>
                ))}
            </div>
        </section>
    );
}
