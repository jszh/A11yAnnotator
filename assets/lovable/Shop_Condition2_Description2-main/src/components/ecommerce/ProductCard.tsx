import { Link } from "react-router-dom";
import { useCart } from "@/context/CartContext";
import type { Product } from "@/data/products";
import { Star } from "lucide-react";

interface ProductCardProps {
  product: Product;
  /** If true, renders in horizontal scroll mode */
  compact?: boolean;
}

export default function ProductCard({ product, compact }: ProductCardProps) {
  const { addItem } = useCart();

  const badgeClass = product.badge === "Low Stock"
    ? "bg-low-stock text-accent-foreground"
    : product.badge === "New"
    ? "bg-badge-new text-primary-foreground"
    : product.badge === "Sale"
    ? "bg-accent text-accent-foreground"
    : "";

  return (
    <article
      className={`group relative flex flex-col ${compact ? "w-64 flex-shrink-0" : ""}`}
    >
      <Link
        to={`/product/${product.id}`}
        className="relative overflow-hidden rounded-lg aspect-[3/4] bg-muted block focus:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        aria-label={`View ${product.name} — $${product.price}`}
      >
        <img
          src={product.image}
          alt={product.name}
          loading="lazy"
          width={600}
          height={750}
          className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
        />
        {product.badge && (
          <span className={`absolute top-3 left-3 px-2.5 py-1 text-xs font-semibold rounded-full ${badgeClass}`} aria-label={`${product.badge}`}>
            {product.badge}
          </span>
        )}
      </Link>
      <div className="mt-3 flex flex-col gap-1">
        <Link to={`/product/${product.id}`} className="font-body text-sm font-medium leading-tight hover:text-primary transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-ring rounded">
          {product.name}
        </Link>
        <p className="text-xs text-muted-foreground">{product.color}</p>
        <div className="flex items-center gap-2">
          <span className="font-body text-sm font-semibold">${product.price.toFixed(2)}</span>
          {product.originalPrice && (
            <span className="text-xs text-muted-foreground line-through">${product.originalPrice.toFixed(2)}</span>
          )}
        </div>
        <div className="flex items-center gap-1 mt-0.5" aria-label={`Rating: ${product.rating} out of 5 stars, ${product.reviewCount} reviews`}>
          <Star className="h-3 w-3 fill-loyalty text-loyalty" aria-hidden="true" />
          <span className="text-xs text-muted-foreground">{product.rating} ({product.reviewCount})</span>
        </div>
        <button
          onClick={() => addItem(product, product.size[0], product.color)}
          className="mt-2 w-full py-2 px-4 text-xs font-semibold rounded-md bg-primary text-primary-foreground hover:bg-primary/90 transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
          aria-label={`Add ${product.name} to cart`}
        >
          Add to Cart
        </button>
      </div>
    </article>
  );
}
