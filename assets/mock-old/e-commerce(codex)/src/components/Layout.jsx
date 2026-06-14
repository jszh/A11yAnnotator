import Header from './Header';
import NavBar from './NavBar';
import Footer from './Footer';

function Layout({ children }) {
  return (
    <>
      <Header />
      <NavBar />
      <main className="container-app pb-10">{children}</main>
      <Footer />
    </>
  );
}

export default Layout;
