'use client';

import { createContext, useContext, useState, ReactNode } from 'react';
import { District } from '@/data/districts';

interface DistrictContextType {
  selectedDistrict: District | null;
  setSelectedDistrict: (district: District | null) => void;
  clearSelection: () => void;
}

const DistrictContext = createContext<DistrictContextType | undefined>(undefined);

export function DistrictProvider({ children }: { children: ReactNode }) {
  const [selectedDistrict, setSelectedDistrict] = useState<District | null>(null);

  const clearSelection = () => {
    setSelectedDistrict(null);
  };

  return (
    <DistrictContext.Provider
      value={{
        selectedDistrict,
        setSelectedDistrict,
        clearSelection,
      }}
    >
      {children}
    </DistrictContext.Provider>
  );
}

export function useDistrict() {
  const context = useContext(DistrictContext);
  if (context === undefined) {
    throw new Error('useDistrict must be used within a DistrictProvider');
  }
  return context;
}
