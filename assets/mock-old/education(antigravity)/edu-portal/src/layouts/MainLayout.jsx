import { Outlet, Link } from 'react-router-dom';
import GlobalHeader from '../components/GlobalHeader';
import Footer from '../components/Footer';

function MainLayout() {
    return (
        <div className="min-h-screen flex flex-col w-full bg-slate-50">
            <GlobalHeader />
            <main className="flex-grow w-full">
                <Outlet />
            </main>
            <Footer />
        </div>
    );
}

export default MainLayout;
