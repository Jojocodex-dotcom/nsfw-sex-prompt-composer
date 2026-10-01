# Grokclip prompt library

Source: https://x.com/Grokclip

Pipeline:
1. Collect published prompts into `raw/` + `index.json`
2. Distill recurring structure into `kernels/house-format.md` (program core)
3. Wire into web-app AI polish (`director.js` POLISH_FORMAT_SPEC) and optional template picker

Do not invent prompts: only store text scraped/copied from public posts or user paste.
