# Skill Pack · 文戏优化（蒸馏短核）

来源蒸馏：漫剧老李 `wenxi-micro-expression` / dialogue 预算；film `structure-screenplay` 字段子集。  
用途：S1 文本扩写中的**非床戏段落**（对话、反应、情绪气口）。

## HARD
- 全体角色 **21+ 虚构**；禁未成年/年龄模糊/真实名人 likeness。
- 本包**不写**插入细节、抽送节奏、换姿抽出再进入（交给 jp-av）。
- 输出 JSON，勿 markdown 围栏。

## 情绪六阶段（写可见生理，不写 AU 编号）
1. 触发事件  
2. 身体初识（瞳孔/呼吸一窒）  
3. 社交压抑掩饰  
4. 局部泄露（喉结、嘴角抽动、指尖）  
5. 控制失效破防  
6. 余韵沉淀  

## 对白预算
- 语速约 3.5–5 字/秒；金句后留 0.3–0.8s 无对白反应。  
- >18–24 字长句拆正反打/过肩/反应镜。  
- 台词进 `<d>[Chinese] …</d>` 时，语气写在 `<d>` **外**。

## S1 输出 schema
```json
{
  "title": "",
  "mode_hint": "drama_only|mixed",
  "beats": [
    {
      "id": "b1",
      "kind": "wenxi",
      "seconds": 5,
      "summary": "节拍一句话",
      "emotion_stage": 1,
      "dialogue": [{"who":"A","tone":"低声","text":"..."}],
      "reaction": "可见微反应"
    }
  ],
  "notes": ""
}
```
