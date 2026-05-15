import React from 'react';
import { useLocation } from 'react-router-dom';
import { ProductsPage } from '../components/ProductsPage';

export const ProductsPageRoute: React.FC = () => {
  const location = useLocation();
  const initialTab = location.state?.initialTab as 'store' | 'bakery' | undefined;
  
  return <ProductsPage initialViewMode={initialTab || 'store'} />;
};
