# ComfyUI API workflow templates (Phase B)

These JSON files are **API format** graphs (node-id keys), not the UI workflow format.

## Placeholders (injected by `comfy.js`)

| Token | Meaning |
|-------|---------|
| `__POSITIVE__` | Positive prompt text |
| `__NEGATIVE__` | Negative prompt |
| `__SEED__` | Int seed |
| `__WIDTH__` / `__HEIGHT__` | Latent size |
| `__STEPS__` / `__CFG__` | Sampler |
| `__FILENAME_PREFIX__` | SaveImage prefix |
| `__CKPT__` | Checkpoint filename under Comfy `models/checkpoints` |
| `__REF_IMAGE__` | Filename already in Comfy `input/` (I2V) |

`_meta` is stripped before `POST /prompt`.

## How to customize

1. Build / open a working graph in ComfyUI.
2. **Save (API Format)** — enable via Comfy settings if needed.
3. Replace the positive CLIP text with exactly `__POSITIVE__` (same for other tokens).
4. Drop the file here and point workbench settings at it.

## Files

- `wf_asset_t2i.json` — S3 character/scene asset stills
- `wf_storyboard_still.json` — S6 keyframe stills
- `wf_generic_i2v.json` — S7 hook (stub; swap for real I2V nodes)

Default `__CKPT__` is left as the literal placeholder string until you set **Checkpoint** in workbench Comfy settings (injected as `__CKPT__`).
