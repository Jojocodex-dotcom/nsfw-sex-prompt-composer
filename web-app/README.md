# NSFW H3 漫剧工作台 / 性爱提示词组合器（独立网页 · v1.6.0）

纯前端，不依赖 ComfyUI。**Phase A：提示词一体 MVP**（扩写 → 资材 → 分镜 → H3 壳）。生图/生视频见后续 Phase B。

```bash
python3 -m http.server 8765
# http://127.0.0.1:8765/
```

| 文件 | 作用 |
|------|------|
| `index.html` | 积木组合器 + **漫剧工作台**阶段条 |
| `workbench.js` | S0–S5 管线（本地规则 + 可选 LLM） |
| `skills/` | 文戏 / 影视 / JP-AV→H3 技能短核 |
| `data.js` | 积木主数据（含 `darkActs`） |
| `director.js` | 情节导演台 / OpenAI 兼容（含 llama.cpp） |
| `app.js` | 组合、H3 官方壳分包、LTX 单组多 SHOT、AI 润色 |
| `styles.css` | 样式 |
| `prompt-library/grokclip/` | Grokclip house 润色内核 |

## 两种 UI 模式

1. **积木组合器**（默认）— 原有点选 + 时间轴 + 导演台，不受破坏。  
2. **漫剧工作台** — ArcReel 式阶段条：S0 立项锁 → S1 扩写 → S2 资材 → S4 分镜 → S5 H3 壳。

## 模型差异

| 模型 | 主输出 |
|------|--------|
| **LTX 2.5** (`ltx_2_5`) | **单提示词组**多 SHOT 带时间：`[GLOBAL]` + `[SHOT n \| start–end]`；不拆 H3 JOB；不写 H3 字段名 |
| **MINIMAX H3** (`minimax_h3`) | 官方壳 / 可拆 ≤15s 多 JOB（FL2VA 三字段或 Ref2VA 六字段）— **工作台默认** |
| **QWEN IMAGE 2.1** | 自然语言段落风格 |

### MiniMax H3 官方壳

- **FL2VA / I2VA（mode=i2v）** — 三字段：`integrated_multimodal_description` / `overall_soundscape` / `non_diegetic_music`
- **Ref2VA（mode=multiref）** — 六字段：`subject_definitions` / `summary` / `retention_analysis` / `detailed_description` / `overall_soundscape` / `non_diegetic_music`（勿用 integrated_multimodal_description）
- 每条 ≤15s JOB；job2+ 用上条末帧衔接语。

## llama.cpp

工作台顶部「llama.cpp / API 设置」：

- Base URL 示例：`http://127.0.0.1:8080/v1`
- 与导演台共用 localStorage 键；Key 可空或 `sk-local`
- 需服务端允许浏览器 CORS

## AI 润色

仍在右侧预览区：H3 按 JOB；LTX 整组一次。工作台 S5 先出官方壳；润色可选。

暗黑 CNC 模块均为 21+ 虚构。禁止未成年 / 真实名人 likeness。
