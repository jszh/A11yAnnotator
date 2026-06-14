import { Outlet } from 'react-router-dom';
import TrustBanner from './TrustBanner';
import Header from './Header';
import ServiceNav from './ServiceNav';
import Footer from './Footer';

export default function MainLayout() {
    return (
        <div className="flex flex-col min-h-screen">
            {/* Accessibility skip link */}
            <a href="#main-content" className="sr-only focus:not-sr-only focus:absolute focus:top-0 focus:left-0 focus:z-50 focus:p-4 focus:bg-white focus:text-blue-700 focus:font-bold">
                Skip to main content
            </a>

            <TrustBanner />
            <Header />
            <ServiceNav />

            <main id="main-content" className="flex-grow">
                <Outlet />
            </main>

            <Footer />
        </div>
    );
}
