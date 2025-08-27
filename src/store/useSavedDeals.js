// src/store/useSavedDeals.ts
// Versioned, snapshotting saved deals (values + computed metrics) with:
// - Stable fingerprint de-dupe
// - Size cap & quota resilience
// - Stable sorting (newest first)
// - Import/Export JSON (replace or merge)
// No UI changes required. Existing code that reads `items` keeps working.
import { create } from "zustand";
import { computeMetricsWithRegion } from "../lib/metrics";
// -------------------------------
// Persistence
// -------------------------------
const STORAGE_KEY = "savedDeals.v1";
const MAX_ITEMS = 100; // cap to prevent runaway storage
// Generate ids that are stable and sortable
function newId() {
    const ts = Date.now().toString(36);
    const rnd = Math.random().toString(36).slice(2, 8);
    return `d_${ts}_${rnd}`;
}
// Stable stringify (sorted keys, deep) for de-dupe fingerprints
function stableStringify(x) {
    const seen = new WeakSet();
    const walk = (v) => {
        if (v === null || typeof v !== "object")
            return v;
        if (seen.has(v))
            return null;
        seen.add(v);
        if (Array.isArray(v))
            return v.map(walk);
        const out = {};
        for (const k of Object.keys(v).sort()) {
            out[k] = walk(v[k]);
        }
        return out;
    };
    try {
        return JSON.stringify(walk(x));
    }
    catch {
        try {
            return JSON.stringify(x);
        }
        catch {
            return String(x);
        }
    }
}
function fingerprintValues(values) {
    // Only the values determine identity, not name/timestamp
    return stableStringify(values);
}
function sortNewestFirst(items) {
    return items.slice().sort((a, b) => b.createdAt - a.createdAt);
}
function saveToStorage(items) {
    const toSave = sortNewestFirst(items).slice(0, MAX_ITEMS);
    try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(toSave));
    }
    catch {
        // Quota? prune oldest half and retry once
        try {
            const pruned = toSave.slice(0, Math.max(1, Math.floor(toSave.length / 2)));
            localStorage.setItem(STORAGE_KEY, JSON.stringify(pruned));
        }
        catch {
            // give up, but don't crash the app
        }
    }
}
function loadFromStorage() {
    try {
        const raw = localStorage.getItem(STORAGE_KEY);
        if (!raw)
            return migrateFromOlderKeys();
        const parsed = JSON.parse(raw);
        if (!Array.isArray(parsed))
            return [];
        // Ensure shape is correct + add fingerprints
        return parsed
            .map((x) => withFingerprint(coerceToV1(x)))
            .filter(Boolean);
    }
    catch {
        return migrateFromOlderKeys();
    }
}
// Attempt to migrate from older keys / shapes (best-effort, non-fatal)
function migrateFromOlderKeys() {
    const CANDIDATE_KEYS = ["savedDeals", "deals", "useSavedDeals"];
    for (const k of CANDIDATE_KEYS) {
        const raw = localStorage.getItem(k);
        if (!raw)
            continue;
        try {
            const arr = JSON.parse(raw);
            if (!Array.isArray(arr))
                continue;
            const migrated = arr
                .map((d) => {
                const id = d.id || newId();
                const name = d.name || "Untitled deal";
                const createdAt = d.createdAt || Date.now();
                const values = {
                    price: null, rent: null, loan: null, rate: null, term: null, costs: null,
                    product: "", postcode: "", scenario: undefined, lender: "", includeSdlt: false,
                    ...(d.values || {}),
                };
                // Compute snapshot if missing
                const metrics = d.metrics || computeMetricsWithRegion(values);
                return withFingerprint({
                    version: 1, id, name, createdAt, values, metrics,
                });
            })
                .filter(Boolean);
            // Persist forward and clear legacy
            if (migrated.length) {
                saveToStorage(migrated);
                localStorage.removeItem(k);
                return sortNewestFirst(migrated);
            }
        }
        catch {
            // ignore this key and try the next
        }
    }
    return [];
}
// Ensure arbitrary object becomes SavedDealV1 or null
function coerceToV1(x) {
    if (!x || typeof x !== "object")
        return null;
    if (x.version === 1) {
        // Shallow sanity checks
        if (!x.id || !x.name || !x.createdAt || !x.values || !x.metrics)
            return null;
        return x;
    }
    // Legacy -> v1
    const id = x.id || newId();
    const name = x.name || "Untitled deal";
    const createdAt = x.createdAt || Date.now();
    const values = {
        price: null, rent: null, loan: null, rate: null, term: null, costs: null,
        product: "", postcode: "", scenario: undefined, lender: "", includeSdlt: false,
        ...(x.values || {}),
    };
    const metrics = x.metrics || computeMetricsWithRegion(values);
    return { version: 1, id, name, createdAt, values, metrics };
}
function withFingerprint(d) {
    if (!d)
        return null;
    try {
        return { ...d, __fp: fingerprintValues(d.values) };
    }
    catch {
        return { ...d, __fp: undefined };
    }
}
export const useSavedDeals = create((set, get) => ({
    items: loadFromStorage(),
    add(name, values) {
        const label = (name || "Untitled deal").trim();
        const fp = fingerprintValues(values);
        // Snapshot metrics at save time
        const metrics = computeMetricsWithRegion(values);
        // If duplicate values exist, refresh that item instead of adding a new one
        const existing = get().items.find((d) => d.__fp && d.__fp === fp);
        let items;
        if (existing) {
            const updated = {
                ...existing,
                name: label || existing.name,
                createdAt: Date.now(),
                values: { ...values },
                metrics,
                __fp: fp,
            };
            items = get().items.filter((d) => d.id !== existing.id).concat(updated);
        }
        else {
            const item = {
                version: 1,
                id: newId(),
                name: label,
                createdAt: Date.now(),
                values: { ...values },
                metrics,
                __fp: fp,
            };
            items = [item, ...get().items];
        }
        saveToStorage(items);
        set({ items: sortNewestFirst(items).slice(0, MAX_ITEMS) });
    },
    rename(id, name) {
        const items = get().items.map((d) => d.id === id ? { ...d, name: (name || "").trim() || d.name } : d);
        saveToStorage(items);
        set({ items: sortNewestFirst(items) });
    },
    updateValues(id, patch) {
        const items = get().items.map((d) => {
            if (d.id !== id)
                return d;
            const nextValues = { ...d.values, ...patch };
            const nextMetrics = computeMetricsWithRegion(nextValues);
            return {
                ...d,
                values: nextValues,
                metrics: nextMetrics,
                __fp: fingerprintValues(nextValues),
                createdAt: Date.now(), // bubble updated item to the top
            };
        });
        saveToStorage(items);
        set({ items: sortNewestFirst(items) });
    },
    remove(id) {
        const items = get().items.filter((d) => d.id !== id);
        saveToStorage(items);
        set({ items: sortNewestFirst(items) });
    },
    clear() {
        saveToStorage([]);
        set({ items: [] });
    },
    importAll(payload, mode = "merge") {
        let incoming = [];
        try {
            if (typeof payload === "string") {
                incoming = JSON.parse(payload);
            }
            else if (Array.isArray(payload)) {
                incoming = payload;
            }
            else if (payload && typeof payload === "object" && Array.isArray(payload.items)) {
                incoming = payload.items;
            }
        }
        catch {
            incoming = [];
        }
        if (!Array.isArray(incoming) || incoming.length === 0)
            return { imported: 0, skipped: 0 };
        const mapped = incoming
            .map((x) => withFingerprint(coerceToV1(x)))
            .filter(Boolean);
        const current = get().items;
        let next = [];
        if (mode === "replace") {
            next = mapped;
        }
        else {
            // merge: prefer newest timestamps; de-dupe by fingerprint when available
            const byFp = new Map();
            const push = (d) => {
                const key = d.__fp || d.id;
                const prev = byFp.get(key);
                if (!prev || d.createdAt > prev.createdAt)
                    byFp.set(key, d);
            };
            [...current, ...mapped].forEach(push);
            next = Array.from(byFp.values());
        }
        // ensure IDs (in case incoming were missing)
        next = next.map((d) => ({ ...d, id: d.id || newId() }));
        saveToStorage(next);
        set({ items: sortNewestFirst(next).slice(0, MAX_ITEMS) });
        const skipped = incoming.length - mapped.length;
        return { imported: mapped.length, skipped };
    },
}));
export default useSavedDeals;
