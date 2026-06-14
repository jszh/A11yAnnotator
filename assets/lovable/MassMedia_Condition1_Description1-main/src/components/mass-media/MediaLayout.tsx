import SiteHeader from "./SiteHeader";
import SiteFooter from "./SiteFooter";

interface MediaLayoutProps {
  children: React.ReactNode;
}

const MediaLayout = ({ children }: MediaLayoutProps) => (
  <div className="min-h-screen flex flex-col bg-background">
    <SiteHeader />
    <main className="flex-1">{children}</main>
    <SiteFooter />
  </div>
);

export default MediaLayout;
