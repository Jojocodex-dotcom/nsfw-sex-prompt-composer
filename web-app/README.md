# NSFW H3 漫剧工作台 / 性爱提示词组合器（独立网页 · v1.7.0）

纯前端。**Phase A**：提示词一体（扩写 → 资材 → 分镜 → H3 壳）。**Phase B**：本地 ComfyUI 生图 / I2V 队列（S3 / S6 / S7，显式排队）。

```bash
cd web-app
python3 -m http.server 8765
# http://127.0.0.1:8765/
```

| 文件 | 作用 |
|------|------|
| `index.html` | 积木组合器 + **漫剧工作台**阶段条 |
| `workbench.js` | S0–S7 管线（本地规则 + 可选 LLM + Comfy 队列） |
| `comfy.js` | ComfyUI HTTP 适配：`/prompt` · `/history` · `/view` |
| `comfy-workflows/` | API 格式工作流模板（占位符注入） |
| `tools/comfy_cors_proxy.py` | 可选 CORS 代理 |
| `skills/` | 文戏 / 影视 / JP-AV→H3 技能短核 |
| `data.js` | 积木主数据（含 `darkActs`） |
| `director.js` | 情节导演台 / OpenAI 兼容（含 llama.cpp） |
| `app.js` | 组合、H3 官方壳分包、LTX 单组多 SHOT、AI 润色 |
| `styles.css` | 样式 |
| `prompt-library/grokclip/` | Grokclip house 润色内核 |

## 两种 UI 模式

1. **积木组合器**（默认）— 原有点选 + 时间轴 + 导演台，不受破坏。  
2. **漫剧工作台** — 阶段条：S0 立项 → S1 扩写 → S2 资材 → **S3 资产图** → S4 分镜 → S5 H3 壳 → **S6 静帧** → **S7 视频**。

## ComfyUI（Phase B）

工作台顶部「ComfyUI 设置」：

| 项 | 默认 |
|----|------|
| Base URL | `http://127.0.0.1:8188` |
| Auth | 可空；填 Bearer token 或完整 Authorization |
| Checkpoint | 注入 `__CKPT__`（须为本机 models/checkpoints 下真实文件名） |
| 工作流路径 | `comfy-workflows/wf_asset_t2i.json` / `wf_storyboard_still.json` / `wf_generic_i2v.json` |

### CORS

浏览器页面直连 Comfy 会被 CORS 拦住，任选其一：

1. **推荐**：启动 ComfyUI 时加 `--enable-cors-header`
2. 或跑代理后把 Base URL 改成代理口：

```bash
python3 tools/comfy_cors_proxy.py
# http://127.0.0.1:8190 → http://127.0.0.1:8188
```

### 工作流定制

模板是 **API Format** JSON。在 ComfyUI 里把可用图画好 → Save (API Format) → 把正向词改成 `__POSITIVE__` 等占位符 → 放到 `comfy-workflows/` 并在设置里指向新文件。详见 `comfy-workflows/README.md`。

`wf_generic_i2v.json` 默认是可跑的脚手架（仍偏静图拓扑）；**请换成你本机真实 I2V 节点图**。S7 的参考图文件名须已存在于 Comfy `input/`。

### 纪律

- **默认不出图**：只有在 S3 / S6 / S7 点排队才会 `POST /prompt`。
- 任务队列支持状态、缩略图预览、失败重试；不阻塞积木组合器模式。
- 未接 MiniMax 云 API（可选后续）。

## llama.cpp

「llama.cpp / API 设置」：Base URL 例 `http://127.0.0.1:8080/v1`；与导演台共用 localStorage。

## 模型差异

| 模型 | 主输出 |
|------|--------|
| **LTX 2.5** | 单提示词组多 SHOT（积木模式） |
| **MINIMAX H3** | FL2VA / Ref2VA 官方壳；工作台默认 |
| **QWEN IMAGE 2.1** | 自然语言段落 |

暗黑 CNC 模块均为 **21+ 虚构**。禁止未成年 / 真实名人 likeness。
