import React, { useState, useEffect, useCallback } from 'react';
import { supabase } from '../services/supabaseClient';

interface Banner {
  id: string;
  title: string;
  image_url: string;
  link_url: string;
  sort_order: number;
  is_active: boolean;
}

export const PromoBanner: React.FC = () => {
  const [banners, setBanners] = useState<Banner[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    const fetchBanners = async () => {
      try {
        const { data, error } = await supabase
          .from('banners')
          .select('*')
          .eq('is_active', true)
          .order('sort_order', { ascending: true });

        if (!error && data && data.length > 0) {
          setBanners(data);
          setIsLoaded(true);
        }
      } catch (err) {
        console.warn('PromoBanner: Failed to fetch banners', err);
      }
    };

    fetchBanners();
  }, []);

  // Auto-rotate banners every 5 seconds
  useEffect(() => {
    if (banners.length <= 1) return;
    const timer = setInterval(() => {
      setCurrentIndex(prev => (prev + 1) % banners.length);
    }, 5000);
    return () => clearInterval(timer);
  }, [banners.length]);

  const goTo = useCallback((index: number) => {
    setCurrentIndex(index);
  }, []);

  if (!isLoaded || banners.length === 0) return null;

  const banner = banners[currentIndex];

  const handleClick = () => {
    if (banner.link_url) {
      window.open(banner.link_url, '_blank', 'noopener');
    }
  };

  return (
    <div style={{ marginBottom: 24 }}>
      <div
        onClick={handleClick}
        role={banner.link_url ? 'link' : undefined}
        style={{
          position: 'relative',
          width: '100%',
          borderRadius: 20,
          overflow: 'hidden',
          cursor: banner.link_url ? 'pointer' : 'default',
          aspectRatio: '16 / 7',
          background: '#f1f5f9',
        }}
      >
        <img
          src={banner.image_url}
          alt={banner.title || 'إعلان'}
          style={{
            width: '100%',
            height: '100%',
            objectFit: 'cover',
            display: 'block',
            transition: 'opacity 0.4s ease',
          }}
          loading="lazy"
        />

        {/* Dots indicator */}
        {banners.length > 1 && (
          <div style={{
            position: 'absolute',
            bottom: 10,
            left: '50%',
            transform: 'translateX(-50%)',
            display: 'flex',
            gap: 6,
          }}>
            {banners.map((_, i) => (
              <button
                key={i}
                onClick={(e) => { e.stopPropagation(); goTo(i); }}
                aria-label={`الإعلان ${i + 1}`}
                style={{
                  width: i === currentIndex ? 20 : 8,
                  height: 8,
                  borderRadius: 4,
                  border: 'none',
                  background: i === currentIndex ? '#fff' : 'rgba(255,255,255,0.5)',
                  cursor: 'pointer',
                  padding: 0,
                  transition: 'all 0.3s ease',
                }}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
