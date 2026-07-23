import React, { createContext, useContext, useState, useCallback } from 'react';

const SHIFT_STORAGE_KEY = 'foodatm_active_shift';

interface ShiftContextType {
  currentShift: number | null;
  setShift: (shift: number) => void;
  endShift: () => void;
}

const ShiftContext = createContext<ShiftContextType | undefined>(undefined);

export const ShiftProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [currentShift, setCurrentShift] = useState<number | null>(() => {
    const stored = localStorage.getItem(SHIFT_STORAGE_KEY);
    if (stored) {
      const parsed = parseInt(stored, 10);
      return isNaN(parsed) ? null : parsed;
    }
    return null;
  });

  const setShift = useCallback((shift: number) => {
    localStorage.setItem(SHIFT_STORAGE_KEY, String(shift));
    setCurrentShift(shift);
  }, []);

  const endShift = useCallback(() => {
    localStorage.removeItem(SHIFT_STORAGE_KEY);
    setCurrentShift(null);
  }, []);

  return (
    <ShiftContext.Provider value={{ currentShift, setShift, endShift }}>
      {children}
    </ShiftContext.Provider>
  );
};

export const useShift = (): ShiftContextType => {
  const context = useContext(ShiftContext);
  if (!context) {
    throw new Error('useShift must be used within a ShiftProvider');
  }
  return context;
};
