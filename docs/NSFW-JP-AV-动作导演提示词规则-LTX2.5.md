# NSFW 日本 AV 动作导演提示词规则（LTX 2.5）

> **专供 LTX 2.5**。禁止混用 H3 字段名：`integrated_multimodal_description` / `overall_soundscape` / `non_diegetic_music` / `subject_definitions` / `summary` / `retention_analysis` / `detailed_description`。
>
> **长视频：不要拆成多条生成任务。** 用 **一条提示词组**，内含多个 `SHOT`，**每个 SHOT 写明起止时间**。

仅限 **21+ 自愿虚构成人**。禁止未成年、年龄模糊、真实名人 likeness。

---

## 1. 总原则

| 项 | 做法 |
|----|------|
| 条数 | **1 条**提示词组覆盖整段片长 |
| 结构 | 片头总述（场景/人物锁/光影/总运镜偏好）+ 按时间排列的多个 SHOT |
| 时间 | 每个 SHOT 标注 `MM:SS–MM:SS`（或秒数 `0–4s`），连续无重叠、无空洞 |
| I2V | 首帧锁身份；后文写运动变化；全程同一对成人、服装状态连续 |
| 字符 | 尽量精炼；过长可压缩形容词，但 **SHOT 时间轴不能省** |

---

## 2. 推荐提示词组骨架（复制改）

```text
[GLOBAL] Medium-close Japanese love-hotel bedroom, warm bedside lamps, rumpled white sheets. Two clearly consenting adults 21+. Match start-frame faces/wardrobe — do not rewrite identity. Photoreal cinematic AV look. Prefer one primary camera idea per shot. Soft intimate room tone, breaths, skin and sheets; no score music.

[SHOT 1 | 00:00–00:04] Medium shot. Kissing and undressing on the bed; hands on waist and shoulders; slow breathing. Camera static locked-off.

[SHOT 2 | 00:04–00:12] They settle into missionary: her knees open, his hands at her hips, slow deep thrusts. She grips the sheets. Camera slowly pushes in.

[SHOT 3 | 00:12–00:20] Same missionary, faster shallow rhythm, stronger breaths and quiet moans, continuous contact. Subtle handheld micro-movement.

[SHOT 4 | 00:20–00:28] Transition: he withdraws, she turns to hands-and-knees at bed edge; he re-enters doggy, gripping her hips, steady thrusts. Camera pans right to a clear side angle.

[SHOT 5 | 00:28–00:35] Doggy continues, pace builds toward climax expression then soft afterglow embrace on sheets. Camera slowly pushes in to faces. End.
```

中文亦可，但运镜关键词建议保留英文（`camera pans right` / `slowly pushes in` / `static locked-off`）。

---

## 3. SHOT 时间规则

1. **写清区间**：`[SHOT n | 起–止]`，例如 `00:00–00:05` 或 `0–5s`。  
2. **首尾相接**：SHOT2 起点 = SHOT1 终点，禁止重叠与跳秒。  
3. **单镜时长**：常见 3–8s；主戏可略长，铺垫/转场宜短。  
4. **总时长**：所有 SHOT 区间并起来 = 你要的整段长度（如 30s / 60s）。  
5. **一镜一主动作 + 一句运镜**；不要在同一 SHOT 里堆推拉+环绕+猛切。

---

## 4. 日本 AV 调度（仍在一条组里完成）

| 阶段 | 典型占用 | SHOT 内容 |
|------|----------|-----------|
| 铺垫 | 前 15–25% | 吻、爱抚、解衣 |
| 主戏 | 中段 | **一个主姿势**抽送节奏变化（可占连续 2–3 个 SHOT） |
| 换姿势 | 短 SHOT | 必须写抽出→调整支撑→再进入 |
| 收束 | 末 15–25% | 加速/高潮表情或余韵；推近脸或交合处二选一 |

---

## 5. 运镜用词（LTX 友好）

- 固定：`static locked-off`  
- 缓推：`camera slowly pushes in`  
- 左右摇：`camera pans right` / `camera pans left`（勿写 from left to right）  
- 横移：`camera tracks laterally`  
- 微手持：`subtle handheld movement`  
- 环绕：`camera circles slowly … orbiting clockwise`（少用，主戏慎叠）

---

## 6. 动作必写要素（每个 SHOT）

上下位 · 支撑点（膝/肘/床沿） · 接触/插入关系 · 手抓位置 · 骨盆节奏（slow deep → faster） · 与上一 SHOT 的连续因果（then / while / still the same couple）。

---

## 7. 负面（另框）

```text
minor, child, teen, age ambiguity, blur, distort, low quality, deformed, extra limbs, identity drift, wardrobe teleport, hard cuts, flicker, watermark, text, integrated_multimodal_description, overall_soundscape, subject_definitions
```

---

## 8. 明确不要做的

- ❌ 把长视频拆成多个独立「任务/JOB」再拼  
- ❌ 只写百分比节拍却不写绝对时间  
- ❌ 套 H3 六段壳 / 三字段壳  
- ❌ 同一 SHOT 多主运镜 + 剧烈动作双复杂  

---

## 9. 一句话工作流

定总时长 → 按时间切 SHOT 表 → 填进 **一条** `[GLOBAL]+[SHOT…]` 提示词组 → 丢进 LTX 2.5 一次生成（或按你节点「单提示多镜」流程）。
