import { Link } from 'react-router-dom';

function Header() {
  return (
    <header className="sticky top-0 z-50 bg-brand-dark text-slate-50 shadow-soft">
      <div className="container-app flex min-h-[72px] flex-wrap items-center gap-4 py-2">
        <Link to="/" className="flex min-w-[220px] items-center gap-3">
          <span className="inline-flex h-10 w-10 items-center justify-center rounded-[10px] bg-gradient-to-br from-blue-400 to-blue-700 font-bold">
            MH
          </span>
          <span>
            <small className="block text-xs text-blue-300">Deliver to Seattle 98101</small>
            <strong className="text-sm">MarketHub</strong>
          </span>
        </Link>

        <form className="order-3 flex min-h-[46px] w-full flex-1 overflow-hidden rounded-lg md:order-none">
          <select className="w-28 bg-slate-200 px-3 text-sm text-slate-900 outline-none" aria-label="Search category">
            <option>All</option>
            <option>Electronics</option>
            <option>Fashion</option>
            <option>Home</option>
          </select>
          <input
            type="search"
            className="min-w-0 flex-1 px-3 text-sm text-slate-900 outline-none"
            placeholder="Search products, brands and more"
            aria-label="Search"
          />
          <button type="submit" className="w-12 bg-accent text-lg text-slate-900 hover:bg-amber-500" aria-label="Search">
            🔍
          </button>
        </form>

        <div className="flex w-full items-center gap-4 overflow-x-auto whitespace-nowrap md:w-auto">
          <button className="header-link bg-transparent text-left text-slate-50" type="button">
            <span>Language</span>
            <strong>EN</strong>
          </button>
          <Link className="header-link" to="/about">
            <span>Hello, Sign in</span>
            <strong>Account</strong>
          </Link>
          <Link className="header-link" to="/products">
            <span>Returns</span>
            <strong>Orders</strong>
          </Link>
          <Link className="inline-flex items-center gap-2 font-bold" to="/products/detail">
            🛒 Cart
            <span className="inline-flex h-[22px] min-w-[22px] items-center justify-center rounded-full bg-accent text-xs text-slate-900">
              3
            </span>
          </Link>
        </div>
      </div>
    </header>
  );
}

export default Header;
