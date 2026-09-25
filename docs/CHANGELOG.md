# CHANGELOG

## 1.3.0 — 2026-09-25

### 重口味积木
- 新增模块 `darkActs`（重口味·强制/非自愿幻想 21+虚构）：暴力 CNC、轮奸、调教、迷奸、绑架/胁迫、器具与绳缚、中出/颜射/体写等。
- 扩展场景（废弃仓库、上锁卧室、地牢、厢车、夜巷、VIP 包厢等）、主体（一女多男等）、服装道具、表情、叙事弧、对白。
- ageGate 明确：允许成人间虚构 CNC/暗黑幻想；禁止未成年、名人、虐杀血腥、兽交。

### 情节导演台
- 粘贴章节 → **本地智能编排**（规则关键词→积木→节拍弧，离线可用）。
- 可选 **用大模型优化编排**（OpenAI 兼容 API，localStorage 存 key）。
- **复制给 LLM 的系统提示** + **从 JSON 粘贴应用**。
- 超过 15s 自动拆成多条 H3 任务预览；一键应用到时间轴。

### 双模式提示词
- 默认 **直接组装**（积木+时间轴，非 AI）。
- 可选开关 **AI 润色提示词**：对每条 H3 JOB 润色电影感措辞；失败保留原文。
- 右侧 **分条 JOB 提示词** 各自可复制（每条 ≤15s，含末帧 I2V 衔接语）。

### 同步
- `shared/prompt_data.json` 与 ComfyUI `prompt_data.json` 已同步；`ActionTimelineBuilder` 索引含 `darkActs`。


## 1.1.0 — 2026-09-25

### Web 组合器
- 新增 **动作时间轴 / 一套组合**：可添加多段（类别 + 动作 + 秒数），默认示例 ≥3 段。
- 新增剪辑策略切换：**一镜到底**（morph/continuous take）与 **多镜头**（cut / match cut / raccord）。
- 自动生成 beat timeline、过渡句、防跳切穿帮约束，并入最终正/负提示词。
- 快捷：从已选积木填充、清空时间轴、导出 JSON 含 `timeline` / `editMode`。
- 保留模型 MINIMAX H3 / QWEN IMAGE 2.1 与模式 I2V / Multi-ref。

### ComfyUI 插件
- 新建 `ComfyUI-NSFWPromptComposer/`（`__init__.py`、`nodes.py`、`prompt_data.json`、`requirements.txt`、`README.md`、`sync_from_data_js.py`）。
- 节点：`NSFW LM Model List`、`NSFW Prompt Composer`、`Action Timeline Builder`。
- 积木与 `data.js` 通过 `prompt_data.json` 同步，避免双份维护。

### 文档
- 新增 `COMBO_PARAGRAPH.md` 中文填空话术（一镜到底 + 多镜头）。
- 更新 `RESEARCH.md` 动作衔接与 uncensored LM 调研摘要。

### 边界
- 持续强制 21+ 自愿虚构成人；禁止未成年与真实名人。
