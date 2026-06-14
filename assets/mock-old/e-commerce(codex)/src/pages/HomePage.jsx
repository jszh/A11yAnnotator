import { Link } from 'react-router-dom';
import HeroBanner from '../components/HeroBanner';
import ProductCard from '../components/ProductCard';
import DealCard from '../components/DealCard';
import SponsoredCard from '../components/SponsoredCard';
import { continueShopping, deals, featuredProduct } from '../data/mockData';

function HomePage() {
  return (
    <>
      <HeroBanner />

      <section className="mt-5 grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4" aria-label="Homepage cards">
        <ProductCard title="Continue shopping for picks" items={continueShopping} />

        <DealCard title="Deals on devices" deals={deals} />

        <article className="card-shell">
          <h3 className="mb-3 text-xl font-semibold leading-tight">Gift card promotion</h3>
          <div className="flex min-h-[220px] items-center justify-center rounded-xl bg-gradient-to-br from-amber-500 to-orange-500 font-bold text-white">
            Gift Cards For Every Occasion
          </div>
          <Link to="/contact" className="see-more">
            Choose your design
          </Link>
        </article>

        <SponsoredCard
          title="Deals for you + Sponsored"
          productName={featuredProduct.name}
          price={featuredProduct.price}
        />
      </section>
    </>
  );
}

export default HomePage;
