# 性爱视频提示词组合器（独立网页 · v1.5.2）

纯前端，不依赖 ComfyUI。

```bash
python3 -m http.server 8765
# http://127.0.0.1:8765/
```

| 文件 | 作用 |
|------|------|
| `index.html` | 页面（导演台 + 时间轴 + 预览） |
| `data.js` | 积木主数据（含 `darkActs`） |
| `director.js` | 情节导演台 / 可选 LLM |
| `app.js` | 组合、H3 官方壳分包、LTX 单组多 SHOT、AI 润色 |
| `styles.css` | 样式 |

## 模型差异

| 模型 | 主输出 |
|------|--------|
| **LTX 2.5** (`ltx_2_5`) | **单提示词组**多 SHOT 带时间：`[GLOBAL]` + `[SHOT n \| start–end]`；时间紧挨；不拆 H3 JOB；不写 H3 字段名 |
| **MINIMAX H3** (`minimax_h3`) | 官方壳 / 可拆 ≤15s 多 JOB（FL2VA 三字段或 Ref2VA 六字段） |
| **QWEN IMAGE 2.1** | 自然语言段落风格 |

### LTX 2.5 示例形态

```
[GLOBAL] scene + 21+ identity lock + light/sound
[SHOT 1 | 00:00–00:04] action + one camera
[SHOT 2 | 00:04–00:12] ...
```

### MiniMax H3 官方壳（model = minimax_h3）

- **FL2VA / I2VA（图文生视频，mode=i2v）** — 三字段：
  - `integrated_multimodal_description:` + setup + `[Shot N]`（Shot1 无 At；其后 `At MM:SS.mmm`）
  - `overall_soundscape:`
  - `non_diegetic_music: N/A`
- **Ref2VA（多参考，mode=multiref）** — 六字段：
  - `subject_definitions:` / `summary:` / `retention_analysis:` / `detailed_description:`（含 Shot）/ `overall_soundscape:` / `non_diegetic_music:`
  - **不要**使用 `integrated_multimodal_description`
- 每条 ≤15s JOB 为完整官方壳；job2+ 用上条末帧。复制按钮粘贴壳字段正文。

## AI 润色显示

- 开启「AI 润色」并配置 API 后：
  - **H3 / Qwen**：按 JOB 润色，写入主预览与各 JOB 卡片（标签「润色后」）。
  - **LTX 2.5**：整组 `[GLOBAL]+[SHOT…]` 一次润色，写入主预览。
- 原文仍可通过「复制原文」或下方「AI 润色后」对照区获取。
- 失败时状态条报错并保留直接组装稿；改积木/时间轴会失效旧润色缓存。

暗黑 CNC 模块均为 21+ 虚构。
