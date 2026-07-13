import { useState, useEffect, useRef, useCallback } from "react";
import { loadData, saveData } from "./storage";

/* ============================================================
   SVN 適性ドリル道場
   検査S（空間判断）・V（言語）・N（数理）を毎日60秒ずつ鍛える
   デザイン: 答案用紙×赤ペン採点
   tokens: paper #FAFAF9 / rule #DCE3EE / ink #1C2B45 /
           sub #5A6B85 / 朱 #C73E2E
   ============================================================ */

const INK = "#1C2B45";
const SUB = "#5A6B85";
const RED = "#C73E2E";
const PAPER = "#FAFAF9";
const RULE = "#DCE3EE";
const DRILL_SEC = 60;

/* ---------- 共通ユーティリティ ---------- */
const rnd = (n) => Math.floor(Math.random() * n);
const pick = (arr) => arr[rnd(arr.length)];
const shuffle = (arr) => {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = rnd(i + 1);
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
};
const todayStr = () => {
  const d = new Date();
  const p = (n) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}`;
};

/* ---------- 永続ストレージ ----------
   実装は src/storage.js（localStorage）を参照。
   バックエンド化する場合も storage.js だけ差し替えればよい。 */

/* ============================================================
   検査N：数理（計算スピード）
   ============================================================ */
function genN(idx) {
  const hard = idx >= 8;
  const op = pick(hard ? ["+", "-", "×", "÷"] : ["+", "-", "×"]);
  let a, b, ans;
  if (op === "+") {
    a = 12 + rnd(hard ? 88 : 40);
    b = 13 + rnd(hard ? 88 : 40);
    ans = a + b;
  } else if (op === "-") {
    a = 30 + rnd(hard ? 90 : 50);
    b = 11 + rnd(a - 12);
    ans = a - b;
  } else if (op === "×") {
    a = 3 + rnd(hard ? 14 : 7);
    b = 3 + rnd(hard ? 10 : 7);
    ans = a * b;
  } else {
    b = 3 + rnd(9);
    ans = 4 + rnd(12);
    a = b * ans;
  }
  const set = new Set([ans]);
  while (set.size < 4) {
    const d = ans + (rnd(2) ? 1 : -1) * (1 + rnd(hard ? 12 : 8));
    if (d > 0) set.add(d);
  }
  const choices = shuffle([...set]);
  return {
    kind: "N",
    text: `${a} ${op} ${b} =`,
    choices: choices.map(String),
    answer: choices.indexOf(ans),
  };
}

/* ============================================================
   検査V：言語（類義語・反対語）※オリジナル問題バンク
   ============================================================ */
const V_BANK = [
  ["類", "寄与", "貢献", ["妥協", "回避", "蓄積"]],
  ["類", "是認", "承認", ["否認", "棚上げ", "黙殺"]],
  ["類", "傍観", "座視", ["介入", "率先", "監督"]],
  ["類", "委細", "詳細", ["概略", "大要", "簡略"]],
  ["類", "恒久", "永久", ["一時", "瞬間", "暫定"]],
  ["類", "拮抗", "伯仲", ["圧倒", "独走", "追従"]],
  ["類", "廉価", "安価", ["高価", "定価", "時価"]],
  ["類", "概略", "大要", ["詳細", "精密", "仔細"]],
  ["類", "双璧", "両雄", ["孤高", "末席", "凡庸"]],
  ["類", "腐心", "苦心", ["安逸", "放念", "無心"]],
  ["類", "激励", "鼓舞", ["叱責", "抑制", "慰留"]],
  ["類", "露骨", "あからさま", ["婉曲", "暗示", "含み"]],
  ["類", "束縛", "拘束", ["解放", "放任", "自由"]],
  ["類", "手腕", "力量", ["手間", "手順", "手本"]],
  ["類", "意図", "思惑", ["偶然", "成行", "結末"]],
  ["類", "対価", "報酬", ["負債", "元金", "寄付"]],
  ["類", "携行", "携帯", ["保管", "放置", "預託"]],
  ["類", "動転", "仰天", ["平然", "冷静", "沈着"]],
  ["類", "簡潔", "簡明", ["冗長", "複雑", "丁寧"]],
  ["類", "露見", "発覚", ["隠蔽", "潜伏", "偽装"]],
  ["反", "需要", "供給", ["要求", "消費", "購買"]],
  ["反", "抽象", "具体", ["観念", "象徴", "仮想"]],
  ["反", "拡大", "縮小", ["膨張", "伸長", "増大"]],
  ["反", "楽観", "悲観", ["達観", "静観", "概観"]],
  ["反", "濃厚", "淡泊", ["濃密", "強烈", "深遠"]],
  ["反", "精密", "粗雑", ["緻密", "厳密", "細密"]],
  ["反", "過激", "穏健", ["激烈", "尖鋭", "強硬"]],
  ["反", "遠隔", "近接", ["僻地", "遠方", "間接"]],
  ["反", "収入", "支出", ["所得", "収益", "貯蓄"]],
  ["反", "直接", "間接", ["直結", "直下", "即時"]],
  ["反", "理論", "実践", ["論理", "学説", "仮説"]],
  ["反", "開放", "閉鎖", ["開拓", "開通", "公開"]],
  ["反", "分裂", "統一", ["分散", "分岐", "断絶"]],
  ["反", "起床", "就寝", ["起立", "覚醒", "早起"]],
  ["反", "生産", "消費", ["製造", "創造", "産出"]],
  ["反", "冗長", "簡潔", ["長大", "豊富", "複雑"]],
  ["反", "悲哀", "歓喜", ["哀愁", "憂慮", "悲嘆"]],
  ["反", "軽率", "慎重", ["軽快", "迅速", "大胆"]],
  ["反", "義務", "権利", ["責務", "使命", "約束"]],
  ["反", "需給", "均衡", null], // ダミー除去用に無効行は使わない
].filter((r) => r[3]);

function makeVQueue() {
  return shuffle(V_BANK);
}
function genV(queue) {
  if (queue.length === 0) queue.push(...shuffle(V_BANK));
  const [type, w, ans, ds] = queue.pop();
  const choices = shuffle([ans, ...ds]);
  return {
    kind: "V",
    text:
      type === "類"
        ? `「${w}」と最も意味が近い語は？`
        : `「${w}」の反対語は？`,
    choices,
    answer: choices.indexOf(ans),
  };
}

/* ============================================================
   検査S：空間判断（図形回転一致／積み木数え）
   ============================================================ */
// キラル（鏡像非対称）なポリオミノ
const SHAPES = [
  [[0, 0], [0, 1], [0, 2], [1, 2]], // L4
  [[1, 0], [2, 0], [0, 1], [1, 1]], // S4
  [[0, 0], [1, 0], [0, 1], [1, 1], [0, 2]], // P5
  [[1, 0], [2, 0], [0, 1], [1, 1], [1, 2]], // F5
  [[0, 0], [0, 1], [0, 2], [0, 3], [1, 3]], // L5
  [[0, 0], [1, 0], [1, 1], [1, 2], [2, 2]], // Z5
  [[1, 0], [0, 1], [1, 1], [1, 2], [1, 3]], // Y5
];
const norm = (cells) => {
  const mx = Math.min(...cells.map((c) => c[0]));
  const my = Math.min(...cells.map((c) => c[1]));
  return cells
    .map(([x, y]) => [x - mx, y - my])
    .sort((a, b) => a[0] - b[0] || a[1] - b[1]);
};
const rot90 = (cells) => norm(cells.map(([x, y]) => [y, -x]));
const mirror = (cells) => norm(cells.map(([x, y]) => [-x, y]));
const rotN = (cells, n) => {
  let c = norm(cells);
  for (let i = 0; i < n; i++) c = rot90(c);
  return c;
};
const keyOf = (cells) => norm(cells).map((c) => c.join(",")).join(";");

function PolySVG({ cells, size = 88, stroke = INK }) {
  const c = norm(cells);
  const maxX = Math.max(...c.map((p) => p[0])) + 1;
  const maxY = Math.max(...c.map((p) => p[1])) + 1;
  const span = Math.max(maxX, maxY, 4);
  const cell = Math.floor((size - 8) / span);
  const ox = (size - maxX * cell) / 2;
  const oy = (size - maxY * cell) / 2;
  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} aria-hidden="true">
      {c.map(([x, y], i) => (
        <rect
          key={i}
          x={ox + x * cell}
          y={oy + y * cell}
          width={cell}
          height={cell}
          fill="#EDF1F7"
          stroke={stroke}
          strokeWidth="1.6"
        />
      ))}
    </svg>
  );
}

function genSRotate() {
  const base = pick(SHAPES);
  const shown = rotN(base, rnd(4));
  const correct = rotN(shown, 1 + rnd(3));
  const mir = mirror(shown);
  const dset = [];
  const seen = new Set([keyOf(correct)]);
  for (const r of shuffle([0, 1, 2, 3])) {
    const cand = rotN(mir, r);
    const k = keyOf(cand);
    if (!seen.has(k)) {
      seen.add(k);
      dset.push(cand);
    }
    if (dset.length === 3) break;
  }
  while (dset.length < 3) {
    const alt = rotN(pick(SHAPES), rnd(4));
    const k = keyOf(alt);
    if (!seen.has(k)) {
      seen.add(k);
      dset.push(alt);
    }
  }
  const options = shuffle([{ cells: correct, ok: true }, ...dset.map((c) => ({ cells: c, ok: false }))]);
  return {
    kind: "S",
    sub: "rotate",
    text: "左の図形を回転させたものはどれ？（裏返しは不可）",
    target: shown,
    options,
    answer: options.findIndex((o) => o.ok),
    choices: options.map((_, i) => ["①", "②", "③", "④"][i]),
  };
}

function genSBlocks() {
  // 背面ほど高い単調な高さ場 → すべての柱の頭が見える（答えが一意）
  const N = 3;
  const h = Array.from({ length: N }, () => Array(N).fill(0));
  for (let s = 2 * (N - 1); s >= 0; s--) {
    for (let x = 0; x < N; x++) {
      const y = s - x;
      if (y < 0 || y >= N) continue;
      const front = Math.max(
        x + 1 < N ? h[x + 1][y] : 0,
        y + 1 < N ? h[x][y + 1] : 0
      );
      h[x][y] = Math.min(4, front + rnd(2) + (x + y === 0 ? rnd(2) : 0));
    }
  }
  let total = 0;
  for (let x = 0; x < N; x++) for (let y = 0; y < N; y++) total += h[x][y];
  if (total < 5) return genSBlocks();
  const set = new Set([total]);
  while (set.size < 4) {
    const d = total + (rnd(2) ? 1 : -1) * (1 + rnd(3));
    if (d > 0) set.add(d);
  }
  const choices = shuffle([...set]);
  return {
    kind: "S",
    sub: "blocks",
    text: "積み木は全部で何個？（浮いている積み木はない）",
    heights: h,
    choices: choices.map((n) => `${n}個`),
    answer: choices.indexOf(total),
  };
}

function BlocksSVG({ heights, size = 190 }) {
  const w = 17, hh = 8.5, d = 15;
  const X0 = size / 2, Y0 = 30;
  const cubes = [];
  const N = heights.length;
  for (let s = 0; s <= 2 * (N - 1); s++) {
    for (let x = 0; x < N; x++) {
      const y = s - x;
      if (y < 0 || y >= N) continue;
      for (let z = 0; z < heights[x][y]; z++) cubes.push([x, y, z]);
    }
  }
  return (
    <svg width={size} height={size * 0.85} viewBox={`0 0 ${size} ${size * 0.85}`} aria-hidden="true">
      {cubes.map(([x, y, z], i) => {
        const px = X0 + (x - y) * w;
        const py = Y0 + (x + y) * hh + (3 - z) * d;
        const top = `${px},${py} ${px + w},${py + hh} ${px},${py + 2 * hh} ${px - w},${py + hh}`;
        const left = `${px - w},${py + hh} ${px},${py + 2 * hh} ${px},${py + 2 * hh + d} ${px - w},${py + hh + d}`;
        const right = `${px + w},${py + hh} ${px},${py + 2 * hh} ${px},${py + 2 * hh + d} ${px + w},${py + hh + d}`;
        return (
          <g key={i} stroke={INK} strokeWidth="1" strokeLinejoin="round">
            <polygon points={top} fill="#F3F6FA" />
            <polygon points={left} fill="#C9D4E4" />
            <polygon points={right} fill="#9FB0C8" />
          </g>
        );
      })}
    </svg>
  );
}

function genS() {
  return rnd(2) ? genSRotate() : genSBlocks();
}

/* ============================================================
   採点マーク（◯／✕）と点数スタンプ
   ============================================================ */
function MarkOverlay({ mark }) {
  if (!mark) return null;
  return (
    <div className="mark-pop" style={{
      position: "absolute", inset: 0, display: "flex",
      alignItems: "center", justifyContent: "center", pointerEvents: "none",
    }}>
      <svg width="110" height="110" viewBox="0 0 110 110">
        {mark === "ok" ? (
          <circle cx="55" cy="55" r="40" fill="none" stroke={RED} strokeWidth="7" opacity="0.9" />
        ) : (
          <g stroke={RED} strokeWidth="7" opacity="0.9" strokeLinecap="round">
            <line x1="25" y1="25" x2="85" y2="85" />
            <line x1="85" y1="25" x2="25" y2="85" />
          </g>
        )}
      </svg>
    </div>
  );
}

/* ============================================================
   メインコンポーネント
   ============================================================ */
const MODES = {
  S: { label: "空間判断", desc: "図形の回転・積み木", gen: null },
  V: { label: "言語", desc: "類義語・反対語", gen: null },
  N: { label: "数理", desc: "四則演算スピード", gen: null },
};

export default function App() {
  const [screen, setScreen] = useState("home"); // home | drill | result
  const [mode, setMode] = useState(null);
  const [data, setData] = useState({ history: {} });
  const [q, setQ] = useState(null);
  const [qIdx, setQIdx] = useState(0);
  const [score, setScore] = useState(0);
  const [answered, setAnswered] = useState(0);
  const [timeLeft, setTimeLeft] = useState(DRILL_SEC);
  const [mark, setMark] = useState(null);
  const [isNewBest, setIsNewBest] = useState(false);
  const vQueue = useRef([]);
  const lock = useRef(false);
  const timerRef = useRef(null);

  useEffect(() => {
    loadData().then(setData);
  }, []);

  const nextQuestion = useCallback((m, idx) => {
    if (m === "N") setQ(genN(idx));
    else if (m === "V") setQ(genV(vQueue.current));
    else setQ(genS());
  }, []);

  const startDrill = (m) => {
    setMode(m);
    setScore(0);
    setAnswered(0);
    setQIdx(0);
    setTimeLeft(DRILL_SEC);
    setMark(null);
    lock.current = false;
    if (m === "V") vQueue.current = makeVQueue();
    nextQuestion(m, 0);
    setScreen("drill");
  };

  // タイマー
  useEffect(() => {
    if (screen !== "drill") return;
    timerRef.current = setInterval(() => {
      setTimeLeft((t) => {
        if (t <= 1) {
          clearInterval(timerRef.current);
          return 0;
        }
        return t - 1;
      });
    }, 1000);
    return () => clearInterval(timerRef.current);
  }, [screen, mode]);

  // 終了処理
  useEffect(() => {
    if (screen === "drill" && timeLeft === 0) {
      finishDrill();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [timeLeft]);

  const finishDrill = async () => {
    const day = todayStr();
    const d = await loadData();
    if (!d.history[day]) d.history[day] = {};
    const prev = d.history[day][mode] || 0;
    const best = Math.max(prev, score);
    setIsNewBest(score > prev && prev > 0 ? true : prev === 0);
    d.history[day][mode] = best;
    await saveData(d);
    setData({ ...d });
    setScreen("result");
  };

  const onAnswer = (i) => {
    if (lock.current || screen !== "drill") return;
    lock.current = true;
    const ok = i === q.answer;
    setMark(ok ? "ok" : "ng");
    if (ok) setScore((s) => s + 1);
    setAnswered((a) => a + 1);
    setTimeout(() => {
      setMark(null);
      lock.current = false;
      const ni = qIdx + 1;
      setQIdx(ni);
      nextQuestion(mode, ni);
    }, ok ? 260 : 480);
  };

  /* ---------- 集計 ---------- */
  const day = todayStr();
  const todayRec = data.history[day] || {};
  const streak = (() => {
    let n = 0;
    const d = new Date();
    for (;;) {
      const p = (x) => String(x).padStart(2, "0");
      const key = `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}`;
      const rec = data.history[key];
      if (rec && Object.keys(rec).length > 0) {
        n++;
        d.setDate(d.getDate() - 1);
      } else break;
    }
    return n;
  })();
  const last14 = (() => {
    const arr = [];
    const d = new Date();
    d.setDate(d.getDate() - 13);
    for (let i = 0; i < 14; i++) {
      const p = (x) => String(x).padStart(2, "0");
      const key = `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}`;
      arr.push({ key, rec: data.history[key] || {} });
      d.setDate(d.getDate() + 1);
    }
    return arr;
  })();

  /* ---------- 画面 ---------- */
  return (
    <div style={{
      minHeight: "100vh",
      background: `repeating-linear-gradient(${PAPER}, ${PAPER} 31px, ${RULE} 31px, ${RULE} 32px)`,
      color: INK,
      fontFamily: '"Hiragino Kaku Gothic ProN","Hiragino Sans","Yu Gothic","Noto Sans JP",sans-serif',
    }}>

      {/* 答案用紙の赤い縦罫 */}
      <div style={{
        position: "fixed", top: 0, bottom: 0, left: "14px",
        width: "1.5px", background: RED, opacity: 0.35, pointerEvents: "none",
      }} />

      <div style={{ maxWidth: 560, margin: "0 auto", padding: "20px 20px 48px 30px" }}>

        {/* ===== ヘッダー ===== */}
        <header style={{ display: "flex", alignItems: "baseline", justifyContent: "space-between", marginBottom: 18 }}>
          <div>
            <div style={{ fontSize: 11, letterSpacing: "0.22em", color: SUB }}>適性能力トレーニング</div>
            <h1 className="mono" style={{ fontSize: 26, fontWeight: 700, margin: "2px 0 0", letterSpacing: "0.04em" }}>
              SVN ドリル道場
            </h1>
          </div>
          {streak > 0 && (
            <div className="stamp" style={{
              width: 62, height: 62, borderRadius: "50%",
              border: `2.5px solid ${RED}`, color: RED,
              display: "flex", flexDirection: "column",
              alignItems: "center", justifyContent: "center",
              transform: "rotate(-8deg)", fontWeight: 700,
              background: "rgba(250,250,249,.8)",
            }}>
              <span style={{ fontSize: 9, letterSpacing: "0.1em" }}>連続</span>
              <span className="mono" style={{ fontSize: 20, lineHeight: 1 }}>{streak}</span>
              <span style={{ fontSize: 9 }}>日</span>
            </div>
          )}
        </header>

        {/* ===== ホーム ===== */}
        {screen === "home" && (
          <main>
            <p style={{ fontSize: 13, color: SUB, margin: "0 0 16px", lineHeight: 1.7 }}>
              各60秒。正答数がそのまま得点になります。<br />
              今日の記録：
              <span className="mono" style={{ marginLeft: 6 }}>
                S {todayRec.S ?? "–"} ／ V {todayRec.V ?? "–"} ／ N {todayRec.N ?? "–"}
              </span>
            </p>

            {Object.entries(MODES).map(([k, m]) => (
              <button
                key={k}
                onClick={() => startDrill(k)}
                style={{
                  display: "flex", alignItems: "center", gap: 16,
                  width: "100%", textAlign: "left",
                  background: "#FFFFFF", border: `1.5px solid ${INK}`,
                  borderRadius: 6, padding: "14px 16px", marginBottom: 12,
                  cursor: "pointer", boxShadow: "2px 2px 0 rgba(28,43,69,.12)",
                }}
              >
                <span className="mono" style={{
                  fontSize: 34, fontWeight: 700, width: 44, color: INK,
                  borderRight: `1px solid ${RULE}`, paddingRight: 12,
                }}>{k}</span>
                <span style={{ flex: 1 }}>
                  <span style={{ display: "block", fontWeight: 700, fontSize: 16 }}>検査{k}｜{m.label}</span>
                  <span style={{ display: "block", fontSize: 12, color: SUB, marginTop: 2 }}>{m.desc}</span>
                </span>
                <span style={{ fontSize: 12, color: SUB }}>
                  本日 <span className="mono" style={{ fontSize: 18, color: INK }}>{todayRec[k] ?? "–"}</span>
                </span>
              </button>
            ))}

            {/* 14日間の推移 */}
            <section style={{ marginTop: 26 }}>
              <h2 style={{ fontSize: 12, letterSpacing: "0.18em", color: SUB, fontWeight: 600 }}>
                直近14日の得点推移
              </h2>
              {["S", "V", "N"].map((k) => {
                const vals = last14.map((d) => d.rec[k] ?? null);
                const max = Math.max(10, ...vals.filter((v) => v !== null));
                return (
                  <div key={k} style={{ display: "flex", alignItems: "center", gap: 10, marginTop: 8 }}>
                    <span className="mono" style={{ width: 16, fontWeight: 700 }}>{k}</span>
                    <svg width="100%" height="34" viewBox="0 0 280 34" preserveAspectRatio="none" style={{ background: "#fff", border: `1px solid ${RULE}`, borderRadius: 3 }}>
                      {vals.map((v, i) =>
                        v === null ? null : (
                          <rect
                            key={i}
                            x={4 + i * 19.6}
                            y={30 - (v / max) * 26}
                            width="12"
                            height={(v / max) * 26 + 1}
                            fill={i === 13 ? RED : "#9FB0C8"}
                          />
                        )
                      )}
                    </svg>
                  </div>
                );
              })}
              <p style={{ fontSize: 11, color: SUB, marginTop: 8 }}>
                右端（赤）が今日。記録はこの端末のアプリ内に保存されます。
              </p>
            </section>
          </main>
        )}

        {/* ===== ドリル ===== */}
        {screen === "drill" && q && (
          <main>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 10 }}>
              <span style={{ fontSize: 13, color: SUB }}>
                検査{mode}｜第 <span className="mono">{qIdx + 1}</span> 問
              </span>
              <span className="mono" style={{
                fontSize: 30, fontWeight: 700,
                color: timeLeft <= 10 ? RED : INK,
              }}>
                {String(Math.floor(timeLeft / 60))}:{String(timeLeft % 60).padStart(2, "0")}
              </span>
            </div>
            <div style={{ height: 5, background: "#E7EBF2", borderRadius: 3, marginBottom: 16 }}>
              <div style={{
                height: "100%", borderRadius: 3, background: timeLeft <= 10 ? RED : INK,
                width: `${(timeLeft / DRILL_SEC) * 100}%`, transition: "width 1s linear",
              }} />
            </div>

            {/* 問題カード */}
            <div style={{
              position: "relative", background: "#fff",
              border: `1.5px solid ${INK}`, borderRadius: 6,
              padding: "22px 18px", marginBottom: 16, minHeight: 150,
              boxShadow: "2px 2px 0 rgba(28,43,69,.12)",
            }}>
              <p style={{ margin: 0, fontSize: 15, fontWeight: 600 }}>{q.text}</p>

              {q.kind === "N" && (
                <p className="mono" style={{ fontSize: 40, fontWeight: 700, textAlign: "center", margin: "22px 0 6px" }}>
                  {q.text}
                </p>
              )}

              {q.kind === "S" && q.sub === "rotate" && (
                <div style={{ display: "flex", justifyContent: "center", marginTop: 12 }}>
                  <PolySVG cells={q.target} size={110} />
                </div>
              )}

              {q.kind === "S" && q.sub === "blocks" && (
                <div style={{ display: "flex", justifyContent: "center", marginTop: 4 }}>
                  <BlocksSVG heights={q.heights} />
                </div>
              )}

              <MarkOverlay mark={mark} />
            </div>

            {/* 選択肢 */}
            {q.kind === "S" && q.sub === "rotate" ? (
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
                {q.options.map((o, i) => (
                  <button key={i} className="choice" onClick={() => onAnswer(i)} style={{
                    background: "#fff", border: `1.5px solid ${INK}`, borderRadius: 6,
                    padding: 8, cursor: "pointer", display: "flex", alignItems: "center", gap: 8,
                  }}>
                    <span className="mono" style={{ fontWeight: 700 }}>{["①", "②", "③", "④"][i]}</span>
                    <PolySVG cells={o.cells} size={72} />
                  </button>
                ))}
              </div>
            ) : (
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
                {q.choices.map((c, i) => (
                  <button key={i} className="choice" onClick={() => onAnswer(i)} style={{
                    background: "#fff", border: `1.5px solid ${INK}`, borderRadius: 6,
                    padding: "16px 10px", cursor: "pointer",
                    fontSize: q.kind === "N" ? 22 : 16, fontWeight: 600,
                  }}>
                    <span className="mono" style={{ color: SUB, marginRight: 8, fontSize: 14 }}>
                      {["①", "②", "③", "④"][i]}
                    </span>
                    {c}
                  </button>
                ))}
              </div>
            )}

            <div style={{ textAlign: "right", marginTop: 14, fontSize: 13, color: SUB }}>
              正答 <span className="mono" style={{ fontSize: 18, color: INK }}>{score}</span> ／ {answered}
            </div>
          </main>
        )}

        {/* ===== 結果 ===== */}
        {screen === "result" && (
          <main style={{ textAlign: "center", paddingTop: 24 }}>
            <p style={{ fontSize: 13, color: SUB, margin: 0 }}>検査{mode}｜{MODES[mode].label} 採点結果</p>
            <div className="stamp" style={{
              width: 170, height: 170, margin: "22px auto 10px",
              borderRadius: "50%", border: `4px solid ${RED}`,
              display: "flex", flexDirection: "column",
              alignItems: "center", justifyContent: "center",
              color: RED, transform: "rotate(-8deg)",
              background: "rgba(255,255,255,.75)",
            }}>
              <span className="mono" style={{ fontSize: 62, fontWeight: 700, lineHeight: 1 }}>{score}</span>
              <span style={{ fontSize: 13, fontWeight: 700, letterSpacing: "0.2em", marginTop: 4 }}>点</span>
            </div>
            <p style={{ fontSize: 14, margin: "6px 0 2px" }}>
              解答 {answered} 問中 {score} 問正解
              {answered > 0 && (
                <span className="mono" style={{ marginLeft: 8, color: SUB }}>
                  （正答率 {Math.round((score / answered) * 100)}%）
                </span>
              )}
            </p>
            {isNewBest && score > 0 && (
              <p style={{ color: RED, fontWeight: 700, fontSize: 14, margin: "4px 0 0" }}>本日の自己ベスト更新</p>
            )}
            <div style={{ display: "flex", gap: 10, justifyContent: "center", marginTop: 26 }}>
              <button onClick={() => startDrill(mode)} style={{
                background: INK, color: "#fff", border: "none", borderRadius: 6,
                padding: "12px 22px", fontSize: 15, fontWeight: 700, cursor: "pointer",
              }}>
                もう一度挑戦
              </button>
              <button onClick={() => setScreen("home")} style={{
                background: "#fff", color: INK, border: `1.5px solid ${INK}`, borderRadius: 6,
                padding: "12px 22px", fontSize: 15, fontWeight: 700, cursor: "pointer",
              }}>
                ホームへ
              </button>
            </div>
          </main>
        )}
      </div>
    </div>
  );
}
