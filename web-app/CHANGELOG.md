# Changelog

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
