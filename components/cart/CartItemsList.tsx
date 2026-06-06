import React from 'react';
import { ShoppingBag } from 'lucide-react';
import { CartItemRow } from './CartItemRow';

interface CartItemsListProps {
  items: any[];
  cachedProducts: any[];
  totalItems: number;
  bouncingItemId: string | null;
  handleIncrease: (name: string, id: string) => void;
  handleDecrease: (id: string) => void;
  handleRemove: (id: string) => void;
}

export const CartItemsList: React.FC<CartItemsListProps> = ({
  items,
  cachedProducts,
  totalItems,
  bouncingItemId,
  handleIncrease,
  handleDecrease,
  handleRemove
}) => (
  <section className="mb-4">
    <div className="w-full flex items-center justify-between mb-2 py-1">
      <h3 className="text-sm font-bold text-gray-800 dark:text-gray-100 flex items-center gap-2">
        <ShoppingBag className="w-4 h-4 text-brand-600" />
        المنتجات ({totalItems})
      </h3>
    </div>

    <div className="space-y-2 px-1.5 py-1.5 pb-2">
      {items.map((item) => (
        <CartItemRow
          key={item.id}
          item={item}
          cachedProducts={cachedProducts}
          bouncingItemId={bouncingItemId}
          handleIncrease={handleIncrease}
          handleDecrease={handleDecrease}
          handleRemove={handleRemove}
        />
      ))}
    </div>
  </section>
);
