import { Link } from "react-router-dom";
import type { Product } from "../types";
import { useCart } from "../context/CartContext";
import StarRating from "./StarRating";

interface ProductCardProps {
  product: Product;
}

export default function ProductCard({ product }: ProductCardProps) {
  const { addItem } = useCart();
  const discount = product.originalPrice
    ? Math.round(((product.originalPrice - product.price) / product.originalPrice) * 100)
    : null;

  return (
    <article className="group bg-card rounded-lg border border-border overflow-hidden shadow-card hover:shadow-card-hover transition-all duration-300">
      <Link
        to={`/product/${product.id}`}
        className="block relative aspect-square overflow-hidden bg-secondary"
        aria-label={`View ${product.name} details`}
      >
        <img
          src={product.image}
          alt={product.name}
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
          loading="lazy"
        />
        {product.badge && (
          <span
            className={`absolute top-2 left-2 px-2 py-1 text-[10px] font-bold uppercase rounded-md ${
              product.badge === "sale"
                ? "bg-nova-badge-sale text-nova-badge-sale-foreground"
                : product.badge === "new"
                ? "bg-nova-info text-primary-foreground"
                : "bg-primary text-primary-foreground"
            }`}
            aria-label={product.badge === "sale" ? `${discount}% off` : product.badge}
          >
            {product.badge === "sale" ? `-${discount}%` : product.badge}
          </span>
        )}
      </Link>
      <div className="p-4 space-y-2">
        <p className="text-[11px] font-medium text-muted-foreground uppercase tracking-wider">{product.brand}</p>
        <h3 className="text-sm font-semibold leading-snug line-clamp-2 min-h-[2.5rem]">
          <Link to={`/product/${product.id}`} className="hover:text-primary transition-colors">
            {product.name}
          </Link>
        </h3>
        <StarRating rating={product.rating} count={product.reviewCount} />
        <div className="flex items-baseline gap-2">
          <span className="text-lg font-bold font-display">${product.price.toFixed(2)}</span>
          {product.originalPrice && (
            <span className="text-sm text-muted-foreground line-through">${product.originalPrice.toFixed(2)}</span>
          )}
        </div>
        <button
          onClick={() => addItem(product)}
          className="w-full mt-2 py-2 px-4 text-sm font-semibold rounded-md bg-primary text-primary-foreground hover:bg-primary/90 transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
          aria-label={`Add ${product.name} to cart`}
        >
          Add to Cart
        </button>
      </div>
    </article>
  );
}
