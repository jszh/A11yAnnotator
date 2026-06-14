import { Link } from 'react-router-dom';

export default function HeroEditorial() {
    return (
        <section className="mb-12 cursor-pointer group">
            <Link to="/article/1" className="block focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-brand-red rounded">
                <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-center">
                    <div className="md:col-span-8 order-2 md:order-1">
                        <div className="relative h-[400px] md:h-[500px] w-full bg-gray-200 overflow-hidden">
                            <img
                                src="https://images.unsplash.com/photo-1495020689067-958852a7765e?ixlib=rb-4.0.3&auto=format&fit=crop&w=1200&q=80"
                                alt="Newspaper headlines"
                                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700 ease-in-out"
                            />
                            <div className="absolute top-4 left-4 bg-black text-white text-xs font-bold uppercase tracking-wider py-1 px-2">
                                Exclusive
                            </div>
                        </div>
                    </div>
                    <div className="md:col-span-4 order-1 md:order-2 flex flex-col justify-center">
                        <h2 className="text-4xl md:text-5xl lg:text-6xl font-serif font-bold leading-tight mb-4 group-hover:text-brand-red transition-colors">
                            The Future of Media in the Digital Age
                        </h2>
                        <p className="text-lg text-gray-700 mb-6 font-serif">
                            How traditional newsrooms are adapting to the rapidly changing landscape of information consumption, artificial intelligence, and global connectivity.
                        </p>
                        <div className="text-xs text-gray-500 font-bold uppercase tracking-wider flex items-center">
                            <span>By Sarah Jenkins</span>
                            <span className="mx-2">•</span>
                            <span>3 hr ago</span>
                        </div>
                    </div>
                </div>
            </Link>
        </section>
    );
}
