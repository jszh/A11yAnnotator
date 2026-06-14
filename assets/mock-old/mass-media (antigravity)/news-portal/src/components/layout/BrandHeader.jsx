import { Link } from 'react-router-dom';

export default function BrandHeader() {
    const currentDate = new Date().toLocaleDateString('en-US', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric'
    });

    return (
        <header className="border-b border-gray-200 bg-white">
            <div className="container mx-auto px-4 py-6 md:py-8 flex flex-col items-center relative">
                <div className="absolute left-4 top-1/2 -translate-y-1/2 hidden md:flex flex-col text-xs text-gray-500 font-sans">
                    <span>{currentDate}</span>
                    <span>Today's Paper</span>
                </div>

                <Link to="/" className="text-center group block focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-brand-red rounded">
                    <h1 className="text-4xl md:text-6xl lg:text-7xl font-serif font-black tracking-tighter text-gray-900 group-hover:text-brand-red transition-colors">
                        THE DAILY BUGLE
                    </h1>
                </Link>

                <div className="absolute right-4 top-1/2 -translate-y-1/2 hidden md:flex items-center space-x-2 text-xs font-sans text-gray-700">
                    <span className="font-bold">DOW</span>
                    <span className="text-green-600 font-bold">+1.24%</span>
                </div>
            </div>
        </header>
    );
}
