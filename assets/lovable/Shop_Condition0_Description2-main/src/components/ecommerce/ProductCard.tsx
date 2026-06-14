import { Link } from "react-router-dom";
import type { Product } from "@/data/products";

const ProductCard = ({ product }: { product: Product }) => {
  return (
    <Link to={`/product/${product.id}`} className="product-card">
      <div className="relative aspect-[4/5] overflow-hidden">
        <img
          src={product.image}
          alt={product.name}
          loading="lazy"
          className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
        />
        {product.badge && (
          <span className="badge-low-stock absolute top-3 left-3">
            {product.badge}
          </span>
        )}
      </div>
      <div className="p-4">
        <h3 className="text-sm font-medium text-foreground">{product.name}</h3>
        <div className="flex items-center justify-between mt-2">
          <span className="text-sm font-semibold text-foreground">${product.price}.00</span>
          <span
            className="w-4 h-4 rounded-full border border-border"
            style={{ backgroundColor: product.colorHex }}
          />
        </div>
      </div>
    </Link>
  );
};

export default ProductCard;
