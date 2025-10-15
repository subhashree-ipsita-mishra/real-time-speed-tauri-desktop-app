import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface SelectionStore {
  selectedView: string;
  setSelectedView: (view: string) => void;
}

export const useSelectionStore = create<SelectionStore>()(
  persist(
    (set) => ({
      selectedView: 'all',
      setSelectedView: (view: string) => set({ selectedView: view }),
    }),
    {
      name: 'selection-storage', // name of the item in the storage (must be unique)
      partialize: (state) => ({ selectedView: state.selectedView }), // only persist selectedView
    }
  )
);