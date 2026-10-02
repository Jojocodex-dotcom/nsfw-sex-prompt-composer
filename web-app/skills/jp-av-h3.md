# Skill Pack · JP-AV → MiniMax H3 映射（蒸馏短核）

调度逻辑蒸馏自 `NSFW-JP-AV-动作导演提示词规则-LTX2.5.md`；**本包输出目标是 H3**，不是 LTX。

## HARD
- 21+ 虚构自愿或标注的成人 CNC 幻想；禁未成年/名人/兽交/虐杀。  
- **禁止**把 LTX 的 `[GLOBAL]/[SHOT n | a–b]` 当作 H3 唯一壳直接交差。  
- H3：单 JOB ≤15s；总长拆多 JOB；JOB 内可用 `[Shot N]` + `At MM:SS.mmm`。  
- FL2VA/I2V：三字段 `integrated_multimodal_description` / `overall_soundscape` / `non_diegetic_music`。  
- Ref2VA：六字段，**不要** `integrated_multimodal_description`。  
- 若下游模式是 LTX：改走 LTX 规则文件，**本包不混 H3 字段名**。

## 调度（可跨多个 ≤15s JOB）
| 阶段 | 占比 | 内容 |
|------|------|------|
| 铺垫 | 15–25% | 吻、爱抚、解衣 |
| 主戏 | 中段 | **一个主姿势**节奏变化（可占连续 2–3 Shot） |
| 换姿势 | 短 Shot | **必须**抽出 → 支撑点变更 → 再进入 |
| 收束 | 15–25% | 加速/高潮表情或余韵 |

## 每 Shot 必写
上下位 · 支撑点 · 接触/插入关系 · 手位 · 骨盆节奏（slow deep → faster） · 与上一 Shot 因果 · **击打/拍击反馈**（听得见的皮肉声）与**被击反应**（身体一颤、喘、握床单）

## 运镜用词（H3 友好英文片段）
`static locked-off` / `camera slowly pushes in` / `camera pans right|left` / `subtle handheld movement`

## S1/S4 床戏节拍可附
```json
{
  "av_arc": ["foreplay", "main_pose", "pose_change", "climax"],
  "pose_chain": ["missionary", "doggy"],
  "continuity": "withdraw → support change → re-enter"
}
```
