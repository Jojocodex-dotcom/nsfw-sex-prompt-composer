"""
NSFW Prompt Composer ComfyUI nodes (21+ fictional adult content only).
No ComfyUI runtime required for import; NODE_CLASS_MAPPINGS follows classic custom_node API.
"""

from __future__ import annotations

import json
import os
from typing import Any, Dict, List, Optional, Tuple

_DIR = os.path.dirname(os.path.abspath(__file__))
_DATA_PATH = os.path.join(_DIR, "prompt_data.json")
_PARENT_DATA = os.path.normpath(os.path.join(_DIR, "..", "prompt_data.json"))

AGE_LINE_EN = (
    "All characters are clearly consenting adults aged 21 or older. "
    "Fictional adult content only. No minors, no age ambiguity, no real celebrities."
)
AGE_LINE_ZH = (
    "所有角色均为明显自愿的21岁及以上成年人。仅虚构成人内容。无未成年、无年龄模糊、无真实名人。"
)


def _load_prompt_data() -> Dict[str, Any]:
    for path in (_DATA_PATH, _PARENT_DATA):
        if os.path.isfile(path):
            with open(path, "r", encoding="utf-8") as f:
                return json.load(f)
    return {"meta": {}, "negatives": {"common": []}, "consistencyLocks": {}}


PROMPT_DATA = _load_prompt_data()

# Verified Hugging Face repos (researched 2026-09-25). Do not invent repos.
NSFW_LM_MODELS: List[Dict[str, Any]] = [
    # —— ~3–4B tier ——
    {
        "tier": "4B",
        "name": "Qwen3-4B-Instruct-Uncensored (n0ctyx)",
        "params": "4B",
        "purpose": "Uncensored instruct LLM for NSFW prompt expansion / rewrite",
        "repo_id": "n0ctyx/Qwen3-4B-Instruct-Uncensored",
        "url": "https://huggingface.co/n0ctyx/Qwen3-4B-Instruct-Uncensored",
        "usage": "Load as chat instruct; expand short adult beat lists into full I2V prompts. Low VRAM (~2.4GB Q4_K_M GGUF if quantized separately).",
    },
    {
        "tier": "4B",
        "name": "Qwen3-4B-2507-Instruct-Uncensored-HauhauCS-Aggressive",
        "params": "4B",
        "purpose": "Aggressive uncensor for creative adult writing / prompt drafting",
        "repo_id": "HauhauCS/Qwen3-4B-2507-Instruct-Uncensored-HauhauCS-Aggressive",
        "url": "https://huggingface.co/HauhauCS/Qwen3-4B-2507-Instruct-Uncensored-HauhauCS-Aggressive",
        "usage": "Prefer Q4_K_M GGUF (~2.4GB) via llama.cpp / LM Studio. Use for refusal-free prompt expansion.",
    },
    {
        "tier": "4B",
        "name": "Phi-3.5-mini-instruct_Uncensored",
        "params": "3.8B (~4B class)",
        "purpose": "Small uncensored instruct; caption/prompt assist on low VRAM",
        "repo_id": "SicariusSicariiStuff/Phi-3.5-mini-instruct_Uncensored",
        "url": "https://huggingface.co/SicariusSicariiStuff/Phi-3.5-mini-instruct_Uncensored",
        "usage": "GGUF: bartowski/Phi-3.5-mini-instruct_Uncensored-GGUF (Q4_K_M ~2.39GB). Good for short rewrites.",
    },
    {
        "tier": "4B",
        "name": "Phi-3.5-mini-instruct-heretic (decensored)",
        "params": "3.8B (~4B class)",
        "purpose": "Heretic decensor of Phi-3.5-mini for local prompt tools",
        "repo_id": "askalgore/Phi-3.5-mini-instruct-heretic",
        "url": "https://huggingface.co/askalgore/Phi-3.5-mini-instruct-heretic",
        "usage": "Transformers / ComfyUI LLM nodes; keep system prompt enforcing 21+ fictional-only.",
    },
    # —— ~7–8B tier ——
    {
        "tier": "8B",
        "name": "Qwen2.5-7B-Instruct-Uncensored (Orion-zhen)",
        "params": "7B (~8B class)",
        "purpose": "Strong bilingual uncensored instruct for detailed NSFW prompt expansion",
        "repo_id": "Orion-zhen/Qwen2.5-7B-Instruct-Uncensored",
        "url": "https://huggingface.co/Orion-zhen/Qwen2.5-7B-Instruct-Uncensored",
        "usage": "GGUF: mradermacher/Qwen2.5-7B-Instruct-Uncensored-GGUF (Q4_K_M ~4.8GB). Recommended default expand model.",
    },
    {
        "tier": "8B",
        "name": "Llama-3.1-8B-Lexi-Uncensored (Orenguteng)",
        "params": "8B",
        "purpose": "Popular Llama-3.1 uncensored instruct for adult creative prompting",
        "repo_id": "Orenguteng/Llama-3.1-8B-Lexi-Uncensored",
        "url": "https://huggingface.co/Orenguteng/Llama-3.1-8B-Lexi-Uncensored",
        "usage": "GGUF: Orenguteng/Llama-3.1-8B-Lexi-Uncensored-GGUF. Use Llama-3.1 chat template.",
    },
    {
        "tier": "8B",
        "name": "Llama-3.1-8B-Instruct-Uncensored-GGUF (ccharnkij)",
        "params": "8B",
        "purpose": "Ready GGUF pack of Llama-3.1-8B uncensored for local inference",
        "repo_id": "ccharnkij/Llama-3.1-8B-Instruct-Uncensored-GGUF",
        "url": "https://huggingface.co/ccharnkij/Llama-3.1-8B-Instruct-Uncensored-GGUF",
        "usage": "Q4_K_M ~4.92GB. Pair with ComfyUI GGUF / llama.cpp text nodes for prompt expand.",
    },
]


def _index_items() -> Dict[str, Dict[str, Dict[str, Any]]]:
    out: Dict[str, Dict[str, Dict[str, Any]]] = {}
    for key in ("foreplay", "oral", "sexPoses", "subjects", "scenes", "rhythm", "cameras", "expressions", "wardrobe", "arcs", "bodyTags", "dialogueSnippets"):
        out[key] = {it["id"]: it for it in PROMPT_DATA.get(key, [])}
    return out


ITEM_INDEX = _index_items()


def _pick(cat: str, ids: List[str]) -> List[Dict[str, Any]]:
    table = ITEM_INDEX.get(cat, {})
    return [table[i] for i in ids if i in table]


def _frag(items: List[Dict[str, Any]], lang: str = "en") -> str:
    if not items:
        return ""
    parts = []
    for it in items:
        if lang == "zh":
            parts.append(it.get("zh") or it.get("label") or "")
        else:
            parts.append(it.get("en") or it.get("label") or "")
    return "; ".join(p for p in parts if p)


def _parse_jsonish(text: str) -> Any:
    text = (text or "").strip()
    if not text:
        return None
    try:
        return json.loads(text)
    except json.JSONDecodeError:
        return None


def build_action_timeline(
    segments: List[Dict[str, Any]],
    edit_mode: str = "continuous",
) -> Tuple[str, str, str]:
    """
    segments: [{action|action_id, category?, seconds, label?, en?, zh?}, ...]
    Returns (en_block, zh_block, combined).
    """
    resolved: List[Dict[str, Any]] = []
    for seg in segments or []:
        cat = seg.get("category") or seg.get("cat") or "sexPoses"
        aid = seg.get("action_id") or seg.get("actionId") or seg.get("action") or ""
        seconds = float(seg.get("seconds") or seg.get("sec") or 5)
        item = ITEM_INDEX.get(cat, {}).get(aid)
        if item:
            en = item.get("en") or item.get("label") or aid
            zh = item.get("zh") or item.get("label") or aid
            label = item.get("label") or aid
        else:
            # free-text action
            en = str(seg.get("en") or seg.get("action") or aid)
            zh = str(seg.get("zh") or seg.get("action") or aid)
            label = str(seg.get("label") or en)
        if not en and not zh:
            continue
        resolved.append({"en": en, "zh": zh, "label": label, "seconds": seconds, "category": cat})

    if not resolved:
        return "", "", ""

    total = sum(s["seconds"] for s in resolved) or 1.0
    t = 0.0
    beats_en, beats_zh = [], []
    for i, s in enumerate(resolved):
        start, end = t, t + s["seconds"]
        t = end
        pct0 = int(round(start / total * 100))
        pct1 = int(round(end / total * 100))
        beats_en.append(f"[Beat {i+1} | {start:g}–{end:g}s | {pct0}–{pct1}%] {s['en']}")
        beats_zh.append(f"【节拍{i+1}｜{start:g}–{end:g}秒｜{pct0}–{pct1}%】{s['zh']}")

    trans_en, trans_zh = [], []
    continuous = edit_mode in ("continuous", "一镜到底", "one_take", "onetake")
    for i in range(len(resolved) - 1):
        a, b = resolved[i], resolved[i + 1]
        if continuous:
            trans_en.append(
                f"Morph/transition {i+1}→{i+2}: continuous take — bodies stay in contact; "
                f"reposition through reachable intermediate poses into {b['label']}; "
                f"no hard cut; keep identity, contact points, wardrobe, lighting, and camera path smooth."
            )
            trans_zh.append(
                f"过渡 {i+1}→{i+2}：一镜到底 morph——保持身体接触；经可到达中间姿势转入「{b['label']}」；"
                f"禁止硬切；身份、接触点、服装、光照与运镜平滑。"
            )
        else:
            trans_en.append(
                f"Cut {i+1}→{i+2}: match cut / raccord — match eyeline and action inertia from "
                f"\"{a['label']}\" into \"{b['label']}\"; exit-frame / enter-frame continuity; "
                f"preserve adult identities; avoid jump-cut wardrobe or contact teleport."
            )
            trans_zh.append(
                f"剪辑 {i+1}→{i+2}：match cut / raccord——从「{a['label']}」匹配视线与动作惯性切入「{b['label']}」；"
                f"出入画连贯；跨镜锁定成人身份；避免服装/接触点跳切穿帮。"
            )

    if continuous:
        c_en = (
            "CONTINUOUS-TAKE CONSTRAINTS: single unbroken shot; soft morph between beats; "
            "no abrupt stepped cuts; no identity drift; no broken anatomy at contact points; "
            "camera motion continuous (prefer one primary move)."
        )
        c_zh = "一镜到底约束：单一连续镜头；节拍间柔和 morph；禁止跳切；禁止身份漂移；接触点解剖正确；运镜连续。"
        mode_en, mode_zh = "ONE CONTINUOUS TAKE", "一镜到底"
    else:
        c_en = (
            "MULTI-SHOT CONSTRAINTS: one shot per beat; use match cut / eyeline match / action match / raccord; "
            "no jump cuts that break spatial continuity; keep faces and body identities locked; "
            "wardrobe and contact points must not teleport between cuts."
        )
        c_zh = "多镜头约束：每段一镜；match cut / 视线匹配 / 动作匹配 / raccord；禁止破坏空间连续的跳切；跨镜锁定身份；服装与接触点不得瞬移。"
        mode_en, mode_zh = "MULTI-SHOT EDIT", "多镜头剪辑"

    en = (
        f"Action timeline ({mode_en}, total ~{total:g}s, {len(resolved)} beats):\n"
        + "\n".join(beats_en)
        + (("\nTransitions:\n" + "\n".join(trans_en)) if trans_en else "")
        + "\n"
        + c_en
    )
    zh = (
        f"动作时间轴（{mode_zh}，合计约 {total:g} 秒，{len(resolved)} 段）：\n"
        + "\n".join(beats_zh)
        + (("\n过渡衔接：\n" + "\n".join(trans_zh)) if trans_zh else "")
        + "\n"
        + c_zh
    )
    combined = "【EN】\n" + en + "\n\n【ZH】\n" + zh
    return en, zh, combined


def compose_prompt(
    model_type: str = "minimax_h3",
    mode: str = "i2v",
    selection: Optional[Dict[str, List[str]]] = None,
    timeline: Optional[List[Dict[str, Any]]] = None,
    edit_mode: str = "continuous",
    lang: str = "both",
) -> Tuple[str, str]:
    selection = selection or {}
    subjects = _pick("subjects", selection.get("subjects", []))
    body = _pick("bodyTags", selection.get("bodyTags", []))
    scenes = _pick("scenes", selection.get("scenes", []))
    foreplay = _pick("foreplay", selection.get("foreplay", []))
    oral = _pick("oral", selection.get("oral", []))
    poses = _pick("sexPoses", selection.get("sexPoses", []))
    rhythm = _pick("rhythm", selection.get("rhythm", []))
    cams = _pick("cameras", selection.get("cameras", []))
    exprs = _pick("expressions", selection.get("expressions", []))
    dial = _pick("dialogueSnippets", selection.get("dialogueSnippets", []))
    ward = _pick("wardrobe", selection.get("wardrobe", []))
    arcs = _pick("arcs", selection.get("arcs", []))

    locks = PROMPT_DATA.get("consistencyLocks", {})
    lock_en = locks.get("i2v" if mode == "i2v" else "multiref", "")
    lock_zh = locks.get("i2v_zh" if mode == "i2v" else "multiref_zh", "")

    parts_en: List[str] = [AGE_LINE_EN]
    parts_zh: List[str] = [AGE_LINE_ZH]

    if model_type == "minimax_h3":
        parts_en.append("Style: photorealistic cinematic adult intimacy, natural skin, continuous camera.")
    else:
        parts_en.append(
            "Detailed adult pose and scene illustration, photorealistic, precise limb placement and contact surfaces."
        )

    if mode == "i2v":
        parts_en.append("IMAGE-TO-VIDEO: " + lock_en)
        parts_zh.append("图文生视频：" + lock_zh)
        parts_en.append("Do not restate facial appearance; drive motion from the input frame.")
    else:
        parts_en.append("MULTI-REFERENCE: " + lock_en)
        parts_zh.append("多参考：" + lock_zh)
        parts_en.append(
            "Slot binding: <Subject 1>/Image 1 = partner A; <Subject 2>/Image 2 = partner B; "
            "Image 3 = pose ref (pose only); Image 4 = scene; Image 5 = style weak_reference."
        )

    if subjects:
        parts_en.append("Subjects: " + _frag(subjects, "en") + (("; body: " + _frag(body, "en")) if body else ""))
        parts_zh.append("主体：" + _frag(subjects, "zh") + (("；体型：" + _frag(body, "zh")) if body else ""))
    if scenes:
        parts_en.append("Scene: " + _frag(scenes, "en"))
        parts_zh.append("场景：" + _frag(scenes, "zh"))
    if ward:
        parts_en.append("Wardrobe/props: " + _frag(ward, "en"))
        parts_zh.append("服装道具：" + _frag(ward, "zh"))
    if arcs:
        parts_en.append("Arc: " + _frag(arcs, "en"))
        parts_zh.append("叙事弧：" + _frag(arcs, "zh"))

    tl_en, tl_zh, _ = build_action_timeline(timeline or [], edit_mode=edit_mode)
    if tl_en:
        parts_en.append(tl_en)
        parts_zh.append(tl_zh)
    else:
        action_en = ". Then ".join(filter(None, [_frag(foreplay, "en"), _frag(oral, "en"), _frag(poses, "en")]))
        action_zh = "。随后 ".join(filter(None, [_frag(foreplay, "zh"), _frag(oral, "zh"), _frag(poses, "zh")]))
        if action_en:
            parts_en.append("Actions/poses: " + action_en + ".")
            parts_zh.append("动作姿势：" + action_zh + "。")

    if rhythm:
        parts_en.append("Rhythm: " + _frag(rhythm, "en"))
        parts_zh.append("节奏：" + _frag(rhythm, "zh"))
    if cams:
        parts_en.append("Camera: " + _frag(cams, "en") + ". Prefer one primary camera move.")
        parts_zh.append("镜头：" + _frag(cams, "zh") + "。优先一个主运镜。")
    if exprs:
        parts_en.append("Expression/sound cues: " + _frag(exprs, "en"))
        parts_zh.append("表情声音：" + _frag(exprs, "zh"))
    if dial:
        parts_en.append("Optional short dialogue: " + " ".join(d.get("en", "") for d in dial))
        parts_zh.append("可选对白：" + " / ".join(d.get("zh", "") for d in dial))

    if model_type == "minimax_h3":
        parts_en.append(
            "Soundscape: intimate room tone; wet skin contact; breath and soft moans synced to motion; "
            "fabric/sheets rustle. non_diegetic_music: N/A or very low pulse."
        )
        parts_zh.append("声景：私密室内底噪；肌肤接触；与动作同步的喘息轻吟；床单摩擦。")

    negs = PROMPT_DATA.get("negatives", {})
    neg_list = list(negs.get("common", []))
    neg_list += list(negs.get(mode, []))
    if model_type == "qwen_image":
        neg_list += list(negs.get("qwen", []))
    if model_type == "minimax_h3":
        neg_list += list(negs.get("h3", []))
    if timeline and len(timeline) >= 2:
        if edit_mode in ("continuous", "一镜到底", "one_take", "onetake"):
            neg_list += ["hard cut mid-take", "jump cut", "identity swap mid-morph", "contact point teleport"]
        else:
            neg_list += ["mismatched eyeline across cuts", "wardrobe teleport between shots", "broken action match"]
    negative = ", ".join(neg_list)

    if lang == "en":
        prompt = "\n\n".join(parts_en)
    elif lang == "zh":
        prompt = "\n\n".join(parts_zh)
    else:
        prompt = "【EN】\n" + "\n\n".join(parts_en) + "\n\n【ZH】\n" + "\n\n".join(parts_zh)

    return prompt, negative


# ---------------------------------------------------------------------------
# ComfyUI node classes
# ---------------------------------------------------------------------------


class NSFWLMModelList:
    """Output curated 4B / 8B uncensored LLM catalog for prompt expansion."""

    @classmethod
    def INPUT_TYPES(cls):
        return {
            "required": {
                "tier": (["all", "4B", "8B"], {"default": "all"}),
            }
        }

    RETURN_TYPES = ("STRING", "STRING")
    RETURN_NAMES = ("model_list_text", "model_list_json")
    FUNCTION = "run"
    CATEGORY = "nsfw_prompt"

    def run(self, tier: str):
        rows = NSFW_LM_MODELS if tier == "all" else [m for m in NSFW_LM_MODELS if m["tier"] == tier]
        lines = [
            "NSFW / Uncensored LM catalog (21+ fictional prompt expansion only)",
            "Verified Hugging Face repos — research date 2026-09-25",
            "",
        ]
        for m in rows:
            lines.append(f"[{m['tier']}] {m['name']} ({m['params']})")
            lines.append(f"  purpose: {m['purpose']}")
            lines.append(f"  repo:    {m['repo_id']}")
            lines.append(f"  url:     {m['url']}")
            lines.append(f"  usage:   {m['usage']}")
            lines.append("")
        text = "\n".join(lines)
        return (text, json.dumps(rows, ensure_ascii=False, indent=2))


class ActionTimelineBuilder:
    """Build optimized transition language from multi-beat (action, seconds)."""

    @classmethod
    def INPUT_TYPES(cls):
        return {
            "required": {
                "timeline_json": (
                    "STRING",
                    {
                        "multiline": True,
                        "default": json.dumps(
                            [
                                {"category": "foreplay", "action_id": "kiss_deep", "seconds": 3},
                                {"category": "oral", "action_id": "bj_kneel", "seconds": 5},
                                {"category": "sexPoses", "action_id": "missionary", "seconds": 8},
                            ],
                            ensure_ascii=False,
                            indent=2,
                        ),
                    },
                ),
                "edit_mode": (["continuous", "multicut"], {"default": "continuous"}),
                "lang": (["both", "en", "zh"], {"default": "both"}),
            }
        }

    RETURN_TYPES = ("STRING", "STRING", "STRING")
    RETURN_NAMES = ("timeline_prompt", "timeline_en", "timeline_zh")
    FUNCTION = "run"
    CATEGORY = "nsfw_prompt"

    def run(self, timeline_json: str, edit_mode: str, lang: str):
        data = _parse_jsonish(timeline_json)
        if not isinstance(data, list):
            data = []
        en, zh, both = build_action_timeline(data, edit_mode=edit_mode)
        if lang == "en":
            return (en, en, zh)
        if lang == "zh":
            return (zh, en, zh)
        return (both, en, zh)


class NSFWPromptComposer:
    """Compose positive/negative prompts from model, mode, bricks JSON, timeline JSON."""

    @classmethod
    def INPUT_TYPES(cls):
        default_sel = {
            "subjects": ["mf"],
            "scenes": ["bedroom_night"],
            "foreplay": ["kiss_deep"],
            "oral": ["bj_kneel"],
            "sexPoses": ["missionary"],
            "rhythm": ["building"],
            "cameras": ["medium", "push_in"],
            "expressions": ["breath_soft", "eye_contact"],
            "wardrobe": ["lingerie"],
            "arcs": ["arc_full"],
        }
        default_tl = [
            {"category": "foreplay", "action_id": "kiss_deep", "seconds": 3},
            {"category": "oral", "action_id": "bj_kneel", "seconds": 5},
            {"category": "sexPoses", "action_id": "missionary", "seconds": 8},
        ]
        return {
            "required": {
                "model_type": (["minimax_h3", "qwen_image"], {"default": "minimax_h3"}),
                "mode": (["i2v", "multiref"], {"default": "i2v"}),
                "edit_mode": (["continuous", "multicut"], {"default": "continuous"}),
                "lang": (["both", "en", "zh"], {"default": "both"}),
                "selection_json": (
                    "STRING",
                    {"multiline": True, "default": json.dumps(default_sel, ensure_ascii=False, indent=2)},
                ),
                "timeline_json": (
                    "STRING",
                    {"multiline": True, "default": json.dumps(default_tl, ensure_ascii=False, indent=2)},
                ),
            }
        }

    RETURN_TYPES = ("STRING", "STRING")
    RETURN_NAMES = ("positive_prompt", "negative_prompt")
    FUNCTION = "run"
    CATEGORY = "nsfw_prompt"

    def run(self, model_type, mode, edit_mode, lang, selection_json, timeline_json):
        selection = _parse_jsonish(selection_json) or {}
        if not isinstance(selection, dict):
            selection = {}
        timeline = _parse_jsonish(timeline_json) or []
        if not isinstance(timeline, list):
            timeline = []
        prompt, negative = compose_prompt(
            model_type=model_type,
            mode=mode,
            selection=selection,
            timeline=timeline,
            edit_mode=edit_mode,
            lang=lang,
        )
        return (prompt, negative)


NODE_CLASS_MAPPINGS = {
    "NSFWLMModelList": NSFWLMModelList,
    "NSFWPromptComposer": NSFWPromptComposer,
    "ActionTimelineBuilder": ActionTimelineBuilder,
}

NODE_DISPLAY_NAME_MAPPINGS = {
    "NSFWLMModelList": "NSFW LM Model List",
    "NSFWPromptComposer": "NSFW Prompt Composer",
    "ActionTimelineBuilder": "Action Timeline Builder",
}
