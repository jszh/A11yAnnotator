import { Link } from 'react-router-dom';
import { productList } from '../data/mockData';

function ProductsPage() {
  return (
    <section className="py-6">
      <article className="card-shell">
        <h1 className="text-3xl font-bold">Product List</h1>
        <p className="mt-2 text-slate-700">Browse featured products with placeholder content.</p>

        <div className="mt-4 grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
          {productList.map((product) => (
            <article key={product.id} className="rounded-xl border border-slate-200 p-3">
              <div className="flex min-h-[150px] items-center justify-center rounded-lg bg-slate-200">Image Placeholder</div>
              <h3 className="mt-3 text-lg font-semibold">{product.name}</h3>
              <p className="mt-1">{product.price}</p>
              <Link to="/products/detail" className="see-more">
                View details
              </Link>
            </article>
          ))}
        </div>
      </article>
    </section>
  );
}

export default ProductsPage;
