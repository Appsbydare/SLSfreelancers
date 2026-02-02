'use client';

import { useState, useEffect } from 'react';
import { useTranslations, useLocale } from 'next-intl';
import { districts, District } from '@/data/districts';
import { animationClasses } from '@/lib/animations';

interface SriLankaMapProps {
  onDistrictSelect?: (district: District) => void;
  selectedDistrictId?: string;
  showLabels?: boolean;
  className?: string;
  serviceCounts?: Record<string, number>;
}

export default function SriLankaMap({ 
  onDistrictSelect, 
  selectedDistrictId, 
  showLabels = true,
  className = '',
  serviceCounts = {}
}: SriLankaMapProps) {
  const t = useTranslations('homepage.map');
  const locale = useLocale();
  const [hoveredDistrict, setHoveredDistrict] = useState<string | null>(null);
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    // Trigger animation after component mounts
    const timer = setTimeout(() => setIsLoaded(true), 100);
    return () => clearTimeout(timer);
  }, []);

  const getDistrictName = (district: District) => {
    switch (locale) {
      case 'si':
        return district.nameSi;
      case 'ta':
        return district.nameTa;
      default:
        return district.name;
    }
  };

  const getMaxCount = () => {
    const counts = Object.values(serviceCounts);
    return counts.length > 0 ? Math.max(...counts) : 0;
  };

  const getDistrictColor = (district: District) => {
    if (selectedDistrictId === district.id) {
      return '#0fcc17'; // Brand green for selected
    }
    if (hoveredDistrict === district.id) {
      return '#0fcc17'; // Brand green for hover
    }
    
    // Dynamic coloring based on service counts
    const count = serviceCounts[district.name] || 0;
    const maxCount = getMaxCount();
    
    if (count > 0) {
      // Calculate opacity/intensity based on count relative to max
      // Use a minimum intensity so even 1 gig is visible green
      // Scale: Low (0) -> High (max) maps to Light Green -> Dark Green
      if (maxCount === 0) return '#e5e7eb';
      
      const intensity = count / maxCount;
      
      if (intensity > 0.7) return '#059669'; // High density (Dark Green)
      if (intensity > 0.3) return '#10b981'; // Medium density (Regular Green)
      return '#6ee7b7'; // Low density (Light Green)
    }

    if (district.popular) {
      // Fallback to static popular if no counts available or count is 0 but marked popular
      // but if we have counts, we probably trust them more. 
      // Let's keep popular flag as a secondary "promoted" indicator if needed, 
      // but for color, let's stick to gray if 0 services.
      // Actually, user said "dynamically adjust", so gray if 0 is correct.
      return '#e5e7eb'; 
    }
    return '#e5e7eb'; // Gray for no services
  };

  const getDistrictOpacity = (district: District) => {
    if (selectedDistrictId === district.id) {
      return 1;
    }
    if (hoveredDistrict === district.id) {
      return 0.8;
    }
    return 0.6;
  };

  const handleDistrictClick = (district: District) => {
    onDistrictSelect?.(district);
  };

  const handleDistrictHover = (districtId: string | null) => {
    setHoveredDistrict(districtId);
  };

  return (
    <div className={`relative ${className}`}>
      {/* Map Container */}
      <div className="relative bg-gradient-to-br from-brand-green/10 to-green-50 rounded-xl p-4">
        {/* Map SVG */}
        <div className="flex justify-center">
          <svg
            viewBox="0 0 800 1200"
            className="w-full max-w-2xl h-auto transition-all duration-500 hover:scale-[1.01]"
            style={{ filter: 'drop-shadow(0 10px 25px rgba(0, 0, 0, 0.1))' }}
          >
            {/* Background */}
            <rect
              width="800"
              height="1200"
              fill="url(#mapGradient)"
              className="animate-fade-in"
            />

            {/* Gradient Definition */}
            <defs>
              <linearGradient id="mapGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#f0f9ff" />
                <stop offset="100%" stopColor="#ecfdf5" />
              </linearGradient>
              
              {/* Hover effect filter */}
              <filter id="glow">
                <feGaussianBlur stdDeviation="3" result="coloredBlur"/>
                <feMerge> 
                  <feMergeNode in="coloredBlur"/>
                  <feMergeNode in="SourceGraphic"/>
                </feMerge>
              </filter>
            </defs>

            {/* District Paths */}
            {districts.map((district, index) => (
              <g key={district.id}>
                <path
                  d={district.coordinates}
                  fill={getDistrictColor(district)}
                  stroke="#ffffff"
                  strokeWidth="2"
                  opacity={getDistrictOpacity(district)}
                  className={`cursor-pointer transition-all duration-300 ${
                    isLoaded ? 'animate-fade-in-up' : 'opacity-0'
                  }`}
                  style={{ 
                    animationDelay: `${index * 50}ms`,
                    animationFillMode: 'both'
                  }}
                  onClick={() => handleDistrictClick(district)}
                  onMouseEnter={() => handleDistrictHover(district.id)}
                  onMouseLeave={() => handleDistrictHover(null)}
                />
                
                {/* District Labels */}
                {showLabels && (
                  <text
                    x={district.center.x}
                    y={district.center.y}
                    textAnchor="middle"
                    className="font-medium fill-gray-700 pointer-events-none"
                    style={{ 
                      fontSize: district.popular ? '18px' : '14px',
                      fontWeight: district.popular ? 'bold' : 'normal'
                    }}
                  >
                    {getDistrictName(district)}
                  </text>
                )}

                {/* Popular District Indicator */}
                {district.popular && (
                  <circle
                    cx={district.center.x + 30}
                    cy={district.center.y - 20}
                    r="6"
                    fill="#f59e0b"
                    className="animate-pulse"
                  />
                )}
              </g>
            ))}

            {/* Legend */}
            <g transform="translate(300, 1150)">
              <circle cx="10" cy="20" r="8" fill="#10b981" />
              <text x="25" y="28" className="text-sm fill-gray-600" style={{ fontSize: '16px' }}>
                {t('legend.popular')}
              </text>
              <circle cx="120" cy="20" r="8" fill="#e5e7eb" />
              <text x="135" y="28" className="text-sm fill-gray-600" style={{ fontSize: '16px' }}>
                {t('legend.regular')}
              </text>
              <circle cx="230" cy="20" r="8" fill="#0fcc17" />
              <text x="245" y="28" className="text-sm fill-gray-600" style={{ fontSize: '16px' }}>
                {t('legend.selected')}
              </text>
            </g>
          </svg>
        </div>

      </div>
    </div>
  );
}
