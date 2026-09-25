# RESEARCH.md — 成人性爱视频提示词 SKILL 调研摘要

> **边界声明**：本调研仅服务于 **双方均为 21 岁及以上成年人、自愿、虚构成人内容** 的提示词模板与组合规则。禁止未成年、年龄模糊、真实人物姓名/肖像。交付物为模板与写法，不是色情媒体文件。

调研日期：2026-09-25

---

## 1. 来源清单（结构参考，非 verbatim 抄袭）

| # | 来源 | URL | 可复用结构点 |
|---|------|-----|--------------|
| 1 | MiniMax H3 官方 Ref2VA / 全参考改写指南 | https://huggingface.co/MiniMaxAI/MiniMax-H3/blob/main/docs/VIDEO_PROMPT_WRITING_GUIDE_ref_en.md | 六段式：`subject_definitions` → `summary` → `retention_analysis` → `detailed_description` → `overall_soundscape` → `non_diegetic_music`；标签 `<Subject N>` / `<Picture N>` / `<Video N>` / `<Audio N>`；保留度 `fully_preserved` / `partially_preserved` / `attribute_transfer` / `weak_reference` |
| 2 | MiniMax H3 提示词写作 skill（官方） | https://github.com/MiniMax-AI/MiniMax-H3/blob/main/skills/h3-prompt-writing/SKILL.md | I2VA/T2VA 偏镜头+声景；R2VA 偏参考绑定 |
| 3 | CivArchive / Civitai：MiniMax H3 NSFW I2VA/R2VA OneClick | https://civarchive.com/models/2835850?modelVersionId=3200536 | 本地 uncensored 工作流；预设 5s/10s/15s；I2VA 三字段 vs R2VA 六字段；相机 tag 下拉（STATIC / ZOOM / PAN / DOLLY / ORBIT / HANDHELD 等）；音频写死在 prompt（喘息、皮肤接触声） |
| 4 | 海螺官方风格 Prompt 公式（中文社区转载） | https://www.aisharenet.com/hailuoaishipinprompt/ | 基础：主体+场景+运动；精确：+镜头运动+美感氛围；运镜要有时序与画面变化 |
| 5 | 海螺图生视频 API / 运镜指令 | https://doc.dmxapi.cn/hailuo-img2video.html | `[推进]` `[拉远]` `[跟随]` `[晃动]` `[固定]` 等 bracket 指令；单场景 1–2 个运镜 |
| 6 | 海螺多图参考操作说明（社区） | https://www.youleyou.com/wenzhang/3264373.html 、https://www.youleyou.com/wenzhang/3265108.html | 多图同宽高比；主参考强度约 0.6–0.7、辅参考略低；提示词声明“以 Ref_X 为唯一主体” |
| 7 | 托管版 Hailuo NSFW 政策（PicassoIA 等） | https://blog.picassoia.com/is-hailuo-23-actually-nsfw-friendly | **云端 Hailuo 严格过滤 NSFW**；本地 MiniMax H3 + uncensored TE/预设才是成人路线 |
| 8 | I2V 通用结构（Runway / HackAIGC / Seedance 类指南） | https://help.runwayml.com/hc/en-us/articles/48324313115155-Image-to-Video-Prompting-Guide ；https://www.hackaigc.com/blog/image-to-video-prompt-structure | **I2V 不重写外貌**：只写动作时序、镜头、环境微动、一致性锁；防解剖畸变 negative/约束 |
| 9 | Wan / QwenCloud 多参考生视频引用约定 | https://docs.qwencloud.com/api-reference/video-generation/wan27-reference-to-video/create-task | 提示词用 `Image 1` / `Video 1`（或中文「图1」「视频1」）按 media 数组顺序引用 |
| 10 | Qwen-Image 2.1 文生图/多图编辑结构 | https://docs.qwencloud.com/developer-guides/accuracy-tuning/image-generation ；https://www.weshop.ai/solutions/models/qwen-image-2-1-ai-image-generation-and-editing-guide ；HF PE-I2I README | 自然语言模块：主体/姿势/场景/光影/构图/镜头；多参考显式分工「图1服装→图2人物→图3场景」；姿势用完整句子而非纯 SD 标签堆 |
| 11 | Qwen Image 本地 NSFW / 姿势改写实践 | https://lilting.ch/en/articles/m1max-qwen-image-edit-local | 改姿势用英语/中文完整句；可加 `nsfw` 标签视模型变体而定；身份保持靠参考图而非复述外貌 |

---

## 2. 可复用「积木」结构（跨模型共识）

社区与官方文档反复出现的可组合维度：

1. **模式开关**：T2V / I2V（首帧）/ FL2V（首末帧）/ Multi-ref（R2V）——提示词职责完全不同。
2. **身份来源**：参考图负责外貌；文本少写或不写脸/体型细节（I2V/R2V）。
3. **动作时序**：Beat 1 → Beat 2 → Beat 3（或 0–Xs / Xs–Ys），从当前姿势可到达的下一动作。
4. **镜头语言**：固定 / 推进 / 拉远 / 跟拍 / 手持 / 环绕；**一次一个主运镜**，避免与大幅主体动作打架。
5. **场景 + 光影**：卧室暖灯、浴室蒸汽、车内仪表灯等与动作绑定。
6. **节奏/强度**：gentle / building / intense / afterglow。
7. **声景（H3 特强）**：diegetic（喘息、皮肤、床响）+ optional non-diegetic music。
8. **一致性锁**：preserve face/identity/anatomy/contact points/lighting/background。
9. **负向/排除**：身份漂移、多肢体、未成年暗示、真实名人、突变剪辑、过激畸变。

---

## 3. Minimax H3 vs Qwen Image 2.1 — 关键差异

| 维度 | MINIMAX H3（Hailuo 类 / 本地 H3） | QWEN IMAGE 2.1 |
|------|-----------------------------------|----------------|
| 主任务 | **视频**：运动、镜头、声景、时序 | **图像**：姿势、场景、构图、细节；再喂给 I2V |
| 成人内容 | 云端海螺常拦截；**本地 H3 + NSFW 预设/uncensored TE** 才稳定 | 视部署/微调；本地 NSFW 变体更可控；官方云端策略因平台而异 |
| Prompt 形态 | I2VA：三字段（integrated 描述 + soundscape + music）；R2VA：**六字段 + 参考标签** | 长自然语言段落或「模块句」拼接；多图用 Figure/图N 角色分工 |
| 外貌写法 | I2V/R2V：**几乎不写外貌**，写动作与运镜；R2V 在 subject_definitions 里绑参考 | 文生图需细写姿势/场景；多参考编辑时**禁止复述已由参考提供的身份细节** |
| 姿势库需求 | 提示词偏「时序动词 + 节奏」，姿势名作锚点即可 | **姿势/肢体放置要写细**（角度、支撑点、相对位置）——模块库应更密 |
| 镜头 | 原生强项：`[Shot N]`、camera tags、bracket 运镜 | 静态构图词：close-up / medium / low angle / eye-level；视频阶段再交给 I2V |
| 音频 | 原生联合生成；必须写 soundscape | 图像阶段通常无音频；视频阶段另模型处理 |
| 时长建议 | 预设常见 **5 / 10 / 15s**；复杂动作拆多段 | 单帧定姿；复杂叙事用多帧/故事板再 I2V |
| Negative | 一致性 + 畸变 + 政策排除；部分流水线无独立 negative 框 | 部分 API 无 negative_prompt，排除项写进主 prompt「Do not…」 |

### 差异要点（给 SKILL 用的 6 条）

1. **H3 = 运动与声景导演**；**Qwen Image = 姿势与场景画师**。同一性爱场景：先用 Qwen 定姿定景，再用 H3/I2V 动起来。
2. **I2V 黄金法则**：参考图已含身份/服装/构图 → 提示词只写「接下来怎么动 + 镜头 + 锁一致性」。
3. **Multi-ref**：必须显式槽位（主体A、主体B、姿势参考、场景、风格），并在文中用标签引用；H3 用官方六段式；Qwen 用「图1/图2…」句式。
4. **云端海螺 ≠ 本地 H3**：调研中托管 Hailuo 对露骨内容硬过滤；SKILL 应标注「成人内容优先本地/允许 NSFW 的部署」。
5. **运镜与动作二选一优先**：复杂抽插节奏 → 相机偏 locked/slow push；炫技环绕 → 主体动作简化。
6. **中英可混**：H3 社区常用中文意图 + 英文镜头/声景关键词；Qwen 对完整中文/英文句都友好，SD 式逗号标签效果弱于自然语言。

---

## 4. LoRA / 工作流笔记（非强制，供用户环境参考）

- MiniMax H3 Turbo LoRA（如 lightx2v 8-step 768p）、Ref2VA 专用 LoRA：加速用，不替代提示词结构。
- NSFW 预设（CivArchive OneClick）把用户短句扩写成官方字段格式；SKILL 仍应输出「可粘贴短句 + 可选完整字段骨架」。
- Qwen-Image ControlNet / 姿势参考：适合「姿势库」精确落地；提示词仍要自然语言描述支撑点与接触面。

---

## 5. 调研结论 → SKILL 设计原则

1. **强制问清**：模式（I2V vs Multi-ref）+ 模型（H3 vs Qwen Image 2.1）+ 时长。
2. **积木勾选**：主体 / 场景 / 前戏·口交·性交姿势 / 节奏 / 镜头 / 表情声 / 服装道具 / 叙事弧。
3. **双成品输出**：同一组合给出 **I2V 版** 与 **Multi-ref 版** 两套模板。
4. **百科式槽位**：≥25 性交姿势、≥15 场景、若干前戏/口交/手部/玩具变体。
5. **全文 21+ only**，无真实名人，无年龄模糊词（teen、young girl、学生制服暗示未成年等一律禁止）。


---

## 6. 增补调研（2026-09-25）— 时间轴衔接 + Uncensored LM + ComfyUI 节点

### 6.1 视频动作衔接提示词

| 策略 | 关键词 | 写法要点 |
|------|--------|----------|
| 一镜到底 | continuous take, morph/transition, unbroken shot | 节拍用秒/%；段间写「经可到达中间姿势」；锁身份/接触点/服装/光照；禁止 hard cut |
| 多镜头 | match cut, raccord, eyeline match, action match, exit/enter frame | 每段一镜；匹配视线与动作惯性；防服装/接触瞬移；空间连续 |
| I2V 通用 | beat timeline, physical tether | 不重写外貌；只写 motion + 一个主运镜；道具/肢体要有物理锚 |

参考结构：社区 I2V beat（0–2s / 2–5s / 5–8s）与 ComfyUI Prompt Relay 类「全局 prompt + 分段 local prompts」思路——本项目用纯文本时间轴块达成类似控制，不依赖特定节点。

### 6.2 Uncensored LM（真实 HF，用于扩写提示词）

**~4B：** `n0ctyx/Qwen3-4B-Instruct-Uncensored`；`HauhauCS/Qwen3-4B-2507-Instruct-Uncensored-HauhauCS-Aggressive`；`SicariusSicariiStuff/Phi-3.5-mini-instruct_Uncensored`（3.8B）；`askalgore/Phi-3.5-mini-instruct-heretic`。

**~7–8B：** `Orion-zhen/Qwen2.5-7B-Instruct-Uncensored`（推荐）+ `mradermacher/...-GGUF`；`Orenguteng/Llama-3.1-8B-Lexi-Uncensored`；`ccharnkij/Llama-3.1-8B-Instruct-Uncensored-GGUF`。

### 6.3 ComfyUI custom node 惯例

经典 `NODE_CLASS_MAPPINGS` / `INPUT_TYPES` / `RETURN_TYPES` / `CATEGORY`；`__init__.py` 导出映射。本插件纯逻辑、无重依赖，可在无 ComfyUI 环境下 `import nodes` 做冒烟测试。
