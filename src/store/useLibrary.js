import { create } from "zustand";
const KEY = "dealLibrary.v1";
function load() {
    try {
        const j = JSON.parse(localStorage.getItem(KEY) || "null");
        if (Array.isArray(j))
            return j;
    }
    catch { }
    return [];
}
export const useLibrary = create((set, get) => ({
    items: load(),
    add: (d) => set(s => {
        const items = [d, ...s.items].slice(0, 200);
        localStorage.setItem(KEY, JSON.stringify(items));
        return { items };
    }),
    remove: (id) => set(s => {
        const items = s.items.filter(x => x.id !== id);
        localStorage.setItem(KEY, JSON.stringify(items));
        return { items };
    }),
    clear: () => {
        localStorage.setItem(KEY, JSON.stringify([]));
        set({ items: [] });
    },
    importJson: (json) => {
        try {
            const arr = JSON.parse(json);
            if (Array.isArray(arr)) {
                localStorage.setItem(KEY, JSON.stringify(arr));
                set({ items: arr });
            }
        }
        catch { }
    },
    exportJson: () => JSON.stringify(get().items, null, 2),
}));
