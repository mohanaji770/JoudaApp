import React, { useState, useEffect, useCallback, useRef } from 'react';
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
  const [isPaused, setIsPaused] = useState(false);
  const [touchStart, setTouchStart] = useState<number | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);

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

  // Auto-rotate every 5s unless paused
  useEffect(() => {
    if (banners.length <= 1 || isPaused) return;
    const timer = setInterval(() => {
      setCurrentIndex(prev => (prev + 1) % banners.length);
    }, 5000);
    return () => clearInterval(timer);
  }, [banners.length, isPaused]);

  const goTo = useCallback((index: number) => {
    setCurrentIndex(index);
  }, []);

  const goNext = useCallback(() => {
    setCurrentIndex(prev => (prev + 1) % banners.length);
  }, [banners.length]);

  const goPrev = useCallback(() => {
    setCurrentIndex(prev => (prev - 1 + banners.length) % banners.length);
  }, [banners.length]);

  // Touch swipe support
  const handleTouchStart = (e: React.TouchEvent) => {
    setTouchStart(e.touches[0].clientX);
    setIsPaused(true);
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    if (touchStart === null) return;
    const diff = touchStart - e.changedTouches[0].clientX;
    if (Math.abs(diff) > 50) {
      if (diff > 0) goNext();
      else goPrev();
    }
    setTouchStart(null);
    setTimeout(() => setIsPaused(false), 3000);
  };

  if (!isLoaded || banners.length === 0) return null;

  const banner = banners[currentIndex];

  const handleClick = () => {
    if (banner.link_url) {
      window.open(banner.link_url, '_blank', 'noopener');
    }
  };

  return (
    <div
      ref={containerRef}
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
      style={{ marginBottom: 20, position: 'relative' }}
    >
      {/* Banner Container */}
      <div
        onClick={handleClick}
        role={banner.link_url ? 'link' : undefined}
        style={{
          position: 'relative',
          width: '100%',
          borderRadius: 16,
          overflow: 'hidden',
          cursor: banner.link_url ? 'pointer' : 'default',
          aspectRatio: '2.4 / 1',
          background: 'linear-gradient(135deg, #f8fafc, #e2e8f0)',
        }}
      >
        {/* Image with fade transition */}
        {banners.map((b, i) => (
          <img
            key={b.id}
            src={b.image_url}
            alt={b.title || 'إعلان'}
            style={{
              position: 'absolute',
              inset: 0,
              width: '100%',
              height: '100%',
              objectFit: 'cover',
              opacity: i === currentIndex ? 1 : 0,
              transition: 'opacity 0.5s ease-in-out',
              pointerEvents: 'none',
            }}
            loading={i === 0 ? 'eager' : 'lazy'}
          />
        ))}

        {/* Title overlay — subtle gradient at bottom */}
        {banner.title && (
          <div style={{
            position: 'absolute',
            bottom: 0,
            left: 0,
            right: 0,
            padding: '24px 16px 12px',
            background: 'linear-gradient(to top, rgba(0,0,0,0.45), transparent)',
          }}>
            <p style={{
              margin: 0,
              color: '#fff',
              fontSize: '0.8125rem',
              fontWeight: 700,
              textShadow: '0 1px 3px rgba(0,0,0,0.3)',
              lineHeight: 1.4,
            }}>
              {banner.title}
            </p>
          </div>
        )}
      </div>

      {/* Dots — below the banner */}
      {banners.length > 1 && (
        <div style={{
          display: 'flex',
          justifyContent: 'center',
          gap: 5,
          marginTop: 8,
        }}>
          {banners.map((_, i) => (
            <button
              key={i}
              onClick={() => goTo(i)}
              aria-label={`الإعلان ${i + 1}`}
              style={{
                width: i === currentIndex ? 18 : 6,
                height: 6,
                borderRadius: 3,
                border: 'none',
                background: i === currentIndex
                  ? 'var(--brand-color, #dc2626)'
                  : '#d1d5db',
                cursor: 'pointer',
                padding: 0,
                transition: 'all 0.3s ease',
              }}
            />
          ))}
        </div>
      )}
    </div>
  );
};
