/* NSFW Sex Prompt Composer — app logic + action timeline */
(function () {
  const D = window.PROMPT_DATA;
  if (!D) { document.body.innerHTML = "<p>data.js 未加载</p>"; return; }

  const DURATIONS = (D.meta.durationPresets || [3, 5, 8, 10, 15]).slice();
  const H3_MAX = Number(D.meta.h3MaxSeconds) || 15;

  function maxSegSeconds() {
    // Both models: a beat longer than 15s is useless for H3; keep UI capped at 15 always.
    return H3_MAX;
  }

  function clampSeconds(n) {
    return Math.max(1, Math.min(maxSegSeconds(), Number(n) || 5));
  }

  /** Pack timeline into H3 jobs each totaling ≤ H3_MAX seconds. */
  function packH3Jobs(segs) {
    const jobs = [];
    let cur = [];
    let used = 0;
    segs.forEach((s) => {
      const sec = clampSeconds(s.seconds);
      const item = { ...s, seconds: sec };
      if (cur.length && used + sec > H3_MAX) {
        jobs.push({ beats: cur, total: used });
        cur = [];
        used = 0;
      }
      // single beat longer than max already clamped
      if (sec > H3_MAX) {
        // unreachable after clamp
      }
      if (!cur.length && sec <= H3_MAX) {
        cur = [item];
        used = sec;
      } else if (used + sec <= H3_MAX) {
        cur.push(item);
        used += sec;
      } else {
        jobs.push({ beats: cur, total: used });
        cur = [item];
        used = sec;
      }
    });
    if (cur.length) jobs.push({ beats: cur, total: used });
    return jobs;
  }

  const ACTION_CATS = [
    { key: "foreplay", title: "前戏", data: D.foreplay },
    { key: "oral", title: "口交/口部", data: D.oral },
    { key: "sexPoses", title: "性交姿势", data: D.sexPoses },
    { key: "darkActs", title: "重口味·强制/CNC", data: D.darkActs || [] }
  ];

  let segSeq = 1;
  const state = {
    model: "minimax_h3",
    mode: "i2v",
    lang: "both",
    editMode: "continuous",
    aiPolish: false,
    polishedText: "",
    polishedJobs: [],
    polishError: "",
    polishFingerprint: "",
    showPolishedInPreview: true,
    timeline: [],
    selected: {
      subjects: [],
      bodyTags: [],
      scenes: [],
      foreplay: [],
      oral: [],
      sexPoses: [],
      darkActs: [],
      rhythm: [],
      cameras: [],
      expressions: [],
      dialogueSnippets: [],
      wardrobe: [],
      arcs: []
    }
  };

  const SINGLE = new Set(["subjects", "scenes", "rhythm", "arcs"]);
  const MODULES = [
    { key: "subjects", title: "主体组合", data: D.subjects, single: true },
    { key: "bodyTags", title: "体型标签（可选）", data: D.bodyTags, single: false },
    { key: "scenes", title: "场景 / 光影", data: D.scenes, single: true },
    { key: "foreplay", title: "前戏", data: D.foreplay, single: false },
    { key: "oral", title: "口交 / 口部", data: D.oral, single: false },
    { key: "sexPoses", title: "性交姿势大全", data: D.sexPoses, single: false },
    { key: "darkActs", title: "重口味·强制/非自愿幻想(21+虚构)", data: D.darkActs || [], single: false, dark: true },
    { key: "rhythm", title: "节奏与强度", data: D.rhythm, single: true },
    { key: "cameras", title: "镜头语言", data: D.cameras, single: false },
    { key: "expressions", title: "表情与声音暗示", data: D.expressions, single: false },
    { key: "dialogueSnippets", title: "对白短句（可选）", data: D.dialogueSnippets, single: false },
    { key: "wardrobe", title: "服装与道具", data: D.wardrobe, single: false },
    { key: "arcs", title: "情绪叙事弧", data: D.arcs, single: true }
  ];

  const $ = (s, el = document) => el.querySelector(s);
  const $$ = (s, el = document) => [...el.querySelectorAll(s)];

  function toast(msg) {
    const t = $("#toast");
    t.textContent = msg;
    t.classList.add("show");
    setTimeout(() => t.classList.remove("show"), 1600);
  }

  function pick(arr, ids) {
    return arr.filter((x) => ids.includes(x.id));
  }

  function frag(items, lang) {
    if (!items.length) return "";
    return items
      .map((it) => {
        if (lang === "zh") return it.zh || it.label;
        if (lang === "en") return it.en || it.label;
        return it.en || it.zh || it.label;
      })
      .join("; ");
  }

  function findAction(cat, id) {
    const c = ACTION_CATS.find((x) => x.key === cat);
    if (!c) return null;
    return c.data.find((x) => x.id === id) || null;
  }

  function resolveSegments() {
    return state.timeline.map((seg) => {
      const item = findAction(seg.category, seg.actionId);
      return {
        ...seg,
        label: item ? item.label : "(未选)",
        en: item ? item.en : "",
        zh: item ? item.zh : "",
        seconds: Number(seg.seconds) || 5
      };
    }).filter((s) => s.en || s.zh);
  }

  function totalSeconds(segs) {
    return segs.reduce((a, s) => a + (Number(s.seconds) || 0), 0);
  }

  /** Build optimized beat timeline + transition language */
  function buildTimelineBlock(lang) {
    const segs = resolveSegments();
    if (!segs.length) return { en: "", zh: "" };

    const total = totalSeconds(segs) || 1;
    let t = 0;
    const beatsEn = [];
    const beatsZh = [];
    segs.forEach((s, i) => {
      const start = t;
      const end = t + s.seconds;
      t = end;
      const pct0 = Math.round((start / total) * 100);
      const pct1 = Math.round((end / total) * 100);
      beatsEn.push(
        `[Beat ${i + 1} | ${start}–${end}s | ${pct0}–${pct1}%] ${s.en}`
      );
      beatsZh.push(
        `【节拍${i + 1}｜${start}–${end}秒｜${pct0}–${pct1}%】${s.zh || s.label}`
      );
    });

    const transitionsEn = [];
    const transitionsZh = [];
    if (state.editMode === "continuous") {
      for (let i = 0; i < segs.length - 1; i++) {
        transitionsEn.push(
          `Morph/transition ${i + 1}→${i + 2}: continuous take — bodies stay in contact; ` +
          `reposition through reachable intermediate poses into ${segs[i + 1].label}; ` +
          `no hard cut; keep identity, contact points, wardrobe, lighting, and camera path smooth.`
        );
        transitionsZh.push(
          `过渡 ${i + 1}→${i + 2}：一镜到底 morph——保持身体接触；经可到达的中间姿势转入「${segs[i + 1].label}」；` +
          `禁止硬切；身份、接触点、服装、光照与运镜路径保持平滑。`
        );
      }
    } else {
      for (let i = 0; i < segs.length - 1; i++) {
        transitionsEn.push(
          `Cut ${i + 1}→${i + 2}: match cut / raccord — match eyeline and action inertia from ` +
          `"${segs[i].label}" into "${segs[i + 1].label}"; exit-frame / enter-frame continuity; ` +
          `preserve adult identities across cuts; avoid jump-cut wardrobe or contact teleport.`
        );
        transitionsZh.push(
          `剪辑 ${i + 1}→${i + 2}：match cut / raccord——从「${segs[i].label}」匹配视线与动作惯性切入「${segs[i + 1].label}」；` +
          `出入画连贯；跨镜保持成人身份；避免服装/接触点跳切穿帮。`
        );
      }
    }

    const constraintsEn =
      state.editMode === "continuous"
        ? "CONTINUOUS-TAKE CONSTRAINTS: single unbroken shot; soft morph between action beats; " +
          "no abrupt stepped cuts; no identity drift; no broken anatomy at contact points; " +
          "camera motion continuous (prefer one primary move)."
        : "MULTI-SHOT CONSTRAINTS: one shot per beat; use match cut / eyeline match / action match / raccord; " +
          "no jump cuts that break spatial continuity; keep faces and body identities locked; " +
          "wardrobe and contact points must not teleport between cuts.";

    const constraintsZh =
      state.editMode === "continuous"
        ? "一镜到底约束：单一连续镜头；节拍间柔和 morph；禁止跳切；禁止身份漂移；接触点解剖正确；运镜连续（优先一个主运镜）。"
        : "多镜头约束：每段一镜；使用 match cut / 视线匹配 / 动作匹配 / raccord；禁止破坏空间连续的跳切；跨镜锁定面部与体态身份；服装与接触点不得瞬移。";

    const modeLabelEn = state.editMode === "continuous" ? "ONE CONTINUOUS TAKE" : "MULTI-SHOT EDIT";
    const modeLabelZh = state.editMode === "continuous" ? "一镜到底" : "多镜头剪辑";

    let en =
      `Action timeline (${modeLabelEn}, total ~${total}s, ${segs.length} beats):\n` +
      beatsEn.join("\n") +
      (transitionsEn.length ? "\nTransitions:\n" + transitionsEn.join("\n") : "") +
      "\n" +
      constraintsEn;

    let zh =
      `动作时间轴（${modeLabelZh}，合计约 ${total} 秒，${segs.length} 段）：\n` +
      beatsZh.join("\n") +
      (transitionsZh.length ? "\n过渡衔接：\n" + transitionsZh.join("\n") : "") +
      "\n" +
      constraintsZh;

    // MINIMAX H3: one generation ≈ max 15s — emit explicit job packs when over.
    if (state.model === "minimax_h3") {
      const jobs = packH3Jobs(segs);
      const packEn = [];
      const packZh = [];
      packEn.push(
        `MINIMAX H3 LIMIT: each generation is at most ~${H3_MAX}s. ` +
          (jobs.length === 1
            ? `This timeline fits in ONE job (${jobs[0].total}s).`
            : `Split into ${jobs.length} separate generations (do NOT expect one ${total}s clip).`)
      );
      packZh.push(
        `MINIMAX H3 限制：单次生成约 ≤${H3_MAX} 秒。` +
          (jobs.length === 1
            ? `本时间轴可在【一条】任务内完成（${jobs[0].total}s）。`
            : `已超过单次上限，请拆成 ${jobs.length} 条分别生成（不要指望一次出 ${total}s）。`)
      );
      jobs.forEach((job, ji) => {
        let jt = 0;
        const linesEn = [];
        const linesZh = [];
        job.beats.forEach((b, bi) => {
          const a = jt;
          const e = jt + b.seconds;
          jt = e;
          linesEn.push(`  - JobBeat ${bi + 1} [${a}–${e}s]: ${b.en}`);
          linesZh.push(`  - 任务节拍${bi + 1}【${a}–${e}秒】：${b.zh || b.label}`);
        });
        packEn.push(
          `H3 JOB ${ji + 1}/${jobs.length} (generate ${job.total}s` +
            (ji > 0 ? "; I2V start from last frame of previous job" : "; I2V from your first frame") +
            "):\n" +
            linesEn.join("\n")
        );
        packZh.push(
          `H3 任务 ${ji + 1}/${jobs.length}（生成 ${job.total} 秒` +
            (ji > 0 ? "；用上一条最后一帧做本条首帧 I2V" : "；用你的首帧/参考图做 I2V") +
            "）：\n" +
            linesZh.join("\n")
        );
      });
      en = packEn.join("\n") + "\n\n" + en;
      zh = packZh.join("\n") + "\n\n" + zh;
    }

    if (lang === "en") return { en, zh: "" };
    if (lang === "zh") return { en: "", zh };
    return { en, zh };
  }

  function buildNegative() {
    const n = D.negatives;
    let list = [...n.common];
    if (state.mode === "i2v") list = list.concat(n.i2v);
    if (state.mode === "multiref") list = list.concat(n.multiref);
    if (state.model === "qwen_image") list = list.concat(n.qwen);
    if (state.model === "minimax_h3") list = list.concat(n.h3);
    if (state.model === "ltx_2_5") list = list.concat(n.ltx || []);
    if (state.timeline.length >= 2) {
      if (state.editMode === "continuous") {
        list = list.concat([
          "hard cut mid-take", "jump cut", "identity swap mid-morph", "contact point teleport"
        ]);
      } else {
        list = list.concat([
          "mismatched eyeline across cuts", "wardrobe teleport between shots", "broken action match", "spatial jump cut"
        ]);
      }
    }
    return list.join(", ");
  }

  function formatH3Timecode(sec) {
    const s = Math.max(0, Number(sec) || 0);
    const whole = Math.floor(s + 1e-9);
    const frac = Math.round((s - whole) * 1000);
    const mins = Math.floor(whole / 60);
    const secs = whole % 60;
    return (
      String(mins).padStart(2, "0") +
      ":" +
      String(secs).padStart(2, "0") +
      "." +
      String(Math.max(0, frac)).padStart(3, "0")
    );
  }

  function isLtxModel() {
    return state.model === "ltx_2_5";
  }

  function isH3Model() {
    return state.model === "minimax_h3";
  }

  /** MM:SS clock for LTX SHOT ranges (integer seconds). */
  function formatLtxClock(sec) {
    const s = Math.max(0, Math.round(Number(sec) || 0));
    const mins = Math.floor(s / 60);
    const secs = s % 60;
    return String(mins).padStart(2, "0") + ":" + String(secs).padStart(2, "0");
  }

  /**
   * LTX 2.5 long-video: ONE prompt group with abutting timed SHOTs.
   * Format:
   *   [GLOBAL] scene + 21+ identity lock + light/sound
   *   [SHOT n | MM:SS–MM:SS] one primary action + one camera
   */

  /** REF mode: SHOT bodies use Image 1 / Image 2 (A≈woman, B≈man). Never man/woman/he/she. */
  function rewriteRefActors(text, lang) {
    if (!text || state.mode !== "multiref") return text;
    let s = String(text);
    if (lang === "zh") {
      const reps = [
        [/一名成年女性与一名成年男性/g, "Image 1 与 Image 2"],
        [/一名成年男性与一名成年女性/g, "Image 2 与 Image 1"],
        [/成年女性与成年男性/g, "Image 1 与 Image 2"],
        [/两名明显21岁以上成年伴侣/g, "Image 1 与 Image 2（均21+）"],
        [/一成年女性/g, "Image 1"],
        [/一成年男性/g, "Image 2"],
        [/女上位/g, "Image 1 上位"],
        [/男上位/g, "Image 2 上位"],
        [/成年女性/g, "Image 1"],
        [/成年男性/g, "Image 2"],
        [/女性/g, "Image 1"],
        [/男性/g, "Image 2"],
        [/女人/g, "Image 1"],
        [/男人/g, "Image 2"],
        [/她的/g, "Image 1 的"],
        [/他的/g, "Image 2 的"],
        [/她们/g, "Image 1"],
        [/他们/g, "Image 2"],
        [/她/g, "Image 1"],
        [/他/g, "Image 2"]
      ];
      for (const [re, to] of reps) s = s.replace(re, to);
      return s;
    }
    const repsEn = [
      [/\bone adult man and one adult woman\b/gi, "Image 2 and Image 1"],
      [/\bone adult woman and one adult man\b/gi, "Image 1 and Image 2"],
      [/\btwo clearly adult partners(?:\s*21\+)?\b/gi, "Image 1 and Image 2"],
      [/\bone adult woman\b/gi, "Image 1"],
      [/\bone adult man\b/gi, "Image 2"],
      [/\ban adult woman\b/gi, "Image 1"],
      [/\ban adult man\b/gi, "Image 2"],
      [/\bthe adult woman\b/gi, "Image 1"],
      [/\bthe adult man\b/gi, "Image 2"],
      [/\bthe woman\b/gi, "Image 1"],
      [/\bthe man\b/gi, "Image 2"],
      [/\badult women\b/gi, "Image 1"],
      [/\badult men\b/gi, "Image 2"],
      [/\bwomen\b/gi, "Image 1"],
      [/\bmen\b/gi, "Image 2"],
      [/\bwoman\b/gi, "Image 1"],
      [/\bman\b/gi, "Image 2"],
      [/\bshe\b/gi, "Image 1"],
      [/\bher\b/gi, "Image 1's"],
      [/\bhers\b/gi, "Image 1's"],
      [/\bhe\b/gi, "Image 2"],
      [/\bhim\b/gi, "Image 2"],
      [/\bhis\b/gi, "Image 2's"]
    ];
    for (const [re, to] of repsEn) s = s.replace(re, to);
    s = s.replace(/Image 1's's/g, "Image 1's").replace(/Image 2's's/g, "Image 2's");
    return s;
  }

  function buildLtxPromptGroup() {
    const prefer = state.lang === "en" ? "en" : state.lang === "zh" ? "zh" : "both";
    const segs = resolveSegments();
    const subjects = selectedItems("subjects");
    const body = selectedItems("bodyTags");
    const scenes = selectedItems("scenes");
    const ward = selectedItems("wardrobe");
    const cams = selectedItems("cameras");
    const exprs = selectedItems("expressions");
    const rhythm = selectedItems("rhythm");
    const arcs = selectedItems("arcs");
    const dial = selectedItems("dialogueSnippets");

    const sceneEn = frag(scenes, "en") || "intimate indoor room, soft practical light";
    const sceneZh = frag(scenes, "zh") || "私密室内，柔和实景光";
    const subjEn = frag(subjects, "en") || "two clearly adult partners 21+";
    const subjZh = frag(subjects, "zh") || "两名明显21岁以上成年伴侣";
    const bodyEn = frag(body, "en");
    const bodyZh = frag(body, "zh");
    const wardEn = frag(ward, "en") || "current wardrobe state from reference";
    const wardZh = frag(ward, "zh") || "保持参考图服装状态";
    const exprEn = frag(exprs, "en");
    const exprZh = frag(exprs, "zh");
    const rhythmEn = frag(rhythm, "en");
    const rhythmZh = frag(rhythm, "zh");
    const arcEn = frag(arcs, "en");
    const arcZh = frag(arcs, "zh");

    const idLockEn =
      state.mode === "i2v"
        ? "21+ identity lock from input frame — do not restate faces; preserve adult anatomy, contact points, wardrobe, lighting"
        : "21+ identity lock across subject refs — no identity swap; pose ref transfers pose only";
    const idLockZh =
      state.mode === "i2v"
        ? "21+身份锁定自输入帧——勿复述面部；保持成人体态、接触点、服装与光照"
        : "21+身份锁定参考主体——禁止换脸；姿势参考只迁移姿势";

    const lightSoundEn =
      "Light/sound: soft practicals + intimate room tone; wet skin contact; synced breaths/moans; fabric rustle" +
      (exprEn ? "; cues: " + exprEn : "");
    const lightSoundZh =
      "光影声景：柔和实景光 + 私密室内底噪；肌肤接触；同步喘息/轻吟；布料摩擦" +
      (exprZh ? "；暗示：" + exprZh : "");

    function trimTrail(s) {
      return String(s || "").replace(/[.。；;\s]+$/g, "");
    }

    function globalLine(lang) {
      if (lang === "zh") {
        const bits = [
          sceneZh,
          state.mode === "multiref"
            ? "REF锁定：Image 1=主体A（通常女）身份/外貌完全保留；Image 2=主体B（通常男）身份/外貌完全保留。各 SHOT 只写 Image 1 / Image 2，禁止写男人/女人/他/她。"
            : "主体：" + subjZh + (bodyZh ? "；体型：" + bodyZh : ""),
          idLockZh,
          "服装：" + wardZh
        ];
        if (arcZh) bits.push("叙事弧：" + arcZh);
        if (rhythmZh) bits.push("节奏：" + rhythmZh);
        bits.push(lightSoundZh);
        return "[GLOBAL] " + bits.map(trimTrail).filter(Boolean).join("。") + "。";
      }
      const bits = [
        sceneEn,
        state.mode === "multiref"
          ? "REF lock: Image 1 = adult partner A (usually woman) identity/face/body exact; Image 2 = adult partner B (usually man) identity/face/body exact. In every SHOT name them only as Image 1 / Image 2 — never man/woman/he/she."
          : "Subjects: " + subjEn + (bodyEn ? "; body: " + bodyEn : ""),
        idLockEn,
        "Wardrobe: " + wardEn
      ];
      if (arcEn) bits.push("Arc: " + arcEn);
      if (rhythmEn) bits.push("Rhythm: " + rhythmEn);
      bits.push(lightSoundEn);
      return "[GLOBAL] " + bits.map(trimTrail).filter(Boolean).join(". ") + ".";
    }

    function oneCamera(i) {
      if (!cams.length) {
        return {
          en: state.editMode === "continuous" ? "slow continuous dolly, one primary move" : "motivated medium shot, one camera",
          zh: state.editMode === "continuous" ? "缓慢连续推轨，单一主运镜" : "有动机中景，单一镜头"
        };
      }
      const cam = cams[i % cams.length];
      return { en: cam.en || cam.label, zh: cam.zh || cam.label || cam.en };
    }

    function shotLine(n, start, end, seg, cam, lang) {
      const range = formatLtxClock(start) + "–" + formatLtxClock(end);
      let actionEn = seg.en || seg.label || "intimate adult motion";
      let actionZh = seg.zh || seg.label || seg.en || "亲密成人动作";
      if (state.mode === "multiref") {
        actionEn = rewriteRefActors(actionEn, "en");
        actionZh = rewriteRefActors(actionZh, "zh");
      }
      const linkEn =
        state.editMode === "continuous"
          ? "continuous soft morph; same faces wardrobe contact"
          : "match-cut / raccord continuity; same faces wardrobe contact";
      const linkZh =
        state.editMode === "continuous"
          ? "一镜到底柔和 morph；同一张脸、服装与接触点"
          : "match cut / raccord 连贯；同一张脸、服装与接触点";
      if (lang === "zh") {
        return (
          "[SHOT " +
          n +
          " | " +
          range +
          "] " +
          actionZh +
          "；运镜：" +
          cam.zh +
          "；" +
          linkZh +
          "。"
        );
      }
      return (
        "[SHOT " +
        n +
        " | " +
        range +
        "] " +
        actionEn +
        "; camera: " +
        cam.en +
        "; " +
        linkEn +
        "."
      );
    }

    const linesEn = [globalLine("en")];
    const linesZh = [globalLine("zh")];
    let t = 0;
    if (!segs.length) {
      const cam = oneCamera(0);
      const dummy = {
        en: "continuous intimate adult motion, preserve identity and contact points, 21+",
        zh: "连续亲密成人动作，保持身份与接触点，21+",
        label: "fallback"
      };
      linesEn.push(shotLine(1, 0, 8, dummy, cam, "en"));
      linesZh.push(shotLine(1, 0, 8, dummy, cam, "zh"));
    } else {
      segs.forEach((seg, i) => {
        const start = t;
        const end = t + (Number(seg.seconds) || 0);
        t = end;
        const cam = oneCamera(i);
        linesEn.push(shotLine(i + 1, start, end, seg, cam, "en"));
        linesZh.push(shotLine(i + 1, start, end, seg, cam, "zh"));
      });
    }

    if (prefer === "en") return linesEn.join("\n");
    if (prefer === "zh") return linesZh.join("\n");
    // bilingual: EN block then ZH block
    return "【EN】\n" + linesEn.join("\n") + "\n\n【ZH】\n" + linesZh.join("\n");
  }

  function selectedItems(key) {
    const mod = MODULES.find((m) => m.key === key);
    return mod ? pick(mod.data, state.selected[key] || []) : [];
  }

  function pickLangText(item, prefer) {
    if (!item) return "";
    if (prefer === "zh") return item.zh || item.label || item.en || "";
    if (prefer === "en") return item.en || item.label || item.zh || "";
    return item.zh || item.en || item.label || "";
  }

  function joinItems(items, prefer, sep) {
    return items.map((it) => pickLangText(it, prefer)).filter(Boolean).join(sep || "；");
  }

  function fingerprintPromptInputs() {
    return JSON.stringify({
      model: state.model,
      mode: state.mode,
      lang: state.lang,
      editMode: state.editMode,
      selected: state.selected,
      timeline: state.timeline.map((s) => ({
        category: s.category,
        actionId: s.actionId,
        seconds: s.seconds
      }))
    });
  }

  function invalidatePolish(reason) {
    state.polishedText = "";
    state.polishedJobs = [];
    state.polishError = reason ? String(reason) : "";
    state.polishFingerprint = "";
  }

  /** Official MiniMax H3 FL2VA/I2VA (3-field) or Ref2VA (6-field) shell for one ≤15s job. */
  function buildH3OfficialShell(job, ji, jobsLen) {
    const prefer = state.lang === "en" ? "en" : "zh";
    const subjects = selectedItems("subjects");
    const body = selectedItems("bodyTags");
    const scenes = selectedItems("scenes");
    const ward = selectedItems("wardrobe");
    const cams = selectedItems("cameras");
    const exprs = selectedItems("expressions");
    const rhythm = selectedItems("rhythm");
    const arcs = selectedItems("arcs");
    const dial = selectedItems("dialogueSnippets");
    const beats = (job && job.beats) || [];

    const sceneTxt = joinItems(scenes, prefer) || (prefer === "en" ? "intimate indoor room, soft practical light" : "私密室内，柔和实景光");
    const subjTxt = joinItems(subjects, prefer) || (prefer === "en" ? "two clearly adult partners 21+" : "两名明显21岁以上成年伴侣");
    const bodyTxt = joinItems(body, prefer);
    const wardTxt = joinItems(ward, prefer) || (prefer === "en" ? "current wardrobe state from reference" : "保持参考图服装状态");
    const camTxt = joinItems(cams, prefer);
    const exprTxt = joinItems(exprs, prefer);
    const rhythmTxt = joinItems(rhythm, prefer);
    const arcTxt = joinItems(arcs, prefer);

    const setupParts = [];
    if (prefer === "en") {
      setupParts.push(sceneTxt + ".");
      setupParts.push(
        state.mode === "i2v"
          ? "Subjects: " + subjTxt + (bodyTxt ? "; body: " + bodyTxt : "") + " — roles and motion only; do not restate faces from the reference frame. Age 21+."
          : "Subjects: " + subjTxt + (bodyTxt ? "; body: " + bodyTxt : "") + ". Age 21+ fictional adults."
      );
      setupParts.push("Wardrobe state: " + wardTxt + ".");
      if (arcTxt) setupParts.push("Arc: " + arcTxt + ".");
      if (rhythmTxt) setupParts.push("Rhythm: " + rhythmTxt + ".");
      if (camTxt) setupParts.push("Primary camera: " + camTxt + ". Prefer one continuous camera move.");
      if (exprTxt) setupParts.push("Expression/breath cues: " + exprTxt + ".");
    } else {
      setupParts.push(sceneTxt + "。");
      setupParts.push(
        state.mode === "i2v"
          ? "主体：" + subjTxt + (bodyTxt ? "；体型：" + bodyTxt : "") + "——只写角色与动作，勿复述参考图面部外貌。年龄21+。"
          : "主体：" + subjTxt + (bodyTxt ? "；体型：" + bodyTxt : "") + "。虚构成人21+。"
      );
      setupParts.push("服装状态：" + wardTxt + "。");
      if (arcTxt) setupParts.push("叙事弧：" + arcTxt + "。");
      if (rhythmTxt) setupParts.push("节奏：" + rhythmTxt + "。");
      if (camTxt) setupParts.push("主运镜：" + camTxt + "。优先单一连续运镜。");
      if (exprTxt) setupParts.push("表情/喘息：" + exprTxt + "。");
    }
    const setup = setupParts.join(prefer === "en" ? " " : "");

    const shotLines = [];
    let t = 0;
    if (!beats.length) {
      const fallback =
        prefer === "en"
          ? "continuous intimate adult motion, preserve identity and contact points, soft morph, 21+"
          : "连续亲密成人动作，保持身份与接触点，柔和 morph，21+";
      shotLines.push("[Shot 1] " + fallback);
    } else {
      beats.forEach((b, bi) => {
        let action = prefer === "en" ? b.en || b.zh || b.label : b.zh || b.label || b.en;
        if (state.mode === "multiref") {
          action = rewriteRefActors(action, prefer === "en" ? "en" : "zh");
          if (state.model === "minimax_h3") {
            action = String(action).replace(/Image 1/g, "<Subject 1>").replace(/Image 2/g, "<Subject 2>");
          }
        }
        const camHint =
          state.editMode === "continuous"
            ? prefer === "en"
              ? "; continuous take soft morph; same faces wardrobe contact"
              : "；一镜到底柔和 morph；同一张脸、同一服装与接触点"
            : prefer === "en"
              ? "; match-cut continuity; same faces wardrobe contact"
              : "；match cut 连贯；同一张脸、同一服装与接触点";
        const breath = exprTxt
          ? prefer === "en"
            ? "; " + exprTxt
            : "；" + exprTxt
          : "";
        const endP = prefer === "en" ? "." : "。";
        if (bi === 0) {
          shotLines.push("[Shot 1] " + action + camHint + breath + endP);
        } else {
          shotLines.push(
            "[Shot " +
              (bi + 1) +
              "] At " +
              formatH3Timecode(t) +
              " " +
              action +
              camHint +
              breath +
              endP
          );
        }
        t += Number(b.seconds) || 0;
      });
    }

    const sound =
      prefer === "en"
        ? "overall_soundscape: intimate room tone; wet skin contact; synced breaths and soft moans or muffled cries; sheets or restraint fabric — no dialogue repeat"
        : "overall_soundscape: 私密室内底噪；肌肤接触；与动作同步的喘息/轻吟/闷叫；床单或束缚摩擦——不对白复述";
    const music = "non_diegetic_music: N/A";

    let shell = "";
    if (state.mode === "multiref") {
      const subj1 =
        prefer === "en"
          ? "<Subject 1> is adult partner A from <Picture 1>, identity fully locked, clearly 21+."
          : "<Subject 1> is 成年伴侣A from <Picture 1>, 身份完全锁定，明显21+。";
      const subj2 =
        prefer === "en"
          ? "<Subject 2> is adult partner B from <Picture 2>, identity fully locked, clearly 21+."
          : "<Subject 2> is 成年伴侣B from <Picture 2>, 身份完全锁定，明显21+。";
      const summary =
        prefer === "en"
          ? "summary: [reference generation] Intimate adult scene with <Subject 1> and <Subject 2>; pose guided by <Picture 3>; environment from <Picture 4>; style weak_reference from <Picture 5>."
          : "summary: [reference generation] <Subject 1> 与 <Subject 2> 的亲密成人场景；姿势参考 <Picture 3>；环境参考 <Picture 4>；风格弱参考 <Picture 5>。";
      const retention =
        prefer === "en"
          ? "retention_analysis: <Subject 1>/<Subject 2> fully_preserved; pose <Picture 3> attribute_transfer; scene <Picture 4> as appropriate; style <Picture 5> weak_reference"
          : "retention_analysis: <Subject 1>/<Subject 2> fully_preserved；pose <Picture 3> attribute_transfer；scene <Picture 4> as appropriate；style <Picture 5> weak_reference";
      shell = [
        "subject_definitions:",
        subj1,
        subj2,
        summary,
        retention,
        "detailed_description:",
        setup,
        ...shotLines,
        sound,
        music
      ].join("\n");
    } else {
      shell = [
        "integrated_multimodal_description:",
        setup,
        ...shotLines,
        sound,
        music
      ].join("\n");
    }

    let chainNote =
      ji === 0
        ? prefer === "en"
          ? `H3 JOB ${ji + 1}/${jobsLen} · ~${job.total || 0}s · I2V from your first frame / reference.`
          : `H3 任务 ${ji + 1}/${jobsLen} · 约 ${job.total || 0}s · 用你的首帧/参考图做 I2V。`
        : prefer === "en"
          ? `H3 JOB ${ji + 1}/${jobsLen} · ~${job.total || 0}s · chain: start I2V from LAST FRAME of previous job.`
          : `H3 任务 ${ji + 1}/${jobsLen} · 约 ${job.total || 0}s · 衔接：用上一条最后一帧做本条首帧 I2V。`;

    if (dial.length) {
      chainNote +=
        prefer === "en"
          ? " Optional dialogue (do not paste into soundscape): " + dial.map((d) => d.en).join(" ")
          : " 可选对白（勿写入声景）：" + dial.map((d) => d.zh || d.en).join(" / ");
    }

    return { note: chainNote, shell };
  }

  /** Build shared header context (age, subjects, scene, locks) without full timeline dump. */
  function buildContextParts() {
    const s = state.selected;
    const get = (key) => {
      const mod = MODULES.find((m) => m.key === key);
      return mod ? pick(mod.data, s[key] || []) : [];
    };
    const subjects = get("subjects");
    const body = get("bodyTags");
    const scenes = get("scenes");
    const ward = get("wardrobe");
    const arcs = get("arcs");
    const rhythm = get("rhythm");
    const cams = get("cameras");
    const exprs = get("expressions");
    const dial = get("dialogueSnippets");

    const ageLine =
      "All characters are clearly adults aged 21 or older. Fictional adult content only (CNC/dark fantasy allowed between adults). No minors, no age ambiguity.";
    const ageLineZh =
      "所有角色均为明显21岁及以上成年人。仅虚构成人内容（允许成人间 CNC/暗黑幻想）。无未成年、无年龄模糊。";

    const locks =
      state.mode === "i2v"
        ? { en: D.consistencyLocks.i2v, zh: D.consistencyLocks.i2v_zh }
        : { en: D.consistencyLocks.multiref, zh: D.consistencyLocks.multiref_zh };

    const partsEn = [ageLine];
    const partsZh = [ageLineZh];
    if (state.model === "minimax_h3") {
      partsEn.push("Style: photorealistic cinematic adult intimacy/dark fantasy, natural skin, continuous camera.");
    } else {
      partsEn.push("Detailed adult pose and scene illustration, photorealistic, precise limb placement and contact surfaces.");
    }
    if (state.mode === "i2v") {
      partsEn.push("IMAGE-TO-VIDEO: " + locks.en);
      partsZh.push("图文生视频：" + locks.zh);
      partsEn.push("Do not restate facial appearance; drive motion from the input frame.");
    } else {
      partsEn.push("MULTI-REFERENCE: " + locks.en);
      partsZh.push("多参考：" + locks.zh);
    }
    if (subjects.length) {
      partsEn.push("Subjects: " + frag(subjects, "en") + (body.length ? "; body: " + frag(body, "en") : ""));
      partsZh.push("主体：" + frag(subjects, "zh") + (body.length ? "；体型：" + frag(body, "zh") : ""));
    }
    if (scenes.length) {
      partsEn.push("Scene: " + frag(scenes, "en"));
      partsZh.push("场景：" + frag(scenes, "zh"));
    }
    if (ward.length) {
      partsEn.push("Wardrobe/props: " + frag(ward, "en"));
      partsZh.push("服装道具：" + frag(ward, "zh"));
    }
    if (arcs.length) {
      partsEn.push("Arc: " + frag(arcs, "en"));
      partsZh.push("叙事弧：" + frag(arcs, "zh"));
    }
    if (rhythm.length) {
      partsEn.push("Rhythm: " + frag(rhythm, "en"));
      partsZh.push("节奏：" + frag(rhythm, "zh"));
    }
    if (cams.length) {
      partsEn.push("Camera: " + frag(cams, "en") + ". Prefer one primary camera move; smooth continuous motion.");
      partsZh.push("镜头：" + frag(cams, "zh") + "。优先一个主运镜。");
    }
    if (exprs.length) {
      partsEn.push("Expression/sound cues: " + frag(exprs, "en"));
      partsZh.push("表情声音：" + frag(exprs, "zh"));
    }
    if (dial.length) {
      partsEn.push("Optional short dialogue: " + dial.map((d) => d.en).join(" "));
      partsZh.push("可选对白：" + dial.map((d) => d.zh).join(" / "));
    }
    if (state.model === "minimax_h3") {
      partsEn.push(
        "Soundscape: close intimate/dark room tone; wet skin contact; breath, muffled cries or moans synced to motion; fabric/restraint rustle. non_diegetic_music: N/A or very low pulse."
      );
      partsZh.push("声景：私密/暗黑室内底噪；肌肤接触；与动作同步的喘息/闷叫/轻吟；布料或束缚摩擦。无或极低非叙音乐。");
    }
    return { partsEn, partsZh };
  }

  /** Per-job ≤15s prompts for H3 chaining (also works as single job). */
  function buildH3JobPrompts() {
    const segs = resolveSegments();
    const jobs = segs.length ? packH3Jobs(segs) : [{ beats: [], total: 0 }];
    const lang = state.lang;

    // MiniMax H3: each job is a complete official FL2VA / Ref2VA shell
    if (state.model === "minimax_h3") {
      return jobs.map((job, ji) => {
        const { note, shell } = buildH3OfficialShell(job, ji, jobs.length);
        return {
          index: ji + 1,
          totalJobs: jobs.length,
          seconds: job.total || 0,
          beats: job.beats,
          note,
          shell,
          text: note + "\n\n" + shell
        };
      });
    }

    // Qwen / other: keep freeform narrative job packs
    const ctx = buildContextParts();
    const editLabelEn = state.editMode === "continuous" ? "ONE CONTINUOUS TAKE" : "MULTI-SHOT EDIT";
    const editLabelZh = state.editMode === "continuous" ? "一镜到底" : "多镜头剪辑";

    return jobs.map((job, ji) => {
      const linesEn = [];
      const linesZh = [];
      let jt = 0;
      job.beats.forEach((b, bi) => {
        const a = jt;
        const e = jt + b.seconds;
        jt = e;
        linesEn.push(`[JobBeat ${bi + 1} | ${a}–${e}s] ${b.en}`);
        linesZh.push(`【任务节拍${bi + 1}｜${a}–${e}秒】${b.zh || b.label}`);
      });
      const chainEn =
        ji === 0
          ? "I2V from your first frame / reference image."
          : "I2V start from the LAST FRAME of the previous H3 job — preserve identity, wardrobe state, contact points, lighting.";
      const chainZh =
        ji === 0
          ? "用你的首帧/参考图做 I2V。"
          : "用【上一条 H3 任务最后一帧】做本条首帧 I2V——保持身份、服装状态、接触点、光照。";

      const headEn = [
        `JOB ${ji + 1}/${jobs.length} — generate exactly ~${job.total || 0}s (≤${H3_MAX}s). ${chainEn}`,
        `Edit: ${editLabelEn}.`
      ];
      const headZh = [
        `任务 ${ji + 1}/${jobs.length} — 生成约 ${job.total || 0} 秒（≤${H3_MAX}s）。${chainZh}`,
        `剪辑：${editLabelZh}。`
      ];

      let bodyEn = headEn.concat(ctx.partsEn);
      let bodyZh = headZh.concat(ctx.partsZh);
      if (linesEn.length) {
        bodyEn.push("Action timeline for THIS job only:\n" + linesEn.join("\n"));
        bodyZh.push("本条任务动作时间轴：\n" + linesZh.join("\n"));
        if (state.editMode === "continuous") {
          bodyEn.push("CONTINUOUS-TAKE: soft morph between beats inside this job; no hard cut; no identity drift.");
          bodyZh.push("一镜到底：本条内节拍柔和 morph；禁止硬切；禁止身份漂移。");
        } else {
          bodyEn.push("MULTI-SHOT: match cut / raccord between beats inside this job; preserve adult identities.");
          bodyZh.push("多镜头：本条内 match cut / raccord；跨镜锁定成人身份。");
        }
      }

      let text = "";
      if (lang === "en") text = bodyEn.join("\n\n");
      else if (lang === "zh") text = bodyZh.join("\n\n");
      else text = "【EN】\n" + bodyEn.join("\n\n") + "\n\n【ZH】\n" + bodyZh.join("\n\n");

      return {
        index: ji + 1,
        totalJobs: jobs.length,
        seconds: job.total || 0,
        beats: job.beats,
        note: "",
        shell: text,
        text
      };
    });
  }

  function buildPrompt() {
    // LTX 2.5: ONE prompt group with [GLOBAL] + timed [SHOT] — never H3 job packing / field names
    if (isLtxModel()) {
      return buildLtxPromptGroup();
    }

    // H3: primary copyable output = official shells (one per job), not freeform + skeleton tack-on
    if (state.model === "minimax_h3") {
      const jobs = buildH3JobPrompts();
      if (!jobs.length) return "";
      if (jobs.length === 1) return jobs[0].shell;
      return jobs
        .map((j) => j.note + "\n\n" + j.shell)
        .join("\n\n----------\n\n");
    }

    const s = state.selected;
    const get = (key) => pick(MODULES.find((m) => m.key === key).data, s[key]);

    const subjects = get("subjects");
    const body = get("bodyTags");
    const scenes = get("scenes");
    const foreplay = get("foreplay");
    const oral = get("oral");
    const poses = get("sexPoses");
    const darkActs = get("darkActs");
    const rhythm = get("rhythm");
    const cams = get("cameras");
    const exprs = get("expressions");
    const dial = get("dialogueSnippets");
    const ward = get("wardrobe");
    const arcs = get("arcs");

    const ageLine =
      "All characters are clearly adults aged 21 or older. Fictional adult content only (CNC/dark fantasy allowed between adults). No minors, no age ambiguity.";
    const ageLineZh = "所有角色均为明显21岁及以上成年人。仅虚构成人内容（允许成人间 CNC/暗黑幻想）。无未成年、无年龄模糊。";

    const locks =
      state.mode === "i2v"
        ? { en: D.consistencyLocks.i2v, zh: D.consistencyLocks.i2v_zh }
        : { en: D.consistencyLocks.multiref, zh: D.consistencyLocks.multiref_zh };

    const lang = state.lang;
    const tlSegs = resolveSegments();
    const actionEn = tlSegs.length
      ? tlSegs.map((x) => x.en).join(". Then ")
      : [frag(foreplay, "en"), frag(oral, "en"), frag(poses, "en"), frag(darkActs, "en")].filter(Boolean).join(". Then ");
    const actionZh = tlSegs.length
      ? tlSegs.map((x) => x.zh || x.label).join("。随后 ")
      : [frag(foreplay, "zh"), frag(oral, "zh"), frag(poses, "zh"), frag(darkActs, "zh")].filter(Boolean).join("。随后 ");

    const partsEn = [];
    const partsZh = [];

    partsEn.push(ageLine);
    partsZh.push(ageLineZh);

    partsEn.push("Detailed adult pose and scene illustration, photorealistic, precise limb placement and contact surfaces.");

    if (state.mode === "i2v") {
      partsEn.push("IMAGE-TO-VIDEO: " + locks.en);
      partsZh.push("图文生视频：" + locks.zh);
      partsEn.push("Do not restate facial appearance; drive motion from the input frame.");
    } else {
      partsEn.push("MULTI-REFERENCE: " + locks.en);
      partsZh.push("多参考：" + locks.zh);
      partsEn.push(
        "Slot binding: <Subject 1>/Image 1 = partner A; <Subject 2>/Image 2 = partner B; Image 3 = pose ref (pose only); Image 4 = scene; Image 5 = style weak_reference."
      );
    }

    if (subjects.length) {
      partsEn.push("Subjects: " + frag(subjects, "en") + (body.length ? "; body: " + frag(body, "en") : ""));
      partsZh.push("主体：" + frag(subjects, "zh") + (body.length ? "；体型：" + frag(body, "zh") : ""));
    }
    if (scenes.length) {
      partsEn.push("Scene: " + frag(scenes, "en"));
      partsZh.push("场景：" + frag(scenes, "zh"));
    }
    if (ward.length) {
      partsEn.push("Wardrobe/props: " + frag(ward, "en"));
      partsZh.push("服装道具：" + frag(ward, "zh"));
    }
    if (arcs.length) {
      partsEn.push("Arc: " + frag(arcs, "en"));
      partsZh.push("叙事弧：" + frag(arcs, "zh"));
    }

    const tlBlock = buildTimelineBlock(lang);
    if (tlSegs.length) {
      if (tlBlock.en) partsEn.push(tlBlock.en);
      if (tlBlock.zh) partsZh.push(tlBlock.zh);
    } else if (actionEn) {
      if (state.mode === "i2v") {
        partsEn.push(
          "Beat timeline: [0–30%] " +
            (foreplay.length || oral.length ? frag([...foreplay, ...oral].slice(0, 2), "en") : "settle into position") +
            "; [30–75%] " +
            (poses.length ? frag(poses.slice(0, 2), "en") : actionEn) +
            (rhythm.length ? " with " + frag(rhythm, "en") : "") +
            "; [75–100%] " +
            (arcs.some((a) => a.id.includes("peak") || a.id.includes("full") || a.id === "arc_peak")
              ? "climax then soft afterglow"
              : "sustain rhythm then gentle settle") +
            "."
        );
        partsZh.push(
          "时序：前段铺垫 → 中段主姿势抽送" +
            (rhythm.length ? "（" + frag(rhythm, "zh") + "）" : "") +
            " → 末段收束/高潮/余韵。"
        );
      } else {
        partsEn.push("Actions/poses (detailed): " + actionEn + ".");
        partsZh.push("动作姿势详述：" + actionZh + "。");
      }
    }

    if (rhythm.length) {
      partsEn.push("Rhythm: " + frag(rhythm, "en"));
      partsZh.push("节奏：" + frag(rhythm, "zh"));
    }
    if (cams.length) {
      const camEn = frag(cams, "en");
      partsEn.push(
        "Camera: " +
          camEn +
          (cams.length > 1 ? ". Prefer one primary camera move; keep others subtle." : "") +
          (state.editMode === "continuous"
            ? " Smooth continuous motion, no abrupt stepped cuts."
            : " Per-shot framing may change on match cuts; keep move motivated.")
      );
      partsZh.push("镜头：" + frag(cams, "zh") + "。优先一个主运镜。");
    }
    if (exprs.length) {
      partsEn.push("Expression/sound cues: " + frag(exprs, "en"));
      partsZh.push("表情声音：" + frag(exprs, "zh"));
    }
    if (dial.length) {
      partsEn.push("Optional short dialogue: " + dial.map((d) => d.en).join(" "));
      partsZh.push("可选对白：" + dial.map((d) => d.zh).join(" / "));
    }

    if (poses.length || tlSegs.some((s) => s.category === "sexPoses")) {
      partsEn.push(
        "Pose geometry (Qwen): specify support points, who is on top/bottom, limb angles, where hands grip, eye-level or low camera still-frame composition suitable as I2V first frame."
      );
      partsZh.push("姿势几何（Qwen）：写清支撑点、上下位、肢体角度、手抓位置、适合作为 I2V 首帧的静帧构图。");
    }

    let out = "";
    if (lang === "en") out = partsEn.join("\n\n");
    else if (lang === "zh") out = partsZh.join("\n\n");
    else out = "【EN】\n" + partsEn.join("\n\n") + "\n\n【ZH】\n" + partsZh.join("\n\n");

    return out;
  }

  function buildRefSlotsHtml() {
    if (state.mode !== "multiref") return "";
    const items = D.refSlots
      .map((s) => `<li><strong>${s.label}</strong>（${s.role}）<br/><code>${s.promptHint}</code></li>`)
      .join("");
    return `<div class="ref-box" id="refBox"><h4>多参考槽位分配</h4><ol>${items}</ol>
      <p style="margin:8px 0 0;color:var(--muted)">上传时保持同宽高比；姿势参考勿含需保留的脸部身份；风格参考用弱权重。</p></div>`;
  }

  function renderModules() {
    const root = $("#modules");
    root.innerHTML = "";
    MODULES.forEach((mod, idx) => {
      const selectedCount = state.selected[mod.key].length;
      const el = document.createElement("section");
      el.className = "mod" + (idx < 4 || mod.key === "darkActs" ? " open" : "") + (mod.dark ? " mod-dark" : "");
      el.dataset.key = mod.key;
      el.innerHTML = `
        <div class="mod-head">
          <strong>${mod.title}${mod.single ? "（单选）" : "（多选）"}</strong>
          <span class="count">${selectedCount} 已选 · ${mod.data.length} 项</span>
        </div>
        <div class="mod-body"><div class="chips"></div></div>`;
      const chips = $(".chips", el);
      mod.data.forEach((item) => {
        const b = document.createElement("button");
        b.type = "button";
        b.className = "chip" + (mod.single ? "" : " multi");
        b.textContent = item.label;
        b.title = (item.zh || "") + "\n" + (item.en || "");
        if (state.selected[mod.key].includes(item.id)) b.classList.add("selected");
        b.addEventListener("click", () => toggleSelect(mod.key, item.id, mod.single));
        chips.appendChild(b);
      });
      $(".mod-head", el).addEventListener("click", (e) => {
        if (e.target.closest(".chip")) return;
        el.classList.toggle("open");
      });
      root.appendChild(el);
    });
  }

  function toggleSelect(key, id, single) {
    const arr = state.selected[key];
    if (single) {
      state.selected[key] = arr[0] === id ? [] : [id];
    } else {
      const i = arr.indexOf(id);
      if (i >= 0) arr.splice(i, 1);
      else arr.push(id);
    }
    invalidatePolish();
    renderModules();
    refreshPreview();
  }

  function actionOptionsHtml(category, selectedId) {
    const cat = ACTION_CATS.find((c) => c.key === category) || ACTION_CATS[0];
    return cat.data
      .map((it) => `<option value="${it.id}" ${it.id === selectedId ? "selected" : ""}>${it.label}</option>`)
      .join("");
  }

  function renderTimeline() {
    const host = $("#timelineRows");
    const segs = state.timeline;
    const total = totalSeconds(segs);
    const jobs = packH3Jobs(segs.map((s) => ({ ...s, seconds: clampSeconds(s.seconds) })));
    const over = isH3Model() && total > H3_MAX;
    const elTotal = $("#tlTotal");
    if (isLtxModel()) {
      elTotal.textContent =
        `总时长 ${total}s · ${segs.length} 段 → LTX 单组 ${segs.length || 1} SHOT（累计时间紧挨）`;
    } else {
      elTotal.textContent = over
        ? `总时长 ${total}s · ${segs.length} 段 → 拆成 ${jobs.length} 条 H3 任务（每条 ≤${H3_MAX}s）`
        : `总时长 ${total}s · ${segs.length} 段` + (isH3Model() ? `（H3 单次上限 ${H3_MAX}s）` : "");
    }
    elTotal.classList.toggle("tl-total-over", over);
    const warn = $("#tlWarn");
    if (warn) {
      if (isLtxModel()) {
        warn.hidden = false;
        warn.textContent =
          `当前模型 LTX 2.5：输出【一组】[GLOBAL]+[SHOT n | start–end]，时间轴秒数累计成紧挨时间码；不拆 H3 JOB，也不写官方壳字段名。`;
      } else if (isH3Model() && total > H3_MAX) {
        warn.hidden = false;
        warn.textContent =
          `MINIMAX H3 单次只能生成约 ${H3_MAX} 秒，不能一次出 ${total}s。已按时间轴拆成 ${jobs.length} 条各自 ≤${H3_MAX}s 的提示词任务；请逐条生成并用上一段最后一帧做下一条 I2V 首帧。`;
      } else if (isH3Model()) {
        warn.hidden = false;
        warn.textContent = `当前模型 MINIMAX H3：单次生成请把时间轴总和压在 ${H3_MAX}s 以内（常见 5 / 10 / 15s）。更长剧情请拆多条。`;
      } else {
        warn.hidden = true;
        warn.textContent = "";
      }
    }

    if (!segs.length) {
      host.innerHTML = `<div class="tl-empty">尚未添加动作段。点击「添加动作段」或「从已选积木填充」。建议 ≥3 段以生成完整衔接提示。</div>`;
      return;
    }

    host.innerHTML = "";
    segs.forEach((seg, idx) => {
      const row = document.createElement("div");
      row.className = "tl-row";
      row.dataset.id = seg.id;
      const catOpts = ACTION_CATS.map(
        (c) => `<option value="${c.key}" ${c.key === seg.category ? "selected" : ""}>${c.title}</option>`
      ).join("");
      const durOpts = DURATIONS.map(
        (d) => `<option value="${d}" ${Number(seg.seconds) === d ? "selected" : ""}>${d}s</option>`
      ).join("");
      row.innerHTML = `
        <div class="idx">${idx + 1}</div>
        <select data-field="category" title="类别">${catOpts}</select>
        <select data-field="actionId" title="动作">${actionOptionsHtml(seg.category, seg.actionId)}</select>
        <select data-field="seconds" title="秒数">${durOpts}</select>
        <input type="number" min="1" max="15" step="1" data-field="secondsNum" value="${seg.seconds}" title="自定义秒" />
        <button type="button" class="btn-icon" data-act="del" title="删除">×</button>`;
      host.appendChild(row);
    });

    host.querySelectorAll(".tl-row").forEach((row) => {
      const id = row.dataset.id;
      row.querySelectorAll("select, input").forEach((el) => {
        el.addEventListener("change", () => {
          const seg = state.timeline.find((s) => String(s.id) === String(id));
          if (!seg) return;
          const field = el.dataset.field;
          if (field === "category") {
            seg.category = el.value;
            const cat = ACTION_CATS.find((c) => c.key === seg.category);
            seg.actionId = cat.data[0].id;
          } else if (field === "actionId") {
            seg.actionId = el.value;
          } else if (field === "seconds") {
            seg.seconds = clampSeconds(el.value);
          } else if (field === "secondsNum") {
            seg.seconds = clampSeconds(el.value);
          }
          invalidatePolish();
          renderTimeline();
          refreshPreview();
        });
      });
      row.querySelector('[data-act="del"]').addEventListener("click", () => {
        state.timeline = state.timeline.filter((s) => String(s.id) !== String(id));
        invalidatePolish();
        renderTimeline();
        refreshPreview();
        toast("已删除一段");
      });
    });
  }

  function addSegment(preset) {
    const cat = (preset && preset.category) || "sexPoses";
    const catObj = ACTION_CATS.find((c) => c.key === cat) || ACTION_CATS[2];
    const actionId = (preset && preset.actionId) || catObj.data[0].id;
    const seconds = clampSeconds((preset && preset.seconds) || 5);
    state.timeline.push({ id: segSeq++, category: catObj.key, actionId, seconds });
    invalidatePolish();
    renderTimeline();
    refreshPreview();
  }

  function seedTimelineFromSelection() {
    const picks = [];
    ["foreplay", "oral", "sexPoses", "darkActs"].forEach((k) => {
      (state.selected[k] || []).forEach((id) => picks.push({
        category: k,
        actionId: id,
        seconds: k === "sexPoses" ? 7 : k === "darkActs" ? 5 : 4
      }));
    });
    if (picks.length < 3) {
      // pad with defaults so user gets ≥3
      const defaults = [
        { category: "foreplay", actionId: "kiss_deep", seconds: 3 },
        { category: "oral", actionId: "bj_kneel", seconds: 5 },
        { category: "sexPoses", actionId: "missionary", seconds: 7 }
      ];
      defaults.forEach((d) => {
        if (!picks.some((p) => p.category === d.category && p.actionId === d.actionId)) picks.push(d);
      });
    }
    state.timeline = [];
    picks.slice(0, 8).forEach((p) => addSegment(p));
    toast("已从积木填充 " + state.timeline.length + " 段");
  }

  function renderJobCards() {
    const host = $("#jobPromptsHost");
    if (!host) return;
    // LTX: single prompt group in main preview — hide H3 job packing UI
    if (isLtxModel() || !state.timeline.length) {
      host.innerHTML = "";
      return;
    }
    const jobs = buildH3JobPrompts();
    const fpOk = state.polishFingerprint && state.polishFingerprint === fingerprintPromptInputs();
    const hasPolish = fpOk && state.polishedJobs && state.polishedJobs.length;
    host.innerHTML =
      `<div class="job-head"><strong>H3 分条提示词</strong><span class="count">${jobs.length} 条 · 各 ≤${H3_MAX}s${hasPolish ? " · 润色后" : ""}</span></div>` +
      jobs
        .map((j, idx) => {
          const polished = hasPolish && state.polishedJobs[idx] ? String(state.polishedJobs[idx]).trim() : "";
          const display = polished || (j.shell || j.text);
          const noteHtml = j.note ? `<div class="job-note">${escapeHtml(j.note)}</div>` : "";
          const label = polished ? " · 润色后" : state.model === "minimax_h3" ? " · 官方壳" : "";
          return `
      <div class="job-card" data-job="${idx}">
        <div class="job-card-head">
          <span>JOB ${j.index}/${j.totalJobs} · ${j.seconds}s${label}</span>
          <button type="button" class="btn ghost btn-xs" data-copy-job="${idx}">复制本条</button>
        </div>
        ${noteHtml}
        <textarea readonly class="job-ta" spellcheck="false">${escapeHtml(display)}</textarea>
      </div>`;
        })
        .join("");
    host.querySelectorAll("[data-copy-job]").forEach((btn) => {
      btn.addEventListener("click", async () => {
        const i = Number(btn.dataset.copyJob);
        const j = jobs[i];
        if (!j) return;
        const fpOk2 = state.polishFingerprint && state.polishFingerprint === fingerprintPromptInputs();
        const polished = fpOk2 && state.polishedJobs && state.polishedJobs[i] ? String(state.polishedJobs[i]).trim() : "";
        // Prefer polished shell body; else official shell (not the human note)
        const t = polished || j.shell || j.text;
        if (!t) return;
        try {
          await navigator.clipboard.writeText(t);
          toast("已复制 JOB " + (i + 1) + (polished ? "（润色后）" : ""));
        } catch {
          toast("复制失败，请手动全选");
        }
      });
    });
  }

  function escapeHtml(s) {
    return String(s)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;");
  }

  function syncPolishUi() {
    const wrap = $("#polishWrap");
    const chk = $("#chkAiPolish");
    if (chk) chk.checked = !!state.aiPolish;
    if (wrap) wrap.hidden = !state.aiPolish;
    const btnCopy = $("#btnCopy");
    const btnCopyRaw = $("#btnCopyRaw");
    if (btnCopy) btnCopy.textContent = state.aiPolish ? "复制润色版" : "复制提示词";
    if (btnCopyRaw) btnCopyRaw.hidden = !state.aiPolish;
    const status = $("#polishStatus");
    if (status) {
      if (state.polishError) {
        status.hidden = false;
        status.className = "polish-status err";
        status.textContent = "润色失败：保留原文 — " + state.polishError;
      } else if (state.aiPolish && state.polishedText) {
        status.hidden = false;
        status.className = "polish-status ok";
        status.textContent = isLtxModel()
          ? "润色后已写入主预览（LTX 单组 GLOBAL+SHOT）"
          : "润色后已写入下方预览与各 JOB（标签：润色后）";
      } else if (state.aiPolish) {
        status.hidden = false;
        status.className = "polish-status";
        status.textContent = "已开启 AI 润色 — 点击「重新润色」或等待自动润色…";
      } else {
        status.hidden = true;
        status.textContent = "";
      }
    }
    const outPol = $("#outPolished");
    if (outPol) {
      outPol.value = state.polishedText || "";
      outPol.classList.toggle("polished-active", !!(state.aiPolish && state.polishedText));
    }
    const lblPol = $("#lblPolished");
    if (lblPol) lblPol.textContent = state.polishedText ? "AI 润色后（可复制）" : "AI 润色后";
  }

  function refreshPreview() {
    const direct = buildPrompt();
    const fp = fingerprintPromptInputs();
    const fpOk = state.polishFingerprint && state.polishFingerprint === fp;
    if (state.polishedText && !fpOk) {
      // inputs changed — drop stale polish so preview never shows wrong text
      invalidatePolish();
    }
    const usePolish =
      state.aiPolish &&
      state.showPolishedInPreview &&
      state.polishedText &&
      state.polishFingerprint === fingerprintPromptInputs();

    const outPrompt = $("#outPrompt");
    const lblPrompt = $("#lblPrompt");
    if (outPrompt) {
      outPrompt.value = usePolish ? state.polishedText : direct;
      outPrompt.dataset.raw = direct;
      outPrompt.classList.toggle("polished-active", !!usePolish);
    }
    if (lblPrompt) {
      lblPrompt.textContent = usePolish
        ? "主提示词 · 润色后"
        : isLtxModel()
          ? "直接组装提示词（LTX 单组 GLOBAL+SHOT）"
          : state.model === "minimax_h3"
            ? "直接组装提示词（H3 官方壳）"
            : "直接组装提示词（原文）";
    }

    $("#outNeg").value = buildNegative();
    const slotHost = $("#refSlotHost");
    if (slotHost) slotHost.innerHTML = buildRefSlotsHtml();
    renderJobCards();
    syncPolishUi();
    const editLabel = (D.meta.editModes || []).find((m) => m.id === state.editMode);
    const jobs = state.timeline.length ? packH3Jobs(resolveSegments()) : [];
    const modelMeta = D.meta.models.find((m) => m.id === state.model);
    $("#metaLine").textContent =
      (modelMeta ? modelMeta.label : state.model) +
      " · " +
      D.meta.modes.find((m) => m.id === state.mode).label +
      " · " +
      (editLabel ? editLabel.label : state.editMode) +
      " · 输出：" +
      ({ en: "英文", zh: "中文", both: "中英双语" }[state.lang]) +
      (state.timeline.length
        ? ` · 时间轴 ${state.timeline.length} 段 / ${totalSeconds(state.timeline)}s` +
          (isLtxModel()
            ? ` · LTX×1组/${state.timeline.length}SHOT`
            : isH3Model() && jobs.length
              ? ` · H3×${jobs.length}`
              : "")
        : "") +
      (state.aiPolish ? (usePolish ? " · AI润色已显示" : " · AI润色ON") : " · 直接组装");
    syncModelChrome();
  }

  function clearAll() {
    Object.keys(state.selected).forEach((k) => (state.selected[k] = []));
    invalidatePolish();
    renderModules();
    refreshPreview();
    toast("已清空积木选择");
  }

  function randomize() {
    const pickOne = (arr) => arr[Math.floor(Math.random() * arr.length)].id;
    const pickSome = (arr, n) => {
      const copy = [...arr].sort(() => Math.random() - 0.5);
      return copy.slice(0, n).map((x) => x.id);
    };
    state.selected.subjects = [pickOne(D.subjects)];
    state.selected.bodyTags = pickSome(D.bodyTags, 1);
    state.selected.scenes = [pickOne(D.scenes)];
    state.selected.foreplay = pickSome(D.foreplay, 1 + (Math.random() > 0.5));
    state.selected.oral = Math.random() > 0.4 ? pickSome(D.oral, 1) : [];
    state.selected.sexPoses = pickSome(D.sexPoses, 1 + (Math.random() > 0.5));
    state.selected.darkActs = Math.random() > 0.75 && (D.darkActs || []).length
      ? pickSome(D.darkActs, 2)
      : [];
    state.selected.rhythm = [pickOne(D.rhythm)];
    state.selected.cameras = pickSome(D.cameras, 1 + (Math.random() > 0.6));
    state.selected.expressions = pickSome(D.expressions, 2);
    state.selected.dialogueSnippets = Math.random() > 0.5 ? pickSome(D.dialogueSnippets, 1) : [];
    state.selected.wardrobe = pickSome(D.wardrobe, 1);
    state.selected.arcs = [pickOne(D.arcs)];
    renderModules();
    seedTimelineFromSelection();
    refreshPreview();
    toast("已随机组合 + 时间轴");
  }

  async function copyText(which) {
    let text = "";
    const raw = ($("#outPrompt") && $("#outPrompt").dataset.raw) || ($("#outPrompt") && $("#outPrompt").value) || buildPrompt();
    const fpOk = state.polishFingerprint && state.polishFingerprint === fingerprintPromptInputs();
    const polished = fpOk && state.polishedText ? state.polishedText : "";
    if (which === "neg") text = ($("#outNeg") && $("#outNeg").value) || "";
    else if (which === "raw") text = raw;
    else if (which === "polish") text = polished || (($("#outPolished") && $("#outPolished").value) || "");
    else text = state.aiPolish && polished ? polished : (($("#outPrompt") && $("#outPrompt").value) || raw);
    try {
      await navigator.clipboard.writeText(text);
      toast(which === "neg" ? "已复制负面" : which === "raw" ? "已复制原文" : state.aiPolish && which !== "raw" && polished ? "已复制润色版" : "已复制到剪贴板");
    } catch {
      const el = which === "neg" ? $("#outNeg") : which === "raw" ? null : $("#outPolished") || $("#outPrompt");
      if (el) {
        el.select();
        document.execCommand("copy");
      }
      toast("已复制");
    }
  }

  async function runAiPolish() {
    const Dir = window.NSFWDirector;
    if (!Dir) {
      state.polishError = "director.js 未加载";
      syncPolishUi();
      toast(state.polishError);
      return;
    }
    const cfg = Dir.loadSettings();
    if (!cfg.apiKey) {
      state.polishError = "未配置 API Key — 仍显示直接组装稿";
      syncPolishUi();
      toast(state.polishError);
      return;
    }
    const system = Dir.buildPolishSystemPrompt({
      model: state.model,
      mode: state.mode
    });
    const btn = $("#btnRunPolish");
    if (btn) {
      btn.disabled = true;
      btn.textContent = "润色中…";
    }
    state.polishError = "";
    syncPolishUi();
    const fpAtStart = fingerprintPromptInputs();
    try {
      let polishedParts = [];
      let jobs = [];

      if (isLtxModel()) {
        // LTX: polish the whole single [GLOBAL]+[SHOT…] group once
        const group = buildPrompt();
        const user =
          "Polish the following LTX 2.5 long-video prompt group. " +
          "Keep exactly one group: [GLOBAL] then [SHOT n | MM:SS–MM:SS] with abutting timestamps (no overlap/gaps). " +
          "One primary action + one camera per SHOT. " +
          "Do NOT emit MiniMax H3 field names. Do NOT split into multiple JOB segments. " +
          "Improve cinematic wording only. Output the prompt group only — no markdown fences, no commentary.\n\n" +
          group;
        const out = await Dir.callChatCompletions({
          baseUrl: cfg.apiBase || "https://api.openai.com/v1",
          apiKey: cfg.apiKey,
          model: cfg.model || "gpt-4o-mini",
          system,
          user,
          temperature: 0.35
        });
        polishedParts = [String(out).trim()];
      } else {
        jobs = buildH3JobPrompts();
        for (let i = 0; i < jobs.length; i++) {
          const shellBody = jobs[i].shell || jobs[i].text;
          const user =
            state.model === "minimax_h3"
              ? (
                  "Polish the following MiniMax H3 official prompt shell (" +
                  (i + 1) +
                  "/" +
                  jobs.length +
                  ", " +
                  jobs[i].seconds +
                  "s). Keep ALL field names and structure exactly. " +
                  (state.mode === "multiref"
                    ? "Keep the six Ref2VA fields (subject_definitions / summary / retention_analysis / detailed_description / overall_soundscape / non_diegetic_music). Do NOT use integrated_multimodal_description."
                    : "Keep the three FL2VA/I2VA fields (integrated_multimodal_description / overall_soundscape / non_diegetic_music).") +
                  " Keep [Shot N] markers; Shot 1 must NOT have At timecode; later shots keep At MM:SS.mmm. Improve cinematic wording only. Output the shell fields only — no markdown fences, no commentary.\n\n" +
                  shellBody
                )
              : (
                  "Polish the following job prompt (" +
                  (i + 1) +
                  "/" +
                  jobs.length +
                  ", " +
                  jobs[i].seconds +
                  "s). Keep job boundary and all beats.\n\n" +
                  shellBody
                );
          const out = await Dir.callChatCompletions({
            baseUrl: cfg.apiBase || "https://api.openai.com/v1",
            apiKey: cfg.apiKey,
            model: cfg.model || "gpt-4o-mini",
            system,
            user,
            temperature: 0.35
          });
          polishedParts.push(String(out).trim());
        }
      }
      // If user changed inputs mid-flight, discard
      if (fingerprintPromptInputs() !== fpAtStart) {
        state.polishError = "输入已变更，本次润色已丢弃";
        syncPolishUi();
        toast(state.polishError);
        return;
      }
      state.polishedJobs = isLtxModel() ? [] : polishedParts.slice();
      state.polishedText =
        isLtxModel() || polishedParts.length === 1
          ? polishedParts[0]
          : polishedParts
              .map((p, i) => {
                const head =
                  jobs.length > 1
                    ? (jobs[i].note ? jobs[i].note + "\n\n" : "===== POLISHED JOB " + (i + 1) + "/" + jobs.length + " =====\n")
                    : "";
                return head + p;
              })
              .join("\n\n----------\n\n");
      state.polishFingerprint = fpAtStart;
      state.polishError = "";
      state.showPolishedInPreview = true;
      refreshPreview();
      toast("AI 润色完成 — 已显示润色后");
    } catch (err) {
      console.error(err);
      state.polishError = err && err.message ? err.message.slice(0, 120) : "error";
      // keep any previous polish if fingerprint still matches; else raw stays
      syncPolishUi();
      toast("润色失败：保留原文 — " + state.polishError);
    } finally {
      if (btn) {
        btn.disabled = false;
        btn.textContent = "重新润色";
      }
    }
  }

  function applyDirectorPlan(plan) {
    if (!plan || typeof plan !== "object") {
      toast("编排无效");
      return false;
    }
    if (plan.editMode === "continuous" || plan.editMode === "multicut") {
      state.editMode = plan.editMode;
      document.querySelectorAll("[data-edit]").forEach((b) =>
        b.classList.toggle("active", b.dataset.edit === state.editMode)
      );
      const em = (D.meta.editModes || []).find((m) => m.id === state.editMode);
      const eh = $("#editHint");
      if (eh && em) eh.textContent = em.hint;
      const dirEdit = document.querySelectorAll("[data-dir-edit]");
      dirEdit.forEach((b) => b.classList.toggle("active", b.dataset.dirEdit === state.editMode));
    }
    if (plan.selected && typeof plan.selected === "object") {
      Object.keys(state.selected).forEach((k) => {
        if (Array.isArray(plan.selected[k])) state.selected[k] = plan.selected[k].slice();
      });
    }
    if (Array.isArray(plan.timeline)) {
      state.timeline = [];
      plan.timeline.forEach((seg) => {
        const cat = ACTION_CATS.find((c) => c.key === seg.category) || ACTION_CATS[0];
        const aid = seg.actionId || seg.action_id || (cat.data[0] && cat.data[0].id);
        if (!aid) return;
        state.timeline.push({
          id: segSeq++,
          category: cat.key,
          actionId: aid,
          seconds: clampSeconds(seg.seconds || 5)
        });
      });
    }
    invalidatePolish();
    renderModules();
    renderTimeline();
    refreshPreview();
    return true;
  }

  function showDirectorPreview(plan) {
    const pre = $("#directorPreview");
    if (!pre) return;
    const jobs = plan.jobs || (window.NSFWDirector ? window.NSFWDirector.packBeats(plan.timeline || []) : []);
    const summary = {
      source: plan.source || "plan",
      notes: plan.notes || "",
      editMode: plan.editMode,
      selected: plan.selected,
      timeline: plan.timeline,
      jobCount: jobs.length,
      jobs: jobs.map((j, i) => ({
        job: i + 1,
        total: j.total,
        beats: j.beats.map((b) => b.category + "/" + b.actionId + "@" + b.seconds + "s")
      }))
    };
    pre.textContent = JSON.stringify(summary, null, 2);
    window.__lastDirectorPlan = plan;
  }

  function bindDirector() {
    const Dir = window.NSFWDirector;
    if (!Dir) return;
    const cfg = Dir.loadSettings();
    const setVal = (id, v) => {
      const el = $(id);
      if (el && v != null) el.value = v;
    };
    setVal("#dirApiBase", cfg.apiBase || "https://api.openai.com/v1");
    setVal("#dirApiKey", cfg.apiKey || "");
    setVal("#dirModel", cfg.model || "gpt-4o-mini");
    setVal("#dirTargetSec", cfg.targetSeconds || 45);
    if (typeof cfg.aiPolish === "boolean") state.aiPolish = cfg.aiPolish;

    document.querySelectorAll("[data-dir-edit]").forEach((btn) => {
      btn.addEventListener("click", () => {
        document.querySelectorAll("[data-dir-edit]").forEach((b) => b.classList.toggle("active", b === btn));
      });
    });

    const persistApi = () => {
      Dir.saveSettings({
        apiBase: ($("#dirApiBase") && $("#dirApiBase").value.trim()) || "https://api.openai.com/v1",
        apiKey: ($("#dirApiKey") && $("#dirApiKey").value) || "",
        model: ($("#dirModel") && $("#dirModel").value.trim()) || "gpt-4o-mini",
        targetSeconds: Number($("#dirTargetSec") && $("#dirTargetSec").value) || 45,
        aiPolish: state.aiPolish
      });
    };
    ["#dirApiBase", "#dirApiKey", "#dirModel", "#dirTargetSec"].forEach((sel) => {
      const el = $(sel);
      if (el) el.addEventListener("change", persistApi);
    });

    const getDirEdit = () => {
      const active = document.querySelector("[data-dir-edit].active");
      return (active && active.dataset.dirEdit) || state.editMode || "continuous";
    };

    const btnLocal = $("#btnDirLocal");
    if (btnLocal) {
      btnLocal.addEventListener("click", () => {
        const chapter = ($("#dirChapter") && $("#dirChapter").value) || "";
        if (!chapter.trim()) {
          toast("请先粘贴情节/章节");
          return;
        }
        const target = Number($("#dirTargetSec").value) || 45;
        const plan = Dir.arrangeFromStory(chapter, target, getDirEdit());
        showDirectorPreview(plan);
        toast("本地编排完成 — 可点「应用编排到时间轴」");
      });
    }

    const btnLlm = $("#btnDirLlm");
    if (btnLlm) {
      btnLlm.addEventListener("click", async () => {
        persistApi();
        const cfg2 = Dir.loadSettings();
        if (!cfg2.apiKey) {
          toast("未配置 API Key，改用本地编排");
          $("#btnDirLocal").click();
          return;
        }
        const chapter = ($("#dirChapter") && $("#dirChapter").value) || "";
        if (!chapter.trim()) {
          toast("请先粘贴情节/章节");
          return;
        }
        const target = Number($("#dirTargetSec").value) || 45;
        const editMode = getDirEdit();
        btnLlm.disabled = true;
        btnLlm.textContent = "编排中…";
        try {
          const content = await Dir.callChatCompletions({
            baseUrl: cfg2.apiBase,
            apiKey: cfg2.apiKey,
            model: cfg2.model,
            system: Dir.buildDirectorSystemPrompt(target, editMode),
            user: Dir.buildDirectorUserPrompt(chapter, target, editMode),
            temperature: 0.3
          });
          const parsed = Dir.extractJson(content);
          if (!parsed) throw new Error("无法解析 JSON");
          parsed.source = "llm";
          parsed.jobs = Dir.packBeats(parsed.timeline || []);
          parsed.notes = (parsed.notes || "") + "（大模型编排）";
          showDirectorPreview(parsed);
          toast("大模型编排完成");
        } catch (err) {
          console.error(err);
          toast("LLM 失败，回退本地 — " + (err.message || "").slice(0, 60));
          const plan = Dir.arrangeFromStory(chapter, target, editMode);
          plan.notes += "（LLM 失败回退）";
          showDirectorPreview(plan);
        } finally {
          btnLlm.disabled = false;
          btnLlm.textContent = "用大模型优化编排";
        }
      });
    }

    const btnCopySys = $("#btnDirCopySys");
    if (btnCopySys) {
      btnCopySys.addEventListener("click", async () => {
        const chapter = ($("#dirChapter") && $("#dirChapter").value) || "";
        const target = Number($("#dirTargetSec").value) || 45;
        const editMode = getDirEdit();
        const blob =
          "=== SYSTEM ===\n" +
          Dir.buildDirectorSystemPrompt(target, editMode) +
          "\n\n=== USER ===\n" +
          Dir.buildDirectorUserPrompt(chapter, target, editMode);
        try {
          await navigator.clipboard.writeText(blob);
          toast("已复制给外部 LLM 的系统+用户提示");
        } catch {
          toast("复制失败");
        }
      });
    }

    const btnApply = $("#btnDirApply");
    if (btnApply) {
      btnApply.addEventListener("click", () => {
        const plan = window.__lastDirectorPlan;
        if (!plan) {
          toast("请先本地/LLM 编排");
          return;
        }
        if (applyDirectorPlan(plan)) toast("已应用到时间轴与积木");
      });
    }

    const btnPaste = $("#btnDirPasteJson");
    if (btnPaste) {
      btnPaste.addEventListener("click", () => {
        const raw = ($("#dirJsonPaste") && $("#dirJsonPaste").value) || "";
        const parsed = Dir.extractJson(raw);
        if (!parsed) {
          toast("JSON 无效");
          return;
        }
        parsed.source = "paste";
        parsed.jobs = Dir.packBeats(parsed.timeline || []);
        showDirectorPreview(parsed);
        if (applyDirectorPlan(parsed)) toast("已从 JSON 应用");
      });
    }

    const apiToggle = $("#dirApiToggle");
    const apiBody = $("#dirApiBody");
    if (apiToggle && apiBody) {
      apiToggle.addEventListener("click", () => {
        apiBody.hidden = !apiBody.hidden;
        apiToggle.textContent = apiBody.hidden ? "▸ API 设置（可选）" : "▾ API 设置（可选）";
      });
    }
  }


  function exportFile(type) {
    const payload = {
      meta: {
        model: state.model,
        mode: state.mode,
        lang: state.lang,
        editMode: state.editMode,
        ageGate: D.meta.ageGate,
        exportedAt: new Date().toISOString()
      },
      selection: { ...state.selected },
      timeline: state.timeline.map((s) => ({ ...s })),
      timelinePrompt: buildTimelineBlock(state.lang),
      h3Jobs: isLtxModel() ? null : buildH3JobPrompts().map((j) => ({ index: j.index, seconds: j.seconds, note: j.note || "", shell: j.shell || j.text, text: j.shell || j.text })),
      ltxPromptGroup: isLtxModel() ? buildLtxPromptGroup() : null,
      aiPolish: state.aiPolish,
      polished: state.polishedText || null,
      prompt: $("#outPrompt").value,
      negative: $("#outNeg").value,
      refSlots: state.mode === "multiref" ? D.refSlots : null
    };
    let content, mime, name;
    if (type === "json") {
      content = JSON.stringify(payload, null, 2);
      mime = "application/json";
      name = "sex-prompt-" + Date.now() + ".json";
    } else {
      content =
        D.meta.ageGate +
        "\n\n# PROMPT\n" +
        payload.prompt +
        "\n\n# NEGATIVE\n" +
        payload.negative +
        "\n\n# META\nmodel=" +
        state.model +
        " mode=" +
        state.mode +
        " editMode=" +
        state.editMode;
      mime = "text/plain";
      name = "sex-prompt-" + Date.now() + ".txt";
    }
    const blob = new Blob([content], { type: mime });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = name;
    a.click();
    URL.revokeObjectURL(a.href);
    toast("已导出 " + name);
  }


  function syncModelChrome() {
    const mm = D.meta.models.find((m) => m.id === state.model);
    const mh = $("#modelHint");
    if (mh && mm) mh.textContent = mm.hint;
    const dirCount = $("#dirCountHint");
    if (dirCount) {
      dirCount.textContent = isLtxModel()
        ? "粘贴章节 → 编排 LTX 单组多 SHOT"
        : isH3Model()
          ? "粘贴章节 → 编排 ≤15s H3 任务"
          : "粘贴章节 → 编排时间轴";
    }
    const jobHost = $("#jobPromptsHost");
    if (jobHost && isLtxModel()) jobHost.innerHTML = "";
    const polishHint = $("#polishHint");
    if (polishHint) {
      polishHint.textContent = isLtxModel()
        ? "默认直接组装（积木+时间轴）。LTX：整组 [GLOBAL]+[SHOT] 一次润色；成功后主预览显示润色后；失败保留原文。"
        : isH3Model()
          ? "默认直接组装（积木+时间轴）。打开润色后对每条 H3 JOB 调用兼容 API；成功后主预览与各 JOB 显示润色后；失败保留原文。"
          : "默认直接组装（积木+时间轴）。打开润色后调用兼容 API；成功后主预览显示润色后；失败保留原文。";
    }
  }

  function bindTop() {
    $$("[data-model]").forEach((btn) => {
      btn.addEventListener("click", () => {
        state.model = btn.dataset.model;
        $$("[data-model]").forEach((b) => b.classList.toggle("active", b === btn));
        const mm = D.meta.models.find((m) => m.id === state.model);
        if (mm) $("#modelHint").textContent = mm.hint;
        invalidatePolish();
        syncModelChrome();
        renderTimeline();
        refreshPreview();
      });
    });
    $$("[data-mode]").forEach((btn) => {
      btn.addEventListener("click", () => {
        state.mode = btn.dataset.mode;
        $$("[data-mode]").forEach((b) => b.classList.toggle("active", b === btn));
        $("#modeHint").textContent = D.meta.modes.find((m) => m.id === state.mode).hint;
        invalidatePolish();
        refreshPreview();
      });
    });
    $$("[data-edit]").forEach((btn) => {
      btn.addEventListener("click", () => {
        state.editMode = btn.dataset.edit;
        $$("[data-edit]").forEach((b) => b.classList.toggle("active", b === btn));
        const em = (D.meta.editModes || []).find((m) => m.id === state.editMode);
        $("#editHint").textContent = em ? em.hint : "";
        invalidatePolish();
        refreshPreview();
      });
    });
    $("#langSelect").addEventListener("change", (e) => {
      state.lang = e.target.value;
      invalidatePolish();
      refreshPreview();
    });
    $("#btnCopy").addEventListener("click", () => copyText("prompt"));
    const btnCopyRaw = $("#btnCopyRaw");
    if (btnCopyRaw) btnCopyRaw.addEventListener("click", () => copyText("raw"));
    $("#btnCopyNeg").addEventListener("click", () => copyText("neg"));
    $("#btnClear").addEventListener("click", clearAll);
    $("#btnRandom").addEventListener("click", randomize);
    $("#btnJson").addEventListener("click", () => exportFile("json"));
    $("#btnTxt").addEventListener("click", () => exportFile("txt"));
    $("#btnAddSeg").addEventListener("click", () => {
      addSegment(null);
      toast("已添加动作段");
    });
    $("#btnSeedTl").addEventListener("click", seedTimelineFromSelection);
    $("#btnClearTl").addEventListener("click", () => {
      state.timeline = [];
      invalidatePolish();
      renderTimeline();
      refreshPreview();
      toast("时间轴已清空");
    });

    const chk = $("#chkAiPolish");
    if (chk) {
      chk.addEventListener("change", () => {
        state.aiPolish = !!chk.checked;
        if (window.NSFWDirector) {
          window.NSFWDirector.saveSettings({ aiPolish: state.aiPolish });
        }
        syncPolishUi();
        refreshPreview();
        if (state.aiPolish) runAiPolish();
      });
    }
    const btnRunPolish = $("#btnRunPolish");
    if (btnRunPolish) btnRunPolish.addEventListener("click", () => runAiPolish());

    bindDirector();
  }

  function statsLine() {
    const c = {
      姿势: D.sexPoses.length,
      重口: (D.darkActs || []).length,
      场景: D.scenes.length,
      前戏: D.foreplay.length,
      口交: D.oral.length,
      镜头: D.cameras.length,
      服装道具: D.wardrobe.length
    };
    return Object.entries(c)
      .map(([k, v]) => `${k}${v}`)
      .join(" · ");
  }

  function init() {
    $("#ageBanner").textContent = "⚠ " + D.meta.ageGate;
    $("#stats").textContent = "模块库：" + statsLine();
    bindTop();
    renderModules();
    renderTimeline();
    // default light selection
    state.selected.subjects = ["mf"];
    state.selected.scenes = ["bedroom_night"];
    state.selected.sexPoses = ["missionary"];
    state.selected.foreplay = ["kiss_deep"];
    state.selected.oral = ["bj_kneel"];
    state.selected.rhythm = ["building"];
    state.selected.cameras = ["medium", "push_in"];
    state.selected.expressions = ["breath_soft", "eye_contact"];
    state.selected.arcs = ["arc_full"];
    state.selected.wardrobe = ["lingerie"];
    // default ≥3 timeline segments
    state.timeline = [
      { id: segSeq++, category: "foreplay", actionId: "kiss_deep", seconds: 3 },
      { id: segSeq++, category: "oral", actionId: "bj_kneel", seconds: 5 },
      { id: segSeq++, category: "sexPoses", actionId: "missionary", seconds: 7 }
    ];
    renderModules();
    renderTimeline();
    if (window.NSFWDirector) {
      const cfg = window.NSFWDirector.loadSettings();
      if (typeof cfg.aiPolish === "boolean") state.aiPolish = cfg.aiPolish;
    }
    refreshPreview();
  }

  window.NSFWApp = {
    getState: () => state,
    buildLtxPromptGroup,
    isLtxModel,
    buildPrompt,
    applyDirectorPlan,
    buildPrompt,
    buildH3JobPrompts,
    buildH3OfficialShell,
    buildNegative,
    invalidatePolish,
    refreshPreview,
    renderTimeline,
    renderModules,
    packH3Jobs,
    ACTION_CATS,
    H3_MAX
  };

  document.addEventListener("DOMContentLoaded", init);
})();
