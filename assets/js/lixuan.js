/* 刘看山 · 东方玄学引擎（前端模块，零依赖）
 * 单一对话框：刘看山以东方玄学视角灵活作答，脱离五术门类与硬命盘卡片（原"看格局"类命盘 UI 已移除）。
 * 用户怎么问他就怎么答；生辰若已存或能从对话解析，一并交后端，由他据实排盘、在对话里自然引用。
 * 排版与读盘结论统一经 window.ZY 桥接（app.js 暴露 callZhihu / appendMsg / escHTML）。
 * 全部娱乐向，不作决策凭据。
 */
(function () {
  "use strict";

  const GAN = ["甲","乙","丙","丁","戊","己","庚","辛","壬","癸"];
  const ZHI = ["子","丑","寅","卯","辰","巳","午","未","申","酉","戌","亥"];
  const GAN_WX = ["木","木","火","火","土","土","金","金","水","水"];
  const ZHI_WX = ["水","土","木","木","土","火","火","土","金","金","土","水"];
  const WX = ["木","火","土","金","水"];
  const WX_COLOR = { 木:"#7fe3c4", 火:"#f0886a", 土:"#f5c45e", 金:"#cdd6e4", 水:"#6db4f0" };
  const SHICHEN = ["子时 23-01","丑时 01-03","寅时 03-05","卯时 05-07","辰时 07-09","巳时 09-11","午时 11-13","未时 13-15","申时 15-17","酉时 17-19","戌时 19-21","亥时 21-23"];

  const TERM_C = { 1:5.4055, 2:4.6295, 3:5.63, 4:4.81, 5:5.52, 6:5.678, 7:7.108, 8:7.5, 9:7.646, 10:8.318, 11:7.438, 12:7.18 };
  function julian(y, m, d) {
    const a = Math.floor((14 - m) / 12);
    const yy = y + 4800 - a, mm = m + 12 * a - 3;
    return d + Math.floor((153 * mm + 2) / 5) + 365 * yy + Math.floor(yy / 4) - Math.floor(yy / 100) + Math.floor(yy / 400) - 32045;
  }
  function termDate(y, month, C) {
    const Y = y % 100;
    let day = Math.floor(Y * 0.2422 + C) - Math.floor(Y / 4);
    return new Date(y, month - 1, day);
  }
  function monthZhi(y, m, d) {
    const lichun = termDate(y, 2, TERM_C[2]), jingzhe = termDate(y, 3, TERM_C[3]),
      qingming = termDate(y, 4, TERM_C[4]), lixia = termDate(y, 5, TERM_C[5]),
      mangzhong = termDate(y, 6, TERM_C[6]), xiaoshu = termDate(y, 7, TERM_C[7]),
      liqiu = termDate(y, 8, TERM_C[8]), bailu = termDate(y, 9, TERM_C[9]),
      hanlu = termDate(y, 10, TERM_C[10]), lidong = termDate(y, 11, TERM_C[11]),
      daxue = termDate(y, 12, TERM_C[12]), xiaohan = termDate(y, 1, TERM_C[1]),
      daxuePrev = termDate(y - 1, 12, TERM_C[12]);
    const cur = new Date(y, m - 1, d);
    if (cur >= daxuePrev && cur < xiaohan) return 0;
    if (cur >= xiaohan && cur < lichun) return 1;
    if (cur >= lichun && cur < jingzhe) return 2;
    if (cur >= jingzhe && cur < qingming) return 3;
    if (cur >= qingming && cur < lixia) return 4;
    if (cur >= lixia && cur < mangzhong) return 5;
    if (cur >= mangzhong && cur < xiaoshu) return 6;
    if (cur >= xiaoshu && cur < liqiu) return 7;
    if (cur >= liqiu && cur < bailu) return 8;
    if (cur >= bailu && cur < hanlu) return 9;
    if (cur >= hanlu && cur < lidong) return 10;
    if (cur >= lidong && cur < daxue) return 11;
    return 0;
  }
  function yearGZ(y, m, d) {
    const lichun = termDate(y, 2, TERM_C[2]);
    const adj = (new Date(y, m - 1, d) >= lichun) ? y : y - 1;
    const idx = ((adj - 4) % 60 + 60) % 60;
    return { g: idx % 10, z: idx % 12 };
  }
  function monthGan(yG, mZhi) {
    const base = [2, 4, 6, 8, 0][yG % 5];
    const fromYin = (mZhi - 2 + 12) % 12;
    return (base + fromYin) % 10;
  }
  function shiShen(dayG, tG) {
    const dwx = GAN_WX[dayG], twx = GAN_WX[tG];
    const dY = dayG % 2 === 0, tY = tG % 2 === 0;
    if (dwx === twx) return dY === tY ? "比肩" : "劫财";
    if (WX[(WX.indexOf(dwx) + 4) % 5] === twx) return dY === tY ? "偏印" : "正印";
    if (WX[(WX.indexOf(dwx) + 1) % 5] === twx) return dY === tY ? "食神" : "伤官";
    if (WX[(WX.indexOf(dwx) + 2) % 5] === twx) return dY === tY ? "偏财" : "正财";
    if (WX[(WX.indexOf(dwx) + 3) % 5] === twx) return dY === tY ? "偏官(七杀)" : "正官";
    return "—";
  }

  function buildBazi(y, m, d, hZhi) {
    const yIdx = (((y - 4) % 60) + 60) % 60;
    const yG = yIdx % 10, yZ = yIdx % 12;
    const mZ = monthZhi(y, m, d);
    const mG = monthGan(yG, mZ);
    const jdn = julian(y, m, d);
    const dIdx = (((jdn + 49) % 60) + 60) % 60;
    const dG = dIdx % 10, dZ = dIdx % 12;
    const hG = (((dG * 2 + hZhi) % 10) + 10) % 10;
    return { yG, yZ, mG, mZ, dG, dZ, hG, hZhi, dayMaster: dG };
  }
  function wxCount(b) {
    const c = { 木:0, 火:0, 土:0, 金:0, 水:0 };
    [b.yG, b.mG, b.dG, b.hG].forEach((g) => c[GAN_WX[g]]++);
    [b.yZ, b.mZ, b.dZ, b.hZhi].forEach((z) => c[ZHI_WX[z]]++);
    return c;
  }
  function dayMasterStrength(b) {
    const dm = b.dayMaster; let support = 0, drain = 0;
    [b.yG, b.mG, b.dG, b.hG].forEach((g) => {
      if (GAN_WX[g] === GAN_WX[dm]) support += 1;
      if (WX[(WX.indexOf(GAN_WX[dm]) + 4) % 5] === GAN_WX[g]) support += 0.8;
      if (WX[(WX.indexOf(GAN_WX[dm]) + 1) % 5] === GAN_WX[g]) drain += 0.7;
      if (WX[(WX.indexOf(GAN_WX[dm]) + 2) % 5] === GAN_WX[g]) drain += 0.7;
      if (WX[(WX.indexOf(GAN_WX[dm]) + 3) % 5] === GAN_WX[g]) drain += 0.8;
    });
    return support >= drain ? "偏强" : "偏弱";
  }
  function ziweiPalace(m, hZhi) {
    const m1 = ((m + 11) % 12 + 12) % 12;
    const h1 = hZhi + 1;
    let num = 14 - m1 - h1;
    while (num <= 0) num += 12;
    while (num > 12) num -= 12;
    const zhiIdx = (num - 1 + 12) % 12;
    const zhi = ZHI[zhiIdx], wx = ZHI_WX[zhiIdx];
    const img = {
      木: "进取生发，像春木抽枝，宜向外拓展、学习新事物。",
      火: "热情表达，像炉火照人，宜用表达与影响力成事，留意急躁。",
      土: "稳重承载，像大地托物，宜把事做扎实、积累信任。",
      金: "果决收敛，像刀锋有度，宜定标准、做判断，留意过刚。",
      水: "流动智慧，像水顺势，宜借势、沟通、灵活转身。",
    }[wx];
    return { zhi, wx, img, star: { 木:"天机", 火:"太阳", 土:"天府", 金:"武曲", 水:"太阴" }[wx] };
  }
  function xiYong(dG, strength) {
    const wxIdx = WX.indexOf(GAN_WX[dG]); const set = new Set();
    if (strength === "偏弱" || strength === "中和") { set.add(WX[wxIdx]); set.add(WX[(wxIdx + 4) % 5]); }
    else { set.add(WX[(wxIdx + 2) % 5]); set.add(WX[(wxIdx + 1) % 5]); set.add(WX[(wxIdx + 3) % 5]); }
    return [...set];
  }
  function computeBazi(y, m, d, hZhi) {
    const b = buildBazi(y, m, d, hZhi);
    const dm = GAN[b.dayMaster], dmWx = GAN_WX[b.dayMaster];
    const strength = dayMasterStrength(b);
    const wx = wxCount(b);
    const ziw = ziweiPalace(m, hZhi);
    const pillars = [
      { col: "年柱", gan: GAN[b.yG], zhi: ZHI[b.yZ], ss: "——" },
      { col: "月柱", gan: GAN[b.mG], zhi: ZHI[b.mZ], ss: shiShen(b.dayMaster, b.mG) },
      { col: "日柱", gan: GAN[b.dG], zhi: ZHI[b.dZ], ss: "日主" },
      { col: "时柱", gan: GAN[b.hG], zhi: ZHI[b.hZhi], ss: shiShen(b.dayMaster, b.hG) },
    ];
    return {
      kind: "bazi", birth: { y, m, d, hZhi },
      pillars, dayMaster: { gan: dm, wx: dmWx, strength },
      wx, xiYong: xiYong(b.dayMaster, strength),
      ziwei: { zhi: ziw.zhi, wx: ziw.wx, star: ziw.star, img: ziw.img },
      note: "立春校正排盘（前端近似）·娱乐向，仅作自我觉察参考，不作决策凭据。",
    };
  }

  const BAGUA = [
    { n: "乾", wx: "金", yi: "刚健主动，诸事开端有力，宜果决前行。" },
    { n: "兑", wx: "金", yi: "悦泽交流，利口才与协作，防言多必失。" },
    { n: "离", wx: "火", yi: "明丽附丽，利声名与表达，防浮光掠影。" },
    { n: "震", wx: "木", yi: "震动奋起，事有变动之机，宜主动破局。" },
    { n: "巽", wx: "木", yi: "顺入随风，宜渐进渗透、借势而行。" },
    { n: "坎", wx: "水", yi: "险陷流动，事有坎需谨慎，宜守正渡难关。" },
    { n: "艮", wx: "土", yi: "静止如山，宜止、宜沉淀、宜定计划。" },
    { n: "坤", wx: "土", yi: "厚载包容，宜顺势积累、以柔克刚。" },
  ];
  function hexName(u, l) { return u === l ? BAGUA[u].n + "为" + BAGUA[u].n : "上" + BAGUA[u].n + "下" + BAGUA[l].n; }
  function meihua(y, m, d, hZhi) {
    const yg = (((y % 12) + 12) % 12);
    const upper = (((yg + m + d) % 8) + 8) % 8;
    const lower = (((yg + m + d + hZhi) % 8) + 8) % 8;
    const dong = (((yg + m + d + hZhi) % 6) + 6) % 6 + 1;
    let lBits = (7 - lower), uBits = (7 - upper);
    if (dong <= 3) lBits ^= (1 << (dong - 1)); else uBits ^= (1 << (dong - 4));
    const nLower = (7 - lBits), nUpper = (7 - uBits);
    return { kind: "meihua", upper, lower, dong, ben: hexName(upper, lower), bian: hexName(nUpper, nLower),
      yi: BAGUA[upper].yi, ti: lower, yong: upper, tiWx: BAGUA[lower].wx, yongWx: BAGUA[upper].wx };
  }

  function monthGeneralZhi(y, m, d) {
    const t = (mo) => termDate(y, mo, TERM_C[mo]);
    const order = [
      [t(1), "子"], [t(2), "亥"], [t(3), "戌"], [t(4), "酉"], [t(5), "申"], [t(6), "未"],
      [t(7), "午"], [t(8), "巳"], [t(9), "辰"], [t(10), "卯"], [t(11), "寅"], [t(12), "丑"],
    ];
    let gen = "子";
    const cur = new Date(y, m - 1, d);
    for (const [dt, z] of order) { if (cur >= dt) gen = z; }
    return ZHI.indexOf(gen);
  }
  const TIANGAN_JI = { 甲: "寅", 乙: "辰", 丙: "巳", 丁: "未", 戊: "巳", 己: "未", 庚: "申", 辛: "戌", 壬: "亥", 癸: "丑" };
  function sixRen(y, m, d, hZhi) {
    const b = buildBazi(y, m, d, hZhi);
    const dayG = b.dG, dayZ = b.dZ;
    const pIdx = monthGeneralZhi(y, m, d);
    const zhiPos = (z) => ZHI.indexOf(z);
    const tp = [];
    for (let pos = 0; pos < 12; pos++) tp[pos] = ZHI[(pIdx + (pos - hZhi) + 36) % 12];
    const ganZhi = TIANGAN_JI[GAN[dayG]];
    const ganPos = zhiPos(ganZhi), dayZPos = dayZ;
    const k1z = tp[ganPos], k2z = tp[zhiPos(k1z)], k3z = tp[dayZPos], k4z = tp[zhiPos(k3z)];
    const sixQin = (z) => {
      const dwx = GAN_WX[dayG], zwx = ZHI_WX[z];
      if (dwx === zwx) return "比肩";
      if (WX[(WX.indexOf(dwx) + 4) % 5] === zwx) return "印";
      if (WX[(WX.indexOf(dwx) + 1) % 5] === zwx) return "食伤";
      if (WX[(WX.indexOf(dwx) + 2) % 5] === zwx) return "财";
      if (WX[(WX.indexOf(dwx) + 3) % 5] === zwx) return "官杀";
      return "—";
    };
    const ke = (a, b) => WX[(WX.indexOf(ZHI_WX[a]) + 2) % 5] === ZHI_WX[b];
    let first = null;
    if (ke(k2z, k1z)) first = k2z;
    else if (ke(k4z, k3z)) first = k4z;
    else if (ke(k1z, GAN[dayG])) first = k1z;
    else if (ke(k3z, dayZ)) first = k3z;
    let chuan;
    if (first !== null) chuan = [first, ZHI[(ZHI.indexOf(first) + 1) % 12], ZHI[(ZHI.indexOf(first) + 2) % 12]];
    else chuan = [k1z, k2z, k3z];
    const dayGanYang = dayG % 2 === 0;
    const guiMap = dayGanYang
      ? { 甲:"丑",戊:"丑",庚:"丑", 乙:"申",己:"子", 丙:"亥",丁:"亥",壬:"巳",癸:"巳",辛:"寅" }
      : { 甲:"未",戊:"未",庚:"未", 乙:"申",己:"子", 丙:"酉",丁:"酉",壬:"巳",癸:"卯",辛:"寅" };
    const guiZhi = guiMap[GAN[dayG]];
    const tianJiang = ["贵人","螣蛇","朱雀","六合","勾陈","青龙","天空","白虎","太常","玄武","太阴","天后"];
    const guiPos = zhiPos(guiZhi);
    const tj = new Array(12).fill("");
    const isDay = hZhi >= 3 && hZhi <= 8;
    for (let i = 0; i < 12; i++) tj[(isDay ? (guiPos + i) % 12 : (guiPos - i + 12) % 12)] = tianJiang[i];
    return {
      kind: "sixren", birth: { y, m, d, hZhi },
      monthGeneral: ZHI[pIdx], diPan: ZHI.slice(), tianPan: tp.slice(),
      fourKe: [
        { name: "第一课·干上", zhi: k1z, qin: sixQin(k1z) },
        { name: "第二课·干阴", zhi: k2z, qin: sixQin(k2z) },
        { name: "第三课·支上", zhi: k3z, qin: sixQin(k3z) },
        { name: "第四课·支阴", zhi: k4z, qin: sixQin(k4z) },
      ],
      sanChuan: chuan.map((z, i) => ({ idx: i + 1, zhi: z, qin: sixQin(z) })),
      tianJiang: tj.slice(),
      note: "六壬排盘（前端近似·九宗门取贼克法）·娱乐向，不作决策凭据。",
    };
  }

  const JIEQI_JU = [
    [1,1],[1,1],[1,1],[1,1],[1,1],[1,1],
    [1,2],[1,2],[1,2],[1,3],[1,3],[1,3],
    [0,9],[0,9],[0,9],[0,9],[0,9],[0,9],
    [0,8],[0,8],[0,8],[0,7],[0,7],[0,7],
  ];
  function jieqiIndex(m) {
    const idxByMonth = { 1:1,2:3,3:5,4:7,5:9,6:11,7:13,8:15,9:17,10:19,11:21,12:23 };
    return idxByMonth[m] !== undefined ? idxByMonth[m] : 0;
  }
  const WUXING_STAR = ["蓬","芮","冲","辅","禽","心","柱","任","英"];
  const BAMEN = ["休","生","伤","杜","景","死","惊","开"];
  const BA_SHEN = ["值符","螣蛇","太阴","六合","白虎","玄武","九地","九天"];
  function qiMen(y, m, d, hZhi) {
    const ji = jieqiIndex(m);
    const yin = JIEQI_JU[ji][0], juBase = JIEQI_JU[ji][1];
    const ju = yin === 1 ? juBase : (10 - juBase);
    const seq = ["戊","己","庚","辛","壬","癸","丁","丙","乙"];
    const diPan = new Array(9).fill("");
    const start = ju;
    for (let i = 0; i < 9; i++) {
      const gong = yin === 1 ? ((start - 1 + i) % 9) : ((start - 1 - i + 18) % 9);
      diPan[gong] = seq[i];
    }
    const b = buildBazi(y, m, d, hZhi);
    const dayG = b.dG;
    const dayGong = diPan.indexOf(GAN[dayG]) >= 0 ? diPan.indexOf(GAN[dayG]) : 0;
    const tianPanStar = new Array(9).fill("");
    for (let i = 0; i < 9; i++) tianPanStar[(dayGong + i) % 9] = WUXING_STAR[i];
    const baMen = new Array(9).fill("");
    const menStart = hZhi % 8;
    for (let i = 0; i < 8; i++) baMen[(menStart + i) % 8] = BAMEN[i];
    const shen = new Array(9).fill("");
    for (let i = 0; i < 8; i++) shen[yin === 1 ? (dayGong + i) % 8 : (dayGong - i + 16) % 8] = BA_SHEN[i];
    return {
      kind: "qimen", birth: { y, m, d, hZhi },
      dun: yin === 1 ? "阳遁" : "阴遁", ju: yin === 1 ? juBase : ju,
      diPan, tianPanStar, baMen, shen,
      note: "奇门排盘（前端近似·节气局数简化）·娱乐向，不作决策凭据。",
    };
  }

  function taiYi(y, m, d, hZhi) {
    const jiYear = y + 1015389 + 270;
    const taiyi = ((jiYear % 360) % 8) + 1;
    const wenChang = ((taiyi + 1) % 8) + 1;
    const shiJi = ((taiyi + 3) % 8) + 1;
    const guestCalc = (taiyi * 3 + 7) % 9;
    const hostCalc = (taiyi * 2 + 5) % 9;
    return {
      kind: "taiyi", birth: { y, m, d, hZhi },
      taiyi, wenChang, shiJi, guestCalc, hostCalc,
      note: "太乙神数（前端简化式·积年法近似）·娱乐向，不作决策凭据。",
    };
  }

  function esc(s) { return String(s == null ? "" : s).replace(/[&<>]/g, (c) => ({ "&":"&amp;","<":"&lt;",">":"&gt;" }[c])); }
  function meihuaHTML(g) {
    return `<div class="lx-chart lx-gua">
      <div class="lx-chart-h">☯ 梅花易数 · 时间起卦</div>
      <div class="lx-row"><span class="k">本卦</span><span class="v">${g.ben}</span></div>
      <div class="lx-row"><span class="k">变卦</span><span class="v">${g.bian}</span></div>
      <div class="lx-row"><span class="k">动爻</span><span class="v">第 ${g.dong} 爻</span></div>
      <div class="lx-row"><span class="k">体用</span><span class="v">${BAGUA[g.ti].n}（${g.tiWx}·体/我）× ${BAGUA[g.yong].n}（${g.yongWx}·用/事）</span></div>
      <div class="lx-zi">${esc(g.yi)}</div></div>`;
  }
  function sixRenHTML(r) {
    const k = r.fourKe.map((x) => `<div class="lx-k"><span class="lx-k-n">${x.name}</span><b>${x.zhi}</b><i>${x.qin}</i></div>`).join("");
    const c = r.sanChuan.map((x) => `<div class="lx-k"><span class="lx-k-n">第${x.idx}传</span><b>${x.zhi}</b><i>${x.qin}</i></div>`).join("");
    const tj = r.tianJiang.map((t, i) => `<span class="lx-tj">${ZHI[i]}宫·${t}</span>`).join(" ");
    return `<div class="lx-chart">
      <div class="lx-chart-h">☯ 大六壬 · 月将${r.monthGeneral}</div>
      <div class="lx-sub">四课</div><div class="lx-kes">${k}</div>
      <div class="lx-sub">三传</div><div class="lx-kes">${c}</div>
      <div class="lx-sub">十二天将（落宫）</div><div class="lx-tjs">${tj}</div>
      <div class="lx-note">${esc(r.note)}</div></div>`;
  }
  function qiMenHTML(q) {
    const gong = (g) => `<div class="lx-gong"><div class="lx-gn">${g + 1}宫</div>
      <div class="lx-dp">${q.diPan[g] || ""}</div>
      <div class="lx-star">${q.tianPanStar[g] || ""}</div>
      <div class="lx-men">${q.baMen[g] || ""}</div>
      <div class="lx-shen">${q.shen[g] || ""}</div></div>`;
    let grid = "";
    for (let g = 0; g < 9; g++) grid += gong(g);
    return `<div class="lx-chart">
      <div class="lx-chart-h">☯ 奇门遁甲 · ${q.dun}${q.ju}局</div>
      <div class="lx-qm-grid">${grid}</div>
      <div class="lx-note">${esc(q.note)}</div></div>`;
  }
  function taiYiHTML(t) {
    return `<div class="lx-chart">
      <div class="lx-chart-h">☯ 太乙神数</div>
      <div class="lx-rows">
        <div class="lx-row"><span class="k">太乙</span><span class="v">${t.taiyi} 宫</span></div>
        <div class="lx-row"><span class="k">文昌</span><span class="v">${t.wenChang} 宫</span></div>
        <div class="lx-row"><span class="k">始击</span><span class="v">${t.shiJi} 宫</span></div>
        <div class="lx-row"><span class="k">客算</span><span class="v">${t.guestCalc}</span></div>
        <div class="lx-row"><span class="k">主算</span><span class="v">${t.hostCalc}</span></div>
      </div>
      <div class="lx-note">${esc(t.note)}</div></div>`;
  }
  function chartHTML(c) {
    if (!c) return "";
    if (c.kind === "meihua") return meihuaHTML(c);
    if (c.kind === "sixren") return sixRenHTML(c);
    if (c.kind === "qimen") return qiMenHTML(c);
    if (c.kind === "taiyi") return taiYiHTML(c);
    return "";
  }

  function parseBirth(text) {
    const dm = (text || "").match(/(\d{4})\s*[年\-\/]\s*(\d{1,2})\s*[月\-\/]\s*(\d{1,2})/);
    if (!dm) return null;
    const y = +dm[1], m = +dm[2], d = +dm[3];
    if (y < 1900 || y > 2100 || m < 1 || m > 12 || d < 1 || d > 31) return null;
    let h = null;
    const sh = (text || "").match(/(子|丑|寅|卯|辰|巳|午|未|申|酉|戌|亥)\s*时/);
    if (sh) h = ZHI.indexOf(sh[1]) * 2;
    else { const tm = (text || "").match(/(\d{1,2}):(\d{2})/); if (tm) h = +tm[1]; }
    if (h == null) h = 12;
    return { y, m, d, h, hZhi: Math.floor(((h == null ? 12 : h) + 1) / 2) % 12 };
  }
  function withHLabel(b) { if (b && b.hZhi != null && b.hLabel == null) b.hLabel = SHICHEN[b.hZhi].slice(0, 2); return b; }
  function localCompute(type, birth) {
    const hZhi = birth.hZhi != null ? birth.hZhi : Math.floor(((birth.h || 12) + 1) / 2) % 12;
    if (type === "bazi" || type === "ziwei") return computeBazi(birth.y, birth.m, birth.d, hZhi);
    if (type === "meihua") { const n = new Date(); return meihua(n.getFullYear(), n.getMonth() + 1, n.getDate(), hZhi); }
    if (type === "sixren") return sixRen(birth.y, birth.m, birth.d, hZhi);
    if (type === "qimen") return qiMen(birth.y, birth.m, birth.d, hZhi);
    if (type === "taiyi") return taiYi(birth.y, birth.m, birth.d, hZhi);
    return null;
  }
  function factsFor(type, birth) {
    const c = localCompute(type, birth);
    if (!c) return "";
    if (c.kind === "bazi") return `四柱：年${GAN[c.pillars[0].gan]}${ZHI[c.pillars[0].zhi]} 月${GAN[c.pillars[1].gan]}${ZHI[c.pillars[1].zhi]} 日${GAN[c.pillars[2].gan]}${ZHI[c.pillars[2].zhi]}(日主) 时${GAN[c.pillars[3].gan]}${ZHI[c.pillars[3].zhi]}；日主${c.dayMaster.gan}(${c.dayMaster.wx})偏${c.dayMaster.strength === "偏强" ? "旺" : "弱"}；紫微命宫${c.ziwei.zhi}(${c.ziwei.wx})。`;
    if (c.kind === "sixren") return `大六壬：月将${c.monthGeneral}；四课${c.fourKe.map((k) => k.zhi).join("")}；三传${c.sanChuan.map((k) => k.zhi).join("")}。`;
    if (c.kind === "qimen") { const dg = buildBazi(birth.y, birth.m, birth.d, birth.hZhi).dG; const dg2 = c.diPan.indexOf(GAN[dg]); return `奇门：${c.dun}${c.ju}局；日干${GAN[dg]}落${dg2 >= 0 ? dg2 + 1 : 0}宫。`; }
    if (c.kind === "taiyi") return `太乙：${c.taiyi}宫；文昌${c.wenChang}宫；始击${c.shiJi}宫。`;
    return "";
  }

    function mount(panelEl, opts) {
    opts = opts || {};
    const ZY = window.ZY || {};
    const callZhihu = ZY.callZhihu || (() => Promise.resolve({ mock: true }));
    const SP = opts.speaker || "刘看山";
    const loadBirth = ZY.loadBirth || (() => null);
    const saveBirth = ZY.saveBirth || (() => {});
    const cid = opts.chatId || "lxChat";

    panelEl.innerHTML = `
      <div class="lx-intro muted">刘看山以东方智慧的视角，陪你做自我觉察的趣味参考（娱乐向、不作决策凭据）。
      就这一个对话框——事业、关系、心境、眼前的选择、想看看自己的格局，想到什么说什么：他顺着你的问题灵活作答，不套模板、不硬分门类。</div>
      <div class="card lx-card">
        <div class="chat" id="${cid}"></div>
        <div class="row" style="margin-top:10px">
          <input id="lxInput" placeholder="想问刘看山什么？直接说就好…" />
          <button id="lxSend">发送</button>
        </div>
      </div>`;

    // 跨模块持久化（复用全局对话状态层）：切走再切回不丢对话与思考态
    if (ZY.renderChat) ZY.renderChat(cid);
    if (ZY.chatGet && ZY.chatGet(cid).msgs.length === 0) {
      ZY.chatAppend(cid, { s: "liu", t: opts.simple
        ? "想跟刘看山聊什么？就这一个对话框，慢慢说，他在听。"
        : "想跟刘看山聊什么？直接在下面的对话框说——事业、关系、心境、眼前的选择，或想看看自己的格局。你怎么问，他怎么答；不套模板、不硬分门类。", who: SP });
    }

    async function askLixuan(text, birth) {
      ZY.chatAppend(cid, { s: "user", t: text, who: "你" });
      // 刘看山灵活作答：生辰（若能从对话解析或已存）一并交给后端，由他在对话里自然引用，不再弹出命盘卡片
      const b = (birth && birth.y) ? birth : (parseBirth(text) || loadBirth());
      ZY.chatSetPending(cid, true, SP);
      const r = await callZhihu("lixuan", { q: text, birth: (b && b.y) ? b : null, fresh: true, kb: !!localStorage.getItem("zhiyu_kb_ok") });
      ZY.chatSetPending(cid, false);
      if (r && r.content) {
        const msg = { s: "liu", t: r.content, who: SP };
        if (r.refs && r.refs.length) msg.refs = r.refs;
        // 双源结构化参考（知乎 / 全网）：带上后由 app.js 的 liuRefsHTML 分两块渲染，
        // 避免只拿上面那个「知乎标题 concat 全网标题」的混合数组导致两类资料混排。
        if (r.refsZhihu && r.refsZhihu.length) msg.refsZhihu = r.refsZhihu;
        if (r.refsGlobal && r.refsGlobal.length) msg.refsGlobal = r.refsGlobal;
        if (r.liveSources && r.liveSources.length) msg.sources = r.liveSources;
        ZY.chatAppend(cid, msg);
      } else {
        const _last = (ZY.chatGet && ZY.chatGet(cid) && ZY.chatGet(cid).msgs.slice(-1)[0]);
        const _fb = "刘看山：刚那一下网络绕了点路，没连上。你再发一次，或把生辰、眼下所问之事说清，他替你重排一盘、回头再断。";
        const _dup = _last && _last.s === "liu" && (String(_last.t || "").indexOf("网络绕了点路") >= 0);
        if (!_dup) ZY.chatAppend(cid, { s: "liu", t: _fb, who: SP });
      }
    }
    const send = () => {
      const inp = panelEl.querySelector("#lxInput");
      const t = inp.value.trim();
      if (!t) return;
      inp.value = "";
      // 文本若含生辰，自动解析并保存，下次刘看山据此排盘
      const parsed = parseBirth(t);
      let b = loadBirth();
      if (parsed && parsed.y) { b = parsed; saveBirth(b); }
      askLixuan(t, b);
    };
    panelEl.querySelector("#lxSend").onclick = send;
    panelEl.querySelector("#lxInput").addEventListener("keydown", (e) => { if (e.key === "Enter") send(); });
  }

  window.ZhiYuLixuan = { mount, computeBazi, meihua, sixRen, qiMen, taiYi };
})();
