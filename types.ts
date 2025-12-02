export interface Talent {
  id: string;
  name: string;
  niche: string;
  status: 'Active' | 'Inactive';
  joinDate: string;
}

export interface Account {
  id: string;
  talentId: string;
  talentName: string; // Denormalized for easier display
  platform: 'Instagram' | 'TikTok' | 'YouTube' | 'Shopee Video';
  username: string;
  followers: number;
}

export interface Product {
  id: string;
  name: string;
  link: string; // Added link
  accountId: string; // Linked to Account
  accountName: string; // Denormalized
  // Removed sku, price, category
}

export interface Post {
  id: string;
  talentId: string; // Added to track talent directly
  talentName: string; // Added
  accountId: string;
  accountName: string; // Denormalized
  productId: string;
  productName: string; // Denormalized
  date: string;
  views?: number; // Made optional
  likes?: number; // Made optional
  comments?: number; // Made optional
  link?: string; // Made optional
}

export interface Sale {
  id: string;
  type: 'Overall' | 'Product'; // Distinguish between aggregate stats and specific product sales
  date: string;
  
  // Context
  talentId: string;
  talentName: string;
  accountId: string;
  accountName: string;

  // For Product specific sales
  productId?: string;
  productName: string; // 'Keseluruhan' if type is Overall

  // Metrics
  revenue: number; // Omset / GMV
  commission: number; // Estimasi Komisi
  quantity: number; // Jumlah Terjual
  
  // Traffic Metrics (Mainly for Overall)
  views?: number; // Produk Dilihat
  clicks?: number; // Produk Diklik

  status: 'Pending' | 'Completed' | 'Cancelled';
}

// Collection Names as Constants to match user request
export const COLLECTIONS = {
  TALENTS: 'NAMA TALENT',
  ACCOUNTS: 'NAMA AKUN',
  PRODUCTS: 'DATA PRODUK',
  POSTS: 'DATA POSTINGAN',
  SALES: 'DATA PENJUALAN'
};