import { Link } from 'react-router-dom';

function ProductCard({ title, items }) {
  return (
    <article className="card-shell">
      <h3 className="mb-3 text-xl font-semibold leading-tight">{title}</h3>
      <div className="grid grid-cols-2 gap-2">
        {items.map((item) => (
          <div key={item} className="flex min-h-[104px] items-center justify-center rounded-lg bg-slate-200 text-xs text-slate-600">
            {item}
          </div>
        ))}
      </div>
      <Link to="/products" className="see-more">
        See more
      </Link>
    </article>
  );
}

export default ProductCard;
