/* Story Director + optional LLM arrange/polish — loads after data.js, before/with app hooks */
(function () {
  const D = window.PROMPT_DATA;
  if (!D) return;

  const LS_KEY = "nsfwPromptComposer_v13";
  const H3_MAX = Number(D.meta.h3MaxSeconds) || 15;

  function loadSettings() {
    try {
      return JSON.parse(localStorage.getItem(LS_KEY) || "{}") || {};
    } catch {
      return {};
    }
  }
  function saveSettings(partial) {
    const cur = loadSettings();
    Object.assign(cur, partial);
    localStorage.setItem(LS_KEY, JSON.stringify(cur));
    return cur;
  }

  const KEYWORD_MAP = [
    { re: /强奸|强迫|非自愿|CNC|non[\s-]?con|rape|forced|挣扎|压制|撕衣/i, acts: ["cnc_struggle_pin", "cnc_tear_clothes", "cnc_forced_entry", "cnc_rough_thrust", "cnc_muffled_cry"], scene: "locked_bedroom", subject: "mf", ward: ["torn_clothes"], expr: ["fear_pleasure_mix", "tears_cnc"], arc: "arc_forced_break" },
    { re: /轮奸|多人|gangbang|gang\s*bang|一女多男|围拢|轮流/i, acts: ["gang_surround", "gang_oral_train", "gang_penetration_chain", "gang_finish_marks"], scene: "warehouse_dark", subject: "gang_mf", ward: ["lingerie_ripped"], expr: ["muffled_sound", "fear_pleasure_mix"], arc: "arc_gang_rounds" },
    { re: /调教|BDSM|项圈|牵引|打臀|高潮控制|宠物|羞辱|绳缚|口球|蒙眼/i, acts: ["train_collar_leash", "train_spank_count", "train_orgasm_control", "train_forced_orgasm", "bondage_rope_full"], scene: "dungeon_playroom", subject: "mf", ward: ["collar_leash_set", "rope_visible"], expr: ["breaking_submit", "defiant_glare"], arc: "arc_train_progress" },
    { re: /迷奸|昏睡|迷药|drug|drowsy|sleep\s*sex|软体|无意识/i, acts: ["drug_drowsy_setup", "drug_limp_use", "drug_wake_halfway"], scene: "motel_dark", subject: "mf", ward: ["lingerie"], expr: ["dazed_drowsy"], arc: "arc_drug_wake" },
    { re: /绑架|van|厢式|拖入|囚禁/i, acts: ["kidnap_van_grab", "cnc_struggle_pin", "cnc_forced_entry", "bondage_rope_full"], scene: "van_interior", subject: "mf", ward: ["duct_tape", "tape_wrists"], expr: ["defiant_glare", "fear_pleasure_mix"], arc: "arc_kidnap_escalate" },
    { re: /勒索|胁迫|blackmail|coerce|办公室/i, acts: ["blackmail_coerce", "cnc_forced_entry", "cnc_rough_thrust"], scene: "office_coerce", subject: "mf", ward: ["office_disheveled"], expr: ["defiant_glare", "breaking_submit"], arc: "arc_forced_break" },
    { re: /公共|差点|巷|alley|almost.?caught/i, acts: ["public_risk_almost", "cnc_rough_thrust"], scene: "alley_night", subject: "mf", ward: ["torn_clothes"], expr: ["muffled_sound"], arc: "arc_quickie" },
    { re: /口交|oral|深喉|跪/i, acts: null, oral: ["bj_kneel", "bj_deep"], catHint: "oral" },
    { re: /后入|doggy|prone/i, acts: null, pose: ["doggy", "doggy_chest_down"] },
    { re: /传教士|missionary/i, acts: null, pose: ["missionary", "missionary_legs_up"] },
    { re: /骑乘|cowgirl/i, acts: null, pose: ["cowgirl", "reverse_cowgirl"] },
    { re: /酒店|hotel|套房/i, acts: null, sceneOnly: "hotel_suite" },
    { re: /地牢|dungeon|playroom/i, acts: null, sceneOnly: "dungeon_playroom" },
    { re: /仓库|warehouse/i, acts: null, sceneOnly: "warehouse_dark" },
    { re: /前戏|亲吻|kiss|爱抚/i, acts: null, foreplay: ["kiss_deep", "grind_clothed"] },
    { re: /器具|玩具|跳蛋|插入玩具/i, acts: ["object_toy_insert", "train_forced_orgasm"], ward: ["vibrator_prop"] },
    { re: /中出|creampie|繁殖/i, acts: ["creampie_breed_talk"] },
    { re: /颜射|facial/i, acts: ["facial_finish"] }
  ];

  function detectThemes(text) {
    const hits = [];
    KEYWORD_MAP.forEach((rule) => {
      if (rule.re.test(text)) hits.push(rule);
    });
    return hits;
  }

  function uniq(arr) {
    return [...new Set(arr.filter(Boolean))];
  }

  function arrangeFromStory(text, targetSeconds, editMode) {
    const tSec = Math.max(5, Math.min(180, Number(targetSeconds) || 45));
    const hits = detectThemes(text || "");
    const selected = {
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
    };

    let preferredActs = [];
    hits.forEach((h) => {
      if (h.acts) preferredActs.push(...h.acts);
      if (h.oral) selected.oral.push(...h.oral);
      if (h.pose) selected.sexPoses.push(...h.pose);
      if (h.foreplay) selected.foreplay.push(...h.foreplay);
      if (h.ward) selected.wardrobe.push(...h.ward);
      if (h.expr) selected.expressions.push(...h.expr);
      if (h.subject) selected.subjects = [h.subject];
      if (h.scene) selected.scenes = [h.scene];
      if (h.sceneOnly) selected.scenes = [h.sceneOnly];
      if (h.arc) selected.arcs = [h.arc];
    });

    preferredActs = uniq(preferredActs);
    if (!preferredActs.length) {
      // soft default intimate arc
      preferredActs = [];
      selected.foreplay = selected.foreplay.length ? selected.foreplay : ["kiss_deep", "strip_tease"];
      selected.oral = selected.oral.length ? selected.oral : ["bj_kneel"];
      selected.sexPoses = selected.sexPoses.length ? selected.sexPoses : ["missionary", "doggy"];
    }

    if (!selected.subjects.length) selected.subjects = preferredActs.some((id) => String(id).startsWith("gang_")) ? ["gang_mf"] : ["mf"];
    if (!selected.scenes.length) selected.scenes = ["bedroom_night"];
    if (!selected.rhythm.length) selected.rhythm = preferredActs.length ? ["intense"] : ["building"];
    if (!selected.cameras.length) selected.cameras = ["medium", "closeup_face", preferredActs.length ? "handheld" : "push_in"];
    if (!selected.expressions.length) selected.expressions = preferredActs.length ? ["fear_pleasure_mix", "breath_hard"] : ["breath_soft", "eye_contact"];
    if (!selected.arcs.length) selected.arcs = preferredActs.length ? ["arc_forced_break"] : ["arc_full"];
    if (!selected.wardrobe.length) selected.wardrobe = preferredActs.length ? ["torn_clothes"] : ["lingerie"];
    selected.darkActs = preferredActs.slice(0, 8);
    selected.oral = uniq(selected.oral);
    selected.sexPoses = uniq(selected.sexPoses);
    selected.foreplay = uniq(selected.foreplay);
    selected.wardrobe = uniq(selected.wardrobe);
    selected.expressions = uniq(selected.expressions);
    selected.cameras = uniq(selected.cameras);

    // Build narrative beat list: setup → escalate → climax → aftermath
    const timeline = [];
    const pushBeat = (category, actionId, seconds) => {
      timeline.push({ category, actionId, seconds: Math.max(3, Math.min(H3_MAX, seconds)) });
    };

    const darkIds = selected.darkActs.slice();
    const hasDark = darkIds.length > 0;

    if (hasDark) {
      // setup
      if (/绑架|van|kidnap/i.test(text)) pushBeat("darkActs", "kidnap_van_grab", 4);
      else if (/迷奸|drowsy|drug|昏睡/i.test(text)) pushBeat("darkActs", "drug_drowsy_setup", 5);
      else if (/调教|collar|项圈/i.test(text)) pushBeat("darkActs", "train_collar_leash", 4);
      else if (/轮奸|gang/i.test(text)) pushBeat("darkActs", "gang_surround", 4);
      else pushBeat("darkActs", darkIds[0] || "cnc_struggle_pin", 4);

      // escalate core acts
      const core = darkIds.filter((id) => !timeline.some((t) => t.actionId === id)).slice(0, 5);
      core.forEach((id, i) => {
        const sec = i === core.length - 1 ? 7 : 5;
        pushBeat("darkActs", id, sec);
      });

      // optional oral/pose seasoning if keywords
      if (selected.oral.length && timeline.reduce((a, s) => a + s.seconds, 0) < tSec - 6) {
        pushBeat("oral", selected.oral[0], 5);
      }
      if (selected.sexPoses.length && /后入|doggy|传教士|骑乘/i.test(text)) {
        pushBeat("sexPoses", selected.sexPoses[0], 6);
      }

      // climax / aftermath
      if (/中出|creampie|繁殖/i.test(text)) pushBeat("darkActs", "creampie_breed_talk", 4);
      else if (/颜射|facial/i.test(text)) pushBeat("darkActs", "facial_finish", 4);
      else if (darkIds.includes("gang_finish_marks")) pushBeat("darkActs", "gang_finish_marks", 4);
      else if (darkIds.includes("train_forced_orgasm")) pushBeat("darkActs", "train_forced_orgasm", 5);
      else if (darkIds.includes("marks_bruises_stylized")) pushBeat("darkActs", "marks_bruises_stylized", 3);
      else pushBeat("darkActs", darkIds[darkIds.length - 1] || "cnc_rough_thrust", 5);
    } else {
      if (selected.foreplay[0]) pushBeat("foreplay", selected.foreplay[0], 4);
      if (selected.oral[0]) pushBeat("oral", selected.oral[0], 5);
      (selected.sexPoses.slice(0, 2).length ? selected.sexPoses.slice(0, 2) : ["missionary"]).forEach((id, i) =>
        pushBeat("sexPoses", id, i === 0 ? 7 : 5)
      );
    }

    // Scale total ≈ targetSeconds by adjusting / padding
    let total = timeline.reduce((a, s) => a + s.seconds, 0);
    if (total < tSec) {
      // stretch last beats or pad
      let need = tSec - total;
      let i = 0;
      while (need > 0 && timeline.length) {
        const idx = timeline.length - 1 - (i % Math.min(3, timeline.length));
        const room = H3_MAX - timeline[idx].seconds;
        if (room > 0) {
          const add = Math.min(room, need, 3);
          timeline[idx].seconds += add;
          need -= add;
        }
        i++;
        if (i > 40) break;
      }
      while (need >= 3) {
        const last = timeline[timeline.length - 1];
        const padId = hasDark ? darkIds[Math.min(darkIds.length - 1, timeline.length % darkIds.length)] || last.actionId : last.actionId;
        const sec = Math.min(8, need, H3_MAX);
        pushBeat(hasDark ? "darkActs" : last.category, padId, sec);
        need -= sec;
        if (timeline.length > 12) break;
      }
    } else if (total > tSec) {
      // trim from end
      while (timeline.length > 1 && timeline.reduce((a, s) => a + s.seconds, 0) > tSec) {
        const last = timeline[timeline.length - 1];
        const over = timeline.reduce((a, s) => a + s.seconds, 0) - tSec;
        if (last.seconds - over >= 3) {
          last.seconds -= over;
          break;
        }
        timeline.pop();
      }
    }

    // Deduplicate consecutive identical
    const cleaned = [];
    timeline.forEach((b) => {
      const prev = cleaned[cleaned.length - 1];
      if (prev && prev.category === b.category && prev.actionId === b.actionId) {
        prev.seconds = Math.min(H3_MAX, prev.seconds + b.seconds);
      } else cleaned.push({ ...b });
    });

    const finalTotal = cleaned.reduce((a, s) => a + s.seconds, 0);
    const jobs = packBeats(cleaned);

    return {
      selected,
      timeline: cleaned,
      editMode: editMode || "continuous",
      notes: `本地规则编排：检测到 ${hits.length} 类主题关键词；总时长约 ${finalTotal}s → ${jobs.length} 条 H3 任务（每条 ≤${H3_MAX}s）。成人21+虚构 CNC/暗黑内容已按积木映射。`,
      jobs,
      targetSeconds: tSec,
      source: "local"
    };
  }

  function packBeats(segs) {
    const jobs = [];
    let cur = [];
    let used = 0;
    segs.forEach((s) => {
      const sec = Math.max(1, Math.min(H3_MAX, Number(s.seconds) || 5));
      const item = { ...s, seconds: sec };
      if (cur.length && used + sec > H3_MAX) {
        jobs.push({ beats: cur, total: used });
        cur = [item];
        used = sec;
      } else {
        cur.push(item);
        used += sec;
      }
    });
    if (cur.length) jobs.push({ beats: cur, total: used });
    return jobs;
  }

  function compactBrickCatalog() {
    const keys = ["subjects", "scenes", "foreplay", "oral", "sexPoses", "darkActs", "rhythm", "cameras", "expressions", "wardrobe", "arcs"];
    const out = {};
    keys.forEach((k) => {
      out[k] = (D[k] || []).map((it) => it.id + "|" + it.label);
    });
    return out;
  }

  function buildDirectorSystemPrompt(targetSeconds, editMode) {
    return [
      "You are a story director for adult fictional NSFW video prompts (MINIMAX H3).",
      "HARD RULES: all characters adults 21+; fictional only; CNC/dark fantasy OK if adults; never minors/age-ambiguous/celebs/snuff/bestiality.",
      `H3_MAX=${H3_MAX}s per generation. Target total ~${targetSeconds}s. editMode=${editMode}.`,
      "Pick brick ids ONLY from the catalog. Build a narrative arc (setup→escalate→climax→aftermath).",
      "Each timeline beat: {category, actionId, seconds} where category is one of foreplay|oral|sexPoses|darkActs, seconds 3-8 (≤15).",
      "Output STRICT JSON only, no markdown:",
      '{"selected":{"subjects":[],"scenes":[],"foreplay":[],"oral":[],"sexPoses":[],"darkActs":[],"rhythm":[],"cameras":[],"expressions":[],"wardrobe":[],"arcs":[],"dialogueSnippets":[],"bodyTags":[]},"timeline":[{"category":"darkActs","actionId":"cnc_struggle_pin","seconds":5}],"editMode":"continuous","notes":"..."}',
      "Catalog:",
      JSON.stringify(compactBrickCatalog())
    ].join("\n");
  }

  function buildDirectorUserPrompt(chapter, targetSeconds, editMode) {
    return `Chapter/plot:\n${chapter}\n\nTarget total seconds: ${targetSeconds}\nEdit mode: ${editMode}\nReturn JSON arrangement now.`;
  }

  function buildPolishSystemPrompt() {
    return [
      "You polish NSFW video generation prompts for MiniMax H3 / Hailuo.",
      "Keep ALL factual beats, durations, job boundaries, identities, and 21+ / CNC adult fantasy wording if present.",
      "Improve cinematic motion, camera continuity, contact points, wetness, breath/soundscape for H3.",
      "Never invent minors, real celebrities, snuff, or bestiality.",
      "Output plain prompt text only (no markdown fences, no commentary).",
      "If bilingual EN/ZH sections exist, keep both improved."
    ].join("\n");
  }

  async function callChatCompletions({ baseUrl, apiKey, model, system, user, temperature }) {
    const root = (baseUrl || "https://api.openai.com/v1").replace(/\/+$/, "");
    const url = root + "/chat/completions";
    const res = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: "Bearer " + apiKey
      },
      body: JSON.stringify({
        model: model || "gpt-4o-mini",
        temperature: temperature == null ? 0.4 : temperature,
        messages: [
          { role: "system", content: system },
          { role: "user", content: user }
        ]
      })
    });
    if (!res.ok) {
      const t = await res.text().catch(() => "");
      throw new Error("API " + res.status + " " + t.slice(0, 200));
    }
    const data = await res.json();
    const content = data.choices && data.choices[0] && data.choices[0].message && data.choices[0].message.content;
    if (!content) throw new Error("空响应");
    return content;
  }

  function extractJson(text) {
    const raw = String(text || "").trim();
    try {
      return JSON.parse(raw);
    } catch (_) {}
    const m = raw.match(/\{[\s\S]*\}/);
    if (m) {
      try {
        return JSON.parse(m[0]);
      } catch (_) {}
    }
    return null;
  }

  window.NSFWDirector = {
    loadSettings,
    saveSettings,
    arrangeFromStory,
    packBeats,
    buildDirectorSystemPrompt,
    buildDirectorUserPrompt,
    buildPolishSystemPrompt,
    callChatCompletions,
    extractJson,
    compactBrickCatalog,
    H3_MAX
  };
})();
