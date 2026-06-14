import LiveTicker from '../components/home/LiveTicker';
import HeroEditorial from '../components/home/HeroEditorial';
import StoryGrid from '../components/home/StoryGrid';
import SidebarModule from '../components/home/SidebarModule';
import FeatureBanner from '../components/home/FeatureBanner';
import VideoModule from '../components/home/VideoModule';

export default function Home() {
    return (
        <div>
            <LiveTicker />

            <div className="container mx-auto px-4 py-8">
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12">
                    {/* Main Content Area */}
                    <div className="lg:col-span-8 lg:pr-4">
                        <HeroEditorial />
                        <div className="hidden lg:block w-full h-px bg-gray-200 my-10"></div>
                        <StoryGrid />
                    </div>

                    {/* Sidebar Area */}
                    <div className="lg:col-span-4">
                        <SidebarModule />
                    </div>
                </div>

                <VideoModule />
            </div>

            <FeatureBanner />
        </div>
    );
}
