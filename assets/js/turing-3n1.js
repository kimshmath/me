/*!
 * turing-3n1.js · v1.5.0 · 2026-11-22
 *   v1.1  v1.0에 영어 화면 글을 더함
 *   v1.2  sequence(멈추면 다음 수로 이어 감)와 ridges('수의 변화' 그림)를 더함
 *   v1.3  tree('1로 가는 길' 나무 그림)를 더했다가
 *   v1.4  그 자리에 trace('기계가 지나온 길': 테이프 · 머리 · 상태의 역사를 입체로 세운 그림)를 넣음 (tree는 뺌)
 *   v1.4.1  trace: 좁은 화면에서 상태 이름이 오른쪽 끝에서 잘리지 않게 자리를 남김 · 돌려 볼 때 제목 줄이 가려지지 않게 함
 *   v1.5  규칙표의 칸마다 '다음 상태'(①–⑥)를 늘 보임 — 번호의 색 = 그 상태의 색('기계가 지나온 길'의 색과 같음).
 *         한 걸음 = 읽기 · 쓰기 · 이동 · 다음 상태: 마지막 단계에서 규칙표 머리의 금빛 테가 다음 상태의 열로 미끄러져 가고,
 *         방금 쓴 규칙의 다음 상태 번호가 빛나며, 머리 위 이름표가 다음 상태로 바뀜. 첫걸음은 0.62 → 0.74초.
 *   (v1.4까지는 sequence · ridges · trace를 쓰지 않으면 화면이 강연 덱의 영상과 픽셀까지 같았음. v1.5부터는 다음 상태를 보이므로 다름)
 * 3n+1(콜라츠) 튜링 기계 애니메이션 — 웹 컴포넌트 <turing-3n1>
 *
 * 「인간, 수학, AI — 생각을 생각하다」 강연 덱의 튜링 기계 영상(tm_video2.py가 PIL로 그려 만든 1920×496 영상)을
 * 브라우저에서 그대로 돌아가도록 Canvas 2D로 옮긴 것. 외부 라이브러리 없음, 파일 하나.
 *
 * ── 쓰는 법 ───────────────────────────────────────────────────────────────
 *   <script src="turing-3n1.js" defer></script>
 *   <turing-3n1></turing-3n1>                                   흰 바탕 · 27에서 출발 · 자동 재생 · 반복
 *   <turing-3n1 start="97" theme="dark" controls></turing-3n1>  어두운 바탕 · 97에서 출발 · 아래에 단추 줄
 *   <turing-3n1 theme="dark" start="random" sequence ridges></turing-3n1>
 *                                              수를 바꿔 가며 끝없이 · 아래에 '수의 변화' 그림
 *   <turing-3n1 theme="dark" start="random" sequence trace></turing-3n1>
 *                                              수를 바꿔 가며 끝없이 · 아래에 '기계가 지나온 길' 그림
 *
 * ── 속성 (모두 고르지 않아도 됨) ───────────────────────────────────────────
 *   start     출발 수, 1 – 1000000 (기본 27). random 이면 27 – 999 가운데 하나를 고름
 *   sequence  (이름만) 멈춘 뒤 같은 수로 되풀이하지 않고 다음 수(+1)로 넘어가 끝없이 이어 감
 *   ridges    (이름만) 아래에 '수의 변화' 그림을 그림: 출발한 수마다 줄 하나, 가로 = 계산 횟수, 높이 = 수의 크기.
 *             맨 앞의 금빛 줄이 지금 수이고, 앞선 수들의 줄은 뒤로 물러나 있음. 줄이 바닥에 닿아 평평해지면 멈춘 것.
 *             (이때 오른쪽의 작은 그래프 대신 출발한 수를 보여 줌)
 *   trace     (이름만) 아래에 '기계가 지나온 길' 그림을 그림(WebGL). 기계의 역사를 세 축으로 세운 것:
 *             가로 = 걸음, 세로 = 자릿수(맨 아래가 1의 자리), 깊이 = 상태. 뒷벽에는 걸음마다의 테이프(밝은 칸 = 1),
 *             그 앞에는 머리가 지나온 길이 상태의 색으로 그려지고, 벽과 바닥에 그 그림자가 놓임.
 *             기계가 한 걸음 걸을 때마다 한 걸음씩 자람(그 밖에 움직이는 것은 없음). 끌면 돌아가고, 단추로
 *             앞(테이프의 역사) · 위(상태의 역사) · 끝(머리의 궤도)에서 볼 수 있으며, 한 걸음을 누르면 기계가 그 걸음으로 돌아감.
 *             WebGL을 쓸 수 없으면 ridges 그림으로 대신함. 그림의 높이는 CSS 변수 --turing-3n1-trace-height(기본 300px),
 *             기계 그림의 폭은 --turing-3n1-machine-width(기본 100%)로 정함 → 아래 그림만 화면 폭을 다 쓰게 할 수 있음
 *   theme     light | dark — light = 강연 덱의 흰 바탕 영상, dark = 원래 영상(0D0D10 바탕) (기본 light)
 *   numbers   on | off — 상태 번호 ①–⑥과 규칙표의 '다음 상태' 표시 (기본 on. off면 v1.4의 밝은 화면처럼 쓸 기호 · 이동만)
 *   layout    auto | wide | narrow — narrow는 값과 그래프를 규칙표 아래로 내린 배치 (기본 auto: 폭 640px 미만이면 narrow.
 *             페이지의 CSS가 이 요소에 --turing-3n1-layout: wide | narrow 를 주면 auto는 그것을 따름)
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
      phases: ['읽기', '쓰기', '이동', '다음 상태'],
      table: '규 칙 표', legend: '각 칸  =  쓸 기호 · 이동 · 다음 상태',
      tape: '테이프에 적힌 수', start: '출발',
      nth: i => `${i}번째 계산`, steps: k => `${fmt(k)}걸음`, peak: v => `최고 ${fmt(v)}`,
      info: (i, k, v) => `${i}번 계산 · ${fmt(k)}걸음 · 최고 ${fmt(v)}`,
      aria: M => `3n+1 튜링 기계 애니메이션: 테이프에 이진수 ${M.start}(=${M.n})를 적고, 짝수면 2로 나누고 홀수면 3을 곱해 1을 더하기를 ` +
                 `${M.NIT}번 되풀이해 ${fmt(M.N)}걸음 만에 1에서 멈춤. 최고 ${fmt(M.VMAX)}.`,
      stage: '3n+1 튜링 기계 — 누르면 일시정지/재생',
      play: '재생', pause: '일시정지', playTitle: '재생 (스페이스)', pauseTitle: '일시정지 (스페이스)',
      restart: '처음부터', restartTitle: '처음부터 (R)', startLabel: '출발 수', speedLabel: '속도',
      from: '출발한 수', ridge: '수 의  변 화', ridgeLegend: '줄 하나  =  출발한 수 하나 · 높이는 수의 크기',
      traceTitle: '기 계 가  지 나 온  길',
      traceLegend: '가로  =  걸음 · 세로  =  자릿수 · 깊이  =  상태 · 끌면 돌아가고, 누르면 그 걸음으로 돌아감',
      traceLegendS: '끌어서 돌리고 · 눌러서 그 걸음으로',
      traceViews: ['입체', '테이프', '상태', '궤도'],
      traceViewTitles: ['비스듬히: 세 축을 함께', '앞에서: 테이프의 역사 (가로 걸음 · 세로 자릿수)',
                        '위에서: 상태의 역사 (가로 걸음 · 세로 상태)', '끝에서: 머리의 궤도 (가로 상태 · 세로 자릿수)'],
      traceInfo: (n, k, name, r, w, mv, halt) => `${fmt(n)}  ·  ${fmt(k)}번째 걸음  ·  ${name}  ·  ${r === '_' ? '빈칸' : r}을 읽고 ` +
                 (w === r ? '' : (w === '_' ? '지우고 ' : `${w}을 쓰고 `)) + (halt ? '멈춤' : (mv < 0 ? '왼쪽으로' : '오른쪽으로')),
      traceHalted: (n, k) => `${fmt(n)}  ·  ${fmt(k)}걸음 만에 멈춤`,
      traceAria: '튜링 기계가 지나온 길을 입체로 세운 그림. 가로는 걸음, 세로는 자릿수, 깊이는 상태이다. 뒷벽에는 걸음마다의 테이프가, ' +
                 '그 앞에는 머리가 지나온 길이 상태의 색으로 그려진다. 끌어서 돌려 볼 수 있고, 한 걸음을 누르면 기계가 그 걸음으로 돌아간다.',
      ariaSeq: (n, ridges) => `3n+1 튜링 기계 애니메이션: 테이프에 적힌 수가 짝수면 2로 나누고 홀수면 3을 곱해 1을 더하기를 되풀이하다가 ` +
                 `1이 되면 멈춤. ${n}에서 출발해, 멈출 때마다 다음 수로 넘어가 끝없이 이어 감.` +
                 (ridges ? ' 아래 그림은 출발한 수마다 줄 하나로, 수가 커졌다 작아지며 1에 이르는 모습을 보여 줌.' : ''),
    },
    en: {
      rows: ['If 0', 'If 1', 'If blank'],
      head: { P: 'Even? Odd?', Q: 'Is it 1?', C0: 'Carry 0', C1: 'Carry 1', C2: 'Carry 2', R: 'To right end' },
      pill: { P: 'Even? Odd?', Q: 'Is it 1?', C0: '×3+1 · carry 0', C1: '×3+1 · carry 1', C2: '×3+1 · carry 2',
              R: 'To right end', H: 'Halt' },
      erase: 'erase', halt: 'halt',
      task: 'If even ÷2   ·   If odd ×3+1   ·   Halt at 1',
      phases: ['Read', 'Write', 'Move', 'Next state'],
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
      from: 'Started from', ridge: 'How the number changes',
      traceTitle: 'Where the machine has been',
      traceLegend: 'across  =  steps · up  =  digits · depth  =  state · drag to turn, click a step to go back to it',
      traceLegendS: 'drag to turn · tap a step to go back to it',
      traceViews: ['3D', 'Tape', 'States', 'Orbit'],
      traceViewTitles: ['At an angle: all three axes', 'From the front: the history of the tape (steps across, digits up)',
                        'From above: the history of the state (steps across, states down)', 'From the end: the orbit of the head (states across, digits up)'],
      traceInfo: (n, k, name, r, w, mv, halt) => `${fmt(n)}  ·  step ${fmt(k)}  ·  ${name}  ·  reads ${r === '_' ? 'a blank' : r}` +
                 (w === r ? '' : (w === '_' ? ', erases it' : `, writes ${w}`)) + (halt ? ', halts' : `, moves ${mv < 0 ? 'left' : 'right'}`),
      traceHalted: (n, k) => `${fmt(n)}  ·  halted after ${fmt(k)} step${k === 1 ? '' : 's'}`,
      traceAria: 'The path of the Turing machine, stood up in three dimensions: steps across, digits up, states in depth. ' +
                 'The back wall shows the tape at every step; in front of it runs the path of the head, coloured by state. ' +
                 'Drag to turn it; click a step and the machine goes back to that step.',
      ridgeLegend: 'One line  =  one starting number · height = size of the number',
      ariaSeq: (n, ridges) => `Animation of a 3n+1 Turing machine: it halves the number on the tape when it is even and replaces it ` +
                 `by 3n+1 when it is odd, and halts when the number reaches 1. It starts from ${n} and, each time it halts, ` +
                 `goes on to the next number, without end.` +
                 (ridges ? ' The picture below has one line per starting number, showing the number rise and fall on its way to 1.' : ''),
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
  // 처음에는 한 걸음에 0.74초(읽기 · 쓰기 · 이동 · 다음 상태가 보임) → 0.066초까지 빨라짐 → 끝에서 다시 느려짐.
  const D0 = 0.74, DFAST = 0.066, KAPPA = 30, DEND = 0.42, KAPPA2 = 9;
  const T_EMPTY = 0.8, T_IN_ANIM = 0.55, T_HEAD_IN = 0.8, T_HALT = 4.2, T_OUT = 1.4, TAU = 0.42;
  const phases = d => (d >= 0.30 ? [0.24, 0.44, 0.74] : [0.10, 0.30, 0.64]);   // 한 걸음 안에서 읽기 | 쓰기 | 이동 | 다음 상태의 경계
  const TAU_HAND = 0.075;                       // 머리글의 금빛 테가 다음 상태의 열로 따라가는 빠르기(초, 빠른 걸음에서는 0.04까지)
  // sequence(이어 달리기): 멈춘 장면을 짧게 두고, 둘째 수부터는 빈 화면 · 느린 첫걸음을 줄인다
  const T_HALT_SEQ = 2.6, T_EMPTY_NEXT = 0.5, D0_NEXT = 0.32, KAPPA_NEXT = 10, T_GEOM = 0.5;

  function buildModel(n, seq, cont) {         // seq = 이어 달리기, cont = 그 가운데 둘째 수부터
    const sim = simulate(n), S = sim.steps, N = S.length;
    const start = n.toString(2);
    const stagger = start.length > 1 ? Math.min(0.26, 2.2 / (start.length - 1)) : 0.26;
    const IN_T0 = cont ? T_EMPTY_NEXT : T_EMPTY;
    const d0 = cont ? D0_NEXT : D0, kap = cont ? KAPPA_NEXT : KAPPA;
    const HEAD_T0 = IN_T0 + stagger * (start.length - 1) + T_IN_ANIM + 0.25;
    const T0 = new Float64Array(N);
    let t = HEAD_T0 + T_HEAD_IN + 0.45;
    for (let k = 0; k < N; k++) {
      const d = Math.max(DFAST + (d0 - DFAST) * Math.exp(-k / kap),
                         DFAST + (DEND - DFAST) * Math.exp(-(N - 1 - k) / KAPPA2));
      S[k].t0 = t; S[k].d = d; T0[k] = t; t += d;
    }
    const HALT_T0 = t, OUT_T0 = HALT_T0 + (seq ? T_HALT_SEQ : T_HALT), TOTAL = OUT_T0 + T_OUT + 0.5;
    const VCH = [{ t: IN_T0, it: 0, val: n, op: null }];            // 값이 바뀌는 시각
    const LCH = [{ t: IN_T0, L: 0, len: start.length }];            // 끝자리 위치 · 자릿수가 바뀌는 시각 (카메라용)
    for (const st of S) {
      if (!st.op) continue;
      const tt = st.t0 + phases(st.d)[1] * st.d;
      VCH.push({ t: tt, it: st.itAfter, val: st.valAfter, op: st.op });
      LCH.push({ t: tt, L: st.LAfter, len: st.lenAfter });
    }
    const traj = sim.traj;
    let VMAX = 0, IT_MAX = 0;
    traj.forEach((v, i) => { if (v > VMAX) { VMAX = v; IT_MAX = i; } });
    const REC = [];                                                  // 그때까지의 최고값을 새로 쓴 계산들 (ridges의 눈금)
    VCH.forEach((v, i) => {
      const last = REC[REC.length - 1];
      if (!last || v.val > last.val) REC.push({ i, t: v.t, val: v.val, prev: last ? last.val : v.val });
    });
    return {
      seq: !!seq, cont: !!cont, REC, REC_T: Float64Array.from(REC, r => r.t),
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
    const st = M.steps[k], u = (tt - st.t0) / st.d, [, b, c] = phases(st.d);
    return st.pos + st.move * (u >= b ? ease((u - b) / (c - b)) : 0);
  }

  // 규칙표 머리의 금빛 테: 지금 상태의 열에 있다가, 걸음마다 '다음 상태' 단계에서 다음 상태의 열로 따라감.
  // 따라가는 모양 = 한 차 지연(시간 상수 TAU_HAND) — 앞선 걸음들의 넘어감을 더해 시각 t만으로 계산(되감아도 같음).
  // 같은 상태에 머무는 규칙은 테가 움직이지 않고 한 번 빛남.
  function handAt(M, tt, k) {
    const col = s => STATES.indexOf(s);
    let target = null, x = 0, glow = 0;
    for (let j = Math.min(k, M.N - 1); j >= 0; j--) {
      const st = M.steps[j], tS = st.t0 + phases(st.d)[2] * st.d;
      if (tS > tt) { if (target === null) target = col(st.state); continue; }
      const from = col(st.state), to = st.next === 'H' ? from : col(st.next), dt = tt - tS;
      if (target === null) target = to;
      if (dt > 8 * TAU_HAND) break;
      x += (from - to) * Math.exp(-dt / Math.max(0.04, Math.min(TAU_HAND, 0.4 * (1 - phases(st.d)[2]) * st.d)));
      glow = Math.max(glow, Math.exp(-dt / 0.2) * Math.min(1, st.d / 0.3));
    }
    return { x: (target === null ? 0 : target) + x, glow, a: 1 };
  }

  function stateAt(M, tt) {
    const S = { tape: { lo: -(M.start.length - 1), s: M.start }, headI: null, headA: 0, pill: 'P', pillHot: 0,
                pillFrom: null, pillMix: 1, cellRC: null, colOn: true, hand: null, nextGlow: 0,
                phase: null, fast: false, heat: new Map(), flip: new Map(), value: M.n, valueT: null,
                op: null, it: 0, vi: 0, inProg: null, outA: 1, frameGlow: 0.5, steps: 0 };
    if (tt < M.IN_T0) { S.outA = 0; return S; }
    S.inProg = tt - M.IN_T0;
    if (tt >= M.HEAD_T0) S.headA = easeOut((tt - M.HEAD_T0) / T_HEAD_IN);
    S.headI = headAt(M, tt);
    const k = bisectRight(M.T0, tt) - 1;
    if (tt >= M.HALT_T0) {
      S.tape = M.end; S.pill = 'H'; S.pillHot = 1; S.steps = M.N; S.colOn = false;
      S.cellRC = tt - M.HALT_T0 < 0.9 ? ['Q', '_'] : null;
    } else if (k >= 0) {
      const st = M.steps[k], u = (tt - st.t0) / st.d, [a, b, c] = phases(st.d), p = st.pos;
      S.fast = st.d < 0.30; S.pill = st.state; S.cellRC = [st.state, st.read]; S.steps = k + 1;
      let tape = st.before;
      S.phase = u < a ? 'read' : (u < b ? 'write' : (u < c ? 'move' : 'state'));
      S.hand = handAt(M, tt, k);
      if (k === 0) S.hand.a = clamp01((tt - st.t0) / 0.15);
      S.frameGlow = u < a ? 0.55 + 0.45 * Math.sin(Math.min(1, u / a) * Math.PI) : 0.55;
      if (u >= a && st.write !== st.read) {
        if (u < b) S.flip.set(p, [st.read, st.write, ease((u - a) / (b - a))]);
        else tape = tapeWrite(tape, p, st.write);
      }
      if (u >= c) {                                   // 다음 상태
        const v = (u - c) / (1 - c);
        S.nextGlow = Math.sin(Math.PI * Math.min(1, v * 1.25)) * (S.fast ? 0.4 : 1);
        if (st.next === 'H') { S.pill = 'H'; S.pillHot = ease(v); S.colOn = false; S.hand.a *= 1 - ease(v); }
        else if (st.next !== st.state) {
          S.pillFrom = st.state; S.pill = st.next;
          S.pillMix = clamp01((tt - (st.t0 + c * st.d)) / Math.min(0.16, 0.9 * (1 - c) * st.d));
        }
      }
      S.tape = tape;
    }
    // 방금 쓴 칸에 남는 열기 (3초 안의 쓰기들)
    for (let j = Math.min(k, M.N - 1); j >= 0; j--) {
      const st = M.steps[j], tw = st.t0 + phases(st.d)[0] * st.d;
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
      W: 1920, H: 496, phaseX: 173, phaseY: 8, phaseDX: 132, taskX: 1747, taskY: 8,
      tapeY: 128, xmin: 120, xmax: 1742, cellMax: 84, cellMin: 40, fadeW: 280, pillMin: 113, pillMax: 1880,
      gx0: 173, glab: 126, gcol: 156, gyHdr: 244, gyLine: 274, gyHead: 284, gyRow: 330, gpitch: 47,
      V: { x: 1747, hdrY: 244, binY: 306, subY: 312, opY: 352, bigY: 468, bigMinX: 1430, flashTop: 372, flashBot: 474, binMinX: null },
      Gr: { x0: 1268, x1: 1462, y0: 362, y1: 466, labY: 306 },
      Fr: { x: 1268, labY: 400, numY: 468, px: 58, maxW: 150 },
      Rg: { h: 336, hx0: 173, hx1: 1747, x0: 173, x1: 1747, hdrY: 10, hor: 20, base: 298, ph: 156, dz: 0.062, rows: 48,
            smMin: 110, lw: 1, halo: 1, labPx: 22, subPx: 16, peakPx: 18, tails: 3, sway: 44 },
    },
    narrow: {
      W: 1120, H: 790, phaseX: 52, phaseY: 8, phaseDX: 120, taskX: 1088, taskY: 8,
      tapeY: 128, xmin: 24, xmax: 1096, cellMax: 84, cellMin: 30, fadeW: 110, pillMin: 12, pillMax: 1108,
      gx0: 32, glab: 126, gcol: 156, gyHdr: 244, gyLine: 274, gyHead: 284, gyRow: 330, gpitch: 47,
      V: { x: 1088, hdrY: 520, binY: 582, subY: 588, opY: 630, bigY: 752, bigMinX: 560, flashTop: 670, flashBot: 758, binMinX: 560 },
      Gr: { x0: 32, x1: 520, y0: 590, y1: 752, labY: 538 },
      Fr: { x: 32, labY: 640, numY: 752, px: 84, maxW: 420 },
      Rg: { h: 420, hx0: 32, hx1: 1088, x0: 104, x1: 1032, hdrY: 14, hor: 44, base: 378, ph: 200, dz: 0.075, rows: 40,
            smMin: 110, lw: 1.9, halo: 0.45, labPx: 34, subPx: 23, peakPx: 28, tails: 2, sway: 26 },
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
      from: '#8F8C97', ridgeLive: '#9A7628', mist: 0.10, mistLive: 0.16,
      ridge: [[0, '#1F1E24', 0.80], [0.12, '#55535C', 0.70], [0.40, '#8F8C97', 0.55], [0.75, '#B3B0B9', 0.36], [1, '#DCDAE0', 0]],
      sky: '#DCDAE0', skyA: 0,
      stc: ['#8A6A1E', '#0E8F82', '#2B4FD6', '#6D45C8', '#C2407F', '#B8660F'], numFade: 0.30,
    },
    dark: {    // 원래 영상(tm_video2.py)의 색
      bg: '#0D0D10', ink: '#EEEBE3', gold: '#C6A660', hot: '#F2D99A',
      cell: '#171D45', cellHot: '#3A332E', heatMix: 0.55, cellLine: '#2B2A31', rule: '#2B2A31',
      task: '#9C99A3', label: '#55535D', rowLabel: '#83818A',
      phaseOn: '#EEEBE3', phaseSoft: '#9C99A3', phaseOff: '#55535D',
      hdrText: '#9C99A3', hdrLine: '#55535D', cellText: '#7C7A84', cellTextOn: '#9C99A3', cellDot: '#55535D',
      bin: '#9C99A3', stepLabel: '#9C99A3', stepCount: '#55535D', peak: '#9C99A3',
      glow: '#C6A660', glowGain: 1.4, glowMode: 'add', cutA: 1,
      from: '#83818A', ridgeLive: '#F2D99A', mist: 0.24, mistLive: 0.22,
      ridge: [[0, '#EEEBE3', 0.80], [0.12, '#C4BEE2', 0.70], [0.40, '#767ED6', 0.58], [0.75, '#4652B0', 0.34], [1, '#343C8C', 0]],
      sky: '#3A46B0', skyA: 0.16,
      stc: ['#FFF1D0', '#4FD6C4', '#5E86FF', '#A98BFA', '#F58BB6', '#E9B65C'], numFade: 0.30,
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

  // ── ridges: 줄의 색(깊이 0 = 방금 끝난 줄 … 1 = 지평선), 줄의 높이, 3n+1 궤적
  function ridgeTone(TH, u) {
    let lut = TH.ridgeLut;
    if (!lut) {
      lut = TH.ridgeLut = [];
      const st = TH.ridge;
      for (let q = 0; q <= 64; q++) {
        const x = q / 64;
        let i = 1;
        while (i < st.length - 1 && x > st[i][0]) i++;
        const a = st[i - 1], b = st[i], f = clamp01((x - a[0]) / (b[0] - a[0])), ca = rgb(a[1]), cb = rgb(b[1]);
        const c = [0, 1, 2].map(j => Math.round(lerp(ca[j], cb[j], f)));
        lut.push({ rgb: c, c: c.join(','), a: lerp(a[2], b[2], f) });
      }
    }
    return lut[Math.round(clamp01(u) * 64)];
  }
  // 큰 수까지 올라간 줄일수록 조금 더 높게: 최고값 9,232인 줄이 기준 높이, 작은 줄은 그 0.42배까지
  const softAmp = v => Math.max(0.42, Math.min(1.12, 0.36 + 0.64 * Math.log(Math.max(2, v)) / Math.log(9232)));
  function ridgeRow(n) {                        // 앞선 수의 줄 (기계를 돌리지 않고 3n+1 계산만)
    const v = [n];
    let x = n, vmax = n;
    while (x !== 1) { x = x % 2 ? 3 * x + 1 : x / 2; v.push(x); if (x > vmax) vmax = x; }
    return { n, v, nit: v.length - 1, vmax };
  }
  const SWAY_T = 58, RIDGE_KEEP = 64;

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
      s += T.from + T.ridge + T.ridgeLegend;
      s += T.traceTitle + T.traceLegend + T.traceLegendS + T.traceViews.join('') + T.traceHalted(0, 2) +
           T.traceInfo(0, 0, '', '_', '1', -1, false) + T.traceInfo(0, 0, '', '1', '_', 1, true) + T.traceInfo(0, 0, '', '0', '0', 1, false);
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
  // nc(n) = 동그라미 숫자 n의 색(없으면 글자와 같은 색). badge = 동그라미 속을 이 색으로 채움(숫자는 nc의 색, 굵게).
  // 마지막 동그라미 숫자의 자리 [x, y, r]를 돌려줌
  function rich(ctx, str, x, y, wt, px, color, alpha, nc, badge) {      // 가운데 맞춤('mm')만
    if (alpha !== undefined && alpha <= 0.003) return null;
    const parts = richParts(str);
    if (parts.length === 1 && typeof parts[0] === 'string') { text(ctx, str, x, y, sansFont(wt, px), color, 'mm', alpha); return null; }
    let cx = x - richW(ctx, str, wt, px) / 2, at = null;
    ctx.globalAlpha = alpha === undefined ? 1 : clamp01(alpha);
    ctx.textBaseline = 'middle';
    for (const part of parts) {
      if (typeof part === 'number') {
        const r = 0.41 * px, ox = cx + 0.46 * px, ncol = nc ? nc(part) : color;
        if (badge) {
          ctx.fillStyle = badge; ctx.beginPath(); ctx.arc(ox, y, r + 0.05 * px, 0, Math.PI * 2); ctx.fill();
          ctx.font = sansFont(700, 0.62 * px);
        } else {
          ctx.strokeStyle = ncol; ctx.lineWidth = Math.max(1, (wt >= 700 ? 0.08 : 0.06) * px);
          ctx.beginPath(); ctx.arc(ox, y, r, 0, Math.PI * 2); ctx.stroke();
          ctx.font = sansFont(wt, 0.62 * px);
        }
        ctx.fillStyle = ncol; ctx.textAlign = 'center';
        ctx.fillText(String(part), ox, y + 0.02 * px);
        at = [ox, y, r];
        cx += 0.92 * px;
      } else {
        ctx.fillStyle = color; ctx.font = sansFont(wt, px); ctx.textAlign = 'left';
        ctx.fillText(part, cx, y);
        cx += ctx.measureText(part).width;
      }
    }
    ctx.globalAlpha = 1;
    return at;
  }

  const stColor = TH => n => TH.stc[n - 1];                    // 상태 번호의 색
  const stColorSoft = TH => n => mix(TH.stc[n - 1], TH.bg, TH.numFade);
  const colX = (LY, c) => LY.gx0 + LY.glab + c * LY.gcol;

  // 규칙표의 머리 하나(상태 이름). on = 금빛 테
  function drawHead(ctx, LY, TH, T, num, c, on) {
    const x = colX(LY, c), hb = [x + 3, LY.gyHead, x + LY.gcol - 5, LY.gyHead + 34];
    fillRR(ctx, hb, 17, on ? mix(TH.bg, TH.gold, 0.16) : TH.bg, 1);
    strokeRR(ctx, hb, 17, on ? TH.gold : TH.hdrLine, 1.5, 1);
    rich(ctx, headName(T, STATES[c], num), x + LY.gcol / 2 - 1, LY.gyHead + 17, 700, 19.5, on ? TH.hot : TH.hdrText,
         undefined, stColor(TH));
  }

  // 규칙표의 한 열: 머리(상태 이름) + 칸 셋. on = 지금 상태, hit = 지금 읽은 기호의 칸, cover = 고정 층 위에 덮어 그림,
  // head = 머리도 그림(움직이는 금빛 테가 있을 때는 머리를 drawHand가 그림). 칸 = 쓸 기호 · 이동 · 다음 상태(번호, 그 상태의 색).
  // 지금 칸의 다음 상태 번호는 속을 채운 동그라미로 — 그 자리 [x, y, r]를 돌려줌
  function drawColumn(ctx, LY, TH, T, num, c, on, hit, cover, head) {
    const s = STATES[c], x = colX(LY, c);
    if (head !== false) drawHead(ctx, LY, TH, T, num, c, on);
    let at = null;
    ROWS.forEach(([sym], r) => {
      const tx = cellText(T, s, sym, num);
      const y = LY.gyRow + r * LY.gpitch, b = [x + 3, y, x + LY.gcol - 5, y + 38], cx = (b[0] + b[2]) / 2;
      if (cover) { ctx.fillStyle = TH.bg; ctx.fillRect(b[0] - 2, b[1] - 2, b[2] - b[0] + 4, b[3] - b[1] + 4); }
      if (hit === sym) {
        fillRR(ctx, b, 9, TH.gold, 1);
        at = rich(ctx, tx, cx, y + 18, 700, 27, TH.bg, undefined, stColor(TH), TH.bg);
      } else if (tx) {
        rich(ctx, tx, cx, y + 18, 400, 27, on ? TH.cellTextOn : TH.cellText, undefined, on ? stColor(TH) : stColorSoft(TH));
      } else {
        text(ctx, '·', cx, y + 18, F.cell, TH.cellDot, 'mm');
      }
    });
    return at;
  }

  // 머리글의 금빛 테 (H = { x: 열 번호(실수), a: 진하기, glow }): 테를 그리고, 테가 걸친 열의 이름을 다시 씀
  function drawHand(ctx, LY, TH, T, num, H) {
    const x = colX(LY, H.x), hb = [x + 3, LY.gyHead, x + LY.gcol - 5, LY.gyHead + 34];
    fillRR(ctx, hb, 17, mix(TH.bg, TH.gold, 0.16), H.a);
    strokeRR(ctx, hb, 17, TH.gold, 1.5, H.a);
    for (let c = Math.max(0, Math.floor(H.x)); c <= Math.min(STATES.length - 1, Math.ceil(H.x)); c++) {
      const w = clamp01(1 - Math.abs(H.x - c)) * H.a;
      rich(ctx, headName(T, STATES[c], num), colX(LY, c) + LY.gcol / 2 - 1, LY.gyHead + 17, 700, 19.5,
           mix(TH.hdrText, TH.hot, w), undefined, stColor(TH));
    }
    return hb;
  }

  // ───────────────────────────── 자취(trace): 기계가 지나온 길 ─────────────────────────────
  // 기계의 한 순간은 (테이프, 머리가 있는 칸, 상태) 셋이다. 그 역사를 그대로 입체로 세운다.
  //   가로 = 걸음(시간) · 세로 = 자릿수(맨 아래가 1의 자리) · 깊이 = 상태(멈춤, ① … ⑥)
  //   뒷벽    : 걸음마다의 테이프. 밝은 칸 = 1, 어두운 칸 = 0. 벽의 높이가 곧 수의 크기(이진 자릿수)
  //   머리의 길: 걸음마다 (걸음, 머리가 있는 자리, 상태)를 이은 선. 색 = 상태
  //   그림자 둘: 벽에 비친 것 = 머리가 읽어 온 칸, 바닥에 비친 것 = 상태가 바뀌어 온 차례
  // 앞에서 보면 테이프의 역사(시공간 그림), 위에서 보면 상태의 역사, 끝에서 보면 머리의 궤도가 된다.
  // 움직이는 것은 기계가 한 걸음 걸을 때마다 한 칸씩 자라는 이 기록뿐이다.
  // WebGL로 그리고(쓸 수 없으면 ridges 그림으로 대신한다), 글자와 지금 자리의 표시는 그 위의 2D 캔버스에 그린다.
  const TRACE = {
    HFOV: 30 * Math.PI / 180,
    SY: 4, SZ: 11,                       // 자리 하나의 높이, 상태 하나의 깊이 (걸음 하나의 길이가 1)
    GAP: 16,                             // 한 계산과 다음 계산 사이(걸음)
    LAG: 5,                              // 따라가는 동안 '지금'이 사진기보다 앞서는 걸음 수(오른쪽 자리를 잡을 때 셈에 넣는다)
    FLOOR: -1.7,                         // 바닥의 높이(자리)
    VIEW: { solid: [0.09, 0.56], tape: [0, 0], states: [0, Math.PI / 2], orbit: [1.36, 0.12] },   // [돌린 각, 내려다보는 각]
    LEVEL: { H: 0, P: 1, Q: 2, C0: 3, C1: 4, C2: 5, R: 6 },
    ORDER: ['H', 'P', 'Q', 'C0', 'C1', 'C2', 'R'],
    COL: {                               // 상태의 색: 멈춤, ① … ⑥, (여덟째는 쉬는 줄의 색) / 테이프의 0과 1
      dark: { st: ['#FFFFFF', '#FFF1D0', '#4FD6C4', '#5E86FF', '#A98BFA', '#F58BB6', '#E9B65C', '#4A4852'], bit0: '#171C4A', bit1: '#9C947E' },
      light: { st: ['#1F1E24', '#8A6A1E', '#0E8F82', '#2B4FD6', '#6D45C8', '#C2407F', '#B8660F', '#C4C2CA'], bit0: '#DCE2F2', bit1: '#3A3550' },
    },
    LINE_VS: `
      attribute vec3 a_p;                // 이쪽 끝 (걸음, 자리, 상태)
      attribute vec3 a_o;                // 저쪽 끝
      attribute vec4 a_s;                // 선의 어느 쪽(±1), 뒤쪽 끝인가(0 · 1), 색 번호, 이쪽 끝의 걸음
      uniform mat4 u_mvp;
      uniform vec4 u_vp;                 // 화면의 반(px) 가로 · 세로, 반 굵기(px), 굵기의 기준 거리
      uniform vec3 u_sq;                 // 좌표마다 곱하는 값 (0이면 그쪽으로 납작해진다: 그림자)
      uniform vec3 u_fl;                 // 더하는 값
      uniform vec3 u_col[8];
      varying vec4 v_a;                  // 선에서 떨어진 거리(px), 선을 따라간 거리(px), 선의 길이(px), 반 굵기(px)
      varying vec3 v_b;                  // 걸음, 사진기에서의 거리
      varying vec3 v_c;
      void main() {
        vec4 c0 = u_mvp * vec4(a_p * u_sq + u_fl, 1.0), c1 = u_mvp * vec4(a_o * u_sq + u_fl, 1.0);
        vec2 d = (c1.xy / c1.w - c0.xy / c0.w) * u_vp.xy;
        float len = length(d);
        d = len > 1e-3 ? d / len : vec2(1.0, 0.0);
        float R = u_vp.z * clamp(u_vp.w / c0.w, 0.5, 2.2), ext = R + 1.0, sg = a_s.y < 0.5 ? a_s.x : -a_s.x;
        vec2 off = vec2(-d.y, d.x) * sg * ext - d * ext;
        gl_Position = vec4(c0.xy + off / u_vp.xy * c0.w, c0.zw);
        v_a = vec4(a_s.x * ext, a_s.y < 0.5 ? -ext : len + ext, len, R);
        v_b = vec3(a_s.w, c0.w, 0.0);
        v_c = u_col[int(a_s.z + 0.5)];
      }`,
    LINE_FS: `
      #ifdef GL_FRAGMENT_PRECISION_HIGH
      precision highp float;
      #else
      precision mediump float;
      #endif
      uniform vec4 u_rv;                 // 보이는 걸음: 부터 · 까지, 진하기
      uniform vec4 u_fog;                // 안개가 시작하는 거리, 1 ÷ 깊이, 세기
      uniform vec4 u_age;                // 지금(걸음), 흐려지기 시작하는 나이, 1 ÷ 흐려지는 길이
      varying vec4 v_a;
      varying vec3 v_b;
      varying vec3 v_c;
      void main() {
        if (v_b.x > u_rv.y || v_b.x < u_rv.x) discard;
        float dx = max(max(-v_a.y, v_a.y - v_a.z), 0.0), dist = length(vec2(dx, v_a.x)), R = max(v_a.w, 0.6);
        float cov = (1.0 - smoothstep(R - 0.6, R + 0.6, dist)) * min(1.0, v_a.w / 0.6);
        if (cov < 0.004) discard;
        float fog = 1.0 - u_fog.z * clamp((v_b.y - u_fog.x) * u_fog.y, 0.0, 1.0);
        float age = 1.0 - clamp((u_age.x - v_b.x - u_age.y) * u_age.z, 0.0, 1.0);
        float a = cov * u_rv.z * fog * age;
        gl_FragColor = vec4(v_c * a, a);
      }`,
    BAR_VS: `
      attribute vec3 a_p;                // 걸음, 자리(칸의 아랫변 · 윗변), 0 · 1
      uniform mat4 u_mvp;
      uniform vec3 u_geo;                // 이 계산이 시작한 걸음, 자리 하나의 높이
      varying vec3 v_b;                  // 걸음, 0 · 1, 사진기에서의 거리
      void main() {
        gl_Position = u_mvp * vec4(u_geo.x + a_p.x, a_p.y * u_geo.y, 0.0, 1.0);
        v_b = vec3(a_p.x, a_p.z, gl_Position.w);
      }`,
    BAR_FS: `
      #ifdef GL_FRAGMENT_PRECISION_HIGH
      precision highp float;
      #else
      precision mediump float;
      #endif
      uniform vec4 u_rv;
      uniform vec4 u_fog;
      uniform vec4 u_age;
      uniform vec3 u_c0;
      uniform vec3 u_c1;
      varying vec3 v_b;
      void main() {
        if (v_b.x > u_rv.y || v_b.x < u_rv.x) discard;
        float fog = 1.0 - u_fog.z * clamp((v_b.z - u_fog.x) * u_fog.y, 0.0, 1.0);
        float age = 1.0 - clamp((u_age.x - v_b.x - u_age.y) * u_age.z, 0.0, 1.0);
        float a = u_rv.z * fog * age;
        gl_FragColor = vec4(mix(u_c0, u_c1, v_b.y) * a, a);
      }`,
    POST_VS: `
      attribute vec2 a_xy;
      varying vec2 v_uv;
      void main() { v_uv = a_xy * 0.5 + 0.5; gl_Position = vec4(a_xy, 0.0, 1.0); }`,
    POST_FS: `
      precision mediump float;
      uniform sampler2D u_tex;
      uniform vec3 u_dir;                // 흐리는 방향(텍셀), 세기
      varying vec2 v_uv;
      void main() {
        vec2 d = u_dir.xy;
        vec3 c = texture2D(u_tex, v_uv).rgb * 0.227 +
                 (texture2D(u_tex, v_uv + d * 1.385).rgb + texture2D(u_tex, v_uv - d * 1.385).rgb) * 0.316 +
                 (texture2D(u_tex, v_uv + d * 3.231).rgb + texture2D(u_tex, v_uv - d * 3.231).rgb) * 0.070;
        gl_FragColor = vec4(c * u_dir.z, 1.0);
      }`,
  };

  class Trace {
    constructor(host, box) {
      this.host = host; this.box = box;
      this.cv = box.querySelector('canvas.trace-gl'); this.ov = box.querySelector('canvas.trace-ov');
      this.octx = this.ov.getContext('2d');
      this.btn = {}; for (const b of box.querySelectorAll('[data-trace]')) this.btn[b.dataset.trace] = b;
      this.ok = false; this.gl = null; this.lost = false;
      this.runs = []; this.cur = null;                     // 계산들(오래된 것부터), 지금 하고 있는 계산
      this.w = 0; this.h = 0; this.dpr = 1; this.narrow = false; this.cut = 0; this.slow = 0; this.bloom = true;
      this.psi = TRACE.VIEW.solid[0]; this.theta = TRACE.VIEW.solid[1]; this.psiT = this.psi; this.thetaT = this.theta; this.view = 'solid';
      this.camX = null; this.top = 12; this.sPx = 2.5; this.shift = 0; this.mvp = new Float32Array(16);
      this.push = 0; this.mKey = ''; this.m = [0, 0, 1];   // '지금'을 왼쪽으로 민 만큼(px), 상태 이름의 폭
      this.hover = null; this.hoverUntil = 0; this.ptr = null; this.drag = null;
      this.dirty = true; this.raf = 0; this.last = 0;
      this._frame = this._frame.bind(this);
      try { this._initGL(); this.ok = true; } catch (e) { this.ok = false; }
      if (this.ok) this._bind();
    }

    // ── WebGL
    _initGL() {
      const opt = { antialias: true, alpha: false, depth: false, stencil: false, preserveDrawingBuffer: false };
      const gl = this.cv.getContext('webgl', opt) || this.cv.getContext('experimental-webgl', opt);
      if (!gl) throw new Error('webgl');
      const prog = (vs, fs) => {
        const p = gl.createProgram();
        for (const [type, src] of [[gl.VERTEX_SHADER, vs], [gl.FRAGMENT_SHADER, fs]]) {
          const s = gl.createShader(type);
          gl.shaderSource(s, src); gl.compileShader(s);
          if (!gl.getShaderParameter(s, gl.COMPILE_STATUS)) throw new Error(gl.getShaderInfoLog(s) || 'shader');
          gl.attachShader(p, s);
        }
        gl.linkProgram(p);
        if (!gl.getProgramParameter(p, gl.LINK_STATUS)) throw new Error(gl.getProgramInfoLog(p) || 'link');
        return p;
      };
      const loc = (p, names) => { const o = {}; for (const n of names) o[n] = gl.getUniformLocation(p, n); return o; };
      this.gl = gl;
      this.pL = prog(TRACE.LINE_VS, TRACE.LINE_FS);
      this.uL = loc(this.pL, ['u_mvp', 'u_vp', 'u_sq', 'u_fl', 'u_col', 'u_rv', 'u_fog', 'u_age']);
      this.aL = ['a_p', 'a_o', 'a_s'].map(n => gl.getAttribLocation(this.pL, n));
      this.pB = prog(TRACE.BAR_VS, TRACE.BAR_FS);
      this.uB = loc(this.pB, ['u_mvp', 'u_geo', 'u_rv', 'u_fog', 'u_age', 'u_c0', 'u_c1']);
      this.aB = gl.getAttribLocation(this.pB, 'a_p');
      this.pP = prog(TRACE.POST_VS, TRACE.POST_FS);
      this.uP = loc(this.pP, ['u_tex', 'u_dir']);
      this.aP = gl.getAttribLocation(this.pP, 'a_xy');
      this.bufQuad = gl.createBuffer();
      gl.bindBuffer(gl.ARRAY_BUFFER, this.bufQuad);
      gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 1, -1, -1, 1, 1, 1]), gl.STATIC_DRAW);
      this.bufRail = gl.createBuffer(); this.rail = new Float32Array(7 * 60);
      this.fbo = null; this.fboW = 0; this.fboH = 0;
      for (const r of this.runs) this._buffers(r);         // (컨텍스트를 되살린 뒤)
    }
    _target(w, h) {                                    // 빛번짐을 그릴 작은 그림 두 장
      const gl = this.gl;
      if (this.fbo && this.fboW === w && this.fboH === h) return;
      if (this.fbo) for (const f of this.fbo) { gl.deleteFramebuffer(f.fb); gl.deleteTexture(f.tex); }
      this.fbo = [0, 1].map(() => {
        const tex = gl.createTexture();
        gl.bindTexture(gl.TEXTURE_2D, tex);
        gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, w, h, 0, gl.RGBA, gl.UNSIGNED_BYTE, null);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR); gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE); gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
        const fb = gl.createFramebuffer();
        gl.bindFramebuffer(gl.FRAMEBUFFER, fb);
        gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, tex, 0);
        return { fb, tex };
      });
      if (gl.checkFramebufferStatus(gl.FRAMEBUFFER) !== gl.FRAMEBUFFER_COMPLETE) this.bloom = false;
      gl.bindFramebuffer(gl.FRAMEBUFFER, null);
      this.fboW = w; this.fboH = h;
    }

    // ── 계산 하나의 기록: 걸음마다 머리의 자리와 상태, 그리고 테이프
    _make(n, steps, end, posEnd) {
      const N = steps.length, LV = TRACE.LEVEL;
      const lev = new Uint8Array(N + 1), pl = new Int16Array(N + 1), Ls = new Int32Array(N + 1);
      let L = 0, top = 1;                                // L = 끝자리(1의 자리)가 있는 칸: 자리 j의 숫자는 칸 L − j에 있다
      for (let k = 0; k <= N; k++) {
        const tape = k < N ? steps[k].before : end;
        Ls[k] = L; lev[k] = k < N ? LV[steps[k].state] : 0; pl[k] = L - (k < N ? steps[k].pos : posEnd);
        if (tape.s.length && L - tape.lo > top) top = L - tape.lo;
        if (pl[k] > top) top = pl[k];
        if (k < N) L = steps[k].LAfter;
      }
      // 벽: 자리마다, 같은 숫자가 이어지는 동안을 긴 칸 하나로. k번째 걸음 앞의 테이프가 [k − 1, k)에 놓인다
      const bars = [];
      for (let j = 0; j <= top; j++) {
        let cur = -1, x0 = 0;
        for (let k = 0; k <= N + 1; k++) {
          let v = -1;
          if (k <= N) { const c = tapeGet(k < N ? steps[k].before : end, Ls[k] - j); v = c === null ? -1 : +c; }
          if (v !== cur) { if (cur >= 0) bars.push(x0, k - 1, j, cur); cur = v; x0 = k - 1; }
        }
      }
      const bar = new Float32Array(bars.length / 4 * 18);
      for (let i = 0, o = 0; i < bars.length; i += 4) {
        const x0 = bars[i], x1 = bars[i + 1], y0 = bars[i + 2] - 0.38, y1 = bars[i + 2] + 0.38, b = bars[i + 3];
        for (const [x, y] of [[x0, y0], [x1, y0], [x0, y1], [x1, y0], [x1, y1], [x0, y1]]) { bar[o++] = x; bar[o++] = y; bar[o++] = b; }
      }
      // 머리의 길: k번째 걸음은 (k, 자리, 상태)에서 (k + 1, 다음 자리, 다음 상태)로 가는 선. 색은 그 걸음을 한 상태
      const line = new Float32Array(N * 60);
      let o = 0;
      const put = (a, b, g, e) => {
        line[o] = a; line[o + 1] = pl[a]; line[o + 2] = lev[a]; line[o + 3] = b; line[o + 4] = pl[b]; line[o + 5] = lev[b];
        line[o + 6] = g; line[o + 7] = e; line[o + 8] = lev[e ? b : a]; line[o + 9] = a; o += 10;
      };
      for (let k = 0; k < N; k++) {
        put(k, k + 1, -1, 0); put(k, k + 1, 1, 0); put(k + 1, k, -1, 1);
        put(k, k + 1, 1, 0); put(k + 1, k, 1, 1); put(k + 1, k, -1, 1);
      }
      const run = { n, N, steps, lev, pl, top, off: 0, stop: N, h: N, a: 1, M: null, bar, line, nBar: bar.length / 3, nLine: N * 6 };
      this._buffers(run);
      return run;
    }
    _buffers(run) {
      const gl = this.gl;
      run.bufBar = gl.createBuffer(); gl.bindBuffer(gl.ARRAY_BUFFER, run.bufBar); gl.bufferData(gl.ARRAY_BUFFER, run.bar, gl.STATIC_DRAW);
      run.bufLine = gl.createBuffer(); gl.bindBuffer(gl.ARRAY_BUFFER, run.bufLine); gl.bufferData(gl.ARRAY_BUFFER, run.line, gl.STATIC_DRAW);
    }
    _drop(run) { const gl = this.gl; if (gl && !this.lost) { gl.deleteBuffer(run.bufBar); gl.deleteBuffer(run.bufLine); } }

    // ── 기계가 알려 주는 것: 지금의 계산(M)과 시각. 기록은 머리가 옮겨 갈 때마다 한 걸음씩 자란다
    setLive(M, tt) {
      if (!this.ok) return;
      let cur = this.cur;
      if (!cur || cur.M !== M) {                         // 새 계산: 앞의 것은 거기까지로 두고 그 뒤에 잇는다
        let off = 0;
        if (cur) { cur.stop = Math.min(cur.N, cur.h); cur.M = null; off = cur.off + cur.stop + TRACE.GAP; }
        const run = this._make(M.n, M.steps, M.end, M.posEnd);
        run.M = M; run.off = off; run.h = 0;
        this.runs.push(run); this.cur = cur = run;
        if (this.runs.length === 1) {                    // 처음: 바로 앞의 수들의 기록을 왼쪽에 놓아 둔다
          let x = 0, total = 0;
          for (let m = M.n - 1; m >= 2 && total < 2600 && this.runs.length < 12; m--) {
            const sim = simulate(m), r = this._make(m, sim.steps, sim.end, sim.posEnd);
            x -= r.N + TRACE.GAP; r.off = x; total += r.N + TRACE.GAP;
            this.runs.unshift(r);
          }
        }
        while (this.runs.length > 16) this._drop(this.runs.shift());
        this.hover = null;
      }
      let h = 0, a = 1;
      if (tt < M.IN_T0) a = 0;
      else if (tt < M.HEAD_T0) a = clamp01((tt - M.IN_T0) / 0.5);
      if (tt >= M.HALT_T0) h = M.N;
      else {
        const k = bisectRight(M.T0, tt) - 1;
        if (k >= 0) { const st = M.steps[k], u = (tt - st.t0) / st.d, [, b, c] = phases(st.d); h = k + (u >= b ? ease((u - b) / (c - b)) : 0); }
      }
      if (h !== cur.h || a !== cur.a) { cur.h = h; cur.a = a; this.dirty = true; }
      this.wake();
    }
    get now() { return this.cur ? this.cur.off + this.cur.h : 0; }

    // ── 크기
    resize() {
      if (!this.ok) return;
      const w = Math.round(this.box.clientWidth), h = Math.round(this.box.clientHeight);
      if (w < 40 || h < 40) return;
      const dpr = Math.min(window.devicePixelRatio || 1, 2) / (this.cut === 2 ? 2 : this.cut === 1 ? 1.5 : 1);
      this.w = w; this.h = h; this.dpr = dpr; this.narrow = w < 560;
      const pw = Math.round(w * dpr), ph = Math.round(h * dpr);
      for (const c of [this.cv, this.ov]) if (c.width !== pw || c.height !== ph) { c.width = pw; c.height = ph; }
      this.box.querySelector('.trace-ui').style.left = Math.round(this.host._traceEdges()[0]) + 'px';
      this.dirty = true; this.wake();
    }

    // ── 움직임: 보는 방향이 따라가고, 지금의 걸음이 늘 같은 자리에 오도록 따라간다
    wake() { if (this.ok && !this.lost && !this.raf && this.host._visible !== false) this.raf = requestAnimationFrame(this._frame); }
    stop() { if (this.raf) cancelAnimationFrame(this.raf); this.raf = 0; this.last = 0; }
    _frame(now) {
      this.raf = 0;
      if (!this.cur || !this.w) return;
      const dt = this.last ? Math.min(0.1, (now - this.last) / 1000) : 0;
      this.last = now;
      const playing = this.host._playing, still = reducedMotion();
      let moving = false;
      const kq = 1 - Math.exp(-dt / (still ? 0.001 : 0.24));
      const dp = this.psiT - this.psi, dh = this.thetaT - this.theta;
      if (Math.abs(dp) > 1e-5 || Math.abs(dh) > 1e-5) {
        this.psi += dp * kq; this.theta += dh * kq;
        if (Math.abs(this.psiT - this.psi) < 2e-4) this.psi = this.psiT;
        if (Math.abs(this.thetaT - this.theta) < 2e-4) this.theta = this.thetaT;
        this.dirty = true; moving = true;
      }
      const X = this.now;
      if (this.camX === null || still) { if (this.camX !== X) { this.camX = X; this.dirty = true; } }
      else if (Math.abs(X - this.camX) > 1e-3) {
        this.camX += (X - this.camX) * (1 - Math.exp(-dt / 0.3));
        if (Math.abs(X - this.camX) < 0.01) this.camX = X;
        this.dirty = true; moving = true;
      }
      let top = 8;                                       // 세로 눈금: 보이는 계산들 가운데 가장 긴 수가 들어가게
      for (const r of this.runs) if (r.off + r.stop > this.camX - 1500 && r.top + 2 > top) top = r.top + 2;
      if (Math.abs(top - this.top) > 0.01) { this.top += (top - this.top) * (still ? 1 : 1 - Math.exp(-dt / 0.5)); this.dirty = true; moving = true; }
      if (playing && !still && dt > 0) {                 // 느린 기기: 프레임 사이가 계속 벌어지면 빛번짐부터 끄고, 다음엔 해상도를 낮춘다
        this.slow = dt > 0.05 ? this.slow + 1 : Math.max(0, this.slow - 2);
        if (this.slow > 60) {
          this.slow = 0;
          if (this.bloom) this.bloom = false;
          else if (this.cut < 2) { this.cut++; this.resize(); }
          this.dirty = true;
        }
      }
      if (this.hover && this.hoverUntil && now > this.hoverUntil) { this.hover = null; this.hoverUntil = 0; }
      if (this.dirty) {
        this._fit(); this._drawGL(); this.dirty = false;
        if (this.ptr && !this.drag) this._hoverAt(this.ptr.x, this.ptr.y, 0);
      }
      this._drawOverlay();
      if (moving || this.drag || this.hoverUntil) this.wake();
    }
    setView(name) {
      const v = TRACE.VIEW[name];
      this.view = name; this.psiT = v[0]; this.thetaT = v[1];
      this._labels(); this.wake();
    }
    _labels() {
      const T = this.host._T || TEXT.ko;
      ['solid', 'tape', 'states', 'orbit'].forEach((k, i) => {
        const b = this.btn[k];
        b.textContent = T.traceViews[i]; b.title = T.traceViewTitles[i];
        b.setAttribute('aria-pressed', this.view === k ? 'true' : 'false');
      });
      this.box.setAttribute('aria-label', T.traceAria);
    }

    // ── 사진기. psi = 세로축 둘레로 돌린 각(클수록 지나간 쪽이 멀어진다), theta = 내려다보는 각
    _cam(s, shift) {
      const cp = Math.cos(this.psi), sp = Math.sin(this.psi), ct = Math.cos(this.theta), st = Math.sin(this.theta);
      const f = [-sp * ct, -st, -cp * ct], r = [cp, 0, -sp];
      const u = [r[1] * f[2] - r[2] * f[1], r[2] * f[0] - r[0] * f[2], r[0] * f[1] - r[1] * f[0]];
      const D = this.w / (2 * s * Math.tan(TRACE.HFOV / 2)), back = (0.31 * this.w - this.push) / s;
      const yc = (TRACE.FLOOR + this.top) / 2 * TRACE.SY, zc = 3 * TRACE.SZ;
      const T = [this.camX - back + u[0] * shift, yc + u[1] * shift, zc + u[2] * shift];
      const e = [T[0] - f[0] * D, T[1] - f[1] * D, T[2] - f[2] * D];
      const fx = 1 / Math.tan(TRACE.HFOV / 2), fy = fx * this.w / this.h, near = D * 0.04, far = D * 9;
      const A = (far + near) / (near - far), B = 2 * far * near / (near - far);
      const V = [r[0], u[0], -f[0], r[1], u[1], -f[1], r[2], u[2], -f[2],
                 -(r[0] * e[0] + r[1] * e[1] + r[2] * e[2]), -(u[0] * e[0] + u[1] * e[1] + u[2] * e[2]), f[0] * e[0] + f[1] * e[1] + f[2] * e[2]];
      const m = this.mvp;
      for (let c = 0; c < 4; c++) {
        const x = V[c * 3], y = V[c * 3 + 1], z = V[c * 3 + 2], w = c === 3 ? 1 : 0;
        m[c * 4] = fx * x; m[c * 4 + 1] = fy * y; m[c * 4 + 2] = A * z + B * w; m[c * 4 + 3] = -z;
      }
      this.camD = D; this.sPx = s; this.shift = shift;
    }
    _P(x, y, z) {                                      // (걸음, 자리, 상태) → 화면(px)과 거리
      const m = this.mvp, X = x, Y = y * TRACE.SY, Z = z * TRACE.SZ, w = m[3] * X + m[7] * Y + m[11] * Z + m[15];
      return [(0.5 + 0.5 * (m[0] * X + m[4] * Y + m[8] * Z + m[12]) / w) * this.w, (0.5 - 0.5 * (m[1] * X + m[5] * Y + m[9] * Z + m[13]) / w) * this.h, w];
    }
    _fit() {                                           // 지금의 걸음 둘레(자리 × 상태)가 그림 칸의 높이에 꼭 들어가게
      const padT = this.narrow ? 28 : 36, padB = this.narrow ? 50 : 46, usable = this.h - padT - padB, want = padT + usable / 2;
      let s = this.sPx, shift = this.shift;
      const F = TRACE.FLOOR, m = this._measure(), cp = Math.cos(this.psi);
      for (let pass = 0; pass < 3; pass++) {
        for (let it = 0; it < (pass ? 2 : 4); it++) {
          this._cam(s, shift);
          let lo = 1e9, hi = -1e9;
          for (const x of [this.camX - 2, this.camX + 2]) for (const y of [F, this.top]) for (const z of [-0.2, 6.3]) {
            const p = this._P(x, y, z);
            if (p[1] < lo) lo = p[1]; if (p[1] > hi) hi = p[1];
          }
          s = Math.max(0.3, Math.min(30, s * usable / Math.max(1, hi - lo)));
          shift += (want - (lo + hi) / 2) / s;
        }
        this._cam(s, shift);
        // 오른쪽에 글자가 들어갈 자리: 바닥의 줄 끝에 적는 상태의 이름들(줄이 벌어져 보일 때), 아니면 머리 옆에 적는 지금 상태의 이름.
        // 넓은 화면에서는 늘 남는다. 좁은 화면에서는 모자라므로 그만큼 '지금'을 왼쪽으로 민다 (끝에서 볼 때는 밀지 않는다)
        const Xa = this.camX + TRACE.LAG;                  // 따라가는 동안 '지금'은 사진기보다 몇 걸음 앞서 있다
        const gap = Math.abs(this._P(Xa + 13, F, 1)[1] - this._P(Xa + 13, F, 0)[1]);
        let xn = -1e9, xh = -1e9;
        for (let l = 0; l <= 6; l++) xn = Math.max(xn, this._P(Xa + 14.5, F, l)[0]);
        for (const y of [F, this.top]) for (const z of [0, 6.3]) xh = Math.max(xh, this._P(Xa, y, z)[0]);
        const need = lerp(xh + 12 + m[0], xn + 2 + m[1], clamp01((gap / m[2] - 0.8) / 0.2)) + 6;
        const push = Math.max(0, Math.min(0.2 * this.w * clamp01((cp - 0.3) / 0.3), this.push + (need - this.w) / Math.max(0.35, cp)));
        const moved = Math.abs(push - this.push);
        this.push = push;
        if (moved < 0.5) break;
      }
      this._cam(s, shift);
      const e = ease((this.psi - 1.0) / 0.5);             // 끝에서 볼수록 가까운 걸음만 남긴다(겹쳐서 뭉개지지 않게)
      this.ageStart = lerp((0.60 * this.w - this.push) / s / Math.max(cp, 0.5), 110, e); this.ageLen = 0.5 * this.ageStart;
    }
    _measure() {                                       // [머리 옆에 적는 이름의 폭, 줄 끝에 적는 이름의 폭, 이름을 모두 적기 시작하는 줄 간격]
      const host = this.host, T = host._T || TEXT.ko, num = host._numbers, fpx = this.narrow ? 10.5 : 12.5;
      const key = (host._langName || '') + (num ? '#' : '') + fpx + (host._fontsReady ? 'f' : '');
      if (this.mKey !== key) {
        let a = 0, b = 0;
        for (let l = 0; l <= 6; l++) {
          const str = l ? headName(T, TRACE.ORDER[l], num) : T.halt;
          a = Math.max(a, textW(this.octx, str, sansFont(700, fpx))); b = Math.max(b, textW(this.octx, str, sansFont(700, fpx - 1)));
        }
        this.mKey = key; this.m = [a, b, (fpx - 1) * (this.narrow ? 1.16 : 0.9)];
      }
      return this.m;
    }

    // ── WebGL로: 벽(테이프의 역사), 바닥의 줄(상태), 머리의 길과 그 그림자 둘
    _drawGL() {
      const gl = this.gl, TH = this.host._TH || THEMES.dark, dark = (this.host._themeName || 'light') === 'dark';
      const C = TRACE.COL[dark ? 'dark' : 'light'], bg = rgb(TH.bg).map(v => v / 255), f3 = h => rgb(h).map(v => v / 255);
      const W = this.w / this.sPx, cur = this.cur, X = this.now, k = this.dpr;
      const fog = [this.camD + 0.1 * W, 1 / (1.7 * W), 0.9, 0];
      const bind = (buf, locs, sizes, stride) => {
        gl.bindBuffer(gl.ARRAY_BUFFER, buf);
        let off = 0;
        locs.forEach((l, i) => { gl.enableVertexAttribArray(l); gl.vertexAttribPointer(l, sizes[i], gl.FLOAT, false, stride, off); off += sizes[i] * 4; });
      };
      const upto = r => (r === cur ? r.h : r.stop);
      const lines = (pw, ph, glow) => {                  // 머리의 길(과 그림자들)
        gl.useProgram(this.pL);
        gl.uniformMatrix4fv(this.uL.u_mvp, false, this.mvp);
        const cols = new Float32Array(24);
        C.st.forEach((h, i) => cols.set(f3(h), i * 3));
        gl.uniform3fv(this.uL.u_col, cols);
        gl.uniform4f(this.uL.u_fog, fog[0], fog[1], fog[2], 0);
        const draw = (buf, n, off, sq, fl, R, from, to, alpha) => {
          bind(buf, this.aL, [3, 3, 4], 40);
          gl.uniform4f(this.uL.u_vp, pw / 2, ph / 2, R, this.camD);
          gl.uniform3f(this.uL.u_sq, sq[0], sq[1], sq[2]); gl.uniform3f(this.uL.u_fl, fl[0], fl[1], fl[2]);
          gl.uniform4f(this.uL.u_rv, from, to, alpha, 0);
          gl.uniform4f(this.uL.u_age, X - off, this.ageStart, 1 / this.ageLen, 0);
          gl.drawArrays(gl.TRIANGLES, 0, n);
        };
        const SY = TRACE.SY, SZ = TRACE.SZ, fy = TRACE.FLOOR * SY, sc = glow ? 0.25 * k : k;
        if (!glow) {
          // 바닥의 줄 일곱: 상태마다 하나. 지금 상태의 줄만 제 색으로 켜진다
          const a = this.rail, x0 = X - this.ageStart - this.ageLen, x1 = X + 12, lv = this._state()[0];
          let o = 0;
          const put = (xa, xb, l, g, e) => { a[o] = xa; a[o + 1] = TRACE.FLOOR; a[o + 2] = l; a[o + 3] = xb; a[o + 4] = TRACE.FLOOR; a[o + 5] = l; a[o + 6] = g; a[o + 7] = e; a[o + 8] = l === lv ? l : 7; a[o + 9] = xa; o += 10; };
          for (let l = 0; l <= 6; l++) { put(x0, x1, l, -1, 0); put(x0, x1, l, 1, 0); put(x1, x0, l, -1, 1); put(x0, x1, l, 1, 0); put(x1, x0, l, 1, 1); put(x1, x0, l, -1, 1); }
          gl.bindBuffer(gl.ARRAY_BUFFER, this.bufRail); gl.bufferData(gl.ARRAY_BUFFER, a, gl.DYNAMIC_DRAW);
          draw(this.bufRail, 42, 0, [1, SY, SZ], [0, 0, 0], 0.5 * k, -1e9, 1e9, 0.8);
        }
        for (const r of this.runs) {
          const to = upto(r);
          if (to <= 0 || r.off + to < X - this.ageStart - this.ageLen) continue;
          if (!glow) {
            draw(r.bufLine, r.nLine, r.off, [1, SY, 0], [r.off, 0, 0], 0.55 * k, 0, to, 0.55 * r.a);          // 벽에 비친 그림자
            draw(r.bufLine, r.nLine, r.off, [1, 0, SZ], [r.off, fy, 0], 0.8 * k, 0, to, 0.85 * r.a);           // 바닥에 비친 그림자
          }
          draw(r.bufLine, r.nLine, r.off, [1, SY, SZ], [r.off, 0, 0], (glow ? 2.2 : 1.25) * sc, 0, to, (glow ? 0.9 : 1) * r.a);
        }
        for (const l of this.aL) gl.disableVertexAttribArray(l);
      };
      gl.bindFramebuffer(gl.FRAMEBUFFER, null);
      gl.viewport(0, 0, this.cv.width, this.cv.height);
      gl.clearColor(bg[0], bg[1], bg[2], 1); gl.clear(gl.COLOR_BUFFER_BIT);
      gl.disable(gl.DEPTH_TEST); gl.enable(gl.BLEND); gl.blendFunc(gl.ONE, gl.ONE_MINUS_SRC_ALPHA);
      // 벽
      gl.useProgram(this.pB);
      gl.uniformMatrix4fv(this.uB.u_mvp, false, this.mvp);
      gl.uniform4f(this.uB.u_fog, fog[0], fog[1], fog[2], 0);
      const c0 = f3(C.bit0), c1 = f3(C.bit1);
      gl.uniform3f(this.uB.u_c0, c0[0], c0[1], c0[2]); gl.uniform3f(this.uB.u_c1, c1[0], c1[1], c1[2]);
      for (const r of this.runs) {
        const to = upto(r);
        if (r.off + to < X - this.ageStart - this.ageLen) continue;
        bind(r.bufBar, [this.aB], [3], 12);
        gl.uniform3f(this.uB.u_geo, r.off, TRACE.SY, 0);
        gl.uniform4f(this.uB.u_rv, -1.5, to, 0.92 * r.a * ease((Math.abs(Math.cos(this.psi) * Math.cos(this.theta)) - 0.03) / 0.2), 0);
        gl.uniform4f(this.uB.u_age, X - r.off, this.ageStart, 1 / this.ageLen, 0);
        gl.drawArrays(gl.TRIANGLES, 0, r.nBar);
      }
      gl.disableVertexAttribArray(this.aB);
      lines(this.cv.width, this.cv.height, 0);
      if (!dark || !this.bloom) { gl.disable(gl.BLEND); return; }
      // 빛번짐: 머리의 길만 작은 그림에 굵게 그려 흐린 뒤 더한다
      const bw = Math.max(8, Math.round(this.cv.width / 4)), bh = Math.max(8, Math.round(this.cv.height / 4));
      this._target(bw, bh);
      if (!this.bloom) { gl.disable(gl.BLEND); return; }
      gl.bindFramebuffer(gl.FRAMEBUFFER, this.fbo[0].fb);
      gl.viewport(0, 0, bw, bh); gl.clearColor(0, 0, 0, 1); gl.clear(gl.COLOR_BUFFER_BIT);
      lines(bw, bh, 1);
      gl.disable(gl.BLEND);
      gl.useProgram(this.pP);
      gl.bindBuffer(gl.ARRAY_BUFFER, this.bufQuad);
      gl.enableVertexAttribArray(this.aP); gl.vertexAttribPointer(this.aP, 2, gl.FLOAT, false, 0, 0);
      gl.activeTexture(gl.TEXTURE0); gl.uniform1i(this.uP.u_tex, 0);
      const blur = (src, dst, dx, dy, gain) => {
        gl.bindFramebuffer(gl.FRAMEBUFFER, dst); gl.bindTexture(gl.TEXTURE_2D, src);
        gl.uniform3f(this.uP.u_dir, dx, dy, gain); gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
      };
      blur(this.fbo[0].tex, this.fbo[1].fb, 1 / bw, 0, 1);
      blur(this.fbo[1].tex, this.fbo[0].fb, 0, 1 / bh, 1);
      blur(this.fbo[0].tex, this.fbo[1].fb, 2 / bw, 0, 1);
      blur(this.fbo[1].tex, this.fbo[0].fb, 0, 2 / bh, 1);
      gl.viewport(0, 0, this.cv.width, this.cv.height);
      gl.enable(gl.BLEND); gl.blendFunc(gl.ONE, gl.ONE);
      blur(this.fbo[0].tex, null, 0, 0, 0.8);
      gl.disable(gl.BLEND);
    }
    _state() {                                         // 지금: [상태(0 = 멈춤, 1 … 6), 머리의 자리(실수), 상태의 깊이(실수), 걸음(정수)]
      const r = this.cur, k = Math.min(r.N, Math.floor(r.h)), j = Math.min(r.N, k + 1), f = r.h - k;
      return [r.lev[k], lerp(r.pl[k], r.pl[j], f), lerp(r.lev[k], r.lev[j], f), k];
    }

    // ── 그 위에: 지금의 머리(벽과 바닥에 내린 선), 상태의 이름, 테이프의 숫자, 가리킨 걸음
    _drawOverlay() {
      const ctx = this.octx, TH = this.host._TH || THEMES.dark, T = this.host._T || TEXT.ko, k = this.dpr, num = this.host._numbers;
      const dark = (this.host._themeName || 'light') === 'dark', C = TRACE.COL[dark ? 'dark' : 'light'];
      ctx.setTransform(k, 0, 0, k, 0, 0);
      ctx.clearRect(0, 0, this.w, this.h);
      const cur = this.cur;
      if (!cur || !this.sPx) return;
      const narrow = this.narrow, fpx = narrow ? 10.5 : 12.5, font = sansFont(400, fpx), bold = sansFont(700, fpx);
      const edge = this.host._traceEdges ? this.host._traceEdges() : [16, this.w - 16];
      const gh = narrow ? 26 : 34, gt = ctx.createLinearGradient(0, 0, 0, gh);        // 돌려 보다가 기록이 제목 줄 뒤로 지나가도 글자가 읽히게
      gt.addColorStop(0, rgba(TH.bg, 0.9)); gt.addColorStop(0.62, rgba(TH.bg, 0.74)); gt.addColorStop(1, rgba(TH.bg, 0));
      ctx.fillStyle = gt; ctx.fillRect(0, 0, this.w, gh);
      text(ctx, T.traceTitle, edge[0], 10, font, TH.label, 'la');
      text(ctx, T.from + '  ' + fmt(cur.n), edge[0] + textW(ctx, T.traceTitle, font) + 22, 10, font, TH.gold, 'la', 0.9 * cur.a);
      if (!narrow || this.w > 430) text(ctx, narrow ? T.traceLegendS : T.traceLegend, edge[1], 10, font, TH.label, 'ra');
      const X = this.now, [lv, pl, lz] = this._state(), col = C.st[lv];
      const name = l => (l ? headName(T, TRACE.ORDER[l], num) : T.halt);

      // 계산마다: 출발한 수
      for (const r of this.runs) {
        const age = X - r.off;
        if (age > this.ageStart + this.ageLen * 0.6) continue;
        const p = this._P(r.off - TRACE.GAP / 2, TRACE.FLOOR + 0.2, 0);
        if (p[2] <= 0 || p[0] < -30 || p[0] > this.w + 30) continue;
        text(ctx, fmt(r.n), p[0], p[1] - 3, r === cur ? bold : font, r === cur ? TH.hot : TH.gold, 'ms', (r === cur ? 1 : 0.75) * clamp01(1.4 - age / this.ageStart));
      }

      // 상태의 이름: 바닥의 줄 끝에. 줄 사이가 좁아 보일 때는 지금 상태의 이름만 머리 옆에
      const a0 = this._P(X + 13, TRACE.FLOOR, 0), a1 = this._P(X + 13, TRACE.FLOOR, 1);
      const lpx = fpx - 1, showAll = Math.abs(a1[1] - a0[1]) >= this._measure()[2] ? 1 : 0;   // 줄들이 세로로 벌어져 보일 때: 이름을 모두
      const marks = (1 - showAll) * clamp01((Math.abs(a1[0] - a0[0]) - 13) / 4);          // 가로로 벌어져 보일 때: 번호만
      if (showAll > 0) {
        const at = [], fs = [];
        let dx = 0;                                       // 오른쪽 끝을 넘으면 다 함께 그만큼 당긴다
        for (let l = 0; l <= 6; l++) {
          const p = this._P(X + 14.5, TRACE.FLOOR, l), f = sansFont(l === lv ? 700 : 400, lpx);
          at.push(p); fs.push(f);
          dx = Math.min(dx, this.w - 5 - (p[0] + 2 + textW(ctx, name(l), f)));
        }
        for (let l = 0; l <= 6; l++) text(ctx, name(l), at[l][0] + 2 + dx, at[l][1], fs[l], C.st[l], 'lm', l === lv ? 1 : 0.55);
      } else if (marks > 0) {
        for (let l = 1; l <= 6; l++) {
          const p = this._P(X + 2, TRACE.FLOOR, l);
          text(ctx, CIRCLED[TRACE.ORDER[l]], p[0], p[1] + 15, l === lv ? bold : font, C.st[l], 'ms', marks * (l === lv ? 1 : 0.6));
        }
      }

      // 지금의 머리: 벽의 칸(읽고 있는 자리)과 바닥의 줄(상태)에 내린 선, 그리고 구슬
      const hp = this._P(X, pl, lz), wp = this._P(X, pl, 0), fp = this._P(X, TRACE.FLOOR, lz);
      ctx.globalAlpha = cur.a;
      const kn = Math.min(cur.N, Math.floor(cur.h)), tp = kn < cur.N ? cur.steps[kn].before : null;
      const hi = (tp && tp.s.length ? (kn > 0 ? cur.steps[kn - 1].LAfter : 0) - tp.lo : 0) + 1.6;       // 지금 수의 맨 윗자리 바로 위까지
      const q = [[TRACE.FLOOR, 0], [hi, 0], [hi, 6.3], [TRACE.FLOOR, 6.3]].map(c => this._P(X, c[0], c[1]));     // 지금의 단면
      ctx.beginPath(); q.forEach((c, i) => (i ? ctx.lineTo(c[0], c[1]) : ctx.moveTo(c[0], c[1]))); ctx.closePath();
      ctx.fillStyle = rgba(TH.ink, 0.035); ctx.fill(); ctx.lineWidth = 1; ctx.strokeStyle = rgba(TH.ink, 0.16); ctx.stroke();
      ctx.lineWidth = 1; ctx.strokeStyle = rgba(col, 0.6);
      ctx.beginPath(); ctx.moveTo(hp[0], hp[1]); ctx.lineTo(wp[0], wp[1]); ctx.moveTo(hp[0], hp[1]); ctx.lineTo(fp[0], fp[1]); ctx.stroke();
      ctx.fillStyle = rgba(col, 0.9);
      ctx.beginPath(); ctx.arc(wp[0], wp[1], 2, 0, Math.PI * 2); ctx.fill();
      ctx.beginPath(); ctx.arc(fp[0], fp[1], 2, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = rgba(col, 0.2); ctx.beginPath(); ctx.arc(hp[0], hp[1], narrow ? 8 : 10, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = col; ctx.beginPath(); ctx.arc(hp[0], hp[1], narrow ? 3 : 3.8, 0, Math.PI * 2); ctx.fill();
      if (showAll < 1) {
        const str = name(lv), w = textW(ctx, str, bold), tx = Math.min(hp[0] + 12, this.w - 6 - w), ty = Math.max(24, hp[1] - 10);
        ctx.fillStyle = rgba(TH.bg, 0.7 * (1 - showAll)); ctx.fillRect(tx - 4, ty - fpx - 1, w + 8, fpx + 7);
        text(ctx, str, tx, ty, bold, col, 'ls', 1 - showAll);
      }
      ctx.globalAlpha = 1;

      // 지금 테이프에 적힌 숫자들: 벽의 오른쪽 끝에 세로로 (정면에 가깝고 칸이 넉넉히 클 때만)
      const b0 = this._P(X, 0, 0), b1 = this._P(X, 1, 0), cell = Math.abs(b1[1] - b0[1]);
      const front = clamp01((0.45 - Math.abs(this.psi)) / 0.2) * clamp01((0.45 - this.theta) / 0.2) * clamp01((cell - 9.5) / 2) * cur.a;
      if (front > 0 && cur.M) {
        const kk = Math.min(cur.N, Math.round(cur.h)), tape = kk < cur.N ? cur.steps[kk].before : cur.M.end, L = kk > 0 ? cur.steps[kk - 1].LAfter : 0;
        const df = sansFont(400, Math.min(12.5, cell * 0.92));
        for (let j = 0; j <= cur.top; j++) {
          const c = tapeGet(tape, L - j);
          if (c === null) continue;
          const p = this._P(X + 1.2, j, 0);
          text(ctx, c, p[0] + 5, p[1], df, c === '1' ? TH.ink : TH.label, 'mm', front);
        }
      }

      // 가리킨 걸음
      const hv = this.hover;
      if (hv && this.runs.includes(hv.run)) {
        const r = hv.run, x = r.off + hv.k, p = this._P(x, r.pl[hv.k], r.lev[hv.k]), c2 = C.st[r.lev[hv.k]];
        const q0 = this._P(x, TRACE.FLOOR, 0), q1 = this._P(x, r.top + 1, 0), q2 = this._P(x, TRACE.FLOOR, 6.3);
        ctx.lineWidth = 1; ctx.strokeStyle = rgba(TH.ink, 0.45);
        ctx.beginPath(); ctx.moveTo(q1[0], q1[1]); ctx.lineTo(q0[0], q0[1]); ctx.lineTo(q2[0], q2[1]); ctx.stroke();
        ctx.strokeStyle = TH.ink; ctx.lineWidth = 1.5; ctx.beginPath(); ctx.arc(p[0], p[1], 5.5, 0, Math.PI * 2); ctx.stroke();
        ctx.fillStyle = c2; ctx.beginPath(); ctx.arc(p[0], p[1], 3, 0, Math.PI * 2); ctx.fill();
        const st = r.steps[Math.min(hv.k, r.N - 1)], halted = hv.k >= r.N;
        const str = halted ? T.traceHalted(r.n, r.N) : T.traceInfo(r.n, hv.k + 1, name(r.lev[hv.k]), st.read, st.write, st.move, st.next === 'H');
        const w = textW(ctx, str, font), tx = Math.min(Math.max(p[0], 8 + w / 2), this.w - 8 - w / 2), ty = p[1] > 50 ? p[1] - 16 : p[1] + 26;
        ctx.fillStyle = rgba(TH.bg, 0.86); ctx.fillRect(tx - w / 2 - 7, ty - fpx - 3, w + 14, fpx + 10);
        text(ctx, str, tx, ty, font, TH.ink, 'ms');
      }
    }

    // ── 손
    _pick(px, py, rad) {                               // 화면의 점에서 가장 가까운 걸음(머리의 길 위의 점)
      let best = null, bd = rad * rad;
      const X = this.now;
      for (let i = this.runs.length - 1; i >= 0; i--) {
        const r = this.runs[i], to = Math.floor(r === this.cur ? r.h : r.stop);
        if (r.off + to < X - this.ageStart - this.ageLen * 0.5) break;
        for (let k = to; k >= 0; k--) {
          if (X - r.off - k > this.ageStart + this.ageLen * 0.5) break;
          const p = this._P(r.off + k, r.pl[k], r.lev[k]);
          if (p[2] <= 0) continue;
          const dx = p[0] - px, dy = p[1] - py, d = dx * dx + dy * dy;
          if (d < bd) { bd = d; best = { run: r, k }; }
        }
      }
      return best;
    }
    _hoverAt(px, py, hold) {
      const h = this._pick(px, py, hold ? 26 : 15), o = this.hover;
      if ((h && h.run) !== (o && o.run) || (h && h.k) !== (o && o.k)) { this.hover = h; this.wake(); }
      this.hoverUntil = h && hold ? performance.now() + hold : 0;
      this.box.style.cursor = this.drag ? 'grabbing' : (h ? 'pointer' : 'grab');
      return h;
    }
    _bind() {
      const box = this.box, pos = e => { const r = box.getBoundingClientRect(); return [e.clientX - r.left, e.clientY - r.top]; };
      const onUi = e => e.target.closest && e.target.closest('button');
      box.addEventListener('pointerdown', e => {
        if (onUi(e)) return;
        if (e.pointerType === 'mouse' && e.button !== 0) return;
        const [px, py] = pos(e);
        this.drag = { id: e.pointerId, x: px, y: py, x0: px, y0: py, t0: performance.now(), moved: false, touch: e.pointerType === 'touch' };
        try { box.setPointerCapture(e.pointerId); } catch (err) { /* 잡지 못해도 된다 */ }
        this.wake();
      });
      box.addEventListener('pointermove', e => {
        const d = this.drag, [px, py] = pos(e);
        if (!d || d.id !== e.pointerId) {
          if (e.pointerType === 'mouse') { this.ptr = { x: px, y: py }; if (!onUi(e)) this._hoverAt(px, py, 0); else if (this.hover) { this.hover = null; this.wake(); } }
          return;
        }
        if (!d.moved && Math.hypot(px - d.x0, py - d.y0) < 6) return;
        if (!d.moved) { d.moved = true; this.hover = null; this.view = ''; this._labels(); box.style.cursor = 'grabbing'; }
        this.psiT = Math.max(-0.45, Math.min(Math.PI / 2 + 0.2, this.psiT - (px - d.x) * 0.0062));       // 좌우: 돌린다
        if (!d.touch) this.thetaT = Math.max(-0.12, Math.min(Math.PI / 2, this.thetaT + (py - d.y) * 0.0062));   // 위아래: 내려다본다 (손가락은 쪽을 넘긴다)
        d.x = px; d.y = py; this.wake();
      });
      const up = e => {
        const d = this.drag;
        if (!d || d.id !== e.pointerId) return;
        this.drag = null;
        try { box.releasePointerCapture(e.pointerId); } catch (err) { /* */ }
        if (e.type === 'pointerup' && !d.moved && performance.now() - d.t0 < 600) {      // 눌렀다 뗌: 그 걸음으로 돌아간다 (다른 수의 기록이면 그 수를 다시 계산)
          const [px, py] = pos(e), h = this._hoverAt(px, py, d.touch ? 2600 : 0);
          if (h) {
            if (h.run === this.cur && this.cur.M && h.k < this.cur.N) { this.host.currentTime = this.cur.steps[h.k].t0 + 1e-4; this.host.play(); }
            else if (h.run !== this.cur) this.host._jumpTo(h.run.n);
          }
        }
        box.style.cursor = 'grab'; this.wake();
      };
      box.addEventListener('pointerup', up); box.addEventListener('pointercancel', up);
      box.addEventListener('pointerleave', e => { if (e.pointerType === 'mouse') { this.ptr = null; if (!this.drag) { this.hover = null; this.wake(); } } });
      box.addEventListener('dblclick', e => { if (!onUi(e)) this.setView('solid'); });
      for (const k of Object.keys(this.btn)) this.btn[k].addEventListener('click', () => this.setView(k));
      this.cv.addEventListener('webglcontextlost', e => { e.preventDefault(); this.lost = true; this.stop(); });
      this.cv.addEventListener('webglcontextrestored', () => {
        try { this.lost = false; this._initGL(); this.dirty = true; this.wake(); }
        catch (err) { this.ok = false; }
      });
    }
  }

  // ───────────────────────────── 웹 컴포넌트 ─────────────────────────────
  const STYLE = `
    :host { display: block; position: relative; width: 100%; max-width: 100%; -webkit-tap-highlight-color: transparent; }
    :host([hidden]) { display: none; }
    .stage { position: relative; cursor: pointer; outline: none; border-radius: 6px;
             max-width: var(--turing-3n1-machine-width, 100%); margin-left: auto; margin-right: auto; }
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
    .trace { position: relative; height: var(--turing-3n1-trace-height, 300px); overflow: hidden; cursor: grab;
             touch-action: pan-y; -webkit-user-select: none; user-select: none; -webkit-tap-highlight-color: transparent; }
    .trace[hidden] { display: none; }
    .trace canvas { position: absolute; left: 0; top: 0; width: 100%; height: 100%; }
    .trace-ov { pointer-events: none; }
    .trace-ui { position: absolute; left: 16px; bottom: 8px; display: flex; gap: 6px; }
    .trace-ui button { font: 400 12px/1 "Nanum Gothic", NanumGothic, system-ui, sans-serif; color: #6A6772; cursor: pointer;
             background: rgba(255,255,255,.82); border: 1px solid #DCDAE0; border-radius: 999px; padding: 6px 12px; }
    .trace-ui button:hover, .trace-ui button:focus-visible { color: #9A7628; border-color: #9A7628; outline: none; }
    .trace-ui button[aria-pressed="true"] { color: #9A7628; border-color: #C9B27A; }
    :host([theme="dark"]) .trace-ui button { color: #83818A; background: rgba(13,13,16,.72); border-color: #2B2A31; }
    :host([theme="dark"]) .trace-ui button:hover, :host([theme="dark"]) .trace-ui button:focus-visible { color: #F2D99A; border-color: #C6A660; }
    :host([theme="dark"]) .trace-ui button[aria-pressed="true"] { color: #D9BE82; border-color: #6B5A33; }
  `;
  const PLAY_SVG = '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M6 4l14 8-14 8z"/></svg>';
  const reducedMotion = () => !!(window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches);

  class Turing3n1 extends HTMLElement {
    static get observedAttributes() { return ['start', 'theme', 'numbers', 'layout', 'speed', 'loop', 'controls', 'lang', 'sequence', 'ridges', 'trace']; }

    constructor() {
      super();
      const root = this.attachShadow({ mode: 'open' });
      root.innerHTML = `<style>${STYLE}</style>
        <div class="stage" part="stage" tabindex="0">
          <canvas part="canvas" role="img"></canvas>
          <div class="play">${PLAY_SVG}</div>
        </div>
        <div class="trace" part="trace" role="group" hidden>
          <canvas class="trace-gl" aria-hidden="true"></canvas><canvas class="trace-ov" aria-hidden="true"></canvas>
          <div class="trace-ui"><button type="button" data-trace="solid"></button><button type="button" data-trace="tape"></button><button type="button" data-trace="states"></button><button type="button" data-trace="orbit"></button></div>
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
      this._seq = false; this._ridges = false; this._rows = null; this._n0 = 27; this._rnd = 0; this._Gold = null;
      this._sm = 110; this._smSnap = true; this._clock = 0; this._rowsVer = 0; this._rcan = null; this._rkey = '';
      this._rx = new Float64Array(1024); this._ry = new Float64Array(1024);
      this._traceBox = root.querySelector('.trace'); this._trace3 = null; this._traceOn = false; this._traceFail = false;
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
      this._started = true; this._ended = false; this._smSnap = true;
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
    restart() {
      if (this._M && this._M.cont) this._build();              // 이어 달리던 중이면 첫 수로 돌아간다
      this._t = 0; this._cam = 0; this._started = true; this._ended = false; this._smSnap = true; this._render();
    }

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
      if (this._trace3) this._trace3.stop();
      if (this._ro) this._ro.disconnect();
      if (this._io) this._io.disconnect();
    }
    attributeChangedCallback(name, oldV, newV) {
      if (!this._M || oldV === newV) return;
      this._readAll();
      if (name === 'start') {
        const n = this._readStart();
        if (n !== this._n0) { this._build(); this.restart(); }
      } else if (name === 'sequence' || name === 'ridges' || name === 'trace' || (name === 'loop' && this.hasAttribute('sequence'))) {
        this._build(); this._base = null; this._resize(true); this.restart();
      } else if (name === 'layout') {
        this._resize(true);
      } else {
        this._syncBar(); this._render();
        if (this._trace3) { this._trace3.dirty = true; this._trace3.wake(); }
      }
    }

    // ── 안쪽
    _readStart() {
      const a = this.getAttribute('start');
      if (a === 'random') return this._rnd || (this._rnd = 27 + Math.floor(Math.random() * 973));   // 27 – 999
      const n = Math.floor(Number(a));
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
      this._numbers = num === null ? true : (num !== 'off' && num !== 'false');
      const sp = parseFloat(this.getAttribute('speed'));
      this._speed = Number.isFinite(sp) ? Math.max(0.1, Math.min(16, sp)) : 1;
      const lp = this.getAttribute('loop');
      this._loop = !(lp === 'off' || lp === 'false');
      const on = name => { const v = this.getAttribute(name); return v !== null && v !== 'off' && v !== 'false'; };
      this._seq = on('sequence') && this._loop;
      this._ridges = on('ridges');
      this._traceOn = on('trace');
      if (this._traceOn && !this._trace3 && !this._traceFail) {      // 자취 그림은 처음 쓸 때 만든다
        const tr = new Trace(this, this._traceBox);
        if (tr.ok) this._trace3 = tr; else this._traceFail = true;
      }
      if (this._traceOn && this._traceFail) { this._traceOn = false; this._ridges = true; }    // WebGL이 없으면 ridges 그림으로
      this._traceBox.hidden = !this._traceOn;
      if (this._trace3) this._trace3._labels();
      this._bar.hidden = !this.hasAttribute('controls') || this.getAttribute('controls') === 'off';
    }
    _build() {
      this._n0 = this._readStart();
      this._M = buildModel(this._n0, this._seq, false);
      this._Gold = null; this._smSnap = true;
      this._rows = null; this._rowsVer++;
      if (this._ridges) {                             // 앞선 수들의 줄을 미리 놓는다: n−1, n−2, …
        this._rows = [];
        for (let k = 1; k <= RIDGE_KEEP && this._n0 - k >= 2; k++) this._rows.push(ridgeRow(this._n0 - k));
      }
      if (this._LY) this._G = geometry(this._LY, this._M);
      this._syncBar();
    }
    _nextRun() {                                      // sequence: 멈춘 수의 줄을 뒤로 보내고 다음 수로
      const M = this._M;
      if (this._rows) {
        this._rows.unshift({ n: M.n, v: M.VCH.map(v => v.val), nit: M.NIT, vmax: M.VMAX });
        if (this._rows.length > RIDGE_KEEP) this._rows.length = RIDGE_KEEP;
        this._rowsVer++;
      }
      this._Gold = this._G;
      this._M = buildModel(M.n < 1000000 ? M.n + 1 : 2, true, true);
      this._G = geometry(this._LY, this._M);
      this._syncBar();
    }
    _jumpTo(n) {                                      // 자취 그림에서 고른 수로: 하던 계산을 그만두고 그 수부터 이어 간다
      if (!this._M || !this._G) return;
      n = Math.max(1, Math.min(1000000, Math.floor(n)));
      if (n === this._M.n && this._playing && this._t < 2.5) return;
      this._Gold = this._G;
      this._M = buildModel(n, this._seq, this._seq);
      this._G = geometry(this._LY, this._M);
      this._t = 0; this._cam = 0; this._started = true; this._ended = false; this._smSnap = true;
      this._syncBar(); this.play(); this._render();
    }
    _traceEdges() {                                    // 자취 그림의 글자와 단추를 기계 그림의 왼쪽 · 오른쪽 끝(규칙표의 끝)에 맞춘다
      const a = this._stage.getBoundingClientRect(), b = this._traceBox.getBoundingClientRect(), LY = this._LY;
      const m = LY ? a.width * LY.gx0 / LY.W : 16;
      return [a.left - b.left + m, a.right - b.left - m];
    }
    _smTarget() {                                     // ridges의 가로 눈금: 보이는 줄 가운데 가장 긴 것이 들어가게
      const M = this._M, R = this._LY.Rg;
      let m = M.VCH[Math.max(0, bisectRight(M.VCH_T, this._t) - 1)].it + 4;
      const rows = this._rows || [];
      for (let j = Math.min(rows.length, R.rows) - 1; j >= 0; j--) if (rows[j].nit > m) m = rows[j].nit;
      return Math.max(R.smMin, 10 * Math.ceil((m + 6) / 10));
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
      const aria = this._seq ? T.ariaSeq(this._n0, this._ridges) : T.aria(M);
      if (this._canvas.getAttribute('aria-label') !== aria) this._canvas.setAttribute('aria-label', aria);
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
      if (this._trace3 && this._traceOn) this._trace3.wake();
    }
    _showPoster() {                 // 기다리는 동안 보여 줄 장면: 여섯 번째 계산 직후
      const M = this._M;
      const tt = M.NIT >= 1 ? M.VCH[Math.min(6, M.NIT)].t + 0.6 : M.HALT_T0 + 1;
      this._t = Math.min(tt, M.OUT_T0 - 0.01);
      if (this._G) this._cam = camTarget(M, this._G, this._t);
      this._started = false; this._smSnap = true;
    }
    _resize(force) {
      const cssW = this._stage.clientWidth || this.clientWidth;      // (기계 그림의 폭: 자취 그림이 있으면 요소보다 좁을 수 있다)
      if (!cssW) return;
      const mode = this.getAttribute('layout');
      let name = mode === 'wide' || mode === 'narrow' ? mode : '';
      if (!name) {                                    // auto: 페이지의 CSS가 정했으면 그것을, 아니면 폭으로
        const v = getComputedStyle(this).getPropertyValue('--turing-3n1-layout').trim();
        name = v === 'wide' || v === 'narrow' ? v : (cssW < 640 ? 'narrow' : 'wide');
      }
      if (force || this._LY !== LAYOUTS[name]) {
        this._LY = LAYOUTS[name];
        this._G = geometry(this._LY, this._M);
        this._Gold = null; this._smSnap = true;
        if (!this._started) this._showPoster();
        this._fades = null;
      }
      const LY = this._LY;
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      const pw = Math.min(Math.round(cssW * dpr), 2560);
      const ph = Math.round(pw * (LY.H + (this._ridges ? LY.Rg.h : 0)) / LY.W);
      if (this._canvas.width !== pw || this._canvas.height !== ph) {
        this._canvas.width = pw; this._canvas.height = ph;
        this._gcan.width = this._gmask.width = Math.max(1, Math.ceil(pw / 4));
        this._gcan.height = this._gmask.height = Math.max(1, Math.ceil(ph / 4));
        this._fades = null;
      }
      this._render();
      if (this._trace3 && this._traceOn) this._trace3.resize();
    }
    _tick(now) {
      this._raf = 0;
      if (!this._playing || !this._visible) return;
      const dt = this._last ? Math.min(0.1, (now - this._last) / 1000) : 0;
      this._last = now;
      this._clock += dt;
      if (this._fontsReady && this._G) this._advance(dt * this._speed);
      this._render();
      this._schedule();
    }
    _advance(dt) {
      let M = this._M;
      let t = this._t + dt;
      if (t >= M.TOTAL) {
        if (this._seq) { t -= M.TOTAL; this._cam = 0; this._nextRun(); M = this._M; t = Math.min(t, M.TOTAL - 0.001); }
        else if (this._loop) { t -= M.TOTAL; this._cam = 0; }
        else { t = M.OUT_T0 - 0.001; this._ended = true; this._t = t; this._setPlaying(false); return; }
      }
      const tgt = camTarget(M, this._G, t);
      this._cam += (tgt - this._cam) * (1 - Math.exp(-dt / TAU));
      this._t = t;
      if (this._ridges && !this._smSnap) this._sm += (this._smTarget() - this._sm) * (1 - Math.exp(-dt / 0.55));
    }

    _render() {
      if (!this._M || !this._LY || !this._canvas.width) return;
      this._draw(this._t);
    }

    // 고정 층: 바탕 · 할 일 · 규칙표 머리글 · 줄 이름 · 쉬고 있는 규칙표. 크기 · 배치 · 색 · 글꼴이 바뀔 때만 다시 그린다
    _baseLayer() {
      const cw = this._canvas.width, ch = this._canvas.height, LY = this._LY, TH = this._TH, num = this._numbers, T = this._T;
      const key = [cw, ch, LY.W, this._themeName, num, this._fontsReady, this._langName, this._ridges].join('|');
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
      if (this._ridges) {
        const R = LY.Rg;
        text(ctx, T.ridge, R.hx0, LY.H + R.hdrY, F.hdr, TH.label, 'la');
        text(ctx, T.ridgeLegend, R.hx1, LY.H + R.hdrY, F.hdr, TH.label, 'ra');
      }
      return b;
    }

    _draw(tt) {
      const ctx = this._ctx, M = this._M, LY = this._LY, TH = this._TH, num = this._numbers, T = this._T;
      let G = this._G;
      if (M.cont && this._Gold && tt < T_GEOM && this._Gold.cell !== G.cell) {   // 칸 크기가 다른 수로 넘어갈 때
        const cell = lerp(this._Gold.cell, G.cell, ease(tt / T_GEOM));
        G = { cell, s: cell / 84, anchor: LY.xmax - 3 * cell, xmin: G.xmin };
      }
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
        const label = pillName(T, S.pill, num), from = S.pillFrom && S.pillMix < 1 ? pillName(T, S.pillFrom, num) : null;
        const pm = from ? ease(S.pillMix) : 1;
        const pw = from ? lerp(richW(ctx, from, 700, 25) + 44, richW(ctx, label, 700, 25) + 44, pm) : richW(ctx, label, 700, 25) + 44;
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
          if (from) {                                          // 앞 이름이 위로 빠진 다음 새 이름이 아래에서 올라옴 (겹치지 않게)
            const o = clamp01(1 - 2 * pm), n2 = clamp01(2 * pm - 1);
            rich(ctx, from, pcx, box[1] + 22 - 8 * (1 - o), 700, 25, TH.gold, ha * o, num ? stColor(TH) : null);
            rich(ctx, label, pcx, box[1] + 22 + 8 * (1 - n2), 700, 25, TH.gold, ha * n2, num ? stColor(TH) : null);
          } else rich(ctx, label, pcx, box[1] + 22, 700, 25, TH.gold, ha, num ? stColor(TH) : null);
        }
      }

      // ── 읽기 · 쓰기 · 이동
      let px = LY.phaseX;
      for (const [name, ph] of [[T.phases[0], 'read'], [T.phases[1], 'write'], [T.phases[2], 'move'], [T.phases[3], 'state']]) {
        const on = S.phase === ph && !S.fast, soft = S.fast && S.phase !== null;
        if (on) {
          ctx.globalAlpha = oa; ctx.fillStyle = TH.gold;
          ctx.beginPath(); ctx.arc(px - 12.5, LY.phaseY + 16.5, 4.5, 0, Math.PI * 2); ctx.fill(); ctx.globalAlpha = 1;
        }
        text(ctx, name, px, LY.phaseY, on ? F.capB : F.cap, on ? TH.phaseOn : (soft ? TH.phaseSoft : TH.phaseOff), 'la');
        px += LY.phaseDX;
      }

      // ── 규칙표: 지금 상태의 열만 다시 그린다 (나머지는 고정 층에 있음)
      const act = S.cellRC;
      if (act) {
        const c = STATES.indexOf(act[0]);
        const at = drawColumn(ctx, LY, TH, T, num, c, S.colOn, act[1], true, !S.hand);
        const x = colX(LY, c), y = LY.gyRow + ROWS.findIndex(r => r[0] === act[1]) * LY.gpitch;
        glow(x + 3, y, x + LY.gcol - 5, y + 38, 9, 0.55);
        if (at && S.nextGlow > 0.01) {                         // 다음 상태: 방금 쓴 규칙의 다음 상태 번호가 빛남
          const r = at[2] + 5;
          glow(at[0] - r, at[1] - r, at[0] + r, at[1] + r, r, 0.95 * S.nextGlow);
        }
      }
      if (S.hand && S.hand.a > 0.003) {                       // 머리글의 금빛 테 = 지금 상태 (다음 상태의 열로 따라감)
        const hb = drawHand(ctx, LY, TH, T, num, S.hand);
        if (S.hand.glow > 0.01) glow(hb[0], hb[1], hb[2], hb[3], 17, 0.45 * S.hand.glow * S.hand.a);
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
          if (this._ridges) {                                  // 작은 그래프 대신 출발한 수 (그래프는 아래 큰 그림에)
            const Fr = LY.Fr, fs = fmt(M.n);
            const fw = textW(ctx, fs, F.bin(Fr.px));
            text(ctx, T.from, Fr.x, Fr.labY, F.hdr, TH.label, 'ls', ra);
            text(ctx, fs, Fr.x, Fr.numY, F.bin(fw > Fr.maxW ? Fr.px * Fr.maxW / fw : Fr.px), TH.from, 'ls', ra);
          } else {
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
      }
      if (this._ridges) this._drawRidges(ctx, M, S, tt, glow);
      if (this._trace3 && this._traceOn) this._trace3.setLive(M, tt);      // 자취 그림에 알린다: 지금의 계산과 시각

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
      const halo = this._halo;
      this._halo = null;
      if (halo && halo.a > 0.004) {                            // ridges: 지금 수의 줄을 따라 번지는 빛
        gm.globalCompositeOperation = 'lighter';
        gm.strokeStyle = `rgba(0,0,0,${clamp01(halo.a * TH.glowGain)})`;
        gm.lineWidth = halo.w * s4; gm.lineJoin = 'round'; gm.lineCap = 'round';
        gm.beginPath(); gm.moveTo(this._rx[0] * s4, this._ry[0] * s4);
        for (let i = 1; i < halo.n; i++) gm.lineTo(this._rx[i] * s4, this._ry[i] * s4);
        if (halo.xTail !== null) gm.lineTo(halo.xTail * s4, halo.yb * s4);
        gm.stroke();
        glows.push(null);                                      // (빛번짐을 그리게)
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
      const fadeIn = ease(tt / (M.IN_T0 + 0.8));               // (sequence에서는 처음 한 번만 떠오르고, 수 사이에는 사라지지 않는다)
      const whole = M.cont ? 1 : (tt < M.IN_T0 + 0.8 ? fadeIn : (tt >= M.OUT_T0 && !M.seq ? oa : 1));
      if (whole < 1) {
        ctx.globalAlpha = 1 - whole; ctx.fillStyle = TH.bg; ctx.fillRect(0, 0, cw, ch); ctx.globalAlpha = 1;
      }
    }

    // ── '수의 변화' 그림 (ridges). 출발한 수마다 줄 하나: 가로 = 계산 횟수, 높이 = 수의 크기(그 줄에서 가장 컸던 값이 기준).
    //    맨 앞의 금빛 줄이 지금 수이고, 그 높이 눈금은 '지금까지의 최고값'이라 새 최고값이 나올 때마다 줄이 내려앉는다.
    //    수가 1이 되면 줄이 바닥에 닿아 평평해지고, 줄 전체가 한 칸 뒤로 물러난다. 뒤의 줄들은 앞선 수(n−1, n−2, …).
    _drawRidges(ctx, M, S, tt, glow) {
      const LY = this._LY, R = LY.Rg, TH = this._TH, top = LY.H, lw = R.lw;
      if (this._smSnap) { this._sm = this._smTarget(); this._smSnap = false; }
      const x0 = R.x0, x1 = R.x1, base = top + R.base, hor = top + R.hor, dx = (x1 - x0) / this._sm;
      // 소실점이 천천히 좌우로 움직인다. 반 픽셀 단위로만 옮겨, 뒤의 줄들을 그려 둔 층은 그때만 다시 그린다
      const vpx = LY.W / 2 + Math.round(2 * R.sway * Math.sin(this._clock * 2 * Math.PI / SWAY_T)) / 2;
      const slide = M.seq && tt >= M.OUT_T0 ? ease((tt - M.OUT_T0) / (M.TOTAL - M.OUT_T0 - 0.15)) : 0;
      const sAt = d => 1 / (1 + d * R.dz);
      const rx = this._rx, ry = this._ry, bg = rgb(TH.bg);
      const rows = this._rows || [], nR = Math.min(rows.length, R.rows);

      // 줄 하나: 뒤의 줄을 가리는 면(바탕색에 줄의 색을 조금 섞어 아래로 갈수록 바탕색) + 선. 점은 rx · ry의 앞 n개
      const paint = (c, n, yb, xTail, col, alpha, width, mist, halo) => {
        c.beginPath(); c.moveTo(rx[0], yb + 1);
        let ymin = yb;
        for (let i = 0; i < n; i++) { c.lineTo(rx[i], ry[i]); if (ry[i] < ymin) ymin = ry[i]; }
        c.lineTo(rx[n - 1], yb + 1); c.closePath();
        c.globalAlpha = 1;
        if (mist > 0.004 && ymin < yb - 2) {
          const g = c.createLinearGradient(0, ymin, 0, yb);
          g.addColorStop(0, `rgb(${[0, 1, 2].map(j => Math.round(lerp(bg[j], col[j], mist))).join(',')})`);
          g.addColorStop(1, TH.bg);
          c.fillStyle = g;
        } else c.fillStyle = TH.bg;
        c.fill();
        const cs = col.join(',');
        c.beginPath(); c.moveTo(rx[0], ry[0]);
        for (let i = 1; i < n; i++) c.lineTo(rx[i], ry[i]);
        if (xTail !== null) c.lineTo(xTail, yb);
        c.lineJoin = halo > 0 ? 'round' : 'bevel';
        if (halo > 0.3) { c.strokeStyle = `rgba(${cs},${0.13 * halo})`; c.lineWidth = width * 2.8; c.stroke(); }
        c.strokeStyle = `rgba(${cs},${alpha})`; c.lineWidth = width; c.stroke();
      };
      // 앞선 수의 이름: 평평해진 줄의 오른쪽 끝에 작게 (가까운 두세 줄만, 뒤로 갈수록 흐리게)
      const tailLabel = (c, d, n, a) => {
        if (a <= 0.01) return;
        const s = sAt(d);
        text(c, fmt(n), vpx + (x1 - vpx) * s + 11 * lw, hor + (base - hor) * s, sansFont(400, R.subPx), TH.ink, 'lm', a);
      };
      const fadeBack = d => 0.62 * Math.pow(0.7, d - 1);

      // 1. 앞선 수들: 따로 그려 둔 층. 줄이 바뀌거나, 물러나는 중이거나, 가로 눈금 · 소실점이 달라질 때만 다시 그린다
      const cw = this._canvas.width, k = cw / LY.W, oy = Math.round(top * k), lh = this._canvas.height - oy;
      const key = [cw, lh, LY.W, this._themeName, this._fontsReady, this._rowsVer, this._sm.toFixed(3), slide.toFixed(4), vpx].join('|');
      const layer = this._rcan || (this._rcan = document.createElement('canvas'));
      if (key !== this._rkey) {
        this._rkey = key;
        if (layer.width !== cw || layer.height !== lh) { layer.width = cw; layer.height = lh; }
        const c = layer.getContext('2d');
        c.setTransform(1, 0, 0, 1, 0, 0); c.clearRect(0, 0, cw, lh);
        c.setTransform(k, 0, 0, k, 0, -oy);
        c.lineCap = 'round';
        if (TH.skyA > 0) {                                     // 줄들이 사라지는 지평선의 옅은 빛
          const sy = hor + (base - hor) * sAt(R.rows), g = c.createRadialGradient(vpx, sy, 0, vpx, sy, 560);
          g.addColorStop(0, rgba(TH.sky, TH.skyA)); g.addColorStop(1, rgba(TH.sky, 0));
          c.save(); c.translate(0, sy); c.scale(1, 0.13); c.translate(0, -sy);
          c.fillStyle = g; c.fillRect(vpx - 560, sy - 560, 1120, 1120); c.restore();
        }
        for (let j = nR - 1; j >= 0; j--) {                    // 먼 줄부터
          const d = j + 1 + slide, tn = ridgeTone(TH, (d - 1) / (R.rows - 1.5));
          if (tn.a < 0.03) continue;
          const s = sAt(d), yb = hor + (base - hor) * s, row = rows[j], v = row.v, m = Math.min(row.nit, rx.length - 1);
          const amp = R.ph * softAmp(row.vmax) * s, den = row.vmax > 1 ? row.vmax - 1 : 1;
          for (let i = 0; i <= m; i++) { rx[i] = vpx + (x0 + i * dx - vpx) * s; ry[i] = yb - (v[i] - 1) / den * amp; }
          paint(c, m + 1, yb, vpx + (x1 - vpx) * s, tn.rgb, tn.a, Math.max(0.7, 1.7 * Math.sqrt(s)) * lw,
                TH.mist * tn.a * (0.3 + 0.7 * clamp01((d - 1) / 14)), 0);
        }
        for (let j = Math.min(nR, R.tails) - 1; j >= 0; j--) {
          tailLabel(c, j + 1 + slide, rows[j].n, fadeBack(j + 1 + slide) * (j === R.tails - 1 ? 1 - slide : 1));
        }
      }
      ctx.save();
      ctx.setTransform(1, 0, 0, 1, 0, 0);
      ctx.globalAlpha = 1; ctx.drawImage(layer, 0, oy);
      ctx.restore();
      if (S.inProg === null) return;

      // 2. 지금 수
      ctx.save();
      ctx.beginPath(); ctx.rect(0, top, LY.W, R.h); ctx.clip();
      ctx.lineCap = 'round';
      const liveA = ease(S.inProg / 0.6);
      const s = sAt(slide), yb = hor + (base - hor) * s, VCH = M.VCH, vi = Math.min(S.vi, rx.length - 1);
      const rec = M.REC[Math.max(0, bisectRight(M.REC_T, tt) - 1)];
      const emax = rec.prev + (rec.val - rec.prev) * easeOut((tt - rec.t) / 0.7);      // 눈금이 새 최고값을 따라간다
      const amp = R.ph * softAmp(emax) * s * easeOut(S.inProg / 0.9), den = emax > 1 ? emax - 1 : 1;   // (첫 점은 바닥에서 떠오른다)
      for (let i = 0; i <= vi; i++) {
        rx[i] = vpx + (x0 + i * dx - vpx) * s; ry[i] = yb - Math.min(1.4, (VCH[i].val - 1) / den) * amp;
      }
      if (vi > 0 && S.valueT !== null && S.valueT < 0.3) {                             // 방금 생긴 선분이 그려지는 중
        const u = easeOut(S.valueT / 0.3);
        rx[vi] = lerp(rx[vi - 1], rx[vi], u); ry[vi] = lerp(ry[vi - 1], ry[vi], u);
      }
      let xTail = null, tailU = 0;
      if (tt >= M.HALT_T0) {                                                           // 멈춤: 바닥을 따라 오른쪽 끝까지 평평하게
        tailU = easeOut((tt - M.HALT_T0) / 1.0);
        xTail = lerp(rx[vi], vpx + (x1 - vpx) * s, tailU);
      }
      const t1 = ridgeTone(TH, 0), lc = rgb(TH.ridgeLive);
      const col = [0, 1, 2].map(j => Math.round(lerp(lc[j], t1.rgb[j], slide)));
      paint(ctx, vi + 1, yb, xTail, col, lerp(1, t1.a, slide) * liveA, lerp(2.4, 1.7 * Math.sqrt(s), slide) * lw,
            lerp(TH.mistLive, TH.mist * t1.a * 0.3, slide) * liveA, (1 - slide) * liveA * R.halo);
      this._halo = { n: vi + 1, xTail, yb, a: 0.42 * (1 - slide) * liveA * R.halo, w: 7 * lw };

      // 3. 머리점 · 지금까지의 최고값 · 출발한 수
      const ha = liveA * (1 - slide) * (xTail !== null ? 1 - ease((tailU - 0.55) / 0.45) : 1);
      if (ha > 0.01) {
        const hx = xTail !== null ? xTail : rx[vi], hy = xTail !== null ? yb : ry[vi];
        ctx.globalAlpha = ha; ctx.fillStyle = TH.hot;
        ctx.beginPath(); ctx.arc(hx, hy, 4.5 * lw, 0, Math.PI * 2); ctx.fill(); ctx.globalAlpha = 1;
        glow(hx - 9 * lw, hy - 9 * lw, hx + 9 * lw, hy + 9 * lw, 9 * lw, 0.8 * ha);
      }
      const pa = rec.i > 0 && rec.i <= vi ? ease((tt - rec.t - 0.12) / 0.5) * (1 - slide) * liveA : 0;
      if (pa > 0.01) {
        const str = fmt(rec.val), font = sansFont(400, R.peakPx), w = textW(ctx, str, font);
        text(ctx, str, Math.min(Math.max(rx[rec.i], x0 + w / 2 - 20), x1 - w / 2), ry[rec.i] - 9 * lw, font, TH.peak, 'ms', pa);
      }
      text(ctx, fmt(M.n), x0 - 14 * lw, base + 2 * lw, sansFont(700, R.labPx), TH.gold, 'rs', liveA * (1 - ease(slide * 2)));
      if (slide > 0.01) tailLabel(ctx, slide, M.n, liveA * slide * fadeBack(1));
      ctx.restore();
    }
  }

  window.customElements.define('turing-3n1', Turing3n1);
})();
