import { Product } from '../services/supabaseService';

export interface StockIssue {
  productName: string;
  requestedQuantity: number;
  availableQuantity: number;
}

export const isQuantityLimited = (product?: Pick<Product, 'inStock' | 'stock_quantity' | 'force_out_of_stock'> | null): boolean => {
  if (!product || product.force_out_of_stock || product.inStock === false) return true;
  return typeof product.stock_quantity === 'number';
};

export const getAvailableQuantity = (product?: Pick<Product, 'inStock' | 'stock_quantity' | 'force_out_of_stock'> | null): number | null => {
  if (!product) return null;
  if (product.force_out_of_stock || product.inStock === false) return 0;
  return typeof product.stock_quantity === 'number' ? Math.max(0, Math.floor(product.stock_quantity)) : null;
};

export const canAddQuantity = (
  product: Pick<Product, 'inStock' | 'stock_quantity' | 'force_out_of_stock'> | null | undefined,
  currentQuantity: number
): boolean => {
  const availableQuantity = getAvailableQuantity(product);
  return availableQuantity === null || currentQuantity < availableQuantity;
};

export const getLowStockLabel = (
  product: Pick<Product, 'inStock' | 'stock_quantity' | 'force_out_of_stock'> | null | undefined,
  threshold = 5
): string | null => {
  const availableQuantity = getAvailableQuantity(product);
  if (availableQuantity === null || availableQuantity <= 0 || availableQuantity > threshold) return null;
  return `باقي ${availableQuantity} فقط`;
};

export const getCartStockIssue = (
  item: { name: string; quantity: number },
  product?: Pick<Product, 'name' | 'inStock' | 'stock_quantity' | 'force_out_of_stock'> | null
): StockIssue | null => {
  const availableQuantity = getAvailableQuantity(product);
  if (availableQuantity === null || item.quantity <= availableQuantity) return null;

  return {
    productName: product?.name || item.name,
    requestedQuantity: item.quantity,
    availableQuantity,
  };
};

export const formatStockIssueMessage = (issue: StockIssue): string => {
  if (issue.availableQuantity <= 0) {
    return `${issue.productName} غير متوفر حالياً`;
  }

  return `${issue.productName}: طلبت ${issue.requestedQuantity}، المتاح ${issue.availableQuantity} فقط`;
};
