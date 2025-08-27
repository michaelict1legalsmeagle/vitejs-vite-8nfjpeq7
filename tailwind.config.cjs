/** @type {import('tailwindcss').Config} */

// Safely require daisyui so Tailwind never crashes if the package isn't present.
// This preserves your existing look when daisyui is installed, and silently
// continues if a lockfile snafu removes it.
let plugins = [];
try {
  // eslint-disable-next-line import/no-extraneous-dependencies, global-require
  const daisyui = require("daisyui");
  plugins.push(daisyui);
} catch (_err) {
  // DaisyUI not installed; keep building with base Tailwind.
  // This prevents the red overlay crash you saw.
}

module.exports = {
  darkMode: "class",
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  theme: { extend: {} },
  plugins,
  daisyui: { themes: ["light", "dark"] }, // harmless if plugin missing
};
