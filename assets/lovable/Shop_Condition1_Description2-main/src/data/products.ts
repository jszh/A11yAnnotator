import productLinenShirt from "@/assets/product-linen-shirt.jpg";
import productTee from "@/assets/product-tee.jpg";
import productTrousers from "@/assets/product-trousers.jpg";
import productTote from "@/assets/product-tote.jpg";

export interface Product {
  id: string;
  name: string;
  price: number;
  image: string;
  category: string;
  color: string;
  colorHex: string;
  material: string;
  sizes: string[];
  badge?: string;
  description: string;
}

const images = [productLinenShirt, productTee, productTrousers, productTote];

const names = [
  "Oversized Linen Shirt", "Essential Organic Tee", "Wide Leg Trousers", "Canvas Market Tote",
  "Relaxed Chino Pants", "Cropped Cardigan", "Linen Midi Dress", "Utility Jacket",
  "Ribbed Tank Top", "Pleated Midi Skirt", "Denim Overshirt", "Wool Blend Coat",
  "Drawstring Shorts", "Boxy Crop Top", "Tailored Blazer", "Slip Dress",
  "Cargo Pants", "Mock Neck Sweater", "Wrap Blouse", "High-Rise Jeans",
  "Puffer Vest", "Linen Jumpsuit", "Bucket Hat", "Woven Belt",
  "Scoop Neck Bodysuit", "Relaxed Hoodie", "Paperbag Shorts", "Cotton Polo",
  "Knit Beanie", "Leather Crossbody Bag"
];

const colors = [
  { name: "Sage Green", hex: "#8BA888" }, { name: "Off White", hex: "#F5F0E8" },
  { name: "Terracotta", hex: "#C2654A" }, { name: "Natural", hex: "#E8DCC8" },
  { name: "Charcoal", hex: "#3A3632" }, { name: "Oat", hex: "#D4C9B0" },
  { name: "Dusty Rose", hex: "#C4A4A0" }, { name: "Slate Blue", hex: "#7A8B99" },
];

const materials = ["Organic Cotton", "Recycled Polyester", "Linen", "Hemp Blend", "Tencel"];
const categories = ["Tops", "Bottoms", "Dresses", "Outerwear", "Accessories"];
const sizes = ["XS", "S", "M", "L", "XL", "XXL"];

export const products: Product[] = names.map((name, i) => {
  const color = colors[i % colors.length];
  return {
    id: `prod-${i + 1}`,
    name,
    price: [89, 45, 110, 38, 78, 95, 125, 165, 35, 98, 120, 220, 65, 42, 195, 135, 88, 115, 72, 140, 155, 130, 32, 28, 48, 85, 58, 55, 30, 175][i],
    image: images[i % images.length],
    category: categories[i % categories.length],
    color: color.name,
    colorHex: color.hex,
    material: materials[i % materials.length],
    sizes: sizes.slice(0, 4 + (i % 3)),
    badge: i < 3 ? "New" : i === 5 ? "Low Stock" : i === 8 ? "Bestseller" : undefined,
    description: `Crafted from premium ${materials[i % materials.length].toLowerCase()}, this ${name.toLowerCase()} features a relaxed silhouette perfect for everyday wear. Sustainably made with care for the planet.`,
  };
});
