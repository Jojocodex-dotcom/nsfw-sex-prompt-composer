# Changelog

## 1.8.0 — 2026-10-02

### UI · 全屏工作台壳重设计

- 去掉居中窄卡片 / `max-width` 留白；`100dvw × 100dvh` 全屏 shell
- 顶栏 chrome：模式切换（积木 | 漫剧）居中贴齐，语言 / 21+ / 版本收在右侧
- 漫剧工作台：粘性全宽阶段条 + 左栏设置/队列 + 中栏阶段编辑器（面板内滚动）
- 积木组合器：同壳顶栏 + 工具条 + 主区双栏（编辑 / 预览）铺满剩余高度
- CSS 变量统一色板与间距；桌面优先，≤980px 改为可滚动堆叠
- Phase A/B 功能与 ID 接线保留（S0–S7、Comfy、llama、H3/LTX/积木）

## 1.7.0 — 2026-10-02

### Phase B · ComfyUI 本地媒体闭环

- 新增 `comfy.js`：`POST /prompt`、轮询 `/history/{id}`、预览 `/view`
- 工作台阶段补齐 **S3 资产图 / S6 静帧 / S7 I2V 钩子**；顶部任务队列（状态 / 缩略图 / 重试）
- 示例 API 工作流：`comfy-workflows/wf_asset_t2i.json`、`wf_storyboard_still.json`、`wf_generic_i2v.json`
- Comfy 设置：Base URL、可选 Auth、checkpoint、三套工作流路径、宽高
- CORS：文档说明 `--enable-cors-header`；附 `tools/comfy_cors_proxy.py`
- 积木组合器 / LTX / Phase A S0–S5 提示词管线保持可用；一键跑通仍只到 S5（不出图）

## 1.6.0 — 2026-10-02

- Phase A：漫剧工作台 S0–S5 提示词一体 MVP + 技能包 + llama.cpp 设置
