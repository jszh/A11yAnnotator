export interface Product {
  id: number;
  name: string;
  price: number;
  originalPrice?: number;
  rating: number;
  reviews: number;
  image: string;
  category: string;
  brand: string;
  inStock: boolean;
  badge?: string;
  description?: string;
  specs?: Record<string, string>;
  colors?: string[];
  sizes?: string[];
}

export const categories = [
  { name: "Electronics", icon: "💻", slug: "electronics" },
  { name: "Kitchen", icon: "🍳", slug: "kitchen" },
  { name: "Clothing", icon: "👕", slug: "clothing" },
  { name: "Sports", icon: "⚽", slug: "sports" },
];

export const brands = ["Sony", "Samsung", "Apple", "Nike", "KitchenAid", "Bose", "Levi's", "Adidas", "Dyson", "Instant Pot"];

export const products: Product[] = [
  { id: 1, name: "Sony WH-1000XM5 Headphones", price: 279.99, originalPrice: 399.99, rating: 4.8, reviews: 3421, image: "", category: "electronics", brand: "Sony", inStock: true, badge: "Best Seller", description: "Industry-leading noise cancellation with Auto NC Optimizer. Crystal clear hands-free calling with 4 beamforming microphones. Up to 30 hours battery life.", specs: { "Driver Size": "30mm", "Frequency Response": "4Hz-40,000Hz", "Battery Life": "30 hours", "Weight": "250g", "Connectivity": "Bluetooth 5.2", "Noise Cancellation": "Yes - Adaptive" }, colors: ["Black", "Silver", "Midnight Blue"], sizes: [] },
  { id: 2, name: "Samsung 65\" QLED 4K Smart TV", price: 897.99, originalPrice: 1299.99, rating: 4.6, reviews: 1893, image: "", category: "electronics", brand: "Samsung", inStock: true, badge: "Flash Deal" },
  { id: 3, name: "Apple AirPods Pro (2nd Gen)", price: 189.99, originalPrice: 249.99, rating: 4.7, reviews: 8932, image: "", category: "electronics", brand: "Apple", inStock: true, badge: "Top Rated" },
  { id: 4, name: "Nike Air Max 270 Running Shoes", price: 129.99, originalPrice: 159.99, rating: 4.5, reviews: 2341, image: "", category: "clothing", brand: "Nike", inStock: true },
  { id: 5, name: "KitchenAid Artisan Stand Mixer", price: 349.99, originalPrice: 449.99, rating: 4.9, reviews: 5621, image: "", category: "kitchen", brand: "KitchenAid", inStock: true, badge: "Best Seller" },
  { id: 6, name: "Levi's 501 Original Fit Jeans", price: 59.99, originalPrice: 79.99, rating: 4.4, reviews: 3102, image: "", category: "clothing", brand: "Levi's", inStock: true },
  { id: 7, name: "Bose QuietComfort Earbuds II", price: 199.99, originalPrice: 279.99, rating: 4.6, reviews: 2156, image: "", category: "electronics", brand: "Bose", inStock: true },
  { id: 8, name: "Dyson V15 Detect Cordless Vacuum", price: 549.99, originalPrice: 749.99, rating: 4.7, reviews: 1823, image: "", category: "kitchen", brand: "Dyson", inStock: true, badge: "Flash Deal" },
  { id: 9, name: "Adidas Ultraboost 22 Sneakers", price: 139.99, originalPrice: 189.99, rating: 4.6, reviews: 4521, image: "", category: "sports", brand: "Adidas", inStock: true },
  { id: 10, name: "Instant Pot Duo 7-in-1 Cooker", price: 79.99, originalPrice: 119.99, rating: 4.8, reviews: 12043, image: "", category: "kitchen", brand: "Instant Pot", inStock: true, badge: "Top Rated" },
  { id: 11, name: "Samsung Galaxy Buds2 Pro", price: 159.99, originalPrice: 229.99, rating: 4.5, reviews: 1987, image: "", category: "electronics", brand: "Samsung", inStock: true },
  { id: 12, name: "Nike Dri-FIT Training T-Shirt", price: 34.99, rating: 4.3, reviews: 876, image: "", category: "clothing", brand: "Nike", inStock: true },
  { id: 13, name: "Apple Watch SE (2nd Gen)", price: 249.99, originalPrice: 279.99, rating: 4.7, reviews: 3456, image: "", category: "electronics", brand: "Apple", inStock: true },
  { id: 14, name: "KitchenAid Food Processor 13-Cup", price: 179.99, originalPrice: 229.99, rating: 4.6, reviews: 1234, image: "", category: "kitchen", brand: "KitchenAid", inStock: true },
  { id: 15, name: "Adidas Tiro 23 Training Pants", price: 44.99, originalPrice: 55.00, rating: 4.4, reviews: 2341, image: "", category: "sports", brand: "Adidas", inStock: true },
  { id: 16, name: "Sony WF-1000XM5 Earbuds", price: 229.99, originalPrice: 299.99, rating: 4.7, reviews: 1567, image: "", category: "electronics", brand: "Sony", inStock: false },
  { id: 17, name: "Dyson Airwrap Complete Styler", price: 499.99, originalPrice: 599.99, rating: 4.5, reviews: 3421, image: "", category: "kitchen", brand: "Dyson", inStock: true, badge: "Trending" },
  { id: 18, name: "Levi's Trucker Denim Jacket", price: 89.99, originalPrice: 108.00, rating: 4.5, reviews: 1456, image: "", category: "clothing", brand: "Levi's", inStock: true },
  { id: 19, name: "Bose SoundLink Flex Speaker", price: 119.99, originalPrice: 149.99, rating: 4.6, reviews: 2876, image: "", category: "electronics", brand: "Bose", inStock: true },
  { id: 20, name: "Nike Air Force 1 '07", price: 109.99, rating: 4.8, reviews: 9821, image: "", category: "clothing", brand: "Nike", inStock: true, badge: "Best Seller" },
  { id: 21, name: "Samsung 27\" Curved Monitor", price: 249.99, originalPrice: 349.99, rating: 4.5, reviews: 2134, image: "", category: "electronics", brand: "Samsung", inStock: true },
  { id: 22, name: "Instant Pot Air Fryer Lid", price: 49.99, originalPrice: 79.99, rating: 4.3, reviews: 876, image: "", category: "kitchen", brand: "Instant Pot", inStock: true },
  { id: 23, name: "Apple iPad 10th Generation", price: 349.99, originalPrice: 449.99, rating: 4.8, reviews: 5678, image: "", category: "electronics", brand: "Apple", inStock: true, badge: "Flash Deal" },
  { id: 24, name: "Adidas Predator Edge Football Boots", price: 159.99, originalPrice: 199.99, rating: 4.5, reviews: 987, image: "", category: "sports", brand: "Adidas", inStock: true },
  { id: 25, name: "Nike Pro Compression Shorts", price: 29.99, rating: 4.4, reviews: 1543, image: "", category: "sports", brand: "Nike", inStock: true },
];
