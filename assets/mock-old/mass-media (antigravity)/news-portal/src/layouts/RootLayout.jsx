import { Outlet } from 'react-router-dom';
import GlobalUtilityBar from '../components/layout/GlobalUtilityBar';
import BrandHeader from '../components/layout/BrandHeader';
import CategoryNav from '../components/layout/CategoryNav';
import Footer from '../components/layout/Footer';

export default function RootLayout() {
    return (
        <div className="min-h-screen flex flex-col font-sans">
            <GlobalUtilityBar />
            <BrandHeader />
            <CategoryNav />
            <main className="flex-grow">
                <Outlet />
            </main>
            <Footer />
        </div>
    );
}
