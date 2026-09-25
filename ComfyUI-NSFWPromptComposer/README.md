# ComfyUI-NSFWPromptComposer

> ComfyUI 自定义节点：**NSFW H3 导演台**（21+ 虚构成人提示词）。  
> 打开节点即可用，**无需手写 JSON**。只注册 **2 个节点**。

## 节点一览

| 显示名 | 类名 | 作用 |
|--------|------|------|
| **NSFW H3 导演台** | `NSFWDirectorStudio` | 一站式：下拉选积木 / 粘贴章节本地编排 / 拆 ≤15s H3 JOB / 可选 AI 润色 |
| **NSFW 积木目录** | `NSFWBrickCatalog` | 输出可读中文积木目录 + JSON（含推荐 LM 列表） |

旧版三节点（LM 列表 / Timeline / Composer）已合并进导演台，**不再注册**。

## 安装

```bash
cp -r ComfyUI-NSFWPromptComposer /path/to/ComfyUI/custom_nodes/
cd /path/to/ComfyUI/custom_nodes/ComfyUI-NSFWPromptComposer
python3 sync_from_data_js.py   # 可选：从 ../web-app/data.js → prompt_data.json
# 重启 ComfyUI → 分类 nsfw_prompt
# 推荐：Workflow → Open → example_workflows/NSFW_H3_导演台_一键.json
```

无重依赖。可选 AI 润色走 OpenAI 兼容 HTTP。

## 30 秒上手

1. 加载 `example_workflows/NSFW_H3_导演台_一键.json`
2. 打开 **NSFW H3 导演台** —— 顶部 `howto` 即完整用法
3. 下拉选 `subject` / `scene` / `beat1~3`，或：
   - `arrange_mode = story_local`
   - 在 `chapter_plot` 粘贴章节
4. Queue Prompt → 查看 `howto_text` / `positive_prompt` / `h3_jobs_text` / `job1~3_prompt`

### 导演台主要输入

| 字段 | 说明 |
|------|------|
| `howto` | 用法说明（默认已填） |
| `model_type` | `minimax_h3` \| `qwen_image` |
| `mode` | `i2v` \| `multiref` |
| `edit_mode` | `continuous` 一镜到底 \| `multicut` 多镜头 |
| `subject` / `scene` / `rhythm` / `arc` | 下拉，`中文标签 \| id` |
| `camera1` `camera2` `expression1` `wardrobe1` | 可选，`(无)` 表示不用 |
| `beat1~6_cat` / `_action` / `_sec` | 手动节拍；动作扁平 `[类别] 标签 \| cat/id` |
| `arrange_mode` | `manual_beats` 或 `story_local`（章节覆盖手动节拍） |
| `chapter_plot` | 粘贴章节；`story_local` 时本地关键词→积木→时间轴 |
| `target_total_seconds` | 5–120，故事编排目标总时长 |
| `ai_polish` + `api_base/key/model` | 可选：OpenAI 兼容接口润色每条 JOB |
| `extra_selection_json` / `extra_timeline_json` | 高级可选，默认可空 |

### 输出

| 输出 | 含义 |
|------|------|
| `howto_text` | 用法 + 本次积木摘要 |
| `positive_prompt` | 正向（多 JOB 时为带标记总览） |
| `negative_prompt` | 负向 |
| `h3_jobs_text` | 全部 ≤15s 任务（含末帧衔接） |
| `job1_prompt` / `job2_prompt` / `job3_prompt` | 前三条可接线（无则空串） |
| `brick_catalog` | 短中文积木目录 |

## H3 ≤15 秒

时间轴更长时自动拆成多条 JOB；`job2+` 要求用上一条**最后一帧**做 I2V 首帧。

## 与网页版对齐

`logic.py` 对齐 `../web-app/app.js` + `director.js`：

- `pack_h3_jobs` ← `packH3Jobs`
- `arrange_from_story` ← `arrangeFromStory`
- `compose_prompt` 含 `darkActs`
- 可选 `ai_polish`

## 本地冒烟（无需 ComfyUI）

```bash
cd ComfyUI-NSFWPromptComposer
python3 -c "
from nodes import NODE_CLASS_MAPPINGS
print(sorted(NODE_CLASS_MAPPINGS))
s = NODE_CLASS_MAPPINGS['NSFWDirectorStudio']()
req = s.INPUT_TYPES()['required']
kw = {}
for k, v in req.items():
    cfg = v[1] if isinstance(v, tuple) and len(v) > 1 and isinstance(v[1], dict) else {}
    if 'default' in cfg: kw[k] = cfg['default']
    elif isinstance(v[0], list): kw[k] = v[0][0]
    else: kw[k] = ''
out = s.run(**kw)
print(list(zip(s.RETURN_NAMES, [len(x) for x in out])))
"
```

## 边界

仅 **21+** 虚构成人。允许成人间 CNC/强制等**虚构暗黑幻想**；禁止未成年、年龄模糊、真实名人、虐杀、兽交。只产出提示词文本。
