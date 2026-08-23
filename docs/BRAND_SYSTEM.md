# StratVerity — Design Authority (v1)

## Positioning
**Proof, not storytelling.** Institutional audit lab for algo strategies — not a generic crypto SaaS, not a broker marketing site.

## Voice & visual keywords
Precision · Laboratory · Verification · Forest depth · Emerald signal · Quiet confidence

## Color system (locked)
| Token | Hex | Role |
|---|---|---|
| forest-900 | `#083326` | Dark surfaces, summary panels |
| forest-700 | `#0e4a38` | Brand primary |
| forest-600 | `#12604a` | Buttons |
| emerald-500 | `#16b981` | Accent / CTAs / live signals |
| mint-300 | `#5fe3b0` | Highlights, progress |
| paper | `#f6f3ec` | Page background (warm, not pure white) |

**Forbidden:** pure Bootstrap blue, neon purple crypto gradients, one Bitcoin icon for every asset, neon glow shields that look like gaming skins.

## Typography
- **Display:** Fraunces (titles)
- **UI:** Inter / system (body)
- **Mono:** metrics, hashes, order IDs

## Logo system
1. **Shield mark** — proprietary geometric shield + verification stroke
2. **Wordmark** — StratVerity with emerald accent on V
3. **Lockup** — shield + wordmark
4. Favicon = shield only

## Motion
150–280ms, ease `.22,.61,.36,1`. Orbit loader on success. No parallax spam.

## UI principles
1. Dark panels: secondary text ≥ readable mint-grey (`#b7ccc2`+)
2. Per-asset chip colors, never universal BTC glyph
3. No internal jargon on client UI
4. Error recovery = hard navigation

## Shipped this pass
- Configure summary contrast raised
- Shield SVG without neon gaming look
- Brand system doc
- Pre-Stripe source upload path on configure (awaits backend endpoint)
