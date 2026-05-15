import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { getFavorites, saveFavorite, removeFavorite } from '../services/db';

interface FavoritesContextType {
  favorites: string[]; // Store product IDs
  toggleFavorite: (productId: string) => void;
  isFavorite: (productId: string) => boolean;
  isLoading: boolean;
}

const FavoritesContext = createContext<FavoritesContextType | undefined>(undefined);

export const FavoritesProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [favorites, setFavorites] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Load favorites from IndexedDB on mount
  useEffect(() => {
    const loadFavorites = async () => {
      try {
        const favs = await getFavorites();
        setFavorites(favs);
      } catch (e) {
        console.warn('Failed to load favorites from IndexedDB', e);
        // Fallback to localStorage for migration
        try {
          const legacy = localStorage.getItem('jouda_favorites_v1');
          if (legacy) {
            const parsed = JSON.parse(legacy);
            setFavorites(parsed);
            // Migrate to IndexedDB
            for (const id of parsed) {
              await saveFavorite(id);
            }
            localStorage.removeItem('jouda_favorites_v1');
          }
        } catch (e2) {}
      } finally {
        setIsLoading(false);
      }
    };
    loadFavorites();
  }, []);

  const toggleFavorite = async (productId: string) => {
    const isCurrentlyFav = favorites.includes(productId);

    if (isCurrentlyFav) {
      setFavorites((prev) => prev.filter((id) => id !== productId));
      try {
        await removeFavorite(productId);
      } catch (e) {
        console.warn('Failed to remove favorite', e);
      }
    } else {
      setFavorites((prev) => [...prev, productId]);
      try {
        await saveFavorite(productId);
      } catch (e) {
        console.warn('Failed to save favorite', e);
      }
    }
  };

  const isFavorite = (productId: string) => favorites.includes(productId);

  return (
    <FavoritesContext.Provider value={{ favorites, toggleFavorite, isFavorite, isLoading }}>
      {children}
    </FavoritesContext.Provider>
  );
};

export const useFavorites = () => {
  const context = useContext(FavoritesContext);
  if (!context) throw new Error('useFavorites must be used within FavoritesProvider');
  return context;
};
