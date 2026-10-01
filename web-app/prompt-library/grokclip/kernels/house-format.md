# Grokclip-derived house format (program kernel)

Distilled from 16 public @Grokclip posts (2026-09). Source library: `../index.json` + `../raw/`.

## Field order (emit exactly)

1. `Goal:` duration + `9:16` + live-action adult + readable contact + stable identity + native dialogue audio
2. `Audio rule:` only speak exact words inside `<d>...</d>`; never read pose/intensity/camera/negatives aloud
3. Face/mouth visibility rule (when POV / man-face-out): 可见表情与口型只写女子A；男子脸不出画；男台词画外声
4. `用户介绍（必须体现）：` {POSE_CHAIN}，写实成人向，动作连贯
5. Optional: `动作优先：` hips already moving from 0.00s (no freeze / breath-only micro-sway)
6. `Reference map (upload order = Picture number):` explicit Picture→role bindings + wardrobe locks
7. Role mapping lines + “at 0.00s Picture N fully referenced” + “describe only change after 0.00s”
8. `Consistency:` identity/scene/light locks + genital scale snug + continuous take + `Pose focus chain:` {POSE_CHAIN}
9. Optional blocks: Clothing lock / Intensity focus / 情绪语气 / 性爱表情 / 声音一键
10. `integrated_multimodal_description:` with `[Shot n]` beats
11. `overall_soundscape:` (no dialogue repeat)
12. `non_diegetic_music: N/A`
13. Optional `[Negatives Avoid | Do Not Speak]` operational failure list

## Shot rules

- Shot 1: no `At` timecode; later shots `At MM:SS.mmm` (or clear ranges)
- Prefer continuous take: “the shot continues without cutting”
- Each shot: framing + camera + pose geometry matching selected pose + expression + `<d>` dialogue + wardrobe reinforce
- One mouth speaking at a time
- Pose teleport forbidden; transitions must be physical (stand→kneel via sinking knees, etc.)

## Camera presets (pick one)

- static side / side-rear MCU, fixed tripod, no orbit/push/pull/zoom (impact micro-shake OK)
- first-person POV: camera = man's eyes; never show his face/head; only what his eyes see

## Wardrobe

- NUDE lock or CLOTHED lock bilingual block tied to the correct Picture
- Reinforce wardrobe in each Shot

## AI polish contract

- Rewrite drafts INTO this structure
- Bind SELECTED poses into 用户介绍 + Pose focus chain + every Shot blocking
- Never substitute a different sex position than selected
- Keep adults 21+ fictional only
