import { Link } from "react-router-dom";
import { Star } from "lucide-react";
import { Product } from "../data/products";
import { Button } from "@/components/ui/button";
import { useCart } from "../context/CartContext";
import { toast } from "sonner";

const ProductCard = ({ product }: { product: Product }) => {
  const { addItem } = useCart();
  const discount = product.originalPrice
    ? Math.round(((product.originalPrice - product.price) / product.originalPrice) * 100)
    : 0;

  const categoryColors: Record<string, string> = {
    electronics: "hsl(220 50% 18%)",
    kitchen: "hsl(152 56% 42%)",
    clothing: "hsl(12 80% 58%)",
    sports: "hsl(38 92% 50%)",
  };

  const bgColor = categoryColors[product.category] || "hsl(220 50% 18%)";

  return (
    <div className="group bg-card rounded-lg shadow-card hover:shadow-card-hover transition-all duration-300 overflow-hidden flex flex-col">
      <Link to={`/product/${product.id}`} className="block relative">
        <div
          className="aspect-square flex items-center justify-center text-5xl"
          style={{ backgroundColor: bgColor + "10" }}
        >
          <span className="opacity-60 group-hover:scale-110 transition-transform duration-300">
            {product.category === "electronics" ? "🎧" : product.category === "kitchen" ? "🍳" : product.category === "clothing" ? "👕" : "⚽"}
          </span>
        </div>
        {product.badge && (
          <span className="absolute top-2 left-2 bg-badge-sale text-badge-sale-foreground text-[10px] font-bold px-2 py-1 rounded-md">
            {product.badge}
          </span>
        )}
        {discount > 0 && (
          <span className="absolute top-2 right-2 bg-accent text-accent-foreground text-[10px] font-bold px-2 py-1 rounded-md">
            -{discount}%
          </span>
        )}
      </Link>

      <div className="p-3 flex flex-col flex-1">
        <Link to={`/product/${product.id}`}>
          <h3 className="text-sm font-medium text-foreground line-clamp-2 hover:text-accent transition-colors leading-snug mb-1">
            {product.name}
          </h3>
        </Link>

        <div className="flex items-center gap-1 mb-2">
          {Array.from({ length: 5 }).map((_, i) => (
            <Star
              key={i}
              className={`h-3 w-3 ${i < Math.floor(product.rating) ? "fill-star text-star" : "text-muted"}`}
            />
          ))}
          <span className="text-xs text-muted-foreground ml-1">({product.reviews.toLocaleString()})</span>
        </div>

        <div className="mt-auto">
          <div className="flex items-baseline gap-2 mb-2">
            <span className="text-lg font-bold font-display text-foreground">${product.price}</span>
            {product.originalPrice && (
              <span className="text-xs text-muted-foreground line-through">${product.originalPrice}</span>
            )}
          </div>

          <Button
            variant="accent"
            size="sm"
            className="w-full text-xs"
            onClick={() => {
              addItem(product);
              toast.success(`${product.name} added to cart`);
            }}
            disabled={!product.inStock}
          >
            {product.inStock ? "Add to Cart" : "Out of Stock"}
          </Button>
        </div>
      </div>
    </div>
  );
};

export default ProductCard;
