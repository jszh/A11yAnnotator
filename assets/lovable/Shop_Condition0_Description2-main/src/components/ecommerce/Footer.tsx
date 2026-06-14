import { Link } from "react-router-dom";

const Footer = () => {
  return (
    <footer className="bg-foreground text-background">
      <div className="container mx-auto px-4 py-16">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-10">
          <div>
            <h3 className="font-display text-2xl font-semibold mb-4">ThreadHouse</h3>
            <p className="text-sm opacity-70 leading-relaxed">
              Sustainably made fashion for those who care about the planet and look good doing it.
            </p>
          </div>
          <div>
            <h4 className="text-xs font-semibold tracking-widest uppercase mb-4 opacity-50">Shop</h4>
            <div className="flex flex-col gap-2 text-sm opacity-70">
              <Link to="/products" className="hover:opacity-100 transition-opacity">New Arrivals</Link>
              <Link to="/products?category=Tops" className="hover:opacity-100 transition-opacity">Tops</Link>
              <Link to="/products?category=Bottoms" className="hover:opacity-100 transition-opacity">Bottoms</Link>
              <Link to="/products?category=Outerwear" className="hover:opacity-100 transition-opacity">Outerwear</Link>
              <Link to="/products?category=Accessories" className="hover:opacity-100 transition-opacity">Accessories</Link>
            </div>
          </div>
          <div>
            <h4 className="text-xs font-semibold tracking-widest uppercase mb-4 opacity-50">About</h4>
            <div className="flex flex-col gap-2 text-sm opacity-70">
              <span className="hover:opacity-100 transition-opacity cursor-pointer">Our Mission</span>
              <span className="hover:opacity-100 transition-opacity cursor-pointer">Sustainability</span>
              <span className="hover:opacity-100 transition-opacity cursor-pointer">Our Makers</span>
              <span className="hover:opacity-100 transition-opacity cursor-pointer">Careers</span>
            </div>
          </div>
          <div>
            <h4 className="text-xs font-semibold tracking-widest uppercase mb-4 opacity-50">Help</h4>
            <div className="flex flex-col gap-2 text-sm opacity-70">
              <span className="hover:opacity-100 transition-opacity cursor-pointer">Shipping & Returns</span>
              <span className="hover:opacity-100 transition-opacity cursor-pointer">Size Guide</span>
              <span className="hover:opacity-100 transition-opacity cursor-pointer">Contact Us</span>
              <span className="hover:opacity-100 transition-opacity cursor-pointer">FAQ</span>
            </div>
          </div>
        </div>
        <div className="mt-12 pt-8 border-t border-background/10 flex flex-col md:flex-row justify-between items-center gap-4 text-xs opacity-50">
          <span>© 2026 ThreadHouse. All rights reserved.</span>
          <div className="flex gap-6">
            <span>Privacy Policy</span>
            <span>Terms of Service</span>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
