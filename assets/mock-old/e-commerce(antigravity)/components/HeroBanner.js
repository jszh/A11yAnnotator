const HeroBanner = () => {
    return (
        <section className="hero-gradient text-white py-12 md:py-16 px-4 pb-24 shadow-inner relative" aria-label="Hero Promotion">
            <div className="container mx-auto flex flex-col md:flex-row items-center justify-between gap-8 max-w-6xl">
                {/* Left Content */}
                <div className="flex-1 text-center md:text-left z-10">
                    <h1 className="text-4xl md:text-5xl lg:text-6xl font-extrabold mb-4 leading-tight">
                        Discover the Best Products
                    </h1>
                    <p className="text-lg md:text-xl mb-8 text-blue-100 max-w-lg mx-auto md:mx-0">
                        Shop top categories, find amazing deals, and get it delivered fast. Prime members get free 2-day delivery on eligible items.
                    </p>
                    <a href="/products/products.html" className="inline-block bg-cta hover:bg-cta-hover text-black font-bold py-3 px-8 rounded-system-md shadow-lg transition-transform hover:scale-105 focus:outline-none focus:ring-4 focus:ring-yellow-300" aria-label="Shop now">
                        Shop Now
                    </a>
                </div>

                {/* Right Content (Image Placeholder & Carousel arrows) */}
                <div className="flex-1 relative w-full max-w-md md:max-w-xl aspect-video bg-white/10 rounded-system-lg backdrop-blur-sm border border-white/20 flex items-center justify-center p-4">
                    <button className="absolute left-2 top-1/2 -translate-y-1/2 bg-white/20 hover:bg-white/40 p-2 rounded-full focus:outline-none focus:ring-2 focus:ring-cta text-white" aria-label="Previous slide">
                        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 19l-7-7 7-7"></path></svg>
                    </button>

                    <div className="text-center text-white/80">
                        <svg className="w-20 h-20 mx-auto mb-2 opacity-50" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"></path></svg>
                        <p className="font-semibold tracking-wide uppercase text-sm">Featured Product Image</p>
                    </div>

                    <button className="absolute right-2 top-1/2 -translate-y-1/2 bg-white/20 hover:bg-white/40 p-2 rounded-full focus:outline-none focus:ring-2 focus:ring-cta text-white" aria-label="Next slide">
                        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7"></path></svg>
                    </button>

                    {/* Indicators */}
                    <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex space-x-2">
                        <span className="w-2 h-2 rounded-full bg-white block"></span>
                        <span className="w-2 h-2 rounded-full bg-white/40 block"></span>
                        <span className="w-2 h-2 rounded-full bg-white/40 block"></span>
                    </div>
                </div>
            </div>
        </section>
    );
};

window.HeroBanner = HeroBanner;
