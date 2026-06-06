import React, { useState, useMemo } from 'react';
import { Product } from '../../services/supabaseService';
import { PackageList } from './packages/PackageList';
import { PackageForm } from './packages/PackageForm';
import { Plus } from 'lucide-react';

interface PackageManagerProps {
  products: Product[];
  showSuccess: (msg: string) => void;
  showError: (msg: string) => void;
  loadData: () => Promise<void>;
  loading: boolean;
  setLoading: React.Dispatch<React.SetStateAction<boolean>>;
}

export const PackageManager: React.FC<PackageManagerProps> = ({
  products,
  showSuccess,
  showError,
  loadData,
  loading,
  setLoading
}) => {
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingPackage, setEditingPackage] = useState<Product | null>(null);

  // Filter only packages
  const packages = useMemo(() => {
    return products.filter(p => p.category === 'عروض وبكجات' || p.barcode.startsWith('PKG-'));
  }, [products]);

  const handleCreateNew = () => {
    setEditingPackage(null);
    setIsFormOpen(true);
  };

  const handleEdit = (pkg: Product) => {
    setEditingPackage(pkg);
    setIsFormOpen(true);
  };

  const handleCloseForm = () => {
    setIsFormOpen(false);
    setEditingPackage(null);
  };

  return (
    <div className="space-y-6">
      {/* Header section when in list view */}
      {!isFormOpen && (
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 p-4 rounded-3xl">
          <div>
            <h2 className="font-black text-gray-900 dark:text-white text-sm">إدارة الباكجات والعروض</h2>
            <p className="text-[10px] text-gray-500 font-bold mt-1">عرض وتعديل بكجات التوفير للعملاء ({packages.length})</p>
          </div>
          <button
            onClick={handleCreateNew}
            className="w-full sm:w-auto bg-brand-600 hover:bg-brand-700 text-white px-5 py-2.5 rounded-xl text-xs font-bold flex items-center justify-center gap-2 transition-all shadow-md active:scale-95"
          >
            <Plus className="w-4 h-4" />
            <span>بكج توفيري جديد</span>
          </button>
        </div>
      )}

      {/* Main Content Area */}
      {isFormOpen ? (
        <PackageForm
          products={products}
          editingPackage={editingPackage}
          onClose={handleCloseForm}
          showSuccess={showSuccess}
          showError={showError}
          loadData={loadData}
          loading={loading}
          setLoading={setLoading}
        />
      ) : (
        <PackageList
          packages={packages}
          onEdit={handleEdit}
          showSuccess={showSuccess}
          showError={showError}
          loadData={loadData}
          setLoading={setLoading}
        />
      )}
    </div>
  );
};
