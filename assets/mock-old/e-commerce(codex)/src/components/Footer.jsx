import { Link } from 'react-router-dom';

function Footer() {
  return (
    <footer className="mt-8 bg-brand-dark text-slate-300">
      <div className="container-app flex min-h-[72px] flex-col items-center justify-center gap-3 py-3 text-sm md:flex-row md:justify-between">
        <span>© 2026 MarketHub. All rights reserved.</span>
        <div className="flex flex-wrap gap-3.5">
          <Link to="/about">About</Link>
          <Link to="/products">Products</Link>
          <Link to="/products/detail">Product Detail</Link>
          <Link to="/contact">Contact</Link>
        </div>
      </div>
    </footer>
  );
}

export default Footer;
