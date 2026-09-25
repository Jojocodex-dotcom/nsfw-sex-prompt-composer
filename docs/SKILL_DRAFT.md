---
name: 性爱视频提示词大全
description: >
  当用户要为 MINIMAX H3（Hailuo/海螺类）或 QWEN IMAGE 2.1 撰写可组合的成人性爱
  图文生视频（I2V）或多参考生视频（Multi-ref）提示词时使用。仅限双方均为 21 岁及以上、
  自愿、虚构成人内容。禁止未成年/年龄模糊/真实人物姓名肖像。配套可视化工具见同目录
  index.html（模块数据与 data.js 同步）。
---

# 性爱视频提示词大全（MINIMAX H3 / QWEN IMAGE 2.1）

## 硬性边界（每次必须遵守）

- **21+ only**：所有角色必须是明显自愿的 **21 岁及以上**成年人；禁止 teen、child、学生未成年暗示、年龄模糊。
- **虚构**：禁止真实名人姓名/肖像/可识别 likeness。
- **交付物**：提示词模板与组合规则（及本仓库可视化组合器），不是色情媒体文件。
- 若用户请求越界内容 → 拒绝并重申边界。

**可视化程序（优先给用户）**：`web-app/index.html`  
模块源数据：`web-app/data.js`（本 SKILL 与 UI **共用同一套积木概念**）。

---


## 情节导演台与双模式（v1.3）

- 网页「情节导演台」：粘贴章节 → 本地规则编排（离线）或可选 LLM 编排 → 应用到时间轴；总长 >15s 拆多条 H3。
- **直接组装**默认；可选「AI 润色提示词」只改写措辞、保留节拍与 JOB 边界。
- 允许成人(21+)虚构 CNC/轮奸/调教/迷奸描写；禁止未成年等越界内容。

## 助手工作流（强制四步）

### 1) 问清模式与模型

| 问题 | 选项 |
|------|------|
| 模型？ | `MINIMAX H3` / `QWEN IMAGE 2.1` |
| 模式？ | `I2V 图文生视频` / `Multi-ref 多参考` |
| 时长？（H3） | 5s / 10s / 15s（或用户自定义） |
| 输出语言？ | 英文 / 中文 / 双语 |

### 2) 从模块勾选组合

打开 `web-app/index.html` 点选，或按下列模块 ID 与用户确认（数据在 `web-app/data.js`）：

| 模块 | 选择规则 | 约数量 |
|------|----------|--------|
| 主体组合 `subjects` | 单选 | 5 |
| 体型 `bodyTags` | 多选可选 | 6 |
| 场景 `scenes` | 单选 | 18 |
| 前戏 `foreplay` | 多选 | 10 |
| 口交 `oral` | 多选 | 9 |
| 性交姿势 `sexPoses` | 多选 | **31** |

| 重口味强制/CNC `darkActs` | 多选（21+虚构暗黑） | 34 |
| 节奏 `rhythm` | 单选 | 6 |
| 镜头 `cameras` | 多选（建议 1–2 主运镜） | 14 |
| 表情声音 `expressions` | 多选 | 9 |
| 对白 `dialogueSnippets` | 多选可选 | 8 |
| 服装道具 `wardrobe` | 多选 | 12 |
| 叙事弧 `arcs` | 单选 | 6 |

### 3) 拼出最终 prompt + negative

- 用 UI「复制提示词 / 复制负面」，或按下方骨架手写。
- **I2V**：少写或不写外貌；写动作时序、镜头、一致性锁、声景（H3）。
- **Qwen Image**：姿势几何与场景细节写细；身份可由参考图承担时勿复述脸。
- **Negative**：合并 `web-app/data.js` → `negatives.common` + 模式/模型附加项。

### 4) 分别给出两套成品

同一勾选结果，始终输出：

1. **I2V 版**成品模板  
2. **Multi-ref 版**成品模板（含槽位说明）

---

## 模式 A — 图文生视频（I2V）

**原则**：参考图/首帧 = 身份、服装、构图、光影；提示词 = **接下来怎么动**。

### 推荐骨架（中英可混）

```text
[AGE] All characters are clearly consenting adults 21+. Fictional only.

[LOCK] Preserve face identity, adult anatomy, contact points, wardrobe state,
lighting, background from the input frame. Do not re-describe appearance.
Animate only motion reachable from the current pose.

[BEATS]
0–30%: {foreplay/oral settle}
30–75%: {sex pose(s)} with {rhythm}
75–100%: {climax / afterglow per arc}

[CAMERA] {one primary move}; smooth continuous; subject stays alive (breathing).

[SOUND — H3] intimate room tone; wet skin; breaths/moans synced; sheets. Music: N/A
```

### MINIMAX H3 要点

- 时长预设常见 **5 / 10 / 15s**；复杂动作拆多段。
- 运镜一次一个主指令（推进/拉远/跟拍/手持/固定）；可与社区 camera tags 对齐。
- 云端海螺常过滤 NSFW → 优先本地 H3 / 允许成人内容的部署。
- I2VA 三字段思路：`integrated_multimodal_description` + `overall_soundscape` + `non_diegetic_music`。

### QWEN IMAGE 2.1 要点（定帧）

- 用自然语言写清：**支撑点、上下位、肢体角度、手抓位置、镜头景别**。
- 输出静帧后，再把同一动作时序交给 I2V 模型。
- 多图编辑时用「图N」分工；排除项可写进主 prompt（部分 API 无 negative 框）。

---

## 模式 B — 多参考生视频（Multi-ref）

### 槽位分配（与 UI / data.js `refSlots` 一致）

| 槽位 | 作用 | 提示词引用 |
|------|------|------------|
| 主体 A | 身份锚点 A | Image 1 / `<Picture 1>` / `<Subject 1>` |
| 主体 B | 身份锚点 B | Image 2 / `<Subject 2>` |
| 姿势参考 | 只迁移姿势/接触 | Image 3 → `attribute_transfer`（不要迁移脸） |
| 场景参考 | 环境光影布局 | Image 4 / `<Subject scene>` |
| 风格参考 | 弱参考色调画质 | Image 5 → `weak_reference` |

### MINIMAX H3 R2VA 六段式（摘要）

1. `subject_definitions` — 绑定 Subject/Picture  
2. `summary` — `[reference generation] ...`  
3. `retention_analysis` — `fully_preserved` / `attribute_transfer` / `weak_reference`  
4. `detailed_description` — `[Shot 1] ...` 动作与运镜  
5. `overall_soundscape`  
6. `non_diegetic_music`（可 N/A）

### 防身份漂移

- 姿势参考图尽量遮脸或选无脸构图。  
- 文中明确：「pose ref transfers pose only」。  
- 主参考强度高于风格/场景辅参考。  
- 禁止「把 A 的脸写到 B 的描述里」。

---

## 积木速查（标签 → 粘贴片段）

> 完整中英字段以 `web-app/data.js` 为准；此处列类别与用法。UI 点选即可生成。

### 主体

- 男女 / 男男 / 女女 / 三人组合（皆 21+）  
- 体型可选：精壮、丰满、纤瘦、肌肉、丰腴、普通  

### 场景（18）

卧室夜灯、酒店套房、浴室蒸汽、淋浴间、厨房台面、客厅沙发、车内后座、办公室加班、阳台黄昏、户外隐蔽、泳池夜色、对镜房间、雨窗窗台、按摩浴缸、更衣室、露营帐篷、游艇舱室、私人书房  

### 前戏（10） / 口交（9）

深吻、吻颈、胸部爱抚、精油按摩、隔衣摩擦、互脱、手指、手刺激、互相手淫、玩具；跪姿口交、深喉、舔舐、舔阴、舔肛、69、坐脸、乳交、边缘控制  

### 性交姿势（31，示例）

传教士（含抬腿/垫臀）、后入（趴胸/站立弯腰）、骑乘正/背/磨、侧入汤匙、剪刀、站立抱起/抬腿、床沿、桌沿、椅上跨坐、膝上、莲花、麻花、蝴蝶、温和打桩角、女上位压制、跪姿后抱、对镜后入/骑乘、贴窗、淋浴抵墙、车内跨坐、肛交传教士/后入、双重刺激  

### 节奏 / 镜头 / 表情 / 服装 / 弧

见 `web-app/data.js` 中 `rhythm` `cameras` `expressions` `wardrobe` `arcs`。

---

## 成品模板示例

### I2V 版（MINIMAX H3，示例勾选：男女·卧室·传教士·升温·中景+推进）

```text
All characters are clearly consenting adults aged 21+. Fictional adult content only.
IMAGE-TO-VIDEO: Preserve face identity, adult anatomy, contact points, lighting and background from the input frame. Do not re-describe appearance.
Beat timeline: [0–30%] deep passionate kissing and mutual undressing; [30–75%] missionary position, face-to-face deep thrusts with building intensity; [75–100%] climax then tender afterglow.
Camera: medium shot mid-thigh up; slow dolly push-in; smooth continuous; subject breathing and alive.
Soundscape: intimate room tone, wet skin contact, soft moans synced to thrusts, sheets rustle. non_diegetic_music: N/A
```

**Negative:** `anyone under 21, teen, child, real celebrity likeness, extra limbs, anatomy distortion, face morphing, identity drift, changing face identity, hand deformity, abrupt stepped camera, ...`

### Multi-ref 版（同内容）

```text
MULTI-REFERENCE: Bind identities to subject slots. Pose ref = pose only. Scene ref = environment. Style = weak_reference.
Slot binding: Image 1 = partner A; Image 2 = partner B; Image 3 = pose; Image 4 = bedroom night scene; Image 5 = grade.
Subjects: one adult man and one adult woman, both clearly 21+.
Scene: dim warm bedroom at night, rumpled sheets, soft bedside lamp.
Actions: missionary with building intensity; soft breaths; eye contact.
Camera: medium + slow push-in.

subject_definitions:
<Subject 1> is adult partner A from <Picture 1>, 21+, fully locked.
<Subject 2> is adult partner B from <Picture 2>, 21+, fully locked.
summary:
[reference generation] Intimate adult scene with <Subject 1> and <Subject 2>; pose from <Picture 3>; room from <Picture 4>.
retention_analysis:
<Subject 1>: fully_preserved
<Subject 2>: fully_preserved
<Picture 3>: attribute_transfer - pose/contact only
```

### QWEN IMAGE 2.1 定帧补强（可接在姿势后）

```text
Pose geometry: receiver supine on bed, knees bent, ankles near partner's hips;
giver kneeling between thighs, hands supporting beside waist; eye-level medium shot;
contact at pelvis clear; soft bedside key light from left; photorealistic adult bodies 21+.
```

---

## 模型差异速记

1. **H3** = 运动/运镜/声景导演；**Qwen Image** = 姿势/场景画师。  
2. **I2V 不重写外貌**。  
3. **Multi-ref 必须显式槽位**。  
4. 云端海螺 ≠ 本地 H3（过滤差异）。  
5. **运镜与剧烈动作二选一优先**，避免双复杂。  
6. 中英可混；Qwen 偏好完整句，少用纯 SD 逗号标签堆。

---

## 成功标准（给 update_state / 验收）

- [ ] 全文明确 21+ only  
- [ ] 区分 I2V / Multi-ref  
- [ ] 区分 MINIMAX H3 / QWEN IMAGE 2.1  
- [ ] 积木可自由组合；姿势 ≥25、场景 ≥15  
- [ ] 输出含 prompt + negative + 双模式成品  
- [ ] 可视化入口 `web-app/index.html` 可用；数据来自 `web-app/data.js`  
