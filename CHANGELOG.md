# CHANGELOG

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
