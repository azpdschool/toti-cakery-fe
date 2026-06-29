export interface Product {
  id: string;
  slug: string;
  name: string;
  category: string;
  description: string;
  image: string;
  price: number;        // harga terendah
  rating: number;
  soldCount: number;
  featured: boolean;    // dari isFeatured
}