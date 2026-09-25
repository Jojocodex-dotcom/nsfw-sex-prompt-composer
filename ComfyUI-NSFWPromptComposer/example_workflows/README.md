# 示例工作流

## 快速开始

1. 把整个 `ComfyUI-NSFWPromptComposer` 复制到 `ComfyUI/custom_nodes/`
2. 重启 ComfyUI
3. **Workflow → Open** 加载 `NSFW_H3_导演台_一键.json`
4. 打开 **NSFW H3 导演台**：顶部 `howto` 是用法；下拉选 `subject` / `scene` / `beat1_cat`+`beat1_action`，或设 `arrange_mode=story_local` 并在 `chapter_plot` 粘贴章节
5. **Queue Prompt** → ShowText 显示用法、正向提示词、H3 分条 JOB

## 依赖

示例接到 `ShowText|pysssss`（[ComfyUI-Custom-Scripts](https://github.com/pythongosssss/ComfyUI-Custom-Scripts)）。未安装时可删掉 ShowText，改接任意 STRING 预览节点。

## 推荐设置

| 目标 | 设置 |
|------|------|
| 单条 ≤15s | 默认手动 3 拍，`model_type=minimax_h3` |
| 长剧情拆条 | `arrange_mode=story_local`，`target_total_seconds=45`，粘贴章节到 `chapter_plot` |
| 一镜到底 | `edit_mode=continuous` |
| 多镜头 | `edit_mode=multicut` |
| AI 润色 | `ai_polish=True` + `api_base` / `api_key` / `api_model` |

边界：仅 21+ 虚构成人（允许 CNC/暗黑幻想）；禁止未成年、真实名人、兽交、虐杀。
