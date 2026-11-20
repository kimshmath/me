/*!
 * turing-3n1.js · v1.1 · 2026-11-20  (v1.0에 영어 화면 글을 더함 — 한국어 화면은 v1.0과 같음)
 * 3n+1(콜라츠) 튜링 기계 애니메이션 — 웹 컴포넌트 <turing-3n1>
 *
 * 「인간, 수학, AI — 생각을 생각하다」 강연 덱의 튜링 기계 영상(tm_video2.py가 PIL로 그려 만든 1920×496 영상)을
 * 브라우저에서 그대로 돌아가도록 Canvas 2D로 옮긴 것. 외부 라이브러리 없음, 파일 하나.
 *
 * ── 쓰는 법 ───────────────────────────────────────────────────────────────
 *   <script src="turing-3n1.js" defer></script>
 *   <turing-3n1></turing-3n1>                                   흰 바탕 · 27에서 출발 · 자동 재생 · 반복
 *   <turing-3n1 start="97" theme="dark" controls></turing-3n1>  어두운 바탕 · 97에서 출발 · 아래에 단추 줄
 *
 * ── 속성 (모두 고르지 않아도 됨) ───────────────────────────────────────────
 *   start     출발 수, 1 – 1000000 (기본 27)
 *   theme     light | dark — light = 강연 덱의 흰 바탕 영상, dark = 원래 영상(0D0D10 바탕) (기본 light)
 *   numbers   on | off — 상태 번호 ①–⑥과 규칙표의 '다음 상태' 표시 (기본: light는 off, dark는 on — 각 영상과 같게)
 *   layout    auto | wide | narrow — narrow는 값과 그래프를 규칙표 아래로 내린 배치 (기본 auto: 폭 640px 미만이면 narrow)
 *   speed     배속 (기본 1, 0.1 – 16)
 *   autoplay  off 이면 한 장면을 보여 주고 기다림 (기본: 자동 재생. 단 기기에서 '동작 줄이기'를 켰으면 기다림)
 *   loop      off 이면 '멈춤' 장면에서 끝남 (기본: 반복)
 *   controls  있으면 아래에 단추 줄 (재생/일시정지 · 처음부터 · 출발 수 · 배속)
 *   fonts     none 이면 Google Fonts(나눔고딕 · 나눔명조)를 불러오지 않음 — 페이지가 이미 불러온 경우
 *   lang      ko | en — 화면 글의 언어. 없으면 가장 가까운 lang 속성(보통 <html lang>)을 따르고, en이 아니면 한국어
 *
 * ── 조작 ─────────────────────────────────────────────────────────────────
 *   화면을 누르면 일시정지/재생 · (초점이 있을 때) 스페이스 = 일시정지/재생, R = 처음부터
 *   스크립트: el.play() · el.pause() · el.restart() · el.currentTime = 20 · el.duration
 *
 * 글꼴: 나눔고딕 · 나눔명조 (SIL Open Font License 1.1)
 */
(function () {
  'use strict';
  if (typeof window === 'undefined' || !window.customElements || window.customElements.get('turing-3n1')) return;

  // ───────────────────────────── 기계: 6상태 15규칙 ─────────────────────────────
  // 테이프의 이진수가 짝수면 끝자리 0을 지우고(÷2), 홀수면 오른쪽부터 한 자리씩 3d + 올림(×3+1, 올림 0·1·2),
  // 수가 1이 되면 멈춘다. 머리는 늘 끝자리(LSB)에서 출발한다.
  const STATES = ['P', 'Q', 'C0', 'C1', 'C2', 'R'];
  const ROWS = [['0'], ['1'], ['_']];                     // 규칙표의 줄: 읽은 기호 (줄 이름은 TEXT.rows)
  const DELTA = {                       // [쓸 기호, 이동(−1 = 왼쪽, +1 = 오른쪽), 다음 상태]
    P:  { '0': ['_', -1, 'P'],  '1': ['1', -1, 'Q'] },
    Q:  { '0': ['0', +1, 'C1'], '1': ['1', +1, 'C1'], '_': ['_', +1, 'H'] },
    C0: { '0': ['0', -1, 'C0'], '1': ['1', -1, 'C1'], '_': ['_', +1, 'R'] },
    C1: { '0': ['1', -1, 'C0'], '1': ['0', -1, 'C2'], '_': ['1', +1, 'R'] },
    C2: { '0': ['0', -1, 'C1'], '1': ['1', -1, 'C2'], '_': ['0', -1, 'C1'] },
    R:  { '0': ['0', +1, 'R'],  '1': ['1', +1, 'R'],  '_': ['_', -1, 'P'] },
  };
  const CIRCLED = { P: '①', Q: '②', C0: '③', C1: '④', C2: '⑤', R: '⑥' };

  // ───────────────────────────── 화면 글: 한국어 · 영어 ─────────────────────────────
  // lang 속성이 있으면 그것을, 없으면 가장 가까운 조상의 lang(보통 <html lang>)을 따른다. en…이면 영어, 아니면 한국어.
  const TEXT = {
    ko: {
      rows: ['0을 읽으면', '1을 읽으면', '빈칸이면'],
      head: { P: '짝수? 홀수?', Q: '1인가?', C0: '올림 0', C1: '올림 1', C2: '올림 2', R: '오른쪽 끝으로' },
      pill: { P: '짝수? 홀수?', Q: '1인가?', C0: '×3+1 · 올림 0', C1: '×3+1 · 올림 1', C2: '×3+1 · 올림 2',
              R: '오른쪽 끝으로', H: '멈춤' },
      erase: '지움', halt: '멈춤',
      task: '짝수면 ÷2   ·   홀수면 ×3+1   ·   1이 되면 멈춤',
      phases: ['읽기', '쓰기', '이동'],
      table: '규 칙 표', legend: '각 칸  =  쓸 기호 · 이동 · 다음 상태',
      tape: '테이프에 적힌 수', start: '출발',
      nth: i => `${i}번째 계산`, steps: k => `${fmt(k)}걸음`, peak: v => `최고 ${fmt(v)}`,
      info: (i, k, v) => `${i}번 계산 · ${fmt(k)}걸음 · 최고 ${fmt(v)}`,
      aria: M => `3n+1 튜링 기계 애니메이션: 테이프에 이진수 ${M.start}(=${M.n})를 적고, 짝수면 2로 나누고 홀수면 3을 곱해 1을 더하기를 ` +
                 `${M.NIT}번 되풀이해 ${fmt(M.N)}걸음 만에 1에서 멈춤. 최고 ${fmt(M.VMAX)}.`,
      stage: '3n+1 튜링 기계 — 누르면 일시정지/재생',
      play: '재생', pause: '일시정지', playTitle: '재생 (스페이스)', pauseTitle: '일시정지 (스페이스)',
      restart: '처음부터', restartTitle: '처음부터 (R)', startLabel: '출발 수', speedLabel: '속도',
    },
    en: {
      rows: ['If 0', 'If 1', 'If blank'],
      head: { P: 'Even? Odd?', Q: 'Is it 1?', C0: 'Carry 0', C1: 'Carry 1', C2: 'Carry 2', R: 'To right end' },
      pill: { P: 'Even? Odd?', Q: 'Is it 1?', C0: '×3+1 · carry 0', C1: '×3+1 · carry 1', C2: '×3+1 · carry 2',
              R: 'To right end', H: 'Halt' },
      erase: 'erase', halt: 'halt',
      task: 'If even ÷2   ·   If odd ×3+1   ·   Halt at 1',
      phases: ['Read', 'Write', 'Move'],
      table: 'Rule table', legend: 'Each cell  =  write · move · next state',
      tape: 'Number on the tape', start: 'Start',
      nth: i => `Operation ${i}`, steps: k => `${fmt(k)} step${k === 1 ? '' : 's'}`, peak: v => `Peak ${fmt(v)}`,
      info: (i, k, v) => `${i} operation${i === 1 ? '' : 's'} · ${fmt(k)} step${k === 1 ? '' : 's'} · peak ${fmt(v)}`,
      aria: M => `Animation of a 3n+1 Turing machine: the tape holds ${M.n} in binary (${M.start}); the machine halves it ` +
                 `when it is even and replaces it by 3n+1 when it is odd, ${M.NIT} times, and halts at 1 after ${fmt(M.N)} steps. ` +
                 `Peak ${fmt(M.VMAX)}.`,
      stage: '3n+1 Turing machine — click to pause or play',
      play: 'Play', pause: 'Pause', playTitle: 'Play (Space)', pauseTitle: 'Pause (Space)',
      restart: 'Restart', restartTitle: 'Restart (R)', startLabel: 'Start at', speedLabel: 'Speed',
    },
  };
  const headName = (T, s, num) => (num ? CIRCLED[s] + ' ' : '') + T.head[s];
  const pillName = (T, s, num) => (num && s !== 'H' ? CIRCLED[s] + ' ' : '') + T.pill[s];
  function cellText(T, s, sym, num) {
    const d = DELTA[s][sym];
    if (!d) return '';
    const [w, mv, ns] = d;
    const wt = w === '_' ? (sym !== '_' ? T.erase : '–') : w;
    const nx = ns === 'H' ? T.halt : (num ? CIRCLED[ns] : '');
    return wt + ' ' + (mv < 0 ? '←' : '→') + (nx ? ' ' + nx : '');
  }

  // 테이프 = 이어진 칸들 { lo: 맨 왼쪽 칸의 번호, s: '1011…' ('_' = 빈칸) }. 끝자리(LSB)의 처음 번호는 0.
  function tapeGet(T, i) {
    const j = i - T.lo;
    if (j < 0 || j >= T.s.length) return null;
    const c = T.s[j];
    return c === '_' ? null : c;
  }
  function tapeWrite(T, p, w) {
    let lo = T.lo, s = T.s;
    if (!s.length) return w === '_' ? T : { lo: p, s: w };
    if (p < lo) { s = '_'.repeat(lo - p) + s; lo = p; }
    const hi = lo + s.length - 1;
    if (p > hi) s += '_'.repeat(p - hi);
    const j = p - lo;
    s = s.slice(0, j) + w + s.slice(j + 1);
    let a = 0, z = s.length;
    while (a < z && s[a] === '_') a++;
    while (z > a && s[z - 1] === '_') z--;
    return { lo: lo + a, s: s.slice(a, z) };
  }

  function simulate(n) {
    const b = n.toString(2);
    let tape = { lo: -(b.length - 1), s: b };
    let pos = 0, state = 'P', val = n, L = 0, it = 0, len = b.length, maxLen = b.length;
    const steps = [], traj = [n];
    while (state !== 'H') {
      const r = tapeGet(tape, pos) || '_';
      const [w, mv, ns] = DELTA[state][r];
      let op = null;
      if (state === 'P' && r === '0') op = '÷2';
      if ((state === 'C0' || state === 'C1') && r === '_') op = '×3+1';
      const st = { state, pos, read: r, write: w, move: mv, next: ns, before: tape, op };
      if (w !== r) tape = tapeWrite(tape, pos, w);
      if (op === '÷2') { val /= 2; L -= 1; }
      if (op === '×3+1') val = 3 * val + 1;
      if (op) {
        it++; traj.push(val);
        len = val.toString(2).length; if (len > maxLen) maxLen = len;
      }
      st.valAfter = val; st.LAfter = L; st.itAfter = it; st.lenAfter = len;
      steps.push(st);
      pos += mv; state = ns;
    }
    return { steps, traj, end: tape, posEnd: pos, maxLen };
  }

  // ───────────────────────────── 시간표 (tm_video2.py와 같은 값) ─────────────────────────────
  // 처음에는 한 걸음에 0.62초(읽기 · 쓰기 · 이동이 보임) → 0.066초까지 빨라짐 → 끝에서 다시 느려짐.
  const D0 = 0.62, DFAST = 0.066, KAPPA = 30, DEND = 0.42, KAPPA2 = 9;
  const T_EMPTY = 0.8, T_IN_ANIM = 0.55, T_HEAD_IN = 0.8, T_HALT = 4.2, T_OUT = 1.4, TAU = 0.42;
  const phaseAB = d => (d >= 0.30 ? [0.30, 0.55] : [0.12, 0.40]);    // 한 걸음 안에서 읽기 | 쓰기 | 이동의 경계

  function buildModel(n) {
    const sim = simulate(n), S = sim.steps, N = S.length;
    const start = n.toString(2);
    const stagger = start.length > 1 ? Math.min(0.26, 2.2 / (start.length - 1)) : 0.26;
    const IN_T0 = T_EMPTY;
    const HEAD_T0 = IN_T0 + stagger * (start.length - 1) + T_IN_ANIM + 0.25;
    const T0 = new Float64Array(N);
    let t = HEAD_T0 + T_HEAD_IN + 0.45;
    for (let k = 0; k < N; k++) {
      const d = Math.max(DFAST + (D0 - DFAST) * Math.exp(-k / KAPPA),
                         DFAST + (DEND - DFAST) * Math.exp(-(N - 1 - k) / KAPPA2));
      S[k].t0 = t; S[k].d = d; T0[k] = t; t += d;
    }
    const HALT_T0 = t, OUT_T0 = HALT_T0 + T_HALT, TOTAL = OUT_T0 + T_OUT + 0.5;
    const VCH = [{ t: IN_T0, it: 0, val: n, op: null }];            // 값이 바뀌는 시각
    const LCH = [{ t: IN_T0, L: 0, len: start.length }];            // 끝자리 위치 · 자릿수가 바뀌는 시각 (카메라용)
    for (const st of S) {
      if (!st.op) continue;
      const tt = st.t0 + phaseAB(st.d)[1] * st.d;
      VCH.push({ t: tt, it: st.itAfter, val: st.valAfter, op: st.op });
      LCH.push({ t: tt, L: st.LAfter, len: st.lenAfter });
    }
    const traj = sim.traj;
    let VMAX = 0, IT_MAX = 0;
    traj.forEach((v, i) => { if (v > VMAX) { VMAX = v; IT_MAX = i; } });
    return {
      n, start, stagger, steps: S, N, T0, IN_T0, HEAD_T0, HALT_T0, OUT_T0, TOTAL,
      VCH, VCH_T: Float64Array.from(VCH, v => v.t), LCH, LCH_T: Float64Array.from(LCH, v => v.t),
      NIT: traj.length - 1, VMAX, IT_MAX, end: sim.end, posEnd: sim.posEnd, maxLen: sim.maxLen,
    };
  }

  // ───────────────────────────── 시각 t의 상태 ─────────────────────────────
  const clamp01 = x => Math.max(0, Math.min(1, x));
  const ease = x => { x = clamp01(x); return x * x * (3 - 2 * x); };
  const easeOut = x => { x = clamp01(x); return 1 - (1 - x) * (1 - x) * (1 - x); };
  const lerp = (a, b, x) => a + (b - a) * x;
  function bisectRight(arr, x) {
    let lo = 0, hi = arr.length;
    while (lo < hi) { const m = (lo + hi) >> 1; if (x < arr[m]) hi = m; else lo = m + 1; }
    return lo;
  }

  function headAt(M, tt) {                      // 머리의 위치(칸 번호, 실수)
    if (tt >= M.HALT_T0) return M.posEnd;
    const k = bisectRight(M.T0, tt) - 1;
    if (k < 0) return 0;
    const st = M.steps[k], u = (tt - st.t0) / st.d, b = phaseAB(st.d)[1];
    return st.pos + st.move * (u >= b ? ease((u - b) / (1 - b)) : 0);
  }

  function stateAt(M, tt) {
    const S = { tape: { lo: -(M.start.length - 1), s: M.start }, headI: null, headA: 0, pill: 'P', pillHot: 0,
                cellRC: null, phase: null, fast: false, heat: new Map(), flip: new Map(), value: M.n, valueT: null,
                op: null, it: 0, vi: 0, inProg: null, outA: 1, frameGlow: 0.5, steps: 0 };
    if (tt < M.IN_T0) { S.outA = 0; return S; }
    S.inProg = tt - M.IN_T0;
    if (tt >= M.HEAD_T0) S.headA = easeOut((tt - M.HEAD_T0) / T_HEAD_IN);
    S.headI = headAt(M, tt);
    const k = bisectRight(M.T0, tt) - 1;
    if (tt >= M.HALT_T0) {
      S.tape = M.end; S.pill = 'H'; S.pillHot = 1; S.steps = M.N;
      S.cellRC = tt - M.HALT_T0 < 0.9 ? ['Q', '_'] : null;
    } else if (k >= 0) {
      const st = M.steps[k], u = (tt - st.t0) / st.d, [a, b] = phaseAB(st.d), p = st.pos;
      S.fast = st.d < 0.30; S.pill = st.state; S.cellRC = [st.state, st.read]; S.steps = k + 1;
      let tape = st.before;
      S.phase = u < a ? 'read' : (u < b ? 'write' : 'move');
      S.frameGlow = u < a ? 0.55 + 0.45 * Math.sin(Math.min(1, u / a) * Math.PI) : 0.55;
      if (u >= a && st.write !== st.read) {
        if (u < b) S.flip.set(p, [st.read, st.write, ease((u - a) / (b - a))]);
        else tape = tapeWrite(tape, p, st.write);
      }
      if (st.next === 'H' && u >= b) { S.pill = 'H'; S.pillHot = ease((u - b) / (1 - b)); }
      S.tape = tape;
    }
    // 방금 쓴 칸에 남는 열기 (3초 안의 쓰기들)
    for (let j = Math.min(k, M.N - 1); j >= 0; j--) {
      const st = M.steps[j], tw = st.t0 + phaseAB(st.d)[0] * st.d;
      if (tt - tw > 3.0) break;
      if (st.write !== st.read && tt >= tw && !S.heat.has(st.pos)) S.heat.set(st.pos, Math.exp(-(tt - tw) / 0.55));
    }
    const vi = Math.max(0, bisectRight(M.VCH_T, tt) - 1), v = M.VCH[vi];
    S.value = v.val; S.it = v.it; S.op = v.op; S.vi = vi; S.valueT = vi > 0 ? tt - v.t : null;
    if (tt >= M.OUT_T0) S.outA = 1 - ease((tt - M.OUT_T0) / T_OUT);
    return S;
  }

  // ───────────────────────────── 배치 · 색 ─────────────────────────────
  // 좌표는 논리 픽셀. wide = 원래 영상(1920×496) 그대로, narrow = 값 · 그래프를 규칙표 아래로 내린 1120×790.
  const LAYOUTS = {
    wide: {
      W: 1920, H: 496, phaseX: 173, phaseY: 8, taskX: 1747, taskY: 8,
      tapeY: 128, xmin: 120, xmax: 1742, cellMax: 84, cellMin: 40, fadeW: 280, pillMin: 113, pillMax: 1880,
      gx0: 173, glab: 126, gcol: 156, gyHdr: 244, gyLine: 274, gyHead: 284, gyRow: 330, gpitch: 47,
      V: { x: 1747, hdrY: 244, binY: 306, subY: 312, opY: 352, bigY: 468, bigMinX: 1430, flashTop: 372, flashBot: 474, binMinX: null },
      Gr: { x0: 1268, x1: 1462, y0: 362, y1: 466, labY: 306 },
    },
    narrow: {
      W: 1120, H: 790, phaseX: 52, phaseY: 8, taskX: 1088, taskY: 8,
      tapeY: 128, xmin: 24, xmax: 1096, cellMax: 84, cellMin: 30, fadeW: 110, pillMin: 12, pillMax: 1108,
      gx0: 32, glab: 126, gcol: 156, gyHdr: 244, gyLine: 274, gyHead: 284, gyRow: 330, gpitch: 47,
      V: { x: 1088, hdrY: 520, binY: 582, subY: 588, opY: 630, bigY: 752, bigMinX: 560, flashTop: 670, flashBot: 758, binMinX: 560 },
      Gr: { x0: 32, x1: 520, y0: 590, y1: 752, labY: 538 },
    },
  };

  const THEMES = {
    light: {   // 강연 덱(흰 바탕)의 영상에서 뽑은 색
      bg: '#FFFFFF', ink: '#1F1E24', gold: '#9A7628', hot: '#A87006',
      cell: '#EDF1F7', cellHot: '#F3E1B9', heatMix: 0.9, cellLine: '#DCDAE0', rule: '#DCDAE0',
      task: '#6A6772', label: '#8F8C97', rowLabel: '#6A6772',
      phaseOn: '#1F1E24', phaseSoft: '#8F8C97', phaseOff: '#B3B0B9',
      hdrText: '#55535C', hdrLine: '#B5B2BB', cellText: '#8A8791', cellTextOn: '#5F5D66', cellDot: '#C9C7CE',
      bin: '#6A6772', stepLabel: '#6A6772', stepCount: '#8F8C97', peak: '#8F8C97',
      glow: '#FFD478', glowGain: 0.6, glowMode: 'multiply', cutA: 0.6,
    },
    dark: {    // 원래 영상(tm_video2.py)의 색
      bg: '#0D0D10', ink: '#EEEBE3', gold: '#C6A660', hot: '#F2D99A',
      cell: '#171D45', cellHot: '#3A332E', heatMix: 0.55, cellLine: '#2B2A31', rule: '#2B2A31',
      task: '#9C99A3', label: '#55535D', rowLabel: '#83818A',
      phaseOn: '#EEEBE3', phaseSoft: '#9C99A3', phaseOff: '#55535D',
      hdrText: '#9C99A3', hdrLine: '#55535D', cellText: '#7C7A84', cellTextOn: '#9C99A3', cellDot: '#55535D',
      bin: '#9C99A3', stepLabel: '#9C99A3', stepCount: '#55535D', peak: '#9C99A3',
      glow: '#C6A660', glowGain: 1.4, glowMode: 'add', cutA: 1,
    },
  };

  const SERIF = '"Nanum Myeongjo", NanumMyeongjo, "Noto Serif KR", "AppleMyungjo", serif';
  const SANS = '"Nanum Gothic", NanumGothic, "Noto Sans KR", "Apple SD Gothic Neo", sans-serif';
  const F = {
    digit: px => `700 ${px}px ${SERIF}`, big: px => `700 ${px}px ${SERIF}`, bin: px => `400 ${px}px ${SERIF}`,
    sub: `400 18px ${SANS}`, cap: `400 26px ${SANS}`, capB: `700 26px ${SANS}`, cell: `400 27px ${SANS}`,
    row: `400 24px ${SANS}`, hdr: `400 20px ${SANS}`, op: `700 30px ${SANS}`,
    task: `400 25px ${SANS}`,
  };
  const fmt = v => v.toLocaleString('en-US');

  const rgbCache = new Map();
  function rgb(h) {
    let c = rgbCache.get(h);
    if (!c) { c = [1, 3, 5].map(i => parseInt(h.slice(i, i + 2), 16)); rgbCache.set(h, c); }
    return c;
  }
  function mix(c1, c2, x) {
    x = clamp01(x);
    const a = rgb(c1), b = rgb(c2);
    return `rgb(${Math.round(lerp(a[0], b[0], x))},${Math.round(lerp(a[1], b[1], x))},${Math.round(lerp(a[2], b[2], x))})`;
  }
  function rgba(h, a) { const c = rgb(h); return `rgba(${c[0]},${c[1]},${c[2]},${clamp01(a)})`; }

  function geometry(LY, M) {     // 칸 크기: 가장 긴 테이프(+ 올림 칸 + 오른쪽 빈칸 둘)가 들어가게, 최대 84
    const fit = Math.floor((LY.xmax - LY.xmin) / (M.maxLen + 3));
    const cell = Math.max(LY.cellMin, Math.min(LY.cellMax, fit));
    return { cell, s: cell / 84, anchor: LY.xmax - 3 * cell, xmin: LY.xmin };
  }
  function camTarget(M, G, tt) {  // 카메라는 끝자리를 따라가고, 테이프가 아주 길면 올림이 닿는 왼쪽 끝이 보이게 민다
    const c = M.LCH[Math.max(0, bisectRight(M.LCH_T, tt) - 1)];
    return Math.min(c.L, c.L - (c.len + 1) + (G.anchor - G.xmin) / G.cell);
  }

  // ───────────────────────────── 글꼴 불러오기 ─────────────────────────────
  const FONT_CSS = 'https://fonts.googleapis.com/css2?family=Nanum+Gothic:wght@400;700&family=Nanum+Myeongjo:wght@400;700&display=swap';
  const ALL_TEXT = (() => {                        // 미리 불러올 글자: 두 언어의 모든 화면 글
    let s = '(2) 0123456789,÷×+–←→·?';
    for (const T of Object.values(TEXT)) {
      s += T.task + T.phases.join('') + T.table + T.legend + T.tape + T.start + T.nth(0) + T.steps(0) + T.peak(0) + T.rows.join('');
      for (const st of STATES) {
        s += headName(T, st, true) + pillName(T, st, true);
        for (const [sym] of ROWS) s += cellText(T, st, sym, true);
      }
      s += T.pill.H;
    }
    return s;
  })();
  let fontsPromise = null;
  function ensureFonts(useGoogle) {
    if (fontsPromise) return fontsPromise;
    let link = document.querySelector('link[data-turing-3n1-fonts]');
    if (useGoogle && !link) {
      link = document.createElement('link');
      link.rel = 'stylesheet'; link.href = FONT_CSS; link.setAttribute('data-turing-3n1-fonts', '');
      document.head.appendChild(link);
    }
    const sheetReady = new Promise(res => {
      if (!link || link.sheet) return res();
      link.addEventListener('load', res, { once: true });
      link.addEventListener('error', res, { once: true });
    });
    const specs = [F.digit(50), F.bin(31), F.task, F.capB];
    const loaded = sheetReady.then(() => document.fonts
      ? Promise.all(specs.map(f => document.fonts.load(f, ALL_TEXT).catch(() => null))) : null);
    fontsPromise = Promise.race([loaded, new Promise(res => setTimeout(res, 3000))]);
    return fontsPromise;
  }

  // ───────────────────────────── 그리기 도구 ─────────────────────────────
  function rr(ctx, x0, y0, x1, y1, r) {
    const w = x1 - x0, h = y1 - y0;
    r = Math.max(0, Math.min(r, w / 2, h / 2));
    ctx.beginPath();
    ctx.moveTo(x0 + r, y0);
    ctx.arcTo(x1, y0, x1, y1, r); ctx.arcTo(x1, y1, x0, y1, r);
    ctx.arcTo(x0, y1, x0, y0, r); ctx.arcTo(x0, y0, x1, y0, r);
    ctx.closePath();
  }
  function fillRR(ctx, box, r, color, alpha) {
    if (alpha <= 0.003) return;
    ctx.globalAlpha = clamp01(alpha); ctx.fillStyle = color;
    rr(ctx, box[0], box[1], box[2], box[3], r); ctx.fill(); ctx.globalAlpha = 1;
  }
  function strokeRR(ctx, box, r, color, width, alpha) {
    if (alpha <= 0.003) return;
    ctx.globalAlpha = clamp01(alpha); ctx.strokeStyle = color; ctx.lineWidth = width;
    const d = width / 2;                                     // PIL처럼 테두리를 상자 안쪽에
    rr(ctx, box[0] + d, box[1] + d, box[2] - d, box[3] - d, Math.max(0, r - d)); ctx.stroke(); ctx.globalAlpha = 1;
  }
  const ALIGN = { l: 'left', r: 'right', m: 'center' };
  const BASE = { a: 'top', s: 'alphabetic', m: 'middle' };
  function text(ctx, str, x, y, font, color, anchor, alpha) {
    if (alpha !== undefined && alpha <= 0.003) return;
    ctx.font = font; ctx.fillStyle = color; ctx.globalAlpha = alpha === undefined ? 1 : clamp01(alpha);
    ctx.textAlign = ALIGN[anchor[0]]; ctx.textBaseline = BASE[anchor[1]];
    ctx.fillText(str, x, y);
    ctx.globalAlpha = 1;
  }
  function textW(ctx, str, font) { ctx.font = font; return ctx.measureText(str).width; }

  // 동그라미 숫자(①–⑨): 웹 글꼴의 나눔고딕에는 이 글자가 없어 기기마다 다른 글꼴로 바뀌므로, 원과 숫자를 직접 그린다
  function richParts(str) {
    const out = [];
    let buf = '';
    for (const ch of str) {
      const c = ch.codePointAt(0);
      if (c >= 0x2460 && c <= 0x2468) { if (buf) out.push(buf); out.push(c - 0x245F); buf = ''; }
      else buf += ch;
    }
    if (buf) out.push(buf);
    return out;
  }
  const sansFont = (wt, px) => `${wt} ${px}px ${SANS}`;
  function richW(ctx, str, wt, px) {
    let w = 0;
    for (const part of richParts(str)) w += typeof part === 'number' ? 0.92 * px : textW(ctx, part, sansFont(wt, px));
    return w;
  }
  function rich(ctx, str, x, y, wt, px, color, alpha) {      // 가운데 맞춤('mm')만
    if (alpha !== undefined && alpha <= 0.003) return;
    const parts = richParts(str);
    if (parts.length === 1 && typeof parts[0] === 'string') return text(ctx, str, x, y, sansFont(wt, px), color, 'mm', alpha);
    let cx = x - richW(ctx, str, wt, px) / 2;
    ctx.globalAlpha = alpha === undefined ? 1 : clamp01(alpha);
    ctx.fillStyle = color; ctx.strokeStyle = color; ctx.textBaseline = 'middle';
    for (const part of parts) {
      if (typeof part === 'number') {
        const r = 0.41 * px, ox = cx + 0.46 * px;
        ctx.lineWidth = Math.max(1, (wt >= 700 ? 0.08 : 0.06) * px);
        ctx.beginPath(); ctx.arc(ox, y, r, 0, Math.PI * 2); ctx.stroke();
        ctx.font = sansFont(wt, 0.62 * px); ctx.textAlign = 'center';
        ctx.fillText(String(part), ox, y + 0.02 * px);
        cx += 0.92 * px;
      } else {
        ctx.font = sansFont(wt, px); ctx.textAlign = 'left';
        ctx.fillText(part, cx, y);
        cx += ctx.measureText(part).width;
      }
    }
    ctx.globalAlpha = 1;
  }

  // 규칙표의 한 열: 머리(상태 이름) + 칸 셋. on = 지금 상태, hit = 지금 읽은 기호의 칸, cover = 고정 층 위에 덮어 그림
  function drawColumn(ctx, LY, TH, T, num, c, on, hit, cover) {
    const s = STATES[c], x = LY.gx0 + LY.glab + c * LY.gcol;
    const hb = [x + 3, LY.gyHead, x + LY.gcol - 5, LY.gyHead + 34];
    fillRR(ctx, hb, 17, on ? mix(TH.bg, TH.gold, 0.16) : TH.bg, 1);
    strokeRR(ctx, hb, 17, on ? TH.gold : TH.hdrLine, 1.5, 1);
    rich(ctx, headName(T, s, num), x + LY.gcol / 2 - 1, LY.gyHead + 17, 700, 19.5, on ? TH.hot : TH.hdrText);
    ROWS.forEach(([sym], r) => {
      const tx = cellText(T, s, sym, num);
      const y = LY.gyRow + r * LY.gpitch, b = [x + 3, y, x + LY.gcol - 5, y + 38], cx = (b[0] + b[2]) / 2;
      if (cover) { ctx.fillStyle = TH.bg; ctx.fillRect(b[0] - 2, b[1] - 2, b[2] - b[0] + 4, b[3] - b[1] + 4); }
      if (hit === sym) {
        fillRR(ctx, b, 9, TH.gold, 1);
        rich(ctx, tx, cx, y + 18, 700, 27, TH.bg);
      } else if (tx) {
        rich(ctx, tx, cx, y + 18, 400, 27, on ? TH.cellTextOn : TH.cellText);
      } else {
        text(ctx, '·', cx, y + 18, F.cell, TH.cellDot, 'mm');
      }
    });
  }

  // ───────────────────────────── 웹 컴포넌트 ─────────────────────────────
  const STYLE = `
    :host { display: block; position: relative; width: 100%; max-width: 100%; -webkit-tap-highlight-color: transparent; }
    :host([hidden]) { display: none; }
    .stage { position: relative; cursor: pointer; outline: none; border-radius: 6px; }
    .stage:focus-visible { box-shadow: 0 0 0 2px #9A7628; }
    canvas { display: block; width: 100%; height: auto; }
    .play { position: absolute; left: 50%; top: 50%; width: 60px; height: 60px; margin: -30px 0 0 -30px; border-radius: 50%;
            border: 1.5px solid #9A7628; background: rgba(255,255,255,.88); color: #9A7628; display: none;
            align-items: center; justify-content: center; pointer-events: none; }
    .play svg { width: 22px; height: 22px; margin-left: 4px; fill: currentColor; }
    .stage.paused .play { display: flex; }
    :host([theme="dark"]) .play { background: rgba(13,13,16,.85); border-color: #C6A660; color: #C6A660; }
    .bar { display: flex; flex-wrap: wrap; align-items: center; gap: 8px 16px; margin-top: 10px;
           font: 13px/1.4 "Nanum Gothic", NanumGothic, system-ui, sans-serif; color: #6A6772; }
    .bar[hidden] { display: none; }
    .bar button, .bar input, .bar select { font: inherit; color: #1F1E24; background: #fff; border: 1px solid #DCDAE0;
           border-radius: 6px; padding: 4px 10px; }
    .bar button { cursor: pointer; min-width: 2.6em; }
    .bar button:hover { border-color: #9A7628; }
    .bar input { width: 6.5em; }
    .bar label { display: inline-flex; align-items: center; gap: 6px; }
    .bar .info { margin-left: auto; color: #8F8C97; }
    :host([theme="dark"]) .bar { color: #9C99A3; }
    :host([theme="dark"]) .bar button, :host([theme="dark"]) .bar input, :host([theme="dark"]) .bar select {
           color: #EEEBE3; background: #17161B; border-color: #2B2A31; }
    :host([theme="dark"]) .bar .info { color: #55535D; }
  `;
  const PLAY_SVG = '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M6 4l14 8-14 8z"/></svg>';
  const reducedMotion = () => !!(window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches);

  class Turing3n1 extends HTMLElement {
    static get observedAttributes() { return ['start', 'theme', 'numbers', 'layout', 'speed', 'loop', 'controls', 'lang']; }

    constructor() {
      super();
      const root = this.attachShadow({ mode: 'open' });
      root.innerHTML = `<style>${STYLE}</style>
        <div class="stage" part="stage" tabindex="0">
          <canvas part="canvas" role="img"></canvas>
          <div class="play">${PLAY_SVG}</div>
        </div>
        <div class="bar" part="controls" hidden>
          <button type="button" data-act="toggle"></button>
          <button type="button" data-act="restart" title="처음부터 (R)" aria-label="처음부터">↺</button>
          <label><span data-t="startLabel">출발 수</span> <input type="number" min="1" max="1000000" step="1" inputmode="numeric"></label>
          <label><span data-t="speedLabel">속도</span> <select>
            <option value="0.5">×0.5</option><option value="1">×1</option><option value="2">×2</option>
            <option value="4">×4</option><option value="8">×8</option></select></label>
          <span class="info"></span>
        </div>`;
      this._stage = root.querySelector('.stage');
      this._canvas = root.querySelector('canvas');
      this._ctx = this._canvas.getContext('2d');
      this._gcan = document.createElement('canvas');           // 빛번짐을 그리는 1/4 해상도 캔버스
      this._gctx = this._gcan.getContext('2d');
      this._gmask = document.createElement('canvas');          // 빛날 자리의 가면 (같은 크기)
      this._gmctx = this._gmask.getContext('2d');
      this._bar = root.querySelector('.bar');
      this._btnToggle = root.querySelector('[data-act="toggle"]');
      this._input = root.querySelector('input');
      this._select = root.querySelector('select');
      this._info = root.querySelector('.info');
      this._t = 0; this._cam = 0; this._playing = false; this._started = false; this._ended = false;
      this._visible = true; this._fontsReady = false; this._raf = 0; this._last = 0;
      this._tick = this._tick.bind(this);

      this._stage.addEventListener('click', () => this.toggle());
      this._stage.addEventListener('keydown', e => {
        if (e.key === ' ' || e.key === 'Enter') { e.preventDefault(); this.toggle(); }
        else if (e.key === 'r' || e.key === 'R') { e.preventDefault(); this.restart(); this.play(); }
      });
      this._btnToggle.addEventListener('click', () => this.toggle());
      root.querySelector('[data-act="restart"]').addEventListener('click', () => { this.restart(); this.play(); });
      this._input.addEventListener('change', () => { this.setAttribute('start', this._input.value); this.play(); });
      this._select.addEventListener('change', () => this.setAttribute('speed', this._select.value));
    }

    // ── 공개 API
    get start() { return this._M ? this._M.n : this._readStart(); }
    set start(v) { this.setAttribute('start', String(v)); }
    get duration() { return this._M ? this._M.TOTAL : 0; }
    get currentTime() { return this._t; }
    set currentTime(v) {
      if (!this._M) return;
      this._t = Math.max(0, Math.min(this._M.TOTAL - 0.001, +v || 0));
      this._cam = camTarget(this._M, this._G, this._t);
      this._started = true; this._ended = false;
      this._render();
    }
    get paused() { return !this._playing; }
    play() {
      if (!this._M) return;
      if (!this._started || this._ended) { this._t = 0; this._cam = 0; this._started = true; this._ended = false; }
      this._setPlaying(true);
    }
    pause() { this._setPlaying(false); }
    toggle() { if (this._playing) this.pause(); else this.play(); }
    restart() { this._t = 0; this._cam = 0; this._started = true; this._ended = false; this._render(); }

    // ── 수명
    connectedCallback() {
      this._ro = new ResizeObserver(() => this._resize());
      this._ro.observe(this);
      if ('IntersectionObserver' in window) {        // 화면 밖에 있으면 그리지 않는다
        this._io = new IntersectionObserver(es => {
          this._visible = es[es.length - 1].isIntersecting;
          this._schedule();
        });
        this._io.observe(this);
      }
      if (this._M) { this._schedule(); return; }      // 다른 자리로 옮겨 붙은 경우
      this._readAll();
      this._build();
      ensureFonts(this.getAttribute('fonts') !== 'none').then(() => {
        this._fontsReady = true; this._last = 0; this._render();
      });
      const auto = this.getAttribute('autoplay');
      const wantPlay = auto === 'off' || auto === 'false' ? false : (auto === null ? !reducedMotion() : true);
      if (wantPlay) this.play();
      else { this._showPoster(); this._setPlaying(false); }
    }
    disconnectedCallback() {
      if (this._raf) cancelAnimationFrame(this._raf);
      this._raf = 0;
      if (this._ro) this._ro.disconnect();
      if (this._io) this._io.disconnect();
    }
    attributeChangedCallback(name, oldV, newV) {
      if (!this._M || oldV === newV) return;
      this._readAll();
      if (name === 'start') {
        const n = this._readStart();
        if (n !== this._M.n) { this._build(); this.restart(); }
      } else if (name === 'layout') {
        this._resize(true);
      } else {
        this._syncBar(); this._render();
      }
    }

    // ── 안쪽
    _readStart() {
      const n = Math.floor(Number(this.getAttribute('start')));
      return Number.isFinite(n) && n >= 1 ? Math.min(n, 1000000) : 27;
    }
    _lang() {
      const host = this.closest('[lang]');
      const l = ((host && host.getAttribute('lang')) || document.documentElement.getAttribute('lang') || '').toLowerCase();
      return /^en(-|$)/.test(l) ? 'en' : 'ko';
    }
    _readAll() {
      this._langName = this._lang(); this._T = TEXT[this._langName];
      const theme = this.getAttribute('theme') === 'dark' ? 'dark' : 'light';
      this._themeName = theme; this._TH = THEMES[theme];
      const num = this.getAttribute('numbers');
      this._numbers = num === null ? theme === 'dark' : (num !== 'off' && num !== 'false');
      const sp = parseFloat(this.getAttribute('speed'));
      this._speed = Number.isFinite(sp) ? Math.max(0.1, Math.min(16, sp)) : 1;
      const lp = this.getAttribute('loop');
      this._loop = !(lp === 'off' || lp === 'false');
      this._bar.hidden = !this.hasAttribute('controls') || this.getAttribute('controls') === 'off';
    }
    _build() {
      this._M = buildModel(this._readStart());
      if (this._LY) this._G = geometry(this._LY, this._M);
      this._syncBar();
    }
    _syncBar() {
      const M = this._M;
      if (!M) return;
      this._input.value = M.n;
      const sv = String(this._speed);
      if (![...this._select.options].some(o => o.value === sv)) this._select.add(new Option('×' + sv, sv));
      this._select.value = sv;
      const T = this._T;
      this._info.textContent = T.info(M.NIT, M.N, M.VMAX);
      this._canvas.setAttribute('aria-label', T.aria(M));
      this._stage.setAttribute('aria-label', T.stage);
      const rb = this.shadowRoot.querySelector('[data-act="restart"]');
      rb.title = T.restartTitle; rb.setAttribute('aria-label', T.restart);
      this.shadowRoot.querySelectorAll('[data-t]').forEach(el => { el.textContent = T[el.dataset.t]; });
      this._updateToggle();
    }
    _updateToggle() {
      const T = this._T || TEXT.ko;
      this._btnToggle.textContent = this._playing ? '❚❚' : '▶';
      this._btnToggle.title = this._playing ? T.pauseTitle : T.playTitle;
      this._btnToggle.setAttribute('aria-label', this._playing ? T.pause : T.play);
      this._stage.classList.toggle('paused', !this._playing);
    }
    _setPlaying(on) {
      this._playing = !!on; this._last = 0;
      this._updateToggle(); this._schedule();
      if (!on) this._render();
    }
    _schedule() {
      if (this._playing && this._visible && !this._raf) this._raf = requestAnimationFrame(this._tick);
    }
    _showPoster() {                 // 기다리는 동안 보여 줄 장면: 여섯 번째 계산 직후
      const M = this._M;
      const tt = M.NIT >= 1 ? M.VCH[Math.min(6, M.NIT)].t + 0.6 : M.HALT_T0 + 1;
      this._t = Math.min(tt, M.OUT_T0 - 0.01);
      if (this._G) this._cam = camTarget(M, this._G, this._t);
      this._started = false;
    }
    _resize(force) {
      const cssW = this.clientWidth;
      if (!cssW) return;
      const mode = this.getAttribute('layout');
      const name = mode === 'wide' || mode === 'narrow' ? mode : (cssW < 640 ? 'narrow' : 'wide');
      if (force || this._LY !== LAYOUTS[name]) {
        this._LY = LAYOUTS[name];
        this._G = geometry(this._LY, this._M);
        if (!this._started) this._showPoster();
        this._fades = null;
      }
      const LY = this._LY;
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      const pw = Math.min(Math.round(cssW * dpr), 2560);
      const ph = Math.round(pw * LY.H / LY.W);
      if (this._canvas.width !== pw || this._canvas.height !== ph) {
        this._canvas.width = pw; this._canvas.height = ph;
        this._gcan.width = this._gmask.width = Math.max(1, Math.ceil(pw / 4));
        this._gcan.height = this._gmask.height = Math.max(1, Math.ceil(ph / 4));
        this._fades = null;
      }
      this._render();
    }
    _tick(now) {
      this._raf = 0;
      if (!this._playing || !this._visible) return;
      const dt = this._last ? Math.min(0.1, (now - this._last) / 1000) : 0;
      this._last = now;
      if (this._fontsReady && this._G) this._advance(dt * this._speed);
      this._render();
      this._schedule();
    }
    _advance(dt) {
      const M = this._M;
      let t = this._t + dt;
      if (t >= M.TOTAL) {
        if (this._loop) { t -= M.TOTAL; this._cam = 0; }
        else { t = M.OUT_T0 - 0.001; this._ended = true; this._t = t; this._setPlaying(false); return; }
      }
      const tgt = camTarget(M, this._G, t);
      this._cam += (tgt - this._cam) * (1 - Math.exp(-dt / TAU));
      this._t = t;
    }

    _render() {
      if (!this._M || !this._LY || !this._canvas.width) return;
      this._draw(this._t);
    }

    // 고정 층: 바탕 · 할 일 · 규칙표 머리글 · 줄 이름 · 쉬고 있는 규칙표. 크기 · 배치 · 색 · 글꼴이 바뀔 때만 다시 그린다
    _baseLayer() {
      const cw = this._canvas.width, ch = this._canvas.height, LY = this._LY, TH = this._TH, num = this._numbers, T = this._T;
      const key = [cw, ch, LY.W, this._themeName, num, this._fontsReady, this._langName].join('|');
      if (this._base && this._baseKey === key) return this._base;
      const b = this._base || (this._base = document.createElement('canvas'));
      b.width = cw; b.height = ch; this._baseKey = key;
      const ctx = b.getContext('2d'), k = cw / LY.W;
      ctx.fillStyle = TH.bg; ctx.fillRect(0, 0, cw, ch);
      ctx.setTransform(k, 0, 0, k, 0, 0);
      text(ctx, T.task, LY.taskX, LY.taskY, F.task, TH.task, 'ra');
      const gRight = LY.gx0 + LY.glab + 6 * LY.gcol - 5;
      text(ctx, T.table, LY.gx0, LY.gyHdr, F.hdr, TH.label, 'la');
      text(ctx, T.legend, gRight, LY.gyHdr, F.hdr, TH.label, 'ra');
      ctx.strokeStyle = TH.rule; ctx.lineWidth = 1.5;
      ctx.beginPath(); ctx.moveTo(LY.gx0, LY.gyLine); ctx.lineTo(gRight, LY.gyLine); ctx.stroke();
      T.rows.forEach((lab, r) => text(ctx, lab, LY.gx0, LY.gyRow + r * LY.gpitch + 5, F.row, TH.rowLabel, 'la'));
      for (let c = 0; c < STATES.length; c++) drawColumn(ctx, LY, TH, T, num, c, false, null, false);
      return b;
    }

    _draw(tt) {
      const ctx = this._ctx, M = this._M, LY = this._LY, G = this._G, TH = this._TH, num = this._numbers, T = this._T;
      const cw = this._canvas.width, ch = this._canvas.height, k = cw / LY.W;
      const S = stateAt(M, tt), cam = this._cam, oa = S.outA;
      const cell = G.cell, sc = G.s, tapeY = LY.tapeY;
      const cellX = i => G.anchor + (i - cam) * cell;
      const glows = [];                                      // [x0, y0, x1, y1, r, 세기, 잘라내기?]
      const glow = (x0, y0, x1, y1, r, a) => { if (a > 0.004) glows.push([x0, y0, x1, y1, r, a, false]); };
      const cut = (x0, y0, x1, y1, r, a) => glows.push([x0, y0, x1, y1, r, a, true]);

      ctx.setTransform(1, 0, 0, 1, 0, 0);
      ctx.globalCompositeOperation = 'source-over'; ctx.globalAlpha = 1;
      ctx.drawImage(this._baseLayer(), 0, 0);                // 바탕 + 고정 글 + 쉬고 있는 규칙표 (한 번만 그려 둔 것)
      ctx.setTransform(k, 0, 0, k, 0, 0);
      ctx.lineCap = 'butt'; ctx.lineJoin = 'round';

      // ── 빈 칸의 테두리 (카메라를 따라 흐른다)
      const i0 = Math.floor(cam - G.anchor / cell) - 1, i1 = Math.ceil(cam + (LY.W - G.anchor) / cell) + 1;
      ctx.strokeStyle = TH.cellLine; ctx.lineWidth = 1.5;
      for (let i = i0; i <= i1; i++) {
        const x = cellX(i);
        rr(ctx, x + 3 * sc, tapeY + 3 * sc, x + cell - 3 * sc, tapeY + cell - 3 * sc, 9 * sc); ctx.stroke();
      }

      // ── 칸 채움과 숫자
      const fDigit = F.digit(Math.round(50 * sc * 10) / 10);
      const cells = new Set();
      for (let j = 0; j < S.tape.s.length; j++) if (S.tape.s[j] !== '_') cells.add(S.tape.lo + j);
      for (const i of S.flip.keys()) cells.add(i);
      for (const i of [...cells].sort((a, b) => a - b)) {
        const x = cellX(i);
        if (x < -cell || x > LY.W) continue;
        let h = S.heat.get(i) || 0, aIn = 1, dy = 0;
        if (S.inProg !== null && tt < M.HEAD_T0 + 3) {           // 처음: 숫자가 위에서 하나씩 내려앉는다
          const kk = i + (M.start.length - 1);
          if (kk >= 0 && kk < M.start.length) {
            const u = (S.inProg - kk * M.stagger) / T_IN_ANIM;
            if (u <= 0) continue;
            aIn = easeOut(u); dy = -(1 - easeOut(u)) * 46 * sc;
            h = Math.max(h, 0.9 * (1 - ease(Math.max(0, u - 0.6) / 1.4)));
          }
        }
        const a = aIn * oa;
        const fl = S.flip.get(i);
        let fa = a;
        if (fl && fl[1] === '_') fa = a * (1 - fl[2]);          // 지워지는 칸은 채움도 함께 사라진다
        if (fl && fl[0] === '_') fa = a * fl[2];
        const box = [x + 3 * sc, tapeY + 3 * sc, x + cell - 3 * sc, tapeY + cell - 3 * sc];
        fillRR(ctx, box, 9 * sc, mix(TH.cell, TH.cellHot, h * TH.heatMix), fa);
        const cx = x + cell / 2, cy = tapeY + cell / 2 - 2 * sc;
        if (fl) {
          const [oldS, newS, u] = fl;
          if (oldS !== '_') text(ctx, oldS, cx, cy - u * 36 * sc + dy, fDigit, mix(TH.ink, TH.gold, u), 'mm', (1 - u) * a);
          if (newS !== '_') text(ctx, newS, cx, cy + (1 - u) * 36 * sc + dy, fDigit, TH.hot, 'mm', u * a);
          glow(x + 8 * sc, tapeY + 8 * sc, x + cell - 8 * sc, tapeY + cell - 8 * sc, 10, 0.55 * u * a);
        } else {
          const c = tapeGet(S.tape, i);
          if (c) text(ctx, c, cx, cy + dy, fDigit, mix(TH.ink, TH.hot, h), 'mm', a);
          if (h > 0.02) glow(x + 10 * sc, tapeY + 10 * sc, x + cell - 10 * sc, tapeY + cell - 10 * sc, 10, 0.45 * h * a);
        }
      }
      for (const [i, h] of S.heat) {                           // 지워진 자리에 남는 빛
        if (!cells.has(i) && h > 0.05) {
          const x = cellX(i);
          glow(x + 12 * sc, tapeY + 12 * sc, x + cell - 12 * sc, tapeY + cell - 12 * sc, 10, 0.30 * h * oa);
        }
      }

      // ── 머리
      const ha = S.headA * oa;
      if (S.headI !== null && ha > 0.01) {
        const hx = cellX(S.headI), drop = (1 - S.headA) * -36;
        [0.20, 0.14, 0.09, 0.055, 0.03].forEach((al, j) => {   // 움직일 때 테이프 아래를 스치는 잔상
          const px = cellX(headAt(M, tt - (j + 1) * 1.6 / 60));
          if (Math.abs(px - hx) > 1.5) {
            fillRR(ctx, [px + 10 * sc, tapeY + cell + 9, px + cell - 10 * sc, tapeY + cell + 13], 2, TH.gold, Math.min(1, al * 2.2) * ha);
            glow(px + 6 * sc, tapeY + cell + 5, px + cell - 6 * sc, tapeY + cell + 17, 4, al * 1.6 * ha);
          }
        });
        const hot = S.pillHot, gcol = mix(TH.gold, TH.hot, hot);
        strokeRR(ctx, [hx - 2, tapeY - 2 + drop, hx + cell + 2, tapeY + cell + 2 + drop], 12 * sc, gcol, 3.2, ha);
        glow(hx - 6, tapeY - 6, hx + cell + 6, tapeY + cell + 6, 12, (0.30 + 0.35 * S.frameGlow + 0.3 * hot) * ha);
        cut(hx + 8 * sc, tapeY + 8 * sc, hx + cell - 8 * sc, tapeY + cell - 8 * sc, 8, TH.cutA);
        const cx = hx + cell / 2;
        ctx.globalAlpha = ha; ctx.fillStyle = gcol;
        ctx.beginPath(); ctx.moveTo(cx - 11, tapeY - 26 + drop); ctx.lineTo(cx + 11, tapeY - 26 + drop);
        ctx.lineTo(cx, tapeY - 9 + drop); ctx.closePath(); ctx.fill(); ctx.globalAlpha = 1;
        const label = pillName(T, S.pill, num);
        const pw = richW(ctx, label, 700, 25) + 44;
        const pcx = Math.min(Math.max(cx, LY.pillMin + pw / 2), LY.pillMax - pw / 2);
        const box = [pcx - pw / 2, tapeY - 80 + drop, pcx + pw / 2, tapeY - 34 + drop];
        if (S.pill === 'H') {
          fillRR(ctx, box, 23, mix(TH.bg, TH.gold, 0.25 + 0.75 * hot), ha);
          strokeRR(ctx, box, 23, gcol, 2, ha);
          rich(ctx, label, pcx, box[1] + 22, 700, 25, mix(TH.gold, TH.bg, hot), ha);
          glow(box[0], box[1], box[2], box[3], 23, 0.5 * hot * ha);
        } else {
          fillRR(ctx, box, 23, TH.bg, ha);
          strokeRR(ctx, box, 23, TH.gold, 2, ha);
          rich(ctx, label, pcx, box[1] + 22, 700, 25, TH.gold, ha);
        }
      }

      // ── 읽기 · 쓰기 · 이동
      let px = LY.phaseX;
      for (const [name, ph] of [[T.phases[0], 'read'], [T.phases[1], 'write'], [T.phases[2], 'move']]) {
        const on = S.phase === ph && !S.fast, soft = S.fast && S.phase !== null;
        if (on) {
          ctx.globalAlpha = oa; ctx.fillStyle = TH.gold;
          ctx.beginPath(); ctx.arc(px - 12.5, LY.phaseY + 16.5, 4.5, 0, Math.PI * 2); ctx.fill(); ctx.globalAlpha = 1;
        }
        text(ctx, name, px, LY.phaseY, on ? F.capB : F.cap, on ? TH.phaseOn : (soft ? TH.phaseSoft : TH.phaseOff), 'la');
        px += 132;
      }

      // ── 규칙표: 지금 상태의 열만 다시 그린다 (나머지는 고정 층에 있음)
      const act = S.cellRC;
      if (act) {
        const c = STATES.indexOf(act[0]);
        drawColumn(ctx, LY, TH, T, num, c, S.pill !== 'H', act[1], true);
        const x = LY.gx0 + LY.glab + c * LY.gcol, y = LY.gyRow + ROWS.findIndex(r => r[0] === act[1]) * LY.gpitch;
        glow(x + 3, y, x + LY.gcol - 5, y + 38, 9, 0.55);
      }

      // ── 테이프에 적힌 수 + 궤적 그래프
      if (S.inProg !== null) {
        const ra = ease((S.inProg - 1.2) / 0.8) * oa;
        if (ra > 0.01) {
          const V = LY.V, Gr = LY.Gr, vt = S.valueT;
          const flash = vt !== null ? Math.exp(-vt / 0.7) : 0;
          text(ctx, T.tape, V.x, V.hdrY, F.hdr, TH.label, 'ra', ra);
          const lab = S.it ? T.nth(S.it) : T.start;
          const labW = textW(ctx, lab, F.hdr);
          const stepsTxt = T.steps(S.steps);
          text(ctx, lab, Gr.x0, Gr.labY, F.hdr, TH.stepLabel, 'ls', ra);
          text(ctx, stepsTxt, Gr.x0 + labW + 14, Gr.labY, F.sub, TH.stepCount, 'ls', ra);
          const w2 = textW(ctx, '(2)', F.sub);
          text(ctx, '(2)', V.x, V.subY, F.sub, TH.label, 'rs', ra);
          const bins = S.value.toString(2);
          const binMin = V.binMinX !== null ? V.binMinX : Gr.x0 + labW + 14 + textW(ctx, stepsTxt, F.sub) + 24;
          let binPx = 31;
          const bw0 = textW(ctx, bins, F.bin(31)), avail = V.x - w2 - 5 - binMin;
          if (bw0 > avail) binPx = Math.max(12, 31 * avail / bw0);
          text(ctx, bins, V.x - w2 - 5, V.binY, F.bin(binPx), TH.bin, 'rs', ra);
          const big = fmt(S.value);
          let bigPx = 112;
          const bw1 = textW(ctx, big, F.big(112));
          if (bw1 > V.x - V.bigMinX) bigPx = Math.max(40, 112 * (V.x - V.bigMinX) / bw1);
          const slide = vt !== null ? (1 - easeOut(vt / 0.30)) * 22 : 0;
          text(ctx, big, V.x, V.bigY + slide, F.big(bigPx), mix(TH.ink, TH.hot, flash), 'rs',
               ra * (vt !== null ? easeOut(vt / 0.2) : 1));
          const bw = textW(ctx, big, F.big(bigPx));
          if (flash > 0.03) glow(V.x - bw - 10, V.flashTop, V.x + 10, V.flashBot, 20, 0.32 * flash * ra);
          if (S.op && vt !== null) {
            const oa2 = !S.fast ? Math.max(0, 1 - vt / 1.1) : Math.max(0.25, 1 - vt / 0.5);
            text(ctx, S.op, V.x, V.opY, F.op, TH.gold, 'rs', ra * Math.min(1, oa2));
          }
          // 그래프
          ctx.globalAlpha = ra; ctx.strokeStyle = TH.rule; ctx.lineWidth = 1.5;
          ctx.beginPath(); ctx.moveTo(Gr.x0, Gr.y1); ctx.lineTo(Gr.x1, Gr.y1); ctx.stroke();
          const NIT = Math.max(1, M.NIT);
          const P = i => [lerp(Gr.x0, Gr.x1, M.VCH[i].it / NIT), Gr.y1 - (M.VCH[i].val / M.VMAX) * (Gr.y1 - Gr.y0)];
          if (S.vi >= 1) {
            ctx.globalAlpha = (230 / 255) * ra; ctx.strokeStyle = TH.gold; ctx.lineWidth = 2.2;
            ctx.beginPath();
            for (let i = 0; i <= S.vi; i++) { const [x, y] = P(i); if (i) ctx.lineTo(x, y); else ctx.moveTo(x, y); }
            ctx.stroke();
          }
          const [dx, dy] = P(S.vi);
          ctx.globalAlpha = ra; ctx.fillStyle = TH.hot;
          ctx.beginPath(); ctx.arc(dx, dy, 4.5, 0, Math.PI * 2); ctx.fill(); ctx.globalAlpha = 1;
          glow(dx - 9, dy - 9, dx + 9, dy + 9, 9, 0.8 * ra);
          if (S.it >= M.IT_MAX && M.IT_MAX > 0) {
            const pa = ease((tt - M.VCH[M.IT_MAX].t) / 0.6) * ra;
            const pk = T.peak(M.VMAX), pkw = textW(ctx, pk, F.sub);
            const rx = Math.min(Math.max(lerp(Gr.x0, Gr.x1, M.IT_MAX / NIT) - 10, Gr.x0 + pkw), Gr.x1 + 30);
            text(ctx, pk, rx, Gr.y0 + 6, F.sub, TH.peak, 'rs', pa);
          }
        }
      }

      // ── 테이프 띠의 양 끝을 바탕색으로 흐리게
      if (!this._fades || this._fades.theme !== TH || this._fades.LY !== LY) {
        const mk = (x0, x1) => {
          const g = ctx.createLinearGradient(x0, 0, x1, 0);
          for (let i = 0; i <= 10; i++) g.addColorStop(i / 10, rgba(TH.bg, ease(1 - i / 10)));
          return g;
        };
        this._fades = { theme: TH, LY, L: mk(0, LY.fadeW), R: mk(LY.W, LY.W - LY.fadeW) };
      }
      ctx.fillStyle = this._fades.L; ctx.fillRect(0, tapeY - 22, LY.fadeW, cell + 44);
      ctx.fillStyle = this._fades.R; ctx.fillRect(LY.W - LY.fadeW, tapeY - 22, LY.fadeW, cell + 44);

      // ── 빛번짐 (원래 영상과 같은 방식): 1/4 해상도 가면에 빛날 자리를 세기만큼 칠하고(머리 안쪽은 도려냄),
      //    가면 전체를 σ 28 · 88 논리 픽셀로 두 번 흐려 금빛으로 겹친다 — 흐림은 프레임마다 두 번뿐
      const gm = this._gmctx, gmc = this._gmask, g = this._gctx, gc = this._gcan, s4 = k / 4;
      gm.setTransform(1, 0, 0, 1, 0, 0);
      gm.globalCompositeOperation = 'source-over';
      gm.clearRect(0, 0, gmc.width, gmc.height);
      for (const [x0, y0, x1, y1, r, a, isCut] of glows) {
        gm.globalCompositeOperation = isCut ? 'destination-out' : 'lighter';
        gm.fillStyle = `rgba(0,0,0,${clamp01(isCut ? a : a * TH.glowGain)})`;
        rr(gm, x0 * s4, y0 * s4, x1 * s4, y1 * s4, r * s4); gm.fill();
      }
      g.setTransform(1, 0, 0, 1, 0, 0);
      g.globalCompositeOperation = 'source-over';
      g.clearRect(0, 0, gc.width, gc.height);
      if (glows.length) {
        const OFF = gc.width + 400;
        g.shadowColor = TH.glow; g.shadowOffsetX = OFF; g.shadowOffsetY = 0;
        g.globalCompositeOperation = 'lighter';
        for (const sigma of [28, 88]) {
          g.shadowBlur = 2 * sigma * s4;
          g.drawImage(gmc, -OFF, 0);
        }
        g.shadowColor = 'rgba(0,0,0,0)'; g.shadowBlur = 0; g.shadowOffsetX = 0;
        g.globalCompositeOperation = 'source-over';
      }

      ctx.setTransform(1, 0, 0, 1, 0, 0);
      ctx.globalAlpha = 1;
      if (glows.length) {
        // 어두운 바탕은 더하기(원래 영상의 ImageChops.add), 흰 바탕은 곱하기 — 흰 데는 옅은 금빛, 글자는 그대로 진하게
        ctx.globalCompositeOperation = TH.glowMode === 'add' ? 'lighter' : 'multiply';
        ctx.drawImage(gc, 0, 0, cw, ch);
        ctx.globalCompositeOperation = 'source-over';
      }

      // ── 처음과 끝: 화면 전체가 바탕색에서 떠오르고, 바탕색으로 사라진다
      const fadeIn = ease(tt / (M.IN_T0 + 0.8));
      const whole = tt < M.IN_T0 + 0.8 ? fadeIn : (tt >= M.OUT_T0 ? oa : 1);
      if (whole < 1) {
        ctx.globalAlpha = 1 - whole; ctx.fillStyle = TH.bg; ctx.fillRect(0, 0, cw, ch); ctx.globalAlpha = 1;
      }
    }
  }

  window.customElements.define('turing-3n1', Turing3n1);
})();
