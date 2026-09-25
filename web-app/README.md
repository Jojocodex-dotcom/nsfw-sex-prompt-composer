# 性爱视频提示词组合器（独立网页 · v1.3.0）

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
| `app.js` | 组合、H3 分包、AI 润色开关 |
| `styles.css` | 样式 |

- **直接组装**（默认）：积木 + 时间轴 → 提示词，不调用 AI。
- **AI 润色**（可选）：对每条 ≤15s H3 JOB 润色；需自备 OpenAI 兼容 API。
- 暗黑 CNC 模块均为 21+ 虚构。
