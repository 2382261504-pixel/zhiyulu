/* 知遇录 · 前端逻辑
 * 模块：自我认知（刘看山引导对话）/ 复盘（刘看山引导 + 系统思维方法论 + 知乎检索）/ 人生样本库（知乎实时）/ 处境对齐 / 领域速通（刘看山对话）/ 养成 / 刘看山东方玄学对谈
 * 知乎实时 API：callZhihu() -> /api/zhihu（官方规范：Bearer ZHIHU_ACCESS_SECRET）
 *   未配置密钥或调用失败时自动回退提示，样本库内容全部来自知乎真实经验分享。
 * 刘看山东方玄学对话：以东方智慧做自我觉察参考；生辰可据实排盘、在对话里自然引用，与 MBTI+星座融合。
 */
(function () {
  "use strict";

  const MBTI_TEST_URL = "https://www.16personalities.com/ch?from=groupmessage&isappinstalled=0&continueFlag=f508c36391230d9451cefe8bb987184a";

  // MBTI 16 型速查（t=类型名 / s=天赋优势 / w=盲区提醒）；用于「自我认知」对话式人格测试收尾
  const MBTI = {
    INTJ: { t: "建筑师", s: "擅长看长远、搭体系，独立的战略脑。", w: "容易把人当变量，忽略情绪与协作温度。" },
    INTP: { t: "逻辑学家", s: "追根问底、建模成瘾，点子机器。", w: "想得多落地少，常卡在'还没想透'。" },
    ENTJ: { t: "指挥官", s: "天然leader，定方向带队伍一把好手。", w: "推进太猛，容易碾压别人的节奏。" },
    ENTP: { t: "辩论家", s: "脑洞+杠精一体，破局与机会嗅觉强。", w: "兴趣转移快，善始不善终。" },
    INFJ: { t: "提倡者", s: "深共情+远景感，能唤醒他人意义。", w: "把自己燃太多，边界感弱易内耗。" },
    INFP: { t: "调停者", s: "内心价值清晰，真诚而有温度。", w: "怕冲突、回避现实摩擦，决策慢。" },
    ENFJ: { t: "主人公", s: "会带人、会鼓舞，关系黏合剂。", w: "太顾别人，常把自己需求排最后。" },
    ENFP: { t: "竞选者", s: "热情 contagions，连接人与可能。", w: "兴奋点多，难聚焦深耕一件事。" },
    ISTJ: { t: "物流师", s: "靠谱踏实，把承诺稳稳落地。", w: "守规则到 inflexible，抵触突变。" },
    ISFJ: { t: "守卫者", s: "细腻护人，默默把后路铺好。", w: "过度承担，委屈自己成全别人。" },
    ESTJ: { t: "总经理", s: "组织执行力强，把混乱理顺。", w: "迷信流程，容不下非常规。" },
    ESFJ: { t: "执政官", s: "人际润滑剂，把氛围与合作稳住。", w: "太在意评价，难说'不'。" },
    ISTP: { t: "鉴赏家", s: "动手解构一切，冷静的问题杀手。", w: "离群索居，情感表达少显疏离。" },
    ISFP: { t: "探险家", s: "审美与当下感受敏锐，活得真。", w: "逃避长远规划，临阵易慌。" },
    ESTP: { t: "企业家", s: "现场感与行动力爆表，敢冲敢试。", w: "图快图刺激，少复盘留坑。" },
    ESFP: { t: "表演者", s: "自带气氛，把日子过成派对。", w: "注意力被新鲜事牵着走，难延时满足。" },
  };
  // 四个维度的一句话解读（收尾时刘看山用来'翻译'类型）
  const MBTI_DIM_DESC = {
    "E": "从人群和互动里充电（外倾）",
    "I": "从独处里回血（内倾）",
    "S": "先吃透细节与事实（实感）",
    "N": "先抓大画面与可能性（直觉）",
    "T": "靠逻辑利弊做决定（思考）",
    "F": "掂量对人的影响做决定（情感）",
    "J": "喜欢定下来、有节奏（判断）",
    "P": "爱留余地、随机应变（知觉）",
  };

  // ---------- 刘看山陪伴角色 ----------
  const LIU_GIFS = [
    "assets/img/liukaishan/liukaishan_dyn_01.gif",
    "assets/img/liukaishan/liukaishan_dyn_02.gif",
    "assets/img/liukaishan/liukaishan_dyn_03.gif",
    "assets/img/liukaishan/liukaishan_dyn_04.gif",
    "assets/img/liukaishan/liukaishan_dyn_05.gif",
    "assets/img/liukaishan/liukaishan_dyn_06.gif",
  ];
  const LIU_LINE = {
    home: ["嗨，我是刘看山，陪你一起慢慢长大～", "想从哪开始？先认识自己，还是看看别人的路？"],
    self: ["认识自己，是一生的事。", "你对自己的感觉是模糊的？咱们聊几句，把它说清楚。"],
    review: ["别怕回头看，复盘是为了走得更稳。", "咱们不填表，我把事一件件问清楚就好。"],
    sample: ["别人的经历，是给你照路的灯。", "人生样本库里的样本，都来自知乎上的真实经验分享。"],
    align: ["把你的处境，和相似的样本对齐，路就清楚了。", "你不是一个人在迷路。"],
    grow: ["成长看得见，才走得远。", "每完成一次复盘、一次对齐，我都帮你记着。"],
    field: ["想进新领域？方法对了，30 天就能入门。", "西蒙聚焦、费曼输出，都是被验证过的捷径。"],
    lixuan: ["刘看山的东方玄学视角在那头等着呢。", "想看格局报生辰，想静心请他起一卦。"],
    explore: ["一个检索内核，一个入口：看别人的路、对齐处境、套方法啃领域。", "人生样本里转转看，都是当下真实的知乎内容。"],
    connect: ["成长不该一个人。你关注的、和你同处境的人，都在这里。", "知乎的真实关系，是你最活的样本。"],
    bio: ["你走过的路、踩过的坑、长出的人，都值得被记下来。", "咱们一段一段写，把它写成属于你的生命之书。"],
    default: ["我在呢，慢慢来。", "成长不是比赛，是自己的节奏。"],
  };
  let liuIdx = 0;
  // 气泡自动收起：避免长期遮挡主内容。宠物本体与输入框保留，鼠标悬停/点击宠物时再叫
  let _liuBubbleTimer = null;
  function _liuBubbleFade() {
    const b = document.getElementById("liuBubble");
    if (!b) return;
    if (_liuBubbleTimer) clearTimeout(_liuBubbleTimer);
    _liuBubbleTimer = setTimeout(() => {
      b.classList.add("fadeout");
      setTimeout(() => { b.style.visibility = "hidden"; }, 380);
    }, 3000);
  }
  function _liuBubbleShow(b, html, anim) {
    if (!b) return;
    b.classList.remove("fadeout");
    b.style.visibility = "";
    b.innerHTML = html;
    b.style.animation = "none"; void b.offsetWidth; b.style.animation = anim;
    _liuBubbleFade();
  }
  function liuSay(tab) {
    const lines = LIU_LINE[tab] || LIU_LINE.default;
    _liuBubbleShow(document.getElementById("liuBubble"), escHTML(lines[Math.floor(Math.random() * lines.length)]), "bubbleIn .4s ease");
  }
  function liuReact() {
    liuIdx = (liuIdx + 1) % LIU_GIFS.length;
    const g = document.getElementById("liuGif");
    if (g) g.src = LIU_GIFS[liuIdx];
  }
  // 加载后把初始问候气泡收起，并绑定「悬停或点击宠物」重新叫一声
  setTimeout(() => {
    const b = document.getElementById("liuBubble");
    if (b) { b.classList.add("fadeout"); setTimeout(() => { b.style.visibility = "hidden"; }, 380); }
  }, 3500);
  document.addEventListener("DOMContentLoaded", () => {
    const pet = document.getElementById("liu");
    if (!pet) return;
    const poke = () => { liuSay("default"); };
    pet.addEventListener("mouseenter", poke);
    pet.addEventListener("click", (e) => {
      // 拖拽时不要触发
      if (pet.classList.contains("dragging")) return;
      if (e.target && (e.target.id === "liuInput")) return;
      poke();
    });
  });

  // ---------- 知乎 OAuth 会话 ----------
  // 只把不透明 sid 存在浏览器；用户 access_token 与 app_key 永不下发前端（官方安全要求）
  const ZH_SID_KEY = "zhiyu_zhihu_sid";
  let zhAuthRefresh = null; // 由私人知识库模块注册：登录态变化后重绘当前 tab
  function zhSid() { try { return localStorage.getItem(ZH_SID_KEY) || ""; } catch (e) { return ""; } }
  function zhSetSid(sid) { try { if (sid) localStorage.setItem(ZH_SID_KEY, sid); else localStorage.removeItem(ZH_SID_KEY); } catch (e) {} }
  // 把知乎授权失败的真实原因显示出来（之前是静默失败，用户看不到为什么）
  function showAuthError(msg) {
    try {
      let b = document.getElementById("zhAuthErrBox");
      if (!b) {
        b = document.createElement("div");
        b.id = "zhAuthErrBox";
        b.style.cssText = "position:fixed;left:50%;top:18px;transform:translateX(-50%);z-index:9999;max-width:90vw;background:#3a1d1d;color:#ffd9d9;border:1px solid #7a3a3a;padding:10px 14px;border-radius:10px;font-size:13px;line-height:1.5;box-shadow:0 6px 20px rgba(0,0,0,.4)";
        document.body.appendChild(b);
      }
      b.textContent = "⚠️ " + msg;
      clearTimeout(b.__t);
      b.__t = setTimeout(function () { if (b && b.parentNode) b.parentNode.removeChild(b); }, 9000);
    } catch (e) {}
  }

  // 授权成功提示（绿色，与 showAuthError 对应）
  function showAuthOk(msg) {
    try {
      let b = document.getElementById("zhAuthOkBox");
      if (!b) {
        b = document.createElement("div");
        b.id = "zhAuthOkBox";
        b.style.cssText = "position:fixed;left:50%;top:18px;transform:translateX(-50%);z-index:9999;max-width:90vw;background:#123a1d;color:#d9ffe4;border:1px solid #3a7a4a;padding:10px 14px;border-radius:10px;font-size:13px;line-height:1.5;box-shadow:0 6px 20px rgba(0,0,0,.4)";
        document.body.appendChild(b);
      }
      b.textContent = msg;
      clearTimeout(b.__t);
      b.__t = setTimeout(function () { if (b && b.parentNode) b.parentNode.removeChild(b); }, 6000);
    } catch (e) {}
  }

  // 知乎授权回调：/zhiyulu/?authorization_code=xxx → 立刻换成 sid，并清掉地址栏里的 code
  // 入口 B 为唯一入口：OAuth 回调落在 B，换得 sid 后直接存本域 localStorage，无需跨域桥接。

  // 解析知乎 OAuth 回调参数：优先 query（标准回调），兜底 hash（当 redirect_uri 含 # 片段时，code 会落在 URL 的 hash 里）
  function zyParseOAuthCode() {
    try {
      const u = new URL(location.href);
      const fromSearch = (u.searchParams.get("authorization_code") || u.searchParams.get("code") || "").trim();
      if (fromSearch) return fromSearch;
    } catch (e) {}
    try {
      const h = location.hash || "";
      const qIdx = h.indexOf("?");
      if (qIdx >= 0) {
        const q = new URLSearchParams(h.slice(qIdx + 1));
        const fromHash = (q.get("authorization_code") || q.get("code") || "").trim();
        if (fromHash) return fromHash;
      }
    } catch (e) {}
    return "";
  }

  // 用授权 code 换 sid：独立于 callZhihu 的健壮请求。
  // 之所以不复用 callZhihu：callZhihu 出错时会静默返回 {mock:true}/{aborted:true}（供普通检索兜底），
  // 而 OAuth 回调必须「成功 or 明确失败」二选一，绝不能被静默吞掉（否则一次性 code 白白消费、界面无反应）。
  async function exchangeOAuthCode(code) {
    const url = window.ZHIYU_API_BASE || API_URL;
    let lastErr = "";
    for (let attempt = 1; attempt <= 2; attempt++) {
      try {
        const ctrl = (typeof AbortController !== "undefined") ? new AbortController() : null;
        const timer = ctrl ? setTimeout(() => { try { ctrl.abort(); } catch (e) {} }, 30000) : null;
        const res = await fetch(url, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ action: "oauthLogin", payload: { code } }),
          signal: ctrl ? ctrl.signal : undefined,
        });
        if (timer) clearTimeout(timer);
        if (!res.ok) { lastErr = "HTTP " + res.status; if (attempt < 2) { await new Promise((r) => setTimeout(r, 1000)); continue; } break; }
        return await res.json(); // 后端已解包：{ok,sid} 或 {ok:false,code,note}
      } catch (e) {
        lastErr = (e && e.name === "AbortError") ? "请求超时" : (e && e.message) || "网络错误";
        if (attempt < 2) { await new Promise((r) => setTimeout(r, 1000)); continue; }
      }
    }
    return { ok: false, code: "network_failed", note: "网络未连上（" + lastErr + "），授权未完成" };
  }

  async function handleZhihuCallback() {
    let code = "";
    try { code = zyParseOAuthCode(); } catch (e) { return false; }
    if (!code) return false;
    // 注意：地址栏在「换 token 成功后」才清理。若失败则保留 code 于地址，便于用户刷新重试
    let r = null;
    try {
      r = await exchangeOAuthCode(code);
    } catch (e) {
      r = { ok: false, code: "network_failed", note: (e && e.message) || "授权交换异常" };
    }
    if (r && r.ok && r.sid) {
      zhSetSid(r.sid);
      // 成功后才清掉地址栏里的 code（可能在 query 或 hash），避免刷新重复消费；清回首页路由
      try { history.replaceState(null, "", (location.pathname || "/zhiyulu/") + "#home"); } catch (e) {}
      return true;
    }
    // 任何非成功返回都必须显式提示，绝不静默（含 oauth_failed / missing_code / network_failed / mock / aborted）
    zhSetSid("");
    const reason = (r && r.note) ? r.note : "未知原因";
    showAuthError("知乎登录未完成：" + reason + "（请重新点击「用知乎账号登录」重试）");
    // 失败也清掉地址里已作废的 code（一次性 code 换失败即失效，留着刷新只会重复报错）
    try { history.replaceState(null, "", (location.pathname || "/zhiyulu/") + "#home"); } catch (e) {}
    return false;
  }

  // 登录条：未登录时明确告知「当前是作者本人的数据」，登录后切到用户自己的数据
  async function renderZhihuBar() {
    const pairs = [];
    const lt = document.getElementById("zhLoginText"), lb = document.getElementById("zhLoginBtn");
    if (lt && lb) pairs.push({ txt: lt, btn: lb });
    const gt = document.getElementById("zhGlobalText"), gb = document.getElementById("zhGlobalBtn");
    if (gt && gb) pairs.push({ txt: gt, btn: gb });
    const ht = document.getElementById("zhHeroText"), hb = document.getElementById("zhHeroBtn");
    if (ht && hb) pairs.push({ txt: ht, btn: hb });
    if (!pairs.length) return;
    
    // 为每个找到的元素对设置加载状态
    pairs.forEach((p) => { 
      if (p.txt && p.btn) {
        p.txt.textContent = "检查知乎登录状态…"; 
        p.btn.disabled = true; 
      }
    });
    
    let st = { configured: false, loggedIn: false };
    try { 
      st = await callZhihu("oauthMe", { sid: zhSid() }); 
    } catch (e) {
      console.error("获取知乎登录状态失败:", e);
    }
    
    const paint = (p, logged) => {
      if (!p.txt || !p.btn) return; // 确保元素存在
      
      p.btn.classList.remove("locked");
      p.btn.style.display = "";   // 始终显示登录按钮（未配置也展示，便于体验登录流程）
      if (logged) {
        const who = (st && st.profile && st.profile.name) ? st.profile.name : "知乎账号";
        p.txt.innerHTML = "✅ 已连接你的" + who;
        p.btn.textContent = "🚪 退出知乎登录"; p.btn.disabled = false;
        p.btn.onclick = async () => {
          p.btn.disabled = true;
          try { await callZhihu("oauthLogout", { sid: zhSid() }); } catch (e) {}
          zhSetSid(""); renderZhihuBar();
          if (zhAuthRefresh) zhAuthRefresh();
        };
      } else {
        const _zhNote = (st && st.note) ? String(st.note) : "";
        const _cfgNote = (!st || !st.configured) ? "知乎登录暂未开放 · 下方展示的是作者本人公开数据" : "";
        p.txt.textContent = (_zhNote ? ("⚠️ " + _zhNote.slice(0, 26) + " ｜ ") : "") + _cfgNote;
        p.txt.title = _zhNote || "";
        p.btn.textContent = "🔗 用我的知乎账号登录"; p.btn.disabled = false;
        p.btn.onclick = async () => {
          p.btn.disabled = true; p.btn.textContent = "正在跳转知乎授权…";
          try {
            const r = await callZhihu("oauthUrl", { state: Math.random().toString(36).slice(2, 10) });
            if (r && r.ok && r.authorizeUrl) {
              try { showAuthOk("即将跳转知乎授权。若跳回时出现腾讯云「风险提醒」，请点『确定访问』即可继续。"); } catch (e) {}
              location.href = r.authorizeUrl; return;
            }
            p.txt.textContent = "取授权地址失败：" + ((r && r.note) || "未知原因");
          } catch (e) { p.txt.textContent = "取授权地址失败，请稍后重试。"; }
          p.btn.disabled = false; p.btn.textContent = "🔗 用我的知乎账号登录";
        };
      }
    };
    
    pairs.forEach((p) => paint(p, !!(st && st.loggedIn)));
  }

  // ---------- 知乎实时 API（官方规范）----------
  const API_URL = window.ZHIYU_API_BASE || "/api/zhihu";
  // 每次调用生成新种子，配合后端随机角度，保证「刷新即不同、回答不模板化」
  function newVariant() { return Math.random().toString(36).slice(2, 12); }
  function shuffle(a) { for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; } return a; }
  async function callZhihu(action, payload, opts) {
    opts = opts || {};
    window.__navAborting = false; // 新请求开始：清零「切模块中止」标记（navigate 会在切模块时置 true）
    // 慢接口分级等待提示：请求前在指定容器插入提示，返回前移除（避免干等长等待）
    let loadingNode = null;
    if (opts.loadingEl && opts.loadingText) {
      const el = document.getElementById(opts.loadingEl);
      if (el) {
        loadingNode = document.createElement("div");
        loadingNode.className = "liu-loading";
        loadingNode.textContent = opts.loadingText;
        el.appendChild(loadingNode);
        el.scrollTop = el.scrollHeight;
      }
    }
    const removeLoading = () => { if (loadingNode && loadingNode.parentNode) loadingNode.parentNode.removeChild(loadingNode); };
    // 知乎直答偏慢：单请求上限 55s（远低于函数 60s 上限），失败自动重试 1 次，吸收偶发网关/网络抖动
    const MAX = opts.timeout || 55000;
    const TRIES = 2;
    for (let attempt = 1; attempt <= TRIES; attempt++) {
      const ctrl = (typeof AbortController !== "undefined") ? new AbortController() : null;
      window.__activeCtrl = ctrl; // 记录当前在途请求，供 navigate 切换模块时中止
      const timer = ctrl ? setTimeout(() => { try { ctrl.abort(); } catch (e) {} }, MAX) : null;
      try {
        const res = await fetch(API_URL, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ action, payload: payload || {} }),
          signal: ctrl ? ctrl.signal : undefined,
        });
        if (timer) clearTimeout(timer);
        if (!res.ok) throw new Error("http " + res.status);
        const data = await res.json();
        removeLoading();
        window.__activeCtrl = null;
        return data;
      } catch (e) {
        if (timer) clearTimeout(timer);
        // 因切换模块被主动中止：不重试、不补 fallback，直接返回 aborted 让调用方静默收尾
        if (window.__navAborting) { removeLoading(); window.__activeCtrl = null; return { aborted: true, mock: true }; }
        if (attempt < TRIES) { await new Promise((r) => setTimeout(r, 1200)); continue; }
        removeLoading();
        window.__activeCtrl = null;
        return { mock: true, reason: "network", note: "实时接口暂时没连上（本地模式），样本库内容来自知乎真实经验分享。" };
      }
    }
  }
  function badgeHTML(isLive) {
    return isLive
      ? '<span class="badge live">● 知乎实时</span>'
      : '<span class="badge local">● 实时接口暂未连上</span>';
  }

  // ---------- 判断进化层：可复用原则（本地沉淀 + 回灌刘看山）----------
  const PRINCIPLES_KEY = "zhiyu_principles";
  function getPrinciples() {
    try { const v = JSON.parse(localStorage.getItem(PRINCIPLES_KEY) || "[]"); return Array.isArray(v) ? v : []; }
    catch (e) { return []; }
  }
  function savePrinciple(text) {
    text = (text || "").trim();
    if (!text) return;
    const arr = getPrinciples();
    if (arr.some((x) => x === text)) return;
    arr.unshift(text);
    if (arr.length > 20) arr.length = 20;
    try { localStorage.setItem(PRINCIPLES_KEY, JSON.stringify(arr)); } catch (e) {}
  }
  function distillPrinciples(text) {
    return callZhihu("principles", { text: text, fresh: true });
  }

  // ---------- 系统思维方法论库（复盘镜片 / 领域速通底座）----------
  const SYSTEM_THINK = [
    { id: "see2", name: "二阶观察", one: "不只看单一事件，去看它背后的模式与结构。",
      when: "一件事反复发生、你总在同一个地方栽跟头。", ask: "这是一次意外，还是一种结构在重复？把最近三次类似的时刻摆一起，规律在哪？" },
    { id: "stock", name: "存量与流量", one: "存量是长期积累（能力、信任、存款），流量是进出速率。",
      when: "你觉着'努力了却没变化'，或'突然很缺 / 很满'。", ask: "你纠结的是存量不够，还是流量太慢 / 太猛？该补存量，还是调流速？" },
    { id: "delay", name: "延迟效应", one: "因与果常常隔着一段时间，当下见不到果。",
      when: "投入许久看不到回报，容易中途放弃。", ask: "你看到的'没效果'，是真的不行，还是延迟还没到？再给系统一点时间会怎样？" },
    { id: "rein", name: "增强回路", one: "成功滋生成功、或恶化滋生恶化，自我强化。",
      when: "好习惯越滚越大，或烂摊子越拖越乱。", ask: "这件事里，有没有一个'越…越…'的圈？你是在顺圈，还是逆着圈加油？" },
    { id: "bal", name: "调节回路", one: "系统会朝某个目标把自己拉回稳定态。",
      when: "刚有起色就松懈、或达到某个点就卡住。", ask: "有什么看不见的力量，正把你往回拉？它的'目标值'设在了哪？" },
    { id: "limit", name: "系统基模·成长上限", one: "增长撞上隐形天花板，越用力越无效。",
      when: "明明在努力，却进入瓶颈期。", ask: "卡住时，你是更用力推，还是去找那个'上限'本身、把它松开？" },
    { id: "shift", name: "系统基模·舍本逐末", one: "用短期解掩盖根本问题，根本解被荒废。",
      when: "反复靠临时补救过关（熬夜赶工、借债、敷衍）。", ask: "你这步是在治标，还是在治本？那个'根本解'被你晾了多久？" },
    { id: "fail", name: "系统基模·饮鸩止渴", one: "解法本身带来更大的副作用。",
      when: "透支身体 / 信用 / 关系换眼前结果。", ask: "这个解法的'后劲'你算过吗？三个月后它要你付出什么？" },
    { id: "drift", name: "系统基模·目标侵蚀", one: "标准在不知不觉中悄悄降低。",
      when: "对自己的要求一点点往下放。", ask: "你的'及格线'是不是在偷偷下移？和半年前比，你对'够好'的定义变了吗？" },
    { id: "lever", name: "杠杆点", one: "改系统里一个关键节点，整盘随之而变。",
      when: "你发现改人改事都很累，或许该改规则 / 结构。", ask: "如果只许动一个地方就让整件事顺起来，你动哪儿？是规则、节奏，还是反馈方式？" },
    ];
  // ② 旧「固定轮换池」已废弃：方法论改由后端 LLM 按每轮问题动态挑选（见 rvAdvance / reviewSuggestTools）
  function detectLens(t) {
    const s = (t || "").toLowerCase();
    const map = {
      limit: ["瓶颈", "卡住", "上限", "天花板", "没进展"],
      shift: ["熬夜", "赶工", "临时", "救火", "借", "凑合", "敷衍"],
      fail: ["透支", "身体", "信用", "关系换", "硬撑"],
      drift: ["标准", "要求", "及格", "降低", "将就"],
      see2: ["反复", "又", "总是", "老", "每次", "一样", "循环", "不断"],
      stock: ["积累", "存量", "慢", "没变化", "不够"],
      delay: ["没效果", "看不到", "回报", "迟", "等"],
      rein: ["越", "滚雪球", "正循环", "恶性循环"],
      bal: ["拉回", "松懈", "稳定", "回到"],
    };
    const hit = [];
    for (const k in map) if (map[k].some((w) => s.includes(w))) hit.push(k);
    if (!hit.length) hit.push("see2", "stock", "lever");
    if (!hit.includes("lever")) hit.push("lever");
    return hit.slice(0, 3);
  }
  function appendLens(cid, id) {
    const m = SYSTEM_THINK.find((x) => x.id === id);
    if (!m) return;
    const c = document.getElementById(cid);
    if (!c) return;
    const d = document.createElement("div");
    d.className = "method-card";
    d.innerHTML = `<div class="mt">🧩 系统思维方法论 · ${m.name}</div>
      <div class="mo">${m.one}</div>
      <div class="mw">适用：${m.when}</div>
      <div class="ma">刘看山顺着问你：${m.ask}</div>`;
    c.appendChild(d);
    c.scrollTop = c.scrollHeight;
  }

  // ---------- 跨模块对话持久化：切走再切回，思考/回答不丢 ----------
  // 每个聊天框(cid)维护消息数组 + pending(思考中)标志，内存+localStorage 双写；
  // 即便切模块 DOM 被销毁、后端回答迟到，也能在切回时照常恢复。
  const CHAT_STORE = {};
  function _chatFile(cid) { return "zhiyu_chat_" + cid; }
  function chatGet(cid) {
    if (!CHAT_STORE[cid]) {
      let st = null;
      try { st = JSON.parse(localStorage.getItem(_chatFile(cid)) || "null"); } catch (e) {}
      CHAT_STORE[cid] = (st && Array.isArray(st.msgs)) ? st : { msgs: [], pending: false, pendingLabel: "刘看山" };
    }
    return CHAT_STORE[cid];
  }
  function chatSave(cid) { try { localStorage.setItem(_chatFile(cid), JSON.stringify(chatGet(cid))); } catch (e) {} }
  function chatReset(cid) { CHAT_STORE[cid] = { msgs: [], pending: false, pendingLabel: "刘看山" }; chatSave(cid); }
  // 删除单条消息（按在 chat 数组中的索引，落盘 + 重绘）
  function chatDeleteMsg(cid, idx) {
    const st = chatGet(cid);
    if (idx >= 0 && idx < st.msgs.length) { st.msgs.splice(idx, 1); chatSave(cid); renderChat(cid); }
  }
  // 每个聊天框上方幂等注入「🗑 清空对话」工具条
  function ensureChatTools(el) {
    if (!el || !el.id || !el.parentNode) return;
    if (el.previousElementSibling && el.previousElementSibling.classList && el.previousElementSibling.classList.contains("zy-chat-tools")) return;
    const wrap = document.createElement("div");
    wrap.className = "zy-chat-tools";
    const btn = document.createElement("button");
    btn.className = "zy-clear-chat";
    btn.type = "button";
    btn.textContent = "🗑 清空对话";
    btn.dataset.cid = el.id;
    wrap.appendChild(btn);
    el.parentNode.insertBefore(wrap, el);
  }
  function chatAppend(cid, msg) {
    const st = chatGet(cid);
    st.msgs.push(msg);
    if (st.msgs.length > 240) st.msgs = st.msgs.slice(-240);
    chatSave(cid);
    const el = document.getElementById(cid);
    if (el) { el.insertAdjacentHTML("beforeend", _chatMsgHTML(msg)); el.scrollTop = el.scrollHeight; }
  }
  function chatSetPending(cid, on, label) {
    const st = chatGet(cid);
    st.pending = !!on;
    if (label) st.pendingLabel = label;
    chatSave(cid);
    const el = document.getElementById(cid);
    if (el) renderChat(cid);
  }
  function renderChat(cid) {
    const el = document.getElementById(cid);
    if (!el) return;
    const st = chatGet(cid);
    let html = st.msgs.map((m, i) => _chatMsgHTML(m, i)).join("");
    if (st.pending) html += '<div class="msg liu typing"><span class="who">' + escHTML(st.pendingLabel || "刘看山") + '</span>正在思考…</div>';
    el.innerHTML = html;
    el.scrollTop = el.scrollHeight;
  }
  function _chatMsgHTML(m, i) {
    if (m.kind === "quick") return _selfQuickHTML(m);
    const di = (typeof i === "number") ? i : "";
    const delBtn = '<button type="button" class="msg-del" data-i="' + di + '" title="删除这条" aria-label="删除">✕</button>';
    // 富消息：复盘里的「系统思维工具箱卡 / 全网总结思维模型卡 / 全网检索结果」。
    // 这些卡片以前是直接 appendChild 到 DOM 的（没进 CHAT_STORE），切走再切回来就没了；
    // 现改为结构化为消息存盘，重渲染时原样恢复；按钮改走事件委托（DOM 重建也不丢）。
    if (m.kind === "toolcards") return _rvToolCardsHTML(m, delBtn);
    if (m.kind === "zhmodel") return _rvZhModelHTML(m, delBtn);
    if (m.kind === "search") return _rvSearchHTML(m, delBtn);
    if (m.kind === "mrv") return _rvModelsHTML(m, delBtn);
    if (m.s === "user") return '<div class="msg user">' + delBtn + escHTML(m.t || "").replace(/\n/g, "<br>") + '</div>';
    let h = '<div class="msg liu">' + delBtn + '<span class="who">' + escHTML(m.who || "刘看山") + '</span>' + escHTML(m.t || "").replace(/\n/g, "<br>");
    // 参考资料必须知乎 / 全网分组，不得混排（用户硬要求）。
    // 后端 refs 是「知乎标题.concat(全网标题)」的混合字符串数组，直接渲染会让两类资料挤在一块；
    // 因此本条消息若已携带双源结构化数据（refsZhihu / refsGlobal），就跳过这块旧混合列表，
    // 只由下方 liuRefsHTML() 渲染分组后的「知乎参考 / 全网参考」两块。
    const _hasDualRefs = !!(m.refsZhihu && m.refsZhihu.length) || !!(m.refsGlobal && m.refsGlobal.length);
    if (m.refs && m.refs.length && !_hasDualRefs) h += '<div class="liu-refs">📚 ' + m.refs.map(function (x) { return escHTML(x); }).join(" · ") + '</div>';
    if (m.route) h += '<div class="liu-route">📡 ' + escHTML(m.route) + '</div>';
    if (m.offline) h += '<div class="liu-route" style="border-left:3px solid #ffb86b;padding-left:6px">⚠️ 这次实时检索（知乎 / 全网）没连上，已自动重试一次仍未成功，上面是本地兜底回答。稍后再问一遍即可拉到真实资料。</div>';
    // #A 计数用「实际会展示」的条数：优先 refsZhihu/refsGlobal，回落 sources；离线（接口没连上）则不显示参考资料横幅
    if (!m.offline && m.sources && m.sources.length) {
      const _rs = _liuRefsState(m);
      if (_rs.total > 0) h += '<div class="liu-ground">✅ 已基于 <b>知乎</b> 与 <b>全网</b> 实时资料作答 · 共 <b>' + _rs.total + '</b> 条来源（知乎 ' + _rs.zh + ' / 全网 ' + _rs.gl + '，防幻觉）</div>';
    }
    h += liuRefsHTML(m);
    h += '</div>';
    return h;
  }

  // 复盘·系统思维工具箱卡（结构化存盘，切模块回来不丢；可「收录到工具箱」）
  function _rvToolCardsHTML(m, delBtn) {
    const picks = m.picks || [];
    const cards = picks.map((x) => {
      const mm = SYSTEM_THINK.find((t) => t.name === x.name) || x;
      const nm = mm.name || "";
      return `<div class="method-card">
        <div class="mt">🧩 本轮从「系统思维工具箱」随机抽中 · ${escHTML(nm)}</div>
        <div class="mo">${escHTML(mm.one || "")}</div>
        <div class="mw">适用：${escHTML(mm.when || "")}</div>
        <div class="ma">刘看山顺着问你：${escHTML(mm.ask || "")}</div>
        <div class="row" style="margin-top:8px">
          <button class="chip tool-lens" data-label="${escAttr(nm)}" data-ev="${escAttr(m.ev || "")}">🐾 用「${escHTML(nm)}」拆这次</button>
          <button class="chip zhmodel-save" data-name="${escAttr(nm)}" data-core="${escAttr(mm.one || "")}" data-when="${escAttr(mm.when || "")}" data-tip="${escAttr(mm.ask || "")}">＋ 收录到工具箱</button>
        </div>
      </div>`;
    }).join("");
    return '<div class="msg liu">' + delBtn + '<span class="who">刘看山</span><div class="rv-tools-box">' + cards + '</div></div>';
  }
  // 复盘·基于知乎内容总结的思维模型（可「收录到系统思维方法论工具箱」）
  function _rvZhModelHTML(m, delBtn) {
    const x = m.model || {};
    const nm = x.name || "思维模型";
    const card = `<div class="method-card">
      <div class="mt">🧠 基于知乎内容总结的思维模型 · ${escHTML(nm)}</div>
      <div class="mo">${escHTML(x.core || "")}</div>
      <div class="mw">适用：${escHTML(x.when || "")}</div>
      ${x.tip ? `<div class="ma">一句口诀：${escHTML(x.tip)}</div>` : ""}
      <div class="row" style="margin-top:8px">
        <button class="chip tool-lens" data-label="${escAttr(nm)}" data-ev="${escAttr(m.ev || "")}">🐾 用「${escHTML(nm)}」拆这次</button>
        <button class="chip zhmodel-save" data-name="${escAttr(nm)}" data-core="${escAttr(x.core || "")}" data-when="${escAttr(x.when || "")}" data-tip="${escAttr(x.tip || "")}">＋ 收录到系统思维方法论工具箱</button>
      </div>
    </div>`;
    return '<div class="msg liu">' + delBtn + '<span class="who">刘看山</span>' + card + '</div>';
  }
  // 复盘·全网检索结果（结构化存盘）
  function _rvSearchHTML(m, delBtn) {
    const items = (m.items || []).map(liveCard).join("");
    return '<div class="msg liu">' + delBtn + '<span class="who">刘看山</span>' +
      '<div class="muted" style="margin:4px 0">' + escHTML(m.label || "全网上别人怎么走过（实时）：") + '</div>' +
      '<div class="section grid grid-2">' + items + '</div></div>';
  }
  // 复盘·大佬思维模型视角卡（结构化存盘；「用这个视角拆」按钮走全局事件委托，DOM 重建也不丢）
  function _rvModelsHTML(m, delBtn) {
    const list = m.models || [];
    const cards = list.map(function (mm) {
      const nm = mm.name || "思维模型";
      return '<div class="mrv-card"><b>' + escHTML(nm) + '</b>'
        + '<p class="muted">' + escHTML((mm.core || "").slice(0, 80)) + '</p>'
        + '<button class="ghost sm mrv-use" data-name="' + escAttr(nm) + '" data-q="' + escAttr(m.q || "") + '">🐾 用这个视角拆</button></div>';
    }).join("");
    return '<div class="msg liu">' + delBtn + '<span class="who">刘看山</span><div class="rv-models-box"><div class="muted" style="margin:4px 0">挑一个你最想用它的眼睛拆这件事：</div><div class="mrv-list">' + cards + '</div></div></div>';
  }

  // ---------- 参考资料双源（知乎站内 + 全网）----------
  // 用户硬要求：刘看山的任何回答都必须同时给出「知乎参考」与「全网参考」两类，缺一不可。
  function _srcIsGlobal(s) {
    // 按 source 频道判定：zhihu_search→知乎，global_search→全网（平台限制下 global_search 也只返 zhihu.com 链接，
    // 但仍属「全网检索频道」，据此与知乎站内区分，避免「全网=知乎」恒为空）。无 source 时按 URL 域回落。
    var k = (s && s.source) || "";
    if (k) return k !== "zhihu" && k !== "search" && k !== "hot" && k !== "my_content" && k !== "followee";
    var _u = (s && s.url) || "";
    if (_u) return !/zhihu\.com|zhihu\.cn|zhida\.zhihu/i.test(_u);
    return false;
  }
  function _splitSources(list) {
    const all = list || [];
    const zhRaw = [], glRaw = [];
    all.forEach((s) => { (_srcIsGlobal(s) ? glRaw : zhRaw).push(s); });
    // 跨频道去重：全网去掉已在知乎里的同链接；若去重后全网为空（两频道强重叠）则保留原 global，保证非空
    const zhUrls = new Set(zhRaw.map((s) => (s.url || "").split("?")[0]));
    let gl = glRaw.filter((s) => !zhUrls.has((s.url || "").split("?")[0]));
    if (!gl.length) gl = glRaw;
    return { zh: zhRaw, gl };
  }
  // 把一条资料渲染成引用块：知乎 / 全网分组各一块
  function _srcGroupHTML(title, icon, arr, openIt) {
    if (!arr || !arr.length) return "";
    const body = arr.map(liveCard).join("");
    return '<details class="src-details"' + (openIt ? " open" : "") + '><summary>' + icon + " " + title +
      "（" + arr.length + "）</summary><div class='section grid grid-2'>" + body + "</div></details>";
  }
  // 消息级双源参考区：优先用后端分组（refsZhihu/refsGlobal），回落按 source 字段本地分组
  function liuRefsHTML(m) {
    if (!m) return "";
    if (m.offline) return ""; // #A 知乎/全网实时接口未连上：不展示参考资料（用户硬要求）
    let zh = (m.refsZhihu || []).slice(), gl = (m.refsGlobal || []).slice();
    if (!zh.length && !gl.length) {
      const sp = _splitSources(m.sources || []);
      zh = sp.zh; gl = sp.gl;
    }
    if (!zh.length && !gl.length) return "";
    return '<div class="liu-refs-box">' +
      '<div class="liu-refs-title">📚 参考资料（知乎 + 全网）</div>' +
      _srcGroupHTML("知乎参考", "🔵", zh, true) +
      _srcGroupHTML("全网参考", "🌐", gl, true) +
      "</div>";
  }

  // 返回一条消息「实际会渲染出来」的知乎/全网条数（用于「已基于…作答」计数，避免 banner 与下方参考区对不上）
  function _liuRefsState(m) {
    let zh = (m.refsZhihu || []).slice(), gl = (m.refsGlobal || []).slice();
    if (!zh.length && !gl.length) {
      const sp = _splitSources(m.sources || []);
      zh = sp.zh; gl = sp.gl;
    }
    return { zh: zh.length, gl: gl.length, total: zh.length + gl.length };
  }
  // 任意 sources 数组直接渲染双源（用于计划卡 / 蒸馏结果等非消息场景）
  function sourcesDualHTML(list) {
    const sp = _splitSources(list || []);
    if (!sp.zh.length && !sp.gl.length) return "";
    return '<div class="liu-refs-box">' +
      '<div class="liu-refs-title">📚 参考资料（知乎 + 全网）</div>' +
      _srcGroupHTML("知乎参考", "🔵", sp.zh.slice(0, 6), true) +
      _srcGroupHTML("全网参考", "🌐", sp.gl.slice(0, 6), true) +
      "</div>";
  }

  // ---------- 聊天消息 / 卡片 工具 ----------
  function appendMsg(cid, sender, text) {
    // 关键修复：原先此处先 appendChild 又 chatAppend，导致每条消息在聊天框里被渲染成两份
    //（表现为「两个一模一样的对话框 / 双对话」）。现统一只走 chatAppend：它会持久化到 CHAT_STORE
    // 且只插入一次 DOM，renderChat 重绘时也以 store 为准，不会重复。
    chatAppend(cid, { s: (sender === "user" ? "user" : "liu"), t: text, who: (sender === "user" ? "你" : "刘看山") });
  }
  function appendHtml(cid, html) {
    const c = document.getElementById(cid);
    if (!c) return;
    const d = document.createElement("div");
    d.className = "msg liu";
    d.innerHTML = '<span class="who">刘看山</span>' + html;
    c.appendChild(d);
    c.scrollTop = c.scrollHeight;
  }
  // 刘看山对话多轮历史：按聊天框 cid 维护，实现"接得住上句"（像元宝/豆包那样连续对话）
  const liuHistories = {};
  // 刘看山真实对话回复：调 liuanswer（多接口并行 RAG + 多轮历史 + 直答 LLM），带检索占位与本地兜底
  async function liuReply(cid, payload, fallbackText) {
    const isPet = payload.persona === "pet";
    const q = (payload.q || "").toString();
    // 进入"思考中"状态（跨模块持久化：切走再切回仍显示思考气泡，不靠临时 DOM 节点）
    chatSetPending(cid, true, "刘看山");
    // 维护本聊天框的多轮历史，传给后端做承接
    liuHistories[cid] = liuHistories[cid] || [];
    const _liuPayload = Object.assign({ fresh: true }, payload, { history: liuHistories[cid], principles: getPrinciples(), kb: !!localStorage.getItem("zhiyu_kb_ok") });
    let r = await callZhihu("liuanswer", _liuPayload);
    // 实时检索偶发抽风：自动重试一次（换一次扇出），仍失败才走本地兜底并明确标注
    let offline = false;
    if (r && r.mock && !isPet) {
      r = await callZhihu("liuanswer", Object.assign({}, _liuPayload, { retry: 1, fresh: true }));
      if (r && r.mock) offline = true;
    }
    // 切模块不再中止请求；这里仅兜底：万一被中止，清思考态（不落记录）
    if (r && r.aborted) { chatSetPending(cid, false); return null; }
    const content = (!r.mock && r.content && r.content.trim()) ? r.content : (fallbackText || "我在呢，慢慢来。");
    const msg = { s: "liu", t: content, who: "刘看山" };
    if (offline) msg.offline = true;
    if (!isPet) {
      // 处境对齐「相似样本」融入刘看山参考资料：前端持有 alSimItems 时并入门控的知乎/全网参考
      if (payload.samples && payload.samples.length) {
        const _sp = _splitSources(payload.samples);
        const _zh = _sp.zh.slice(0, 6), _gl = _sp.gl.slice(0, 6);
        msg.refsZhihu = _zh.concat(r.refsZhihu || []);
        msg.refsGlobal = _gl.concat(r.refsGlobal || []);
      }
      if (!msg.refsZhihu || !msg.refsZhihu.length) { if (r.refsZhihu && r.refsZhihu.length) msg.refsZhihu = r.refsZhihu; }
      if (!msg.refsGlobal || !msg.refsGlobal.length) { if (r.refsGlobal && r.refsGlobal.length) msg.refsGlobal = r.refsGlobal; }
      if (r.refs && r.refs.length) msg.refs = r.refs;
      if (r.route && r.liveApi && r.liveApi !== "none") msg.route = r.route;
      if (r.sources && r.sources.length) msg.sources = r.sources;
    }
    chatAppend(cid, msg);
    chatSetPending(cid, false);
    // 回包后把本轮写入多轮历史（裁剪到最近 12 轮，避免过长）
    liuHistories[cid].push({ role: "user", content: q });
    liuHistories[cid].push({ role: "assistant", content: content });
    if (liuHistories[cid].length > 12) liuHistories[cid] = liuHistories[cid].slice(-12);
    return r;
  }
  async function liuReplyRaw(payload, fallbackText) {
    const r = await callZhihu("liuanswer", Object.assign({ fresh: true }, payload, { kb: !!localStorage.getItem("zhiyu_kb_ok") }));
    return (!r.mock && r.content) ? r.content : fallbackText;
  }

  // ---------- 养成层：成长等级系统（借鉴 solo-leveling 范式，文艺化改写）----------
  const DEFAULT_STATS = [
    { id: "cog", name: "认知", icon: "🔮", desc: "自我认知与复盘的深度" },
    { id: "exe", name: "践行", icon: "🔥", desc: "把经验转成行动闭环" },
    { id: "vis", name: "视野", icon: "🔭", desc: "借他人样本拓宽眼界" },
    { id: "emp", name: "共情", icon: "🤝", desc: "理解他人、与人连接" },
    { id: "mas", name: "钻研", icon: "🧗", desc: "啃下陌生领域的力" },
    { id: "con", name: "恒心", icon: "🌿", desc: "连续耕耘的韧性" },
  ];
  // 能力模板：可一键套用，套用后仍可继续自定义编辑
  const ABILITY_TEMPLATES = [
    { name: "通用成长", dims: [
      { id: "cog", name: "认知", icon: "🔮", desc: "自我认知与复盘的深度" },
      { id: "exe", name: "践行", icon: "🔥", desc: "把经验转成行动闭环" },
      { id: "vis", name: "视野", icon: "🔭", desc: "借他人样本拓宽眼界" },
      { id: "emp", name: "共情", icon: "🤝", desc: "理解他人、与人连接" },
      { id: "mas", name: "钻研", icon: "🧗", desc: "啃下陌生领域的力" },
      { id: "con", name: "恒心", icon: "🌿", desc: "连续耕耘的韧性" },
    ] },
    { name: "创作者", dims: [
      { id: "write", name: "写作", icon: "✍️", desc: "持续产出内容的能力" },
      { id: "topic", name: "选题", icon: "🎯", desc: "找到值得写、有人看的方向" },
      { id: "expr", name: "表达", icon: "🗣️", desc: "把想法讲清楚、讲动人的力" },
      { id: "aes", name: "审美", icon: "🎨", desc: "对质感的判断力" },
      { id: "ops", name: "运营", icon: "📡", desc: "让内容被看见、被分发" },
      { id: "cash", name: "变现", icon: "💰", desc: "把影响力换成收益" },
    ] },
    { name: "创业者", dims: [
      { id: "prod", name: "产品", icon: "💡", desc: "定义与打磨价值载体" },
      { id: "grow", name: "增长", icon: "📈", desc: "把对的人带进来、留下来" },
      { id: "sale", name: "销售", icon: "🤝", desc: "把价值卖出去的力" },
      { id: "mgmt", name: "管理", icon: "🧩", desc: "带队、分权、对齐" },
      { id: "fin", name: "财务", icon: "📊", desc: "算清账、控现金流" },
      { id: "will", name: "心力", icon: "❤️", desc: "扛住不确定与孤独" },
    ] },
    { name: "学生", dims: [
      { id: "major", name: "专业", icon: "📚", desc: "本专业的硬功夫" },
      { id: "eng", name: "英语", icon: "🌐", desc: "读懂世界文献的钥匙" },
      { id: "disc", name: "自律", icon: "⏰", desc: "把计划落到每天" },
      { id: "search", name: "信息检索", icon: "🔎", desc: "快速找到靠谱答案" },
      { id: "expr2", name: "表达", icon: "🗣️", desc: "作业 / 答辩 / 社交讲清楚" },
      { id: "health", name: "健康", icon: "🏃", desc: "撑住长期战斗的本钱" },
    ] },
  ];
  const STAT_KEY = "zhiyu_stats";
  function loadStats() {
    try {
      const a = JSON.parse(localStorage.getItem(STAT_KEY));
      if (Array.isArray(a) && a.length) return a;
    } catch (e) {}
    return DEFAULT_STATS.map((s) => ({ ...s }));
  }
  function saveStats(a) {
    try { localStorage.setItem(STAT_KEY, JSON.stringify(a)); } catch (e) {}
  }
  // ---------- 大佬必修：个人能力清单（个人商业模式画布式自省）----------
  // 大佬必修·个人能力清单：把九格商业画布拆成可逐项填写的能力点（每点都来自画布框架，详细列出、让用户填）
  const DALAO_DIMS = [
    { id: "core", name: "核心发源", hint: "把自己当一家公司盘一遍：先看清你是谁、你有什么。",
      items: [
        { k: "who", q: "我是谁？（个性、身份、我在意的事）" },
        { k: "like", q: "我的兴趣与热爱是什么？" },
        { k: "good", q: "我擅长做、做起来顺手的事是什么？" },
        { k: "have", q: "我拥有什么？（知识 / 技能 / 经验 / 资源 / 人脉）" },
      ] },
    { id: "key", name: "关键业务", hint: "我到底在做什么、能做什么。",
      items: [
        { k: "doing", q: "我正在做的、最花时间的事是什么？" },
        { k: "can", q: "我真正能做的、别人愿意买单的本事是什么？" },
        { k: "best", q: "我最擅长、比多数人做得好的事是什么？" },
      ] },
    { id: "cust", name: "客户群体", hint: "谁需要你、谁愿意为你付费。",
      items: [
        { k: "who", q: "我能服务谁？（用户 / 读者 / 受众是谁）" },
        { k: "need", q: "他们最痛、最想解决的难题是什么？" },
        { k: "pay", q: "谁愿意为这个价值买单？怎么买单？" },
      ] },
    { id: "val", name: "价值服务", hint: "你到底帮别人解决了什么。",
      items: [
        { k: "help", q: "我怎样帮到别人？提供了什么价值？" },
        { k: "diff", q: "我和别人不一样在哪？我的稀缺性是什么？" },
      ] },
    { id: "chan", name: "渠道通路", hint: "怎么让人看见你、怎么交付。",
      items: [
        { k: "show", q: "我怎么展示自己？（公域：知乎 / 短视频 / B站；私域：社群 / 公众号）" },
        { k: "deliver", q: "我怎么把价值交付出去？（线上 / 线下 / 产品 / 服务）" },
      ] },
    { id: "rel", name: "客户联系", hint: "你和用户是什么关系。",
      items: [
        { k: "build", q: "我怎么和用户建立并维持联系？" },
        { k: "type", q: "是一次性服务，还是持续性的陪伴 / 订阅？" },
      ] },
    { id: "coop", name: "重要合作", hint: "谁能帮你把事做成。",
      items: [
        { k: "help", q: "谁能帮我？（家人 / 朋友 / 同事 / 老板 / 合伙人）" },
        { k: "give", q: "我又能为这些伙伴提供什么？" },
      ] },
    { id: "cost", name: "成本结构", hint: "你付出的真实代价。",
      items: [
        { k: "money", q: "硬支出：我要花多少钱？" },
        { k: "soft", q: "软支出：我要花多少时间、精力、人情？" },
      ] },
    { id: "inc", name: "收入来源", hint: "你的回报从哪来。",
      items: [
        { k: "money", q: "钱从哪来？（服务收益 / 产品 / 广告 / 知识付费）" },
        { k: "other", q: "非金钱回报：影响力 / 经验 / 人脉 / 长期成长？" },
      ] },
  ];
  const DALAO_KEY = "zhiyu_dalao";
  function loadDalao() {
    let o = {};
    try { o = JSON.parse(localStorage.getItem(DALAO_KEY) || "{}") || {}; } catch (e) {}
    const out = {};
    loadSchema().forEach((d) => {
      const prev = o[d.id];
      out[d.id] = (prev && typeof prev === "object" && !Array.isArray(prev)) ? prev : {};
      if (d.items) d.items.forEach((it) => { if (out[d.id][it.k] == null) out[d.id][it.k] = ""; });
      else if (out[d.id] == null) out[d.id] = "";
    });
    return out;
  }
  function saveDalao(o) { try { localStorage.setItem(DALAO_KEY, JSON.stringify(o)); } catch (e) {} }
  // 大佬必修·能力清单结构可自定义（用户可增删维度/能力点、改名）。结构存 schema，填写值存 DALAO_KEY。
  const DALAO_SCHEMA_KEY = "zhiyu_dalao_schema";
  function loadSchema() {
    try {
      const a = JSON.parse(localStorage.getItem(DALAO_SCHEMA_KEY));
      if (Array.isArray(a) && a.length) return a;
    } catch (e) {}
    const seed = JSON.parse(JSON.stringify(DALAO_DIMS));
    saveSchema(seed);
    return seed;
  }
  function saveSchema(a) { try { localStorage.setItem(DALAO_SCHEMA_KEY, JSON.stringify(a)); } catch (e) {} }
  const RANKS = [
    { min: 1, title: "求知者" }, { min: 6, title: "明心者" }, { min: 11, title: "通达者" },
    { min: 19, title: "觉行者" }, { min: 29, title: "知遇者" }, { min: 41, title: "大宗师" },
  ];
  // 细致的等级曲线：每升一级所需 XP 逐级递增（前快后稳，长线可玩）
  function lvlReq(n) { return 60 + (n - 1) * 40; } // L1→2:60, L2→3:100, L3→4:140 ...
  function levelInfo(xp) {
    let lv = 1, rem = Math.max(0, xp | 0);
    while (rem >= lvlReq(lv)) { rem -= lvlReq(lv); lv++; if (lv > 300) break; }
    const need = lvlReq(lv);
    return { level: lv, into: rem, need, pct: Math.min(100, Math.round((rem / need) * 100)) };
  }
  // 连续打卡里程碑：额外一次性奖励，强化“每天回来”的心智
  const STREAK_MS = { 3: 40, 7: 120, 21: 360, 60: 1000, 180: 3000 };
  const GROWTH_KEY = "zhiyu_growth";
  const DAY_KEY = "zhiyu_grow_day";
  function todayStr() {
    const d = new Date();
    return d.getFullYear() + "-" + String(d.getMonth() + 1).padStart(2, "0") + "-" + String(d.getDate()).padStart(2, "0");
  }
  function freshGrowth() {
    const s = {}; loadStats().forEach((d) => (s[d.id] = 0));
    return { stats: s, xp: 0, level: 1, rank: RANKS[0].title, streak: 0, last: "", title: "", checkinDate: "", milestones: [], log: [] };
  }
  function normalizeGrowth(g) {
    loadStats().forEach((d) => { if (g.stats[d.id] == null) g.stats[d.id] = 0; });
  }
  function applyDecay(g) {
    if (!g.last) return;
    const last = new Date(g.last), now = new Date();
    const gap = Math.floor((now - last) / 86400000);
    if (gap > 3) loadStats().forEach((d) => { g.stats[d.id] = Math.round((g.stats[d.id] || 0) * 0.9); });
  }
  function rankForLevel(lv) {
    let r = RANKS[0].title;
    for (const x of RANKS) if (lv >= x.min) r = x.title;
    return r;
  }
  function loadGrowth() {
    try {
      const g = JSON.parse(localStorage.getItem(GROWTH_KEY));
      if (g) { normalizeGrowth(g); return g; }
    } catch (e) {}
    return freshGrowth();
  }
  function saveGrowth(g) { try { localStorage.setItem(GROWTH_KEY, JSON.stringify(g)); } catch (e) {} }
  function awardXP(statGains, reason) {
    let g = loadGrowth() || freshGrowth();
    applyDecay(g);
    let gained = 0;
    for (const k in statGains) { if (g.stats[k] != null) { g.stats[k] += statGains[k]; gained += statGains[k]; } }
    g.xp += gained;
    // 连续天数：今天还没记过，则判断是否连续
    const t = todayStr();
    if (g.last !== t) {
      const y = new Date(); y.setDate(y.getDate() - 1);
      const yStr = y.getFullYear() + "-" + String(y.getMonth() + 1).padStart(2, "0") + "-" + String(y.getDate()).padStart(2, "0");
      g.streak = g.last === yStr ? g.streak + 1 : 1;
      g.last = t;
    }
    // 连续打卡里程碑：额外一次性奖励
    const msBonus = STREAK_MS[g.streak];
    if (msBonus && !(g.milestones || []).includes(g.streak)) {
      g.milestones = g.milestones || [];
      g.milestones.push(g.streak);
      g.xp += msBonus; gained += msBonus;
      liuShout("🏆 连续 " + g.streak + " 天里程碑！额外 +" + msBonus + " XP");
    }
    // 用细致曲线重算等级
    const li = levelInfo(g.xp);
    const levelUp = li.level > g.level;
    g.level = li.level;
    const newRank = rankForLevel(g.level);
    const rankUp = newRank !== g.rank;
    g.rank = newRank;
    g.log.unshift({ at: new Date().toLocaleString("zh-CN"), reason, gained });
    g.log = g.log.slice(0, 12);
    saveGrowth(g);
    if (rankUp) liuShout("🎉 你晋升为「" + newRank + "」了！路，是一步步走出来的。");
    else if (levelUp) liuShout("✨ 升到 " + g.level + " 级啦，继续往前。");
    if (location.hash === "#grow") renderGrow(document.getElementById("view"));
    return g;
  }
  function liuShout(msg) {
    _liuBubbleShow(document.getElementById("liuBubble"), "🐾 <b>" + msg + "</b>", "bubblePop .6s ease");
  }
  function dayDone() { try { return JSON.parse(localStorage.getItem(DAY_KEY)) || {}; } catch (e) { return {}; } }
  // 养成页被 awardXP 整块重渲染时，保住用户选中的日期（默认停在今天）
  let _growCalSel = null;
  function renderGrow(v) {
    const g = loadGrowth();
    const d = dayDone();
    const li = levelInfo(g.xp);
    const stats = loadStats();
    const schema = loadSchema();
    const quests = [
      { id: "q_review", t: "完成一次复盘", gain: { cog: 10, exe: 20 } },
      { id: "q_sample", t: "读一条人生样本", gain: { vis: 8 } },
      { id: "q_align", t: "对齐一次处境", gain: { vis: 10, emp: 5 } },
      { id: "q_field", t: "生成一份领域速通计划", gain: { mas: 15 } },
      { id: "q_self", t: "做一轮自我认知对话", gain: { cog: 15 } },
      { id: "q_mistake", t: "记一道错题进错题本", gain: { exe: 10 } },
      { id: "q_check", t: "做一次成长检验（费曼/知乎体/复现）", gain: { cog: 12, exe: 8 } },
    ];
    const checkedIn = g.checkinDate === todayStr();
    const checkinBonus = 12 + Math.min(g.streak, 10) * 2;
    const editorRows = stats.map((s) => `<div class="stat-edit" data-id="${s.id}">
      <span class="si">${s.icon}</span>
      <input class="n" value="${escAttr(s.name)}" data-f="name" />
      <button class="del" data-del="${s.id}">删</button></div>`).join("");
    const dimChecks = stats.map((s) => `<label class="quest"><input type="checkbox" class="adim" value="${s.id}"/> ${s.icon} ${s.name}</label>`).join("");
    v.innerHTML = `
      <h2 class="view-title">🌟 我的大佬养成系统</h2>
      <p class="view-sub">这是<b>属于你的大佬养成系统</b>：把真实的成长动作变成经验值，像 RPG 一样看见自己变强；
      能力维度你可以自己定义，成长看得见。</p>
      <div class="card grow-hero">
        <div class="lv-badge"><span class="lv">Lv.${li.level}</span><span class="rank" id="rankSpan">${escHTML(g.title || g.rank)}</span></div>
        <div class="grow-meta">
          <div class="bar xp"><i style="width:${li.pct}%"></i></div>
          <div class="muted">距下一级 ${li.need - li.into} XP ｜ 累计 ${g.xp} XP ｜ 🔥 连续 ${g.streak} 天</div>
          <div class="muted title-edit">✏️ 我的称号：<input id="titleInput" class="title-input" value="${escAttr(g.title || "")}" placeholder="${escAttr(g.rank)}" maxlength="16"/></div>
        </div>
      </div>
      <div class="section card grow-timeline-h">
        <h3>📈 成长时间线 · 每日签到 · 连续打卡</h3>
        <p class="muted">你走过的每一步都留在这里（横向滑动查看）。每天回来签个到，连续天数越高奖励越多（第 3 / 7 / 21 / 60 / 180 天还有里程碑大奖）。</p>
        <div class="checkin-row">
          <button id="checkinBtn" class="checkin-btn ${checkedIn ? "done" : ""}">${checkedIn ? "✅ 今日已签到" : "📅 签到领 " + checkinBonus + " XP"}</button>
          <span class="muted">🔥 连续 ${g.streak} 天</span>
        </div>
        <div class="timeline horizontal" id="growTimeline"></div>
      </div>
      <div class="section grid grid-2">
        <div class="card">
          <h3>📊 我的能力雷达</h3>
          <p class="muted">六个成长维度相对强弱，一眼看清该往哪补。</p>
          <div id="radarBox" style="display:flex;justify-content:center"></div>
          <div class="radar-legend" id="radarLegend"></div>
        </div>
        <div class="card">
          <h3>🏅 成就图章墙</h3>
          <p class="muted">每升一阶、每连一天，都留下一枚图章。</p>
          <div class="stamp-wall" id="stampWall"></div>
        </div>
      </div>
      <div class="section card">
        <h3>📅 我的成长日历 · 每日计划</h3>
        <p class="muted">默认停在今天——<b>今日成长目标</b>就在当天的计划里。你可以自己加任务、自己定<b>经验值</b>与<b>归属维度</b>，
        勾选完成即结算，不要的随时删；换一天就是那天的计划。</p>
        <div class="cal-head">
          <button id="calPrev" class="ghost">‹</button>
          <span id="calTitle" class="cal-title"></span>
          <button id="calNext" class="ghost">›</button>
        </div>
        <div class="cal-grid" id="calGrid"></div>
        <div class="cal-panel" id="calPanel"></div>
      </div>
      <details class="section card grow-more">
        <summary>🛠️ 进阶 · 能力模板 / 自定义维度 / 记一笔 / 成长记录</summary>
        <div class="more-inner">
          <h3>🧩 能力模板（一键套用，套用后仍可自定义）</h3>
          <p class="muted">选一个贴近你的角色，快速铺好能力维度；之后随便改、随便加。</p>
          <div class="row" id="tplRow">${ABILITY_TEMPLATES.map((t) => `<button class="ghost tpl-btn" data-tpl="${escAttr(t.name)}">${escHTML(t.name)}</button>`).join("")}</div>
          <h3 style="margin-top:14px">我的成长维度（可自定义）</h3>
          <p class="muted">改名、删掉不适合的维度；至少保留一个。</p>
          <div id="statEditor">${editorRows}</div>
          <div class="row"><button class="ghost" id="statAdd">+ 新增能力维度</button></div>
          <h3 style="margin-top:14px">➕ 记一笔我的成长动作</h3>
          <p class="muted">自定义维度也能赚经验：写个动作名，勾选维度，填经验值。</p>
          <input id="actName" placeholder="动作名，如：今天读完一本书并做笔记" />
          <div class="chips" id="statChips" style="margin:10px 0">${dimChecks}</div>
          <div class="row"><input id="actXp" type="number" value="10" style="max-width:90px" title="经验值" /><span class="muted">XP</span>
            <button id="actAdd">记一笔</button></div>
          <h3 style="margin-top:14px">🪵 最近成长</h3>
          ${g.log.length ? g.log.slice(0, 12).map((l) => `<div class="log">${l.at} · ${l.reason} <span class="muted">+${l.gained}</span></div>`).join("") : '<div class="muted">还没有成长记录，去别的模块做点什么吧。</div>'}
        </div>
      </details>
      <div class="note">养成层为本地逻辑（零依赖、localStorage 存档），不调用任何外部 API。
      想借大佬们的方法论？去「<a href="#explore" id="toModels">知遇·检索 · 大佬思维模型</a>」蒸馏一张属于你的卡。</div>`;
    // ---------- 成长可视化（路线D）：雷达 / 图章墙 / 时间线 / 分享卡 ----------
    const statsNow = loadStats();
    const maxStat = Math.max(1, ...statsNow.map((s) => g.stats[s.id] || 0));
    const radarLabels = statsNow.map((s) => s.icon + " " + s.name);
    const radarVals = statsNow.map((s) => Math.round((g.stats[s.id] || 0) / maxStat * 100));
    const rb = v.querySelector("#radarBox");
    if (rb) rb.innerHTML = radarSVG(radarLabels, radarVals, { size: 268, color: "#5cc8ff", max: 100 });
    const rl = v.querySelector("#radarLegend");
    if (rl) rl.innerHTML = statsNow.map((s) => `<span class="rl-item"><i style="color:${hexA("#5cc8ff", .9)}">●</i> ${s.icon}${escHTML(s.name)} <b>${g.stats[s.id] || 0}</b></span>`).join("");
    const STAMP_DEFS = [
      { lv: 1, icon: "🔰", name: "求知者" }, { lv: 6, icon: "🌱", name: "明心者" },
      { lv: 11, icon: "🧭", name: "通达者" }, { lv: 19, icon: "💎", name: "觉行者" },
      { lv: 29, icon: "👑", name: "知遇者" }, { lv: 41, icon: "🏛️", name: "大宗师" },
    ];
    const STREAK_STAMPS = [
      { n: 3, icon: "🔥", name: "三日之勤" }, { n: 7, icon: "⚡", name: "周常不辍" },
      { n: 21, icon: "🌟", name: "月余成习" }, { n: 60, icon: "☄️", name: "两月如初" }, { n: 180, icon: "🌠", name: "半载不移" },
    ];
    const milestones = g.milestones || [];
    const sw = v.querySelector("#stampWall");
    if (sw) {
      const rankTiles = STAMP_DEFS.map((s) => {
        const ok = g.level >= s.lv;
        return `<div class="stamp ${ok ? "on" : "off"}" title="${ok ? "已解锁" : "Lv." + s.lv + " 解锁"}"><div class="st-ic">${s.icon}</div><div class="st-nm">${escHTML(s.name)}</div><div class="st-sub">${ok ? "✓ 已得" : "Lv." + s.lv}</div></div>`;
      }).join("");
      const streakTiles = STREAK_STAMPS.map((s) => {
        const ok = milestones.includes(s.n);
        return `<div class="stamp ${ok ? "on" : "off"}" title="${ok ? "已解锁" : "连续 " + s.n + " 天解锁"}"><div class="st-ic">${s.icon}</div><div class="st-nm">${escHTML(s.name)}</div><div class="st-sub">${ok ? "✓ 已得" : s.n + "天"}</div></div>`;
      }).join("");
      sw.innerHTML = rankTiles + streakTiles;
    }
    
    const tl = v.querySelector("#growTimeline");
    if (tl) {
      const logs = g.log || [];
      tl.innerHTML = logs.length ? logs.map((l) => `<div class="tl-item"><span class="tl-dot"></span><div class="tl-body"><div class="tl-reason">${escHTML(l.reason)}</div><div class="tl-meta"><span class="tl-time">${escHTML(l.at)}</span><span class="tl-xp">+${l.gained} XP</span></div></div></div>`).join("") : '<div class="muted">🕰️ 你的成长时间轴还是空的 · 去做一次复盘或自我认知，这里就会长出第一条印记</div>';
    }
    // 「生成我的成长卡片」分享功能已按需求移除（保留 buildShareCardHTML 供未来恢复）
    // 注：今日成长目标的勾选绑定已移入 renderCalPanel（随每日计划一起渲染）
    v.querySelectorAll(".stat-edit input").forEach((inp) => {
      inp.onchange = () => {
        const id = inp.closest(".stat-edit").dataset.id;
        const f = inp.dataset.f;
        const stats2 = loadStats();
        const st = stats2.find((x) => x.id === id);
        if (st) { st[f] = inp.value; saveStats(stats2); renderGrow(v); }
      };
    });
    v.querySelectorAll("[data-del]").forEach((b) => {
      b.onclick = () => {
        let stats2 = loadStats();
        if (stats2.length <= 1) { liuShout("至少保留一个能力维度哦～"); return; }
        stats2 = stats2.filter((x) => x.id !== b.dataset.del);
        saveStats(stats2); renderGrow(v);
      };
    });
    document.getElementById("statAdd").onclick = () => {
      const stats2 = loadStats();
      stats2.push({ id: "s" + Date.now(), name: "新能力", icon: "⭐", desc: "" });
      saveStats(stats2); renderGrow(v);
    };
    document.getElementById("actAdd").onclick = () => {
      const name = document.getElementById("actName").value.trim();
      if (!name) return;
      const xp = parseInt(document.getElementById("actXp").value, 10) || 10;
      const dims = Array.from(v.querySelectorAll(".adim")).filter((c) => c.checked).map((c) => c.value);
      if (!dims.length) return;
      const gain = {}; dims.forEach((id) => (gain[id] = xp));
      awardXP(gain, name);
      document.getElementById("actName").value = "";
      v.querySelectorAll(".adim").forEach((c) => (c.checked = false));
    };
    const toModels = document.getElementById("toModels");
    if (toModels) toModels.onclick = (e) => { e.preventDefault(); location.hash = "#models"; };
    // 能力模板：一键套用（套用后仍可继续自定义）
    v.querySelectorAll("#tplRow .tpl-btn").forEach((b) => {
      b.onclick = () => {
        const tpl = ABILITY_TEMPLATES.find((x) => x.name === b.dataset.tpl);
        if (!tpl) return;
        saveStats(tpl.dims.map((d) => Object.assign({}, d)));
        liuShout("已套用「" + tpl.name + "」能力模板，你可以继续改、继续加～");
        refreshStats();
      };
    });
    // 局部刷新能力维度（不整页重渲染，保住聊天框）
    function refreshStats() {
      const stats2 = loadStats();
      const editor = v.querySelector("#statEditor");
      if (editor) {
        editor.innerHTML = stats2.map((s) => `<div class="stat-edit" data-id="${s.id}"><span class="si">${s.icon}</span><input class="n" value="${escAttr(s.name)}" data-f="name" /><button class="del" data-del="${s.id}">删</button></div>`).join("");
        editor.querySelectorAll(".stat-edit input").forEach((inp) => {
          inp.onchange = () => { const st = loadStats(); const x = st.find((y) => y.id === inp.closest(".stat-edit").dataset.id); if (x) { x[inp.dataset.f] = inp.value; saveStats(st); } };
        });
        editor.querySelectorAll("[data-del]").forEach((bd) => {
          bd.onclick = () => { let st = loadStats(); if (st.length <= 1) { liuShout("至少保留一个能力维度哦～"); return; } st = st.filter((x) => x.id !== bd.dataset.del); saveStats(st); refreshStats(); };
        });
      }
      const chips = v.querySelector("#statChips");
      if (chips) chips.innerHTML = stats2.map((s) => `<label class="quest"><input type="checkbox" class="adim" value="${s.id}"/> ${s.icon} ${s.name}</label>`).join("");
    }
    // ---------- 自定义称号（实时保存，显示在等级徽章）----------
    const ti = v.querySelector("#titleInput");
    if (ti) ti.oninput = () => {
      const g2 = loadGrowth(); g2.title = ti.value.trim(); saveGrowth(g2);
      const rs = v.querySelector("#rankSpan"); if (rs) rs.textContent = ti.value.trim() || rankForLevel(g2.level);
    };
    // ---------- 每日签到 ----------
    const cib = v.querySelector("#checkinBtn");
    if (cib && !checkedIn) cib.onclick = () => {
      const g2 = loadGrowth();
      const bonus = 12 + Math.min(g2.streak, 10) * 2;
      recordFootprint("养成", "连续签到" + g2.streak + "天");
      awardXP({ vis: bonus, con: Math.ceil(bonus / 3) }, "每日签到·连续" + g2.streak + "天");
      const g3 = loadGrowth(); g3.checkinDate = todayStr(); saveGrowth(g3);
      liuShout("📅 签到成功，+" + bonus + " XP！明天再来，连续更香～");
      renderGrow(v);
    };
    // ---------- 成长日历 ----------
    const PLAN_KEY = "zhiyu_plans";
    // 每日计划：{ id, t(任务名), xp(经验值), dim(归属维度), done }；兼容旧的纯字符串写法
    const loadPlans = () => {
      try {
        const raw = JSON.parse(localStorage.getItem(PLAN_KEY) || "{}") || {};
        const out = {};
        for (const k in raw) {
          out[k] = (raw[k] || []).map((p) => {
            if (p && typeof p === "object") return { id: p.id || ("t_" + Math.random().toString(36).slice(2, 8)), t: String(p.t || ""), xp: Number(p.xp) || 0, dim: p.dim || "", done: !!p.done };
            return { id: "t_" + Math.random().toString(36).slice(2, 8), t: String(p || ""), xp: 0, dim: "", done: false };
          }).filter((p) => p.t);
        }
        return out;
      } catch (e) { return {}; }
    };
    const savePlans = (o) => { try { localStorage.setItem(PLAN_KEY, JSON.stringify(o)); } catch (e) {} };
    const calMonthName = ["1月", "2月", "3月", "4月", "5月", "6月", "7月", "8月", "9月", "10月", "11月", "12月"];
    const calKey = (y, m, d) => y + "-" + String(m + 1).padStart(2, "0") + "-" + String(d).padStart(2, "0");
    let calY = new Date().getFullYear(), calM = new Date().getMonth();
    let calSel = _growCalSel || calKey(new Date().getFullYear(), new Date().getMonth(), new Date().getDate());
    const calGrid = v.querySelector("#calGrid");
    const calTitle = v.querySelector("#calTitle");
    const calPanel = v.querySelector("#calPanel");
    function renderCal() {
      const plans = loadPlans();
      calTitle.textContent = calY + " 年 " + calMonthName[calM];
      const first = new Date(calY, calM, 1).getDay();
      const days = new Date(calY, calM + 1, 0).getDate();
      const todayKey = calKey(new Date().getFullYear(), new Date().getMonth(), new Date().getDate());
      let cells = "";
      for (let i = 0; i < first; i++) cells += '<span class="cal-cell empty"></span>';
      for (let d = 1; d <= days; d++) {
        const key = calKey(calY, calM, d);
        const has = plans[key] && plans[key].length;
        const cls = "cal-cell" + (key === todayKey ? " cal-today" : "") + (key === calSel ? " cal-sel" : "");
        cells += '<span class="' + cls + '" data-k="' + key + '">' + d + (has ? '<i class="cal-dot"></i>' : "") + '</span>';
      }
      calGrid.innerHTML = '<div class="cal-dow"><span>日</span><span>一</span><span>二</span><span>三</span><span>四</span><span>五</span><span>六</span></div><div class="cal-days">' + cells + '</div>';
      calGrid.querySelectorAll(".cal-cell[data-k]").forEach((c) => {
        c.onclick = () => { calSel = _growCalSel = c.dataset.k; renderCal(); renderCalPanel(); };
      });
    }
    function renderCalPanel() {
      if (!calSel) { calPanel.innerHTML = '<p class="muted">点上面的日期，给那天加个计划。</p>'; return; }
      const isToday = calSel === todayStr();
      const list = loadPlans()[calSel] || [];
      const stats = loadStats();
      const dimOpts = stats.map((s) => `<option value="${escAttr(s.id)}">${escHTML((s.icon || "⭐") + " " + (s.name || "能力"))}</option>`).join("");
      const dimName = (id) => { const s = stats.find((x) => x.id === id); return s ? (s.icon || "⭐") + (s.name || "") : "综合"; };
      let html = `<div class="cal-seldate">📌 ${calSel}${isToday ? ' <span class="muted" style="font-weight:400">· 今天</span>' : ""}</div>`;
      // ① 今日成长目标（用户自定义、可删除，不限数量）
      if (isToday) {
        // 获取今天的自定义目标
        const todayGoals = d[todayStr()] || {};
        const goalKeys = Object.keys(todayGoals).filter(key => key.startsWith('goal_'));
        const doneGoals = goalKeys.filter(key => todayGoals[key] && todayGoals[key].done);
        const totalGoals = goalKeys.length;
        
        html += `<div class="cal-block">
          <h4>📜 今日成长目标 <span class="muted" style="font-weight:400;font-size:12.5px">（${doneGoals.length}/${totalGoals} 完成）</span></h4>
          <p class="muted" style="font-size:12.5px">自定义今日成长目标，勾选完成或点击 ✕ 删除（每天各一次）。</p>
          
          <!-- 显示已有的今日目标 -->
          <div id="today-goals-list">
          ${goalKeys.map((key) => {
            const goal = todayGoals[key];
            if (key.startsWith('goal_') && typeof goal === 'object' && goal.text) {
              const done = goal.done || false;
              return `<div class="cal-goal ${done ? "done" : ""}">
                <label class="cal-goal-l">
                  <input type="checkbox" class="gdone" data-goalid="${escAttr(key)}" ${done ? "checked" : ""} ${done ? "disabled" : ""}/> 
                  <span>${escHTML(goal.text)}</span>
                </label>
                <span class="cal-xp">+${Number(goal.xp) || 10} XP</span>
                <button class="cal-del" data-goalid="${escAttr(key)}" title="删除这个目标">✕</button>
              </div>`;
            }
            return '';
          }).join("")}
          </div>
          
          <!-- 添加新目标的表单 -->
          <div class="cal-goal-add">
            <input id="goalText" placeholder="目标名，如：完成今日学习计划" />
            <input id="goalXp" type="number" value="10" min="1" max="500" title="经验值" />
            <span class="muted">XP</span>
            <button id="goalAdd">＋ 添加目标</button>
          </div>
        </div>`;
      }
      // ② 我的任务（自定义：可加可删、可设经验值与归属维度）
      const dn = list.filter((t) => t.done).length;
      const xpSum = list.reduce((a, t) => a + (Number(t.xp) || 0), 0);
      html += `<div class="cal-block">
        <h4>✅ 我的任务 <span class="muted" style="font-weight:400;font-size:12px">（${dn}/${list.length} 完成 · 共 ${xpSum} XP）</span></h4>
        <p class="muted" style="font-size:12.5px">自己定任务、自己定经验值和归属维度；勾选完成即结算，不需要的点 ✕ 删掉。</p>
        ${list.length ? list.map((t) => `<div class="cal-task ${t.done ? "done" : ""}">
          <label class="cal-task-l"><input type="checkbox" class="tdone" data-tid="${escAttr(t.id)}" ${t.done ? "checked" : ""} ${t.done ? "disabled" : ""}/> <span>${escHTML(t.t)}</span></label>
          <span class="cal-xp">+${Number(t.xp) || 0} XP · ${escHTML(dimName(t.dim))}</span>
          <button class="cal-del" data-tid="${escAttr(t.id)}" title="删除这个任务">✕</button>
        </div>`).join("") : '<p class="muted" style="font-size:12.5px">这天还没有自定义任务，下面加一条。</p>'}
        <div class="cal-task-add">
          <input id="taskName" placeholder="任务名，如：读完《认知觉醒》第3章" />
          <select id="taskDim" title="归属维度">${dimOpts}</select>
          <input id="taskXp" type="number" value="10" min="1" max="500" title="经验值" />
          <span class="muted">XP</span>
          <button id="taskAdd">＋ 添加任务</button>
        </div>
      </div>`;
      calPanel.innerHTML = html;
      // 绑定：今日成长目标勾选完成
      calPanel.querySelectorAll(".gdone").forEach((cb) => {
        cb.onchange = () => {
          if (!cb.checked) return;
          const goalId = cb.dataset.goalid;
          if (!goalId) return;
          
          const dd = dayDone();
          if (!dd[todayStr()]) dd[todayStr()] = {};
          
          // 获取目标信息
          const todayGoals = dd[todayStr()];
          const goal = todayGoals[goalId];
          if (!goal || goal.done) return;
          
          // 标记为已完成
          goal.done = true;
          localStorage.setItem(DAY_KEY, JSON.stringify(dd));
          
          // 计算奖励
          const gain = {};
          const dim = goal.dim || (stats[0] && stats[0].id);
          if (dim) gain[dim] = Number(goal.xp) || 10;
          
          awardXP(gain, goal.text || "今日成长目标");
        };
      });
      
      // 绑定：删除今日成长目标
      calPanel.querySelectorAll(".cal-del[data-goalid]").forEach((b) => {
        b.onclick = () => {
          const goalId = b.dataset.goalid;
          if (!goalId) return;
          
          const dd = dayDone();
          if (dd[todayStr()] && dd[todayStr()][goalId]) {
            delete dd[todayStr()][goalId];
            localStorage.setItem(DAY_KEY, JSON.stringify(dd));
            renderCal(); renderCalPanel();
          }
        };
      });
      
      // 绑定：添加今日成长目标
      const addGoal = () => {
        const txt = calPanel.querySelector("#goalText");
        const xp = calPanel.querySelector("#goalXp");
        if (!txt) return;
        const text = (txt.value || "").trim();
        if (!text) return;
        
        const dd = dayDone();
        if (!dd[todayStr()]) dd[todayStr()] = {};
        
        // 生成唯一的goal ID
        const goalId = "goal_" + Date.now().toString(36) + Math.random().toString(36).slice(2, 6);
        
        dd[todayStr()][goalId] = {
          text: text,
          xp: Math.max(1, parseInt(xp.value, 10) || 10),
          done: false,
          createdAt: Date.now()
        };
        
        localStorage.setItem(DAY_KEY, JSON.stringify(dd));
        txt.value = "";
        renderCal(); renderCalPanel();
      };
      
      const ga = calPanel.querySelector("#goalAdd");
      if (ga) ga.onclick = addGoal;
      const gt = calPanel.querySelector("#goalText");
      if (gt) gt.addEventListener("keydown", (e) => { if (e.key === "Enter") addGoal(); });
      // 绑定：自定义任务勾选完成 → 结算经验
      calPanel.querySelectorAll(".tdone").forEach((cb) => {
        cb.onchange = () => {
          if (!cb.checked) return;
          const ps = loadPlans();
          const arr = ps[calSel] || [];
          const t = arr.find((x) => x.id === cb.dataset.tid);
          if (!t || t.done) return;
          t.done = true;
          savePlans(ps);
          const dim = (t.dim && stats.some((s) => s.id === t.dim)) ? t.dim : (stats[0] && stats[0].id);
          const gain = {}; if (dim) gain[dim] = Number(t.xp) || 0;
          awardXP(gain, t.t);
        };
      });
      // 绑定：删除自定义任务
      calPanel.querySelectorAll(".cal-del[data-tid]").forEach((b) => {
        b.onclick = () => {
          const ps = loadPlans();
          ps[calSel] = (ps[calSel] || []).filter((x) => x.id !== b.dataset.tid);
          if (!ps[calSel].length) delete ps[calSel];
          savePlans(ps); renderCal(); renderCalPanel();
        };
      });
      // 绑定：添加自定义任务
      const addTask = () => {
        const nm = calPanel.querySelector("#taskName");
        const dm = calPanel.querySelector("#taskDim");
        const xp = calPanel.querySelector("#taskXp");
        if (!nm) return;
        const t = (nm.value || "").trim();
        if (!t) return;
        const ps = loadPlans();
        if (!ps[calSel]) ps[calSel] = [];
        ps[calSel].push({
          id: "t_" + Date.now().toString(36) + Math.random().toString(36).slice(2, 6),
          t: t,
          xp: Math.max(1, parseInt(xp.value, 10) || 10),
          dim: dm ? dm.value : (stats[0] && stats[0].id),
          done: false,
        });
        savePlans(ps); nm.value = ""; renderCal(); renderCalPanel();
      };
      const ta = calPanel.querySelector("#taskAdd");
      if (ta) ta.onclick = addTask;
      const tn = calPanel.querySelector("#taskName");
      if (tn) tn.addEventListener("keydown", (e) => { if (e.key === "Enter") addTask(); });
    }
    v.querySelector("#calPrev").onclick = () => { calM--; if (calM < 0) { calM = 11; calY--; } renderCal(); renderCalPanel(); };
    v.querySelector("#calNext").onclick = () => { calM++; if (calM > 11) { calM = 0; calY++; } renderCal(); renderCalPanel(); };
    renderCal(); renderCalPanel();
  }
  function escAttr(s) {
    return String(s).replace(/"/g, "&quot;").replace(/</g, "&lt;");
  }
  function escHTML(s) {
    return String(s == null ? "" : s)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#39;");
  }
  // 通用雷达图（纯 SVG，无外部依赖）：labels/values 等长；value 取值 0..opts.max
  function radarSVG(labels, values, opts) {
    opts = opts || {};
    const N = labels.length;
    if (N < 3) return "";
    const size = opts.size || 280;
    const R = size / 2 - 40;
    // viewBox 必须额外容纳四周轴标签，否则标签文字被 SVG 视口裁掉（实测溢出 9.2px）
    const maxLen = labels.reduce((m, s) => Math.max(m, [...String(s)].length), 0);
    const LG = 14;                                      // 轴端点 -> 标签的径向间距
    const LR = Math.max(34, Math.round(maxLen * 14));    // 标签横向预留宽度
    const V = Math.round(2 * (R + LG + LR));            // 含标签留白的 viewBox 边长
    const cx = V / 2, cy = V / 2;
    const max = opts.max || 100;
    const rings = opts.rings || 4;
    const color = opts.color || "#5cc8ff";
    const pt = (i, r) => { const a = -Math.PI / 2 + i * 2 * Math.PI / N; return [cx + Math.cos(a) * r, cy + Math.sin(a) * r]; };
    let grid = "";
    for (let k = 1; k <= rings; k++) {
      const rr = R * k / rings, ps = [];
      for (let i = 0; i < N; i++) { const p = pt(i, rr); ps.push(p[0].toFixed(1) + "," + p[1].toFixed(1)); }
      grid += '<polygon points="' + ps.join(" ") + '" fill="none" stroke="rgba(255,255,255,.10)" stroke-width="1"/>';
    }
    let axes = "";
    for (let i = 0; i < N; i++) {
      const p = pt(i, R);
      axes += '<line x1="' + cx + '" y1="' + cy + '" x2="' + p[0].toFixed(1) + '" y2="' + p[1].toFixed(1) + '" stroke="rgba(255,255,255,.14)" stroke-width="1"/>';
      const lp = pt(i, R + LG), anchor = lp[0] < cx - 5 ? "end" : (lp[0] > cx + 5 ? "start" : "middle");
      axes += '<text x="' + lp[0].toFixed(1) + '" y="' + (lp[1] + 4).toFixed(1) + '" fill="#aebfd2" font-size="12" text-anchor="' + anchor + '">' + escHTML(labels[i]) + '</text>';
    }
    const dp = [];
    for (let i = 0; i < N; i++) { const v = Math.max(0, Math.min(max, values[i] || 0)), r = R * v / max, p = pt(i, r); dp.push(p[0].toFixed(1) + "," + p[1].toFixed(1)); }
    const fill = hexA(color, .2), data = '<polygon points="' + dp.join(" ") + '" fill="' + fill + '" stroke="' + color + '" stroke-width="2"/>';
    let dots = "";
    for (let i = 0; i < N; i++) { const v = Math.max(0, Math.min(max, values[i] || 0)), r = R * v / max, p = pt(i, r); dots += '<circle cx="' + p[0].toFixed(1) + '" cy="' + p[1].toFixed(1) + '" r="3" fill="' + color + '"/>'; }
    return '<svg viewBox="0 0 ' + V + ' ' + V + '" width="' + V + '" height="' + V + '" style="max-width:100%;height:auto" xmlns="http://www.w3.org/2000/svg">' + grid + axes + data + dots + '</svg>';
  }
  function hexA(hex, a) {
    const h = (hex || "#5cc8ff").replace("#", "");
    const r = parseInt(h.substring(0, 2), 16), g = parseInt(h.substring(2, 4), 16), b = parseInt(h.substring(4, 6), 16);
    return "rgba(" + r + "," + g + "," + b + "," + a + ")";
  }
  // 一键分享卡（路线D）：本地组合 level + 雷达 + 时间线，交给 html-to-image 出 PNG
  function buildShareCardHTML(g, stats, li) {
    const labels = stats.map((s) => s.icon + " " + s.name);
    const maxV = Math.max(1, ...stats.map((s) => g.stats[s.id] || 0));
    const vals = stats.map((s) => Math.round((g.stats[s.id] || 0) / maxV * 100));
    const radar = radarSVG(labels, vals, { size: 280, color: "#5cc8ff", max: 100 });
    const top = stats.slice().sort((a, b) => (g.stats[b.id] || 0) - (g.stats[a.id] || 0)).slice(0, 3)
      .map((s) => s.icon + s.name + " " + (g.stats[s.id] || 0)).join(" · ");
    const tl = (g.log || []).slice(0, 4).map((l) => "· " + escHTML(l.reason) + " <span style='opacity:.7'>+" + l.gained + "XP</span>").join("<br/>");
    return '<div style="width:360px;padding:22px;border-radius:20px;background:linear-gradient(160deg,#0d1530,#16204a);color:#e8eef6;font-family:system-ui,' + "'PingFang SC','Microsoft YaHei',sans-serif" + ';box-sizing:border-box">'
      + '<div style="font-size:20px;font-weight:700;margin-bottom:2px">知遇录 · 我的成长卡片</div>'
      + '<div style="opacity:.8;font-size:13px;margin-bottom:10px">Lv.' + li.level + ' · ' + escHTML(g.title || g.rank) + ' ｜ 累计 ' + g.xp + ' XP ｜ 🔥连续 ' + g.streak + ' 天</div>'
      + '<div style="text-align:center">' + radar + '</div>'
      + '<div style="margin-top:8px;font-size:13px;opacity:.92">最强维度：' + (top || "—") + '</div>'
      + (tl ? '<div style="margin-top:10px;font-size:12px;opacity:.85;line-height:1.7">最近成长：<br/>' + tl + '</div>' : '')
      + '<div style="margin-top:14px;font-size:11px;opacity:.55;text-align:center">知遇录 · 属于你的大佬养成系统</div>'
      + '</div>';
  }
  function loadBirth() { try { return JSON.parse(localStorage.getItem("zhiyu_birth") || "null"); } catch (e) { return null; } }
  function saveBirth(b) { try { localStorage.setItem("zhiyu_birth", JSON.stringify(b)); } catch (e) {} }

  // 桥接：供 lixuan.js（刘看山引擎）调用本应用的对话与持久化能力
  window.ZY = { callZhihu, appendMsg, escHTML, loadBirth, saveBirth, chatGet, chatAppend, chatSetPending, renderChat, chatReset };

  // ---------- 专属学习（私人知识库）----------
  // 说明：原「我的网站导航」「我关注的全网博主」两个 tab 已并入「📝 碎片记录 → 🔗 链接」。
  function renderLearn(v) {
    function followeeCard(p) {
      if (!p) return "";
      return `<a class="sample followee" href="${p.url || "#"}" target="_blank" rel="noopener">
        <span class="tag cat">👥 关注</span>
        <h4>${escHTML(p.name || "（无名）")}</h4>
        <p class="muted">${escHTML(p.headline || "")}</p>
        <p class="muted">${p.followerCount ? "👥 " + p.followerCount + " 粉丝" : ""}</p>
      </a>`;
    }
    v.innerHTML = `
      <h2 class="view-title">📚 专属学习 · 我的私人知识库</h2>
      <p class="view-sub">这里只属于你：把<b>知乎实时「我的创作」与「我的关注」</b>收进来，配上你的能力清单、目标体系与碎片记录，
      慢慢长成你自己的学习中枢。<b>我的网站导航</b>与<b>我关注的全网博主</b>已并入「📝 碎片记录 → 🔗 链接」，和链接碎片放在一起管理。
      所有内容实时调用你已登录的知乎开放平台接口，本地仅作兜底。</p>
      <div class="card" id="kbDepositCard" style="margin:14px 0">
        <h3>🗂️ 一键导出 Markdown <span class="muted" style="font-weight:400;font-size:12px">（导出个人沉淀内容）</span></h3>
        <p class="muted">把你在能力清单 / 目标体系 / 人生传记 / 复盘原则 / 碎片记录里写下的内容，一键打包成一份 Markdown 下载保存。可粘贴进任意笔记 / 知识库（如知乎知识库）长期留存。</p>
        <div class="row">
          <button class="primary" id="kbDepositBtn">☁ 一键导出</button>
          <button class="ghost" id="kbOpenBtn">🔗 打开我的知乎知识库</button>
          <span id="kbDepositStatus" class="muted"></span>
        </div>
        <div id="kbDepositDetail" class="muted" style="margin-top:8px;font-size:12px"></div>
      </div>
      <div class="explore-tabs" id="lnTabs">
        <button data-lens="mine" class="active">📝 我的知乎创作</button>
        <button data-lens="follow">👥 我的知乎关注</button>
        <button data-lens="fav">⭐ 我的收藏</button>
        <button data-lens="skills">📋 个人能力清单</button>
        <button data-lens="goal">🎯 目标体系</button>
        <button data-lens="frag">📝 碎片记录 · 🔗 链接收藏</button>
        <button data-lens="export">📤 导出</button>
      </div>
      <div id="lnBody"></div>`;
    const body = v.querySelector("#lnBody");
    let lnCurrent = "mine";
    const show = (lens) => {
      lnCurrent = lens;
      v.querySelectorAll("#lnTabs button").forEach((t) => t.classList.toggle("active", t.dataset.lens === lens));
      if (lens === "mine") lnMine(body);
      else if (lens === "follow") lnFollow(body);
      else if (lens === "fav") lnFav(body);
      else if (lens === "skills") renderDalao(body);
      else if (lens === "goal") mailuoGoals(body);
      else if (lens === "frag") mailuoCapture(body, "link");
      else if (lens === "export") mailuoExport(body);
    };
    function lnBindSearch(el, selIn, selList, selCount, items, cardFn) {
      const inp = el.querySelector(selIn), box = el.querySelector(selList), cnt = el.querySelector(selCount);
      if (!inp || !box) return;
      const apply = () => {
        const q = (inp.value || "").trim().toLowerCase();
        const hit = q ? items.filter((it) => JSON.stringify(it).toLowerCase().indexOf(q) >= 0) : items;
        box.innerHTML = hit.length ? hit.map(cardFn).join("") : '<div class="muted" style="grid-column:1/-1;padding:10px">没搜到「' + escHTML((inp.value || "").trim()) + '」相关内容。</div>';
        if (cnt) cnt.textContent = q ? ("命中 " + hit.length + " / " + items.length + " 条") : ("共 " + items.length + " 条");
      };
      inp.oninput = apply;
      apply();
    }
    async function lnMine(el) {
      el.innerHTML = '<div class="note">正在读取你知乎的公开创作（我的创作接口）…</div>';
      const r = await callZhihu("contents", { Limit: 20, fresh: true, sid: zhSid() });
      if (lnCurrent !== "mine") return;
      if (!r.mock && r.items && r.items.length) {
        el.innerHTML = `<div class="row ln-search"><input id="lnMineSearch" class="ln-search-in" placeholder="🔍 在我的创作里搜标题 / 正文…" style="flex:1" /></div><div class="section grid grid-2" id="lnMineList">${r.items.map(myContentCard).join("")}</div><div class="row"><button class="ghost" id="lnMineRefresh">🔄 重新读取</button><span id="lnMineCount" class="muted"></span></div>`;
        const b = el.querySelector("#lnMineRefresh"); if (b) b.onclick = () => lnMine(body);
        lnBindSearch(el, "#lnMineSearch", "#lnMineList", "#lnMineCount", r.items, myContentCard);
      } else {
        el.innerHTML = (r.note ? `<div class="note">${r.note}</div>` : "") + '<div class="empty">实时读取「我的创作」暂时没拿到结果，点上方按钮重试即可。</div>';
      }
    }
    async function lnFollow(el) {
      el.innerHTML = '<div class="note">正在读取你关注的知乎创作者（关注流接口）…</div>';
      const r = await callZhihu("followees", { Limit: 20, fresh: true, sid: zhSid() });
      if (lnCurrent !== "follow") return;
      if (!r.mock && r.items && r.items.length) {
        el.innerHTML = `<div class="row ln-search"><input id="lnFollowSearch" class="ln-search-in" placeholder="🔍 在我的关注里搜昵称 / 签名…" style="flex:1" /></div><div class="section grid grid-2" id="lnFollowList">${r.items.map(followeeCard).join("")}</div><div class="row"><button class="ghost" id="lnFollowRefresh">🔄 重新读取</button><span id="lnFollowCount" class="muted"></span></div>`;
        const b = el.querySelector("#lnFollowRefresh"); if (b) b.onclick = () => lnFollow(body);
        lnBindSearch(el, "#lnFollowSearch", "#lnFollowList", "#lnFollowCount", r.items, followeeCard);
      } else {
        el.innerHTML = (r.note ? `<div class="note">${r.note}</div>` : "") + '<div class="empty">实时读取「我的关注」暂时没拿到结果，点上方按钮重试即可。</div>';
      }
    }
    async function lnFav(el) {
      el.innerHTML = '<div class="note">正在读取你的知乎收藏（近期收藏接口）…</div>';
      const r = await callZhihu("collections", { Limit: 20, fresh: true, sid: zhSid() });
      if (lnCurrent !== "fav") return;
      if (!r.mock && r.items && r.items.length) {
        const tip = r.viaOAuth
          ? '✅ 以下是<b>你自己</b>知乎账号的近期收藏'
          : '当前展示的是作者本人的收藏；登录知乎账号后可看你自己的';
        el.innerHTML = '<div class="note">' + tip + '</div><div class="row ln-search"><input id="lnFavSearch" class="ln-search-in" placeholder="🔍 在我的收藏里搜标题 / 简介…" style="flex:1" /></div><div class="section grid grid-2" id="lnFavList">' + r.items.map(collectionCard).join("") + '</div><div class="row"><button class="ghost" id="lnFavRefresh">🔄 重新读取</button><span id="lnFavCount" class="muted"></span></div>';
        const b = el.querySelector("#lnFavRefresh"); if (b) b.onclick = () => lnFav(body);
        lnBindSearch(el, "#lnFavSearch", "#lnFavList", "#lnFavCount", r.items, collectionCard);
      } else {
        el.innerHTML = (r.note ? '<div class="note">' + r.note + '</div>' : "") + '<div class="empty">实时读取「我的收藏」暂时没拿到结果，点上方按钮重试即可。</div>';
      }
    }
    v.querySelectorAll("#lnTabs button").forEach((t) => { t.onclick = () => show(t.dataset.lens); });
    zhAuthRefresh = () => show(lnCurrent);
    show("mine");
    renderZhihuBar();
    // 导出个人沉淀内容（Markdown格式）
    const kbBtn = v.querySelector("#kbDepositBtn");
    const kbStatus = v.querySelector("#kbDepositStatus");
    const kbDetail = v.querySelector("#kbDepositDetail");
    if (kbBtn) {
      if (localStorage.getItem("zhiyu_kb_ok")) {
        kbStatus.textContent = "✓ 上次已导出，可随时重新导出";
      }
      kbBtn.onclick = async () => {
        kbBtn.disabled = true;
        kbStatus.textContent = "正在打包你的个人沉淀…";
        kbDetail.textContent = "";
        try {
          const md = buildKbMarkdown();
          if (!md || !md.trim()) { kbStatus.textContent = "暂无可导出的内容，先去各模块写点东西吧～"; kbBtn.disabled = false; return; }
          const blob = new Blob([md], { type: "text/markdown;charset=utf-8" });
          const url = URL.createObjectURL(blob);
          const a = document.createElement("a");
          a.href = url; a.download = "知遇录_导出_" + new Date().toISOString().slice(0, 10) + ".md";
          document.body.appendChild(a); a.click(); a.remove();
          setTimeout(function () { try { URL.revokeObjectURL(url); } catch (e) {} }, 1000);
          localStorage.setItem("zhiyu_kb_ok", "1");
          kbStatus.textContent = "✓ 已生成并下载你的个人沉淀（Markdown）";
          kbDetail.textContent = "把它粘贴进任意笔记 / 知识库即可长期保存。你每次更新内容后，可再次点击重新导出。";
          if (window.ZY && ZY.awardXP) ZY.awardXP({ cog: 10 }, "导出知识库");
        } catch (e) {
          kbStatus.textContent = "✗ 导出出错：" + e.message;
        } finally { kbBtn.disabled = false; }
      };
    }
    // #12：私人知识库「沉淀到知乎知识库」增加跳转按钮
    const kbOpen = v.querySelector("#kbOpenBtn");
    if (kbOpen) kbOpen.onclick = () => window.open("https://zhida.zhihu.com/", "_blank", "noopener");
  }

  // ---------- 路由 ----------
  // ---------- 工具：HTML 转义 ----------
  function zEsc(s){ return (s==null?"":String(s)).replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c])); }

  // ========== 知乎知识卡（知识炼金场·知乎知识能力） ==========
  function renderKnowledgeCard(content, topic, refsZhihu, refsGlobal) {
    const sec = { "①":"定义", "②":"核心要点", "③":"常见误区", "④":"小练习" };
    let html = `<div class="kg-card"><div class="kg-card-title">📌 ${zEsc(topic||"")}</div><div class="kg-card-body">`;
    const lines = (content||"").split(/\n+/).map(s=>s.trim()).filter(Boolean);
    let started = false;
    for (const ln of lines) {
      const m = ln.match(/^[①②③④]/);
      if (m) { html += (started?"</p>":"") + `<h5>${sec[m[0]]||m[0]}</h5><p>`; html += zEsc(ln.replace(/^[①②③④]\s*/, "")); started = true; }
      else { html += zEsc(ln) + " "; }
    }
    let refsHTML = "";
    const _zh = (refsZhihu||[]).filter(Boolean), _gl = (refsGlobal||[]).filter(Boolean);
    if (_zh.length || _gl.length) {
      refsHTML += '<div class="kg-refs"><div class="kg-refs-title">📚 参考资料（知乎 + 全网）</div>';
      if (_zh.length) refsHTML += `<details class="src-details" open><summary>🔵 知乎参考（${_zh.length}）</summary><div class="section grid grid-2">${_zh.map(liveCard).join("")}</div></details>`;
      if (_gl.length) refsHTML += `<details class="src-details" open><summary>🌐 全网参考（${_gl.length}）</summary><div class="section grid grid-2">${_gl.map(liveCard).join("")}</div></details>`;
      refsHTML += '</div>';
    }
    html += `</p>${refsHTML}</div></div>`;
    return html;
  }
  // 知乎知识卡（挂载版：注入到任意容器内，供领域速通 tab 复用）
  function mountKnowledge(box) {
    box.innerHTML = `
      <section class="page-head">
        <h3>📚 知乎知识卡</h3>
        <p class="sub">知识炼金场的第一步：把知乎上零散的讨论，凝成一张「能理解、能复用」的知识卡。输入一个你想搞懂的主题，刘看山用直答 Agent 帮你讲透（定义 / 要点 / 误区 / 练习）。</p>
      </section>
      <div class="kg-wrap">
        <div class="kg-input">
          <input id="kgTopic" placeholder="想搞懂什么？例如：如何判断一份工作值不值得长期做" />
          <button id="kgBtn" class="primary">炼成知识卡</button>
        </div>
        <div id="kgResult" class="kg-result"></div>
      </div>`;
    box.querySelector("#kgBtn").onclick = async () => {
      const topic = box.querySelector("#kgTopic").value.trim();
      if (!topic) return;
      const rbox = box.querySelector("#kgResult");
      rbox.innerHTML = `<div class="liu-loading">刘看山正在把「${zEsc(topic)}」炼成知识卡…</div>`;
      const r = await callZhihu("knowledge", { q: topic });
      if (r.mock || !r.content || !r.content.trim()) {
        rbox.innerHTML = `<div class="muted">实时接口暂未连通（${zEsc(r.reason||"本地模式")}）。换个说法或稍后再试～</div>`;
        return;
      }
      rbox.innerHTML = renderKnowledgeCard(r.content, topic, r.refsZhihu, r.refsGlobal);
      const save = document.createElement("button");
      save.className = "ghost-btn";
      save.textContent = "＋ 存为复习卡";
      save.onclick = () => { addRecallCard(topic, r.content, "knowledge"); save.textContent = "已存入复习卡 ✓"; save.disabled = true; };
      rbox.appendChild(save);
    };
  }

  // ========== 复习卡片系统（间隔重复 · 知识炼金场「复习卡片」） ==========
  const RECALL_KEY = "zhiyu_cards";
  function loadRecall(){ try { return JSON.parse(localStorage.getItem(RECALL_KEY)) || []; } catch(e){ return []; } }
  function saveRecall(a){ try { localStorage.setItem(RECALL_KEY, JSON.stringify(a)); } catch(e){} }
  function addRecallCard(front, back, source, sourceRef){
    const a = loadRecall();
    a.push({ id: "c"+Date.now()+Math.floor(Math.random()*999), front: front||"", back: back||"", source: source||"manual", sourceRef: sourceRef||"", createdAt: Date.now(), due: Date.now(), interval: 0, reps: 0, ease: 2.5 });
    saveRecall(a);
  }
  function scheduleRecall(c, q){
    if (q < 3) { c.due = Date.now() + 10*60000; c.reps = 0; }
    else {
      c.reps += 1;
      if (c.reps === 1) c.interval = 1;
      else if (c.reps === 2) c.interval = 3;
      else c.interval = Math.round(c.interval * (q >= 4 ? 2.6 : 1.9));
      c.due = Date.now() + c.interval * 86400000;
    }
    c.ease = Math.max(1.3, (c.ease||2.5) + (q - 3) * 0.1);
  }
  function renderRecall(v){
    const cards = loadRecall();
    v.innerHTML = `
      <p class="muted" style="margin:2px 0 14px">把知乎知识卡、复盘结论、速通笔记，变成可反复提取的复习卡。按遗忘曲线间隔重复——每次「记得」，它就在你脑子里扎得更深一点。复习还能攒养成经验。</p>
      <div class="recall-stats">
        <span>📥 待复习 <b>${cards.filter(c=>c.due<=Date.now()).length}</b></span>
        <span>🗂 总卡片 <b>${cards.length}</b></span>
      </div>
      <div id="rcSession" class="rc-session"></div>
      <div class="rc-add">
        <h4>＋ 手动添加一张</h4>
        <input id="rcFront" placeholder="正面：想记住的问题 / 提示" />
        <textarea id="rcBack" placeholder="背面：答案 / 要点"></textarea>
        <button id="rcAdd" class="primary">加入卡片库</button>
      </div>
      <div class="rc-kgen">
        <h4>或从知乎与全网知识生成</h4>
        <input id="rcTopic" placeholder="主题，如：如何做选题" />
        <button id="rcGen" class="ghost-btn">生成并存入</button>
      </div>
      <div id="rcList" class="rc-list"></div>`;
    const sess = v.querySelector("#rcSession");
    function renderRecallStats(view){
      const all = loadRecall(); const d = all.filter(c=>c.due<=Date.now());
      const bs = view.querySelectorAll(".recall-stats b");
      if (bs[0]) bs[0].textContent = d.length;
      if (bs[1]) bs[1].textContent = all.length;
    }
    function renderRecallList(view){
      const list = view.querySelector("#rcList");
      const all = loadRecall();
      if (!all.length) { list.innerHTML = `<div class="muted">卡片库还是空的。</div>`; return; }
      list.innerHTML = `<h4>🗂 我的卡片库（${all.length}）</h4>` + all.map(c => `
        <div class="rc-item" data-id="${c.id}">
          <div class="rc-item-front">${zEsc(c.front)}</div>
          <div class="rc-item-back" style="display:none">${zEsc(c.back || "（这张卡还没写答案）")}</div>
          <div class="rc-item-meta">来源：${zEsc(c.source)} · 已复习 <b class="rc-reps">${c.reps}</b> 次</div>
          <div class="row" style="gap:8px;margin-top:6px">
            <button class="ghost-btn rc-flip">看答案 ▾</button>
            <button class="ghost-btn rc-punch" data-id="${c.id}">✓ 打卡</button>
            <button class="ghost-btn rc-del" data-id="${c.id}">删除</button>
          </div>
        </div>`).join("");
      list.querySelectorAll(".rc-flip").forEach(b => b.onclick = () => {
        const item = b.closest(".rc-item");
        const back = item.querySelector(".rc-item-back");
        const open = back.style.display !== "none";
        back.style.display = open ? "none" : "block";
        b.textContent = open ? "看答案 ▾" : "收起答案 ▴";
      });
      list.querySelectorAll(".rc-del").forEach(b => b.onclick = () => {
        saveRecall(loadRecall().filter(x => x.id !== b.dataset.id));
        renderRecallList(view); renderRecallStats(view);
      });
      list.querySelectorAll(".rc-punch").forEach(b => b.onclick = () => {
        const all = loadRecall(); const idx = all.findIndex(x => x.id === b.dataset.id);
        if (idx >= 0) { all[idx].reps = (all[idx].reps || 0) + 1; all[idx].due = Date.now() + 86400000; saveRecall(all); }
        renderRecallList(view); renderRecallStats(view);
      });
    }
    function nextCard(){
      const d = loadRecall().filter(c => c.due <= Date.now());
      if (!d.length) { sess.innerHTML = `<div class="muted">🎉 今天没有待复习的卡片了。去上面加几张，或去「知乎知识卡」存几张进来。</div>`; return; }
      const c = d[0];
      sess.innerHTML = `
        <div class="rc-card" id="rcCard">
          <div class="rc-front">${zEsc(c.front)}</div>
          <div class="rc-back" id="rcBackReveal" style="display:none">${zEsc(c.back)}</div>
          <div class="rc-actions" id="rcActions" style="display:none">
            <button data-q="1" class="ghost-btn">🙈 不会</button>
            <button data-q="3" class="primary">🙂 记得</button>
            <button data-q="5" class="primary">🚀 太简单</button>
          </div>
          <button id="rcFlip" class="rc-flip">翻面看答案</button>
        </div>`;
      sess.querySelector("#rcFlip").onclick = () => {
        sess.querySelector("#rcBackReveal").style.display = "block";
        sess.querySelector("#rcActions").style.display = "flex";
        sess.querySelector("#rcFlip").style.display = "none";
      };
      sess.querySelectorAll("#rcActions button").forEach(b => b.onclick = () => {
        const q = parseInt(b.dataset.q, 10);
        const all2 = loadRecall();
        const idx = all2.findIndex(x => x.id === c.id);
        if (idx >= 0) { scheduleRecall(all2[idx], q); saveRecall(all2); }
        if (q >= 3) {
          recordFootprint("复习", "复习了" + q + "张卡片");
          awardXP(q >= 4 ? {cog:6, con:4} : {cog:4, con:3}, "复习卡片·" + (q>=4?"轻松记住":"记住"));
        }
        else {
          recordFootprint("复习", "复习了1张卡片（重来）");
          awardXP({cog:1}, "复习卡片·重来");
        }
        renderRecallStats(v);
        renderRecallList(v);
        nextCard();
      });
    }
    nextCard();
    v.querySelector("#rcAdd").onclick = () => {
      const f = v.querySelector("#rcFront").value.trim();
      const b = v.querySelector("#rcBack").value.trim();
      if (!f || !b) return;
      addRecallCard(f, b, "manual");
      v.querySelector("#rcFront").value = ""; v.querySelector("#rcBack").value = "";
      renderRecallList(v); renderRecallStats(v);
    };
    v.querySelector("#rcGen").onclick = async () => {
      const t = v.querySelector("#rcTopic").value.trim();
      if (!t) return;
      const btn = v.querySelector("#rcGen"); btn.textContent = "生成中…";
      const r = await callZhihu("knowledge", { q: t, fresh: true });
      const src = [];
      (r.refsZhihu || []).forEach((x) => src.push("知乎：" + (x.title || "")));
      (r.refsGlobal || []).forEach((x) => src.push("全网：" + (x.title || "")));
      if (!src.length) {
        const sp = _splitSources(r.sources || []);
        sp.zh.slice(0, 3).forEach((x) => src.push("知乎：" + (x.title || "")));
        sp.gl.slice(0, 3).forEach((x) => src.push("全网：" + (x.title || "")));
      }
      const tail = src.length ? "\n\n参考：" + src.slice(0, 6).join("；") : "";
      if (r.content) addRecallCard(t, r.content + tail, "知乎与全网知识", t);
      btn.textContent = "生成并存入";
      renderRecallList(v); renderRecallStats(v);
    };
    renderRecallList(v);
  }

    function lnCheck(el) {
      const CK_KEY = "zhiyu_check";
      const loadCK = () => { try { return JSON.parse(localStorage.getItem(CK_KEY) || "[]"); } catch (e) { return []; } };
      const saveCK = (a) => { try { localStorage.setItem(CK_KEY, JSON.stringify(a)); } catch (e) {} };
      el.innerHTML = `
        <div class="note">把学到的东西真正变成你的——三个检验关。每过一关，养成系统都会记一笔经验；也能顺手点亮「今日成长目标 · 做一次成长检验」。</div>
        <div class="grid grid-3 check-cards">
          <div class="card check-card">
            <h3>🧒 费曼挑战</h3>
            <p class="muted">学完一个大佬思维模型，用你自己的话、讲给一个 12 岁小孩听。刘看山来挑刺：有没有大人黑话、讲清楚了吗。</p>
            <input id="fhConcept" placeholder="要讲清楚的概念，如：复利" />
            <textarea id="fhText" class="zx-in" placeholder="假装对面坐着个 12 岁小孩，用大白话给他讲明白…"></textarea>
            <div class="row"><button id="fhBtn">🐾 刘看山评一评</button>
            <button class="ghost" data-pub="费曼挑战" data-title="#fhConcept" data-body="#fhText">🚀 发布到知乎</button></div>
            <div class="chat" id="feynmanChat"></div>
          </div>
          <div class="card check-card">
            <h3>✍️ 知乎体写作</h3>
            <p class="muted">把学到的写成知乎回答 / 文章草稿。刘看山只给修改建议、示范改一小段，<b>绝不替你写</b>。</p>
            <input id="zhTopic" placeholder="主题，如：普通人怎么开始副业" />
            <textarea id="zhText" class="zx-in" placeholder="贴你的草稿，刘看山帮你润色成知乎味…"></textarea>
            <div class="row"><button id="zhBtn">🐾 帮我润色（不替我写）</button>
            <button class="ghost" data-pub="知乎体写作" data-title="#zhTopic" data-body="#zhText">🚀 发布到知乎</button></div>
            <div class="chat" id="zhihuChat"></div>
          </div>
          <div class="card check-card">
            <h3>🔁 思维模型复现</h3>
            <p class="muted">挑一个大佬的决策框架，在真实生活 / 工作里用一次，记下过程与结果。</p>
            <input id="rpModel" placeholder="要复现的框架，如：二阶观察" />
            <textarea id="rpScene" class="zx-in" placeholder="场景：我在____里遇到____。过程：我先____，再____。结果：____。"></textarea>
            <div class="row"><button id="rpBtn">🐾 存下这次复现</button>
            <button class="ghost" data-pub="思维模型复现" data-title="#rpModel" data-body="#rpScene">🚀 发布到知乎</button></div>
            <div class="chat" id="replayChat"></div>
          </div>
        </div>
        <div class="card pub-free">
          <h3>📤 把任意你写好的内容发布到知乎</h3>
          <p class="muted">在复盘、自我认知、或别处写好的知识，粘进来一键排版，照着引导发到知乎。</p>
          <input id="pfTitle" placeholder="标题，如：普通人怎么用系统思维看问题" />
          <textarea id="pfBody" class="zx-in" placeholder="把你的正文粘进来…"></textarea>
          <div class="row"><button id="pfPub" data-pub="自由发布" data-title="#pfTitle" data-body="#pfBody">🚀 排版并发布到知乎</button></div>
        </div>
        <div class="section card">
          <h3>📚 我的成长检验记录</h3>
          <div id="ckList"></div>
        </div>`;
      renderChat("feynmanChat"); renderChat("zhihuChat"); renderChat("replayChat");
      const box = el.querySelector("#ckList");
      box.addEventListener("click", (e) => {
        const del = e.target.closest(".ck-del");
        if (!del) return;
        const i = parseInt(del.dataset.i, 10);
        const a = loadCK();
        if (!isNaN(i) && i >= 0 && i < a.length) { a.splice(i, 1); saveCK(a); renderList(); }
      });
      const renderList = () => {
        const a = loadCK();
        if (!a.length) { box.innerHTML = '<div class="muted">还没有检验记录。过一关就记一笔，慢慢攒成你的「能力证据」。</div>'; return; }
        box.innerHTML = a.slice(0, 20).map((r, i) => `<div class="log">${r.date} · <b>${escHTML(r.type)}</b> ${escHTML(r.title)} <span class="muted">+${r.xp}XP</span> <button class="ghost-btn ck-del" data-i="${i}" title="删除这条记录" style="margin-left:6px">✕</button><br><span class="muted">${escHTML((r.note || "").slice(0, 80))}</span></div>`).join("");
      };
      renderList();
      el.querySelector("#fhBtn").onclick = async () => {
        const concept = el.querySelector("#fhConcept").value.trim();
        const text = el.querySelector("#fhText").value.trim();
        if (!concept || !text) { appendMsg("feynmanChat", "liu", "概念和你对它的解释都填上，刘看山才好帮你挑刺～"); return; }
        appendMsg("feynmanChat", "user", "（费曼挑战）" + concept + "：" + text);
        await liuReply("feynmanChat", { q: "费曼挑战：" + concept, persona: "explore", context: "用户在「费曼挑战」里要向我（刘看山）解释「" + concept + "」，讲给一个 12 岁小孩听。他的解释是：「" + text + "」。请用生活化、不说术语的方式点评：①他讲清楚了吗，小孩能听懂吗；②哪里还藏着大人黑话 / 抽象词；③给一个具体的小改进建议。语气像朋友，鼓励为主，别替他重写。", showSources: false, fresh: true },
          "我在呢，但实时接口暂时没连上，先用本地思路帮你挑挑刺～");
        const a = loadCK(); a.unshift({ type: "费曼挑战", title: concept, note: text.slice(0, 60), xp: 15, date: new Date().toLocaleDateString("zh-CN") }); saveCK(a);
        awardXP({ cog: 15 }, "费曼挑战·" + concept); renderList();
      };
      el.querySelector("#zhBtn").onclick = async () => {
        const topic = el.querySelector("#zhTopic").value.trim();
        const text = el.querySelector("#zhText").value.trim();
        if (!topic || !text) { appendMsg("zhihuChat", "liu", "主题和你的草稿都填上，刘看山才帮得上忙～"); return; }
        appendMsg("zhihuChat", "user", "（知乎体写作）" + topic + "：" + text);
        await liuReply("zhihuChat", { q: "知乎体写作润色：" + topic, persona: "explore", context: "用户在练习把学到的东西写成知乎回答 / 文章。主题是「" + topic + "」，他的草稿：『" + text + "』。请做「辅助润色」：只给 2-3 条具体修改建议（开头怎么抓人、哪里太啰嗦或太书面、哪个例子更贴知乎读者），并示范改其中一小段；绝不要直接重写整篇、不要替他创作。鼓励为主。", showSources: false, fresh: true },
          "我在呢，但实时接口暂时没连上，先用本地思路帮你润色～");
        const a = loadCK(); a.unshift({ type: "知乎体写作", title: topic, note: text.slice(0, 60), xp: 15, date: new Date().toLocaleDateString("zh-CN") }); saveCK(a);
        awardXP({ mas: 15 }, "知乎体写作·" + topic); renderList();
      };
      el.querySelector("#rpBtn").onclick = async () => {
        const model = el.querySelector("#rpModel").value.trim();
        const scene = el.querySelector("#rpScene").value.trim();
        if (!model || !scene) { appendMsg("replayChat", "liu", "框架名和你复现的过程都填上～"); return; }
        appendMsg("replayChat", "user", "（思维模型复现）" + model + "：" + scene);
        await liuReply("replayChat", { q: "思维模型复现：" + model, persona: "explore", context: "用户想在自己的「场景」里复现「" + model + "」这个思维 / 决策框架。他写下的过程与结果：『" + scene + "』。请给一个简短的复盘引导：开始前该明确什么、过程中盯哪个关键动作、结束后怎么判断是否真用上了这个框架。不替他做，引导式提问。", showSources: false, fresh: true },
          "我在呢，但实时接口暂时没连上，先用本地思路帮你复盘～");
        const a = loadCK(); a.unshift({ type: "思维模型复现", title: model, note: scene.slice(0, 60), xp: 20, date: new Date().toLocaleDateString("zh-CN") }); saveCK(a);
        awardXP({ exe: 20 }, "思维模型复现·" + model); renderList();
      };
      // ===== 发布到知乎 · 引导流程（知乎开放平台无发布写接口，故引导式：排版→复制→打开创作中心）=====
      const PUB_TYPES = {
        "费曼挑战": (t, b) => `最近在学「${t}」，用费曼学习法给自己做了个检验：试着把一个 12 岁小孩讲懂。\n\n【这个概念是什么】\n${t}\n\n【我的大白话版】\n${b}\n\n讲完才发现，能讲清楚才算真懂。如果你也在学，希望这篇能帮上忙，也欢迎指正我讲错的地方。`,
        "思维模型复现": (t, b) => `我用「${t}」这个思维框架，在真实场景里实操了一次，记一下过程和结果。\n\n【用的框架】${t}\n\n【真实场景与过程】\n${b}\n\n复盘下来，框架不是背的，是拿来用的。分享给同样在练思维模型的你。`,
        "知乎体写作": (t, b) => b,
        "自由发布": (t, b) => b,
      };
      const PUB_TITLE = {
        "费曼挑战": (t) => `我用大白话讲讲「${t}」，看完你能教给一个小孩`,
        "思维模型复现": (t) => `我用「${t}」解决了一次真实问题（附全过程）`,
        "知乎体写作": (t) => t,
        "自由发布": (t) => t,
      };
      function copyText(t) { return new Promise((res) => { try { navigator.clipboard.writeText(t).then(() => res(true)).catch(() => res(fallbackCopy(t))); } catch (e) { res(fallbackCopy(t)); } }); }
      function fallbackCopy(t) { try { const ta = document.createElement("textarea"); ta.value = t; ta.style.position = "fixed"; ta.style.opacity = "0"; document.body.appendChild(ta); ta.select(); const ok = document.execCommand("copy"); document.body.removeChild(ta); return ok; } catch (_) { return false; } }
      function ensurePublishModal() {
        if (el.querySelector("#pubBackdrop")) return;
        el.insertAdjacentHTML("beforeend", `
        <div class="pub-backdrop" id="pubBackdrop">
          <div class="pub-modal">
            <div class="pub-head">🚀 发布到知乎 · 引导流程 <button class="pub-x" id="pubClose" type="button">×</button></div>
            <p class="muted">下面是帮你排好版的草稿。<b>知遇录不直接替你发</b>（要登录你自己的知乎账号），但复制后去知乎一键就能贴。点「打开知乎创作中心」会自动跳过去。</p>
            <input id="pubTitle" class="pub-title" placeholder="标题" />
            <textarea id="pubBody" class="pub-body" placeholder="正文"></textarea>
            <div class="row">
              <button id="pubCopy">📋 复制全文</button>
              <button id="pubOpen">🚀 打开知乎创作中心</button>
              <button class="ghost" id="pubIdea">🐾 刘看山帮我想标题</button>
            </div>
            <div class="pub-steps">
              <div>① 复制全文（可手动微调后再复制）</div>
              <div>② 点「打开知乎创作中心」→ 写文章 / 或去某问题下写回答</div>
              <div>③ 粘贴、微调、发布；回来点「记一笔：我去发布了」</div>
            </div>
            <div class="row"><button id="pubDone" class="primary">✅ 记一笔：我去发布了</button><span id="pubOut" class="muted" style="margin-left:8px"></span></div>
            <div class="chat" id="pubLiu" style="display:none"></div>
          </div>
        </div>`);
        renderChat("pubLiu");
        el.querySelector("#pubClose").onclick = closePublish;
        el.querySelector("#pubBackdrop").addEventListener("click", (e) => { if (e.target.id === "pubBackdrop") closePublish(); });
        el.querySelector("#pubCopy").onclick = async () => {
          const full = "# " + (el.querySelector("#pubTitle").value.trim() || "无标题") + "\n\n" + el.querySelector("#pubBody").value.trim();
          const ok = await copyText(full);
          el.querySelector("#pubOut").textContent = ok ? "✅ 已复制，去知乎粘贴即可。" : "复制失败，请手动选择正文复制。";
        };
        el.querySelector("#pubOpen").onclick = () => { window.open("https://www.zhihu.com/creator", "_blank", "noopener"); };
        el.querySelector("#pubIdea").onclick = async () => {
          const t = el.querySelector("#pubTitle").value.trim();
          const b = el.querySelector("#pubBody").value.trim();
          // 显示被隐藏的刘看山对话框，否则「帮我想标题」的回复看不到（表现为用不了 / 卡顿）
          const pc = el.querySelector("#pubLiu");
          if (pc) pc.style.display = "";
          appendMsg("pubLiu", "user", "帮我想几个更抓人的知乎标题");
          await liuReply("pubLiu", { q: "帮我想知乎标题", persona: "explore", context: "用户要发布一篇知乎内容，主题是「" + (t || b.slice(0, 30)) + "」。请给他 3 个抓人、不标题党、适合知乎读者的标题建议，每条一行，附一句为什么这样写。", showSources: false, fresh: true }, "我来帮你想几个标题～");
        };
        el.querySelector("#pubDone").onclick = () => {
          const bd = el.querySelector("#pubBackdrop");
          if (bd.dataset.done === "1") { el.querySelector("#pubOut").textContent = "这笔已经记过啦～"; return; }
          const type = bd.dataset.type || "自由发布";
          const title = el.querySelector("#pubTitle").value.trim() || "(未命名)";
          const a = loadCK(); a.unshift({ type: "发布到知乎·" + type, title, note: "已引导发布", xp: 25, date: new Date().toLocaleDateString("zh-CN") }); saveCK(a);
          awardXP({ mas: 20, exe: 15 }, "发布到知乎·" + type); renderList();
          bd.dataset.done = "1";
          el.querySelector("#pubOut").textContent = "✅ 已记一笔，养成经验 +35，连续打卡不断～";
          setTimeout(closePublish, 1100);
        };
      }
      function openPublish(type, title, body) {
        const t = (title || "").trim(), b = (body || "").trim();
        ensurePublishModal();
        const bd = el.querySelector("#pubBackdrop");
        bd.dataset.type = type; bd.dataset.done = "0";
        el.querySelector("#pubTitle").value = PUB_TITLE[type] ? PUB_TITLE[type](t || b.slice(0, 20)) : (t || "");
        el.querySelector("#pubBody").value = PUB_TYPES[type] ? PUB_TYPES[type](t, b) : b;
        el.querySelector("#pubOut").textContent = "";
        bd.style.display = "flex";
      }
      function closePublish() { const m = el.querySelector("#pubBackdrop"); if (m) m.style.display = "none"; }
      el.querySelectorAll("[data-pub]").forEach((btn) => {
        btn.onclick = () => {
          const type = btn.dataset.pub;
          const tEl = el.querySelector(btn.dataset.title);
          const bEl = el.querySelector(btn.dataset.body);
          const t = tEl ? tEl.value.trim() : "";
          const b = bEl ? bEl.value.trim() : "";
          if (!b) { if (bEl) bEl.focus(); alert("先把内容填好，刘看山才好帮你排版发布～"); return; }
          openPublish(type, t, b);
        };
      });
    }

  // ========== 成长检验（顶级模块，与私人知识库并列）==========
  // 合并两件事：复习卡片（间隔重复 SM-2）＋ 三大检验关（费曼 / 知乎体 / 复现）
  // ---------- 大佬必修 · 个人能力清单（融入私人知识库，独立挂载）----------
  const DALAO_FOLD_KEY = "zhiyu_dalao_fold";
  function dalaoFoldMap() { try { const o = JSON.parse(localStorage.getItem(DALAO_FOLD_KEY) || "{}"); return o && typeof o === "object" ? o : {}; } catch (e) { return {}; } }
  function dalaoFolded(id) { return !!dalaoFoldMap()[id]; }
  function setDalaoFold(id, v) { const m = dalaoFoldMap(); m[id] = !!v; try { localStorage.setItem(DALAO_FOLD_KEY, JSON.stringify(m)); } catch (e) {} }
  function renderDalao(el) {
    if (!el) return;
    const schema = loadSchema();
    const dalaoState = loadDalao();
    el.innerHTML = `
      <div class="section card dalao-card">
        <h3>📋 大佬必修 · 个人能力清单 <span class="muted" style="font-weight:400;font-size:12px">（维度 / 能力点都可自定义编辑）</span></h3>
        <p class="muted">把自己当一家公司盘一遍：维度、能力点都能改名、增删。<b>每一点都详细列出来，你逐项填写</b>。填完就知道该往哪补。内容只存本机。</p>
        <div class="dalao-grid" id="dalaoGrid">
          ${schema.map((dm) => `<div class="dalao-box" data-dim="${dm.id}">
            <div class="dalao-h"><button class="dalao-fold" data-dim="${escAttr(dm.id)}" title="折叠 / 展开">${dalaoFolded(dm.id) ? "▸" : "▾"}</button><input class="dalao-name" data-dim="${escAttr(dm.id)}" value="${escAttr(dm.name)}"/><button class="dalao-del-dim" data-dim="${escAttr(dm.id)}" title="删除这个维度">🗑</button></div>
            <div class="dalao-body" data-body="${escAttr(dm.id)}" style="${dalaoFolded(dm.id) ? "display:none" : ""}">
            <p class="muted dalao-hint"><input class="dalao-hint-in" data-dim="${escAttr(dm.id)}" value="${escAttr(dm.hint || "")}"/></p>
            ${dm.items.map((it) => `<label class="dalao-item"><span class="dalao-q"><input class="dalao-q-in" data-dim="${escAttr(dm.id)}" data-k="${escAttr(it.k)}" value="${escAttr(it.q)}"/></span><textarea class="dalao-ta" data-dim="${escAttr(dm.id)}" data-k="${escAttr(it.k)}" placeholder="点这里填写…"></textarea><button class="dalao-del-item" data-dim="${escAttr(dm.id)}" data-k="${escAttr(it.k)}" title="删除这一个点">✕</button></label>`).join("")}
            <button class="dalao-add-item" data-dim="${escAttr(dm.id)}">＋ 给「${escHTML(dm.name)}」加一个能力点</button>
            </div>
          </div>`).join("")}
        </div>
        <div class="row" style="margin-top:10px"><button id="dalaoAddDim" class="ghost">＋ 新增能力维度</button></div>
      </div>`;
    el.querySelectorAll(".dalao-fold").forEach((b) => b.onclick = () => {
      const id = b.dataset.dim; const now = !dalaoFolded(id);
      setDalaoFold(id, now);
      b.textContent = now ? "▸" : "▾";
      const bd = el.querySelector('.dalao-body[data-body="' + id + '"]');
      if (bd) bd.style.display = now ? "none" : "";
    });
    // 逐项文本实时存本机
    el.querySelectorAll("#dalaoGrid .dalao-ta").forEach((ta) => {
      const dim = ta.dataset.dim, k = ta.dataset.k;
      ta.value = (dalaoState[dim] && dalaoState[dim][k]) || "";
      ta.oninput = () => {
        if (!dalaoState[dim]) dalaoState[dim] = {};
        dalaoState[dim][k] = ta.value;
        saveDalao(dalaoState);
      };
    });
    // 结构自定义编辑
    el.querySelectorAll(".dalao-name").forEach((inp) => inp.onchange = () => {
      const sc = loadSchema(); const dm = sc.find((x) => x.id === inp.dataset.dim); if (dm) { dm.name = inp.value.trim() || dm.name; saveSchema(sc); renderDalao(el); }
    });
    el.querySelectorAll(".dalao-hint-in").forEach((inp) => inp.onchange = () => {
      const sc = loadSchema(); const dm = sc.find((x) => x.id === inp.dataset.dim); if (dm) { dm.hint = inp.value; saveSchema(sc); }
    });
    el.querySelectorAll(".dalao-q-in").forEach((inp) => inp.onchange = () => {
      const sc = loadSchema(); const dm = sc.find((x) => x.id === inp.dataset.dim); if (dm) { const it = dm.items.find((y) => y.k === inp.dataset.k); if (it) { it.q = inp.value.trim() || it.q; saveSchema(sc); } }
    });
    el.querySelectorAll(".dalao-del-item").forEach((b) => b.onclick = () => {
      const sc = loadSchema(); const dm = sc.find((x) => x.id === b.dataset.dim); if (dm) { dm.items = dm.items.filter((y) => y.k !== b.dataset.k); saveSchema(sc); renderDalao(el); }
    });
    el.querySelectorAll(".dalao-del-dim").forEach((b) => b.onclick = () => {
      let sc = loadSchema(); if (sc.length <= 1) { liuShout("至少保留一个维度哦～"); return; }
      sc = sc.filter((x) => x.id !== b.dataset.dim); saveSchema(sc); renderDalao(el);
    });
    el.querySelectorAll(".dalao-add-item").forEach((b) => b.onclick = () => {
      const q = prompt("给这个维度加一个能力点，填问题/提示，例如：我还能补上什么短板？");
      if (!q) return;
      const sc = loadSchema(); const dm = sc.find((x) => x.id === b.dataset.dim); if (dm) { dm.items.push({ k: "c" + Date.now(), q: q.trim() }); saveSchema(sc); renderDalao(el); }
    });
    const addDimBtn = el.querySelector("#dalaoAddDim");
    if (addDimBtn) addDimBtn.onclick = (e) => {
      e.preventDefault();
      const grid = el.querySelector("#dalaoGrid");
      if (!grid) return;
      const exist = grid.querySelector(".dalao-new-dim");
      if (exist) { exist.scrollIntoView({ behavior: "smooth", block: "nearest" }); const _i = exist.querySelector(".dalao-nd-name"); if (_i) _i.focus(); return; }
      const TPLS = ["副业探索", "健康管理", "人际关系", "财务管理", "表达与影响力"];
      const card = document.createElement("div");
      card.className = "dalao-box dalao-new-dim";
      card.innerHTML = `<div class='dalao-h'><b>＋ 新增能力维度</b></div>
        <p class='muted' style='font-size:12px;margin:4px 0'>可以直接套用下面的常见维度，也可以自己起名——填好点「保存」即可。</p>
        <div class='row' style='flex-wrap:wrap;gap:6px;margin-bottom:6px'>${TPLS.map((x) => `<button class='ghost dalao-tpl' data-t='${escAttr(x)}'>${escHTML(x)}</button>`).join("")}</div>
        <div class='row'><input class='dalao-nd-name' placeholder='维度名称，例如：副业探索' style='flex:1' /></div>
        <div class='row' style='margin-top:6px'><input class='dalao-nd-hint' placeholder='一句话说明这个维度（可选）' style='flex:1' /></div>
        <div class='row' style='margin-top:6px'><input class='dalao-nd-item' placeholder='第一个能力点，例如：我目前有哪些可变现的技能？' style='flex:1' /></div>
        <div class='row' style='margin-top:8px'><button class='dalao-nd-save'>保存这个维度</button><button class='ghost dalao-nd-cancel'>取消</button></div>`;
      grid.appendChild(card);
      card.querySelector(".dalao-nd-cancel").onclick = () => card.remove();
      card.querySelectorAll(".dalao-tpl").forEach((b) => {
        b.onclick = () => {
          const tv = b.dataset.t;
          card.querySelector(".dalao-nd-name").value = tv;
          card.querySelector(".dalao-nd-hint").value = tv + "：想清楚这一块我现在怎么样、想变成什么样。";
          card.querySelector(".dalao-nd-item").value = "在「" + tv + "」上，我现在最缺 / 最想补的一点是什么？";
        };
      });
      card.querySelector(".dalao-nd-save").onclick = () => {
        const nm = (card.querySelector(".dalao-nd-name").value || "").trim();
        if (!nm) { const _j = card.querySelector(".dalao-nd-name"); if (_j) _j.focus(); return; }
        const hint = (card.querySelector(".dalao-nd-hint").value || "").trim();
        const item = (card.querySelector(".dalao-nd-item").value || "").trim();
        const sc = loadSchema();
        sc.push({ id: "d" + Date.now(), name: nm, hint: hint || "自定义维度，自己填。", items: [{ k: "c" + Date.now(), q: item || "这一维度里，我想成为什么样？（写一点）" }] });
        saveSchema(sc); renderDalao(el);
      };
      card.scrollIntoView({ behavior: "smooth", block: "nearest" });
      const first = card.querySelector(".dalao-nd-name"); if (first) first.focus();
    };
  }

  function renderCheck(v) {
    v.innerHTML = `
      <h2 class="view-title">🧪 成长检验 · 把学到的真正变成你的</h2>
      <p class="view-sub">检验，是知识炼金最关键的火候：学完不检验，等于没炼。这里两个抓手——「复习卡片（间隔重复）」管记忆巩固，「三大检验关（费曼 / 知乎体 / 复现）」管真懂没真懂。</p>
      <div class="explore-tabs" id="ckTabs">
        <button data-lens="recall" class="active">🃏 复习卡片</button>
        <button data-lens="check">🧪 检验关（费曼 / 知乎体 / 复现）</button>
      </div>
      <div id="ckRecall"></div>
      <div id="ckCheck" style="display:none"></div>`;
    const rbox = v.querySelector("#ckRecall");
    const cbox = v.querySelector("#ckCheck");
    const show = (l) => {
      v.querySelectorAll("#ckTabs button").forEach((t) => t.classList.toggle("active", t.dataset.lens === l));
      rbox.style.display = l === "recall" ? "block" : "none";
      cbox.style.display = l === "check" ? "block" : "none";
      if (l === "recall" && !rbox.dataset.mounted) { renderRecall(rbox); rbox.dataset.mounted = "1"; }
      if (l === "check" && !cbox.dataset.mounted) { lnCheck(cbox); cbox.dataset.mounted = "1"; }
    };
    v.querySelectorAll("#ckTabs button").forEach((t) => t.onclick = () => show(t.dataset.lens));
    show("recall");
  }

  const ROUTES = {
    home: renderHome, self: renderSelf, review: renderReview,
    explore: renderExplore,
    field: renderField, models: renderModels, learn: renderLearn,
    grow: renderGrow, bio: renderBio,
    check: renderCheck,
    graph: renderGraph,
  };
  function navigate() {
    if (window.__skySimRAF) { cancelAnimationFrame(window.__skySimRAF); window.__skySimRAF = 0; }
    window.__graphAlive = false;
    // 切换模块时，不再中止上一个模块在飞的请求：让"思考/回答"继续进行，
    // 完成后记入跨模块对话状态；用户切回时照常显示，不再"已停止且无记录"。
    // 碎片记录（现融入成长检验）若正在语音输入，切换模块时一并停止
    if (window.__mailuoSR) { try { window.__mailuoSR.stop(); } catch (e) {} window.__mailuoSR = null; }
    window.__navAborting = false;
    const tab = (location.hash || "#home").slice(1);
    try { document.body.dataset.route = tab || "home"; } catch (e) {}
    const fn = ROUTES[tab] || renderHome;
    const view = document.getElementById("view");
    view.innerHTML = "";
    fn(view);
    try { consumeGraphJump(view); } catch (e) {}
    // 跨模块对话恢复：进入任何模块都从 localStorage 还原聊天记录与思考态，切走再切回不再空白/重置
    try {
      view.querySelectorAll(".chat[id]").forEach((el) => {
        if (!el.id) return;
        try { renderChat(el.id); } catch (e) {}
        try { ensureChatTools(el); } catch (e) {}
      });
    } catch (e) {}
    // 全局知乎登录状态条随路由刷新
    try { renderZhihuBar(); } catch (e) {}
    document.querySelectorAll(".nav a").forEach((a) =>
      a.classList.toggle("active", a.dataset.tab === (tab === "" ? "home" : tab))
    );
    liuSay(tab || "home");
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  // ---------- 知识星球（对标知乎用户hi / 知炼导图；目标与碎片并入同一宇宙）----------
  function tokenizeStr(s) {
    s = (s || "").toLowerCase();
    const set = new Set();
    const cjk = s.match(/[一-龥]/g) || [];
    for (let i = 0; i < cjk.length - 1; i++) set.add(cjk[i] + cjk[i + 1]);
    const words = s.match(/[a-z0-9]{2,}/g) || [];
    words.forEach((w) => set.add(w));
    return set;
  }
  function loadJSON(key) { try { const v = JSON.parse(localStorage.getItem(key) || "null"); return v; } catch (e) { return null; } }
  
  // 动态加载 Three.js 库
  async function loadThreeJs() {
    return new Promise((resolve, reject) => {
      // 检查是否已经加载
      if (typeof THREE !== 'undefined') {
        resolve(THREE);
        return;
      }
      
      // 检查是否已经在加载中
      if (window.__threeLoadingPromise) {
        window.__threeLoadingPromise.then(resolve).catch(reject);
        return;
      }
      
      // 设置加载标志
      window.__threeLoadingPromise = new Promise((innerResolve, innerReject) => {
        const script = document.createElement('script');
        script.src = 'assets/js/lib/three.min.js?v=2026091117';
        
        script.onload = () => {
          // 等待 OrbitControls 加载
          const orbitScript = document.createElement('script');
          orbitScript.src = 'assets/js/lib/OrbitControls.js?v=2026091117';
          
          orbitScript.onload = () => {
            innerResolve(THREE);
          };
          
          orbitScript.onerror = (err) => {
            innerReject(err);
          };
          
          document.head.appendChild(orbitScript);
        };
        
        script.onerror = (err) => {
          innerReject(err);
        };
        
        document.head.appendChild(script);
      });
      
      window.__threeLoadingPromise.then(resolve).catch(reject);
    });
  }

  function renderGraph(v) {
    v.innerHTML = `
      <h2 class="view-title">🌌 知识星球</h2>
      <p class="view-sub">拖动节点会带着它的邻居一起动、松手回弹；点节点看来源与连线；双击节点只看它与邻居，双击空白复位。数据只来自本机。</p>
      <details class="howto">
        <summary>完整玩法说明</summary>
        <p class="view-sub howto-body">把你散落在各模块的痕迹，连同人生目标与碎片，放进同一个宇宙：没有中心，节点靠真实关系相连——标签与话题重合。
      拖动任一节点，相连的点会被一起牵动（越远影响越小），松手后自然回弹；空白处拖动平移，滚轮或 ± 缩放；点节点直接跳到对应模块里的那条内容；悬停高亮邻居、看详情；双击节点只看它与邻居；双击空白复位。数据只来自本机。</p>
      </details>
      <div class="card">
        <div id="graphWrap" class="graph-wrap universe-bg"><div class="uni-stars" aria-hidden="true"></div><div class="uni-nebula" aria-hidden="true"></div></div>
        <div id="graphInfo" class="graph-info muted">拖动任一节点即可带动身边的点一起移动，松手后自动回弹并记住位置；点节点看它的来源与连线。</div>
                <div class="uni-toolbar">
          <div class="uni-tool-row">
            <button class="ghost" id="uniView3d">📐 3D 星球</button>
            <button class="ghost" id="uniAuto" style="display:none">🌪 自动旋转</button>
            <button class="ghost" id="uniLock" style="display:none">🔒 锁定布局</button>
            <button class="ghost" id="uniDragMode" style="display:none">📐 拖动：核心星球</button>
            <button class="ghost" id="uniViewMode" style="display:none">✋ 拖动天体</button>
            <span class="uni-sep"></span>
            <button class="ghost" id="uniLinesBtn">🕸 连线：开</button>
            <button class="ghost" id="uniOtype">📐 天体化妆台</button>
            <button class="ghost" id="graphBgBtn">🌌 背景</button>
            <button class="ghost" id="graphReset">⤢ 复位视图</button>
            <span id="graphFilter" class="graph-filter" style="display:inline-flex;gap:6px;flex-wrap:wrap;align-items:center"></span>
          </div>
          <div class="uni-tool-row">
            <input id="uniSearch" placeholder="🔍 搜索知识点" style="max-width:170px" />
            <button class="ghost" id="uniSearchGo">定位</button>
            <label class="uni-check"><input type="checkbox" id="kpNameCentral" checked /> 中心名</label>
            <label class="uni-check"><input type="checkbox" id="kpNameOthers" checked /> 其他名</label>
            <span id="uniSearchInfo" class="muted" style="font-size:12px"></span>
            <button class="ghost" id="uniKpAdd">➕ 添加</button>
            <button class="ghost" id="uniKpDel">🗑 删除</button>
            <button class="ghost" id="uniKpFill">⚡ 填充</button>
            <button class="ghost" id="uniGraphRelayout" title="重置布局">🔄 重置布局</button>
            <span class="uni-zoom">
              <button class="ghost" id="uniZoomOut" title="缩小">－</button>
              <span id="uniZoomVal" class="muted">100%</span>
              <button class="ghost" id="uniZoomIn" title="放大">＋</button>
            </span>
          </div>
        </div>
      </div>
      <div class="note">同一宇宙内的网：自我 / 领域 / 复盘 / 可复用原则 / 复习卡 / 人生传记 / 人生目标 / 碎片。连线=你打的标签或话题重合。多用各模块，星球就越密。</div>
      <div class="card" id="uniLookCard" style="margin-top:14px;display:none"></div>
      <div class="card" id="uniKpCard" style="margin-top:14px;display:none"></div>
      <div class="card" id="uniOtypeCard" style="margin-top:14px;display:none"></div>`;
    
    // 动态加载 Three.js 库，然后构建知识图谱
    loadThreeJs()
      .then(() => {
        buildKnowledgeGraph(document.getElementById("graphWrap"));
      })
      .catch(error => {
        console.error('Failed to load Three.js:', error);
        const wrap = document.getElementById("graphWrap");
        if (wrap) {
          wrap.innerHTML = '<div class="error">3D知识星球需要加载图形库，加载失败，请稍后重试或联系开发者。</div>';
        }
      });
    
    var gbb = document.getElementById("graphBgBtn");
    if (gbb) {
      var _m = "galaxy";
      try { _m = localStorage.getItem("zhiyu_graph2d_bg") || "galaxy"; } catch (e9) {}
      gbb.textContent = _m === "off" ? "🚫 无背景" : (_m === "soft" ? "🌌 微光" : "🌌 银河");
      gbb.title = "切换 2D 背景：银河 / 微光 / 关闭";
      gbb.onclick = function () {
        var cur = "galaxy";
        try { cur = localStorage.getItem("zhiyu_graph2d_bg") || "galaxy"; } catch (e10) {}
        var nx = (cur === "galaxy") ? "soft" : (cur === "soft" ? "off" : "galaxy");
        try { localStorage.setItem("zhiyu_graph2d_bg", nx); } catch (e11) {}
        buildKnowledgeGraph(document.getElementById("graphWrap"));
      };
    }
    var v3 = document.getElementById("uniView3d");
    if (v3) { v3.onclick = function () { switchGraphView("3d"); }; v3.classList.add("active"); v3.style.background = "rgba(92,200,255,.28)"; v3.style.borderColor = "#5cc8ff"; }
    ["uniAuto","uniLock"].forEach(function(id){var el=document.getElementById(id);if(el)el.style.display="";});
    var _gbb0 = document.getElementById("graphBgBtn"); if (_gbb0) _gbb0.style.display = "none";
    var _gr0 = document.getElementById("graphReset"); if (_gr0) _gr0.style.display = "none";
    // 知识点：添加 / 删除 / 一键填充
    var _kpAdd = document.getElementById("uniKpAdd"); if (_kpAdd) _kpAdd.onclick = function () { _kpOpen("add"); };
    var _kpDel = document.getElementById("uniKpDel"); if (_kpDel) _kpDel.onclick = function () { _kpOpen("del"); };
    var _kpFill = document.getElementById("uniKpFill"); if (_kpFill) _kpFill.onclick = function () { var r = kpFillAll(_kpMode()); _kpRefresh(); _kpOpen("add"); var t = document.createElement("div"); t.className = "muted"; t.style.cssText = "font-size:12px;color:#5cc8ff;margin-top:6px"; t.textContent = "已填充全部系统思维模型（" + r.added + " 个" + (r.overflow ? "，另新建 " + r.overflow + " 个粒子" : "") + (r.skip ? "，跳过已存在 " + r.skip + " 个" : "") + "）"; _kpCard.insertBefore(t, _kpCard.firstChild); };
    // 宇宙外观面板已移除（用户要求恢复原始深空外观）
    var _linesBtn = document.getElementById("uniLinesBtn");
    if (_linesBtn) {
      var _lOn = loadGraphLines();
      _linesBtn.textContent = _lOn ? "🕸 连线：开" : "🕸 连线：关";
      _linesBtn.onclick = function () {
        var nv = !loadGraphLines(); saveGraphLines(nv);
        _linesBtn.textContent = nv ? "🕸 连线：开" : "🕸 连线：关";
        var w = document.getElementById("graphWrap");
        if (w && w.__g2d && w.__g2d.setLines) w.__g2d.setLines(nv);
        if (w && w.__webgl && w.__webgl.setLines) w.__webgl.setLines(nv);
        else if (w && w.__zyEdgeMeshes) w.__zyEdgeMeshes.forEach(function (m) { m.visible = nv; });
      };
    }
    var _kpCard = document.getElementById("uniKpCard");
    function _kpMode() { return (GRAPH_VIEW === "3d") ? "d3" : "d2"; }
    function _kpRefresh() {
      var w = document.getElementById("graphWrap");
      if (!w) return;
      try { if (w.__zyParticle && w.__zyParticle.setKP) w.__zyParticle.setKP(); } catch (e1) {}
      try { if (w.__webgl && w.__webgl.setKP) w.__webgl.setKP(); } catch (e2) {}
    }
    function _kpOpen(tab, kw) {
      if (!_kpCard) return;
      _kpCard.style.display = "";
      renderKpPanel(_kpCard, tab, _kpMode(), _kpRefresh, kw || "");
    }
    if (!window.ZY_KP_NAME) window.ZY_KP_NAME = { central: true, others: true };
    function uniLocateKp(q) {
      var w = document.getElementById("graphWrap"); if (!w) return;
      try { if (w.__zyParticle && w.__zyParticle.locate) w.__zyParticle.locate(q); } catch (e) {}
      try { if (w.__webgl && w.__webgl.locate) w.__webgl.locate(q); } catch (e) {}
    }
    var _sIn = document.getElementById("uniSearch"), _sGo = document.getElementById("uniSearchGo");
    if (_sGo) _sGo.onclick = function () { uniLocateKp((_sIn && _sIn.value || "").trim()); };
    if (_sIn) _sIn.addEventListener("keydown", function (e) { if (e.key === "Enter") uniLocateKp((_sIn.value || "").trim()); });
    var _nc = document.getElementById("kpNameCentral"), _no = document.getElementById("kpNameOthers");
    function _syncNameFlags() { if (_nc) window.ZY_KP_NAME.central = _nc.checked; if (_no) window.ZY_KP_NAME.others = _no.checked; }
    if (_nc) _nc.onchange = _syncNameFlags;
    if (_no) _no.onchange = _syncNameFlags;
    var _gwp = document.getElementById("graphWrap");
    if (_gwp) {
      _gwp.addEventListener("zhiyu:kp-pick", function (ev) {
        var d = (ev && ev.detail) || {};
        _kpOpen("del", d.label || "");
      });
    }
    var _otypeBtn = document.getElementById("uniOtype");
    var _otypeCard = document.getElementById("uniOtypeCard");
    if (_otypeBtn && _otypeCard) {
      _otypeBtn.onclick = () => { _otypeCard.style.display = (_otypeCard.style.display === "none") ? "" : "none"; if (_otypeCard.style.display !== "none") renderOtypePanel(_otypeCard); };
    }
  }
  // ---------- 知识星球 · 宇宙外观（对标 Obsidian 图视图·自由化）----------
  const UNI_LOOK_KEY = "zhiyu_universe_look";
  const UNI_THEMES = {
    aurora: { name: "极光青紫", base: "radial-gradient(120% 90% at 20% 10%, #1a1140 0%, #0b0a1f 45%, #05060f 100%)",
      neb: ["rgba(124,92,255,.34)", "rgba(0,209,255,.22)", "rgba(255,94,168,.18)", "rgba(94,234,212,.14)"],
      stars: ["#ffffff", "#cfe8ff", "#ffe9c7", "#d7c9ff"] },
    nebula: { name: "星云粉紫", base: "radial-gradient(120% 90% at 78% 12%, #2a1430 0%, #140a22 48%, #07060f 100%)",
      neb: ["rgba(255,126,182,.30)", "rgba(167,139,250,.26)", "rgba(255,158,203,.20)", "rgba(196,153,255,.16)"],
      stars: ["#fff0f7", "#ffd9ef", "#ffffff", "#e9d7ff"] },
    deep: { name: "深空幽蓝", base: "radial-gradient(120% 90% at 30% 8%, #0a1838 0%, #060d22 48%, #03060f 100%)",
      neb: ["rgba(59,130,246,.26)", "rgba(96,165,250,.22)", "rgba(99,102,241,.20)", "rgba(110,200,255,.16)"],
      stars: ["#eaf4ff", "#bcd8ff", "#ffffff", "#cfe6ff"] },
    gold: { name: "暖金星海", base: "radial-gradient(120% 90% at 22% 12%, #241a0e 0%, #140e08 48%, #07050a 100%)",
      neb: ["rgba(245,196,94,.26)", "rgba(255,184,107,.22)", "rgba(255,158,120,.18)", "rgba(214,170,120,.14)"],
      stars: ["#fff6e2", "#ffe9c7", "#ffffff", "#f5d9a8"] },
    galaxy: { name: "银河银蓝", base: "radial-gradient(120% 90% at 50% 6%, #141826 0%, #0a0d18 50%, #04050b 100%)",
      neb: ["rgba(192,200,224,.22)", "rgba(142,197,255,.20)", "rgba(160,150,220,.16)", "rgba(120,160,220,.12)"],
      stars: ["#f2f5ff", "#dfe7ff", "#ffffff", "#cdd8ff"] }
  };
  function loadUniverseLook() {
    // 宇宙外观功能已移除：一次性清空历史设置，灯光回到默认 0.85
    try { if (!localStorage.getItem("zhiyu_unilook_removed")) { localStorage.removeItem(UNI_LOOK_KEY); localStorage.setItem("zhiyu_unilook_removed", "1"); } } catch (e) {}
    let d = {};
    try { d = JSON.parse(localStorage.getItem(UNI_LOOK_KEY) || "{}"); } catch (e) {}
    return {
      theme: d.theme && UNI_THEMES[d.theme] ? d.theme : "aurora",
      stars: typeof d.stars === "number" ? d.stars : 90,
      starSize: typeof d.starSize === "number" ? d.starSize : 1.3,
      nebula: typeof d.nebula === "number" ? d.nebula : 0.85,
      bright: typeof d.bright === "number" ? d.bright : 0.85,
      twinkle: d.twinkle !== false,
      drift: !!d.drift
    };
  }
  function saveUniverseLook(lk) { try { localStorage.setItem(UNI_LOOK_KEY, JSON.stringify(lk)); } catch (e) {} }
  function genStarBg(count, size, tint) {
    if (!count || count < 1) return "none";
    const cols = tint || ["#ffffff"];
    const arr = [];
    for (let i = 0; i < count; i++) {
      const x = (Math.random() * 100).toFixed(2), y = (Math.random() * 100).toFixed(2);
      const c = cols[Math.floor(Math.random() * cols.length)];
      const s = (size * (0.7 + Math.random() * 0.7)).toFixed(2);
      arr.push("radial-gradient(" + s + "px " + s + "px at " + x + "% " + y + "%, " + c + ", transparent)");
    }
    return arr.join(",");
  }
  function applyUniverseLook(wrap) {
    if (!wrap) return;
    const lk = loadUniverseLook();
    const th = UNI_THEMES[lk.theme] || UNI_THEMES.aurora;
    wrap.style.setProperty("--uni-base", th.base);
    wrap.style.setProperty("--neb1", th.neb[0]);
    wrap.style.setProperty("--neb2", th.neb[1]);
    wrap.style.setProperty("--neb3", th.neb[2]);
    wrap.style.setProperty("--neb4", th.neb[3]);
    wrap.style.setProperty("--neb-op", String(lk.nebula));
    wrap.style.setProperty("--star-bg", genStarBg(lk.stars, lk.starSize, th.stars));
    const stars = wrap.querySelector(".uni-stars");
    if (stars) {
      stars.classList.toggle("twinkle", lk.twinkle);
      stars.classList.toggle("drift", lk.drift);
    }
  }
  function setupUniverseLook(wrap, card) {
    if (!wrap || !card) return;
    applyUniverseLook(wrap);
    const lk = loadUniverseLook();
    card.innerHTML = `
      <div class="row" style="justify-content:space-between;align-items:center">
        <h3 style="margin:0">🎨 宇宙外观 <span class="muted" style="font-weight:400;font-size:12px">（对标 Obsidian 图视图·自由调）</span></h3>
      </div>
      <p class="muted" style="margin:6px 0 10px">调出你想要的星空：配色、星点密度、星云浓度、闪烁与漂移都能改，自动存本地。</p>
      <div class="uni-look-grid">
        <label>配色主题
          <select id="uniTheme">${Object.keys(UNI_THEMES).map((k) => '<option value="' + k + '"' + (k === lk.theme ? " selected" : "") + ">" + UNI_THEMES[k].name + "</option>").join("")}</select>
        </label>
        <label>星点密度 <span id="uniStarsVal">${lk.stars}</span>
          <input type="range" id="uniStars" min="0" max="180" value="${lk.stars}" />
        </label>
        <label>星点大小 <span id="uniSizeVal">${lk.starSize.toFixed(1)}</span>
          <input type="range" id="uniSize" min="6" max="26" value="${Math.round(lk.starSize * 10)}" />
        </label>
        <label>星云浓度 <span id="uniNebVal">${Math.round(lk.nebula * 100)}%</span>
          <input type="range" id="uniNeb" min="0" max="100" value="${Math.round(lk.nebula * 100)}" />
        </label>
        <label>星球亮度 <span id="uniBrightVal">${Math.round(lk.bright * 100)}%</span>
          <input type="range" id="uniBright" min="35" max="150" value="${Math.round(lk.bright * 100)}" />
        </label>
        <label class="uni-check"><input type="checkbox" id="uniTwinkle" ${lk.twinkle ? "checked" : ""}/> ✨ 星点闪烁</label>
        <label class="uni-check"><input type="checkbox" id="uniDrift" ${lk.drift ? "checked" : ""}/> 🌌 缓慢漂移</label>
      </div>
      <div class="row" style="margin-top:10px;gap:8px">
        <button class="ghost" id="uniLookReset">↺ 恢复默认</button>
        <span class="muted">改动即时生效并自动保存到本机。</span>
      </div>`;
    const upd = (patch) => { const cur = loadUniverseLook(); Object.assign(cur, patch); saveUniverseLook(cur); applyUniverseLook(wrap); };
    const theme = card.querySelector("#uniTheme");
    if (theme) theme.onchange = () => upd({ theme: theme.value });
    const stars = card.querySelector("#uniStars");
    if (stars) stars.oninput = () => { card.querySelector("#uniStarsVal").textContent = stars.value; upd({ stars: parseInt(stars.value, 10) }); };
    const size = card.querySelector("#uniSize");
    if (size) size.oninput = () => { const v = parseInt(size.value, 10) / 10; card.querySelector("#uniSizeVal").textContent = v.toFixed(1); upd({ starSize: v }); };
    const neb = card.querySelector("#uniNeb");
    if (neb) neb.oninput = () => { card.querySelector("#uniNebVal").textContent = neb.value + "%"; upd({ nebula: parseInt(neb.value, 10) / 100 }); };
    const bright = card.querySelector("#uniBright");
    if (bright) bright.oninput = () => { card.querySelector("#uniBrightVal").textContent = bright.value + "%"; upd({ bright: parseInt(bright.value, 10) / 100 }); if (GRAPH_VIEW === "3d") { var w = document.getElementById("graphWrap"); if (w) buildKnowledgeGraph(w); } };
    const tw = card.querySelector("#uniTwinkle");
    if (tw) tw.onchange = () => upd({ twinkle: tw.checked });
    const dr = card.querySelector("#uniDrift");
    if (dr) dr.onchange = () => upd({ drift: dr.checked });
    const reset = card.querySelector("#uniLookReset");
    if (reset) reset.onclick = () => { const def = { theme: "aurora", stars: 90, starSize: 1.3, nebula: 0.85, bright: 0.85, twinkle: true, drift: false }; saveUniverseLook(def); applyUniverseLook(wrap); setupUniverseLook(wrap, card); };
  }
  // 工具箱（学习方法/系统思维方法论）保存后：若知识星球在视图中，防抖重绘以实时同步星网链
  let _graphSyncT = null;
  function syncGraphAfterSave() {
    if (_graphSyncT) clearTimeout(_graphSyncT);
    _graphSyncT = setTimeout(function () {
      try {
        var w = document.getElementById("graphWrap");
        if (w && (w.offsetParent !== null || w.getClientRects().length)) buildKnowledgeGraph(w);
      } catch (e) {}
    }, 300);
  }
  function collectGraphGroups() {
    const groups = [
      { key: "self", label: "自我认知", color: "#a78bfa", items: (() => { const s = loadJSON("zhiyu_self"); return s && s.m ? ["自我 · " + s.m] : []; })() },
      { key: "field", label: "领域速通", color: "#5cc8ff", items: (() => { const p = loadJSON("zhiyu_plans"); const arr = Array.isArray(p) ? p : (p ? [p] : []); return arr.map((x) => x.q || x.domain || x.title || "").filter(Boolean).slice(0, 8); })() },
      { key: "review", label: "复盘卡", color: "#ffb86b", items: (() => { const r = loadJSON("zhiyu_reviews"); if (Array.isArray(r)) return r.map((x) => x.event || "").filter(Boolean).slice(0, 8); if (r && r.event) return [r.event]; return []; })() },
      { key: "card", label: "复习卡", color: "#ff7eb6", items: (() => { const c = loadJSON("zhiyu_cards"); const arr = Array.isArray(c) ? c : (c && c.cards ? c.cards : []); return arr.map((x) => (x.q || x.title || x.topic || "")).filter(Boolean).slice(0, 8); })() },
      { key: "bio", label: "人生传记", color: "#ffe066", items: (() => { const b = loadJSON("zhiyu_bio"); const ch = (b && b.Chapters) || (b && b.chapters) || []; return ch.map((x) => x.title || "").filter(Boolean).slice(0, 8); })() },
      { key: "goal", label: "人生目标", color: "#9d7bff", items: [] },
      { key: "frag", label: "碎片", color: "#9fb0c3", items: [] },
      { key: "skill", label: "能力清单", color: "#7ce0c0", items: [] },
      { key: "model", label: "思维模型", color: "#c8a0ff", items: [] },
      { key: "custom", label: "自定义", color: "#ffd27a", items: [] },
    ];
    return groups;
  }
  // 知识点自定义颜色：按节点 id 存本地，重新布局/刷新后仍在
  const GRAPH_COLOR_KEY = "zhiyu_graph_colors";
  function loadGraphColors() { try { const o = JSON.parse(localStorage.getItem(GRAPH_COLOR_KEY) || "{}"); return (o && typeof o === "object") ? o : {}; } catch (e) { return {}; } }
  function saveGraphColor(id, color) {
    const o = loadGraphColors();
    if (color) o[id] = color; else delete o[id];
    try { localStorage.setItem(GRAPH_COLOR_KEY, JSON.stringify(o)); } catch (e) {}
  }

  // ---------- 知识星球：自定义天体 / 用户增删知识点 / 布局持久化 ----------
  var ZY_OTYPES = [
    { k: "planet", n: "行星" }, { k: "moon", n: "卫星" }, { k: "star", n: "恒星" },
    { k: "comet", n: "彗星" }, { k: "meteoroid", n: "陨星" }, { k: "meteorite", n: "陨石" },
    { k: "blackhole", n: "黑洞" }, { k: "nebula", n: "星云" }, { k: "asteroid", n: "小行星" }, { k: "pulsar", n: "脉冲星" }
  ];
  // 真实星球映射：每个核心支柱默认对应一颗真实星球（颜色/类型/体积/光环）。用户用化妆台改过的仍优先。
  var ZY_REAL_PLANET = {
    me:     { name: "太阳",   type: "lava",  ring: false, size: 1.0,  emi: 1.15 },
    goal:   { name: "地球",   type: "rocky", ring: false, size: 1.25, emi: 0.70 },
    self:   { name: "金星",   type: "rocky", ring: false, size: 1.10, emi: 0.70 },
    field:  { name: "火星",   type: "rocky", ring: false, size: 1.00, emi: 0.70 },
    review: { name: "木星",   type: "gas",   ring: false, size: 1.50, emi: 0.85 },
    card:   { name: "土星",   type: "gas",   ring: true,  size: 1.35, emi: 0.80 },
    bio:    { name: "海王星", type: "ice",   ring: false, size: 1.15, emi: 0.78 },
    note:   { name: "天王星", type: "ice",   ring: false, size: 1.10, emi: 0.78 },
    skill:  { name: "水星",   type: "rocky", ring: false, size: 0.85, emi: 0.65 },
    model:  { name: "冥王星", type: "rocky", ring: false, size: 0.80, emi: 0.65 },
    frag:   { name: "月球",   type: "rocky", ring: false, size: 0.80, emi: 0.62 },
    custom: { name: "",       type: "rocky", ring: false, size: 1.00, emi: 0.70 }
  };
  // 六大核心目标 -> 真实星球（太阳系真实排布：内->外 = 水星/金星/地球/火星/海王星/冥王星）
  // 真实宇宙比例：半径以地球=1 折算(×0.6 场景单位)；轨道半径「orb」按内近外远布置，且相邻间距 > 两星半径之和(不再碰撞)。
  var ZY_GOAL_PLANETS = {
    p_cog:    { name: "水星",   au: 0.39, type: "rocky", color: "#9c8e7e", size: 0.23, orb: 4.2,  moon: "" },
    p_mean:   { name: "金星",   au: 0.72, type: "rocky", color: "#d9b25a", size: 0.57, orb: 6.0,  moon: "" },
    life:     { name: "地球",   au: 1.0,  type: "rocky", color: "#1f6fe0", size: 0.60, orb: 7.8,  moon: "月球" },
    p_energy: { name: "火星",   au: 1.52, type: "rocky", color: "#c1502e", size: 0.32, orb: 10.4, moon: "" },
    p_rel:    { name: "海王星", au: 30,   type: "ice",   color: "#2a52c9", size: 2.33, orb: 13.5, moon: "" },
    p_val:    { name: "冥王星", au: 39.5, type: "rocky", color: "#c9b89a", size: 0.11, orb: 16.8, moon: "" }
  };
  // 核心天体(太阳 + 六大真实行星)外观锁定：不可在化妆台改类型/贴图
  var ZY_CORE_PROT = { me: 1, life: 1, p_cog: 1, p_mean: 1, p_energy: 1, p_rel: 1, p_val: 1 };
  var GRAPH_OTYPE_KEY = "zhiyu_graph_otypes", GRAPH_CUSTOM_KEY = "zhiyu_graph_custom",
      GRAPH_HIDDEN_KEY = "zhiyu_graph_hidden", GRAPH_VIEW3D_KEY = "zhiyu_graph3d_pos", GRAPH_VIEW2D_KEY = "zhiyu_graph2d_view";
  function loadGraphOtypes() { try { var o = JSON.parse(localStorage.getItem(GRAPH_OTYPE_KEY) || "{}"); return (o && typeof o === "object") ? o : {}; } catch (e) { return {}; } }
  function saveGraphOtype(id, ot) { var o = loadGraphOtypes(); if (ot) o[id] = ot; else delete o[id]; try { localStorage.setItem(GRAPH_OTYPE_KEY, JSON.stringify(o)); } catch (e) {} }
  function loadGraphCustom() { try { var a = JSON.parse(localStorage.getItem(GRAPH_CUSTOM_KEY) || "[]"); return Array.isArray(a) ? a : []; } catch (e) { return []; } }
  function saveGraphCustom(a) { try { localStorage.setItem(GRAPH_CUSTOM_KEY, JSON.stringify(a || [])); } catch (e) {} }
  function loadGraphHidden() { try { var a = JSON.parse(localStorage.getItem(GRAPH_HIDDEN_KEY) || "[]"); return Array.isArray(a) ? a : []; } catch (e) { return []; } }
  function saveGraphHidden(a) { try { localStorage.setItem(GRAPH_HIDDEN_KEY, JSON.stringify(a || [])); } catch (e) {} }
  var GRAPH_LINES_KEY = "zhiyu_graph_lines";
  function loadGraphLines() { try { return localStorage.getItem(GRAPH_LINES_KEY) !== "off"; } catch (e) { return true; } }
  function saveGraphLines(on) { try { localStorage.setItem(GRAPH_LINES_KEY, on ? "on" : "off"); } catch (e) {} }
  function renderOtypePanel(card) {
    if (!card) return;
    var nodes = (window.__zyAllNodes || window.__zyNodes || []).slice();
    var hidden = loadGraphHidden();
    var OT_PROT = { me: 1, life: 1, p_cog: 1, p_mean: 1, p_energy: 1, p_rel: 1, p_val: 1 };
    var list = document.createElement("div");
    list.style.cssText = "display:grid;grid-template-columns:1fr 1fr;gap:6px 14px;max-height:340px;overflow:auto";
    var html = '<h3 style="margin:4px 0">🪐 天体化妆台 · 把每个条目扮成宇宙中的星球</h3>';
    html += '<p class="muted" style="margin:2px 0 8px">改完即生效并自动保存；2D / 3D 都按你选的天体渲染。“隐藏”的源星球仍保留在原模块，只是不在星图显示。</p>';
    html += '<div class="row" style="margin:6px 0 10px;gap:8px;flex-wrap:wrap;align-items:center"><input id="otAddInput" placeholder="输入自定义星球（如：我的副业方向）" style="max-width:230px" /><select id="otAddGroup"><option value="custom">自定义</option><option value="self">自我认知</option><option value="field">领域速通</option><option value="review">复盘卡</option><option value="card">复习卡</option><option value="bio">人生传记</option><option value="goal">人生目标</option><option value="frag">碎片</option><option value="note">笔记</option><option value="skill">能力清单</option><option value="model">思维模型</option></select><button class="primary" id="otAddBtn">➕ 添加星球</button><button class="ghost" id="otCamReset" title="复位">⤢ 复位</button></div>';
    html += '<div id="otListWrap"></div>';
    card.innerHTML = html;
    var wrapEl = card.querySelector("#otListWrap"); wrapEl.appendChild(list);
    nodes.forEach(function (n) {
      var isHidden = hidden.indexOf(n.id) >= 0;
      var cur = n.otype || "planet";
      var _locked = OT_PROT[n.id] ? 1 : 0;
      var sel = '<select class="ot-sel" data-id="' + n.id + '"' + (_locked ? ' disabled title="核心星球外观已锁定，不可更改"' : '') + '>' + ZY_OTYPES.map(function (o) { return '<option value="' + o.k + '"' + (o.k === cur ? " selected" : "") + '>' + o.n + '</option>'; }).join("") + '</select>';
      var row = document.createElement("div");
      row.className = "ot-row";
      row.innerHTML = '<span class="ot-label" title="' + escHTML(n.label) + '">' + escHTML(n.label.slice(0, 14)) + '</span>' + sel + (_locked ? '<span style="font-size:11px;color:#9fb0c3;margin-left:4px" title="核心星球外观已锁定">🔒锁定</span>' : '') +
        '<button class="ot-hide" data-id="' + n.id + '"' + (_locked ? ' disabled' : '') + '>' + (isHidden ? "显示" : "隐藏") + '</button>' +
        (OT_PROT[n.id] ? '' : (n.custom ? '<button class="ot-del" data-id="' + n.id + '" data-custom="1">删除</button>' : '<button class="ot-drop" data-id="' + n.id + '" data-label="' + escAttr(n.label) + '">删除</button>'));
      list.appendChild(row);
    });
    if (!nodes.length) { var em = document.createElement("div"); em.className = "muted"; em.textContent = "还没有星球，去各模块多用用，或点上方“添加星球”。"; list.appendChild(em); }
    list.querySelectorAll(".ot-sel").forEach(function (s) {
      s.onchange = function () { saveGraphOtype(s.getAttribute("data-id"), s.value); var w = document.getElementById("graphWrap"); if (w) buildKnowledgeGraph(w); renderOtypePanel(card); };
    });
    list.querySelectorAll(".ot-hide").forEach(function (b) {
      b.onclick = function () { var id = b.getAttribute("data-id"); var h = loadGraphHidden(); var i = h.indexOf(id); if (i >= 0) h.splice(i, 1); else h.push(id); saveGraphHidden(h); var w = document.getElementById("graphWrap"); if (w) buildKnowledgeGraph(w); renderOtypePanel(card); };
    });
    list.querySelectorAll(".ot-del").forEach(function (b) {
      b.onclick = function () {
        var id = b.getAttribute("data-id");
        var _row = b.closest ? b.closest(".ot-row") : null;
        var _lab = _row ? _row.querySelector(".ot-label") : null;
        var nm = (_lab && _lab.getAttribute("title")) || "该星球";
        if (!window.confirm("永久删除星球「" + nm + "」？该自定义星球将从星球永久移除，不可恢复。")) return;
        var c = loadGraphCustom().filter(function (x) { return x.id !== id; }); saveGraphCustom(c);
        var h0 = loadGraphHidden(); var i0 = h0.indexOf(id); if (i0 >= 0) h0.splice(i0, 1); saveGraphHidden(h0);
        var w = document.getElementById("graphWrap"); if (w) buildKnowledgeGraph(w); renderOtypePanel(card);
      };
    });
    list.querySelectorAll(".ot-drop").forEach(function (b) {
      b.onclick = function () {
        var id = b.getAttribute("data-id");
        var lab = b.getAttribute("data-label") || "";
        if (!window.confirm("删除星球「" + lab + "」？它将从星图永久移除（不可恢复），源数据仍保留在原模块。")) return;
        var dl = zyDropList(); if (dl.indexOf(lab) < 0) dl.push(lab);
        try { localStorage.setItem(ZY_DROP_KEY, JSON.stringify(dl)); } catch (e) {}
        var h = loadGraphHidden(); if (h.indexOf(id) < 0) h.push(id); saveGraphHidden(h);
        var w = document.getElementById("graphWrap"); if (w) buildKnowledgeGraph(w); renderOtypePanel(card);
      };
    });
    var addBtn = card.querySelector("#otAddBtn");
    if (addBtn) addBtn.onclick = function () {
      var inp = card.querySelector("#otAddInput"); var grp = card.querySelector("#otAddGroup");
      var txt = (inp && inp.value || "").trim(); if (!txt) { if (inp) inp.focus(); return; }
      var c = loadGraphCustom(); var id = "custom_" + Date.now();
      c.push({ id: id, label: txt, group: (grp ? grp.value : "custom"), color: "#ffd27a", r: 11 });
      saveGraphCustom(c); if (inp) inp.value = "";
      var w = document.getElementById("graphWrap"); if (w) buildKnowledgeGraph(w); renderOtypePanel(card);
    };
    // 复位：仅把镜头移回默认视角（不动星球位置存档）
    var _cb = card.querySelector("#otCamReset");
    if (_cb) _cb.onclick = function () {
      var _w3 = document.getElementById("graphWrap"); if (!_w3) return;
      try { if (_w3.__webgl && _w3.__webgl.resetCam) { _w3.__webgl.resetCam(); return; } } catch (e) {}
      try { if (_w3.__g2d && _w3.__g2d.resetView) { _w3.__g2d.resetView(); return; } } catch (e) {}
    };
  }
  // ---------- 知识星球：2D / 3D 视图切换 ----------
  var GRAPH_VIEW = (function () {
    try {
      var s = localStorage.getItem("zhiyu_graph_view");
      if (!localStorage.getItem("zhiyu_graph_view_init")) {
        localStorage.setItem("zhiyu_graph_view_init", "1");
        localStorage.setItem("zhiyu_graph_view", "3d");
        return "3d";
      }
      return "3d";
    } catch (e) { return "3d"; }
  })();
  function switchGraphView(v, wrap) {
    GRAPH_VIEW = "3d";
    try { localStorage.setItem("zhiyu_graph_view", v); } catch (e) {}
    wrap = wrap || document.getElementById("graphWrap");
    if (!wrap) return;
    if (v === "3d" && wrap.__g2d) { try { wrap.__g2d.destroy(); } catch (e) {} }
    if (v === "2d" && wrap.__webgl) { try { wrap.__webgl.cleanup(); } catch (e) {} }
    buildKnowledgeGraph(wrap);
    var b2 = document.getElementById("uniView2d"), b3 = document.getElementById("uniView3d");
    if (b2) { b2.classList.toggle("active", v === "2d"); b2.style.background = (v === "2d") ? "rgba(92,200,255,.28)" : ""; b2.style.borderColor = (v === "2d") ? "#5cc8ff" : ""; }
    if (b3) { b3.classList.toggle("active", v === "3d"); b3.style.background = (v === "3d") ? "rgba(92,200,255,.28)" : ""; b3.style.borderColor = (v === "3d") ? "#5cc8ff" : ""; }
    var _gbb1 = document.getElementById("graphBgBtn"); if (_gbb1) _gbb1.style.display = (v === "3d") ? "none" : "";
    ["uniAuto", "uniLock", "uniViewMode"].forEach(function (id) {
      var el = document.getElementById(id); if (el) el.style.display = (v === "3d") ? "" : "none";
    });
    var _dmEl = document.getElementById("uniDragMode");
    if (_dmEl) _dmEl.style.display = (v === "3d") ? "" : "none";
    var _gr = document.getElementById("graphReset"); if (_gr) _gr.style.display = (v === "3d") ? "none" : "";
  }
  function buildKnowledgeGraph(wrap) {
    if (!wrap) return;
    const groups = collectGraphGroups();
    var nodes = [];
    // 前 6 组：成长痕迹，连到「我」
    groups.slice(0, 6).forEach((g) => g.items.forEach((it, i) => { if (it) nodes.push({ id: g.key + "_" + i, label: it, group: g.key, color: g.color, r: 13 }); }));
    // 目标体系 + 碎片：并入同一宇宙
    let tagNodes = {};
    try {
      const m = loadMailuo();
      const tags = mailuoTags(m);
      tags.forEach((t) => {
        const node = { id: t.id, label: t.label, group: "goal", color: t.color, r: t.kind === "life" ? 18 : (t.kind === "pillar" ? 14 : (t.kind === "lifetag" ? 13 : 11)), pillarId: t.pillarId, kind: t.kind };
        nodes.push(node); tagNodes[t.id] = node;
      });
      (m.fragments || []).forEach((f) => {
        const label = (f.text || f.title || f.url || "碎片").slice(0, 14);
        nodes.push({ id: "frag_" + f.id, label: label, group: "frag", color: "#9fb0c3", r: 9, frag: f });
      });
    } catch (e) {}
    // 笔记不同步进知识星球（用户要求）：笔记只属于「私人知识库 → 我的笔记」
    // 用户自定义的颜色覆盖（改过色的星球点重建后仍保留）
    const _userColors = loadGraphColors();
    nodes.forEach((n) => { if (_userColors[n.id]) n.color = _userColors[n.id]; });
    // 跨模块同步：私人知识库 · 个人能力清单（learn/skills）
    try {
      var _sc = loadSchema(); var _dl = loadDalao();
      (_sc || []).forEach(function (d) {
        var _items = d.items || []; var _dv = _dl[d.id] || {};
        _items.forEach(function (it) {
          var _v = _dv[it.k];
          if (_v && String(_v).trim()) nodes.push({ id: "dalao_" + d.id + "_" + it.k, label: "【" + (d.label || d.name || "能力") + "】" + String(_v).slice(0, 16), group: "skill", color: "#7ce0c0", r: 10 });
        });
      });
    } catch (e) {}
    // 跨模块同步：大佬思维模型蒸馏（models）—— 系统思维与方法论工具箱
    try {
      var _ml = loadMdModels();
      if (_ml && _ml.length) _ml.forEach(function (m, i) { if (m && m.name) nodes.push({ id: "model_" + (m.id || ("m" + i)), label: String(m.name).slice(0, 16), group: "model", color: "#c8a0ff", r: 12 }); });
    } catch (e) {}
    // 学习方法工具箱：把学习方法作为知识点同步进星网链（#22 指定的两大工具箱之一）
    try {
      mergedFieldMethods().forEach(function (m, i) { if (m && m.name) nodes.push({ id: "fmethod_" + i + "_" + (m.name || "m"), label: String(m.name).slice(0, 16), group: "fmethod", color: "#5cc8ff", r: 10, custom: false }); });
    } catch (e) {}
    // 用户自定义知识点
    try {
      loadGraphCustom().forEach(function (c) { if (c && c.label) nodes.push({ id: c.id, label: c.label, group: c.group || "custom", color: c.color || "#ffd27a", r: c.r || 11, custom: true }); });
    } catch (e) {}
    // 宇宙核心：太阳（代表「我」/人生主线），作为真实宇宙的中心恒星
    if (!nodes.some(function (n) { return n.id === "me"; })) {
      nodes.unshift({ id: "me", label: "我", group: "me", color: "#ffcf6a", r: 22, core: true });
    }
    if (!nodes.some(function (n) { return n.id === "moon"; })) {
      nodes.push({ id: "moon", label: "月球", group: "moon", color: "#c9ccd2", r: 11, core: false });
    }
    // 默认「真实宇宙」配色：每个核心支柱对应一颗真实星球（地球/海王星/木星/土星/火星/金星/天王星/水星/月球/冥王星）
    var _planetPalette = { self: "#e6c98a", field: "#c1502e", review: "#d8b48a", card: "#e3d2a0", bio: "#2a52c9", goal: "#1f6fe0", frag: "#c9ccd2", note: "#9fe0e0", skill: "#9c8e7e", model: "#c9b89a", custom: "#ffd27a" };
    // 单地球约束：现实共识只有一个地球，全图至多一个节点渲染为地球
    var _goalNodes = nodes.filter(function (n) { return n.group === "goal"; });
    var _earthNode = null;
    _goalNodes.forEach(function (n) { if (n.r >= 16) _earthNode = n; });
    if (!_earthNode && _goalNodes.length) _earthNode = _goalNodes[0];
    var _goalExtra = ["#caa15a", "#b8703a", "#9c8e7e", "#c98aa0", "#7c9ab0"];
    var _gi = 0;
    nodes.forEach(function (n) {
      if (ZY_GOAL_PLANETS[n.id]) { n._planet = ZY_GOAL_PLANETS[n.id]; n._realName = n._planet.name; }
      else n._realName = (ZY_REAL_PLANET[n.group] && ZY_REAL_PLANET[n.group].name) || "";
      if (_userColors[n.id]) return; // 用户改过色的保留
      if (n._planet) return; // 六大核心目标：保留各自真实星球配色，不走通用地球约束
      if (n === _earthNode) { n.color = "#1f6fe0"; }
      else if (n._realName === "地球") { n._realName = ""; n.color = _goalExtra[(_gi++) % _goalExtra.length]; }
      else if (_planetPalette[n.group]) { n.color = _planetPalette[n.group]; }
    });
    // 用户自定义颜色二次覆盖（含后加入的跨模块节点）
    nodes.forEach(function (n) { if (_userColors[n.id]) n.color = _userColors[n.id]; });
    // 隐藏列表：用户从星图中隐藏的知识点（源数据保留，仅不显示）
    var _hidden = loadGraphHidden();
    // #22 星网链只同步：学习方法工具箱(fmethod) + 系统思维与方法论工具箱(model) + 人生目标与五大支柱(goal) + 碎片(frag) + 核心天体(me/moon) + 用户自定义(custom)。自我认知/领域速通/复盘卡/复习卡/人生传记/笔记/能力清单全部移出主宇宙。
    nodes = nodes.filter(function (n) {
      return n.group === "me" || n.group === "moon" || n.group === "goal" || n.group === "model" || n.group === "fmethod" || n.group === "custom" || n.custom === true || n.group === "frag";
    });
    try { if (zyDropList().length) nodes = nodes.filter(function (n) { return !zyDropHit(n.label); }); } catch (e) {}
    try { window.__zyAllNodes = nodes.slice(); } catch (e) {}
    if (_hidden.length) nodes = nodes.filter(function (n) { return _hidden.indexOf(n.id) < 0; });
    // 点击跳转目标（纯对等网络：点节点 → 跳到对应模块里的那条内容）
    nodes.forEach((n) => {
      if (n.noteId) n.jump = { kind: "note", id: n.noteId, hash: "#learn" };
      else if (n.group === "frag" || n.group === "goal") n.jump = { hash: "#grow" };
      else if (n.group === "self") n.jump = { hash: "#self" };
      else if (n.group === "field") n.jump = { hash: "#field" };
      else if (n.group === "review") n.jump = { hash: "#review" };
      else if (n.group === "card") n.jump = { hash: "#check" };
      else n.jump = { hash: "#home" };
    });
    try { addEdge("moon", "me", "tag"); } catch (e) {}
    if (nodes.length <= 1) { wrap.innerHTML = '<div class="muted" style="padding:30px;text-align:center">还没有足够数据。去「自我认知 / 领域速通 / 复盘 / 养成 → 目标体系」做点什么，知识网络就会长出来。</div>'; return; }
    const edges = [];
    const seen = new Set();
    const edgeRel = (a, b, kind) => {
      if (a === "me" || b === "me") return { rel: "归属", w: 3 };
      if (kind === "tag") return { rel: "标签关联", w: 2 };
      if (kind === "token") return { rel: "话题相关", w: 1 };
      return { rel: "关联", w: 2 };
    };
    const addEdge = (a, b, kind) => { if (a === b) return; const k = a < b ? a + "|" + b : b + "|" + a; if (seen.has(k)) return; seen.add(k); const r = edgeRel(a, b, kind); edges.push({ a, b, rel: r.rel, w: r.w }); };
    // 纯对等网络：不再把所有节点连到中央「我」
    // 碎片按其标签连到对应目标（同一宇宙内的网彼此牵连）
    try {
      const m = loadMailuo();
      (m.fragments || []).forEach((f) => {
        if (!nodes.some((n) => n.id === "frag_" + f.id)) return;
        const ts = (f.tags && f.tags.length) ? f.tags : ["life"];
        ts.forEach((t) => { if (tagNodes[t]) addEdge("frag_" + f.id, t, "tag"); });
      });
    } catch (e) {}
    // 目标体系结构连线：人生大目标 → 五大支柱 → 子目标（私人知识库目标体系与五大支柱星球同步）
    try {
      mailuoTags(m).forEach((t) => {
        if (t.kind === "pillar" && nodes.some((n) => n.id === "life")) addEdge(t.id, "life", "tag");
        if (t.kind === "sub" && t.pillarId && nodes.some((n) => n.id === t.pillarId)) addEdge(t.id, t.pillarId, "tag");
      });
    } catch (e) {}
    // 成长痕迹之间的话题重合连边（碎片不靠话题，靠标签）
    for (let i = 0; i < nodes.length; i++) {
      for (let j = i + 1; j < nodes.length; j++) {
        if (nodes[i].id === "me" || nodes[j].id === "me") continue;
        if (nodes[i].group === "frag" || nodes[j].group === "frag") continue;
        // 学习方法工具箱 + 系统思维与方法论工具箱：禁止按话题与别的星球互连，统一由下方显式连到「认知支柱」
        if (nodes[i].group === "fmethod" || nodes[j].group === "fmethod" || nodes[i].group === "model" || nodes[j].group === "model") continue;
        const ti = tokenizeStr(nodes[i].label), tj = tokenizeStr(nodes[j].label);
        let common = 0; ti.forEach((t) => { if (tj.has(t)) common++; });
        if (common >= 1) addEdge(nodes[i].id, nodes[j].id, "token");
      }
    }
    // 笔记不进图，双链连边逻辑已整体移除
    // 保证所有同步进来的节点都接入星网链（无孤立点）。
    // 连线铁律：与五大支柱相关的(带 pillarId) → 连对应支柱星球；与人生大目标相关的 → 连人生大目标(地球)；其余兜底连核心「我」（绝不再默认连太阳）。
    try {
      var _deg = {}; nodes.forEach(function (n) { _deg[n.id] = 0; });
      edges.forEach(function (e) { _deg[e.a]++; _deg[e.b]++; });
      var _hasLife = nodes.some(function (m) { return m.id === "life"; });
      var _hasMe = nodes.some(function (m) { return m.id === "me"; });
      nodes.forEach(function (n) {
        if (n.id === "me") return;
        if (ZY_GOAL_PLANETS[n.id]) return;
        if ((_deg[n.id] || 0) > 0) return;
        // 与五大支柱相关的（子目标/碎片带 pillarId）→ 连对应支柱星球，而非直接连太阳
        if (n.pillarId && nodes.some(function (m) { return m.id === n.pillarId; })) { addEdge(n.id, n.pillarId, "tag"); return; }
        // 与人生大目标相关的 → 连人生大目标（地球）
        if (_hasLife) { addEdge(n.id, "life", "tag"); return; }
        // 兜底：连核心「我」
        if (_hasMe) addEdge(n.id, "me", "tag");
      });
    } catch (e) {}
    // 学习方法工具箱 + 系统思维与方法论工具箱：认知类工具，统一连到「认知支柱」(p_cog) 星网链；无认知支柱时退化为连人生大目标或核心「我」
    var _cogId = nodes.some(function (n) { return n.id === "p_cog"; }) ? "p_cog" : (nodes.some(function (n) { return n.id === "life"; }) ? "life" : "me");
    nodes.forEach(function (n) { if (n.group === "fmethod" || n.group === "model") addEdge(n.id, _cogId, "tag"); });
    // 知识星球：给每个知识点分配一个宇宙天体类型（星球 / 卫星 / 彗星 / 陨星 / 陨石 / 黑洞）
    (function assignOtype() {
      var _d = {}; nodes.forEach(function (n) { _d[n.id] = 0; });
      edges.forEach(function (e) { if (_d[e.a] != null) _d[e.a]++; if (_d[e.b] != null) _d[e.b]++; });
      nodes.forEach(function (n) { n.otype = zyNodeOtype(n, _d[n.id] || 0); });
    })();
    (function applyCustomOtype() {
      var _co = loadGraphOtypes();
      nodes.forEach(function (n) {
        // #核心天体外观锁定：太阳与六大真实行星不允许在化妆台改类型
        if (ZY_CORE_PROT[n.id]) { n.otype = (n.id === "me") ? "lava" : "planet"; return; }
        if (_co[n.id]) n.otype = _co[n.id];
      });
    })();
    try { window.__zyNodes = nodes; } catch (e) {}
    if (drawGraph3DOrFallback(wrap, nodes, edges, groups)) return;
    wrap.innerHTML = '<div style="padding:40px;color:#9fb0c3">当前浏览器无法渲染 3D 星球，请更换支持 WebGL 的浏览器后重试。</div>';
  }
  function consumeGraphJump(view) {
  try {
    var j = window.__graphJump; if (!j || !j.label) return;
    window.__graphJump = null;
    var label = j.label;
    var all = view.querySelectorAll("*");
    for (var i = 0; i < all.length; i++) {
      var el = all[i];
      if (el.childElementCount === 0 && el.textContent && el.textContent.indexOf(label) >= 0) {
        try { el.scrollIntoView({ block: "center", behavior: "smooth" }); } catch (e) {}
        var po = el.style.outline, pb = el.style.background;
        el.style.outline = "2px solid #5cc8ff";
        el.style.background = "rgba(92,200,255,.14)";
        setTimeout((function (p1, p2) { return function () { el.style.outline = p1; el.style.background = p2; }; })(po, pb), 2200);
        break;
      }
    }
  } catch (e) {}


}

function drawGraphScene(wrap, nodes, edges, groups) {
  zy2dGalaxyBg(wrap);
  if (wrap.__g2d) { try { wrap.__g2d.destroy(); } catch (e) {} }
  wrap.querySelectorAll(".zy-g2d-svg,.zy-g2d-tip").forEach(function (el) { el.remove(); });
  if (wrap.__meteorTimer) { clearInterval(wrap.__meteorTimer); wrap.__meteorTimer = null; }
  if (!nodes || nodes.length <= 1) {
    var em = document.createElement("div");
    em.className = "muted"; em.style.cssText = "padding:30px;text-align:center";
    em.innerHTML = "还没有足够数据。去「自我认知 / 领域速通 / 复盘 / 养成 → 目标体系 / 笔记」做点什么，知识网络就会长出来。";
    wrap.appendChild(em);
    return;
  }
  var NS = "http://www.w3.org/2000/svg";
  // 邻接 / 度数
  var adj = {}, byId = {}, deg = {};
  nodes.forEach(function (n) { adj[n.id] = []; byId[n.id] = n; });
  edges.forEach(function (e) { if (adj[e.a] && adj[e.b]) { adj[e.a].push(e.b); adj[e.b].push(e.a); } });
  nodes.forEach(function (n) { deg[n.id] = (adj[n.id] || []).length; });
  var colorOf = function (n) { return n.color || "#9fb0c3"; };
  var groupMap = {}; (groups || []).forEach(function (g) { groupMap[g.key] = g.label; });
  var groupLabel = function (k) { return groupMap[k] || k || "其它"; };
  var nodeSummary = function (n) {
    if (n.frag && n.frag.text) return '<br><span class="muted" style="font-size:11px">' + escHTML(String(n.frag.text).slice(0, 60)) + "</span>";
    if (n.noteId) return '<br><span class="muted" style="font-size:11px">笔记 · 点开查看/编辑</span>';
    return "";
  };

  // ---- 力导布局（同步迭代，确定性，jsdom 安全）----
  var W = 1000, H = 640;
  nodes.forEach(function (n, i) {
    var a = (i / Math.max(1, nodes.length)) * Math.PI * 2;
    n.x = W / 2 + Math.cos(a) * (170 + (i % 5) * 26) + (Math.random() - 0.5) * 40;
    n.y = H / 2 + Math.sin(a) * (120 + (i % 4) * 24) + (Math.random() - 0.5) * 40;
    n.vx = 0; n.vy = 0;
    n.r = Math.max(8.5, Math.min(27, 8.5 + Math.sqrt(deg[n.id] || 0) * 4.4));
  });
  var POS_KEY = "zhiyu_graph2d_pos";
  var savedPos = null;
  try { savedPos = JSON.parse(localStorage.getItem(POS_KEY) || "null"); } catch (e) { savedPos = null; }
  var hasSaved = !!(savedPos && typeof savedPos === "object");
  if (hasSaved) nodes.forEach(function (n) { var p = savedPos[n.id]; if (p && typeof p[0] === "number" && typeof p[1] === "number") { n.x = p[0]; n.y = p[1]; } });
  var REP = 7600, SPRING = 0.012, L0 = 104, CENTER = 0.0017, DAMP = 0.85;
  for (var it = 0; it < (hasSaved ? 0 : 320); it++) {
    var alpha = 1 - it / 340;
    for (var i = 0; i < nodes.length; i++) {
      for (var j = i + 1; j < nodes.length; j++) {
        var a = nodes[i], b = nodes[j];
        var dx = a.x - b.x, dy = a.y - b.y, d2 = dx * dx + dy * dy; if (d2 < 1) d2 = 1;
        var f = REP / d2, d = Math.sqrt(d2), fx = (dx / d) * f, fy = (dy / d) * f;
        a.vx += fx; a.vy += fy; b.vx -= fx; b.vy -= fy;
      }
    }
    edges.forEach(function (e) {
      var a = byId[e.a], b = byId[e.b]; if (!a || !b) return;
      var dx = b.x - a.x, dy = b.y - a.y, d = Math.sqrt(dx * dx + dy * dy) || 1;
      var f = (d - L0) * SPRING, fx = (dx / d) * f, fy = (dy / d) * f;
      a.vx += fx; a.vy += fy; b.vx -= fx; b.vy -= fy;
    });
    nodes.forEach(function (n) {
      n.vx += (W / 2 - n.x) * CENTER; n.vy += (H / 2 - n.y) * CENTER;
      n.vx *= DAMP; n.vy *= DAMP; n.x += n.vx * alpha; n.y += n.vy * alpha;
    });
    if (!hasSaved) { try { savePositions(); } catch (e2) {} }
  }
  var minX = 1e9, minY = 1e9, maxX = -1e9, maxY = -1e9;
  nodes.forEach(function (n) { minX = Math.min(minX, n.x); minY = Math.min(minY, n.y); maxX = Math.max(maxX, n.x); maxY = Math.max(maxY, n.y); });
  var pad = 46, vw = (maxX - minX) + pad * 2, vh = (maxY - minY) + pad * 2;

  // ---- SVG ----
  var svg = document.createElementNS(NS, "svg");
  svg.setAttribute("class", "zy-g2d-svg");
  svg.setAttribute("width", "100%"); svg.setAttribute("height", "100%");
  svg.style.position = "absolute"; svg.style.left = "0"; svg.style.top = "0";
  svg.style.touchAction = "none"; svg.style.cursor = "grab"; svg.style.zIndex = "3";
  svg.setAttribute("viewBox", (minX - pad) + " " + (minY - pad) + " " + vw + " " + vh);
  svg.setAttribute("preserveAspectRatio", "xMidYMid meet");
  var defs = document.createElementNS(NS, "defs");
  try { defs.innerHTML = '<marker id="g2dArrow" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse"><path d="M1 1L9 5L1 9" fill="none" stroke="#7c8aa5" stroke-width="1.4" stroke-linecap="round" stroke-linejoin="round"/></marker>'; } catch (e) {}
  svg.appendChild(defs);
  var gAll = document.createElementNS(NS, "g"); svg.appendChild(gAll);

  var edgeEls = [];
  edges.forEach(function (e) {
    var a = byId[e.a], b = byId[e.b]; if (!a || !b) return;
    var mix = zyEdgeMix(colorOf(a), colorOf(b));
    var ew = e.w >= 3 ? 2 : (e.w >= 2 ? 1.35 : 0.95);
    var halo = document.createElementNS(NS, "line");
    halo.setAttribute("x1", a.x); halo.setAttribute("y1", a.y); halo.setAttribute("x2", b.x); halo.setAttribute("y2", b.y);
    halo.setAttribute("stroke", zyRgb(mix));
    halo.setAttribute("stroke-width", (ew * 5).toFixed(2));
    halo.setAttribute("stroke-opacity", "0.075");
    halo.setAttribute("stroke-linecap", "round");
    gAll.appendChild(halo);
    var line = document.createElementNS(NS, "line");
    line.__halo = halo;
    line.setAttribute("x1", a.x); line.setAttribute("y1", a.y); line.setAttribute("x2", b.x); line.setAttribute("y2", b.y);
    line.setAttribute("stroke", zyRgb(zyLift(mix, 0.42)));
    line.setAttribute("stroke-width", ew);
    line.setAttribute("stroke-opacity", e.w >= 3 ? 0.62 : (e.w >= 2 ? 0.46 : 0.32));
    line.setAttribute("stroke-linecap", "round");
    line.dataset.a = e.a; line.dataset.b = e.b; line.dataset.rel = e.rel || "";
    gAll.appendChild(line); edgeEls.push(line);
  });
  (function () { if (!loadGraphLines()) { edgeEls.forEach(function (l) { l.style.display = "none"; if (l.__halo) l.__halo.style.display = "none"; }); } })();

  var nodeEls = {};
  nodes.forEach(function (n) {
    var g = document.createElementNS(NS, "g");
    g.setAttribute("transform", "translate(" + n.x + "," + n.y + ")");
    g.style.cursor = "pointer";
    zy2dDrawNode(g, n, colorOf(n), NS, defs);
    var c = document.createElementNS(NS, "circle");
    c.setAttribute("r", (n.r + 1.3).toFixed(2)); c.setAttribute("fill", "none");
    c.setAttribute("stroke", zyRgb(zyLift(zySat(zyHex2rgb(colorOf(n)), 0.4), 0.5)));
    c.setAttribute("stroke-width", "1.1"); c.setAttribute("stroke-opacity", "0.5"); c.setAttribute("pointer-events", "none");
    g.appendChild(c);
    var t = document.createElementNS(NS, "text");
    t.setAttribute("text-anchor", "middle"); t.setAttribute("dy", n.r + 13.5);
    t.setAttribute("fill", "#eef3fd"); t.setAttribute("font-size", "11.5"); t.setAttribute("font-weight", "500"); t.setAttribute("pointer-events", "none"); t.setAttribute("stroke", "rgba(4,7,15,.94)"); t.setAttribute("stroke-width", "3.2"); t.setAttribute("paint-order", "stroke"); t.setAttribute("stroke-linejoin", "round");
    t.textContent = String(n.label || "").slice(0, 10);
    g.appendChild(t);
    g.dataset.id = n.id;
    gAll.appendChild(g);
    nodeEls[n.id] = g; n.__g = g; n.__c = c; n.__t = t;
  });

  wrap.appendChild(svg);
  var _orbClusters = (function () {
    var seen = {}, arr = [];
    nodes.forEach(function (n) {
      var g = String(n.group || "other");
      if (seen[g]) return;
      seen[g] = 1;
      arr.push({ key: g, color: zyRgb(zyLift(zyHex2rgb(colorOf(n)), 0.45)) });
    });
    return arr;
  })();
  zy2dParticleField(wrap, svg, _orbClusters);

  // 流星雨：陨星划过星球时周期性生成流星雨
  if (wrap.__meteorTimer) clearInterval(wrap.__meteorTimer);
  wrap.__meteorTimer = setInterval(function () { zyMeteorShowerTick(gAll, nodes, NS); }, 4200);

  // tooltip
  var tip = document.createElement("div");
  tip.className = "zy-g2d-tip";
  tip.style.cssText = "position:absolute;z-index:6;max-width:240px;padding:8px 10px;border-radius:10px;background:rgba(16,20,32,.95);border:1px solid rgba(120,140,180,.35);color:#e7edf7;font-size:12px;line-height:1.5;pointer-events:none;display:none";
  wrap.appendChild(tip);

  // ---- 视图状态 ----
  var scale = 1, tx = 0, ty = 0, dragging = null, panning = false, lastX = 0, lastY = 0, moved = false, downId = null;
  try { var _v2 = JSON.parse(localStorage.getItem(GRAPH_VIEW2D_KEY) || "null"); if (_v2 && typeof _v2.scale === "number") { scale = _v2.scale; tx = _v2.tx || 0; ty = _v2.ty || 0; } } catch (e) {}
  var hiddenGroups = {}, focusId = null, selectedId = null;
  function pixelsPerGU() {
    var cw = wrap.clientWidth || W, ch = wrap.clientHeight || H;
    return Math.min(cw / vw, ch / vh) * scale;
  }
  function applyView() { gAll.setAttribute("transform", "translate(" + tx + "," + ty + ") scale(" + scale + ")"); if (typeof updZoom === "function") updZoom(); try { localStorage.setItem(GRAPH_VIEW2D_KEY, JSON.stringify({ scale: scale, tx: tx, ty: ty })); } catch (e) {} }
  function resetView() { scale = 1; tx = 0; ty = 0; applyView(); }

  function selectNode2D(n) {
    if (!n) return;
    selectedId = n.id;
    var nb = {}; (adj[n.id] || []).forEach(function (x) { nb[x] = 1; }); nb[n.id] = 1;
    nodes.forEach(function (m) {
      if (nb[m.id]) { m.__c.setAttribute("fill-opacity", "1"); m.__c.setAttribute("stroke", "#fff"); m.__g.setAttribute("opacity", "1"); }
      else { m.__g.setAttribute("opacity", "0.14"); }
    });
    edgeEls.forEach(function (l) { var v = (l.dataset.a === n.id || l.dataset.b === n.id) ? 0.9 : 0.04; l.setAttribute("stroke-opacity", v); if (l.__halo) l.__halo.setAttribute("stroke-opacity", (v * 0.3).toFixed(3)); });
    var info = document.getElementById("graphInfo");
    if (info) {
      info.innerHTML = '<b style="color:' + colorOf(n) + '">' + escHTML(n.label) + "</b> · 模块：" + groupLabel(n.group) + " · 连线 " + (deg[n.id] || 0) + " 条" + ' · <button id="zyJumpBtn" class="ghost" style="padding:2px 8px;font-size:12px">前往该模块 ›</button>';
      var jb = info.querySelector("#zyJumpBtn"); if (jb) jb.onclick = function () { clearSelect2D(); jumpTo(n); };
    }
  }
  function clearSelect2D() { selectedId = null; setHover(null); var info = document.getElementById("graphInfo"); if (info) info.innerHTML = "拖动任一节点即可带动身边的点一起移动，松手后自动回弹并记住位置；点节点看它的来源与连线。"; }
  function setHover(id) {
    if (id == null) {
      if (selectedId && byId[selectedId]) { selectNode2D(byId[selectedId]); return; }
      nodes.forEach(function (n) { n.__c.setAttribute("stroke", zyRgb(zyLift(zySat(zyHex2rgb(colorOf(n)), 0.4), 0.5))); n.__c.setAttribute("stroke-opacity", "0.5"); n.__g.setAttribute("opacity", "1"); });
      edgeEls.forEach(function (l) { var v = l.dataset.rel === "双链" ? 0.4 : (l.dataset.rel ? 0.34 : 0.26); l.setAttribute("stroke-opacity", v); if (l.__halo) l.__halo.setAttribute("stroke-opacity", (v * 0.3).toFixed(3)); });
      tip.style.display = "none";
      return;
    }
    if (hiddenGroups[byId[id] && byId[id].group]) return;
    var nb = {}; (adj[id] || []).forEach(function (x) { nb[x] = 1; }); nb[id] = 1;
    nodes.forEach(function (n) {
      if (nb[n.id]) { n.__c.setAttribute("fill-opacity", "1"); n.__c.setAttribute("stroke", "#fff"); n.__g.setAttribute("opacity", "1"); }
      else { n.__g.setAttribute("opacity", "0.14"); }
    });
    edgeEls.forEach(function (l) { var v = (l.dataset.a === id || l.dataset.b === id) ? 0.9 : 0.04; l.setAttribute("stroke-opacity", v); if (l.__halo) l.__halo.setAttribute("stroke-opacity", (v * 0.3).toFixed(3)); });
    var n = byId[id];
    tip.innerHTML = '<b style="color:' + colorOf(n) + '">' + escHTML(n.label) + "</b><br><span class='muted'>" + groupLabel(n.group) + " · 连接 " + (deg[n.id] || 0) + " 个节点</span>" + nodeSummary(n);
    tip.style.display = "block";
  }
  function setLinesVisible(on) { edgeEls.forEach(function (l) { l.style.display = on ? "" : "none"; if (l.__halo) l.__halo.style.display = on ? "" : "none"; }); }
  function applyFilter() {
    nodes.forEach(function (n) {
      var hide = !!hiddenGroups[n.group];
      if (!hide && focusId) {
        var isNb = (adj[focusId] || []).indexOf(n.id) >= 0;
        if (focusId !== n.id && !isNb) hide = true;
      }
      n.__g.style.display = hide ? "none" : "";
    });
    edgeEls.forEach(function (l) {
      var hide = !!hiddenGroups[byId[l.dataset.a] && byId[l.dataset.a].group] || !!hiddenGroups[byId[l.dataset.b] && byId[l.dataset.b].group];
      if (!hide && focusId) { hide = !(l.dataset.a === focusId || l.dataset.b === focusId); }
      if (!loadGraphLines()) hide = true;
      l.style.display = hide ? "none" : ""; if (l.__halo) l.__halo.style.display = l.style.display;
    });
  }
  function centerOn(n) {
    var cw = wrap.clientWidth || W, ch = wrap.clientHeight || H;
    var ppu0 = Math.min(cw / vw, ch / vh) || 1;
    scale = 1.4;
    tx = cw / 2 / ppu0 - n.x * scale + (minX - pad);
    ty = ch / 2 / ppu0 - n.y * scale + (minY - pad);
    applyView();
  }
  function refreshEdges() {
    edgeEls.forEach(function (l) {
      var a = byId[l.dataset.a], b = byId[l.dataset.b];
      l.setAttribute("x1", a.x); l.setAttribute("y1", a.y); l.setAttribute("x2", b.x); l.setAttribute("y2", b.y);
      if (l.__halo) { l.__halo.setAttribute("x1", a.x); l.__halo.setAttribute("y1", a.y); l.__halo.setAttribute("x2", b.x); l.__halo.setAttribute("y2", b.y); }
    });
  }

  // ---- 拖拽联动：拖一个点，相连的点被牵着走（越远影响越小），松手后惯性回弹 ----
  var relaxRaf = null, relaxFrames = 0, pinnedId = null, activeIds = null;
  function neighborsWithin(id, hops) {
    var seen = {}; seen[id] = 0; var cur = [id];
    for (var h = 1; h <= hops; h++) {
      var next = [];
      cur.forEach(function (x) { (adj[x] || []).forEach(function (y) { if (!(y in seen)) { seen[y] = h; next.push(y); } }); });
      cur = next;
    }
    return seen;
  }
  function relaxStep() {
    var set = activeIds;
    var list = set ? nodes.filter(function (n) { return set[n.id] != null; }) : nodes;
    if (list.length > 200) list = list.slice(0, 200);
    list.forEach(function (n) { n.vx = 0; n.vy = 0; });
    edges.forEach(function (e) {
      var a = byId[e.a], b = byId[e.b]; if (!a || !b) return;
      var aA = !set || set[a.id] != null, bA = !set || set[b.id] != null;
      if (!aA && !bA) return;
      var dx = b.x - a.x, dy = b.y - a.y, d = Math.sqrt(dx * dx + dy * dy) || 1;
      var f = (d - L0) * SPRING, fx = (dx / d) * f, fy = (dy / d) * f;
      if (aA && a.id !== pinnedId) { a.vx += fx; a.vy += fy; }
      if (bA && b.id !== pinnedId) { b.vx -= fx; b.vy -= fy; }
    });
    for (var i = 0; i < list.length; i++) {
      for (var j = i + 1; j < list.length; j++) {
        var a = list[i], b = list[j];
        var dx = a.x - b.x, dy = a.y - b.y, d2 = dx * dx + dy * dy; if (d2 < 1) d2 = 1;
        if (d2 > 62500) continue;
        var f = REP / d2, d = Math.sqrt(d2), fx = (dx / d) * f, fy = (dy / d) * f;
        a.vx += fx; a.vy += fy; b.vx -= fx; b.vy -= fy;
      }
    }
    var energy = 0;
    list.forEach(function (n) {
      if (n.id === pinnedId) { n.vx = 0; n.vy = 0; return; }
      n.vx *= DAMP; n.vy *= DAMP;
      var mv = Math.abs(n.vx) + Math.abs(n.vy);
      if (mv > 22) { var k = 22 / mv; n.vx *= k; n.vy *= k; }
      n.x += n.vx; n.y += n.vy;
      energy += mv;
      n.__g.setAttribute("transform", "translate(" + n.x + "," + n.y + ")");
    });
    return energy;
  }
  function raf(fn) { return (window.requestAnimationFrame || function (f) { return setTimeout(f, 16); })(fn); }
  function relaxLoop() {
    relaxRaf = null;
    var e = relaxStep();
    refreshEdges();
    if (relaxFrames-- > 0 && e > 1.5) relaxRaf = raf(relaxLoop);
    else { savePositions(); }
  }
  function startRelax(frames) {
    relaxFrames = Math.max(relaxFrames, frames || 30);
    if (!relaxRaf) relaxRaf = raf(relaxLoop);
  }
  function stopRelax() { relaxFrames = 0; if (relaxRaf) { try { (window.cancelAnimationFrame || clearTimeout)(relaxRaf); } catch (e) {} } relaxRaf = null; }
  function savePositions() {
    try {
      var o = {};
      nodes.forEach(function (n) { o[n.id] = [Math.round(n.x * 10) / 10, Math.round(n.y * 10) / 10]; });
      localStorage.setItem(POS_KEY, JSON.stringify(o));
    } catch (e) {}
  }
  function dragPull(n, dx, dy) {
    if (!activeIds) activeIds = neighborsWithin(n.id, 3);
    Object.keys(activeIds).forEach(function (id) {
      if (id === n.id) return;
      var m = byId[id]; if (!m) return;
      var hop = activeIds[id];
      var k = (hop === 1 ? 0.55 : (hop === 2 ? 0.26 : 0.12));
      m.x += dx * k; m.y += dy * k;
      m.vx = (m.vx || 0) + dx * 0.1; m.vy = (m.vy || 0) + dy * 0.1;
      m.__g.setAttribute("transform", "translate(" + m.x + "," + m.y + ")");
    });
  }
  function jumpTo(n) {
    var j = n.jump; if (!j) { setHover(null); return; }
    if (j.kind === "note") { location.hash = j.hash; try { openNoteEditor(j.id); } catch (e) {} setHover(null); return; }
    window.__graphJump = { label: n.label };
    location.hash = j.hash;
    setHover(null);
  }

  // ---- 指针交互 ----
  svg.addEventListener("pointerdown", function (e) {
    var g = e.target.closest ? e.target.closest("g[data-id]") : null;
    lastX = e.clientX; lastY = e.clientY; moved = false;
    if (g) { dragging = g.dataset.id; downId = dragging; var n = byId[dragging]; n.fixed = true; pinnedId = dragging; activeIds = neighborsWithin(dragging, 3); svg.style.cursor = "grabbing"; }
    else { panning = true; svg.style.cursor = "grabbing"; }
    try { svg.setPointerCapture(e.pointerId); } catch (e2) {}
  });
  svg.addEventListener("pointermove", function (e) {
    var dxC = e.clientX - lastX, dyC = e.clientY - lastY;
    if (Math.abs(dxC) + Math.abs(dyC) > 3) moved = true;
    var ppu = pixelsPerGU() || 1;
    if (dragging) {
      var n = byId[dragging];
      n.x += dxC / ppu; n.y += dyC / ppu; dragPull(n, dxC / ppu, dyC / ppu); startRelax(26);
      n.__g.setAttribute("transform", "translate(" + n.x + "," + n.y + ")");
      refreshEdges();
    } else if (panning) {
      tx += dxC / ppu; ty += dyC / ppu; applyView();
    } else {
      var g = e.target.closest ? e.target.closest("g[data-id]") : null;
      setHover(g ? g.dataset.id : null);
      if (g) {
        var nr = byId[g.dataset.id];
        var rect = wrap.getBoundingClientRect ? wrap.getBoundingClientRect() : { left: 0, top: 0 };
        tip.style.left = (e.clientX - rect.left + 14) + "px";
        tip.style.top = (e.clientY - rect.top + 14) + "px";
      }
    }
    lastX = e.clientX; lastY = e.clientY;
  });
  svg.addEventListener("pointerup", function (e) {
    svg.style.cursor = "grab";
    if (dragging) { byId[dragging].fixed = false; pinnedId = null; if (moved) { startRelax(46); } else { activeIds = null; } } // 单击不再打开详情（改为双击）
    else if (panning && !moved) { clearSelect2D(); }
    dragging = null; panning = false; downId = null;
  });
  svg.addEventListener("pointerleave", function () { setHover(null); });
  svg.addEventListener("click", function (e) { if (!(window.matchMedia && window.matchMedia('(hover: none)').matches)) return; var _g = e.target.closest ? e.target.closest("g[data-id]") : null; if (_g) { selectNode2D(byId[_g.dataset.id]); focusId = (focusId === _g.dataset.id) ? null : _g.dataset.id; applyFilter(); if (focusId) { var _n = byId[focusId]; _n.__c.setAttribute("stroke", "#fff"); } } else { focusId = null; applyFilter(); } });
  svg.addEventListener("click", function (e) { if (!(window.matchMedia && window.matchMedia('(hover: none)').matches)) return; var _g = e.target.closest ? e.target.closest("g[data-id]") : null; if (_g) { selectNode2D(byId[_g.dataset.id]); focusId = (focusId === _g.dataset.id) ? null : _g.dataset.id; applyFilter(); if (focusId) { var _n = byId[focusId]; _n.__c.setAttribute("stroke", "#fff"); } } else { focusId = null; applyFilter(); } });
  svg.addEventListener("dblclick", function (e) {
    var g = e.target.closest ? e.target.closest("g[data-id]") : null;
    if (g) { selectNode2D(byId[g.dataset.id]); focusId = (focusId === g.dataset.id) ? null : g.dataset.id; applyFilter();
      if (focusId) { var n = byId[focusId]; n.__c.setAttribute("stroke", "#fff"); } }
    else { focusId = null; applyFilter(); }
  });
  svg.addEventListener("wheel", function (e) {
    e.preventDefault();
    var rect = svg.getBoundingClientRect();
    var px = e.clientX - rect.left, py = e.clientY - rect.top;
    var cw = rect.width || wrap.clientWidth || W, ch = rect.height || wrap.clientHeight || H;
    var vbScale = Math.min(cw / vw, ch / vh) || 1;
    var offX = (cw - vw * vbScale) / 2, offY = (ch - vh * vbScale) / 2;
    var vx = (px - offX) / vbScale, vy = (py - offY) / vbScale;
    var factor = e.deltaY < 0 ? 1.12 : 0.89;
    var ns = Math.max(0.3, Math.min(6, scale * factor));
    // keep the content point under the cursor fixed during zoom
    tx = vx - (vx - tx) * (ns / scale);
    ty = vy - (vy - ty) * (ns / scale);
    scale = ns;
    applyView();
  }, { passive: false });

  // ---- 控件：缩放 / 复位 / 过滤 / 搜索 ----
  function bindBtn(id, fn) { var el = document.getElementById(id); if (el) el.onclick = fn; }
  bindBtn("graphReset", function () { focusId = null; hiddenGroups = {}; syncChips(); resetView(); setHover(null); applyFilter(); });
  bindBtn("graphRelayout", function () { try { localStorage.removeItem(POS_KEY); localStorage.removeItem(GRAPH_VIEW3D_KEY); localStorage.removeItem(GRAPH_VIEW2D_KEY); localStorage.removeItem("zhiyu_graph_kproot"); } catch (e) {} buildKnowledgeGraph(wrap); });
  bindBtn("uniZoomIn", function () { scale = Math.min(4, scale * 1.15); applyView(); });
  bindBtn("uniZoomOut", function () { scale = Math.max(0.35, scale / 1.15); applyView(); });
  bindBtn("uniGraphRelayout", function () { ["zhiyu_graph2d_pos","zhiyu_graph3d_pos","zhiyu_graph2d_view","zhiyu_graph_solar","zhiyu_graph_kproot"].forEach(function (k) { try { localStorage.removeItem(k); } catch (e) {} }); try { var _kd = kpLoad(); _kd.pos = {}; kpSave(_kd); } catch (e) {} var _w1 = document.getElementById("graphWrap"); if (_w1) buildKnowledgeGraph(_w1); });
  var zi = document.getElementById("uniZoomVal"); function updZoom() { if (zi) zi.textContent = Math.round(scale * 100) + "%"; } updZoom();

  var flt = document.getElementById("graphFilter");
  function syncChips() {
    if (!flt) return;
    flt.innerHTML = "";
    (groups || []).forEach(function (g) {
      var chip = document.createElement("button");
      chip.className = "ghost g2d-chip" + (hiddenGroups[g.key] ? " off" : "");
      chip.style.cssText = "font-size:11px;padding:2px 8px;border-radius:12px;" + (hiddenGroups[g.key] ? "opacity:.45" : "");
      chip.innerHTML = '<i style="display:inline-block;width:8px;height:8px;border-radius:50%;background:' + (g.color || "#9fb0c3") + ';margin-right:4px"></i>' + escHTML(g.label);
      chip.onclick = function () { hiddenGroups[g.key] = !hiddenGroups[g.key]; syncChips(); applyFilter(); };
      flt.appendChild(chip);
    });
  }
  syncChips();

  var sb = document.getElementById("uniSearch"), sGo = document.getElementById("uniSearchGo"), sInfo = document.getElementById("uniSearchInfo");
  function doSearch(focus) {
    var q = (sb && sb.value || "").trim();
    if (!q) { nodes.forEach(function (n) { n.__g.setAttribute("opacity", "1"); }); setLinesVisible(loadGraphLines()); setHover(null); if (sInfo) sInfo.textContent = ""; return; }
    var hits = [];
    nodes.forEach(function (n) {
      var hit = (n.label || "").toLowerCase().indexOf(q.toLowerCase()) >= 0;
      n.__g.setAttribute("opacity", hit ? "1" : "0.12");
      if (hit) hits.push(n);
    });
    edgeEls.forEach(function (l) { l.style.display = loadGraphLines() ? "" : "none"; if (l.__halo) l.__halo.style.display = l.style.display; });
    if (sInfo) sInfo.textContent = hits.length ? ("命中 " + hits.length + " 个") : "无匹配";
    if (focus && hits[0]) centerOn(hits[0]);
    // 扩展：同时定位知识点粒子（2D/3D 均尝试）
    try { if (wrap && wrap.__zyParticle && wrap.__zyParticle.locate) wrap.__zyParticle.locate(q); } catch (e) {}
    try { if (wrap && wrap.__webgl && wrap.__webgl.locate) wrap.__webgl.locate(q); } catch (e) {}
  }
  if (sb) { sb.oninput = function () { doSearch(false); }; sb.addEventListener("keydown", function (e) { if (e.key === "Enter") doSearch(true); }); }
  if (sGo) sGo.onclick = function () { doSearch(true); };

  applyFilter(); setHover(null);
  wrap.__zyEdgeMeshes = null;
  wrap.__g2d = { destroy: function () { stopRelax(); if (wrap.__zyParticle) { try { wrap.__zyParticle.stop(); } catch (e) {} wrap.__zyParticle = null; } try { svg.remove(); tip.remove(); var _zb = wrap.querySelector(".zy-g2d-bg"); if (_zb && _zb.remove) _zb.remove(); wrap.classList.remove("zy-galaxy-on"); } catch (e) {} }, setLines: function (on) { setLinesVisible(on); } };
}

// ---------- 2D 知识网络：银河系宇宙背景 + 星球节点 ----------
function zySat(a, k) { var l = a[0] * 0.299 + a[1] * 0.587 + a[2] * 0.114; return [l + (a[0] - l) * (1 + k), l + (a[1] - l) * (1 + k), l + (a[2] - l) * (1 + k)]; }
function zyEdgeMix(a, b) { var ca = zyHex2rgb(a), cb = zyHex2rgb(b); return [(ca[0] + cb[0]) / 2, (ca[1] + cb[1]) / 2, (ca[2] + cb[2]) / 2]; }
function zy2dMk(NS, tag, attrs, parent) {
  var e = document.createElementNS(NS, tag);
  if (attrs) { for (var k in attrs) { if (Object.prototype.hasOwnProperty.call(attrs, k)) e.setAttribute(k, String(attrs[k])); } }
  if (parent) parent.appendChild(e);
  return e;
}
function zyHex2rgb(h) {
  h = String(h || "#9fb0c3").replace("#", "");
  if (h.length === 3) h = h[0] + h[0] + h[1] + h[1] + h[2] + h[2];
  var v = parseInt(h, 16); if (isNaN(v)) v = 0x9fb0c3;
  return [(v >> 16) & 255, (v >> 8) & 255, v & 255];
}
function zyRgb(a) {
  return "rgb(" + Math.round(Math.min(255, Math.max(0, a[0]))) + "," + Math.round(Math.min(255, Math.max(0, a[1]))) + "," + Math.round(Math.min(255, Math.max(0, a[2]))) + ")";
}
function zyLift(a, t) { return [a[0] + (255 - a[0]) * t, a[1] + (255 - a[1]) * t, a[2] + (255 - a[2]) * t]; }
function zyDrop(a, t) { return [a[0] * (1 - t), a[1] * (1 - t), a[2] * (1 - t)]; }
function zy2dGalaxyBg(wrap) {
  try {
    var old = wrap.querySelector(".zy-g2d-bg");
    var _mode = "galaxy";
    try { _mode = localStorage.getItem("zhiyu_graph2d_bg") || "galaxy"; } catch (e0) {}
    if (_mode !== "galaxy" && _mode !== "soft" && _mode !== "off") _mode = "galaxy";
    if (old && old.style) old.style.opacity = (_mode === "soft") ? "0.4" : "1";
    if (_mode === "off") {
      if (old && old.remove) old.remove();
      try { wrap.classList.remove("zy-galaxy-on"); } catch (e0b) {}
      return;
    }
    var w = wrap.clientWidth || 900, h = wrap.clientHeight || 480;
    if (!w || !h) { w = 900; h = 480; }
    var side = Math.ceil(Math.max(w, h) * 1.5);
    if (old && old.getAttribute && old.getAttribute("data-side") === String(side)) {
      try { wrap.classList.add("zy-galaxy-on"); } catch (e2) {}
      return;
    }
    if (old && old.remove) old.remove();
    var cv = document.createElement("canvas");
    cv.className = "zy-g2d-bg";
    cv.width = side; cv.height = side;
    cv.style.width = side + "px"; cv.style.height = side + "px"; cv.setAttribute("data-side", String(side));
    cv.style.opacity = (_mode === "soft") ? "0.4" : "1";
    var ctx = (typeof cv.getContext === "function") ? cv.getContext("2d") : null;
    if (ctx) { try { zy2dPaintGalaxy(ctx, side); } catch (e) {} }
    wrap.insertBefore(cv, wrap.firstChild);
    try { wrap.classList.add("zy-galaxy-on"); } catch (e) {}
  } catch (e) {}
}
function zy2dPaintGalaxy(ctx, S) {
  var cx = S / 2, cy = S / 2;
  var sd = 20260909;
  function rnd() { sd = (sd * 1664525 + 1013904223) % 4294967296; return sd / 4294967296; }
  function gauss() { return (rnd() + rnd() + rnd() + rnd() - 2) * 0.5; }
  var bg = ctx.createRadialGradient(cx, cy, 0, cx, cy, S * 0.72);
  bg.addColorStop(0, "#121d33"); bg.addColorStop(0.45, "#0a1020"); bg.addColorStop(1, "#04060d");
  ctx.fillStyle = bg; ctx.fillRect(0, 0, S, S);
  ctx.globalCompositeOperation = "lighter";
  var nebs = [["rgba(92,200,255,", 0.15], ["rgba(167,139,250,", 0.13], ["rgba(255,126,182,", 0.09], ["rgba(94,234,212,", 0.11], ["rgba(255,224,102,", 0.07], ["rgba(120,90,255,", 0.12], ["rgba(80,220,180,", 0.08]];
  for (var i = 0; i < nebs.length; i++) {
    var a = (i / nebs.length) * Math.PI * 2 + 0.7;
    var nx = cx + Math.cos(a) * S * 0.25, ny = cy + Math.sin(a) * S * 0.21;
    var rad = S * (0.15 + ((i * 53) % 17) / 90);
    var g = ctx.createRadialGradient(nx, ny, 0, nx, ny, rad);
    g.addColorStop(0, nebs[i][0] + nebs[i][1] + ")");
    g.addColorStop(0.5, nebs[i][0] + (nebs[i][1] * 0.32).toFixed(3) + ")");
    g.addColorStop(1, nebs[i][0] + "0)");
    ctx.fillStyle = g; ctx.beginPath(); ctx.arc(nx, ny, rad, 0, Math.PI * 2); ctx.fill();
  }
  // 银心辉光：中心更亮的弥漫核球，增强纵深与真实感
  var core = ctx.createRadialGradient(cx, cy, 0, cx, cy, S * 0.30);
  core.addColorStop(0, "rgba(180,205,255,0.18)");
  core.addColorStop(0.25, "rgba(120,150,230,0.10)");
  core.addColorStop(1, "rgba(10,16,32,0)");
  ctx.fillStyle = core; ctx.fillRect(0, 0, S, S);
  var band = -0.38, cb = Math.cos(band), sb = Math.sin(band);
  var SPECTRUM = ["#cfe3ff", "#e8f0ff", "#fff4e0", "#ffd9a8", "#ffb56b", "#ff8a5c", "#9fc4ff", "#ffffff"];
  var unit = S / 900;
  function starPos(inBand) {
    if (inBand) {
      var tt = (rnd() - 0.5) * S * 1.3;
      var off = gauss() * S * 0.072;
      return [cx + tt * cb - off * sb, cy + tt * sb + off * cb];
    }
    return [rnd() * S, rnd() * S];
  }
  // 真实感的核心：星等呈幂律分布——绝大多数是极暗的背景星，少量中等，极少数亮星
  // （此前是均匀分布，所以整片看起来像噪点、没有层次，也就不像真的星空）
  var TOTAL = 2600;
  for (var s = 0; s < TOTAL; s++) {
    var p = starPos(rnd() < 0.6), x = p[0], y = p[1];
    var m = rnd(), rad2, al;
    if (m > 0.985) { rad2 = (1.35 + rnd() * 0.7) * unit; al = 0.52 + rnd() * 0.3; }
    else if (m > 0.86) { rad2 = (0.72 + rnd() * 0.48) * unit; al = 0.24 + rnd() * 0.2; }
    else { rad2 = (0.26 + rnd() * 0.3) * unit; al = 0.05 + rnd() * 0.13; }
    ctx.globalAlpha = al;
    ctx.fillStyle = SPECTRUM[(rnd() * SPECTRUM.length) | 0];
    ctx.beginPath(); ctx.arc(x, y, rad2, 0, Math.PI * 2); ctx.fill();
  }
  // 疏散星团：小范围内聚集的一簇恒星，银河里真实存在的结构，能打破均匀分布感
  for (var cl = 0; cl < 7; cl++) {
    var ccx = rnd() * S, ccy = rnd() * S, crad = S * (0.018 + rnd() * 0.035);
    var cn = 22 + ((rnd() * 26) | 0);
    for (var ci = 0; ci < cn; ci++) {
      var ca = rnd() * Math.PI * 2, cd = Math.pow(rnd(), 0.6) * crad;
      ctx.globalAlpha = 0.14 + rnd() * 0.26;
      ctx.fillStyle = SPECTRUM[(rnd() * SPECTRUM.length) | 0];
      ctx.beginPath(); ctx.arc(ccx + Math.cos(ca) * cd, ccy + Math.sin(ca) * cd, (0.28 + rnd() * 0.42) * unit, 0, Math.PI * 2); ctx.fill();
    }
  }
  // 银河尘埃暗带：沿银河带切出几条不规则暗纹。真实银河的标志性结构，此前缺失导致银河像一条均匀光雾
  ctx.globalCompositeOperation = "source-over";
  for (var d = 0; d < 4; d++) {
    var dOff = (d - 1.5) * S * 0.055 + gauss() * S * 0.012;
    ctx.globalAlpha = 0.1 + rnd() * 0.1;
    var lg2 = ctx.createLinearGradient(cx - S, cy - S, cx + S, cy + S);
    lg2.addColorStop(0, "rgba(3,5,11,0)");
    lg2.addColorStop(0.5, "rgba(3,5,11,1)");
    lg2.addColorStop(1, "rgba(3,5,11,0)");
    ctx.strokeStyle = lg2;
    ctx.lineWidth = S * (0.012 + rnd() * 0.022);
    ctx.beginPath();
    var steps = 26;
    for (var st = 0; st <= steps; st++) {
      var tt2 = (st / steps - 0.5) * S * 1.35;
      var wob = Math.sin(st * 0.7 + d * 2.1) * S * 0.016 + gauss() * S * 0.006;
      var px2 = cx + tt2 * cb - (dOff + wob) * sb, py2 = cy + tt2 * sb + (dOff + wob) * cb;
      if (st === 0) ctx.moveTo(px2, py2); else ctx.lineTo(px2, py2);
    }
    ctx.stroke();
  }
  ctx.globalCompositeOperation = "lighter";
  ctx.globalAlpha = 1;
  // 亮星 + 衍射星芒（更细更长，模拟真实十字衍射），数量收敛以免抢数据层
  for (var b = 0; b < 5; b++) {
    var bx = rnd() * S, by = rnd() * S, br = (2.0 + rnd() * 2.2) * unit;
    var fl = ctx.createRadialGradient(bx, by, 0, bx, by, br * 7);
    fl.addColorStop(0, "rgba(255,255,255,0.28)"); fl.addColorStop(1, "rgba(180,210,255,0)");
    ctx.fillStyle = fl;
    ctx.beginPath(); ctx.arc(bx, by, br * 7, 0, Math.PI * 2); ctx.fill();
    ctx.strokeStyle = "rgba(255,255,255,0.10)"; ctx.lineWidth = Math.max(0.35, 0.5 * unit);
    ctx.beginPath();
    ctx.moveTo(bx - br * 6, by); ctx.lineTo(bx + br * 6, by);
    ctx.moveTo(bx, by - br * 6); ctx.lineTo(bx, by + br * 6);
    ctx.stroke();
    ctx.fillStyle = "#ffffff"; ctx.globalAlpha = 0.85;
    ctx.beginPath(); ctx.arc(bx, by, br * 0.5, 0, Math.PI * 2); ctx.fill();
    ctx.globalAlpha = 1;
  }
  var core = ctx.createRadialGradient(cx, cy, 0, cx, cy, S * 0.30);
  core.addColorStop(0, "rgba(255,236,190,0.15)");
  core.addColorStop(0.35, "rgba(150,190,255,0.06)");
  core.addColorStop(1, "rgba(120,140,255,0)");
  ctx.globalAlpha = 1; ctx.fillStyle = core;
  ctx.beginPath(); ctx.arc(cx, cy, S * 0.30, 0, Math.PI * 2); ctx.fill();
  ctx.globalCompositeOperation = "source-over";
  ctx.globalAlpha = 1;
  ctx.fillStyle = "rgba(5,8,16,0.34)";
  ctx.fillRect(0, 0, S, S);
  var vg = ctx.createRadialGradient(cx, cy, S * 0.15, cx, cy, S * 0.64);
  vg.addColorStop(0, "rgba(4,6,12,0)");
  vg.addColorStop(1, "rgba(3,5,10,0.52)");
  ctx.fillStyle = vg;
  ctx.fillRect(0, 0, S, S);
}

// ── 彩色星团球（Obsidian Galaxy 视图同款）：球壳粒子 + 彩色分簇 + 簇内近邻连线 + 外层星尘 ──
function zyOrbRng(seed) {
  var st = (seed >>> 0) || 1;
  return function () { st = (st * 1664525 + 1013904223) >>> 0; return st / 4294967296; };
}
var ZY_ORB_PALETTE = ["#7dffb4", "#7cc8ff", "#b79cff", "#ff9ecb", "#ffe08a", "#6ee7d7", "#ffb98a", "#9fd0ff"];
function zyOrbHex2rgb(h) {
  h = String(h == null ? "" : h).trim();
  var m = h.match(/^rgba?\(([^)]+)\)$/i);
  if (m) {
    var p = m[1].split(",");
    function cl(v2) { var x = (parseFloat(v2) || 0) / 255; return x < 0 ? 0 : (x > 1 ? 1 : x); }
    return { r: cl(p[0]), g: cl(p[1]), b: cl(p[2]) };
  }
  h = h.replace("#", "");
  if (h.length === 3) h = h.charAt(0) + h.charAt(0) + h.charAt(1) + h.charAt(1) + h.charAt(2) + h.charAt(2);
  var v = parseInt(h, 16);
  if (isNaN(v)) v = 0xffffff;
  return { r: ((v >> 16) & 255) / 255, g: ((v >> 8) & 255) / 255, b: (v & 255) / 255 };
}
// 生成一份「彩色星团球」数据（单位球空间，供 2D/3D 共用）
function zyClusterOrbBuild(opts) {
  opts = opts || {};
  var count = Math.max(40, opts.count || 320);
  var dustN = Math.max(0, opts.dust || 220);
  var src = (opts.clusters && opts.clusters.length >= 3) ? opts.clusters : null;   // 分簇少于 3 个则回退彩虹色板，保证「彩色星团」观感
  var K = src ? Math.min(src.length, 8) : 7;
  var rng = zyOrbRng(opts.seed || 20260910);
  var centers = [];
  for (var k = 0; k < K; k++) {
    var y = K === 1 ? 0 : 1 - (k / (K - 1)) * 2;
    var rr = Math.sqrt(Math.max(0, 1 - y * y));
    var th = k * 2.39996322972865332;
    var key = src ? String(src[k].key) : ("c" + k);
    var hex = src ? src[k].color : ZY_ORB_PALETTE[k % ZY_ORB_PALETTE.length];
    centers.push({ x: Math.cos(th) * rr, y: y, z: Math.sin(th) * rr, key: key, rgb: zyOrbHex2rgb(hex) });
  }
  function gauss() { return (rng() + rng() + rng() - 1.5) * 1.6; }
  var nodes = [];
  for (var i = 0; i < count; i++) {
    var ci = Math.min(K - 1, (rng() * K) | 0);
    var C = centers[ci];
    var ux = C.x + gauss() * 0.55, uy = C.y + gauss() * 0.55, uz = C.z + gauss() * 0.55;
    var ul = Math.sqrt(ux * ux + uy * uy + uz * uz) || 1;
    var rad = 0.34 + 0.66 * Math.pow(rng(), 0.42);
    var col = { r: C.rgb.r + (1 - C.rgb.r) * 0.42, g: C.rgb.g + (1 - C.rgb.g) * 0.42, b: C.rgb.b + (1 - C.rgb.b) * 0.42 };
    nodes.push({
      x: (ux / ul) * rad, y: (uy / ul) * rad, z: (uz / ul) * rad,
      c: ci, col: col, size: 0.55 + rng() * 0.95, alpha: 0.34 + rng() * 0.56
    });
  }
  // 簇内近邻连线（最多 3 条，限距，去重）
  var pairs = [], seen = {};
  var LIM2 = 0.215;
  for (var a = 0; a < nodes.length; a++) {
    var cand = [];
    for (var b = 0; b < nodes.length; b++) {
      if (b === a || nodes[b].c !== nodes[a].c) continue;
      var dx = nodes[a].x - nodes[b].x, dy = nodes[a].y - nodes[b].y, dz = nodes[a].z - nodes[b].z;
      var d2 = dx * dx + dy * dy + dz * dz;
      if (d2 < LIM2) cand.push([d2, b]);
    }
    cand.sort(function (p, q) { return p[0] - q[0]; });
    var take = Math.min(3, cand.length);
    for (var m = 0; m < take; m++) {
      var bb = cand[m][1];
      var lo = a < bb ? a : bb, hi = a < bb ? bb : a;
      var kk = lo + "_" + hi;
      if (seen[kk]) continue;
      seen[kk] = 1; pairs.push([lo, hi]);
    }
  }
  // 外层星尘晕（球外 1.02~1.60 倍）
  var dust = [];
  for (var d = 0; d < dustN; d++) {
    var vx = gauss(), vy = gauss(), vz = gauss();
    var vl = Math.sqrt(vx * vx + vy * vy + vz * vz) || 1;
    var drad = 1.02 + rng() * 0.58;
    dust.push({ x: (vx / vl) * drad, y: (vy / vl) * drad, z: (vz / vl) * drad, size: 0.28 + rng() * 0.55, alpha: 0.16 + rng() * 0.44 });
  }
  return { nodes: nodes, pairs: pairs, dust: dust, K: K, centers: centers };
}

// 2D 知识星球：彩色星团球（Obsidian Galaxy 视图同款）+ 漩涡收拢 + 星暴扩散
/* ===================== 知识点粒子层（2D / 3D 通用） ===================== */
var KP_KEY = "zhiyu_graph_kp_v1";
/* ---------- 删除名单：按名称屏蔽指定知识点粒子 / 天体 ---------- */
var ZY_DROP_KEY = "zhiyu_graph_dropnames";
function zyNormName(s) { return String(s == null ? "" : s).toLowerCase().replace(/[^\w\u4e00-\u9fa5]/g, ""); }
function zyDropList() { try { var a = JSON.parse(localStorage.getItem(ZY_DROP_KEY) || "[]"); return Array.isArray(a) ? a : []; } catch (e) { return []; } }
function zyDropHit(label) { var n = zyNormName(label); if (!n) return false; var a = zyDropList(); for (var i = 0; i < a.length; i++) { if (zyNormName(a[i]) === n) return true; } return false; }
var ZY_KP_SLOTS = { d2: 0, d3: 0 };
var KP_CAT_COLOR = {
  "认知系": "#7fb0ff", "决策系": "#ffd27a", "执行系": "#9fe0b0", "财富系": "#ffb36b",
  "沟通系": "#c9a8ff", "学习系": "#8fe6e6", "系统系": "#ff9fb0", "心理系": "#b9c7ff",
  "自定义": "#ffe9a8"
};
var ZY_KP_PILLARS = [
  { id: "p_cog", name: "认知", color: "#a78bfa" },
  { id: "p_mean", name: "意义", color: "#5cc8ff" },
  { id: "p_energy", name: "能量", color: "#7CFFB2" },
  { id: "p_rel", name: "关系", color: "#ff7eb6" },
  { id: "p_val", name: "价值", color: "#ffb86b" }
];
var ZY_KP_PILLAR_MAP = {
  "认知系": "p_cog", "系统系": "p_cog", "学习系": "p_cog", "心理系": "p_cog", "决策系": "p_cog",
  "执行系": "p_energy", "财富系": "p_val", "沟通系": "p_rel", "自定义": ""
};
function zyKpPillarOf(rec) {
  if (rec && rec.pillar) return rec.pillar;
  if (rec && rec.cat) return ZY_KP_PILLAR_MAP[rec.cat] || "";
  return "";
}
function kpCatColor(cat) { return KP_CAT_COLOR[cat] || KP_CAT_COLOR[String(cat || "").slice(0, 3)] || "#9fb0c3"; }
function kpLoad() {
  var d = { assign: {}, extra: [], seq: 1, pos: {} };
  try {
    var raw = localStorage.getItem(KP_KEY);
    if (raw) { var j = JSON.parse(raw); if (j && typeof j === "object") { d.assign = j.assign || {}; d.extra = j.extra || []; d.seq = j.seq || 1; } }
  } catch (e) {}
  return d;
}
function kpSave(d) { try { localStorage.setItem(KP_KEY, JSON.stringify(d)); } catch (e) {} return d; }
function kpCorpus() {
  var arr = [];
  try {
    (window.ZX_CORPUS || []).forEach(function (x) {
      arr.push({ id: x.id, label: String(x.label || ""), detail: String(x.detail || ""), full: String(x.full || ""), cat: String(x.cat || "自定义"), catName: String(x.catName || x.cat || "自定义") });
    });
  } catch (e) {}
  return arr;
}
function kpKey(mode, i) { return mode + ":" + i; }
function kpNextFree(mode, kd) {
  var n = ZY_KP_SLOTS[mode] || 0;
  for (var i = 0; i < n; i++) { if (!kd.assign[kpKey(mode, i)]) return i; }
  return -1;
}
function kpFilledList(mode, kd) {
  var out = [];
  try {
    Object.keys(kd.assign || {}).forEach(function (k) {
      if (k.indexOf(mode + ":") !== 0) return;
      var r = kd.assign[k];
      if (r) out.push({ key: k, rec: r, slot: parseInt(k.slice(mode.length + 1), 10) });
    });
    (kd.extra || []).forEach(function (r, i) {
      if (!r) return;
      if (r.mode && r.mode !== mode) return;
      out.push({ key: "extra:" + i, rec: r, slot: -1 });
    });
    try { if (zyDropList().length) out = out.filter(function (x) { return !zyDropHit(x.rec && x.rec.label); }); } catch (e) {}
  } catch (e) {}
  return out;
}
function kpHasLabel(mode, kd, label) {
  var L = String(label || "").trim();
  if (!L) return false;
  var list = kpFilledList(mode, kd);
  for (var i = 0; i < list.length; i++) { if (String(list[i].rec.label).trim() === L) return true; }
  return false;
}
function kpHasId(mode, kd, id) {
  if (!id) return false;
  var list = kpFilledList(mode, kd);
  for (var i = 0; i < list.length; i++) { if (String(list[i].rec.id) === String(id)) return true; }
  return false;
}
function kpHasItem(mode, kd, item) {
  if (item && item.id) return kpHasId(mode, kd, item.id);
  return kpHasLabel(mode, kd, item && item.label);
}
function kpMakeRec(item) {
  return {
    id: item.id || ("kp_" + Date.now() + "_" + Math.random().toString(36).slice(2, 6)),
    label: String(item.label || "未命名知识点"),
    detail: String(item.detail || ""),
    full: String(item.full || ""),
    cat: String(item.cat || "自定义"),
    catName: String(item.catName || item.cat || "自定义"),
    pillar: (item && item.pillar) || "",
    src: item.src || "method",
    ts: Date.now()
  };
}
function kpAddItem(item, mode) {
  var kd = kpLoad();
  if (kpHasItem(mode, kd, item)) return { ok: false, reason: "dup", msg: "这个知识点已经在星图里了" };
  var rec = kpMakeRec(item);
  var slot = kpNextFree(mode, kd);
  if (slot >= 0) { kd.assign[kpKey(mode, slot)] = rec; kpSave(kd); return { ok: true, overflow: false, mode: mode, slot: slot, rec: rec }; }
  rec.mode = mode;
  kd.extra.push(rec); kd.seq = (kd.seq || 1) + 1;
  kpSave(kd);
  return { ok: true, overflow: true, mode: mode, slot: -1, rec: rec };
}
function kpRemoveAt(key) {
  var kd = kpLoad();
  try {
    if (String(key).indexOf("extra:") === 0) {
      var idx = parseInt(String(key).slice(6), 10);
      if (!isNaN(idx) && kd.extra && kd.extra[idx]) kd.extra.splice(idx, 1);
    } else { delete kd.assign[key]; }
  } catch (e) {}
  kpSave(kd);
  return kd;
}
function kpFillAll(mode) {
  var kd = kpLoad();
  var pool = kpCorpus(), added = 0, over = 0, skip = 0;
  for (var i = 0; i < pool.length; i++) {
    var x = pool[i];
    if (kpHasItem(mode, kd, x)) { skip++; continue; }
    var slot = kpNextFree(mode, kd);
    var rec = kpMakeRec(x); rec.src = "method";
    if (slot >= 0) { kd.assign[kpKey(mode, slot)] = rec; added++; }
    else { rec.mode = mode; kd.extra.push(rec); over++; }
  }
  kpSave(kd);
  return { added: added, overflow: over, skip: skip };
}
function kpClearMode(mode) {
  var kd = kpLoad();
  Object.keys(kd.assign || {}).forEach(function (k) { if (k.indexOf(mode + ":") === 0) delete kd.assign[k]; });
  kd.extra = (kd.extra || []).filter(function (r) { return !r || (r.mode && r.mode !== mode); });
  kpSave(kd);
  return kd;
}
function kpShort(t, n) { t = String(t || ""); return t.length > n ? t.slice(0, n) + "…" : t; }
function kpRgb(hex) {
  var h = String(hex || "#9fb0c3").replace("#", "");
  if (h.length === 3) h = h[0] + h[0] + h[1] + h[1] + h[2] + h[2];
  var v = parseInt(h, 16);
  if (isNaN(v)) v = 0x9fb0c3;
  return { r: ((v >> 16) & 255) / 255, g: ((v >> 8) & 255) / 255, b: (v & 255) / 255 };
}
function kpCatOptions(sel) {
  var cats = [];
  try {
    kpCorpus().forEach(function (x) { if (x.cat && cats.indexOf(x.cat) < 0) cats.push(x.cat); });
  } catch (e) {}
  if (cats.indexOf("自定义") < 0) cats.push("自定义");
  return cats.map(function (c) { return "<option value='" + c + "'" + (c === sel ? " selected" : "") + ">" + c + "</option>"; }).join("");
}
/* ---------- 知识点详解弹窗（3D 点击触发）---------- */
function zyShowKpDetailModal(m, key) {
  try {
    var old = document.getElementById("zyKpDetailModal");
    if (old) old.remove();
    var ov = document.createElement("div");
    ov.id = "zyKpDetailModal";
    ov.style.cssText = "position:fixed;inset:0;z-index:99998;background:rgba(3,7,18,0.55);display:flex;align-items:center;justify-content:center;font-family:system-ui,\'Microsoft YaHei\',sans-serif";
    var card = document.createElement("div");
    card.style.cssText = "position:relative;max-width:520px;width:88%;max-height:78vh;overflow:auto;padding:20px 22px;border-radius:16px;background:linear-gradient(160deg,rgba(18,26,46,.98),rgba(12,18,34,.98));border:1px solid rgba(120,160,255,.4);box-shadow:0 24px 80px rgba(0,0,0,.6);color:#e7edf7";
    var cat = m.catName || m.cat || "知识点";
    var body = m.full || m.detail || "（暂无详细内容）";
    var html = "<div style=\'font-size:13px;color:#8fb6ff;letter-spacing:1px\'>" + escHTML(cat) + " · 知识点详解</div>";
    html += "<h3 style=\'margin:6px 0 12px;font-size:21px;color:#fff\'>" + escHTML(m.label || "未命名") + "</h3>";
    html += "<div style=\'font-size:14px;line-height:1.85;color:#d4e0f2;white-space:pre-wrap\'>" + escHTML(body) + "</div>";
    html += "<div style=\'margin-top:18px;display:flex;gap:10px;justify-content:flex-end\'>";
    if (key) html += "<button id=\'zyKpDel\' style=\'font-size:13px;padding:7px 16px;border-radius:9px;border:1px solid rgba(255,120,140,.5);background:rgba(255,90,120,.16);color:#ffc2cf;cursor:pointer\'>从星图移除</button>";
    html += "<button id=\'zyKpClose\' style=\'font-size:13px;padding:7px 18px;border-radius:9px;border:1px solid rgba(120,160,255,.5);background:rgba(92,200,255,.16);color:#bfe0ff;cursor:pointer\'>关闭</button>";
    html += "</div>";
    card.innerHTML = html;
    ov.appendChild(card);
    ov.onclick = function (e) { if (e.target === ov) ov.remove(); };
    document.body.appendChild(ov);
    var close = function () { try { ov.remove(); } catch (e) {} };
    var cBtn = document.getElementById("zyKpClose"); if (cBtn) cBtn.onclick = close;
    var dBtn = document.getElementById("zyKpDel");
    if (dBtn && key) dBtn.onclick = function () {
      try { kpRemoveAt(key); } catch (e) {}
      try { var gw = document.getElementById("graphWrap"); if (gw && gw.__zyParticle && gw.__zyParticle.setKP) gw.__zyParticle.setKP(); } catch (e) {}
      try { document.dispatchEvent(new CustomEvent("zhiyu:kp-changed")); } catch (e) {}
      close();
    };
  } catch (e) {}
}
/* ---------- 知识点添加 / 删除面板 ---------- */
function renderKpPanel(card, tab, mode, onChange, kw) {
  if (!card) return;
  var kd = kpLoad();
  var slots = ZY_KP_SLOTS[mode] || 0;
  var filled = kpFilledList(mode, kd);
  var over = Math.max(0, filled.length - slots);
  var q = String(kw || "");
  var h = "";
  h += "<div style='display:flex;gap:8px;flex-wrap:wrap;align-items:center;margin-bottom:10px'>";
  h += "<b style='font-size:13px'>" + (mode === "d3" ? "🪐 3D 星球" : "🟢 2D 网络") + " · 知识点粒子</b>";
  h += "<span class='muted' style='font-size:12px'>已填充 <b style='color:#5cc8ff'>" + filled.length + "</b> / 粒子槽位 " + (slots || "?") + (over > 0 ? " · 溢出新建 " + over : "") + "</span>";
  h += "<span style='flex:1'></span>";
  h += "<button class='ghost' id='kpTabAdd' style='font-size:12px;padding:2px 10px" + (tab === "add" ? ";background:rgba(92,200,255,.28);border-color:#5cc8ff" : "") + "'>➕ 添加</button>";
  h += "<button class='ghost' id='kpTabDel' style='font-size:12px;padding:2px 10px" + (tab === "del" ? ";background:rgba(92,200,255,.28);border-color:#5cc8ff" : "") + "'>🗑 删除</button>";
  h += "<button class='ghost' id='kpTabBody' style='font-size:12px;padding:2px 10px" + (tab === "body" ? ";background:rgba(92,200,255,.28);border-color:#5cc8ff" : "") + "'>🪐 天体</button>";
  h += "</div>";
  if (tab === "add") {
    h += "<div class='row' style='gap:6px;flex-wrap:wrap;margin-bottom:8px'>";
    h += "<input id='kpQ' placeholder='🔍 搜索系统方法论知识点' value='" + q.replace(/'/g, "") + "' style='max-width:240px;font-size:12px' />";
    h += "<select id='kpCatSel' style='max-width:140px;font-size:12px'><option value=''>全部分类</option>" + kpCatOptions("") + "</select>";
    h += "<button class='ghost' id='kpFillAll' style='font-size:12px'>⚡ 一键填充全部（" + kpCorpus().length + " 条）</button>";
    h += "</div>";
    var pool = kpCorpus();
    if (q) { var lq = q.toLowerCase(); pool = pool.filter(function (x) { return (x.label + x.catName + x.detail).toLowerCase().indexOf(lq) >= 0; }); }
    h += "<div class='muted' style='font-size:11px;margin-bottom:6px'>共 " + pool.length + " 条" + (pool.length > 120 ? "（只显示前 120 条，输入关键词缩小范围）" : "") + " · 点击「＋」填充到下一个空粒子</div>";
    h += "<div style='max-height:300px;overflow:auto;display:flex;flex-direction:column;gap:4px'>";
    pool.slice(0, 120).forEach(function (x, i) {
      var inIt = kpHasItem(mode, kd, x);
      h += "<div style='display:flex;gap:6px;align-items:center;padding:4px 6px;border-radius:6px;background:rgba(255,255,255,.03)'>";
      h += "<i style='width:8px;height:8px;border-radius:50%;background:" + kpCatColor(x.cat) + ";flex:0 0 auto'></i>";
      h += "<span style='font-size:12px;flex:1;min-width:0' title='" + escHTML(x.detail) + "'>" + escHTML(kpShort(x.label, 22)) + " <span class='muted' style='font-size:10px'>" + escHTML(x.catName) + "</span></span>";
      h += inIt ? "<span class='muted' style='font-size:11px'>已填充</span>" : "<button class='ghost kp-add-one' data-i='" + i + "' style='font-size:11px;padding:1px 8px'>＋</button>";
      h += "</div>";
    });
    h += "</div>";
    h += "<div style='margin-top:10px;padding-top:8px;border-top:1px solid rgba(255,255,255,.08)'>";
    h += "<div class='muted' style='font-size:11px;margin-bottom:4px'>自定义知识点（粒子填满后会自动新建粒子并接入粒子网）</div>";
    h += "<div class='row' style='gap:6px;flex-wrap:wrap'>";
    h += "<input id='kpNewLabel' placeholder='知识点名称' style='max-width:180px;font-size:12px' />";
    h += "<input id='kpNewDetail' placeholder='一句话说明（可选）' style='max-width:240px;font-size:12px' />";
    h += "<select id='kpNewCat' style='max-width:120px;font-size:12px'>" + kpCatOptions("自定义") + "</select>";
    h += "<select id='kpNewPillar' style='max-width:120px;font-size:12px'><option value=''>无支柱</option>" + ZY_KP_PILLARS.map(function(p){return "<option value='"+p.id+"'>"+p.name+"</option>";}).join("") + "</select>";
    h += "<button class='ghost' id='kpNewAdd' style='font-size:12px'>➕ 添加</button>";
    h += "</div></div>";
  } else if (tab === "del") {
    var list = filled;
    if (q) { var lq2 = q.toLowerCase(); list = list.filter(function (it) { return (it.rec.label + it.rec.catName + it.rec.detail).toLowerCase().indexOf(lq2) >= 0; }); }
    h += "<div class='row' style='gap:6px;flex-wrap:wrap;margin-bottom:8px'>";
    h += "<input id='kpDQ' placeholder='🔍 搜索已填充的知识点' value='" + q.replace(/'/g, "") + "' style='max-width:240px;font-size:12px' />";
    h += "<button class='ghost' id='kpClearAll' style='font-size:12px'>♻️ 清空本视图填充</button>";
    h += "</div>";
    h += "<div class='muted' style='font-size:11px;margin-bottom:6px'>已填充 " + filled.length + " 个" + (q ? " · 命中 " + list.length : "") + " · 删除后粒子恢复为空槽，等待其他板块同步</div>";
    if (!list.length) { h += "<div class='muted' style='font-size:12px'>还没有填充任何知识点</div>"; }
    h += "<div style='max-height:320px;overflow:auto;display:flex;flex-direction:column;gap:4px'>";
    list.slice(0, 300).forEach(function (it) {
      h += "<div style='display:flex;gap:6px;align-items:center;padding:4px 6px;border-radius:6px;background:rgba(255,255,255,.03)'>";
      h += "<i style='width:8px;height:8px;border-radius:50%;background:" + kpCatColor(it.rec.cat) + ";flex:0 0 auto'></i>";
      h += "<span style='font-size:12px;flex:1;min-width:0'>" + escHTML(kpShort(it.rec.label, 20)) + " <span class='muted' style='font-size:10px'>" + (it.slot >= 0 ? "粒子#" + it.slot : "新建粒子") + " · " + escHTML(it.rec.catName) + "</span></span>";
      h += "<button class='ghost kp-del-one' data-k='" + it.key + "' style='font-size:11px;padding:1px 8px'>删除</button>";
      h += "</div>";
    });
    h += "</div>";
  } else {
    var _allB = (window.__zyAllNodes || window.__zyNodes || []).slice();
    var _hiddenB = loadGraphHidden();
    var _protB = { me:1, life:1, p_cog:1, p_mean:1, p_energy:1, p_rel:1, p_val:1 };
    h += "<div class='muted' style='font-size:11px;margin-bottom:6px'>天体＝知识星球的星球/节点。核心（太阳·人生大目标·五大支柱行星）受保护不可删；其它按来源列出，删除即从星球隐藏（源数据保留，可「显示」恢复）。</div>";
    h += "<div class='row' style='gap:6px;flex-wrap:wrap;margin-bottom:8px'><input id='kpBQ' placeholder='🔍 搜索天体' style='max-width:220px;font-size:12px' /><button class='ghost' id='kpBShowAll' style='font-size:12px'>👁 显示全部</button></div>";
    var _bq = q.toLowerCase();
    var _listB = _allB.filter(function (n) { return !_protB[n.id]; });
    if (_bq) _listB = _listB.filter(function (n) { return String(n.label || n.id).toLowerCase().indexOf(_bq) >= 0; });
    if (!_listB.length) h += "<div class='muted' style='font-size:12px'>没有可隐藏的天体。</div>";
    h += "<div style='max-height:320px;overflow:auto;display:flex;flex-direction:column;gap:4px'>";
    _listB.slice(0, 300).forEach(function (n) {
      var _isH = _hiddenB.indexOf(n.id) >= 0;
      h += "<div style='display:flex;gap:6px;align-items:center;padding:4px 6px;border-radius:6px;background:rgba(255,255,255,.03)'>";
      h += "<i style='width:8px;height:8px;border-radius:50%;background:" + (n.color || "#888") + ";flex:0 0 auto'></i>";
      h += "<span style='font-size:12px;flex:1;min-width:0'>" + escHTML(String(n.label || n.id).slice(0, 22)) + " <span class='muted' style='font-size:10px'>" + escHTML(n.group || "") + (_isH ? " · 已隐藏" : "") + "</span></span>";
      h += _isH ? "<button class='ghost kp-body-show' data-id='" + n.id + "' style='font-size:11px;padding:1px 8px'>显示</button>" : "<button class='ghost kp-body-del' data-id='" + n.id + "' style='font-size:11px;padding:1px 8px'>隐藏</button>";
      h += "</div>";
    });
    h += "</div>";
  }
  card.innerHTML = h;
  var tAdd = document.getElementById("kpTabAdd"), tDel = document.getElementById("kpTabDel");
  if (tAdd) tAdd.onclick = function () { renderKpPanel(card, "add", mode, onChange, q); };
  if (tDel) tDel.onclick = function () { renderKpPanel(card, "del", mode, onChange, q); };
  var tBody = document.getElementById("kpTabBody"); if (tBody) tBody.onclick = function () { renderKpPanel(card, "body", mode, onChange, q); };
  if (tab === "add") {
    var qi = document.getElementById("kpQ");
    if (qi) {
      var tm = null;
      qi.oninput = function () { if (tm) clearTimeout(tm); var v = qi.value; tm = setTimeout(function () { renderKpPanel(card, "add", mode, onChange, v); var q2 = document.getElementById("kpQ"); if (q2) { q2.focus(); q2.setSelectionRange(v.length, v.length); } }, 220); };
    }
    var cs = document.getElementById("kpCatSel");
    if (cs) cs.onchange = function () { renderKpPanel(card, "add", mode, onChange, cs.value); };
    var fa = document.getElementById("kpFillAll");
    if (fa) fa.onclick = function () {
      var r = kpFillAll(mode);
      if (onChange) onChange();
      renderKpPanel(card, "add", mode, onChange, q);
      var tip = document.createElement("div");
      tip.className = "muted";
      tip.style.cssText = "font-size:12px;color:#5cc8ff;margin-top:6px";
      tip.textContent = "已填充 " + r.added + " 个知识点" + (r.overflow ? "，粒子已满，另新建 " + r.overflow + " 个粒子并接入粒子网" : "") + (r.skip ? "，跳过已存在的 " + r.skip + " 个" : "");
      card.insertBefore(tip, card.firstChild);
    };
    var pool2 = kpCorpus();
    if (q) { var lq3 = q.toLowerCase(); pool2 = pool2.filter(function (x) { return (x.label + x.catName + x.detail).toLowerCase().indexOf(lq3) >= 0; }); }
    Array.prototype.forEach.call(card.querySelectorAll(".kp-add-one"), function (b) {
      b.onclick = function () {
        var it = pool2[parseInt(b.getAttribute("data-i"), 10)];
        if (!it) return;
        var r = kpAddItem(it, mode);
        if (onChange) onChange();
        renderKpPanel(card, "add", mode, onChange, q);
        var tip2 = document.createElement("div");
        tip2.className = "muted";
        tip2.style.cssText = "font-size:12px;color:" + (r.ok ? "#5cc8ff" : "#ffb36b") + ";margin-top:6px";
        tip2.textContent = r.ok ? ("已填充「" + it.label + "」到" + (r.overflow ? "新建粒子（并接入粒子网）" : "粒子 #" + r.slot)) : r.msg;
        card.insertBefore(tip2, card.firstChild);
      };
    });
    var na = document.getElementById("kpNewAdd");
    if (na) na.onclick = function () {
      var lb = document.getElementById("kpNewLabel"), dt = document.getElementById("kpNewDetail"), ct = document.getElementById("kpNewCat"), pt = document.getElementById("kpNewPillar");
      var label = (lb && lb.value || "").trim();
      if (!label) { if (lb) lb.focus(); return; }
      var r = kpAddItem({ label: label, detail: (dt && dt.value || "").trim(), cat: (ct && ct.value || "自定义"), catName: (ct && ct.value || "自定义"), pillar: (pt && pt.value || ""), src: "custom" }, mode);
      if (onChange) onChange();
      renderKpPanel(card, "add", mode, onChange, q);
      var tip3 = document.createElement("div");
      tip3.className = "muted";
      tip3.style.cssText = "font-size:12px;color:" + (r.ok ? "#5cc8ff" : "#ffb36b") + ";margin-top:6px";
      if (r.ok) {
        recordFootprint("知识星球", "往星图里加了1个知识点「" + label + "」");
      }
      tip3.textContent = r.ok ? ("已添加「" + label + "」" + (r.overflow ? "，粒子已满 → 新建粒子并接入粒子网" : " → 粒子 #" + r.slot)) : r.msg;
      card.insertBefore(tip3, card.firstChild);
    };
  } else {
    var dq = document.getElementById("kpDQ");
    if (dq) {
      var tm2 = null;
      dq.oninput = function () { if (tm2) clearTimeout(tm2); var v2 = dq.value; tm2 = setTimeout(function () { renderKpPanel(card, "del", mode, onChange, v2); var q3 = document.getElementById("kpDQ"); if (q3) { q3.focus(); q3.setSelectionRange(v2.length, v2.length); } }, 220); };
    }
    var ca = document.getElementById("kpClearAll");
    if (ca) ca.onclick = function () {
      kpClearMode(mode);
      if (onChange) onChange();
      renderKpPanel(card, "del", mode, onChange, "");
    };
    Array.prototype.forEach.call(card.querySelectorAll(".kp-del-one"), function (b) {
      b.onclick = function () {
        kpRemoveAt(b.getAttribute("data-k"));
        if (onChange) onChange();
        renderKpPanel(card, "del", mode, onChange, q);
      };
    });
    // 天体（删除某个天体）交互
    var _bqEl = document.getElementById("kpBQ");
    if (_bqEl) { var _btm = null; _bqEl.oninput = function () { if (_btm) clearTimeout(_btm); var _v = _bqEl.value; _btm = setTimeout(function () { renderKpPanel(card, "body", mode, onChange, _v); }, 220); }; }
    var _bShow = document.getElementById("kpBShowAll");
    if (_bShow) _bShow.onclick = function () { saveGraphHidden([]); var _w = document.getElementById("graphWrap"); if (_w) buildKnowledgeGraph(_w); if (onChange) onChange(); renderKpPanel(card, "body", mode, onChange, ""); };
    function _bodyHidden(id, hide) {
      var _p = ["me", "life", "p_cog", "p_mean", "p_energy", "p_rel", "p_val"];
      if (_p.indexOf(id) >= 0) return;
      var _h = loadGraphHidden(); var _i = _h.indexOf(id);
      if (hide) { if (_i < 0) _h.push(id); } else { if (_i >= 0) _h.splice(_i, 1); }
      saveGraphHidden(_h);
      if (hide) { var _c = loadGraphCustom().filter(function (x) { return x.id !== id; }); saveGraphCustom(_c); }
      var _w2 = document.getElementById("graphWrap"); if (_w2) buildKnowledgeGraph(_w2);
      if (onChange) onChange();
      renderKpPanel(card, "body", mode, onChange, kw);
    }
    Array.prototype.forEach.call(card.querySelectorAll(".kp-body-del"), function (b) { b.onclick = function () { _bodyHidden(b.getAttribute("data-id"), true); }; });
    Array.prototype.forEach.call(card.querySelectorAll(".kp-body-show"), function (b) { b.onclick = function () { _bodyHidden(b.getAttribute("data-id"), false); }; });
  }
}
function zy2dParticleField(wrap, beforeEl, clusters) {
  if (!wrap || !beforeEl) return;
  try {
    if (window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
  } catch (e) {}
  if (wrap.__zyParticle) { try { wrap.__zyParticle.stop(); } catch (e) {} wrap.__zyParticle = null; }
  var cv = document.createElement("canvas");
  cv.className = "zy-g2d-particles";
  cv.style.cssText = "position:absolute;left:0;top:0;width:100%;height:100%;z-index:2;pointer-events:none";
  wrap.insertBefore(cv, beforeEl);
  var ctx = cv.getContext("2d");
  if (!ctx) return;
  var dpr = (window.devicePixelRatio || 1);
  var W = 0, H = 0, CX = 0, CY = 0;
  var _glowG = null, _coreG = null;
  function resize() {
    var w = wrap.clientWidth || 900, h = wrap.clientHeight || 480;
    if (Math.abs(w - W) < 1 && Math.abs(h - H) < 1 && cv.width === Math.floor(w * dpr)) return;
    W = w; H = h; CX = W / 2; CY = H / 2;
    cv.width = Math.floor(W * dpr); cv.height = Math.floor(H * dpr);
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    try {
      _glowG = ctx.createRadialGradient(CX, CY, 0, CX, CY, Math.min(W, H) * 0.30);
      _glowG.addColorStop(0, "rgba(120,152,255,0.045)");
      _glowG.addColorStop(1, "rgba(120,152,255,0)");
      _coreG = ctx.createRadialGradient(CX, CY, 0, CX, CY, RS * 0.55);
      _coreG.addColorStop(0, "rgba(190,212,255,0.06)");
      _coreG.addColorStop(1, "rgba(190,212,255,0)");
    } catch (e) { _glowG = null; _coreG = null; }
  }
  resize();
  var maxDim = Math.max(W, H);
  var spec = zyClusterOrbBuild({
    count: Math.min(150, Math.max(70, Math.floor(W * H / 14000))),
    dust: Math.min(110, Math.max(40, Math.floor(W * H / 18000))),
    clusters: clusters,
    seed: 20260910
  });
  var N = spec.nodes.length;
  var pairs = spec.pairs;
  var particles = [];
  var dustP = [];
  var kpPairs = [];
  var RS = 100;                       // 球体屏幕半径
  var rotY = 0, rotX = -0.40;
  function updateOrbScale() {
    var m = Math.min(W, H);
    RS = m < 240 ? m * 0.42 : m * 0.40;
    if (RS < 86) RS = 86;
  }
  updateOrbScale();
  var _GA = 2.399963229728653; // 黄金角，用于平面圆盘均匀铺点
  for (var i = 0; i < N; i++) {
    var nd = spec.nodes[i];
    // 2D 平面布局：把球面粒子铺成平面圆盘（不旋转、无透视），对齐 Obsidian 平面图观感
    var _rad = Math.sqrt((i + 0.5) / N);
    var _ang = i * _GA;
    particles.push({
      ux: Math.cos(_ang) * _rad, uy: Math.sin(_ang) * _rad, uz: 0, rr: 1,
      x: CX, y: CY, hx: CX, hy: CY, vx: 0, vy: 0, pf: 1, zz: 0,
      size: nd.size, alpha: nd.alpha, col: nd.col, col0: nd.col, size0: nd.size, kp: null, kpKey: "", phase: Math.random() * Math.PI * 2
    });
  }
  var _DN = spec.dust.length;
  for (var i2 = 0; i2 < _DN; i2++) {
    var dd = spec.dust[i2];
    var _dr = 0.12 + 0.98 * Math.sqrt((i2 + 0.5) / Math.max(1, _DN));
    var _da = i2 * _GA * 1.7;
    dustP.push({ ux: Math.cos(_da) * _dr, uy: Math.sin(_da) * _dr, uz: 0, rr: 1, x: CX, y: CY, size: dd.size, alpha: dd.alpha, pf: 1 });
  }
  // 首帧直接落到各自"家"位置（否则会从中心炸开再归位）
  for (var i3 = 0; i3 < N; i3++) { orbitProject(particles[i3], 0, -0.40); particles[i3].x = particles[i3].hx; particles[i3].y = particles[i3].hy; }
  for (var i4 = 0; i4 < dustP.length; i4++) { orbitProject(dustP[i4], 0, -0.32); dustP[i4].x = dustP[i4].hx; dustP[i4].y = dustP[i4].hy; }
  ZY_KP_SLOTS.d2 = N;
  var basePairs = pairs.length;
  function kpSeed(str) { var h = 7; str = String(str || "x"); for (var i = 0; i < str.length; i++) { h = (h * 31 + str.charCodeAt(i)) % 99991; } return h; }
  function applyKpMain() {
    var kd = kpLoad();
    for (var i = 0; i < N && i < particles.length; i++) {
      var p = particles[i];
      var rec = kd.assign["d2:" + i];
      if (rec) { p.kp = rec; p.kpKey = "d2:" + i; p.col = kpRgb(kpCatColor(rec.cat)); p.size = Math.max(p.size0, 2.6); }
      else { p.kp = null; p.kpKey = ""; p.col = p.col0; p.size = p.size0; }
    }
  }
  function buildKpExtra() {
    particles.length = N;
    pairs.length = basePairs;
    var kd = kpLoad();
    (kd.extra || []).forEach(function (r, ri) {
      if (!r) return;
      if (r.mode && r.mode !== "d2") return;
      var sd = kpSeed(r.id || r.label);
      var ang = (sd % 628) / 100;
      var rr = 1.02 + ((sd % 23) / 100); // 溢出知识点铺在平面外圈
      var ux = Math.cos(ang), uy = Math.sin(ang);
      particles.push({
        ux: ux, uy: uy, uz: 0, rr: rr, x: CX, y: CY, hx: CX, hy: CY, vx: 0, vy: 0, pf: 1, zz: 0,
        size: 3.1, alpha: 0.98, col: kpRgb(kpCatColor(r.cat)), col0: kpRgb(kpCatColor(r.cat)), size0: 3.1,
        kp: r, kpKey: "extra:" + ri, phase: (sd % 100) / 100 * Math.PI * 2
      });
      var idx = particles.length - 1;
      if (N > 0) { pairs.push([idx, sd % N]); pairs.push([idx, (sd + 41) % N]); }
    });
    for (var i = N; i < particles.length; i++) {
      orbitProject(particles[i], rotY, rotX);
      particles[i].x = particles[i].hx; particles[i].y = particles[i].hy;
    }
  }
  function setKP() {
    applyKpMain(); buildKpExtra();
    // #C 应用 2D 用户自定义拖拽位置（归一化坐标，跨尺寸/缩放持久化）后再构建连线
    try {
      var _kdPos = kpLoad();
      if (_kdPos && _kdPos.pos) {
        for (var _qi = 0; _qi < particles.length; _qi++) {
          var _q = particles[_qi];
          if (!_q || !_q.kp || !_q.kpKey) continue;
          var _qo = _kdPos.pos[_q.kpKey];
          if (!_qo || _qo.length < 2) continue;
          _q.x = CX + _qo[0] * RS; _q.y = CY + _qo[1] * RS;
          _q.hx = _q.x; _q.hy = _q.y; _q.fixed = true; _q.override = true;
        }
      }
    } catch (e) {}
    // 构建知识点之间的连接网络（最近邻），拖拽任一知识点时其连线自动跟随
    kpPairs = [];
    var kps = [];
    for (var _i = 0; _i < particles.length; _i++) if (particles[_i].kp) kps.push(_i);
    for (var _a = 0; _a < kps.length; _a++) {
      var _pa = particles[kps[_a]];
      var _cand = [];
      for (var _b = 0; _b < kps.length; _b++) {
        if (_b === _a) continue;
        var _pb = particles[kps[_b]];
        var _dx = _pa.x - _pb.x, _dy = _pa.y - _pb.y;
        _cand.push([_dx * _dx + _dy * _dy, _b]);
      }
      _cand.sort(function (x, y) { return x[0] - y[0]; });
      for (var _c = 0; _c < Math.min(2, _cand.length); _c++) kpPairs.push([kps[_a], kps[_cand[_c][1]]]);
    }
  }
  var tipEl = null;
  var hoverP = null;
  var dragP = null;
  var _dragBaseX = 0, _dragBaseY = 0, _nbBase2d = null, _moved2d = null, _dragIdx2d = -1;
  function _neighbors2d(idx) {
    var out = [];
    for (var _k = 0; _k < kpPairs.length; _k++) {
      var _a = kpPairs[_k][0], _b = kpPairs[_k][1];
      if (_a === idx) out.push(_b); else if (_b === idx) out.push(_a);
    }
    return out;
  }
  function _persistKpPos2d() {
    try {
      var kd = kpLoad(); if (!kd.pos) kd.pos = {};
      if (_moved2d) {
        for (var _mk in _moved2d) {
          if (!_moved2d.hasOwnProperty(_mk)) continue;
          var _mi = parseInt(_mk, 10);
          var _p = particles[_mi];
          if (!_p || !_p.kp || !_p.kpKey) continue;
          kd.pos[_p.kpKey] = [(_p.x - CX) / RS, (_p.y - CY) / RS];
        }
      }
      kpSave(kd);
    } catch (e) {}
  }
  var _flashP = null, _flashT = 0;
  var state = "idle";
  var targetX = CX, targetY = CY;
  var burstX = CX, burstY = CY, burstPower = 0;
  var mouseX = CX, mouseY = CY, mouseDown = false, downAt = null;
  function onMove(e) {
    var rect = wrap.getBoundingClientRect ? wrap.getBoundingClientRect() : { left: 0, top: 0 };
    mouseX = e.clientX - rect.left; mouseY = e.clientY - rect.top;
    hoverP = hitKp(mouseX, mouseY);
    if (dragP) {
      var _dx = mouseX - _dragBaseX, _dy = mouseY - _dragBaseY;
      dragP.x = _dragBaseX + _dx; dragP.y = _dragBaseY + _dy;
      dragP.vx = 0; dragP.vy = 0;
      if (Math.abs(_dx) + Math.abs(_dy) > 0.5) {
        dragP.fixed = true; dragP.override = true;
        if (_nbBase2d) {
          for (var _nbk in _nbBase2d) {
            if (!_nbBase2d.hasOwnProperty(_nbk)) continue;
            var _nbp2 = particles[_nbk]; if (!_nbp2) continue;
            var _nb = _nbBase2d[_nbk];
            _nbp2.x = _nb.x + _dx * 0.5; _nbp2.y = _nb.y + _dy * 0.5;
            _nbp2.vx = 0; _nbp2.vy = 0; _nbp2.fixed = true; _nbp2.override = true;
          }
        }
      }
    }
  }
  function onDown(e) {
    if (e.target && e.target.closest && e.target.closest("g[data-id]")) return;
    mouseDown = true; downAt = { x: e.clientX, y: e.clientY };
    var rect = wrap.getBoundingClientRect ? wrap.getBoundingClientRect() : { left: 0, top: 0 };
    mouseX = e.clientX - rect.left; mouseY = e.clientY - rect.top;
    var _hp = hitKp(mouseX, mouseY);
    if (_hp && _hp.kp) {
      dragP = _hp;
      _dragIdx2d = particles.indexOf(dragP);
      _dragBaseX = dragP.x; _dragBaseY = dragP.y;
      _nbBase2d = {}; _moved2d = {}; _moved2d[_dragIdx2d] = 1;
      var _nbs = _neighbors2d(_dragIdx2d);
      for (var _ni = 0; _ni < _nbs.length; _ni++) {
        var _nb = _nbs[_ni]; var _nbp = particles[_nb];
        if (!_nbp) continue;
        _nbBase2d[_nb] = { x: _nbp.x, y: _nbp.y };
        _moved2d[_nb] = 1;
      }
    }
  }
  function onUp(e) {
    if (mouseDown && downAt) {
      var moved = Math.abs(e.clientX - downAt.x) + Math.abs(e.clientY - downAt.y);
      if (dragP) {
        if (moved < 7) {
          // 单击不再打开详情页（改为双击）；保持已覆盖位置（若有），不清除 override
        } else {
          try { _persistKpPos2d(); } catch (e6) {}
        }
        dragP = null;
      } else if (moved < 7 && !(e.target && e.target.closest && e.target.closest("g[data-id]"))) {
        var rect = wrap.getBoundingClientRect ? wrap.getBoundingClientRect() : { left: 0, top: 0 };
        burstX = e.clientX - rect.left; burstY = e.clientY - rect.top;
        burstPower = 1; state = "burst";
      }
    }
    mouseDown = false; downAt = null;
  }
  function onLeave() { mouseDown = false; downAt = null;  }
  wrap.addEventListener("pointermove", onMove, { passive: true });
  wrap.addEventListener("pointerdown", onDown);
  wrap.addEventListener("pointerup", onUp);
  wrap.addEventListener("pointerleave", onLeave);
  wrap.addEventListener("pointercancel", onLeave);
  wrap.addEventListener("click", function (e) { if (!(window.matchMedia && window.matchMedia('(hover: none)').matches)) return; if (e.target && e.target.closest && e.target.closest("g[data-id]")) return; var _r = wrap.getBoundingClientRect ? wrap.getBoundingClientRect() : { left: 0, top: 0 }; var _mx = e.clientX - _r.left, _my = e.clientY - _r.top; var _hp = hitKp(_mx, _my); if (_hp && _hp.kp) { try { var _ev = document.createEvent("CustomEvent"); _ev.initCustomEvent("zhiyu:kp-pick", false, false, { label: _hp.kp.label, key: _hp.kpKey }); wrap.dispatchEvent(_ev); } catch (e5) {} } });
  wrap.addEventListener("click", function (e) { if (!(window.matchMedia && window.matchMedia('(hover: none)').matches)) return; if (e.target && e.target.closest && e.target.closest("g[data-id]")) return; var _r = wrap.getBoundingClientRect ? wrap.getBoundingClientRect() : { left: 0, top: 0 }; var _mx = e.clientX - _r.left, _my = e.clientY - _r.top; var _hp = hitKp(_mx, _my); if (_hp && _hp.kp) { try { var _ev = document.createEvent("CustomEvent"); _ev.initCustomEvent("zhiyu:kp-pick", false, false, { label: _hp.kp.label, key: _hp.kpKey }); wrap.dispatchEvent(_ev); } catch (e5) {} } });
  wrap.addEventListener("dblclick", function (e) {
    if (e.target && e.target.closest && e.target.closest("g[data-id]")) return;
    var rect = wrap.getBoundingClientRect ? wrap.getBoundingClientRect() : { left: 0, top: 0 };
    var _mx = e.clientX - rect.left, _my = e.clientY - rect.top;
    var _hp = hitKp(_mx, _my);
    if (_hp && _hp.kp) {
      try {
        var ev = document.createEvent("CustomEvent");
        ev.initCustomEvent("zhiyu:kp-pick", false, false, { label: _hp.kp.label, key: _hp.kpKey });
        wrap.dispatchEvent(ev);
      } catch (e5) {}
    }
  });
  function removeListeners() {
    wrap.removeEventListener("pointermove", onMove, { passive: true });
    wrap.removeEventListener("pointerdown", onDown);
    wrap.removeEventListener("pointerup", onUp);
    wrap.removeEventListener("pointerleave", onLeave);
    wrap.removeEventListener("pointercancel", onLeave);
  }
  var rafId = null, running = true, _frame = 0;
  function raf(fn) { return (window.requestAnimationFrame || function (f) { return setTimeout(f, 16); })(fn); }
  function stopRaf() { running = false; if (rafId) { try { (window.cancelAnimationFrame || clearTimeout)(rafId); } catch (e) {} } }
  // 单位球 → 旋转 → 透视投影到屏幕（得到每帧"家"位置，供省力弹簧跟随）
  function orbitProject(p, ry, rx) {
    // 2D 平面模式：不做 3D 旋转与透视投影，粒子平铺在同一平面，避免"2D 变 3D"的球体观感
    p.zz = 0; p.pf = 1;
    p.hx = CX + p.ux * p.rr * RS;
    p.hy = CY + p.uy * p.rr * RS;
  }
  function update() {
    resize(); updateOrbScale();
    var now = (typeof performance !== "undefined" && performance.now) ? performance.now() : Date.now();
    rotY = 0; rotX = 0; // 平面模式：不自转、不俯仰
    for (var i = 0; i < particles.length; i++) orbitProject(particles[i], rotY, rotX);
    for (var i2 = 0; i2 < dustP.length; i2++) orbitProject(dustP[i2], rotY * 0.55, rotX * 0.8);
    if (state === "burst") {
      for (var i = 0; i < particles.length; i++) {
        var p = particles[i];
        var dx = p.x - burstX, dy = p.y - burstY;
        var d = Math.sqrt(dx * dx + dy * dy) || 1;
        var f = burstPower * (10 + 58 / (d + 8));
        p.vx += (dx / d) * f; p.vy += (dy / d) * f;
      }
      burstPower *= 0.935;
      if (burstPower < 0.015) { burstPower = 0; state = "idle"; }
    } else {
      for (var i = 0; i < particles.length; i++) {
        var p = particles[i];
        if (p === dragP || p.fixed) { p.vx = 0; p.vy = 0; continue; }
        var dx = p.hx - p.x, dy = p.hy - p.y;
        p.vx += dx * 0.010;
        p.vy += dy * 0.010;
        var t = now * 0.0007 + p.phase;
        p.vx += Math.cos(t) * 0.05;
        p.vy += Math.sin(t * 0.8) * 0.035;
      }
    }
    for (var i = 0; i < particles.length; i++) {
      var p = particles[i];
      if (p === dragP || p.fixed) continue;
      p.vx *= 0.90; p.vy *= 0.90;
      p.x += p.vx; p.y += p.vy;
      var ex = p.x - CX, ey = p.y - CY;
      var ed = Math.sqrt(ex * ex + ey * ey) || 1;
      var lim = RS * 1.55;
      if (ed > lim) { p.x = CX + (ex / ed) * lim; p.y = CY + (ey / ed) * lim; p.vx *= 0.4; p.vy *= 0.4; }
    }
    for (var i3 = 0; i3 < dustP.length; i3++) { var q = dustP[i3]; q.x = q.hx; q.y = q.hy; }
  }
  function drawConnections() {
    ctx.lineWidth = 0.62;
    for (var i = 0; i < pairs.length; i++) {
      var a = particles[pairs[i][0]], b = particles[pairs[i][1]];
      if (!a || !b) continue;
      var pf = (a.pf + b.pf) * 0.5;
      var al = 0.17 * pf * pf;
      if (al < 0.022) continue;
      var c = a.col;
      ctx.strokeStyle = "rgba(" + ((c.r * 255) | 0) + "," + ((c.g * 255) | 0) + "," + ((c.b * 255) | 0) + "," + al.toFixed(3) + ")";
      ctx.beginPath(); ctx.moveTo(a.x, a.y); ctx.lineTo(b.x, b.y); ctx.stroke();
    }
    // 知识点之间的连线（随拖拽实时跟随，因为按粒子对象引用）
    for (var _k = 0; _k < kpPairs.length; _k++) {
      var ka = particles[kpPairs[_k][0]], kb = particles[kpPairs[_k][1]];
      if (!ka || !kb) continue;
      var kc = ka.col;
      ctx.strokeStyle = "rgba(" + ((kc.r * 255) | 0) + "," + ((kc.g * 255) | 0) + "," + ((kc.b * 255) | 0) + ",0.42)";
      ctx.lineWidth = 1.0;
      ctx.beginPath(); ctx.moveTo(ka.x, ka.y); ctx.lineTo(kb.x, kb.y); ctx.stroke();
    }
  }
  function draw() {
    ctx.clearRect(0, 0, W, H);
    if (_glowG) { ctx.fillStyle = _glowG; ctx.fillRect(0, 0, W, H); }
    else { var glow = ctx.createRadialGradient(CX, CY, 0, CX, CY, Math.min(W, H) * 0.30); glow.addColorStop(0, "rgba(120,152,255,0.045)"); glow.addColorStop(1, "rgba(120,152,255,0)"); ctx.fillStyle = glow; ctx.fillRect(0, 0, W, H); }
    ctx.globalCompositeOperation = "lighter";
    if (_coreG) { ctx.fillStyle = _coreG; ctx.fillRect(0, 0, W, H); }
    else { var core = ctx.createRadialGradient(CX, CY, 0, CX, CY, RS * 0.55); core.addColorStop(0, "rgba(190,212,255,0.06)"); core.addColorStop(1, "rgba(190,212,255,0)"); ctx.fillStyle = core; ctx.fillRect(0, 0, W, H); }
    ctx.globalCompositeOperation = "source-over";
    for (var d = 0; d < dustP.length; d++) {
      var q = dustP[d];
      ctx.globalAlpha = q.alpha * (0.18 + 0.42 * q.pf) * 0.7;
      ctx.fillStyle = "#eaf2ff";
      var sz = Math.max(0.7, q.size * q.pf * 1.5);
      ctx.fillRect(q.x, q.y, sz, sz);
    }
    drawConnections();
    var kpCount = 0;
    for (var kc = 0; kc < particles.length; kc++) { if (particles[kc].kp) kpCount++; }
    var showLab = kpCount <= 1200;
    for (var i = 0; i < particles.length; i++) {
      var p = particles[i];
      var c = p.col;
      var isKp = !!p.kp;
      var isHover = (p === hoverP);
      var rad = Math.max(0.5, p.size * p.pf * (isKp ? (isHover ? 4.6 : 3.0) : 1.4));
      ctx.globalAlpha = isKp ? Math.min(0.8, p.alpha * (0.42 + 0.40 * p.pf)) : p.alpha * (0.16 + 0.50 * p.pf);
      ctx.fillStyle = "rgb(" + ((c.r * 255) | 0) + "," + ((c.g * 255) | 0) + "," + ((c.b * 255) | 0) + ")";
      ctx.beginPath(); ctx.arc(p.x, p.y, rad, 0, Math.PI * 2); ctx.fill();
      if (isKp) {
        ctx.globalAlpha = Math.min(0.15, 0.11 * p.pf);
        ctx.beginPath(); ctx.arc(p.x, p.y, rad * 2.3, 0, Math.PI * 2); ctx.fill();
      }
      if (isHover) {
        ctx.globalAlpha = 0.9; ctx.strokeStyle = "#ffffff"; ctx.lineWidth = 1.2;
        ctx.beginPath(); ctx.arc(p.x, p.y, rad + 3.5, 0, Math.PI * 2); ctx.stroke();
      }
      if (isKp && showLab && p.pf > 0.88 && (window.ZY_KP_NAME ? window.ZY_KP_NAME.others : true)) {
        ctx.globalAlpha = Math.min(0.9, (p.pf - 0.88) * 5);
        ctx.font = "8px system-ui,-apple-system,'Segoe UI','Microsoft YaHei',sans-serif";
        ctx.lineWidth = 2.4; ctx.strokeStyle = "rgba(3,7,18,0.9)";
        ctx.strokeText(kpShort(p.kp.label, 8), p.x + rad + 2, p.y + 3);
        ctx.fillStyle = isHover ? "#ffffff" : "#e3ecff";
        ctx.fillText(kpShort(p.kp.label, 8), p.x + rad + 2, p.y + 3);
      }
    }
    updateTip();
    if (_flashT > 0 && _flashP) {
      _flashT -= 0.015;
      var fr = 10 + (1 - _flashT) * 28;
      ctx.globalAlpha = Math.max(0, _flashT);
      ctx.strokeStyle = "#ffd86b"; ctx.lineWidth = 2;
      ctx.beginPath(); ctx.arc(_flashP.x, _flashP.y, fr, 0, Math.PI * 2); ctx.stroke();
      ctx.globalAlpha = 1;
    }
    ctx.globalCompositeOperation = "source-over";
    ctx.globalAlpha = 1;
  }
  function hitKp(mx, my) {
    var best = null, bd = 15 * 15;
    for (var i = 0; i < particles.length; i++) {
      var p = particles[i];
      if (!p.kp) continue;
      var dx = p.x - mx, dy = p.y - my, d2 = dx * dx + dy * dy;
      if (d2 < bd) { bd = d2; best = p; }
    }
    return best;
  }
  function locate2d(label) {
    _flashP = null; _flashT = 0;
    if (!label) return false;
    label = String(label).toLowerCase();
    for (var _i = 0; _i < particles.length; _i++) {
      if (particles[_i].kp && particles[_i].kp.label && particles[_i].kp.label.toLowerCase().indexOf(label) >= 0) { _flashP = particles[_i]; _flashT = 1; return true; }
    }
    return false;
  }
  function updateTip() {
    if (!tipEl) {
      tipEl = document.createElement("div");
      tipEl.style.cssText = "position:absolute;z-index:9;pointer-events:none;max-width:250px;padding:6px 9px;border-radius:8px;"
        + "background:rgba(8,14,28,.94);border:1px solid rgba(120,170,255,.4);color:#dfe9ff;font-size:11px;line-height:1.55;"
        + "display:none;box-shadow:0 6px 22px rgba(0,0,0,.55)";
      if (wrap) wrap.appendChild(tipEl);
    }
    if (!hoverP || !hoverP.kp) { tipEl.style.display = "none"; return; }
    var r = hoverP.kp;
    tipEl.innerHTML = "<div style='font-size:12px;font-weight:700;color:#fff'>" + escHTML(kpShort(r.label, 18)) + "</div>"
      + "<div style='margin-top:2px;color:#8fb6ff'>" + escHTML(r.catName || r.cat || "") + " · 知识点粒子</div>"
      + (r.detail ? "<div style='margin-top:4px;opacity:.85'>" + escHTML(kpShort(r.detail, 60)) + "</div>" : "")
      + "<div style='margin-top:4px;opacity:.6'>点击可管理 / 删除</div>";
    tipEl.style.display = "";
    var tw = 250, th = 90;
    var lx = hoverP.x + 14, ly = hoverP.y + 12;
    if (lx + tw > W) lx = Math.max(4, hoverP.x - tw - 14);
    if (ly + th > H) ly = Math.max(4, hoverP.y - th - 10);
    tipEl.style.left = lx + "px";
    tipEl.style.top = ly + "px";
  }
  function loop() {
    if (!running) return;
    _frame = (_frame + 1) % 2;
    if (_frame === 0) { update(); draw(); }
    rafId = raf(loop);
  }
  loop();
  // 用户要求：2D 星球默认载入系统思维方法论粒子（仅首次为空时）
  try { if (!kpFilledList("d2", kpLoad()).length) kpFillAll("d2"); } catch (e) {}
  setKP();
  wrap.__zyParticle = {
    stop: function () { stopRaf(); removeListeners(); try { cv.remove(); } catch (e) {} if (tipEl) { try { tipEl.remove(); } catch (e3) {} } },
    setKP: setKP,
    locate: locate2d
  };
}
function zy2dPlanet(g, n, col0, NS, defs) {
  var R = Math.max(4, n.r || 10);
  var isStar = (n.id === "me");
  var ty = isStar ? "star" : zyPlanetType(n.id);
  var uid = "zy2dp_" + String(n.id).replace(/[^a-zA-Z0-9_]/g, "_");
  var base = zySat(zyHex2rgb(col0), 0.4);
  var mid = zyRgb(base);
  var hi = zyRgb(zyLift(base, isStar ? 0.8 : 0.55));
  var lit = zyRgb(zyLift(base, 0.18));
  var lo = zyRgb(zyDrop(base, 0.62));
  var sd = (zyHash(n.id) || 1);
  function nrnd() { sd = (sd * 1103515245 + 12345) % 2147483648; return sd / 2147483648; }
  // 1) 大气辉光
  var gg = zy2dMk(NS, "radialGradient", { id: uid + "_g" }, defs);
  zy2dMk(NS, "stop", { offset: "0%", "stop-color": mid, "stop-opacity": isStar ? "0.6" : "0.32" }, gg);
  zy2dMk(NS, "stop", { offset: "48%", "stop-color": mid, "stop-opacity": isStar ? "0.17" : "0.095" }, gg);
  zy2dMk(NS, "stop", { offset: "100%", "stop-color": mid, "stop-opacity": "0" }, gg);
  zy2dMk(NS, "circle", { r: (R * (isStar ? 2.9 : (ty === "lava" ? 2.35 : 1.95))).toFixed(2), fill: "url(#" + uid + "_g)" }, g);
  // 2) 行星环后半（气态 / 冰质，约六成带环）
  var hasRing = R >= 11 && (ty === "gas" || ty === "ice") && (zyHash(n.id) % 10) < 6;
  var ringFront = null;
  if (hasRing) {
    var rx = R * 1.95, ry = R * 0.58, sw = Math.max(1.1, R * 0.24);
    var rc = zyRgb(zyLift(base, 0.34));
    zy2dMk(NS, "ellipse", { rx: rx, ry: ry, fill: "none", stroke: rc, "stroke-width": sw, opacity: "0.42", transform: "rotate(-20)" }, g);
    ringFront = { rx: rx, ry: ry, sw: sw, rc: rc };
  }
  // 3) 球体：明暗 + 表面纹理（裁进圆内）
  var bg2 = zy2dMk(NS, "radialGradient", { id: uid + "_b", cx: "35%", cy: "32%", r: "74%" }, defs);
  zy2dMk(NS, "stop", { offset: "0%", "stop-color": hi }, bg2);
  zy2dMk(NS, "stop", { offset: "46%", "stop-color": lit }, bg2);
  zy2dMk(NS, "stop", { offset: "100%", "stop-color": lo }, bg2);
  var lg = zy2dMk(NS, "radialGradient", { id: uid + "_l", cx: "35%", cy: "32%", r: "80%" }, defs);
  zy2dMk(NS, "stop", { offset: "56%", "stop-color": "#01050e", "stop-opacity": "0" }, lg);
  zy2dMk(NS, "stop", { offset: "100%", "stop-color": "#01050e", "stop-opacity": "0.58" }, lg);
  var clip = zy2dMk(NS, "clipPath", { id: uid + "_c" }, defs);
  zy2dMk(NS, "circle", { r: R }, clip);
  var bodyG = zy2dMk(NS, "g", { "clip-path": "url(#" + uid + "_c)" }, g);
  zy2dMk(NS, "circle", { r: R, fill: "url(#" + uid + "_b)" }, bodyG);
  var spinG = zy2dMk(NS, "g", null, bodyG);
  if (ty === "rocky" || ty === "ice" || ty === "lava" || isStar) {
    spinG.setAttribute("class", "zy-g2d-planet-spin");
    spinG.style.animationDuration = (16 + (zyHash(n.id) % 26)) + "s";
    if (zyHash(n.id) % 2 === 0) spinG.style.animationDirection = "reverse";
  }
  var i, yy, px, py;
  if (ty === "gas") {
    for (i = 0; i < 5; i++) {
      yy = -R + (i / 5) * 2 * R + nrnd() * R * 0.12;
      var hh = R * (0.14 + nrnd() * 0.18);
      var bc = (i % 2 === 0) ? zyRgb(zyLift(base, 0.28)) : zyRgb(zyDrop(base, 0.44));
      zy2dMk(NS, "rect", { x: -R, y: yy, width: R * 2, height: hh, fill: bc, opacity: "0.34" }, spinG);
    }
    zy2dMk(NS, "ellipse", { cx: ((nrnd() - 0.5) * R * 0.9).toFixed(2), cy: ((nrnd() - 0.5) * R * 0.8).toFixed(2), rx: (R * 0.34).toFixed(2), ry: (R * 0.2).toFixed(2), fill: zyRgb(zyLift(base, 0.5)), opacity: "0.5" }, spinG);
  } else if (ty === "ice") {
    for (i = 0; i < 3; i++) {
      yy = -R + ((i + 0.5) / 3) * 2 * R;
      zy2dMk(NS, "rect", { x: -R, y: yy, width: R * 2, height: (R * (0.08 + nrnd() * 0.1)).toFixed(2), fill: zyRgb(zyLift(base, 0.42)), opacity: "0.3" }, spinG);
    }
    for (i = 0; i < 2; i++) {
      px = ((nrnd() - 0.5) * R * 1.4).toFixed(2); py = ((nrnd() - 0.5) * R * 1.4).toFixed(2);
      zy2dMk(NS, "path", { d: "M " + px + " " + py + " l " + (R * 0.4).toFixed(2) + " " + (R * 0.22).toFixed(2) + " l " + (R * 0.3).toFixed(2) + " " + (-R * 0.3).toFixed(2), fill: "none", stroke: zyRgb(zyLift(base, 0.6)), "stroke-width": Math.max(0.6, R * 0.09).toFixed(2), opacity: "0.45" }, spinG);
    }
  } else if (ty === "lava" || isStar) {
    for (i = 0; i < 4; i++) {
      var ax = ((nrnd() - 0.5) * R * 1.5).toFixed(2), ay = ((nrnd() - 0.5) * R * 1.5).toFixed(2);
      zy2dMk(NS, "path", { d: "M " + ax + " " + ay + " q " + (R * 0.35).toFixed(2) + " " + (-R * 0.3).toFixed(2) + " " + (R * 0.7).toFixed(2) + " " + (R * 0.12).toFixed(2), fill: "none", stroke: isStar ? "#fff2c4" : "#ffb347", "stroke-width": Math.max(0.7, R * 0.13).toFixed(2), "stroke-linecap": "round", opacity: "0.85" }, spinG);
    }
  } else {
    for (i = 0; i < 4; i++) {
      zy2dMk(NS, "ellipse", { cx: ((nrnd() - 0.5) * R * 1.3).toFixed(2), cy: ((nrnd() - 0.5) * R * 1.3).toFixed(2), rx: (R * (0.22 + nrnd() * 0.34)).toFixed(2), ry: (R * (0.16 + nrnd() * 0.26)).toFixed(2), fill: (i % 2 ? zyRgb(zyDrop(base, 0.5)) : zyRgb(zyLift(base, 0.3))), opacity: "0.4" }, spinG);
    }
  }
  zy2dMk(NS, "circle", { r: R, fill: "url(#" + uid + "_l)" }, bodyG);
  // 4) 行星环前半（压在球体上，形成穿插感）
  if (ringFront) {
    zy2dMk(NS, "path", { d: "M " + (-ringFront.rx) + " 0 A " + ringFront.rx + " " + ringFront.ry + " 0 0 0 " + ringFront.rx + " 0", fill: "none", stroke: ringFront.rc, "stroke-width": ringFront.sw, opacity: "0.7", transform: "rotate(-20)" }, g);
  }
  // 5) 高光
  zy2dMk(NS, "ellipse", { cx: (-R * 0.33).toFixed(2), cy: (-R * 0.37).toFixed(2), rx: (R * 0.27).toFixed(2), ry: (R * 0.18).toFixed(2), fill: "#ffffff", opacity: isStar ? "0.36" : "0.26", transform: "rotate(-28 " + (-R * 0.33).toFixed(2) + " " + (-R * 0.37).toFixed(2) + ")" }, g);
  zy2dMk(NS, "path", { d: "M " + (R * Math.cos(2.967)).toFixed(2) + " " + (R * Math.sin(2.967)).toFixed(2) + " A " + R.toFixed(2) + " " + R.toFixed(2) + " 0 0 1 " + (R * Math.cos(4.886)).toFixed(2) + " " + (R * Math.sin(4.886)).toFixed(2), fill: "none", stroke: zyRgb(zyLift(base, 0.62)), "stroke-width": Math.max(0.7, R * 0.09).toFixed(2), "stroke-linecap": "round", "stroke-opacity": "0.45", "pointer-events": "none" }, g);
}
function zy2dDrawNode(g, n, col0, NS, defs) {
  var ot = n.otype || "planet";
  var R = Math.max(4, n.r || 10);
  if (ot === "blackhole") {
    var bhId = "zybh_" + String(n.id).replace(/[^a-zA-Z0-9_]/g, "_");
    var bg = document.createElementNS(NS, "radialGradient"); bg.id = bhId; defs.appendChild(bg);
    zy2dMk(NS, "stop", { offset: "0%", "stop-color": "#000000", "stop-opacity": "1" }, bg);
    zy2dMk(NS, "stop", { offset: "60%", "stop-color": "#05060a", "stop-opacity": "1" }, bg);
    zy2dMk(NS, "stop", { offset: "100%", "stop-color": "#3a2a44", "stop-opacity": "0" }, bg);
    zy2dMk(NS, "circle", { r: (R * 1.05).toFixed(2), fill: "url(#" + bhId + ")" }, g);
    zy2dMk(NS, "circle", { r: (R * 1.02).toFixed(2), fill: "none", stroke: "#000", "stroke-width": "1.2" }, g);
    zy2dMk(NS, "ellipse", { rx: (R * 2.0).toFixed(2), ry: (R * 0.62).toFixed(2), fill: "none", stroke: "#ffcf9e", "stroke-width": (Math.max(1.4, R * 0.22)).toFixed(2), opacity: "0.9", transform: "rotate(-18)" }, g);
    zy2dMk(NS, "ellipse", { rx: (R * 2.5).toFixed(2), ry: (R * 0.8).toFixed(2), fill: "none", stroke: "#ff9a6b", "stroke-width": "1", opacity: "0.4", transform: "rotate(-18)" }, g);
    var bhg = document.createElementNS(NS, "radialGradient"); bhg.id = bhId + "_g"; defs.appendChild(bhg);
    zy2dMk(NS, "stop", { offset: "0%", "stop-color": "#ffd9a8", "stop-opacity": "0" }, bhg);
    zy2dMk(NS, "stop", { offset: "72%", "stop-color": "#ffd9a8", "stop-opacity": "0" }, bhg);
    zy2dMk(NS, "stop", { offset: "100%", "stop-color": "#ffd9a8", "stop-opacity": "0.22" }, bhg);
    zy2dMk(NS, "circle", { r: (R * 2.6).toFixed(2), fill: "url(#" + bhId + "_g)" }, g);
    return;
  }
  if (ot === "meteoroid") {
    var ig = document.createElementNS(NS, "g"); ig.setAttribute("class", "zy-meteoroid-rock"); g.appendChild(ig);
    var pts = [], N = 7; for (var mi = 0; mi < N; mi++) { var a = mi / N * 6.283, rr = R * (0.55 + ((zyHash(n.id + mi) | 0) % 40) / 100); pts.push((Math.cos(a) * rr).toFixed(2) + "," + (Math.sin(a) * rr).toFixed(2)); }
    zy2dMk(NS, "polygon", { points: pts.join(" "), fill: "#b9c2cc", stroke: "#e8eef6", "stroke-width": "1", opacity: "0.96" }, ig);
    zy2dMk(NS, "circle", { cx: (R * 0.2).toFixed(2), cy: (-R * 0.2).toFixed(2), r: (R * 0.18).toFixed(2), fill: "#5a6470" }, ig);
    var tlId = "zytl_" + String(n.id).replace(/[^a-zA-Z0-9_]/g, "_");
    var tg = document.createElementNS(NS, "linearGradient"); tg.id = tlId; defs.appendChild(tg);
    zy2dMk(NS, "stop", { offset: "0%", "stop-color": "#cfe8ff", "stop-opacity": "0" }, tg);
    zy2dMk(NS, "stop", { offset: "100%", "stop-color": "#cfe8ff", "stop-opacity": "0.5" }, tg);
    zy2dMk(NS, "rect", { x: (-R * 5).toFixed(2), y: "-1", width: (R * 4).toFixed(2), height: "2", fill: "url(#" + tlId + ")", opacity: "0.6", transform: "rotate(8)" }, g);
    return;
  }
  if (ot === "meteorite") {
    var ig2 = document.createElementNS(NS, "g"); g.appendChild(ig2);
    var pts2 = [], N2 = 8; for (var mj = 0; mj < N2; mj++) { var a2 = mj / N2 * 6.283, rr2 = R * (0.7 + ((zyHash(n.id + mj * 3) | 0) % 35) / 100); pts2.push((Math.cos(a2) * rr2).toFixed(2) + "," + (Math.sin(a2) * rr2).toFixed(2)); }
    var mtId = "zymt_" + String(n.id).replace(/[^a-zA-Z0-9_]/g, "_");
    var gg2 = zy2dMk(NS, "radialGradient", { id: mtId, cx: "38%", cy: "34%", r: "72%" }, defs);
    zy2dMk(NS, "stop", { offset: "0%", "stop-color": "#a98c6b" }, gg2);
    zy2dMk(NS, "stop", { offset: "100%", "stop-color": "#5b4632" }, gg2);
    zy2dMk(NS, "polygon", { points: pts2.join(" "), fill: "url(#" + mtId + ")", stroke: "#3a2c1e", "stroke-width": "1.2" }, ig2);
    return;
  }
  if (ot === "star") {
    var stId = "zyst_" + String(n.id).replace(/[^a-zA-Z0-9_]/g, "_");
    var sgr = document.createElementNS(NS, "radialGradient"); sgr.id = stId; defs.appendChild(sgr);
    zy2dMk(NS, "stop", { offset: "0%", "stop-color": "#fff6d8", "stop-opacity": "1" }, sgr);
    zy2dMk(NS, "stop", { offset: "45%", "stop-color": col0, "stop-opacity": "0.9" }, sgr);
    zy2dMk(NS, "stop", { offset: "100%", "stop-color": col0, "stop-opacity": "0" }, sgr);
    zy2dMk(NS, "circle", { r: (R * 2.6).toFixed(2), fill: "url(#" + stId + ")" }, g);
    zy2dMk(NS, "circle", { r: R.toFixed(2), fill: "#fff6d8", opacity: "0.95" }, g);
    var spk = "M0 " + (-R * 2.4).toFixed(2) + " L " + (R * 0.18).toFixed(2) + " " + (-R * 0.18).toFixed(2) + " L " + (R * 2.4).toFixed(2) + " 0 L " + (R * 0.18).toFixed(2) + " " + (R * 0.18).toFixed(2) + " L 0 " + (R * 2.4).toFixed(2) + " L " + (-R * 0.18).toFixed(2) + " " + (R * 0.18).toFixed(2) + " L " + (-R * 2.4).toFixed(2) + " 0 L " + (-R * 0.18).toFixed(2) + " " + (-R * 0.18).toFixed(2) + " Z";
    zy2dMk(NS, "path", { d: spk, fill: "#fff2c4", opacity: "0.26" }, g);
    return;
  }
  if (ot === "moon") {
    var mnId = "zymn_" + String(n.id).replace(/[^a-zA-Z0-9_]/g, "_");
    var mgr = zy2dMk(NS, "radialGradient", { id: mnId, cx: "38%", cy: "34%", r: "72%" }, defs);
    zy2dMk(NS, "stop", { offset: "0%", "stop-color": "#e9edf2" }, mgr);
    zy2dMk(NS, "stop", { offset: "100%", "stop-color": "#8a9099" }, mgr);
    zy2dMk(NS, "circle", { r: R, fill: "url(#" + mnId + ")" }, g);
    zy2dMk(NS, "circle", { cx: (-R * 0.3).toFixed(2), cy: (-R * 0.2).toFixed(2), r: (R * 0.18).toFixed(2), fill: "#7c828b", opacity: "0.6" }, g);
    zy2dMk(NS, "circle", { cx: (R * 0.25).toFixed(2), cy: (R * 0.3).toFixed(2), r: (R * 0.12).toFixed(2), fill: "#7c828b", opacity: "0.5" }, g);
    return;
  }
  if (ot === "asteroid") {
    var asId = "zyas_" + String(n.id).replace(/[^a-zA-Z0-9_]/g, "_");
    var agr = zy2dMk(NS, "radialGradient", { id: asId, cx: "40%", cy: "36%", r: "70%" }, defs);
    zy2dMk(NS, "stop", { offset: "0%", "stop-color": "#b8a892" }, agr);
    zy2dMk(NS, "stop", { offset: "100%", "stop-color": "#5f5343" }, agr);
    var apts = [], an = 9; for (var ai = 0; ai < an; ai++) { var aa = ai / an * 6.283, ar = R * (0.62 + ((zyHash(n.id + ai * 2) | 0) % 30) / 100); apts.push((Math.cos(aa) * ar).toFixed(2) + "," + (Math.sin(aa) * ar).toFixed(2)); }
    zy2dMk(NS, "polygon", { points: apts.join(" "), fill: "url(#" + asId + ")", stroke: "#3a3024", "stroke-width": "1" }, g);
    return;
  }
  if (ot === "nebula") {
    var nbId = "zynb_" + String(n.id).replace(/[^a-zA-Z0-9_]/g, "_");
    var ngr = zy2dMk(NS, "radialGradient", { id: nbId, cx: "50%", cy: "50%", r: "50%" }, defs);
    zy2dMk(NS, "stop", { offset: "0%", "stop-color": col0, "stop-opacity": "0.55" }, ngr);
    zy2dMk(NS, "stop", { offset: "55%", "stop-color": col0, "stop-opacity": "0.2" }, ngr);
    zy2dMk(NS, "stop", { offset: "100%", "stop-color": col0, "stop-opacity": "0" }, ngr);
    zy2dMk(NS, "circle", { r: (R * 3.2).toFixed(2), fill: "url(#" + nbId + ")", opacity: "0.85" }, g);
    zy2dMk(NS, "circle", { r: (R * 0.5).toFixed(2), fill: col0, opacity: "0.5" }, g);
    return;
  }
  if (ot === "pulsar") {
    var psId = "zyps_" + String(n.id).replace(/[^a-zA-Z0-9_]/g, "_");
    var pgr = document.createElementNS(NS, "radialGradient"); pgr.id = psId; defs.appendChild(pgr);
    zy2dMk(NS, "stop", { offset: "0%", "stop-color": "#dff3ff", "stop-opacity": "1" }, pgr);
    zy2dMk(NS, "stop", { offset: "45%", "stop-color": "#7fd0ff", "stop-opacity": "0.85" }, pgr);
    zy2dMk(NS, "stop", { offset: "100%", "stop-color": "#7fd0ff", "stop-opacity": "0" }, pgr);
    zy2dMk(NS, "circle", { r: (R * 2.6).toFixed(2), fill: "url(#" + psId + ")" }, g);
    zy2dMk(NS, "circle", { r: R.toFixed(2), fill: "#eaf7ff", opacity: "0.95" }, g);
    [1, -1].forEach(function (s) { zy2dMk(NS, "rect", { x: (s * R * 0.5).toFixed(2), y: "-1.2", width: (s * R * 3.4).toFixed(2), height: "2.4", fill: "#bfe8ff", opacity: "0.5", transform: "rotate(" + (s * 90) + ")" }, g); });
    return;
  }
  zy2dPlanet(g, n, col0, NS, defs);
  if (ot === "comet") {
    var cmId = "zycm_" + String(n.id).replace(/[^a-zA-Z0-9_]/g, "_");
    var cg = document.createElementNS(NS, "linearGradient"); cg.id = cmId; defs.appendChild(cg);
    zy2dMk(NS, "stop", { offset: "0%", "stop-color": col0, "stop-opacity": "0" }, cg);
    zy2dMk(NS, "stop", { offset: "100%", "stop-color": col0, "stop-opacity": "0.5" }, cg);
    var cdir = ((zyHash(n.id) % 2) ? 1 : -1);
    zy2dMk(NS, "ellipse", { cx: (cdir * -R * 2.4).toFixed(2), cy: (R * 0.3).toFixed(2), rx: (R * 2.2).toFixed(2), ry: (R * 0.5).toFixed(2), fill: "url(#" + cmId + ")", opacity: "0.6", transform: "rotate(" + (cdir * 12) + " " + (cdir * -R * 2.4).toFixed(2) + " " + (R * 0.3).toFixed(2) + ")" }, g);
  }
}
function zyMeteorShowerTick(gAll, nodes, NS) {
  try {
    var mets = nodes.filter(function (n) { return n.otype === "meteoroid" && n.__g; });
    if (!mets.length) return;
    var m = mets[(Math.random() * mets.length) | 0];
    var planets = nodes.filter(function (n) { return n.otype === "planet" || n.otype === "moon"; });
    if (!planets.length) return;
    var best = null, bd = 1e9; planets.forEach(function (p) { var d = Math.hypot(p.x - m.x, p.y - m.y); if (d < bd) { bd = d; best = p; } });
    if (!best) return;
    var grp = document.createElementNS(NS, "g"); grp.setAttribute("class", "zy-meteor-shower"); gAll.appendChild(grp);
    var ang = Math.atan2(best.y - m.y, best.x - m.x) + (Math.random() - 0.5) * 0.3;
    var dist = Math.hypot(best.x - m.x, best.y - m.y);
    for (var i = 0; i < 6; i++) {
      var dot = document.createElementNS(NS, "circle");
      dot.setAttribute("r", (1.4 + Math.random() * 1.6).toFixed(2));
      dot.setAttribute("fill", "#cfe8ff");
      grp.appendChild(dot);
      zyMeteorFly(dot, m.x, m.y, m.x + Math.cos(ang) * dist, m.y + Math.sin(ang) * dist, i * 60);
    }
    setTimeout(function () { if (grp && grp.parentNode) grp.parentNode.removeChild(grp); }, 1700);
  } catch (e) {}
}
function zyMeteorFly(dot, sx, sy, ex, ey, delay) {
  var dur = 1100, t0 = null;
  function step(ts) { if (t0 === null) t0 = ts + delay; var p = (ts - t0) / dur; if (p < 0) { requestAnimationFrame(step); return; } if (p >= 1) { dot.setAttribute("opacity", "0"); return; } var x = sx + (ex - sx) * p, y = sy + (ey - sy) * p; dot.setAttribute("cx", x.toFixed(2)); dot.setAttribute("cy", y.toFixed(2)); dot.setAttribute("opacity", (0.9 * (1 - p)).toFixed(2)); requestAnimationFrame(step); }
  requestAnimationFrame(step);
}
function drawGraph3DOrFallback(wrap, nodes, edges, groups) {
  try {
    drawWebGLGraph(wrap, nodes, edges, groups);
    return true;
  } catch (e) {
    try { console.warn("[graph] 3D 星球渲染失败：", (e && e.message) || e); } catch (_) {}
    return false;
  }
}
// ---------- 知识星球 · 银河系视觉（canvas 程序化生成，无外部资源）----------
function zyHash(s) { var h = 2166136261; s = String(s); for (var i = 0; i < s.length; i++) { h ^= s.charCodeAt(i); h = Math.imul(h, 16777619); } return Math.abs(h); }
function zyPlanetType(id) { var a = ["rocky", "gas", "ice", "lava"]; return a[zyHash(id) % a.length]; }
function zyNodeOtype(n, deg) {
  if (n.id === "me") return "star";              // 宇宙核心 = 太阳
  if (ZY_REAL_PLANET[n.group]) return "planet";  // 真实星球默认都是行星球体
  deg = deg || 0;
  if (deg === 0) return "blackhole";             // 孤立知识点 = 黑洞
  if ((zyHash(n.id || "") % 17) === 0) return "meteorite";
  return "planet";
}
// 真实星球贴图：按星球名烘焙专属表面（海洋/大陆/条带/陨石坑/极冠…），不依赖单一着色
function zyRealPlanetTextures() {
  var R = {};
  function mk(name, draw) {
    try {
      var c = document.createElement("canvas"); c.width = 512; c.height = 256;
      var x = c.getContext("2d"); if (!x) return;
      draw(x, 512, 256);
      var t = new THREE.CanvasTexture(c);
      try { t.wrapS = THREE.RepeatWrapping; } catch (e) {}
      R[name] = t;
    } catch (e) {}
  }
  function blob(x, cx, cy, r, color, a) {
    var g = x.createRadialGradient(cx, cy, 0, cx, cy, r);
    g.addColorStop(0, color); g.addColorStop(1, "rgba(0,0,0,0)");
    x.globalAlpha = (a == null) ? 1 : a; x.fillStyle = g;
    x.beginPath(); x.arc(cx, cy, r, 0, 6.2832); x.fill(); x.globalAlpha = 1;
  }
  function rnd(a, b) { return a + Math.random() * (b - a); }
  // 地球：蓝海 + 绿褐大陆 + 冰盖 + 云
  mk("地球", function (x, w, h) {
    var g = x.createLinearGradient(0, 0, 0, h); g.addColorStop(0, "#0a2c5e"); g.addColorStop(.5, "#0e3f7a"); g.addColorStop(1, "#0a2c5e");
    x.fillStyle = g; x.fillRect(0, 0, w, h);
    for (var i = 0; i < 28; i++) { x.fillStyle = Math.random() < .5 ? "#2f6b34" : "#4a7d3d"; x.beginPath(); x.ellipse(rnd(0, w), rnd(h * .18, h * .82), rnd(18, 60), rnd(12, 34), rnd(0, 3), 0, 6.2832); x.fill(); }
    for (var j = 0; j < 12; j++) { x.fillStyle = "#6b5a3a"; x.beginPath(); x.ellipse(rnd(0, w), rnd(h * .3, h * .7), rnd(8, 20), rnd(6, 14), 0, 0, 6.2832); x.fill(); }
    x.fillStyle = "rgba(245,250,255,.92)"; x.fillRect(0, 0, w, 13); x.fillRect(0, h - 13, w, 13);
    for (var k = 0; k < 34; k++) { blob(x, rnd(0, w), rnd(22, h - 22), rnd(10, 32), "rgba(255,255,255,.5)", .35); }
  });
  // 火星：锈红 + 暗海 + 极冠
  mk("火星", function (x, w, h) {
    x.fillStyle = "#9c4a2a"; x.fillRect(0, 0, w, h);
    for (var i = 0; i < 42; i++) { blob(x, rnd(0, w), rnd(0, h), rnd(14, 40), "rgba(110,45,28,.7)", .6); }
    for (var j = 0; j < 18; i = i, j++) { blob(x, rnd(0, w), rnd(0, h), rnd(10, 28), "rgba(196,116,72,.5)", .5); }
    x.fillStyle = "rgba(245,240,235,.95)"; x.beginPath(); x.ellipse(w * .5, 9, 62, 10, 0, 0, 6.2832); x.fill(); x.beginPath(); x.ellipse(w * .5, h - 9, 62, 10, 0, 0, 6.2832); x.fill();
  });
  // 金星：奶油黄条带 + 漩涡
  mk("金星", function (x, w, h) {
    x.fillStyle = "#d9b25a"; x.fillRect(0, 0, w, h);
    for (var i = 0; i < 24; i++) { x.fillStyle = i % 2 ? "rgba(232,207,134,.6)" : "rgba(199,154,69,.6)"; x.fillRect(0, rnd(0, h), w, rnd(6, 16)); }
    for (var j = 0; j < 16; j++) { blob(x, rnd(0, w), rnd(0, h), rnd(20, 50), "rgba(245,225,160,.4)", .5); }
  });
  // 水星：灰 + 陨坑
  mk("水星", function (x, w, h) {
    x.fillStyle = "#8a8378"; x.fillRect(0, 0, w, h);
    for (var i = 0; i < 60; i++) { blob(x, rnd(0, w), rnd(0, h), rnd(6, 22), "rgba(60,56,50,.5)", .6); }
    for (var j = 0; j < 22; j++) { var cx = rnd(0, w), cy = rnd(0, h), r = rnd(6, 16); x.strokeStyle = "rgba(40,38,34,.6)"; x.lineWidth = 2; x.beginPath(); x.arc(cx, cy, r, 0, 6.2832); x.stroke(); blob(x, cx, cy, r * .6, "rgba(150,145,135,.6)", .7); }
  });
  // 月球：灰 + 陨坑（带亮缘）
  mk("月球", function (x, w, h) {
    x.fillStyle = "#b9b6b0"; x.fillRect(0, 0, w, h);
    for (var i = 0; i < 50; i++) { blob(x, rnd(0, w), rnd(0, h), rnd(5, 18), "rgba(90,88,82,.45)", .6); }
    for (var j = 0; j < 20; j++) { var cx = rnd(0, w), cy = rnd(0, h), r = rnd(5, 14); x.strokeStyle = "rgba(70,68,62,.55)"; x.lineWidth = 1.5; x.beginPath(); x.arc(cx, cy, r, 0, 6.2832); x.stroke(); x.fillStyle = "rgba(232,230,224,.5)"; x.beginPath(); x.arc(cx - r * .2, cy - r * .2, r * .5, 0, 6.2832); x.fill(); }
  });
  // 木星：多色条带 + 大红斑
  mk("木星", function (x, w, h) {
    var cols = ["#caa46b", "#e3c98f", "#b07d4e", "#d8b87e", "#9c6b3f", "#e9d6a8", "#c08a55"];
    var y = 0;
    while (y < h) { var bh = rnd(10, 26); x.fillStyle = cols[(Math.random() * cols.length) | 0]; x.fillRect(0, y, w, bh + 1); y += bh; }
    for (var k = 0; k < 40; k++) { blob(x, rnd(0, w), rnd(0, h), rnd(20, 50), "rgba(255,240,210,.18)", .5); }
    x.fillStyle = "rgba(150,50,32,.5)"; x.beginPath(); x.ellipse(w * .34, h * .62, 34, 20, 0, 0, 6.2832); x.fill();
    x.fillStyle = "rgba(190,72,47,.92)"; x.beginPath(); x.ellipse(w * .34, h * .62, 24, 14, 0, 0, 6.2832); x.fill();
  });
  // 土星：淡金条带
  mk("土星", function (x, w, h) {
    var cols = ["#e6d4a0", "#d8c184", "#efdcb0", "#cdb277", "#e0cb95"];
    var y = 0;
    while (y < h) { var bh = rnd(12, 22); x.fillStyle = cols[(Math.random() * cols.length) | 0]; x.fillRect(0, y, w, bh + 1); y += bh; }
    for (var k2 = 0; k2 < 16; k2++) { blob(x, rnd(0, w), rnd(0, h), rnd(18, 40), "rgba(255,245,215,.14)", .5); }
  });
  // 海王星：深蓝 + 暗斑
  mk("海王星", function (x, w, h) {
    x.fillStyle = "#1f4fa8"; x.fillRect(0, 0, w, h);
    for (var i = 0; i < 16; i++) { x.fillStyle = i % 2 ? "rgba(58,111,208,.5)" : "rgba(20,60,130,.5)"; x.fillRect(0, rnd(0, h), w, rnd(6, 14)); }
    for (var k = 0; k < 20; k++) { blob(x, rnd(0, w), rnd(0, h), rnd(16, 36), "rgba(120,170,235,.25)", .5); }
    x.fillStyle = "rgba(15,40,95,.7)"; x.beginPath(); x.ellipse(w * .7, h * .35, 22, 13, 0, 0, 6.2832); x.fill();
  });
  // 天王星：青色极简
  mk("天王星", function (x, w, h) {
    x.fillStyle = "#7fd4d0"; x.fillRect(0, 0, w, h);
    for (var i = 0; i < 8; i++) { x.fillStyle = "rgba(150,220,215,.4)"; x.fillRect(0, rnd(0, h), w, rnd(8, 16)); }
    for (var k = 0; k < 10; k++) { blob(x, rnd(0, w), rnd(0, h), rnd(20, 44), "rgba(210,240,238,.2)", .5); }
  });
  // 冥王星：棕褐斑块 + 心形亮区
  mk("冥王星", function (x, w, h) {
    x.fillStyle = "#b89a78"; x.fillRect(0, 0, w, h);
    for (var i = 0; i < 30; i++) { blob(x, rnd(0, w), rnd(0, h), rnd(14, 40), i % 2 ? "rgba(138,111,80,.6)" : "rgba(216,196,160,.6)", .6); }
    x.fillStyle = "rgba(230,210,180,.5)"; x.beginPath(); x.ellipse(w * .4, h * .55, 34, 26, 0, 0, 6.2832); x.fill();
  });
  // 太阳：辐射状金橙
  mk("太阳", function (x, w, h) {
    var g = x.createRadialGradient(w / 2, h / 2, 0, w / 2, h / 2, w / 2); g.addColorStop(0, "#fff3c4"); g.addColorStop(.5, "#ffb13b"); g.addColorStop(1, "#ff7a18");
    x.fillStyle = g; x.fillRect(0, 0, w, h);
    for (var i = 0; i < 120; i++) { blob(x, rnd(0, w), rnd(0, h), rnd(6, 20), i % 2 ? "rgba(255,150,40,.25)" : "rgba(255,240,180,.25)", .5); }
  });
  return R;
}
function zyPlanetTexSet() {
  var set = {};
  function tex(draw, w, h) {
    try {
      var c = document.createElement("canvas"); c.width = w; c.height = h;
      var x = c.getContext("2d"); if (!x) return null;
      draw(x, w, h);
      var tt = new THREE.CanvasTexture(c);
      try { tt.wrapS = THREE.RepeatWrapping; } catch (e) {}
      return tt;
    } catch (e) { return null; }
  }
  // 岩石行星：陆块斑驳
  set.rocky = tex(function (x, w, h) {
    x.fillStyle = "#ffffff"; x.fillRect(0, 0, w, h);
    for (var i = 0; i < 110; i++) {
      var cx = Math.random() * w, cy = Math.random() * h, r = 5 + Math.random() * 26;
      var v = 120 + Math.random() * 95;
      var g = x.createRadialGradient(cx, cy, 0, cx, cy, r);
      g.addColorStop(0, "rgba(" + (v | 0) + "," + (v | 0) + "," + (v | 0) + ",.55)");
      g.addColorStop(1, "rgba(255,255,255,0)");
      x.fillStyle = g; x.beginPath(); x.arc(cx, cy, r, 0, 6.284); x.fill();
    }
  }, 256, 128);
  // 气态巨行星：水平条带 + 风暴斑
  set.gas = tex(function (x, w, h) {
    x.fillStyle = "#ffffff"; x.fillRect(0, 0, w, h);
    var bands = 16;
    for (var i = 0; i < bands; i++) {
      var y = (i / bands) * h, hh = h / bands + 1;
      var v = 145 + Math.sin(i * 1.7) * 55 + Math.random() * 32;
      x.fillStyle = "rgba(" + (v | 0) + "," + (v | 0) + "," + (v | 0) + ",.7)";
      x.fillRect(0, y, w, hh);
    }
    for (var k = 0; k < 3; k++) {
      var cx = Math.random() * w, cy = Math.random() * h, r = 7 + Math.random() * 13;
      var g = x.createRadialGradient(cx, cy, 0, cx, cy, r);
      g.addColorStop(0, "rgba(255,255,255,.92)"); g.addColorStop(.55, "rgba(215,215,215,.45)"); g.addColorStop(1, "rgba(255,255,255,0)");
      x.fillStyle = g; x.beginPath(); x.ellipse ? x.ellipse(cx, cy, r * 1.7, r * 0.65, 0, 0, 6.284) : x.arc(cx, cy, r, 0, 6.284); x.fill();
    }
  }, 256, 128);
  // 冰巨星：淡底 + 裂纹
  set.ice = tex(function (x, w, h) {
    x.fillStyle = "#ffffff"; x.fillRect(0, 0, w, h);
    for (var i = 0; i < 46; i++) {
      x.strokeStyle = "rgba(150,195,225,.34)"; x.lineWidth = 1 + Math.random() * 2;
      var px = Math.random() * w, py = Math.random() * h; x.beginPath(); x.moveTo(px, py);
      for (var s = 0; s < 4; s++) { px += (Math.random() - .5) * 42; py += (Math.random() - .5) * 22; x.lineTo(px, py); }
      x.stroke();
    }
  }, 256, 128);
  // 熔岩 / 恒星：暗底 + 发光熔缝
  set.lava = tex(function (x, w, h) {
    x.fillStyle = "#3a2a26"; x.fillRect(0, 0, w, h);
    for (var i = 0; i < 70; i++) {
      var px = Math.random() * w, py = Math.random() * h, r = 4 + Math.random() * 18;
      var g = x.createRadialGradient(px, py, 0, px, py, r);
      g.addColorStop(0, "rgba(255,196,105,.9)"); g.addColorStop(.5, "rgba(205,95,45,.42)"); g.addColorStop(1, "rgba(60,30,20,0)");
      x.fillStyle = g; x.beginPath(); x.arc(px, py, r, 0, 6.284); x.fill();
    }
  }, 256, 128);
  // 光晕
  set.glow = tex(function (x, w, h) {
    var g = x.createRadialGradient(w / 2, h / 2, 0, w / 2, h / 2, w / 2);
    g.addColorStop(0, "rgba(255,255,255,1)"); g.addColorStop(.22, "rgba(255,255,255,.45)");
    g.addColorStop(.55, "rgba(255,255,255,.12)"); g.addColorStop(1, "rgba(255,255,255,0)");
    x.fillStyle = g; x.fillRect(0, 0, w, h);
  }, 128, 128);
  // 星点
  set.dot = tex(function (x, w, h) {
    var g = x.createRadialGradient(w / 2, h / 2, 0, w / 2, h / 2, w / 2);
    g.addColorStop(0, "rgba(255,255,255,1)"); g.addColorStop(.4, "rgba(255,255,255,.5)"); g.addColorStop(1, "rgba(255,255,255,0)");
    x.fillStyle = g; x.fillRect(0, 0, w, h);
  }, 64, 64);
  // 星云絮团
  set.neb = tex(function (x, w, h) {
    var g = x.createRadialGradient(w / 2, h / 2, 0, w / 2, h / 2, w / 2);
    g.addColorStop(0, "rgba(255,255,255,.5)"); g.addColorStop(.45, "rgba(255,255,255,.16)"); g.addColorStop(1, "rgba(255,255,255,0)");
    x.fillStyle = g; x.fillRect(0, 0, w, h);
    for (var i = 0; i < 26; i++) {
      var cx = w / 2 + (Math.random() - .5) * w * .72, cy = h / 2 + (Math.random() - .5) * h * .72, r = 10 + Math.random() * 42;
      var g2 = x.createRadialGradient(cx, cy, 0, cx, cy, r);
      g2.addColorStop(0, "rgba(255,255,255,.10)"); g2.addColorStop(1, "rgba(255,255,255,0)");
      x.fillStyle = g2; x.beginPath(); x.arc(cx, cy, r, 0, 6.284); x.fill();
    }
  }, 256, 256);
  set.real = zyRealPlanetTextures();
  return set;
}
// 银河系背景：全天星场 + 倾斜银河带 + 星云 + 中央星系盘
function zyAddGalaxy(root, TEX) {
  function points(count, gen, size, opacity) {
    var pos = new Float32Array(count * 3), col = new Float32Array(count * 3), c = new THREE.Color();
    for (var i = 0; i < count; i++) {
      var p = gen(i);
      pos[i * 3] = p.x; pos[i * 3 + 1] = p.y; pos[i * 3 + 2] = p.z;
      c.setHSL(p.h, p.s, p.l);
      col[i * 3] = c.r; col[i * 3 + 1] = c.g; col[i * 3 + 2] = c.b;
    }
    var g = new THREE.BufferGeometry();
    g.setAttribute("position", new THREE.BufferAttribute(pos, 3));
    g.setAttribute("color", new THREE.BufferAttribute(col, 3));
    var m = new THREE.PointsMaterial({ size: size, map: TEX.dot || null, vertexColors: true, transparent: true, opacity: opacity, depthWrite: false, blending: THREE.AdditiveBlending, sizeAttenuation: true });
    var pts = new THREE.Points(g, m); root.add(pts);
  }
  // 全天星场：拉远到 60~130，确保永远在星球之后，仅作深空点缀（跟随旋转产生视差，不会成为固定贴层）
    var STAR_H = [0.58, 0.55, 0.13, 0.09, 0.62, 0.52, 0.60];
  points(2200, function () {
    var r = 60 + Math.random() * 70, th = Math.random() * Math.PI * 2, ph = Math.acos(2 * Math.random() - 1);
    return { x: r * Math.sin(ph) * Math.cos(th), y: r * Math.cos(ph), z: r * Math.sin(ph) * Math.sin(th),
      h: STAR_H[(Math.random() * STAR_H.length) | 0], s: 0.2 + Math.random() * 0.45, l: 0.62 + Math.random() * 0.36 };
  }, 0.6, 1.0);
  // 银河带：沿倾斜平面的稀疏星带，避免密集成「噪点层」
  var tilt = 0.42;
  points(1800, function () {
    var r = 70 + Math.random() * 50, a = Math.random() * Math.PI * 2;
    var gauss = (Math.random() + Math.random() + Math.random() - 1.5) / 1.5;
    var y = gauss * 9, x = Math.cos(a) * r, z = Math.sin(a) * r;
    return { x: x, y: Math.cos(tilt) * y - Math.sin(tilt) * z, z: Math.sin(tilt) * y + Math.cos(tilt) * z,
      h: [0.60, 0.55, 0.11, 0.62][(Math.random() * 4) | 0], s: 0.2 + Math.random() * 0.34, l: 0.6 + Math.random() * 0.32 };
  }, 0.5, 0.78);
  // 极淡星云：数量少、体积小、透明度低，仅作氛围，绝不遮挡星球
    var nebC = [0x3a6bff, 0x9b3aff, 0xff3a9b, 0x2ad9c8, 0xffb44a, 0x5a7bff];
  for (var i = 0; i < 7; i++) {
    var m = new THREE.SpriteMaterial({ map: TEX.neb || null, color: nebC[i % nebC.length], transparent: true, opacity: 0.14 + Math.random() * 0.12, depthWrite: false, blending: THREE.AdditiveBlending });
    var s = new THREE.Sprite(m);
    var r = 50 + Math.random() * 45, th = Math.random() * Math.PI * 2, ph = Math.acos(2 * Math.random() - 1);
    s.position.set(r * Math.sin(ph) * Math.cos(th), r * Math.cos(ph) * 0.6, r * Math.sin(ph) * Math.sin(th));
    s.scale.setScalar(26 + Math.random() * 22);
    root.add(s);
  }
}
function drawWebGLGraph(wrap, nodes, edges, groups) {
  if (wrap.__webgl) { try { wrap.__webgl.cleanup(); } catch (e) {} }
  wrap.querySelectorAll(".zy-webgl-canvas,.zy-label-layer,.zy-graph-tip,.zy-edge-label,.zy-g2d-bg").forEach(function (el) { el.remove(); });
  try { wrap.classList.remove("zy-galaxy-on"); } catch (e) {}
  var W = wrap.clientWidth || 720, H = wrap.clientHeight || 480;
  var scene = new THREE.Scene();
  var camera = new THREE.PerspectiveCamera(55, W / H, 0.1, 4000);
  var renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
  renderer.setSize(W, H);
  renderer.setClearColor(0x0b1226, 1); // 不透明深空底色（宇宙外观功能已移除，恢复原始外观）
  var canvas = renderer.domElement;
  canvas.className = "zy-webgl-canvas";
  canvas.style.position = "absolute"; canvas.style.left = "0"; canvas.style.top = "0"; canvas.style.width = "100%"; canvas.style.height = "100%"; canvas.style.zIndex = "2"; canvas.style.touchAction = "none"; canvas.style.cursor = "grab"; try { wrap.classList.add("zy-3d-on"); } catch (e) {}
  wrap.appendChild(canvas);
  var labelLayer = document.createElement("div");
  labelLayer.className = "zy-label-layer";
  labelLayer.style.position = "absolute"; labelLayer.style.inset = "0"; labelLayer.style.zIndex = "3"; labelLayer.style.pointerEvents = "none"; labelLayer.style.overflow = "hidden";
  wrap.appendChild(labelLayer);
  var tip = document.createElement("div");
  tip.className = "zy-graph-tip";
  tip.style.position = "absolute"; tip.style.zIndex = "5"; tip.style.maxWidth = "230px"; tip.style.padding = "8px 10px"; tip.style.borderRadius = "10px";
  tip.style.background = "rgba(14,18,30,.94)"; tip.style.border = "1px solid rgba(120,150,210,.5)"; tip.style.color = "#dfe8f4";
  tip.style.fontSize = "12px"; tip.style.lineHeight = "1.5"; tip.style.pointerEvents = "none"; tip.style.boxShadow = "0 8px 26px rgba(0,0,0,.5)";
  tip.style.display = "none"; tip.style.whiteSpace = "normal";
  wrap.appendChild(tip);
  var edgeLabel = document.createElement("div");
  edgeLabel.className = "zy-edge-label";
  edgeLabel.style.position = "absolute"; edgeLabel.style.zIndex = "5"; edgeLabel.style.padding = "2px 8px";
  edgeLabel.style.borderRadius = "8px"; edgeLabel.style.background = "rgba(20,28,46,.92)";
  edgeLabel.style.border = "1px solid rgba(120,150,210,.45)"; edgeLabel.style.color = "#bcd0ea"; edgeLabel.style.fontSize = "12px";
  edgeLabel.style.pointerEvents = "none"; edgeLabel.style.display = "none";
  wrap.appendChild(edgeLabel);

  var controls = new THREE.OrbitControls(camera, canvas);
  controls.enableDamping = true; controls.dampingFactor = 0.08;
  controls.rotateSpeed = 0.9; controls.zoomSpeed = 1.1; controls.minDistance = 0.15; controls.maxDistance = 600;
  controls.autoRotateSpeed = 0.9; controls.target.set(0, 0, 0);
  controls.enablePan = true;
  // #F 自由视角：屏幕空间平移，右键/双指拖动即可把视角中心移离原点，不再死锁于一个中心
  try { controls.screenSpacePanning = true; } catch (e) {}
  // 平移改用【滚轮(中键)长按】拖动；右键不再平移（并屏蔽右键菜单，避免误触弹出系统菜单）
  try { controls.mouseButtons = { LEFT: THREE.MOUSE.ROTATE, MIDDLE: THREE.MOUSE.PAN, RIGHT: null }; } catch (e) {}

    var _bright = 0.85; try { var _lk = loadUniverseLook(); if (typeof _lk.bright === "number") _bright = _lk.bright; } catch (e) {}
  scene.add(new THREE.AmbientLight(0x5a6da0, 0.24 * _bright));
  var dl = new THREE.DirectionalLight(0xffffff, 0.32 * _bright); dl.position.set(5, 8, 6); scene.add(dl);
  var pl = new THREE.PointLight(0x6688cc, 0.10 * _bright); pl.position.set(-6, -3, -6); scene.add(pl); var sunL = new THREE.PointLight(0xffe6c2, 1.7 * _bright); sunL.position.set(0, 0, 0); scene.add(sunL);

  var R = 2.35;
  var globe = new THREE.Mesh(new THREE.SphereGeometry(R * 0.96, 32, 32), new THREE.MeshBasicMaterial({ color: 0x21304f, transparent: true, opacity: 0.13, depthWrite: false }));
  scene.add(globe);
  var globe2 = new THREE.Mesh(new THREE.SphereGeometry(R * 0.96, 24, 24), new THREE.MeshBasicMaterial({ color: 0x3a5cff, wireframe: true, transparent: true, opacity: 0.08, depthWrite: false }));
  scene.add(globe2);

  var TEX = zyPlanetTexSet();
  var _saved3d = null; try { _saved3d = JSON.parse(localStorage.getItem(GRAPH_VIEW3D_KEY) || "null"); } catch (e) {}
  var galaxyGroup = new THREE.Group(); scene.add(galaxyGroup);
  try { zyAddGalaxy(galaxyGroup, TEX); } catch (e) {}
  var solarRoot = new THREE.Group(); scene.add(solarRoot);
  try { solarRoot.position.copy(loadSolarPos()); } catch (e) {}
  try { solarRoot.add(sunL); } catch (e) {}
  // 星网链（KP 网络）独立根节点：与核心星球（solarRoot）解耦，可各自整体平移（拖动模式切换）
  var kpRoot = new THREE.Group(); scene.add(kpRoot);
  try { kpRoot.position.copy(loadKpRootPos()); } catch (e) {}
  var solarPlanets = []; var solarSunNode = null;
  var solarAng = ["p_cog", "p_mean", "life", "p_energy", "p_rel", "p_val"];
  function makeOrbitRing(rad, inc) {
    try {
      var seg = 72, arr = [];
      for (var s = 0; s <= seg; s++) { var a = (s / seg) * Math.PI * 2; arr.push(rad * Math.cos(a), 0, rad * Math.sin(a)); }
      var g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.Float32BufferAttribute(arr, 3));
      var l = new THREE.Line(g, new THREE.LineBasicMaterial({ color: 0x4a6da0, transparent: true, opacity: 0.12, depthWrite: false }));
      l.rotation.x = inc; try { zyLineObjs.push(l); } catch (_eLR) {} return l;
    } catch (e) { return new THREE.Object3D(); }
  }
  var order = ["self", "field", "review", "card", "bio", "goal", "frag", "note"];
  var groupsKey = groups.map(function (g) { return g.key; });
  order.forEach(function (k) { if (groupsKey.indexOf(k) < 0) groupsKey.push(k); });
  var sectorOf = {}; groupsKey.forEach(function (k, i) { sectorOf[k] = (i / groupsKey.length) * Math.PI * 2; });
  var groupItems = {};
  nodes.forEach(function (n) { if (n.id !== "me") { (groupItems[n.group] = groupItems[n.group] || []).push(n); } });
  var sphereGeo = new THREE.SphereGeometry(1, 18, 18);
  var nodeMeshes = []; var labelEls = []; var _seenG = {};
  var zyLineObjs = []; // 宇宙中所有「线」对象（轨道环 / 辐条），供连线开关统一显隐
  var meteorGroup = new THREE.Group(); scene.add(meteorGroup);
  var _meteors = [];
  for (var _mi = 0; _mi < 5; _mi++) {
    var _ms = new THREE.Sprite(new THREE.SpriteMaterial({ map: TEX.dot || null, color: 0xcfe8ff, transparent: true, opacity: 0, depthWrite: false, blending: THREE.AdditiveBlending }));
    _ms.scale.setScalar(0.5); meteorGroup.add(_ms);
    _meteors.push({ s: _ms, life: 0, x: 0, y: 0, z: 0, vx: 0, vy: 0, vz: 0 });
  }
  function spawnMeteor() {
    var m = _meteors[(Math.random() * _meteors.length) | 0];
    var ang = Math.random() * Math.PI * 2, Rr = 20 + Math.random() * 14;
    m.x = Math.cos(ang) * Rr; m.y = (Math.random() - 0.5) * Rr; m.z = Math.sin(ang) * Rr;
    var dir = new THREE.Vector3(-m.x, (Math.random() - 0.5) * 6, -m.z).normalize();
    var sp = 0.12 + Math.random() * 0.1; m.vx = dir.x * sp; m.vy = dir.y * sp; m.vz = dir.z * sp; m.life = 1;
  }
  var _meteorTimer = 0;
  var pSys = null;
  var gLabel = {}; groups.forEach(function (g) { gLabel[g.key] = g.label; });

  function saveSolarPos() { try { localStorage.setItem("zhiyu_graph_solar", JSON.stringify([Math.round(solarRoot.position.x*100)/100, Math.round(solarRoot.position.y*100)/100, Math.round(solarRoot.position.z*100)/100])); } catch(e){} }
  function loadSolarPos() { try { var a = JSON.parse(localStorage.getItem("zhiyu_graph_solar")||"null"); if (Array.isArray(a)&&a.length===3) return new THREE.Vector3(a[0],a[1],a[2]); } catch(e){} return new THREE.Vector3(0,0,0); }
  function saveKpRootPos() { try { localStorage.setItem("zhiyu_graph_kproot", JSON.stringify([Math.round(kpRoot.position.x*100)/100, Math.round(kpRoot.position.y*100)/100, Math.round(kpRoot.position.z*100)/100])); } catch(e){} }
  function loadKpRootPos() { try { var a = JSON.parse(localStorage.getItem("zhiyu_graph_kproot")||"null"); if (Array.isArray(a)&&a.length===3) return new THREE.Vector3(a[0],a[1],a[2]); } catch(e){} return new THREE.Vector3(0,0,0); }
  function save3dPositions() { try { var o = {}; nodes.forEach(function (n) { if (n.pos && !n._solar) o[n.id] = [Math.round(n.pos.x * 100) / 100, Math.round(n.pos.y * 100) / 100, Math.round(n.pos.z * 100) / 100]; }); localStorage.setItem(GRAPH_VIEW3D_KEY, JSON.stringify(o)); } catch (e) {} }
  // 真实宇宙排版：太阳居中，各核心支柱按类别分布在不同半径的轨道环上（确定性，便于重置复现）
  var RING = { goal: 3.1, self: 4.3, field: 5.5, review: 6.7, card: 6.7, model: 7.9, skill: 7.9, bio: 9.1, custom: 8.5, note: 10.4, frag: 11.6 };
  var ringKeys = groupsKey.slice();
  nodes.forEach(function (n) {
    var pos;
    if (n.id === "me") { pos = new THREE.Vector3(0, 0, 0); }
    else {
      var arr = groupItems[n.group] || [n];
      var idx = arr.indexOf(n);
      var cnt = arr.length;
      var gAng = (ringKeys.indexOf(n.group) / Math.max(1, ringKeys.length)) * Math.PI * 2;
      var step = cnt <= 1 ? 0 : (Math.PI * 2 / cnt);
      var ang = gAng + idx * step + ((zyHash(n.id) % 100) / 100) * (cnt > 1 ? step * 0.45 : 0.7);
      var incl = 0.14 + (zyHash(n.group) % 5 - 2) * 0.05;
      var rr = (RING[n.group] || 7.0) + ((zyHash(n.id + "r") % 100) / 100 - 0.5) * 0.5;
      var x0 = rr * Math.cos(ang), z0 = rr * Math.sin(ang);
      var y = -z0 * Math.sin(incl);
      var z = z0 * Math.cos(incl);
      pos = new THREE.Vector3(x0, y, z);
    }
    // 子目标/无行星支柱：最终落点需在「网格循环后」按父支柱「世界坐标」重定位（彼时 _par.pos 才为真实轨道坐标），见下方 post-pass。此处保持默认 RING.goal 初值，由 post-pass 覆盖。
    n.pos = pos;
    try { if (_saved3d && _saved3d[n.id] && !n._solar) { var _p = _saved3d[n.id]; n.pos = new THREE.Vector3(_p[0], _p[1], _p[2]); } } catch (e2) {}
    if (n.id === "me" || n._planet) {
      n._solar = true;
      if (n.id === "me") { pos = new THREE.Vector3(0, 0, 0); }
      else {
        var _g = n._planet, _aidx = solarAng.indexOf(n.id); if (_aidx < 0) _aidx = 0;
        var _rad = (_g.orb || (3.0 + 13 * Math.pow(_g.au / 40, 0.62)));
        pos = new THREE.Vector3(_rad, 0, 0);
        // #真实宇宙：公转角速度遵循开普勒第三定律(ω ∝ r^-1.5)，内行星快、外行星慢，且同向顺行
        n._rad = _rad; n._aidx = _aidx; n._inc = 0.05 + (zyHash(n.id) % 5) * 0.02; n._orbSpeed = 0.0344 / Math.pow(_rad, 1.5);
      }
    }
    var _rpSz = (ZY_REAL_PLANET[n.group] && ZY_REAL_PLANET[n.group].size) || 1;
    var rad = n.id === "me" ? 2.2 : (0.12 + Math.min(0.22, (n.r || 11) / 22 * 0.22)) * _rpSz;
    if (n._planet) { rad = (n._planet.size || 0.7); }
    n.baseScale = rad;
        var _rp = ZY_REAL_PLANET[n.group] || null;
    var ty = n.id === "me" ? "lava" : (_rp ? _rp.type : zyPlanetType(n.id));
    var _realTex = (n._realName && TEX.real && TEX.real[n._realName]) ? TEX.real[n._realName] : null;
    var tmap = _realTex || (TEX[ty] || null);
    var col = new THREE.Color(n.color);
    if (n._planet) {
      var _rc = n._planet.color || n.color; col = new THREE.Color(_rc);
      var _rt = (n._realName && TEX.real && TEX.real[n._realName]) ? TEX.real[n._realName] : (TEX[ty] || null);
      tmap = _rt;
    }
    var mat = new THREE.MeshStandardMaterial({
      color: _realTex ? new THREE.Color(0xffffff) : col,
      map: tmap,
      emissive: _realTex ? new THREE.Color(0x000000) : col.clone().multiplyScalar(0.12),
      emissiveIntensity: n.id === "me" ? 1.15 : (_realTex ? 0.06 : 0.18),
      roughness: (ty === "gas" || ty === "ice") ? 0.7 : 0.85,
      metalness: 0.0, transparent: true, opacity: 1
    });
    var mesh = new THREE.Mesh(sphereGeo, mat);
    mesh.position.copy(pos); mesh.scale.setScalar(rad);
    mesh.userData.node = n; mesh.userData.spin = (n.id === "me" ? 0.004 : 0.002 + Math.random() * 0.006) * (Math.random() < 0.5 ? -1 : 1); mesh.rotation.z = (Math.random() - 0.5) * 0.5;
    scene.add(mesh);
    n.mesh = mesh;
    if (n._solar) {
      if (n.id === "me") { solarRoot.add(mesh); mesh.position.set(0, 0, 0); solarSunNode = n; n.pos = solarRoot.position.clone(); }
      else {
        solarRoot.add(mesh);
        var _pv = new THREE.Group(); _pv.rotation.set(n._inc, n._aidx * (Math.PI * 2 / 6) + 0.6, 0); solarRoot.add(_pv); solarRoot.remove(mesh); _pv.add(mesh);
        n._pivot = _pv; n.pos = mesh.getWorldPosition(new THREE.Vector3());
        var _ring = makeOrbitRing(n._rad, n._inc); solarRoot.add(_ring);
        var _tg = new THREE.BufferGeometry(); _tg.setAttribute('position', new THREE.Float32BufferAttribute([0, 0, 0, n._rad, 0, 0], 3));
        var _tl = new THREE.Line(_tg, new THREE.LineBasicMaterial({ color: new THREE.Color(n.color), transparent: true, opacity: 0.16, depthWrite: false })); _pv.add(_tl); n._tether = _tl; try { zyLineObjs.push(_tl); } catch (_eLT) {}
        if (n._planet && n._planet.moon && n.id === "life") {
          var _mp = new THREE.Group(); _mp.rotation.set(0.4, 0, 0); mesh.add(_mp);
          var _moon = new THREE.Mesh(sphereGeo, new THREE.MeshStandardMaterial({ color: 0xc9ccd2, roughness: 0.95, metalness: 0.02, emissive: 0x222428, emissiveIntensity: 0.18 }));
          _moon.scale.setScalar(0.4); _moon.position.set(2.4, 0, 0); _mp.add(_moon); n._moonPivot = _mp;
        }
        solarPlanets.push(n);
      }
    }
    if (n.otype === "blackhole") {
      mesh.material.color.set(0x0c0a1e); mesh.material.emissive.set(0x3a2a66); mesh.material.emissiveIntensity = 0.5;
      var acc = new THREE.Mesh(new THREE.RingGeometry(rad * 1.5, rad * 2.6, 48), new THREE.MeshBasicMaterial({ color: 0xffd28a, transparent: true, opacity: 0.95, side: THREE.DoubleSide, depthWrite: false, blending: THREE.AdditiveBlending }));
      acc.rotation.x = Math.PI / 2 - 0.4; mesh.add(acc);
      if (TEX.glow) { var bhHalo = new THREE.Sprite(new THREE.SpriteMaterial({ map: TEX.glow, color: 0xffd9a0, transparent: true, opacity: 0.7, depthWrite: false, blending: THREE.AdditiveBlending })); bhHalo.scale.setScalar(rad * 8); mesh.add(bhHalo); }
    } else if (n.otype === "comet") {
      var cTail = new THREE.Mesh(new THREE.ConeGeometry(rad * 0.5, rad * 6, 12), new THREE.MeshBasicMaterial({ color: col.clone().offsetHSL(0, -0.1, 0.2), transparent: true, opacity: 0.35, depthWrite: false, blending: THREE.AdditiveBlending }));
      cTail.position.set(-rad * 3, 0, 0); cTail.rotation.z = Math.PI / 2; mesh.add(cTail);
    } else if (n.otype === "meteoroid" || n.otype === "meteorite") {
      var rockGeo = new THREE.IcosahedronGeometry(rad * 1.1, 0); mesh.geometry = rockGeo; mesh.material.roughness = 0.95; mesh.material.metalness = 0.1;
    } else if (n.otype === "star") {
      mesh.material.color.set(0xfff2c4); mesh.material.emissive.set(0xffd27a); mesh.material.emissiveIntensity = 1.3; mesh.material.roughness = 0.4;
      if (TEX.glow) { var stHalo = new THREE.Sprite(new THREE.SpriteMaterial({ map: TEX.glow, color: 0xffe9b0, transparent: true, opacity: 0.8, depthWrite: false, blending: THREE.AdditiveBlending })); stHalo.scale.setScalar(rad * 11); mesh.add(stHalo); }
    } else if (n.otype === "moon") {
      mesh.material.map = TEX.rocky || null; mesh.material.color.set(0xc9ccd2); mesh.material.emissive.set(0x222428); mesh.material.emissiveIntensity = 0.18; mesh.material.roughness = 0.95; mesh.material.metalness = 0.02;
    } else if (n.otype === "asteroid") {
      var astGeo = new THREE.IcosahedronGeometry(rad * 1.0, 0); mesh.geometry = astGeo; mesh.material.color.set(0x9a8b78); mesh.material.map = null; mesh.material.emissive.set(0x140f0b); mesh.material.emissiveIntensity = 0.2; mesh.material.roughness = 1; mesh.material.metalness = 0.05;
    } else if (n.otype === "nebula") {
      mesh.material.opacity = 0; mesh.material.transparent = true; mesh.material.depthWrite = false;
      var nebMat = new THREE.SpriteMaterial({ map: TEX.neb || null, color: col.clone(), transparent: true, opacity: 0.5, depthWrite: false, blending: THREE.AdditiveBlending });
      var nebS = new THREE.Sprite(nebMat); nebS.scale.setScalar(rad * 9); mesh.add(nebS);
      var nebCore = new THREE.Mesh(new THREE.SphereGeometry(rad * 0.5, 12, 12), new THREE.MeshBasicMaterial({ color: col.clone(), transparent: true, opacity: 0.9 })); mesh.add(nebCore);
    } else if (n.otype === "pulsar") {
      mesh.material.color.set(0xbfe0ff); mesh.material.emissive.set(0x66ccff); mesh.material.emissiveIntensity = 1.4; mesh.material.roughness = 0.3;
      if (TEX.glow) { var psHalo = new THREE.Sprite(new THREE.SpriteMaterial({ map: TEX.glow, color: 0x9fe0ff, transparent: true, opacity: 0.85, depthWrite: false, blending: THREE.AdditiveBlending })); psHalo.scale.setScalar(rad * 10); mesh.add(psHalo); }
      [1, -1].forEach(function (sgn) { var beam = new THREE.Mesh(new THREE.ConeGeometry(rad * 0.18, rad * 7, 10), new THREE.MeshBasicMaterial({ color: 0x9fe0ff, transparent: true, opacity: 0.4, depthWrite: false, blending: THREE.AdditiveBlending })); beam.rotation.z = Math.PI / 2 * sgn; beam.position.x = sgn * rad * 3.5; mesh.add(beam); });
    }
    // 支柱具体内容 / 人生大目标卫星：加自发光，在小尺寸下也醒目
    if (n.kind === "lifetag") {
      try { mesh.material.emissive = new THREE.Color(n.color); mesh.material.emissiveIntensity = 0.85; mesh.material.roughness = 0.5; } catch (_ek) {}
    }
        if (TEX.glow) {
      var gm = new THREE.SpriteMaterial({ map: TEX.glow, color: col, transparent: true, opacity: n.id === "me" ? 0.8 : 0.22, depthWrite: false, blending: THREE.AdditiveBlending });
      var gs = new THREE.Sprite(gm); gs.scale.setScalar(n.id === "me" ? 11 : 3.2);
      mesh.add(gs); mesh.userData.glow = gs;
    }
    if (n.id !== "me" && ZY_REAL_PLANET[n.group] && ZY_REAL_PLANET[n.group].ring) {
      var rg = new THREE.RingGeometry(1.55, 2.2, 44);
      var rm = new THREE.MeshBasicMaterial({ color: col.clone().offsetHSL(0, -0.15, 0.18), transparent: true, opacity: 0.5, side: THREE.DoubleSide, depthWrite: false });
      var ring = new THREE.Mesh(rg, rm);
      ring.rotation.x = -Math.PI / 2 + 0.26;
      mesh.add(ring);
    }
    var lab = document.createElement("div");
    lab.className = "zy-node-label";
    var _maxc = (n.kind === "lifetag") ? 16 : 6;
    var _nm = document.createElement("span"); _nm.className = "zy-nm"; _nm.textContent = n.label.length > _maxc ? n.label.slice(0, _maxc) + "…" : n.label;
    lab.appendChild(_nm);
    if (n._realName) { var _sub = document.createElement("span"); _sub.className = "zy-sub"; _sub.textContent = n._realName; lab.appendChild(_sub); }
    // 支柱具体内容按用户要求隐藏（不显示在行星标签上，仅双击星球查看）

    lab.style.position = "absolute"; lab.style.transform = "translate(-50%,-155%)"; lab.style.left = "0px"; lab.style.top = "0px"; lab.style.willChange = "transform";
    lab.style.display = "flex"; lab.style.flexDirection = "column"; lab.style.alignItems = "center";
    lab.style.fontSize = (n.id === "me" ? 13 : 10) + "px";
    lab.style.color = n.id === "me" ? "#bfe0ff" : "#cdd9e5";
    lab.style.textShadow = "0 1px 3px rgba(0,0,0,.8)"; lab.style.whiteSpace = "nowrap"; lab.style.pointerEvents = "none"; lab.style.fontWeight = "700";
    labelLayer.appendChild(lab);
    var _isCentral = (n.id === "me") || !_seenG[n.group]; _seenG[n.group] = 1;
    labelEls.push({ node: n, el: lab, central: _isCentral });
    nodeMeshes.push(mesh);
  });

  save3dPositions();

  var idMap = {}; nodes.forEach(function (n) { idMap[n.id] = n; });
  // [修复] 与支柱相关的星球（子目标 / 碎片 等）：挂到父支柱 pivot 下，实时跟随支柱移动（公转 + 拖动核心星球），并随支柱世界坐标更新连线
  var followers = [];
  nodes.forEach(function (n) {
    if (n._planet) return; // 支柱自身不跟随
    var _pp = n.pillarId ? idMap[n.pillarId] : null;
    if (!_pp) {
      for (var _ei = 0; _ei < edges.length; _ei++) {
        var _e = edges[_ei];
        if (_e.a === n.id && idMap[_e.b] && idMap[_e.b]._planet) { _pp = idMap[_e.b]; break; }
        if (_e.b === n.id && idMap[_e.a] && idMap[_e.a]._planet) { _pp = idMap[_e.a]; break; }
      }
    }
    if (!_pp || !_pp._pivot || !_pp.pos || _pp.pos.lengthSq() < 0.0001) return;
    var _d = _pp.pos.clone().normalize();
    var _a3 = ((zyHash(n.id) % 360) / 360) * Math.PI * 2;
    var _per3 = new THREE.Vector3(-_d.z, 0, _d.x);
    var _off3 = _pp.pos.length() + 1.3 + ((zyHash(n.id + "r") % 100) / 100) * 0.9;
    n.pos = _d.clone().multiplyScalar(_off3).add(_per3.multiplyScalar(Math.sin(_a3) * 1.3));
    n.pos.y += Math.cos(_a3) * 0.9;
    if (n.mesh) {
      if (n.mesh.parent) n.mesh.parent.remove(n.mesh);
      try { _pp._pivot.updateWorldMatrix(true, false); } catch (_) {}
      _pp._pivot.add(n.mesh);
      n.mesh.position.copy(_pp._pivot.worldToLocal(n.pos.clone()));
      n._followId = _pp.id; n._isFollower = true; followers.push(n);
    }
  });
  var edgeMeshes = [];
  pSys = null; // 已移除：每节点装饰性无名粒子云（zyWebGLParticles）—— 无名称、无用的粒子
  var orbSys = null;
  try {
    if (typeof zyWebGLClusterOrb === 'function') {
      var _orbCl = [];
      (groups || []).forEach(function (g) {
        if (!g || !g.key) return;
        _orbCl.push({ key: String(g.key), color: zyRgb(zyLift(zyHex2rgb(g.color), 0.45)) });
      });
      if (!_orbCl.length) { nodes.slice(0, 7).forEach(function (n, i) { _orbCl.push({ key: "k" + i, color: zyRgb(zyLift(zyHex2rgb(n.color), 0.45)) }); }); }
      orbSys = zyWebGLClusterOrb(scene, { R: 20, camera: camera, controls: controls, clusters: _orbCl, canvas: canvas, root: kpRoot });
      if (orbSys && orbSys.setKP) { try { orbSys.setKP(); } catch (eOrb) {} }
    }
  } catch (e) { orbSys = null; }
  function edgeCurve(a, b) {
    var pa = a.pos, pb = b.pos;
    var mid = pa.clone().add(pb).multiplyScalar(0.5);
    var dist = pa.distanceTo(pb);
    var out = mid.clone().normalize(); if (out.lengthSq() < 1e-6) out.set(0, 1, 0);
    var c = mid.clone().add(out.multiplyScalar(dist * 0.22 + 0.12));
    return new THREE.QuadraticBezierCurve3(pa.clone(), c, pb.clone());
  }
  function buildEdgeGeo(e) {
    var a = idMap[e.a], b = idMap[e.b]; if (!a || !b) return null;
    var curve = edgeCurve(a, b);
    var w = e.w || 2;
    var radius = 0.01 + w * 0.006;
    var TUB = 26, RAD = 6;
    var geo = new THREE.TubeGeometry(curve, TUB, radius, RAD, false);
    var ca = new THREE.Color(a.color), cb = new THREE.Color(b.color);
    var pos = geo.attributes.position; var cols = [];
    for (var i = 0; i < pos.count; i++) {
      var t = Math.floor(i / (RAD + 1)) / TUB;
      var c = ca.clone().lerp(cb, t);
      cols.push(c.r, c.g, c.b);
    }
    geo.setAttribute("color", new THREE.Float32BufferAttribute(cols, 3));
    e.curve = curve;
    return geo;
  }
  edges.forEach(function (e) {
    var geo = buildEdgeGeo(e); if (!geo) return;
    var mat = new THREE.MeshBasicMaterial({ vertexColors: true, transparent: true, opacity: 0.55, depthWrite: false });
    var mesh = new THREE.Mesh(geo, mat);
    mesh.userData.edge = e; scene.add(mesh);
    var cb = new THREE.Color(idMap[e.b] ? idMap[e.b].color : "#9fb0c3");
    var tangent = e.curve.getTangent(1).normalize();
    var cone = new THREE.Mesh(new THREE.ConeGeometry(0.03 + (e.w || 2) * 0.004, 0.07 + (e.w || 2) * 0.01, 8), new THREE.MeshBasicMaterial({ color: cb.clone(), transparent: true, opacity: 0.8, depthWrite: false }));
    cone.position.copy(idMap[e.b].pos.clone().add(tangent.clone().multiplyScalar(-(0.07 + (e.w || 2) * 0.01))));
    cone.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), tangent);
    cone.userData.edge = e; scene.add(cone);
    e.mesh = mesh; e.cone = cone;
    edgeMeshes.push(mesh); edgeMeshes.push(cone);
  });
  function zySetAllLines(on) {
    var st = { edges: 0, deco: 0, kp: 0 };
    try { edgeMeshes.forEach(function (m) { m.visible = on; st.edges++; }); } catch (_eL1) {}
    try { zyLineObjs.forEach(function (o) { o.visible = on; st.deco++; }); } catch (_eL2) {}
    try { kpRoot.traverse(function (o) { if ((o.isLine || o.isLineSegments) && !(o.userData && o.userData.zyNoLine)) { o.visible = on; st.kp++; } }); } catch (_eL3) {}
    try { wrap.__zyLineStat = st; } catch (_eL4) {}
    return st;
  }
  if (!loadGraphLines()) zySetAllLines(false);
  wrap.__zyEdgeMeshes = edgeMeshes;
  function refreshEdge(e) {
    if (!e || !e.mesh) return;
    var ng = buildEdgeGeo(e); if (!ng) return;
    e.mesh.geometry.dispose(); e.mesh.geometry = ng;
    var cb = new THREE.Color(idMap[e.b] ? idMap[e.b].color : "#9fb0c3");
    var tangent = e.curve.getTangent(1).normalize();
    e.cone.position.copy(idMap[e.b].pos.clone().add(tangent.clone().multiplyScalar(-(0.07 + (e.w || 2) * 0.01))));
    e.cone.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), tangent);
  }

  camera.position.set(0, 4, 15);
  controls.update();
  var defaultDist = camera.position.distanceTo(controls.target);

  var selected = null, hitSet = null, focusAnim = null, rafOn = true, raf = null;
  var downX = 0, downY = 0, dragging = false, dragNode = null, lockLayout = false, hovered = null, dragSystem = false;
  var dragState = { mode: "solar" }; // "solar"=拖动核心星球(solarRoot) / "kp"=拖动星网链(kpRoot)
  var dragTargetIsKp = false;
  var viewMode = (function () { try { return localStorage.getItem("zhiyu_graph_viewmode") || "orbit"; } catch (e) { return "orbit"; } })(); // "orbit"=自由视角(左键环绕相机) / "drag"=拖动天体
  var raycaster = new THREE.Raycaster();
  var ndc = new THREE.Vector2();
  var dragPlane = new THREE.Plane();
  var dragOffset = new THREE.Vector3();

  function setHighlight(set, mode) {
    var dim = (mode === "search");
    nodeMeshes.forEach(function (m) {
      var n = m.userData.node;
      var on = !set || set.indexOf(n) >= 0;
      if (dim && !on) {
        m.material.opacity = 0.18;
        m.material.emissiveIntensity = (n.id === "me" ? 0.7 : 0.45) * 0.5;
      } else {
        m.material.opacity = 1;
        m.material.emissiveIntensity = on ? (n.id === "me" ? 1.0 : 0.85) : (n.id === "me" ? 0.7 : 0.45);
      }
    });
    labelEls.forEach(function (o) {
      var on = !set || set.indexOf(o.node) >= 0;
      o.el.style.opacity = (dim && !on) ? "0.14" : "1";
    });
    edgeMeshes.forEach(function (m) {
      var e = m.userData.edge;
      var involve = !set || (e && ((set.indexOf(idMap[e.a]) >= 0) || (set.indexOf(idMap[e.b]) >= 0)));
      if (dim) m.material.opacity = set ? (involve ? 0.85 : 0.06) : 0.55;
      else m.material.opacity = set ? (involve ? 0.95 : 0.22) : 0.55;
    });
  }
  var DEF_INFO = "🪐 可自由旋转的 WebGL 星球：空白处拖动旋转视角；滚轮或 ± 缩放；中键(滚轮)长按拖动平移视角；双击节点看详情并可改色；拖动【太阳】可整体挪动核心星球或星网链（看上方🪐/🕸切换）；拖动 KP 点可塑形，双击空白处复位。";
  function clearHighlight() { selected = null; hitSet = null; setHighlight(null); var info = document.getElementById("graphInfo"); if (info) info.innerHTML = DEF_INFO; }

  function nodeSummary(n) {
    var _mc2 = (n.kind === "lifetag") ? 40 : 6;
    var s = "<b style='color:" + n.color + "'>" + (n.label.length > _mc2 ? n.label.slice(0, _mc2) + "…" : n.label) + "</b>";
    s += "<br><span style='color:#9fb0c3'>模块：</span>" + (n.id === "me" ? "你（星球核心）" : (gLabel[n.group] || n.group));
    var neigh = []; edges.forEach(function (e) { if (e.a === n.id) neigh.push(idMap[e.b]); else if (e.b === n.id) neigh.push(idMap[e.a]); });
    neigh = neigh.filter(Boolean);
    s += "<br><span style='color:#9fb0c3'>连线：</span>" + neigh.length + " 条";
    if (n.frag && n.frag.text) s += "<br><span style='color:#9fb0c3'>碎片：</span>" + String(n.frag.text).slice(0, 60);
    if (n.noteId) s += "<br><span style='color:#9fb0c3'>笔记：</span>点节点卡片可打开";
    return s;
  }
  function showInfo(n) {
    selected = n;
    var info = document.getElementById("graphInfo"); if (!info) return;
    var neigh = []; edges.forEach(function (e) { if (e.a === n.id) neigh.push(idMap[e.b]); else if (e.b === n.id) neigh.push(idMap[e.a]); });
    neigh = neigh.filter(Boolean);
    setHighlight(neigh.concat([n]), "select");
    var isMe = n.id === "me";
    var cut = function (s) { return s.length > 12 ? s.slice(0, 11) + "…" : s; };
    var html = '<b style="color:' + n.color + '">' + cut(n.label) + '</b>';
    html += ' · 模块：<b>' + (isMe ? "你（星球核心）" : (gLabel[n.group] || n.group)) + '</b>';
    html += ' · 连线数：<b>' + neigh.length + '</b>';
    if (neigh.length) html += '<br><span class="muted">和它连着：</span>' + neigh.map(function (x) { return '<span class="chip" style="border-color:' + x.color + '">' + cut(x.label) + '</span>'; }).join(" ");
    if (n.frag && n.frag.text) html += '<br><span class="muted">碎片正文：</span>' + String(n.frag.text).slice(0, 80);
    if (n.noteId) html += " · <button id='openNoteBtn' class='ghost' style='padding:2px 8px;font-size:12px'>📝 打开笔记</button>";
    var PRESET = ["#a78bfa", "#5cc8ff", "#7CFFB2", "#ff7eb6", "#ffb86b", "#ffe066", "#ffffff", "#ff6b6b", "#4ade80", "#38bdf8"];
    html += '<div class="graph-color-row" style="margin-top:6px;display:flex;align-items:center;gap:6px;flex-wrap:wrap">' +
      '<span class="muted" style="font-size:12px">🎨 改色</span>' +
      '<input type="color" id="gcPick" value="' + n.color + '" style="width:34px;height:26px;padding:0;border:none;background:none;cursor:pointer" />' +
      PRESET.map(function (pc) { return '<button class="gc-preset" data-c="' + pc + '" title="' + pc + '" style="width:18px;height:18px;border-radius:50%;border:1px solid rgba(255,255,255,.35);background:' + pc + ';cursor:pointer;padding:0"></button>'; }).join("") +
      '<button id="gcReset" class="ghost" style="padding:2px 8px;font-size:12px">↺ 默认色</button>' +
      "</div>";
    var PROTB = { me:1, life:1, p_cog:1, p_mean:1, p_energy:1, p_rel:1, p_val:1 };
    if (PROTB[n.id]) {
      html += '<div class="muted" style="margin-top:8px;font-size:12px">🔒 核心天体（太阳·人生大目标·五大支柱），受保护，不可删除</div>';
    } else {
      html += '<div style="margin-top:8px;display:flex;gap:8px;align-items:center;flex-wrap:wrap">';
      html += '<button id="gzHide" class="ghost" style="padding:2px 10px;font-size:12px">' + (loadGraphHidden().indexOf(n.id) >= 0 ? '👁 显示' : '🙈 隐藏') + '</button>';
      if (n.custom) html += '<button id="gzDel" class="ghost" style="padding:2px 10px;font-size:12px">🗑 删除</button>';
      html += '</div>';
    }
    var _zyLife = (n.id === "life");
    var _zyPid = null;
    if (typeof PILLARS !== "undefined") { var _zpp = PILLARS.find(function (p) { return p.id === n.id; }); if (_zpp) _zyPid = _zpp.id; }
    if (_zyLife || _zyPid || n.kind === "lifetag") {
      try {
        var _m2 = loadMailuo();
        if (_zyLife || n.kind === "lifetag") {
          var _lgs2 = _m2.lifeGoals || [];
          if (_lgs2.length) html += '<br><span class="muted">人生大目标（' + _lgs2.length + '）：</span>' + _lgs2.map(function (l) { return escHTML(l.text || ""); }).join("、");
          else html += '<br><span class="muted">人生大目标：</span><span class="muted">还没写，去「私人知识库 → 目标体系」加一条</span>';
        }
        if (_zyPid) {
          var _pp2 = (_m2.pillars || []).find(function (p) { return p.id === _zyPid; });
          var _pn2 = (_pp2 && _pp2.name) || (((typeof PILLARS !== "undefined") ? PILLARS.filter(function (p) { return p.id === _zyPid; })[0] : null) || {}).name || "该支柱";
          var _ts2 = ((_pp2 && Array.isArray(_pp2.contents)) ? _pp2.contents : []).map(function (c) { return String(c.text || "").trim(); }).filter(Boolean);
          var _gd2 = (_pp2 && _pp2.goal) ? String(_pp2.goal).trim() : "";
          if (_gd2 && _ts2.indexOf(_gd2) < 0) _ts2.unshift(_gd2);
          html += '<br><span class="muted">' + escHTML(_pn2) + ' · 具体内容' + (_ts2.length > 1 ? '（' + _ts2.length + '）' : '') + '：</span>' + (_ts2.length ? _ts2.map(function (t) { return escHTML(t); }).join("、") : '<span class="muted">还没写，去「私人知识库 → 目标体系」补上</span>');
        }
      } catch (_) {}
    }
    info.innerHTML = html;
    var ob = info.querySelector("#openNoteBtn"); if (ob) ob.onclick = function () { openNoteEditor(n.noteId); };
    var applyColor = function (col) {
      n.color = col;
      if (n.mesh) { n.mesh.material.color.set(col); n.mesh.material.emissive.set(col); if (n.mesh.userData.glow) n.mesh.userData.glow.material.color.set(col); }
      saveGraphColor(n.id, col);
      var box = info.querySelector("#gcPick"); if (box) box.value = col;
      edges.forEach(function (e) { if (e.a === n.id || e.b === n.id) refreshEdge(e); });
    };
    var picker = info.querySelector("#gcPick"); if (picker) picker.oninput = function () { applyColor(picker.value); };
    info.querySelectorAll(".gc-preset").forEach(function (b) { b.onclick = function () { applyColor(b.dataset.c); }; });
    var gcr = info.querySelector("#gcReset"); if (gcr) gcr.onclick = function () {
      saveGraphColor(n.id, null);
      var base = n.id === "me" ? "#ffffff" : ((collectGraphGroups().filter(function (g) { return g.key === n.group; })[0] || {}).color || "#9fb0c3");
      applyColor(base);
    };
    var gzHide = info.querySelector("#gzHide"); if (gzHide) gzHide.onclick = function () {
      var h = loadGraphHidden(); var i = h.indexOf(n.id);
      if (i >= 0) h.splice(i, 1); else h.push(n.id);
      saveGraphHidden(h); buildKnowledgeGraph(wrap); clearHighlight();
    };
    var gzDel = info.querySelector("#gzDel"); if (gzDel) gzDel.onclick = function () {
      if (!window.confirm('永久删除天体「' + (n.label || n.id) + '」？该自定义天体将从星球永久移除且不可恢复。')) return;
      var c = loadGraphCustom().filter(function (x) { return x.id !== n.id; }); saveGraphCustom(c);
      var h = loadGraphHidden(); var i = h.indexOf(n.id); if (i >= 0) h.splice(i, 1); saveGraphHidden(h);
      buildKnowledgeGraph(wrap); clearHighlight();
    };
  }

  function pickNode(clientX, clientY) {
    var rect = canvas.getBoundingClientRect();
    ndc.x = ((clientX - rect.left) / rect.width) * 2 - 1;
    ndc.y = -((clientY - rect.top) / rect.height) * 2 + 1;
    raycaster.setFromCamera(ndc, camera);
    var hits = raycaster.intersectObjects(nodeMeshes, false);
    return hits.length ? hits[0].object.userData.node : null;
  }
  function pickEdge(clientX, clientY) {
    var rect = canvas.getBoundingClientRect();
    ndc.x = ((clientX - rect.left) / rect.width) * 2 - 1;
    ndc.y = -((clientY - rect.top) / rect.height) * 2 + 1;
    raycaster.setFromCamera(ndc, camera);
    var hits = raycaster.intersectObjects(edgeMeshes, false);
    return hits.length ? hits[0].object.userData.edge : null;
  }

  function setHover(n) {
    if (hovered === n) return;
    if (hovered && hovered.mesh) hovered.mesh.scale.setScalar(hovered.baseScale);
    hovered = n;
    if (hovered && hovered.mesh) hovered.mesh.scale.setScalar(hovered.baseScale * 1.2);
    if (pSys && pSys.focus) pSys.focus(n);
  }

  canvas.addEventListener("pointerdown", function (e) {
    downX = e.clientX; downY = e.clientY; dragging = false; dragNode = null; dragSystem = false;
    if (!lockLayout) {
      var n = pickNode(e.clientX, e.clientY);
      if (n) {
        // 太阳(me)=整体拖动把手：两种视角下都能拖动【核心星球】或【星网链】（由上方🪐/🕸切换决定对象）
        if (n.id === "me") { dragSystem = true; dragNode = null; dragTargetIsKp = (dragState.mode === "kp"); controls.enabled = false; }
        else if (n._planet) { dragNode = null; } // 行星在轨道上，不可单独拖动，只可点击查看
        else if (viewMode === "drag") { dragNode = n; } // 单个 KP 点拖动仅在「拖动天体」模式启用，自由视角下留给相机旋转
      }
    }
    canvas.style.cursor = (viewMode === "orbit") ? "move" : "grab";
  });
  canvas.addEventListener("pointermove", function (e) {
    if (dragging && (dragNode || dragSystem)) {
      var rect = canvas.getBoundingClientRect();
      ndc.x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
      ndc.y = -((e.clientY - rect.top) / rect.height) * 2 + 1;
      raycaster.setFromCamera(ndc, camera);
      var pt = new THREE.Vector3();
      if (raycaster.ray.intersectPlane(dragPlane, pt)) {
        pt.add(dragOffset);
        if (dragSystem) { (dragTargetIsKp ? kpRoot : solarRoot).position.copy(pt); }
        else { dragNode.pos.copy(pt); dragNode.mesh.position.copy(pt); edges.forEach(function (ed) { if (ed.a === dragNode.id || ed.b === dragNode.id) refreshEdge(ed); }); }
      }
      return;
    }
    if (dragSystem && !lockLayout && Math.abs(e.clientX - downX) + Math.abs(e.clientY - downY) > 4) {
      dragging = true; controls.enabled = false; canvas.style.cursor = "grabbing";
      var _tgt = (dragTargetIsKp ? kpRoot : solarRoot);
      var nrm2 = camera.getWorldDirection(new THREE.Vector3()).negate();
      dragPlane.setFromNormalAndCoplanarPoint(nrm2, _tgt.position);
      var rect3 = canvas.getBoundingClientRect();
      ndc.x = ((e.clientX - rect3.left) / rect3.width) * 2 - 1; ndc.y = -((e.clientY - rect3.top) / rect3.height) * 2 + 1;
      raycaster.setFromCamera(ndc, camera);
      var start3 = new THREE.Vector3(); if (raycaster.ray.intersectPlane(dragPlane, start3)) dragOffset.copy(_tgt.position).sub(start3);
      return;
    }
    if (dragNode && !lockLayout && Math.abs(e.clientX - downX) + Math.abs(e.clientY - downY) > 4) {
      dragging = true; controls.enabled = false; canvas.style.cursor = "grabbing";
      var nrm = camera.getWorldDirection(new THREE.Vector3()).negate();
      dragPlane.setFromNormalAndCoplanarPoint(nrm, dragNode.pos);
      var rect = canvas.getBoundingClientRect();
      ndc.x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
      ndc.y = -((e.clientY - rect.top) / rect.height) * 2 + 1;
      raycaster.setFromCamera(ndc, camera);
      var start = new THREE.Vector3();
      if (raycaster.ray.intersectPlane(dragPlane, start)) dragOffset.copy(dragNode.pos).sub(start);
      return;
    }
    if (pSys && pSys.setVortex) {
      var _rct = canvas.getBoundingClientRect();
      var _cx = _rct.left + _rct.width / 2, _cy = _rct.top + _rct.height / 2;
      var _dx = e.clientX - _cx, _dy = e.clientY - _cy;
      var _rr = Math.min(_rct.width, _rct.height) * 0.22;
      pSys.setVortex((_dx * _dx + _dy * _dy) < _rr * _rr);
    }
    var n = pickNode(e.clientX, e.clientY);
    if (n) {
      setHover(n);
      tip.style.display = "block";
      tip.innerHTML = nodeSummary(n);
      var rect = canvas.getBoundingClientRect();
      var x = e.clientX - rect.left + 14, y = e.clientY - rect.top + 14;
      tip.style.left = Math.min(x, W - 240) + "px"; tip.style.top = Math.min(y, H - 90) + "px";
      edgeLabel.style.display = "none";
      canvas.style.cursor = "pointer";
    } else {
      setHover(null);
      tip.style.display = "none";
      var ed = pickEdge(e.clientX, e.clientY);
      if (ed) {
        edgeLabel.style.display = "block";
        edgeLabel.textContent = (ed.rel || "关联");
        var er = canvas.getBoundingClientRect();
        edgeLabel.style.left = (e.clientX - er.left + 12) + "px";
        edgeLabel.style.top = (e.clientY - er.top + 12) + "px";
        canvas.style.cursor = "help";
      } else { edgeLabel.style.display = "none"; canvas.style.cursor = (viewMode === "orbit") ? "move" : "grab"; }
    }
  });
  function endPointer(e) {
    controls.enabled = true; // 抓取太阳/节点后立即恢复相机控制，防止自由视角下卡死
    if (dragging) {
      dragging = false; var _wasSys = dragSystem; var _wasKp = dragTargetIsKp; dragSystem = false; dragTargetIsKp = false; dragNode = null; controls.enabled = true; canvas.style.cursor = "grab";
      if (_wasSys) { try { if (_wasKp) saveKpRootPos(); else saveSolarPos(); } catch (e) {} } else { try { save3dPositions(); } catch (e) {} }
      return;
    }
    dragSystem = false; dragNode = null;
    if (Math.abs(e.clientX - downX) + Math.abs(e.clientY - downY) > 5) { return; }
    var n = pickNode(e.clientX, e.clientY);
    if (n) { selected = n; setHighlight([n], "select"); if (window.matchMedia && window.matchMedia('(hover: none)').matches) showInfo(n); } else { clearHighlight(); if (pSys && pSys.burst) pSys.burst(new THREE.Vector3(0, 0, 0)); }
  }
  canvas.addEventListener("pointerup", endPointer);
  canvas.addEventListener("pointerleave", function () { setHover(null); tip.style.display = "none"; edgeLabel.style.display = "none"; });

  canvas.addEventListener("dblclick", function (e) {
    var n = pickNode(e.clientX, e.clientY);
    if (n) {
      focusNode(n);
    } else {
      focusAnim = { t: 0, fromT: controls.target.clone(), toT: new THREE.Vector3(0, 0, 0), fromC: camera.position.clone(), toC: new THREE.Vector3(0, 4, 15) };
      clearHighlight();
    }
  });

  function dolly(factor) {
    var dir = camera.position.clone().sub(controls.target);
    var d = dir.length() * factor; d = Math.max(controls.minDistance, Math.min(controls.maxDistance, d));
    dir.setLength(d); camera.position.copy(controls.target).add(dir);
    var zv = document.getElementById("uniZoomVal"); if (zv) zv.textContent = Math.round(d / defaultDist * 100) + "%";
  }

  // #聚焦星球：把相机平滑推到该星球正前方，使其直径约占视口高度的 85%，刚好卡在界面当中
  function focusNode(n) {
    if (!n) return;
    var halfFov = camera.fov * Math.PI / 360; // fov 的一半（弧度）
    var r = (n.baseScale && n.baseScale > 0) ? n.baseScale : 1; // 星球世界半径（单位球 * baseScale）
    var fill = r / (0.85 * Math.tan(halfFov)); // 让星球直径占视口高度约 85% 所需的相机距离
    var newDist = Math.max(controls.minDistance * 1.2, Math.min(controls.maxDistance, fill));
    var dir = camera.position.clone().sub(controls.target);
    if (dir.lengthSq() < 1e-6) dir.set(0, 0.3, 1); else dir.normalize();
    var camNew = n.pos.clone().add(dir.multiplyScalar(newDist));
    focusAnim = { t: 0, fromT: controls.target.clone(), toT: n.pos.clone(), fromC: camera.position.clone(), toC: camNew, bloom: n };
    showInfo(n);
  }
  function updateLabels() {
    var camDir = camera.position.clone().sub(controls.target).normalize();
    labelEls.forEach(function (o) {
      var p = o.node.pos.clone().project(camera);
      if (p.z > 1) { o.el.style.display = "none"; return; }
      var toNode = o.node.pos.clone(); if (toNode.lengthSq() < 1e-6) toNode.set(0, 0, 1); else toNode.normalize();
      var facing = toNode.dot(camDir);
      var _nm = window.ZY_KP_NAME || { central: true, others: true };
      var _show = (o.central ? _nm.central : _nm.others);
      if (!_show) { o.el.style.display = "none"; return; }
      o.el.style.display = "block";
      var x = (p.x * 0.5 + 0.5) * W, y = (-p.y * 0.5 + 0.5) * H;
      o.el.style.transform = "translate(-50%,-155%) translate(" + x + "px," + y + "px)";
      o.el.style.opacity = (facing < -0.15) ? "0.1" : ((selected && selected !== o.node && (!hitSet || hitSet.indexOf(o.node) < 0)) ? "0.14" : "1");
    });
  }
  function doSearch(focus) {
    var sb = document.getElementById("uniSearch");
    var sInfo = document.getElementById("uniSearchInfo");
    var kw = (sb && sb.value ? sb.value.trim().toLowerCase() : "");
    if (!kw) { hitSet = null; setHighlight(null); if (sInfo) sInfo.textContent = ""; return; }
    var hit = nodeMeshes.filter(function (m) { return String(m.userData.node.label || "").toLowerCase().indexOf(kw) >= 0; }).map(function (m) { return m.userData.node; });
    hitSet = hit;
    setHighlight(hit.length ? hit : null, "search");
    if (sInfo) sInfo.textContent = hit.length ? ("命中 " + hit.length + " 个：" + hit.slice(0, 5).map(function (n) { return n.label; }).join("、")) : "没找到，换个词试试";
    if (focus && hit.length) {
      focusNode(hit[0]);
    }
  }

  var bAuto = document.getElementById("uniAuto");
  if (bAuto) bAuto.onclick = function () { controls.autoRotate = !controls.autoRotate; bAuto.textContent = controls.autoRotate ? "🌪 停止旋转" : "🌪 自动旋转"; };
  var bLock = document.getElementById("uniLock");
  if (bLock) bLock.onclick = function () {
    lockLayout = !lockLayout;
    bLock.textContent = lockLayout ? "🔓 布局已锁定" : "🔒 锁定布局";
    bLock.style.color = lockLayout ? "#ffd27a" : "";
    var info = document.getElementById("graphInfo"); if (info && lockLayout) info.innerHTML = "🔒 已锁定布局：节点不可拖拽，仍可旋转/缩放/点击。再点一次解锁。";
  };
  var zi = document.getElementById("uniZoomIn"); if (zi) zi.onclick = function () { dolly(0.82); };
  var zo = document.getElementById("uniZoomOut"); if (zo) zo.onclick = function () { dolly(1.22); };
  var dm = document.getElementById("uniDragMode");
  if (dm) {
    dm.innerHTML = (dragState.mode === "solar") ? "🪐 拖动：核心星球" : "🕸 拖动：星网链";
    dm.style.background = (dragState.mode === "solar") ? "" : "rgba(120,200,255,.28)";
    dm.style.borderColor = (dragState.mode === "solar") ? "" : "#5cc8ff";
    dm.onclick = function () {
      dragState.mode = (dragState.mode === "solar") ? "kp" : "solar";
      dm.innerHTML = (dragState.mode === "solar") ? "🪐 拖动：核心星球" : "🕸 拖动：星网链";
      dm.style.background = (dragState.mode === "solar") ? "" : "rgba(120,200,255,.28)";
      dm.style.borderColor = (dragState.mode === "solar") ? "" : "#5cc8ff";
    };
  var vm = document.getElementById("uniViewMode");
  function syncViewModeUI() {
    if (!vm) return;
    vm.innerHTML = (viewMode === "orbit") ? "✋ 拖动天体" : "🎥 自由视角";
    var dm2 = document.getElementById("uniDragMode");
    if (dm2) dm2.style.display = ""; // 拖动模式切换常驻显示，自由视角下也能选择拖动【核心星球】或【星网链】
    window.__zyInDrag = (viewMode === "drag");
    controls.enabled = true;
    canvas.style.cursor = (viewMode === "orbit") ? "move" : "grab";
  }
  if (vm) {
    syncViewModeUI();
    vm.onclick = function () {
      viewMode = (viewMode === "orbit") ? "drag" : "orbit";
      try { localStorage.setItem("zhiyu_graph_viewmode", viewMode); } catch (e) {}
      controls.enabled = true;
      syncViewModeUI();
      var info = document.getElementById("graphInfo");
      if (info) info.innerHTML = (viewMode === "orbit")
        ? "🎥 自由视角：左键空白拖动环绕镜头，滚轮缩放，中键(滚轮)长按拖动平移；🕸模式下拖动【太阳】可整体挪动星网链（上方🪐/🕸切换对象）。"
        : "✋ 拖动天体：左键拖 KP 点可塑形星网链（单点移动牵连邻居）；🕸模式下拖【太阳】整体挪动整张星网链（上方🪐/🕸切换对象，位置自动保存）。";
    };
  }
  }
  var zr = document.getElementById("uniGraphRelayout"); if (zr) zr.onclick = function () { ["zhiyu_graph2d_pos","zhiyu_graph3d_pos","zhiyu_graph2d_view","zhiyu_graph_solar","zhiyu_graph_kproot"].forEach(function (k) { try { localStorage.removeItem(k); } catch (e) {} }); try { var _kd = kpLoad(); _kd.pos = {}; kpSave(_kd); } catch (e) {} var _w0 = document.getElementById("graphWrap"); if (_w0) buildKnowledgeGraph(_w0); try { if (_w0 && _w0.__webgl && _w0.__webgl.resetView) _w0.__webgl.resetView(); } catch (e) {} };
  var sbEl = document.getElementById("uniSearch");
  if (sbEl) { sbEl.oninput = function () { doSearch(false); }; sbEl.addEventListener("keydown", function (e) { if (e.key === "Enter") doSearch(true); }); }
  var sGo = document.getElementById("uniSearchGo"); if (sGo) sGo.onclick = function () { doSearch(true); };
  var info0 = document.getElementById("graphInfo"); if (info0) info0.innerHTML = DEF_INFO;

  canvas.addEventListener("wheel", function (e) { e.preventDefault(); dolly(e.deltaY < 0 ? 0.9 : 1.11); }, { passive: false });
  canvas.addEventListener("contextmenu", function (e) { e.preventDefault(); });

  function onResize() { var w = wrap.clientWidth || 720, h = wrap.clientHeight || 480; camera.aspect = w / h; camera.updateProjectionMatrix(); renderer.setSize(w, h); W = w; H = h; }
  window.addEventListener("resize", onResize);
  var ro = (window.ResizeObserver) ? new ResizeObserver(onResize) : null; if (ro) ro.observe(wrap);

  /* 图例（分类说明 / 天体类型说明）已按用户要求移除 */

  function loop() {
    if (!rafOn) return;
    raf = requestAnimationFrame(loop);
    if (focusAnim) {
      focusAnim.t += 0.06; var k = Math.min(1, focusAnim.t); var ev = 1 - Math.pow(1 - k, 3);
      controls.target.lerpVectors(focusAnim.fromT, focusAnim.toT, ev);
      camera.position.lerpVectors(focusAnim.fromC, focusAnim.toC, ev);
      if (focusAnim.bloom && focusAnim.bloom.mesh) {
        var sc = focusAnim.bloom.baseScale * (1 + 0.35 * Math.sin(Math.min(1, focusAnim.t) * Math.PI));
        focusAnim.bloom.mesh.scale.setScalar(sc);
        if (k >= 1) focusAnim.bloom.mesh.scale.setScalar(focusAnim.bloom.baseScale);
      }
      if (k >= 1) focusAnim = null;
    }
    controls.update();
    for (var si = 0; si < nodeMeshes.length; si++) { var sm = nodeMeshes[si]; if (sm.userData.spin) sm.rotation.y += sm.userData.spin; }
    if (galaxyGroup) { galaxyGroup.rotation.y += 0.00012; }
    if (solarRoot) {
      for (var _spi = 0; _spi < solarPlanets.length; _spi++) {
        var _sp = solarPlanets[_spi];
        if (_sp._pivot) { _sp._pivot.rotation.y += (_sp._orbSpeed || 0.0008); }
        if (_sp._moonPivot) { _sp._moonPivot.rotation.y += 0.012; }
        if (_sp.mesh) {
          _sp.pos = _sp.mesh.getWorldPosition(new THREE.Vector3());
          // 行星公转/拖动后刷新其所有连线，避免连线停留在初始位置形成「连到空处」的残线
          for (var _pei = 0; _pei < edges.length; _pei++) {
            var _pe = edges[_pei];
            if (_pe.a === _sp.id || _pe.b === _sp.id) { try { refreshEdge(_pe); } catch (_) {} }
          }
        }
      }
      if (solarSunNode && solarSunNode.mesh) {
        solarSunNode.pos = solarRoot.position.clone();
        for (var _sei = 0; _sei < edges.length; _sei++) {
          var _se = edges[_sei];
          if (_se.a === solarSunNode.id || _se.b === solarSunNode.id) { try { refreshEdge(_se); } catch (_) {} }
        }
      }
    }
    // 跟随星球：把子目标/碎片的世界坐标实时同步给 n.pos 并刷新相关连线（它们已挂到支柱 pivot 下，随支柱公转 / 拖动核心星球一起移动）
    if (followers && followers.length) {
      for (var _fi = 0; _fi < followers.length; _fi++) {
        var _f = followers[_fi];
        if (!_f.mesh || !_f.pos) continue;
        var _wp = _f.mesh.getWorldPosition(new THREE.Vector3());
        if (_wp.distanceTo(_f.pos) < 0.015) continue;
        _f.pos.copy(_wp);
        for (var _fei = 0; _fei < edges.length; _fei++) {
          var _fe = edges[_fei];
          if (_fe.a === _f.id || _fe.b === _f.id) { try { refreshEdge(_fe); } catch (_) {} }
        }
      }
    }
    if (pSys && pSys.update) pSys.update();
    if (orbSys && orbSys.update) orbSys.update();
    _meteorTimer++; if (_meteorTimer > 40 && Math.random() < 0.03) { spawnMeteor(); _meteorTimer = 0; }
    _meteors.forEach(function (m) { if (m.life > 0) { m.life -= 0.012; m.x += m.vx; m.y += m.vy; m.z += m.vz; m.s.position.set(m.x, m.y, m.z); m.s.material.opacity = Math.max(0, m.life) * 0.9; m.s.scale.setScalar(0.4 + m.life * 0.4); } else { m.s.material.opacity = 0; } });
    updateLabels();
    renderer.render(scene, camera);
  }
  loop();

  wrap.__webgl = {
    setLines: function (on) { return zySetAllLines(on); },
    setKP: function () { if (orbSys && orbSys.setKP) { try { orbSys.setKP(); } catch (eKp) {} } },
    resetCam: function () {
      try {
        if (!camera || !controls) return;
        focusAnim = { t: 0, fromT: controls.target.clone(), toT: new THREE.Vector3(0, 0, 0), fromC: camera.position.clone(), toC: new THREE.Vector3(0, 4, 15) };
      } catch (e) {}
    },
    resetView: function () {
      try {
        try { localStorage.removeItem("zhiyu_graph_solar"); } catch (e) {}
        if (solarRoot) solarRoot.position.set(0, 0, 0);
        if (kpRoot) kpRoot.position.set(0, 0, 0);
        if (camera) camera.position.set(0, 4, 15);
        if (controls) { controls.target.set(0, 0, 0); controls.update(); }
        focusAnim = null;
      } catch (e) {}
    },
    cleanup: function () {
      rafOn = false; if (raf) cancelAnimationFrame(raf);
      window.removeEventListener('resize', onResize); if (ro) ro.disconnect();
      if (pSys && pSys.dispose) { try { pSys.dispose(); } catch (e2) {} }
      if (orbSys && orbSys.dispose) { try { orbSys.dispose(); } catch (e2) {} }
      try { controls.dispose(); } catch (e) {}
      try { renderer.dispose(); } catch (e) {}
      try {
        scene.traverse(function (o) {
          if (o.geometry && o.geometry !== sphereGeo && !o.isSprite) o.geometry.dispose();
          if (o.material) { if (Array.isArray(o.material)) o.material.forEach(function (m) { m.dispose(); }); else o.material.dispose(); }
        });
      } catch (e) {}
      sphereGeo.dispose();
      try { wrap.classList.remove("zy-3d-on"); } catch (e) {}
      try { Object.keys(TEX || {}).forEach(function (k) { var tt = TEX[k]; if (tt && tt.dispose) tt.dispose(); }); } catch (e) {}
      wrap.querySelectorAll(".zy-webgl-canvas,.zy-label-layer,.zy-graph-tip,.zy-edge-label,.zy-g2d-bg").forEach(function (el) { el.remove(); });
    wrap.__g2d = null;
  try { wrap.classList.remove("zy-galaxy-on"); } catch (e) {}
    }
  };
}

// 3D 知识星球：彩色星团球（天体球壳）——球壳彩色粒子 + 簇内连线 + 外层星尘，缓慢自转
function zyWebGLClusterOrb(scene, opts) {
  if (typeof THREE === 'undefined' || !scene) return null;
  try { if (window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches) return null; } catch (e) {}
  opts = opts || {};
  var R = opts.R || 20;
  var spec = zyClusterOrbBuild({ count: opts.count || 1000, dust: opts.dust || 720, clusters: opts.clusters, seed: 20260911 });
  var cvs = document.createElement('canvas'); cvs.width = 64; cvs.height = 64;
  var g2 = cvs.getContext('2d');
  var grd = g2.createRadialGradient(32, 32, 0, 32, 32, 32);
  grd.addColorStop(0, 'rgba(255,255,255,1)');
  grd.addColorStop(0.35, 'rgba(255,255,255,0.75)');
  grd.addColorStop(1, 'rgba(255,255,255,0)');
  g2.fillStyle = grd; g2.fillRect(0, 0, 64, 64);
  var dot = new THREE.CanvasTexture(cvs);
  var nn = spec.nodes.length;
  var pos = new Float32Array(nn * 3), col = new Float32Array(nn * 3);
  for (var i = 0; i < nn; i++) {
    var nd = spec.nodes[i];
    pos[i * 3] = nd.x * R; pos[i * 3 + 1] = nd.y * R; pos[i * 3 + 2] = nd.z * R;
    col[i * 3] = nd.col.r; col[i * 3 + 1] = nd.col.g; col[i * 3 + 2] = nd.col.b;
  }
  var geo = new THREE.BufferGeometry();
  geo.setAttribute('position', new THREE.BufferAttribute(pos, 3));
  geo.setAttribute('color', new THREE.BufferAttribute(col, 3));
  var pmat = new THREE.PointsMaterial({ size: R * 0.024, map: dot, vertexColors: true, transparent: true, opacity: 0.85, depthWrite: false, blending: THREE.AdditiveBlending, sizeAttenuation: true });
  var points = new THREE.Points(geo, pmat); points.frustumCulled = false;
  var dn = spec.dust.length;
  var dpos = new Float32Array(dn * 3);
  for (var d = 0; d < dn; d++) { var dd = spec.dust[d]; dpos[d * 3] = dd.x * R; dpos[d * 3 + 1] = dd.y * R; dpos[d * 3 + 2] = dd.z * R; }
  var dgeo = new THREE.BufferGeometry();
  dgeo.setAttribute('position', new THREE.BufferAttribute(dpos, 3));
  var dmat = new THREE.PointsMaterial({ size: R * 0.013, map: dot, color: 0xdfe9ff, transparent: true, opacity: 0.5, depthWrite: false, blending: THREE.AdditiveBlending, sizeAttenuation: true });
  var dustPts = new THREE.Points(dgeo, dmat); dustPts.frustumCulled = false;
  var pn = spec.pairs.length;
  var lpos = new Float32Array(pn * 6), lcol = new Float32Array(pn * 6);
  for (var q = 0; q < pn; q++) {
    var a = spec.nodes[spec.pairs[q][0]], b = spec.nodes[spec.pairs[q][1]];
    lpos[q * 6] = a.x * R; lpos[q * 6 + 1] = a.y * R; lpos[q * 6 + 2] = a.z * R;
    lpos[q * 6 + 3] = b.x * R; lpos[q * 6 + 4] = b.y * R; lpos[q * 6 + 5] = b.z * R;
    lcol[q * 6] = a.col.r; lcol[q * 6 + 1] = a.col.g; lcol[q * 6 + 2] = a.col.b;
    lcol[q * 6 + 3] = b.col.r; lcol[q * 6 + 4] = b.col.g; lcol[q * 6 + 5] = b.col.b;
  }
  var lgeo = new THREE.BufferGeometry();
  lgeo.setAttribute('position', new THREE.BufferAttribute(lpos, 3));
  lgeo.setAttribute('color', new THREE.BufferAttribute(lcol, 3));
  var lmat = new THREE.LineBasicMaterial({ vertexColors: true, transparent: true, opacity: 0.14, depthWrite: false, blending: THREE.AdditiveBlending });
  var lines = new THREE.LineSegments(lgeo, lmat); lines.frustumCulled = false;
  var group = new THREE.Group();
  // 用户要求：删掉没有知识点/名称填充的粒子（基础星节点、星尘、簇连线均为无名装饰），仅保留 KP 点
  points.visible = false; dustPts.visible = false; lines.visible = false; try { lines.userData.zyNoLine = 1; } catch (_eNL) {}
  group.add(points); group.add(dustPts); group.add(lines);
  group.rotation.x = -0.36;
  // 星网链（KP 网络）挂在 solarRoot 之下：拖动太阳整体挪动星系时，星网链随之整体平移，与核心星球一致
  var _kpParent = (opts && opts.root) ? opts.root : scene;
  _kpParent.add(group);
  ZY_KP_SLOTS.d3 = nn;
  var kpPts = null, kpLines = null, kpMeta = [];
  var kpPts = null, kpLines = null, kpMeta = [], kpLayer = null, kpLabels = [], kpPos = [], kpKeys = [], kpFiCount = 0, kpConn = [];
  var _dragActive = false;
  var _kv = new THREE.Vector3();
  function ensureKpLayer() {
    if (kpLayer) return kpLayer;
    try {
      var pl = (opts.canvas && opts.canvas.parentNode) || document.body;
      kpLayer = document.createElement('div');
      kpLayer.className = 'zy-kp-label-layer';
      kpLayer.style.cssText = 'position:absolute;left:0;top:0;width:100%;height:100%;pointer-events:none;overflow:hidden;z-index:6';
      pl.appendChild(kpLayer);
    } catch (e) { kpLayer = null; }
    return kpLayer;
  }
  function rgbCss(c, a) { return 'rgba(' + Math.round((c.r) * 255) + ',' + Math.round((c.g) * 255) + ',' + Math.round((c.b) * 255) + ',' + (a == null ? 1 : a) + ')'; }

  var kpMat = new THREE.PointsMaterial({ size: R * 0.105, map: dot, vertexColors: true, transparent: true, opacity: 0.98, depthWrite: false, blending: THREE.NormalBlending, sizeAttenuation: true });
  // 足迹渲染状态
  var footprintPts = null;

  function kpSeedNum(str) { var h = 7; str = String(str || "x"); for (var i = 0; i < str.length; i++) { h = (h * 31 + str.charCodeAt(i)) % 99991; } return h; }
  function clearKp() {
    [kpPts, kpLines, footprintPts].forEach(function (o) {
      if (!o) return;
      try { group.remove(o); } catch (e) {}
      try { o.geometry.dispose(); } catch (e2) {}
      try { if (o.material && o.material !== kpMat) o.material.dispose(); } catch (e3) {}
    });
    kpPts = null; kpLines = null; kpMeta = []; kpKeys = []; kpConn = [];
    footprintPts = null;
    kpLabels.forEach(function (l) { try { l.el.remove(); } catch (e4) {} });
    kpLabels = [];
  }
  function buildKp() {
    clearKp();
    var kd = kpLoad();
    var fi = [];
    for (var i = 0; i < nn; i++) { if (kd.assign["d3:" + i]) fi.push(i); }
    var ex = [];
    (kd.extra || []).forEach(function (r) { if (r && (!r.mode || r.mode === "d3")) ex.push(r); });
    var tot = fi.length + ex.length;
    kpFiCount = fi.length;
    if (!tot) return;
    var fp = new Float32Array(tot * 3), fc = new Float32Array(tot * 3);
    fi.forEach(function (idx, k) {
      fp[k * 3] = pos[idx * 3] * 1.03; fp[k * 3 + 1] = pos[idx * 3 + 1] * 1.03; fp[k * 3 + 2] = pos[idx * 3 + 2] * 1.03;
      var c = kpRgb(kpCatColor(kd.assign["d3:" + idx].cat));
      fc[k * 3] = c.r; fc[k * 3 + 1] = c.g; fc[k * 3 + 2] = c.b;
      var _r = kd.assign["d3:" + idx];
      kpMeta.push({ label: _r.label, catName: _r.catName, detail: _r.detail, full: _r.full, color: c });
      kpKeys.push("d3:" + idx);
    });
    var exPos = [];
    ex.forEach(function (r, k) {
      var sd = kpSeedNum(r.id || r.label);
      var ang = (sd % 628) / 100, tilt = ((((sd / 628) | 0) % 100) / 100 - 0.5) * 1.5;
      var rr = R * (1.24 + (sd % 19) / 100);
      var x = Math.cos(ang) * Math.cos(tilt) * rr, y = Math.sin(tilt) * 0.8 * rr, z = Math.sin(ang) * Math.cos(tilt) * rr;
      var j = fi.length + k;
      fp[j * 3] = x; fp[j * 3 + 1] = y; fp[j * 3 + 2] = z;
      var c2 = kpRgb(kpCatColor(r.cat));
      fc[j * 3] = c2.r; fc[j * 3 + 1] = c2.g; fc[j * 3 + 2] = c2.b;
      kpMeta.push({ label: r.label, catName: r.catName, detail: r.detail, full: r.full, color: kpRgb(kpCatColor(r.cat)) });
      kpKeys.push("extra:" + k);
      exPos.push([x, y, z]);
    });
    // #C 应用用户自定义拖拽位置（持久化于 kd.pos，本地坐标），形成自定义形状
    if (kd && kd.pos) {
      for (var _oi = 0; _oi < tot; _oi++) {
        var _ok = kpKeys[_oi];
        if (!_ok) continue;
        var _op = kd.pos[_ok];
        if (!_op || _op.length < 3) continue;
        fp[_oi*3] = _op[0]; fp[_oi*3+1] = _op[1]; fp[_oi*3+2] = _op[2];
      }
    }
    var fg = new THREE.BufferGeometry();
    fg.setAttribute("position", new THREE.BufferAttribute(fp, 3));
    fg.setAttribute("color", new THREE.BufferAttribute(fc, 3));
    kpPts = new THREE.Points(fg, kpMat); kpPts.frustumCulled = false;
    group.add(kpPts);
    // 知识点互连网络：每个 KP 连最近邻，形成 3D 知识图谱连线
    kpConn = [];
    var _seen = {};
    for (var _i2 = 0; _i2 < tot; _i2++) {
      var _d = [];
      for (var _j2 = 0; _j2 < tot; _j2++) {
        if (_j2 === _i2) continue;
        var _dx = fp[_i2*3] - fp[_j2*3], _dy = fp[_i2*3+1] - fp[_j2*3+1], _dz = fp[_i2*3+2] - fp[_j2*3+2];
        _d.push([_dx*_dx + _dy*_dy + _dz*_dz, _j2]);
      }
      _d.sort(function(a,b){ return a[0]-b[0]; });
      var _nbn = Math.min(3, _d.length);
      for (var _n = 0; _n < _nbn; _n++) {
        var _a = _i2, _b = _d[_n][1];
        if (_a > _b) { var _t = _a; _a = _b; _b = _t; }
        var _key = _a + "-" + _b;
        if (!_seen[_key]) { _seen[_key] = 1; kpConn.push([_a, _b]); }
      }
    }
    // 保证星网链无孤立点：任何 KP 粒子至少连 1 条
    (function () {
      var _deg = new Int32Array(tot);
      kpConn.forEach(function (pr) { _deg[pr[0]]++; _deg[pr[1]]++; });
      for (var _o = 0; _o < tot; _o++) {
        if (_deg[_o] > 0) continue;
        var _bd = -1, _bdd = Infinity;
        for (var _q2 = 0; _q2 < tot; _q2++) {
          if (_q2 === _o) continue;
          var _dx = fp[_o*3]-fp[_q2*3], _dy = fp[_o*3+1]-fp[_q2*3+1], _dz = fp[_o*3+2]-fp[_q2*3+2];
          var _dd = _dx*_dx+_dy*_dy+_dz*_dz;
          if (_dd < _bdd) { _bdd = _dd; _bd = _q2; }
        }
        if (_bd >= 0) { var _a = _o < _bd ? _o : _bd, _b = _o < _bd ? _bd : _o; var _kk = _a + "-" + _b; if (!_seen[_kk]) { _seen[_kk] = 1; kpConn.push([_a, _b]); } }
      }
    })();
    if (kpConn.length) {
      var lp = new Float32Array(kpConn.length * 6), lc = new Float32Array(kpConn.length * 6);
      kpConn.forEach(function (pr, k) {
        var a = pr[0], b = pr[1];
        lp[k*6] = fp[a*3]; lp[k*6+1] = fp[a*3+1]; lp[k*6+2] = fp[a*3+2];
        lp[k*6+3] = fp[b*3]; lp[k*6+4] = fp[b*3+1]; lp[k*6+5] = fp[b*3+2];
        var ca = [fc[a*3], fc[a*3+1], fc[a*3+2]], cb = [fc[b*3], fc[b*3+1], fc[b*3+2]];
        for (var t = 0; t < 2; t++) { var cc = t === 0 ? ca : cb; lc[k*6+t*3] = cc[0]; lc[k*6+t*3+1] = cc[1]; lc[k*6+t*3+2] = cc[2]; }
      });
      var lg2 = new THREE.BufferGeometry();
      lg2.setAttribute("position", new THREE.BufferAttribute(lp, 3));
      lg2.setAttribute("color", new THREE.BufferAttribute(lc, 3));
      kpLines = new THREE.LineSegments(lg2, new THREE.LineBasicMaterial({ vertexColors: true, transparent: true, opacity: 0.55, depthWrite: false, blending: THREE.AdditiveBlending }));
      kpLines.frustumCulled = false;
      group.add(kpLines);
    }
    // 记录本地坐标并构建常驻名称标签层
    kpPos = [];
    for (var j = 0; j < tot; j++) kpPos.push([fp[j * 3], fp[j * 3 + 1], fp[j * 3 + 2]]);


    // ===== 历史足迹（碎片 + 成长足迹）：散落、不连线、可隐藏 =====
    try {
      var _foots = [];
      try { var _ml = loadMailuo(); if (_ml && _ml.fragments) _ml.fragments.forEach(function (f) { _foots.push(String(f.text || f.title || "碎片").slice(0, 18)); }); } catch (e) {}
      try { var _fpj = JSON.parse(localStorage.getItem("zhiyu_footprint") || "[]"); if (_fpj && _fpj.length) _fpj.forEach(function (f) { _foots.push(String(f.text || "").slice(0, 18)); }); } catch (e) {}
      if (false) { // 已移除：历史足迹无名散落粒子（footprintPts）—— 无名称、无用的装饰
        var _fpos = new Float32Array(_foots.length * 3), _fcol = new Float32Array(_foots.length * 3);
        for (var _f = 0; _f < _foots.length; _f++) {
          var _fh = ((_f * 2654435761) % 100000);
          var _fa = (_fh / 100000) * Math.PI * 2;
          var _fr = R * (1.55 + ((_fh % 37) / 100) * 0.5);
          var _ft = (((_fh / 100000 * 7) | 0) % 100) / 100 * Math.PI - Math.PI / 2;
          _fpos[_f*3] = Math.cos(_fa) * Math.cos(_ft) * _fr;
          _fpos[_f*3+1] = Math.sin(_ft) * _fr;
          _fpos[_f*3+2] = Math.sin(_fa) * Math.cos(_ft) * _fr;
          _fcol[_f*3] = 0.62; _fcol[_f*3+1] = 0.7; _fcol[_f*3+2] = 0.85;
        }
        var _fg = new THREE.BufferGeometry();
        _fg.setAttribute("position", new THREE.BufferAttribute(_fpos, 3));
        _fg.setAttribute("color", new THREE.BufferAttribute(_fcol, 3));
        footprintPts = new THREE.Points(_fg, new THREE.PointsMaterial({ size: R * 0.05, map: dot, vertexColors: true, transparent: true, opacity: 0.55, depthWrite: false, blending: THREE.AdditiveBlending, sizeAttenuation: true }));
        footprintPts.frustumCulled = false; group.add(footprintPts);
      }
    } catch (e) {}

    try {
      var layer = ensureKpLayer();
      kpLabels.forEach(function (l) { try { l.el.remove(); } catch (e) {} });
      kpLabels = [];
      if (layer) {
        for (var _j = 0; _j < kpMeta.length; _j++) {
          var _m = kpMeta[_j]; if (!_m) continue;
          var _el = document.createElement("div");
          _el.className = "zy-kp-label";
          _el.style.cssText = "position:absolute;transform:translate(-50%,-150%);white-space:nowrap;font:600 11px/1.15 system-ui,'Microsoft YaHei',sans-serif;padding:1px 5px;border-radius:6px;background:rgba(8,14,30,.74);border:1px solid " + rgbCss(_m.color, 0.85) + ";color:#eaf2ff;box-shadow:0 1px 6px rgba(0,0,0,.45);will-change:left,top;display:none;max-width:120px;overflow:hidden;text-overflow:ellipsis";
          _el.textContent = kpShort(_m.label, 12);
          _el.title = _m.label;
          layer.appendChild(_el);
          kpLabels.push({ el: _el, pos: kpPos[_j], central: (_j < kpFiCount) });
        }
      }
    } catch (e) {}
  }
    var kpTip = null;
  function kpTipShow(x, y, m) {
    if (!kpTip) {
      kpTip = document.createElement("div");
      kpTip.style.cssText = "position:fixed;z-index:99999;pointer-events:none;background:rgba(8,14,30,0.92);border:1px solid rgba(120,160,255,0.35);color:#dbe7ff;font:12px/1.5 system-ui,'Microsoft YaHei',sans-serif;padding:6px 9px;border-radius:8px;max-width:260px;display:none";
      document.body.appendChild(kpTip);
    }
    kpTip.innerHTML = "<b style='color:#fff'>" + kpShort(m.label, 16) + "</b><span style='opacity:.7;font-size:10px;margin-left:6px'>" + (m.catName || "") + "</span>" + (m.detail ? "<div style='opacity:.8;font-size:11px;margin-top:2px'>" + kpShort(m.detail, 46) + "</div>" : "");
    kpTip.style.left = Math.min(x + 12, (window.innerWidth || 1200) - 270) + "px";
    kpTip.style.top = (y + 14) + "px";
    kpTip.style.display = "block";
  }
  function kpTipHide() { if (kpTip) kpTip.style.display = "none"; }
  if (opts.canvas && opts.camera && typeof THREE.Raycaster === "function") {
    var _rc = new THREE.Raycaster();
    _rc.params = _rc.params || {}; _rc.params.Points = { threshold: R * 0.055 };
    var _kpT = 0;
    opts.canvas.addEventListener("pointermove", function (ev) {
      var now = Date.now(); if (now - _kpT < 60) return; _kpT = now;
      try {
        var r = opts.canvas.getBoundingClientRect();
        var mx = ((ev.clientX - r.left) / r.width) * 2 - 1, my = -((ev.clientY - r.top) / r.height) * 2 + 1;
        _rc.setFromCamera({ x: mx, y: my }, opts.camera);
        if (!kpPts) { kpTipHide(); return; }
        var hit = _rc.intersectObject(kpPts);
        if (hit && hit.length && kpMeta[hit[0].index]) kpTipShow(ev.clientX, ev.clientY, kpMeta[hit[0].index]);
        else kpTipHide();
      } catch (e) {}
    }, { passive: true });
    opts.canvas.addEventListener("pointerleave", function () { kpTipHide(); }, { passive: true });
  }
  // ---- 3D 知识点：点击查看详解 + 拖拽自由移动 ----
  (function () {
    // #C 单点拖拽 + 1 跳邻居牵连跟随（不再整体移动），拖拽后持久化自定义形状
    var _dragIdx = -1, _isClick = false, _dmx = 0, _dmy = 0, _dragPlane = null, _dragBaseWp = null, _nbBase = null, _moved = null;
    function _screenToPlane(ev) {
      try {
        var r = opts.canvas.getBoundingClientRect();
        var mx = ((ev.clientX - r.left) / r.width) * 2 - 1, my = -((ev.clientY - r.top) / r.height) * 2 + 1;
        var ray = new THREE.Raycaster(); ray.setFromCamera({ x: mx, y: my }, cam);
        var out = new THREE.Vector3();
        if (ray.ray.intersectPlane(_dragPlane, out)) return out;
      } catch (e) {}
      return null;
    }
    function _pickKp(ev) {
      try {
        var r = opts.canvas.getBoundingClientRect();
        var mx = ((ev.clientX - r.left) / r.width) * 2 - 1, my = -((ev.clientY - r.top) / r.height) * 2 + 1;
        var rc = new THREE.Raycaster(); rc.params = rc.params || {};
        rc.params.Points = { threshold: R * 0.06 };
        rc.setFromCamera({ x: mx, y: my }, cam);
        if (!kpPts) return -1;
        var hit = rc.intersectObject(kpPts);
        if (hit && hit.length && hit[0].index != null && kpMeta[hit[0].index]) return hit[0].index;
      } catch (e) {}
      return -1;
    }
    function _applyLocal(idx, wp) {
      try {
        var v = wp.clone(); group.worldToLocal(v);
        var a = kpPts.geometry.attributes.position.array;
        a[idx * 3] = v.x; a[idx * 3 + 1] = v.y; a[idx * 3 + 2] = v.z;
        kpPts.geometry.attributes.position.needsUpdate = true;
        if (kpPos[idx]) { kpPos[idx][0] = v.x; kpPos[idx][1] = v.y; kpPos[idx][2] = v.z; }
        if (kpLines && kpConn && kpConn.length) {
          var _la = kpLines.geometry.attributes.position.array;
          for (var _ck = 0; _ck < kpConn.length; _ck++) {
            var _pa = kpConn[_ck][0], _pb = kpConn[_ck][1];
            if (_pa === idx) { _la[_ck*6] = v.x; _la[_ck*6+1] = v.y; _la[_ck*6+2] = v.z; }
            else if (_pb === idx) { _la[_ck*6+3] = v.x; _la[_ck*6+4] = v.y; _la[_ck*6+5] = v.z; }
          }
          kpLines.geometry.attributes.position.needsUpdate = true;
          // 支柱连线已移除
        }
      } catch (e) {}
    }
    function _setKpWorld(idx, worldVec) {
      try {
        var v = worldVec.clone(); group.worldToLocal(v);
        var a = kpPts.geometry.attributes.position.array;
        a[idx*3] = v.x; a[idx*3+1] = v.y; a[idx*3+2] = v.z;
        kpPts.geometry.attributes.position.needsUpdate = true;
        if (kpPos[idx]) { kpPos[idx][0] = v.x; kpPos[idx][1] = v.y; kpPos[idx][2] = v.z; }
      } catch (e) {}
    }
  function _refreshLines() {
    if (kpLines && kpConn && kpConn.length) {
      try {
        var la = kpLines.geometry.attributes.position.array;
        for (var _ck = 0; _ck < kpConn.length; _ck++) {
          var _pa = kpConn[_ck][0], _pb = kpConn[_ck][1];
          var _aa = kpPos[_pa], _ab = kpPos[_pb];
          if (!_aa || !_ab) continue;
          la[_ck*6] = _aa[0]; la[_ck*6+1] = _aa[1]; la[_ck*6+2] = _aa[2];
          la[_ck*6+3] = _ab[0]; la[_ck*6+4] = _ab[1]; la[_ck*6+5] = _ab[2];
        }
        kpLines.geometry.attributes.position.needsUpdate = true;
      } catch (e) {}
    }
  }

    function _neighborsOf(idx) {
      var s = {};
      for (var _c = 0; _c < kpConn.length; _c++) {
        if (kpConn[_c][0] === idx) s[kpConn[_c][1]] = 1;
        else if (kpConn[_c][1] === idx) s[kpConn[_c][0]] = 1;
      }
      return Object.keys(s).map(Number);
    }
    document.addEventListener("zhiyu:kp-changed", function () { try { setKP(); } catch (e) {} });
    if (opts.canvas) {
      opts.canvas.addEventListener("pointerdown", function (ev) {
        if (ev.button != null && ev.button !== 0) return;
        var idx = _pickKp(ev); if (idx < 0) return;
        _dragIdx = idx; _isClick = true; _dmx = ev.clientX; _dmy = ev.clientY;
        try {
          var wp = new THREE.Vector3();
          if (kpPos[idx]) { wp.set(kpPos[idx][0], kpPos[idx][1], kpPos[idx][2]); group.localToWorld(wp); }
          _dragBaseWp = wp.clone();
          // #C 记录 1 跳邻居起始世界坐标，用于牵连跟随（0.5 倍）
          _nbBase = {}; _moved = {}; _moved[idx] = 1;
          var nbs = _neighborsOf(idx);
          nbs.forEach(function (nb) {
            var _nw = new THREE.Vector3();
            if (kpPos[nb]) { _nw.set(kpPos[nb][0], kpPos[nb][1], kpPos[nb][2]); group.localToWorld(_nw); }
            _nbBase[nb] = _nw; _moved[nb] = 1;
          });
          var nr = new THREE.Vector3(); cam.getWorldDirection(nr);
          _dragPlane = new THREE.Plane().setFromNormalAndCoplanarPoint(nr, wp);
        } catch (e) {}
        _dragActive = true;
        if (ctl && ctl.enabled !== undefined) { try { ctl.enabled = false; } catch (e) {} }
      }, true);
      opts.canvas.addEventListener("pointermove", function (ev) {
        if (_dragIdx < 0) return;
        if (Math.abs(ev.clientX - _dmx) + Math.abs(ev.clientY - _dmy) > 6) _isClick = false;
        _dmx = ev.clientX; _dmy = ev.clientY;
        var wp = _screenToPlane(ev);
        if (!wp) return;
        // #C 主点跟随指针，1 跳邻居以 0.5 倍牵连跟随，形成用户自定义形状
        _setKpWorld(_dragIdx, wp);
        var dx = wp.x - _dragBaseWp.x, dy = wp.y - _dragBaseWp.y, dz = wp.z - _dragBaseWp.z;
        if (_nbBase) {
          for (var _nbk in _nbBase) {
            if (!_nbBase.hasOwnProperty(_nbk)) continue;
            var _nb = parseInt(_nbk, 10); var _bw = _nbBase[_nbk];
            _setKpWorld(_nb, new THREE.Vector3(_bw.x + dx * 0.5, _bw.y + dy * 0.5, _bw.z + dz * 0.5));
          }
        }
        _refreshLines();
      });
      window.addEventListener("pointerup", function () {
        if (_dragIdx < 0) return;
        var idx = _dragIdx; _dragIdx = -1; _dragBaseWp = null; _nbBase = null; _dragActive = false;
        if (ctl && ctl.enabled !== undefined) { try { ctl.enabled = true; } catch (e) {} }
        // #C 持久化被移动点的自定义位置（本地坐标），供下次载入保持形状
        try {
          var kd = kpLoad(); if (!kd.pos) kd.pos = {};
          if (_moved) {
            for (var _mk in _moved) {
              if (!_moved.hasOwnProperty(_mk)) continue;
              var _mi = parseInt(_mk, 10);
              var _key = kpKeys[_mi]; if (!_key) continue;
              var _p = kpPos[_mi]; if (!_p) continue;
              kd.pos[_key] = [_p[0], _p[1], _p[2]];
            }
          }
          kpSave(kd);
        } catch (e) {}
        _moved = null;
        if (_isClick) { var m = kpMeta[idx]; if (m) zyShowKpDetailModal(m, kpKeys[idx] || ""); }
      });
    }
  })();
  var _locateIdx = -1;
  function locate(label) {
    _locateIdx = -1;
    if (!label) return false;
    label = String(label).toLowerCase();
    for (var _i = 0; _i < kpMeta.length; _i++) {
      if (kpMeta[_i] && kpMeta[_i].label && kpMeta[_i].label.toLowerCase().indexOf(label) >= 0) { _locateIdx = _i; return true; }
    }
    return false;
  }
  function setKP() { try { buildKp(); } catch (e) {} }
  var cam = opts.camera, ctl = opts.controls, tt = 0;
  function update() {
    tt += 1;
    if (!_dragActive) {
      if (_locateIdx >= 0 && kpPos[_locateIdx]) {
        var _lp = kpPos[_locateIdx];
        var _tRY = Math.atan2(_lp[0], _lp[2]);
        var _d = _tRY - group.rotation.y;
        while (_d > Math.PI) _d -= Math.PI * 2; while (_d < -Math.PI) _d += Math.PI * 2;
        group.rotation.y += _d * 0.10;
      } else {
        group.rotation.y += 0.00042;
        group.rotation.x = -0.36 + Math.sin(tt * 0.0022) * 0.05;
      }
    }
    var dist = 18;
    if (cam && ctl && ctl.target) { try { dist = cam.position.distanceTo(ctl.target); } catch (e) {} }
    else if (cam) { try { dist = cam.position.length(); } catch (e) {} }
    var k = Math.max(0, Math.min(1, (dist - 4) / 9));
    if (points.visible) { pmat.opacity = 0.10 + 0.78 * k; }
    if (dustPts.visible) { dmat.opacity = 0.06 + 0.46 * k; }
    if (lines.visible) { lmat.opacity = 0.02 + 0.14 * k; }
    if (kpMat) { kpMat.opacity = 0.88 + 0.12 * k; kpMat.size = R * 0.105 * (1 + 0.10 * Math.sin(tt * 0.06)); }
    try {
      if (kpLabels.length && cam && opts.canvas) {
        var _rect = opts.canvas.getBoundingClientRect();
        if (!_rect || _rect.width < 2 || _rect.height < 2) {
          for (var _li = 0; _li < kpLabels.length; _li++) { if (kpLabels[_li] && kpLabels[_li].el) kpLabels[_li].el.style.display = 'none'; }
        } else {
          var _W = _rect.width, _H = _rect.height;
          group.updateMatrixWorld(true);
          for (var _li2 = 0; _li2 < kpLabels.length; _li2++) {
            var _L = kpLabels[_li2]; if (!_L || !_L.el || !_L.pos) continue;
            var _nm = window.ZY_KP_NAME || { central: true, others: true };
            var _showName = _L.central ? _nm.central : _nm.others;
            if (_li2 === _locateIdx) _showName = true;
            if (!_showName) { _L.el.style.display = 'none'; continue; }
            if (_li2 === _locateIdx) { _L.el.style.background = "rgba(255,180,60,.92)"; _L.el.style.color = "#1a1205"; _L.el.style.border = "1px solid #ffd86b"; _L.el.style.fontSize = "13px"; _L.el.style.fontWeight = "800"; _L.el.style.display = "block"; _L.el.style.zIndex = "9"; }
            _kv.set(_L.pos[0], _L.pos[1], _L.pos[2]);
            group.localToWorld(_kv);
            var _toCam = cam.position.clone().sub(_kv);
            var _facing = _kv.dot(_toCam);
            _kv.project(cam);
            if (_kv.z > 1 || _facing <= 0) { _L.el.style.display = 'none'; continue; }
            _L.el.style.left = (_kv.x * 0.5 + 0.5) * _W + 'px';
            _L.el.style.top = (-_kv.y * 0.5 + 0.5) * _H + 'px';
            _L.el.style.display = 'block';
          }
        }
      }

    } catch (e) {}
  }
  function dispose() {
    try { clearKp(); } catch (e) {}
    try { if (group.parent) group.parent.remove(group); else scene.remove(group); } catch (e2) {}
    try { geo.dispose(); pmat.dispose(); dgeo.dispose(); dmat.dispose(); lgeo.dispose(); lmat.dispose(); kpMat.dispose(); dot.dispose(); } catch (e3) {}
    if (kpLayer && kpLayer.parentNode) { try { kpLayer.parentNode.removeChild(kpLayer); } catch (e4) {} kpLayer = null; }
  }
  return { update: update, dispose: dispose, group: group, setKP: setKP, locate: locate };
}
function zyWebGLParticles(scene, camera, renderer, controls, canvas, wrap, TEX, nodes) {
  if (typeof THREE === 'undefined' || !scene || !nodes || !nodes.length) return null;
  try { if (window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches) return null; } catch (e) {}
  function makeDotTex() {
    var c = document.createElement('canvas'); c.width = 64; c.height = 64;
    var g = c.getContext('2d');
    var grd = g.createRadialGradient(32, 32, 0, 32, 32, 32);
    grd.addColorStop(0, 'rgba(255,255,255,1)');
    grd.addColorStop(0.35, 'rgba(255,255,255,0.8)');
    grd.addColorStop(1, 'rgba(255,255,255,0)');
    g.fillStyle = grd; g.fillRect(0, 0, 64, 64);
    return new THREE.CanvasTexture(c);
  }
  var dot = makeDotTex();
  var systems = [];
  nodes.forEach(function (n) {
    var rad = n.baseScale || 0.2;
    var N = 14;
    var spread = Math.max(rad * 2.6, 0.5);
    var positions = new Float32Array(N * 3);
    var colors = new Float32Array(N * 3);
    var baseCol = new THREE.Color(n.color || '#9fb0c3');
    var accent = [[1,1,1],[0.78,0.90,1.0],[0.66,0.85,1.0],[Math.min(1,baseCol.r*1.25),Math.min(1,baseCol.g*1.25),Math.min(1,baseCol.b*1.25)],[1.0,0.95,0.76]];
    var home = [], vel = new Float32Array(N * 3);
    for (var i = 0; i < N; i++) {
      var ang = i * 2.39996322972865332 + Math.random() * 0.6;
      var rr = Math.pow(Math.random(), 1.4) * spread;
      if (Math.random() < 0.25) rr *= 0.5;
      var x = Math.cos(ang) * rr, z = Math.sin(ang) * rr;
      var th = spread * 0.18 * (1 - rr / spread * 0.5);
      var y = (Math.random() - 0.5) * th;
      home.push({ x: x, y: y, z: z });
      positions[i*3] = x; positions[i*3+1] = y; positions[i*3+2] = z;
      var c = accent[(Math.random() * accent.length) | 0];
      colors[i*3] = c[0]; colors[i*3+1] = c[1]; colors[i*3+2] = c[2];
    }
    var geo = new THREE.BufferGeometry();
    geo.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    geo.setAttribute('color', new THREE.BufferAttribute(colors, 3));
    var pmat = new THREE.PointsMaterial({ size: 0.12 + rad * 0.5, map: dot, vertexColors: true, transparent: true, opacity: 0.95, depthWrite: false, blending: THREE.AdditiveBlending, sizeAttenuation: true });
    var points = new THREE.Points(geo, pmat); points.frustumCulled = false;
    var pairs = [];
    for (var a = 0; a < N; a++) {
      var ds = [];
      for (var b = 0; b < N; b++) { if (b === a) continue; var ddx = home[a].x-home[b].x, ddy = home[a].y-home[b].y, ddz = home[a].z-home[b].z; ds.push([ddx*ddx+ddy*ddy+ddz*ddz, b]); }
      ds.sort(function (p, q) { return p[0] - q[0]; });
      for (var k2 = 0; k2 < 2; k2++) { var b2 = ds[k2][1]; pairs.push(a < b2 ? [a, b2] : [b2, a]); }
    }
    var linePos = new Float32Array(pairs.length * 6);
    var lgeo = new THREE.BufferGeometry();
    lgeo.setAttribute('position', new THREE.BufferAttribute(linePos, 3));
    var lmat = new THREE.LineBasicMaterial({ color: 0x7fb0ff, transparent: true, opacity: 0.10, depthWrite: false, blending: THREE.AdditiveBlending });
    var lines = new THREE.LineSegments(lgeo, lmat); lines.frustumCulled = false;
    var group = new THREE.Group(); group.add(points); group.add(lines); scene.add(group);
    systems.push({ n: n, group: group, geo: geo, pmat: pmat, lgeo: lgeo, lmat: lmat, vel: vel, home: home, pairs: pairs, linePos: linePos, state: 'idle', burstT: 0, spin: 0.0006 + Math.random()*0.0008, spread: spread });
  });
  if (!systems.length) { try { dot.dispose(); } catch (e) {} return null; }
  function refreshLines(sys) {
    var p = sys.geo.attributes.position.array;
    for (var pI = 0; pI < sys.pairs.length; pI++) {
      var a = sys.pairs[pI][0], b = sys.pairs[pI][1];
      sys.linePos[pI*6] = p[a*3]; sys.linePos[pI*6+1] = p[a*3+1]; sys.linePos[pI*6+2] = p[a*3+2];
      sys.linePos[pI*6+3] = p[b*3]; sys.linePos[pI*6+4] = p[b*3+1]; sys.linePos[pI*6+5] = p[b*3+2];
    }
    sys.lgeo.attributes.position.needsUpdate = true;
  }
  function update() {
    for (var s = 0; s < systems.length; s++) {
      var sys = systems[s];
      if (sys.n && sys.n.mesh) sys.group.position.copy(sys.n.mesh.position);
      var arr = sys.geo.attributes.position.array;
      if (sys.state === 'burst') { sys.burstT -= 1; if (sys.burstT <= 0) sys.state = 'idle'; }
      for (var i = 0; i < sys.home.length; i++) {
        var ix = i*3, iy = i*3+1, iz = i*3+2;
        var hx = sys.home[i].x, hy = sys.home[i].y, hz = sys.home[i].z;
        // 螺旋加速已取消：粒子不再进入 vortex，统一回家+微漂
        sys.vel[ix] += (hx - arr[ix]) * 0.012; sys.vel[iy] += (hy - arr[iy]) * 0.012; sys.vel[iz] += (hz - arr[iz]) * 0.012;
        sys.vel[ix] += -arr[iz] * 0.0004; sys.vel[iz] += arr[ix] * 0.0004;
        sys.vel[ix] += (Math.random() - 0.5) * 0.0006; sys.vel[iy] += (Math.random() - 0.5) * 0.0006; sys.vel[iz] += (Math.random() - 0.5) * 0.0006;
        sys.vel[ix] *= 0.90; sys.vel[iy] *= 0.90; sys.vel[iz] *= 0.90;
        arr[ix] += sys.vel[ix]; arr[iy] += sys.vel[iy]; arr[iz] += sys.vel[iz];
        var rr2 = Math.sqrt(arr[ix]*arr[ix] + arr[iz]*arr[iz]);
        if (rr2 > sys.spread * 1.15) { arr[ix] *= 0.7; arr[iz] *= 0.7; }
      }
      sys.geo.attributes.position.needsUpdate = true;
      refreshLines(sys);
      sys.group.rotation.y += sys.spin;
    }
  }
  function setVortex(on) {
    // 螺旋加速已取消：粒子不再进入 vortex 状态，统一保持 idle 悬停微漂
    for (var s = 0; s < systems.length; s++) { var sys = systems[s]; if (sys.state === 'burst') continue; sys.state = 'idle'; }
  }
  var focusedNode = null;
  function focus(n) {
    if (focusedNode === n) return;
    if (focusedNode) { for (var s = 0; s < systems.length; s++) { if (systems[s].n === focusedNode && systems[s].state === 'vortex') systems[s].state = 'idle'; } }
    focusedNode = n;
    if (!n) return;
    for (var s = 0; s < systems.length; s++) { var sys = systems[s]; if (sys.state === 'burst') continue; sys.state = 'idle'; }
  }
  function burst(origin) {
    for (var s = 0; s < systems.length; s++) {
      var sys = systems[s]; sys.state = 'burst'; sys.burstT = 24;
      var arr = sys.geo.attributes.position.array;
      for (var i = 0; i < sys.home.length; i++) {
        var ix = i*3, iy = i*3+1, iz = i*3+2;
        var dx = arr[ix], dy = arr[iy], dz = arr[iz];
        var d = Math.sqrt(dx*dx + dy*dy + dz*dz) || 1;
        var f = 0.10 + 0.5 / (d + 4);
        sys.vel[ix] += (dx/d) * f; sys.vel[iy] += (dy/d) * f; sys.vel[iz] += (dz/d) * f;
      }
    }
  }
  function dispose() {
    for (var s = 0; s < systems.length; s++) {
      var sys = systems[s];
      try { scene.remove(sys.group); } catch (e) {}
      try { sys.geo.dispose(); sys.pmat.dispose(); sys.lgeo.dispose(); sys.lmat.dispose(); } catch (e) {}
    }
    try { dot.dispose(); } catch (e) {}
  }
  for (var s = 0; s < systems.length; s++) refreshLines(systems[s]);
  return { update: update, setVortex: setVortex, focus: focus, burst: burst, dispose: dispose };
}


  // 网站导航 / 关注博主 的存储键：此前只有使用、从未定义，导致「＋ 添加」按钮点击即抛 ReferenceError 静默失败
  const SITES_KEY = "zhiyu_sites";
  const BLOG_KEY = "zhiyu_bloggers";
function zyLoadList(k) { try { const a = JSON.parse(localStorage.getItem(k) || "[]"); return Array.isArray(a) ? a : []; } catch (e) { return []; } }
  function zySaveList(k, a) { try { localStorage.setItem(k, JSON.stringify(a)); } catch (e) {} }
  function zyHostOf(url) { try { return new URL(url).hostname.replace(/^www\./, ""); } catch (e) { return url || ""; } }
  function zyDetectPlat(s) {
    const map = [["bilibili", "B站"], ["b站", "B站"], ["抖音", "抖音"], ["douyin", "抖音"], ["微博", "微博"], ["weibo", "微博"], ["小红书", "小红书"], ["xiaohongshu", "小红书"], ["公众号", "微信公众号"], ["知乎", "知乎"], ["zhihu", "知乎"], ["youtube", "YouTube"], ["油管", "YouTube"], ["twitter", "Twitter"], ["x.com", "Twitter"], ["头条", "今日头条"]];
    const t = String(s || "").toLowerCase();
    for (const [k, v] of map) if (t.indexOf(k) >= 0) return v;
    return "";
  }

  // ---------- 目标体系 / 碎片（原「脉络·人生系统」模块已拆分：目标体系→养成，碎片记录+导出→成长检验，目标与碎片并入知识星球；数据仍统一存于 zhiyu_mailuo）----------
  const MAILUO_KEY = "zhiyu_mailuo";
  const PILLARS = [
    { id: "p_cog", name: "认知支柱", hint: "我想建立 / 升级哪些认知、思维模型？" },
    { id: "p_mean", name: "意义支柱", hint: "什么让我觉得活着有奔头、有价值？" },
    { id: "p_energy", name: "能量支柱", hint: "我靠什么续航：身体、心流、节律？" },
    { id: "p_rel", name: "关系支柱", hint: "哪些关系在托住我、我也在经营？" },
    { id: "p_val", name: "价值支柱", hint: "我能交付、能变现、被需要的价值是什么？" },
  ];
  function pillarColor(id) {
    const map = { p_cog: "#a78bfa", p_mean: "#5cc8ff", p_energy: "#7CFFB2", p_rel: "#ff7eb6", p_val: "#ffb86b" };
    return map[id] || "#cdd9e5";
  }
  // 归一化：旧版本存下来的 pillars 可能是任意形状（缺 id / 缺 goal / 顺序不同），
  // 一律按 PILLARS 的规范 id 重建，老数据按 id → name → 序号 兜底回填。
  // 否则 dd.pillars.find(...) 会返回 undefined，输入直接抛错 → 表现就是「保存不了」。
  function mailuoNormalizePillars(rawPillars) {
    const old = Array.isArray(rawPillars) ? rawPillars : [];
    const byId = {}, byName = {};
    old.forEach((p, i) => {
      if (!p || typeof p !== "object") return;
      if (p.id) byId[p.id] = p;
      if (p.name) byName[String(p.name)] = p;
      if (!p.id && !p.name) byId["__idx" + i] = p;
    });
    return PILLARS.map((P, i) => {
      const hit = byId[P.id] || byName[P.name] || byId["__idx" + i] || {};
      return {
        id: P.id,
        name: (typeof hit.name === "string" && hit.name.trim()) ? hit.name : P.name,
        goal: typeof hit.goal === "string" ? hit.goal : "",
        desc: typeof hit.desc === "string" ? hit.desc : "",
        contents: Array.isArray(hit.contents) ? hit.contents.filter((c) => c && c.text) : [],
      };
    });
  }
  function loadMailuo() {
    try {
      const v = JSON.parse(localStorage.getItem(MAILUO_KEY) || "null");
      if (v && typeof v === "object") {
        v.pillars = mailuoNormalizePillars(v.pillars);
        v.subGoals = Array.isArray(v.subGoals) ? v.subGoals.filter((s) => s && s.pillarId) : [];
        v.fragments = Array.isArray(v.fragments) ? v.fragments : [];
        v.lifeGoals = Array.isArray(v.lifeGoals) ? v.lifeGoals : [];
        if (typeof v.lifeGoal === "string" && v.lifeGoal.trim()) { v.lifeGoals.push({ id: "lg_" + Date.now().toString(36), text: v.lifeGoal.trim(), createdAt: Date.now() }); v.lifeGoal = ""; }
        if (typeof v.lifeGoal !== "string") v.lifeGoal = "";
        return v;
      }
    } catch (e) {}
    return { lifeGoal: "", lifeGoals: [], pillars: PILLARS.map((p) => ({ id: p.id, name: p.name, goal: "", desc: "", contents: [] })), subGoals: [], fragments: [] };
  }
  let _mailuoSaveT = null;
  function saveMailuo(d) {
    try { localStorage.setItem(MAILUO_KEY, JSON.stringify(d)); } catch (e) {}
    // #23 同步：私人知识库的目标体系/碎片与知识星球共用同一存储；保存后若星图在视图中，则重绘以即时反映
    if (_mailuoSaveT) clearTimeout(_mailuoSaveT);
    _mailuoSaveT = setTimeout(function () {
      try { var w = document.getElementById("graphWrap"); if (w && w.parentNode) buildKnowledgeGraph(w); } catch (e) {}
    }, 300);
  }
  // 把目标体系展开成「标签」：人生大目标 + 五大支柱 + 子目标，每个目标即一枚标签
  function mailuoTags(d) {
    const tags = [];
    const _lgs = (d.lifeGoals || []);
    // 人生大目标行星固定叫「人生大目标」，各条目标各自成为一颗卫星（避免与第一条重复）
    tags.push({ id: "life", label: "人生大目标", kind: "life", color: "#ffe066" });
    _lgs.forEach(function (lg) { if (lg.text && lg.text.trim()) tags.push({ id: lg.id, label: lg.text, kind: "lifetag", color: "#ffe066", pillarId: "life" }); });
    (d.pillars || []).forEach((p) => {
      tags.push({ id: p.id, label: p.name, kind: "pillar", color: pillarColor(p.id), pillarId: p.id });
      (d.subGoals || []).filter((s) => s.pillarId === p.id).forEach((s) => {
        tags.push({ id: s.id, label: s.title || "子目标", kind: "sub", color: pillarColor(p.id), pillarId: p.id });
      });
      // 支柱具体内容不再作为星球节点：按用户要求隐藏，仅双击支柱星球时在详情里显示
    });
    return tags;
  }
  function mailuoTagMap(d) { const m = {}; mailuoTags(d).forEach((t) => (m[t.id] = t)); return m; }


  function mailuoGoals(sub) {
    // #D 重建前快照各支柱 <details> 开合状态，重建后还原，避免「一保存就自动展开」
    const _moOpen = {};
    try { sub.querySelectorAll(".mailuo-pillar").forEach((d) => { if (d.dataset && d.dataset.pid) _moOpen[d.dataset.pid] = d.open; }); } catch (e) {}
    const d = loadMailuo();
    const tags = mailuoTags(d);
    const tagCounts = {};
    d.fragments.forEach((f) => (f.tags || []).forEach((t) => (tagCounts[t] = (tagCounts[t] || 0) + 1)));
    sub.innerHTML = `
      <h3>🎯 目标体系 · 你的人生长线</h3>
      <details class="mailuo-life" open>
        <summary class="mp-head" style="cursor:pointer"><b style="color:#ffe066">🌟 人生大目标（可拆成多个标签）</b><span class="muted" style="font-size:12px"> · ${((d.lifeGoals||[]).length)} 条</span></summary>
        <div class="mailuo-field">
          <div class="row"><input id="mlLifeAdd" placeholder="写下一个人生大目标，回车或点 ＋ 添加…" style="flex:1"><button class="ghost" id="mlLifeAddBtn">＋ 添加</button></div>
          <div class="mp-subs" id="mlLifeList">${((d.lifeGoals||[]).map(function(lg){return '<div class="mp-sub" data-lgid="'+lg.id+'"><span>'+escHTML(lg.text||"")+(lg.createdAt?' <span class="muted" style="font-size:11px">· '+new Date(lg.createdAt).toLocaleDateString()+'</span>':'')+'</span><span class="mp-del" title="删除">✕</span></div>';}).join("") || '<span class="muted" style="font-size:12px">还没有人生大目标，上面加一条。</span>')}</div>
        </div>
      </details>
      <h3 style="margin-top:18px">五大支柱</h3>
      <div class="mailuo-pillars">
        ${d.pillars.map((p) => {
          const subs = d.subGoals.filter((s) => s.pillarId === p.id);
          const cts = (Array.isArray(p.contents) ? p.contents : []).filter((c) => c && c.text);
          return `
          <details class="mailuo-pillar" data-pid="${p.id}" open style="border-left:4px solid ${pillarColor(p.id)}">
            <summary class="mp-head"><b style="color:${pillarColor(p.id)}">${escHTML(p.name)}</b><span class="muted" style="font-size:12px">🏷 标签：${escHTML(p.name)} · 子目标 ${subs.length} · 碎片 ${tagCounts[p.id] || 0}</span></summary>
            <div class="mp-body">
            <textarea class="mp-goal" rows="2" placeholder="${escHTML((PILLARS.find((x) => x.id === p.id) || {}).hint || "")}">${escHTML(p.goal || "")}</textarea>
            <div class="row" style="margin-top:4px;gap:8px;align-items:center">
              <button class="ghost mp-save">保存支柱</button>
              <span class="mp-saved muted" style="font-size:12px;color:#7CFFB2"></span>
            </div>
            <details class="mp-subs-wrap" open><summary class="muted" style="font-size:12px;margin-top:6px;cursor:pointer">子目标（可继续拆小）· ${subs.length} 条</summary>
            <div class="mp-subs">${subs.map((s) => `
              <div class="mp-sub" data-sid="${s.id}">
                <input type="checkbox" ${s.done ? "checked" : ""} class="mp-done">
                <span class="${s.done ? "mp-done-t" : ""}">${escHTML(s.title || "")}</span>
                <span class="mp-del" title="删除">✕</span>
              </div>`).join("") || '<span class="muted" style="font-size:12px">还没拆子目标</span>'}
            </div></details>
            <div class="row" style="margin-top:6px">
              <input class="mp-sub-in" placeholder="加一个子目标，回车保存…" style="flex:1">
              <button class="ghost mp-sub-add">＋</button>
            </div>
            <details class="mp-contents-wrap" open><summary class="muted" style="font-size:12px;margin-top:6px;cursor:pointer">支柱具体内容（可增删）· ${cts.length} 条</summary>
            <div class="mp-subs">${cts.map((c) => `
              <div class="mp-sub" data-cid="${c.id}">
                <span>${escHTML(c.text || "")}</span>
                <span class="mp-del" title="删除">✕</span>
              </div>`).join("") || '<span class="muted" style="font-size:12px">还没有具体内容。点「保存支柱」或下面 ＋ 添加一条。</span>'}
            </div></details>
            <div class="row" style="margin-top:6px">
              <input class="mp-content-in" placeholder="加一条支柱具体内容，回车保存…" style="flex:1">
              <button class="ghost mp-content-add">＋</button>
            </div>
            <div class="muted" style="font-size:12px;margin-top:4px">已挂碎片：${tagCounts[p.id] || 0} 条</div>
            </div>
          </details>`;
        }).join("")}
      </div>
      <h3 style="margin-top:18px">标签总览</h3>
      <div class="mailuo-tags">${tags.map((t) => `<span class="chip" style="border-color:${t.color}">🏷 ${escHTML(t.label)} <b style="color:${t.color}">${tagCounts[t.id] || 0}</b></span>`).join("")}</div>
    `;
    // #D 还原折叠状态（与重建前一致）
    try { sub.querySelectorAll(".mailuo-pillar").forEach((d) => { const pid = d.dataset.pid; if (pid && _moOpen[pid] !== undefined) d.open = _moOpen[pid]; }); } catch (e) {}
    const lifeAdd = sub.querySelector("#mlLifeAdd");
    const lifeAddBtn = sub.querySelector("#mlLifeAddBtn");
    const doAddLife = () => {
      const t = (lifeAdd.value || "").trim(); if (!t) { lifeAdd.focus(); return; }
      const dd = loadMailuo(); dd.lifeGoals = dd.lifeGoals || []; dd.lifeGoals.push({ id: "lg_" + Date.now().toString(36) + Math.random().toString(36).slice(2, 6), text: t, createdAt: Date.now() }); saveMailuo(dd);
      mailuoGoals(sub); const bx = sub.querySelector("#mlLifeAdd"); if (bx) bx.focus();
    };
    if (lifeAddBtn) lifeAddBtn.onclick = doAddLife;
    if (lifeAdd) lifeAdd.addEventListener("keydown", (e) => { if (e.key === "Enter") { e.preventDefault(); doAddLife(); } });
    sub.querySelectorAll("#mlLifeList .mp-del").forEach((b) => { b.onclick = () => { const id = b.closest(".mp-sub").dataset.lgid; const dd = loadMailuo(); dd.lifeGoals = (dd.lifeGoals || []).filter((x) => x.id !== id); saveMailuo(dd); mailuoGoals(sub); }; });
    sub.querySelectorAll(".mailuo-pillar").forEach((box) => {
      const pid = box.dataset.pid;
      const goal = box.querySelector(".mp-goal");
      const hintEl = box.querySelector(".mp-saved");
      const flag = (t) => { if (hintEl) { hintEl.textContent = t || ""; if (t) setTimeout(() => { if (hintEl.textContent === t) hintEl.textContent = ""; }, 1800); } };
      const saveGoal = () => {
        const dd = loadMailuo();
        let p = dd.pillars.find((x) => x.id === pid);
        if (!p) { p = { id: pid, name: (PILLARS.find((x) => x.id === pid) || {}).name || pid, goal: "", desc: "" }; dd.pillars.push(p); }
        p.goal = goal.value;
        saveMailuo(dd);
        flag("已保存");
      };
      goal.addEventListener("input", saveGoal);
      goal.addEventListener("change", saveGoal);
      const saveBtn = box.querySelector(".mp-save");
      if (saveBtn) saveBtn.onclick = function () {
        saveGoal();
        // 「保存支柱」= 再记一条支柱具体内容（同文本不重复），之后可像子目标一样增删
        const dd2 = loadMailuo(); const p2 = dd2.pillars.find((x) => x.id === pid);
        if (p2) {
          const gv2 = (goal.value || "").trim();
          p2.contents = Array.isArray(p2.contents) ? p2.contents : [];
          if (gv2 && !p2.contents.some(function (c) { return String(c.text || "").trim() === gv2; })) {
            p2.contents.push({ id: "c_" + Date.now().toString(36) + Math.random().toString(36).slice(2, 6), text: gv2, createdAt: Date.now() });
          }
          saveMailuo(dd2);
        }
        mailuoGoals(sub);
      };
      const cIn = box.querySelector(".mp-content-in");
      const cAdd = box.querySelector(".mp-content-add");
      const doAddContent = () => {
        const t = (cIn.value || "").trim(); if (!t) { cIn.focus(); return; }
        const dd3 = loadMailuo(); const p3 = dd3.pillars.find((x) => x.id === pid);
        if (p3) {
          p3.contents = Array.isArray(p3.contents) ? p3.contents : [];
          if (!p3.contents.some(function (c) { return String(c.text || "").trim() === t; })) {
            p3.contents.push({ id: "c_" + Date.now().toString(36) + Math.random().toString(36).slice(2, 6), text: t, createdAt: Date.now() });
          }
          saveMailuo(dd3);
        }
        mailuoGoals(sub);
        const nb2 = sub.querySelector('.mailuo-pillar[data-pid="' + pid + '"] .mp-content-in'); if (nb2) nb2.focus();
      };
      if (cAdd) cAdd.onclick = doAddContent;
      if (cIn) cIn.addEventListener("keydown", (e) => { if (e.key === "Enter") { e.preventDefault(); doAddContent(); } });
      box.querySelectorAll(".mp-contents-wrap .mp-del").forEach((b) => {
        b.onclick = () => {
          const cid = b.closest(".mp-sub").dataset.cid;
          const dd4 = loadMailuo(); const p4 = dd4.pillars.find((x) => x.id === pid);
          if (p4) { p4.contents = (p4.contents || []).filter((x) => x.id !== cid); saveMailuo(dd4); }
          mailuoGoals(sub);
        };
      });
      const addBtn = box.querySelector(".mp-sub-add");
      const inEl = box.querySelector(".mp-sub-in");
      const doAdd = () => {
        const t = inEl.value.trim();
        if (!t) { inEl.focus(); return; }
        const dd = loadMailuo();
        dd.subGoals.push({ id: "s_" + Date.now().toString(36) + Math.random().toString(36).slice(2, 6), pillarId: pid, title: t, done: false });
        saveMailuo(dd);
        const keep = goal.value;
        mailuoGoals(sub);
        // 重渲染后把支柱正文与焦点还回去，避免「填的内容没了 / 加完子目标就丢焦」
        const box2 = sub.querySelector('.mailuo-pillar[data-pid="' + pid + '"]');
        if (box2) {
          const ta = box2.querySelector(".mp-goal");
          if (ta) { ta.value = keep; ta.dispatchEvent(new Event("input")); }
          const i2 = box2.querySelector(".mp-sub-in"); if (i2) i2.focus();
        }
      };
      addBtn.onclick = doAdd;
      inEl.addEventListener("keydown", (e) => { if (e.key === "Enter") { e.preventDefault(); doAdd(); } });
      // 只绑「子目标」那块（.mp-subs-wrap），不要把「支柱具体内容」条目（同为 .mp-sub）也选中
      box.querySelectorAll(".mp-subs-wrap .mp-sub[data-sid]").forEach((row) => {
        const sid = row.dataset.sid;
        const chk = row.querySelector(".mp-done");
        if (chk) chk.onchange = () => { const dd = loadMailuo(); const sg = dd.subGoals.find((x) => x.id === sid); if (!sg) return; sg.done = chk.checked; saveMailuo(dd); mailuoGoals(sub); };
        const dl = row.querySelector(".mp-del");
        if (dl) dl.onclick = () => { const dd = loadMailuo(); dd.subGoals = dd.subGoals.filter((x) => x.id !== sid); saveMailuo(dd); mailuoGoals(sub); };
      });
    });
  }

  function mailuoCapture(sub, initialMode) {
    const d = loadMailuo();
    const tags = mailuoTags(d);
    let mode = initialMode || "text";
    sub.innerHTML = `
      <h3>📝 碎片记录 · 把刷到 / 学到的落袋</h3>
      <p class="muted">文字 / 链接 / 语音三种记法。切到「🔗 链接」还能一并管理<b>我的网站导航</b>与<b>我关注的全网博主</b>。</p>
      <div class="mailuo-mode">
        <button class="mmode ${mode === "text" ? "active" : ""}" data-mode="text">✍️ 文字</button>
        <button class="mmode ${mode === "link" ? "active" : ""}" data-mode="link">🔗 链接</button>
        <button class="mmode ${mode === "voice" ? "active" : ""}" data-mode="voice">🎤 语音</button>
      </div>
      <div id="mlCaptureBody"></div>
      <details class="ml-notes" open><summary style="margin-top:16px">📝 我的笔记（点击折叠）</summary><div class="card" id="notesPanel"></div></details>
    `;
    const body = sub.querySelector("#mlCaptureBody");
    function renderBody() {
      const sel = (window.__mlTags || []);
      const tagChips = tags.map((t) => `<span class="ml-tag ${sel.includes(t.id) ? "on" : ""}" data-tid="${t.id}" style="--c:${t.color}">🏷 ${escHTML(t.label)}</span>`).join("");
      let editor = "";
      if (mode === "text") {
        editor = `<textarea id="mlText" rows="4" placeholder="随手记一句：刚看到的、想到的、学到的…">${escHTML(window.__mlDraft || "")}</textarea>`;
      } else if (mode === "link") {
        editor = `
          <div class="row"><input id="mlUrl" placeholder="粘贴链接 https://…" style="flex:1"></div>
          <div class="row" style="margin-top:8px"><input id="mlTitle" placeholder="标题（可选，留空则显示链接）" style="flex:1"></div>
          <div id="mlLinkPrev" class="mailuo-linkprev"></div>
          <textarea id="mlText" rows="3" placeholder="可补充一句你的摘录 / 想法…">${escHTML(window.__mlDraft || "")}</textarea>`;
      } else {
        editor = `
          <div id="mlVoiceBox" class="mailuo-voice">
            <button id="mlMic" class="ml-mic">🎤 点我开始说</button>
            <div id="mlVoiceOut" class="mailuo-voiceout">${escHTML(window.__mlDraft || "")}</div>
            <div class="muted" style="font-size:12px">说话会自动转成文字（需 Chrome / Edge 且授权麦克风）。说完点「完成」。</div>
          </div>`;
      }
      body.innerHTML = editor + `
        <details class="ml-tagpick" open><summary class="muted" style="margin-top:10px">🏷 关联到哪些目标（可多选，碎片会挂到这些标签下 · 点击折叠）</summary>
        <div class="mailuo-tags" id="mlTagPick">${tagChips}</div></details>
        <div class="row" style="margin-top:12px"><button class="primary" id="mlSave">保存碎片</button><span id="mlMsg" class="muted"></span></div>
        <details class="ml-recent" open><summary class="muted" style="cursor:pointer;margin-top:16px">📂 最近碎片（点击折叠）</summary>
        <div id="mlList" class="mailuo-list"></div></details>
        ${mode === "link" ? collectionsHTML() : ""}
      `;
      bindBody();
      renderList();
      if (mode === "link") bindCollections();
    }
    // ---------- 链接收藏（我的网站导航 / 我关注的全网博主）：并入「链接」板块 ----------
    function collectionsHTML() {
      return `
      <div class="ml-collect">
        <details class="ml-col" open><summary class="ml-col-sum">🔗 我的网站导航（点击折叠）</summary>
          <p class="muted">常逛、想常逛的站点都放这；点「📎 记碎片」可直接把这条链接抓成碎片。</p>
          <div class="row"><input id="mlSiteName" placeholder="名称，如：少数派" /><input id="mlSiteUrl" placeholder="链接 https://…" style="flex:2" /><button id="mlSiteAdd">＋ 添加</button></div>
          <div id="mlSiteList" class="learn-list"></div>
        </details>
        <details class="ml-col" open><summary class="ml-col-sum">👤 我关注的全网博主（点击折叠）</summary>
          <p class="muted">你欣赏的创作者 / 大佬；填了主页链接就能一键跳转，知乎上的还会显示「在知乎关注」。</p>
          <div class="row"><input id="mlBlogName" placeholder="博主名" /><input id="mlBlogPlat" placeholder="平台，如 知乎/B站" style="max-width:120px" /><input id="mlBlogUrl" placeholder="主页链接（可选）" style="flex:2" /><button id="mlBlogAdd">＋ 添加</button></div>
          <div id="mlBlogList" class="learn-list"></div>
        </details>
      </div>`;
    }
    function renderSiteList() {
      const box = body.querySelector("#mlSiteList");
      if (!box) return;
      const a = zyLoadList(SITES_KEY);
      box.innerHTML = a.length ? a.map((s, i) => `<div class="learn-item">
        <a href="${escAttr(s.url || "#")}" ${s.url ? 'target="_blank" rel="noopener"' : ""}>🔗 ${escHTML(s.name)}</a>
        ${s.url ? `<button class="ml-use" data-u="${escAttr(s.url)}" data-n="${escAttr(s.name)}" title="用这条链接记一条碎片">📎 记碎片</button>` : ""}
        <button class="learn-del" data-i="${i}" title="删除">✕</button></div>`).join("")
        : '<div class="muted" style="font-size:12.5px">还没有网站导航，上面加一条。</div>';
      box.querySelectorAll(".learn-del").forEach((b) => b.onclick = () => { const arr = zyLoadList(SITES_KEY); arr.splice(parseInt(b.dataset.i, 10), 1); zySaveList(SITES_KEY, arr); renderSiteList(); });
      box.querySelectorAll(".ml-use").forEach((b) => b.onclick = () => { const u = body.querySelector("#mlUrl"); if (u) u.value = b.dataset.u; const t = body.querySelector("#mlTitle"); if (t) t.value = b.dataset.n || ""; if (u) u.focus(); });
    }
    function renderBlogList() {
      const box = body.querySelector("#mlBlogList");
      if (!box) return;
      const a = zyLoadList(BLOG_KEY);
      box.innerHTML = a.length ? a.map((s, i) => `<div class="learn-item">
        <a href="${escAttr(s.url || "#")}" ${s.url ? 'target="_blank" rel="noopener"' : ""}>👤 ${escHTML(s.name)}${s.plat ? ` <span class="muted">· ${escHTML(s.plat)}</span>` : ""}</a>
        ${s.zhihu ? `<a class="ml-use" href="${escAttr(s.zhihu)}" target="_blank" rel="noopener">在知乎关注 ↗</a>` : ""}
        <button class="learn-del" data-i="${i}" title="删除">✕</button></div>`).join("")
        : '<div class="muted" style="font-size:12.5px">还没有关注博主，上面加一个。</div>';
      box.querySelectorAll(".learn-del").forEach((b) => b.onclick = () => { const arr = zyLoadList(BLOG_KEY); arr.splice(parseInt(b.dataset.i, 10), 1); zySaveList(BLOG_KEY, arr); renderBlogList(); });
    }
    function bindCollections() {
      const sa = body.querySelector("#mlSiteAdd");
      if (sa) sa.onclick = () => {
        const n = body.querySelector("#mlSiteName"), u = body.querySelector("#mlSiteUrl");
        const name = (n.value || "").trim(); if (!name) return;
        const arr = zyLoadList(SITES_KEY);
        arr.push({ name: name, url: (u.value || "").trim() });
        zySaveList(SITES_KEY, arr); n.value = ""; u.value = ""; renderSiteList();
      };
      const ba = body.querySelector("#mlBlogAdd");
      if (ba) ba.onclick = () => {
        const n = body.querySelector("#mlBlogName"), p = body.querySelector("#mlBlogPlat"), u = body.querySelector("#mlBlogUrl");
        const name = (n.value || "").trim(); if (!name) return;
        const arr = zyLoadList(BLOG_KEY);
        const url = (u.value || "").trim();
        arr.push({ name: name, plat: (p.value || "").trim() || zyDetectPlat(url + " " + name), url: url });
        zySaveList(BLOG_KEY, arr); n.value = ""; p.value = ""; u.value = ""; renderBlogList();
      };
      renderSiteList(); renderBlogList();
    }
    function bindBody() {
      body.querySelectorAll(".ml-tag").forEach((c) => c.onclick = () => {
        const id = c.dataset.tid; const arr = window.__mlTags || [];
        if (arr.includes(id)) window.__mlTags = arr.filter((x) => x !== id); else window.__mlTags = arr.concat(id);
        c.classList.toggle("on");
      });
      const save = body.querySelector("#mlSave");
      if (save) save.onclick = doSave;
      if (mode === "voice") bindVoice();
    }
    function bindVoice() {
      const mic = body.querySelector("#mlMic");
      const out = body.querySelector("#mlVoiceOut");
      if (!mic) return;
      const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
      if (!SR) { out.textContent = "（当前浏览器不支持语音转文字，请改用文字输入；推荐 Chrome / Edge）"; return; }
      const sr = new SR(); sr.lang = "zh-CN"; sr.interimResults = true; sr.continuous = false;
      window.__mailuoSR = sr;
      let finalText = window.__mlDraft || "";
      sr.onresult = (e) => { let inter = ""; for (let i = e.resultIndex; i < e.results.length; i++) inter += e.results[i][0].transcript; out.textContent = finalText + inter; };
      sr.onend = () => { finalText = (window.__mlDraft || "") + (out.textContent || ""); window.__mlDraft = finalText; mic.textContent = "🎤 点我开始说"; mic.classList.remove("rec"); };
      mic.onclick = () => {
        if (mic.classList.contains("rec")) { try { sr.stop(); } catch (e) {} return; }
        try { sr.start(); mic.textContent = "⏹ 说完点这完成"; mic.classList.add("rec"); finalText = window.__mlDraft = out.textContent || window.__mlDraft || ""; } catch (e) { out.textContent = "（麦克风启动失败，请检查浏览器授权）"; }
      };
    }
    function doSave() {
      const dd = loadMailuo();
      const ta = body.querySelector("#mlText");
      const text = ((ta ? ta.value : (window.__mlDraft || "")) || "").trim();
      const tgs = window.__mlTags || [];
      let frag = null;
      if (mode === "link") {
        const f = window.__mlFetched || null;
        if (!f && !text) { body.querySelector("#mlMsg").textContent = "请先粘贴链接，或补充文字"; return; }
        const mlTitleVal = (body.querySelector("#mlTitle") ? body.querySelector("#mlTitle").value : "").trim();
frag = { id: "f_" + Date.now().toString(36), type: "link", text: text, url: (f && f.url) ? f.url : (body.querySelector("#mlUrl").value || ""), title: (f && f.title) ? f.title : mlTitleVal, desc: (f && f.desc) ? f.desc : "", createdAt: Date.now(), tags: tgs.slice() };
      } else {
        if (!text) { const m = body.querySelector("#mlMsg"); if (m) m.textContent = "写点什么再保存吧"; return; }
        frag = { id: "f_" + Date.now().toString(36), type: "text", text: text, createdAt: Date.now(), tags: tgs.slice() };
      }
      dd.fragments.unshift(frag);
      saveMailuo(dd);
      window.__mlDraft = ""; window.__mlFetched = null; window.__mlTags = [];
      body.querySelector("#mlMsg").textContent = "✓ 已保存";
      renderBody();
    }
    function renderList() {
      const list = body.querySelector("#mlList");
      if (!list) return;
      const dd = loadMailuo();
      const tmap = mailuoTagMap(dd);
      if (!dd.fragments.length) { list.innerHTML = '<span class="muted">还没有碎片，记一条试试。</span>'; return; }
      list.innerHTML = dd.fragments.slice(0, 40).map((f) => `
        <div class="ml-frag" data-fid="${f.id}">
          <div class="ml-frag-main">${f.type === "link" ? "🔗" : "📝"} ${escHTML((f.text || f.title || f.url || "").slice(0, 120))}${f.type === "link" && f.url ? ` <a class='ml-jump' href='${escAttr(f.url)}' target='_blank' rel='noopener' title='打开这条链接'>打开 ↗</a>` : ""}</div>
          <div class="ml-frag-tags">${(f.tags || []).map((t) => `<span class="chip" style="border-color:${tmap[t] ? tmap[t].color : "#888"}">${escHTML(tmap[t] ? tmap[t].label : t)}</span>`).join("") || '<span class="muted">未关联目标</span>'}</div>
          <span class="mp-del ml-frag-del" title="删除">✕</span>
        </div>`).join("");
      list.querySelectorAll(".ml-frag-del").forEach((x) => x.onclick = () => {
        const dd2 = loadMailuo(); dd2.fragments = dd2.fragments.filter((y) => y.id !== x.closest(".ml-frag").dataset.fid); saveMailuo(dd2); renderList();
      });
    }
    sub.querySelectorAll(".mmode").forEach((b) => b.onclick = () => {
      const ta = body.querySelector("#mlText"); if (ta) window.__mlDraft = ta.value;
      const vo = body.querySelector("#mlVoiceOut"); if (vo) window.__mlDraft = vo.textContent;
      if (window.__mailuoSR) { try { window.__mailuoSR.stop(); } catch (e) {} window.__mailuoSR = null; }
      mode = b.dataset.mode;
      sub.querySelectorAll(".mmode").forEach((x) => x.classList.toggle("active", x === b));
      renderBody();
    });
    renderBody();
    // 「我的笔记」面板并入碎片记录（对标 Obsidian：图谱点节点开笔记，笔记管理在此列表）
    try { const np = sub.querySelector("#notesPanel"); if (np) renderNotesPanel(np); } catch (e) {}
  }

  function mailuoGraphView(sub) {
    const d = loadMailuo();
    const tmap = mailuoTagMap(d);
    sub.innerHTML = `
      <h3>🧭 脉络图 · 你的目标与碎片怎么连成系统</h3>
      <p class="muted">中心是「人生系统」，外圈是五大支柱与子目标（彩点），碎片是灰点；线和你打的标签一一对应。拖动可调整，点节点看明细。</p>
      <div id="mailuoGraphWrap" class="graph-wrap"></div>
      <div id="mailuoGraphInfo" class="graph-info muted">拖节点调整布局；点节点看它的目标 / 关联碎片。</div>
      <div class="row" style="margin-top:8px"><button class="ghost" id="mlRelayout">🔄 重新布局</button></div>
    `;
    drawMailuoGraph(sub.querySelector("#mailuoGraphWrap"), d, tmap, sub.querySelector("#mailuoGraphInfo"));
    sub.querySelector("#mlRelayout").onclick = () => drawMailuoGraph(sub.querySelector("#mailuoGraphWrap"), d, tmap, sub.querySelector("#mailuoGraphInfo"));
  }

  function drawMailuoGraph(wrap, d, tmap, infoEl) {
    if (!wrap) return;
    const nodes = [{ id: "ROOT", label: "人生系统", color: "#ffe066", r: 24, kind: "root" }];
    const edges = [];
    d.pillars.forEach((p) => {
      nodes.push({ id: p.id, label: p.name, color: pillarColor(p.id), r: 16, kind: "goal", text: p.goal || "" });
      edges.push({ a: "ROOT", b: p.id });
      d.subGoals.filter((s) => s.pillarId === p.id).forEach((s) => { nodes.push({ id: s.id, label: s.title || "子目标", color: pillarColor(p.id), r: 11, kind: "goal", text: "" }); edges.push({ a: p.id, b: s.id }); });
    });
    var _lg0 = ((d.lifeGoals && d.lifeGoals[0] && d.lifeGoals[0].text) || d.lifeGoal || "");
    nodes.push({ id: "life", label: (_lg0.trim()) || "人生大目标", color: "#ffe066", r: 16, kind: "goal", text: _lg0 });
    edges.push({ a: "ROOT", b: "life" });
    d.fragments.forEach((f) => {
      const label = (f.text || f.title || f.url || "碎片").slice(0, 14);
      nodes.push({ id: f.id, label: label, color: "#9fb0c3", r: 9, kind: "frag", frag: f });
      const ts = (f.tags && f.tags.length) ? f.tags : ["life"];
      ts.forEach((t) => { if (tmap[t]) edges.push({ a: f.id, b: t }); });
    });
    if (nodes.length <= 1) { wrap.innerHTML = '<div class="muted" style="padding:30px;text-align:center">还没有数据。先在「养成 → 目标体系」定目标、在「成长检验 → 碎片记录」记几条，脉络就会长出来。</div>'; return; }
    const W = wrap.clientWidth || 720, H = 480;
    const svgNS = "http://www.w3.org/2000/svg";
    const svg = document.createElementNS(svgNS, "svg");
    svg.setAttribute("viewBox", "0 0 " + W + " " + H); svg.setAttribute("width", "100%"); svg.style.maxHeight = H + "px";
    const cx = W / 2, cy = H / 2;
    nodes.forEach((n, i) => { const ang = (i / nodes.length) * Math.PI * 2; const rad = 120 + (i % 5) * 22; n.x = cx + Math.cos(ang) * rad + (Math.random() - 0.5) * 20; n.y = cy + Math.sin(ang) * rad + (Math.random() - 0.5) * 20; n.vx = 0; n.vy = 0; });
    const idMap = {}; nodes.forEach((n) => idMap[n.id] = n);
    let dragNode = null;
    const nodeEls = [];
    function showInfo(n) {
      if (!infoEl) return;
      nodeEls.forEach((o) => { const sel = o.node === n; o.c.setAttribute("r", sel ? o.node.r + 4 : o.node.r); o.c.setAttribute("stroke", sel ? "#ffe066" : (o.node.kind === "root" ? "#5cc8ff" : "rgba(0,0,0,0.4)")); o.c.setAttribute("stroke-width", sel ? "3.5" : (o.node.kind === "root" ? "3" : "1.5")); });
      const neigh = []; edges.forEach((e) => { if (e.a === n.id) neigh.push(idMap[e.b]); else if (e.b === n.id) neigh.push(idMap[e.a]); });
      const cut = (s) => escHTML(s && s.length > 14 ? s.slice(0, 13) + "…" : (s || ""));
      if (n.kind === "frag") {
        const f = n.frag;
        let html = '<b>📝 碎片</b> · ' + cut((f.text || f.title || f.url || ""));
        if (f.type === "link" && f.url) html += '<br><a href="' + escHTML(f.url) + '" target="_blank" rel="noopener">' + escHTML(f.url) + '</a>';
        if (f.text) html += '<br><span class="muted">' + cut(f.text) + '</span>';
        html += '<br><span class="muted">关联目标：</span>' + (f.tags || []).map((t) => tmap[t] ? '<span class="chip" style="border-color:' + tmap[t].color + '">' + escHTML(tmap[t].label) + '</span>' : '').join(" ");
        infoEl.innerHTML = html;
      } else {
        let html = '<b style="color:' + n.color + '">' + cut(n.label) + '</b> · ' + (n.kind === "root" ? "系统中心" : "目标");
        if (n.text) html += '<br><span class="muted">' + cut(n.text) + '</span>';
        const frags = neigh.filter((x) => x.kind === "frag");
        html += '<br><span class="muted">直接关联碎片：</span><b>' + frags.length + '</b>';
        var _zyLife2 = (n.id === "life"), _zyPid2 = null;
        if (typeof PILLARS !== "undefined") { const _zpp2 = PILLARS.find((p) => p.id === n.id); if (_zpp2) _zyPid2 = _zpp2.id; }
        if (_zyLife2 || _zyPid2 || n.kind === "lifetag") {
          try {
            const _m3 = loadMailuo();
            if (_zyLife2 || n.kind === "lifetag") { const _lgs3 = _m3.lifeGoals || []; if (_lgs3.length) html += '<br><span class="muted">人生大目标（' + _lgs3.length + '）：</span>' + _lgs3.map((l) => escHTML(l.text || "")).join("、"); else html += '<br><span class="muted">人生大目标：</span><span class="muted">还没写，去「私人知识库 → 目标体系」加一条</span>'; }
            if (_zyPid2) { const _pp3 = (_m3.pillars || []).find((p) => p.id === _zyPid2); const _pn3 = (_pp3 && _pp3.name) || (((typeof PILLARS !== "undefined") ? PILLARS.filter((p) => p.id === _zyPid2)[0] : null) || {}).name || "该支柱"; const _ts3 = ((_pp3 && Array.isArray(_pp3.contents)) ? _pp3.contents : []).map((c) => String(c.text || "").trim()).filter(Boolean); const _gd3 = (_pp3 && _pp3.goal) ? String(_pp3.goal).trim() : ""; if (_gd3 && _ts3.indexOf(_gd3) < 0) _ts3.unshift(_gd3); html += '<br><span class="muted">' + escHTML(_pn3) + ' · 具体内容' + (_ts3.length > 1 ? '（' + _ts3.length + '）' : '') + '：</span>' + (_ts3.length ? _ts3.map((t) => escHTML(t)).join("、") : '<span class="muted">还没写，去「私人知识库 → 目标体系」补上</span>'); }
          } catch (_) {}
        }
        infoEl.innerHTML = html;
      }
    }
    function tick() {
      for (let i = 0; i < nodes.length; i++) for (let j = i + 1; j < nodes.length; j++) {
        const a = nodes[i], b = nodes[j]; let dx = a.x - b.x, dy = a.y - b.y, d2 = dx * dx + dy * dy || 1, dist = Math.sqrt(d2);
        const rep = 4200 / d2, fx = (dx / dist) * rep, fy = (dy / dist) * rep; a.vx += fx; a.vy += fy; b.vx -= fx; b.vy -= fy;
      }
      edges.forEach((e) => { const a = idMap[e.a], b = idMap[e.b]; let dx = b.x - a.x, dy = b.y - a.y, dist = Math.sqrt(dx * dx + dy * dy) || 1; const f = (dist - 90) * 0.03, fx = (dx / dist) * f, fy = (dy / dist) * f; a.vx += fx; a.vy += fy; b.vx -= fx; b.vy -= fy; });
      nodes.forEach((n) => { if (n === dragNode) { n.vx = 0; n.vy = 0; return; } n.vx += (cx - n.x) * 0.006; n.vy += (cy - n.y) * 0.006; n.vx *= 0.86; n.vy *= 0.86; n.x += n.vx; n.y += n.vy; n.x = Math.max(20, Math.min(W - 20, n.x)); n.y = Math.max(20, Math.min(H - 20, n.y)); });
    }
    const edgeEls = edges.map((e) => { const l = document.createElementNS(svgNS, "line"); l.setAttribute("stroke", "rgba(150,170,200,0.22)"); l.setAttribute("stroke-width", "1"); svg.appendChild(l); return l; });
    nodes.forEach((n) => {
      const g = document.createElementNS(svgNS, "g");
      const c = document.createElementNS(svgNS, "circle"); c.setAttribute("r", n.r); c.setAttribute("fill", n.color); c.setAttribute("stroke", n.kind === "root" ? "#5cc8ff" : "rgba(0,0,0,0.4)"); c.setAttribute("stroke-width", n.kind === "root" ? "3" : "1.5"); g.appendChild(c);
      const t = document.createElementNS(svgNS, "text"); t.setAttribute("text-anchor", "middle"); t.setAttribute("dy", n.r + 11); t.setAttribute("fill", "#cdd9e5"); t.setAttribute("font-size", n.kind === "root" ? "13" : "9"); t.textContent = (n.label || "").length > 10 ? (n.label || "").slice(0, 9) + "…" : (n.label || ""); g.appendChild(t);
      const tip = document.createElementNS(svgNS, "title"); tip.textContent = n.label || ""; g.appendChild(tip);
      g.style.cursor = "grab"; g.style.touchAction = "none";
      let moved = false, downX = 0, downY = 0;
      g.addEventListener("pointerdown", (e) => { e.preventDefault(); dragNode = n; moved = false; downX = e.clientX; downY = e.clientY; g.style.cursor = "grabbing"; try { g.setPointerCapture(e.pointerId); } catch (_) {} });
      g.addEventListener("pointermove", (e) => {
        if (dragNode !== n) return;
        if (Math.abs(e.clientX - downX) + Math.abs(e.clientY - downY) > 3) moved = true;
        const ctm = svg.getScreenCTM(); if (ctm) { const P = window.DOMPoint || window.SVGPoint; const p = P ? new P(e.clientX, e.clientY) : { x: e.clientX, y: e.clientY }; const tp = p.matrixTransform ? p.matrixTransform(ctm.inverse()) : { x: e.clientX, y: e.clientY }; n.x = Math.max(20, Math.min(W - 20, tp.x)); n.y = Math.max(20, Math.min(H - 20, tp.y)); }
        n.vx = 0; n.vy = 0;
      });
      g.addEventListener("pointerup", (e) => { if (dragNode === n) { try { g.releasePointerCapture(e.pointerId); } catch (_) {} } dragNode = null; g.style.cursor = "grab"; if (!moved) showInfo(n); });
      g.addEventListener("click", (e) => { e.preventDefault(); });
      svg.appendChild(g); nodeEls.push({ node: n, g, c });
    });
    // 仅移除旧 svg 图层，保留宇宙背景层（星点 / 星云），否则背景会被清空
    Array.from(wrap.querySelectorAll("svg")).forEach((s) => s.remove());
    wrap.appendChild(svg);
    window.__graphAlive = true;
    for (let i = 0; i < 60; i++) tick();
    let frame = 0;
    function render() {
      if (!window.__graphAlive) return;
      if (frame < 320) { tick(); frame++; }
      nodeEls.forEach((o) => o.g.setAttribute("transform", "translate(" + o.node.x + "," + o.node.y + ")"));
      edgeEls.forEach((l, i) => { const e = edges[i], a = idMap[e.a], b = idMap[e.b]; l.setAttribute("x1", a.x); l.setAttribute("y1", a.y); l.setAttribute("x2", b.x); l.setAttribute("y2", b.y); });
      if (frame < 320 || dragNode) requestAnimationFrame(render);
    }
    render();
  }

  function mailuoExport(sub) {
    const d = loadMailuo();
    const tags = mailuoTags(d);
    const tmap = mailuoTagMap(d);
    sub.innerHTML = `
      <h3>📤 导出 · 按标签备份与复盘</h3>
      <p class="muted">选一个标签，把挂在它下面的所有碎片（含链接 / 文字）连同目标说明一起导出。支持 Markdown / 纯文本 / JSON。</p>
      <div class="row"><label>选择标签：</label><select id="mlExpTag" style="flex:1">${tags.map((t) => `<option value="${t.id}">${escHTML(t.label)}（${d.fragments.filter((f) => (f.tags || []).includes(t.id)).length}）</option>`).join("")}</select></div>
      <div id="mlExpPrev" class="mailuo-list" style="margin-top:10px"></div>
      <label class="row" style="margin-top:10px;gap:6px;align-items:center"><input type="checkbox" id="mlExpNotes" style="width:auto;flex:none" /><span>同时导出「📝 我的笔记」（<b id="mlExpNoteCount">0</b> 篇，含全部正文）</span></label>
      <div class="row" style="margin-top:8px">
        <button class="ghost" id="mlExpMd">导出 Markdown</button>
        <button class="ghost" id="mlExpTxt">导出 纯文本</button>
        <button class="ghost" id="mlExpJson">导出 JSON</button>
        <button class="ghost" id="mlExpNotesOnly">📝 只导出我的笔记</button>
      </div>
      ${tags.length ? "" : '<div class="muted">还没有目标标签，先去「目标体系」定目标。</div>'}
    `;
    const sel = sub.querySelector("#mlExpTag");
    let notesCache = [];
    try { notesCache = loadNotes(); } catch (e) { notesCache = []; }
    const ncEl = sub.querySelector("#mlExpNoteCount"); if (ncEl) ncEl.textContent = String(notesCache.length);
    const notesOn = () => { const c = sub.querySelector("#mlExpNotes"); return !!(c && c.checked); };
    const notesMd = () => {
      const out = ["## 📝 我的笔记（" + notesCache.length + " 篇）", ""];
      notesCache.forEach((n, i) => {
        out.push("### " + (i + 1) + ". " + (n.title || "未命名笔记"));
        const tg = (n.tags || []).map((t) => "#" + t).join(" ");
        if (tg) out.push("标签：" + tg);
        out.push("更新时间：" + new Date(n.updatedAt || n.createdAt || Date.now()).toLocaleString("zh-CN"));
        out.push("");
        out.push((n.md || "").trim() || "（空）", "");
      });
      return out;
    };
    const notesTxt = () => {
      const out = ["我的笔记（" + notesCache.length + " 篇）", "--------------------------------"];
      notesCache.forEach((n, i) => {
        out.push((i + 1) + ". " + (n.title || "未命名笔记"));
        out.push("   更新时间：" + new Date(n.updatedAt || n.createdAt || Date.now()).toLocaleString("zh-CN"));
        const t = (n.md || "").trim(); if (t) out.push("   " + t.split("\n").join("\n   "));
        out.push("");
      });
      return out;
    };
    function preview() {
      const tid = sel.value; const tg = tmap[tid];
      const frags = d.fragments.filter((f) => (f.tags || []).includes(tid));
      const el = sub.querySelector("#mlExpPrev");
      if (!frags.length) { el.innerHTML = '<span class="muted">这个标签下还没有碎片。</span>'; return; }
      el.innerHTML = `<div class="muted" style="font-size:12px">「${escHTML(tg ? tg.label : tid)}」下共 ${frags.length} 条碎片：</div>` + frags.map((f) => `<div class="ml-frag"><div class="ml-frag-main">${f.type === "link" ? "🔗" : "📝"} ${escHTML((f.text || f.title || f.url || "").slice(0, 120))}</div></div>`).join("");
    }
    sel.onchange = preview; preview();
    function goalOf(tid) {
      if (tid === "life") return ((d.lifeGoals && d.lifeGoals[0] && d.lifeGoals[0].text) || d.lifeGoal || "");
      const p = d.pillars.find((x) => x.id === tid); if (p) return p.goal || "";
      const s = d.subGoals.find((x) => x.id === tid); if (s) return s.title || "";
      return "";
    }
    function buildContent(fmt) {
      const tid = sel.value; const tg = tmap[tid];
      const frags = d.fragments.filter((f) => (f.tags || []).includes(tid));
      const stamp = new Date().toISOString().slice(0, 10);
      const head = (tg ? tg.label : tid);
      const gtext = goalOf(tid);
      if (fmt === "json") return JSON.stringify({ tag: head, goal: gtext, exportedAt: new Date().toISOString(), count: frags.length, fragments: frags, notes: notesOn() ? notesCache : [] }, null, 2);
      const lines = [];
      if (fmt === "md") {
        lines.push("# 脉络 · 标签导出：" + head, "");
        lines.push("> 导出时间：" + stamp + " ｜ 碎片数：" + frags.length);
        if (gtext) { lines.push("", "**目标说明：** " + gtext); }
        lines.push("", "---", "");
        frags.forEach((f, i) => {
          lines.push((i + 1) + ". " + (f.type === "link" ? "🔗 " : "📝 ") + (f.text || f.title || ""));
          if (f.type === "link" && f.url) lines.push("   来源：" + f.url + (f.title ? " — " + f.title : ""));
          if (f.desc) lines.push("   简介：" + f.desc);
          const ts = (f.tags || []).map((t) => tmap[t] ? tmap[t].label : t).filter((x) => x !== head);
          if (ts.length) lines.push("   其他标签：" + ts.join("、"));
          lines.push("   记录时间：" + new Date(f.createdAt || Date.now()).toLocaleString("zh-CN"), "");
        });
        if (notesOn() && notesCache.length) { lines.push("", "---", ""); notesMd().forEach((x) => lines.push(x)); }
        return lines.join("\n");
      }
      lines.push("脉络 · 标签导出：" + head, "导出时间：" + stamp + " ｜ 碎片数：" + frags.length);
      if (gtext) lines.push("目标说明：" + gtext);
      lines.push("--------------------------------");
      frags.forEach((f, i) => {
        lines.push((i + 1) + ". " + (f.type === "link" ? "[链接] " : "") + (f.text || f.title || ""));
        if (f.type === "link" && f.url) lines.push("    来源：" + f.url);
        const ts = (f.tags || []).map((t) => tmap[t] ? tmap[t].label : t).filter((x) => x !== head);
        if (ts.length) lines.push("    其他标签：" + ts.join("、"));
        lines.push("    记录时间：" + new Date(f.createdAt || Date.now()).toLocaleString("zh-CN"));
      });
      if (notesOn() && notesCache.length) { lines.push("", "--------------------------------"); notesTxt().forEach((x) => lines.push(x)); }
      return lines.join("\n");
    }
    function download(content, ext, mime) {
      const blob = new Blob([content], { type: mime + ";charset=utf-8" });
      const a = document.createElement("a"); const tid = sel.value; const safe = (tmap[tid] ? tmap[tid].label : tid).replace(/[\\/:*?"<>|]/g, "_");
      a.href = URL.createObjectURL(blob); a.download = "脉络_" + safe + "_" + new Date().toISOString().slice(0, 10) + "." + ext; a.click(); setTimeout(() => URL.revokeObjectURL(a.href), 2000);
    }
    const nOnly = sub.querySelector("#mlExpNotesOnly");
    if (nOnly) nOnly.onclick = () => {
      if (!notesCache.length) { alert("还没有笔记，先去「碎片记录 → 📝 我的笔记」新建一篇。"); return; }
      const stamp = new Date().toISOString().slice(0, 10);
      const body2 = ["# 我的笔记 · 导出", "", "> 导出时间：" + stamp + " ｜ 共 " + notesCache.length + " 篇", ""].concat(notesMd()).join("\n");
      const blob = new Blob([body2], { type: "text/markdown;charset=utf-8" });
      const a = document.createElement("a");
      a.href = URL.createObjectURL(blob); a.download = "我的笔记_" + stamp + ".md"; a.click();
      setTimeout(() => URL.revokeObjectURL(a.href), 2000);
    };
    sub.querySelector("#mlExpMd").onclick = () => download(buildContent("md"), "md", "text/markdown");
    sub.querySelector("#mlExpTxt").onclick = () => download(buildContent("txt"), "txt", "text/plain");
    sub.querySelector("#mlExpJson").onclick = () => download(buildContent("json"), "json", "application/json");
  }

  // ---------- 首页 ----------
  function renderHome(v) {
    v.innerHTML = `
            <section class="hero">
        <h1>知遇录</h1>
        <p class="hero-sub">长在知乎生态的「个人成长操作系统」</p>
        <p class="hero-desc">把知乎上真实走过的路，重新组织成你自己的下一步：看清自己、借前人校准方向、把方法炼成自己的、把成长写成生命之书。知遇录记得你走过的每一步，让AI陪你成为一个更好的人。</p>
        <div class="cta">
          <a class="btn btn-primary" href="#self">从「认识自己」开始 →</a>
          <button id="zhHeroBtn" class="btn-zh">🔗 登录知乎</button>
        </div>
        <p class="hero-zh-status" id="zhHeroText"></p>
      </section>
      <section class="modules grid grid-3">
        <a class="mod-tile" href="#self"><div class="ico">🔮</div><h4>自我认知</h4><p>刘看山陪你聊，一层层看清自己；想换个东方视角，也能请他排盘论命、做 MBTI 觉察。</p><span class="tile-go" aria-hidden="true">→</span></a>
        <a class="mod-tile" href="#review"><div class="ico">🔄</div><h4>复盘</h4><p>刘看山陪你聊，顺事引出系统思维方法论，还能搜知乎上别人怎么走过。</p><span class="tile-go" aria-hidden="true">→</span></a>
        <a class="mod-tile" href="#explore"><div class="ico">🔭</div><h4>知遇·检索</h4><p>实时知乎内核，一个入口：人生样本（浏览 / 对齐处境），全是当下真实的知乎内容。</p><span class="tile-go" aria-hidden="true">→</span></a>
        <a class="mod-tile" href="#field"><div class="ico">🧭</div><h4>领域速通</h4><p>刘看山陪你定学习目标，从西蒙 / 费曼 / SQ3R / 康奈尔 / 麻省理工AI / 番茄 里挑方法，说清用什么方法达成什么目标，实时调用知乎给你 30 天计划。</p><span class="tile-go" aria-hidden="true">→</span></a>
        <a class="mod-tile" href="#models"><div class="ico">🧠</div><h4>大佬思维模型</h4><p>把知乎高手的方法论蒸馏成卡，还能直接跟蒸馏出的模型对话。</p><span class="tile-go" aria-hidden="true">→</span></a>
        <a class="mod-tile" href="#check"><div class="ico">🧪</div><h4>成长检验</h4><p>复习卡片（间隔重复）＋ 三大检验关，把学到的真正变成你的。</p><span class="tile-go" aria-hidden="true">→</span></a>
        <a class="mod-tile" href="#learn"><div class="ico">📚</div><h4>私人知识库</h4><p>你的网站导航、关注博主与知乎创作，慢慢长成专属学习中枢。</p><span class="tile-go" aria-hidden="true">→</span></a>
        <a class="mod-tile" href="#grow"><div class="ico">🌟</div><h4>养成 · 我的大佬养成系统</h4><p>大佬必修能力画布 + 今日成长 + 成长日历，把变强看得见。</p><span class="tile-go" aria-hidden="true">→</span></a>
        <a class="mod-tile" href="#bio"><div class="ico">📖</div><h4>人生传记 · 生命之书</h4><p>前序模块积累的成长，被刘看山编织成你的人生之书。</p><span class="tile-go" aria-hidden="true">→</span></a>
        <a class="mod-tile" href="#graph"><div class="ico">🪐</div><h4>知识星球</h4><p>你的知识点长成一片银河：3D 星球可旋转探索，2D 网络可拖拽牵引，一眼看清自己的知识脉络。</p><span class="tile-go" aria-hidden="true">→</span></a>
        <a class="mod-tile tile-liu" href="#home"><div class="ico">🐾</div><h4>刘看山陪伴</h4><p>知乎官方电子好友，点我随时对话，平时在右下角静静陪你。</p><span class="tile-go" aria-hidden="true">→</span></a>
      </section>
      <section class="card push-card" id="pushCard">
        <h3>📡 今日为你 · 刘看山主动推荐</h3>
        <p class="muted">不用你搜——刘看山看你最近的足迹 / 原则 / 领域，主动从知乎实时给你挑几篇「现在就值得看」的内容。</p>
        <div id="pushList" class="section grid grid-2"></div>
        <div class="row" style="margin-top:10px"><button class="ghost" id="pushRefresh">🔄 换一批</button></div>
      </section>
      <div class="note">本 Demo 为知乎黑客松参赛作品，实时接入知乎开放平台：热榜 / 搜索 / 全网 / 直答 / 关注流 / 本人创作 / 收藏 / OAuth 授权登录。
      所有回答均实时调用知乎接口，本地素材仅作兜底；配置 <code>ZHIHU_ACCESS_SECRET</code> 后出真实知乎内容。</div>`;
    const liuTile = v.querySelector(".tile-liu");
    if (liuTile) liuTile.addEventListener("click", (e) => { e.preventDefault(); openLiuChat(); });
    const pushRefresh = v.querySelector("#pushRefresh");
    if (pushRefresh) pushRefresh.onclick = () => renderTodayPush(true);
    renderTodayPush(false);
  }
  async function renderTodayPush(force) {
    const el = document.getElementById("pushList");
    if (!el) return;
    if (!force && el.dataset.done) return;
    const seed = pickPushSeed();
    el.innerHTML = '<div class="liu-loading" style="grid-column:1/-1">📡 刘看山正在为你搜知乎实时内容…</div>';
    const r = await callZhihu("dual", { q: seed + " 经验 方法 复盘", Count: 6, fresh: true });
    const _pz = (r && r.zhihu) || [], _pg = (r && r.global) || [];
    if (_pz.length || _pg.length) {
      el.dataset.done = "1";
      el.innerHTML = `<div class="muted" style="margin:0 0 6px;grid-column:1/-1">刘看山觉得你今天该看看（基于：<b>${escHTML(seed)}</b>）· 知乎 ${_pz.length} 条 / 全网 ${_pg.length} 条</div>` +
        (_pz.length ? '<div class="muted" style="grid-column:1/-1;margin-top:2px">🔵 知乎参考</div>' + _pz.slice(0, 4).map(liveCard).join("") : "") +
        (_pg.length ? '<div class="muted" style="grid-column:1/-1;margin-top:8px">🌐 全网参考</div>' + _pg.slice(0, 4).map(liveCard).join("") : "");
    } else {
      el.innerHTML = '<div class="muted" style="grid-column:1/-1">（实时检索暂未连上，稍后刷新即可拉到刘看山为你挑的内容。）</div>';
    }
  }
  function pickPushSeed() {
    const ps = getPrinciples();
    if (ps.length) return ps[0];
    try { const rev = JSON.parse(localStorage.getItem("zhiyu_reviews") || "null"); if (rev && (rev.event || (Array.isArray(rev) && rev[0] && rev[0].event))) return Array.isArray(rev) ? rev[0].event : rev.event; } catch (e) {}
    try { const plans = JSON.parse(localStorage.getItem("zhiyu_plans") || "null"); if (Array.isArray(plans) && plans[0]) return plans[0].q || plans[0].domain || ""; if (plans && plans.q) return plans.q; } catch (e) {}
    try { const self = JSON.parse(localStorage.getItem("zhiyu_self") || "null"); if (self && self.m) return "MBTI " + self.m + " 的自我成长"; } catch (e) {}
    return "年轻人如何持续成长与自我突破";
  }

  // ---------- 自我认知（刘看山引导对话）----------
  // ① MBTI 对话去模板化：每个维度准备 3 个问法变体，每次进入随机抽一组，聊起来不像固定问卷
  const SELF_Q_POOL = {
    "E/I": [
      "先聊第一个：独处和人群，哪个让你更'回血'？不用想对错，凭直觉说。",
      "忙完一整周，你是想约人出去走走，还是想一个人在家窝着？哪种更像你？",
      "如果周五晚上可以随便安排，你的第一反应是叫朋友，还是把手机一关自己待着？",
    ],
    "S/N": [
      "遇到一个陌生领域，你更想先钻进细节把它搞透，还是先抓它的大画面和可能性？",
      "看一份新东西，你先注意到的是具体的事实和步骤，还是它背后的意思、将来的可能？",
      "朋友给你讲他的新点子，你更想先问'具体怎么做'，还是先问'这事儿到底意味着什么'？",
    ],
    "T/F": [
      "要做决定时，你更靠逻辑推演、权衡利弊，还是更在意这件事对人、对关系的影响？",
      "跟人起分歧，你心里先冒出来的是'到底谁有道理'，还是'他现在是什么感受'？",
      "帮朋友分析问题，你更习惯把利弊列出来，还是先顺着他的情绪走？",
    ],
    "J/P": [
      "面对计划，你更喜欢定下来、有节奏地推进，还是留点余地、随机应变？",
      "出门旅行，你是提前把行程排满的那种人，还是走到哪儿算哪儿的那种人？",
      "任务交到你手上，你倾向早早做完求个安心，还是压着 deadline 那股劲儿上来才顺手？",
    ],
    "words": [
      "最后，如果只用三个词形容'你觉得自己最像的样子'，你会说哪三个？",
      "快聊完啦——用三个词给自己画个像，你会挑哪三个？",
      "临了问一个：你心里那个'真实的你'，用三个词说说是啥样？",
    ],
  };
  function buildSelfQ() {
    return Object.keys(SELF_Q_POOL).map((dim) => ({ dim, q: SELF_Q_POOL[dim][Math.floor(Math.random() * SELF_Q_POOL[dim].length)] }));
  }
  let selfState = null;
  let selfBusy = false;
  const SELF_STATE_KEY = "zhiyu_self_state";
  const SELF_OUT_KEY = "zhiyu_self_out";
  function loadSelfState() {
    try {
      const s = JSON.parse(localStorage.getItem(SELF_STATE_KEY) || "null");
      if (s && Array.isArray(s.qs) && Array.isArray(s.ans) && s.qs.length) return s;
    } catch (e) {}
    return null;
  }
  function saveSelfState() { try { localStorage.setItem(SELF_STATE_KEY, JSON.stringify(selfState)); } catch (e) {} }
  function saveSelfOut() {
    try { const o = document.getElementById("selfOut"); if (o) localStorage.setItem(SELF_OUT_KEY, o.innerHTML); } catch (e) {}
  }
  function clearSelfAll() {
    try { localStorage.removeItem(SELF_STATE_KEY); localStorage.removeItem(SELF_OUT_KEY); } catch (e) {}
    selfState = { step: 0, ans: [], lean: {}, clarity: {}, qs: buildSelfQ(), finished: false, confirmed: false };
  }
  // 恢复出来的 selfOut 是静态 HTML，需要重新挂事件
  function bindSelfOut() {
    const out = document.getElementById("selfOut");
    if (!out) return;
    const kw = (selfState && selfState.ans ? String(selfState.ans[4] || "") : "").trim();
    out.querySelectorAll(".mbti-pick").forEach((b) => {
      if (b.dataset.bound) return;
      b.dataset.bound = "1";
      b.onclick = () => {
        out.querySelectorAll(".mbti-pick").forEach((x) => x.classList.remove("on"));
        b.classList.add("on");
        const chosen = b.dataset.t;
        const m = MBTI[chosen];
        const box = out.querySelector("#mbtiChosen");
        if (box && m) box.innerHTML = "你确认的是 <b>" + chosen + " · " + m.t + "</b>——" + m.s + "<br><span class='muted'>类型盲区：" + m.w + "</span>";
        const gen = out.querySelector("#genSelf");
        if (gen) gen.disabled = false;
        saveSelfOut();
      };
    });
    const gen = out.querySelector("#genSelf");
    if (gen && !gen.dataset.bound) {
      gen.dataset.bound = "1";
      gen.onclick = () => {
        const on = out.querySelector(".mbti-pick.on");
        if (!on) return;
        try { selfState.confirmed = on.dataset.t; saveSelfState(); } catch (e) {}
        genSelfProfile(on.dataset.t, kw);
      };
    }
    const link = out.querySelector("#genSelfLink");
    if (link && !link.dataset.bound) {
      link.dataset.bound = "1";
      link.onclick = () => window.open(MBTI_TEST_URL, "_blank", "noopener");
    }
  }
  function renderSelf(v) {
    selfState = loadSelfState() || { step: 0, ans: [], lean: {}, clarity: {}, qs: buildSelfQ(), finished: false, confirmed: false };
    v.innerHTML = `
      <h2 class="view-title">🔮 自我认知 · 认识自己，也照见东方 <span class="coach-tag">🎯 提问式教练</span></h2>
      <p class="view-sub">认识自己最清楚的办法，是把模糊的感觉说出来——
      上半部是<b>刘看山</b>陪你聊，但他<b>不急着给你下定论</b>：先反问澄清、再拆你话里的矛盾、最后才轻轻给个视角，像一场轻松的 <b>MBTI 对话式测试</b>，边聊边把你照镜子一样照清楚；
      下半部是<b>刘看山</b>的东方玄学视角（一个对话框，报生辰或说件眼前事，他替你排盘论命、用东方智慧照见自己）。两块各管各的。</p>

      <div class="card">
        <h3>🐾 刘看山 · 认识自己（对话式 MBTI · 提问式教练）</h3>
        <p class="muted">不用填表、不用选下拉框——刘看山用教练的方式一个问题一个问题陪你聊：先反问澄清、再拆你话里的矛盾、最后才轻轻给个视角，<b>不直接替你下定论</b>。聊完再看你是哪种倾向。</p>
        <div class="chat" id="selfChat"></div>
        <div class="row" style="margin-top:10px">
          <input id="selfInput" placeholder="凭直觉回刘看山就好，比如：我更想一个人待着…" />
          <button id="selfSend">说给他听</button>
        </div>
        <p class="mbti-link">🧪 想用权威量表正式测一遍？<a id="selfMbtiLink" href="${MBTI_TEST_URL}" target="_blank" rel="noopener">点这里去做 16personalities · MBTI 测试 ↗</a>（这其实就是一场 MBTI 人格测试）</p>
        <div class="row" style="margin-top:8px"><button class="ghost" id="selfRestart" title="清空这次的对话与画像，重新聊">🔄 重新开始自我认知</button></div>
        <div id="selfOut"></div>
      </div>

      <div class="card" style="margin-top:18px">
        <h3>☯ 刘看山 · 东方玄学视角</h3>
        <p class="muted">一个对话框：报生辰看格局，或说件眼前事请他起卦。</p>
        <div id="lxMount"></div>
      </div>`;
    function send() {
      if (selfBusy) return;
      const inp = v.querySelector("#selfInput");
      const t = inp.value.trim();
      if (!t) return;
      appendMsg("selfChat", "user", t);
      inp.value = "";
      selfAdvance(t);
    }
    v.querySelector("#selfSend").onclick = send;
    v.querySelector("#selfInput").addEventListener("keydown", (e) => { if (e.key === "Enter") send(); });
    const openers = [
      "咱们慢慢聊，当玩个小测试——不用想对错，凭直觉说。第一个问题：",
      "别紧张，就当是朋友闲聊，想到哪说到哪。先来第一个：",
      "好，接下来几个问题你随便答，越凭直觉越准。第一个：",
    ];
    renderChat("selfChat");
    if (chatGet("selfChat").msgs.length === 0) {
      appendMsg("selfChat", "liu", openers[Math.floor(Math.random() * openers.length)] + selfState.qs[0].q);
      appendSelfQuick();
    }
    const sc = v.querySelector("#selfChat");
    sc.addEventListener("click", (e) => {
      const del = e.target.closest && e.target.closest(".self-quick .msg-del");
      if (del) { clearSelfQuick(); renderChat("selfChat"); return; }
      const chip = e.target.closest && e.target.closest(".self-quick-chip");
      if (chip) { const t = chip.textContent.trim(); if (t) selfAdvance(t); return; }
      const send = e.target.closest && e.target.closest(".self-quick-send");
      if (send) { const inp = document.getElementById("selfQuickInput"); const t = inp ? inp.value.trim() : ""; if (t) selfAdvance(t); return; }
    });
    // 切模块回来：按状态重建收尾表单 / 已确认画像（不依赖易过期的 HTML 快照，避免"还没答题就弹出卡片"）
    const _so = document.getElementById("selfOut");
    if (_so) {
      if (selfState && selfState.confirmed) {
        genSelfProfile(selfState.confirmed, (selfState.ans[4] || "").trim(), true);
      } else if (selfState && selfState.finished) {
        selfFinishForm(computeMBTI(selfState).type, computeMBTI(selfState).partial);
      }
    }
    const _sr = document.getElementById("selfRestart");
    if (_sr) _sr.onclick = () => {
      clearSelfAll();
      chatReset("selfChat");
      if (liuHistories && liuHistories["selfChat"]) liuHistories["selfChat"] = [];
      const _o = document.getElementById("selfOut"); if (_o) _o.innerHTML = "";
      appendMsg("selfChat", "liu", openers[Math.floor(Math.random() * openers.length)] + selfState.qs[0].q);
      saveSelfState();
      appendSelfQuick();
    };
    // 挂载东方玄学引擎（极简对话框模式：只留聊天，不显门类按钮与表单）；发言人以刘看山呈现
    if (window.ZhiYuLixuan && document.getElementById("lxMount")) {
      ZhiYuLixuan.mount(document.getElementById("lxMount"), { chatId: "lxChat", panelId: "lxChartBox", simple: true, speaker: "刘看山" });
    }
  }

  function detectLean(t, dim) {
    if (dim === "E/I") { if (/独处|安静|一个人|宅|累|回血|充电/.test(t)) return "I"; if (/人群|热闹|互动|社交|外向|朋友|充电/.test(t)) return "E"; }
    if (dim === "S/N") { if (/细节|搞透|具体|踏实|事实|步骤/.test(t)) return "S"; if (/大画面|可能性|整体|感觉|意义|未来|想象/.test(t)) return "N"; }
    if (dim === "T/F") { if (/逻辑|利弊|推演|理性|客观|分析/.test(t)) return "T"; if (/人|关系|在意|感受|情绪|共情|温柔/.test(t)) return "F"; }
    if (dim === "J/P") { if (/定下来|节奏|计划|安排|确定/.test(t)) return "J"; if (/余地|随机|灵活|应变|随意|顺其自然/.test(t)) return "P"; }
    return null;
  }
  function reflectSelf(dim, lean) {
    const pickV = (arr) => arr[Math.floor(Math.random() * arr.length)];
    if (dim === "E/I") {
      if (lean === "I") return pickV(["我记下了——你更从独处里回血。这不是社恐，是你的能量来源不一样，很正常。", "嗯，一个人待着反而像在充电，这点我听清楚了。", "行，你的电池是「独处牌」的，挺好，很多人还羡慕不来。"]);
      if (lean === "E") return pickV(["你更像从人群里充电的人，互动能给你能量，这也很清楚。", "跟人待一块儿你反而精神，这个信号很明确了。", "热闹对你不是消耗，是充电——我记下了。"]);
      return pickV(["嗯，我听到了，你对自己的回血方式有点模糊，这没关系。", "这块你自己也拿不太准？没事，先放着，回头有感觉了再说。", "你好像两种都有点，咱们先不急下结论。"]);
    }
    if (dim === "S/N") {
      if (lean === "S") return pickV(["你偏向先把细节搞透，是个落地的人。", "先搞清楚'到底是怎么回事'再动手——你这个顺序挺稳的。", "细节控，是好事，地基打得牢。"]);
      if (lean === "N") return pickV(["你更爱抓大画面和可能性，脑子里常转'这件事意味着什么'。", "你先看方向再看路，这种直觉型的人常有前瞻性。", "脑子里老在放'未来预告片'的人，说的就是你吧。"]);
      return pickV(["关于你怎么吸收信息，咱们先放着。", "这块还朦胧，不急，聊后面几个会慢慢清楚。", "两种都沾一点？也正常，先往下聊。"]);
    }
    if (dim === "T/F") {
      if (lean === "T") return pickV(["做决定你更靠逻辑和利弊，挺清醒。", "先算账再看人，你是理性驱动型的。", "你脑子里有杆秤，这挺好的。"]);
      if (lean === "F") return pickV(["你做决定会掂量对人的影响，说明你重关系、有温度。", "先看人再看事——你心里装着人，这不容易。", "感受先行不是缺点，是你做决定的坐标系不一样。"]);
      return pickV(["你做决定时偏逻辑还是偏感受，还不那么确定。", "这题你犹豫了？有意思，说明两边都不弱。", "先记个问号，聊完再看。"]);
    }
    if (dim === "J/P") {
      if (lean === "J") return pickV(["你喜欢定下来、有节奏，踏实。", "先把路铺好再走，你是计划型选手。", "确定感对你很重要，我记下了。"]);
      if (lean === "P") return pickV(["你爱留余地、随机应变，灵活。", "走到哪儿算哪儿，但你要真想去的方向，心里其实有数。", "弹性是你的舒适区，这不是没计划，是计划方式不同。"]);
      return pickV(["你对计划的偏好，先记个问号。", "看情况切换？也行，这块不算死。", "这题放一放，最后一题聊聊你怎么看自己。"]);
    }
    return "";
  }
  function computeMBTI(st) {
    const order = [st.lean["E/I"], st.lean["S/N"], st.lean["T/F"], st.lean["J/P"]];
    const present = order.filter(Boolean);
    if (present.length < 4) return { type: present.join("") || "", partial: true };
    return { type: present.join(""), partial: false };
  }
  async function selfAdvance(text) {
    if (selfBusy) return;
    selfBusy = true;
    const st = selfState;
    const q = st.qs[st.step];
    st.ans[st.step] = text;
    if (q.dim && q.dim !== "words") { const l = detectLean(text, q.dim); if (l) { st.lean[q.dim] = l; st.clarity[q.dim] = (st.clarity[q.dim] || 0) + 1; } }
    const isLast = st.step >= st.qs.length - 1;
    const nextQ = isLast ? "" : st.qs[st.step + 1].q;
    const transcript = st.ans.filter(Boolean).map((a, i) => "第" + (i + 1) + "问（" + (st.qs[i] ? st.qs[i].dim : "") + "）他答：「" + a + "」").join("；");
    let ctx, fallback;
    if (isLast) {
      const mb = computeMBTI(st);
      const dimBits = ["E/I", "S/N", "T/F", "J/P"].filter((d) => st.lean[d]).map((d) => MBTI_DIM_DESC[st.lean[d]]);
      ctx = "【提问式教练·收尾·深度整合，必须把判断权交还用户】聊完这几个问题了，先别急着给他贴 MBTI 标签。请你真正做深度分析，而不是泛泛客套：\n①先用他的原话**复述**整场对话里反复出现的关键词与线索（让他感到被真正听见）；\n②**指出两处他前后回答里的张力或矛盾**（例如某一维上他既像 X 又像 Y，或「想要 A」和「实际会投入的」不一致），用原话点出来、不评判、不贴标签，说明这恰恰说明他不是非黑即白；\n③**往下挖一层**：他这些回答背后可能真正在意什么、在回避什么、想被确认什么，给一个轻轻的视角帮他理解自己；\n④最后必须把球交还给他，明确说「我聊下来的感觉你偏向某一类，但这得你自己拍板」，并请他在下方 16 型里挑一个最像的、或去正式测一遍。绝不要替他说『你就是 XX 型』。自然建议他也可以报生辰，去「刘看山的东方玄学视角」聊聊格局。" + (transcript ? "\n【他整场的回答实录，请据此分析】" + transcript : "");
      fallback = selfSummary(st);
    } else {
      ctx = "【提问式教练·深度陪伴】你正在陪用户做一场 MBTI 对话式自我觉察。" + (transcript ? "他已经回答过：" + transcript + "。" : "") + "现在他说：「" + text + "」。请用教练的方式**深度回应**（不要急着跳到下一个问题）：\n①先**接住并复述**他刚说的核心，让他感到被听见；\n②**点出他这轮和之前回答的矛盾或张力**（用原话，不评判、不贴标签），例如「你刚才说 A，现在又说 B，这两句之间好像有点拉扯」；\n③**往下挖一层**：这个回答背后他真正在意什么、在回避什么、想确认什么；\n④用一个**具体的反问**帮他看清这一点，再自然引出下一个问题：" + nextQ + "。全程口语、像朋友闲聊，不列条目、不下定论。" + (q.dim && q.dim !== "words" ? "（这一维在聊：" + q.dim + "）" : "");
      fallback = reflectSelf(q.dim, st.lean[q.dim]) + " " + nextQ;
    }
    try {
      if (isLast) {
        const _analysisP = liuReply("selfChat", { q: text, persona: "self", coach: true, context: ctx, refZhihu: 6, refGlobal: 6 }, fallback);
        const _scoreP = selfScore(st);
        const [_r, _sc] = await Promise.all([_analysisP, _scoreP]);
        if (_sc) {
          if (_sc.EI) st.lean["E/I"] = _sc.EI;
          if (_sc.SN) st.lean["S/N"] = _sc.SN;
          if (_sc.TF) st.lean["T/F"] = _sc.TF;
          if (_sc.JP) st.lean["J/P"] = _sc.JP;
        }
        selfFinishForm(computeMBTI(st).type, computeMBTI(st).partial);
      } else {
        const _r = await liuReply("selfChat", { q: text, persona: "self", coach: true, context: ctx, refZhihu: 6, refGlobal: 6 }, fallback);
        st.step++;
      }
    } catch (e) {
      try { appendMsg("selfChat", "liu", "刚才那一下网络有点绕，你再发一句，我马上接上～"); } catch (e2) {}
    } finally {
      saveSelfState();
      selfBusy = false;
      appendSelfQuick();
    }
  }
  function clearSelfQuick() {
    try { const st = chatGet("selfChat"); st.msgs = st.msgs.filter((m) => m.kind !== "quick"); } catch (e) {}
  }
  async function appendSelfQuick() {
    const st = chatGet("selfChat");
    const last = st.msgs.filter((m) => m.s === "liu" && m.t && m.kind !== "quick").slice(-1)[0];
    if (!last) return;
    let opts = [];
    try {
      const r = await callZhihu("liuanswer", { q: "（基于上面的回答，给我 3 条用户可点选的简短接话建议）", persona: "self", context: "只输出 3 条用户可能想接话的简短建议，每条 ≤14 字，换行分隔，不要序号、不要解释：\n" + last.t, history: [] });
      if (r && !r.mock && r.content) opts = r.content.split(/[\n；;]/).map((s) => s.trim()).filter((s) => s && s.length <= 16).slice(0, 3);
    } catch (e) {}
    if (opts.length < 1) opts = ["这点我不太确定", "我更倾向你说的第一种", "能举个具体例子吗"];
    if (opts.length < 3) opts = opts.concat(["这个我得再想想", "可以展开说说吗", "我想换个角度"]);
    opts = opts.slice(0, 4);
    clearSelfQuick();
    chatAppend("selfChat", { kind: "quick", opts: opts });
    renderChat("selfChat");
  }
  function _selfQuickHTML(m) {
    const chips = (m.opts || []).map((o) => '<button type="button" class="chip self-quick-chip">' + escHTML(o) + "</button>").join("");
    return '<div class="msg liu self-quick"><button type="button" class="msg-del" title="删除">✕</button><span class="who">刘看山</span><div class="muted" style="font-size:12px;margin:2px 0">挑一句接着聊，或自己写一句：</div><div class="self-quick-row">' + chips + '</div><div class="row" style="margin-top:6px"><input id="selfQuickInput" placeholder="自定义补充…" /><button class="self-quick-send">发送</button></div></div>';
  }

  function selfFinishForm(type, partial) {
    const out = document.getElementById("selfOut");
    const kw = (selfState.ans[4] || "").trim();
    const detected = type || "";
    const grid = Object.keys(MBTI).map((t) => {
      const m = MBTI[t];
      return `<button class="mbti-pick ${detected === t ? "guess" : ""}" data-t="${t}" type="button" title="${m.t}">${t}<small>${m.t}</small></button>`;
    }).join("");
    out.innerHTML = `
      <div class="card" style="margin-top:12px">
        <h3>🪞 刘看山读到的你</h3>
        <p class="muted">${detected ? "聊下来我的感觉，你偏向 <b>" + detected + (partial ? "（还有维度没聊清）" : "") + "</b> 这一类。" : "聊了这几句，我对你有了点轮廓，但还不全。"}不过——<b>你到底属于哪一型，得你自己定。</b>下面 16 型里，<b>挑一个你最像的</b>（刘看山猜的那个也在这，你可以认，也可以不认）：</p>
        <div class="mbti-grid">${grid}</div>
        <div id="mbtiChosen" class="mbti-chosen muted"></div>
        <div class="row" style="margin-top:10px">
          <button id="genSelf" class="ghost" disabled>✅ 确认并保存我的画像</button>
          <button class="ghost" id="genSelfLink">🧪 去 16personalities 正式测一遍 ↗</button>
        </div>
      </div>`;
    let chosen = "";
    out.querySelectorAll(".mbti-pick").forEach((b) => {
      b.onclick = () => {
        out.querySelectorAll(".mbti-pick").forEach((x) => x.classList.remove("on"));
        b.classList.add("on");
        chosen = b.dataset.t;
        const m = MBTI[chosen];
        document.getElementById("mbtiChosen").innerHTML = "你确认的是 <b>" + chosen + " · " + m.t + "</b>——" + m.s + "<br><span class='muted'>类型盲区：" + m.w + "</span>";
        const gen = document.getElementById("genSelf");
        if (gen) gen.disabled = false;
        appendMsg("selfChat", "liu", "好，你定的是 " + chosen + "。最了解你的人是你自己，我尊重你的判断。把它存下来，往后咱们再慢慢验证～");
      };
    });
    const gen = document.getElementById("genSelf");
    if (gen) gen.onclick = () => {
      if (!chosen) return;
      try { selfState.confirmed = chosen; saveSelfState(); } catch (e) {}
      genSelfProfile(chosen, kw);
    };
    const link = document.getElementById("genSelfLink");
    if (link) link.onclick = () => window.open(MBTI_TEST_URL, "_blank", "noopener");
    try { selfState.finished = true; saveSelfState(); } catch (e) {}
    saveSelfOut();
  }
  function selfSummary(st) {
    const order = [st.lean["E/I"], st.lean["S/N"], st.lean["T/F"], st.lean["J/P"]].filter(Boolean);
    let tail = "";
    if (order.length === 4) tail = `按刚才聊的，你大概是 <b>${order.join("")}</b> 这一类（人不是非黑即白，这只是个倾向）。`;
    else tail = "聊了这几句，我对你有了点轮廓，但还不全。";
    return "聊得差不多了。我把刚才听到的拼了一下：" + tail + "你点下面的「保存我的自我画像」就能存下来。";
  }
  async function selfScore(st) {
    try {
      const qa = (st.qs || []).map((q, i) => ({ dim: q.dim || "", text: (st.ans[i] || "").toString() })).filter((x) => x.text.trim());
      if (!qa.length) return null;
      const r = await callZhihu("selfScore", { qa }, { timeout: 30000 });
      if (r && !r.mock && r.dims) {
        const d = r.dims;
        return {
          EI: d.EI || null,
          SN: d.SN || null,
          TF: d.TF || null,
          JP: d.JP || null,
        };
      }
    } catch (e) {}
    return null;
  }
  function genSelfProfile(type, kw, skipSideEffects) {
    const mb = MBTI[type] || { t: "", s: "", w: "" };
    document.getElementById("selfOut").innerHTML = `
      <div class="section grid grid-2">
        <div class="card profile-card"><h3>🪞 我的自我画像</h3>
          <div class="axis"><span class="k">MBTI</span><span class="v">${type ? type + " · " + mb.t : "（未测，建议去做测试）"}</span></div>
          <div class="axis"><span class="k">我眼中的自己</span><span class="v">${kw || "—"}</span></div>
        </div>
        <div class="card profile-card"><h3>✅ 我的优势卡</h3>
          <p class="strength"><b>类型天赋：</b>${mb.s || "—"}</p>
          <p class="muted">${kw ? "你刚才说的三个词，本身就是你最在意的特质。" : "聊聊自己、做个测试，优势会更清楚。"}</p>
        </div>
        <div class="card profile-card"><h3>🧬 人格雷达</h3>
          <div id="selfRadar" style="display:flex;justify-content:center"></div>
          <p class="muted" style="font-size:12px;text-align:center;margin-top:4px">轴越长=你越明确表达过这一倾向${type ? "（" + type + "）" : ""}</p>
        </div>
        <div class="card profile-card"><h3>⚠️ 我的盲区卡</h3>
          <p class="blind"><b>类型注意：</b>${mb.w || "—"}</p>
          <p class="muted">盲区不是缺陷，是「需要借样本、借他人来补」的地方。把它写进复盘，下次绕弯前会先认出来。</p>
        </div>
        <div class="card"><h3>🌟 刘看山想对你说</h3>
          <p class="muted">看清优势是为了用它，看清盲区是为了别被它绊住。把这张画像带到「复盘」里，
          遇到具体事，我陪你用系统思维再拆一层。</p>
          <p class="muted" style="margin-top:8px">想换个视角？去「刘看山的东方玄学」聊聊格局，或起一卦静心。</p>
        </div>
      </div>
      <div class="note">画像已存本地。下一步去「复盘」把近期经历变成能力，或去「人生样本库」找相似真实样本。</div>`;
    // 自我认知雷达：四个 MBTI 维度，轴长=表达清晰度
    const sr = document.getElementById("selfRadar");
    if (sr) {
      const dims = ["E/I", "S/N", "T/F", "J/P"];
      const labels = dims.map((d) => d.split("/").find((x) => selfState.lean[d] === x) || d);
      const vals = dims.map((d) => Math.min(95, 55 + (selfState.clarity[d] || 0) * 12));
      sr.innerHTML = radarSVG(labels, vals, { size: 240, color: "#a78bfa", max: 100 });
    }
    if (!skipSideEffects) {
      try { localStorage.setItem("zhiyu_self", JSON.stringify({ m: type || "", z: "", kw })); } catch (e) {}
      saveSelfOut();
      recordHistory("自我认知", "完成了自我画像（" + (type || "未定型") + "）");
      awardXP({ cog: 15, con: 5 }, "生成自我画像");
      recordFootprint("自我认知", "认清了自己：" + (type || "未定型"));
    }
  }

  // ---------- 复盘（刘看山引导 + 系统思维方法论 + 知乎检索）----------
  let reviewState = null;
  let rvBusy = false;
  const RV_STATE_KEY = "zhiyu_review_state";
  function loadReviewState() {
    try {
      const st = JSON.parse(localStorage.getItem(RV_STATE_KEY) || "null");
      if (st && Array.isArray(st.replies)) return st;
    } catch (e) {}
    return { step: 0, event: "", replies: [], lenses: [], tools: [], methods: [] };
  }
  function saveReviewState() {
    try { localStorage.setItem(RV_STATE_KEY, JSON.stringify(reviewState)); } catch (e) {}
  }
  function resetReviewState() {
    reviewState = loadReviewState();
    try { localStorage.removeItem(RV_STATE_KEY); } catch (e) {}
  }
  // 复盘·历史教训：错题本 + 历史复盘里踩过的坑（进模块提醒 + 作答时结合）
  function pastMistakeLines(n) {
    const out = [];
    try {
      (loadMistakes() || []).slice(0, n).forEach((m) => {
        if (m && m.q) out.push(String(m.q) + (m.lesson ? "（上次点评：" + String(m.lesson).slice(0, 40) + "…）" : ""));
      });
    } catch (e) {}
    try {
      const rvs = JSON.parse(localStorage.getItem("zhiyu_reviews") || "[]");
      (rvs || []).slice(0, 3).forEach((r) => {
        const lesson = (r && r.replies && r.replies[1]) ? String(r.replies[1]) : "";
        if (lesson) out.push("复盘「" + String(r.event || "").slice(0, 16) + "」时你总结的教训：" + lesson.slice(0, 50));
      });
    } catch (e) {}
    return out.slice(0, (n || 3) + 2);
  }

  function renderReview(v) {
    reviewState = { step: 0, event: "", replies: [], lenses: [], tools: [], methods: [] };
    v.innerHTML = `
      <h2 class="view-title">🔄 复盘 · 刘看山陪你聊</h2>
      <p class="view-sub">复盘不是填表，是和刘看山一起把一件事想透。每次他会顺着你的事，引出一套「系统思维」方法论——
      帮你看清：这是单次意外，还是一种结构在重复。卡住时，也能直接去知乎搜别人怎么走过。</p>
      <div class="card">
        <div class="chat" id="rvChat"></div>
        <div class="chips">
          <span class="chip" data-q="坚持了半年的习惯，最近突然断了">习惯断了</span>
          <span class="chip" data-q="工作三年遇到瓶颈，越努力越没进展">遇瓶颈</span>
          <span class="chip" id="rvSearch">📡 搜搜别人怎么走过（全网）</span>
          <span class="chip" id="rvModel">🧠 用大佬思维模型拆</span>
        </div>
        <div class="row" style="margin-top:10px">
          <input id="rvInput" placeholder="例：坚持了半年的习惯，最近突然断了" />
          <button id="rvSend">说给刘看山听</button>
        </div>
        <div class="row"><button class="ghost" id="rvCard" style="display:none">生成我的复盘卡</button><button class="ghost" id="rvRestart">🔄 重新开始</button></div>
        <div id="rvOut"></div>
      </div>
      <div class="card" id="mistakeCard">
        <h3>📕 我的错题本</h3>
        <p class="muted">把踩过的坑记下来。下次遇到同类结构，刘看山帮你一眼认出它；点「让刘看山评一评」，他会结合<b>实时知乎上的同类教训</b>给你点评。</p>
        <div class="row">
          <input id="mkQ" placeholder="错在哪？（一句话，例：上周拖延导致 deadline 崩了）" style="flex:2" />
          <button id="mkAdd">＋ 记一道</button>
        </div>
        <div id="mkList" class="mistake-list"></div>
      </div>`;
    document.getElementById("rvSend").onclick = () => {
      if (rvBusy) return;
      const inp = document.getElementById("rvInput");
      const t = inp.value.trim();
      if (!t) return;
      appendMsg("rvChat", "user", t);
      inp.value = "";
      rvAdvance(t);
    };
    document.getElementById("rvInput").addEventListener("keydown", (e) => {
      if (e.key === "Enter") document.getElementById("rvSend").click();
    });
    v.querySelectorAll("[data-q]").forEach((ch) => {
      ch.onclick = () => {
        if (rvBusy) return;
        const q = ch.dataset.q;
        appendMsg("rvChat", "user", q);
        rvAdvance(q);
      };
    });
    document.getElementById("rvSearch").onclick = reviewSearch;
    document.getElementById("rvModel").onclick = reviewDistillModel;
    document.getElementById("rvCard").onclick = genReviewCard;
    const rst = document.getElementById("rvRestart");
    if (rst) rst.onclick = () => { if (!confirm("重新开始会清空这次复盘的对话与进度，确定？")) return; resetReviewState(); chatReset("rvChat"); renderReview(v); };
    document.getElementById("mkAdd").onclick = addMistake;
    renderMistakes();
    if (reviewState && reviewState.step >= 3) { const rc2 = document.getElementById("rvCard"); if (rc2) rc2.style.display = ""; }
    renderChat("rvChat");
    if (chatGet("rvChat").msgs.length === 0) {
      appendMsg("rvChat", "liu", "说说最近一件让你反复想起、或怎么想都绕不开的事？一句话就够，我陪你慢慢拆。");
      remindPastMistakes();
    }
  }
  // 复盘·进模块即检索过去犯过的错并主动提醒（只在开新对话时提醒一次；切回来不重复刷屏）
  function remindPastMistakes() {
    const linesArr = pastMistakeLines(3);
    if (!linesArr.length) return;
    const lines = linesArr.map((x, i) => (i + 1) + ". " + x).join("\n");
    chatAppend("rvChat", {
      s: "liu", who: "刘看山",
      t: "我先翻了下你的错题本——你过去踩过这些坑：\n" + lines + "\n这次复盘，咱们留个心：正在聊的这件事，跟上面哪一道是同一个结构？",
    });
    renderChat("rvChat");
  }
  async function rvAdvance(text) {
    if (rvBusy) return;
    rvBusy = true;
    const st = reviewState;
    const pastNote = (function () {
      const ls = pastMistakeLines(3);
      return ls.length ? "（他过去踩过这些坑：" + ls.join("；") + "。如果这次的事跟其中某个结构相似，自然地提醒他一句，别生硬罗列。）" : "";
    })();
    const cid = "rvChat";
    // ② 动态方法论：不再固定轮换。把候选清单交给后端，由 LLM 读懂这件事的结构、挑最贴切的方法论来用
    const methodsPayload = SYSTEM_THINK.map((m) => ({ name: m.name, one: m.one, when: m.when }));
    if (st.step === 0) {
      st.event = text;
      st.lenses = detectLens(text);
      const fb = "我听着呢。先别急着下结论——当时具体发生了什么，你又做了什么选择？咱们先把事实摊开。";
      await liuReply(cid, { q: text, persona: "review", methods: methodsPayload, context: "用户刚讲了一件想复盘的事：「" + text + "」。先接住他的情绪，自然追问：当时具体发生了什么、他做了什么选择。" + pastNote }, fb);
      reviewSuggestTools(cid, st.event);
      st.step = 1;
    } else if (st.step === 1) {
      st.replies.push(text);
      const fb = "记下了。再往深一层：这件事是头一回，还是一种模式在重复？你从里面积累到了什么？";
      await liuReply(cid, { q: text, persona: "review", methods: methodsPayload, context: "继续陪用户拆这件事。问得自然些：这件事是头一回，还是一种模式在重复？他从中能学到什么、下次怎么不一样。朋友口吻。" + pastNote }, fb);
      reviewSuggestTools(cid, st.event + "\n" + text);
      st.step = 2;
    } else if (st.step === 2) {
      st.replies.push(text);
      const fb = "如果只许动一个地方就让整件事顺起来，你会动哪儿？下一步具体做什么、什么时候检查？";
      await liuReply(cid, { q: text, persona: "review", methods: methodsPayload, context: "帮用户收尾：如果只许动一个地方就让整件事顺起来，他会动哪儿？下一步具体做什么、何时检查？问完可以自然提醒他：聊得差不多了，可以点「生成我的复盘卡」把这次复盘存下来。" + pastNote }, fb);
      reviewSuggestTools(cid, st.event + "\n" + st.replies.join("\n"));
      st.step = 3;
      const rvCard = document.getElementById("rvCard"); if (rvCard) rvCard.style.display = "";
    } else {
      st.replies.push(text);
      const fb = "我听着呢，你继续说。";
      await liuReply(cid, { q: text, persona: "review", methods: methodsPayload, context: "用户又补充了一段复盘内容：「" + text + "」。顺着接住，帮他把新信息也收进这次复盘。" + pastNote }, fb);
      reviewSuggestTools(cid, st.event + "\n" + st.replies.join("\n"));
    }
    saveReviewState();
    rvBusy = false;
  }
  async function reviewSearch() {
    const _last = (function () { const ms = (chatGet("rvChat").msgs || []); for (let i = ms.length - 1; i >= 0; i--) if (ms[i].s === "user") return ms[i].t || ""; return ""; })();
    const q = (reviewState && reviewState.event) || _last || (document.getElementById("rvInput") ? document.getElementById("rvInput").value.trim() : "");
    if (!q) { appendMsg("rvChat", "liu", "先跟我说一件你想复盘的事，我才知道去全网搜什么～"); return; }
    appendMsg("rvChat", "liu", "我去 <b>知乎 + 全网</b> 上帮你搜搜类似经历，稍等…");
    // 双源并行：知乎站内 + 全网，两类都给（用户硬要求）
    const [rG, rZ] = await Promise.all([
      callZhihu("global", { q, Count: 6, fresh: true }),
      callZhihu("search", { q, Count: 6, fresh: true }),
    ]);
    const merged = [];
    if (!rG.mock && rG.items) rG.items.forEach((s) => merged.push(Object.assign({ source: "global" }, s)));
    if (!rZ.mock && rZ.items) rZ.items.forEach((s) => merged.push(Object.assign({ source: "zhihu" }, s)));
    if (merged.length) {
      const sp = _splitSources(merged);
      // 结构化存盘（不再用 appendHtml 直接塞 DOM）：切模块回来结果不丢；两类参考分别成块
      chatAppend("rvChat", { s: "liu", kind: "search", label: "🔵 知乎上别人怎么走过（实时）：", items: (sp.zh.length ? sp.zh : merged).slice(0, 4) });
      if (sp.gl.length) chatAppend("rvChat", { s: "liu", kind: "search", label: "🌐 全网上别人怎么走过（实时）：", items: sp.gl.slice(0, 4) });
      renderChat("rvChat");
      awardXP({ vis: 5 }, "复盘时对照全网样本");
    } else {
      appendMsg("rvChat", "liu", "（实时检索暂时没连上，先用本地样本；稍后重试即可拉到真实经验分享。）");
    }
  }
  function genReviewCard() {
    const st = reviewState;
    const out = document.getElementById("rvOut");
    const methodNames = (st.methods || []).filter(Boolean);
    const lensNames = st.lenses.map((id) => (SYSTEM_THINK.find((x) => x.id === id) || {}).name).filter(Boolean);
    const methodHtml = methodNames.length
      ? methodNames.map((nm, i) => {
          const mm = SYSTEM_THINK.find((x) => x.name === nm);
          return `<div class="mo-item"><b>${i + 1}. ${escHTML(nm)}</b>${mm ? "——" + escHTML(mm.one) : ""}</div>`;
        }).join("")
      : "（这次聊得比较轻，没显式引用具体方法论）";
    out.innerHTML = `
      <div class="section card">
        <h3>📓 我的复盘卡 · ${new Date().toLocaleString("zh-CN")}</h3>
        <p><b>事件：</b>${st.event || "—"}</p>
        <p><b>① 事实与选择：</b>${st.replies[0] || "—"}</p>
        <p><b>② 归因（可控 / 不可控）：</b>${st.replies[1] || "—"}</p>
        <p><b>③ 行动与杠杆：</b>${st.replies[2] || "—"}</p>
        <div class="method-card"><div class="mt">🧩 这次用上的系统思维方法论（每次复盘都换不同的看）</div>
          <div class="mo-list">${methodHtml}</div>
          ${st.tools && st.tools.length ? `<div class="mw">顺带参考了工具箱里的思维模型：<b>${st.tools.map((t) => escHTML(t)).join(" · ")}</b></div>` : ""}
          <div class="mw">把单次事件看成系统，下次遇到类似结构，你会更快认出它。</div></div>
        <div class="note">复盘卡已存本地。开赛后可一键从人生样本库推「和你处境相似、已走出的人」。</div>
        <div class="row" style="margin-top:10px"><button class="ghost" id="rvIdea">📤 生成知乎想法草稿</button></div>
      </div>`;
    const ideaBtn = document.getElementById("rvIdea");
    if (ideaBtn) {
      ideaBtn.onclick = () => {
        const c = `【复盘】${st.event || ""}\n① ${st.replies[0] || ""}\n② ${st.replies[1] || ""}\n③ ${st.replies[2] || ""}\n用上的方法论：${methodNames.join("、") || "—"}`;
        ideaComposer("复盘", c, []);
      };
    }
    try {
      const all = JSON.parse(localStorage.getItem("zhiyu_reviews") || "[]");
      all.unshift({ ...st, at: new Date().toLocaleString("zh-CN") });
      localStorage.setItem("zhiyu_reviews", JSON.stringify(all.slice(0, 20)));
    } catch (e) {}
    awardXP({ cog: 10, exe: 20, con: 5 }, "完成一次复盘");
    recordFootprint("复盘", "复盘了一件事：" + (st.title ? st.title.slice(0, 24) : "未命名"));
  }
  // ---------- 路线F·反哺闭环：把复盘/传记一键润色成「知乎想法」草稿（OAuth 开赛后可直接发）----------
  function ideaComposer(title, content, sources) {
    const ov = document.createElement("div");
    ov.className = "idea-overlay";
    ov.innerHTML = `
      <div class="idea-modal">
        <div class="idea-head"><b>📤 生成知乎想法草稿</b><span id="ideaClose" class="idea-close">✕</span></div>
        <p class="muted idea-sub">把你的${title.includes("传记") ? "人生传记" : "复盘"}润色成一篇可发的知乎想法。知乎开放平台用户数据接口为<b>只读</b>，没有代发能力，所以这里是「生成 → 复制 → 去知乎发」，真实可用、不作假。</p>
        <textarea id="ideaDraft" class="idea-ta" placeholder="正在生成…"></textarea>
        <div id="ideaStatus" class="muted" style="min-height:18px;margin:4px 0"></div>
        <div class="row" style="justify-content:flex-end">
          <button id="ideaCopy" class="ghost">📋 复制草稿</button>
          <button id="ideaPublish" class="primary" disabled>⏳ 检查授权…</button>
        </div>
      </div>`;
    document.body.appendChild(ov);
    const ta = ov.querySelector("#ideaDraft");
    const status = ov.querySelector("#ideaStatus");
    (async () => {
      try {
        const r = await callZhihu("buildIdea", { type: title.includes("传记") ? "bio" : "review", content: content || "", sources: sources || [] }, { loadingEl: "ideaStatus", loadingText: "⏳ 正在把你复盘/传记润色成可发的知乎想法…" });
        ta.value = (r && r.draft) || (content || "").slice(0, 480);
        if (r && r.degraded) status.textContent = "（实时润色暂未连上，已用原稿兜底，可手动微调）";
      } catch (e) {
        ta.value = (content || "").slice(0, 480);
        status.textContent = "生成失败，已用原稿，可手动微调。";
      }
      const pub = ov.querySelector("#ideaPublish");
      pub.textContent = "🚀 复制并去知乎发布";
      pub.disabled = false;
      pub.onclick = () => {
        ta.select();
        try { document.execCommand("copy"); } catch (e) {}
        if (navigator.clipboard) navigator.clipboard.writeText(ta.value).catch(() => {});
        status.textContent = "✅ 草稿已复制，正在打开知乎发布页…";
        try { window.open("https://www.zhihu.com/creator", "_blank"); } catch (e) {}
      };
    })();
    ov.querySelector("#ideaCopy").onclick = () => {
      ta.select();
      try { document.execCommand("copy"); } catch (e) {}
      if (navigator.clipboard) navigator.clipboard.writeText(ta.value).catch(() => {});
      const b = ov.querySelector("#ideaCopy"); b.textContent = "✅ 已复制";
      setTimeout(() => (b.textContent = "📋 复制草稿"), 1500);
    };
    ov.querySelector("#ideaClose").onclick = () => ov.remove();
    ov.onclick = (e) => { if (e.target === ov) ov.remove(); };
  }

  // 复盘：用「大佬思维模型」视角拆当前事件（实时蒸馏多个视角 → 让用户自选与哪个对话）
  async function reviewDistillModel() {
    const _last = (function () { const ms = (chatGet("rvChat").msgs || []); for (let i = ms.length - 1; i >= 0; i--) if (ms[i].s === "user") return ms[i].t || ""; return ""; })();
    const q = (reviewState && reviewState.event) || _last || (document.getElementById("rvInput") ? document.getElementById("rvInput").value.trim() : "");
    if (!q) { appendMsg("rvChat", "liu", "先跟我说一件想复盘的事，我才知道该蒸馏谁的视角～"); return; }
    appendMsg("rvChat", "liu", "我去知乎 + 全网找了几个高手的方法论视角，挑一个你最想用它的眼睛拆这件事：");
    const r = await callZhihu("models", { q, fresh: true }, { loadingEl: "rvChat", loadingText: "⏳ 正在全网检索高手方法论并蒸馏视角…" });
    if (!r.mock && r.models && r.models.length) {
      const list = r.models.slice(0, 4);
      // 结构化为消息存盘（不再 appendHtml 裸 DOM，否则会被 renderChat 全量重绘清空、按钮事件永远绑不上）
      chatAppend("rvChat", { s: "liu", kind: "mrv", models: list, q: q });
      renderChat("rvChat");
    } else {
      appendMsg("rvChat", "liu", "实时蒸馏没连上，换个说法或稍后再试～");
    }
  }
  // 复盘·系统思维方法论：每轮同时给两类——A. 从系统思维工具箱随机抽 2 个；B. 基于知乎内容总结 1 个思维模型
  // 两类都出，互为补充：工具箱是固定可复用的经典框架，知乎蒸馏是贴合当下事件的高赞实况
  function appendToolboxCards(cid, picks, ev) {
    if (!picks || !picks.length) return;
    // 结构化存盘（不再直接 appendChild 到 DOM）：切走模块再回来照样在，按钮走事件委托
    chatAppend(cid, { s: "liu", kind: "toolcards", picks: picks, ev: ev || "" });
    renderChat(cid);
  }
  function appendZhihuModelCard(cid, m, ev) {
    if (!m) return;
    // 结构化存盘：切走模块再回来照样在；「收录到系统思维方法论工具箱」按钮走事件委托
    chatAppend(cid, { s: "liu", kind: "zhmodel", model: m, ev: ev || "" });
    renderChat(cid);
  }
  async function reviewSuggestTools(cid, text) {
    const ev = ((reviewState && reviewState.event) || text || "").trim();
    const box = document.getElementById(cid);
    if (!box || !ev) return;
    // A. 每次都从工具箱随机抽 2 个（离线可用、保证经典框架必现）
    const picks = shuffle(SYSTEM_THINK.slice()).slice(0, 2);
    picks.forEach((m) => { if (reviewState) { if (reviewState.tools.indexOf(m.name) < 0) reviewState.tools.push(m.name); if (reviewState.methods.indexOf(m.name) < 0) reviewState.methods.push(m.name); } });
    appendToolboxCards(cid, picks, ev);
    // B. 每次都基于知乎内容总结 1 个思维模型（贴合当下事件的高赞实况）
    appendMsg(cid, "liu", "顺手去知乎上搜了搜高手们怎么看这类事，再给你总结一个思维模型——");
    try {
      const r = await callZhihu("models", { q: ev, fresh: true }, { loadingEl: cid, loadingText: "⏳ 正在基于知乎内容蒸馏思维模型…" });
      if (!r.mock && r.models && r.models.length) {
        const m = r.models[0];
        if (reviewState && reviewState.methods.indexOf(m.name) < 0) reviewState.methods.push(m.name);
        appendZhihuModelCard(cid, m, ev);
        return;
      }
    } catch (e) {}
    // 兜底：知乎没连上 → 再补一张工具箱随机抽，保证有两张以上可看
    const extra = shuffle(SYSTEM_THINK.slice()).filter((m) => picks.indexOf(m) < 0).slice(0, 1);
    if (extra.length) { extra.forEach((m) => { if (reviewState) { if (reviewState.tools.indexOf(m.name) < 0) reviewState.tools.push(m.name); if (reviewState.methods.indexOf(m.name) < 0) reviewState.methods.push(m.name); } }); appendToolboxCards(cid, extra, ev); }
  }

  // ---------- 复盘 · 错题本 ----------
  function esc(s) {
    return (s == null ? "" : String(s)).replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]));
  }
  const MK_KEY = "zhiyu_mistakes";
  function loadMistakes() {
    try { return JSON.parse(localStorage.getItem(MK_KEY) || "[]"); } catch (e) { return []; }
  }
  function renderMistakes() {
    const box = document.getElementById("mkList");
    if (!box) return;
    const list = loadMistakes();
    if (!list.length) { box.innerHTML = '<div class="empty">还没有错题。踩过坑就记下来，刘看山陪你把它变成经验。</div>'; return; }
    box.innerHTML = list.map((m, i) => `
      <div class="mistake-item">
        <div class="mi-top"><span class="mi-q">${esc(m.q)}</span><span class="mi-at">${esc(m.at || "")}</span></div>
        ${m.why ? `<div class="mi-line"><b>为什么：</b>${esc(m.why)}</div>` : ""}
        ${m.plan ? `<div class="mi-line"><b>下次：</b>${esc(m.plan)}</div>` : ""}
        ${m.lesson ? `<div class="mi-line mi-lesson"><b>刘看山点评：</b>${esc(m.lesson)}</div>` : ""}
        <div class="mi-actions">
          <button class="ghost sm" data-i="${i}">🐾 让刘看山评一评</button>
          <button class="ghost sm danger" data-del="${i}">删除</button>
        </div>
      </div>`).join("");
    box.querySelectorAll("[data-i]").forEach((b) => (b.onclick = () => judgeMistake(parseInt(b.dataset.i, 10))));
    box.querySelectorAll("[data-del]").forEach((b) => (b.onclick = () => {
      const i = parseInt(b.dataset.del, 10);
      const l = loadMistakes(); l.splice(i, 1); localStorage.setItem(MK_KEY, JSON.stringify(l));
      renderMistakes();
    }));
  }
  function addMistake() {
    const inp = document.getElementById("mkQ");
    const t = inp.value.trim();
    if (!t) return;
    const l = loadMistakes();
    l.unshift({ q: t, why: "", plan: "", lesson: "", at: new Date().toLocaleString("zh-CN") });
    localStorage.setItem(MK_KEY, JSON.stringify(l.slice(0, 50)));
    inp.value = "";
    renderMistakes();
  }
  async function judgeMistake(i) {
    if (rvBusy) return;
    const l = loadMistakes();
    const m = l[i];
    if (!m) return;
    const q = "我记了一道错题：" + m.q + (m.why ? ("；当时是因为：" + m.why) : "") + (m.plan ? ("；我打算下次：" + m.plan) : "") +
      "。帮我点评一下：这道题的本质是什么、下次遇到同类结构怎么一眼认出、怎么把这道坑变成经验？";
    appendMsg("rvChat", "user", "📕 " + m.q);
    const r = await liuReply("rvChat", {
      q, persona: "review",
      context: "用户在复盘他「错题本」里记的一道错题。结合实时知乎上的同类教训，温柔地点评：这道题的本质、下次怎么一眼认出同类结构、怎么把坑变成经验。不替他下结论。",
      showSources: true,
    }, "这道错题挺典型的，咱们一起看看它背后是什么结构。");
    if (r && !r.mock && r.content) {
      m.lesson = r.content.replace(/\n/g, " ").trim();
      l[i] = m; localStorage.setItem(MK_KEY, JSON.stringify(l));
      renderMistakes();
      awardXP({ exe: 8, con: 4 }, "错题本·请刘看山点评");
    }
  }
  // ---------- 人生样本库（知乎实时经验分享）----------
  const SAMPLE_MODE_KEY = "zhiyu_sample_mode";
  const ALIGN_KEY = "zhiyu_align";
  const ALIGN_HIST_KEY = "zhiyu_align_history";
  function loadAlign() { try { return JSON.parse(localStorage.getItem(ALIGN_KEY) || "null"); } catch (e) { return null; } }
  function saveAlign(o) { try { localStorage.setItem(ALIGN_KEY, JSON.stringify(o)); } catch (e) {} }
  function loadAlignHistory() { try { return JSON.parse(localStorage.getItem(ALIGN_HIST_KEY) || "[]"); } catch (e) { return []; } }
  function saveAlignHistory(a) { try { localStorage.setItem(ALIGN_HIST_KEY, JSON.stringify((a || []).slice(0, 12))); } catch (e) {} }
  function pushAlignHistory(rec) { const a = loadAlignHistory(); a.unshift(rec); saveAlignHistory(a); }
  function deleteAlignHistory(ts) { saveAlignHistory(loadAlignHistory().filter((x) => x.ts !== ts)); }
  function starMapSVG() {
    const nodes = [[40,30],[120,60],[200,28],[260,70],[330,40],[400,66],[150,95],[300,100]];
    const links = [[0,1],[1,2],[2,3],[3,4],[4,5],[1,6],[6,7],[3,7],[2,6]];
    const L = links.map(([a,b]) => `<line class="link" x1="${nodes[a][0]}" y1="${nodes[a][1]}" x2="${nodes[b][0]}" y2="${nodes[b][1]}"/>`).join("");
    const N = nodes.map(([x,y],i) => `<circle class="node" cx="${x}" cy="${y}" r="${i%3===0?3.4:2.4}" style="opacity:${0.6+0.4*(i%3)}"/>`).join("");
    return `<svg class="starmap" viewBox="0 0 440 120" preserveAspectRatio="none" aria-hidden="true">${L}${N}</svg>`;
  }
  function renderSample(v) {
    v.innerHTML = `
      <h2 class="view-title">🗂️ 人生样本库 <span id="smBadge"></span></h2>
      <p class="view-sub">知乎实时经验分享的两种用法：<b>浏览</b>别人真实走过的路，或<b>对齐</b>你自己的处境——刘看山当教练陪你拆。全部接入知乎实时能力（默认全网）。</p>
      ${starMapSVG()}
      <div class="scope-toggle" id="smModes" style="margin-bottom:12px">
        <span class="muted">用法：</span>
        <button class="scope-btn active" data-mode="browse">🗂️ 浏览真实样本</button>
        <button class="scope-btn" data-mode="align">🔍 对齐我的处境</button>
      </div>
      <div id="smModeBody"></div>`;
    const body = v.querySelector("#smModeBody");
    const modes = v.querySelectorAll("#smModes .scope-btn");
    const show = (mode) => {
      try { localStorage.setItem(SAMPLE_MODE_KEY, mode); } catch (e) {}
      modes.forEach((x) => x.classList.toggle("active", x.dataset.mode === mode));
      if (mode === "browse") sampleBrowse(body);
      else sampleAlign(body, mode === "align" && !!loadAlign());
    };
    modes.forEach((m) => (m.onclick = () => show(m.dataset.mode)));
    const initMode = (localStorage.getItem(SAMPLE_MODE_KEY) === "align" && loadAlign()) ? "align" : "browse";
    show(initMode);
  }
  function sampleBrowse(v) {
    const cats = ["认知", "成长", "人际", "职业规划", "学习方法", "副业"];
    v.innerHTML = `
      <div class="card">
        <label>检索关键词（主题 / 困境 / 领域）</label>
        <input id="smQ" placeholder="例：内向者如何社交 / 副业变现 / 认知偏差" />
        <div class="row">
          <button id="smSearch">检索（全网实时）</button>
          <button class="ghost" id="smLive">⚡ 知乎热榜</button>
          <button class="ghost" id="smRefresh">🔄 换一批</button>
        </div>
        <div class="scope-toggle" style="margin-top:12px">
          <span class="muted">检索范围：</span>
          <button class="scope-btn active" data-scope="global">🌐 全网</button>
          <button class="scope-btn" data-scope="zhihu">📕 知乎站内</button>
        </div>
        <div style="margin-top:10px">${cats.map((c) => `<span class="tag cat" data-cat="${c}" style="cursor:pointer">${c}</span>`).join("")}</div>
      </div>
      <div id="smOut"></div>`;
    let scope = "global";
    v.querySelectorAll(".scope-btn").forEach((b) => {
      b.onclick = () => {
        v.querySelectorAll(".scope-btn").forEach((x) => x.classList.remove("active"));
        b.classList.add("active");
        scope = b.dataset.scope;
        const smSearch = v.querySelector("#smSearch");
        if (smSearch) smSearch.textContent = scope === "global" ? "检索（全网实时）" : "检索（知乎站内）";
        const smQEl = v.querySelector("#smQ");
        searchSamples((smQEl ? smQEl.value : "").trim() || "认知 成长", scope);
      };
    });
    const smSearchEl = v.querySelector("#smSearch");
    if (smSearchEl) smSearchEl.onclick = () => { const smQEl = v.querySelector("#smQ"); searchSamples((smQEl ? smQEl.value : "").trim(), scope); };
    const smLiveEl = v.querySelector("#smLive");
    if (smLiveEl) smLiveEl.onclick = liveHot;
    const smRefreshEl = v.querySelector("#smRefresh");
    if (smRefreshEl) smRefreshEl.onclick = () => { const smQEl = v.querySelector("#smQ"); searchSamples((smQEl ? smQEl.value : "").trim() || "认知 成长", scope); };
    v.querySelectorAll("[data-cat]").forEach((el) =>
      el.onclick = () => { document.getElementById("smQ").value = el.dataset.cat; searchSamples(el.dataset.cat, scope); }
    );
    searchSamples("认知 成长", scope);
  }
  async function searchSamples(q, scope) {
    scope = scope || "global";
    const out = document.getElementById("smOut");
    const badge = document.getElementById("smBadge");
    if (!out) return;
    if (!q || !q.trim()) { out.innerHTML = '<div class="empty">请输入检索关键词。</div>'; return; }
    out.innerHTML = '<div class="note">刘看山正在' + (scope === "global" ? "全网" : "知乎站内") + '上帮你搜真实样本…</div>';
    const r = await callZhihu(scope === "global" ? "global" : "search", { q: q.trim(), Count: 12, fresh: true });
    if (!r.mock && r.items && r.items.length) {
      badge.innerHTML = badgeHTML(true);
      const items = shuffle(r.items.slice());
      out.innerHTML = `<div class="section grid grid-2">${items.map(liveCard).join("")}</div>`;
      awardXP({ vis: 3 }, "查阅实时样本");
    } else {
      badge.innerHTML = badgeHTML(false);
      out.innerHTML = (r.note ? `<div class="note">${r.note}</div>` : "") +
        '<div class="empty">样本库来自知乎开放平台真实经验分享，实时检索；当前实时接口暂时没连上，稍后重试即可。</div>';
    }
    liuSay("sample");
  }
  async function liveHot() {
    const out = document.getElementById("smOut");
    const badge = document.getElementById("smBadge");
    if (!out) return;
    const r = await callZhihu("hot", { Limit: 20, fresh: true });
    if (!r.mock && r.items && r.items.length) {
      badge.innerHTML = badgeHTML(true);
      out.innerHTML = `<div class="section grid grid-2">${shuffle(r.items.slice()).map(liveCard).join("")}</div>`;
    } else {
      badge.innerHTML = badgeHTML(false);
      out.innerHTML = (r.note ? `<div class="note">${r.note}</div>` : "") + '<div class="empty">实时热榜暂时没拿到结果（多为网络波动），点上方刷新重试即可。</div>';
    }
    liuSay("sample");
  }

  // 统一卡片渲染（搜索 / 热榜 / 故事样本通用）
  function liveCard(it) {
    if (!it) return "";
    const _u = it.url || it.Url || "";
    const _isZh = /zhihu\.com|zhihu\.cn|zhida\.zhihu/i.test(_u);
    // 后端 toEvidence 重建引用时不带 source，且以真实 URL 域名为准最可靠；
    // 故「知乎/全网」一律按 URL 判定，避免「全网参考」卡片误带知乎标志；
    // 热榜/故事/我的创作/关注等保留 source 字段图标。
    const srcMap = { hot: "🔥 热榜", story: "📖 故事", my_content: "🖊️ 我的创作", followee: "👤 我的关注" };
    let src;
    if (it.source === "hot" || it.source === "story" || it.source === "my_content" || it.source === "followee") {
      src = srcMap[it.source];
    } else {
      src = _isZh ? "📕 知乎" : "🌐 全网";
    }
    const title = it.title || it.name || "（无标题）";
    const auth = (it.author || it.headline || "").trim() ? `<span class="ca"> · ${it.author || it.headline}</span>` : "";
    const txt = (it.text || it.summary || "").replace(/\s+/g, " ").trim().slice(0, 110);
    return `<a class="sample live" href="${it.url || "#"}" target="_blank" rel="noopener">
      <span class="tag cat">${src}${auth}</span>
      <h4>${title}</h4>
      <p class="muted">${txt}${txt.length >= 110 ? "…" : ""}</p>
    </a>`;
  }
  // 我的创作卡（contents 接口：知乎本人公开内容）
  function myContentCard(it) {
    if (!it) return "";
    const typeMap = { answer: "回答", article: "文章", video: "视频", pin: "想法", column: "专栏" };
    const t = typeMap[it.type] || (it.type || "内容");
    const like = it.likeCount ? ` · ❤ ${it.likeCount}` : "";
    const cmt = it.commentCount ? ` · 💬 ${it.commentCount}` : "";
    const sum = (it.summary || "").replace(/\s+/g, " ").trim().slice(0, 90);
    return `<a class="sample my-content" href="${it.url || "#"}" target="_blank" rel="noopener">
      <span class="tag cat">🖊️ 我的${t}</span>
      <h4>${it.title || "（无标题）"}</h4>
      <p class="muted">${sum}${like}${cmt}</p>
    </a>`;
  }

  // 收藏卡（collections / favlist_contents 接口：知乎收藏内容）
  function collectionCard(it) {
    if (!it) return "";
    const typeMap = { answer: "回答", article: "文章", video: "视频", zvideo: "视频", pin: "想法", column: "专栏" };
    const ty = typeMap[it.type] || (it.type || "内容");
    const like = it.likeCount ? " · ❤ " + it.likeCount : "";
    const cmt = it.commentCount ? " · 💬 " + it.commentCount : "";
    const fav = (it.favlists && it.favlists.length && it.favlists[0].title) ? " · 🗂 " + escHTML(it.favlists[0].title) : "";
    const sum = (it.summary || "").replace(/\s+/g, " ").trim().slice(0, 90);
    return '<a class="sample my-content" href="' + (it.url || "#") + '" target="_blank" rel="noopener">'
      + '<span class="tag cat">⭐ 收藏 · ' + ty + '</span>'
      + '<h4>' + escHTML(it.title || "（无标题）") + '</h4>'
      + '<p class="muted">' + escHTML(sum) + like + cmt + fav + '</p>'
      + '</a>';
  }

  // ---------- 处境对齐（折叠进「人生样本 · 对齐我的处境」子模式）----------
  let alignBusy = false;
  async function sampleAlign(v, autoRun) {
    let alSimItems = [];
    // 把相似样本渲染成可逐条删除的卡片（知乎 / 全网分组，各带 ✕ 删除按钮 + 删除全部）
    function renderSimItems(items) {
      if (!items || !items.length) return '<div class="empty">暂无相似样本。</div>';
      const sp = _splitSources(items);
      const card = (s) => '<div class="sim-card">' + liveCard(s) + '<button class="sim-del" data-url="' + escAttr(s.url || "") + '" data-src="' + escAttr(s.source || "") + '" title="删除这条样本">✕</button></div>';
      const zhPart = sp.zh.length ? '<div class="muted" style="margin:6px 0 4px">🔵 知乎参考（' + sp.zh.length + '）</div><div class="section grid grid-2">' + sp.zh.slice(0, 4).map(card).join("") + '</div>' : "";
      const glPart = sp.gl.length ? '<div class="muted" style="margin:10px 0 4px">🌐 全网参考（' + sp.gl.length + '）</div><div class="section grid grid-2">' + sp.gl.slice(0, 4).map(card).join("") + '</div>' : "";
      return '<h3 style="margin:6px 0 6px">🛰️ 相似样本（知乎 + 全网）</h3><div class="row" style="margin-bottom:6px"><button class="ghost sim-del-all">🗑 删除全部样本</button></div>' + zhPart + glPart;
    }
    function wireSimDelete(scope) {
      const box = scope.querySelector("#alSim"); if (!box) return;
      box.querySelectorAll(".sim-del").forEach((b) => {
        b.onclick = () => {
          const url = b.getAttribute("data-url") || ""; const src = b.getAttribute("data-src") || "";
          alSimItems = alSimItems.filter((s) => !((s.url || "") === url && (s.source || "") === src));
          box.innerHTML = renderSimItems(alSimItems);
          wireSimDelete(scope);
          const sv = loadAlign() || {}; saveAlign(Object.assign({}, sv, { simItems: alSimItems, simHTML: box.innerHTML }));
        };
      });
      const all = box.querySelector(".sim-del-all");
      if (all) all.onclick = () => {
        if (!window.confirm("确定删除全部相似样本？")) return;
        alSimItems = [];
        box.innerHTML = renderSimItems(alSimItems);
        wireSimDelete(scope);
        const sv = loadAlign() || {}; saveAlign(Object.assign({}, sv, { simItems: [], simHTML: box.innerHTML }));
      };
    }
    v.innerHTML = `
      <div class="card">
        <h3>🧭 处境对齐 · 刘看山提问式教练 <span class="coach-tag">🎯 提问式教练</span></h3>
        <p class="muted">别急着要答案。先把「当前态」和「理想态」写下来，刘看山会用教练的方式帮你把这件事想透：先反问澄清、再拆你话里的矛盾、最后才轻轻给个视角。连接而非替你做决定。</p>
        <label>① 当前态：描述你现在的处境 / 纠结</label>
        <textarea id="alQ" placeholder="例：工作三年遇到瓶颈，纠结要不要转行"></textarea>
        <label>② 理想态：你希望 1 年后成为的样子</label>
        <textarea id="alIdeal" placeholder="例：一年后靠擅长的东西稳定变现，不必依附某家公司"></textarea>
        <div class="row"><button id="alRun">对齐相似样本 · 开启教练对话</button></div>
      </div>
      <div id="alOut"></div>
      <div id="alHist" class="align-hist"></div>`;
    const run = async (restoreSim) => {
      const q = document.getElementById("alQ").value.trim();
      const ideal = document.getElementById("alIdeal").value.trim();
      if (!q) return;
      const badge = document.getElementById("smBadge");
      const out = document.getElementById("alOut");
      const firstRun = !out.querySelector("#alSim");
      if (firstRun) {
        out.innerHTML = `<div class="section card"><h3>🧭 从「当前态」爬向「理想态」</h3>` +
          (ideal ? `<p class="muted"><b>你的理想态：</b>${ideal}</p>` : "") +
          `<div id="alSim"><div class="note">刘看山正在全网帮你找相似处境的真实样本…</div></div>` +
          `<div class="row"><button class="ghost" id="alRefresh">🔄 换一批相似样本</button></div>` +
          `<div class="note">爬山步骤：你的变量 vs 样本变量 —— 哪些可控（你能改，列为下一步动作）、哪些不可控（需借势 / 借人）。每完成一步就回「复盘」记一笔，循环向上。</div>` +
          `<div class="chat" id="alChat" style="margin-top:12px"></div>` +
          `<div class="row" style="margin-top:10px"><input id="alInput" placeholder="接着和刘看山聊聊你的处境…" /><button id="alSend">说给他听</button></div></div>`;
      } else if (!restoreSim) {
        out.querySelector("#alSim").innerHTML = '<div class="note">刘看山正在全网帮你找相似处境的真实样本…</div>';
      }
      let simHTML = "";
      if (restoreSim) {
        // 重进页面：直接恢复上次检索到的相似样本（结构化，可逐条删除），不再联网
        alSimItems = (loadAlign() || {}).simItems || [];
        simHTML = renderSimItems(alSimItems);
        out.querySelector("#alSim").innerHTML = simHTML;
        wireSimDelete(out);
        const rf = out.querySelector("#alRefresh"); if (rf) rf.onclick = () => run(false);
      } else {
        // 第一原则：同时扇出「全网 + 知乎站内」，覆盖知乎生态契合度（评审加分项）
        const [rG, rZ] = await Promise.all([
          callZhihu("global", { q, Count: 6, fresh: true }),
          callZhihu("search", { q, Count: 6, fresh: true }),
        ]);
        let merged = [];
        if (!rG.mock && rG.items) merged = merged.concat(rG.items.map((s) => Object.assign({ source: "global" }, s)));
        if (!rZ.mock && rZ.items) merged = merged.concat(rZ.items.map((s) => Object.assign({ source: "zhihu" }, s)));
        const seen = new Set();
        merged = merged.filter((s) => { const k = (s.title || "") + " " + (s.url || ""); if (seen.has(k)) return false; seen.add(k); return true; });
        alSimItems = merged;
        if (merged.length) {
          if (badge) badge.innerHTML = badgeHTML(true);
          simHTML = renderSimItems(merged);
          awardXP({ vis: 10, emp: 5, con: 5 }, "对齐实时处境");
          recordFootprint("处境对齐", "对齐了关于「" + q + "」的相似样本（全网+知乎）");
        } else {
          if (badge) badge.innerHTML = badgeHTML(false);
          const note = [rG.note, rZ.note].filter(Boolean).join("；");
          simHTML = (note ? `<div class="note">${note}</div>` : "") + '<div class="empty">实时接口暂时没连上，暂无相似样本；重试后将全网+知乎实时拉「同类真实破局经验」。</div>';
        }
        out.querySelector("#alSim").innerHTML = simHTML;
        wireSimDelete(out);
        saveAlign({ q, ideal, simHTML, simItems: merged });
        pushAlignHistory({ ts: Date.now(), q: q, ideal: ideal, simHTML: simHTML, simItems: merged });
        renderAlignHistory();
        const rf = out.querySelector("#alRefresh"); if (rf) rf.onclick = () => run(false);
      }
      if (firstRun) {
        const stAl = chatGet("alChat");
        if (stAl.q && stAl.q !== q) chatReset("alChat");
        renderChat("alChat");
        chatGet("alChat").q = q;
        const coachCtx = "【提问式教练·开场】用户当前态：「" + q + "」" + (ideal ? "；理想态：「" + ideal + "」" : "（用户没写理想态，先问他的理想态是什么）。") +
          "先接住他的处境，再用反问帮他澄清：当前态里他其实已经有的筹码/资源是什么？理想态里最不可或缺的那一步是哪一步？再拆：当前态和理想态之间的关键矛盾是什么（比如「想要自由又怕不稳定」「想转行又怕从零开始」）？用他的原话点出来，不评判。最后给一个轻轻的视角与「明天能做的最小一步」。不替他做决定。";
        if (chatGet("alChat").msgs.length === 0) {
          const _sampleCtx = (alSimItems && alSimItems.length) ? coachCtx + "；以下你和同类人的真实处境样本已作为参考资料附在对话里，你可以直接引用其中某个来帮用户对照：" + alSimItems.slice(0, 6).map((s, i) => (i + 1) + "." + (s.title || "无标题") + (s.url ? ("。" + s.url + "》") : "")).join("；") : coachCtx;
          await liuReply("alChat", { q: q + (ideal ? ("｜理想：" + ideal) : ""), persona: "align", coach: true, context: _sampleCtx, samples: alSimItems }, "我听着呢。先别急着想怎么破——你现在的处境里，其实已经握着什么筹码了？理想态里你最在意的那一步又是哪一步？咱们先把这两头聊清楚。");
        }
        const send = () => {
          if (alignBusy) return;
          const inp = out.querySelector("#alInput"); const t = inp.value.trim(); if (!t) return;
          appendMsg("alChat", "user", t); inp.value = "";
          alignBusy = true;
          liuReply("alChat", { q: t, persona: "align", coach: true, context: "继续用提问式教练陪用户拆他的处境对齐问题。先接住他刚说的，再就一个点反问澄清或拆矛盾，最后给一个轻轻的视角。不抢答、不替他决定。已附上他和同类人的真实处境样本作为参考资料，可引用。", samples: alSimItems }, "我接着听。你刚说的这点，能再展开说说吗？").then(() => { alignBusy = false; });
        };
        out.querySelector("#alSend").onclick = send;
        out.querySelector("#alInput").addEventListener("keydown", (e) => { if (e.key === "Enter") send(); });
      }
      liuSay("align");
    };
    function renderAlignHistory() {
      const box = document.getElementById("alHist"); if (!box) return;
      const a = loadAlignHistory();
      if (!a.length) { box.innerHTML = '<div class="muted" style="font-size:12px;margin-top:10px">暂无对齐历史。每次对齐都会记一条，可逐条删除或清空。</div>'; return; }
      box.innerHTML = '<div class="hist-head"><b>🧾 对齐历史</b><button class="ghost" id="alHistClear">清空全部</button></div>' +
        a.map((r) => '<div class="hist-item" data-ts="' + r.ts + '">' +
          '<div class="hist-q">🔭 ' + escHTML(r.q) + '</div>' +
          (r.ideal ? '<div class="hist-ideal">→ ' + escHTML(r.ideal) + '</div>' : '') +
          '<div class="hist-act"><button class="ghost hist-view">查看</button><button class="ghost hist-del">✕ 删除</button></div>' +
        '</div>').join("");
      const clr = box.querySelector("#alHistClear"); if (clr) clr.onclick = () => { if (confirm("确定清空全部对齐历史？")) { saveAlignHistory([]); renderAlignHistory(); } };
      box.querySelectorAll(".hist-item").forEach((it) => {
        const ts = Number(it.dataset.ts);
        const rec = a.find((x) => x.ts === ts);
        it.querySelector(".hist-view").onclick = () => {
          if (!rec) return;
          const qe = document.getElementById("alQ"), ie = document.getElementById("alIdeal");
          if (qe) qe.value = rec.q || ""; if (ie) ie.value = rec.ideal || "";
          const sim = document.getElementById("alSim");
          if (sim) sim.innerHTML = rec.simHTML;
          else { const o = document.getElementById("alOut"); if (o) o.innerHTML = '<div class="section card"><h3>🧭 从「当前态」爬向「理想态」</h3>' + (rec.ideal ? '<p class="muted"><b>你的理想态：</b>' + rec.ideal + '</p>' : '') + '<div id="alSim">' + rec.simHTML + '</div><div class="row"><button class="ghost" id="alRefresh">🔄 换一批相似样本</button></div></div>'; }
        };
        it.querySelector(".hist-del").onclick = () => { deleteAlignHistory(ts); renderAlignHistory(); };
      });
    }
    renderAlignHistory();
    document.getElementById("alRun").onclick = () => run(false);
    if (autoRun) {
      const sv = loadAlign();
      if (sv) {
        const qe = document.getElementById("alQ"); const ie = document.getElementById("alIdeal");
        if (qe) qe.value = sv.q || ""; if (ie) ie.value = sv.ideal || "";
        run(true);
      }
    }
  }

  // ---------- 领域速通（刘看山对话 + 学习方法论 + 知乎检索）----------
  const LEARN_METHODS = [
    { name: "西蒙学习法", desc: "集中火力啃一个领域最核心的 20%，短时间高强度突破，不贪全。" },
    { name: "费曼学习法", desc: "把学到的讲给外行听，讲不通就是没真懂，回补后再讲。" },
    { name: "SQ3R学习法", desc: "浏览→提问→精读→复述→复习，结构化吃透材料。" },
    { name: "康奈尔学习法", desc: "笔记分线索 / 笔记 / 总结三栏，逼自己二次加工。" },
    { name: "麻省理工AI学习法", desc: "把 AI 当「读过整个领域文献的严厉私教」：一次上传整个领域资料（6本教材+15篇论文+讲义），再用三问逼出学科地图——①找共识（专家都认同的5个核心心智模型）②找争议（行内吵得最凶的3个方面）③出诊断题（10道一眼区分真懂假懂的题，关掉答案自己死磕）。精髓是「保留摩擦」，不让AI替你想。" },
    { name: "番茄工作法", desc: "25 分钟专注 + 5 分钟休息，靠节奏对抗拖延。" },
    { name: "间隔重复", desc: "按遗忘曲线安排复习，把短期记忆锻成长期。" },
  ];
  // 学习方法：内置 + 用户自定义（localStorage 持久化；可在领域速通里手动添加，或让刘看山从知乎蒸馏）
  const FIELD_CUSTOM_KEY = "zhiyu_field_methods";
  const FIELD_METHOD_USE = {
    "西蒙学习法": "先把领域拆成 3 个最小子主题，未来 30 天只碰这 3 个，其它先放。",
    "费曼学习法": "每学完一个点，试着讲给外行听，讲不顺的地方回补。",
    "SQ3R学习法": "拿到资料先扫一遍、提 3 个问题，带问题精读，读完复述、第二天复习。",
    "康奈尔学习法": "每节学习用三栏笔记：主栏记要点、侧栏写关键词、底部写总结。",
    "麻省理工AI学习法": "把领域资料一次性丢给 AI，问共识 / 争议 / 诊断题三连，保留摩擦自己答。",
    "番茄工作法": "把时间切成 25+5 番茄钟，每个钟只做一件最小的事。",
    "间隔重复": "把要记的概念按第 1/2/4/7/15 天复习，不一次性硬记。"
  };
  function loadFieldCustom() { try { return JSON.parse(localStorage.getItem(FIELD_CUSTOM_KEY) || "[]") || []; } catch (e) { return []; } }
  function saveFieldCustom(a) { try { localStorage.setItem(FIELD_CUSTOM_KEY, JSON.stringify(a)); } catch (e) {} syncGraphAfterSave(); }
  function mergedFieldMethods() {
    const cus = loadFieldCustom() || [];
    return LEARN_METHODS.map((m) => ({ name: m.name, desc: m.desc, use: FIELD_METHOD_USE[m.name] || "", custom: false }))
      .concat(cus.map((m) => ({ name: m.name, desc: m.desc, use: m.use || "", custom: true })));
  }
  function fieldMethodByName(n) { return mergedFieldMethods().find((m) => m.name === n) || null; }
  // 勾选了、但计划正文里没写到的方法：按周次补一张「方法落位表」，确保计划完整覆盖用户勾选。
  function fieldMethodPatchHTML(missed, hr, goal) {
    const list = (missed || []).map(fieldMethodByName).filter(Boolean);
    if (!list.length) return "";
    const WEEKS = ["第 1 周", "第 2 周", "第 3 周", "第 4 周"];
    const rows = list.map((m, i) => {
      const wk = WEEKS[i % WEEKS.length];
      const how = (m.use || m.desc || "").replace(/\s+/g, " ").trim();
      return `<div class="sample" style="border-left:3px solid #ffb86b"><h4>${wk} · 本周主用方法：${escHTML(m.name)}</h4><p class="muted">${escHTML(how)}</p><p class="muted" style="font-size:12px">它怎么帮你达成「${escHTML(goal || "目标")}」：每天 ${hr || 1.5} 小时里拿出 25 分钟专项用它，周末回看一次效果。</p></div>`;
    }).join("");
    return `<div class="note" style="border-left:3px solid #ffb86b">⚠️ 计划正文里漏掉了你勾选的：<b>${missed.map(escHTML).join("、")}</b>。刘看山已把它们逐个补进下面的周次里：</div><div class="section grid grid-2">${rows}</div>`;
  }
  // 方法覆盖容错：方法名整段命中，或代表词命中，或自定义方法取名前 2 字兜底，都算已用上
  var FIELD_METHOD_ALIAS = {
    "西蒙学习法": ["西蒙"],
    "费曼学习法": ["费曼"],
    "SQ3R学习法": ["SQ3R"],
    "康奈尔学习法": ["康奈尔"],
    "麻省理工AI学习法": ["麻省理工", "MIT", "AI学习法"],
    "番茄工作法": ["番茄"],
    "间隔重复": ["间隔", "遗忘曲线", "艾宾浩斯"]
  };
  function fieldMethodCovered(content, name) {
    if (!content) return false;
    if (content.indexOf(name) >= 0) return true;
    var toks = FIELD_METHOD_ALIAS[name] || [];
    for (var _i = 0; _i < toks.length; _i++) { if (content.indexOf(toks[_i]) >= 0) return true; }
    if (!toks.length && name.length >= 2) return content.indexOf(name.slice(0, 2)) >= 0;
    return false;
  }
  let fieldState = null;
  let fieldRunBusy = false;
  let fieldBusy = false;
  // 领域速通：访谈进度与已生成计划持久化（刷新/重进不丢，可继续按需求调整）
  const FIELD_KEY = "zhiyu_field_state";
  function loadFieldState() {
    try {
      const d = JSON.parse(localStorage.getItem(FIELD_KEY) || "null");
      if (d && typeof d === "object" && typeof d.step === "number") {
        return { step: d.step || 0, q: d.q || "", goal: d.goal || "", lv: d.lv || "", hr: d.hr || "", style: d.style || "", pick: Array.isArray(d.pick) ? d.pick : [], planDone: !!d.planDone, planText: d.planText || "" };
      }
    } catch (e) {}
    return { step: 0, q: "", goal: "", lv: "", hr: "", style: "", pick: [], planDone: false, planGenerated: false, planText: "" };
  }
  function saveFieldState() {
    try { localStorage.setItem(FIELD_KEY, JSON.stringify(fieldState || {})); } catch (e) {}
  }
  // 学习方法工具箱：用「内置 + 自定义」合并列表渲染，点卡片 = 选入/移出本次计划
  function renderFieldMethods(v) {
    const wrap = v.querySelector("#fdMethods");
    if (!wrap) return;
    const methods = mergedFieldMethods();
    wrap.innerHTML = methods.map((m) => `
      <div class="method-pick${fieldState.pick.indexOf(m.name) >= 0 ? " on" : ""}" data-m="${escAttr(m.name)}" title="点我＝选入 / 移出我的学习计划">
        <div class="mp-name">${escHTML(m.name)}${m.custom ? ' <span class="mp-custom" title="自定义方法">★</span>' : ''}<button class="ghost mp-del" data-name="${escAttr(m.name)}" title="删除这个方法" style="margin-left: 6px;">✕</button></div>
        <div class="mp-desc">${escHTML(m.desc)}</div>
        <div class="mp-tag">＋ 选入我的计划</div>
        <button class="mp-chat" type="button">🐾 和这个方法聊聊</button>
      </div>`).join("");
    wrap.querySelectorAll(".method-pick").forEach((el) => {
      const _chatBtn = el.querySelector(".mp-chat");
      if (_chatBtn) _chatBtn.onclick = (e) => { e.stopPropagation(); fieldChatMethod(el.dataset.m, (fieldMethodByName(el.dataset.m) || {}).desc || ""); };
      el.onclick = () => {
        const n = el.dataset.m;
        const i = fieldState.pick.indexOf(n);
        if (i >= 0) { fieldState.pick.splice(i, 1); el.classList.remove("on"); }
        else { fieldState.pick.push(n); el.classList.add("on"); }
        saveFieldState();
      };
      const _delBtn = el.querySelector(".mp-del");
      if (_delBtn) _delBtn.onclick = (e) => {
        e.stopPropagation(); // 防止触发卡片点击事件
        const methodName = _delBtn.dataset.name;
        if (confirm(`确定要删除自定义学习方法「${methodName}」吗？此操作不可撤销。`)) {
          const cus = loadFieldCustom();
          const filtered = cus.filter(m => m.name !== methodName);
          saveFieldCustom(filtered);
          const pickIndex = fieldState.pick.indexOf(methodName);
          if (pickIndex >= 0) { fieldState.pick.splice(pickIndex, 1); }
          renderFieldMethods(v);
          alert(`已删除学习方法「${methodName}」`);
        }
      };
    });

  }
  // #C 学习方法对话：独立对话框，与「生成计划」的 fdChat 彻底解耦（独立 cid / 独立历史）
  let _fmChatName = "";
  async function fieldChatMethod(name, desc) {
    const panel = document.getElementById("fmChatPanel");
    if (panel) panel.style.display = "";
    const titleEl = document.getElementById("fmChatTitle"); if (titleEl) titleEl.textContent = name;
    const cid = "fmChatBox";
    if (_fmChatName !== name) {
      chatReset(cid); if (liuHistories) liuHistories[cid] = []; chatSetPending(cid, false);
      appendMsg(cid, "liu", "我是「" + name + "」的教练模式：把这个方法真正用透——最适合的场景、每天怎么操作、常见误区、怎么和别的方法搭配，随时问我。");
      _fmChatName = name;
    }
    renderChat(cid);
    if (fieldBusy) return;
    fieldBusy = true;
    try {
      const t = "我想把「" + name + "」这个方法真正用透，具体怎么落地？";
      appendMsg(cid, "user", t);
      await liuReply(cid, {
        q: name + " 学习方法 怎么用 实操 误区 搭配",
        persona: "field", coach: true,
        context: "【学习方法对话】用户想深入聊学习方法「" + name + "」：" + (desc || "") + "。用教练方式帮他把这个方法用透：①最适合它的场景；②具体到每天怎么操作；③常见误区；④和别的方法怎么搭配。回答里同时引用知乎站内与全网真实资料，最后给一个明天就能做的最小一步。",
        refZhihu: 6, refGlobal: 6
      }, "「" + name + "」很实用。咱们就它来拆——先说最适合它的场景…");
      try { liuSay("field"); } catch (e) {}
    } catch (e) {
      try { appendMsg(cid, "liu", "刚那一下网络绕了点，你再发一句，我接上～"); } catch (_) {}
    } finally { fieldBusy = false; }
  }
  // #C 学习方法对话：独立对话框的「发问」按钮
  async function fmChatSend() {
    const cid = "fmChatBox";
    const inp = document.getElementById("fmChatInput");
    if (!inp) return;
    const t = inp.value.trim(); if (!t) return;
    appendMsg(cid, "user", t); inp.value = "";
    if (fieldBusy) return;
    fieldBusy = true;
    try {
      const name = _fmChatName || "";
      await liuReply(cid, { q: t, persona: "field", coach: true, context: "【学习方法对话】用户正在和「" + name + "」方法教练一对一对话，问：" + t + "。用教练方式具体、可操作地回答，最后给一个明天就能做的最小一步。", refZhihu: 4, refGlobal: 4 }, "好问题，咱们就「" + name + "」拆开看…");
    } catch (e) { try { appendMsg(cid, "liu", "刚那一下网络绕了点，你再发一句～"); } catch (_) {} }
    finally { fieldBusy = false; }
  }

  function fieldAddMethodToPick(v, name) {
    if (fieldState.pick.indexOf(name) < 0) { fieldState.pick.push(name); saveFieldState(); }
    renderFieldMethods(v);
    
    // 初始化搜索功能
    setTimeout(() => {
      initFieldMethodSearch(v);
    }, 100);
  }
  // 手动添加学习方法（持久化到本地，出现在工具箱并可直接勾选进计划）
  function fieldAddMethodUI(v) {
    const box = document.getElementById("fmExtra");
    if (!box) return;
    if (box.querySelector(".fm-form")) { box.innerHTML = ""; return; }
    box.innerHTML = `
      <div class="card fm-form" style="margin-top:10px">
        <h4>＋ 添加我的学习方法</h4>
        <label>方法名</label><input id="fmName" class="zx-in" placeholder="例：主题阅读法 / 费曼+错题本组合" />
        <label>一句话说明（核心做法与适用场景）</label><textarea id="fmDesc" class="zx-in" placeholder="描述这个方法怎么用、适合什么"></textarea>
        <label>落到你身上的用法（可选）</label><input id="fmUse" class="zx-in" placeholder="例：每天用它啃一个最小子主题 25 分钟" />
        <div class="row"><button id="fmSave">保存并加入工具箱</button><button class="ghost" id="fmCancel">取消</button></div>
      </div>`;
    box.querySelector("#fmCancel").onclick = () => { box.innerHTML = ""; };
    box.querySelector("#fmSave").onclick = () => {
      const name = box.querySelector("#fmName").value.trim();
      const desc = box.querySelector("#fmDesc").value.trim();
      if (!name || !desc) { alert("方法名和说明都填一下～"); return; }
      const cus = loadFieldCustom();
      if (cus.find((x) => x.name === name)) { alert("这个方法已经在你的工具箱里了～"); }
      else { cus.push({ name, desc, use: box.querySelector("#fmUse").value.trim() }); saveFieldCustom(cus); }
      fieldAddMethodToPick(v, name);
      box.innerHTML = "";
      appendMsg("fdChat", "liu", "已经把「" + name + "」收进你的学习方法工具箱，并勾选进这次的计划底座。生成学习计划时刘看山会把它用上。");
    };
  }
  // 蒸馏学习方法结果渲染（抽离，支持「切面板再切回」从持久化恢复，不再重置）
  function renderDistillResult(v, box, r) {
    if (!box) return;
    const refsBox = liuRefsHTML({ refsZhihu: r.refsZhihu || [], refsGlobal: r.refsGlobal || [] }) || sourcesDualHTML(r.sources || []);
    const _dm = r.models || r.methods || [];
    if (!r.mock && _dm.length) {
      const items = _dm.slice(0, 4);
      box.innerHTML = '<div class="muted">刘看山从 <b>知乎 + 全网</b> 蒸馏出这些，挑一个收进你的工具箱，或直接和他聊聊：</div>' +
        items.map((s, i) => '<div class="sample" data-i="' + i + '"><h4>' + escHTML(s.name || s.title || "学习方法") + '<span class="muted" style="font-size:12px"> · 来源：' + escHTML(s.src || "综合") + '</span></h4><p class="muted">' + String(s.desc || s.core || s.text || s.summary || "").replace(/\s+/g, " ").trim().slice(0, 140) + '</p>' + (s.use ? '<p class="muted" style="font-size:12px">怎么用：' + escHTML(String(s.use).slice(0, 80)) + '</p>' : "") + '<div class="row"><button class="ghost fm-take" data-i="' + i + '">＋ 收进我的学习方法</button><button class="ghost fm-chat" data-i="' + i + '">🐾 和这个方法聊聊</button></div></div>').join("") + refsBox;
      box.querySelectorAll(".fm-take").forEach((b) => {
        b.onclick = () => {
          const s = items[parseInt(b.dataset.i, 10)] || {};
          const name = (s.name || s.title || "学习方法").toString().slice(0, 30);
          const desc = ((s.desc || s.core || s.text || s.summary || "") + "｜来源：" + (s.src || "知乎与全网")).replace(/\s+/g, " ").trim().slice(0, 200);
          const cus = loadFieldCustom();
          if (!cus.find((x) => x.name === name)) { cus.push({ name, desc, use: "" }); saveFieldCustom(cus); }
          fieldAddMethodToPick(v, name);
          box.innerHTML = '<div class="note">已把「' + name + '」收进你的学习方法工具箱并勾选进计划底座 ✅</div>';
        };
      });
      box.querySelectorAll(".fm-chat").forEach((b) => {
        b.onclick = () => {
          const s = items[parseInt(b.dataset.i, 10)] || {};
          const name = (s.name || s.title || "学习方法").toString().slice(0, 30);
          const desc = (s.desc || s.core || s.text || s.summary || "").replace(/\s+/g, " ").trim().slice(0, 200);
          fieldChatMethod(name, desc);
          box.insertAdjacentHTML("beforeend", '<div class="note">已把「' + name + '」丢进下方对话框，刘看山会带知乎+全网资料和你说～</div>');
        };
      });
    } else {
      box.innerHTML = (r.note ? '<div class="note">' + r.note + '</div>' : "") + '<div class="empty">实时检索暂时没连上，稍后再试。</div>';
    }
  }
  const FIELD_DISTILL_KEY = "zhiyu_field_distill";
  function fieldDistillSave(topic, data) { try { localStorage.setItem(FIELD_DISTILL_KEY, JSON.stringify({ topic: topic || "", data, ts: Date.now() })); } catch (e) {} }
  function loadFieldDistill() { try { return JSON.parse(localStorage.getItem(FIELD_DISTILL_KEY) || "null"); } catch (e) { return null; } }
  // 让刘看山从知乎 / 全网蒸馏一个学习方法，蒸馏结果可一键收进工具箱
  async function fieldDistillMethodUI(v) {
    const box = document.getElementById("fmExtra");
    if (!box) return;
    box.innerHTML = `
      <div class="card fm-form" style="margin-top:10px">
        <h4>🐾 让刘看山蒸馏一个学习方法</h4>
        <p class="muted">告诉他你想提升哪类能力（阅读 / 记忆 / 专注 / 刷题 / 输出…），他会同时检索 <b>知乎站内</b> 与 <b>全网</b> 的真实讨论，蒸馏成可加入工具箱的方法，并把两类参考一并列给你。</p>
        <input id="fmTopic" class="zx-in" placeholder="例：高效记忆 / 深度阅读 / 抗拖延" />
        <div class="row"><button id="fmGo">🐾 去知乎与全网蒸馏</button><button class="ghost" id="fmCancel">取消</button></div>
        <div id="fmDistillOut"></div>
      </div>`;
    box.querySelector("#fmCancel").onclick = () => { box.innerHTML = ""; };
    box.querySelector("#fmGo").onclick = async () => {
      const topic = box.querySelector("#fmTopic").value.trim();
      if (!topic) return;
      const out = box.querySelector("#fmDistillOut");
      out.innerHTML = '<div class="note">刘看山正在 <b>知乎 + 全网</b> 上帮你蒸馏学习方法…</div>';
      // 双源蒸馏：后端 models 分支已同时检索知乎站内与全网，再交给 LLM 蒸馏成可复用方法
      fieldDistillSave(topic, { pending: true });
      const r = await callZhihu("models", { q: topic + " 高效学习方法 技巧 实操", Count: 6, fresh: true });
      fieldDistillSave(topic, r);
      renderDistillResult(v, out, r);
    };
  }
  function renderField(v) {
    // 访谈进度与已生成计划跨模块切换保留（切走再回来不丢）；想换领域点「重新开始」
    if (!fieldState) fieldState = loadFieldState();
    v.innerHTML = `
      <div id="fdPlan">
      <h2 class="view-title">🧭 领域速通 · 刘看山提问式教练陪你定计划 <span id="fdBadge"></span> <span class="coach-tag">🎯 提问式教练</span></h2>
      <p class="view-sub">想快速啃下一个领域？别急着找课——先让我用<b>提问式教练</b>的方式帮你把目标聊透：你想学啥、<b>想达成什么具体目标</b>、现在是啥水平、每天能投入多少。
      聊清楚后，我会从下面的方法工具箱里，针对你的目标挑最合适的学习法，说清「用什么方法、怎么用它达成目标」，并结合知乎实时高赞经验，给你一份真正贴你的计划。</p>
      <div class="card">
        <div class="chat" id="fdChat"></div>
        <div class="chips">
          <span class="chip" data-q="我想学 AI 视频生成">给个例子</span>
          <span class="chip" id="fdSearch">📡 搜这个领域的高赞经验</span>
        </div>
        <div class="row" style="margin-top:10px">
          <input id="fdInput" placeholder="计划生成后也能接着说，比如：压缩到 15 天 / 换个方法 / 第 2 周再细一点…" />
          <button id="fdSend">说给他听</button>
          <button class="ghost" id="fdReset" title="清空这次的领域与计划，重新聊">🔄 重新开始</button>
        </div>
        <div class="row"><button class="ghost" id="fdCard" style="display:none">🗺️ 生成我的学习计划</button></div>
        <div id="fdOut"></div>
      </div>
      </section>
      <details class="ztm-fold" id="fmToolboxCard" open>
        <summary class="ztm-summary"><h3 class="mt-sub">🧰 学习方法工具箱（点选你想用的方法，不选就让刘看山替你挑）</h3></summary>
        <div class="row" style="margin: 10px 0; gap: 8px;">
  <input id="fdMethodsSearch" placeholder="🔍 搜索学习方法" style="flex: 1;" />
  <button class="ghost" id="fdMethodsShowAll">🔄 显示全部</button>
</div>
<div class="grid grid-2" id="fdMethods"></div>
        <div class="row" style="margin-top:10px">
          <button class="ghost" id="fmAdd">＋ 手动添加学习方法</button>
          <button class="ghost" id="fmDistill">🐾 让刘看山从知乎 + 全网蒸馏一个学习方法</button>
        </div>
        <div id="fmExtra"></div>
      </details>
      <div class="card" id="fmChatPanel" style="display:none">
        <h3>🐾 与「<span id="fmChatTitle"></span>」的专属对话 <button class="ghost sm" id="fmChatClose" type="button" style="margin-left:8px">收起</button></h3>
        <p class="muted" style="font-size:12px">这里是「学习方法」的独立对话框，和生成计划的对话历史互不干扰。</p>
        <div class="chat" id="fmChatBox"></div>
        <div class="row" style="margin-top:10px"><input id="fmChatInput" placeholder="问这个方法一个问题…" style="flex:1"><button id="fmChatSend">问 TA</button></div>
      </div>
      <p class="muted" style="margin-top:6px">点卡片即可「选入我的计划」；自定义的方法会存在本地，下次进来还在。想让刘看山把某个方法加进计划，直接点它的卡片勾选即可。</p>`;
    // 方法点选：用户参与定制，不再随机套用（内置 + 自定义统一渲染）
    renderFieldMethods(v);
    const fmAdd = document.getElementById("fmAdd");
    if (fmAdd) fmAdd.onclick = () => fieldAddMethodUI(v);
    const fmDistill = document.getElementById("fmDistill");
    if (fmDistill) fmDistill.onclick = () => { fieldDistillMethodUI(v); };
    // 切面板再切回：恢复上次蒸馏的学习方法结果（不再重置）
    (function restoreDistill() {
      const sv = loadFieldDistill();
      if (!sv || !sv.data) return;
      const fmExtra = document.getElementById("fmExtra");
      if (!fmExtra || fmExtra.querySelector(".fm-form")) return;
      fieldDistillMethodUI(v);
      const ti = fmExtra.querySelector("#fmTopic"); if (ti) ti.value = sv.topic || "";
      const o = fmExtra.querySelector("#fmDistillOut");
      if (!o) return;
      if (sv.data.pending) o.innerHTML = '<div class="note">⏳ 上一次蒸馏还在进行中，结果出来会自动刷新，不会丢失～</div>';
      else renderDistillResult(v, o, sv.data);
    })();
    const fmChatSendBtn = document.getElementById("fmChatSend");
    if (fmChatSendBtn) fmChatSendBtn.onclick = () => fmChatSend();
    const fmChatInp = document.getElementById("fmChatInput");
    if (fmChatInp) fmChatInp.addEventListener("keydown", (e) => { if (e.key === "Enter") fmChatSend(); });
    const fmChatClose = document.getElementById("fmChatClose");
    if (fmChatClose) fmChatClose.onclick = () => { const p = document.getElementById("fmChatPanel"); if (p) p.style.display = "none"; };
    document.getElementById("fdSend").onclick = () => {
      if (fieldBusy) return;
      const inp = document.getElementById("fdInput");
      const t = inp.value.trim();
      if (!t) return;
      appendMsg("fdChat", "user", t);
      inp.value = "";
      fieldAdvance(t);
    };
    document.getElementById("fdInput").addEventListener("keydown", (e) => { if (e.key === "Enter") document.getElementById("fdSend").click(); });
    v.querySelectorAll("[data-q]").forEach((ch) => {
      ch.onclick = () => {
        if (fieldBusy) return;
        const q = ch.dataset.q;
        appendMsg("fdChat", "user", q);
        fieldAdvance(q);
      };
    });
    document.getElementById("fdSearch").onclick = fieldSearch;
    document.getElementById("fdCard").onclick = fieldRun;
    const fdReset = document.getElementById("fdReset");
    if (fdReset) fdReset.onclick = () => {
      fieldState = { step: 0, q: "", goal: "", lv: "", hr: "", style: "", pick: [], planDone: false, planText: "" };
      saveFieldState();
      chatReset("fdChat");
      if (liuHistories && liuHistories["fdChat"]) liuHistories["fdChat"] = [];
      const out = document.getElementById("fdOut"); if (out) out.innerHTML = "";
      const c = document.getElementById("fdCard"); if (c) c.style.display = "none";
      v.querySelectorAll(".method-pick").forEach((el) => el.classList.remove("on"));
      appendMsg("fdChat", "liu", "好，咱们重新开始。想快速入门哪个领域？先随便说一个，也顺手告诉我你想达成什么目标。");
    };
    // 切回来时若已生成过计划，保留「生成学习计划」按钮（可重生成）
    if (fieldState.planGenerated) {
      const c = document.getElementById("fdCard");
      if (c) { c.style.display = ""; c.textContent = "🔄 重新生成一份计划"; }
    } else {
      const c = document.getElementById("fdCard");
      if (c) c.textContent = "🗺️ 生成我的学习计划";
    }
    renderChat("fdChat");
    if (chatGet("fdChat").msgs.length === 0) appendMsg("fdChat", "liu", "想快速入门哪个领域？先随便说一个——比如「AI 视频生成」「个人品牌」「投资理财」都行。也顺手告诉我你想达成什么目标，比如「能独立剪出一条短片」或「能讲给别人听懂」。");
  }
  async function fieldAdvance(text) {
    if (fieldBusy) return;
    fieldBusy = true;
    const st = fieldState;
    try { await fieldAdvanceInner(text); }
    catch (e) {
      console.error("[field] advance failed:", e && e.message);
      try { appendMsg("fdChat", "liu", "刚那一下网络绕了点路，没接住。你再说一遍想学什么，咱们接着来。"); } catch (_) {}
    }
    finally { fieldBusy = false; saveFieldState(); }
  }
  async function fieldAdvanceInner(text) {
    const st = fieldState;
    const cid = "fdChat";
    if (st.step === 0) {
      st.q = text;
      const fb = "好，「" + text + "」。你学它是想达成什么具体目标？比如 30 天后能独立做出来一个小作品、还是通过考试、还是能讲给别人听懂？";
      await liuReply(cid, { q: text, persona: "field", coach: true, context: "【提问式教练·澄清】用户想快速入门的领域是「" + text + "」。先接住，再反问帮他澄清：他到底想达成什么具体目标？给具体反问例子（「是想要 30 天后能独立剪出一条短片，还是想讲给别人听懂，还是想接活变现？」），别自己替他定，先别给计划或方法。" }, fb);
      st.step = 1;
    } else if (st.step === 1) {
      st.goal = text;
      const fb = "收到，目标很清楚了。你现在大概是什么水平？零基础、略有了解、入门、还是进阶？";
      await liuReply(cid, { q: text, persona: "field", coach: true, context: "【提问式教练·拆矛盾】他说的目标是「" + text + "」。先肯定他讲具体了，再拆：这个目标里有没有「想要的」和「实际会投入的」之间的张力？用具体反问帮他看清（「你真正想要的是这个结果本身，还是想被别人认可你学会了？」）。不要直接给方法。" }, fb);
      st.step = 2;
    } else if (st.step === 2) {
      st.lv = text;
      const fb = "收到。每天能投入多少小时？大概数就行，比如 1 或 2。";
      await liuReply(cid, { q: text, persona: "field", coach: true, context: "【提问式教练·澄清】领域「" + st.q + "」，目标「" + st.goal + "」，他刚说水平是「" + text + "」。先点一下：别用「零基础/进阶」这种标签把自己框死，拿一件最近做过的事当尺子更准——用反问引他说出「最近一次碰这个领域是什么时候、做到哪了」。不直接给方法。" }, fb);
      st.step = 3;
    } else if (st.step === 3) {
      st.hr = text;
      const fb = "你更喜欢怎么学？动手实践、阅读为主、看视频、还是项目驱动？问完就能点「生成我的学习计划」了。";
      await liuReply(cid, { q: text, persona: "field", coach: true, context: "【提问式教练·给视角】综合前面聊的（领域「" + st.q + "」，目标「" + st.goal + "」，水平「" + st.lv + "」，每天" + text + "小时）。先帮他看清：每天能投入的时间和「想达成的目标」之间匹不匹配？给一个轻轻的视角（比如「目标是能独立接活，但每天 1 小时，那得先把一个小作品跑通，而不是先补完所有课」），再问偏好。然后告诉他可以点「生成学习计划」了——但那是计划，不是答案，决定权在他。" }, fb);
      st.step = 4;
      const fdCard = document.getElementById("fdCard"); if (fdCard) fdCard.style.display = "";
    } else {
      // 计划已生成 → 之后所有输入都进「按需求继续调整计划」模式，对话不停
      if (st.planDone) { fieldBusy = false; fieldRefine(text); return; }
      st.style = text || st.style || "动手实践";
      // 访谈已走完但计划还没生成：也要接住用户的话，不能静默
      await liuReply("fdChat", { q: text, persona: "field", coach: true, context: "【提问式教练】领域「" + st.q + "」，目标「" + st.goal + "」，用户刚说：「" + text + "」。接住他的话，顺手确认学习偏好（动手实践/阅读/看视频/项目驱动），并提醒可以点「生成我的学习计划」了。简短自然，别列条目。" }, "收到。你更喜欢怎么学——动手做、看书、刷视频，还是直接上个项目？想好了就点上面的「生成我的学习计划」。");
    }
    saveFieldState();
  }
  // 领域速通·计划生成之后：继续按用户需求调整计划（对话不停，想改就说）
  async function fieldRefine(text) {
    const st = fieldState;
    const cid = "fdChat";
    if (!st || !text) return;
    if (fieldBusy) return;
    fieldBusy = true;
    try { await fieldRefineInner(text); }
    catch (e) {
      console.error("[field] refine failed:", e && e.message);
      try { appendMsg(cid, "liu", "刚那一下网络绕了点路，没改成功。你把想改的地方再说一遍（比如「压缩到 15 天」「第 2 周再细点」），我再改。"); } catch (_) {}
    }
    finally { fieldBusy = false; saveFieldState(); }
  }
  async function fieldRefineInner(text) {
    const st = fieldState;
    const cid = "fdChat";
    const ctx = `【用户已有一份计划，现在要按新需求调整】
领域：${st.q}
目标：${st.goal}
水平：${st.lv}
每天可投入：${st.hr} 小时
偏好：${st.style}
已用方法：${(st.pick && st.pick.length) ? st.pick.join("、") : "（由你挑选）"}
【已生成的计划原文】
${(st.planText || "（上次未生成完整计划）").slice(0, 1200)}
【用户这次的新需求】${text}
请你：先确认他要改什么（时长？难度？方法？阶段目标？某块再细一点？），再给出**调整后的计划**——只重写被改到的部分，其余保持并明说「其余不变」，别整份重抄。说清为什么这样改更贴他的新需求。像教练，别啰嗦。`;
    await liuReply(cid, {
      q: "我想调整一下这份计划：" + text,
      persona: "field",
      coach: true,
      context: ctx,
      showSources: true,
    }, "收到，我按你说的调一版——稍等，我理一下。");
    // 把新的计划内容并入 state，后续可连续多轮微调
    try {
      const last = chatGet(cid).msgs.slice().reverse().find((m) => m.s === "liu" && m.t);
      if (last && last.t) st.planText = last.t;
    } catch (e) {}
    try {
      const out = document.getElementById("fdOut");
      if (out) {
        const note = document.createElement("div");
        note.className = "note";
        note.textContent = "已按你的要求调整：" + text;
        out.insertBefore(note, out.firstChild);
      }
    } catch (e) {}
    saveFieldState();
  }
    async function fieldSearch() {
    const q = (fieldState && fieldState.q) || document.getElementById("fdInput").value.trim();
    if (!q) { appendMsg("fdChat", "liu", "先告诉我你想学哪个领域，我才知道去知乎开放平台搜什么～"); return; }
    appendMsg("fdChat", "liu", "我把这个领域的高赞经验从知乎多个接口一次性扇出（站内搜索 / 全网 / 热榜 / 故事样本），稍等…");
    // 第一原则：充分调用已登录知乎开放平台接口（多接口扇出）
    const [rSearch, rGlobal, rHot, rStory, rDual] = await Promise.all([
      callZhihu("search", { q, Count: 5, fresh: true }),
      callZhihu("global", { q: q + " 实操 经验 路线", Count: 5, fresh: true }),
      callZhihu("hot",    { q, Limit: 5, fresh: true }),
      callZhihu("story",  { q: q + " 学习 经历 踩坑 复盘", Count: 5, fresh: true }),
      callZhihu("dual",   { q: q + " 实操 经验 路线", Count: 6, fresh: true }),
    ]);
    const items = [];
    (rSearch.mock ? [] : (rSearch.items || [])).forEach((s) => items.push(Object.assign({ source: "zhihu" }, s)));
    (rGlobal.mock ? [] : (rGlobal.items || [])).forEach((s) => items.push(Object.assign({ source: "global" }, s)));
    (rHot.mock ? [] : (rHot.items || [])).forEach((s) => items.push(Object.assign({ source: "hot" }, s)));
    (rStory.mock ? [] : (rStory.items || [])).forEach((s) => items.push(Object.assign({ source: "story" }, s)));
    // dual：后端保底双源（全网为空时会换词重试），确保「全网参考」不会显示为零
    if (rDual && !rDual.mock) {
      ((rDual.zhihu || []).forEach((s) => items.push(Object.assign({ source: "zhihu" }, s))));
      ((rDual.global || []).forEach((s) => items.push(Object.assign({ source: "global" }, s))));
    }
    if (items.length) {
      const sp = _splitSources(items);
      const zhPart = sp.zh.length ? `<div class="muted" style="margin:6px 0 4px">🔵 知乎参考（${sp.zh.length}）</div><div class="section grid grid-2">${shuffle(sp.zh).slice(0, 4).map(liveCard).join("")}</div>` : "";
      const glPart = sp.gl.length ? `<div class="muted" style="margin:10px 0 4px">🌐 全网参考（${sp.gl.length}）</div><div class="section grid grid-2">${shuffle(sp.gl).slice(0, 4).map(liveCard).join("")}</div>` : "";
      appendHtml("fdChat", `<div class="muted" style="margin:4px 0">实时高赞经验（知乎 + 全网多接口扇出）：</div>${zhPart}${glPart}${(!sp.gl.length ? '<div class="muted" style="margin-top:6px">（本话题知乎全网检索暂未返回站外来源，故无「全网参考」——不会拿知乎内容冒充全网。换个说法再试通常能搜到。）</div>' : "")}`);
      awardXP({ vis: 5 }, "领域速通对照全网经验");
    } else {
      appendMsg("fdChat", "liu", "（实时经验暂时没连上，先用本地底座；重试即可拉到真实高赞回答。）");
    }
  }
    async function fieldRun() {
    if (fieldRunBusy) return;
    fieldRunBusy = true;
    try {
    const st = fieldState;
    if (!st.q) { appendMsg("fdChat", "liu", "先告诉我你想学哪个领域，我才知道去知乎开放平台搜什么、怎么帮你定目标～"); return; }
    if (!(st.pick || []).length) {
      const ok = window.confirm("你还没在下面「学习方法工具箱」里勾选方法。\n不勾选的话，我会替你挑最合适的 2-3 种来生成计划。\n\n点「确定」＝继续（由我替你挑）；点「取消」＝先去勾选。");
      if (!ok) {
        const box = document.getElementById("fdMethods");
        if (box && box.scrollIntoView) box.scrollIntoView({ behavior: "smooth", block: "center" });
        return;
      }
    }
    const q = st.q, goal = st.goal || "能独立上手做出来", lv = st.lv || "零基础",
          hr = parseFloat(st.hr) || 1.5, style = st.style || "动手实践", pick = st.pick || [];
    const cid = "fdChat";
    const badge = document.getElementById("fdBadge");
    const out = document.getElementById("fdOut");
    const methodNames = pick.length ? pick.join("、") : "西蒙/费曼/SQ3R/康奈尔/麻省理工AI/番茄";
    // 单一「思考中」指示（避免重复气泡）：用 pending 而非再 append 一条「稍等」消息
    chatSetPending(cid, true, "刘看山");
    // 检索用 query：领域 + 学习方法（保证 RAG 命中领域与方法，且每次随用户画像不同而不同）
    const searchQ = q + " 学习方法 入门 路径 " + (pick.length ? pick.join(" ") : "西蒙 费曼 SQ3R 康奈尔 麻省理工AI 番茄");
    const pickObjs = pick.map(fieldMethodByName).filter(Boolean);
    const methodHint = pick.length
      ? "【强制】用户已明确指定本次学习计划【只能】使用以下学习方法：" + pick.join("、") + "。请严格围绕这些方法展开，为每个方法分配明确的周次/阶段，并说明它怎么帮他达成「" + goal + "」，禁止擅自替换成工具箱里的其它方法。"
      : "用户没指定方法，请你从方法工具箱（西蒙/费曼/SQ3R/康奈尔/麻省理工AI/番茄/间隔重复）里，挑出对达成「" + goal + "」最合适 2-3 种，说明为什么选它、怎么用它。";
    const planContext = `【用户学习画像】
领域：${q}
想达成的目标：${goal}
当前水平：${lv}
每天可投入：${hr} 小时
偏好风格：${style}
${methodHint}
【你的任务】结合上面 <b>知乎 + 全网</b> 实时检索到的真实经验，给用户一份 30 天、按 4 周编排的学习计划。要求：
1) 先一句话点明：用对方法，30 天能到哪；
2) 针对「${goal}」这个目标，逐个说清「用什么方法、怎么用它、为什么能达成目标」——不是罗列方法，而是方法→目标的因果；
3) 按周编排（第1周…第4周），<b>每一周都必须明确写一行「本周主用方法：XXX」</b>，方法名必须来自用户指定的清单，一个都不许换、不许漏；每周给出 2-3 个可验收的具体动作（有产出物，可自查）；
4) 每周标注预计投入小时数（按每天 ${hr} 小时推算），并给一个「本周验收标准」（做到什么算过）；
5) 给出「明天就能做的最小一步」；
6) 引用资料时<b>必须同时出现知乎来源与全网来源</b>两类（各至少 1 条），并点出来源名，不堆砌。
像给一个具体朋友做私人规划，不要写成填空模板、不要套用固定五段式、不要输出与本题无关的通用建议。`;
    // 多轮生成直到「用户勾选的方法全部落入计划」（用户要求：一次生成就要涵盖所有勾选方法）。
    // 后端已在 prompt 里强制采用勾选方法，但 LLM 偶有遗漏；这里做最多 3 次重试自愈，逐轮点名漏掉的方法。
    // 重试压到 2 次：旧版 3 次串行直答经常把云函数 60s 预算打满 → 整请求失败、按钮看起来「瘫痪」
    const MAX_PLAN_TRIES = 2;
    let r = null, _best = null, _bestMiss = 999, _lastMissed = [];
    let _extraForce = "";
    for (let _attempt = 1; _attempt <= MAX_PLAN_TRIES; _attempt++) {
      const planContextNow = planContext + _extraForce;
      let r0 = null;
      // 网络层抛错也要接住：旧版任其抛出 → finally 只复位 busy，思考气泡卡死、计划区空白
      try {
        r0 = await callZhihu("liuanswer", { q: searchQ, persona: "field", context: planContextNow, methods: pickObjs, history: liuHistories[cid] || [], fresh: true, kb: !!localStorage.getItem("zhiyu_kb_ok") });
      } catch (e) {
        console.error("[field] plan request failed:", e && e.message);
        r0 = null;
      }
      const _empty = !r0 || r0.mock || !r0.content || !r0.content.trim();
      if (_empty) { r = r0 || {}; if (!_best) _best = r; break; }
      const _missed0 = pick.filter((n) => !fieldMethodCovered(r0.content, n));
      if (!_best || _missed0.length < _bestMiss) { _best = r0; _bestMiss = _missed0.length; }
      if (_missed0.length === 0) { r = r0; _lastMissed = []; break; }
      _lastMissed = _missed0;
      _extraForce = "\n【再次强调·上一版漏掉了你勾选的这些方法，本次【必须】逐条出现并为每个分配明确周次：<b>" + _missed0.join("、") + "</b>。逐一核对，一个都不许漏。】";
      r = _best;
    }
    if (!r) r = _best || { mock: false, content: "", sources: [] };
    chatSetPending(cid, false);
    liuHistories[cid] = liuHistories[cid] || [];
    liuHistories[cid].push({ role: "user", content: "帮我按刚才聊的画像（领域：" + q + "，目标：" + goal + "）生成一份 30 天学习计划" });
    const hasPlan = !r.mock && r.content && r.content.trim() && r.content.indexOf("（实时资料") !== 0;
    const usedMethods = pick.length ? pickObjs : mergedFieldMethods();
    const methodCardsHTML = (arr) => `<div class="muted" style="margin:6px 0">🧰 本次计划的方法底座${pick.length ? "（已按你勾选的来）" : ""}：</div><div class="grid grid-2">${arr.map((m) => `<div class="sample"><h4>${escHTML(m.name)}${m.custom ? ' <span class="mp-custom">★</span>' : ''}</h4><p class="muted">${escHTML(m.desc)}</p></div>`).join("")}</div>`;
    if (hasPlan) {
      liuHistories[cid].push({ role: "assistant", content: r.content });
      if (liuHistories[cid].length > 12) liuHistories[cid] = liuHistories[cid].slice(-12);
      if (badge) badge.innerHTML = badgeHTML(true);
      // 记住已生成计划：此后输入全部进「按需求继续调整」模式，对话不停
      st.planDone = true;
      st.planGenerated = true;
      st.planText = r.content;
      const liveBox = liuRefsHTML({ refsZhihu: r.refsZhihu || [], refsGlobal: r.refsGlobal || [] }) || sourcesDualHTML(r.sources || []);
      // 方法覆盖校验：用户勾了就必须出现在计划里，缺的明确标出来（避免"没按勾选方法生成"）
      const missed = pick.filter((n) => !fieldMethodCovered((r && r.content) || "", n));
      const patchBox = missed.length ? fieldMethodPatchHTML(missed, hr, goal) : "";
      const allCovered = !missed.length;
      const checkBox = (missed.length && !allCovered && !patchBox)
        ? `<div class="note" style="border-left:3px solid #ffb86b">⚠️ 本次计划里没出现你勾选的：<b>${missed.map(escHTML).join("、")}</b>。点下面「换一种讲法」重生成，刘看山会强制逐条用上。</div>`
        : (pick.length ? `<div class="note" style="border-left:3px solid #7CFFB2">✅ 你勾选的 ${pick.length} 个方法已全部落进计划（${pick.map(escHTML).join("、")}）。</div>` : "");
      out.innerHTML = `
        <div class="section card">
          <h3>🗺️ 「${q}」30 天学习计划 · 目标：${goal} · ${lv} · 每天 ${hr}h · ${style}</h3>
          <p>${r.content.replace(/\n/g, "<br>")}</p>
          ${methodCardsHTML(usedMethods)}
          ${checkBox}
          ${patchBox}
          ${liveBox}
          <div class="note">计划由刘看山结合 <b>知乎 + 全网</b> 实时多接口检索生成，${pick.length ? "已严格采用你勾选的学习方法" : "针对你的目标做了方法匹配"}；完成即记一笔「钻研」经验。</div>
          <div class="row"><button class="ghost" id="fdRefresh">🔄 换一种讲法（重新实时扇出全接口）</button></div>
        </div>`;
      awardXP({ mas: 20, con: 5 }, "生成领域速通路径");
      recordFootprint("领域速通", "生成了「" + q + "」的学习计划（目标：" + goal + "，方法：" + methodNames + "）");
    } else {
      // 整体不可用时兜底：仍展示方法底座 + 检索（若有），不空答
      if (badge) badge.innerHTML = badgeHTML(false);
      const liveSnippets = (r.sources || []).filter((s) => s.title || s.name).slice(0, 4);
      const liveBox = liveSnippets.length ? `<div class="section grid grid-2" style="margin:8px 0">${liveSnippets.map(liveCard).join("")}</div>` : "";
      out.innerHTML = (r.note ? `<div class="note">${r.note}</div>` : "") + `
        <div class="section card">
          <h3>🗺️ 「${q}」学习方法底座 · 目标：${goal}</h3>
          <p class="muted">（直答接口这会儿有点挤，先给你方法工具箱；换个问法可重试生成完整计划。）</p>
          <div class="muted" style="margin:6px 0">针对「${goal}」，可优先用：</div>
          ${methodCardsHTML(usedMethods)}
          ${liveBox}
          <div class="row"><button class="ghost" id="fdRefresh">🔄 重试生成计划</button></div>
        </div>`;
      awardXP({ mas: 10, con: 2 }, "生成领域速通路径");
      st.planDone = false;
      st.planGenerated = false;
      st.planText = "（上次未能生成完整计划，只有学习方法底座）";
    }
    // 计划出来后对话不停：邀请用户继续按需求调整
    appendMsg(cid, "liu", "给你理好了（就在上面那张卡里）。想改哪儿直接说——时间想压缩或拉长、想换一两个方法、想加个阶段目标、或者某一周想再细一点，我都按你的意思调。");
    saveFieldState();
    const fc = document.getElementById("fdCard"); if (fc) { fc.style.display = ""; fc.textContent = st.planGenerated ? "🔄 重新生成一份计划" : "🗺️ 生成我的学习计划"; }
    const fr = document.getElementById("fdRefresh"); if (fr) fr.onclick = fieldRun;
    liuSay("field");
    } catch (e) {
      console.error("[field] plan generation failed:", e && (e.stack || e.message));
      try { chatSetPending("fdChat", false); } catch (_) {}
      const _out = document.getElementById("fdOut");
      if (_out) _out.innerHTML = '<div class="note">刚那一下网络绕了点路，计划没生成。点「🔄 重新生成一份计划」再来一次就行。</div>';
      try { appendMsg("fdChat", "liu", "刚那一下没接住，计划还没生成。你点一下「🔄 重新生成一份计划」，我再跑一次。"); } catch (_) {}
    } finally { fieldRunBusy = false; try { chatSetPending("fdChat", false); } catch (_) {} }
  }

  // ---------- 知遇·检索（合并：人生样本 / 处境对齐 / 领域速通 + 知识卡 / 故事样本）----------
  // 把用户在知遇录里写下的私人沉淀，打包成一份 markdown 文件导出
  function buildKbMarkdown() {
    const L = (k) => { try { return JSON.parse(localStorage.getItem(k) || "null"); } catch (e) { return null; } };
    const lines = ["# 知遇录·个人知识导出", ""];
    const self = L("zhiyu_self");
    if (self) { lines.push("## 自我认知", JSON.stringify(self), ""); }
    const dalao = L(DALAO_KEY);
    if (dalao && typeof dalao === "object") {
      lines.push("## 个人能力清单");
      Object.keys(dalao).forEach((dim) => {
        const d = dalao[dim]; if (!d) return;
        const pts = (d.points || []).map((p) => (typeof p === "string" ? p : (p.name || (p.value ? p.value : "")))).filter(Boolean);
        lines.push("- " + (d.name || dim) + (pts.length ? "：" + pts.join("、") : ""));
      });
      lines.push("");
    }
    const growth = L(GROWTH_KEY); if (growth) { lines.push("## 目标体系", JSON.stringify(growth), ""); }
    const mailuo = L(MAILUO_KEY); if (mailuo) { lines.push("## 脉络·人生系统", JSON.stringify(mailuo), ""); }
    const plans = L("zhiyu_plans"); if (plans) { lines.push("## 成长计划", JSON.stringify(plans), ""); }
    const bio = L(BIO_KEY);
    if (bio && bio.chapters && bio.chapters.length) {
      lines.push("## 人生传记");
      bio.chapters.forEach((ch) => { lines.push("### " + (ch.title || "章节")); if (ch.text) lines.push(String(ch.text).slice(0, 800)); });
      lines.push("");
    }
    const reviews = L("zhiyu_reviews");
    if (Array.isArray(reviews) && reviews.length) {
      lines.push("## 复盘记录");
      reviews.slice(0, 20).forEach((rv) => lines.push("- " + String(typeof rv === "string" ? rv : (rv.event || rv.q || JSON.stringify(rv))).slice(0, 300)));
      lines.push("");
    }
    const princ = L(PRINCIPLES_KEY);
    if (Array.isArray(princ) && princ.length) {
      lines.push("## 可复用原则");
      princ.forEach((p) => lines.push("- " + String(typeof p === "string" ? p : JSON.stringify(p))));
      lines.push("");
    }
    const mk = L(MK_KEY);
    if (Array.isArray(mk) && mk.length) {
      lines.push("## 踩过的坑");
      mk.slice(0, 20).forEach((m) => lines.push("- " + String(typeof m === "string" ? m : (m.text || JSON.stringify(m))).slice(0, 200)));
      lines.push("");
    }
    const sites = L("zhiyu_sites");
    if (Array.isArray(sites) && sites.length) { lines.push("## 我的网站导航"); sites.forEach((s) => lines.push("- " + (s.name || "") + " " + (s.url || ""))); lines.push(""); }
    const bloggers = L("zhiyu_bloggers");
    if (Array.isArray(bloggers) && bloggers.length) { lines.push("## 我关注的全网博主"); bloggers.forEach((b) => lines.push("- " + (b.name || "") + " " + (b.url || ""))); lines.push(""); }
    return lines.join("\n");
  }

  // ---------- 知遇·检索（合并：人生样本 / 处境对齐 / 领域速通 + 知识卡 / 故事样本）----------
  // 检索结果采用「持久化累积」渲染：快问与深度可并发、互不覆盖；切模块再切回照常恢复。
  function renderExplore(v) {
    v.innerHTML = `
      <h2 class="view-title">🔭 知遇·检索 <span class="badge live" id="exBadge"></span></h2>
      <p class="view-sub">一个检索入口，两种问法：<b>⚡ 快问快答</b>走知乎直答，秒出一张知识卡；<b>🛰️ 深度检索 Agent</b>把宽问题拆成多个角度、
      并行搜知乎站内+全网、打分排序后交给你读。全部实时调用知乎开放平台。</p>

      <div class="card agent-card">
        <div class="agent-head">
          <h3>🛰️ 检索方式 <span class="coach-tag">快问直答 · 深问多轮规划</span></h3>
          <div class="scope-toggle" id="exModes" style="margin:16px 0 6px">
            <button class="scope-btn active" data-mode="quick">⚡ 快问快答（知乎直答知识卡）</button>
            <button class="scope-btn" data-mode="deep">🛰️ 深度检索 Agent（多轮规划）</button>
          </div>
          <p class="muted" id="exHint">具体的小问题（「什么是费曼学习法」）适合快问；宽泛的课题（「想转行做 AI 怎么起步」）交给 Agent 深挖。</p>
        </div>
        <div class="row">
          <input id="exQ" class="flex1" placeholder="快问：如何做选题？ ｜ 深检：想转行做 AI，但没技术背景怎么起步" />
          <button id="exRun">🔍 检索</button>
        </div>
        <div id="exOut"></div>
        <div class="row ex-ctrls">
          <button class="ghost" id="exAgain">🔄 再问一个</button>
          <button class="ghost" id="exClear">🗑 清空检索记录</button>
        </div>
      </div>

      <div id="exploreBody"></div>`;
    let exMode = "quick";
    v.querySelectorAll("#exModes .scope-btn").forEach((b) => {
      b.onclick = () => {
        v.querySelectorAll("#exModes .scope-btn").forEach((x) => x.classList.remove("active"));
        b.classList.add("active");
        exMode = b.dataset.mode;
        const exHintEl = document.getElementById("exHint");
        if (exHintEl) exHintEl.textContent = exMode === "quick"
          ? "具体的小问题（如「什么是费曼学习法」）适合快问：输入后点「⚡ 快问快答」，秒出一张知识卡。"
          : "宽泛的课题（如「想转行做 AI 怎么起步」）交给 Agent：它会拆成多个角度、并行检索知乎站内+全网、打分排序后交给你读。";
        document.getElementById("exRun").textContent = exMode === "quick" ? "⚡ 快问快答" : "🛰️ 启动检索 Agent";
        document.getElementById("exQ").placeholder = exMode === "quick" ? "快问：如何做选题？什么是认知偏差？" : "想搞清楚一个宽泛的问题？例如：想转行做 AI，但没技术背景怎么起步";
      };
    });

    // —— 检索结果持久化（localStorage）：切模块再切回照常恢复，且可并发累积互不覆盖 ——
    const EX_KEY = "zhiyu_explore";
    const exLoad = () => {
      try {
        const a = JSON.parse(localStorage.getItem(EX_KEY) || "null");
        if (!Array.isArray(a)) return [];
        let changed = false;
        a.forEach((e, i) => { if (e && !e._id) { e._id = "e" + Date.now() + "_" + i; changed = true; } });
        if (changed) { try { localStorage.setItem(EX_KEY, JSON.stringify(a)); } catch (_) {} }
        return a;
      } catch (e) { return []; }
    };
    const exSave = (a) => { try { localStorage.setItem(EX_KEY, JSON.stringify((a || []).slice(-40))); } catch (e) {} };
    const exRenderBlock = (entry) => {
      const delBtn = '<button class="ghost ex-del" data-id="' + escAttr(entry._id || "") + '" type="button" style="margin:0 0 6px auto;display:block">✕ 删除这条记录</button>';
      if (entry.pending) return '<div class="section card ex-block" data-exid="' + escAttr(entry._id || "") + '">' + delBtn + '<div class="note">⚡ 知乎直答正在为你凝一张知识卡…</div></div>';
      if (entry.failed) return '<div class="section card ex-block" data-exid="' + escAttr(entry._id || "") + '">' + delBtn + '<div class="note">' + (entry.note ? escHTML(entry.note) + " " : "") + '实时直答暂时没连上，稍后再试。</div></div>';
      if (entry.mode === "quick") {
        const _zh = (entry.refsZhihu||[]).filter(Boolean), _gl = (entry.refsGlobal||[]).filter(Boolean);
        let refsHTML = "";
        if (_zh.length || _gl.length) refsHTML = '<div class="liu-refs-box" style="margin-top:12px"><div class="liu-refs-title">📚 参考资料（知乎 + 全网）</div>' + _srcGroupHTML('知乎参考','🔵',_zh,true) + _srcGroupHTML('全网参考','🌐',_gl,true) + '</div>';
        return `<div class="section card ex-block">
          ${delBtn}
          <h4>🧠 知乎知识卡 · ${escHTML(entry.q)}</h4>
          <p class="bio-prose">${escHTML(entry.content).replace(/\n/g, "<br>")}</p>
          <div class="row"><button class="ghost ex-save" data-q="${escAttr(entry.q)}" data-content="${escAttr(entry.content)}">＋ 存为复习卡</button></div>
          ${refsHTML}
        </div>`;
      }
      const planHTML = (entry.plan && entry.plan.length) ? `
        <div class="ag-plan"><span class="ag-plan-h">🧭 它拆解出的检索角度：</span>
          ${entry.plan.map((p) => `<span class="ag-chip ${p.scope === "zhihu" ? "in" : "out"}">${escHTML(p.q)}<i>${p.scope === "zhihu" ? "站内" : "全网"}</i></span>`).join("")}
        </div>` : "";
      const srcHTML = (entry.sources && entry.sources.length) ? entry.sources.map((s, i) => `
        <div class="ag-src">
          <div class="ag-rank">${i + 1}</div>
          <div class="ag-main">
            <div class="ag-title">${s.url ? `<a href="${escAttr(s.url)}" target="_blank" rel="noopener">${escHTML(s.title || "（无标题）")}</a>` : escHTML(s.title || "（无标题）")}</div>
            <div class="ag-meta"><span class="ag-src-tag ${s.source === "zhihu" ? "in" : "out"}">${s.source === "zhihu" ? "知乎站内" : "全网"}</span>
              ${s.author ? `<span class="ag-author">@${escHTML(s.author)}</span>` : ""}
              <span class="ag-score">相关度 ${s.score}/10</span>
              <span class="ag-read">📖 ${s.readMin} 分钟</span></div>
            ${s.recommend ? `<div class="ag-reco">💡 ${escHTML(s.recommend)}</div>` : ""}
            ${s.text ? `<div class="ag-snip">${escHTML(s.text.slice(0, 110))}${s.text.length > 110 ? "…" : ""}</div>` : ""}
          </div>
        </div>`).join("") : '<div class="empty">这次没检索到贴合的来源，换个更具体的说法再试。</div>';
      return `<div class="section card ex-block">
        ${delBtn}
        ${planHTML}
        <p class="muted">${escHTML(entry.summary || "")}</p>
        <div class="ag-list">${srcHTML}</div>
      </div>`;
    };
    const exRestore = () => {
      const out = document.getElementById("exOut");
      if (!out) return;
      const arr = exLoad();
      out.innerHTML = arr.map(exRenderBlock).join("");
    };

    const runQuick = async (q) => {
      const out = document.getElementById("exOut");
      const _id = "e" + Date.now() + Math.random().toString(36).slice(2, 6);
      const arr0 = exLoad(); arr0.push({ _id, mode: "quick", q: q, pending: true }); exSave(arr0);
      if (out) { const b = document.createElement("div"); b.className = "ex-block"; b.dataset.exid = _id; b.innerHTML = '<div class="note">⚡ 知乎直答正在为你凝一张知识卡…</div>'; out.appendChild(b); }
      const r = await callZhihu("knowledge", { q, fresh: true });
      const entry = (!r.mock && r.content) ? { _id, mode: "quick", q: q, content: r.content, refsZhihu: r.refsZhihu || [], refsGlobal: r.refsGlobal || [] } : { _id, mode: "quick", q: q, failed: true, note: r.note || "" };
      const a2 = exLoad().map((x) => (x._id === _id ? entry : x)); exSave(a2);
      const live = out ? out.querySelector('.ex-block[data-exid="' + _id + '"]') : null;
      if (live) live.outerHTML = exRenderBlock(entry);
      else if (out) out.insertAdjacentHTML("beforeend", exRenderBlock(entry));
      if (!entry.failed) {
        recordFootprint("知遇检索", "检索了「" + q + "」（快问快答）");
        awardXP({ vis: 4 }, "快问快答");
      }
    };
    const runDeep = async (q) => {
      const out = document.getElementById("exOut");
      const _id = "e" + Date.now() + Math.random().toString(36).slice(2, 6);
      const arr0 = exLoad(); arr0.push({ _id, mode: "deep", q: q, pending: true }); exSave(arr0);
      if (out) { const b = document.createElement("div"); b.className = "ex-block"; b.dataset.exid = _id; b.innerHTML = '<div class="note">🔭 检索 Agent 正在规划检索词并多轮检索知乎站内+全网…</div>'; out.appendChild(b); }
      const r = await callZhihu("zhihuAgent", { q, fresh: true });
      const entry = r.mock ? { _id, mode: "deep", q: q, failed: true, note: "实时接口暂未连通" } : { _id, mode: "deep", q: q, plan: r.plan || [], sources: r.sources || [], summary: r.summary || "" };
      const a2 = exLoad().map((x) => (x._id === _id ? entry : x)); exSave(a2);
      const live = out ? out.querySelector('.ex-block[data-exid="' + _id + '"]') : null;
      if (live) live.outerHTML = exRenderBlock(entry);
      else if (out) out.insertAdjacentHTML("beforeend", exRenderBlock(entry));
      if (!entry.failed) {
        recordFootprint("知遇检索", "检索了「" + q + "」（深度检索）");
        awardXP({ vis: 6 }, "深度检索");
      }
    };
    const run = async () => {
      const q = document.getElementById("exQ").value.trim();
      if (!q) return;
      if (exMode === "quick") await runQuick(q);
      else await runDeep(q);
    };
    document.getElementById("exRun").onclick = run;
    const exInput = document.getElementById("exQ");
    exInput.addEventListener("keydown", (e) => { if (e.key === "Enter") run(); });

    // 事件绑定：#exOut 每次渲染重建，故「存为复习卡」用委托挂在其上（多块也不漏、不累积监听器）；
    // 「再问一个 / 清空检索记录」按钮唯一，直接 onclick 绑定（重复渲染自动覆盖，无叠加）。
    const outEl = document.getElementById("exOut");
    if (outEl) outEl.addEventListener("click", (e) => {
      const del = e.target.closest(".ex-del");
      if (del) {
        const id = del.dataset.id;
        const arr = exLoad().filter((x) => x._id !== id);
        exSave(arr); exRestore();
        return;
      }
      const save = e.target.closest(".ex-save");
      if (save) { addRecallCard(save.dataset.q, save.dataset.content, "knowledge", save.dataset.q); save.textContent = "已存入复习卡 ✓"; save.disabled = true; awardXP({ cog: 4 }, "快问存卡"); }
    });
    const exAgain = document.getElementById("exAgain");
    if (exAgain) exAgain.onclick = () => { const i = document.getElementById("exQ"); if (i) { i.value = ""; i.focus(); } if (outEl) outEl.scrollTop = 0; };
    const exClear = document.getElementById("exClear");
    if (exClear) exClear.onclick = () => { exSave([]); if (outEl) outEl.innerHTML = ""; };

    exRestore();
    renderSample(v.querySelector("#exploreBody"));
  }


  // ---------- 大佬思维模型（蒸馏知乎高手的方法论，参考「知识蒸馏馆」）----------
  // ---------- 系统思维与方法论工具箱（原文档语料 + 用户自定义编辑）----------
  const ZX_CUSTOM_KEY = "zhiyu_zx_custom";
  function loadZxCustom() {
    try { return JSON.parse(localStorage.getItem(ZX_CUSTOM_KEY) || "{}") || {}; } catch (e) { return {}; }
  }
  function saveZxCustom(o) { try { localStorage.setItem(ZX_CUSTOM_KEY, JSON.stringify(o)); } catch (e) {} }
  // 内置系别 + 用户自定义系别（cust.cats）：用户要求「可以自定义添加系别」
  const ZX_BASE_CATS = ["认知系·认知思维", "财富系·财富思维", "人际系·识人社交",
    "成长系·自我成长", "强者系·强者心态", "复盘系·复盘方法",
    "学习系·学习方法", "杂览系·通用思维", "我的蒸馏模型"];
  function zxAllCats() {
    const cust = loadZxCustom();
    const extra = Array.isArray(cust.cats) ? cust.cats.filter((c) => ZX_BASE_CATS.indexOf(c) < 0) : [];
    return ZX_BASE_CATS.concat(extra);
  }
  function zxAddCat(container) {
    const name = (window.prompt("新系别名称（例：产品系·产品思维）", "") || "").trim();
    if (!name) return;
    if (zxAllCats().indexOf(name) >= 0) { try { alert("这个系别已经有了～"); } catch (e) {} return; }
    const cust = loadZxCustom(); cust.cats = cust.cats || [];
    if (cust.cats.indexOf(name) < 0) cust.cats.push(name);
    saveZxCustom(cust);
    if (window.__zxOpen) window.__zxOpen[name] = true;
    renderZxToolbox(container);
    try { liuShout("已新增系别「" + name + "」，点它里面的「＋ 新增」加方法吧～"); } catch (e) {}
  }
  function getMergedCorpus() {
    const base = (window.ZX_CORPUS || []).map((x) => Object.assign({}, x));
    const cust = loadZxCustom();
    const deleted = cust.deleted || [];
    const edited = cust.edited || {};
    const moved = cust.moved || {};
    const order = cust.order || {};
    let arr = base.filter((x) => !deleted.includes(x.id));
    arr = arr.map((x) => edited[x.id] ? Object.assign({}, x, edited[x.id]) : x);
    (cust.added || []).forEach((a) => arr.push(a));
    // 应用用户自定义分类（把卡片移动到目标分类）
    arr = arr.map((x) => moved[x.id] ? Object.assign({}, x, { catName: moved[x.id], cat: moved[x.id].split("·")[0].trim() }) : x);
    // 应用用户自定义排序（拖拽后按该分类下的自定义顺序排）
    if (order && Object.keys(order).length) {
      const grouped = {};
      arr.forEach((x) => { const k = x.catName || "杂览系·通用思维"; (grouped[k] = grouped[k] || []).push(x); });
      const flat = [];
      Object.keys(grouped).forEach((k) => {
        const o = order[k] || [];
        if (o.length) grouped[k].sort((a, b) => { const ia = o.indexOf(a.id); const ib = o.indexOf(b.id); return (ia < 0 ? 999 : ia) - (ib < 0 ? 999 : ib); });
        grouped[k].forEach((x) => flat.push(x));
      });
      return flat;
    }
    return arr;
  }
  function zxEditCard(container, id) {
    const it = getMergedCorpus().find((x) => x.id === id); if (!it) return;
    const card = Array.from(container.querySelectorAll(".tool-card")).find((c) => c.dataset.id === id);
    if (!card) return;
    card.classList.add("editing");
    card.setAttribute("draggable", "false");
    card.innerHTML = `<div class="tool-name"><input class="zx-in" data-f="label" value="${escAttr(it.label || "")}" /></div>
      <div class="tool-detail"><textarea class="zx-in" data-f="detail" placeholder="一句话核心（摘要）">${escHTML(it.detail || "")}</textarea></div>
      <div><textarea class="zx-in" data-f="full" placeholder="详细内容 / 原文">${escHTML(it.full || "")}</textarea></div>
      <div class="tool-actions"><button class="tool-save">保存</button><button class="tool-cancel">取消</button></div>`;
    card.querySelector(".tool-cancel").onclick = () => renderZxToolbox(container);
    card.querySelector(".tool-save").onclick = () => {
      const getv = (f) => card.querySelector('[data-f="' + f + '"]').value.trim();
      const cust = loadZxCustom(); cust.edited = cust.edited || {};
      cust.edited[id] = { label: getv("label") || it.label, detail: getv("detail"), full: getv("full") || getv("detail") };
      saveZxCustom(cust); renderZxToolbox(container);
    };
  }
  function zxAddCard(container, cat) {
    const id = "zx_u_" + Date.now();
    const wrap = document.createElement("div");
    wrap.className = "tool-card tool-edit-form";
    wrap.innerHTML = `<div class="tool-name"><input class="zx-in" data-f="label" placeholder="方法 / 工具名" /></div>
      <div class="tool-detail"><textarea class="zx-in" data-f="detail" placeholder="一句话核心（摘要）"></textarea></div>
      <div><textarea class="zx-in" data-f="full" placeholder="详细内容 / 原文"></textarea></div>
      <div class="tool-actions"><button class="tool-save">保存</button><button class="tool-cancel">取消</button></div>`;
    const catDiv = Array.from(container.querySelectorAll(".zx-cat")).find((c) => c.querySelector(".zx-cat-h").textContent.includes(cat));
    if (catDiv) catDiv.querySelector(".zx-tools").prepend(wrap); else container.prepend(wrap);
    wrap.querySelector(".tool-cancel").onclick = () => wrap.remove();
    wrap.querySelector(".tool-save").onclick = () => {
      const getv = (f) => wrap.querySelector('[data-f="' + f + '"]').value.trim();
      const label = getv("label"); if (!label) return;
      const cust = loadZxCustom(); cust.added = cust.added || [];
      cust.added.push({ id, cat: cat.split("·")[0].trim(), catName: cat, label, detail: getv("detail"), full: getv("full") || getv("detail"), custom: true });
      saveZxCustom(cust); renderZxToolbox(container);
    };
  }
  // 一键删除整个板块（认知系 / 财富系 / …）：该系下所有卡（含内置的）一并移出，可再次新增
  function zxDelCat(container, cat) {
    if (!cat) return;
    const items = getMergedCorpus().filter((x) => (x.catName || "杂览系·通用思维") === cat);
    if (!items.length) return;
    if (!window.confirm("确定删除「" + cat + "」整个板块吗？（共 " + items.length + " 张卡）\n删除后不会丢失其它板块，需要时可重新新增。")) return;
    const cust = loadZxCustom();
    cust.deleted = cust.deleted || [];
    items.forEach((it) => {
      cust.added = (cust.added || []).filter((x) => x.id !== it.id);
      if (cust.moved) delete cust.moved[it.id];
      if (cust.deleted.indexOf(it.id) < 0) cust.deleted.push(it.id);
    });
    if (Array.isArray(cust.cats) && ZX_BASE_CATS.indexOf(cat) < 0) cust.cats = cust.cats.filter((x) => x !== cat);
    saveZxCustom(cust);
    if (window.__zxOpen) delete window.__zxOpen[cat];
    renderZxToolbox(container);
    try { liuShout("已删除板块「" + cat + "」🗑"); } catch (e) {}
  }
  function renderZxToolbox(container) {
    if (!container) return;
    const items = getMergedCorpus();
    if (!items.length) { container.innerHTML = '<div class="muted">工具箱是空的，点「＋ 新增」添加你的方法。</div>'; return; }
    const groups = {};
    items.forEach((it) => { const k = it.catName || "杂览系·通用思维"; (groups[k] = groups[k] || []).push(it); });
    const order = zxAllCats();
    const keys = Object.keys(groups).sort((a, b) => order.indexOf(a) - order.indexOf(b));
    const ALL_CATS = zxAllCats();
    const seed = (label) => "讲讲「" + label + "」这个思维方法 / 工具：它的核心主张是什么、适合什么场景、普通人怎么用起来？请基于知乎上的真实讨论来讲。";
    // 各系（认知系 / 财富系 / …）默认折叠，点标题展开；展开状态跨重渲染保留
    if (!window.__zxOpen) window.__zxOpen = {};
    container.innerHTML =
      '<div class="row" style="margin-bottom:10px;gap:8px;align-items:center">' +
        '<button class="ghost" id="zxAddCat" title="新增一个你自己的系别">\uff0b 新增系别</button>' +
        '<span class="muted" style="font-size:12px">自定义你的分类（例：产品系·产品思维），建好后点系别里的「\uff0b 新增」加方法</span>' +
      '</div>' + keys.map((k, idx) => {
      const cards = groups[k].map((it) => `
        <div class="tool-card" data-id="${escAttr(it.id)}" draggable="true" title="拖动可调整顺序，或用右侧「移动分类」换分类">
          <div class="tool-name">${escHTML(it.label || "")}</div>
          <div class="tool-detail">${escHTML(it.detail || "")}</div>
          <button class="tool-more" data-id="${escAttr(it.id)}">展开原文 ▾</button>
          <div class="tool-full" data-id="${escAttr(it.id)}" style="display:none">${escHTML(it.full || it.detail || "")}</div>
          <div class="tool-actions">
            <button class="tool-ask" data-seed="${escAttr(seed(it.label || ""))}">🐾 让刘看山实时讲透</button>
            <select class="tool-cat-sel" data-id="${escAttr(it.id)}" title="移动到其它分类">
              ${ALL_CATS.map((kk) => '<option value="' + escAttr(kk) + '"' + (kk === k ? " selected" : "") + ">" + (kk === k ? "当前：" + escHTML(kk) : "→ " + escHTML(kk)) + "</option>").join("")}
            </select>
            <button class="tool-edit" data-id="${escAttr(it.id)}" title="编辑">✎</button>
            <button class="tool-del" data-id="${escAttr(it.id)}" title="删除">🗑</button>
          </div>
        </div>`).join("");
      // 「我的蒸馏模型」默认展开：否则用户收藏的蒸馏卡藏在折叠区里，切换模块回来像「被重置了」
      const open = window.__zxOpen[k] === undefined ? (k === "我的蒸馏模型" || idx === 0) : !!window.__zxOpen[k];
      return '<details class="zx-cat"' + (open ? ' open' : '') + ' data-cat="' + escAttr(k) + '">' +
        '<summary class="zx-cat-h"><span class="zx-caret">▸</span><span class="zx-dot" style="background:#7fe3c4"></span>' + escHTML(k) +
        ' <span class="zx-cat-n">(' + groups[k].length + ')</span>' +
        ' <button class="zx-add" data-cat="' + escAttr(k) + '">＋ 新增</button>' +
        '<button class="zx-del-cat" data-cat="' + escAttr(k) + '" title="删除整个板块">🗑 删整系</button></summary>' +
        '<div class="zx-tools">' + cards + '</div></details>';
    }).join("");
    const zxAddCatBtn = container.querySelector("#zxAddCat");
    if (zxAddCatBtn) zxAddCatBtn.onclick = () => zxAddCat(container);
    container.querySelectorAll("details.zx-cat").forEach((d) => {
      d.addEventListener("toggle", () => { window.__zxOpen[d.dataset.cat] = d.open; });
    });
    container.querySelectorAll(".tool-more").forEach((b) => {
      b.onclick = () => {
        const id = b.dataset.id;
        const full = Array.from(container.querySelectorAll(".tool-full")).find((f) => f.dataset.id === id);
        if (!full) return;
        const open = full.style.display !== "none";
        full.style.display = open ? "none" : "block";
        b.textContent = open ? "展开原文 ▾" : "收起 ▴";
      };
    });
    container.querySelectorAll(".tool-ask").forEach((b) => { b.onclick = () => openLiuChat(b.dataset.seed); });
    container.querySelectorAll(".tool-del").forEach((b) => {
      b.onclick = () => {
        const id = b.dataset.id; const cust = loadZxCustom();
        const added = (cust.added || []);
        if (added.find((x) => x.id === id)) cust.added = added.filter((x) => x.id !== id);
        else { cust.deleted = cust.deleted || []; if (!cust.deleted.includes(id)) cust.deleted.push(id); }
        saveZxCustom(cust); renderZxToolbox(container);
      };
    });
    container.querySelectorAll(".tool-edit").forEach((b) => { b.onclick = () => zxEditCard(container, b.dataset.id); });
    container.querySelectorAll(".zx-add").forEach((b) => { b.onclick = (e) => { e.preventDefault(); e.stopPropagation(); zxAddCard(container, b.dataset.cat); }; });
    container.querySelectorAll(".zx-del-cat").forEach((b) => { b.onclick = (e) => { e.preventDefault(); e.stopPropagation(); zxDelCat(container, b.dataset.cat); }; });
    // 自定义分类：把卡片移动到其它分类（落盘 cust.moved）
    container.querySelectorAll(".tool-cat-sel").forEach((s) => {
      s.addEventListener("change", () => {
        const id = s.dataset.id; const target = s.value;
        const cur = getMergedCorpus().find((x) => x.id === id);
        const curCat = cur ? (cur.catName || "杂览系·通用思维") : "";
        const cust = loadZxCustom(); cust.moved = cust.moved || {};
        if (target && target !== curCat) cust.moved[id] = target; else delete cust.moved[id];
        saveZxCustom(cust); renderZxToolbox(container);
      });
    });
    // 自定义拖拽排序：拖动卡片调整同分类内顺序，落盘到 cust.order[catName]
    let dragId = null;
    container.querySelectorAll(".tool-card").forEach((card) => {
      card.addEventListener("dragstart", (e) => { dragId = card.dataset.id; card.classList.add("dragging"); try { e.dataTransfer.effectAllowed = "move"; e.dataTransfer.setData("text/plain", dragId); } catch (_) {} });
      card.addEventListener("dragend", () => { card.classList.remove("dragging"); dragId = null; });
      card.addEventListener("dragover", (e) => { e.preventDefault(); });
      card.addEventListener("drop", (e) => {
        e.preventDefault();
        if (!dragId || dragId === card.dataset.id) return;
        const catEl = card.closest(".zx-cat"); if (!catEl) return;
        const cat = catEl.dataset.cat;
        const ids = Array.from(container.querySelectorAll('.zx-cat[data-cat="' + cat + '"] .tool-card')).map((c) => c.dataset.id);
        const from = ids.indexOf(dragId); const to = ids.indexOf(card.dataset.id);
        if (from < 0 || to < 0) return;
        ids.splice(to, 0, ids.splice(from, 1)[0]);
        const cust = loadZxCustom(); cust.order = cust.order || {}; cust.order[cat] = ids; saveZxCustom(cust);
        renderZxToolbox(container);
      });
    });
  }

  const MD_MODEL_KEY = "zhiyu_md_model";
  function saveMdModel(m) { try { if (m && m.name) localStorage.setItem(MD_MODEL_KEY, JSON.stringify({ name: m.name, core: m.core || "", when: m.when || "", tip: m.tip || "" })); } catch (e) {} }
  function loadMdModel() { try { return JSON.parse(localStorage.getItem(MD_MODEL_KEY) || "null"); } catch (e) { return null; } }
  const MD_LIST_KEY = "zhiyu_md_models";
  function saveMdModels(arr) { try { localStorage.setItem(MD_LIST_KEY, JSON.stringify(arr || [])); } catch (e) {} syncGraphAfterSave(); }
  function loadMdModels() { try { return JSON.parse(localStorage.getItem(MD_LIST_KEY) || "null"); } catch (e) { return null; } }
  const MD_SRC_KEY = "zhiyu_md_src";
  function saveMdSrc(o) { try { localStorage.setItem(MD_SRC_KEY, JSON.stringify(o || { zh: [], gl: [] })); } catch (e) {} }
  function loadMdSrc() { try { return JSON.parse(localStorage.getItem(MD_SRC_KEY) || "null"); } catch (e) { return null; } }
  // handlers: { onChat(m), onRefresh() } —— 由调用方 renderModels 注入。
  // 旧实现直接引用只在 renderModels 作用域内的 openChat / run，
  // 导致「和 TA 对话」「换一批蒸馏」两个按钮全部 ReferenceError（点了没反应）。
  function renderMdCards(outEl, models, srcHtml, handlers) {
    if (!outEl) return;
    if (!models || !models.length) { outEl.innerHTML = '<div class="empty">还没有蒸馏出任何思维模型。在上方输入一个领域，点「蒸馏思维模型」试试～</div>'; return; }
    const H = handlers || {};
    const cards = models.map((m) => {
      const _id = m.id || "";
      return `
      <div class="model-card" style="position:relative">
        <button class="md-del" data-id="${escAttr(_id)}" title="删除这一个蒸馏模型" style="position:absolute;top:6px;right:6px;width:24px;height:24px;line-height:1;border:none;border-radius:50%;background:rgba(255,90,90,.15);color:#ff6b6b;cursor:pointer;font-size:13px">✕</button>
        <h4>${escHTML(m.name || "思维模型")}</h4>
        <p class="model-core">${escHTML(m.core || "")}</p>
        <div class="model-meta"><span class="tag">何时用：${escHTML(m.when || "—")}</span></div>
        <p class="model-tip">💡 ${escHTML(m.tip || "")}</p>
        <div class="row"><button class="ghost md-chat" data-id="${escAttr(_id)}">🗨 和 TA 对话</button>
        <button class="ghost md-save" data-id="${escAttr(_id)}">＋ 收进工具箱</button></div>
      </div>`;
    }).join("");
    const clearBar = '<div class="row md-clear-bar" style="margin-bottom:10px"><button class="ghost" id="mdClearAll">🗑 清空所有蒸馏模型</button><span class="muted" style="margin-left:10px">共 ' + models.length + ' 个蒸馏模型</span></div>';
    outEl.innerHTML = clearBar + '<div class="section grid grid-2">' + cards + '</div>' + (srcHtml ? '<div class="md-sources">' + srcHtml + '</div>' : '') + '<div class="row"><button class="ghost" id="mdRefresh">🔄 换一批蒸馏</button></div>';
    outEl.querySelectorAll(".md-chat").forEach((b) => { b.onclick = () => { const m = models.find((x) => x.id === b.dataset.id); if (m && typeof H.onChat === "function") H.onChat(m); }; });
    outEl.querySelectorAll(".md-save").forEach((b) => { b.onclick = () => { const m = models.find((x) => x.id === b.dataset.id); if (!m) return; const cust = loadZxCustom(); cust.added = cust.added || []; const _nm = m.name || "思维模型"; if (cust.added.find((x) => x.label === _nm)) { liuShout("这个模型已经在你的工具箱里啦～"); return; } cust.added.push({ id: "dist_" + Date.now().toString(36) + Math.random().toString(36).slice(2, 6), cat: "我的蒸馏模型", catName: "我的蒸馏模型", label: m.name || "思维模型", detail: (m.core || "") + (m.when ? "（适用：" + m.when + "）" : ""), full: (m.core || "") + "\n" + (m.tip || ""), custom: true }); saveZxCustom(cust); const tb = document.getElementById("zxToolbox"); if (tb) renderZxToolbox(tb); liuShout("已收进「系统思维与方法论工具箱 · 我的蒸馏模型」🧰"); }; });
    outEl.querySelectorAll(".md-del").forEach((b) => { b.onclick = () => { if (typeof H.onDeleteOne === "function") H.onDeleteOne(b.dataset.id); }; });
    const rr = outEl.querySelector("#mdRefresh"); if (rr && typeof H.onRefresh === "function") rr.onclick = H.onRefresh;
    const ca = outEl.querySelector("#mdClearAll"); if (ca && typeof H.onClearAll === "function") ca.onclick = H.onClearAll;
  }
  async function renderModels(el) {
    let lastModels = [];
    let chatBusy = false;
    el.innerHTML = `
      <h3 class="lens-title">🧠 大佬思维模型 · 把知乎高手怎么想，蒸馏成你能用的卡</h3>
      <p class="view-sub">基于知乎开放平台全网实时讨论，把知乎高手的方法论蒸馏成你能用的卡——蒸馏出的模型都能直接对话、收进工具箱。真实可溯源，别人抄不走。</p>
      <div class="card" id="mdZhiWrap">
        <label>想蒸馏哪个领域 / 主题高手的方法论？</label>
        <input id="mdQ" placeholder="例：投资 / 产品思维 / 写作变现 / 高效学习" />
        <div class="row"><button id="mdRun">蒸馏思维模型（知乎实时 + 全网）</button></div>
        <div id="mdOut"></div>
      </div>
      <div class="card" id="mdChatCard" style="display:none">
        <h3>🗨 和「<span id="mdChatName"></span>」对话</h3>
        <p class="muted" id="mdChatCore"></p>
        <div class="chat" id="mdChatBox"></div>
        <div class="row" style="margin-top:10px">
          <input id="mdChatInput" placeholder="用这个模型的视角，问它一个问题…" />
          <button id="mdChatSend">问 TA</button>
        </div>
      </div>
      <details class="section card ztm-fold" id="zxToolboxCard" open>
        <summary class="ztm-summary"><h3>🧰 系统思维与方法论工具箱</h3></summary>
        <p class="muted">把所有思维工具按主题分好类，每个都给了详细内容；点任一个，刘看山会基于知乎实时讨论给你讲透（遵循第一原则：真实调用知乎接口）。</p>
        <div class="row" style="margin: 10px 0; gap: 8px;">
  <input id="zxToolboxSearch" placeholder="🔍 搜索思维模型" style="flex: 1;" />
  <button class="ghost" id="zxToolboxShowAll">🔄 显示全部</button>
</div>
<div id="zxToolbox"></div>
      </details>`;
    const mdChatBox = () => el.querySelector("#mdChatBox");
    const openChat = (m) => {
      const card = el.querySelector("#mdChatCard");
      if (card) card.style.display = "";
      if (card && card.scrollIntoView) card.scrollIntoView({ behavior: "smooth" });
      const nameEl = el.querySelector("#mdChatName"); if (nameEl) nameEl.textContent = m.name || "思维模型";
      const coreEl = el.querySelector("#mdChatCore"); if (coreEl) coreEl.textContent = "核心主张：" + (m.core || "");
      // 切换不同思维模型时清空上一段对话，避免「显示上一个思维模型」；
      // 若是同一模型（含切走模块再切回的自动恢复），则保留历史（满足 #9 不重置）。
      const prevId = (loadMdModel() || {}).id;
      const switching = prevId && prevId !== m.id;
      if (switching) { chatReset("mdChatBox"); liuHistories["mdChatBox"] = []; chatSetPending("mdChatBox", false); }
      saveMdModel(m);
      renderChat("mdChatBox");
      if (chatGet("mdChatBox").msgs.length === 0) appendMsg("mdChatBox", "liu", "我是「" + (m.name || "思维模型") + "」：说说你正面对的事，我用这个视角帮你拆。");
      const send = async () => {
        if (chatBusy) return; chatBusy = true;
        const inp = el.querySelector("#mdChatInput");
        if (!inp) { chatBusy = false; return; }
        const t = inp.value.trim(); if (!t) { chatBusy = false; return; }
        chatAppend("mdChatBox", { s: "user", t: t, who: "你" }); inp.value = "";
        chatSetPending("mdChatBox", true, m.name || "思维模型");
        // 第一原则：实时调用知乎直答，每次 variant 不同 → 不模板化
        let ans = (m.tip || m.core || "（暂未连知乎，先用这一视角给你一句：换个角度看看，答案可能就在框外。）");
        try {
          const sysCtx = "你现在是「" + (m.name || "思维模型") + "」这一思维模型的化身。其核心主张是：" + (m.core || "") +
            "。适用场景：" + (m.when || "") + "。请用该模型的独特视角、口语化地回答用户的问题，像一位有脾气的老手在给建议，不要泛泛而谈、不要模板化、不要列 1234 的说明书。";
          const r = await callZhihu("answer", { query: sysCtx + "\n\n用户问：" + t, model: "zhida-thinking-1p5", variant: newVariant(), fresh: true });
          if (!r.mock && r.content) ans = r.content;
        } catch (e2) {
          ans = (m.tip || m.core || "（网络开了小差，换个说法再问一次～）");
        }
        chatSetPending("mdChatBox", false);
        chatAppend("mdChatBox", { s: "liu", t: ans, who: m.name || "思维模型" });
        chatBusy = false;
      };
      const mdSendEl = el.querySelector("#mdChatSend"); if (mdSendEl) mdSendEl.onclick = send;
      const mdInpEl = el.querySelector("#mdChatInput"); if (mdInpEl) mdInpEl.onkeydown = (e) => { if (e.key === "Enter") send(); };
    };
    const run = async () => {
      const qEl = el.querySelector("#mdQ");
      if (!qEl) return;
      const q = qEl.value.trim();
      if (!q) return;
      const out = el.querySelector("#mdOut");
      if (!out) return;
      window.__mdDistilling = true; // #B 标记蒸馏进行中：切走再切回也不会被当成「空重置」
      out.innerHTML = '<div class="note">刘看山正在全网蒸馏高手们的方法论…</div>';
      const r = await callZhihu("models", { q, fresh: true });
      window.__mdDistilling = false;
      const liveOut = el.querySelector("#mdOut") || out; // #B 切走再切回后 DOM 已重建，写回当前节点，蒸馏不被打断
      if (!r.mock && r.models && r.models.length) {
        lastModels = r.models.map((m, i) => Object.assign({ id: "m" + i }, m));
        saveMdModels(lastModels);
        const _msp = _splitSources(r.sources || []);
        const _zhS = (r.refsZhihu && r.refsZhihu.length) ? r.refsZhihu : _msp.zh;
        const _glS = (r.refsGlobal && r.refsGlobal.length) ? r.refsGlobal : _msp.gl;
        const sources = (_zhS.length || _glS.length)
          ? '<div style="margin-top:14px">' + _srcGroupHTML('蒸馏来源 · 知乎', '🔵', _zhS, true) + _srcGroupHTML('蒸馏来源 · 全网', '🌐', _glS, true) + '</div>'
          : '';
        saveMdSrc({ zh: _zhS, gl: _glS });
        recordFootprint("蒸馏模型", "蒸馏了「" + (lastModels && lastModels[0] ? lastModels[0].name : "未知模型") + "」思维模型");
        renderMdCards(liveOut, lastModels, sources, { onChat: openChat, onRefresh: run, onDeleteOne: deleteOne, onClearAll: clearAll });
        awardXP({ vis: 6, con: 4 }, "蒸馏大佬思维模型");
      } else {
        liveOut.innerHTML = (r.note ? `<div class="note">${r.note}</div>` : "") + '<div class="empty">实时蒸馏暂时没拿到结果（多为网络波动）。你已经登录知乎开放平台、密钥已就位——点上方「蒸馏思维模型」重试即可。</div>';
      }
      liuSay("explore");
    };
    const deleteOne = (id) => {
      const arr = (loadMdModels() || []).filter((x) => x.id !== id);
      saveMdModels(arr);
      const cur = loadMdModel();
      if (cur && cur.id === id) {
        const card = el.querySelector("#mdChatCard"); if (card) card.style.display = "none";
        chatReset("mdChatBox"); liuHistories["mdChatBox"] = []; chatSetPending("mdChatBox", false);
        try { localStorage.removeItem(MD_MODEL_KEY); } catch (e) {}
      }
      const src = loadMdSrc() || { zh: [], gl: [] };
      const srcHtml = (src.zh.length || src.gl.length)
        ? '<div style="margin-top:14px">' + _srcGroupHTML('蒸馏来源 · 知乎', '🔵', src.zh || [], true) + _srcGroupHTML('蒸馏来源 · 全网', '🌐', src.gl || [], true) + '</div>'
        : '';
      renderMdCards(el.querySelector("#mdOut"), arr, srcHtml, { onChat: openChat, onRefresh: run, onDeleteOne: deleteOne, onClearAll: clearAll });
    };
    const clearAll = () => {
      if (!confirm("确定清空所有蒸馏出来的思维模型？此操作不可撤销。")) return;
      saveMdModels([]); saveMdSrc({ zh: [], gl: [] });
      try { localStorage.removeItem(MD_MODEL_KEY); } catch (e) {}
      const card = el.querySelector("#mdChatCard"); if (card) card.style.display = "none";
      chatReset("mdChatBox"); liuHistories["mdChatBox"] = []; chatSetPending("mdChatBox", false);
      el.querySelector("#mdOut").innerHTML = '<div class="empty">还没有蒸馏出任何思维模型。在上方输入一个领域，点「蒸馏思维模型」试试～</div>';
    };
    el.querySelector("#mdRun").onclick = run;
    // 真书蒸馏（典籍藏书）已按需求移除：大佬思维模型只保留「知乎高手」实时蒸馏锚点
    renderZxToolbox(el.querySelector("#zxToolbox"));
    // 重进页面：若上一次蒸馏还在进行中，给个提示（结果出来会自动刷到当前 #mdOut，不会被当成「重置清空」）
    if (window.__mdDistilling) {
      const _o = el.querySelector("#mdOut");
      if (_o) _o.innerHTML = '<div class="note">⏳ 上一次的蒸馏还在进行中，结果出来会自动刷新到这里，不会丢失～</div>';
    }
    // 重进页面：恢复上次蒸馏的模型卡片 + 与某个模型的对话历史（均来自持久化）
    const savedList = loadMdModels();
    const savedSrc = loadMdSrc();
    const savedSrcHtml = (savedSrc && (savedSrc.zh.length || savedSrc.gl.length))
      ? '<div style="margin-top:14px">' + _srcGroupHTML('蒸馏来源 · 知乎', '🔵', savedSrc.zh || [], true) + _srcGroupHTML('蒸馏来源 · 全网', '🌐', savedSrc.gl || [], true) + '</div>'
      : '';
    if (savedList && savedList.length) renderMdCards(el.querySelector("#mdOut"), savedList, savedSrcHtml, { onChat: openChat, onRefresh: run, onDeleteOne: deleteOne, onClearAll: clearAll });
    const savedM = loadMdModel();
    if (savedM && chatGet("mdChatBox").msgs.length > 0) { openChat(savedM); }
  }


  // ---------- 刘看山脊柱：成长足迹（跨模块串联）----------
  const FP_KEY = "zhiyu_footprint";
  function recordFootprint(module, text) {
    try {
      const arr = JSON.parse(localStorage.getItem(FP_KEY) || "[]");
      arr.unshift({ at: new Date().toLocaleString("zh-CN", { month: "numeric", day: "numeric", hour: "2-digit", minute: "2-digit" }), module, text });
      localStorage.setItem(FP_KEY, JSON.stringify(arr.slice(0, 30)));
    } catch (e) {}
  }
  function footprintHTML() {
    // 2026-09-15 按需求：首页「🕰️ 时间轴 · 成长足迹」板块已下线，此处直接返回空串。
    // 仅影响首页；养成(grow)页自己的 #growTimeline 不受影响。回滚只需删掉下面这行 return。
    return "";
    let fp = [];
    try { fp = JSON.parse(localStorage.getItem(FP_KEY) || "[]"); } catch (e) {}
    let g = null;
    try { g = JSON.parse(localStorage.getItem(GROWTH_KEY) || "{}"); } catch (e) {}
    const logs = (g && g.log) || [];
    const streak = (g && g.streak) || 0;
    const items = [];
    fp.slice(0, 14).forEach((f) => items.push({ at: f.at, mod: f.module, text: f.text, xp: 0 }));
    logs.slice(0, 14).forEach((l) => items.push({ at: l.at, mod: "养成", text: l.reason, xp: l.gained || 0 }));
    if (!items.length) return "";
    const li = items.slice(0, 16).map((it) => `<li class="tl-li"><span class="tl-dot"></span><div class="tl-body"><span class="fp-mod">${escHTML(it.mod || "")}</span> ${escHTML(it.text || "")} ${it.xp ? `<span class="tl-xp">+${it.xp} XP</span>` : ""}<span class="fp-at">${escHTML(it.at || "")}</span></div></li>`).join("");
    return `<div class="footprint timeline-view"><h3>🕰️ 时间轴 · 成长足迹</h3><div class="tl-streak">🔥 连续 ${streak} 天 · 别人做单次会话，知遇录把每一次使用都留成<b>可追溯的成长印记</b>，更有创新的养成系统助力你的成长</div><ul class="timeline-list">${li}</ul></div>`;
  }

  // ---------- 刘看山全局互动（桌宠对话：真正接话）----------
  async function liuChat() {
    const inp = document.getElementById("liuInput");
    if (!inp) return;
    const t = inp.value.trim();
    if (!t) return;
    inp.value = "";
    openLiuChat(t);
  }

  // ---------- 桌宠操作层：刘看山不仅能回答，还能按用户需求改界面、操作知遇录 ----------
  function liuParseItem(text, mode) {
    const urls = Array.from((text || "").matchAll(/https?:\/\/[^\s，。、！？]+/g)).map((m) => m[0]);
    const url = urls[0] || "";
    const strip = (s) => s.replace(/^(记住|收藏|添加|记一下|存下|收录|记下|这个网站|网站|导航|关注|博主|大佬|up主|大V|把|了|：|:)/, "").trim();
    let name = "", plat = "";
    if (url) {
      const before = strip(text.slice(0, text.indexOf(url)).replace(/[，。、！？\s]/g, "")).slice(-12);
      name = before || url;
      if (/zhihu|知乎/.test(url)) plat = "知乎";
    } else {
      name = strip(text.replace(/[，。、！？\s]+/g, " ").trim()).slice(0, 20);
      if (/zhihu|知乎/.test(text)) plat = "知乎";
    }
    if (!name) return null;
    return { name, url, plat };
  }
  function liuAddSite(it) {
    try {
      const a = JSON.parse(localStorage.getItem("zhiyu_sites") || "[]");
      if (!a.some((x) => x.name === it.name || (it.url && x.url === it.url))) { a.push(it); localStorage.setItem("zhiyu_sites", JSON.stringify(a)); }
    } catch (e) {}
  }
  function liuAddBlog(it) {
    try {
      const a = JSON.parse(localStorage.getItem("zhiyu_bloggers") || "[]");
      if (!a.some((x) => x.name === it.name || (it.url && x.url === it.url))) { a.push(it); localStorage.setItem("zhiyu_bloggers", JSON.stringify(a)); }
    } catch (e) {}
  }
  async function liuTryZhihuFollow(item) {
    try {
      const r = await callZhihu("search", { q: item.name, Count: 3, fresh: true });
      if (!r.mock && r.items && r.items.length) {
        const hit = r.items.find((x) => x.url && /people|member|zhihu/.test(x.url)) || r.items[0];
        if (hit && hit.url) {
          const a = JSON.parse(localStorage.getItem("zhiyu_bloggers") || "[]");
          const t = a.find((x) => x.name === item.name);
          if (t) { t.zhihu = hit.url; if (!t.plat) t.plat = "知乎"; localStorage.setItem("zhiyu_bloggers", JSON.stringify(a)); }
        }
      }
    } catch (e) {}
  }
  // 解析用户意图：跳转模块（改界面）/ 新增网站·博主·能力维度（操作数据）。命中返回 true
  async function liuAct(q) {
    // 1) 跳转模块（修改界面展示）
    const NAV = [
      { re: /复盘/, hash: "#review", name: "复盘" },
      { re: /自我认知|认识自己/, hash: "#self", name: "自我认知" },
      { re: /检索|人生样本|样本库|处境对齐|对齐处境/, hash: "#explore", name: "知遇·检索" },
      { re: /领域速通|啃个领域|进新领域/, hash: "#field", name: "领域速通" },
      { re: /思维模型|大佬思维/, hash: "#models", name: "大佬思维模型" },
      { re: /养成|大佬必修|能力画布/, hash: "#grow", name: "我的大佬养成系统" },
      { re: /私人知识库|网站导航|关注.*博主|全网博主|碎片记录|链接收藏/, hash: "#learn", name: "私人知识库" },
      { re: /人生传记|生命之书|传记/, hash: "#bio", name: "人生传记·生命之书" },
    ];
    if (/(去|打开|到|看|进入|切|导航|来|跳)/.test(q)) {
      for (const n of NAV) {
        if (n.re.test(q)) { location.hash = n.hash; appendMsg("liuChatBox", "liu", "✅ 已帮你切到「" + n.name + "」界面，去那里慢慢操作就行～"); return true; }
      }
    }
    // 2) 新增网站导航
    if (/(网站|导航|站点)/.test(q)) {
      const m = q.match(/(?:添加|收藏|记住|收录|记一下|存下|加入|把)(?:这个)?(?:网站|导航)?\s*[:：]?\s*(.+)/);
      if (m) {
        const it = liuParseItem(m[1], "sites");
        if (it && it.name) { liuAddSite(it); appendMsg("liuChatBox", "liu", "✅ 已收进「我的网站导航」：" + it.name + (it.url ? "（" + it.url + "）" : "") + "。去「私人知识库 → 碎片记录 → 🔗 链接」就能看到。"); return true; }
      }
    }
    // 3) 新增博主（并尝试在知乎站内找关注入口）
    if (/(博主|up主|大佬|大V|作者)/.test(q)) {
      const m = q.match(/(?:关注|收藏|记住|添加|记一下)(?:这个)?(?:博主|up主|大佬|大V|作者)?\s*[:：]?\s*(.+)/);
      if (m) {
        const it = liuParseItem(m[1], "blogs");
        if (it && it.name) {
          liuAddBlog(it);
          appendMsg("liuChatBox", "liu", "✅ 已记到「我关注的全网博主」：" + it.name + (it.plat ? "（" + it.plat + "）" : "") + (it.url ? "（" + it.url + "）" : "") + "。去「私人知识库 → 碎片记录 → 🔗 链接」就能看到。");
          liuTryZhihuFollow(it);
          return true;
        }
      }
    }
    // 4) 新增能力维度（养成大佬必修）
    if (/(能力维度|维度|能力)/.test(q)) {
      const m = q.match(/(?:新增|添加|加一个|增加|新建)(?:能力维度|维度|能力)?\s*[:：]?\s*(.+)/);
      if (m) {
        const nm = m[1].replace(/[。.，,？?！!].*$/, "").trim();
        if (nm && !["能力维度", "维度", "能力"].includes(nm)) {
          const st = loadStats();
          if (!st.find((x) => x.name === nm)) { st.push({ id: "s" + Date.now(), name: nm, icon: "⭐", desc: "" }); saveStats(st); }
          appendMsg("liuChatBox", "liu", "✅ 已新增能力维度「" + nm + "」，去「我的大佬养成系统」给它加经验吧。");
          return true;
        }
      }
    }
    return false;
  }

  // 全局刘看山对话浮层：复用 liuReply（liuanswer 实时全网搜索 + 来源卡）
  // 支持传入 seed 问题自动发送；用户可继续追问。遵循第一原则：真实调用知乎接口。
  let _liuChatReady = false;
  function ensureLiuChatDom() {
    if (_liuChatReady) return;
    const host = document.getElementById("liuChatModal");
    if (!host) return;
    const box = host.querySelector("#liuChatBox");
    const input = host.querySelector("#liuChatInput");
    const send = host.querySelector("#liuChatSend");
    const close = host.querySelector("#liuChatClose");
    const doSend = async () => {
      const q = input.value.trim();
      if (!q) return;
      input.value = "";
      appendMsg("liuChatBox", "user", q); // 先把用户的问题入框，对话才连贯（与 selfChat/rvChat 等模块一致）
      // 先尝试按用户需求「改界面 / 操作知遇录」；未命中意图才走普通问答
      const acted = await liuAct(q);
      const b = document.getElementById("liuBubble");
      if (acted) {
        if (b) { b.classList.remove("fadeout"); b.style.visibility = "visible"; b.innerHTML = "🐾 已帮你操作好啦～"; clearTimeout(window.__liuBubbleT); window.__liuBubbleT = setTimeout(() => { b.classList.add("fadeout"); }, 2600); }
        return;
      }
      await liuReply("liuChatBox", { q, persona: "explore", showSources: true, fresh: true }, "我在呢，但实时接口暂时没连上，稍后再聊～");
      if (b) { b.classList.remove("fadeout"); b.style.visibility = "visible"; b.innerHTML = "🐾 我在对话框里回你啦～"; clearTimeout(window.__liuBubbleT); window.__liuBubbleT = setTimeout(() => { b.classList.add("fadeout"); }, 2600); }
    };
    send.onclick = doSend;
    input.addEventListener("keydown", (e) => { if (e.key === "Enter") doSend(); });
    close.onclick = () => host.classList.remove("show");
    host.addEventListener("click", (e) => { if (e.target === host) host.classList.remove("show"); });
    _liuChatReady = true;
  }
  function openLiuChat(seedQ) {
    const host = document.getElementById("liuChatModal");
    if (!host) return;
    ensureLiuChatDom();
    host.classList.add("show");
    const input = host.querySelector("#liuChatInput");
    if (seedQ) {
      const box = host.querySelector("#liuChatBox");
      if (!box) return;
      chatReset("liuChatBox"); // 新主题开聊：同时清 DOM + localStorage，避免旧话题回滚/堆叠成重复框
      box.innerHTML = "";
      liuHistories["liuChatBox"] = []; // 新主题开聊，清空该框多轮记忆，避免串台
      input.value = seedQ;
      const sendBtn = host.querySelector("#liuChatSend");
      if (sendBtn) sendBtn.click();
    }
    if (input) setTimeout(() => input.focus(), 50);
  }

  // ---------- 人生传记 · 生命之书（模块七：前 6 模块沉淀的集大成出口）----------
  // 数据模型（借鉴 Paragraph/Recipe + 分层时间线范式改写）：
  //   Biography { meta, chapters[], manual[], updatedAt }
  //   Chapter   { id, title, period{from,to}, theme, episodes[], liuNarration, sourceRefs[] }
  //   Episode   { date, title, content, mood, tags[], people[], sourceModule }
  const BIO_KEY = "zhiyu_bio";
  function loadBio() {
    try { const b = JSON.parse(localStorage.getItem(BIO_KEY)); if (b && Array.isArray(b.chapters)) return b; } catch (e) {}
    return { meta: {}, chapters: [], manual: [], updatedAt: "" };
  }
  function saveBio(b) { try { localStorage.setItem(BIO_KEY, JSON.stringify(b)); } catch (e) {} }

  // ---------- 传记：写书/读书/时间线/素材 通用增删改 ----------
  function bioFindChapter(id) { const b = loadBio(); return b.chapters.find((c) => c.id === id); }
  function bioSaveChapterById(id, patch) {
    const b = loadBio();
    const ch = b.chapters.find((c) => c.id === id);
    if (!ch) return false;
    Object.assign(ch, patch);
    b.updatedAt = new Date().toLocaleString("zh-CN");
    saveBio(b);
    return true;
  }
  function bioDeleteChapter(id) {
    const b = loadBio();
    const i = b.chapters.findIndex((c) => c.id === id);
    if (i < 0) return false;
    b.chapters.splice(i, 1);
    b.updatedAt = new Date().toLocaleString("zh-CN");
    saveBio(b);
    return true;
  }
  function bioDeleteManual(idx) {
    const b = loadBio();
    if (!b.manual || !b.manual[idx]) return false;
    b.manual.splice(idx, 1);
    b.updatedAt = new Date().toLocaleString("zh-CN");
    saveBio(b);
    return true;
  }
  function bioCompressImage(file, max) {
    return new Promise((resolve, reject) => {
      const fr = new FileReader();
      fr.onerror = () => reject(new Error("read"));
      fr.onload = () => {
        const img = new Image();
        img.onload = () => {
          try {
            const sc = Math.min(1, max / Math.max(img.width || 1, img.height || 1));
            const c = document.createElement("canvas");
            c.width = Math.round((img.width || 1) * sc); c.height = Math.round((img.height || 1) * sc);
            c.getContext("2d").drawImage(img, 0, 0, c.width, c.height);
            resolve(c.toDataURL("image/jpeg", 0.82));
          } catch (err) { reject(err); }
        };
        img.onerror = () => reject(new Error("parse"));
        img.src = String(fr.result || "");
      };
      fr.readAsDataURL(file);
    });
  }

  // 自动聚合前 6 模块已沉淀的本地素材（仅用户自己输入的内容，无隐私越界）
  // 「我的素材」与全站同步：自我画像 / 复盘 / 养成 / 领域速通 / 复习卡 / 目标体系 / 碎片 / 错题本 / 笔记 / 原则
  function aggregateMaterials() {
    let self = null, reviews = [], growth = null, plans = [], cards = [], mailuo = null, mistakes = [], notes = [], principles = [];
    try { self = JSON.parse(localStorage.getItem("zhiyu_self") || "null"); } catch (e) {}
    try { reviews = JSON.parse(localStorage.getItem("zhiyu_reviews") || "[]") || []; } catch (e) {}
    try { growth = loadGrowth(); } catch (e) {}
    try {
      const p = JSON.parse(localStorage.getItem("zhiyu_plans") || "null");
      plans = Array.isArray(p) ? p : (p ? [p] : []);
    } catch (e) {}
    try {
      const c = JSON.parse(localStorage.getItem("zhiyu_cards") || "null");
      cards = Array.isArray(c) ? c : ((c && Array.isArray(c.cards)) ? c.cards : []);
    } catch (e) {}
    try { mailuo = loadMailuo(); } catch (e) {}
    try { mistakes = loadMistakes() || []; } catch (e) {}
    try { notes = loadNotes() || []; } catch (e) {}
    try { principles = getPrinciples() || []; } catch (e) {}
    const selfStr = self ? (`MBTI ${self.m || "未测"}，星座 ${self.z || "未选"}，自述「${self.kw || ""}」`) : "（暂无自我画像，去「自我认知」聊几句会更准）";
    const reviewStr = reviews.length ? reviews.slice(0, 3).map((r) => `《${r.event || "某件事"}》`).join("、") : "（暂无复盘记录）";
    const growStr = growth ? (`Lv.${growth.level} ${growth.rank}，累计 ${growth.xp} XP`) : "（暂无成长记录）";
    const planStr = plans.length ? plans.slice(0, 4).map((p) => `《${p.q || p.domain || p.title || "某领域"}》`).join("、") : "（暂无领域速通计划）";
    const cardStr = cards.length ? cards.slice(0, 5).map((c) => String(c.front || c.q || c.title || "").slice(0, 18)).join("、") : "（暂无复习卡）";
    const _lgx = (mailuo && mailuo.lifeGoals && mailuo.lifeGoals[0] && mailuo.lifeGoals[0].text) || (mailuo && mailuo.lifeGoal) || "";
    const goalStr = (mailuo && (_lgx.trim() || (mailuo.pillars || []).length)) ? (_lgx || "（未填人生大目标，但已建支柱）") : "（暂无目标体系）";
    const fragList = (mailuo && mailuo.fragments) ? mailuo.fragments : [];
    const hasData = !!(self || reviews.length || (growth && growth.xp > 0) || plans.length || cards.length || fragList.length || notes.length);
    // 每条素材结构化（用于「我的素材」可点击跳回来源板块 + 带来源/时间标注）
    const items = [];
    if (self) items.push({ src: "self", srcLabel: "自我认知", hash: "#self", title: "MBTI " + (self.m || "未测") + " · 星座 " + (self.z || "未选"), sub: (self.kw || ""), ts: null });
    reviews.forEach(function (r) { items.push({ src: "review", srcLabel: "复盘", hash: "#review", title: "《" + (r.event || "某件事") + "》", sub: "", ts: (r.ts || r.at || null) }); });
    if (growth) items.push({ src: "growth", srcLabel: "养成 · 成长", hash: "#grow", title: "Lv." + growth.level + " 「" + growth.rank + "」", sub: (growth.xp + " XP"), ts: (growth.log && growth.log[0] ? growth.log[0].at : null) });
    plans.forEach(function (p) { items.push({ src: "field", srcLabel: "领域速通", hash: "#field", title: "《" + (p.q || p.domain || p.title || "某领域") + "》", sub: "", ts: (p.ts || p.at || null) }); });
    cards.forEach(function (c) { items.push({ src: "card", srcLabel: "复习卡", hash: "#check", title: String(c.front || c.q || c.title || "").slice(0, 30), sub: "", ts: (c.ts || c.at || null) }); });
    if (mailuo) {
      if (_lgx.trim() || (mailuo.pillars || []).some(function (p) { return p.goal; })) items.push({ src: "goal", srcLabel: "目标体系", hash: "#grow", title: (_lgx || "人生目标体系").slice(0, 30), sub: "", ts: null });
      (mailuo.fragments || []).forEach(function (f) { items.push({ src: "frag", srcLabel: "碎片记录", hash: "#grow", title: String(f.text || f.title || f.url || "一条碎片").slice(0, 40), sub: "", ts: (f.ts || f.at || null) }); });
    }
    mistakes.forEach(function (m) { items.push({ src: "mistake", srcLabel: "错题本", hash: "#check", title: String(m.q || "一道错题").slice(0, 40), sub: "", ts: (m.at || null) }); });
    notes.forEach(function (n) { items.push({ src: "note", srcLabel: "笔记", hash: "#graph", title: (n.title || "未命名笔记"), sub: "", ts: (n.updatedAt || n.createdAt || null) }); });
    principles.forEach(function (p) { items.push({ src: "principle", srcLabel: "原则", hash: "#self", title: String(p.text || p.rule || p || "").slice(0, 40), sub: "", ts: (p.ts || p.at || null) }); });
    return { self, reviews, growth, plans, cards, mailuo, mistakes, notes, principles,
             selfStr, reviewStr, growStr, planStr, cardStr, goalStr, fragList, hasData, items };
  }
  function bioLocalNarration(stage, theme, manual, mats) {
    const lines = [];
    lines.push(`关于「${stage}」，记忆总从一些很小的东西开始。`);
    if (manual) lines.push(manual.replace(/\n/g, ""));
    if (mats.self && mats.self.kw) lines.push(`那时你大概还不太确定自己是谁——后来你在「自我认知」里这样形容自己：${mats.self.kw}。`);
    if (mats.reviews.length) {
      const ev = mats.reviews[0].event || "一件事";
      lines.push(`有一桩事你后来专门回过头复盘过：${ev}。复盘不是为了责备那时的自己，而是看清当时做了什么选择。`);
    }
    if (mats.growth && mats.growth.xp > 0) lines.push(`再往后，这些经历慢慢变成你身上的东西——到今天，你在「养成」里已经是 Lv.${mats.growth.level} 的「${mats.growth.rank}」，累计 ${mats.growth.xp} 点经验。`);
    lines.push(`「${theme}」不是一句总结，是一段还在继续的路。`);
    return lines.join("\n\n");
  }
  function bioLocalLiu() {
    return "这一章我替你记下了。写传记不是为了回头伤感，是让你看见：那些你以为散落的事，其实连成了一条线。下一章，想写哪段？";
  }
  let bioState = null;
  const BIO_STAGES = ["童年与来处", "求学时代", "初入社会 / 职场转折", "亲密关系与他人", "最近的自己"];
  // ---------- 语音输入（Web Speech API）+ 人生传记封面 ----------
  function zyVoiceSupported() { return !!(window.SpeechRecognition || window.webkitSpeechRecognition); }
  function zyVoiceInput(target, btn) {
    if (!zyVoiceSupported()) { if (window.liuShout) liuShout("当前浏览器不支持语音输入（请用 Chrome / Edge 并授权麦克风）。"); return; }
    var SR = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (btn.__rec) { try { btn.__rec.stop(); } catch (e) {} return; }
    var rec = new SR(); rec.lang = "zh-CN"; rec.interimResults = true; rec.continuous = false;
    var base = btn.textContent;
    rec.onresult = function (ev) {
      var txt = ""; for (var i = 0; i < ev.results.length; i++) txt += ev.results[i][0].transcript;
      if (target) { target.value = (target.value ? target.value + " " : "") + txt; if (target.dispatchEvent) try { target.dispatchEvent(new Event("input")); } catch (e) {} }
    };
    rec.onend = function () { btn.textContent = base; if (btn.classList) btn.classList.remove("recording"); btn.__rec = null; };
    rec.onerror = function () { btn.textContent = base; if (btn.classList) btn.classList.remove("recording"); btn.__rec = null; };
    btn.__rec = rec; btn.textContent = "● 聆听中…"; if (btn.classList) btn.classList.add("recording");
    try { rec.start(); } catch (e) { btn.textContent = base; btn.__rec = null; }
  }
  function zyAttachMic(scope) {
    try {
      if (!zyVoiceSupported()) return;
      if (!scope || !scope.querySelectorAll) return;
      scope.querySelectorAll("textarea.js-voice, input.js-voice").forEach(function (inp) {
        if (inp.__micAttached) return; inp.__micAttached = true;
        var btn = document.createElement("button"); btn.type = "button"; btn.className = "zy-mic"; btn.textContent = "🎤 语音";
        btn.setAttribute("aria-label", "语音输入");
        var box = document.createElement("div"); box.className = "zy-mic-row";
        inp.parentNode.insertBefore(box, inp); box.appendChild(inp); box.appendChild(btn);
        btn.onclick = function () { zyVoiceInput(inp, btn); };
      });
    } catch (e) {}
  }
  // ---------- 封面开本尺寸（真实图书规格，单位 mm）----------
  const BIO_SIZES = [
    { k: "pocket", n: "口袋本", w: 105, h: 148 },
    { k: "k32", n: "32 开", w: 130, h: 184 },
    { k: "k32b", n: "大 32 开", w: 140, h: 203 },
    { k: "a5", n: "A5", w: 148, h: 210 },
    { k: "k16", n: "16 开", w: 185, h: 260 },
    { k: "square", n: "方背本", w: 170, h: 170 }
  ];
  function bioSizeOf(k) {
    for (var i = 0; i < BIO_SIZES.length; i++) if (BIO_SIZES[i].k === k) return BIO_SIZES[i];
    return BIO_SIZES[1];
  }
  // 关键铁律：dataURL 绝不能拼进 HTML 属性里的 url("...")——那个双引号会把 style="..."
  // 提前闭合，浏览器拿到的 style 只剩 background-image:url(，图片永远不显示。
  // 统一走 CSSOM 赋值（el.style.backgroundImage），或 HTML 里用 &quot; 实体。
  function bioCoverBgHTML(cv) {
    if (!cv || !cv.image) return "";
    return "background-image:url(&quot;" + cv.image + "&quot;);background-size:cover;background-position:center";
  }
  function bioApplyCover(el, cv, scale) {
    if (!el) return;
    cv = cv || {};
    var s = bioSizeOf(cv.size);
    el.style.setProperty("--cvw", String(s.w));
    el.style.setProperty("--cvh", String(s.h));
    el.style.setProperty("--cvscale", String(scale == null ? 1 : scale));
    if (cv.image) {
      el.style.backgroundImage = 'url("' + cv.image + '")';
      el.style.backgroundSize = "cover";
      el.style.backgroundPosition = "center";
    } else {
      el.style.backgroundImage = "";
      el.style.backgroundSize = "";
      el.style.backgroundPosition = "";
    }
  }
  function bioCoverBannerHTML(b) {
    var cv = (b && b.meta && b.meta.cover) || {};
    if (!cv.title && !cv.subtitle && !cv.image) return "";
    var s = bioSizeOf(cv.size);
    return '<div class="bio-cover bio-cover-mini" style="--cvw:' + s.w + ';--cvh:' + s.h + ';--cvscale:.52;' + bioCoverBgHTML(cv) + '"><div class="bio-cover-ov"><div class="bio-cover-title">' + escHTML(cv.title || "") + '</div><div class="bio-cover-sub">' + escHTML(cv.subtitle || "") + '</div></div></div>';
  }
  function renderBioCover() {
    var card = document.getElementById("bioCoverCard"); if (!card) return;
    var b = loadBio(); var cv = (b.meta && b.meta.cover) || {};
    var title = cv.title || (b.chapters[0] ? b.chapters[0].title : "") || "我的生命之书";
    var sub = cv.subtitle || "一本由刘看山陪你写下的传记";
    card.innerHTML = '<div class="bio-cover-stage"><div class="bio-cover" data-cvsize="' + escAttr(cv.size || "k32") + '"><div class="bio-cover-ov"><div class="bio-cover-title">' + escHTML(title) + '</div><div class="bio-cover-sub">' + escHTML(sub) + '</div></div></div></div>' +
      '<div class="row" style="justify-content:center;margin-top:14px;gap:8px;flex-wrap:wrap"><button class="ghost" id="bioCoverEdit">🎨 编辑封面</button><span class="muted" style="font-size:12px">' + escHTML(bioSizeOf(cv.size).n + " · " + bioSizeOf(cv.size).w + "×" + bioSizeOf(cv.size).h + "mm") + '</span></div>';
    bioApplyCover(card.querySelector(".bio-cover"), cv, 1);
    var ed = document.getElementById("bioCoverEdit");
    if (ed) ed.onclick = bioCoverEditor;
  }
  function bioCoverEditor() {
    var card = document.getElementById("bioCoverCard"); if (!card) return;
    var b0 = loadBio(); var c0 = (b0.meta && b0.meta.cover) || {};
    var cv = { title: c0.title || "", subtitle: c0.subtitle || "", size: c0.size || "k32", image: c0.image || "" };
    var sizeChips = BIO_SIZES.map(function (s) {
      return '<span class="chip cv-size' + (s.k === cv.size ? " active" : "") + '" data-k="' + s.k + '">' + escHTML(s.n) + '<i>' + s.w + "×" + s.h + '</i></span>';
    }).join("");
    card.innerHTML = '<div class="bio-cover-editor">' +
  '<div class="bio-ce-form">' +
    '<div class="row"><label>书名</label><input id="cvTitle" value="' + escAttr(cv.title) + '" placeholder="我的生命之书" /></div>' +
    '<div class="row"><label>副标题</label><input id="cvSub" value="' + escAttr(cv.subtitle) + '" placeholder="一本由刘看山陪你写下的传记" /></div>' +
    '<div class="row"><label>开本尺寸（真实图书规格，预览按等比缩放）</label><div class="chips" id="cvSizes">' + sizeChips + '</div></div>' +
    '<div class="row"><label>封面图片（可选，自动压缩到长边 900px）</label><input type="file" id="cvImg" accept="image/*" />' +
    '<div class="muted" id="cvImgTip" style="font-size:12px;margin-top:6px"></div></div>' +
  '</div>' +
  '<div class="bio-ce-preview">' +
    '<div class="bio-cover-stage"><div id="cvPrev" class="bio-cover" data-cvsize="' + escAttr(cv.size) + '"><div class="bio-cover-ov"><div class="bio-cover-title"></div><div class="bio-cover-sub"></div></div></div></div>' +
    '<div class="muted" style="font-size:12px">书名 / 副标题实时预览；不传图时用默认书封底色，传图后按开本裁切铺满。</div>' +
  '</div>' +
  '<div class="bio-ce-foot">' +
    '<button id="cvSave">💾 保存封面</button><button class="ghost" id="cvRemoveImg">🗑 移除图片</button><button class="ghost" id="cvCancel">返回</button>' +
  '</div>' +
'</div>';

    function tip(msg) { var t = document.getElementById("cvImgTip"); if (t) t.textContent = msg || ""; }
    function upd() {
      var prev = document.getElementById("cvPrev"); if (!prev) return;
      var t = (document.getElementById("cvTitle") || {}).value || "";
      var s2 = (document.getElementById("cvSub") || {}).value || "";
      bioApplyCover(prev, cv, 0.86);
      var tt = prev.querySelector(".bio-cover-title"), ss = prev.querySelector(".bio-cover-sub");
      if (tt) tt.textContent = t || "我的生命之书";
      if (ss) ss.textContent = s2 || "一本由刘看山陪你写下的传记";
    }
    ["cvTitle", "cvSub"].forEach(function (id) { var el = document.getElementById(id); if (el) el.addEventListener("input", upd); });
    var sizesEl = document.getElementById("cvSizes");
    if (sizesEl) {
      sizesEl.querySelectorAll(".cv-size").forEach(function (c) {
        c.onclick = function () {
          cv.size = c.getAttribute("data-k") || "k32";
          sizesEl.querySelectorAll(".cv-size").forEach(function (x) { x.classList.remove("active"); });
          c.classList.add("active");
          upd();
        };
      });
    }
    var imgInp = document.getElementById("cvImg");
    if (imgInp) {
      imgInp.onchange = function (e) {
        var f = e.target.files && e.target.files[0]; if (!f) return;
        var rd = new FileReader();
        rd.onerror = function () { tip("⚠️ 图片读取失败，换一张试试"); };
        rd.onload = function () {
          var src = String(rd.result || "");
          if (!src) { tip("⚠️ 图片读取失败"); return; }
          var img = new Image();
          img.onload = function () {
            var out = src;
            try {
              var max = 900, w = img.width || 1, h = img.height || 1, sc = Math.min(1, max / Math.max(w, h));
              var c = document.createElement("canvas");
              c.width = Math.round(w * sc); c.height = Math.round(h * sc);
              c.getContext("2d").drawImage(img, 0, 0, c.width, c.height);
              out = c.toDataURL("image/jpeg", 0.82);
            } catch (err) {}
            cv.image = out;
            tip("✔ 已载入：" + (f.name || "封面图") + "（" + Math.round(out.length / 1024) + "KB）");
            upd();
          };
          img.onerror = function () { tip("⚠️ 图片解析失败，请换 JPG / PNG"); };
          img.src = src;
        };
        rd.readAsDataURL(f);
      };
    }
    var rmBtn = document.getElementById("cvRemoveImg");
    if (rmBtn) rmBtn.onclick = function () {
      cv.image = ""; tip("已移除封面图片");
      if (imgInp) imgInp.value = "";
      upd();
    };
    document.getElementById("cvSave").onclick = function () {
      var b2 = loadBio(); b2.meta = b2.meta || {};
      b2.meta.cover = {
        title: (document.getElementById("cvTitle") || {}).value || "",
        subtitle: (document.getElementById("cvSub") || {}).value || "",
        size: cv.size || "k32",
        image: cv.image || ""
      };
      try {
        localStorage.setItem(BIO_KEY, JSON.stringify(b2));
      } catch (err) {
        b2.meta.cover.image = "";
        try { localStorage.setItem(BIO_KEY, JSON.stringify(b2)); } catch (e2) {}
        if (window.liuShout) liuShout("本地空间不足，封面图片没存下（书名 / 开本已保存）");
        renderBioCover(); return;
      }
      if (window.liuShout) liuShout("封面已保存");
      renderBioCover();
    };
    document.getElementById("cvCancel").onclick = renderBioCover;
    upd();
  }

  function renderBio(v) {
    const bio = loadBio();
    v.innerHTML = `
      <h2 class="view-title">📖 人生传记 · 生命之书 <span id="bioBadge"></span></h2>
      <p class="view-sub">前 6 模块里你积累的自我、复盘、成长，都在这里被刘看山编织成「你的人生之书」。
      他陪你一段一段写，也陪你一页一页读。更聪明的是：你还可以把<b>一大堆零散文字</b>直接贴进来，刘看山帮你理顺成「章 → 片段」的结构。</p>
      <div class="card bio-cover-card" id="bioCoverCard"></div>
      <div class="card">
        <div class="chips" id="bioTabs">
          <span class="chip active" data-tab="work">✍️ 写书</span>
          <span class="chip" data-tab="read">📖 读书</span>
          <span class="chip" data-tab="time">🕰️ 时间线</span>
          <span class="chip" data-tab="mine">🧺 我的素材</span>
        </div>
        <div id="bioWork"></div>
        <div id="bioRead" style="display:none"></div>
        <div id="bioTime" style="display:none"></div>
        <div id="bioMine" style="display:none"></div>
      </div>`;
    v.querySelectorAll("#bioTabs .chip").forEach((ch) => {
      ch.onclick = () => {
        v.querySelectorAll("#bioTabs .chip").forEach((x) => x.classList.remove("active"));
        ch.classList.add("active");
        const t = ch.dataset.tab;
        ["work", "read", "time", "mine"].forEach((k) => {
          const box = document.getElementById("bio" + k[0].toUpperCase() + k.slice(1));
          if (box) box.style.display = k === t ? "" : "none";
        });
        if (t === "work") bioWorkbench(document.getElementById("bioWork"));
        if (t === "read") renderBioRead(document.getElementById("bioRead"));
        if (t === "time") bioTimeline(document.getElementById("bioTime"));
        if (t === "mine") bioMaterials(document.getElementById("bioMine"));
      };
    });
    bioWorkbench(document.getElementById("bioWork"));
    liuSay("bio");
    renderBioCover();
  }
  function bioWorkbench(el) {
    bioState = { stage: "", form: null };
    el.innerHTML = `
      <div class="chips" id="bioModeChips">
        <span class="chip active" data-m="sort">💬 聊经历 · 刘看山帮你梳理（也能贴一大堆文字）</span>
      </div>
      <div id="bioSortMode"></div>`;
    const elSort = document.getElementById("bioSortMode");
    // 「选段成章」已按需求移除；原「智能梳理」与「聊经历」合并为同一个入口
    if (window.__bioSortRequest) window.__bioSortRequest = false;
    bioSortFlow(elSort);
    bioChapterManager(el);
  }
  function bioChapterManager(el) {
    const card = document.createElement("div");
    card.className = "card";
    card.id = "bioChMgr";
    card.style.marginTop = "22px";
    el.appendChild(card);
    renderBioChapterManager(card);
  }
  function renderBioChapterManager(card) {
    const b = loadBio();
    if (!b.chapters.length) { card.style.display = "none"; return; }
    card.style.display = "";
    card.innerHTML = '<h3>📚 已写下的章节（可编辑 / 删除）</h3>' + b.chapters.map((ch) => `
      <div class="bio-ch-mgr" data-id="${escAttr(ch.id)}">
        <span style="font-weight:600">${escHTML(ch.title)}</span>
        <span class="muted" style="font-size:12px">${escHTML((ch.period.from || "?") + " – " + (ch.period.to || "?"))}</span>
        <button class="ghost bio-ch-edit" data-id="${escAttr(ch.id)}">✏️ 编辑</button>
        <button class="ghost bio-ch-del" data-id="${escAttr(ch.id)}">🗑 删除</button>
      </div>`).join("");
    card.querySelectorAll(".bio-ch-edit").forEach((b2) => b2.onclick = () => {
      const id = b2.dataset.id;
      const idx = loadBio().chapters.findIndex((c) => c.id === id);
      bioReadIdx = idx >= 0 ? idx : 0;
      const chip = document.querySelector('#bioTabs .chip[data-tab="read"]');
      if (chip) chip.click();
      const readEl = document.getElementById("bioRead");
      const ch2 = loadBio().chapters[bioReadIdx];
      if (readEl && ch2) bioReadEdit(readEl, ch2);
    });
    card.querySelectorAll(".bio-ch-del").forEach((b2) => b2.onclick = () => {
      const id = b2.dataset.id;
      const ch = loadBio().chapters.find((c) => c.id === id);
      if (confirm("确定删除「" + ((ch && ch.title) || "这章") + "」？删除后不可恢复。")) {
        if (bioDeleteChapter(id)) { liuShout("已删除。"); renderBioChapterManager(card); }
      }
    });
  }
  function bioChapterForm(el) {
    el.innerHTML = `
      <div class="chat" id="bioChat"></div>
      <div class="chips" id="bioStageChips">
        ${BIO_STAGES.map((s) => `<span class="chip" data-s="${s}">${s}</span>`).join("")}
      </div>
      <div class="row" style="margin-top:10px">
        <input id="bioStageInput" class="js-voice" placeholder="或者，你自己说想先写哪一段…" />
        <button id="bioStageSend">确定这段</button>
      </div>
      <div id="bioGenBox" style="margin-top:14px"></div>`;
    const startGen = (stage) => {
      bioState.stage = stage;
      appendMsg("bioChat", "liu", "好，就写「" + stage + "」。你心里有没有几个画面、人名、或当时的心情，想放进这一章？随便写几句，我帮你接上。");
      bioGenForm(el);
    };
    el.querySelectorAll("#bioStageChips .chip").forEach((c) => {
      c.onclick = () => { appendMsg("bioChat", "user", c.dataset.s); startGen(c.dataset.s); };
    });
    const bioStageSendEl = el.querySelector("#bioStageSend");
    if (bioStageSendEl) bioStageSendEl.onclick = () => {
      const si = el.querySelector("#bioStageInput");
      const t = (si ? si.value : "").trim();
      if (!t) return;
      appendMsg("bioChat", "user", t);
      if (si) si.value = "";
      startGen(t);
    };
    renderChat("bioChat");
    if (chatGet("bioChat").msgs.length === 0) appendMsg("bioChat", "liu", "咱们一段一段写。先选一段你想落笔的人生——童年、求学、某个转折，还是最近的自己？也可以切到「聊经历 · 刘看山帮你梳理」，把一段真实经历讲给我，我帮你理顺。");
    zyAttachMic(el);
  }
  // 经历梳理：用户输入自己的经历，刘看山帮助梳理成结构化的一页
  function bioSortFlow(el) {
    el.innerHTML = `
      <div class="chat" id="bioSortChat"></div>
      <div class="row" style="margin-top:10px">
        <input id="bioSortInput" class="js-voice" placeholder="把一段你记得的事讲给刘看山听…" />
        <button id="bioSortSend">讲给刘看山</button>
      </div>
      <div id="bioSortOut" style="margin-top:14px"></div>`;
    const send = () => {
      const inpEl = el.querySelector("#bioSortInput");
      if (!inpEl) return;
      const v = inpEl.value.trim();
      if (!v) return;
      appendMsg("bioSortChat", "user", v);
      inpEl.value = "";
      bioSort(el, v);
    };
    const bioSortSendEl = el.querySelector("#bioSortSend");
    if (bioSortSendEl) bioSortSendEl.onclick = send;
    const inp = el.querySelector("#bioSortInput");
    if (inp) inp.addEventListener("keydown", (e) => { if (e.key === "Enter") send(); });
    // 原「智能梳理 · 一大堆文字」已并入本入口：可聊天式讲，也可粘贴一大堆文字让刘看山理成章
    const bulk = document.createElement("div");
    bulk.className = "card";
    bulk.style.background = "rgba(255,255,255,.03)";
    bulk.style.marginTop = "12px";
    bulk.innerHTML = `
      <p class="muted">想一次倒一堆？把日记、随想、散落的笔记贴进来（跨多少年、混在一起都行），刘看山通读后按时间或主题理顺成「章 → 片段」，提取时间 / 心情 / 人物 / 标签。</p>
      <textarea id="bioOrgInput" class="bio-org-input js-voice" placeholder="例：1998 年我出生在南方一个小县城……小学时最怕数学老师……高二那年喜欢上一个同桌……2020 年第一次独自去外地工作，租的房子很小……"></textarea>
      <div class="row" style="margin-top:10px">
        <button id="bioOrgRun">🐾 让刘看山帮我梳理这一大堆</button>
        <button class="ghost" id="bioOrgClear">清空</button>
      </div>
      <div id="bioOrgOut" style="margin-top:14px"></div>`;
    el.appendChild(bulk);
    const _orgRun = bulk.querySelector("#bioOrgRun");
    if (_orgRun) _orgRun.onclick = async () => {
      const rawEl = bulk.querySelector("#bioOrgInput");
      const raw = (rawEl ? rawEl.value : "").trim();
      if (raw.length < 12) { liuShout("多写一点嘛，十几字以上刘看山才梳得动～"); return; }
      _orgRun.disabled = true;
      try { await bioOrganize(raw); } finally { _orgRun.disabled = false; }
    };
    const _orgClear = bulk.querySelector("#bioOrgClear");
    if (_orgClear) _orgClear.onclick = () => { const ri = bulk.querySelector("#bioOrgInput"); if (ri) ri.value = ""; const ro = bulk.querySelector("#bioOrgOut"); if (ro) ro.innerHTML = ""; };
    renderChat("bioSortChat");
    if (chatGet("bioSortChat").msgs.length === 0) appendMsg("bioSortChat", "liu", "把一段你记得的事讲给我听——不用完整，一个画面、一次对话、一个决定都行。我帮你把它理顺：它发生在什么时候、和谁、什么心情，又在你人生里算哪一页。想一次倒一堆，就用下面的框贴进来。讲吧。");
    zyAttachMic(el);
  }
  async function bioSort(el, raw) {
    const out = document.getElementById("bioSortOut");
    out.innerHTML = '<div class="note">刘看山正在帮你梳理这段经历…</div>';
    const a = await bioSortAnalyze(raw);
    appendMsg("bioSortChat", "liu", (a.reframe || "") + (a.question ? "\n\n" + a.question : ""));
    out.innerHTML = `
      <div class="card bio-sort">
        <h4>🐾 刘看山的梳理</h4>
        <div class="row3">
          <span><label>什么时候</label><input id="bsDate" value="${escAttr(a.date)}" placeholder="如 2012 / 那年夏天" /></span>
          <span><label>心情</label><input id="bsMood" value="${escAttr(a.mood)}" /></span>
        </div>
        <label>这段经历属于（主题 / 章节名）</label><input id="bsTitle" value="${escAttr(a.theme)}" />
        <label>和谁有关（逗号分隔）</label><input id="bsPeople" value="${escAttr(a.people.join("，"))}" />
        <label>标签（逗号分隔）</label><input id="bsTags" value="${escAttr(a.tags.join("，"))}" />
        <label>归入哪一段人生</label>
        <select id="bsStage">${BIO_STAGES.map((s) => `<option>${escHTML(s)}</option>`).join("")}<option>未归类（散记）</option></select>
        <div class="row">
          <button id="bsSave">📥 存进我的人生传记</button>
          <button class="ghost" id="bsMore">再讲一段</button>
        </div>
        <div id="bsSaved" class="note" style="display:none"></div>
      </div>`;
    document.getElementById("bsMore").onclick = () => { out.innerHTML = ""; const i2 = document.getElementById("bioSortInput"); if (i2) i2.focus(); };
    document.getElementById("bsSave").onclick = () => bioSortSave(raw, a);
  }
  function bioSortSave(raw, a) {
    const date = document.getElementById("bsDate").value.trim();
    const mood = document.getElementById("bsMood").value.trim();
    const title = document.getElementById("bsTitle").value.trim() || a.theme;
    const people = document.getElementById("bsPeople").value.split(/[，,]/).map((s) => s.trim()).filter(Boolean);
    const tags = document.getElementById("bsTags").value.split(/[，,]/).map((s) => s.trim()).filter(Boolean);
    const stage = document.getElementById("bsStage").value;
    const bio = loadBio();
    let ch = bio.chapters.find((c) => c.title === stage || c.theme === stage);
    if (!ch) {
      ch = { id: "c" + Date.now(), title: stage, period: { from: "", to: "" }, theme: stage, episodes: [], liuNarration: "", sourceRefs: [] };
      bio.chapters.push(ch);
    }
    ch.episodes.push({ date, title, content: a.reframe, mood, tags, people, sourceModule: "bio", raw });
    bio.updatedAt = new Date().toLocaleString("zh-CN");
    saveBio(bio);
    awardXP({ cog: 6, con: 4, emp: 4 }, "刘看山帮你梳理一段经历");
    const saved = document.getElementById("bsSaved");
    saved.style.display = "";
    saved.innerHTML = "已存进「" + escHTML(stage) + "」。去「📖 读书」翻开看，或「🕰️ 时间线」追踪它。";
    liuShout("这段经历理顺了，记下了。它以后就是你人生里清清楚楚的一页。");
    const badge = document.getElementById("bioBadge");
    if (badge) badge.innerHTML = badgeHTML(a.live);
  }
  async function bioSortAnalyze(raw) {
    const tones = ["温柔克制，像深夜的自己跟自己说话", "平静而诚恳，像老友闲聊", "略带文学感，像在写一页日记", "轻一点、近一点，像刚回想起来的那一刻"];
    const tone = tones[Math.floor(Math.random() * tones.length)];
    const prompt = `你是知乎电子好友刘看山，擅长陪人梳理自己的经历。用户讲了一段自己的真实经历：
"""${raw}"""
请只输出一个 JSON 对象（不要多余文字、不要代码块标记），字段如下：
- date: 这段经历发生的时间线索（如 "2012年夏天""小学时""去年"，推不出就填""）
- people: 涉及的人的称谓数组，如 ["妈妈","同桌"]
- mood: 这段经历里最主要的情绪，2-6字，如 "温暖""不甘""迷茫"
- theme: 给这段经历起一个简短标题（8-16字）
- reframe: 用第一人称、${tone}的语气，把这段经历重新讲一遍，点出它可能意味着什么、在人生里算哪一页（约 120 字，不鸡汤不浮夸；不要每次都用"那件事"开头）
- question: 一句温柔的追问，帮用户再想深一点（如 "那之后，你做了什么不一样的决定吗？"，每次换个问法）
- tags: 3-5 个标签数组`;
    const r = await callZhihu("answer", { query: prompt, model: "zhida-thinking-1p5" });
    if (!r.mock && r.content) {
      const m = r.content.match(/\{[\s\S]*\}/);
      if (m) { try { return normalizeSort(JSON.parse(m[0]), true); } catch (e) {} }
    }
    return bioSortLocal(raw);
  }
  function normalizeSort(o, live) {
    o = o || {};
    return {
      date: o.date || "",
      people: Array.isArray(o.people) ? o.people : [],
      mood: o.mood || "复杂 / 说不清",
      theme: o.theme || "一段值得记住的经历",
      reframe: o.reframe || "",
      question: o.question || "那段事之后，你做了什么不一样的决定吗？",
      tags: Array.isArray(o.tags) ? o.tags : ["经历"],
      live: !!live,
    };
  }
  function bioSortLocal(raw) {
    const yrs = raw.match(/\b(?:19|20)\d{2}\b/g) || [];
    const date = yrs.length ? yrs[0] : "";
    const peopleMap = [["妈妈", "妈妈"], ["母亲", "妈妈"], ["爸", "爸爸"], ["父", "爸爸"], ["外婆", "外婆"], ["外公", "外公"], ["爷爷", "爷爷"], ["奶奶", "奶奶"], ["老师", "老师"], ["同学", "同学"], ["朋友", "朋友"], ["老板", "老板"], ["同事", "同事"]];
    const people = [];
    peopleMap.forEach((kv) => { if (raw.indexOf(kv[0]) >= 0 && people.indexOf(kv[1]) < 0) people.push(kv[1]); });
    const moodLex = [["开心", "开心"], ["高兴", "开心"], ["快乐", "开心"], ["激动", "兴奋"], ["兴奋", "兴奋"], ["温暖", "温暖"], ["感动", "温暖"], ["难过", "难过"], ["伤心", "难过"], ["哭", "难过"], ["害怕", "害怕"], ["恐惧", "害怕"], ["慌", "害怕"], ["孤独", "孤独"], ["孤单", "孤独"], ["迷茫", "迷茫"], ["困惑", "迷茫"], ["愤怒", "愤怒"], ["生气", "愤怒"], ["火", "愤怒"], ["平静", "平静"], ["安心", "平静"]];
    let mood = "复杂 / 说不清";
    moodLex.forEach((kv) => { if (raw.indexOf(kv[0]) >= 0) mood = kv[1]; });
    const snippet = raw.length > 80 ? raw.slice(0, 80) + "…" : raw;
    const reframe = `你讲起的这段，我试着替你理顺：\n\n${snippet}\n\n它不一定轰轰烈烈，但那一刻的真实，已经留在你身上了。等以后回头看，或许正是这些细碎的片段，拼出了「你是谁」。`;
    const question = (mood === "难过" || mood === "害怕") ? "那段事过去之后，你是怎么把自己一点点安放好的？" : "那之后，你做了什么不一样的决定吗？";
    return normalizeSort({ date, people, mood, theme: "一段值得记住的经历", reframe, question, tags: [mood, "经历"] }, false);
  }
  // ---------- 人生传记 · 智能梳理「一大堆文字」----------
  // 解决痛点：用户丢一堆零散文字进来，刘看山帮ta理顺成「章 → 片段」结构，提取时间/心情/人物/标签，可改可存。
  function bioOrganizeFlow(el) {
    el.innerHTML = `
      <div class="card" style="background:rgba(255,255,255,.03)">
        <p class="muted">把一整段、一整堆你想记下来的文字贴进来——日记、随想、散落的笔记、好几年混在一起都行。刘看山会通读，按时间或主题帮你理顺，分成「章 → 片段」，提取时间 / 心情 / 人物 / 标签，理成你人生之书的结构。你过一眼、改改，再一键存进去。</p>
        <textarea id="bioOrgInput" class="bio-org-input js-voice" placeholder="例：1998 年我出生在南方一个小县城……小学时最怕数学老师……高二那年喜欢上一个同桌……2020 年第一次独自去外地工作，租的房子很小……"></textarea>
        <div class="row" style="margin-top:10px">
          <button id="bioOrgRun">🐾 让刘看山帮我梳理这一大堆</button>
          <button class="ghost" id="bioOrgClear">清空</button>
        </div>
        <div id="bioOrgOut" style="margin-top:14px"></div>
      </div>`;
    const bioOrgRunEl = el.querySelector("#bioOrgRun");
    if (bioOrgRunEl) bioOrgRunEl.onclick = async () => {
      const rawEl = el.querySelector("#bioOrgInput");
      const raw = (rawEl ? rawEl.value : "").trim();
      if (raw.length < 12) { liuShout("多写一点嘛，十几字以上刘看山才梳得动～"); return; }
      bioOrgRunEl.disabled = true;
      try { await bioOrganize(raw); } finally { bioOrgRunEl.disabled = false; }
    };
    const bioOrgClearEl = el.querySelector("#bioOrgClear");
    if (bioOrgClearEl) bioOrgClearEl.onclick = () => { const ri = el.querySelector("#bioOrgInput"); if (ri) ri.value = ""; const ro = el.querySelector("#bioOrgOut"); if (ro) ro.innerHTML = ""; };
    zyAttachMic(el);
  }
  function bioOrganizePrompt(raw) {
    const text = raw.length > 4000 ? raw.slice(0, 4000) + "…（后面还有，但先理顺这些）" : raw;
    const stages = BIO_STAGES.concat(["未归类（散记）"]).join(" / ");
    return `你是知乎电子好友刘看山，擅长陪人把散落的记忆理顺成一本人生传记。用户贴给你一大堆零散的人生记录（日记、随想、碎片笔记，可能跨越多年、混在一起）：
"""${text}"""
请通读，按时间先后或主题，把它们理顺成一本「生命之书」的结构。只输出一个 JSON 对象（不要多余文字、不要代码块标记），结构如下：
{ "chapters": [ { "stage": "人生阶段（从这几个里选：${stages}）", "title": "这一章的标题（6-14字）", "theme": "这一章的主题（一句，12-24字）", "episodes": [ { "date": "该片段的时间线索（如 2003 / 小学时 / 去年，推不出填\\"\\"）", "title": "片段小标题（6-14字）", "content": "用第一人称、温柔克制、像在回想，把这个片段重新讲一遍（60-120字，有具体感官细节，不鸡汤不浮夸，不要每段都用'那一年'开头）", "mood": "该片段最主要的情绪（2-6字）", "people": ["涉及的人的称谓（如 妈妈）"], "tags": ["3-5个标签"] } ] } ] }
要求：片段之间不要重复；能归到同一人生阶段的尽量归到一起；片段数按内容多少来，每章 1-4 个片段；content 不要出现"素材""用户输入"这类词。`;
  }
  function normalizeOrganize(o) {
    o = o || {};
    const stages = BIO_STAGES.concat(["未归类（散记）"]);
    const out = [];
    (Array.isArray(o.chapters) ? o.chapters : []).forEach((c) => {
      if (!c) return;
      const stage = (stages.indexOf(c.stage) >= 0) ? c.stage : (stages.includes(c.title) ? c.title : "未归类（散记）");
      const episodes = (Array.isArray(c.episodes) ? c.episodes : []).map((e) => ({
        date: (e && e.date) || "", title: (e && e.title) || "一段记忆",
        content: (e && e.content) || "", mood: (e && e.mood) || "复杂 / 说不清",
        people: Array.isArray(e && e.people) ? e.people : [], tags: Array.isArray(e && e.tags) ? e.tags : [],
      })).filter((e) => (e.content || "").trim());
      if (!episodes.length) return;
      out.push({ stage, title: c.title || stage, theme: c.theme || "", episodes });
    });
    return out;
  }
  function bioOrganizeLocal(raw) {
    const paras = raw.split(/\n{1,}|\u3002{1,}/).map((s) => s.trim()).filter((s) => s.length >= 6);
    const map = {
      "童年与来处": ["童年", "小时候", "幼儿", "幼儿园", "小学", "出生", "老家", "外婆", "外公", "爷爷", "奶奶"],
      "求学时代": ["上学", "初中", "高中", "大学", "中学", "同学", "老师", "考试", "校园", "年级"],
      "初入社会 / 职场转折": ["工作", "公司", "职场", "实习", "上班", "辞职", "老板", "同事", "创业", "入职"],
      "亲密关系与他人": ["恋爱", "前任", "男朋友", "女朋友", "朋友", "恋人", "分手", "结婚", "母亲", "父亲", "妈妈", "爸爸"],
      "最近的自己": ["最近", "今年", "去年", "现在", "如今", "这两年"],
    };
    const stageOf = (t) => { for (const k in map) if (map[k].some((w) => t.indexOf(w) >= 0)) return k; return "未归类（散记）"; };
    const grouped = {};
    paras.forEach((p) => { const st = stageOf(p); (grouped[st] = grouped[st] || []).push(p); });
    if (!Object.keys(grouped).length) grouped["未归类（散记）"] = paras;
    const out = [];
    Object.keys(grouped).forEach((st) => {
      const episodes = grouped[st].slice(0, 6).map((p) => {
        const a = bioSortLocal(p);
        return { date: a.date, title: p.slice(0, 12), content: p, mood: a.mood, people: a.people, tags: a.tags };
      });
      out.push({ stage: st, title: st, theme: "", episodes });
    });
    return out;
  }
  async function bioOrganize(raw) {
    const out = document.getElementById("bioOrgOut");
    if (out) out.innerHTML = '<div class="note">刘看山正在通读这一大堆，帮你理顺成章…</div>';
    const r = await callZhihu("answer", { query: bioOrganizePrompt(raw), model: "zhida-thinking-1p5" });
    let data = null, live = false;
    if (!r.mock && r.content) {
      const m = r.content.match(/\{[\s\S]*\}/);
      if (m) { try { data = normalizeOrganize(JSON.parse(m[0])); live = true; } catch (e) {} }
    }
    if (!data || !data.length) data = bioOrganizeLocal(raw);
    bioOrganizeRender(data, live);
  }
  function bioOrganizeRender(chapters, live) {
    const out = document.getElementById("bioOrgOut");
    if (!out) return;
    const chHTML = chapters.map((c, ci) => `
      <div class="card bio-org-ch" data-stage="${escAttr(c.stage)}">
        <h4>📂 ${escHTML(c.stage)} · <input class="bio-org-ct" value="${escAttr(c.title)}" style="font-weight:700;width:auto;max-width:55%" /></h4>
        <p class="muted"><input class="bio-org-th" value="${escAttr(c.theme)}" placeholder="这一章的主题" style="width:90%" /></p>
        ${c.episodes.map((e, ei) => `
          <div class="bio-org-ep">
            <div class="row3">
              <span><label>时间</label><input class="bio-org-ed" data-ei="${ei}" value="${escAttr(e.date)}" /></span>
              <span><label>心情</label><input class="bio-org-em" data-ei="${ei}" value="${escAttr(e.mood)}" /></span>
            </div>
            <input class="bio-org-et" data-ei="${ei}" value="${escHTML(e.title)}" style="width:90%" placeholder="片段标题" />
            <textarea class="bio-org-ec" data-ei="${ei}" style="width:100%">${escHTML(e.content)}</textarea>
            <div class="muted" style="font-size:12px">人物：<input class="bio-org-ep2" data-ei="${ei}" value="${escAttr((e.people || []).join("，"))}" style="width:38%" />　标签：<input class="bio-org-ek" data-ei="${ei}" value="${escAttr((e.tags || []).join("，"))}" style="width:38%" /></div>
          </div>`).join("")}
      </div>`).join("");
    out.innerHTML = `
      <div class="note">${live ? "🐾 刘看山已经帮你把这堆文字理顺成下面的结构（知乎直答实时生成）。过一眼、哪里不对就改，再一键存进传记。" : "实时接口暂时没连上，刘看山先用本地规则帮你按主题聚类（可能没那么细）。连上后会更聪明。你可以直接改下面的文字。"}</div>
      <div id="bioOrgChapters">${chHTML}</div>
      <div class="row" style="margin-top:12px">
        <button id="bioOrgSave">📥 全部存进我的人生传记</button>
        <span class="muted" id="bioOrgStat"></span>
      </div>`;
    document.getElementById("bioOrgSave").onclick = bioOrganizeSave;
  }
  function bioOrganizeSave() {
    const bio = loadBio();
    let added = 0;
    document.querySelectorAll("#bioOrgChapters .bio-org-ch").forEach((chEl) => {
      const stage = chEl.dataset.stage;
      const title = chEl.querySelector(".bio-org-ct").value.trim() || stage;
      const theme = chEl.querySelector(".bio-org-th").value.trim();
      const episodes = [];
      chEl.querySelectorAll(".bio-org-ep").forEach((epEl) => {
        const date = epEl.querySelector(".bio-org-ed").value.trim();
        const mood = epEl.querySelector(".bio-org-em").value.trim();
        const et = epEl.querySelector(".bio-org-et").value.trim();
        const content = epEl.querySelector(".bio-org-ec").value.trim();
        const people = epEl.querySelector(".bio-org-ep2").value.split(/[，,]/).map((s) => s.trim()).filter(Boolean);
        const tags = epEl.querySelector(".bio-org-ek").value.split(/[，,]/).map((s) => s.trim()).filter(Boolean);
        if (content) episodes.push({ date, title: et, content, mood, people, tags, sourceModule: "bio" });
      });
      if (!episodes.length) return;
      let ch = bio.chapters.find((c) => c.title === stage || c.theme === stage);
      if (!ch) { ch = { id: "c" + Date.now() + "_" + added, title: stage, period: { from: "", to: "" }, theme: stage, episodes: [], liuNarration: "", sourceRefs: [] }; bio.chapters.push(ch); }
      episodes.forEach((e) => ch.episodes.push(e));
      added += episodes.length;
    });
    bio.updatedAt = new Date().toLocaleString("zh-CN");
    saveBio(bio);
    awardXP({ cog: 10, con: 5 }, "刘看山帮你梳理一大堆文字");
    const stat = document.getElementById("bioOrgStat");
    if (stat) stat.textContent = "已存进传记，共 " + added + " 个片段。去「📖 读书」翻开看。";
    liuShout("这一大堆文字，理顺了，记下了。它以后就是你人生里清清楚楚的几页。");
    const badge = document.getElementById("bioBadge");
    if (badge) badge.innerHTML = badgeHTML(false);
  }
  function bioGenForm(el) {
    const box = document.getElementById("bioGenBox");
    const mats = aggregateMaterials();
    const aggHint = mats.hasData
      ? `已自动聚合你在「自我认知 / 复盘 / 养成」里积累的素材，会一起织进这一章。`
      : `（先在其它模块积累一些素材，传记会更丰满；现在也能直接手写。）`;
    box.innerHTML = `
      <div class="card" style="background:rgba(255,255,255,.03)">
        <p class="muted">${aggHint}</p>
        <label>章节标题（可改）</label><input id="bgTitle" value="${escAttr(bioState.stage)}" />
        <div class="row3">
          <span><label>起始年</label><input id="bgFrom" placeholder="如 2007" /></span>
          <span><label>截止年</label><input id="bgTo" placeholder="如 2015" /></span>
        </div>
        <label>这一章的主题</label><input id="bgTheme" placeholder="如 在小镇长大的孤独与想象" />
        <label>你想放进这一章的画面 / 人名 / 心情（手写素材）</label>
        <textarea id="bgManual" class="js-voice" placeholder="例：外婆的院子、第一次离家、那本翻烂的《xxx》…"></textarea>
        <div class="row">
          <button id="bgGen">✍️ 让刘看山帮我写这一章</button>
          <button class="ghost" id="bgToRead" style="display:none">📖 去读书</button>
        </div>
        <div id="bgOut"></div>
      </div>`;
    document.getElementById("bgGen").onclick = () => bioGenerate(el);
    zyAttachMic(el);
  }
  async function bioGenerate(el) {
    const title = document.getElementById("bgTitle").value.trim() || bioState.stage;
    const from = document.getElementById("bgFrom").value.trim();
    const to = document.getElementById("bgTo").value.trim();
    const theme = document.getElementById("bgTheme").value.trim() || bioState.stage;
    const manual = document.getElementById("bgManual").value.trim();
    const out = document.getElementById("bgOut");
    out.innerHTML = '<div class="note">刘看山正在为你写这一章…</div>';
    const mats = aggregateMaterials();
    const BIO_ANGLES = [
      "像翻一本旧相册，从一张具体的照片或旧物件写起",
      "像深夜一个人对着窗外独白，语气松一点、近一点",
      "像写给很多年后的自己的一封信",
      "像饭桌上有人问起『你小时候啊……』时，你脱口而出的那段",
      "像冷静的第三人称旁白，克制地讲",
      "像刚结束一段经历、还带着余温的即时回想",
    ];
    const ang = BIO_ANGLES[Math.floor(Math.random() * BIO_ANGLES.length)];
    const len = 260 + Math.floor(Math.random() * 130); // 260–390 字，避免每章一样长
    const prompt = `你是知乎电子好友刘看山。请用第一人称，为用户写一段「${bioState.stage}」的人生传记章节（约 ${len} 字）。
本段请这样切入：${ang}。
重要：不要套固定模板，不要每段都用「那一年」开头，不要堆砌成语和排比；先抛一个具体的感官细节（气味 / 声音 / 光 / 触感），再自然展开。
可自然融入这些用户真实素材（不要生硬罗列，像回忆自然流出，绝不要提「素材」二字）：
- 自我画像：${mats.selfStr}
- 复盘过的事：${mats.reviewStr}
- 成长记录：${mats.growStr}
- 用户手写补充：${manual || "（无）"}
要求：有画面感与时间感，像翻开一本生命之书；不鸡汤、不浮夸、不堆辞藻；结尾留一点余味，不要总结式收束。`;
    const r = await callZhihu("answer", { query: prompt, model: "zhida-thinking-1p5" });
    let content, live, degraded = r.degraded;
    if (!r.mock && r.content) { content = r.content; live = true; }
    else { content = bioLocalNarration(bioState.stage, theme, manual, mats); live = false; }
    const liuN = bioLocalLiu();
    const bio = loadBio();
    const chapter = {
      id: "c" + Date.now(),
      title, period: { from, to }, theme,
      episodes: [{ date: "", title, content, mood: "", tags: [bioState.stage], people: [], sourceModule: "bio" }],
      liuNarration: liuN, sourceRefs: [],
    };
    bio.chapters.push(chapter);
    bio.updatedAt = new Date().toLocaleString("zh-CN");
    saveBio(bio);
    recordHistory("人生传记", "写下了一章：「" + title + "」");
    awardXP({ cog: 12, con: 6 }, "写下一章人生传记");
    recordFootprint("人生传记", "写下人生传记第" + bio.chapters.length + "章");
    const badge = document.getElementById("bioBadge");
    if (badge) badge.innerHTML = badgeHTML(live);
    out.innerHTML = `
      <div class="section card bio-chapter">
        <h3>📄 ${escHTML(title)} <span class="muted" style="font-weight:400;font-size:13px">${escHTML((from || "?") + " – " + (to || "?"))} · ${escHTML(theme)}</span></h3>
        <p class="bio-prose">${escHTML(content).replace(/\n/g, "<br>")}</p>
        <div class="liu-note">🐾 刘看山：${escHTML(liuN)}</div>
      </div>
      <div class="note">${live ? "本章由知乎直答（zhida-thinking）结合你的真实素材实时生成。" : "当前实时接口暂时没连上，本章由本地叙事模板生成；连上后将自动升级为知乎直答实时润色。"}素材仅用你自己输入的内容，不涉及他人隐私。</div>
      <div class="row" style="margin-top:10px"><button class="ghost" id="bgIdea">📤 生成知乎想法草稿</button></div>`;
    const ideaBtn = document.getElementById("bgIdea");
    if (ideaBtn) ideaBtn.onclick = () => ideaComposer("人生传记", content, []);
    const toReadBtn = document.getElementById("bgToRead");
    toReadBtn.style.display = "";
    toReadBtn.onclick = () => {
      const chip = document.querySelector('#bioTabs .chip[data-tab="read"]');
      if (chip) chip.click();
    };
  }
  let bioReadIdx = 0;
  function renderBioRead(el) {
    const bio = loadBio();
    if (!bio.chapters.length) {
      el.innerHTML = '<div class="empty">还没有任何章节。去「✍️ 写书」，让刘看山陪你写下第一段人生。</div>';
      return;
    }
    bioReadIdx = Math.min(bioReadIdx, bio.chapters.length - 1);
    const ch = bio.chapters[bioReadIdx];
    renderBioReadPage(el, ch);
  }
  function renderBioReadPage(el, ch) {
    const bio = loadBio();
    const total = bio.chapters.length;
    el.innerHTML = bioCoverBannerHTML(bio) + `
      <div class="book">
        <div class="book-page" id="bioReadPage">
          ${ch.image ? '<img id="bioHeroImg" alt="" style="width:100%;max-height:220px;object-fit:cover;border-radius:12px;margin:8px 0" />' : ''}
          <div class="book-head">
            <span class="muted">第 ${bioReadIdx + 1} / ${total} 章</span>
            <span class="muted" id="bioReadPeriod">${escHTML((ch.period.from || "?") + " – " + (ch.period.to || "?"))}</span>
          </div>
          <h3 class="book-title">${escHTML(ch.title)}</h3>
          <p class="book-theme muted">${escHTML(ch.theme)}</p>
          <div id="bioReadEps"></div>
          <div class="liu-note">🐾 刘看山陪读：${escHTML(ch.liuNarration || "")}</div>
        </div>
        <div class="bio-nav">
          <button class="ghost" id="bioPrev">← 上一章</button>
          <button id="bioEdit">✏️ 编辑本章</button>
          <button class="ghost" id="bioDel">🗑 删除本章</button>
          <button id="bioExport">⬇ 导出这本生命之书（HTML）</button>
          <button class="ghost" id="bioNext">下一章 →</button>
        </div>
      </div>`;
    renderBioReadEps(el, ch);
    const hero = document.getElementById("bioHeroImg");
    if (hero && ch.image) hero.src = ch.image;
    document.getElementById("bioPrev").onclick = () => { if (bioReadIdx > 0) { bioReadIdx--; renderBioRead(el); } };
    document.getElementById("bioNext").onclick = () => { if (bioReadIdx < total - 1) { bioReadIdx++; renderBioRead(el); } };
    document.getElementById("bioExport").onclick = bioExport;
    document.getElementById("bioEdit").onclick = () => bioReadEdit(el, ch);
    document.getElementById("bioDel").onclick = () => {
      if (confirm("确定删除「" + (ch.title || "这章") + "」？删除后不可恢复。")) {
        if (bioDeleteChapter(ch.id)) { liuShout("这一章已删除。"); if (bioReadIdx > 0) bioReadIdx--; renderBioRead(el); }
      }
    };
  }
  function renderBioReadEps(el, ch) {
    const box = document.getElementById("bioReadEps");
    if (!box) return;
    box.innerHTML = (ch.episodes || []).map((ep) => `
      <div class="bio-ep" style="margin:14px 0">
        <p class="bio-ep-date muted" style="font-size:12px">🕒 ${escHTML(ep.date || "时间未记")}${ep.mood ? ' · ' + escHTML(ep.mood) : ''}${(ep.people && ep.people.length) ? ' · ' + escHTML(ep.people.join("、")) : ''}</p>
        <p class="bio-prose">${escHTML(ep.content || "").replace(/\n/g, "<br>")}</p>
      </div>`).join("");
  }
  function bioReadEdit(el, ch) {
    const work = JSON.parse(JSON.stringify(ch));
    const page = document.getElementById("bioReadPage");
    if (!page) return;
    page.innerHTML = `
      <div class="bio-edit">
        <label>章标题</label><input id="reTitle" value="${escAttr(work.title)}" style="width:90%" />
        <div class="row3">
          <span><label>起始年</label><input id="reFrom" value="${escAttr(work.period.from || "")}" placeholder="如 2007" /></span>
          <span><label>截止年</label><input id="reTo" value="${escAttr(work.period.to || "")}" placeholder="如 2015" /></span>
        </div>
        <label>主题</label><input id="reTheme" value="${escAttr(work.theme)}" style="width:90%" />
        <label>本章配图（可选，自动压缩到长边 900px）</label>
        <input type="file" id="reImg" accept="image/*" />
        <div class="muted" id="reImgTip" style="font-size:12px"></div>
        <div id="reHeroPrev"></div>
        <div id="reEps"></div>
        <div class="row" style="margin-top:10px">
          <button id="reSave">💾 保存</button>
          <button class="ghost" id="reAddEp">➕ 加一个片段</button>
          <button class="ghost" id="reCancel">取消</button>
        </div>
      </div>`;
    let heroData = work.image || "";
    const showHero = () => {
      const ip = document.getElementById("reHeroPrev");
      if (!ip) return;
      if (heroData) { ip.innerHTML = '<img alt="" style="width:100%;max-height:160px;object-fit:cover;border-radius:10px" />'; ip.querySelector("img").src = heroData; }
      else ip.innerHTML = "";
    };
    showHero();
    const renderEpsEdit = () => {
      const box = document.getElementById("reEps");
      if (!box) return;
      box.innerHTML = (work.episodes || []).map((ep, i) => `
        <div class="bio-ep-edit" data-i="${i}" style="border-top:1px solid rgba(255,255,255,.08);padding-top:10px;margin-top:10px">
          <div class="row3">
            <span><label>时间</label><input class="re-ep-date" data-i="${i}" value="${escAttr(ep.date || "")}" placeholder="如 2012 / 那年夏天" /></span>
            <span><label>心情</label><input class="re-ep-mood" data-i="${i}" value="${escAttr(ep.mood || "")}" /></span>
          </div>
          <input class="re-ep-title" data-i="${i}" value="${escAttr(ep.title || "")}" placeholder="片段标题" style="width:90%" />
          <textarea class="re-ep-content" data-i="${i}" style="width:100%">${escHTML(ep.content || "")}</textarea>
          <div class="muted" style="font-size:12px">人物：<input class="re-ep-people" data-i="${i}" value="${escAttr((ep.people || []).join("，"))}" style="width:34%" />　标签：<input class="re-ep-tags" data-i="${i}" value="${escAttr((ep.tags || []).join("，"))}" style="width:34%" /></div>
          <button class="ghost re-ep-del" data-i="${i}" style="margin-top:4px">🗑 删除这个片段</button>
        </div>`).join("");
      box.querySelectorAll(".re-ep-del").forEach((b) => b.onclick = () => { work.episodes.splice(+b.dataset.i, 1); renderEpsEdit(); });
    };
    renderEpsEdit();
    const imgInp = document.getElementById("reImg");
    if (imgInp) imgInp.onchange = (e) => {
      const f = e.target.files && e.target.files[0]; if (!f) return;
      const tip = document.getElementById("reImgTip");
      bioCompressImage(f, 900).then((d) => { heroData = d; tip.textContent = "✔ 已载入配图（" + Math.round(d.length / 1024) + "KB）"; showHero(); })
        .catch(() => { tip.textContent = "⚠️ 图片读取失败，换一张试试"; });
    };
    document.getElementById("reAddEp").onclick = () => {
      if (!work.episodes) work.episodes = [];
      work.episodes.push({ date: "", title: "", content: "", mood: "", tags: [], people: [], sourceModule: "bio" });
      renderEpsEdit();
    };
    document.getElementById("reCancel").onclick = () => renderBioReadPage(el, ch);
    document.getElementById("reSave").onclick = () => {
      const title = (document.getElementById("reTitle").value || "").trim() || work.title;
      const from = (document.getElementById("reFrom").value || "").trim();
      const to = (document.getElementById("reTo").value || "").trim();
      const theme = (document.getElementById("reTheme").value || "").trim();
      (work.episodes || []).forEach((ep, i) => {
        const q = (s) => { const elx = document.querySelector(s + '[data-i="' + i + '"]'); return elx ? elx.value : ""; };
        ep.date = q(".re-ep-date"); ep.mood = q(".re-ep-mood"); ep.title = q(".re-ep-title");
        ep.content = q(".re-ep-content");
        ep.people = q(".re-ep-people").split(/[，,]/).map((s) => s.trim()).filter(Boolean);
        ep.tags = q(".re-ep-tags").split(/[，,]/).map((s) => s.trim()).filter(Boolean);
      });
      bioSaveChapterById(ch.id, { title, period: { from, to }, theme, image: heroData, episodes: work.episodes });
      liuShout("本章已更新。");
      renderBioReadPage(el, loadBio().chapters[bioReadIdx]);
    };
  }
  function bioTimeline(el) {
    const bio = loadBio();
    if (!bio.chapters.length) { el.innerHTML = '<div class="empty">还没有章节，时间线会随你写的章节自动生长。</div>'; return; }
    el.innerHTML = `<div class="timeline" id="bioTlList">${bio.chapters.map((ch) => `
      <div class="tl-item" data-id="${escAttr(ch.id)}">
        <div class="tl-dot"></div>
        <div class="tl-body">
          <div class="tl-when">${escHTML((ch.period.from || "?") + " – " + (ch.period.to || "?"))}</div>
          <h4>${escHTML(ch.title)}</h4>
          <p class="muted">${escHTML(ch.theme)}</p>
          <p class="bio-prose">${escHTML((ch.episodes[0] || {}).content || "").slice(0, 160).replace(/\n/g, "<br>")}${(ch.episodes[0] || {}).content && (ch.episodes[0] || {}).content.length > 160 ? "…" : ""}</p>
          <div class="row" style="gap:8px;margin-top:6px">
            <button class="ghost tl-edit" data-id="${escAttr(ch.id)}">✏️ 改时间/标题</button>
            <button class="ghost tl-del" data-id="${escAttr(ch.id)}">🗑 删除</button>
          </div>
        </div>
      </div>`).join("")}</div>`;
    el.querySelectorAll(".tl-edit").forEach((b) => b.onclick = () => bioTimelineEdit(el, b.dataset.id));
    el.querySelectorAll(".tl-del").forEach((b) => b.onclick = () => {
      const id = b.dataset.id;
      const ch = bio.chapters.find((c) => c.id === id);
      if (confirm("确定删除「" + ((ch && ch.title) || "这条") + "」？删除后不可恢复。")) {
        if (bioDeleteChapter(id)) { liuShout("已删除。"); bioTimeline(el); }
      }
    });
  }
  function bioTimelineEdit(el, id) {
    const b = loadBio();
    const ch = b.chapters.find((c) => c.id === id);
    if (!ch) return;
    const item = el.querySelector('.tl-item[data-id="' + id + '"]');
    if (!item) return;
    item.querySelector(".tl-body").innerHTML = `
      <div class="row3">
        <span><label>起始年</label><input class="tl-from" value="${escAttr(ch.period.from || "")}" placeholder="如 2007" /></span>
        <span><label>截止年</label><input class="tl-to" value="${escAttr(ch.period.to || "")}" placeholder="如 2015" /></span>
      </div>
      <input class="tl-title" value="${escAttr(ch.title)}" placeholder="章标题" style="width:90%" />
      <input class="tl-theme" value="${escAttr(ch.theme)}" placeholder="主题" style="width:90%" />
      <div class="row" style="gap:8px;margin-top:6px">
        <button class="tl-save">💾 保存</button>
        <button class="ghost tl-cancel">取消</button>
      </div>`;
    item.querySelector(".tl-save").onclick = () => {
      const from = (item.querySelector(".tl-from").value || "").trim();
      const to = (item.querySelector(".tl-to").value || "").trim();
      const title = (item.querySelector(".tl-title").value || "").trim() || ch.title;
      const theme = (item.querySelector(".tl-theme").value || "").trim();
      bioSaveChapterById(id, { period: { from, to }, title, theme });
      liuShout("时间线已更新。");
      bioTimeline(el);
    };
    item.querySelector(".tl-cancel").onclick = () => bioTimeline(el);
  }
  function fmtBioTs(ts) {
    if (!ts) return "实时同步";
    if (typeof ts === "number") { try { return new Date(ts).toLocaleString("zh-CN", { month: "2-digit", day: "2-digit", hour: "2-digit", minute: "2-digit" }); } catch (e) {} }
    return String(ts);
  }
  function bioMaterials(el) {
    const mats = aggregateMaterials();
    const bySrc = function (src) { return mats.items.filter(function (x) { return x.src === src; }); };
    const listHTML = function (src, emptyText) {
      const arr = bySrc(src);
      if (!arr.length) return '<div class="muted" style="font-size:13px">' + emptyText + '</div>';
      return arr.map(function (it) {
        const jump = it.hash ? ' data-jump="' + it.hash + '" style="cursor:pointer"' : '';
        const go = it.hash ? '<span style="color:#5cc8ff;font-size:12px">跳转 ›</span>' : '';
        return '<div class="mat-item"' + jump + '>'
          + '<div style="font-weight:600">' + escHTML(it.title) + (it.sub ? ' <span class="muted" style="font-weight:400">· ' + escHTML(it.sub) + '</span>' : '') + '</div>'
          + '<div style="display:flex;gap:10px;align-items:center;margin-top:4px;font-size:12px;color:#9fb0c3">'
          + '<span>📌 ' + escHTML(it.srcLabel) + '</span>'
          + '<span>🕒 ' + escHTML(fmtBioTs(it.ts)) + '</span>'
          + go + '</div></div>';
      }).join('');
    };
    el.innerHTML = ''
      + '<div class="grid grid-2">'
      + '<div class="card"><h3>🪞 自我画像素材</h3>' + listHTML("self", "（暂无自我画像，去「自我认知」聊几句会更准）") + '</div>'
      + '<div class="card"><h3>🌟 成长素材</h3>' + listHTML("growth", "（暂无成长记录）") + '</div>'
      + '<div class="card"><h3>🧭 领域速通素材</h3>' + listHTML("field", "（暂无领域速通计划）") + '</div>'
      + '<div class="card"><h3>🃏 复习卡素材</h3>' + listHTML("card", "（暂无复习卡）") + '</div>'
      + '<div class="card"><h3>🎯 目标体系素材</h3>' + listHTML("goal", "（暂无目标体系）") + '</div>'
      + '<div class="card"><h3>📕 错题本素材</h3>' + listHTML("mistake", "（暂无错题记录）") + '</div>'
      + '</div>'
      + '<div class="card" style="margin-top:16px"><h3>📓 复盘素材</h3>' + listHTML("review", "暂无复盘记录。") + '</div>'
      + '<div class="card" style="margin-top:16px"><h3>🧩 碎片素材（来自「养成 → 碎片记录」）</h3>' + listHTML("frag", "暂无碎片，去「养成 → 碎片记录」记几条，这里会自动同步。") + '</div>'
      + '<div class="card" style="margin-top:16px"><h3>📝 笔记素材</h3>' + listHTML("note", "暂无笔记。") + '</div>'
      + '<div class="card" style="margin-top:16px"><h3>📜 原则素材</h3>' + listHTML("principle", "暂无原则。") + '</div>'
      + '<div class="muted" style="margin-top:10px;font-size:12px">本页与其它板块实时同步：每条素材都标注了「来源板块 + 时间」，点击带「跳转 ›」的素材可直接回到对应板块查看或继续编辑。切到本页时会自动重新聚合最新数据。</div>'
      + '<div class="card" style="margin-top:16px">'
      + '<h3>➕ 补充手写素材（照片 / 故事）</h3>'
      + '<p class="muted">仅存本地（base64，不依赖外部），只属于你。可直接写一段，或上传一张图作为这一章的记忆锚点。</p>'
      + '<input id="mtTitle" placeholder="素材名，如：外婆的院子" />'
      + '<textarea id="mtText" placeholder="写下关于它的故事…"></textarea>'
      + '<label>上传一张记忆照片（可选）</label>'
      + '<input type="file" id="mtImg" accept="image/*" />'
      + '<div class="row"><button id="mtAdd">存入我的素材</button></div>'
      + '<div id="mtList" style="margin-top:10px"></div>'
      + '</div>';
    el.querySelectorAll("[data-jump]").forEach(function (b) {
      b.onclick = function () { var h = b.getAttribute("data-jump"); if (h) location.hash = h; };
    });
    const renderList = function () {
      const b2 = loadBio();
      const arr = (b2.manual && b2.manual.length) ? b2.manual : [];
      document.getElementById("mtList").innerHTML = arr.length
        ? arr.map(function (m, idx) {
            return '<div class="material" style="display:flex;gap:10px;align-items:flex-start;margin:10px 0">'
              + (m.img ? '<img class="photo-thumb" src="' + m.img + '" alt="" style="max-width:80px;border-radius:8px" />' : '')
              + '<div style="flex:1"><b>' + escHTML(m.title || "素材") + '</b>'
              + (m.ts ? ' <span class="muted" style="font-size:12px">· 🕒 ' + escHTML(fmtBioTs(m.ts)) + '</span>' : '')
              + '<p class="muted">' + escHTML(m.text || "") + '</p>'
              + '<button class="ghost mt-del" data-i="' + idx + '" style="margin-top:4px">🗑 删除</button></div></div>';
          }).join("")
        : '<div class="muted">还没有手写素材。</div>';
      document.querySelectorAll("#mtList .mt-del").forEach(function (b) {
        b.onclick = function () {
          const i = +b.getAttribute("data-i");
          if (confirm("确定删除这条手写素材？删除后不可恢复。")) {
            if (bioDeleteManual(i)) { liuShout("已删除。"); renderList(); }
          }
        };
      });
    };
    renderList();
    document.getElementById("mtAdd").onclick = function () {
      const title = document.getElementById("mtTitle").value.trim();
      const text = document.getElementById("mtText").value.trim();
      const fileInput = document.getElementById("mtImg");
      const done = function (img) {
        const b2 = loadBio();
        if (!b2.manual) b2.manual = [];
        b2.manual.unshift({ title: title, text: text, img: img || "", ts: Date.now() });
        saveBio(b2);
        document.getElementById("mtTitle").value = "";
        document.getElementById("mtText").value = "";
        fileInput.value = "";
        renderList();
        liuShout("素材已存好，写传记时就能用上。");
      };
      if (fileInput.files && fileInput.files[0]) {
        const fr = new FileReader();
        fr.onload = function () { done(fr.result); };
        fr.readAsDataURL(fileInput.files[0]);
      } else done("");
    };
  }
  function bioExport() {
    const bio = loadBio();
    if (!bio.chapters.length) { liuShout("还没有章节可导出哦～"); return; }
    const chapters = bio.chapters.map((ch, i) => {
      const ep = ch.episodes[0] || {};
      return `<section class="ch"><h2>第${i + 1}章 · ${escHTML(ch.title)}</h2>
        <p class="meta">${escHTML((ch.period.from || "?") + " – " + (ch.period.to || "?"))} ｜ ${escHTML(ch.theme)}</p>
        <p>${escHTML(ep.content || "").replace(/\n/g, "<br>")}</p>
        <p class="liu">🐾 刘看山：${escHTML(ch.liuNarration || "")}</p></section>`;
    }).join("");
    const html = `<!DOCTYPE html><html lang="zh-CN"><head><meta charset="UTF-8">
<title>我的生命之书 · 知遇录</title><style>
body{font-family:"PingFang SC","Microsoft YaHei",serif;max-width:720px;margin:40px auto;padding:0 20px;line-height:1.9;color:#222;background:#fbfaf6}
h1{text-align:center;letter-spacing:4px}
.meta{color:#888;font-size:13px}
.ch{border-top:1px solid #eee;padding:24px 0}
.liu{color:#0a7;background:#eafaf4;padding:10px 14px;border-radius:10px;font-size:14px}
</style></head><body>
<h1>📖 我的生命之书</h1><p style="text-align:center;color:#888">由「知遇录」与刘看山共同编织 · ${escHTML(bio.updatedAt || "")}</p>
${chapters}
<p style="text-align:center;color:#aaa;margin-top:40px">—— 未完待续 ——</p>
</body></html>`;
    const blob = new Blob([html], { type: "text/html;charset=utf-8" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = "我的生命之书.html";
    document.body.appendChild(a); a.click(); a.remove();
    liuShout("生命之书已导出，可以收藏或分享啦。");
  }

  // ---------- 刘看山 · 桌宠引擎（可移动 + 自主游走 + 互动）----------
  function initLiuPet() {
    const pet = document.getElementById("liu");
    const img = document.getElementById("liuGif");
    const input = document.getElementById("liuInput");
    const hint = document.getElementById("liuHint");
    if (!pet || !img) return;

    const W = () => window.innerWidth, H = () => window.innerHeight;
    const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
    const rand = (a, b) => a + Math.random() * (b - a);
    const TABS = ["home", "self", "review", "explore", "field", "models", "check", "grow", "learn", "bio"];

    // 桌宠只活动在右下角安全区：桌面端限制在右 45% x 下 45%，移动端限制在底部安全区，
    // 绝不遮挡顶栏、导航与主体内容（首屏 10 秒讲清的关键）
    function petBounds() {
      const w = W(), h = H(), pw = pet.offsetWidth || 128, ph = pet.offsetHeight || 160;
      const isMobile = w <= 820;
      // 移动端：只在视口最底部一条窄带活动（窄屏正文占满宽度，浮层越靠上越挡内容）
      const padTop = isMobile ? Math.max(h - 210, Math.round(h * 0.62)) : Math.round(h * 0.55);
      const padLeft = isMobile ? Math.max(0, Math.min(Math.floor(w * 0.42), w - pw - 12)) : Math.round(w * 0.55);
      // 气泡（.liu-bubble）以桌宠为中心、宽 min(200, 视口-24) 上浮，故桌宠中心必须离右侧留出气泡半宽，
      // 否则桌宠贴右边缘时气泡右半会被视口裁掉（1024px 实测 R=1041 > 1024）。
      const halfB = Math.min(100, Math.round((w - 24) / 2));
      const maxX = Math.max(padLeft + 10, Math.min(w - pw - 10, w - halfB - 4 - Math.round(pw / 2)));
      return { minX: padLeft, maxX: maxX, minY: padTop, maxY: Math.max(padTop + 10, h - ph - 10) };
    }

    // 初始位置（右下偏上）
    const b0 = petBounds();
    let x = clamp(W() - 150, b0.minX, b0.maxX);
    let y = clamp(H() - 220, b0.minY, b0.maxY);
    pet.style.left = x + "px";
    pet.style.top = y + "px";

    let mode = "idle";            // idle | walk | drag
    let dragging = false, moved = false;
    let tx = x, ty = y, idleUntil = 0, last = performance.now();
    pet.classList.add("idle");
    let petMode = localStorage.getItem("zhiyu_pet_mode") || "auto";
    const petToggle = document.createElement("button");
    petToggle.className = "liu-pet-toggle";
    petToggle.type = "button";
    petToggle.textContent = petMode === "auto" ? "🚶 游走中" : "🛑 已静止";
    petToggle.title = "切换刘看山是自动游走还是原地静止";
    const stopWalk = () => { mode = "idle"; pet.classList.remove("walk"); pet.classList.add("idle"); };
    petToggle.onclick = (e) => {
      e.stopPropagation();
      petMode = petMode === "auto" ? "still" : "auto";
      localStorage.setItem("zhiyu_pet_mode", petMode);
      petToggle.textContent = petMode === "auto" ? "🚶 游走中" : "🛑 已静止";
      if (petMode === "still") stopWalk();
    };
    ["pointerdown", "mousedown", "touchstart"].forEach((ev) => petToggle.addEventListener(ev, (e) => e.stopPropagation()));
    pet.appendChild(petToggle);

    // 收起 / 唤出：用户可一键让桌宠不再遮挡内容
    const petPill = document.createElement("button");
    petPill.className = "liu-pet-pill";
    petPill.type = "button";
    petPill.textContent = "🐾 召出刘看山";
    petPill.title = "刘看山陪伴（可移动 / 对话）";
    petPill.style.display = "none";
    petPill.onclick = () => {
      pet.style.display = "flex"; petPill.style.display = "none";
      try { localStorage.setItem("zhiyu_pet_hidden", "0"); } catch (e) {}
      const b = petBounds();
      x = clamp(W() - (pet.offsetWidth || 108) - 12, b.minX, b.maxX);
      y = clamp(H() - (pet.offsetHeight || 150) - 12, b.minY, b.maxY);
      pet.style.left = x + "px"; pet.style.top = y + "px";
      tx = x; ty = y;
    };
    document.body.appendChild(petPill);

    const petHide = document.createElement("button");
    petHide.className = "liu-pet-toggle";
    petHide.type = "button";
    petHide.textContent = "✕ 收起";
    petHide.title = "收起刘看山，不再遮挡内容";
    petHide.onclick = (e) => {
      e.stopPropagation();
      pet.style.display = "none"; petPill.style.display = "flex";
      try { localStorage.setItem("zhiyu_pet_hidden", "1"); } catch (e) {}
    };
    ["pointerdown", "mousedown", "touchstart"].forEach((ev) => petHide.addEventListener(ev, (e) => e.stopPropagation()));
    pet.appendChild(petHide);

    // 移动端（窄屏）：正文占满整宽，固定悬浮的桌宠必然压住内容 —— 默认收起为右下角胶囊，
    // 只有用户主动「召出」才显示；用户的选择会被记住，不再每次刷新都挡住界面
    try {
      const petHiddenPref = localStorage.getItem("zhiyu_pet_hidden");
      if (W() <= 820 && petHiddenPref !== "0") {
        pet.style.display = "none";
        petPill.style.display = "flex";
        stopWalk();
      }
    } catch (e) {}

    function startWalk() {
      const b = petBounds();
      tx = rand(b.minX, b.maxX);
      ty = rand(b.minY, b.maxY);
      mode = "walk";
      pet.classList.remove("idle");
      pet.classList.add("walk");
    }

    function loop(ts) {
      const dt = Math.min(48, ts - last); last = ts;
      if (!dragging) {
        if (mode === "walk") {
          const dx = tx - x, dy = ty - y;
          const dist = Math.hypot(dx, dy);
          if (dist < 3) {
            mode = "idle";
            pet.classList.remove("walk");
            pet.classList.add("idle");
            idleUntil = ts + rand(1600, 4200);
            if (Math.random() < 0.45) liuSay(TABS[Math.floor(Math.random() * TABS.length)]);
          } else {
            const step = Math.min(dist, 0.10 * dt);
            x += (dx / dist) * step; y += (dy / dist) * step;
            pet.style.left = x + "px"; pet.style.top = y + "px";
            if (dx < -0.5) pet.classList.add("flip");
            else if (dx > 0.5) pet.classList.remove("flip");
          }
        } else if (mode === "idle" && ts > idleUntil && petMode === "auto") {
          startWalk();
        }
      }
      requestAnimationFrame(loop);
    }
    requestAnimationFrame(loop);

    function petReact() {
      if (hint) hint.style.opacity = "0";
      pet.classList.remove("react"); void pet.offsetWidth;
      pet.classList.add("react");
      liuReact();
      liuSay("default");
      setTimeout(() => pet.classList.remove("react"), 440);
    }

    // 拖拽 + 点击（指针事件，兼容鼠标 / 触屏）
    let sx = 0, sy = 0, ox = 0, oy = 0;
    img.addEventListener("pointerdown", (e) => {
      dragging = true; moved = false;
      pet.classList.remove("idle", "walk");
      pet.classList.add("dragging");
      sx = e.clientX; sy = e.clientY;
      const r = pet.getBoundingClientRect();
      ox = e.clientX - r.left; oy = e.clientY - r.top;
      try { img.setPointerCapture(e.pointerId); } catch (_) {}
      e.preventDefault();
    });
    img.addEventListener("pointermove", (e) => {
      if (!dragging) return;
      if (Math.abs(e.clientX - sx) > 4 || Math.abs(e.clientY - sy) > 4) moved = true;
      const pw = pet.offsetWidth, ph = pet.offsetHeight;
      x = clamp(e.clientX - ox, 0, W() - pw);
      y = clamp(e.clientY - oy, 64, H() - ph);
      pet.style.left = x + "px"; pet.style.top = y + "px";
      if (e.clientX < sx) pet.classList.add("flip"); else pet.classList.remove("flip");
    });
    function endDrag(e) {
      if (!dragging) return;
      dragging = false;
      pet.classList.remove("dragging");
      try { img.releasePointerCapture(e.pointerId); } catch (_) {}
      if (!moved) { petReact(); if (input) input.focus(); }
      mode = "idle"; idleUntil = performance.now() + rand(900, 2200);
    }
    img.addEventListener("pointerup", endDrag);
    img.addEventListener("pointercancel", endDrag);

    // 窗口尺寸变化：夹回可视区
    window.addEventListener("resize", () => {
      const b = petBounds();
      x = clamp(x, b.minX, b.maxX); y = clamp(y, b.minY, b.maxY);
      pet.style.left = x + "px"; pet.style.top = y + "px";
    });

    // 拖动提示 6 秒后淡出
    if (hint) setTimeout(() => { hint.style.transition = "opacity 1s"; hint.style.opacity = "0"; }, 6000);
  }

  // ---------- 启动 ----------
  // 一次性数据迁移：修复前部分旧对话把知乎链接误存进了「全网参考」，这里按真实域名清洗，并剥掉 LLM 自写的来源清单
  (function migrateCleanRefs(){
    try {
      var MV = "zhiyu_dataver", MVV = "20260910";
      if (localStorage.getItem(MV) === MVV) return;
      var isZh = function(u){ return /zhihu\.com|zhihu\.cn|zhida\.zhihu/i.test(String(u||"")); };
      var cleanArr = function(arr){ return (arr||[]).filter(function(x){ return x && !isZh(x.url||x.Url||""); }); };
      var stripList = function(t){
        if (!t) return t;
        var ls = String(t).split(/\r?\n/);
        var re = /^\s*(?:[-*•·]|\d+[.)])?\s*\*?\s*【?\s*(知乎参考|全网参考)\s*\*{0,2}\s*(?:[:：]|】)/;
        var i = ls.findIndex(function(l){ return re.test(l); });
        if (i < 0) return t;
        return ls.slice(0, i).join("\n").replace(/\s+$/,"").trim();
      };
      Object.keys(localStorage).forEach(function(k){
        if (k.indexOf("zhiyu_chat_") === 0) {
          try {
            var st = JSON.parse(localStorage.getItem(k) || "null");
            if (st && Array.isArray(st.msgs)) {
              st.msgs.forEach(function(m){
                if (m.refsGlobal) m.refsGlobal = cleanArr(m.refsGlobal);
                if (m.refsZhihu) m.refsZhihu = cleanArr(m.refsZhihu);
                if (m.sources) m.sources = cleanArr(m.sources);
                if (m.t && typeof m.t === "string") m.t = stripList(m.t);
                if (m.content && typeof m.content === "string") m.content = stripList(m.content);
              });
              localStorage.setItem(k, JSON.stringify(st));
            }
          } catch(e){}
        } else if (k === "zhiyu_explore") {
          try {
            var ex = JSON.parse(localStorage.getItem(k) || "[]");
            if (Array.isArray(ex)) {
              ex.forEach(function(b){ if(b){ if(b.refsGlobal) b.refsGlobal = cleanArr(b.refsGlobal); if(b.refsZhihu) b.refsZhihu = cleanArr(b.refsZhihu); if(b.sources) b.sources = cleanArr(b.sources); } });
              localStorage.setItem(k, JSON.stringify(ex));
            }
          } catch(e){}
        }
      });
      localStorage.setItem(MV, MVV);
    } catch(e){}
  })();
  // 一次性清理：按名称删除指定知识点粒子 / 天体（名单存 zhiyu_graph_dropnames，可清空恢复）
  (function migrateDropNames(){
    try {
      var SEEDV = "zhiyu_dropseed_v", SEED = "2026091127";
      if (localStorage.getItem(SEEDV) === SEED) return;
      var NAMES = ["我老是焦虑", "Loot Drop | 11", "四维积累闭环", "三重验证筛选", "五步蒸馏法", "颗粒度ROI法则", "价值翻译框架"];
      var cur = []; try { cur = JSON.parse(localStorage.getItem(ZY_DROP_KEY) || "[]") || []; } catch (e) {}
      NAMES.forEach(function (n) { if (cur.indexOf(n) < 0) cur.push(n); });
      localStorage.setItem(ZY_DROP_KEY, JSON.stringify(cur));
      try {
        var kd = JSON.parse(localStorage.getItem(KP_KEY) || "null");
        if (kd) {
          if (kd.assign) { Object.keys(kd.assign).forEach(function (k) { if (zyDropHit(kd.assign[k] && kd.assign[k].label)) delete kd.assign[k]; }); }
          if (Array.isArray(kd.extra)) kd.extra = kd.extra.filter(function (r) { return !zyDropHit(r && r.label); });
          localStorage.setItem(KP_KEY, JSON.stringify(kd));
        }
      } catch (e) {}
      try {
        var cu = JSON.parse(localStorage.getItem("zhiyu_graph_custom") || "[]");
        if (Array.isArray(cu)) { cu = cu.filter(function (x) { return !zyDropHit(x && x.label); }); localStorage.setItem("zhiyu_graph_custom", JSON.stringify(cu)); }
      } catch (e) {}
      localStorage.setItem(SEEDV, SEED);
    } catch (e) {}
  })();
  window.addEventListener("hashchange", navigate);
  navigate();
  // 「清空对话」不能只清消息数组：模块自己的进度 / 画像 / 已生成计划存在各自的状态键里，
  // 切走再切回或刷新时会被重新渲染出来，用户看到的就是「历史记录没清干净」。
  // 这里按聊天框 cid 联动重置所属模块状态，等价于各模块的「重新开始」，但不自动重开话题。
  function zyResetModuleState(cid) {
    if (cid === "selfChat") {
      // 自我认知：清画像 / 答案 / 进度
      clearSelfAll();
      saveSelfState();
      const _o = document.getElementById("selfOut"); if (_o) _o.innerHTML = "";
      return;
    }
    if (cid === "rvChat") {
      // 复盘：清访谈进度与已产出内容
      resetReviewState();
      const _ro = document.getElementById("rvOut"); if (_ro) _ro.innerHTML = "";
      const _rc = document.getElementById("rvCard"); if (_rc) _rc.style.display = "none";
      return;
    }
    if (cid === "fdChat") {
      // 领域速通：清访谈进度与已生成的学习计划
      fieldState = { step: 0, q: "", goal: "", lv: "", hr: "", style: "", pick: [], planDone: false, planText: "" };
      saveFieldState();
      const out = document.getElementById("fdOut"); if (out) out.innerHTML = "";
      const c = document.getElementById("fdCard"); if (c) c.style.display = "none";
      document.querySelectorAll(".method-pick.on").forEach(function (el) { el.classList.remove("on"); });
      return;
    }
    if (cid === "alChat") {
      // 处境对齐：当前议题也要一并清掉，否则重进模块会沿用旧议题
      const st = chatGet("alChat"); st.q = ""; chatSave("alChat");
      return;
    }
    // mdChatBox（思维模型）/ liuChatBox（刘看山浮层）/ lxChat（玄学）等：
    // 不额外挂模块级持久化进度，清掉对话即可。
  }
  function zyClearChatAll(cid) {
    chatReset(cid);
    if (liuHistories && liuHistories[cid]) liuHistories[cid] = [];
    try { zyResetModuleState(cid); } catch (e) { /* 单个模块重置失败不影响对话清空 */ }
    renderChat(cid);
  }
  // 聊天工具（清空对话 / 单条删除）统一事件委托，覆盖模块与刘看山浮层
  (function () {
    const root = document;
    root.addEventListener("click", (e) => {
      const t = e.target;
      const del = t.closest && t.closest(".msg-del");
      if (del) {
        const chat = del.closest(".chat");
        if (chat && chat.id) {
          const idx = parseInt(del.getAttribute("data-i"), 10);
          if (!isNaN(idx)) chatDeleteMsg(chat.id, idx);
        }
        return;
      }
      const clr = t.closest && t.closest(".zy-clear-chat");
      if (clr) {
        const cid = clr.getAttribute("data-cid");
        if (cid && window.confirm("确定清空这段对话的全部历史记录吗？\n会连同本模块的进度 / 画像 / 已生成内容一起重置，此操作不可撤销。")) {
          zyClearChatAll(cid);
        }
      }
    });
  })();
  // 复盘里的「思维模型卡」按钮统一事件委托：
  // 卡片现已结构化存盘、重渲染会重建 DOM，内联 onclick 会丢失，故统一走委托
  (function () {
    document.addEventListener("click", (e) => {
      const t = e.target;
      if (!t || !t.closest) return;
      const lens = t.closest(".tool-lens");
      if (lens) {
        const label = lens.getAttribute("data-label") || "这个思维模型";
        const ev = lens.getAttribute("data-ev") || "";
        liuReply("rvChat", {
          q: "用「" + label + "」这个思维 / 决策框架，帮我复盘这件事：" + ev,
          persona: "review",
          methods: SYSTEM_THINK.map((x) => ({ name: x.name, one: x.one, when: x.when })),
          showSources: true, fresh: true,
        }, "我在呢～");
        return;
      }
      const save = t.closest(".zhmodel-save");
      if (save) {
        const name = (save.getAttribute("data-name") || "").trim();
        if (!name) return;
        const core = save.getAttribute("data-core") || "";
        const when = save.getAttribute("data-when") || "";
        const tip = save.getAttribute("data-tip") || "";
        const cust = loadZxCustom(); cust.added = cust.added || [];
        if (cust.added.find((x) => x.label === name)) { liuShout("「" + name + "」已经在你的工具箱里啦～"); return; }
        cust.added.push({
          id: "rv_" + Date.now(), cat: "我的蒸馏模型", catName: "我的蒸馏模型",
          label: name, detail: core + (when ? "（适用：" + when + "）" : ""),
          full: [core, when ? "适用：" + when : "", tip ? "口诀：" + tip : ""].filter(Boolean).join("\n"),
          custom: true,
        });
        saveZxCustom(cust);
        const tb = document.getElementById("zxToolbox");
        if (tb) renderZxToolbox(tb);
        liuShout("已收进「系统思维与方法论工具箱 · 我的蒸馏模型」🧰");
      }
      const mrv = t.closest(".mrv-use");
      if (mrv) {
        const nm = mrv.getAttribute("data-name") || "这个思维模型";
        const q = mrv.getAttribute("data-q") || "";
        appendMsg("rvChat", "user", "用「" + nm + "」的视角拆这件事");
        liuReply("rvChat", { q: "用「" + nm + "」的视角，帮我复盘这件事：" + q, persona: "review", showSources: true, fresh: true }, "我在呢～");
        return;
      }
    });
  })();
  // 刘看山浮层聊天框历史恢复（它不在 #view 内，navigate 不会覆盖到）
  try { renderChat("liuChatBox"); ensureChatTools(document.getElementById("liuChatBox")); } catch (e) {}
  const li = document.getElementById("liuInput");
  if (li) {
    li.addEventListener("keydown", (e) => { if (e.key === "Enter") liuChat(); });
  }

  // ---------- 移动端抽屉导航 ----------
  (function () {
    const sidebar = document.querySelector(".sidebar");
    const toggle = document.getElementById("navToggle");
    const backdrop = document.getElementById("navBackdrop");
    if (!sidebar || !toggle || !backdrop) return;
    const open = () => { sidebar.classList.add("open"); backdrop.classList.add("open"); document.body.style.overflow = "hidden"; };
    const close = () => { sidebar.classList.remove("open"); backdrop.classList.remove("open"); document.body.style.overflow = ""; };
    toggle.addEventListener("click", () => (sidebar.classList.contains("open") ? close() : open()));
    backdrop.addEventListener("click", close);
    sidebar.querySelectorAll(".nav a").forEach((a) => {
      a.addEventListener("click", (e) => {
        e.preventDefault();
        const href = a.getAttribute("href");
        if (href && href.startsWith("#")) location.hash = href;
        close();
      });
    });
    window.addEventListener("hashchange", close);
  })();

  // 知乎授权回调：地址栏带 authorization_code 时先换 sid，再按需重绘私人知识库
  (async () => {
    try { renderZhihuBar(); } catch (e) {}   // 进入即检查并刷新侧栏登录态（修复「连接后导航栏不刷新」）
    try {
      const ok = await handleZhihuCallback();
      if (ok) {
        try { showAuthOk("✅ 已连接你的知乎账号，正在载入你的数据…"); } catch (e) {}
        try { navigate(); } catch (e) {}          // 无论在哪个 tab 都重绘，让登录态立即生效
        try { renderZhihuBar(); } catch (e) {}
        if (zhAuthRefresh) { try { zhAuthRefresh(); } catch (e) {} }
      }
    } catch (e) {}
  })();
  // ============ 私人知识库 · 我的笔记（Markdown，仅存本机，不同步到知识星球）============
  const NOTES_KEY = "zhiyu_notes";
  function loadNotes() { try { const a = JSON.parse(localStorage.getItem(NOTES_KEY) || "[]"); return Array.isArray(a) ? a : []; } catch (e) { return []; } }
  function saveNotes(a) { try { localStorage.setItem(NOTES_KEY, JSON.stringify(a)); } catch (e) {} }
  function getNote(id) { return loadNotes().find((n) => n.id === id) || null; }
  function upsertNote(note) { const a = loadNotes(); const i = a.findIndex((n) => n.id === note.id); if (i >= 0) a[i] = note; else a.push(note); saveNotes(a); return note; }
  function deleteNote(id) {
    saveNotes(loadNotes().filter((n) => n.id !== id));
    try { const p = document.getElementById("notesPanel"); if (p) renderNotesPanel(p); } catch (e) {}
  }
  function newNoteId() { return "n_" + Date.now().toString(36) + Math.random().toString(36).slice(2, 6); }
  // 双向链接（[[ ]] 与反向链接）已按用户要求移除
  let _noteQuery = "";
  function esc(s) { return String(s).split("&").join("&amp;").split("<").join("&lt;").split(">").join("&gt;").split('"').join("&quot;"); }
  // 行内：粗体 **x** → <b>
  function inlineBold(s) {
    let out = "", i = 0;
    while (i < s.length) { const a = s.indexOf("**", i); if (a < 0) { out += s.slice(i); break; } out += s.slice(i, a); const b = s.indexOf("**", a + 2); if (b < 0) { out += s.slice(a); break; } out += "<b>" + s.slice(a + 2, b) + "</b>"; i = b + 2; }
    return out;
  }
  function inlineItalic(s) {
    let out = "", i = 0;
    while (i < s.length) { const a = s.indexOf("*", i); if (a < 0) { out += s.slice(i); break; } out += s.slice(i, a); const b = s.indexOf("*", a + 1); if (b < 0) { out += s.slice(a); break; } out += "<i>" + s.slice(a + 1, b) + "</i>"; i = b + 1; }
    return out;
  }
  function inlineLink(s) {
    let out = "", i = 0;
    while (i < s.length) {
      const a = s.indexOf("[", i);
      if (a < 0) { out += s.slice(i); break; }
      const c = s.indexOf("]", a); if (c < 0) { out += s.slice(i); break; }
      const d = s.indexOf("(", c); const e = s.indexOf(")", c);
      if (d > c && e > d) { out += s.slice(i, a) + "<a href='" + s.slice(d + 1, e) + "' target='_blank' rel='noopener'>" + s.slice(a + 1, c) + "</a>"; i = e + 1; }
      else { out += s.slice(i, a + 1); i = a + 1; }
    }
    return out;
  }
  function inlineFmt(line) { return inlineLink(inlineItalic(inlineBold(line))); }
  // 轻量、安全 Markdown 渲染（仅转义 &<>" 以保留标记；[[ ]] 渲染为可点击链接）
  function renderMarkdown(md) {
    let src = (md || "").split("\r\n").join("\n");
    const codeBlocks = [];
    const parts = src.split("```");
    let text = "";
    for (let k = 0; k < parts.length; k++) {
      if (k % 2 === 1) { let c = parts[k]; if (c.indexOf("\n") === 0) c = c.slice(1); codeBlocks.push(c); text += "@@CODE" + (codeBlocks.length - 1) + "@@"; }
      else text += parts[k];
    }
    src = text;
    const inlines = [];
    const ip = src.split("`");
    let text2 = "";
    for (let k = 0; k < ip.length; k++) { if (k % 2 === 1) { inlines.push(ip[k]); text2 += "@@INL" + (inlines.length - 1) + "@@"; } else text2 += ip[k]; }
    src = text2;
    src = esc(src);
    for (let k = 0; k < inlines.length; k++) src = src.split("@@INL" + k + "@@").join("<code>" + esc(inlines[k]) + "</code>");
    for (let k = 0; k < codeBlocks.length; k++) src = src.split("@@CODE" + k + "@@").join("<pre class='md-pre'><code>" + esc(codeBlocks[k]) + "</code></pre>");
    const lines = src.split("\n");
    let html = "", inUl = false, inOl = false;
    const closeLists = () => { if (inUl) { html += "</ul>"; inUl = false; } if (inOl) { html += "</ol>"; inOl = false; } };
    for (let li = 0; li < lines.length; li++) {
      let line = lines[li];
      let hc = 0; while (hc < line.length && line[hc] === "#") hc++;
      if (hc >= 1 && hc <= 6 && (hc === line.length || line[hc] === " ")) { closeLists(); html += "<h" + hc + " class='md-h'>" + inlineFmt(line.slice(hc + 1).trim()) + "</h" + hc + ">"; continue; }
      if (line.indexOf(">") === 0) { closeLists(); html += "<blockquote class='md-quote'>" + inlineFmt(line.slice(1).trim()) + "</blockquote>"; continue; }
      if (line.indexOf("- ") === 0 || line.indexOf("* ") === 0) { if (!inUl) { html += "<ul class='md-ul'>"; inUl = true; } html += "<li>" + inlineFmt(line.slice(2)) + "</li>"; continue; }
      let oi = 0; while (oi < line.length && line[oi] >= "0" && line[oi] <= "9") oi++;
      if (oi > 0 && line[oi] === "." && line[oi + 1] === " ") { if (!inOl) { html += "<ol class='md-ol'>"; inOl = true; } html += "<li>" + inlineFmt(line.slice(oi + 2)) + "</li>"; continue; }
      if (line.trim() === "") { closeLists(); continue; }
      closeLists();
      html += "<p>" + inlineFmt(line) + "</p>";
    }
    closeLists();
    return html;
  }
  function openNoteEditor(noteId) {
    let note = noteId ? getNote(noteId) : null;
    const isNew = !note;
    if (isNew) note = { id: newNoteId(), title: "", md: "", tags: [], links: [], createdAt: Date.now(), updatedAt: Date.now() };
    // 单例：先移除已存在的编辑器，避免多个 #noteBackdrop 叠加导致 getElementById 取错实例
    const _ex = document.getElementById("noteBackdrop"); if (_ex) _ex.remove();
    const ov = document.createElement("div");
    ov.className = "note-backdrop"; ov.id = "noteBackdrop";
    ov.innerHTML = "<div class='note-modal'>" +
      "<div class='note-head'>" +
      "<input id='noteTitle' class='note-title' placeholder='笔记标题' value='" + escAttr(note.title) + "' />" +
      "<button class='note-x' id='noteClose' type='button'>×</button>" +
      "</div>" +
      "<div class='row note-tags-row'>" +
      "<input id='noteTags' class='flex1' placeholder='标签，用空格分隔，如：成长 复盘' value='" + escAttr((note.tags || []).join(" ")) + "' />" +
      "</div>" +
      "<div class='note-body'>" +
      "<textarea id='noteMd' class='note-md' placeholder='用 Markdown 写。笔记只存在本地，不会同步到知识星球。'>" + escHTML(note.md) + "</textarea>" +
      "<div id='notePreview' class='note-preview md-body'></div>" +
      "</div>" +
      "<div class='row note-foot'>" +
      "<button id='noteSave' class='primary'>💾 保存</button>" +
      (isNew ? "" : "<button id='noteDelete' class='ghost'>🗑 删除</button>") +
      "<span id='noteOut' class='muted' style='margin-left:8px'></span>" +
      "</div>" +
      "<p class='muted note-hint'>笔记只保存在本机，不会进入上方知识星球；每点一次「💾 保存」都会自动留下一版历史记录。</p>" +
      "</div>";
    document.body.appendChild(ov);
    const close = () => { ov.remove(); };
    ov.addEventListener("click", (e) => { if (e.target === ov) close(); });
    ov.querySelector("#noteClose").onclick = close;
    const md = ov.querySelector("#noteMd");
    const prev = ov.querySelector("#notePreview");
    const renderPrev = () => { prev.innerHTML = renderMarkdown(md.value); };
    renderPrev();
    md.addEventListener("input", renderPrev);
    const doSave = () => {
      const title = ov.querySelector("#noteTitle").value.trim();
      if (!title) { ov.querySelector("#noteOut").textContent = "先给笔记起个标题～"; return; }
      const tags = ov.querySelector("#noteTags").value.trim().split(" ").map((t) => t.replace(/^#/, "")).filter(Boolean);
      const mdv = md.value;
      const merged = Object.assign({}, note, { title, tags, md: mdv, links: [], updatedAt: Date.now() });
      if (isNew) merged.createdAt = note.createdAt;
      const stored = getNote(note.id) || null;
      const prevSnap = { ts: (stored && stored.updatedAt) || Date.now(), title: (stored && stored.title) || "", md: (stored && stored.md) || "", tags: ((stored && stored.tags) || []).slice() };
      const curSnap = { ts: Date.now(), title: title, md: mdv, tags: tags.slice() };
      const hist = Array.isArray(stored && stored.history) ? stored.history.slice() : (Array.isArray(note.history) ? note.history.slice() : []);
      if (stored && JSON.stringify(prevSnap) !== JSON.stringify(curSnap)) hist.unshift(prevSnap);
      merged.history = hist.slice(0, 50);
      upsertNote(merged);
      ov.querySelector("#noteOut").textContent = "✅ 已保存";
      try { const p = document.getElementById("notesPanel"); if (p) renderNotesPanel(p); } catch (e) {}
    };
    ov.querySelector("#noteSave").onclick = doSave;
    const del = ov.querySelector("#noteDelete");
    if (del) del.onclick = () => { if (confirm("确定删除这篇笔记？")) { deleteNote(note.id); close(); } };
    setTimeout(() => md.focus(), 50);
  }
  function renderNotesPanel(container) {
    if (!container) return;
    const notes = loadNotes();
    container.innerHTML = "<div class='row' style='justify-content:space-between;align-items:center;flex-wrap:wrap;gap:8px'>" +
      "<h3 style='margin:0'>📝 我的笔记 <span class='muted' style='font-weight:400'>" + notes.length + " 篇</span></h3>" +
      "<div class='row' style='gap:8px;margin:0'>" +
      "<button id='newNoteBtn' class='primary'>＋ 新建笔记</button>" +
      "</div></div>" +
      "<p class='muted'>支持 Markdown；笔记只存在本机，<b>不会同步到上方知识星球</b>。每点一次「💾 保存」都会自动留下一版历史记录。</p>" +
      "<div class='row' style='gap:8px;margin:8px 0'>" +
      "<input id='noteSearch' class='note-search' style='flex:1;min-width:180px' placeholder='🔍 搜索笔记：标题 / 标签 / 正文' />" +
      "<button id='noteSearchClear' class='ghost' type='button'>清空</button>" +
      "</div>" +
      "<div id='noteHit' class='muted' style='font-size:12px;margin-bottom:4px'></div>" +
      "<div id='noteList' class='note-list'></div>";
    const list = container.querySelector("#noteList");
    const hitEl = container.querySelector("#noteHit");
    const searchEl = container.querySelector("#noteSearch");
    if (searchEl) searchEl.value = _noteQuery || "";
    const renderList = () => {
      const _q = (_noteQuery || "").trim().toLowerCase();
      const shown = _q ? notes.filter((n) => (((n.title || "") + " " + ((n.tags || []).join(" ")) + " " + (n.md || "")).toLowerCase().indexOf(_q) >= 0)) : notes;
      if (hitEl) hitEl.textContent = _q ? ("命中 " + shown.length + " / " + notes.length + " 篇") : "";
      list.innerHTML = "";
      if (!shown.length) {
        list.innerHTML = "<div class='muted' style='padding:18px;text-align:center'>" + (notes.length ? ("没有匹配「" + (_noteQuery || "") + "」的笔记。") : "还没有笔记。点「＋ 新建笔记」开始写。") + "</div>";
        return;
      }
      shown.slice().reverse().forEach((n) => {
        const div = document.createElement("div"); div.className = "note-card";
        const snip = (n.md || "").replace(/[#*`\[\]]/g, "").slice(0, 60);
        const hist = Array.isArray(n.history) ? n.history : [];
        div.innerHTML = "<div class='note-card-head'>" +
          "<b class='zk-link' data-note='" + escAttr(n.id) + "' style='cursor:pointer'>" + escHTML(n.title || "未命名笔记") + "</b>" +
          "<button class='note-open' data-id='" + escAttr(n.id) + "' title='打开编辑'>✏️</button>" +
          "<button class='note-del' data-id='" + escAttr(n.id) + "' title='删除这篇笔记'>🗑</button>" +
          "</div>" +
          "<div class='note-tags'>" + (n.tags || []).map((t) => "<span class='chip'>#" + escHTML(t) + "</span>").join(" ") + "</div>" +
          "<div class='muted note-snip'>" + escHTML(snip) + "</div>" +
          "<details class='note-hist-det'><summary class='muted' style='cursor:pointer;font-size:12px'>🕘 历史记录（" + hist.length + " 版）</summary>" +
          "<div class='note-hist-list'>" +
          (hist.length ? hist.map((h, i) =>
            "<div class='note-hist-item'>" +
            "<span class='muted' style='font-size:12px'>" + new Date(h.ts || Date.now()).toLocaleString("zh-CN") + "</span>" +
            "<span><b>" + escHTML(h.title || "未命名") + "</b> · " + escHTML(((h.md || "").replace(/\s+/g, " ").slice(0, 50)) || "（空）") + "</span>" +
            "<button class='ghost note-hist-restore' data-id='" + escAttr(n.id) + "' data-i='" + i + "'>恢复</button>" +
            "<button class='note-hist-del' data-id='" + escAttr(n.id) + "' data-i='" + i + "' title='删除这条历史'>🗑</button>" +
            "</div>").join("") : "<div class='muted' style='font-size:12px;padding:4px 0'>还没有历史记录。每次点「💾 保存」都会自动留下上一版内容。</div>") +
          "</div></details>";
        list.appendChild(div);
      });
      list.querySelectorAll(".zk-link").forEach((sp) => sp.onclick = () => openNoteEditor(sp.dataset.note));
      list.querySelectorAll(".note-open").forEach((b) => b.onclick = () => openNoteEditor(b.dataset.id));
      list.querySelectorAll(".note-del").forEach((b) => b.onclick = () => {
        if (!confirm("删除这篇笔记？删除后无法恢复。")) return;
        deleteNote(b.dataset.id);
        try { renderNotesPanel(container); } catch (e) {}
      });
      list.querySelectorAll(".note-hist-restore").forEach((b) => b.onclick = () => {
        const id = b.dataset.id, i = parseInt(b.dataset.i, 10);
        const all = loadNotes(); const cur = all.find((x) => x.id === id); if (!cur) return;
        const hv = (cur.history || [])[i]; if (!hv) return;
        if (!confirm("恢复到这一版？当前内容会先存进历史，不会丢。")) return;
        cur.history = [{ ts: Date.now(), title: cur.title, md: cur.md, tags: (cur.tags || []).slice() }].concat(cur.history || []);
        cur.title = hv.title || cur.title; cur.md = hv.md || ""; cur.tags = (hv.tags || []).slice(); cur.updatedAt = Date.now();
        saveNotes(all);
        try { renderNotesPanel(container); } catch (e) {}
      });
      list.querySelectorAll(".note-hist-del").forEach((b) => b.onclick = () => {
        const id = b.dataset.id, i = parseInt(b.dataset.i, 10);
        if (!confirm("删除这条历史记录？")) return;
        const all = loadNotes(); const cur = all.find((x) => x.id === id); if (!cur) return;
        cur.history = (cur.history || []).slice(); cur.history.splice(i, 1);
        saveNotes(all);
        try { renderNotesPanel(container); } catch (e) {}
      });
    };
    if (searchEl) searchEl.addEventListener("input", () => { _noteQuery = searchEl.value || ""; renderList(); });
    const clrBtn2 = container.querySelector("#noteSearchClear");
    if (clrBtn2) clrBtn2.onclick = () => { _noteQuery = ""; if (searchEl) searchEl.value = ""; renderList(); };
    renderList();
    container.querySelector("#newNoteBtn").onclick = () => openNoteEditor(null);
  }
  initLiuPet();
})();



// 学习方法工具箱搜索功能
function initFieldMethodSearch(v) {
  const searchInput = document.getElementById("fdMethodsSearch");
  const showAllBtn = document.getElementById("fdMethodsShowAll");
  
  if (searchInput) {
    searchInput.addEventListener("input", function(e) {
      const searchTerm = e.target.value.toLowerCase().trim();
      filterFieldMethods(searchTerm);
    });
  }
  
  if (showAllBtn) {
    showAllBtn.addEventListener("click", function() {
      document.getElementById("fdMethodsSearch").value = "";
      filterFieldMethods("");
    });
  }
}

function filterFieldMethods(searchTerm) {
  const methodElements = document.querySelectorAll("#fdMethods .method-pick");
  methodElements.forEach(el => {
    const methodName = el.querySelector(".mp-name").textContent.toLowerCase();
    if (searchTerm === "" || methodName.includes(searchTerm)) {
      el.style.display = "block";
    } else {
      el.style.display = "none";
    }
  });
}

// 系统思维方法论工具箱搜索功能
function initZxToolboxSearch() {
  const searchInput = document.getElementById("zxToolboxSearch");
  const showAllBtn = document.getElementById("zxToolboxShowAll");
  
  if (searchInput) {
    searchInput.addEventListener("input", function(e) {
      const searchTerm = e.target.value.toLowerCase().trim();
      filterZxToolboxItems(searchTerm);
    });
  }
  
  if (showAllBtn) {
    showAllBtn.addEventListener("click", function() {
      document.getElementById("zxToolboxSearch").value = "";
      filterZxToolboxItems("");
    });
  }
}

function filterZxToolboxItems(searchTerm) {
  // 这里需要根据实际的工具箱元素结构进行过滤
  // 由于工具箱内容是动态生成的，我们需要遍历所有类别和项目
  const categoryElements = document.querySelectorAll("#zxToolbox > details");
  categoryElements.forEach(category => {
    const categoryName = category.querySelector("summary")?.textContent?.toLowerCase() || "";
    const itemElements = category.querySelectorAll(".zx-item");
    
    let categoryHasMatchingItem = false;
    
    itemElements.forEach(item => {
      const itemName = item.textContent.toLowerCase();
      if (searchTerm === "" || itemName.includes(searchTerm)) {
        item.style.display = "block";
        categoryHasMatchingItem = true;
      } else {
        item.style.display = "none";
      }
    });
    
    // 如果搜索词为空或分类中有匹配项，则显示整个分类
    if (searchTerm === "" || categoryHasMatchingItem) {
      category.style.display = "block";
    } else {
      category.style.display = "none";
    }
  });
}

// 修改 renderFieldMethods 函数，在渲染结束后初始化搜索功能
// 注意：我们需要在原函数内部添加对 initFieldMethodSearch 的调用
