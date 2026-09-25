# ComfyUI-NSFWPromptComposer

ComfyUI custom nodes that mirror the web **性爱视频提示词组合器** (`../index.html`).

**Hard boundary:** 21+ consenting fictional adults only. No minors, no age ambiguity, no real celebrities. Nodes emit **prompt text only** — they do not generate or host adult media.

## Install

1. Copy or symlink this folder into ComfyUI custom nodes:

```bash
cp -r /path/to/nsfw-sex-prompt-skill/ComfyUI-NSFWPromptComposer \
  /path/to/ComfyUI/custom_nodes/ComfyUI-NSFWPromptComposer
```

2. (Optional) sync brick data from the parent web UI:

```bash
cd /path/to/ComfyUI/custom_nodes/ComfyUI-NSFWPromptComposer
python3 sync_from_data_js.py
```

3. Restart ComfyUI. Nodes appear under category **`nsfw_prompt`**.

`requirements.txt` is empty of heavy deps — logic is pure Python + bundled `prompt_data.json`.

## Nodes

| Node | Inputs | Outputs |
|------|--------|---------|
| **NSFW LM Model List** | `tier`: all / 4B / 8B | `model_list_text`, `model_list_json` — curated uncensored LM catalog with HF repo ids |
| **Action Timeline Builder** | `timeline_json`, `edit_mode` (continuous\|multicut), `lang` | Optimized beat timeline + morph/match-cut transition prompt |
| **NSFW Prompt Composer** | `model_type` (minimax_h3\|qwen_image), `mode` (i2v\|multiref), `edit_mode`, `lang`, `selection_json`, `timeline_json` | `positive_prompt`, `negative_prompt` |

### Timeline JSON schema

```json
[
  {"category": "foreplay", "action_id": "kiss_deep", "seconds": 3},
  {"category": "oral", "action_id": "bj_kneel", "seconds": 5},
  {"category": "sexPoses", "action_id": "missionary", "seconds": 8}
]
```

`category` ∈ `foreplay` | `oral` | `sexPoses`. Ids come from `prompt_data.json` (same bricks as `../data.js`).

### Selection JSON schema

Keys map to brick id lists: `subjects`, `bodyTags`, `scenes`, `foreplay`, `oral`, `sexPoses`, `rhythm`, `cameras`, `expressions`, `dialogueSnippets`, `wardrobe`, `arcs`.

### Edit modes

- **continuous（一镜到底）**: single unbroken take; morph/transition between beats; no hard cuts.
- **multicut（多镜头）**: one shot per beat; match cut / raccord / eyeline & action match.

## NSFW / Uncensored LM download list (verified HF)

### ~4B class (3B–4B)

| Model | Params | Repo | Notes |
|-------|--------|------|-------|
| Qwen3-4B-Instruct-Uncensored | 4B | [`n0ctyx/Qwen3-4B-Instruct-Uncensored`](https://huggingface.co/n0ctyx/Qwen3-4B-Instruct-Uncensored) | Abliterated Qwen3-4B instruct |
| Qwen3-4B-2507-Instruct-Uncensored-HauhauCS-Aggressive | 4B | [`HauhauCS/Qwen3-4B-2507-Instruct-Uncensored-HauhauCS-Aggressive`](https://huggingface.co/HauhauCS/Qwen3-4B-2507-Instruct-Uncensored-HauhauCS-Aggressive) | GGUF Q4_K_M ~2.4GB |
| Phi-3.5-mini-instruct_Uncensored | 3.8B | [`SicariusSicariiStuff/Phi-3.5-mini-instruct_Uncensored`](https://huggingface.co/SicariusSicariiStuff/Phi-3.5-mini-instruct_Uncensored) | GGUF via `bartowski/...-GGUF` |
| Phi-3.5-mini-instruct-heretic | 3.8B | [`askalgore/Phi-3.5-mini-instruct-heretic`](https://huggingface.co/askalgore/Phi-3.5-mini-instruct-heretic) | Heretic decensor |

### ~8B class (7B–8B)

| Model | Params | Repo | Notes |
|-------|--------|------|-------|
| Qwen2.5-7B-Instruct-Uncensored | 7B | [`Orion-zhen/Qwen2.5-7B-Instruct-Uncensored`](https://huggingface.co/Orion-zhen/Qwen2.5-7B-Instruct-Uncensored) | GGUF: `mradermacher/...-GGUF` Q4_K_M ~4.8GB — **recommended expand model** |
| Llama-3.1-8B-Lexi-Uncensored | 8B | [`Orenguteng/Llama-3.1-8B-Lexi-Uncensored`](https://huggingface.co/Orenguteng/Llama-3.1-8B-Lexi-Uncensored) | + Lexi GGUF repo |
| Llama-3.1-8B-Instruct-Uncensored-GGUF | 8B | [`ccharnkij/Llama-3.1-8B-Instruct-Uncensored-GGUF`](https://huggingface.co/ccharnkij/Llama-3.1-8B-Instruct-Uncensored-GGUF) | Ready Q4_K_M ~4.92GB |

Example download:

```bash
huggingface-cli download Orion-zhen/Qwen2.5-7B-Instruct-Uncensored --local-dir ./models/llm/qwen25-7b-uncen
# or GGUF:
huggingface-cli download mradermacher/Qwen2.5-7B-Instruct-Uncensored-GGUF \
  --include "*Q4_K_M*" --local-dir ./models/llm/qwen25-7b-uncen-gguf
```

Wire any of these through your preferred ComfyUI LLM / GGUF text node; feed expanded text into video I2V nodes. Keep a system rule: **21+ fictional adults only**.

## Local import smoke test (no ComfyUI)

```bash
cd ComfyUI-NSFWPromptComposer
python3 -c "from nodes import NODE_CLASS_MAPPINGS; print(sorted(NODE_CLASS_MAPPINGS))"
```

## Data sync

Brick catalog is shared with the web UI. Prefer:

```bash
python3 sync_from_data_js.py   # reads ../data.js → prompt_data.json
```

Do not hand-edit two copies of pose/scene lists.
