import { readFile, writeFile } from "node:fs/promises";

const files = [
  new URL("../app/configure/scope-configurator.module.css", import.meta.url),
  new URL("../app/admin/review-console.module.css", import.meta.url),
  new URL("../app/legal/legal.module.css", import.meta.url),
];

const replacements = new Map([
  ["var(--font-geist-mono)", "var(--mono)"],
  ["var(--green)", "var(--accent)"],
  ["var(--warning)", "var(--warning-500)"],
  ["#62eda0", "var(--accent)"], ["#50f39a", "var(--accent)"],
  ["#70ffae", "var(--mint-300)"], ["#ffc95f", "var(--warning-500)"],
  ["#ffc477", "var(--warning-500)"], ["#ff8b79", "var(--danger-500)"],
  ["#eff0e8", "var(--surface-2)"], ["#e5f8eb", "var(--paper-2)"],
  ["#dff8e8", "color-mix(in oklab, var(--accent) 14%, var(--surface))"],
  ["#fff", "var(--surface)"], ["background: white", "background: var(--surface)"],
  ["var(--surface)-space", "white-space"],
  ["#0a160f", "var(--ink)"], ["#07110d", "var(--forest-900)"],
  ["#09130f", "var(--forest-900)"], ["#0b1812", "var(--forest-900)"],
  ["#0c1a13", "var(--forest-900)"], ["#030805", "#020806"],
  ["#123923", "var(--forest-700)"], ["#2a7047", "var(--forest-600)"],
  ["#2d8b55", "var(--forest-500)"], ["#edf7f0", "#eafbf3"],
  ["#edf5ef", "#eafbf3"], ["#eef6f0", "#eafbf3"],
  ["#effaf2", "#eafbf3"], ["#f3f7f3", "#eafbf3"],
  ["#f4fff7", "#eafbf3"], ["#e9fff0", "#eafbf3"],
  ["#dff9e7", "#dff8e8"], ["#c8d7cd", "#c5d8cd"],
  ["#c4d2c8", "#c5d8cd"], ["#c1cdc5", "var(--ink-2)"],
  ["#c1c9c3", "var(--line)"], ["#b8c7bd", "var(--ink-2)"],
  ["#b4c1b9", "var(--ink-2)"], ["#aebcb3", "var(--ink-2)"],
  ["#a6cdb5", "#b9dfcb"], ["#9bb0a2", "#a9bcb3"],
  ["#9eafa4", "var(--ink-2)"], ["#9aaba0", "#a9bcb3"],
  ["#92a69a", "#a9bcb3"], ["#91a198", "var(--ink-3)"],
  ["#8fa098", "var(--ink-3)"], ["#8b9d91", "#90a49a"],
  ["#879b8d", "#90a49a"], ["#87968e", "var(--ink-3)"],
  ["#85978b", "#90a49a"], ["#829289", "var(--ink-3)"],
  ["#819187", "var(--ink-3)"], ["#809388", "#90a49a"],
  ["#738078", "var(--ink-3)"], ["#72867a", "#90a49a"],
  ["#6c7971", "var(--ink-3)"], ["#69786f", "var(--ink-3)"],
  ["#66756c", "var(--ink-3)"], ["#607067", "var(--ink-2)"],
  ["#5f6d65", "var(--ink-2)"], ["#577064", "var(--ink-2)"],
  ["rgba(10, 22, 15, 0.1)", "var(--line-2)"],
  ["rgba(10, 22, 15, 0.15)", "var(--line)"],
  ["rgba(10, 22, 15, 0.16)", "var(--line)"],
  ["rgba(10, 22, 15, 0.17)", "var(--line)"],
  ["rgba(220, 242, 228, 0.14)", "rgba(234, 251, 243, 0.14)"],
]);

for (const file of files) {
  let css = await readFile(file, "utf8");
  for (const [source, target] of replacements) css = css.replaceAll(source, target);
  await writeFile(file, css);
}

console.log(`Surfaces harmonisées : ${files.length} feuilles actives.`);
