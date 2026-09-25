# NSFW Sex Prompt Composer

面向 **MINIMAX H3** 与 **QWEN IMAGE 2.1** 的成人性爱提示词工具集（**21+ 自愿虚构成人**）。

本仓库分三大块，不要混用目录：

| 目录 | 是什么 | 给谁用 |
|------|--------|--------|
| [`web-app/`](./web-app/) | **独立网页程序**（可视化点选组合器） | 浏览器直接打开，不依赖 ComfyUI |
| [`ComfyUI-NSFWPromptComposer/`](./ComfyUI-NSFWPromptComposer/) | **ComfyUI 自定义节点插件** | 复制进 `ComfyUI/custom_nodes/` |
| [`docs/`](./docs/) | 说明文档、填空话术、调研与变更记录 | 阅读 / 复制文案 |
| [`shared/`](./shared/) | 共享积木数据 `prompt_data.json` | 由网页数据导出，供对照 |

---

## 1. 独立网页程序 · `web-app/`

**这不是 ComfyUI 插件。** 纯前端，双击或本地起服务即可。

```bash
cd web-app
python3 -m http.server 8765
# 浏览器打开 http://127.0.0.1:8765/
```

| 文件 | 作用 |
|------|------|
| `index.html` | 页面结构 |
| `app.js` | 组合逻辑、动作时间轴、复制/导出 |
| `data.js` | 姿势/场景等积木数据（**主数据源**） |
| `styles.css` | 样式 |
| `preview.png` | 界面预览图 |

功能：选模型（H3 / Qwen）→ 选模式（图文生视频 I2V / 多参考）→ 点选积木 → **多动作时间轴**（一镜到底 / 多镜头）→ 复制正/负提示词。

---

## 2. ComfyUI 插件 · `ComfyUI-NSFWPromptComposer/`

**只有这个文件夹要装进 ComfyUI。** 不要把整个仓库或 `web-app/` 丢进 `custom_nodes`。

```bash
cp -r ComfyUI-NSFWPromptComposer /path/to/ComfyUI/custom_nodes/
# 可选：从网页数据同步积木
cd /path/to/ComfyUI/custom_nodes/ComfyUI-NSFWPromptComposer
python3 sync_from_data_js.py   # 读取仓库根目录 web-app/data.js
# 重启 ComfyUI → 节点分类 nsfw_prompt
```

| 文件 | 作用 |
|------|------|
| `__init__.py` | 注册节点 |
| `nodes.py` | 三个节点实现 |
| `prompt_data.json` | 插件内嵌积木数据 |
| `sync_from_data_js.py` | 从 `web-app/data.js` 同步数据 |
| `requirements.txt` | 依赖（当前无需重依赖） |
| `README.md` | 插件专用说明（含 4B/8B NSFW 语言模型下载列表） |

节点：

1. **NSFW LM Model List** — 4B / 8B uncensored 语言模型列表与 HF 下载信息  
2. **Action Timeline Builder** — 多动作时间轴衔接优化  
3. **NSFW Prompt Composer** — 拼装正/负提示词  

---

## 3. 文档 · `docs/`

| 文件 | 作用 |
|------|------|
| `COMBO_PARAGRAPH.md` | 可自由组合的填空式话术（一镜到底 / 多镜头） |
| `RESEARCH.md` | 网上结构差异与调研摘要 |
| `SKILL_DRAFT.md` | 助手技能草稿（工作流说明） |
| `CHANGELOG.md` | 版本变更 |

---

## 4. 共享数据 · `shared/`

| 文件 | 作用 |
|------|------|
| `prompt_data.json` | 与网页/插件同步的积木 JSON（由 `sync_from_data_js.py` 生成） |

改积木请改 **`web-app/data.js`**，再运行插件目录里的同步脚本。

---

## 快速对照

```
仓库根目录
├── README.md                          ← 你正在看的总览
├── web-app/                           ← 【独立程序】可视化组合器
├── ComfyUI-NSFWPromptComposer/        ← 【ComfyUI 插件】整夹复制到 custom_nodes
├── docs/                              ← 【文档】
└── shared/                            ← 【共享 JSON】
```

## 边界

仅限双方均为 **21 岁及以上**、自愿、虚构成人内容。禁止未成年、年龄模糊、真实名人姓名/肖像。本仓库只提供提示词工具与文本模块，不托管色情媒体。
