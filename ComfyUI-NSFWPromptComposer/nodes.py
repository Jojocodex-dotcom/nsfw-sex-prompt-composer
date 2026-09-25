"""
ComfyUI nodes for NSFW H3 Director Studio (21+ fictional adult only).
Two nodes only: NSFWDirectorStudio + NSFWBrickCatalog.
Importable without ComfyUI installed.
"""
from __future__ import annotations

from typing import Any, Dict, List

try:
    from .logic import (
        HOWTO_DEFAULT,
        action_cat_combo_list,
        all_action_combo_list,
        combo_list,
        format_brick_catalog,
        studio_run,
    )
except ImportError:  # plain `import nodes` from plugin directory
    from logic import (  # type: ignore
        HOWTO_DEFAULT,
        action_cat_combo_list,
        all_action_combo_list,
        combo_list,
        format_brick_catalog,
        studio_run,
    )


def _sec_list() -> List[int]:
    return list(range(1, 16))  # 1–15


def _pick_default(options: List[str], *needles: str, fallback_index: int = 0) -> str:
    for n in needles:
        for o in options:
            if n in o:
                return o
    if not options:
        return "(无)"
    return options[min(fallback_index, len(options) - 1)]


class NSFWDirectorStudio:
    """一站式 H3 导演台：下拉选积木 / 粘贴章节编排 / 拆 ≤15s JOB / 可选 AI 润色。"""

    @classmethod
    def INPUT_TYPES(cls):
        subjects = combo_list("subjects", include_none=False)
        scenes = combo_list("scenes", include_none=False)
        rhythms = combo_list("rhythm", include_none=True)
        arcs = combo_list("arcs", include_none=True)
        cameras = combo_list("cameras", include_none=True)
        exprs = combo_list("expressions", include_none=True)
        wards = combo_list("wardrobe", include_none=True)
        cats = action_cat_combo_list(include_none=True)
        acts = all_action_combo_list(include_none=True)
        secs = _sec_list()

        req: Dict[str, Any] = {
            "howto": ("STRING", {"multiline": True, "default": HOWTO_DEFAULT}),
            "model_type": (["minimax_h3", "qwen_image"], {"default": "minimax_h3"}),
            "mode": (["i2v", "multiref"], {"default": "i2v"}),
            "edit_mode": (["continuous", "multicut"], {"default": "continuous"}),
            "lang": (["both", "en", "zh"], {"default": "both"}),
            "subject": (subjects, {"default": _pick_default(subjects, "| mf", "男女")}),
            "scene": (scenes, {"default": _pick_default(scenes, "bedroom_night", "卧室")}),
            "rhythm": (rhythms, {"default": _pick_default(rhythms, "building", "逐渐升温")}),
            "arc": (arcs, {"default": _pick_default(arcs, "arc_full", "开始→高潮")}),
            "camera1": (cameras, {"default": _pick_default(cameras, "| medium", "中景")}),
            "camera2": (cameras, {"default": _pick_default(cameras, "push_in", "推进")}),
            "expression1": (exprs, {"default": _pick_default(exprs, "breath_soft", "轻喘")}),
            "wardrobe1": (wards, {"default": _pick_default(wards, "| lingerie", "情趣内衣")}),
            "beat1_cat": (cats, {"default": _pick_default(cats, "| foreplay", "前戏")}),
            "beat1_action": (acts, {"default": _pick_default(acts, "kiss_deep", "深吻")}),
            "beat1_sec": (secs, {"default": 3}),
            "beat2_cat": (cats, {"default": _pick_default(cats, "| oral", "口交")}),
            "beat2_action": (acts, {"default": _pick_default(acts, "bj_kneel", "跪姿口交")}),
            "beat2_sec": (secs, {"default": 5}),
            "beat3_cat": (cats, {"default": _pick_default(cats, "| sexPoses", "性交姿势")}),
            "beat3_action": (acts, {"default": _pick_default(acts, "sexPoses/missionary", "传教士")}),
            "beat3_sec": (secs, {"default": 7}),
            "beat4_cat": (cats, {"default": "(无)"}),
            "beat4_action": (acts, {"default": "(无)"}),
            "beat4_sec": (secs, {"default": 5}),
            "beat5_cat": (cats, {"default": "(无)"}),
            "beat5_action": (acts, {"default": "(无)"}),
            "beat5_sec": (secs, {"default": 5}),
            "beat6_cat": (cats, {"default": "(无)"}),
            "beat6_action": (acts, {"default": "(无)"}),
            "beat6_sec": (secs, {"default": 5}),
            "target_total_seconds": ("INT", {"default": 15, "min": 5, "max": 120, "step": 1}),
            "chapter_plot": ("STRING", {"multiline": True, "default": ""}),
            "arrange_mode": (["manual_beats", "story_local"], {"default": "manual_beats"}),
            "ai_polish": ("BOOLEAN", {"default": False}),
            "api_base": ("STRING", {"default": ""}),
            "api_key": ("STRING", {"default": ""}),
            "api_model": ("STRING", {"default": ""}),
            "extra_selection_json": ("STRING", {"multiline": True, "default": ""}),
            "extra_timeline_json": ("STRING", {"multiline": True, "default": ""}),
        }
        return {"required": req}

    RETURN_TYPES = ("STRING",) * 8
    RETURN_NAMES = (
        "howto_text",
        "positive_prompt",
        "negative_prompt",
        "h3_jobs_text",
        "job1_prompt",
        "job2_prompt",
        "job3_prompt",
        "brick_catalog",
    )
    FUNCTION = "run"
    CATEGORY = "nsfw_prompt"

    def run(self, **kwargs):
        beats = []
        for i in range(1, 7):
            beats.append((
                kwargs.get(f"beat{i}_cat", "(无)"),
                kwargs.get(f"beat{i}_action", "(无)"),
                int(kwargs.get(f"beat{i}_sec", 5) or 5),
            ))
        out = studio_run(
            howto=kwargs.get("howto") or HOWTO_DEFAULT,
            model_type=kwargs.get("model_type") or "minimax_h3",
            mode=kwargs.get("mode") or "i2v",
            edit_mode=kwargs.get("edit_mode") or "continuous",
            lang=kwargs.get("lang") or "both",
            subject=kwargs.get("subject") or "",
            scene=kwargs.get("scene") or "",
            rhythm=kwargs.get("rhythm") or "",
            arc=kwargs.get("arc") or "",
            camera1=kwargs.get("camera1") or "",
            camera2=kwargs.get("camera2") or "",
            expression1=kwargs.get("expression1") or "",
            wardrobe1=kwargs.get("wardrobe1") or "",
            beats=beats,
            target_total_seconds=int(kwargs.get("target_total_seconds") or 15),
            chapter_plot=kwargs.get("chapter_plot") or "",
            arrange_mode=kwargs.get("arrange_mode") or "manual_beats",
            ai_polish=bool(kwargs.get("ai_polish")),
            api_base=kwargs.get("api_base") or "",
            api_key=kwargs.get("api_key") or "",
            api_model=kwargs.get("api_model") or "",
            extra_selection_json=kwargs.get("extra_selection_json") or "",
            extra_timeline_json=kwargs.get("extra_timeline_json") or "",
        )
        return (
            out["howto_text"],
            out["positive_prompt"],
            out["negative_prompt"],
            out["h3_jobs_text"],
            out["job1_prompt"],
            out["job2_prompt"],
            out["job3_prompt"],
            out["brick_catalog"],
        )


class NSFWBrickCatalog:
    """输出可读中文积木目录 + JSON（含 LM 推荐列表）。"""

    @classmethod
    def INPUT_TYPES(cls):
        return {
            "required": {
                "include_lm_list": ("BOOLEAN", {"default": True}),
            }
        }

    RETURN_TYPES = ("STRING", "STRING")
    RETURN_NAMES = ("catalog_text", "catalog_json")
    FUNCTION = "run"
    CATEGORY = "nsfw_prompt"

    def run(self, include_lm_list: bool = True):
        text, js = format_brick_catalog(include_lm=bool(include_lm_list))
        return (text, js)


NODE_CLASS_MAPPINGS = {
    "NSFWDirectorStudio": NSFWDirectorStudio,
    "NSFWBrickCatalog": NSFWBrickCatalog,
}

NODE_DISPLAY_NAME_MAPPINGS = {
    "NSFWDirectorStudio": "NSFW H3 导演台",
    "NSFWBrickCatalog": "NSFW 积木目录",
}
