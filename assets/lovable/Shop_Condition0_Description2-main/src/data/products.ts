import productLinenShirt from "@/assets/product-linen-shirt.jpg";
import productTee from "@/assets/product-tee.jpg";
import productJacket from "@/assets/product-jacket.jpg";
import productTote from "@/assets/product-tote.jpg";
import productBeanie from "@/assets/product-beanie.jpg";

export interface Product {
  id: number;
  name: string;
  price: number;
  image: string;
  category: string;
  color: string;
  colorHex: string;
  material: string;
  sizes: string[];
  badge?: string;
  description?: string;
}

const images = [productLinenShirt, productTee, productJacket, productTote, productBeanie];

export const products: Product[] = [
  { id: 1, name: "Oversized Linen Shirt", price: 89, image: productLinenShirt, category: "Tops", color: "Sage Green", colorHex: "#8B9F7B", material: "Organic Cotton", sizes: ["XS","S","M","L","XL"], badge: "Low Stock", description: "A breezy oversized linen shirt in our signature sage green. Relaxed fit with rolled cuffs and coconut shell buttons." },
  { id: 2, name: "Essential Organic Tee", price: 45, image: productTee, category: "Tops", color: "Off White", colorHex: "#F5F0E8", material: "Organic Cotton", sizes: ["XS","S","M","L","XL","XXL"] },
  { id: 3, name: "Recycled Windbreaker", price: 135, image: productJacket, category: "Outerwear", color: "Terracotta", colorHex: "#C85A3A", material: "Recycled Polyester", sizes: ["S","M","L","XL"], badge: "New" },
  { id: 4, name: "Canvas Market Tote", price: 38, image: productTote, category: "Accessories", color: "Natural", colorHex: "#E8DCC8", material: "Organic Cotton", sizes: ["One Size"] },
  { id: 5, name: "Ribbed Knit Beanie", price: 32, image: productBeanie, category: "Accessories", color: "Rust", colorHex: "#A0522D", material: "Organic Cotton", sizes: ["One Size"] },
  { id: 6, name: "Wide Leg Trousers", price: 98, image: productLinenShirt, category: "Bottoms", color: "Olive", colorHex: "#556B2F", material: "Organic Cotton", sizes: ["XS","S","M","L","XL"], badge: "Low Stock" },
  { id: 7, name: "Cropped Hemp Hoodie", price: 78, image: productTee, category: "Tops", color: "Oat", colorHex: "#D4C5A9", material: "Organic Cotton", sizes: ["XS","S","M","L"] },
  { id: 8, name: "Linen Blend Blazer", price: 165, image: productJacket, category: "Outerwear", color: "Sand", colorHex: "#C2B280", material: "Organic Cotton", sizes: ["S","M","L","XL"], badge: "New" },
  { id: 9, name: "Organic Denim Jacket", price: 148, image: productJacket, category: "Outerwear", color: "Indigo", colorHex: "#3F5277", material: "Organic Cotton", sizes: ["XS","S","M","L","XL"] },
  { id: 10, name: "Relaxed Cargo Pants", price: 92, image: productLinenShirt, category: "Bottoms", color: "Sage Green", colorHex: "#8B9F7B", material: "Organic Cotton", sizes: ["XS","S","M","L","XL","XXL"] },
  { id: 11, name: "Pima Cotton Tank", price: 35, image: productTee, category: "Tops", color: "Off White", colorHex: "#F5F0E8", material: "Organic Cotton", sizes: ["XS","S","M","L","XL"] },
  { id: 12, name: "Woven Straw Hat", price: 55, image: productBeanie, category: "Accessories", color: "Natural", colorHex: "#E8DCC8", material: "Organic Cotton", sizes: ["One Size"], badge: "Low Stock" },
  { id: 13, name: "Merino Wool Scarf", price: 68, image: productTote, category: "Accessories", color: "Rust", colorHex: "#A0522D", material: "Recycled Polyester", sizes: ["One Size"] },
  { id: 14, name: "Drawstring Linen Shorts", price: 62, image: productLinenShirt, category: "Bottoms", color: "Sand", colorHex: "#C2B280", material: "Organic Cotton", sizes: ["XS","S","M","L","XL"] },
  { id: 15, name: "Oversized Cardigan", price: 115, image: productTee, category: "Tops", color: "Oat", colorHex: "#D4C5A9", material: "Organic Cotton", sizes: ["S","M","L"], badge: "New" },
  { id: 16, name: "Canvas Crossbody Bag", price: 58, image: productTote, category: "Accessories", color: "Olive", colorHex: "#556B2F", material: "Organic Cotton", sizes: ["One Size"] },
  { id: 17, name: "Relaxed Fit Chinos", price: 85, image: productLinenShirt, category: "Bottoms", color: "Terracotta", colorHex: "#C85A3A", material: "Organic Cotton", sizes: ["XS","S","M","L","XL","XXL"] },
  { id: 18, name: "Linen Camp Shirt", price: 79, image: productLinenShirt, category: "Tops", color: "Sage Green", colorHex: "#8B9F7B", material: "Organic Cotton", sizes: ["S","M","L","XL"] },
  { id: 19, name: "Recycled Puffer Vest", price: 125, image: productJacket, category: "Outerwear", color: "Indigo", colorHex: "#3F5277", material: "Recycled Polyester", sizes: ["XS","S","M","L","XL"], badge: "Low Stock" },
  { id: 20, name: "High-Rise Wide Jeans", price: 110, image: productTee, category: "Bottoms", color: "Indigo", colorHex: "#3F5277", material: "Organic Cotton", sizes: ["XS","S","M","L","XL"] },
  { id: 21, name: "Bucket Hat", price: 42, image: productBeanie, category: "Accessories", color: "Sage Green", colorHex: "#8B9F7B", material: "Organic Cotton", sizes: ["One Size"] },
  { id: 22, name: "Utility Shirt Jacket", price: 138, image: productJacket, category: "Outerwear", color: "Olive", colorHex: "#556B2F", material: "Organic Cotton", sizes: ["S","M","L","XL"], badge: "New" },
  { id: 23, name: "Organic Henley", price: 52, image: productTee, category: "Tops", color: "Off White", colorHex: "#F5F0E8", material: "Organic Cotton", sizes: ["XS","S","M","L","XL","XXL"] },
  { id: 24, name: "Waxed Canvas Belt", price: 45, image: productTote, category: "Accessories", color: "Rust", colorHex: "#A0522D", material: "Organic Cotton", sizes: ["One Size"] },
];
