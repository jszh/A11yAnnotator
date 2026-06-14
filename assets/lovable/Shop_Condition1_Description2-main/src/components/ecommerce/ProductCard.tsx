import { Link } from "react-router-dom";
import type { Product } from "@/data/products";

interface ProductCardProps {
  product: Product;
  className?: string;
}

export default function ProductCard({ product, className = "" }: ProductCardProps) {
  return (
    <Link
      to={`/product/${product.id}`}
      className={`group block ${className}`}
      aria-label={`${product.name}, ${product.color}, $${product.price}`}
    >
      <div className="relative aspect-[3/4] overflow-hidden rounded-md bg-secondary mb-3">
        <img
          src={product.image}
          alt={`${product.name} in ${product.color}`}
          loading="lazy"
          width={640}
          height={800}
          className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
        />
        {product.badge && (
          <span
            className={`absolute top-3 left-3 text-xs font-semibold px-2.5 py-1 rounded-full ${
              product.badge === "Low Stock"
                ? "bg-terracotta text-terracotta-foreground"
                : product.badge === "New"
                ? "bg-accent text-accent-foreground"
                : "bg-primary text-primary-foreground"
            }`}
          >
            {product.badge}
          </span>
        )}
      </div>
      <h3 className="text-sm font-medium leading-tight group-hover:underline">{product.name}</h3>
      <p className="text-xs text-muted-foreground mt-1">{product.color}</p>
      <p className="text-sm font-semibold mt-1">${product.price.toFixed(2)}</p>
    </Link>
  );
}
