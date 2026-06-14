import { NavLink } from 'react-router-dom';
import { navItems } from '../data/mockData';

function NavBar() {
  return (
    <nav className="border-t border-white/10 bg-brand-dark-soft" aria-label="Main">
      <div className="container-app flex min-h-[46px] items-center gap-2 overflow-x-auto py-1">
        {navItems.map((item) => (
          <NavLink
            key={item.label}
            to={item.to}
            className={({ isActive }) => {
              const base = item.prime ? 'nav-item bg-prime font-bold' : 'nav-item';
              return isActive ? `${base} bg-white/15` : base;
            }}
          >
            {item.label}
          </NavLink>
        ))}
      </div>
    </nav>
  );
}

export default NavBar;
