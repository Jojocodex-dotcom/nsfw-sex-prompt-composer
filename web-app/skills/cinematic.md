# Skill Pack · 影视导演拍摄（蒸馏短核）

来源蒸馏：film `plan-camera-shots`；老李 `camera-specs-15rules` / `segment-splicing` / dramaturgy 摘录。  
用途：S4 分镜机位、景别阶梯、段缝末态（提示词层，不写工作流黑话进正文）。

## HARD
- 单 JOB / 单生成段 **≤15s**；超时只许拆 JOB。  
- 正文只写「画面有什么」；禁「末态继承/换机位硬切」等规则词进投喂正文。  
- 21+ 虚构；景别·视角·运镜每镜必有着落。

## 镜头五要素（设计检查；正文可压成三要素）
景别 · 视角角度 · 运镜 ·（动作里体现跟随）· 声画

## 纪律摘要
- 中景/全景优先 30°–60° 斜角，少用 90° 横版感。  
- 连续两镜禁「同景别+同机位」。  
- Eye-trace：相邻镜主体高光同象限或沿动势过渡。  
- 段缝：上段末句写清谁+在哪+姿态+道具；下段首镜换景别或视角至少其一。

## S4 输出 schema
```json
{
  "shots": [
    {
      "id": "sh1",
      "job_hint": 1,
      "t0": 0,
      "t1": 5,
      "shot_size": "中景",
      "angle": "斜角平视",
      "camera": "slowly pushes in",
      "action": "可见动作一句",
      "end_state": "末帧可画出的姿态",
      "assets_ref": ["CHR-A", "SCN-1"],
      "av_pose": null
    }
  ],
  "seam_notes": "job 之间末态与换机位说明（给人看，不进 H3 正文）"
}
```
