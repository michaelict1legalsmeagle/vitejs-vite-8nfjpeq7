// src/components/ExtractPanel.tsx
import React, { useEffect, useState } from "react";
import { usePack } from "../store/usePack";

type Preset = { name: string; guide: string; url: string };

const PRESETS: Preset[] = [
  { name: "Range + fees (Savills)", guide: "Guide Price: £160,000–£180,000 (plus fees).", url: "https://auctions.savills.com/lot/12345" },
  { name: "Single figure (Barnard Marcus)", guide: "Guide Price: £275,000.", url: "https://www.barnardmarcusauctions.co.uk/lot/XYZ9" },
  { name: "In excess of (Allsop)", guide: "Guide Price in excess of £125,000.", url: "https://auctions.allsop.co.uk/lot/ABC22" },
  { name: "Starting Price (SDL)", guide: "Starting Price £90,000.", url: "https://www.sdlauctions.co.uk/lot/LOT31" },
  { name: "POA / TBC (Clive Emson)", guide: "Guide Price: TBC.", url: "https://www.cliveemson.co.uk/lot/5" },
  { name: "Index only (Auction House London)", guide: "Guide Price: £350,000.", url: "https://www.auctionhouselondon.co.uk/auctions/september-catalogue/" },
];

function rand(min: number, max: number) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}
function gbp(n: number) {
  return `£${n.toLocaleString()}`;
}
function randomGuide(): string {
  const base = rand(80, 450) * 1000;
  const mode = ["single", "range", "excess"][rand(0, 2)];
  if (mode === "range") {
    const upper = base + rand(10, 60) * 1000;
    return `Guide Price: ${gbp(base)}–${gbp(upper)} (plus fees).`;
  }
  if (mode === "excess") return `Guide Price in excess of ${gbp(base)}.`;
  return `Guide Price: ${gbp(base)}.`;
}
const RANDOM_URLS = [
  "https://auctions.savills.com/lot/AB123",
  "https://auctions.allsop.co.uk/lot/CDE45",
  "https://www.barnardmarcusauctions.co.uk/lot/LMN9",
  "https://www.sdlauctions.co.uk/lot/XZ11",
  "https://www.cliveemson.co.uk/lot/7",
  "https://www.strettons.co.uk/property-auctions/lot/55",
];

function buildBoxText(guide: string, url: string) {
  return `${guide}\nView lot: ${url}`;
}
function firstUrlOf(text: string): string | null {
  const m = text.match(/https?:\/\/[^\s)]+/i);
  return m ? m[0] : null;
}

export default function ExtractPanel() {
  const runLocalExtraction = usePack((s) => s.runLocalExtraction);
  const existing = usePack((s) => s.listing);

  const def = PRESETS[0];
  const [presetIdx, setPresetIdx] = useState(0);
  const [box, setBox] = useState(buildBoxText(def.guide, def.url));
  const [msg, setMsg] = useState<string | null>(null);

  // new: stack pinned evidence
  const [pins, setPins] = useState<string[]>([]);
  useEffect(() => {
    const onPin = (e: Event) => {
      const snip = (e as CustomEvent).detail?.snippet as string | undefined;
      if (!snip) return;
      setPins((prev) => prev.concat(snip));
    };
    window.addEventListener("lexlot:pinEvidence", onPin as EventListener);
    return () => window.removeEventListener("lexlot:pinEvidence", onPin as EventListener);
  }, []);

  const applyPreset = (i: number) => {
    const p = PRESETS[i];
    setPresetIdx(i);
    setBox(buildBoxText(p.guide, p.url));
    setMsg(null);
  };

  const randomise = () => {
    const guide = randomGuide();
    const url = RANDOM_URLS[rand(0, RANDOM_URLS.length - 1)];
    setBox(buildBoxText(guide, url));
    setMsg("Generated a simple guide + URL example ✓");
  };

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(box);
      setMsg("Copied ✓");
    } catch {
      setMsg("Copy failed (permissions).");
    }
  };

  const run = (andScroll?: boolean) => {
    let text = box.trim();
    const url = firstUrlOf(text);
    if (!/view\s*lot\s*:/i.test(text)) {
      text = url ? `${text}\nView lot: ${url}` : `${text}\nView lot:`;
    } else if (!/view\s*lot\s*:\s*https?:\/\//i.test(text) && url) {
      text = text.replace(/(view\s*lot\s*:)\s*$/i, `$1 ${url}`);
    }
    const urls = url ? [url] : [];

    const res = runLocalExtraction({
      contextText: text,
      sourceUrls: urls,
      lotMetadata: {},
    });

    if (res.ok) {
      setMsg("Extraction complete ✓ — see Snapshot.");
      if (andScroll) {
        document.querySelector("section.card")?.scrollIntoView({ behavior: "smooth", block: "start" });
      }
    } else {
      setMsg(`Extraction failed: ${res.error}`);
    }
    setBox(text);
  };

  const reset = () => applyPreset(0);

  return (
    <div className="space-y-3">
      <h2 className="font-semibold text-center">Extract Panel</h2>

      {/* Compact tools */}
      <div className="flex flex-wrap items-center justify-center gap-2">
        <select
          className="w-[260px] h-8 text-sm px-2 rounded-md border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 shadow-sm"
          value={presetIdx}
          onChange={(e) => applyPreset(Number(e.currentTarget.value))}
        >
          {PRESETS.map((p, i) => (
            <option key={p.name} value={i}>{p.name}</option>
          ))}
        </select>
        <button type="button" className="btn btn-sm" onClick={randomise}>🎲 Random</button>
        <button type="button" className="btn btn-sm" onClick={reset}>↩︎ Reset</button>
      </div>

      {/* One box */}
      <textarea
        className="w-full rounded-md border border-slate-300 dark:border-slate-700 p-3 bg-white dark:bg-slate-900
                   text-center leading-relaxed text-[15px] shadow-sm"
        rows={4}
        value={box}
        onChange={(e) => setBox(e.currentTarget.value)}
        placeholder={"Guide Price: £160,000–£180,000 (plus fees).\nView lot: https://auctions.example.com/lot/123"}
      />

      {/* Actions */}
      <div className="flex items-center justify-center gap-2">
        <button type="button" className="btn btn-sm" onClick={copy}>📋 Copy</button>
        <button type="button" className="btn btn-sm" onClick={() => run(false)}>🧪 Run</button>
        <button type="button" className="btn btn-sm" onClick={() => run(true)}>👀 Run & View</button>
      </div>

      {msg && <div className="text-xs text-center">{msg}</div>}
      {existing && (
        <div className="text-xs opacity-70 text-center">
          Last extracted: {existing.listing.auction_house_name || "—"}
        </div>
      )}

      {/* Evidence pins */}
      {pins.length > 0 && (
        <div className="mt-4 border-t pt-2">
          <div className="font-semibold text-sm mb-2">Pinned Evidence</div>
          <ul className="space-y-1 max-h-40 overflow-auto text-xs">
            {pins.map((p, i) => (
              <li key={i} className="p-1 bg-slate-100 dark:bg-slate-800 rounded">{p}</li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
