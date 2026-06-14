import Header from "./Header";
import Footer from "./Footer";
import AlertBanner from "./AlertBanner";

const Layout = ({ children }: { children: React.ReactNode }) => (
  <div className="min-h-screen flex flex-col font-body">
    <AlertBanner
      message="Tax Filing Deadline: April 15 — File Online Now"
      cta="File Online"
      ctaLink="#"
    />
    <Header />
    <main className="flex-1">{children}</main>
    <Footer />
  </div>
);

export default Layout;
