export type Money = {
  amount: string;
  currencyCode: string;
};

export type Image = {
  url: string;
  altText: string;
  width: number;
  height: number;
  storageKey?: string;
};

export type ProductOption = {
  id: string;
  name: string;
  values: string[];
};

export type ProductVariant = {
  parentId: string;
  id: string;
  title: string;
  availableForSale: boolean;
  inventoryQuantity: number;
  selectedOptions: {
    name: string;
    value: string;
  }[];
  price: Money;
  compareAtPrice: Money;
};

export type Product = {
  id: string;
  handle: string;
  availableForSale: boolean;
  title: string;
  description: string;
  descriptionHtml: string;
  options: ProductOption[];
  priceRange: {
    maxVariantPrice: Money;
    minVariantPrice: Money;
    maxCompareAtPrice: Money;
    minCompareAtPrice: Money;
  };
  variants: ProductVariant[];
  featuredImage: Image;
  images: Image[];
  seo: {
    title: string;
    description: string;
  };
  tags: string[];
  updatedAt: string;
  collectionHandles: string[];
  productType: string;
  material: string;
  colors: string[];
  sizes: string[];
};

export type Collection = {
  handle: string;
  title: string;
  description: string;
  seo: {
    title: string;
    description: string;
  };
  updatedAt: string;
  path: string;
  hidden?: boolean;
};

export type MenuItem = {
  title: string;
  path: string;
};

export type StorePage = {
  id: string;
  title: string;
  handle: string;
  body: string;
  bodySummary: string;
  seo: {
    title: string;
    description: string;
  };
  createdAt: string;
  updatedAt: string;
};

export type CartLine = {
  variantId: string;
  quantity: number;
};

export type CartItem = {
  id: string;
  quantity: number;
  cost: {
    totalAmount: Money;
  };
  merchandise: {
    id: string;
    title: string;
    selectedOptions: ProductVariant['selectedOptions'];
    product: Product;
  };
};

export type Cart = {
  id: string;
  checkoutUrl: string;
  cost: {
    subtotalAmount: Money;
    totalAmount: Money;
    totalTaxAmount: Money;
  };
  lines: CartItem[];
  totalQuantity: number;
};
