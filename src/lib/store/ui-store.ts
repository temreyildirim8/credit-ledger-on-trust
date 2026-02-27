import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";

/**
 * UI Store - Global UI state management with localStorage persistence
 *
 * This store manages:
 * - Sidebar collapse state
 * - Tour completion status
 *
 * Uses Zustand's persist middleware to automatically sync with localStorage
 */

interface UIState {
  // Sidebar state
  sidebarCollapsed: boolean;
  setSidebarCollapsed: (collapsed: boolean) => void;
  toggleSidebar: () => void;

  // Tour state
  tourCompleted: boolean;
  setTourCompleted: (completed: boolean) => void;
  resetTour: () => void;
}

export const useUIStore = create<UIState>()(
  persist(
    (set) => ({
      // Sidebar - default expanded (false = not collapsed)
      sidebarCollapsed: false,
      setSidebarCollapsed: (collapsed) => set({ sidebarCollapsed: collapsed }),
      toggleSidebar: () => set((state) => ({ sidebarCollapsed: !state.sidebarCollapsed })),

      // Tour - default not completed
      tourCompleted: false,
      setTourCompleted: (completed) => set({ tourCompleted: completed }),
      resetTour: () => set({ tourCompleted: false }),
    }),
    {
      name: "ledgerly-ui-storage", // localStorage key
      storage: createJSONStorage(() => localStorage),
      // Only persist specific fields
      partialize: (state) => ({
        sidebarCollapsed: state.sidebarCollapsed,
        tourCompleted: state.tourCompleted,
      }),
    }
  )
);

// Selectors for optimized re-renders
export const useSidebarCollapsed = () => useUIStore((state) => state.sidebarCollapsed);
export const useTourCompleted = () => useUIStore((state) => state.tourCompleted);
