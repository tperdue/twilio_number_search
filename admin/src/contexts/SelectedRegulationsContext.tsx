import { createContext, useContext, useState, useCallback, ReactNode } from 'react';

interface SelectedRegulationsContextType {
  selectedRegulations: Map<string, Set<string>>; // Map<countryCode, Set<regulationSid>>
  addRegulation: (countryCode: string, regulationSid: string) => void;
  removeRegulation: (countryCode: string, regulationSid: string) => void;
  clearCountry: (countryCode: string) => void;
  clearAll: () => void;
  getSelectedCount: () => number;
  getSelectedByCountry: () => Array<{ countryCode: string; count: number }>;
  getAllSelectedSids: () => string[];
  isSelected: (countryCode: string, regulationSid: string) => boolean;
}

const SelectedRegulationsContext = createContext<SelectedRegulationsContextType | undefined>(undefined);

export function SelectedRegulationsProvider({ children }: { children: ReactNode }) {
  const [selectedRegulations, setSelectedRegulations] = useState<Map<string, Set<string>>>(new Map());

  const addRegulation = useCallback((countryCode: string, regulationSid: string) => {
    setSelectedRegulations((prev) => {
      const newMap = new Map(prev);
      const countrySet = newMap.get(countryCode) || new Set<string>();
      countrySet.add(regulationSid);
      newMap.set(countryCode, countrySet);
      return newMap;
    });
  }, []);

  const removeRegulation = useCallback((countryCode: string, regulationSid: string) => {
    setSelectedRegulations((prev) => {
      const newMap = new Map(prev);
      const countrySet = newMap.get(countryCode);
      if (countrySet) {
        countrySet.delete(regulationSid);
        if (countrySet.size === 0) {
          newMap.delete(countryCode);
        } else {
          newMap.set(countryCode, countrySet);
        }
      }
      return newMap;
    });
  }, []);

  const clearCountry = useCallback((countryCode: string) => {
    setSelectedRegulations((prev) => {
      const newMap = new Map(prev);
      newMap.delete(countryCode);
      return newMap;
    });
  }, []);

  const clearAll = useCallback(() => {
    setSelectedRegulations(new Map());
  }, []);

  const getSelectedCount = useCallback(() => {
    let total = 0;
    selectedRegulations.forEach((set) => {
      total += set.size;
    });
    return total;
  }, [selectedRegulations]);

  const getSelectedByCountry = useCallback(() => {
    const result: Array<{ countryCode: string; count: number }> = [];
    selectedRegulations.forEach((set, countryCode) => {
      result.push({ countryCode, count: set.size });
    });
    return result;
  }, [selectedRegulations]);

  const getAllSelectedSids = useCallback(() => {
    const allSids: string[] = [];
    selectedRegulations.forEach((set) => {
      set.forEach((sid) => allSids.push(sid));
    });
    return allSids;
  }, [selectedRegulations]);

  const isSelected = useCallback((countryCode: string, regulationSid: string) => {
    const countrySet = selectedRegulations.get(countryCode);
    return countrySet ? countrySet.has(regulationSid) : false;
  }, [selectedRegulations]);

  return (
    <SelectedRegulationsContext.Provider
      value={{
        selectedRegulations,
        addRegulation,
        removeRegulation,
        clearCountry,
        clearAll,
        getSelectedCount,
        getSelectedByCountry,
        getAllSelectedSids,
        isSelected,
      }}
    >
      {children}
    </SelectedRegulationsContext.Provider>
  );
}

export function useSelectedRegulations() {
  const context = useContext(SelectedRegulationsContext);
  if (context === undefined) {
    throw new Error('useSelectedRegulations must be used within a SelectedRegulationsProvider');
  }
  return context;
}



