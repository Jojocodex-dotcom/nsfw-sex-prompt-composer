/* NSFW MiniMax H3 Manju Workbench — Phase A MVP (prompt-only)
 * Extends the brick composer UI; does not replace it.
 * Stages: S0 locks → S1 expand → S2 assets → S4 storyboard → S5 H3 shell
 * S3/S6/S7 media generation intentionally omitted.
 */
(function () {
  const STAGES = [
    { id: "S0", title: "立项锁", short: "S0" },
    { id: "S1", title: "文本扩写", short: "S1" },
    { id: "S2", title: "资材提取", short: "S2" },
    { id: "S4", title: "分镜", short: "S4" },
    { id: "S5", title: "H3 壳", short: "S5" }
  ];

  const wb = {
    uiMode: "bricks", // bricks | workbench
    stage: "S0",
    locks: {
      model: "minimax_h3",
      aspect: "9:16",
      mode: "i2v",
      nsfwTier: "explicit",
      skillMode: "mixed", // drama_only | av_main | mixed
      targetSec: 45,
      editMode: "continuous"
    },
    sourceText: "",
    expandedText: "",
    beats: [],
    assets: { characters: [], scenes: [], props: [], notes: "" },
    shots: [],
    seamNotes: "",
    jobsPreview: "",
    status: "",
    busy: false
  };

  function $(sel, root) {
    return (root || document).querySelector(sel);
  }
  function $all(sel, root) {
    return Array.from((root || document).querySelectorAll(sel));
  }

  function toast(msg) {
    const el = $("#toast");
    if (!el) return;
    el.textContent = msg;
    el.classList.add("show");
    clearTimeout(toast._t);
    toast._t = setTimeout(() => el.classList.remove("show"), 2200);
  }

  function packs() {
    return window.NSFW_SKILL_PACKS || {};
  }

  function dir() {
    return window.NSFWDirector;
  }

  function app() {
    return window.NSFWApp;
  }

  function getApiCfg() {
    const D = dir();
    const cfg = (D && D.loadSettings()) || {};
    return {
      baseUrl: ($("#wbApiBase") && $("#wbApiBase").value.trim()) || cfg.apiBase || "http://127.0.0.1:8080/v1",
      apiKey: ($("#wbApiKey") && $("#wbApiKey").value) || cfg.apiKey || "sk-local",
      model: ($("#wbApiModel") && $("#wbApiModel").value.trim()) || cfg.model || "local-model"
    };
  }

  function persistApiFromWorkbench() {
    const D = dir();
    if (!D) return;
    const cfg = getApiCfg();
    D.saveSettings({ apiBase: cfg.baseUrl, apiKey: cfg.apiKey, model: cfg.model });
    // mirror into legacy director fields if present
    if ($("#dirApiBase")) $("#dirApiBase").value = cfg.baseUrl;
    if ($("#dirApiKey")) $("#dirApiKey").value = cfg.apiKey;
    if ($("#dirModel")) $("#dirModel").value = cfg.model;
  }

  function loadApiIntoWorkbench() {
    const D = dir();
    const cfg = (D && D.loadSettings()) || {};
    if ($("#wbApiBase")) $("#wbApiBase").value = cfg.apiBase || "http://127.0.0.1:8080/v1";
    if ($("#wbApiKey")) $("#wbApiKey").value = cfg.apiKey || "";
    if ($("#wbApiModel")) $("#wbApiModel").value = cfg.model || "local-model";
  }

  async function llm(system, user, temperature) {
    const D = dir();
    if (!D || !D.callChatCompletions) throw new Error("director.js 未加载");
    persistApiFromWorkbench();
    const cfg = getApiCfg();
    return D.callChatCompletions({
      baseUrl: cfg.baseUrl,
      apiKey: cfg.apiKey || "sk-local",
      model: cfg.model,
      system,
      user,
      temperature: temperature == null ? 0.4 : temperature
    });
  }

  function setStatus(msg, isErr) {
    wb.status = msg || "";
    const el = $("#wbStatus");
    if (!el) return;
    el.hidden = !msg;
    el.textContent = msg;
    el.classList.toggle("err", !!isErr);
  }

  function syncLocksFromUI() {
    const aspect = ($("#wbAspect") && $("#wbAspect").value) || "9:16";
    const modeBtn = $(".wb-mode-seg button.active");
    const tier = ($("#wbNsfwTier") && $("#wbNsfwTier").value) || "explicit";
    const skill = ($("#wbSkillMode") && $("#wbSkillMode").value) || "mixed";
    const target = Number(($("#wbTargetSec") && $("#wbTargetSec").value) || 45);
    const editBtn = $(".wb-edit-seg button.active");
    wb.locks.aspect = aspect;
    wb.locks.mode = modeBtn ? modeBtn.getAttribute("data-wb-mode") : "i2v";
    wb.locks.nsfwTier = tier;
    wb.locks.skillMode = skill;
    wb.locks.targetSec = Math.max(5, Math.min(180, target));
    wb.locks.editMode = editBtn ? editBtn.getAttribute("data-wb-edit") : "continuous";
    wb.locks.model = "minimax_h3";
    wb.sourceText = ($("#wbSource") && $("#wbSource").value) || "";
  }

  function applyLocksToBrickUI() {
    // Keep brick composer model/mode in sync when compiling
    const A = app();
    if (!A || !A.getState) return;
    const st = A.getState();
    st.model = "minimax_h3";
    st.mode = wb.locks.mode === "multiref" ? "multiref" : "i2v";
    st.editMode = wb.locks.editMode || "continuous";
    // sync visible segs if present
    $all("[data-model]").forEach((b) => b.classList.toggle("active", b.getAttribute("data-model") === "minimax_h3"));
    $all("[data-mode]").forEach((b) => b.classList.toggle("active", b.getAttribute("data-mode") === st.mode));
    $all("#editModeSeg [data-edit]").forEach((b) =>
      b.classList.toggle("active", b.getAttribute("data-edit") === st.editMode)
    );
  }

  function localExpand() {
    const D = dir();
    const text = wb.sourceText.trim();
    if (!text) throw new Error("请先输入一句话或短剧情");
    const plan = D
      ? D.arrangeFromStory(text, wb.locks.targetSec, wb.locks.editMode)
      : { timeline: [], selected: {}, notes: "无本地编排器" };
    const beats = (plan.timeline || []).map((b, i) => ({
      id: "b" + (i + 1),
      kind: b.category === "darkActs" || wb.locks.skillMode === "av_main" ? "av" : "mixed",
      seconds: b.seconds,
      summary: b.category + "/" + b.actionId,
      category: b.category,
      actionId: b.actionId,
      pose: b.category === "sexPoses" ? b.actionId : null
    }));
    wb.beats = beats;
    wb.expandedText = [
      "【本地扩写 · " + (plan.source || "local") + "】",
      plan.notes || "",
      "",
      "节拍：",
      ...beats.map((b) => `- ${b.id} (${b.seconds}s) ${b.summary}`)
    ].join("\n");
    // stash for apply
    wb._localPlan = plan;
    return plan;
  }

  async function runExpand(useLlm) {
    syncLocksFromUI();
    setStatus(useLlm ? "S1 LLM 扩写中…" : "S1 本地扩写中…");
    if (!useLlm) {
      localExpand();
      renderStageBodies();
      setStatus("S1 本地扩写完成（可再点 LLM 优化）");
      toast("S1 完成");
      return;
    }
    const P = packs();
    const mode = wb.locks.skillMode;
    let system = P.wenxi || "";
    if (mode === "av_main") system = P.jpAvH3 || system;
    else if (mode === "mixed") system = (P.wenxi || "") + "\n\n---\nAlso apply JP-AV beat scheduling when the plot is sexual:\n" + (P.jpAvH3 || "");
    const user = [
      "Aspect: " + wb.locks.aspect,
      "Target seconds: " + wb.locks.targetSec,
      "NSFW tier: " + wb.locks.nsfwTier,
      "Skill mode: " + mode,
      "Plot:",
      wb.sourceText
    ].join("\n");
    try {
      const content = await llm(system, user, 0.45);
      const D = dir();
      const parsed = D && D.extractJson ? D.extractJson(content) : null;
      if (parsed && Array.isArray(parsed.beats) && parsed.beats.length) {
        wb.beats = parsed.beats;
        wb.expandedText = content.trim();
        // map to local plan-ish for later apply
        wb._localPlan = beatsToPlan(parsed);
      } else {
        wb.expandedText = content.trim();
        // fallback local structure
        localExpand();
        wb.expandedText = content.trim() + "\n\n---\n(本地节拍已同步供 S4/S5)\n" + wb.expandedText;
      }
      renderStageBodies();
      setStatus("S1 LLM 扩写完成");
      toast("S1 LLM 完成");
    } catch (e) {
      setStatus("S1 LLM 失败：" + e.message + " — 已回退本地扩写", true);
      localExpand();
      renderStageBodies();
      toast("S1 回退本地");
    }
  }

  function beatsToPlan(parsed) {
    const D = dir();
    const timeline = [];
    (parsed.beats || []).forEach((b) => {
      let category = "sexPoses";
      let actionId = b.pose || b.actionId || "missionary";
      if (b.kind === "wenxi" || b.kind === "drama") {
        category = "foreplay";
        actionId = "kiss_deep";
      }
      if (b.category) category = b.category;
      if (b.actionId) actionId = b.actionId;
      // heuristic
      const sum = String(b.summary || "") + String(b.pose || "");
      if (/口交|oral|bj/i.test(sum)) {
        category = "oral";
        actionId = "bj_kneel";
      } else if (/后入|doggy/i.test(sum)) {
        category = "sexPoses";
        actionId = "doggy";
      } else if (/骑乘|cowgirl/i.test(sum)) {
        category = "sexPoses";
        actionId = "cowgirl";
      } else if (/传教士|missionary/i.test(sum)) {
        category = "sexPoses";
        actionId = "missionary";
      } else if (/强制|CNC|强奸|轮奸|调教/i.test(sum)) {
        category = "darkActs";
        actionId = actionId || "cnc_rough_thrust";
      }
      timeline.push({
        category,
        actionId,
        seconds: Math.max(3, Math.min(15, Number(b.seconds) || 5))
      });
    });
    const selected = {
      subjects: ["mf"],
      scenes: ["bedroom_night"],
      foreplay: [],
      oral: [],
      sexPoses: [],
      darkActs: [],
      rhythm: ["building"],
      cameras: ["medium", "push_in"],
      expressions: ["breath_soft"],
      wardrobe: ["lingerie"],
      arcs: ["arc_full"],
      dialogueSnippets: [],
      bodyTags: []
    };
    timeline.forEach((t) => {
      if (selected[t.category] && !selected[t.category].includes(t.actionId)) selected[t.category].push(t.actionId);
    });
    const jobs = D && D.packBeats ? D.packBeats(timeline) : [];
    return {
      selected,
      timeline,
      editMode: wb.locks.editMode,
      notes: parsed.notes || "from workbench S1",
      jobs,
      source: "workbench_llm"
    };
  }

  function localAssets() {
    const text = (wb.expandedText || wb.sourceText || "").toLowerCase();
    const plan = wb._localPlan;
    const chars = [
      {
        id: "CHR-A",
        role: "女1 / Image 1",
        prompt: "adult woman 21+, consistent face/hair/body, photoreal",
        wardrobe_lock: (plan && plan.selected && plan.selected.wardrobe && plan.selected.wardrobe[0]) || "lingerie or nude lock as plot"
      },
      {
        id: "CHR-B",
        role: "男1 / 出画外声优先",
        prompt: "adult man 21+, body/hands visible as needed; face often out of frame for POV",
        wardrobe_lock: "as plot"
      }
    ];
    let sceneId = "bedroom_night";
    let scenePrompt = "night bedroom, warm practical lamps, rumpled sheets";
    if (/hotel|酒店|love.?hotel|爱情旅馆/.test(text)) {
      sceneId = "hotel_suite";
      scenePrompt = "Japanese love-hotel suite, mirrored headboard optional, warm lamps";
    } else if (/office|办公/.test(text)) {
      sceneId = "office_coerce";
      scenePrompt = "office after hours, desk, blinds";
    } else if (/warehouse|仓库/.test(text)) {
      sceneId = "warehouse_dark";
      scenePrompt = "dark warehouse, industrial practicals";
    } else if (/dungeon|地牢|调教/.test(text)) {
      sceneId = "dungeon_playroom";
      scenePrompt = "private adult playroom, controlled lighting";
    }
    const scenes = [{ id: "SCN-1", prompt: scenePrompt + " · lock space layout", brick: sceneId }];
    const props = [];
    if (/绳|rope|项圈|collar/.test(text)) props.push({ id: "PRP-1", prompt: "collar/rope props, mature play, non-gore" });
    if (/玩具|toy|跳蛋/.test(text)) props.push({ id: "PRP-2", prompt: "adult toy prop as plot" });
    wb.assets = { characters: chars, scenes, props, notes: "本地启发式提取；LLM 可细化出图提示词" };
  }

  async function runAssets(useLlm) {
    syncLocksFromUI();
    if (!wb.beats.length && !wb.expandedText) {
      localExpand();
    }
    setStatus(useLlm ? "S2 LLM 资材提取中…" : "S2 本地资材提取中…");
    if (!useLlm) {
      localAssets();
      renderStageBodies();
      setStatus("S2 本地资材完成");
      toast("S2 完成");
      return;
    }
    const P = packs();
    const user = ["Expanded / plot:", wb.expandedText || wb.sourceText, "", "Beats JSON:", JSON.stringify(wb.beats || [])].join(
      "\n"
    );
    try {
      const content = await llm(P.assetExtract || "", user, 0.3);
      const D = dir();
      const parsed = D && D.extractJson ? D.extractJson(content) : null;
      if (parsed && (parsed.characters || parsed.scenes)) {
        wb.assets = {
          characters: parsed.characters || [],
          scenes: parsed.scenes || [],
          props: parsed.props || [],
          notes: parsed.notes || ""
        };
      } else {
        localAssets();
        wb.assets.notes = (wb.assets.notes || "") + "\nLLM raw:\n" + content.slice(0, 1500);
      }
      renderStageBodies();
      setStatus("S2 LLM 资材完成");
      toast("S2 完成");
    } catch (e) {
      localAssets();
      renderStageBodies();
      setStatus("S2 LLM 失败，已本地回退：" + e.message, true);
      toast("S2 回退本地");
    }
  }

  function localShots() {
    const plan = wb._localPlan || (dir() && dir().arrangeFromStory(wb.sourceText || "intimate adults", wb.locks.targetSec, wb.locks.editMode));
    const tl = (plan && plan.timeline) || [];
    let t = 0;
    const shots = tl.map((b, i) => {
      const t0 = t;
      const t1 = t + (b.seconds || 5);
      t = t1;
      const job_hint = Math.floor(t0 / 15) + 1;
      return {
        id: "sh" + (i + 1),
        job_hint,
        t0,
        t1,
        shot_size: i === 0 ? "中近景" : i % 2 ? "近景" : "中景",
        angle: "斜角平视",
        camera: i % 3 === 0 ? "static locked-off" : i % 3 === 1 ? "camera slowly pushes in" : "subtle handheld movement",
        action: b.category + " · " + b.actionId + " · readable contact; continuous with previous",
        end_state: "same couple, pose after " + b.actionId + ", contact held",
        assets_ref: ["CHR-A", "SCN-1"],
        av_pose: b.category === "sexPoses" || b.category === "oral" || b.category === "darkActs" ? b.actionId : null,
        impact_feedback: /thrust|rough|spank|拍|抽/i.test(b.actionId) ? "flesh slap / wet contact audible" : "",
        receiver_reaction: "breath hitch, grip sheets"
      };
    });
    // insert pose-change note between different sex poses
    wb.shots = shots;
    wb.seamNotes = "JOB 之间写清末态；下一段首镜换景别或视角。工作流黑话不进 H3 正文。";
  }

  async function runStoryboard(useLlm) {
    syncLocksFromUI();
    if (!wb.beats.length) localExpand();
    setStatus(useLlm ? "S4 LLM 分镜中…" : "S4 本地分镜中…");
    if (!useLlm) {
      localShots();
      renderStageBodies();
      setStatus("S4 本地分镜完成");
      toast("S4 完成");
      return;
    }
    const P = packs();
    const system =
      (P.cinematic || "") +
      "\n\n---\nIf sexual content, also obey JP-AV continuity:\n" +
      (P.jpAvH3 || "");
    const user = [
      "Locks: " + JSON.stringify(wb.locks),
      "Assets: " + JSON.stringify(wb.assets),
      "Beats: " + JSON.stringify(wb.beats),
      "Expanded:\n" + (wb.expandedText || wb.sourceText)
    ].join("\n");
    try {
      const content = await llm(system, user, 0.35);
      const D = dir();
      const parsed = D && D.extractJson ? D.extractJson(content) : null;
      if (parsed && Array.isArray(parsed.shots) && parsed.shots.length) {
        wb.shots = parsed.shots;
        wb.seamNotes = parsed.seam_notes || "";
      } else {
        localShots();
        wb.seamNotes += "\nLLM raw (partial):\n" + String(content).slice(0, 1200);
      }
      renderStageBodies();
      setStatus("S4 LLM 分镜完成");
      toast("S4 完成");
    } catch (e) {
      localShots();
      renderStageBodies();
      setStatus("S4 LLM 失败，已本地回退：" + e.message, true);
      toast("S4 回退本地");
    }
  }

  function runCompile() {
    syncLocksFromUI();
    applyLocksToBrickUI();
    if (!wb._localPlan) {
      if (wb.beats.length) wb._localPlan = beatsToPlan({ beats: wb.beats, notes: "from beats" });
      else localExpand();
    }
    const A = app();
    const plan = wb._localPlan;
    if (A && A.applyDirectorPlan && plan) {
      A.applyDirectorPlan(plan);
    }
    // Build H3 shells via existing app
    let text = "";
    if (A && A.buildH3JobPrompts) {
      const jobs = A.buildH3JobPrompts();
      text = jobs
        .map((j) => {
          const body = j.shell || j.text || "";
          return "=== JOB " + j.index + " (" + j.seconds + "s) ===\n" + (j.note ? j.note + "\n" : "") + body;
        })
        .join("\n\n");
      if (A.refreshPreview) A.refreshPreview();
    } else {
      text = "NSFWApp 未就绪，无法组装 H3 壳";
    }
    wb.jobsPreview = text;
    const out = $("#wbJobsOut");
    if (out) out.value = text;
    // also push to main preview if workbench wants
    const main = $("#outPrompt");
    if (main && text) main.value = text;
    setStatus("S5 已组装 MiniMax H3 官方壳（≤15s JOBs）。Phase A 只出提示词，未调用 ComfyUI。");
    toast("S5 H3 壳完成");
    renderStageBodies();
  }

  async function runPipeline() {
    if (wb.busy) return;
    wb.busy = true;
    try {
      syncLocksFromUI();
      setStage("S1");
      await runExpand(false);
      setStage("S2");
      await runAssets(false);
      setStage("S4");
      await runStoryboard(false);
      setStage("S5");
      runCompile();
      setStatus("管线 S0→S5（本地）跑完。可对各阶段点「LLM」 refinement。");
    } finally {
      wb.busy = false;
    }
  }

  function setStage(id) {
    wb.stage = id;
    $all(".wb-stage").forEach((el) => {
      const on = el.getAttribute("data-stage") === id;
      el.classList.toggle("active", on);
      el.setAttribute("aria-current", on ? "step" : "false");
    });
    $all(".wb-pane").forEach((el) => {
      el.hidden = el.getAttribute("data-pane") !== id;
    });
  }

  function setUiMode(mode) {
    wb.uiMode = mode;
    const wbRoot = $("#workbenchRoot");
    const brickBlocks = $all("[data-brick-ui]");
    $all(".ui-mode-seg button").forEach((b) => b.classList.toggle("active", b.getAttribute("data-ui-mode") === mode));
    if (wbRoot) wbRoot.hidden = mode !== "workbench";
    brickBlocks.forEach((el) => {
      // keep bricks usable under workbench too (for S4 tweak), but collapse director duplicate optional
      if (mode === "workbench") {
        if (el.hasAttribute("data-hide-in-wb")) el.hidden = true;
        else el.hidden = false;
      } else {
        el.hidden = false;
      }
    });
    const heroSub = $("#stats");
    // title tweak
    const h1 = $("header.hero h1");
    if (h1) {
      h1.textContent = mode === "workbench" ? "NSFW H3 漫剧工作台" : "性爱视频提示词组合器";
    }
  }

  function renderAssetsTable() {
    const host = $("#wbAssetsHost");
    if (!host) return;
    const a = wb.assets || {};
    const rows = [];
    (a.characters || []).forEach((c) =>
      rows.push(`<tr><td>CHR</td><td>${esc(c.id)}</td><td>${esc(c.role || "")}</td><td><code>${esc(c.prompt || "")}</code><div class="muted">${esc(c.wardrobe_lock || "")}</div></td></tr>`)
    );
    (a.scenes || []).forEach((c) =>
      rows.push(`<tr><td>SCN</td><td>${esc(c.id)}</td><td></td><td><code>${esc(c.prompt || "")}</code></td></tr>`)
    );
    (a.props || []).forEach((c) =>
      rows.push(`<tr><td>PRP</td><td>${esc(c.id)}</td><td></td><td><code>${esc(c.prompt || "")}</code></td></tr>`)
    );
    host.innerHTML = rows.length
      ? `<table class="wb-table"><thead><tr><th>类型</th><th>ID</th><th>角色</th><th>出图/锁提示词</th></tr></thead><tbody>${rows.join("")}</tbody></table>`
      : '<p class="hint">尚未提取资材</p>';
    if (a.notes) {
      host.innerHTML += `<p class="hint">${esc(a.notes)}</p>`;
    }
  }

  function renderShots() {
    const host = $("#wbShotsHost");
    if (!host) return;
    if (!wb.shots.length) {
      host.innerHTML = '<p class="hint">尚未分镜</p>';
      return;
    }
    host.innerHTML = wb.shots
      .map(
        (s) => `<article class="wb-shot-card">
      <header><strong>${esc(s.id)}</strong> · JOB ${esc(s.job_hint)} · ${esc(s.t0)}–${esc(s.t1)}s</header>
      <div>${esc(s.shot_size)} · ${esc(s.angle)} · <code>${esc(s.camera)}</code></div>
      <div>${esc(s.action)}</div>
      <div class="muted">末态：${esc(s.end_state || "")}</div>
      ${s.av_pose ? `<div class="muted">姿势：${esc(s.av_pose)}</div>` : ""}
      ${s.impact_feedback ? `<div class="muted">反馈：${esc(s.impact_feedback)} / ${esc(s.receiver_reaction || "")}</div>` : ""}
    </article>`
      )
      .join("");
    const sn = $("#wbSeamNotes");
    if (sn) sn.textContent = wb.seamNotes || "";
  }

  function renderStageBodies() {
    if ($("#wbExpandOut")) $("#wbExpandOut").value = wb.expandedText || "";
    if ($("#wbBeatsOut")) $("#wbBeatsOut").value = JSON.stringify(wb.beats || [], null, 2);
    renderAssetsTable();
    renderShots();
    if ($("#wbJobsOut")) $("#wbJobsOut").value = wb.jobsPreview || "";
  }

  function esc(s) {
    return String(s == null ? "" : s)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;");
  }

  function exportProject() {
    syncLocksFromUI();
    const blob = {
      version: "1.6.0",
      project: { locks: { ...wb.locks } },
      source_text: wb.sourceText,
      expanded: wb.expandedText,
      beats: wb.beats,
      assets: wb.assets,
      shots: wb.shots,
      seam_notes: wb.seamNotes,
      jobs_preview: wb.jobsPreview
    };
    const a = document.createElement("a");
    a.href = URL.createObjectURL(new Blob([JSON.stringify(blob, null, 2)], { type: "application/json" }));
    a.download = "h3-manju-workbench-project.json";
    a.click();
    URL.revokeObjectURL(a.href);
    toast("已导出项目 JSON");
  }

  function bind() {
    $all(".ui-mode-seg button").forEach((btn) => {
      btn.addEventListener("click", () => setUiMode(btn.getAttribute("data-ui-mode")));
    });
    $all(".wb-stage").forEach((btn) => {
      btn.addEventListener("click", () => setStage(btn.getAttribute("data-stage")));
    });
    $all(".wb-mode-seg button").forEach((btn) => {
      btn.addEventListener("click", () => {
        $all(".wb-mode-seg button").forEach((b) => b.classList.remove("active"));
        btn.classList.add("active");
      });
    });
    $all(".wb-edit-seg button").forEach((btn) => {
      btn.addEventListener("click", () => {
        $all(".wb-edit-seg button").forEach((b) => b.classList.remove("active"));
        btn.classList.add("active");
      });
    });

    const map = [
      ["#btnWbExpandLocal", () => runExpand(false)],
      ["#btnWbExpandLlm", () => runExpand(true)],
      ["#btnWbAssetsLocal", () => runAssets(false)],
      ["#btnWbAssetsLlm", () => runAssets(true)],
      ["#btnWbShotsLocal", () => runStoryboard(false)],
      ["#btnWbShotsLlm", () => runStoryboard(true)],
      ["#btnWbCompile", () => runCompile()],
      ["#btnWbRunAll", () => runPipeline()],
      ["#btnWbExport", () => exportProject()],
      ["#btnWbCopyJobs", () => {
        const t = ($("#wbJobsOut") && $("#wbJobsOut").value) || "";
        if (!t) return toast("无 H3 壳可复制");
        navigator.clipboard.writeText(t).then(() => toast("已复制 H3 JOBs")).catch(() => toast("复制失败"));
      }],
      ["#btnWbSaveApi", () => {
        persistApiFromWorkbench();
        toast("llama.cpp / API 设置已保存");
      }]
    ];
    map.forEach(([sel, fn]) => {
      const el = $(sel);
      if (el) el.addEventListener("click", () => Promise.resolve(fn()).catch((e) => setStatus(String(e.message || e), true)));
    });

    const apiToggle = $("#wbApiToggle");
    if (apiToggle) {
      apiToggle.addEventListener("click", () => {
        const body = $("#wbApiBody");
        if (!body) return;
        body.hidden = !body.hidden;
        apiToggle.textContent = body.hidden ? "▸ llama.cpp / API 设置" : "▾ llama.cpp / API 设置";
      });
    }
  }

  function init() {
    loadApiIntoWorkbench();
    bind();
    setUiMode("bricks");
    setStage("S0");
    const ver = $("#wbVersion");
    if (ver) ver.textContent = "v1.6.0 Phase A";
    // expose
    window.NSFWWorkbench = {
      getState: () => wb,
      setUiMode,
      setStage,
      runExpand,
      runAssets,
      runStoryboard,
      runCompile,
      runPipeline,
      STAGES
    };
  }

  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", init);
  else init();
})();
