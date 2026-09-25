"""
Core NSFW prompt composition logic (no ComfyUI dependency).
Ports web-app app.js + director.js arrange/pack/compose for Python nodes.
21+ fictional adult content only (CNC/dark fantasy OK between adults).
"""
from __future__ import annotations

import json
import os
import re
import urllib.error
import urllib.request
from typing import Any, Dict, List, Optional, Tuple

_DIR = os.path.dirname(os.path.abspath(__file__))
_DATA_PATH = os.path.join(_DIR, "prompt_data.json")
_SHARED_DATA = os.path.normpath(os.path.join(_DIR, "..", "shared", "prompt_data.json"))

AGE_LINE_EN = (
    "All characters are clearly consenting adults aged 21 or older. "
    "Fictional adult content only (CNC/dark fantasy between adults 21+ allowed). "
    "No minors, no age ambiguity, no real celebrities."
)
AGE_LINE_ZH = (
    "所有角色均为明显自愿的21岁及以上成年人。"
    "仅虚构成人内容（允许成人间CNC/暗黑幻想）。无未成年、无年龄模糊、无真实名人。"
)

CAT_TITLES = {
    "foreplay": "前戏",
    "oral": "口交",
    "sexPoses": "性交姿势",
    "darkActs": "重口味·CNC",
    "subjects": "主体",
    "scenes": "场景",
    "rhythm": "节奏",
    "cameras": "镜头",
    "expressions": "表情",
    "wardrobe": "服装道具",
    "arcs": "叙事弧",
    "bodyTags": "体型",
    "dialogueSnippets": "对白",
}

NONE_OPTION = "(无)"

# Curated uncensored LM catalog (verified HF, research 2026-09-25)
NSFW_LM_MODELS: List[Dict[str, Any]] = [
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


def _load_prompt_data() -> Dict[str, Any]:
    for path in (_DATA_PATH, _SHARED_DATA):
        if os.path.isfile(path):
            with open(path, "r", encoding="utf-8") as f:
                return json.load(f)
    return {"meta": {}, "negatives": {"common": []}, "consistencyLocks": {}}


PROMPT_DATA = _load_prompt_data()
H3_MAX = int(PROMPT_DATA.get("meta", {}).get("h3MaxSeconds") or 15)


def _index_items() -> Dict[str, Dict[str, Dict[str, Any]]]:
    out: Dict[str, Dict[str, Dict[str, Any]]] = {}
    for key in (
        "foreplay", "oral", "sexPoses", "darkActs", "subjects", "scenes",
        "rhythm", "cameras", "expressions", "wardrobe", "arcs", "bodyTags",
        "dialogueSnippets",
    ):
        out[key] = {it["id"]: it for it in PROMPT_DATA.get(key, []) if isinstance(it, dict) and "id" in it}
    return out


ITEM_INDEX = _index_items()


def reload_prompt_data() -> Dict[str, Any]:
    global PROMPT_DATA, ITEM_INDEX, H3_MAX
    PROMPT_DATA = _load_prompt_data()
    ITEM_INDEX = _index_items()
    H3_MAX = int(PROMPT_DATA.get("meta", {}).get("h3MaxSeconds") or 15)
    return PROMPT_DATA


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


def format_option(item: Dict[str, Any]) -> str:
    """UI combo string: '中文标签 | id'"""
    label = item.get("label") or item.get("zh") or item.get("en") or item.get("id", "")
    iid = item.get("id", "")
    return f"{label} | {iid}"


def parse_option(s: str) -> str:
    """Extract id from 'label | id' or plain id; empty for (无)."""
    s = (s or "").strip()
    if not s or s == NONE_OPTION or s.startswith("(无)"):
        return ""
    if "|" in s:
        return s.rsplit("|", 1)[-1].strip()
    return s


def format_action_option(cat: str, item: Dict[str, Any]) -> str:
    title = CAT_TITLES.get(cat, cat)
    label = item.get("label") or item.get("zh") or item.get("en") or item.get("id", "")
    iid = item.get("id", "")
    return f"[{title}] {label} | {cat}/{iid}"


def parse_action_option(s: str) -> Tuple[str, str]:
    """Return (category, action_id) from flattened action combo string."""
    s = (s or "").strip()
    if not s or s == NONE_OPTION or s.startswith("(无)"):
        return "", ""
    # Prefer "cat/id" after last |
    if "|" in s:
        tail = s.rsplit("|", 1)[-1].strip()
        if "/" in tail:
            cat, aid = tail.split("/", 1)
            return cat.strip(), aid.strip()
        return "", tail
    if "/" in s:
        cat, aid = s.split("/", 1)
        return cat.strip(), aid.strip()
    return "", s


def combo_list(cat: str, include_none: bool = False) -> List[str]:
    items = PROMPT_DATA.get(cat, []) or []
    opts = [format_option(it) for it in items if isinstance(it, dict) and it.get("id")]
    if include_none:
        return [NONE_OPTION] + opts
    return opts or [NONE_OPTION]


def all_action_combo_list(include_none: bool = True) -> List[str]:
    opts: List[str] = []
    if include_none:
        opts.append(NONE_OPTION)
    for cat in ("foreplay", "oral", "sexPoses", "darkActs"):
        for it in PROMPT_DATA.get(cat, []) or []:
            if isinstance(it, dict) and it.get("id"):
                opts.append(format_action_option(cat, it))
    return opts


def action_cat_combo_list(include_none: bool = True) -> List[str]:
    base = [
        f"{CAT_TITLES['foreplay']} | foreplay",
        f"{CAT_TITLES['oral']} | oral",
        f"{CAT_TITLES['sexPoses']} | sexPoses",
        f"{CAT_TITLES['darkActs']} | darkActs",
    ]
    return ([NONE_OPTION] + base) if include_none else base


def find_action(cat: str, aid: str) -> Optional[Dict[str, Any]]:
    if cat and aid:
        it = ITEM_INDEX.get(cat, {}).get(aid)
        if it:
            return {**it, "_cat": cat}
    if aid:
        for c in ("foreplay", "oral", "sexPoses", "darkActs"):
            it = ITEM_INDEX.get(c, {}).get(aid)
            if it:
                return {**it, "_cat": c}
    return None


def clamp_seconds(n: Any, lo: int = 1, hi: Optional[int] = None) -> int:
    hi = H3_MAX if hi is None else hi
    try:
        v = int(float(n))
    except (TypeError, ValueError):
        v = 5
    return max(lo, min(hi, v))


def pack_h3_jobs(segs: List[Dict[str, Any]]) -> List[Dict[str, Any]]:
    """Pack timeline into H3 jobs each totaling ≤ H3_MAX seconds. Mirrors web packH3Jobs."""
    jobs: List[Dict[str, Any]] = []
    cur: List[Dict[str, Any]] = []
    used = 0
    for s in segs or []:
        sec = clamp_seconds(s.get("seconds", 5))
        item = {**s, "seconds": sec}
        if cur and used + sec > H3_MAX:
            jobs.append({"beats": cur, "total": used})
            cur = [item]
            used = sec
        else:
            cur.append(item)
            used += sec
    if cur:
        jobs.append({"beats": cur, "total": used})
    return jobs


def build_action_timeline(
    segments: List[Dict[str, Any]],
    edit_mode: str = "continuous",
    model_type: str = "minimax_h3",
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
        item = find_action(cat, aid)
        if item:
            en = item.get("en") or item.get("label") or aid
            zh = item.get("zh") or item.get("label") or aid
            label = item.get("label") or aid
            cat = item.get("_cat") or cat
        else:
            en = str(seg.get("en") or seg.get("action") or aid)
            zh = str(seg.get("zh") or seg.get("action") or aid)
            label = str(seg.get("label") or en)
        if not en and not zh:
            continue
        resolved.append({"en": en, "zh": zh, "label": label, "seconds": seconds, "category": cat, "action_id": aid})

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

    continuous = edit_mode in ("continuous", "一镜到底", "one_take", "onetake")
    trans_en, trans_zh = [], []
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

    if model_type == "minimax_h3":
        jobs = pack_h3_jobs(resolved)
        pack_en = [
            f"MINIMAX H3 LIMIT: each generation is at most ~{H3_MAX}s. "
            + (
                f"This timeline fits in ONE job ({jobs[0]['total']}s)."
                if len(jobs) == 1
                else f"Split into {len(jobs)} separate generations (do NOT expect one {total:g}s clip)."
            )
        ]
        pack_zh = [
            f"MINIMAX H3 限制：单次生成约 ≤{H3_MAX} 秒。"
            + (
                f"本时间轴可在【一条】任务内完成（{jobs[0]['total']}s）。"
                if len(jobs) == 1
                else f"已超过单次上限，请拆成 {len(jobs)} 条分别生成（不要指望一次出 {total:g}s）。"
            )
        ]
        for ji, job in enumerate(jobs):
            jt = 0
            lines_en, lines_zh = [], []
            for bi, b in enumerate(job["beats"]):
                a, e = jt, jt + b["seconds"]
                jt = e
                lines_en.append(f"  - JobBeat {bi + 1} [{a:g}–{e:g}s]: {b['en']}")
                lines_zh.append(f"  - 任务节拍{bi + 1}【{a:g}–{e:g}秒】：{b['zh'] or b['label']}")
            chain_en = "; I2V from your first frame" if ji == 0 else "; I2V start from last frame of previous job"
            chain_zh = "；用你的首帧/参考图做 I2V" if ji == 0 else "；用上一条最后一帧做本条首帧 I2V"
            pack_en.append(
                f"H3 JOB {ji + 1}/{len(jobs)} (generate {job['total']}s{chain_en}):\n" + "\n".join(lines_en)
            )
            pack_zh.append(
                f"H3 任务 {ji + 1}/{len(jobs)}（生成 {job['total']} 秒{chain_zh}）：\n" + "\n".join(lines_zh)
            )
        en = "\n".join(pack_en) + "\n\n" + en
        zh = "\n".join(pack_zh) + "\n\n" + zh

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
    dark = _pick("darkActs", selection.get("darkActs", []))
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
        parts_en.append("Style: photorealistic cinematic adult intimacy/dark fantasy, natural skin, continuous camera.")
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

    tl_en, tl_zh, _ = build_action_timeline(timeline or [], edit_mode=edit_mode, model_type=model_type)
    if tl_en:
        parts_en.append(tl_en)
        parts_zh.append(tl_zh)
    else:
        action_en = ". Then ".join(
            filter(None, [_frag(foreplay, "en"), _frag(oral, "en"), _frag(poses, "en"), _frag(dark, "en")])
        )
        action_zh = "。随后 ".join(
            filter(None, [_frag(foreplay, "zh"), _frag(oral, "zh"), _frag(poses, "zh"), _frag(dark, "zh")])
        )
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
            "Soundscape: intimate/dark room tone; wet skin contact; breath, muffled cries or moans synced to motion; "
            "fabric/restraint rustle. non_diegetic_music: N/A or very low pulse."
        )
        parts_zh.append("声景：私密/暗黑室内底噪；肌肤接触；与动作同步的喘息/闷叫/轻吟；布料或束缚摩擦。")

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


def build_context_parts(
    model_type: str,
    mode: str,
    selection: Dict[str, List[str]],
) -> Tuple[List[str], List[str]]:
    """Shared header context without full timeline (for per-job prompts)."""
    subjects = _pick("subjects", selection.get("subjects", []))
    body = _pick("bodyTags", selection.get("bodyTags", []))
    scenes = _pick("scenes", selection.get("scenes", []))
    ward = _pick("wardrobe", selection.get("wardrobe", []))
    arcs = _pick("arcs", selection.get("arcs", []))
    rhythm = _pick("rhythm", selection.get("rhythm", []))
    cams = _pick("cameras", selection.get("cameras", []))
    exprs = _pick("expressions", selection.get("expressions", []))
    dial = _pick("dialogueSnippets", selection.get("dialogueSnippets", []))

    locks = PROMPT_DATA.get("consistencyLocks", {})
    lock_en = locks.get("i2v" if mode == "i2v" else "multiref", "")
    lock_zh = locks.get("i2v_zh" if mode == "i2v" else "multiref_zh", "")

    parts_en: List[str] = [AGE_LINE_EN]
    parts_zh: List[str] = [AGE_LINE_ZH]
    if model_type == "minimax_h3":
        parts_en.append("Style: photorealistic cinematic adult intimacy/dark fantasy, natural skin, continuous camera.")
    else:
        parts_en.append("Detailed adult pose and scene illustration, photorealistic, precise limb placement and contact surfaces.")
    if mode == "i2v":
        parts_en.append("IMAGE-TO-VIDEO: " + lock_en)
        parts_zh.append("图文生视频：" + lock_zh)
        parts_en.append("Do not restate facial appearance; drive motion from the input frame.")
    else:
        parts_en.append("MULTI-REFERENCE: " + lock_en)
        parts_zh.append("多参考：" + lock_zh)
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
    if rhythm:
        parts_en.append("Rhythm: " + _frag(rhythm, "en"))
        parts_zh.append("节奏：" + _frag(rhythm, "zh"))
    if cams:
        parts_en.append("Camera: " + _frag(cams, "en") + ". Prefer one primary camera move; smooth continuous motion.")
        parts_zh.append("镜头：" + _frag(cams, "zh") + "。优先一个主运镜。")
    if exprs:
        parts_en.append("Expression/sound cues: " + _frag(exprs, "en"))
        parts_zh.append("表情声音：" + _frag(exprs, "zh"))
    if dial:
        parts_en.append("Optional short dialogue: " + " ".join(d.get("en", "") for d in dial))
        parts_zh.append("可选对白：" + " / ".join(d.get("zh", "") for d in dial))
    if model_type == "minimax_h3":
        parts_en.append(
            "Soundscape: close intimate/dark room tone; wet skin contact; breath, muffled cries or moans synced to motion; "
            "fabric/restraint rustle. non_diegetic_music: N/A or very low pulse."
        )
        parts_zh.append("声景：私密/暗黑室内底噪；肌肤接触；与动作同步的喘息/闷叫/轻吟；布料或束缚摩擦。")
    return parts_en, parts_zh


def build_h3_job_prompts(
    model_type: str,
    mode: str,
    selection: Dict[str, List[str]],
    timeline: List[Dict[str, Any]],
    edit_mode: str,
    lang: str,
) -> List[Dict[str, Any]]:
    """Per-job ≤15s prompts for H3 chaining."""
    # Resolve beats with en/zh
    resolved: List[Dict[str, Any]] = []
    for seg in timeline or []:
        cat = seg.get("category") or seg.get("cat") or "sexPoses"
        aid = seg.get("action_id") or seg.get("actionId") or seg.get("action") or ""
        seconds = clamp_seconds(seg.get("seconds") or seg.get("sec") or 5)
        item = find_action(cat, aid)
        if item:
            en = item.get("en") or item.get("label") or aid
            zh = item.get("zh") or item.get("label") or aid
            label = item.get("label") or aid
            cat = item.get("_cat") or cat
        else:
            en = str(seg.get("en") or aid)
            zh = str(seg.get("zh") or aid)
            label = str(seg.get("label") or en)
        if not en and not zh:
            continue
        resolved.append({"en": en, "zh": zh, "label": label, "seconds": seconds, "category": cat, "action_id": aid})

    parts_en, parts_zh = build_context_parts(model_type, mode, selection)
    continuous = edit_mode in ("continuous", "一镜到底", "one_take", "onetake")
    edit_en = "ONE CONTINUOUS TAKE" if continuous else "MULTI-SHOT EDIT"
    edit_zh = "一镜到底" if continuous else "多镜头剪辑"
    jobs = pack_h3_jobs(resolved) if resolved else [{"beats": [], "total": 0}]
    neg = ""  # negative built separately

    out: List[Dict[str, Any]] = []
    for ji, job in enumerate(jobs):
        lines_en, lines_zh = [], []
        jt = 0
        for bi, b in enumerate(job["beats"]):
            a, e = jt, jt + b["seconds"]
            jt = e
            lines_en.append(f"[JobBeat {bi + 1} | {a:g}–{e:g}s] {b['en']}")
            lines_zh.append(f"【任务节拍{bi + 1}｜{a:g}–{e:g}秒】{b['zh'] or b['label']}")
        chain_en = (
            "I2V from your first frame / reference image."
            if ji == 0
            else "I2V start from the LAST FRAME of the previous H3 job — preserve identity, wardrobe state, contact points, lighting."
        )
        chain_zh = (
            "用你的首帧/参考图做 I2V。"
            if ji == 0
            else "用【上一条 H3 任务最后一帧】做本条首帧 I2V——保持身份、服装状态、接触点、光照。"
        )
        head_en = [
            f"MINIMAX H3 JOB {ji + 1}/{len(jobs)} — generate exactly ~{job['total'] or 0}s (≤{H3_MAX}s). {chain_en}",
            f"Edit: {edit_en}.",
        ]
        head_zh = [
            f"MINIMAX H3 任务 {ji + 1}/{len(jobs)} — 生成约 {job['total'] or 0} 秒（≤{H3_MAX}s）。{chain_zh}",
            f"剪辑：{edit_zh}。",
        ]
        body_en = head_en + list(parts_en)
        body_zh = head_zh + list(parts_zh)
        if lines_en:
            body_en.append("Action timeline for THIS job only:\n" + "\n".join(lines_en))
            body_zh.append("本条任务动作时间轴：\n" + "\n".join(lines_zh))
            if continuous:
                body_en.append("CONTINUOUS-TAKE: soft morph between beats inside this job; no hard cut; no identity drift.")
                body_zh.append("一镜到底：本条内节拍柔和 morph；禁止硬切；禁止身份漂移。")
            else:
                body_en.append("MULTI-SHOT: match cut / raccord between beats inside this job; preserve adult identities.")
                body_zh.append("多镜头：本条内 match cut / raccord；跨镜锁定成人身份。")
        if lang == "en":
            text = "\n\n".join(body_en)
        elif lang == "zh":
            text = "\n\n".join(body_zh)
        else:
            text = "【EN】\n" + "\n\n".join(body_en) + "\n\n【ZH】\n" + "\n\n".join(body_zh)
        out.append({
            "index": ji + 1,
            "totalJobs": len(jobs),
            "seconds": job["total"] or 0,
            "beats": job["beats"],
            "text": text,
            "chain_note_en": chain_en,
            "chain_note_zh": chain_zh,
        })
    return out


# ---------------------------------------------------------------------------
# Story arrange (port of director.js arrangeFromStory)
# ---------------------------------------------------------------------------

KEYWORD_MAP = [
    {"re": re.compile(r"强奸|强迫|非自愿|CNC|non[\s-]?con|rape|forced|挣扎|压制|撕衣", re.I),
     "acts": ["cnc_struggle_pin", "cnc_tear_clothes", "cnc_forced_entry", "cnc_rough_thrust", "cnc_muffled_cry"],
     "scene": "locked_bedroom", "subject": "mf", "ward": ["torn_clothes"],
     "expr": ["fear_pleasure_mix", "tears_cnc"], "arc": "arc_forced_break"},
    {"re": re.compile(r"轮奸|多人|gangbang|gang\s*bang|一女多男|围拢|轮流", re.I),
     "acts": ["gang_surround", "gang_oral_train", "gang_penetration_chain", "gang_finish_marks"],
     "scene": "warehouse_dark", "subject": "gang_mf", "ward": ["lingerie_ripped"],
     "expr": ["muffled_sound", "fear_pleasure_mix"], "arc": "arc_gang_rounds"},
    {"re": re.compile(r"调教|BDSM|项圈|牵引|打臀|高潮控制|宠物|羞辱|绳缚|口球|蒙眼", re.I),
     "acts": ["train_collar_leash", "train_spank_count", "train_orgasm_control", "train_forced_orgasm", "bondage_rope_full"],
     "scene": "dungeon_playroom", "subject": "mf", "ward": ["collar_leash_set", "rope_visible"],
     "expr": ["breaking_submit", "defiant_glare"], "arc": "arc_train_progress"},
    {"re": re.compile(r"迷奸|昏睡|迷药|drug|drowsy|sleep\s*sex|软体|无意识", re.I),
     "acts": ["drug_drowsy_setup", "drug_limp_use", "drug_wake_halfway"],
     "scene": "motel_dark", "subject": "mf", "ward": ["lingerie"],
     "expr": ["dazed_drowsy"], "arc": "arc_drug_wake"},
    {"re": re.compile(r"绑架|van|厢式|拖入|囚禁", re.I),
     "acts": ["kidnap_van_grab", "cnc_struggle_pin", "cnc_forced_entry", "bondage_rope_full"],
     "scene": "van_interior", "subject": "mf", "ward": ["duct_tape", "tape_wrists"],
     "expr": ["defiant_glare", "fear_pleasure_mix"], "arc": "arc_kidnap_escalate"},
    {"re": re.compile(r"勒索|胁迫|blackmail|coerce|办公室", re.I),
     "acts": ["blackmail_coerce", "cnc_forced_entry", "cnc_rough_thrust"],
     "scene": "office_coerce", "subject": "mf", "ward": ["office_disheveled"],
     "expr": ["defiant_glare", "breaking_submit"], "arc": "arc_forced_break"},
    {"re": re.compile(r"公共|差点|巷|alley|almost.?caught", re.I),
     "acts": ["public_risk_almost", "cnc_rough_thrust"],
     "scene": "alley_night", "subject": "mf", "ward": ["torn_clothes"],
     "expr": ["muffled_sound"], "arc": "arc_quickie"},
    {"re": re.compile(r"口交|oral|深喉|跪", re.I), "oral": ["bj_kneel", "bj_deep"]},
    {"re": re.compile(r"后入|doggy|prone", re.I), "pose": ["doggy", "doggy_chest_down"]},
    {"re": re.compile(r"传教士|missionary", re.I), "pose": ["missionary", "missionary_legs_up"]},
    {"re": re.compile(r"骑乘|cowgirl", re.I), "pose": ["cowgirl", "reverse_cowgirl"]},
    {"re": re.compile(r"酒店|hotel|套房", re.I), "sceneOnly": "hotel_suite"},
    {"re": re.compile(r"地牢|dungeon|playroom", re.I), "sceneOnly": "dungeon_playroom"},
    {"re": re.compile(r"仓库|warehouse", re.I), "sceneOnly": "warehouse_dark"},
    {"re": re.compile(r"前戏|亲吻|kiss|爱抚", re.I), "foreplay": ["kiss_deep", "grind_clothed"]},
    {"re": re.compile(r"器具|玩具|跳蛋|插入玩具", re.I),
     "acts": ["object_toy_insert", "train_forced_orgasm"], "ward": ["vibrator_prop"]},
    {"re": re.compile(r"中出|creampie|繁殖", re.I), "acts": ["creampie_breed_talk"]},
    {"re": re.compile(r"颜射|facial", re.I), "acts": ["facial_finish"]},
]


def _uniq(arr: List[str]) -> List[str]:
    seen = set()
    out = []
    for x in arr:
        if x and x not in seen:
            seen.add(x)
            out.append(x)
    return out


def detect_themes(text: str) -> List[Dict[str, Any]]:
    hits = []
    for rule in KEYWORD_MAP:
        if rule["re"].search(text or ""):
            hits.append(rule)
    return hits


def arrange_from_story(
    text: str,
    target_seconds: int = 15,
    edit_mode: str = "continuous",
) -> Dict[str, Any]:
    """Port of director.js arrangeFromStory — keyword → bricks → timeline → H3 jobs."""
    t_sec = max(5, min(180, int(target_seconds or 45)))
    hits = detect_themes(text or "")
    selected: Dict[str, List[str]] = {
        "subjects": [], "bodyTags": [], "scenes": [], "foreplay": [], "oral": [],
        "sexPoses": [], "darkActs": [], "rhythm": [], "cameras": [], "expressions": [],
        "dialogueSnippets": [], "wardrobe": [], "arcs": [],
    }
    preferred_acts: List[str] = []
    for h in hits:
        if h.get("acts"):
            preferred_acts.extend(h["acts"])
        if h.get("oral"):
            selected["oral"].extend(h["oral"])
        if h.get("pose"):
            selected["sexPoses"].extend(h["pose"])
        if h.get("foreplay"):
            selected["foreplay"].extend(h["foreplay"])
        if h.get("ward"):
            selected["wardrobe"].extend(h["ward"])
        if h.get("expr"):
            selected["expressions"].extend(h["expr"])
        if h.get("subject"):
            selected["subjects"] = [h["subject"]]
        if h.get("scene"):
            selected["scenes"] = [h["scene"]]
        if h.get("sceneOnly"):
            selected["scenes"] = [h["sceneOnly"]]
        if h.get("arc"):
            selected["arcs"] = [h["arc"]]

    preferred_acts = _uniq(preferred_acts)
    if not preferred_acts:
        selected["foreplay"] = selected["foreplay"] or ["kiss_deep", "strip_tease"]
        selected["oral"] = selected["oral"] or ["bj_kneel"]
        selected["sexPoses"] = selected["sexPoses"] or ["missionary", "doggy"]

    if not selected["subjects"]:
        selected["subjects"] = (
            ["gang_mf"] if any(str(i).startswith("gang_") for i in preferred_acts) else ["mf"]
        )
    if not selected["scenes"]:
        selected["scenes"] = ["bedroom_night"]
    if not selected["rhythm"]:
        selected["rhythm"] = ["intense"] if preferred_acts else ["building"]
    if not selected["cameras"]:
        selected["cameras"] = _uniq(
            ["medium", "closeup_face", "handheld" if preferred_acts else "push_in"]
        )
    if not selected["expressions"]:
        selected["expressions"] = (
            ["fear_pleasure_mix", "breath_hard"] if preferred_acts else ["breath_soft", "eye_contact"]
        )
    if not selected["arcs"]:
        selected["arcs"] = ["arc_forced_break"] if preferred_acts else ["arc_full"]
    if not selected["wardrobe"]:
        selected["wardrobe"] = ["torn_clothes"] if preferred_acts else ["lingerie"]
    selected["darkActs"] = preferred_acts[:8]
    for k in ("oral", "sexPoses", "foreplay", "wardrobe", "expressions", "cameras"):
        selected[k] = _uniq(selected[k])

    timeline: List[Dict[str, Any]] = []

    def push_beat(category: str, action_id: str, seconds: float) -> None:
        timeline.append({
            "category": category,
            "action_id": action_id,
            "seconds": max(3, min(H3_MAX, int(seconds))),
        })

    dark_ids = list(selected["darkActs"])
    has_dark = len(dark_ids) > 0
    text_l = text or ""

    if has_dark:
        if re.search(r"绑架|van|kidnap", text_l, re.I):
            push_beat("darkActs", "kidnap_van_grab", 4)
        elif re.search(r"迷奸|drowsy|drug|昏睡", text_l, re.I):
            push_beat("darkActs", "drug_drowsy_setup", 5)
        elif re.search(r"调教|collar|项圈", text_l, re.I):
            push_beat("darkActs", "train_collar_leash", 4)
        elif re.search(r"轮奸|gang", text_l, re.I):
            push_beat("darkActs", "gang_surround", 4)
        else:
            push_beat("darkActs", dark_ids[0] if dark_ids else "cnc_struggle_pin", 4)

        used_ids = {t["action_id"] for t in timeline}
        core = [i for i in dark_ids if i not in used_ids][:5]
        for i, aid in enumerate(core):
            push_beat("darkActs", aid, 7 if i == len(core) - 1 else 5)

        if selected["oral"] and sum(s["seconds"] for s in timeline) < t_sec - 6:
            push_beat("oral", selected["oral"][0], 5)
        if selected["sexPoses"] and re.search(r"后入|doggy|传教士|骑乘", text_l, re.I):
            push_beat("sexPoses", selected["sexPoses"][0], 6)

        if re.search(r"中出|creampie|繁殖", text_l, re.I):
            push_beat("darkActs", "creampie_breed_talk", 4)
        elif re.search(r"颜射|facial", text_l, re.I):
            push_beat("darkActs", "facial_finish", 4)
        elif "gang_finish_marks" in dark_ids:
            push_beat("darkActs", "gang_finish_marks", 4)
        elif "train_forced_orgasm" in dark_ids:
            push_beat("darkActs", "train_forced_orgasm", 5)
        elif "marks_bruises_stylized" in dark_ids:
            push_beat("darkActs", "marks_bruises_stylized", 3)
        else:
            push_beat("darkActs", dark_ids[-1] if dark_ids else "cnc_rough_thrust", 5)
    else:
        if selected["foreplay"]:
            push_beat("foreplay", selected["foreplay"][0], 4)
        if selected["oral"]:
            push_beat("oral", selected["oral"][0], 5)
        poses = selected["sexPoses"][:2] or ["missionary"]
        for i, aid in enumerate(poses):
            push_beat("sexPoses", aid, 7 if i == 0 else 5)

    total = sum(s["seconds"] for s in timeline)
    if total < t_sec:
        need = t_sec - total
        i = 0
        while need > 0 and timeline:
            idx = len(timeline) - 1 - (i % min(3, len(timeline)))
            room = H3_MAX - timeline[idx]["seconds"]
            if room > 0:
                add = min(room, need, 3)
                timeline[idx]["seconds"] += add
                need -= add
            i += 1
            if i > 40:
                break
        while need >= 3:
            last = timeline[-1]
            if has_dark and dark_ids:
                pad_id = dark_ids[min(len(dark_ids) - 1, len(timeline) % len(dark_ids))]
                cat = "darkActs"
            else:
                pad_id = last["action_id"]
                cat = last["category"]
            sec = min(8, need, H3_MAX)
            push_beat(cat, pad_id, sec)
            need -= sec
            if len(timeline) > 12:
                break
    elif total > t_sec:
        while len(timeline) > 1 and sum(s["seconds"] for s in timeline) > t_sec:
            last = timeline[-1]
            over = sum(s["seconds"] for s in timeline) - t_sec
            if last["seconds"] - over >= 3:
                last["seconds"] -= over
                break
            timeline.pop()

    cleaned: List[Dict[str, Any]] = []
    for b in timeline:
        prev = cleaned[-1] if cleaned else None
        if prev and prev["category"] == b["category"] and prev["action_id"] == b["action_id"]:
            prev["seconds"] = min(H3_MAX, prev["seconds"] + b["seconds"])
        else:
            cleaned.append(dict(b))

    final_total = sum(s["seconds"] for s in cleaned)
    jobs = pack_h3_jobs(cleaned)
    return {
        "selected": selected,
        "timeline": cleaned,
        "editMode": edit_mode or "continuous",
        "notes": (
            f"本地规则编排：检测到 {len(hits)} 类主题关键词；"
            f"总时长约 {final_total}s → {len(jobs)} 条 H3 任务（每条 ≤{H3_MAX}s）。"
            f"成人21+虚构 CNC/暗黑内容已按积木映射。"
        ),
        "jobs": jobs,
        "targetSeconds": t_sec,
        "source": "local",
    }


def merge_selection(base: Dict[str, List[str]], extra: Any) -> Dict[str, List[str]]:
    out = {k: list(v) for k, v in (base or {}).items()}
    if not isinstance(extra, dict):
        return out
    for k, v in extra.items():
        if isinstance(v, list):
            out[k] = _uniq(list(out.get(k, [])) + [str(x) for x in v])
        elif isinstance(v, str) and v:
            out[k] = _uniq(list(out.get(k, [])) + [v])
    return out


def format_brick_catalog(include_lm: bool = True) -> Tuple[str, str]:
    """Human-readable Chinese catalog + JSON."""
    keys = [
        "subjects", "scenes", "foreplay", "oral", "sexPoses", "darkActs",
        "rhythm", "cameras", "expressions", "wardrobe", "arcs", "bodyTags", "dialogueSnippets",
    ]
    lines = [
        "===== NSFW 积木目录（21+ 虚构成人）=====",
        f"数据版本: {PROMPT_DATA.get('meta', {}).get('version', '?')} | H3 单次上限 {H3_MAX}s",
        "",
    ]
    compact: Dict[str, List[str]] = {}
    for k in keys:
        title = CAT_TITLES.get(k, k)
        items = PROMPT_DATA.get(k, []) or []
        lines.append(f"【{title}】({k}) — {len(items)} 项")
        compact[k] = []
        for it in items:
            if not isinstance(it, dict) or not it.get("id"):
                continue
            lab = it.get("label") or it.get("zh") or it.get("id")
            lines.append(f"  · {lab}  [{it['id']}]")
            compact[k].append(f"{it['id']}|{lab}")
        lines.append("")
    if include_lm:
        lines.append("【推荐 Uncensored LM（提示词润色/扩写）】")
        for m in NSFW_LM_MODELS:
            lines.append(f"  [{m['tier']}] {m['name']}")
            lines.append(f"      repo: {m['repo_id']}")
            lines.append(f"      {m['url']}")
        lines.append("")
        compact["lm_models"] = [f"{m['tier']}|{m['repo_id']}" for m in NSFW_LM_MODELS]
    text = "\n".join(lines)
    return text, json.dumps(compact, ensure_ascii=False, indent=2)


HOWTO_DEFAULT = """【用法 · NSFW H3 导演台】打开本节点即可用，无需手写 JSON。

① 选 model_type（minimax_h3 / qwen_image）与 mode（i2v / multiref）
② 选 edit_mode：continuous=一镜到底 | multicut=多镜头
③ 下拉选 subject / scene / rhythm / arc / camera / expression / wardrobe
④ 编排节拍（二选一）：
   · arrange_mode=manual_beats → 用 beat1~beat6 下拉选动作+秒数
   · arrange_mode=story_local → 在 chapter_plot 粘贴章节，本地关键词自动编排（覆盖手动节拍）
⑤ Queue Prompt → 看输出：
   · howto_text / brick_catalog → 说明与目录
   · positive_prompt / negative_prompt → 直接可用
   · h3_jobs_text → 全部 ≤15s 任务（含衔接说明）
   · job1_prompt / job2_prompt / job3_prompt → 前三条可直接接线
⑥ 可选：ai_polish=True + 填 api_base/api_key/api_model → OpenAI 兼容接口润色每条 JOB
⑦ 高级：extra_selection_json / extra_timeline_json 可合并额外积木（默认可留空）

边界：仅 21+ 虚构成人；允许 CNC/暗黑幻想；禁止未成年/名人/兽交/虐杀。
H3：单次 ≤15 秒；超时自动拆多条 JOB，用上一条末帧做下一条 I2V。
"""


POLISH_SYSTEM = (
    "You polish NSFW video generation prompts for MiniMax H3 / Hailuo. "
    "Keep ALL factual beats, durations, job boundaries, identities, and 21+ / CNC adult fantasy wording if present. "
    "Improve cinematic motion, camera continuity, contact points, wetness, breath/soundscape for H3. "
    "Never invent minors, real celebrities, snuff, or bestiality. "
    "Output plain prompt text only (no markdown fences, no commentary). "
    "If bilingual EN/ZH sections exist, keep both improved."
)


def call_chat_completions(
    api_base: str,
    api_key: str,
    api_model: str,
    system: str,
    user: str,
    temperature: float = 0.4,
    timeout: float = 60.0,
) -> str:
    root = (api_base or "https://api.openai.com/v1").rstrip("/")
    url = root + "/chat/completions"
    payload = {
        "model": api_model or "gpt-4o-mini",
        "temperature": temperature,
        "messages": [
            {"role": "system", "content": system},
            {"role": "user", "content": user},
        ],
    }
    data = json.dumps(payload).encode("utf-8")
    headers = {"Content-Type": "application/json"}
    if api_key:
        headers["Authorization"] = "Bearer " + api_key
    req = urllib.request.Request(url, data=data, headers=headers, method="POST")
    with urllib.request.urlopen(req, timeout=timeout) as resp:
        body = json.loads(resp.read().decode("utf-8"))
    content = (
        body.get("choices", [{}])[0]
        .get("message", {})
        .get("content")
    )
    if not content:
        raise RuntimeError("empty LLM response")
    return str(content).strip()


def polish_jobs(
    jobs: List[Dict[str, Any]],
    api_base: str,
    api_key: str,
    api_model: str,
) -> List[Dict[str, Any]]:
    """Polish each job text via OpenAI-compatible API; on fail keep original."""
    out = []
    for j in jobs:
        text = j.get("text") or ""
        polished = text
        if api_base and text:
            try:
                polished = call_chat_completions(
                    api_base, api_key, api_model, POLISH_SYSTEM,
                    "Polish this H3 job prompt:\n\n" + text,
                )
            except Exception:
                polished = text
        out.append({**j, "text": polished, "polished": polished != text})
    return out


def format_h3_jobs_text(jobs: List[Dict[str, Any]]) -> str:
    if not jobs:
        return "(无 H3 任务)"
    lines = [f"===== H3 任务总览 · 共 {len(jobs)} 条 · 每条 ≤{H3_MAX}s =====", ""]
    for j in jobs:
        lines.append(
            f"----- JOB {j['index']}/{j['totalJobs']} · {j['seconds']}s ----- "
            f"{'(已润色)' if j.get('polished') else ''}"
        )
        lines.append(j.get("chain_note_zh") or j.get("chain_note_en") or "")
        lines.append(j.get("text") or "")
        lines.append("")
    return "\n".join(lines)


def studio_run(
    *,
    howto: str = "",
    model_type: str = "minimax_h3",
    mode: str = "i2v",
    edit_mode: str = "continuous",
    lang: str = "both",
    subject: str = "",
    scene: str = "",
    rhythm: str = "",
    arc: str = "",
    camera1: str = "",
    camera2: str = "",
    expression1: str = "",
    wardrobe1: str = "",
    beats: Optional[List[Tuple[str, str, int]]] = None,
    target_total_seconds: int = 15,
    chapter_plot: str = "",
    arrange_mode: str = "manual_beats",
    ai_polish: bool = False,
    api_base: str = "",
    api_key: str = "",
    api_model: str = "",
    extra_selection_json: str = "",
    extra_timeline_json: str = "",
) -> Dict[str, str]:
    """
    Main studio entry. beats = list of (cat_opt, action_opt, sec) length up to 6.
    Returns dict of named string outputs.
    """
    beats = beats or []
    selection: Dict[str, List[str]] = {
        "subjects": [], "bodyTags": [], "scenes": [], "foreplay": [], "oral": [],
        "sexPoses": [], "darkActs": [], "rhythm": [], "cameras": [], "expressions": [],
        "dialogueSnippets": [], "wardrobe": [], "arcs": [],
    }

    sid = parse_option(subject)
    if sid:
        selection["subjects"] = [sid]
    scid = parse_option(scene)
    if scid:
        selection["scenes"] = [scid]
    rid = parse_option(rhythm)
    if rid:
        selection["rhythm"] = [rid]
    arid = parse_option(arc)
    if arid:
        selection["arcs"] = [arid]
    for cam in (camera1, camera2):
        cid = parse_option(cam)
        if cid:
            selection["cameras"].append(cid)
    selection["cameras"] = _uniq(selection["cameras"])
    eid = parse_option(expression1)
    if eid:
        selection["expressions"] = [eid]
    wid = parse_option(wardrobe1)
    if wid:
        selection["wardrobe"] = [wid]

    timeline: List[Dict[str, Any]] = []
    notes = ""

    use_story = (
        arrange_mode in ("story_local", "story", "本地编排", "story_local (本地关键词编排)")
        and (chapter_plot or "").strip()
    )
    if use_story:
        arranged = arrange_from_story(chapter_plot, target_total_seconds, edit_mode)
        selection = merge_selection(selection, arranged.get("selected") or {})
        # Prefer story-selected subjects/scenes if user left blank-ish; story already filled
        timeline = arranged.get("timeline") or []
        notes = arranged.get("notes") or ""
    else:
        for cat_opt, act_opt, sec in beats:
            cat = parse_option(cat_opt) if cat_opt else ""
            # action may be "cat/id" form
            acat, aid = parse_action_option(act_opt)
            if not aid:
                continue
            if acat:
                cat = acat
            if not cat:
                # search all
                found = find_action("", aid)
                cat = (found or {}).get("_cat") or "sexPoses"
            timeline.append({
                "category": cat,
                "action_id": aid,
                "seconds": clamp_seconds(sec, 1, 15),
            })
            # also mirror into selection lists for brick summary
            if cat in selection and aid not in selection[cat]:
                selection[cat].append(aid)

    extra_sel = _parse_jsonish(extra_selection_json)
    if isinstance(extra_sel, dict):
        selection = merge_selection(selection, extra_sel)
    extra_tl = _parse_jsonish(extra_timeline_json)
    if isinstance(extra_tl, list) and extra_tl:
        # merge / append
        for seg in extra_tl:
            if isinstance(seg, dict):
                timeline.append({
                    "category": seg.get("category") or seg.get("cat") or "sexPoses",
                    "action_id": seg.get("action_id") or seg.get("actionId") or seg.get("action") or "",
                    "seconds": clamp_seconds(seg.get("seconds") or seg.get("sec") or 5, 1, 15),
                })

    # defaults if still empty
    if not selection["subjects"]:
        selection["subjects"] = ["mf"]
    if not selection["scenes"]:
        selection["scenes"] = ["bedroom_night"]
    if not timeline:
        timeline = [
            {"category": "foreplay", "action_id": "kiss_deep", "seconds": 3},
            {"category": "oral", "action_id": "bj_kneel", "seconds": 5},
            {"category": "sexPoses", "action_id": "missionary", "seconds": 7},
        ]
        for seg in timeline:
            cat = seg["category"]
            if seg["action_id"] not in selection.get(cat, []):
                selection.setdefault(cat, []).append(seg["action_id"])

    prompt, negative = compose_prompt(
        model_type=model_type,
        mode=mode,
        selection=selection,
        timeline=timeline,
        edit_mode=edit_mode,
        lang=lang,
    )

    job_list = build_h3_job_prompts(
        model_type=model_type,
        mode=mode,
        selection=selection,
        timeline=timeline,
        edit_mode=edit_mode,
        lang=lang,
    )
    if ai_polish and (api_base or "").strip():
        job_list = polish_jobs(job_list, api_base.strip(), api_key or "", api_model or "gpt-4o-mini")

    h3_text = format_h3_jobs_text(job_list)
    catalog_text, _ = format_brick_catalog(include_lm=True)

    # brick summary for howto echo
    summary_lines = ["【本次积木摘要】"]
    for k in ("subjects", "scenes", "foreplay", "oral", "sexPoses", "darkActs", "rhythm", "cameras", "expressions", "wardrobe", "arcs"):
        ids = selection.get(k) or []
        if not ids:
            continue
        labels = []
        for i in ids:
            it = ITEM_INDEX.get(k, {}).get(i)
            labels.append((it or {}).get("label") or i)
        summary_lines.append(f"  {CAT_TITLES.get(k, k)}: " + "、".join(labels))
    summary_lines.append(f"  节拍数: {len(timeline)} · H3 JOB 数: {len(job_list)}")
    if notes:
        summary_lines.append("  " + notes)
    howto_out = (howto or HOWTO_DEFAULT).rstrip() + "\n\n" + "\n".join(summary_lines)

    job1 = job_list[0]["text"] if len(job_list) > 0 else ""
    job2 = job_list[1]["text"] if len(job_list) > 1 else ""
    job3 = job_list[2]["text"] if len(job_list) > 2 else ""

    # positive: prefer job1 for H3 multi, or combined with markers
    if model_type == "minimax_h3" and len(job_list) > 1:
        positive = h3_text  # full multi-job marked text
    elif job_list:
        positive = job_list[0]["text"]
    else:
        positive = prompt

    return {
        "howto_text": howto_out,
        "positive_prompt": positive,
        "negative_prompt": negative,
        "h3_jobs_text": h3_text,
        "job1_prompt": job1,
        "job2_prompt": job2,
        "job3_prompt": job3,
        "brick_catalog": catalog_text,
    }
