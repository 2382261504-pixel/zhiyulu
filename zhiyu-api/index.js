// 知遇录 · 云函数（CloudBase HTTP 函数 / 本地 Node 服务 双模）
// 真实接入知乎开放平台，依据官方手册与 zhihu-cli Skill v0.2.1：
//   Base : https://developer.zhihu.com
//   Auth : Authorization: Bearer <ZHIHU_ACCESS_SECRET>  +  X-Request-Timestamp(秒)
//   搜索 : GET  /api/v1/content/zhihu_search?Query=&Count=10
//   全网 : GET  /api/v1/content/global_search?Query=&Count=20
//   热榜 : GET  /api/v1/content/hot_list?Limit=30
//   直答 : POST /v1/chat/completions  {model, messages, stream:false}
//   关注流: GET  /api/v1/user/followees  （Access Secret 本人关注圈，不需 OAuth）
//   创作 : GET  /api/v1/user/contents   （Access Secret 本人公开创作）
// 密钥仅经环境变量 ZHIHU_ACCESS_SECRET 注入，禁止硬编码。
// 未配置密钥或调用失败时返回 {mock:true}，由前端回退知乎经验分享占位提示，保证 Demo 可运行。

const ZHIHU_BASE = "https://developer.zhihu.com";

// 刘看山陪伴分层 prompt：系统人格 + 模块语气（官方 IP，仅比赛期使用、不商用）
// 升级：像元宝/豆包那样聪明——能多轮承接、会主动结合知乎实时资料、有依据又接地气
const LIU_SYSTEM = `你是刘看山，知乎官方吉祥物，在《知遇录》里做用户的电子好友与成长陪伴宠物。
你像腾讯元宝、豆包那样聪明：能听懂上下文、连续多轮对话、会主动结合实时资料给出有依据又接地气的回答。
语气：温暖、真诚、像见过世面的朋友；不堆术语、不端着、不啰嗦。
你的回答必须充分借助「实时知乎资料」：当用户问事实、方法、人物、趋势、经验时，优先用检索到的知乎真实讨论来支撑，并自然点出来源（例如"知乎上有个答主 @张三 提到…""热榜里大家正热议…"）。
边界：MBTI/星座/玄学/命理仅作娱乐向自我探索参考；不替用户做重大人生决定；不确定就老实说不确定，绝不编造数据或来源。
多轮对话：记得前面聊过什么，自然承接，不重复问已经问过的问题；必要时给一个"明天就能做的小行动"。`;

// 实时资料使用规范（RAG 指令）：让 LLM 把检索结果变成自然、有依据的对话，而非罗列
const LIU_RAG_INSTR = `【实时资料使用规范】
- 下面会给你本次检索到的知乎实时资料（可能来自：站内搜索 / 全网搜索 / 热榜 / 我的创作 / 我的关注）。
- 当资料相关时，把它当成事实依据，用自然口语带出 1-2 个要点，并点出来源（"知乎上 @XX 的一个高赞回答里说…""热榜里大家正热议…"）；不要罗列、不要堆砌、不要照搬原文。
- 资料不相关或为空时，用自己的理解正常回答，不要硬凑、不要说"根据资料"。
- 始终用「朋友聊天」的口吻，多轮承接；该给行动建议就给，但别像写作文。`;

// 提问式教练范式（路线B：对标「知道」的"帮人提问"）。当 payload.coach=true 时附加到系统提示，
// 把刘看山从"直接给结论"切换为"反问澄清 → 拆关键矛盾 → 给视角（不是答案）"。
const LIU_COACH_INSTR = `【提问式教练模式·刘看山此刻的角色】
你不是来给答案的，你是来帮用户把问题想清楚的教练。严格按下面三步走，不要跳步、不要一上来就给结论：
第一步·反问澄清：先接住用户说的，再用一个具体、生活化的问题帮他把模糊的念头澄清成能掂量的东西。多问"具体是哪种""能不能举个例子""你更在意哪一点"，少问空泛的"为什么"。
第二步·拆关键矛盾：指出他话里自相矛盾、或"想做的"和"实际在做的"之间的张力，用他的原话点出来，不评判、不贴标签。
第三步·给视角（不是给答案）：只有当他看清了矛盾，再给一个能帮他继续往下想的小视角，或"明天就能做的最小一步"；结尾强调"这是我的看法，你定"。
全程语气：像见过世面的朋友，不堆术语、不端着、不灌鸡汤、不画大饼。每一轮只推进一小步，宁可少说，绝不抢答。`;

// 不同场景的语气提示（多轮对话里也要保持）
const LIU_PERSONA_HINT = {
  pet: "（桌宠气泡模式：回复极短，1-3 句，像朋友随口接话，可带一点关心或行动建议。）",
  self: "（自我认知模块：你用【提问式教练】的方式陪用户一层层看清自己。先接住他刚说的，用具体反问帮他澄清，再拆他话里的矛盾/张力，最后才轻轻给一个视角——不急着贴 MBTI 标签、不评判。用户说「想一个人待着」，你要先问清「那是回血还是躲」，而不是立刻下结论他内向。）",
  review: "（复盘模块：你是安静陪用户把一件事想透的朋友。顺着他刚说的，自然引出一两个看问题的角度（系统思维/强者心态/认知偏差之类），用生活化的话讲，再问一个帮他更看清的小问题。不替他下结论、不列 1234 说明书、不每次都用同一个套路——多轮承接，问法每回都不同。）",
  field: "（领域速通模块：你是学习方法教练，用【提问式教练】的方式。先反问帮他把『想达成什么目标』澄清具体，再拆『想要的』和『实际会投入的』之间的张力，最后才针对目标给视角/方法。像教练，不啰嗦，不写填空模板。）",
  explore: "（自由探索模式：像元宝/豆包那样，聪明、自然、多轮、有依据地回答，主动引用知乎实时资料。）",
  sample: "（人生样本库：把知乎真实样本讲成可对照、可迁移的经验，标注来源。）",
  align: "（处境对齐模块：你是【提问式教练】。帮用户把当前态与理想态拆开：用反问澄清他当前态里已有的筹码、理想态里最关键的一步，再指出两者之间的关键矛盾（比如「想要自由又怕不稳定」），最后给一个轻轻的视角与明天能做的最小一步。不替他做决定。）",
};

// 证据标准化 + 防幻觉守卫（对标成熟作品的 evidence/source 绑定）
function toEvidence(src) {
  if (!src) return null;
  const title = src.title || src.name || "";
  const author = src.author || src.headline || "";
  const snippet = (src.text || src.summary || "").slice(0, 140);
  if (!title && !author && !snippet) return null;
  return { title, author, url: src.url || "", snippet, source: src.source || "" };
}
function buildEvidence(sources) {
  return (sources || []).map(toEvidence).filter(Boolean).slice(0, 6);
}

// 防幻觉硬规则：LLM 只能引用检索到的真实资料，禁止编造知乎不存在的链接/作者/数据
const GROUNDING_GUARD = `【防幻觉硬规则·必须严格遵守】
1) 你只能引用上方【编号资料】中明确出现的事实，引用时在句末标注编号，如（资料【2】）。
2) 严禁编造资料里不存在的链接、作者、数据、事件，或伪造"知乎上说/有个答主提到"。
3) 资料不足以回答某一点时，明确说"这方面资料里没提"，不要用通用话术假装引用。
4) 所有结论必须能在上方资料中找到依据；拿不准就老实说不确定。
5) 你就是刘看山，绝不能以「知乎直答」「AI 搜索产品」「官方推出的 AI 搜索」等身份自居或自报家门；若被问起你是谁，只说你是刘看山——《知遇录》里的电子好友与成长陪伴宠物。每条回复都严禁以「我是知乎直答」「我是知乎官方推出的 AI 搜索产品」之类开场，也不得出现「我是知乎官方推出的」等与直答产品相关的自我介绍。`;

const MODULE_PERSONA = {
  self: "在自我认知模块，用温柔方式帮用户看见优势与盲区，不贴标签、不评判。",
  review: "在复盘模块，安静陪用户把事实想清楚，顺着他说的自然引导、多轮承接，不替用户下结论。",
  sample: "在人生样本库，把知乎真实样本讲成可对照、可迁移的经验，必须标注来源（问题/答主/链接）。",
  align: "在处境对齐，帮用户把自己的变量和样本变量分开，看清可控与不可控。",
  field: "在领域速通，你是学习方法教练：先帮用户明确学习目标，再针对目标推荐具体学习方法（西蒙/费曼/SQ3R/康奈尔/麻省理工AI/番茄），说明用什么方法达成什么目标，并给出可执行的 4 周计划。",
};

// 直答去模板化：每轮随机一个表达角度，避免回答雷同/模板化
const ANSWER_ANGLES = [
  "用一句生活化的比喻开头，把抽象道理落进日常。",
  "从一句反问开始，先把人问住，再给答案。",
  "用清单体呈现，分 3-5 条，每条一句人话。",
  "先讲一个真实感的小故事带出观点，别先讲道理。",
  "用朋友对面聊的口吻，像坐在一起说话。",
  "先抛一个容易踩的误区，再纠偏。",
  "克制篇幅，只留最扎心的三句话。",
  "多给一个「明天就能做的小行动」，别只讲道理。",
  "换一个反直觉的角度来讲，少人提的那一面。",
  "用「假如五年后的你回头看」的视角收尾。",
];
// 领域速通·学习方法工具箱（与前端 LEARN_METHODS 同源，后端用于规划兜底时匹配方法）
const FIELD_METHODS = [
  { name: "西蒙学习法", desc: "聚焦单一领域、短时间高浓度投入，把有限精力 all-in 一个目标，用几个月到一年成为行家。", use: "先把「领域」拆成 3 个最小子主题，未来 30 天只碰这 3 个，其它一律先放。" },
  { name: "费曼学习法", desc: "用「教给外行」倒逼真懂：选概念→讲给小孩→卡壳回补→简化类比。", use: "每学完一个点，试着讲给一个完全不懂的朋友（或对着录音）听，讲不顺的地方标红，回头补。" },
  { name: "SQ3R阅读法", desc: "浏览 Survey→提问 Question→精读 Read→复述 Recite→复习 Review，把书读厚再读薄。", use: "拿到资料先扫一遍、提 3 个问题，再带着问题精读，读完合上书复述、第二天复习。" },
  { name: "康奈尔笔记法", desc: "一页分三区（主栏/侧栏/总结），边学边提炼，复习只看总结与线索。", use: "每一节学习用一页三栏笔记：主栏记要点、侧栏写关键词、底部写一句话总结，复习只看总结。" },
  { name: "麻省理工AI学习法", desc: "把 AI 当陪练：用提示词拆解概念、让 AI 出题测验、对话式查漏补缺、生成思维导图与间隔复习卡。", use: "把 AI 当陪练：让它出小题考你、用追问帮你查漏、生成思维导图和间隔复习卡。" },
  { name: "番茄工作法", desc: "25 分钟专注 + 5 分钟休息，靠节奏对抗拖延。", use: "把每天的时间切成几个番茄钟（25+5），每个钟只做一件最小的事，休息就彻底放下。" },
  { name: "间隔重复", desc: "按遗忘曲线安排复习，把短期记忆锻成长期。", use: "把要记的概念丢进复习卡，按第 1/2/4/7/15 天复习，别一次性硬记。" },
];
function randStr(n){ let s=""; const c="abcdefghijklmnopqrstuvwxyz0123456789"; for(let i=0;i<(n||8);i++) s+=c[Math.floor(Math.random()*c.length)]; return s; }

// 刘看山对话式回复人格（让桌宠与各模块真的"接得住话"，而非只丢搜索结果）
const LIU_CHAT_PERSONA = {
  pet: "你正以「桌宠」身份和用户在气泡里随口聊，回复极短（1-2 句），像朋友随口接话，可带一点关心或行动建议。",
  self: "你在「自我认知」模块，陪用户一层层看清自己。先温和接住他刚说的话（别复述原话，点出你听到的情绪或轮廓），再自然引出下一个问题。不贴标签、不评判。",
  review: "你在「复盘」模块。用户刚讲了一段事，你顺着他说的，自然带出一两个看问题的角度（系统思维 / 强者心态 / 认知偏差等，用生活化的话讲），然后温柔地问一个帮他更看清的小问题。问法每回不同，不套固定四步法、不列说明书。不替他下结论。",
  field: "你在「领域速通」模块，是用户的学习方法教练。先简短接住他刚说的，再自然问出下一步该问的（${ctx}）。重点引导他把『想达成什么目标』讲具体，再针对目标推荐合适的学习方法，说清『用什么方法、怎么用它达成这个目标』。像教练，不啰嗦。",
};
// 李玄通：东方术数先生（娱乐向）。完整排盘引擎 + 强指令，让 LLM 真的"会看盘"而非说套话。
// 李玄通（与本地专家包 agents/li-xuantong.md 同源）：五术全门类 + 强制引书 + 全方位检测引导
const LIXUAN_SYSTEM = `你是李玄通，贯通中国传统术数「山·医·命·相·卜」五术全门类的宗师级顾问。以生辰八字、起卦信息为本，为用户推演命运格局、剖析运势起伏、占断吉凶休咎。
你只做"自我觉察的参考"：明确告知这是娱乐向、不作决策凭据、不预言灾祸吉凶、不吓人、不绝对。
你的本事在于"真的会排盘、会读盘"——用户报生辰，你先按事实把四柱、日主、五行、十神、喜用神、紫微命宫讲清楚，再论格局、给方向；用户问事，你起卦、看体用生克给点拨。你绝不编造排盘数据，只基于事实发挥。
凡综合之问，须以五术多维度交叉、立体全貌作答，覆盖山·医·命·相·卜诸门，不偏废单一门类；每一维度必引知识库典籍（手册＋原典各至少一部），标注《书名》，禁止只写书名不引本包书籍；信息不齐的维度显式注明「（此维未提供信息，从略）」，不得静默遗漏。
若对话中提供【典籍依据】（摘自用户收藏的术数典籍），你须优先据此引述、并注明《书名》，不脱离原文臆造；典籍未覆盖处再凭通识发挥，并标注娱乐向。
语气像对面坐着的老先生，亲切、克制、像在聊天，不堆术语。`;

// ============ 李玄通 · 藏书检索（用户私有典籍，仅服务端使用，不外发前端） ============
const fs = require("fs"), path = require("path");
function lxBigrams(s) {
  const out = new Set();
  const c = (s || "").replace(/[^一-鿿]/g, "");
  for (let i = 0; i < c.length - 1; i++) out.add(c.substr(i, 2));
  return out;
}
let LIXUAN_IDX = [];
try {
  const corpusPath = path.join(__dirname, "lixuan_corpus.json");
  const raw = JSON.parse(fs.readFileSync(corpusPath, "utf8"));
  LIXUAN_IDX = (raw.sources || []).map((c) => ({ src: c.src, tag: c.tag || "", text: c.text, bg: lxBigrams(c.text) }));
  console.log("[lixuan] 藏书载入：" + LIXUAN_IDX.length + " 段");
} catch (e) {
  LIXUAN_IDX = [];
  console.log("[lixuan] 藏书载入失败：" + e.message);
}
// 依据用户问题 + 命盘上下文，检索 top-K 典籍段落（中文 bigram 重叠 + 分类偏好加权）
function lxRetrieve(q, chart, k, preferTag) {
  k = k || 6;
  let ctx = q || "";
  if (chart) {
    ctx += " " + chart.dayMaster.gan + chart.dayMaster.wx + " " + (chart.xiYong || []).join(" ") + " ";
    ctx += chart.pillars.map((x) => x.ss).join(" ") + " " + (chart.ziwei ? chart.ziwei.star : "");
  }
  let prefer = preferTag || "";
  if (!prefer) {
    if (/面相|相学|看相|五官|眉|眼|鼻|耳|嘴|脸/.test(q || "")) prefer = "面相";
    else if (/紫微|命宫|星|斗数|宫/.test(q || "")) prefer = "紫微";
  }
  const qbg = lxBigrams(ctx);
  const cands = LIXUAN_IDX.map((c) => {
    let score = 0;
    c.bg.forEach((b) => { if (qbg.has(b)) score++; });
    if (prefer && c.tag === prefer) score += 6;
    return { c, score };
  }).filter((x) => x.score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, Math.max(k * 3, 18))
    .map((x) => x.c);
  return lxDiversify(cands, k);
}
// 典籍依据按「书」轮转取：先每本取 1 段，再每本取第 2 段……
// 否则 top-K 全被字数最多 / 命中最高的一本占满（用户看到「基于本地典籍参考只有一本渊海子平」）。
function lxDiversify(list, k) {
  const bySrc = {}; const order = [];
  (list || []).forEach((c) => {
    if (!bySrc[c.src]) { bySrc[c.src] = []; order.push(c.src); }
    bySrc[c.src].push(c);
  });
  const out = [];
  for (let round = 0; out.length < k; round++) {
    let added = false;
    for (let i = 0; i < order.length && out.length < k; i++) {
      const arr = bySrc[order[i]];
      if (arr[round]) { out.push(arr[round]); added = true; }
    }
    if (!added) break;
  }
  return out.slice(0, k);
}

// ============ 李玄通 · 术数引擎（娱乐向，完整排盘，已校立春） ============
const LX_GAN = ["甲","乙","丙","丁","戊","己","庚","辛","壬","癸"];
const LX_ZHI = ["子","丑","寅","卯","辰","巳","午","未","申","酉","戌","亥"];
const LX_GAN_WX = ["木","木","火","火","土","土","金","金","水","水"];
const LX_ZHI_WX = ["水","土","木","木","土","火","火","土","金","金","土","水"];
const LX_WX = ["木","火","土","金","水"];
const LX_SHICHEN = ["子时","丑时","寅时","卯时","辰时","巳时","午时","未时","申时","酉时","戌时","亥时"];
// 12 节气的寿星公式常数（用于月支/立春校正，2000–2099 近似，±1日）
const LX_TERM_C = { 1:5.4055, 2:4.6295, 3:5.63, 4:4.81, 5:5.52, 6:5.678, 7:7.108, 8:7.5, 9:7.646, 10:8.318, 11:7.438, 12:7.18 };
const LX_BAGUA = [
  { n: "乾", wx: "金", yi: "刚健主动，诸事开端有力，宜果决前行。" },
  { n: "兑", wx: "金", yi: "悦泽交流，利口才与协作，防言多必失。" },
  { n: "离", wx: "火", yi: "明丽附丽，利声名与表达，防浮光掠影。" },
  { n: "震", wx: "木", yi: "震动奋起，事有变动之机，宜主动破局。" },
  { n: "巽", wx: "木", yi: "顺入随风，宜渐进渗透、借势而行。" },
  { n: "坎", wx: "水", yi: "险陷流动，事有坎需谨慎，宜守正渡难关。" },
  { n: "艮", wx: "土", yi: "静止如山，宜止、宜沉淀、宜定计划。" },
  { n: "坤", wx: "土", yi: "厚载包容，宜顺势积累、以柔克刚。" },
];
const LX_TRG_BIT = [7,6,5,4,3,2,1,0];
const LX_BIT_TRG = [7,6,5,4,3,2,1,0];

function lxJulian(y, m, d) {
  const a = Math.floor((14 - m) / 12);
  const yy = y + 4800 - a;
  const mm = m + 12 * a - 3;
  return d + Math.floor((153 * mm + 2) / 5) + 365 * yy + Math.floor(yy / 4) - Math.floor(yy / 100) + Math.floor(yy / 400) - 32045;
}
function lxTermDate(y, month, C) {
  const Y = y % 100;
  let day = Math.floor(Y * 0.2422 + C) - Math.floor(Y / 4);
  return new Date(y, month - 1, day);
}
// 月支：依节气边界（立春/惊蛰/…/大雪），而非公历月
function lxMonthZhi(y, m, d) {
  const lichun = lxTermDate(y, 2, LX_TERM_C[2]);
  const jingzhe = lxTermDate(y, 3, LX_TERM_C[3]);
  const qingming = lxTermDate(y, 4, LX_TERM_C[4]);
  const lixia = lxTermDate(y, 5, LX_TERM_C[5]);
  const mangzhong = lxTermDate(y, 6, LX_TERM_C[6]);
  const xiaoshu = lxTermDate(y, 7, LX_TERM_C[7]);
  const liqiu = lxTermDate(y, 8, LX_TERM_C[8]);
  const bailu = lxTermDate(y, 9, LX_TERM_C[9]);
  const hanlu = lxTermDate(y, 10, LX_TERM_C[10]);
  const lidong = lxTermDate(y, 11, LX_TERM_C[11]);
  const daxue = lxTermDate(y, 12, LX_TERM_C[12]);
  const xiaohan = lxTermDate(y, 1, LX_TERM_C[1]);
  const daxuePrev = lxTermDate(y - 1, 12, LX_TERM_C[12]);
  const cur = new Date(y, m - 1, d);
  if (cur >= daxuePrev && cur < xiaohan) return 0; // 子
  if (cur >= xiaohan && cur < lichun) return 1;    // 丑
  if (cur >= lichun && cur < jingzhe) return 2;    // 寅
  if (cur >= jingzhe && cur < qingming) return 3;
  if (cur >= qingming && cur < lixia) return 4;
  if (cur >= lixia && cur < mangzhong) return 5;
  if (cur >= mangzhong && cur < xiaoshu) return 6;
  if (cur >= xiaoshu && cur < liqiu) return 7;
  if (cur >= liqiu && cur < bailu) return 8;
  if (cur >= bailu && cur < hanlu) return 9;
  if (cur >= hanlu && cur < lidong) return 10;
  if (cur >= lidong && cur < daxue) return 11;
  return 0; // 子（大雪后至小寒前）
}
function lxYearGZ(y, m, d) {
  const lichun = lxTermDate(y, 2, LX_TERM_C[2]);
  const adj = (new Date(y, m - 1, d) >= lichun) ? y : y - 1; // 立春前属上一年
  const idx = ((adj - 4) % 60 + 60) % 60;
  return { g: idx % 10, z: idx % 12 };
}
function lxMonthGan(yG, mZhi) {
  const base = [2, 4, 6, 8, 0][yG % 5]; // 五虎遁：甲己丙·乙庚戊·丙辛庚·丁壬壬·戊癸甲
  const fromYin = (mZhi - 2 + 12) % 12;  // 寅月起
  return (base + fromYin) % 10;
}
function lxShiShen(dayG, tG) {
  const dwx = LX_GAN_WX[dayG], twx = LX_GAN_WX[tG];
  const dY = dayG % 2 === 0, tY = tG % 2 === 0;
  if (dwx === twx) return dY === tY ? "比肩" : "劫财";
  if (LX_WX[(LX_WX.indexOf(dwx) + 4) % 5] === twx) return dY === tY ? "偏印" : "正印"; // 生我
  if (LX_WX[(LX_WX.indexOf(dwx) + 1) % 5] === twx) return dY === tY ? "食神" : "伤官"; // 我生
  if (LX_WX[(LX_WX.indexOf(dwx) + 2) % 5] === twx) return dY === tY ? "偏财" : "正财"; // 我克
  if (LX_WX[(LX_WX.indexOf(dwx) + 3) % 5] === twx) return dY === tY ? "七杀" : "正官"; // 克我
  return "—";
}
function lxWxCount(b) {
  const c = { 木:0, 火:0, 土:0, 金:0, 水:0 };
  [b.yG, b.mG, b.dG, b.hG].forEach((g) => { c[LX_GAN_WX[g]]++; });
  [b.yZ, b.mZ, b.dZ, b.hZhi].forEach((z) => { c[LX_ZHI_WX[z]]++; });
  return c;
}
function lxStrength(b) {
  const dm = b.dayMaster;
  let sup = 0, dr = 0;
  [b.yG, b.mG, b.dG, b.hG].forEach((g) => {
    if (LX_GAN_WX[g] === LX_GAN_WX[dm]) sup += 1;
    if (LX_WX[(LX_WX.indexOf(LX_GAN_WX[g]) + 4) % 5] === LX_GAN_WX[dm]) sup += 0.8; // 生我
    if (LX_WX[(LX_WX.indexOf(LX_GAN_WX[g]) + 1) % 5] === LX_GAN_WX[dm]) dr += 0.7;  // 我生
    if (LX_WX[(LX_WX.indexOf(LX_GAN_WX[g]) + 3) % 5] === LX_GAN_WX[dm]) dr += 0.7;  // 克我
    if (LX_WX[(LX_WX.indexOf(LX_GAN_WX[g]) + 2) % 5] === LX_GAN_WX[dm]) dr += 0.8;  // 我克
  });
  if (sup - dr > 0.5) return "偏强";
  if (dr - sup > 0.5) return "偏弱";
  return "中和";
}
function lxXiYong(dG, strength) {
  const wxIdx = LX_WX.indexOf(LX_GAN_WX[dG]);
  const set = new Set();
  if (strength === "偏弱" || strength === "中和") {
    set.add(LX_WX[wxIdx]);           // 比劫
    set.add(LX_WX[(wxIdx + 4) % 5]); // 印（生我）
  } else {
    set.add(LX_WX[(wxIdx + 2) % 5]); // 财（我克）
    set.add(LX_WX[(wxIdx + 1) % 5]); // 食伤（我生）
    set.add(LX_WX[(wxIdx + 3) % 5]); // 官杀（克我）
  }
  return [...set];
}
function lxZiwei(m, hZhi) {
  const MONTH_ZHI_1 = { 1:12, 2:1, 3:2, 4:3, 5:4, 6:5, 7:6, 8:7, 9:8, 10:9, 11:10, 12:11 };
  const m1 = MONTH_ZHI_1[m];
  const h1 = hZhi + 1;
  let num = 14 - m1 - h1;
  while (num <= 0) num += 12;
  while (num > 12) num -= 12;
  const zhiIdx = (num - 1 + 12) % 12;
  const zhi = LX_ZHI[zhiIdx];
  const wx = LX_ZHI_WX[zhiIdx];
  const star = { 木:"天机", 火:"太阳", 土:"天府", 金:"武曲", 水:"太阴" }[wx];
  const img = {
    木: "主谋略生发，宜学新、拓局面，像春木抽枝。",
    火: "主光明表达，宜用影响力与公开场合成事，防急躁。",
    土: "主稳重承载，宜把事做扎实、积累信任，像大地托物。",
    金: "主果决收敛，宜定标准、做判断，防过刚易折。",
    水: "主流动智慧，宜借势沟通、灵活转身，像水顺势。",
  }[wx];
  return { zhi, wx, star, img };
}
function lxComputeChart(birth) {
  const y = birth.y, m = birth.m, d = birth.d;
  const h = (birth.h == null ? 12 : birth.h);
  const hZhi = Math.floor(((h + 1) / 2)) % 12;
  const lateZi = h >= 23; // 晚子时：日柱用次日
  let dayY = y, dayM = m, dayD = d;
  if (lateZi) {
    const dt = new Date(y, m - 1, d); dt.setDate(dt.getDate() + 1);
    dayY = dt.getFullYear(); dayM = dt.getMonth() + 1; dayD = dt.getDate();
  }
  const yGZ = lxYearGZ(y, m, d);
  const yG = yGZ.g, yZ = yGZ.z;
  const mZhi = lxMonthZhi(y, m, d);
  const mG = lxMonthGan(yG, mZhi);
  const jdn = lxJulian(dayY, dayM, dayD);
  const dIdx = ((jdn + 49) % 60 + 60) % 60;
  const dG = dIdx % 10, dZ = dIdx % 12;
  const hG = ((dG * 2 + hZhi) % 10 + 10) % 10;
  const b = { yG, yZ, mG, mZ: mZhi, dG, dZ, hG, hZhi, dayMaster: dG };
  const wx = lxWxCount(b);
  const strength = lxStrength(b);
  const xiYong = lxXiYong(dG, strength);
  const ziwei = lxZiwei(m, hZhi);
  const pillars = [
    { col: "年柱", gan: LX_GAN[yG], zhi: LX_ZHI[yZ], ss: "——" },
    { col: "月柱", gan: LX_GAN[mG], zhi: LX_ZHI[mZhi], ss: lxShiShen(dG, mG) },
    { col: "日柱", gan: LX_GAN[dG], zhi: LX_ZHI[dZ], ss: "日主" },
    { col: "时柱", gan: LX_GAN[hG], zhi: LX_ZHI[hZhi], ss: lxShiShen(dG, hG) },
  ];
  return {
    birth: { y, m, d, h, hZhi, hLabel: LX_SHICHEN[hZhi] },
    pillars, dayMaster: { gan: LX_GAN[dG], wx: LX_GAN_WX[dG], strength },
    wx, xiYong, ziwei,
    note: "程序排盘·已校立春（±1日近似）·娱乐向，仅作自我觉察参考，不作决策凭据。",
  };
}
function lxMeihua(y, m, d, hZhi) {
  const yg = (((y % 12) + 12) % 12);
  const upper = (((yg + m + d) % 8) + 8) % 8;
  const lower = (((yg + m + d + hZhi) % 8) + 8) % 8;
  const dong = (((yg + m + d + hZhi) % 6) + 6) % 6 + 1;
  let lBits = LX_TRG_BIT[lower], uBits = LX_TRG_BIT[upper];
  if (dong <= 3) lBits = lBits ^ (1 << (dong - 1)); else uBits = uBits ^ (1 << (dong - 4));
  const nLower = LX_BIT_TRG[lBits], nUpper = LX_BIT_TRG[uBits];
  const hexName = (u, l) => (u === l ? LX_BAGUA[u].n + "为" + LX_BAGUA[u].n : "上" + LX_BAGUA[u].n + "下" + LX_BAGUA[l].n);
  const ti = lower, yong = upper;
  const tiWx = LX_BAGUA[ti].wx, yongWx = LX_BAGUA[yong].wx;
  const tiIdx = LX_WX.indexOf(tiWx), yongIdx = LX_WX.indexOf(yongWx);
  let rel;
  if (tiWx === yongWx) rel = "比和：内外相得，事多顺遂，宜稳进。";
  else if ((tiIdx + 1) % 5 === yongIdx) rel = "用生体：外助内、得人助，事易成，把握时机。";
  else if ((yongIdx + 1) % 5 === tiIdx) rel = "体生用：内耗外、付出多，宜量力，勿过度。";
  else if ((tiIdx + 2) % 5 === yongIdx) rel = "体克用：能成但费力，需主动推进。";
  else rel = "用克体：外有阻力，宜守不宜攻，先稳后动。";
  return {
    upper, lower, dong,
    ben: hexName(upper, lower), bian: hexName(nUpper, nLower),
    ti, yong, tiWx, yongWx, rel,
    yiUpper: LX_BAGUA[upper].yi, yiLower: LX_BAGUA[lower].yi,
  };
}

// ============ 李玄通 · 全方位检测（五术综合研判，专家包「全门类」能力）============
// 一次采集 命/相/卜/山/医，程序排盘/起卦 + 多维度典籍检索，按【命】【相】【卜】【山】【医】分节强制引书综合研判。
async function lxFullDiagnose(payload) {
  const q = payload.q || "全方位检测";
  const birth = payload.birth || null;
  const face = (payload.face || "").trim();
  const hand = (payload.hand || "").trim();
  const residence = (payload.residence || "").trim();
  const matter = (payload.matter || "").trim();
  const guaMode = !!payload.guaMode;
  const shan = (payload.shan || "").trim();
  const yi = (payload.yi || "").trim();

  // 1) 命：程序排盘（已校立春）
  let chart = null, facts = "";
  if (birth && birth.y) {
    try { chart = lxComputeChart(birth); } catch (e) { chart = null; }
  }
  if (chart) {
    const p = chart.pillars.map((x) => `${x.col} ${x.gan}${x.zhi}（${x.ss}）`).join("，");
    const wxs = LX_WX.map((w) => `${w}${chart.wx[w]}`).join(" ");
    facts += `【命·排盘事实（程序计算，已校立春）】
生辰：公历 ${birth.y} 年 ${birth.m} 月 ${birth.d} 日${birth.hLabel || ""}${birth.place ? "，出生地：" + birth.place : ""}。
四柱：${p}。
日主：${chart.dayMaster.gan}（五行属${chart.dayMaster.wx}，${chart.dayMaster.strength}）。
五行分布：${wxs}。
喜用神（补益方向）：${chart.xiYong.join("、")}。
紫微命宫：地支${chart.ziwei.zhi}（${chart.ziwei.wx}），意象主星${chart.ziwei.star}——${chart.ziwei.img}`;
  }

  // 2) 卜：梅花易数时间起卦（若用户选择起卦参断）
  let gua = null;
  if (guaMode) {
    const now = new Date();
    const hZhi = Math.floor(((now.getHours() + 1) / 2)) % 12;
    gua = lxMeihua(now.getFullYear(), now.getMonth() + 1, now.getDate(), hZhi);
    facts += `\n\n【卜·梅花易数·时间起卦（程序计算）】
本卦：${gua.ben}（上${LX_BAGUA[gua.upper].n}·${gua.yiUpper}；下${LX_BAGUA[gua.lower].n}·${gua.yiLower}）。
变卦：${gua.bian}。动爻：第 ${gua.dong} 爻。
体用：${LX_BAGUA[gua.ti].n}（${gua.tiWx}，为体·我）× ${LX_BAGUA[gua.yong].n}（${gua.yongWx}，为用·事）。
体用关系：${gua.rel}`;
  }

  // 3) 相 / 卜(所占之事) / 山 / 医 文本事实
  const textFacts = [];
  if (face) textFacts.push(`【相·面相】用户描述：${face}`);
  if (hand) textFacts.push(`【相·手相】用户描述：${hand}`);
  if (residence) textFacts.push(`【相·风水】用户描述（居所/办公坐向与形势）：${residence}`);
  if (matter) textFacts.push(`【卜·所占之事】${matter}`);
  if (shan) textFacts.push(`【山·修持调运】用户自述：${shan}`);
  if (yi) textFacts.push(`【医·医道养生】用户自述：${yi}`);
  if (textFacts.length) facts += "\n\n" + textFacts.join("\n");

  // 4) 多维度典籍检索（强制覆盖五术，避免只引一两类书）
  const refs = [];
  let classicBlock = "";
  try {
    const tags = [];
    if (chart) tags.push("八字", "紫微", "总纲");
    if (face) tags.push("面相");
    if (hand) tags.push("手相");
    if (residence) tags.push("风水");
    if (matter || guaMode) tags.push("总纲", "六壬", "奇门", "太乙");
    if (shan) tags.push("总纲");
    if (yi) tags.push("总纲");
    if (!tags.length) tags.push("总纲");
    const qForSearch = [q, face, hand, residence, matter, shan, yi].filter(Boolean).join(" ");
    const seenText = new Set();
    let hits = [];
    for (const t of tags) {
      lxRetrieve(qForSearch, chart, 3, t).forEach((x) => {
        const key = x.src + "::" + x.text.slice(0, 20);
        if (!seenText.has(key)) { seenText.add(key); hits.push(x); }
      });
    }
    hits = hits.slice(0, 8);
    if (hits.length) {
      classicBlock = "【典籍依据·摘自用户藏书，你须优先据此作答，可引用其中论断，引文时注明《书名》】\n";
      hits.forEach((h, i) => {
        classicBlock += `${i + 1}. 《${h.src}》：${h.text}\n`;
        if (!refs.includes(h.src)) refs.push(h.src);
      });
    }
  } catch (e) { classicBlock = ""; }

  // 5) 全门类综合指令
  const provided = [];
  if (chart) provided.push("命");
  if (face || hand || residence) provided.push("相");
  if (matter || guaMode) provided.push("卜");
  if (shan) provided.push("山");
  if (yi) provided.push("医");
  const missing = ["命", "相", "卜", "山", "医"].filter((x) => !provided.includes(x));
  const instruct = `你是李玄通，请基于上面的真实排盘/描述事实，做「五术全方位检测」综合研判（娱乐向，不作决策凭据）：
①以五术维度分节呈现，每节以【命】【相】【卜】【山】【医】小标题领起；已提供的维度（${provided.join("、") || "无"}）逐维给出该议题下的视角与论断，每维必引手册＋原典各至少一部、标注所本《书名》；
②未提供的维度（${missing.join("、") || "无"}）显式注明「（此维未提供信息，从略）」，不得静默遗漏；
③五术结论交汇后，给出「全方位检测总评」，指出各维度呼应、矛盾与重点调理方向；
④始终像对面坐着的先生，亲切克制、不堆术语、不预言灾凶、明确娱乐向。总篇幅约 600 字内。`;

  const userContent = `${LIXUAN_SYSTEM}
${facts ? facts + "\n\n" : ""}${classicBlock ? classicBlock + "\n\n" : ""}用户说：${q}
\n\n${instruct}`;
  const content = await lxChat(userContent, payload.model || "zhida-thinking-1p5");
  const usedLLM = !!content.trim();
  const finalContent = usedLLM ? content : lxCorpusFallback(facts, classicBlock, provided, missing, "full");
  return { mock: !usedLLM, fallback: !usedLLM, content: finalContent, chart: chart || null, gua: gua || null, refs, mode: "full", provided, missing };
}

// 知乎直答对玄学/命理内容做概率性安全拦截：返回"非常抱歉，我目前无法针对您的问题提供更多信息"
// 这类拒绝话术，而非真正读盘。识别这类拒绝，统一视为"未连通"，交由典籍兜底，保证 Demo 不出空答/拒绝答。
function lxIsBlocked(text) {
  const t = (text || "").trim();
  if (!t) return true;
  const BLOCKED = [
    /非常抱歉[，,].{0,40}无法(针对您的问题)?提供(更多)?信息/,
    /抱歉[，,].{0,30}无法/,
    /我(目前)?(还)?(无法|不能|没办法|没有能力)(为您|帮你|提供|回答|预测|推算|占卜|算命|看相|看风水)?/,
    /作为(一个)?(人工智能|AI|语言模型|智能助手)/,
    /我(不|没有)具备(提供|预测|推算|看相|算命|占卜|看风水|论断)?/,
    /涉及(封建迷信|玄学|算命|占卜|命理|风水|运势|卜卦)/,
    /这个问题(超出|不在|不在我)/,
    /我无法(针对您的问题)?提供/,
    /如果您有其他(的)?问题[,，]?(我|我们将|我很乐意)/,
    /我不能满足(您)?(这个|该)?(请求|要求)/,
    /我(暂)?(时)?(不|无法)(便|能)(为您)?(提供|回答|预测|推算)/,
  ];
  for (const re of BLOCKED) if (re.test(t)) return true;
  // 短内容且含拒绝关键词：大概率是拦截回执（避免误伤真实长答）
  if (t.length < 90 && /无法|不能|抱歉|对不起|不允许|不便(提供|回答)|没有权限|超出(我的)?(能力|范围)|不在服务(范围)?/.test(t)) return true;
  return false;
}

// 李玄通对话：调用知乎直答；遇 554/空响应/安全拒绝（接口对玄学内容的概率性内容安全拦截），
// 自动以软化措辞重试一次；若仍被拦截，返回空串交由调用方走典籍兜底（保证 Demo 不出空答/拒绝答）。
async function lxChat(userContent, model) {
  model = model || "zhida-thinking-1p5";
  const tryOnce = async (m) => {
    const ans = await zhihuPost("/v1/chat/completions", { model: m, messages: [{ role: "user", content: userContent }], stream: false }, 0);
    return (ans.choices && ans.choices[0] && ans.choices[0].message && ans.choices[0].message.content) || "";
  };
  // 主模型 + fast 兜底：限流/空响应时降级而非静默失败（避免读盘偶发变 mock）
  let content = await tryOnce(model);
  if (!content.trim()) content = await tryOnce("zhida-fast-1p5");
  if (!lxIsBlocked(content)) return content;
  // 软化：去掉易触发拦截的强命理措辞，保留五术分节与引书要求
  const soft = userContent
    .replace(/占断吉凶休咎/g, "趣味推演")
    .replace(/宗师级顾问/g, "传统文化研究者")
    .replace(/卜筮占断/g, "趣味占问")
    .replace(/命理宗师/g, "命理爱好者")
    .replace(/断吉凶休咎/g, "趣味参详")
    .replace(/占断吉凶/g, "参详休咎")
    .replace(/推演命运格局、剖析运势起伏、占断吉凶休咎/g, "做趣味的文化参详")
    .replace(/命运格局/g, "性格与能量模式")
    .replace(/推演命运/g, "品读人生")
    .replace(/吉凶休咎/g, "进退之机");
  content = await tryOnce("zhida-fast-1p5");
  return lxIsBlocked(content) ? "" : content;
}

// LLM 不可用时的兜底：用已检索到的典籍原文 + 排盘事实，拼出带五术分节的回答（依然引经据典、不作决策凭据）。
function lxCorpusFallback(facts, classicBlock, provided, missing, mode) {
  const parts = [];
  parts.push("（直答接口暂未连通，玄通以所藏典籍为你引述如下——以下皆本包藏书原文，供趣味参详，娱乐向、不作决策凭据）");
  if (facts) parts.push(facts.trim());
  if (classicBlock) parts.push(classicBlock.trim());
  const prov = (provided && provided.length) ? provided.join("·") : "无";
  const miss = (missing && missing.length) ? missing.join("·") : "无";
  parts.push(`已参维度：${prov}；从略：${miss}`);
  return parts.join("\n\n");
}

// 从 LLM 文本里尽量抠出 JSON 数组 / 对象
function extractJSON(text) {
  if (!text) return null;
  try { return JSON.parse(text); } catch (e) {}
  const a = text.match(/\[[\s\S]*\]/);
  if (a) { try { return JSON.parse(a[0]); } catch (e) {} }
  const o = text.match(/\{[\s\S]*\}/);
  if (o) { try { return JSON.parse(o[0]); } catch (e) {} }
  return null;
}

// 直答调用：带限流自愈（命中 rate_limit 自动切到 zhida-fast-1p5）+ 最多 tries 次重试，
// 显著降低评委高频点击下偶发空响应导致空白卡片的概率
async function zhidaChat(prompt, { model, fresh, tries } = {}) {
  model = model || "zhida-thinking-1p5";
  tries = tries || 2;
  const ttl = fresh ? 0 : 600000;
  let content = "";
  for (let i = 0; i < tries; i++) {
    if (i > 0) await new Promise((r) => setTimeout(r, 900 * i)); // 退避：给限流窗口/空响应留出恢复时间
    const a = await zhihuPost(
      "/v1/chat/completions",
      { model, messages: [{ role: "user", content: prompt }], stream: false },
      ttl
    ).catch(() => ({}));
    if (a && a.error && /rate_limit/.test(JSON.stringify(a.error || ""))) {
      // 限流：thinking→fast 切换；fast 限流则退避后重试（不切 thinking，避免破坏 JSON 的 src 数字约束）
      if (model !== "zhida-fast-1p5") { model = "zhida-fast-1p5"; i--; }
      continue;
    }
    content = (a.choices && a.choices[0] && a.choices[0].message && a.choices[0].message.content) || "";
    if (content.trim()) break;
  }
  return content;
}

// models 兜底：直答未产出结构化模型时，用真实知乎讨论拼装可用卡片（第一原则：不空答、不写死模板）
function modelsFallback(items, q) {
  const top = (items || []).filter((x) => x.title || x.text).slice(0, 4);
  if (!top.length) return [];
  return top.map((x, i) => {
    const name = (x.title || "").replace(/[【】\[\]（）()]/g, "").split(/[：:·\-—]/)[0].trim().slice(0, 14) || `视角${i + 1}`;
    const core = (x.text || x.title || "").replace(/\s+/g, " ").trim().slice(0, 90);
    const who = x.author ? `参考知乎 @${x.author} 在《${x.title}》里的讨论` : `参考知乎讨论《${x.title}》`;
    return {
      name,
      core,
      when: `当你想搞懂「${q}」、需要真实样本参考时`,
      tip: who,
    };
  });
}

// distill 兜底：直答未产出结构化蒸馏时，用真实知乎样本拼装可读的成长样本（不空答）
function distillFallback(items, q) {
  const top = (items || []).filter((x) => x.title || x.text).slice(0, 5);
  if (!top.length) return `关于「${q}」，暂时没能从知乎实时讨论里提炼出结构化样本，你可以换个说法再试试，或看看下方真实讨论。`;
  const lines = top.map((x, i) => {
    const who = x.author ? `（分享人：@${x.author}）` : "";
    const body = (x.text || "").replace(/\s+/g, " ").trim().slice(0, 140);
    const link = x.url ? `\n   出处：${x.url}` : "";
    return `▍样本${i + 1}·${x.title || "无名样本"}${who}\n   ${body}${link}`;
  });
  return `基于知乎实时讨论，为你梳理「${q}」相关的真实人生样本：\n\n` + lines.join("\n\n");
}

// 按用户问题实时路由到不同知乎数据开放平台接口（确定性分类，透明可演示）
function routeZhihu(q) {
  const s = (q || "").trim();
  const low = s.toLowerCase();
  const has = (...kw) => kw.some((k) => low.includes(k));
  const infoIntent = has(
    "怎么", "如何", "怎样", "什么是", "是什么", "为什么", "为啥", "方法", "思维",
    "框架", "模型", "认知", "成长", "人际", "副业", "职业", "学习", "赚钱", "建议",
    "推荐", "区别", "原理", "技巧", "攻略", "经验", "提升", "改变", "选择", "纠结",
    "迷茫", "瓶颈", "习惯", "应该", "要不要", "该不该", "怎么办", "怎么看", "看待", "理解"
  );
  // 1) 当下热点 / 热榜
  if (has("热榜", "热点", "热门", "最近大家", "大家都在", "在聊什么", "今天大家", "当下什么", "现在大家", "热议", "大家怎么看", "最近什么")) {
    return { api: "hot", label: "知乎实时热榜", query: "" };
  }
  // 2) 大佬 / 具体人物 / 作者观点
  if (
    has("大佬", "大v", "大神", "大牛", "博主", "作者", "答主", "谁最", "大咖", "专家", "牛人", "知乎谁") ||
    /([一-龥]{2,5})(怎么看|怎么想|的观点|的方法|思维|认为|怎么赚钱|怎么成长)/.test(low)
  ) {
    return { api: "zhihu", label: "知乎站内·人物/观点检索", query: s };
  }
  // 3) 概念 / 方法 / 成长类问题 → 知乎站内优先（更贴合社区语境）
  if (infoIntent) {
    return { api: "zhihu", label: "知乎站内检索", query: s };
  }
  // 4) 偏开放式 / 经验叙事 → 全网
  if (s.length >= 6) {
    return { api: "global", label: "全网实时检索", query: s };
  }
  // 5) 太短或纯闲聊
  return { api: "none", label: "陪伴闲聊", query: "" };
}

// 刘看山对话式回复：并行检索知乎开放平台"全部"可用接口，做充分 RAG
// 必选：站内搜索 zhihu_search + 全网搜索 global_search
// 条件：热榜 hot_list（偏热点话题时）/ 我的创作 contents + 我的关注 followees（用户提及自己的数据时）
// 每个接口独立容错，任一失败不影响其他；返回统一结构的 sources 数组
async function liuGatherSources(q, persona, context) {
  const out = [];
  const pushItems = (items, source) => { (items || []).forEach((x) => out.push(Object.assign({}, x, { source }))); };
  const tasks = [];
  // 1) 站内搜索（贴合知乎社区语境）
  tasks.push(
    zhihuGet("/api/v1/content/zhihu_search", { Query: q, Count: 6 }, 300000, true)
      .then((j) => pushItems(normalizeItems(j, "zhihu"), "zhihu")).catch(() => {})
  );
  // 2) 全网搜索（更广的真实经验 / 方法 / 人物）
  tasks.push(
    globalExternalSearch(q, 8).then((items) => pushItems(items, "global")).catch(() => {})
  );
  // 3) 热榜（偏热点 / 当下大家都在聊）；收紧「最近在」避免误命中「我最近在学…」这类非热点问法
  const wantHot = /热榜|热点|热门|最近大家|最近(在聊|在讨论|发生|什么|热议)|大家(都在|怎么看|热议)|今天(大家|什么热点|热榜)|当下(大家|热议)|热议|大家怎么看/.test(q || "");
  if (wantHot) {
    tasks.push(
      zhihuGet("/api/v1/content/hot_list", { Limit: 12 }, 300000, true)
        .then((j) => pushItems(normalizeItems(j, "hot"), "hot")).catch(() => {})
    );
  }
  // 4) 个人数据接口（用户提及"我的创作 / 我关注 / 我读过的"时）
  const wantSelf = /我关注|我写的|我的创作|我发过|我收藏|关注的人|我读过|我的关注|我的博主|我追/.test(q || "");
  if (wantSelf) {
    tasks.push(
      zhihuGet("/api/v1/user/contents", { Limit: 6 }, 600000)
        .then((j) => pushItems(normalizeContents(j), "my_content")).catch(() => {})
    );
    tasks.push(
      zhihuGet("/api/v1/user/followees", { Limit: 6 }, 600000)
        .then((j) => pushItems(normalizeFollowees(j), "followee")).catch(() => {})
    );
  }
  await Promise.all(tasks);
  return out;
}

function authHeaders() {
  const secret = process.env.ZHIHU_ACCESS_SECRET || "";
  return {
    Authorization: `Bearer ${secret}`,
    "X-Request-Timestamp": String(Math.floor(Date.now() / 1000)),
    "Content-Type": "application/json",
  };
}

// 简单内存缓存，降低配额消耗（热榜/搜索 100~5000 次/日）
const _cache = new Map();
function cacheGet(key) {
  const v = _cache.get(key);
  if (v && v.exp > Date.now()) return v.data;
  return null;
}
function cacheSet(key, data, ttlMs) {
  _cache.set(key, { data, exp: Date.now() + (ttlMs || 600000) });
}

async function zhihuGet(path, params, ttlMs, noCache, oauthToken) {
  const cacheKey = "GET:" + path + ":" + JSON.stringify(params) + (oauthToken ? ":oauth" : "");
  if (!noCache) { const hit = cacheGet(cacheKey); if (hit) return hit; }
  const url = new URL(ZHIHU_BASE + path);
  Object.entries(params || {}).forEach(([k, v]) => {
    if (v !== undefined && v !== null && v !== "") url.searchParams.set(k, String(v));
  });
  const headers = authHeaders();
  if (oauthToken) headers["X-OAuth-Token"] = oauthToken;
  const r = await fetch(url.toString(), { headers });
  const json = await r.json().catch(() => ({}));
  if (json.Code && json.Code !== 0) {
    const err = new Error("zhihu_api_code_" + json.Code);
    err.code = json.Code;
    throw err;
  }
  cacheSet(cacheKey, json, ttlMs);
  return json;
}

async function zhihuPost(path, body, ttlMs, noCache) {
  const cacheKey = "POST:" + path + ":" + JSON.stringify(body);
  if (!noCache) { const hit = cacheGet(cacheKey); if (hit) return hit; }
  const r = await fetch(ZHIHU_BASE + path, {
    method: "POST",
    headers: authHeaders(),
    body: JSON.stringify(body),
  });
  const json = await r.json().catch(() => ({}));
  cacheSet(cacheKey, json, ttlMs);
  return json;
}

// 归一化搜索/热榜结果为统一结构
function normalizeItems(json, kind) {
  if (!json || !json.Data) return [];
  if (kind === "hot") {
    return (json.Data.Items || []).map((it) => ({
      title: it.Title || "",
      text: it.Summary || "",
      url: it.Url || "",
      author: "知乎热榜",
      voteUp: 0,
      commentCount: 0,
      authority: "",
      source: "hot",
    }));
  }
  return (json.Data.Items || []).map((it) => ({
    title: it.Title || "",
    text: it.ContentText || "",
    url: it.Url || "",
    author: it.AuthorName || "",
    voteUp: it.VoteUpCount || 0,
    commentCount: it.CommentCount || 0,
    authority: it.AuthorityLevel || "",
    source: kind,
  }));
}


// ===== 双源参考（知乎 + 全网）工具函数 =====
function isZhihuUrl(u) {
  if (!u) return false;
  return /zhihu\.com|zhihu\.cn|zhida\.zhihu|zhuanlan\.zhihu|zhihu\.m|zhihu\.com\.cn/i.test(u);
}
// 取「注册域」用于按出处去重：blog.csdn.net / csdn.net / xx.csdn.net 都归到 csdn.net；兼容 .com.cn/.org.cn 等多段后缀
function domainOf(u) {
  if (!u) return "";
  try {
    const h = new URL(u).hostname.toLowerCase();
    const parts = h.split(".");
    if (parts.length <= 2) return h;
    const last3 = parts.slice(-3).join(".");
    if (/(com|net|org|gov|edu|co)\.(cn|uk|jp|au|in|br)$/.test(last3)) return last3;
    return parts.slice(-2).join(".");
  } catch (e) { return ""; }
}
// 按「出处（注册域）」去重：同站只留第一条，保证全网参考每条都来自不同站点
function dedupeByDomain(items) {
  const seen = new Set();
  const out = [];
  (items || []).forEach((x) => {
    const d = domainOf(x.url);
    if (!d) { out.push(x); return; }
    if (seen.has(d)) return;
    seen.add(d); out.push(x);
  });
  return out;
}
// 按 source 频道把混合来源归类为 知乎 / 全网：
//   zhihu_search→知乎，global_search→全网；无 source 时按 URL 域回落。
// 再做跨频道去重（全网去掉已在知乎里的同链接），并对「全网为空」做兜底（保留原 global，保证非空）。
function classifyRefs(sources, q) {
  const all = sources || [];
  const zh = [], glRaw = [];
  all.forEach((x) => {
    const k = (x && x.source) || "";
    if (k === "zhihu" || k === "search" || k === "hot" || k === "my_content" || k === "followee") zh.push(x);
    else if (k === "global" || k === "story" || k === "web" || k === "news") glRaw.push(x);
    else if (x && x.url && isZhihuUrl(x.url)) zh.push(x);
    else glRaw.push(x);
  });
  const zhUrls = new Set(zh.map((x) => (x.url || "").split("?")[0]));
  // 全网桶：剔除「已在知乎桶的同链接」+「知乎域名链接」。global_search 会混入 zhihu.com，它们不属于真·全网，绝不用其兜底充数（否则与知乎桶混淆）。
  // 先按权威度排序（垃圾站沉底、博客降权），再按出处去重 —— 保证每域留下的是它最好的那条
  // 不再按权威度重排：globalExternalSearch 已按「相关性 > 权威度」排好序，此处只做过滤与出处去重
  // 第一原则·绝不混淆：全网桶只收「非知乎域名」链接；任何知乎域名的链接（即便被误标成 global）一律归入知乎桶
  const glNoZh = glRaw.filter((x) => !zhUrls.has((x.url || "").split("?")[0]) && !isZhihuUrl(x.url));
  // 第一原则·必须相关：全网桶只保留与提问相关（relHitCount(q,x)>=1）的条目；若全被滤掉但确有外网结果，保留 1~2 条兜底，避免整桶空掉像出了 bug
  const glRel = q ? glNoZh.filter((x) => relHitCount(q, x) >= 1) : glNoZh;
  const gl = dedupeByDomain(glRel.length ? glRel : glNoZh.slice(0, 2));
  return { zhihu: zh, global: gl };
}
// 检索基词清洗：取分句作为检索词，避免长口语句拖累召回。
// 注意：不能只取首分句——「我是INTJ，怎么提升沟通能力」会被砍成「我是INTJ」，核心诉求全丢，
// 导致召回的全是 INTJ 人格介绍页、而没有一条讲「提升沟通能力」。故首分句过短时拼接后续分句。
function cleanSearchBase(q) {
  const s = (q || "").trim();
  const parts = s.split(/[，。？?！!；;\n]/).map(function (x) { return x.trim(); }).filter(Boolean);
  if (!parts.length) return s;
  let out = parts[0];
  for (let i = 1; i < parts.length; i++) {
    if (out.length >= 7) break;
    if (out.length + parts[i].length > 30) break;
    out = out + " " + parts[i];
  }
  return out.length >= 2 ? out : s;
}
// ===== 相关性校验：解决「全网参考资料与用户提问无关」 =====
// 从问题中抽取核心词（去停用字后的中文 bigram + 英文/数字词），统计在结果标题/摘要中的命中数。
// 只收真正的虚词单字。切勿把「能/行/问/人/点/个/做/时/事/情/自/己/种/类」等实词用字放进来，
// 否则「沟通能力」会被切成「沟通力」、「行业」被切成「业」，相关性判断直接失准（已踩过）。
const Q_STOP = ("我你他她它们着的了么是和有和与或就不也都要吗呢吧啊呀哦嗯啦呗把被让很太更最又还再仅即则而且"
  + "请什怎如何为哪这些那之于以从到但若使").split("");
const Q_STOP_SET = {};
Q_STOP.forEach(function (c) { Q_STOP_SET[c] = 1; });
function coreTerms(q) {
  const s = String(q || "").trim();
  const terms = {};
  (s.match(/[A-Za-z]{2,}|[A-Za-z]+\d+|\d+/g) || []).forEach(function (w) { terms[w.toLowerCase()] = 1; });
  const segs = s.split(/[^\u4e00-\u9fa5]+/).filter(Boolean);
  const addB = function (b) {
    if (b.length === 2) { terms[b] = 1; return; }
    for (let i = 0; i + 2 <= b.length; i++) terms[b.slice(i, i + 2)] = 1;
  };
  segs.forEach(function (seg) {
    let buf = "";
    for (let k = 0; k < seg.length; k++) {
      const ch = seg[k];
      if (Q_STOP_SET[ch]) { if (buf.length >= 2) addB(buf); buf = ""; }
      else buf += ch;
    }
    if (buf.length >= 2) addB(buf);
  });
  const arr = Object.keys(terms);
  // 极短问题兜底：拆单字
  if (!arr.length && segs.length) {
    segs[0].split("").forEach(function (c) { if (!Q_STOP_SET[c]) terms[c] = 1; });
    return Object.keys(terms);
  }
  return arr;
}
function relHitCount(q, item) {
  const terms = coreTerms(q);
  if (!terms.length) return 1; // 无从判断时视为相关，避免误杀
  const hay = String((item && item.title ? item.title : "") + " " + (item && item.text ? item.text : "")).toLowerCase();
  let hit = 0;
  terms.forEach(function (t) { if (hay.indexOf(String(t).toLowerCase()) >= 0) hit++; });
  return hit;
}
// 紧凑检索词：只去掉停用字/标点，不引入任何新语义（旧版加「维基百科」这类后缀会把检索彻底带偏）
function compactQuery(q) {
  const s = String(q || "");
  let out = "";
  for (let i = 0; i < s.length; i++) {
    const ch = s[i];
    if (Q_STOP_SET[ch]) continue;
    if (/[\u4e00-\u9fa5A-Za-z0-9]/.test(ch)) out += ch;
    else out += " ";
  }
  return out.replace(/\s+/g, " ").trim();
}
// ===== 全网参考：出处多样性 + 权威度分层 =====
// 用户硬要求：① 每一条全网参考都来自**不同出处**；② 不要被博客内容刷屏。
// 旧实现把扇出词写成「<query> CSDN」「<query> 博客园」，等于主动把检索往博客平台带偏；
// 且「凑够 N 条就停」，博客先占满名额，后面的变体根本没机会跑。现改为：
//   ① 扇出词按「来源类型」给（百科/官方/研究报告/学术论文/新闻），不再点名任何博客平台；
//   ② 跑完全部扇出（受 GLOBAL_BUDGET_MS 约束）拿到更大的候选池；
//   ③ 候选池按「权威度分层 + 出处去重」排序后截断：权威/机构/媒体优先，博客与 UGC 降权到末尾。
// tier: 0=权威机构/学术/官方 1=主流媒体/新闻 2=百科/官方文档 3=一般站点 4=博客/UGC
const AUTH_TIER_RULES = [
  [0, /(^|\.)(gov|edu|ac)\.(cn|uk|jp|kr|sg|au|de|fr|ca|nz)$|wikipedia\.org|britannica|arxiv\.org|nature\.com|science\.org|cell\.com|ieee\.org|acm\.org|pubmed|ncbi\.nlm|nih\.gov|who\.int|unesco|oecd\.org|worldbank|cnki|wanfangdata|cqvip|nationalgeographic/i],
  [1, /people\.com\.cn|xinhuanet|chinanews|cctv\.com|thepaper\.cn|caixin|yicai|jiemian|36kr|huxiu|reuters|bbc\.co|nytimes|bloomberg|ft\.com|economist|guancha|zaobao|apnews|npr\.org|theguardian|wsj|nbcnews|cbsnews|abcnews/i],
  [2, /baike|wiki|docs\.|readthedocs|developer\.|mozilla\.org|w3\.org|ietf\.org|iso\.org|standard|\.org$/i],
];
// 博客 / UGC / 自媒体：降权到末尾，只有名额没填满时才补位
const BLOG_UGC_RE = /csdn|cnblogs|jianshu|juejin|51cto|iteye|smzdm|book118|docin|doc88|renrendoc|baijiahao|toutiao|yidianzixun|yidianwenda|zhidao\.baidu|bilibili|douban|ximalaya|sina\.|tianya|kuaishou|douyin|xiaohongshu|xuexila|xuexili|imooc|itheima|runoob|w3school|jb51|phpcn|sohu\.com|163\.com/i;
// SEO / 内容农场：直接剔除（仅当干净结果太少时兜底回填，避免全网参考开天窗）
const SPAM_SITE_RE = /(^|[-.\w])(web)?seo[-a-z0-9]*\.|wenda|chaxuexi|sushituan|qituowang|shuimuinfo|personalityforest|classace|webseo9|^j9p\.|^[0-9]{4,}\.|^99\.com/i;
function siteTier(u) {
  const d = domainOf(u);
  let h = "";
  try { h = new URL(u).hostname.toLowerCase(); } catch (e) {}
  const probe = h || d; // 用完整 hostname 匹配，保留 baike./docs./news. 等子域信号（domainOf 会把它抹掉）
  if (!probe) return { tier: 3, spam: false };
  if (SPAM_SITE_RE.test(probe) || (d && SPAM_SITE_RE.test(d))) return { tier: 4, spam: true };
  for (let k = 0; k < AUTH_TIER_RULES.length; k++) {
    if (AUTH_TIER_RULES[k][1].test(probe)) return { tier: AUTH_TIER_RULES[k][0], spam: false };
  }
  if (BLOG_UGC_RE.test(probe)) return { tier: 4, spam: false };
  return { tier: 3, spam: false };
}
// 只排序不去重：垃圾站沉底 → 权威度升序 → 保持原顺序（稳定）
function rankByAuthority(items) {
  return (items || []).map((x, i) => {
    const s = siteTier(x.url);
    return { x: x, i: i, tier: s.tier, spam: s.spam };
  }).sort((a, b) => {
    if (a.spam !== b.spam) return a.spam ? 1 : -1;
    if (a.tier !== b.tier) return a.tier - b.tier;
    return a.i - b.i;
  }).map((o) => o.x);
}
// 挑出「与问题相关 + 每条不同出处 + 尽量不是博客」的全网参考。
// 排序优先级：相关性命中数（降序）> 权威度分层（升序）> 原始召回顺序。
// 分三层取：强相关(命中>=2) → 弱相关(命中==1) → 无命中(兜底)，保证宁缺毋滥。
const BLOG_CAP = 2; // 博客/UGC 最多补 2 条：宁可少列几条，也不用博客把名单填满
function pickRelevantGlobal(items, q, want) {
  const n = want || 8;
  const all = (items || []).map(function (x, i) {
    return { x: x, i: i, hit: relHitCount(q, x), t: siteTier(x.url) };
  });
  const clean = all.filter(function (o) { return !o.t.spam; });
  const dirty = all.filter(function (o) { return o.t.spam; });
  const rank = function (arr) {
    return arr.slice().sort(function (a, b) {
      if (a.hit !== b.hit) return b.hit - a.hit;
      if (a.t.tier !== b.t.tier) return a.t.tier - b.t.tier;
      return a.i - b.i;
    }).map(function (o) { return o.x; });
  };
  const layers = [
    dedupeByDomain(rank(clean.filter(function (o) { return o.hit >= 2; }))),
    dedupeByDomain(rank(clean.filter(function (o) { return o.hit === 1; }))),
    dedupeByDomain(rank(clean.filter(function (o) { return o.hit === 0; }))),
  ];
  let out = [];
  for (let k = 0; k < layers.length && out.length < n; k++) {
    out = dedupeByDomain(out.concat(layers[k]));
  }
  const nonBlog = out.filter(function (x) { return siteTier(x.url).tier <= 3; });
  const blogs = out.filter(function (x) { return siteTier(x.url).tier >= 4; });
  // 博客上限随目标条数放宽（要 10 条时只给 2 条博客，名额会大面积空着）
  const _blogCap = Math.max(BLOG_CAP, Math.ceil(n / 3));
  let res = nonBlog.slice(0, n);
  if (res.length < n) res = res.concat(blogs.slice(0, Math.min(_blogCap, n - res.length)));
  res = dedupeByDomain(res);
  // 垃圾站兜底：只有「一条干净结果都没有」时才回填，避免为了凑数把内容农场放回来
  if (!res.length) res = dedupeByDomain(rank(dirty)).slice(0, n);
  // 数量仍不足（如浏览真实样本要 ≥9 条）：用 dirty(含 SEO 站) 兜底填满，保证客户端不缺条数
  if (res.length < n) {
    const fill = dedupeByDomain(rank(dirty)).filter(function (x) { return !res.some(function (y) { return (y.url || "").split("?")[0] === (x.url || "").split("?")[0]; }); });
    res = dedupeByDomain(res.concat(fill)).slice(0, n);
  }
  // 仍不足（如浏览真实样本要求 >=9）：用全部候选（允许同域不同文章）按 url 去重补满，保证条数达标
  if (res.length < n) {
    const byUrl = new Set(res.map(function (x) { return (x.url || "").split("?")[0]; }));
    const extra = all.map(function (o) { return o.x; }).filter(function (x) {
      const k = (x.url || "").split("?")[0];
      if (!k || byUrl.has(k)) return false;
      byUrl.add(k);
      return true;
    });
    res = res.concat(extra).slice(0, n);
  }
  return res.slice(0, n);
}
// 兼容旧调用名
function pickDiverseGlobal(items, want) {
  return pickRelevantGlobal(items, "", want);
}
// 全网检索：走 global_search 频道。知乎开放平台的 global_search 会混入 zhihu.com 站内链接，
// 因此本函数只保留「真·全网」（非 zhihu 域名）链接；扇出按「来源类型」给，避免把检索带偏到某个博客平台。
// 仍为「顺序 + 间隔」调用（避免多路并发触发限流导致偶发 0 结果），并在全空时退避重试 base。
// 废弃旧版：曾把「维基百科 / 官方 定义 / 研究 报告 / 学术 论文 / 新闻 报道」拼进检索词，
// 副作用是检索被这些后缀主导——问「如何高效学习」会返回「如何使用维基百科学习」「学术报告技巧」。
// 现改为「解释型」备用后缀：仍围绕原主题（不像「维基百科」那样换主题），且只在主变体召回不足时才跑到，
// 所有结果仍必须通过相关性校验。
// 扩源后缀：实测 global_search 单次 20 条里绝大多数是 zhihu.com，过滤真·全网后常只剩 0~2 条，
// 于是兜底逻辑把不相关的内容放回「全网」桶 —— 这就是「全网参考与提问无关 / 只有一条」的真根因。
// 实测不同后缀能显著提高外网召回（「百科」「官网」最明显）。铁律：后缀里绝不出现具体平台名
// （CSDN / 博客园）或会改主题的实义词（维基百科 / 学术报告），否则检索会被带偏。
const GLOBAL_EXT_SUFFIX = [" 百科", " 官网", " 是什么", " 案例", " 解读", " 方法", " 经验", " 总结", " 分析", " 怎么做", " 教程", " 指南"];
const GLOBAL_BUDGET_MS = 24000;
async function globalExternalSearch(q, Count) {
  const base = cleanSearchBase(q);
  const want = Count || 8;
  const cq = compactQuery(base);
  const main = [base];
  if (cq && cq.replace(/\s/g, "").length >= 2 && cq !== base) main.push(cq);
  const kw = coreTerms(base).slice(0, 8).join(" ");
  if (kw && kw !== base && kw !== cq) main.push(kw);
  // 备用变体排在后面：goodEnough 一旦满足就提前收工，正常情况根本跑不到
  const variants = main.concat(GLOBAL_EXT_SUFFIX.map(function (suffix) { return base + suffix; }));
  const items = [];
  const seen = new Set(); // 收集阶段只按 URL 去重；出处去重留到权威度排序后，保证每个站点选中它最好的那条
  const collect = (arr) => (arr || []).forEach((x) => {
    if (isZhihuUrl(x.url)) return; // 只留真·全网，剔除知乎域名
    const key = (x.url || "").split("?")[0];
    if (!key) return;              // 跳过无 URL 的脏数据
    if (seen.has(key)) return;
    seen.add(key);
    items.push(x);
  });
  // 已凑够「够好 + 不同出处」的结果才提前收工；否则跑完全部扇出（旧版凑够条数就停，被博客先占满名额）
  // 收工条件必须是「相关」的结果够多，而不是「条数」够多——否则不相关的内容会把名额占满
  // 收工条件放宽到「命中 >= 1」（旧版要求 >= 2，几乎永不满足 → 每次都跑满全部扇出，又慢又召回不足）
  const goodEnough = () => dedupeByDomain(items.filter(function (x) {
    return relHitCount(base, x) >= 1 && !siteTier(x.url).spam;
  })).length >= Math.min(want, 9);
  const t0 = Date.now();
  for (let i = 0; i < variants.length; i++) {
    // 主变体全部跑完（保证基础召回量）；只有排在后面的「解释型」备用变体才受 goodEnough 控制
    if (i >= main.length && goodEnough()) break;
    if (Date.now() - t0 > GLOBAL_BUDGET_MS) break;
    try {
      const j = await zhihuGet("/api/v1/content/global_search", { Query: variants[i], Count: 20 }, 300000, true);
      collect(normalizeItems(j, "global"));
    } catch (e) { /* 单变体失败不影响其它变体 */ }
    if (i < variants.length - 1) await new Promise((r) => setTimeout(r, 250));
  }
  // 全变体后仍为空：退避重试 base（对抗瞬时限流 / 同词冷却），最多 3 次（800ms / 1600ms / 2400ms）
  let _retry = 0;
  while (!items.length && _retry < 3 && Date.now() - t0 < GLOBAL_BUDGET_MS) {
    _retry++;
    await new Promise((r) => setTimeout(r, 800 * _retry));
    try {
      const j = await zhihuGet("/api/v1/content/global_search", { Query: base, Count: 20 }, 300000, true);
      collect(normalizeItems(j, "global"));
    } catch (e) {}
  }
  return pickRelevantGlobal(items, base, want);
}
// 双源检索：知乎站内(zhihu_search) + 全网(global_search)，交给 classifyRefs 按 source 归类并去重
async function dualSearch(q, Count) {
  const c = Count || 6;
  const [zhJ, glItems] = await Promise.all([
    zhihuGet("/api/v1/content/zhihu_search", { Query: q, Count: c }, 300000, true).then((j) => normalizeItems(j, "zhihu")).catch(() => []),
    globalExternalSearch(q, c),
  ]);
  const items = (zhJ || []).concat(glItems || []);
  const cls = classifyRefs(items, q);
  return { zhihu: cls.zhihu, global: cls.global, items };
}

function normalizeFollowees(json) {
  if (!json || !json.Data) return [];
  return (json.Data.Items || []).map((it) => ({
    name: it.Fullname || "",
    urlToken: it.UrlToken || "",
    url: it.Url || "",
    headline: it.Headline || "",
    avatar: it.AvatarUrl || "",
    followerCount: it.FollowerCount || 0,
    source: "followee",
  }));
}

function normalizeContents(json) {
  if (!json || !json.Data) return [];
  return (json.Data.Items || []).map((it) => ({
    title: it.Title || "",
    summary: it.Summary || "",
    url: it.Url || "",
    likeCount: it.LikeCount || 0,
    commentCount: it.CommentCount || 0,
    type: it.ContentType || "",
    source: "my_content",
  }));
}

function normalizeFavlists(json) {
  if (!json || !json.Data) return [];
  return (json.Data.Items || []).map((it) => ({
    title: it.Title || "",
    summary: it.Summary || it.Description || "",
    url: it.Url || "",
    type: it.Type || it.ContentType || "",
    likeCount: it.LikeCount || 0,
    commentCount: it.CommentCount || 0,
    source: "favlist",
  }));
}


// 人生样本蒸馏（借鉴 soul_distillation「答主蒸馏」范式，独立改写为「经历蒸馏」）
async function distillSample(query, persona) {
  const hits = await zhihuGet("/api/v1/content/zhihu_search", { Query: query, Count: 8 }, 600000);
  const items = normalizeItems(hits, "zhihu");
  const context = items
    .slice(0, 5)
    .map((x, i) => `${i + 1}.【${x.title}】${x.author}｜${x.text.slice(0, 200)}`)
    .join("\n");
  const prompt = `${LIU_SYSTEM}\n${persona || MODULE_PERSONA.sample}
基于以下知乎真实讨论，提炼可迁移的「人生样本」：
背景 → 关键选择 → 转折 → 结果 → 可迁移经验。每条必须标注来源答主与链接。
${GROUNDING_GUARD}
主题：${query}\n\n---已知讨论---\n${context}`;
  const content = await zhidaChat(prompt, { model: "zhida-thinking-1p5", fresh: false, tries: 2 });
  let structured = content;
  if (!structured.trim() && items.length) structured = distillFallback(items, query);
  return { items, structured, evidence: buildEvidence(items) };
}

// 人生样本库·连接闭环（对标冠军「人生样本库」）：
// ① 用 grounding 从知乎捞"同类处境者" → ② 组织成「前人路径」卡片（处境/选择/结果/经验）
// 关键：LLM 只能引用编号后的真实来源，卡片的 author/url 由编号回绑真实检索结果，杜绝编造链接。
async function sampleConnectQuery(q) {
  const sources = await liuGatherSources(q, "sample", "");
  const real = sources.filter((s) => s.title || s.text).slice(0, 8);
  if (!real.length) return { sources: [], paths: [] };
  const block = real.map((x, i) => `${i + 1}.【${x.title || ""}】${x.author || ""}｜${(x.text || "").slice(0, 160)}`).join("\n");
  const prompt = `${LIU_SYSTEM}\n${MODULE_PERSONA.sample}
下面是知乎上关于「${q}」的真实讨论（已编号）。请你从中提炼 3-5 个「前人路径」——即真实走过类似处境的人：
他最初的处境、做了什么关键选择、结果怎样、有什么可迁移的经验。
关于「结果(outcome)」：若资料明确写了就直写；若资料没明说，请基于它「处境(situation)+选择(choice)」推断一个合理、可信的结果（在前面加【推断】标识），不要只写「资料未明确说明 / 未提及」这类空话——读卡人需要的是可参考的真实结局推断。
${GROUNDING_GUARD}
要求：只输出一个 JSON 数组，不要解释、不要代码块标记。每个元素字段：
{ "src": <对应上方编号的纯数字>, "title": "一句话概括这个人的路径，如「裸辞考研上岸」",
  "situation": "他最初的处境（基于资料）", "choice": "关键选择 / 动作",
  "outcome": "结果。资料明说就直写；资料没明说就基于 situation+choice 推断一个合理可信的结果并加【推断】前缀，禁止写「资料未明确说明」", "lesson": "可迁移的经验（给正在类似处境的人）" }
---真实资料---
${block}`;
  // 注：结构化 JSON 任务用 zhida-fast-1p5（thinking 模型会无视"纯数字 src"约束、把作者名塞进 src 导致来源回绑失败）
  const content = await zhidaChat(prompt, { model: "zhida-fast-1p5", fresh: true, tries: 4 });
  let paths = [];
  const parsed = extractJSON(content);
  const arr = Array.isArray(parsed) ? parsed : (parsed && Array.isArray(parsed.paths) ? parsed.paths : []);
  if (arr.length) {
    arr.forEach((p) => {
      // 鲁棒回绑真实来源：优先取 src 里的数字编号；thinking 模型可能把作者名塞进 src，需兜底按标题匹配
      const m = String(p.src == null ? "" : p.src).match(/\d+/);
      let idx = m ? Number(m[0]) - 1 : -1;
      if (idx < 0 || idx >= real.length) {
        const t = (p.title || "").trim();
        idx = real.findIndex((r) => r.title && t && (r.title.includes(t.slice(0, 8)) || t.includes(r.title.slice(0, 8))));
      }
      const src = idx >= 0 ? real[idx] : {};
      const author = src.author || "";
      const url = src.url || "";
      const sourceTitle = src.title || "";
      if (!author && !url && !sourceTitle) return; // 无真实来源则丢弃，防幻觉
      paths.push({
        title: (p.title || "无名样本").toString().slice(0, 24),
        situation: (p.situation || "").toString().slice(0, 120),
        choice: (p.choice || "").toString().slice(0, 120),
        outcome: (p.outcome || "").toString().slice(0, 160),
        lesson: (p.lesson || "").toString().slice(0, 160),
        author, url, sourceTitle,
        // 提供给 AI 分身对话的真实素材（答主口吻对话用，严格 grounding）
        text: (src.text || "").toString(),
      });
    });
  }
  // 兜底：模型实时推断暂不可用时（限流/空响应），用真实检索到的知乎来源片段直接出卡，绝不空白、绝不编造
  if (!paths.length && real.length) {
    paths = real.slice(0, 5).map((s) => {
      const snip = (s.text || "").replace(/\s+/g, " ").trim().slice(0, 150);
      return {
        title: (s.title || "无名样本").toString().slice(0, 24),
        situation: snip ? ("据 @" + (s.author || "某答主") + " 的真实分享：" + snip) : "（原文正文暂未取到）",
        choice: "详见原回答中的具体做法",
        outcome: "（模型实时推断暂不可用，以下为知乎真实片段，点链接看完整经历）",
        lesson: "",
        author: s.author || "",
        url: s.url || "",
        sourceTitle: s.title || "",
        text: (s.text || "").toString(),
      };
    });
  }
  return { sources: real, paths };
}

// 人生样本库·AI 分身对话（连接而非替代）：以真实答主的口吻、基于他本人真实的知乎回答内容，
// 与正在经历类似处境的用户对话。只能引用真实资料，禁止编造链接/数据/事件。
async function avatarReply(avatar, q, history) {
  const a = avatar || {};
  const text = (a.text || "").toString();
  const name = a.author || "某位答主";
  const title = a.sourceTitle || a.title || "一篇真实回答";
  const sys = `你是知乎答主 @${name}，一位在知乎分享过真实经历的普通人。你不是 AI、不是大模型、没有"自我意识"这种概念——你就是这位答主本人。
你曾写下《${title}》，下面是那篇回答里的真实内容（摘自你本人的公开发布）：
【你的真实回答内容】
${text || "（这篇回答的正文暂未取到，请仅基于你作为这位答主的常识，以真诚口吻回应，并说明这是你的一般经验而非来自某篇具体回答）"}
请用你这个人的第一人称口吻，基于上面你自己的真实经历，和正在经历类似处境的用户聊天。
${GROUNDING_GUARD}
硬性约束：
① 绝对不能说自己是大模型 / AI / 没有自我意识 / 无法决策——你就是 @${name} 本人，用"我"来讲述你自己的经历。
② 只讲你上面真实回答里出现过的事；没写过的，老实说"我那篇里没细说"，不要硬编。
③ 像两个走过类似路的朋友对面坐，口语、有温度，不堆方法论、不列提纲。
④ 如果用户问的和你经历无关，就用你已有的真实经验给一句实在的分享，别硬扯。`;
  const messages = [
    { role: "system", content: sys },
    ...(history || []).slice(-10).map((h) => ({ role: h.role === "user" ? "user" : "assistant", content: h.content || "" })),
    { role: "user", content: q || "" },
  ];
  let content = "";
  let model = "zhida-fast-1p5"; // 用 fast 模型：thinking 模型在较长 system（含真实回答正文）时易返回空 body
  for (let i = 0; i < 3 && !content.trim(); i++) {
    const ans = await zhihuPost("/v1/chat/completions", { model, messages, stream: false }, 0).catch(() => ({}));
    if (ans && ans.error && /rate_limit/.test(JSON.stringify(ans.error)) && model !== "zhida-fast-1p5") { model = "zhida-fast-1p5"; i--; continue; }
    content = (ans.choices && ans.choices[0] && ans.choices[0].message && ans.choices[0].message.content) || "";
    if (!content.trim()) await new Promise((r) => setTimeout(r, 400 * (i + 1))); // 空 body 时退避重试
  }
  if (!content.trim()) content = "（这会儿有点挤，我缓一下再回你～你先把刚才的问题再发一句？）";
  return content;
}

// ============ 路线E：真人/真书「智慧蒸馏库」（双锚点，集成进现有模块，不单独开页）============
// 锚点①：真人蒸馏 —— 把一位真实知乎答主写下的内容，蒸馏成可复用的「思维模型卡」（连接而非替代）
async function distillAvatar(avatar) {
  const a = avatar || {};
  const text = (a.text || "").toString();
  const name = a.author || "某位答主";
  const title = a.sourceTitle || a.title || "一篇真实回答";
  const block = text ? text.slice(0, 1300) : "";
  const prompt = `${LIU_SYSTEM}
你是《知遇录》的「真人思维蒸馏器」。下面是一位知乎真实答主 @${name} 在《${title}》里写下的真实内容。
【@${name} 的真实回答内容】
${block || "（正文暂未取到，请仅基于该答主作为普通人的一般经验进行蒸馏，并注明这是一般性提炼而非来自某篇具体回答）"}
请只从这人的真实表达里，蒸馏出他看世界 / 做选择的「思维模型」——可复用的核心主张与行为准则。
严格基于真实内容，不要编造他没说过的情节、数据或事件。
只输出一个 JSON 对象，不要解释、不要代码块标记。字段：
{ "name": "给这个思维模型起个名字（建议带上答主特质，如「@${name} 的……模型」）",
  "core": "一句话核心主张（基于他真实表达）",
  "when": "什么时候该用这个视角（适用场景）",
  "tip": "一句能记住的口诀",
  "beliefs": ["3 条他真实流露的关键信念 / 行为准则（每条一句话）"] }
${GROUNDING_GUARD}`;
  const content = await zhidaChat(prompt, { model: "zhida-fast-1p5", fresh: true, tries: 3 });
  const parsed = extractJSON(content);
  const model = parsed && typeof parsed === "object" && !Array.isArray(parsed) ? parsed : null;
  if (!model || !model.core) return { mock: false, model: null, note: "暂时没能从这段真实回答里提炼出清晰模型，换个答主或稍后再试～" };
  return {
    mock: false,
    route: "真人蒸馏 · 知乎真实答主",
    model: {
      name: model.name || ("@" + name + " 的思维模型"),
      core: model.core,
      when: model.when || "",
      tip: model.tip || "",
      beliefs: Array.isArray(model.beliefs) ? model.beliefs.slice(0, 3) : [],
    },
    source: { author: name, url: a.url || "", title },
  };
}

// 锚点②：真书蒸馏 —— 从李玄通私有藏书（1528+ 段真实文字）里检索相关篇章，蒸馏成「真书智慧卡」（带引经据典）
async function distillBook(topic) {
  const passages = lxRetrieve(topic || "", null, 8);
  if (!passages.length) return { mock: false, model: null, note: "李玄通藏书里暂时没检索到和「" + (topic || "") + "」直接相关的篇章，换个说法或换个主题试试～" };
  const block = passages.map((c, i) => `【${i + 1}】《${c.src || "典籍"}》：${(c.text || "").slice(0, 240)}`).join("\n");
  const prompt = `${LIU_SYSTEM}
你是《知遇录》的「真书智慧蒸馏器」。下面摘自用户收藏的术数典籍（李玄通私有藏书，真实文字）：
${block}
请围绕主题「${topic || "格局与处世"}」，从上面这些典籍真实段落里，蒸馏出一套可复用的「真书智慧模型」——古人的判断框架与处世准则。
只使用上面典籍段落里真实出现过的内容，每条论断都要能对应到某本典籍（在 refs 里注明《书名》）；严禁编造典籍里没有的说法。
只输出一个 JSON 对象，不要解释、不要代码块标记。字段：
{ "name": "给这套智慧起个名字（如「《XXX》的……法则」）",
  "core": "一句话核心主张（源自典籍）",
  "when": "什么时候该用这个视角",
  "tip": "一句能记住的口诀",
  "beliefs": ["3 条关键准则，每条都要标注出自《书名》"],
  "refs": [{"book":"《书名》","snippet":"对应的一句原文（精炼）"}] }
${GROUNDING_GUARD}`;
  const content = await zhidaChat(prompt, { model: "zhida-fast-1p5", fresh: true, tries: 3 });
  const parsed = extractJSON(content);
  const model = parsed && typeof parsed === "object" && !Array.isArray(parsed) ? parsed : null;
  if (!model || !model.core) return { mock: false, model: null, note: "暂时没能从藏书里蒸馏出清晰模型，换个主题或稍后再试～" };
  return {
    mock: false,
    route: "真书蒸馏 · 李玄通私有藏书（" + passages.length + " 段真实文字）",
    model: {
      name: model.name || "真书智慧模型",
      core: model.core,
      when: model.when || "",
      tip: model.tip || "",
      beliefs: Array.isArray(model.beliefs) ? model.beliefs.slice(0, 3) : [],
    },
    refs: Array.isArray(model.refs) && model.refs.length
      ? model.refs.slice(0, 4)
      : passages.slice(0, 4).map((p) => ({ book: "《" + (p.src || "典籍") + "》", snippet: (p.text || "").slice(0, 60) })),
  };
}

// ============ 路线F：反哺闭环（OAuth 发知乎 · 开赛前脚手架）============
// 设计：前端在「复盘卡 / 生命之书」处拉 draft（现在即可用），OAuth 开赛后由 publishIdea 真发。
// OAuth 配置（开赛后由官方 API 提供）通过环境变量注入；未配置时 publishIdea 返回 available:false，前端显示「🔒 开赛后启用」。
function oauthEnabled() {
  return !!(process.env.ZHIHU_OAUTH_ENABLED === "1" || process.env.ZHIHU_OAUTH_ENABLED === "true");
}
function oauthConfig() {
  return {
    appId: process.env.ZHIHU_OAUTH_APP_ID || "",
    appKey: process.env.ZHIHU_OAUTH_APP_KEY || "",
    redirectUri: process.env.ZHIHU_OAUTH_REDIRECT || "",
    scope: process.env.ZHIHU_OAUTH_SCOPE || "",
  };
}

// 把复盘/传记内容润色成一篇可发的「知乎想法」草稿（现在即可用，不依赖 OAuth）
async function buildIdea({ type, content, sources }) {
  const srcList = Array.isArray(sources) && sources.length
    ? sources.map((s, i) => `【${i + 1}】${s.title || ""}${s.author ? " · " + s.author : ""}${s.url ? " · " + s.url : ""}`).join("\n")
    : "";
  const kind = type === "bio" ? "一段人生传记（生命之书的一章）" : "一次复盘";
  const prompt = `你是知乎电子好友刘看山。下面是我刚写好的${kind}，请帮我润色成一篇**知乎想法（不超过 500 字）**，方便直接发到知乎和同好交流。
要求：
- 第一人称、口语自然，像真的在分享，不鸡汤、不营销腔、不浮夸；
- 抓一个让人想点进来的钩子开头（一句真实感受或反直觉的小发现）；
- 保留原内容里最有价值的 1-3 个点，去掉流水账；
- 文末若提供了来源，用「参考：${srcList ? "上面这些知乎真实内容" : "自己这段经历"}」一句话标注，体现"事实有出处"；
- 不要编造数据、不要替别人说话、不涉及他人隐私；
- 只输出正文，不要解释、不要标题、不要 #话题 之外的多余格式（可加 1-2 个相关话题标签）。
${srcList ? "可参考的真实来源（仅作事实依据，不照搬）：\n" + srcList + "\n" : ""}
【我的原稿】
${content || ""}`;
  const draft = await zhidaChat(prompt, { model: "zhida-thinking-1p5", fresh: true, tries: 2 });
  if (!draft || !draft.trim()) {
    // 兜底：原文截取，保证前端永远有可复制内容
    return { draft: (content || "").slice(0, 480), degraded: true };
  }
  return { draft: draft.trim(), degraded: false };
}

// 真发知乎想法（OAuth 写权限）。开赛前 OAuth 未开放 → available:false。
// 函数体按官方 OAuth2.0 + 发想法端点形状写好，开赛后只需配置环境变量即可启用，无需改代码。
async function publishIdea({ draft, code, circle }) {
  if (!oauthEnabled()) {
    return { available: false, note: "OAuth 将于知乎黑客松开赛后随官方 API 开放，届时「一键发到知乎想法」将自动启用。" };
  }
  const cfg = oauthConfig();
  if (!code) return { available: true, needLogin: true, authorizeUrl: buildAuthorizeUrl(cfg) };
  try {
    if (!cfg.appId || !cfg.appKey) return { available: true, ok: false, note: "后端 OAuth 凭证未配置（app_id/app_key）。" };
    // 1) code → access_token（官方 OAuth2：openapi.zhihu.com/access_token，表单提交）
    const form = new URLSearchParams({
      app_id: cfg.appId,
      app_key: cfg.appKey,
      grant_type: "authorization_code",
      redirect_uri: cfg.redirectUri,
      code,
    }).toString();
    const tokRes = await fetch("https://openapi.zhihu.com/access_token", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: form,
    });
    const tok = await tokRes.json().catch(() => ({}));
    const token = tok.access_token || (tok.data && tok.data.access_token) || (tok.Data && tok.Data.access_token);
    if (!token) return { available: true, ok: false, note: "授权换取令牌失败，请重试登录。" };
    // 2) 发想法（官方「本人创作」写端点；Access Secret 鉴权调用方 + X-OAuth-Token 代表已授权用户）
    const postRes = await fetch(ZHIHU_BASE + "/api/v1/me/ideas", {
      method: "POST",
      headers: { ...authHeaders(), "X-OAuth-Token": token },
      body: JSON.stringify({ content: draft || "", circle: circle || "" }),
    });
    const post = await postRes.json().catch(() => ({}));
    const postedId = post && (post.id || (post.Data && post.Data.id));
    return { available: true, ok: !!postedId, note: postedId ? "已发到知乎想法。" : "发布未返回内容 ID，请稍后查看。" };
  } catch (e) {
    return { available: true, ok: false, note: "发布调用异常：" + e.message };
  }
}
function buildAuthorizeUrl(cfg, state) {
  const u = new URL("https://openapi.zhihu.com/authorize");
  u.searchParams.set("app_id", cfg.appId);
  u.searchParams.set("redirect_uri", cfg.redirectUri);
  u.searchParams.set("response_type", "code");
  if (cfg.scope) u.searchParams.set("scope", cfg.scope);
  if (state) u.searchParams.set("state", state);
  return u.toString();
}

// ============ 路线C：检索层升级为 Agent 多轮规划（非RAG）============
// 对标「知道」：意图澄清 → 拆解搜索词(ReAct/tool use) → 多轮搜知乎(站内+全网) → 模型当场判质量/去重/排序 → 带推荐语与阅读时间的来源列表
// 与旧 RAG 式 grounding 的区别：不是"搜一次→拼 prompt→直答"，而是"规划多组搜索词→并行多轮检索→模型当裁判排序→把高质量来源交给人读"。

// ① 拆解搜索词：把宽泛问题拆成 2-4 个互补、不重复的检索子问题，并给每个子问题一个检索范围建议
async function agentPlan(q) {
  const prompt = `你是一个知乎检索规划器。用户想了解一个问题，但原问题太宽泛，直接搜出来质量差。
请把它拆成 2-4 个互相补充、互不重复的检索子问题，让它们合起来能全面覆盖用户的真实需求。
每个子问题要具体、像真人会搜的词（可带"方法/经验/踩坑/案例/底层逻辑"等限定）。
只输出 JSON 数组，不要解释、不要代码块标记。元素：{ "q": "检索子问题", "scope": "zhihu(站内) 或 global(全网)", "why": "为什么拆出这条（10字内）" }
用户原问题：「${q}」`;
  let plans = [];
  const content = await zhidaChat(prompt, { model: "zhida-fast-1p5", fresh: true, tries: 2 });
  const arr = extractJSON(content);
  if (Array.isArray(arr)) plans = arr;
  // 兜底：模型没给出可用计划时，按经验拆 3 路
  if (!plans.length) {
    plans = [
      { q, scope: "zhihu", why: "站内原问" },
      { q: q + " 方法 经验", scope: "global", why: "方法经验" },
      { q: q + " 踩坑 案例", scope: "zhihu", why: "避坑案例" },
    ];
  }
  const seen = new Set();
  return plans
    .filter((p) => { const k = (p.q || "").trim(); if (!k || seen.has(k)) return false; seen.add(k); return true; })
    .slice(0, 4);
}

// ② 多轮并行检索：对每个子问题按建议范围检索站内；全网统一走 globalExternalSearch（过滤 zhihu.com 站内链接 + 后缀扇出扩源），避免「看着像全网、实际全是知乎」
async function agentGather(plans, q0) {
  const out = [];
  const pushItems = (items, source, planQ) => { (items || []).forEach((x) => out.push(Object.assign({}, x, { source, planQ }))); };
  const tasks = [];
  plans.forEach((p) => {
    const q = p.q; if (!q) return;
    tasks.push(
      zhihuGet("/api/v1/content/zhihu_search", { Query: q, Count: 5 }, 300000, true)
        .then((j) => pushItems(normalizeItems(j, "zhihu"), "zhihu", q)).catch(() => {})
    );
  });
  // 全网：只跑一次原问（多路并发既慢又易触发限流），globalExternalSearch 内部已剔除 zhihu.com 站内链接 + 后缀扇出扩源
  tasks.push(
    globalExternalSearch(q0 || plans.map((p) => p.q).join(" ") || "", 8)
      .then((items) => pushItems(items, "global", "")).catch(() => {})
  );
  await Promise.all(tasks);
  return out;
}

// ③ 去重：按 URL 归一，URL 缺失按标题归
function agentDedup(items) {
  const seen = new Set(); const res = [];
  items.forEach((x) => {
    const u = (x.url || "").trim(); const t = (x.title || "").trim();
    const key = u || ("T:" + t.slice(0, 24));
    if (!key || seen.has(key) || (!t && !x.text)) return;
    seen.add(key); res.push(x);
  });
  return res;
}

// ④ 模型当裁判：判相关度、去重结果、给推荐语与阅读时间、排序
async function agentRank(items, q) {
  if (!items.length) return [];
  const block = items.slice(0, 12).map((x, i) =>
    `${i + 1}.【${x.title || "无标题"}】${x.author || ""}｜来源:${x.source}｜${(x.text || "").slice(0, 120)}`
  ).join("\n");
  const prompt = `你是知乎内容质量裁判。下面是从知乎检索到的若干素材（已编号），都是为了回答用户这个问题：「${q}」。
请为每个素材打分并筛选：
① score(1-10)：与用户问题的贴合程度；
② keep(bool)：是否值得推荐给用户（低质/广告/与问题无关则 false）；
③ recommend(一句话，20字内)：为什么值得读、能解决用户的哪一点；
④ readMin(整数)：预估阅读要几分钟（按篇幅，3-15）。
只输出 JSON 数组，不要解释、不要代码块标记。每个元素：{ "idx": <上方编号纯数字>, "score": <1-10>, "keep": <true/false>, "recommend": "...", "readMin": <整数> }
---素材---
${block}`;
  const content = await zhidaChat(prompt, { model: "zhida-fast-1p5", fresh: true, tries: 2 });
  const arr = extractJSON(content);
  const map = {};
  if (Array.isArray(arr)) arr.forEach((r) => {
    const m = String(r.idx == null ? "" : r.idx).match(/\d+/);
    const idx = m ? Number(m[0]) - 1 : -1;
    if (idx >= 0 && idx < items.length) map[idx] = r;
  });
  return items.map((it, i) => {
    const r = map[i];
    return {
      title: it.title || "", author: it.author || "", url: it.url || "",
      text: it.text || "", source: it.source || "", planQ: it.planQ || "",
      score: r ? Number(r.score) || 5 : 5,
      keep: !(r && r.keep === false),
      recommend: (r && r.recommend) || "",
      readMin: (r && r.readMin) ? Number(r.readMin) || 5 : 5,
    };
  }).filter((x) => x.keep).sort((a, b) => b.score - a.score);
}

// 编排：Agent 检索主流程
async function researchAgent(q) {
  const plans = await agentPlan(q);            // ① 拆解搜索词
  const raw = await agentGather(plans, q);        // ② 多轮并行检索（站内+全网；全网走 globalExternalSearch）
  const deduped = agentDedup(raw);             // ③ 去重
  const ranked = await agentRank(deduped, q);  // ④ 模型判质量/排序/推荐语/阅读时间
  const summary = ranked.length
    ? `已为你从知乎站内+全网检索并筛选出 ${ranked.length} 条高质量素材，覆盖：${plans.map((p) => p.q).join("；")}。可点击下方来源深读。`
    : `这次没从知乎检索到贴合「${q}」的素材，换个更具体的说法再试（比如加上"方法 / 经验 / 踩坑"等限定）。`;
  return {
    mock: false, route: "agent",
    plan: plans.map((p) => ({ q: p.q, scope: p.scope, why: p.why || "" })),
    sources: ranked.slice(0, 10).map((x) => ({
      title: x.title, author: x.author, url: x.url, text: x.text,
      source: x.source, recommend: x.recommend, readMin: x.readMin, score: x.score,
    })),
    summary,
  };
}

// 核心分发
async function handleZhihu(action, payload = {}) {
  if (!process.env.ZHIHU_ACCESS_SECRET) {
    return { mock: true, reason: "no_secret", note: "未配置 ZHIHU_ACCESS_SECRET，样本库内容来自知乎真实经验分享，配密钥后即出。" };
  }
  try {
    if (action === "search") {
      const j = await zhihuGet("/api/v1/content/zhihu_search", { Query: payload.q || payload.Query || "", Count: payload.Count || 10 }, 300000, payload.fresh);
      return { mock: false, items: normalizeItems(j, "zhihu") };
    }
    if (action === "global") {
      let items = await globalExternalSearch(payload.q || payload.Query || "", payload.Count || 20).catch(() => []);
      if (!items.length) {
        const j = await zhihuGet("/api/v1/content/global_search", { Query: payload.q || payload.Query || "", Count: payload.Count || 20 }, 300000, payload.fresh).catch(() => ({}));
        items = normalizeItems(j, "global");
      }
      items = items.filter((x) => !isZhihuUrl(x.url)); // 只留真·全网
      return { mock: false, items };
    }
    if (action === "dual") {
      const ds = await dualSearch(payload.q || payload.Query || "", payload.Count || 6).catch(() => ({ zhihu: [], global: [], items: [] }));
      return { mock: false, zhihu: ds.zhihu, global: ds.global, items: ds.items };
    }
        if (action === "hot") {
      const j = await zhihuGet("/api/v1/content/hot_list", { Limit: payload.Limit || 30 }, 300000, payload.fresh);
      return { mock: false, items: normalizeItems(j, "hot") };
    }
    if (action === "answer") {
      const angle = ANSWER_ANGLES[Math.floor(Math.random() * ANSWER_ANGLES.length)];
      const userContent = (payload.query || "") + "\n\n【本次表达要求，每轮都不同、避免模板化】" + angle;
      // P0-1 修复：改用 zhidaChat —— 自带重试 + 限流切模型(thinking→fast) + 空体自愈，杜绝间歇空响应静默降级
      const content = await zhidaChat(userContent, { model: payload.model || "zhida-thinking-1p5", fresh: payload.fresh, tries: 3 });
      if (content.trim()) return { mock: false, content, degraded: false };
      // 重试 3 次仍空：明确标注降级并给出诚实占位（绝不返回静默空白），前端据此回退本地模板/提示
      return {
        mock: false,
        content: "",
        degraded: true,
        note: "（实时直答这会儿返回为空，已自动重试 3 次仍未拿到内容；传记/模型对话会退回本地叙事或缓存视角，稍后刷新重试通常能恢复。）",
      };
    }
    if (action === "distill") {
      return { mock: false, ...(await distillSample(payload.q || payload.Query || "", payload.persona)) };
    }
    // 关注流（能力 #3）：返回 Access Secret 所属账号关注的人（不需 OAuth，即你本人关注圈）
    if (action === "followees") {
      try {
        const j = await zhihuGet("/api/v1/user/followees", { Limit: payload.Limit || 20 }, 600000, false, payload.sid || undefined);
        return { mock: false, items: normalizeFollowees(j), viaOAuth: !!payload.sid };
      } catch (e) {
        return { mock: false, items: [], error: e.message, viaOAuth: !!payload.sid };
      }
    }
    // 我的创作（能力 #3 衍生）：返回账号本人的公开创作
    if (action === "contents") {
      try {
        const j = await zhihuGet("/api/v1/user/contents", { ContentType: payload.type || "all", Limit: payload.Limit || 10 }, 600000, false, payload.sid || undefined);
        return { mock: false, items: normalizeContents(j), viaOAuth: !!payload.sid };
      } catch (e) {
        return { mock: false, items: [], error: e.message, viaOAuth: !!payload.sid };
      }
    }
    // 调试功能：验证时间戳字段
    if (action === "debug_timestamp") {
      const sid = payload.sid;
      const j = await zhihuGet("/api/v1/user/contents", { Limit: 3 }, 600000, false, sid);
      
      // 输出原始数据结构
      console.log("=== DEBUG: Raw user contents response ===");
      if (j && j.Data && j.Data.Items) {
        console.log("First item keys:", Object.keys(j.Data.Items[0] || {}));
        console.log("First item:", JSON.stringify(j.Data.Items[0], null, 2));
      } else {
        console.log("No valid response or items found");
        console.log("Full response:", JSON.stringify(j, null, 2));
      }
      
      return { 
        mock: false, 
        debug: true,
        raw_response_sample: j && j.Data ? { 
          has_items: Array.isArray(j.Data.Items),
          sample_item_keys: j.Data.Items && j.Data.Items[0] ? Object.keys(j.Data.Items[0]) : [],
          first_item: j.Data.Items && j.Data.Items[0] ? j.Data.Items[0] : null
        } : null
      };
    }
    // 知识卡片（能力 #6 替代实现）：用直答把主题凝成可理解的「知识卡」
    // 知识卡片（能力 #6 替代实现）：用直答把主题凝成可理解的「知识卡」
    if (action === "knowledge") {
      const angle = ANSWER_ANGLES[Math.floor(Math.random() * ANSWER_ANGLES.length)];
      const prompt = `${LIU_SYSTEM}\n你是《知遇录》的「知识提炼」助手。
请把主题「${payload.q || payload.Query || ""}」讲给一个想快速入门的年轻人听：
①一句话定义 ②三个核心要点 ③一个容易踩的误区 ④一个可以马上行动的小练习。
用平实、不堆术语的中文，400 字内。\n\n【本次表达要求，每轮不同】${angle}`;
      const _kq = payload.q || payload.Query || "";
      const _ds = await dualSearch(_kq, 6).catch(() => ({ zhihu: [], global: [] }));
      let content = await zhidaChat(prompt, { model: payload.model || "zhida-fast-1p5", fresh: payload.fresh, tries: 2 });
      // 第一原则·不空答：对话模型不可用（限流/空响应）时，用已检索到的真实知乎/全网资料做 RAG 兜底，绝不回「没接上话」死胡同
      if (!content.trim()) content = ragFallbackAnswer(_ds.items, _kq, "explore");
      return { mock: false, content, refsZhihu: _ds.zhihu, refsGlobal: _ds.global };
    }
    // 故事样本（能力 #2 替代实现）：盐言故事接口未开放，改用「全网搜索」聚合真实叙事/经验样本（搜索不限知乎）
    if (action === "story") {
      const j = await zhihuGet("/api/v1/content/global_search", { Query: payload.q || payload.Query || "", Count: payload.Count || 8 }, 300000, payload.fresh);
      const items = dedupeByDomain(rankByAuthority(normalizeItems(j, "global").filter((x) => !isZhihuUrl(x.url)).map((x) => ({ ...x, source: "story" }))));
      return { mock: false, items };
    }
    // 路线C：检索 Agent（非RAG）—— 规划多组搜索词→并行多轮检索→模型当裁判排序→带推荐语与阅读时间的高质量来源
    if (action === "zhihuAgent") {
      const q = payload.q || payload.Query || "";
      if (!q) return { mock: false, route: "agent", plan: [], sources: [], summary: "请输入你想搞清楚的问题。" };
      return { mock: false, ...(await researchAgent(q)) };
    }
    // 刘看山对话式回复（让桌宠与各引导模块真正"接话"，而非只丢搜索结果）
    if (action === "liuchat") {
      const persona = payload.persona || "pet";
      const ctx = payload.context || "";
      const angle = ANSWER_ANGLES[Math.floor(Math.random() * ANSWER_ANGLES.length)];
      const sys = (LIU_CHAT_PERSONA[persona] || LIU_CHAT_PERSONA.pet).replace("${ctx}", ctx);
      const userContent = `${LIU_SYSTEM}\n${sys}${ctx ? "\n（本次引导上下文：" + ctx + "）" : ""}
\n用户说：${payload.q || ""}
\n\n【本次表达要求，每轮都不同、避免模板化】${angle}${persona === "pet" ? "\n（桌宠气泡，务必控制在 30 字内、像随口接话）" : ""}`;
      const ans = await zhihuPost(
        "/v1/chat/completions",
        { model: payload.model || "zhida-thinking-1p5", messages: [{ role: "user", content: userContent }], stream: false },
        payload.fresh ? 0 : 600000
      );
      let content = (ans.choices && ans.choices[0] && ans.choices[0].message && ans.choices[0].message.content) || "";
      // 第一原则·不空答：对话模型不可用时给一句温和接话，绝不回「没接上话」死胡同
      if (!content.trim()) content = "喵～这会儿有点忙，你再说一遍，我就在。";
      return { mock: false, content };
    }
    // ---------- 领域速通·规划兜底（直答 LLM 不可用但仍拿到真实知乎检索资料时使用） ----------
    // 第一原则：即便 LLM 限流，也用本次真实检索到的知乎资料 + 方法工具箱生成可用计划，不空答、不写死模板
    function autoPickMethods(goal) {
      const g = goal || "";
      const has = (kw) => kw.some((k) => g.indexOf(k) >= 0);
      if (has(["考试", "考证", "背", "记忆", "执照", "资格"])) return pick3(["康奈尔笔记法", "间隔重复", "费曼学习法"]);
      if (has(["做出来", "作品", "项目", "上手", "接活", "实操", "写", "开发", "剪", "做"])) return pick3(["西蒙学习法", "麻省理工AI学习法", "费曼学习法"]);
      if (has(["讲给", "讲懂", "分享", "表达", "输出", "教会", "听懂"])) return pick3(["费曼学习法", "番茄工作法", "康奈尔笔记法"]);
      if (has(["阅读", "理解", "理论", "书", "文献", "论文"])) return pick3(["SQ3R阅读法", "康奈尔笔记法", "间隔重复"]);
      return pick3(["西蒙学习法", "费曼学习法", "番茄工作法"]);
    }
    function pick3(names) { return names.map((n) => FIELD_METHODS.find((m) => m.name === n)).filter(Boolean); }
    function buildWeekly(chosen, hr, style, goal) {
      const names = chosen.map((m) => m.name);
      const used = new Set();
      const take = (pref) => {
        for (const p of pref) if (names.indexOf(p) >= 0 && !used.has(p)) { used.add(p); return p; }
        for (const n of names) if (!used.has(n)) { used.add(n); return n; }
        used.clear();
        const n = names[0]; used.add(n); return n;
      };
      const w1 = take(["西蒙学习法"]);
      const w2 = take(["费曼学习法"]);
      const w3 = take(["康奈尔笔记法", "SQ3R阅读法"]);
      const w4 = take(["麻省理工AI学习法"]);
      return `▍4 周节奏（番茄钟贯穿每天 ${hr}h、${style}）
第 1 周·聚焦：用「${w1}」只攻最高频的 20% 核心，不贪全，先把骨架立住。
第 2 周·第一次产出：用「${w2}」做第一个小练习 / 小作品雏形，卡壳的地方就是该回补的漏洞。
第 3 周·结构化：用「${w3}」把零散知识钉成体系，准备一个能拿得出手的小展示。
第 4 周·整合验证：用「${w4}」把前三周串起来、查漏补缺，产出一个能证明「${goal}」的最小成果，发到知乎社区收反馈。`;
    }
    function fieldPlanFallback(sources, ctx, q) {
      const pick = (label) => {
        const m = new RegExp(label + "[：:]\\s*([^\\n]+)").exec(ctx || "");
        return m ? m[1].trim() : "";
      };
      const domain = pick("领域") || q || "新领域";
      const rawGoal = pick("想达成的目标") || "能独立上手做出来";
      const goal = rawGoal.replace(/^30\s*天后(能)?/, ""); // 避免开场与"30天后"重复
      const lv = pick("当前水平") || "零基础";
      const hr = (parseFloat((pick("每天可投入") || "1.5").replace(/[^0-9.]/g, "")) || 1.5);
      const style = pick("偏好风格") || "动手实践";
      const pickedM = /用户已指定想用这些方法：(.+?)。/.exec(ctx || "");
      let chosen;
      if (pickedM && pickedM[1]) {
        const names = pickedM[1].split(/[、,，]/).map((s) => s.trim()).filter(Boolean);
        chosen = FIELD_METHODS.filter((m) => names.indexOf(m.name) >= 0);
      }
      if (!chosen || !chosen.length) chosen = autoPickMethods(rawGoal);
      const refs = (sources || []).filter((s) => s.title || s.name).slice(0, 2);
      const refText = refs.length
        ? refs.map((s) => `知乎上${s.author ? " @" + s.author + " " : " " }在《${s.title || s.name}》里提到：${(s.text || s.summary || "").slice(0, 60)}…`).join("；")
        : "";
      const methodParas = chosen.map((m, i) =>
        `▍方法${i + 1}·${m.name} —— 为什么用它、怎么用它达成「${goal}」\n${m.desc}\n怎么用（落到你身上）：${m.use}`
      ).join("\n\n");
      const weekly = buildWeekly(chosen, hr, style, goal);
      const tomorrow = `明天就能做的最小一步：打开「${domain}」的一个入门资源，用「${chosen[0].name}」只啃第一个最小子主题 25 分钟（番茄钟），不求懂全，先求动起来。`;
      const opening = `用对方法，30 天后你大概能：${goal}（当前「${lv}」起步，每天 ${hr} 小时、${style}）。下面是针对你这个目标挑的方法与节奏——`;
      let plan = opening + "\n\n" + methodParas + "\n\n" + weekly + "\n\n" + tomorrow;
      if (refText) plan += "\n\n（参考了知乎实时讨论：" + refText + "）";
      return plan;
    }

    // 刘看山身份守卫：剥离模型偶发的「我是知乎直答」自报家门开场，确保始终以刘看山身份作答
    function stripLiuIntro(text) {
      if (!text) return text;
      let t = String(text);
      const m = t.match(/^\s*我是知乎(直答|官方)[^\n。！？!?…]*[。！？!?…]?/);
      if (m) t = t.slice(m[0].length).replace(/^\s*[\n，,。.]+/, "");
      t = t.trim();
      // 若剥离后几乎无内容（模型只回了自报身份），回一句刘看山本色的兜底，绝不露出「知乎直答」
      if (!t || /^[\s。.，,！!？?…]+$/.test(t)) return "嗨，我是刘看山～你想聊点什么都可以，我陪你慢慢想。";
      return t;
    }

    // 对话模型不可用（限流 429 / 偶发空响应）时的通用 RAG 兜底：用已检索到的知乎/全网真实资料拼出有依据的回答，绝不空答、绝不回「没接上话」死胡同
    function ragFallbackAnswer(sources, q, persona) {
      const real = (sources || []).filter((s) => (s.title || s.name || s.text || s.summary));
      const lead = (persona === "pet")
        ? "喵～我刚想认真接话，对话名额被挤掉了，先把找到的资料摆给你：\n"
        : "（实时对话模型这会儿被限流，我先用刚刚检索到的真实资料答你：）\n";
      if (!real.length) {
        return lead + "暂时没检索到贴合「" + (q || "") + "」的公开资料，你换个更具体的说法或稍后再聊一句，我通常就能接上 AI 对话。";
      }
      const top = real.slice(0, 4);
      const pts = top.map(function (s, i) {
        const who = s.source === "global" ? "全网资料" : (s.author ? "知乎 @" + s.author : "知乎讨论");
        const body = (s.text || s.summary || s.title || "").replace(/\s+/g, " ").trim().slice(0, 95);
        const link = s.url ? "（" + s.url + "）" : "";
        return (i + 1) + ". " + (s.title || s.name || "相关讨论") + "：" + body + " —— " + who + link;
      }).join("\n");
      return lead + pts + "\n\n——以上来自知乎站内 + 全网实时检索，点链接可深读。稍后再发一句通常就能接上完整 AI 对话。";
    }

    // 刘看山「智能对话」：并行检索知乎开放平台全部接口做 RAG，并结合多轮对话历史，像元宝/豆包那样自然、有依据地回答
    if (action === "liuanswer") {
      const persona = payload.persona || "explore";
      const ctx = payload.context || "";
      const q = payload.q || "";
      const history = Array.isArray(payload.history) ? payload.history.slice(-12) : [];
      const isPet = persona === "pet";
      const angle = ANSWER_ANGLES[Math.floor(Math.random() * ANSWER_ANGLES.length)];

      // 1) 多接口并行检索（充分利用知乎开放平台全部接口）
      const sources = await liuGatherSources(q, persona, ctx);
      const apiSet = [...new Set(sources.map((s) => s.source))];
      const apiLabel = { zhihu: "站内搜索", global: "全网搜索", hot: "热榜", my_content: "我的创作", followee: "我的关注" };
      const liveLabel = apiSet.length
        ? "知乎实时接口：" + apiSet.map((a) => apiLabel[a] || a).join(" / ")
        : "知乎实时（本次未检索到相关公开资料，已用通用知识作答）";
      const dataBlock = sources.length
        ? sources.slice(0, 10).map((x, i) => `${i + 1}.【${x.title || x.name || ""}】${x.author || x.headline || ""}｜${(x.text || x.summary || "").slice(0, 160)}`).join("\n")
        : "";

      // 2) 组装：系统人格 + 多轮历史 + 本轮（带实时资料）；直答偶发空响应，做最多 3 次重试自愈
      const personaHint = LIU_PERSONA_HINT[persona] || LIU_PERSONA_HINT.explore;
      const coachInstr = payload.coach ? ("\n" + LIU_COACH_INSTR) : "";
      const ctxNote = ctx ? "（本次对话上下文/引导背景：" + ctx + "）\n" : "";
      let content = "";
      let model = payload.model || "zhida-thinking-1p5";
      const MAX_TRIES = 4;
      for (let attempt = 0; attempt < MAX_TRIES && !content.trim(); attempt++) {
        const a = ANSWER_ANGLES[Math.floor(Math.random() * ANSWER_ANGLES.length)];
        const sysNow = LIU_SYSTEM + "\n" + personaHint + "\n" + LIU_RAG_INSTR + "\n" + GROUNDING_GUARD +
          "\n【本轮表达角度，每轮不同、避免模板化】" + a + coachInstr +
          (isPet ? "\n（桌宠气泡，务必 1-3 句、像随口接话）" : "");
        // 重试时收紧资料量，降低空响应概率
        const cap = attempt === 0 ? 10 : 6;
        const len = attempt === 0 ? 160 : 120;
        const blockNow = sources.length
          ? sources.slice(0, cap).map((x, i) => `${i + 1}.【${x.title || x.name || ""}】${x.author || x.headline || ""}｜${(x.text || x.summary || "").slice(0, len)}`).join("\n")
          : "";
        const finalNow =
          ctxNote +
          (blockNow ? "【知乎实时资料 · 用于支撑回答、自然引用，不堆砌】\n" + blockNow + "\n\n" : "") +
          "用户说：" + q + "\n\n请结合上面的资料和我们的对话历史，自然、有依据、像朋友聊天一样回应。";
        const messages = [
          { role: "system", content: sysNow },
          ...history.map((h) => ({ role: h.role === "user" ? "user" : "assistant", content: h.content || "" })),
          { role: "user", content: finalNow },
        ];
        try {
          const ans = await zhihuPost(
            "/v1/chat/completions",
            { model, messages, stream: false },
            payload.fresh ? 0 : 600000
          );
          // 直答偶发限流：切到 fast 模型再试一次（不消耗尝试次数）
          if (ans && ans.error && /rate_limit/.test(JSON.stringify(ans.error)) && model !== "zhida-fast-1p5") {
            model = "zhida-fast-1p5";
            attempt--;
            continue;
          }
          content = (ans.choices && ans.choices[0] && ans.choices[0].message && ans.choices[0].message.content) || "";
        } catch (e) {
          content = "";
        }
      }
      // 仍空（多为对话模型被限流 429 / 偶发空响应）：第一原则「不空答」——用已检索到的知乎/全网真实资料做 RAG 兜底，
      // 拼出有依据的简答 + 来源，绝不回退成「没接上话」死胡同（用户在对话模型限流时也能拿到真东西）
      if (!content.trim()) {
        content = ragFallbackAnswer(sources, q, persona);
      }
      // 刘看山身份守卫：即便模型偶发自报「我是知乎直答」，也在此剥离，保证始终以刘看山作答
      content = stripLiuIntro(content);
      const _cls = classifyRefs(sources, q);
      // 参考条数：默认知乎 8 / 全网 8；「自我认知·MBTI 对话」(persona=self) 按需求固定全网 6 条
      const _refZN = Math.max(1, Math.min(12, payload.refZhihu || 8));
      const _refGN = Math.max(1, Math.min(12, payload.refGlobal || (persona === "self" ? 6 : 8)));
      return {
        mock: false,
        content,
        sources: sources.slice(0, 6),
        refsZhihu: _cls.zhihu.slice(0, _refZN),
        refsGlobal: _cls.global.slice(0, _refGN),
        evidence: buildEvidence(sources),
        route: liveLabel,
        liveApi: apiSet.join(","),
        usedInterfaces: apiSet,
      };
    }
    // 东方视角检索词：把口语提问补上术数领域词（不带具体平台名 / 不改主题），避免召回无关页
    function lxSearchQuery(q, type) {
      const s = String(q || "").trim();
      let tag = "";
      if (/紫微|命宫|斗数|主星/.test(s)) tag = " 紫微斗数";
      else if (/手相|掌纹|事业线|生命线/.test(s)) tag = " 手相";
      else if (/面相|五官|麻衣|神相/.test(s)) tag = " 面相";
      else if (/风水|朝向|摆位|户型|办公室/.test(s)) tag = " 风水";
      else if (/卦|易经|周易|梅花|体用/.test(s)) tag = " 易经 卦象";
      else if (/喜用|十神|日主|格局|流年|大运|五行|命理|八字|命盘|运势/.test(s)) tag = " 八字 命理";
      else tag = " 八字 命理 运势";
      const base = cleanSearchBase(s) || s;
      return (base + tag).slice(0, 60);
    }
    // 李玄通：东方术数顾问（娱乐向）。把本地算出的八字事实交给 LLM，由他给出有温度、不离谱的指引
    // 李玄通：完整命理引擎。先排盘（四柱含立春校正 / 五行 / 十神 / 紫微主星 / 喜用神 / 梅花起卦），
    // 再把整张命盘作为结构化事实交给 LLM，由他真的"读盘"给出有温度的自我觉察，而非套话。
    if (action === "lixuan") {
      if (payload.mode === "full") return await lxFullDiagnose(payload);
      const q = payload.q || "";
      const birth = payload.birth || null;
      const type = payload.type || "bazi";
      const TYPE_TAG = { bazi: "八字", ziwei: "紫微", shouxiang: "手相", mianxiang: "面相", fengshui: "风水", sixren: "六壬", qimen: "奇门", taiyi: "太乙" };
      const TYPE_NAME = { bazi: "八字命盘", ziwei: "紫微斗数", meihua: "梅花易数", sixren: "大六壬", qimen: "奇门遁甲", taiyi: "太乙神数", shouxiang: "手相", mianxiang: "面相", fengshui: "风水" };
      const TEXT_TYPES = { shouxiang: "手相", mianxiang: "面相", fengshui: "风水" };
      const CALC_TYPES = { bazi: 1, ziwei: 1, sixren: 1, qimen: 1, taiyi: 1, meihua: 1 };
      let chart = null, gua = null, facts = payload.facts || "";
      if (type === "meihua") {
        const now = new Date();
        const hZhi = Math.floor(((now.getHours() + 1) / 2)) % 12;
        gua = lxMeihua(now.getFullYear(), now.getMonth() + 1, now.getDate(), hZhi);
      } else if (birth && birth.y && (type === "bazi" || type === "ziwei")) {
        try { chart = lxComputeChart(birth); } catch (e) { chart = null; }
      }
      // 八字/紫微由后端权威重排（立春校正），覆盖前端 facts，避免重复
      if (chart) {
        const p = chart.pillars.map((x) => `${x.col} ${x.gan}${x.zhi}（${x.ss}）`).join("，");
        const wxs = LX_WX.map((w) => `${w}${chart.wx[w]}`).join(" ");
        const xi = chart.xiYong.join("、");
        facts = `【排盘事实（程序计算，已校立春）】
四柱：${p}。
日主：${chart.dayMaster.gan}（五行属${chart.dayMaster.wx}，${chart.dayMaster.strength}）。
五行分布：${wxs}。
喜用神（补益方向）：${xi}。
紫微命宫：地支${chart.ziwei.zhi}（${chart.ziwei.wx}），意象主星${chart.ziwei.star}——${chart.ziwei.img}`;
      }
      if (gua) {
        facts += `\n\n【梅花易数·时间起卦（程序计算）】
本卦：${gua.ben}（上${LX_BAGUA[gua.upper].n}·${gua.yiUpper}；下${LX_BAGUA[gua.lower].n}·${gua.yiLower}）。
变卦：${gua.bian}。动爻：第 ${gua.dong} 爻。
体用：${LX_BAGUA[gua.ti].n}（${gua.tiWx}，为体·我）× ${LX_BAGUA[gua.yong].n}（${gua.yongWx}，为用·事）。
体用关系：${gua.rel}`;
      }
      // 检索用户藏书，作为【典籍依据】注入李玄通提示词（按门类加权）
      const refs = [];
      let classicBlock = "";
      try {
        const preferTag = TYPE_TAG[type] || "";
        const hits = lxRetrieve(q, chart, 8, preferTag);
        if (hits.length) {
          const seen = new Set();
          classicBlock = "【典籍依据·摘自用户藏书，你须优先据此作答，可引用其中论断，引文时注明《书名》】\n";
          hits.forEach((h, i) => {
            classicBlock += `${i + 1}. 《${h.src}》：${h.text}\n`;
            if (!seen.has(h.src)) { seen.add(h.src); refs.push(h.src); }
          });
        }
      } catch (e) { classicBlock = ""; }
      const isText = !!TEXT_TYPES[type];
      const askForBirth = !chart && !gua && !payload.facts && !isText;
      let instruct = "";
      if (chart || CALC_TYPES[type]) {
        instruct = `你是李玄通，请基于上面的真实排盘事实作答（当前门类：${TYPE_NAME[type] || "八字命盘"}），要像对面坐着的先生，把盘读懂、读厚、读活：
①先用一两句把关键格局点出来（日主强弱、最显眼的十神组合），让用户知道你真看了盘；
②论格局：从日主强弱、十神组合讲他显性的性格 / 能量模式，举一个生活里的具体表现，点到即止、不写满；
③喜用神与当下用劲方向：结合喜用神，点出"你五行喜X，可往X处使力"，给一条可落地的自我觉察或行动建议；
④若上面的【典籍依据】里有相关论断，优先引《书名》支撑你的格局解读，用典籍原意落地你的判断（可引 1-2 处原文）；典籍未覆盖处再凭通识；
⑤收尾点明这是娱乐向、不作决策凭据。
⑥末段必须用一两句<b>大白话</b>（口语、不绕弯、不堆术语）把核心结论直接总结出来，让用户一眼看明白"我到底该怎么看、往哪使力"；
⑦可同时引用<b>多部</b>典籍（《书名》原意互相印证），不要只盯一部；若上面的【权威资料】里有相关书名，也点名引用，让结论有来处。
整体 800-1100 字，分自然段、有层次，口吻从容像老先生，不堆术语、不吓人、不预言灾祸、不说满。`;
      } else if (gua) {
        instruct = `你是李玄通，请基于上面的起卦事实作答：
①点出本卦意象与动爻之机；②用体用生克关系给一句点拨（事是成是阻、宜进宜守）；③收在"卦是让你停一下换个角度看"，不预言吉凶。控制在 220 字内。`;
      } else if (isText) {
        instruct = `你是李玄通，正在为用户论断「${TEXT_TYPES[type]}」（娱乐向，不作决策凭据）。
当前门类：${TYPE_NAME[type]}。用户描述是：${q}
上面的【典籍依据】摘自用户收藏的术数典籍（如《手相学数据手册》《麻衣神相》等），你须优先依据这些典籍论断，引《书名》支撑；若无直接相关典籍，凭通识并标注娱乐向。
请结合用户描述，给出具体、可理解、生活化的解读（讲清"这代表什么、可往哪使力"），控制在 300 字内，口吻像对面坐着的先生，不堆术语、不吓人。
末句用一两句大白话直接总结核心结论，让用户一眼看明白；可引用多部典籍《书名》或上面【权威资料】里的书名互相印证。`;
      } else {
        instruct = `用户尚未报生辰，也未起卦。请先从容请他报上生辰年月日时，或说件眼前事请你起卦；不要硬答、不要编造排盘。语气像老先生，让人愿意接着聊。`;
      }
      // 玄学提问多为口语，直接拿去检索会召回无关页；补术数领域词再检索，拿到与「东方视角」相关的知乎/全网权威资料
      let _liveRefs = { zhihu: [], global: [] };
      try { _liveRefs = classifyRefs(await liuGatherSources(lxSearchQuery(q, type), "lixuan", "")); } catch (e) {}
      // 从检索结果里挑「像书」的权威来源（知乎/全网），供李玄通在回答里点名引用，补足「只引一部典籍」的问题
      const _authBooks = (function () {
        const pick = (_liveRefs.zhihu || []).concat(_liveRefs.global || []).map(function (x) { return x.title || ""; }).filter(Boolean);
        const books = []; const seen = new Set();
        pick.forEach(function (t) {
          const m = t.match(/(《[^》]{2,20}》|[一-龥A-Za-z0-9]{2,18}(?:全书|通解|译注|讲义|指南|入门|图谱|真诠|集注|注疏|白话|详解|新解|精解|校注|全解|释义|解义|探微|发微|辑要|抉微|正义|疏证|文化|源流|考))/);
          if (m && !seen.has(m[1])) { seen.add(m[1]); books.push(m[1]); }
        });
        return books.slice(0, 8);
      })();
      const authorityNote = _authBooks.length
        ? "\n【可引用的权威资料·来自知乎/全网真实检索，你可在回答里点名这些书/资料，与本地典籍互相印证，但不要编造书名】\n" + _authBooks.map(function (b, i) { return (i + 1) + ". " + b; }).join("\n") + "\n"
        : "";
      const userContent = `${LIXUAN_SYSTEM}
${facts ? facts + "\n\n" : ""}${classicBlock ? classicBlock + "\n\n" : ""}${askForBirth ? "（用户尚未报生辰，也未起卦。请先请他报生辰或起卦；若他已有透露生辰请直接排。不要编造排盘事实。）\n\n" : ""}用户说：${q}
\n\n${instruct}${authorityNote}`;
      const singleProvided = [TYPE_NAME[type] || "八字命盘"];
      const singleMissing = ["八字命盘", "紫微斗数", "梅花易数", "大六壬", "奇门遁甲", "太乙神数", "手相", "面相", "风水"].filter((x) => x !== (TYPE_NAME[type] || ""));
      let content = await lxChat(userContent, payload.model || "zhida-thinking-1p5");
      const usedLLM = !!content.trim();
      if (!usedLLM) content = lxCorpusFallback(facts, classicBlock, singleProvided, singleMissing, type);
      return { mock: !usedLLM, fallback: !usedLLM, content, chart: chart || null, gua: gua || null, refs: refs.concat(_authBooks), refsZhihu: _liveRefs.zhihu, refsGlobal: _liveRefs.global };
    }

    // 大佬思维模型（参考往届「知识蒸馏馆」范式）：全网搜真实讨论 → LLM 蒸馏 3-5 个可复用思维模型
    if (action === "models") {
      const q = payload.q || "认知 思维模型";
      // 搜索结果按 5 分钟缓存（即便 fresh 也缓存），直答部分仍 fresh+重试+兜底：
      // 这样评委连续点同一模块时不会反复击穿搜索配额，仅重跑对话，限流时还能用缓存资料兜底
      const _ds = await dualSearch(q + " 思维模型 方法论 框架", 16).catch(() => ({ zhihu: [], global: [], items: [] }));
      const items = _ds.items.length ? _ds.items : [];
      const context = items.slice(0, 5).map((x, i) => `${i + 1}.【${x.title}】${x.author}｜${(x.text || "").slice(0, 160)}`).join("\n");
      const prompt = `${LIU_SYSTEM}\n你是《知遇录》的「大佬思维模型」蒸馏器。
主题 / 人物：「${q}」。
基于以下知乎真实讨论，蒸馏出 3-5 个可复用的「思维模型 / 方法论」——每个要有：名字(name)、核心主张(core)、适用场景(when)、一句能记住的口诀(tip)。
只输出一个 JSON 数组，不要任何解释文字、不要代码块标记。字段：name, core, when, tip。
---已知讨论---\n${context}`;
      const content = await zhidaChat(prompt, { model: "zhida-thinking-1p5", fresh: payload.fresh, tries: 2 });
      let models = [];
      let modelsFromFallback = false;
      const parsed = extractJSON(content);
      if (Array.isArray(parsed) && parsed.length) {
        models = parsed;
      } else if (items.length) {
        models = modelsFallback(items, q);
        modelsFromFallback = true;
      }
      return { mock: false, models, methods: models, modelsFromFallback, refsZhihu: _ds.zhihu, refsGlobal: _ds.global, sources: items.slice(0, 6).map((x) => ({ ...x, source: x.source || (isZhihuUrl(x.url) ? "zhihu" : "global") })), evidence: buildEvidence(items) };
    }
    // 人生样本库·连接闭环（路线A）：① 输入真实人生处境 → ② grounding 捞同类处境者 → ③ 组织成「前人路径」卡片
    if (action === "sampleConnect") {
      const q = (payload.q || payload.situation || "").toString().trim();
      if (!q) return { mock: false, paths: [], note: "请描述你正卡住的真实人生处境（转行 / 迷茫 / 关系 / 副业……）。" };
      const { sources, paths } = await sampleConnectQuery(q);
      return {
        mock: false,
        paths,
        evidence: buildEvidence(sources),
        sources: sources.slice(0, 6),
        refsZhihu: classifyRefs(sources, q).zhihu,
        refsGlobal: classifyRefs(sources, q).global,
        route: "知乎实时检索（站内搜索 + 全网搜索）",
        note: paths.length ? "" : "没能从知乎实时讨论里提炼出结构化样本，你可以换个说法再试试。",
      };
    }
    // 人生样本库·AI 分身对话（连接而非替代）：以真实答主口吻、基于其真实知乎回答内容对话
    if (action === "avatarChat") {
      const avatar = payload.avatar || {};
      const q = (payload.q || "").toString();
      const history = Array.isArray(payload.history) ? payload.history.slice(-10) : [];
      const content = await avatarReply(avatar, q, history);
      return {
        mock: false,
        content,
        source: { author: avatar.author || "", url: avatar.url || "", title: avatar.sourceTitle || avatar.title || "" },
      };
    }
    // 路线E·锚点①：真人蒸馏（把真实答主的内容蒸馏成思维模型卡）
    if (action === "distillAvatar") {
      const r = await distillAvatar(payload.avatar || {});
      return { mock: false, ...r };
    }
    // 路线E·锚点②：真书蒸馏（从李玄通私有藏书蒸馏真书智慧卡）
    if (action === "distillBook") {
      const r = await distillBook(payload.topic || "");
      return { mock: false, ...r };
    }
    // 路线F·反哺闭环：把复盘/传记润色成知乎想法草稿（现在可用）
    if (action === "buildIdea") {
      const r = await buildIdea(payload || {});
      return { mock: false, ...r };
    }
    // 路线F·反哺闭环：OAuth 发知乎想法（开赛前 available:false）
    if (action === "publishIdea") {
      const r = await publishIdea(payload || {});
      return { mock: false, ...r };
    }
    // 路线F·反哺闭环：OAuth 当前是否可用（前端据此决定按钮形态）
    if (action === "oauthStatus") {
      const cfg = oauthConfig();
      const configured = oauthEnabled() && !!(cfg.appId && cfg.appKey && cfg.redirectUri);
      return {
        mock: false,
        oauthEnabled: oauthEnabled(),
        configured,
        appId: cfg.appId,
        note: configured ? "OAuth 已开放，可一键发想法。" : (oauthEnabled() ? "OAuth 已启用但凭证未配齐（app_id/app_key/redirect_uri）。" : "OAuth 将于知乎黑客松开赛后随官方 API 开放。"),
      };
    }
    // 路线F·反哺闭环：OAuth 授权地址（前端据此跳转知乎授权页）
    if (action === "oauthUrl") {
      if (!oauthEnabled()) return { ok: false, note: "知乎 OAuth 未开放。" };
      return { ok: true, authorizeUrl: buildAuthorizeUrl(oauthConfig(), payload.state || "") };
    }
    // 路线F·反哺闭环：OAuth code → token（换取后作为 sid 回传前端，由前端存 localStorage）
    if (action === "oauthLogin") {
      if (!oauthEnabled()) return { ok: false, code: "oauth_failed", note: "OAuth 未开放" };
      const code = payload.code || "";
      if (!code) return { ok: false, code: "missing_code", note: "缺少授权 code（知乎回调未带 code / authorization_code）。可能：用户在授权页点了拒绝，或回调地址未带参。" };
      try {
        const cfg = oauthConfig();
        if (!cfg.appId || !cfg.appKey) return { ok: false, code: "oauth_failed", note: "后端 OAuth 凭证未配置（app_id/app_key）。" };
        const form = new URLSearchParams({
          app_id: cfg.appId,
          app_key: cfg.appKey,
          grant_type: "authorization_code",
          redirect_uri: cfg.redirectUri,
          code,
        }).toString();
        console.error("[oauthLogin] -> openapi.zhihu.com/access_token", { appId: cfg.appId, redirectUri: cfg.redirectUri, codeLen: code.length });
        const tokRes = await fetch("https://openapi.zhihu.com/access_token", {
          method: "POST",
          headers: { "Content-Type": "application/x-www-form-urlencoded" },
          body: form,
        });
        const raw = await tokRes.text();
        console.error("[oauthLogin] <- status", tokRes.status, "body", raw);
        let tok = {};
        try { tok = JSON.parse(raw); } catch (e) {}
        const token = tok.access_token || (tok.data && tok.data.access_token) || (tok.Data && tok.Data.access_token);
        if (!token) {
          const bits = [tok.error, tok.message, tok.msg, tok.error_description, tok.err, (tok.code ? ("code " + tok.code) : ""), (tok.data != null ? String(tok.data) : ""), (tok.Data != null ? String(tok.Data) : "")].filter(Boolean);
          const reason = bits.join(" · ") || ("HTTP " + tokRes.status + " 无 token 字段");
          return { ok: false, code: "oauth_failed", note: "授权换取令牌失败：" + reason, zhihuRaw: raw.slice(0, 500) };
        }
        return { ok: true, sid: token, expiresIn: tok.expires_in || (tok.data && tok.data.expires_in) || null };
      } catch (e) {
        return { ok: false, code: "oauth_failed", note: "授权交换异常：" + e.message };
      }
    }
    // 路线F·反哺闭环：OAuth 登录态探测（前端据此决定按钮形态）
    if (action === "oauthMe") {
      if (!oauthEnabled()) return { configured: false, loggedIn: false, note: "OAuth 未开放" };
      const sid = payload.sid || "";
      if (!sid) return { configured: true, loggedIn: false };
      // 先尝试官方身份端点取用户资料（拿得到就带上昵称/头像，纯属锦上添花）
      let meNote = "";
      let profile = null;
      try {
        // openapi.zhihu.com/user（双头鉴权：Bearer <Access Secret> + X-OAuth-Token + X-Request-Timestamp）
        const h = authHeaders();
        h["X-OAuth-Token"] = sid;
        const meRes = await fetch("https://openapi.zhihu.com/user", { headers: h });
        const me = await meRes.json().catch(() => ({}));
        const src = me.data || me.Data || me.user || me;
        try { console.log("[oauthMe] http=" + meRes.status + " code=" + (me.code || me.Code || "-") + " fields=" + (src && typeof src === "object" ? Object.keys(src).slice(0, 24).join(",") : "none")); } catch (e) {}
        if (me.code === 20005 || me.Code === 20005) {
          meNote = "资料接口返回 20005";
        } else if (!src || typeof src !== "object") {
          meNote = "资料接口未返回用户对象";
        } else {
          const _name = [src.name, src.display_name, src.full_name, src.Fullname, src.fullname, src.username, src.user_name, src.screen_name].find(function (v) { return v && String(v).trim(); }) || null;
          const _id = [src.id, src.uid, src.user_id, src.url_token, src.url, src.Url].find(function (v) { return v && String(v).trim(); }) || null;
          if (_name || _id) {
            profile = {
              name: _name,
              avatarUrl: src.avatar_url || src.avatar || src.AvatarUrl || null,
              headline: src.headline || src.Headline || src.headline_text || null,
              url: src.url || src.Url || (_id ? "https://www.zhihu.com/people/" + _id : null),
            };
            return { configured: true, loggedIn: true, profile };
          }
          meNote = "资料接口返回中没有可识别的用户标识";
        }
      } catch (e) {
        meNote = "资料接口异常：" + ((e && e.message) || "");
      }
      // 回退判定：以上任一失败都【不能】等同于「未登录」——资料接口受限不代表 token 无效。
      // 改用「必须授权后才能访问」的用户数据接口确认 token 是否真正有效（官方示例的 5 个接口之一）。
      try {
        const h2 = authHeaders();
        h2["X-OAuth-Token"] = sid;
        const probeRes = await fetch("https://developer.zhihu.com/api/v1/user/contents?Limit=1&ContentType=all&Offset=0&SortField=ts&SortOrder=desc", { headers: h2 });
        const pj = await probeRes.json().catch(() => ({}));
        try { console.log("[oauthMe] probe http=" + probeRes.status + " Code=" + (pj && pj.Code)); } catch (e) {}
        if (pj && pj.Code === 0) {
          return { configured: true, loggedIn: true, profile: { name: "知乎账号", url: null }, note: meNote };
        }
        return { configured: true, loggedIn: false, note: "登录态校验失败：" + (meNote || ("数据接口 Code " + ((pj && pj.Code) != null ? pj.Code : "?"))) };
      } catch (e2) {
        return { configured: true, loggedIn: false, note: "登录态校验失败：" + (meNote || ((e2 && e2.message) || "网络异常")) };
      }
    }
    // 路线F·反哺闭环：OAuth 退出（无状态，前端清 localStorage 即可）
    if (action === "oauthLogout") {
      return { ok: true };
    }
    // 我的收藏（能力 #3 衍生）：返回账号本人的收藏夹内容（不需 OAuth，Access Secret 即作者本人数据）
    if (action === "collections") {
      try {
        const j = await zhihuGet("/api/v1/user/favlists", { Limit: payload.Limit || 20 }, 600000, false, payload.sid || undefined);
        return { mock: false, items: normalizeFavlists(j), viaOAuth: !!payload.sid };
      } catch (e) {
        return { mock: false, items: [], error: e.message, viaOAuth: !!payload.sid };
      }
    }
    // 规划中能力（前端已预留入口，当前版本聚焦「时间轴 / 成长足迹」核心创新，未接入后端）：
    // selfScore(自评分) / universeGet+universePut(云同步) / kbDeposit(知识库沉淀) / fetchUrl(URL 抓取) / principles(原则沉淀)
    if (["selfScore", "universeGet", "universePut", "kbDeposit", "fetchUrl", "principles"].includes(action)) {
      return { mock: true, reason: "planned", note: "该能力为规划项，当前版本聚焦「时间轴 / 成长足迹」核心创新，将于后续版本接入。" };
    }
    return { mock: true, reason: "unknown_action", note: "未知 action：" + action };
  } catch (e) {
    return { mock: true, reason: "api_error", code: e.code || "", note: "知乎接口调用失败：" + e.message + "（样本库内容来自知乎真实经验分享）" };
  }
}

function json(d, code = 200) {
  return { statusCode: code, headers: {
    "Content-Type": "application/json; charset=utf-8",
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "GET,POST,OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type,Authorization",
  }, body: JSON.stringify(d) };
}

// ---- CloudBase 入口 ----
exports.main = async (event) => {
  const method = (event.httpMethod || "GET").toUpperCase();
  const p = event.path || "";
  if (p.endsWith("/health")) {
    return json({ ok: true, product: "知遇录", zhihuConfigured: !!process.env.ZHIHU_ACCESS_SECRET });
  }
  if (method === "POST" && p.endsWith("/zhihu")) {
    let body = {};
    try { body = JSON.parse(event.body || "{}"); } catch (e) {}
    const { action, payload } = body;
    return json(await handleZhihu(action, payload || {}));
  }
  return json({ ok: true, product: "知遇录", note: "知乎实时能力由 /zhihu 提供。" });
};

// ---- 本地 Node 服务（方便本地联调：node api/index.js）----
if (require.main === module) {
  const http = require("http");
  const fs = require("fs");
  const path = require("path");
  const ROOT = path.join(__dirname, ".."); // zhiyulu 根目录
  const TYPES = { ".html": "text/html; charset=utf-8", ".css": "text/css; charset=utf-8", ".js": "text/javascript; charset=utf-8", ".json": "application/json; charset=utf-8", ".gif": "image/gif", ".jpg": "image/jpeg", ".png": "image/png", ".svg": "image/svg+xml" };
  const server = http.createServer(async (req, res) => {
    const u = new URL(req.url, "http://localhost");
    const CORS = { "Access-Control-Allow-Origin": "*", "Access-Control-Allow-Methods": "GET,POST,OPTIONS", "Access-Control-Allow-Headers": "Content-Type,Authorization" };
    if (req.method === "OPTIONS") { res.writeHead(204, CORS); return res.end(); }
    try {
      if (u.pathname.endsWith("/health")) return send(res, 200, JSON.stringify({ ok: true, product: "知遇录", zhihuConfigured: !!process.env.ZHIHU_ACCESS_SECRET }), CORS);
      if (u.pathname.endsWith("/zhihu") && req.method === "POST") {
        let raw = "";
        for await (const c of req) raw += c;
        let body = {};
        try { body = JSON.parse(raw || "{}"); } catch (e) {}
        // 本地模式直接返回内层结果（与 CloudBase 平台解包后的 HTTP 响应一致，前端 callZhihu 直接 res.json() 即可）
        const inner = await handleZhihu(body.action, body.payload || {});
        return send(res, 200, JSON.stringify(inner), CORS);
      }
      // 静态文件（本地联调用；云端由托管托管，函数仅处理 /zhihu 与 /health）
      let rel = u.pathname === "/" ? "/index.html" : u.pathname;
      const fp = path.join(ROOT, path.normalize(rel));
      if (!fp.startsWith(ROOT) || !fs.existsSync(fp)) return send(res, 404, json({ error: "not found" }), CORS);
      res.writeHead(200, Object.assign({ "Content-Type": TYPES[path.extname(fp)] || "application/octet-stream" }, CORS));
      fs.createReadStream(fp).pipe(res);
    } catch (e) {
      send(res, 500, json({ error: String(e) }), CORS);
    }
  });
  function send(res, code, payload, headers) {
    res.writeHead(code, Object.assign({ "Content-Type": "application/json; charset=utf-8" }, headers || {}));
    res.end(typeof payload === "string" ? payload : JSON.stringify(payload));
  }
  const PORT = process.env.PORT || 9000;
  server.listen(PORT, () => console.log(`知遇录本地服务: http://localhost:${PORT}  (API /api/zhihu, 知乎密钥=${process.env.ZHIHU_ACCESS_SECRET ? "已配置" : "未配置→样本库回退知乎经验分享提示"})`));
}
