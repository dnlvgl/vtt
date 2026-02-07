import { create } from "zustand";
import type { WhiteboardObject } from "@vtt/shared";

interface CanvasState {
  objects: Record<string, WhiteboardObject>;
  selectedId: string | null;

  setObjects: (objects: WhiteboardObject[]) => void;
  addObject: (object: WhiteboardObject) => void;
  updateObject: (object: WhiteboardObject) => void;
  removeObject: (id: string) => void;
  setSelectedId: (id: string | null) => void;
}

export const useCanvasStore = create<CanvasState>((set) => ({
  objects: {},
  selectedId: null,

  setObjects: (objects) =>
    set({
      objects: Object.fromEntries(objects.map((o) => [o.id, o])),
    }),
  addObject: (object) =>
    set((s) => ({ objects: { ...s.objects, [object.id]: object } })),
  updateObject: (object) =>
    set((s) => ({ objects: { ...s.objects, [object.id]: object } })),
  removeObject: (id) =>
    set((s) => {
      const { [id]: _, ...rest } = s.objects;
      return { objects: rest, selectedId: s.selectedId === id ? null : s.selectedId };
    }),
  setSelectedId: (id) => set({ selectedId: id }),
}));
