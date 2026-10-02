/* ComfyUI HTTP adapter for NSFW H3 Manju Workbench — Phase B
 * Browser → ComfyUI: POST /prompt, poll /history/{id}, GET /view
 * Requires ComfyUI --enable-cors-header OR tools/comfy_cors_proxy.py
 */
(function () {
  const LS_KEY = "nsfw_comfy_settings_v1";
  const DEFAULTS = {
    baseUrl: "http://127.0.0.1:8188",
    authHeader: "",
    clientId: "",
    wfAsset: "comfy-workflows/wf_asset_t2i.json",
    wfStill: "comfy-workflows/wf_storyboard_still.json",
    wfI2v: "comfy-workflows/wf_generic_i2v.json",
    ckpt: "sd_xl_base_1.0.safetensors",
    width: 768,
    height: 1344,
    steps: 20,
    cfg: 5,
    negative: "lowres, blurry, watermark, text, logo, underage, child, loli, shota",
    pollMs: 1500,
    timeoutMs: 600000
  };

  const state = {
    jobs: [], // { id, kind, label, status, promptId, error, outputs, previewUrl, createdAt, payload }
    busy: false,
    _listeners: []
  };

  function uid(prefix) {
    return (prefix || "job") + "_" + Date.now().toString(36) + "_" + Math.random().toString(36).slice(2, 7);
  }

  function loadSettings() {
    try {
      return Object.assign({}, DEFAULTS, JSON.parse(localStorage.getItem(LS_KEY) || "{}") || {});
    } catch (_) {
      return Object.assign({}, DEFAULTS);
    }
  }

  function saveSettings(partial) {
    const cur = loadSettings();
    Object.assign(cur, partial || {});
    localStorage.setItem(LS_KEY, JSON.stringify(cur));
    return cur;
  }

  function ensureClientId(cfg) {
    if (cfg.clientId) return cfg.clientId;
    const id = "nsfw_wb_" + Math.random().toString(36).slice(2, 10);
    cfg.clientId = id;
    saveSettings({ clientId: id });
    return id;
  }

  function base(cfg) {
    return String((cfg || loadSettings()).baseUrl || DEFAULTS.baseUrl).replace(/\/+$/, "");
  }

  function headers(cfg) {
    const h = { "Content-Type": "application/json" };
    const auth = (cfg || loadSettings()).authHeader;
    if (auth && String(auth).trim()) {
      // allow raw "Authorization: Bearer x" or just the token value
      const a = String(auth).trim();
      if (/^authorization\s*:/i.test(a)) {
        const parts = a.split(":");
        h[parts[0].trim()] = parts.slice(1).join(":").trim();
      } else if (/^bearer\s+/i.test(a) || /^basic\s+/i.test(a)) {
        h.Authorization = a;
      } else {
        h.Authorization = a;
      }
    }
    return h;
  }

  async function fetchJson(path, opts) {
    const cfg = loadSettings();
    const url = base(cfg) + path;
    const res = await fetch(url, Object.assign({ headers: headers(cfg) }, opts || {}));
    if (!res.ok) {
      const t = await res.text().catch(() => "");
      throw new Error("ComfyUI " + res.status + " " + path + (t ? ": " + t.slice(0, 240) : ""));
    }
    const ct = res.headers.get("content-type") || "";
    if (ct.includes("application/json")) return res.json();
    return res.text();
  }

  async function ping() {
    const cfg = loadSettings();
    try {
      const sys = await fetchJson("/system_stats");
      return { ok: true, baseUrl: base(cfg), system: sys };
    } catch (e) {
      return { ok: false, baseUrl: base(cfg), error: String(e.message || e) };
    }
  }

  async function loadWorkflow(pathOrUrl) {
    const p = pathOrUrl || loadSettings().wfAsset;
    const url = /^https?:\/\//i.test(p) ? p : p;
    const res = await fetch(url, { cache: "no-store" });
    if (!res.ok) throw new Error("无法加载工作流模板: " + p + " (" + res.status + ")");
    return res.json();
  }

  /** Deep-clone workflow and replace string placeholders; strip _meta before return. */
  function injectPlaceholders(wf, map) {
    const raw = JSON.parse(JSON.stringify(wf || {}));
    delete raw._meta;
    delete raw.meta;
    const keys = Object.keys(map || {});
    const numKeys = { seed: 1, steps: 1, cfg: 1, width: 1, height: 1, denoise: 1 };

    function coerce(key, val) {
      if (val == null) return val;
      if (numKeys[key] && typeof val === "string" && /^-?\d+(\.\d+)?$/.test(val)) {
        return key === "cfg" || key === "denoise" ? parseFloat(val) : parseInt(val, 10);
      }
      return val;
    }

    function replaceInString(s) {
      if (typeof s !== "string") return s;
      let out = s;
      let matchedExact = null;
      keys.forEach((k) => {
        if (s === k) matchedExact = map[k];
        if (out.indexOf(k) >= 0) out = out.split(k).join(String(map[k]));
      });
      // if entire string was a single placeholder, keep original type (number)
      if (matchedExact != null && s === keys.find((k) => k === s)) return matchedExact;
      return out;
    }

    function walk(node, parentKey) {
      if (Array.isArray(node)) {
        for (let i = 0; i < node.length; i++) {
          if (typeof node[i] === "string") node[i] = replaceInString(node[i]);
          else if (node[i] && typeof node[i] === "object") walk(node[i], parentKey);
        }
        return;
      }
      if (!node || typeof node !== "object") return;
      Object.keys(node).forEach((key) => {
        const v = node[key];
        if (typeof v === "string") {
          let nv = replaceInString(v);
          // if value was exactly a placeholder mapped to number, coerce by field name
          if (keys.indexOf(v) >= 0) nv = coerce(key, map[v]);
          else nv = coerce(key, nv);
          node[key] = nv;
        } else if (v && typeof v === "object") {
          walk(v, key);
        }
      });
    }
    walk(raw, null);
    return raw;
  }

  function aspectToSize(aspect, longSide) {
    const L = longSide || 1344;
    const a = String(aspect || "9:16");
    const m = a.match(/^(\d+)\s*:\s*(\d+)$/);
    if (!m) return { width: 768, height: L };
    const wr = Number(m[1]);
    const hr = Number(m[2]);
    if (wr >= hr) {
      return { width: L, height: Math.max(64, Math.round((L * hr) / wr / 8) * 8) };
    }
    return { width: Math.max(64, Math.round((L * wr) / hr / 8) * 8), height: L };
  }

  function viewUrl(filename, subfolder, type) {
    const cfg = loadSettings();
    const q = new URLSearchParams({
      filename: filename,
      subfolder: subfolder || "",
      type: type || "output"
    });
    return base(cfg) + "/view?" + q.toString();
  }

  function extractOutputs(historyEntry) {
    const outs = [];
    const outputs = (historyEntry && historyEntry.outputs) || {};
    Object.keys(outputs).forEach((nid) => {
      const o = outputs[nid] || {};
      (o.images || []).forEach((im) => {
        outs.push({
          kind: "image",
          filename: im.filename,
          subfolder: im.subfolder || "",
          type: im.type || "output",
          url: viewUrl(im.filename, im.subfolder, im.type)
        });
      });
      (o.gifs || []).forEach((im) => {
        outs.push({
          kind: "gif",
          filename: im.filename,
          subfolder: im.subfolder || "",
          type: im.type || "output",
          url: viewUrl(im.filename, im.subfolder, im.type)
        });
      });
      // some video nodes put files under `videos` or `files`
      (o.videos || o.files || []).forEach((im) => {
        const name = im.filename || im;
        if (typeof name !== "string") return;
        outs.push({
          kind: "video",
          filename: name,
          subfolder: im.subfolder || "",
          type: im.type || "output",
          url: viewUrl(name, im.subfolder, im.type)
        });
      });
    });
    return outs;
  }

  async function queuePrompt(workflowPrompt) {
    const cfg = loadSettings();
    const client_id = ensureClientId(cfg);
    const body = { prompt: workflowPrompt, client_id };
    const data = await fetchJson("/prompt", { method: "POST", body: JSON.stringify(body) });
    if (data && data.error) {
      throw new Error(typeof data.error === "string" ? data.error : JSON.stringify(data.error));
    }
    if (data && data.node_errors && Object.keys(data.node_errors).length) {
      throw new Error("ComfyUI node_errors: " + JSON.stringify(data.node_errors).slice(0, 400));
    }
    return data.prompt_id || data.promptId;
  }

  async function pollHistory(promptId, opts) {
    const cfg = loadSettings();
    const pollMs = (opts && opts.pollMs) || cfg.pollMs || DEFAULTS.pollMs;
    const timeoutMs = (opts && opts.timeoutMs) || cfg.timeoutMs || DEFAULTS.timeoutMs;
    const t0 = Date.now();
    while (Date.now() - t0 < timeoutMs) {
      const hist = await fetchJson("/history/" + encodeURIComponent(promptId));
      const entry = hist && (hist[promptId] || hist);
      if (entry && entry.outputs) {
        return entry;
      }
      // also accept status completed formats
      if (entry && entry.status && entry.status.completed) {
        return entry;
      }
      await new Promise((r) => setTimeout(r, pollMs));
    }
    throw new Error("ComfyUI 超时等待 prompt_id=" + promptId);
  }

  function notify() {
    state._listeners.forEach((fn) => {
      try {
        fn(state.jobs.slice());
      } catch (_) {}
    });
  }

  function onQueueChange(fn) {
    state._listeners.push(fn);
    return () => {
      state._listeners = state._listeners.filter((x) => x !== fn);
    };
  }

  function upsertJob(job) {
    const i = state.jobs.findIndex((j) => j.id === job.id);
    if (i >= 0) state.jobs[i] = job;
    else state.jobs.unshift(job);
    notify();
    return job;
  }

  async function runJob(job, buildFn) {
    job.status = "running";
    job.error = "";
    upsertJob(job);
    try {
      const { workflow, map, meta } = await buildFn();
      const prompt = injectPlaceholders(workflow, map);
      job.meta = meta || {};
      const promptId = await queuePrompt(prompt);
      job.promptId = promptId;
      job.status = "queued";
      upsertJob(job);
      const entry = await pollHistory(promptId);
      const outputs = extractOutputs(entry);
      job.outputs = outputs;
      job.previewUrl = (outputs[0] && outputs[0].url) || "";
      job.status = outputs.length ? "succeeded" : "failed";
      if (!outputs.length) job.error = "无输出文件（检查 SaveImage / 视频保存节点）";
      upsertJob(job);
      return job;
    } catch (e) {
      job.status = "failed";
      job.error = String(e.message || e);
      upsertJob(job);
      throw e;
    }
  }

  async function enqueueAssetT2I(item) {
    // item: { label, positive, negative?, width?, height?, seed?, assetId? }
    const cfg = loadSettings();
    const job = {
      id: uid("img"),
      kind: "asset_t2i",
      label: item.label || item.assetId || "asset",
      status: "queued",
      promptId: "",
      error: "",
      outputs: [],
      previewUrl: "",
      createdAt: Date.now(),
      assetId: item.assetId || "",
      positive: item.positive || ""
    };
    upsertJob(job);
    return runJob(job, async () => {
      const wf = await loadWorkflow(cfg.wfAsset);
      const seed = item.seed != null ? item.seed : Math.floor(Math.random() * 1e9);
      const map = {
        __POSITIVE__: item.positive || "",
        __NEGATIVE__: item.negative != null ? item.negative : cfg.negative,
        __SEED__: seed,
        __WIDTH__: item.width || cfg.width,
        __HEIGHT__: item.height || cfg.height,
        __STEPS__: item.steps != null ? item.steps : cfg.steps,
        __CFG__: item.cfg != null ? item.cfg : cfg.cfg,
        __FILENAME_PREFIX__: "nsfw_asset_" + (item.assetId || "x"),
        __CKPT__: item.ckpt || cfg.ckpt || "sd_xl_base_1.0.safetensors"
      };
      return { workflow: wf, map, meta: { seed } };
    });
  }

  async function enqueueStill(item) {
    const cfg = loadSettings();
    const job = {
      id: uid("still"),
      kind: "storyboard_still",
      label: item.label || item.shotId || "still",
      status: "queued",
      promptId: "",
      error: "",
      outputs: [],
      previewUrl: "",
      createdAt: Date.now(),
      shotId: item.shotId || "",
      positive: item.positive || ""
    };
    upsertJob(job);
    return runJob(job, async () => {
      const wf = await loadWorkflow(cfg.wfStill);
      const seed = item.seed != null ? item.seed : Math.floor(Math.random() * 1e9);
      const map = {
        __POSITIVE__: item.positive || "",
        __NEGATIVE__: item.negative != null ? item.negative : cfg.negative,
        __SEED__: seed,
        __WIDTH__: item.width || cfg.width,
        __HEIGHT__: item.height || cfg.height,
        __STEPS__: item.steps != null ? item.steps : cfg.steps,
        __CFG__: item.cfg != null ? item.cfg : cfg.cfg,
        __FILENAME_PREFIX__: "nsfw_still_" + (item.shotId || "x"),
        __CKPT__: item.ckpt || cfg.ckpt || "sd_xl_base_1.0.safetensors"
      };
      return { workflow: wf, map, meta: { seed } };
    });
  }

  async function enqueueI2V(item) {
    // item: { label, positive, negative?, refImageName?, width?, height?, seed?, jobIndex? }
    const cfg = loadSettings();
    const job = {
      id: uid("vid"),
      kind: "i2v",
      label: item.label || ("JOB " + (item.jobIndex || "?")),
      status: "queued",
      promptId: "",
      error: "",
      outputs: [],
      previewUrl: "",
      createdAt: Date.now(),
      jobIndex: item.jobIndex,
      positive: item.positive || "",
      note: item.note || ""
    };
    upsertJob(job);
    return runJob(job, async () => {
      const wf = await loadWorkflow(cfg.wfI2v);
      const seed = item.seed != null ? item.seed : Math.floor(Math.random() * 1e9);
      const map = {
        __POSITIVE__: item.positive || "",
        __NEGATIVE__: item.negative != null ? item.negative : cfg.negative,
        __SEED__: seed,
        __WIDTH__: item.width || cfg.width,
        __HEIGHT__: item.height || cfg.height,
        __STEPS__: item.steps != null ? item.steps : cfg.steps,
        __CFG__: item.cfg != null ? item.cfg : cfg.cfg,
        __REF_IMAGE__: item.refImageName || "example.png",
        __FILENAME_PREFIX__: "nsfw_i2v_job" + (item.jobIndex || "x"),
        __CKPT__: item.ckpt || cfg.ckpt || "sd_xl_base_1.0.safetensors"
      };
      return { workflow: wf, map, meta: { seed, refImageName: map.__REF_IMAGE__ } };
    });
  }

  async function retryJob(jobId) {
    const old = state.jobs.find((j) => j.id === jobId);
    if (!old) throw new Error("任务不存在");
    if (old.kind === "asset_t2i") {
      return enqueueAssetT2I({
        label: old.label,
        positive: old.positive,
        assetId: old.assetId
      });
    }
    if (old.kind === "storyboard_still") {
      return enqueueStill({
        label: old.label,
        positive: old.positive,
        shotId: old.shotId
      });
    }
    if (old.kind === "i2v") {
      return enqueueI2V({
        label: old.label,
        positive: old.positive,
        jobIndex: old.jobIndex,
        note: old.note
      });
    }
    throw new Error("未知任务类型: " + old.kind);
  }

  function clearFinished() {
    state.jobs = state.jobs.filter((j) => j.status === "queued" || j.status === "running");
    notify();
  }

  function getJobs() {
    return state.jobs.slice();
  }

  window.NSFWComfy = {
    DEFAULTS,
    loadSettings,
    saveSettings,
    ping,
    loadWorkflow,
    injectPlaceholders,
    aspectToSize,
    viewUrl,
    queuePrompt,
    pollHistory,
    enqueueAssetT2I,
    enqueueStill,
    enqueueI2V,
    retryJob,
    clearFinished,
    getJobs,
    onQueueChange
  };
})();
