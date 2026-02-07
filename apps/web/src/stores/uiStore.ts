import { create } from "zustand";

interface UiState {
  sidebarOpen: boolean;
  sidebarPanel: "chat" | "pdf";
  pdfAssetId: string | null;

  toggleSidebar: () => void;
  setSidebarPanel: (panel: "chat" | "pdf") => void;
  openPdfViewer: (assetId: string) => void;
  closePdfViewer: () => void;
}

export const useUiStore = create<UiState>((set) => ({
  sidebarOpen: true,
  sidebarPanel: "chat",
  pdfAssetId: null,

  toggleSidebar: () => set((s) => ({ sidebarOpen: !s.sidebarOpen })),
  setSidebarPanel: (panel) => set({ sidebarPanel: panel }),
  openPdfViewer: (assetId) =>
    set({ pdfAssetId: assetId, sidebarPanel: "pdf", sidebarOpen: true }),
  closePdfViewer: () => set({ pdfAssetId: null, sidebarPanel: "chat" }),
}));
