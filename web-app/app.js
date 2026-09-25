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
    { key: "sexPoses", title: "性交姿势", data: D.sexPoses }
  ];

  let segSeq = 1;
  const state = {
    model: "minimax_h3",
    mode: "i2v",
    lang: "both",
    editMode: "continuous",
    timeline: [],
    selected: {
      subjects: [],
      bodyTags: [],
      scenes: [],
      foreplay: [],
      oral: [],
      sexPoses: [],
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

  function buildPrompt() {
    const s = state.selected;
    const get = (key) => pick(MODULES.find((m) => m.key === key).data, s[key]);

    const subjects = get("subjects");
    const body = get("bodyTags");
    const scenes = get("scenes");
    const foreplay = get("foreplay");
    const oral = get("oral");
    const poses = get("sexPoses");
    const rhythm = get("rhythm");
    const cams = get("cameras");
    const exprs = get("expressions");
    const dial = get("dialogueSnippets");
    const ward = get("wardrobe");
    const arcs = get("arcs");

    const ageLine =
      "All characters are clearly consenting adults aged 21 or older. Fictional adult content only. No minors, no age ambiguity.";
    const ageLineZh = "所有角色均为明显自愿的21岁及以上成年人。仅虚构成人内容。无未成年、无年龄模糊。";

    const locks =
      state.mode === "i2v"
        ? { en: D.consistencyLocks.i2v, zh: D.consistencyLocks.i2v_zh }
        : { en: D.consistencyLocks.multiref, zh: D.consistencyLocks.multiref_zh };

    const lang = state.lang;
    const tlSegs = resolveSegments();
    const actionEn = tlSegs.length
      ? tlSegs.map((x) => x.en).join(". Then ")
      : [frag(foreplay, "en"), frag(oral, "en"), frag(poses, "en")].filter(Boolean).join(". Then ");
    const actionZh = tlSegs.length
      ? tlSegs.map((x) => x.zh || x.label).join("。随后 ")
      : [frag(foreplay, "zh"), frag(oral, "zh"), frag(poses, "zh")].filter(Boolean).join("。随后 ");

    const partsEn = [];
    const partsZh = [];

    partsEn.push(ageLine);
    partsZh.push(ageLineZh);

    if (state.model === "minimax_h3") {
      partsEn.push("Style: photorealistic cinematic adult intimacy, natural skin, continuous camera.");
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
      if (state.model === "minimax_h3" || state.mode === "i2v") {
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
          (state.editMode === "continuous" || state.model === "minimax_h3"
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

    if (state.model === "minimax_h3") {
      partsEn.push(
        "Soundscape: close intimate room tone; wet skin contact; breath and soft moans synced to motion; fabric/sheets rustle. non_diegetic_music: N/A or very low pulse."
      );
      partsZh.push("声景：私密室内底噪；肌肤接触；与动作同步的喘息轻吟；床单摩擦。无或极低非叙音乐。");
    }

    if (state.model === "qwen_image" && (poses.length || tlSegs.some((s) => s.category === "sexPoses"))) {
      partsEn.push(
        "Pose geometry (Qwen): specify support points, who is on top/bottom, limb angles, where hands grip, eye-level or low camera still-frame composition suitable as I2V first frame."
      );
      partsZh.push("姿势几何（Qwen）：写清支撑点、上下位、肢体角度、手抓位置、适合作为 I2V 首帧的静帧构图。");
    }

    let out = "";
    if (lang === "en") out = partsEn.join("\n\n");
    else if (lang === "zh") out = partsZh.join("\n\n");
    else out = "【EN】\n" + partsEn.join("\n\n") + "\n\n【ZH】\n" + partsZh.join("\n\n");

    if (state.mode === "multiref" && state.model === "minimax_h3") {
      out +=
        "\n\n---\n[MiniMax H3 R2VA field skeleton]\n" +
        "subject_definitions:\n" +
        "<Subject 1> is the adult partner A from <Picture 1>, identity fully locked, 21+.\n" +
        "<Subject 2> is the adult partner B from <Picture 2>, identity fully locked, 21+.\n" +
        (scenes.length ? "<Subject 3> is the environment from <Picture 4>, " + frag(scenes, "en") + ".\n" : "") +
        "summary:\n[reference generation] Intimate adult scene with <Subject 1> and <Subject 2>; pose guided by <Picture 3>; environment from scene ref.\n" +
        "retention_analysis:\n<Subject 1>: fully_preserved\n<Subject 2>: fully_preserved\n<Picture 3>: attribute_transfer - pose/contact only\n" +
        "detailed_description:\n[Shot 1] " +
        (tlSegs.length ? `timeline ${state.editMode}, ${tlSegs.length} beats` : actionEn || "continuous intimate motion") +
        "\noverall_soundscape: intimate room tone, breaths, skin contact\nnon_diegetic_music: N/A";
    }

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
      el.className = "mod" + (idx < 4 ? " open" : "");
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
    const over = state.model === "minimax_h3" && total > H3_MAX;
    const elTotal = $("#tlTotal");
    elTotal.textContent = over
      ? `总时长 ${total}s · ${segs.length} 段 → 拆成 ${jobs.length} 条 H3 任务（每条 ≤${H3_MAX}s）`
      : `总时长 ${total}s · ${segs.length} 段` + (state.model === "minimax_h3" ? `（H3 单次上限 ${H3_MAX}s）` : "");
    elTotal.classList.toggle("tl-total-over", over);
    const warn = $("#tlWarn");
    if (warn) {
      if (state.model === "minimax_h3" && total > H3_MAX) {
        warn.hidden = false;
        warn.textContent =
          `MINIMAX H3 单次只能生成约 ${H3_MAX} 秒，不能一次出 ${total}s。已按时间轴拆成 ${jobs.length} 条各自 ≤${H3_MAX}s 的提示词任务；请逐条生成并用上一段最后一帧做下一条 I2V 首帧。`;
      } else if (state.model === "minimax_h3") {
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
          renderTimeline();
          refreshPreview();
        });
      });
      row.querySelector('[data-act="del"]').addEventListener("click", () => {
        state.timeline = state.timeline.filter((s) => String(s.id) !== String(id));
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
    renderTimeline();
    refreshPreview();
  }

  function seedTimelineFromSelection() {
    const picks = [];
    ["foreplay", "oral", "sexPoses"].forEach((k) => {
      state.selected[k].forEach((id) => picks.push({ category: k, actionId: id, seconds: k === "sexPoses" ? 7 : 4 }));
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

  function refreshPreview() {
    $("#outPrompt").value = buildPrompt();
    $("#outNeg").value = buildNegative();
    const slotHost = $("#refSlotHost");
    slotHost.innerHTML = buildRefSlotsHtml();
    const editLabel = (D.meta.editModes || []).find((m) => m.id === state.editMode);
    $("#metaLine").textContent =
      D.meta.models.find((m) => m.id === state.model).label +
      " · " +
      D.meta.modes.find((m) => m.id === state.mode).label +
      " · " +
      (editLabel ? editLabel.label : state.editMode) +
      " · 输出：" +
      ({ en: "英文", zh: "中文", both: "中英双语" }[state.lang]) +
      (state.timeline.length ? ` · 时间轴 ${state.timeline.length} 段 / ${totalSeconds(state.timeline)}s` : "");
  }

  function clearAll() {
    Object.keys(state.selected).forEach((k) => (state.selected[k] = []));
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
    const text = which === "neg" ? $("#outNeg").value : $("#outPrompt").value;
    try {
      await navigator.clipboard.writeText(text);
      toast("已复制到剪贴板");
    } catch {
      const ta = which === "neg" ? $("#outNeg") : $("#outPrompt");
      ta.select();
      document.execCommand("copy");
      toast("已复制");
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

  function bindTop() {
    $$("[data-model]").forEach((btn) => {
      btn.addEventListener("click", () => {
        state.model = btn.dataset.model;
        $$("[data-model]").forEach((b) => b.classList.toggle("active", b === btn));
        $("#modelHint").textContent = D.meta.models.find((m) => m.id === state.model).hint;
        renderTimeline();
        refreshPreview();
      });
    });
    $$("[data-mode]").forEach((btn) => {
      btn.addEventListener("click", () => {
        state.mode = btn.dataset.mode;
        $$("[data-mode]").forEach((b) => b.classList.toggle("active", b === btn));
        $("#modeHint").textContent = D.meta.modes.find((m) => m.id === state.mode).hint;
        refreshPreview();
      });
    });
    $$("[data-edit]").forEach((btn) => {
      btn.addEventListener("click", () => {
        state.editMode = btn.dataset.edit;
        $$("[data-edit]").forEach((b) => b.classList.toggle("active", b === btn));
        const em = (D.meta.editModes || []).find((m) => m.id === state.editMode);
        $("#editHint").textContent = em ? em.hint : "";
        refreshPreview();
      });
    });
    $("#langSelect").addEventListener("change", (e) => {
      state.lang = e.target.value;
      refreshPreview();
    });
    $("#btnCopy").addEventListener("click", () => copyText("prompt"));
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
      renderTimeline();
      refreshPreview();
      toast("时间轴已清空");
    });
  }

  function statsLine() {
    const c = {
      姿势: D.sexPoses.length,
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
    refreshPreview();
  }

  document.addEventListener("DOMContentLoaded", init);
})();
