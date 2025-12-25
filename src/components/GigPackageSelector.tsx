'use client';

import { Check } from 'lucide-react';
import { GigPackage } from '@/types';
import { useState } from 'react';

interface GigPackageSelectorProps {
  packages: GigPackage[];
  selectedPackageId?: string;
  onSelect: (packageId: string, packageData: GigPackage) => void;
}

export default function GigPackageSelector({
  packages,
  selectedPackageId,
  onSelect,
}: GigPackageSelectorProps) {
  const [selected, setSelected] = useState(selectedPackageId);

  // Sort packages by tier
  const sortedPackages = [...packages].sort((a, b) => {
    const tierOrder = { basic: 1, standard: 2, premium: 3 };
    return (tierOrder[a.tier as keyof typeof tierOrder] || 0) - 
           (tierOrder[b.tier as keyof typeof tierOrder] || 0);
  });

  const handleSelect = (pkg: GigPackage) => {
    setSelected(pkg.id);
    onSelect(pkg.id, pkg);
  };

  if (sortedPackages.length === 0) {
    return (
      <div className="text-center py-8 text-gray-500">
        No packages available
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
      {sortedPackages.map((pkg) => (
        <div
          key={pkg.id}
          className={`border rounded-lg p-6 cursor-pointer transition-all ${
            selected === pkg.id
              ? 'border-brand-green bg-brand-green/5 shadow-md'
              : 'border-gray-200 hover:border-brand-green/50 hover:shadow'
          }`}
          onClick={() => handleSelect(pkg)}
        >
          {/* Tier Badge */}
          <div className="mb-4">
            <span
              className={`inline-block px-3 py-1 rounded-full text-sm font-semibold ${
                pkg.tier === 'basic'
                  ? 'bg-gray-100 text-gray-700'
                  : pkg.tier === 'standard'
                  ? 'bg-blue-100 text-blue-700'
                  : 'bg-purple-100 text-purple-700'
              }`}
            >
              {pkg.tier.charAt(0).toUpperCase() + pkg.tier.slice(1)}
            </span>
          </div>

          {/* Package Name */}
          <h3 className="text-xl font-bold text-gray-900 mb-2">{pkg.name}</h3>

          {/* Description */}
          {pkg.description && (
            <p className="text-sm text-gray-600 mb-4">{pkg.description}</p>
          )}

          {/* Price */}
          <div className="mb-4">
            <span className="text-3xl font-bold text-gray-900">
              LKR {pkg.price.toLocaleString()}
            </span>
          </div>

          {/* Delivery Time */}
          <div className="mb-4 text-sm text-gray-600">
            <span className="font-semibold">Delivery:</span> {pkg.deliveryDays} day
            {pkg.deliveryDays !== 1 ? 's' : ''}
          </div>

          {/* Revisions */}
          <div className="mb-4 text-sm text-gray-600">
            <span className="font-semibold">Revisions:</span>{' '}
            {pkg.revisions === null ? 'Unlimited' : pkg.revisions}
          </div>

          {/* Features */}
          {pkg.features && pkg.features.length > 0 && (
            <div className="space-y-2 mb-6">
              {pkg.features.map((feature, index) => (
                <div key={index} className="flex items-start">
                  <Check className="h-5 w-5 text-brand-green mr-2 flex-shrink-0 mt-0.5" />
                  <span className="text-sm text-gray-700">{feature}</span>
                </div>
              ))}
            </div>
          )}

          {/* Select Button */}
          <button
            type="button"
            className={`w-full py-3 px-4 rounded-lg font-semibold transition-colors ${
              selected === pkg.id
                ? 'bg-brand-green text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
            onClick={(e) => {
              e.stopPropagation();
              handleSelect(pkg);
            }}
          >
            {selected === pkg.id ? 'Selected' : 'Select'}
          </button>
        </div>
      ))}
    </div>
  );
}

