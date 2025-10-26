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
}

export default function SriLankaMap({ 
  onDistrictSelect, 
  selectedDistrictId, 
  showLabels = true,
  className = '' 
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

  const getDistrictColor = (district: District) => {
    if (selectedDistrictId === district.id) {
      return '#3b82f6'; // Blue for selected
    }
    if (hoveredDistrict === district.id) {
      return '#60a5fa'; // Light blue for hover
    }
    if (district.popular) {
      return '#10b981'; // Green for popular districts
    }
    return '#e5e7eb'; // Gray for regular districts
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
      <div className="relative bg-gradient-to-br from-blue-50 to-green-50 rounded-2xl p-8 shadow-lg">
        {/* Title */}
        <div className="text-center mb-6">
          <h2 className="text-2xl font-bold text-gray-900 mb-2 animate-fade-in-up">
            {t('title')}
          </h2>
          <p className="text-gray-600 animate-fade-in-up" style={{ animationDelay: '200ms' }}>
            {t('subtitle')}
          </p>
        </div>

        {/* Map SVG */}
        <div className="flex justify-center">
          <svg
            viewBox="0 0 400 400"
            className="w-full max-w-md h-auto transition-all duration-500 hover:scale-105"
            style={{ filter: 'drop-shadow(0 10px 25px rgba(0, 0, 0, 0.1))' }}
          >
            {/* Background */}
            <rect
              width="400"
              height="400"
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
                  className={`cursor-pointer transition-all duration-300 hover:filter hover:drop-shadow-lg ${
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
                    className="text-xs font-medium fill-gray-700 pointer-events-none"
                    style={{ 
                      fontSize: district.popular ? '10px' : '8px',
                      fontWeight: district.popular ? 'bold' : 'normal'
                    }}
                  >
                    {getDistrictName(district)}
                  </text>
                )}

                {/* Popular District Indicator */}
                {district.popular && (
                  <circle
                    cx={district.center.x + 15}
                    cy={district.center.y - 10}
                    r="3"
                    fill="#f59e0b"
                    className="animate-pulse"
                  />
                )}
              </g>
            ))}

            {/* Legend */}
            <g transform="translate(20, 350)">
              <rect width="160" height="40" fill="white" fillOpacity="0.9" rx="8" />
              <text x="10" y="15" className="text-xs font-semibold fill-gray-800">
                {t('legend.title')}
              </text>
              <circle cx="15" cy="28" r="4" fill="#10b981" />
              <text x="25" y="32" className="text-xs fill-gray-600">
                {t('legend.popular')}
              </text>
              <circle cx="80" cy="28" r="4" fill="#e5e7eb" />
              <text x="90" y="32" className="text-xs fill-gray-600">
                {t('legend.regular')}
              </text>
              <circle cx="140" cy="28" r="4" fill="#3b82f6" />
              <text x="150" y="32" className="text-xs fill-gray-600">
                {t('legend.selected')}
              </text>
            </g>
          </svg>
        </div>

        {/* Selected District Info */}
        {selectedDistrictId && (
          <div className="mt-6 p-4 bg-white rounded-lg shadow-md animate-fade-in-up">
            {(() => {
              const district = districts.find(d => d.id === selectedDistrictId);
              if (!district) return null;
              
              return (
                <div className="text-center">
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">
                    {getDistrictName(district)}
                  </h3>
                  <div className="grid grid-cols-2 gap-4 text-sm text-gray-600">
                    <div>
                      <span className="font-medium">{t('info.population')}:</span>
                      <br />
                      {district.population.toLocaleString()}
                    </div>
                    <div>
                      <span className="font-medium">{t('info.area')}:</span>
                      <br />
                      {district.area.toLocaleString()} km²
                    </div>
                  </div>
                  <div className="mt-3">
                    <span className="font-medium text-gray-700">{t('info.services')}:</span>
                    <div className="flex flex-wrap gap-1 mt-1 justify-center">
                      {district.services.slice(0, 5).map((service) => (
                        <span
                          key={service}
                          className="px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded-full"
                        >
                          {service.replace('-', ' ')}
                        </span>
                      ))}
                      {district.services.length > 5 && (
                        <span className="px-2 py-1 bg-gray-100 text-gray-600 text-xs rounded-full">
                          +{district.services.length - 5} more
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              );
            })()}
          </div>
        )}

        {/* Instructions */}
        <div className="mt-4 text-center">
          <p className="text-sm text-gray-500 animate-fade-in-up" style={{ animationDelay: '400ms' }}>
            {t('instructions')}
          </p>
        </div>
      </div>
    </div>
  );
}
