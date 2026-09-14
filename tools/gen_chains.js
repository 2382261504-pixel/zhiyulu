// 生成「知行研究社」全部素材的星链数据 → zhiyulu/assets/js/zhixing-chains.js
// 每条星链 = 一个知识星座（主题）：docx 文件名 = 一颗星，群内按序连成「星链」。
const fs = require("fs");
const path = require("path");

const ROOT = path.join(__dirname, "..", "..", "知行研究社");
const OUT = path.join(__dirname, "..", "assets", "js", "zhixing-chains.js");

// 递归收集 .docx，返回标题（去扩展名）
function walk(dir, acc) {
  for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
    const p = path.join(dir, e.name);
    if (e.isDirectory()) walk(p, acc);
    else if (e.name.toLowerCase().endsWith(".docx")) acc.push(e.name.replace(/\.docx$/i, ""));
  }
  return acc;
}

// 主题分类（按优先级，首命中为准）
const THEMES = [
  { id: "review", name: "复盘系 · 知行方法", color: "#9be39b", kw: ["复盘"] },
  { id: "learn", name: "学习系 · 知行精进", color: "#c9a0ff", kw: ["读书", "学习", "智力", "左右脑", "逻辑力", "高效读"] },
  { id: "wealth", name: "财富系 · 知行挣钱", color: "#6fe3d2", kw: ["挣钱", "钱", "财富", "财商", "复利", "金融", "商业", "营销", "借字", "金钱", "好赚", "变富", "富穷"] },
  { id: "social", name: "人际系 · 知行识人", color: "#8b7bf0", kw: ["社交", "人情", "人际", "处世", "阳谋", "人性", "识人", "聊天", "圈层", "打交道", "情商", "课题分离", "社交本质"] },
  { id: "strong", name: "强者系 · 知行心态", color: "#ff9a8b", kw: ["强者", "心态", "专注", "情绪", "执行力", "时间管理", "狠招", "值钱", "不值钱", "反派", "研究自己", "控制情绪", "奶头乐"] },
  { id: "cogn", name: "认知系 · 知行思维", color: "#7ec8ff", kw: ["思维", "认知", "原理", "视角", "本质", "逻辑", "偏差", "定律", "层次", "现象", "聪明", "智慧", "应变", "系统化", "阿勒泰", "第一性"] },
  { id: "grow", name: "成长系 · 知行觉醒", color: "#f5d27a", kw: ["成长", "变强", "觉醒", "提升", "逆袭", "苦", "坚持", "能量", "废", "开悟", "境界", "天赋", "临界", "接纳", "屏蔽", "感受", "人生", "自我", "清醒"] },
];
const OTHER = { id: "other", name: "杂览系 · 知行其他", color: "#ffd27a", kw: [] };

function classify(title) {
  for (const t of THEMES) if (t.kw.some((k) => title.includes(k))) return t;
  return OTHER;
}

//  serpentine 布局：把 n 颗星铺成回字形星链
function layout(n) {
  const perRow = Math.max(1, Math.ceil(Math.sqrt(n * 1.5)));
  const rows = Math.ceil(n / perRow);
  const sx = 84 / perRow, sy = 84 / rows;
  const pts = [];
  for (let i = 0; i < n; i++) {
    const r = Math.floor(i / perRow), c = i % perRow;
    const cc = r % 2 ? perRow - 1 - c : c;
    const x = Math.max(6, Math.min(94, 8 + cc * sx + sx / 2));
    const y = Math.max(6, Math.min(94, 8 + r * sy + sy / 2));
    pts.push({ lx: +x.toFixed(1), ly: +y.toFixed(1) });
  }
  return pts;
}

const titles = walk(ROOT, []).filter((t, i, a) => a.indexOf(t) === i).sort();
const buckets = {};
titles.forEach((t) => {
  const th = classify(t);
  (buckets[th.id] = buckets[th.id] || { theme: th, items: [] }).items.push(t);
});

const chains = Object.values(buckets).map(({ theme, items }) => {
  const pts = layout(items.length);
  const stars = items.map((label, i) => ({
    id: theme.id + "_" + i,
    label,
    lx: pts[i].lx,
    ly: pts[i].ly,
  }));
  const links = [];
  for (let i = 0; i < stars.length - 1; i++) links.push([stars[i].id, stars[i + 1].id]);
  return { id: "zhixing-" + theme.id, name: theme.name, color: theme.color, desc: "知行研究社「" + theme.name + "」的 " + stars.length + " 颗知识星，连成一条星链。", stars, links };
});

const js = "// 自动生成：知行研究社全部素材 → 星链。勿手改，由 tools/gen_chains.js 生成。\n"
  + "window.ZHIXING_CHAINS = " + JSON.stringify(chains, null, 2) + ";\n";
fs.writeFileSync(OUT, js, "utf8");
console.log("wrote", OUT);
console.log("chains:", chains.length, "stars:", titles.length);
chains.forEach((c) => console.log("  -", c.name, c.stars.length));
