// tools/ui-theme-guides.mjs — UI themes drawn from the official Korean event guide images (이벤트 가이드, Yostar KR):
// each spec copies its guide's page colour, panel plates, frame lines, section-header shape and accent. Colours were
// sampled from the guides; shapes are CSS only (no guide artwork is used). tools/build-ui-themes.mjs merges these
// specs over its own (same id → replaced), tools/ui-theme-textures.mjs merges GUIDE_TEXTURES / GUIDE_MAT.
//
// Faction → event guide: 염국 화중인 · 라테라노 공상의 정원 · 우르수스 사람들, 우리들 · 빅토리아 위대한 서곡의 끝 ·
// 시라쿠사 시라쿠사인 · 에기르 삶의 길 · 카시미어 니어 라이트 · 라이타니엔 츠빌링슈튀르메의 가을 ·
// 사르곤 이상적인 도시: 엔드리스 카니발 · 쉐라그 RETRACING (설산 강림 1101).
// Side stories: 화산의 꿈 여행 · 부정축재 · 론 트레일 · 아테누스 복수록 · 허락받지 못한 땅 · 불타버린 엘레지여.

const S = (id) => `:root[data-ui-theme="${id}"]`;
/** Heading rules shared by every guide theme: the guide's section header drawn on .section-label / .panel__title. */
const heads = (id, { label, title, modal }) => [
  label && `${S(id)} .section-label { ${label} }`,
  title && `${S(id)} :is(.panel__title, .topbar__title) { ${title} }`,
  modal && `${S(id)} .modal__title { ${modal} }`,
].filter(Boolean).join('\n');

const svgUrl = (w, h, body) => `url("data:image/svg+xml,${encodeURIComponent(`<svg xmlns='http://www.w3.org/2000/svg' width='${w}' height='${h}' viewBox='0 0 ${w} ${h}'>${body}</svg>`).replace(/'/g, '%27')}")`;
// a lancet-arch window bay (two lights under a pointed arch, a quatrefoil above): the Leithanien page tracery
const LANCET = svgUrl(90, 140, `<g fill='none' stroke='#c9a35a' stroke-opacity='.09' stroke-width='1.2'><path d='M10 140V60Q10 18 45 4Q80 18 80 60V140'/><path d='M22 140V78Q22 54 33 44Q44 54 44 78V140M46 140V78Q46 54 57 44Q68 54 68 78V140'/><circle cx='45' cy='34' r='7'/></g>`);
export const GUIDE_THEMES = [
  // ---- 진영 ----------------------------------------------------------------------------------------------------------
  {
    id: 'f-yan', name: '염국', group: 'faction', light: true,
    // 화중인: ink-wash paper (pale grey-green), black brush strokes, vertical text, a red seal; no frames, only ink edges
    p: { bg: ['#e4e7e3', '#f1f3ef', '#f8f9f6', '#d5dad6', '#c3cac6'], line: ['#bfc6c2', '#8e9692', '#5d6360'], accent: '#a92d2a', glow: '#c8403a', accent2: '#1d1f1e', text: ['#151716', '#353937', '#565b58', '#6a6f6c'], onAccent: '#f7f3ee' },
    body: `background-color: var(--bg-0);
  background-image: radial-gradient(60% 45% at 85% 10%, rgba(40, 46, 44, .16), transparent 70%), radial-gradient(70% 50% at 8% 95%, rgba(60, 70, 66, .14), transparent 72%), radial-gradient(30% 25% at 60% 40%, rgba(255, 255, 255, .5), transparent 70%), linear-gradient(180deg, #eef0ec, #d9ddd9);`,
    panel: `background: rgba(248, 249, 246, .94); border: 0; border-radius: 0; box-shadow: inset 0 0 0 1px rgba(29, 31, 30, .12), 0 .04rem .2rem rgba(20, 24, 22, .12);`,
    btn: `border-radius: 0; letter-spacing: .1em;`,
    primary: `background: #1d1f1e; color: #f7f3ee; border-color: #1d1f1e;`,
    extra: heads('f-yan', {
      label: `color: #151716; letter-spacing: .3em; padding-left: .2rem; background: linear-gradient(#a92d2a, #a92d2a) left center / .12rem .12rem no-repeat;`,
      title: `letter-spacing: .3em;`,
    }) + `\n${S('f-yan')} .mode-card.is-selected { border-color: #1d1f1e; box-shadow: inset 0 0 0 1px #1d1f1e, inset .06rem 0 0 #a92d2a; }`,
  },
  {
    id: 'f-laterano', name: '라테라노', group: 'faction', light: true,
    // 공상의 정원: white cathedral haze, thin double frames in blue-grey, a slate section bar "01 | title" with a cyan end tab
    p: { bg: ['#eceff2', '#f6f7f8', '#fbfcfc', '#dfe5ea', '#cad5dd'], line: ['#cfd8de', '#9fb0bc', '#6f8291'], accent: '#3d8fae', glow: '#3ec6e0', accent2: '#6f8291', text: ['#1f262c', '#3b454e', '#5b6670', '#6d7882'], onAccent: '#ffffff' },
    body: `background-color: var(--bg-0);
  background-image: radial-gradient(60% 40% at 50% -5%, rgba(255, 255, 255, .95), transparent 70%), radial-gradient(40% 30% at 90% 80%, rgba(202, 215, 223, .55), transparent 70%), linear-gradient(180deg, #f3f5f7, #e2e8ec);`,
    panel: `background: rgba(251, 252, 252, .95); border: 1px solid #cfd8de; border-radius: 0; box-shadow: inset 0 0 0 3px #fbfcfc, inset 0 0 0 4px #dfe5ea, 0 .04rem .18rem rgba(60, 80, 95, .1);`,
    btn: `border-radius: 0;`,
    primary: `background: linear-gradient(90deg, #6f8291, #5a6c7a); color: #ffffff; border-color: #4f606d;`,
    extra: heads('f-laterano', {
      label: `color: #ffffff; padding: .02rem .14rem; background: linear-gradient(90deg, #3ec6e0 0 .08rem, #7a8c9a .08rem); letter-spacing: .1em;`,
      title: `color: #2a343c;`,
    }),
  },
  {
    id: 'f-ursus', name: '우르수스', group: 'faction',
    // 사람들, 우리들: black concrete, blood-red ribbon labels, red barbed-wire hairlines, grey bevelled photo frames
    p: { bg: ['#141417', '#1b1a1e', '#222125', '#2b292d', '#353236'], line: ['#3a3639', '#5a5558', '#847b78'], accent: '#b3242c', glow: '#d23a3f', accent2: '#d2ccc7', text: ['#eeeae6', '#cfc8c3', '#9d9591', '#7a7370'], onAccent: '#ffffff' },
    body: `background-color: var(--bg-0);
  background-image: radial-gradient(60% 45% at 15% 10%, rgba(120, 20, 26, .18), transparent 70%), radial-gradient(80% 60% at 90% 100%, rgba(80, 76, 80, .22), transparent 70%), linear-gradient(180deg, #19181c, #0f0f12);`,
    panel: `background: linear-gradient(180deg, rgba(34, 33, 37, .94), rgba(22, 21, 25, .96)); border: 1px solid #5a5558; border-radius: 0; box-shadow: inset 0 0 0 1px #141417, inset 0 0 0 2px rgba(132, 123, 120, .35), 0 .06rem .3rem rgba(0, 0, 0, .55);`,
    btn: `border-radius: 0;`,
    primary: `background: linear-gradient(180deg, #b3242c, #8a1a20); color: #ffffff; border-color: #5e1015;`,
    extra: heads('f-ursus', {
      label: `color: #ffffff; padding: .02rem .14rem; background: #8f1d22; box-shadow: .04rem .04rem 0 #3a0c0e; letter-spacing: .08em;`,
      title: `letter-spacing: .06em;`,
    }) + `\n${S('f-ursus')} :is(.panel, .modal__box)::after { content: ''; position: absolute; left: .12rem; right: .12rem; top: 0; height: 2px; background: repeating-linear-gradient(90deg, #b3242c 0 .1rem, transparent .1rem .14rem, #b3242c .14rem .16rem, transparent .16rem .26rem); pointer-events: none; }`,
  },
  {
    id: 'f-victoria', name: '빅토리아', group: 'faction',
    // 위대한 서곡의 끝: soot-brown dark, warm gold frames with a soft bloom, gold gradient headings, a cross-star divider
    p: { bg: ['#120806', '#1b0f0a', '#241610', '#2f1f16', '#3b291d'], line: ['#3f2c1f', '#6b4c2e', '#a07a48'], accent: '#d6a64a', glow: '#f0c870', accent2: '#99866d', text: ['#f6ead4', '#d9c7a8', '#a8957a', '#857561'], onAccent: '#1d1206' },
    body: `background-color: var(--bg-0);
  background-image: radial-gradient(55% 40% at 50% 0%, rgba(214, 166, 74, .16), transparent 70%), repeating-linear-gradient(90deg, rgba(255, 220, 160, .015) 0 1px, transparent 1px 6px), linear-gradient(180deg, #1a0d08, #0d0604);`,
    panel: `background: linear-gradient(180deg, rgba(36, 22, 16, .94), rgba(22, 12, 8, .96)); border: 1px solid #a07a48; border-radius: 0; box-shadow: inset 0 0 0 2px rgba(0, 0, 0, .6), inset 0 0 0 3px rgba(214, 166, 74, .28), 0 0 .2rem rgba(240, 200, 112, .14), 0 .08rem .3rem rgba(0, 0, 0, .6);`,
    btn: `border-radius: 0; letter-spacing: .06em;`,
    primary: `background: linear-gradient(180deg, #e8be62, #b8863a); color: #1d1206; border-color: #f0c870;`,
    extra: heads('f-victoria', {
      label: `color: #f0c870; letter-spacing: .14em;`,
      title: `color: #f6e0a8; text-shadow: 0 0 .08rem rgba(214, 166, 74, .45);`,
    }),
  },
  {
    id: 'f-siracusa', name: '시라쿠사', group: 'faction',
    // 시라쿠사인 — the families' back streets: soot-dark brick under one street lamp, black lacquer and Art Deco gilt,
    // wine-red name plates, casino chips, pinned case files
    p: { bg: ['#121214', '#19191b', '#212023', '#2a292c', '#353337'], line: ['#38343a', '#5e5040', '#c8a25a'], accent: '#c8a25a', glow: '#e8c37a', accent2: '#8e1b22', text: ['#efe8da', '#d2c9b8', '#a1988a', '#7f776c'], onAccent: '#18120a' },
    body: `background-color: #141315;
  background-image: radial-gradient(40% 55% at 16% 0%, rgba(240, 180, 100, .32), transparent 70%), radial-gradient(120% 90% at 50% 50%, transparent 40%, rgba(0, 0, 0, .7)),
    linear-gradient(#0d0c0d 2px, transparent 2px), linear-gradient(90deg, #0d0c0d 2px, transparent 2px), linear-gradient(90deg, #0d0c0d 2px, transparent 2px),
    linear-gradient(#3a2420, #3a2420);
  background-size: 100% 100%, 100% 100%, .5rem .2rem, .5rem .4rem, .5rem .4rem, 100% 100%;
  background-position: 0 0, 0 0, 0 0, 0 0, .25rem .2rem, 0 0;`,
    panel: `background: rgba(22, 22, 24, .97); border: 1px solid #5e5040; border-radius: 0;`,
    btn: `border-radius: 0;`,
    primary: `background: #8e1b22; color: #efe8da; border-color: #c8a25a;`,
    extra: '',
  },
  {
    id: 'f-aegir', name: '에기르', group: 'faction',
    // 삶의 길: abyssal slate-teal, cyan-glow frames, a teal header bar that fades out at both ends, thin ornament rules
    p: { bg: ['#101418', '#161c21', '#1c252b', '#232e35', '#2c3a42'], line: ['#26353c', '#2f6f72', '#4fa9ab'], accent: '#5fd3d0', glow: '#8ff0ec', accent2: '#a5abba', text: ['#e8f2f3', '#c3d2d5', '#8fa2a8', '#708389'], onAccent: '#06191a' },
    body: `background-color: var(--bg-0);
  background-image: radial-gradient(60% 40% at 50% 0%, rgba(95, 211, 208, .12), transparent 70%), radial-gradient(70% 50% at 50% 110%, rgba(54, 72, 113, .3), transparent 70%), linear-gradient(180deg, #141a1f, #0b0e11);`,
    panel: `background: linear-gradient(180deg, rgba(28, 37, 43, .92), rgba(16, 20, 24, .95)); border: 1px solid #2f6f72; border-radius: 0; box-shadow: inset 0 0 .2rem rgba(95, 211, 208, .1), 0 0 .14rem rgba(95, 211, 208, .12);`,
    btn: `border-radius: 0;`,
    primary: `background: linear-gradient(180deg, #4fbdbb, #2f8f8d); color: #06191a; border-color: #8ff0ec;`,
    extra: heads('f-aegir', {
      label: `color: #e8f2f3; padding: .02rem .2rem; background: linear-gradient(90deg, transparent, rgba(47, 143, 141, .75) 20% 80%, transparent); letter-spacing: .12em;`,
      title: `text-shadow: 0 0 .1rem rgba(95, 211, 208, .45);`,
    }),
  },
  {
    id: 'f-kazimierz', name: '카시미어', group: 'faction',
    // 니어 라이트: silver-grey broadcast set, navy screens with blue / red frames, slanted navy-white-red tricolour bars
    p: { bg: ['#1c1e26', '#23262f', '#2b2f3a', '#343947', '#3f4555'], line: ['#3a4152', '#56607a', '#8892aa'], accent: '#d02b3a', glow: '#ef4a58', accent2: '#3257a7', text: ['#f2f3f6', '#cfd3dc', '#9aa1b0', '#79808f'], onAccent: '#ffffff' },
    body: `background-color: var(--bg-0);
  background-image: linear-gradient(160deg, rgba(220, 220, 226, .14), transparent 40%), linear-gradient(115deg, transparent 0 74%, rgba(50, 87, 167, .32) 74% 77%, rgba(255, 255, 255, .14) 77% 78%, rgba(208, 43, 58, .32) 78% 81%, transparent 81%), linear-gradient(180deg, #2a2d36, #15171d);`,
    panel: `background: linear-gradient(180deg, rgba(20, 26, 48, .94), rgba(12, 15, 28, .96)); border: 1px solid #3257a7; border-radius: 0; box-shadow: inset 0 0 0 1px rgba(208, 43, 58, .35), 0 .06rem .26rem rgba(0, 0, 0, .5);`,
    btn: `border-radius: 0; font-weight: 800;`,
    primary: `background: linear-gradient(115deg, #1b2f6e 0 60%, #d02b3a 60%); color: #ffffff; border-color: #0f1d48;`,
    extra: heads('f-kazimierz', {
      label: `color: #ffffff; padding: .02rem .16rem .02rem .3rem; background: linear-gradient(115deg, #1b2f6e 0 .1rem, #ffffff .1rem .13rem, #d02b3a .13rem .2rem, transparent .2rem), #2b3550; letter-spacing: .06em;`,
      title: `font-weight: 900; letter-spacing: .02em;`,
    }),
  },
  {
    id: 'f-leithanien', name: '라이타니엔', group: 'faction',
    // 츠빌링슈튀르메의 가을 — the Gothic capital and its orchestras: soot black and oxblood, lancet-arch tracery and organ
    // pipes, antique-gold hairlines, a five-line staff with a clef under every heading
    p: { bg: ['#130a0c', '#1b1013', '#241619', '#2e1d21', '#3a262a'], line: ['#3a2629', '#6a4a36', '#c9a35a'], accent: '#c9a35a', glow: '#e6c784', accent2: '#7a1f2b', text: ['#f3e9da', '#d8c8b2', '#a8977f', '#857664'], onAccent: '#1a0f08' },
    body: `background-color: var(--bg-0);
  background-image: ${LANCET}, repeating-linear-gradient(90deg, rgba(201, 163, 90, .035) 0 .04rem, transparent .04rem .22rem);
  background-size: .9rem 1.4rem, 100% 100%;`,
    panel: `background: rgba(27, 16, 19, .96); border: 1px solid #6a4a36; border-radius: 0;`,
    btn: `border-radius: 0;`,
    primary: `background: #7a1f2b; color: #f3e9da; border-color: #c9a35a;`,
    extra: '',
  },
  // ---- 사이드 스토리 ---------------------------------------------------------------------------------------------------
  {
    id: 'ss-adele', name: '화산의 꿈 여행', group: 'side', light: true,
    // So Long, Adele: a rose sunset over the Siesta volcano — pink sky, drifting clouds and wool-sheep fleece, the gold
    // Adele script, rose-red ribbons
    p: { bg: ['#f8e1e5', '#fdf0f2', '#fff8f9', '#f2d3d9', '#e8c0c8'], line: ['#eccad1', '#d8a2ae', '#b0707e'], accent: '#d34a62', glow: '#e66a80', accent2: '#f2b53a', text: ['#3a1f26', '#5a3a42', '#7a5a62', '#86666e'], onAccent: '#ffffff' },
    body: `background-color: var(--bg-0);
  background-image: radial-gradient(30% 14% at 20% 18%, rgba(255, 255, 255, .8), transparent 70%), radial-gradient(26% 12% at 78% 30%, rgba(255, 255, 255, .7), transparent 70%), radial-gradient(34% 16% at 55% 82%, rgba(255, 255, 255, .6), transparent 70%), radial-gradient(80% 60% at 50% 0%, rgba(232, 140, 160, .35), transparent 75%);`,
    panel: `background: #fff8f9; border-radius: .1rem;`,
    btn: `border-radius: 99px;`,
    primary: `background: #d34a62; color: #ffffff; border-color: #b83a52;`,
    extra: '',
  },
  {
    id: 'ss-vultures', name: '부정축재', group: 'side',
    // gunmetal-teal night, dark plates with a lime-yellow underline bar and "#01" counters, a red corner tick
    p: { bg: ['#0f1417', '#141c1e', '#1a2427', '#212d31', '#2a383d'], line: ['#26343a', '#3c4d53', '#5f7378'], accent: '#d4d93a', glow: '#eef05a', accent2: '#c0282e', text: ['#eef1ef', '#c8cfcd', '#95a09d', '#76807e'], onAccent: '#141605' },
    body: `background-color: var(--bg-0);
  background-image: repeating-linear-gradient(135deg, rgba(212, 217, 58, .025) 0 .06rem, transparent .06rem .2rem), radial-gradient(60% 45% at 85% 0%, rgba(46, 210, 197, .1), transparent 70%), linear-gradient(180deg, #131b1e, #0a0e10);`,
    panel: `background: linear-gradient(180deg, rgba(26, 40, 45, .94), rgba(15, 20, 23, .96)); border: 1px solid #3c4d53; border-radius: 0; box-shadow: inset 0 -2px 0 rgba(212, 217, 58, .5), 0 .06rem .26rem rgba(0, 0, 0, .5);`,
    btn: `border-radius: 0;`,
    primary: `background: #d4d93a; color: #141605; border-color: #eef05a;`,
    extra: heads('ss-vultures', {
      label: `color: #eef1ef; padding: .02rem .12rem; background: linear-gradient(#d4d93a, #d4d93a) bottom / 100% 3px no-repeat, #1f2b2f; letter-spacing: .06em;`,
      title: `letter-spacing: .04em;`,
    }),
  },
  {
    id: 'ss-lonetrail', name: '론 트레일', group: 'side', light: true,
    // Rhine Lab Pioneer Project: the key art's charcoal halftone with three retro stripes (rust red, mustard, teal) and
    // the event's home theme — cream cards, signal orange, charcoal bars, orange circle icons, black geometric type
    p: { bg: ['#ece7de', '#f5f1ea', '#fbf9f5', '#e2dcd1', '#d3ccbf'], line: ['#d6cfc3', '#a59d91', '#3a3836'], accent: '#cf4f1c', glow: '#f07a42', accent2: '#5fa79a', text: ['#1d1b19', '#3a3734', '#5c5852', '#6b665f'], onAccent: '#ffffff' },
    body: `background-color: var(--bg-0);
  background-image: linear-gradient(90deg, transparent 0 calc(100% - .9rem), #a8402e calc(100% - .9rem) calc(100% - .66rem), #e3a23d calc(100% - .66rem) calc(100% - .42rem), #6fb0a3 calc(100% - .42rem) calc(100% - .18rem), transparent calc(100% - .18rem)),
    radial-gradient(circle, rgba(29, 27, 25, .09) 1px, transparent 1.6px), linear-gradient(180deg, #f1ece4, #e6e0d6);
  background-size: 100% 100%, 6px 6px, 100% 100%;`,
    panel: `background: rgba(251, 249, 245, .97); border: 1px solid #d6cfc3; border-radius: .04rem; box-shadow: 0 .03rem .14rem rgba(29, 27, 25, .1);`,
    btn: `border-radius: .04rem; font-weight: 700;`,
    primary: `background: #e8602c; color: #ffffff; border-color: #c94d1e;`,
    extra: '',
  },
  {
    id: 'ss-mendacium', name: '아테누스 복수록', group: 'side', light: true,
    // terracotta amphora pages: peach parchment, umber banner headers trimmed in orange, laurel-dot rules
    p: { bg: ['#ebc9aa', '#f2d9c1', '#f7e6d5', '#e2bc9a', '#d6ab86'], line: ['#d3ac88', '#a77e5a', '#7c5a3c'], accent: '#b4521f', glow: '#cf6a2e', accent2: '#42372e', text: ['#2a1e15', '#46362a', '#654f3f', '#735d4b'], onAccent: '#fff4ea' },
    body: `background-color: var(--bg-0);
  background-image: radial-gradient(circle, rgba(124, 90, 60, .12) 1px, transparent 1.5px), radial-gradient(70% 45% at 50% 0%, rgba(255, 240, 220, .45), transparent 70%), linear-gradient(180deg, #efd0b2, #e2bc9a);
  background-size: .18rem .18rem, 100% 100%, 100% 100%;`,
    panel: `background: rgba(247, 230, 213, .95); border: 1px solid #a77e5a; border-radius: 0; box-shadow: inset 0 0 0 2px #f7e6d5, inset 0 0 0 3px rgba(180, 82, 31, .35), 0 .04rem .16rem rgba(66, 55, 46, .16);`,
    btn: `border-radius: 0;`,
    primary: `background: linear-gradient(180deg, #c8622a, #a2461a); color: #fff4ea; border-color: #42372e;`,
    extra: heads('ss-mendacium', {
      label: `color: #fff4ea; padding: .02rem .16rem; background: #42372e; box-shadow: inset 0 0 0 1px #c8622a; letter-spacing: .08em;`,
      title: `color: #42372e;`,
    }),
  },
  {
    id: 'f-sargon', name: '사르곤', group: 'faction', light: true,
    // carnival race posters: white pages, sunflower-yellow plates, slanted blue-outlined yellow labels, orange chevrons
    p: { bg: ['#f6f6f8', '#fcfcfd', '#ffffff', '#ececef', '#dedee4'], line: ['#e6e3d2', '#f0c63a', '#c9a417'], accent: '#2f7fd0', glow: '#4b9be8', accent2: '#fcce46', text: ['#24241f', '#3d3d36', '#5c5c54', '#6b6b62'], onAccent: '#ffffff' },
    body: `background-color: var(--bg-0);
  background-image: linear-gradient(115deg, transparent 0 70%, rgba(252, 206, 70, .3) 70% 76%, transparent 76%), radial-gradient(60% 40% at 10% 0%, rgba(252, 206, 70, .18), transparent 70%), linear-gradient(180deg, #fbfbfc, #eeeef1);`,
    panel: `background: rgba(255, 255, 255, .97); border: 2px solid #fcce46; border-radius: .06rem; box-shadow: 0 .05rem 0 #e6b52a, 0 .06rem .2rem rgba(60, 50, 20, .12);`,
    btn: `border-radius: .04rem; font-weight: 800;`,
    primary: `background: linear-gradient(180deg, #fcd650, #f5b818); color: #24241f; border-color: #c9a417;`,
    extra: heads('f-sargon', {
      label: `color: #24241f; padding: .02rem .16rem; background: #fcce46; box-shadow: .03rem .03rem 0 #2f7fd0; transform: skewX(-8deg); letter-spacing: .04em;`,
      title: `font-weight: 900;`,
    }),
  },
  {
    id: 'ss-unrealized', name: '허락받지 못한 땅', group: 'side', light: true,
    // sky-high travel brochure: powder-blue sky with clouds, deep-teal banner headers, red bird marks, a compass star
    p: { bg: ['#c4e5ea', '#dcf0f3', '#eef8f9', '#b2dbe1', '#9dc6c8'], line: ['#a9d2d8', '#7aa9b0', '#2b525a'], accent: '#c4333a', glow: '#dd4a50', accent2: '#2b525a', text: ['#15292d', '#2b4549', '#4a6367', '#566f73'], onAccent: '#ffffff' },
    body: `background-color: var(--bg-0);
  background-image: radial-gradient(40% 18% at 20% 30%, rgba(255, 255, 255, .7), transparent 70%), radial-gradient(35% 15% at 75% 65%, rgba(255, 255, 255, .6), transparent 70%), linear-gradient(180deg, #b8e0e6, #dcf0f3);`,
    panel: `background: rgba(238, 248, 249, .95); border: 1px solid #7aa9b0; border-radius: 0; box-shadow: 0 .04rem .16rem rgba(43, 82, 90, .16);`,
    btn: `border-radius: 0;`,
    primary: `background: linear-gradient(180deg, #2f5d66, #22454c); color: #ffffff; border-color: #15292d;`,
    extra: heads('ss-unrealized', {
      label: `color: #ffffff; padding: .02rem .2rem; background: linear-gradient(90deg, transparent, #2b525a .14rem calc(100% - .14rem), transparent); letter-spacing: .08em;`,
      title: `color: #2b525a;`,
    }) + `\n${S('ss-unrealized')} .section-label::after { content: ' ⟡'; color: #c4333a; }`,
  },
  {
    id: 'ss-elegies', name: '불타버린 엘레지여', group: 'side',
    // midnight-indigo forest, antique-gold filigree frames, gold scroll headers "◆ title ◆", warm lamplight
    p: { bg: ['#0d1023', '#121733', '#181f42', '#202852', '#283163'], line: ['#28305a', '#4a4a6a', '#a39274'], accent: '#c9ae72', glow: '#e8cf92', accent2: '#2b387b', text: ['#f1ecdf', '#d0c8b4', '#9e977f', '#7e7863'], onAccent: '#14100a' },
    body: `background-color: var(--bg-0);
  background-image: radial-gradient(50% 40% at 50% 0%, rgba(201, 174, 114, .12), transparent 70%), radial-gradient(70% 50% at 50% 110%, rgba(43, 56, 123, .45), transparent 70%), linear-gradient(180deg, #121733, #0a0c1c);`,
    panel: `background: linear-gradient(180deg, rgba(24, 31, 66, .92), rgba(13, 16, 35, .95)); border: 1px solid #a39274; border-radius: 0; box-shadow: inset 0 0 0 2px rgba(13, 16, 35, .8), inset 0 0 0 3px rgba(201, 174, 114, .25), 0 .06rem .28rem rgba(0, 0, 0, .55);`,
    btn: `border-radius: 0;`,
    primary: `background: linear-gradient(180deg, #d8bd80, #a88d52); color: #14100a; border-color: #e8cf92;`,
    extra: heads('ss-elegies', {
      label: `color: #e8cf92; letter-spacing: .1em;`,
      title: `color: #f1ecdf;`,
    }) + `\n${S('ss-elegies')} .section-label::before { content: '◆ '; color: #c9ae72; font-size: .8em; }`,
  },
];

const L2 = (c) => ['top left', 'top right', 'bottom left', 'bottom right'].map((p) =>
  `linear-gradient(${c}, ${c}) ${p} / .14rem 2px no-repeat, linear-gradient(${c}, ${c}) ${p} / 2px .14rem no-repeat`).join(',\n    ');
const DIAMONDS = (c) => ['top left', 'top right', 'bottom left', 'bottom right'].map((p) =>
  `conic-gradient(from 45deg at 50% 50%, ${c} 0 90deg, transparent 90deg 360deg) ${p} / .12rem .12rem no-repeat`).join(',\n    ');

export const GUIDE_TEXTURES = {
  'f-kjerag': {
    radius: '0',
    face: 'linear-gradient(90deg, transparent, rgba(127, 151, 255, .5)) right center / .34rem 100% no-repeat',
    grain: 'radial-gradient(1px 1px at 30% 30%, rgba(255, 255, 255, .4), transparent 70%), radial-gradient(1px 1px at 70% 70%, rgba(255, 255, 255, .3), transparent 70%)',
    card: 'radial-gradient(55% 45% at 50% 0%, rgba(127, 151, 255, .35), transparent 70%), radial-gradient(1.5px 1.5px at 25% 35%, #fff, transparent 70%), radial-gradient(1px 1px at 65% 25%, #fff, transparent 70%)',
    stripe: 'linear-gradient(90deg, transparent, #e9eefc 20% 80%, transparent)',
    corner: L2('#e9eefc'), clip: 'none', sprite: 'hue-rotate(60deg) saturate(.9)',
  },
  'f-yan': {
    radius: '0',
    face: 'linear-gradient(100deg, transparent 20%, rgba(255, 255, 255, .3) 25% 35%, transparent 45%) right center / .34rem 100% no-repeat',
    grain: 'radial-gradient(50% 40% at 90% 10%, rgba(29, 31, 30, .05), transparent 70%)',
    card: 'radial-gradient(60% 45% at 85% 15%, rgba(29, 31, 30, .22), transparent 70%), radial-gradient(40% 30% at 10% 90%, rgba(169, 45, 42, .12), transparent 70%)',
    stripe: 'linear-gradient(90deg, #1d1f1e 0 70%, #a92d2a 70% calc(70% + .14rem), transparent calc(70% + .14rem))',
    corner: 'linear-gradient(#a92d2a, #a92d2a) bottom right / .1rem .1rem no-repeat', clip: 'none', sprite: 'grayscale(.6)',
  },
  'f-laterano': {
    radius: '0',
    face: 'linear-gradient(90deg, transparent, rgba(255, 255, 255, .45)) right center / .34rem 100% no-repeat',
    grain: 'radial-gradient(circle at 50% -10%, rgba(255, 255, 255, .6), transparent 45%)',
    card: 'radial-gradient(circle at 50% -20%, rgba(255, 255, 255, .5), transparent 50%), linear-gradient(90deg, rgba(62, 198, 224, .2) 0 .06rem, transparent .06rem)',
    stripe: 'linear-gradient(90deg, #3ec6e0 0 .14rem, #6f8291 .14rem)',
    corner: L2('#9fb0bc'), clip: 'none', sprite: 'saturate(.6)',
  },
  'f-ursus': {
    radius: '0',
    face: 'repeating-linear-gradient(90deg, rgba(0, 0, 0, .35) 0 3px, transparent 3px 7px) right center / .34rem 100% no-repeat',
    grain: 'radial-gradient(40% 30% at 10% 0%, rgba(179, 36, 44, .08), transparent 70%)',
    card: 'radial-gradient(60% 45% at 20% 0%, rgba(179, 36, 44, .24), transparent 70%), linear-gradient(180deg, rgba(132, 123, 120, .12), transparent 50%)',
    stripe: 'repeating-linear-gradient(90deg, #b3242c 0 .14rem, transparent .14rem .18rem)',
    corner: L2('#847b78'), clip: 'none', sprite: 'grayscale(.7) contrast(1.05)',
  },
  'f-victoria': {
    radius: '0',
    face: 'linear-gradient(90deg, transparent, rgba(255, 236, 190, .5)) right center / .34rem 100% no-repeat',
    grain: 'radial-gradient(50% 40% at 50% 0%, rgba(240, 200, 112, .07), transparent 70%)',
    card: 'radial-gradient(55% 45% at 50% 0%, rgba(214, 166, 74, .26), transparent 70%), repeating-linear-gradient(90deg, rgba(255, 220, 160, .03) 0 1px, transparent 1px 5px)',
    stripe: 'linear-gradient(90deg, transparent, #d6a64a 20% 80%, transparent)',
    corner: DIAMONDS('#d6a64a'), clip: 'none', sprite: 'sepia(.6) saturate(1.2)',
  },
  'f-siracusa': {
    radius: '0',
    face: 'linear-gradient(90deg, transparent, rgba(232, 195, 122, .45)) right center / .34rem 100% no-repeat',
    grain: 'linear-gradient(transparent calc(100% - 1px), rgba(200, 162, 90, .25) calc(100% - 1px))',
    card: 'radial-gradient(60% 70% at 20% 0%, rgba(224, 168, 90, .14), transparent 70%)',
    stripe: 'linear-gradient(90deg, #8e1b22 0 40%, #c8a25a 40% 42%, transparent 42%)',
    corner: 'none', clip: 'none', sprite: 'none',
  },
  'f-aegir': {
    radius: '0',
    face: 'linear-gradient(90deg, transparent, rgba(143, 240, 236, .5)) right center / .34rem 100% no-repeat',
    grain: 'radial-gradient(60% 30% at 50% 0%, rgba(95, 211, 208, .07), transparent 70%)',
    card: 'radial-gradient(60% 45% at 50% 0%, rgba(95, 211, 208, .22), transparent 70%), radial-gradient(60% 40% at 50% 110%, rgba(54, 72, 113, .4), transparent 70%)',
    stripe: 'linear-gradient(90deg, transparent, #4fa9ab 20% 80%, transparent)',
    corner: L2('#5fd3d0'), clip: 'none', sprite: 'hue-rotate(10deg) saturate(.9)',
  },
  'f-kazimierz': {
    radius: '0',
    face: 'linear-gradient(115deg, transparent 40%, #ffffff 40% 50%, transparent 50%) right center / .34rem 100% no-repeat',
    grain: 'linear-gradient(115deg, rgba(50, 87, 167, .1) 0 14%, transparent 14%)',
    card: 'linear-gradient(115deg, rgba(27, 47, 110, .5) 0 14%, rgba(255, 255, 255, .12) 14% 16%, rgba(208, 43, 58, .4) 16% 20%, transparent 20%), radial-gradient(60% 50% at 90% 10%, rgba(50, 87, 167, .25), transparent 70%)',
    stripe: 'linear-gradient(115deg, #1b2f6e 0 45%, #ffffff 45% 52%, #d02b3a 52%)',
    corner: 'none', clip: 'none', sprite: 'hue-rotate(150deg) saturate(1.2)',
  },
  'f-leithanien': {
    radius: '0',
    face: 'linear-gradient(90deg, transparent, rgba(230, 199, 132, .5)) right center / .34rem 100% no-repeat',
    grain: 'repeating-linear-gradient(90deg, rgba(201, 163, 90, .03) 0 .03rem, transparent .03rem .18rem)',
    card: 'repeating-linear-gradient(90deg, rgba(201, 163, 90, .06) 0 .04rem, transparent .04rem .2rem)',
    stripe: 'linear-gradient(90deg, transparent, #c9a35a 25% 75%, transparent)',
    corner: 'none', clip: 'none', sprite: 'none',
  },
  'ss-adele': {
    radius: '.1rem',
    face: 'radial-gradient(circle at 30% 50%, rgba(255, 255, 255, .7) 0 4px, transparent 5px) right center / .34rem 100% no-repeat',
    grain: 'radial-gradient(40% 30% at 20% 0%, rgba(255, 255, 255, .6), transparent 70%)',
    card: 'radial-gradient(30% 20% at 80% 15%, rgba(255, 255, 255, .8), transparent 70%), radial-gradient(60% 40% at 50% 100%, rgba(232, 140, 160, .25), transparent 70%)',
    stripe: 'linear-gradient(90deg, #d34a62 0 70%, #f2b53a 70%)',
    corner: 'none', clip: 'none', sprite: 'none',
  },
  'ss-vultures': {
    radius: '0',
    face: 'repeating-linear-gradient(-45deg, rgba(20, 22, 5, .5) 0 3px, transparent 3px 7px) right center / .34rem 100% no-repeat',
    grain: 'repeating-linear-gradient(135deg, rgba(212, 217, 58, .02) 0 .05rem, transparent .05rem .16rem)',
    card: 'linear-gradient(180deg, transparent 80%, rgba(212, 217, 58, .25) 80% 82%, transparent 82%), radial-gradient(60% 45% at 85% 0%, rgba(46, 210, 197, .14), transparent 70%)',
    stripe: 'linear-gradient(90deg, #d4d93a 0 70%, #c0282e 70% 74%, transparent 74%)',
    corner: 'linear-gradient(#c0282e, #c0282e) bottom left / .1rem .1rem no-repeat', clip: 'polygon(0 0, 100% 0, 100% 100%, .14rem 100%, 0 calc(100% - .14rem))', sprite: 'hue-rotate(30deg) saturate(.9)',
  },
  'ss-lonetrail': {
    radius: '.04rem',
    face: 'linear-gradient(90deg, #a8402e 0 33%, #e3a23d 33% 66%, #6fb0a3 66%) right center / .14rem 100% no-repeat',
    grain: 'radial-gradient(circle, rgba(29, 27, 25, .05) 1px, transparent 1.6px) 0 0 / 5px 5px',
    card: 'linear-gradient(90deg, transparent 0 calc(100% - .2rem), #a8402e calc(100% - .2rem) calc(100% - .14rem), #e3a23d calc(100% - .14rem) calc(100% - .08rem), #6fb0a3 calc(100% - .08rem) calc(100% - .02rem), transparent calc(100% - .02rem)), radial-gradient(circle, rgba(255, 255, 255, .08) 1px, transparent 1.6px) 0 0 / 5px 5px',
    stripe: 'linear-gradient(90deg, #a8402e 0 33%, #e3a23d 33% 66%, #6fb0a3 66%)',
    corner: 'none', clip: 'none', sprite: 'none',
  },
  'ss-mendacium': {
    radius: '0',
    face: 'linear-gradient(90deg, transparent, rgba(255, 240, 220, .45)) right center / .34rem 100% no-repeat',
    grain: 'radial-gradient(circle, rgba(124, 90, 60, .06) 1px, transparent 1.5px) 0 0 / .14rem .14rem',
    card: 'radial-gradient(60% 45% at 50% 0%, rgba(200, 98, 42, .22), transparent 70%), repeating-linear-gradient(90deg, rgba(66, 55, 46, .06) 0 .04rem, transparent .04rem .14rem)',
    stripe: 'linear-gradient(90deg, #42372e 0 15%, #c8622a 15% 85%, #42372e 85%)',
    corner: 'none', clip: 'none', sprite: 'sepia(.6) saturate(1.1)',
  },
  'f-sargon': {
    radius: '.06rem',
    face: 'repeating-linear-gradient(90deg, rgba(255, 255, 255, .6) 0 3px, transparent 3px 7px) right center / .34rem 100% no-repeat',
    grain: 'linear-gradient(115deg, rgba(252, 206, 70, .1) 0 10%, transparent 10%)',
    card: 'linear-gradient(115deg, rgba(252, 206, 70, .45) 0 12%, transparent 12% 14%, rgba(47, 127, 208, .3) 14% 16%, transparent 16%)',
    stripe: 'repeating-linear-gradient(115deg, #fcce46 0 .1rem, #24241f .1rem .2rem)',
    corner: 'none', clip: 'none', sprite: 'saturate(1.1)',
  },
  'ss-unrealized': {
    radius: '0',
    face: 'linear-gradient(90deg, transparent, rgba(255, 255, 255, .5)) right center / .34rem 100% no-repeat',
    grain: 'radial-gradient(40% 20% at 25% 20%, rgba(255, 255, 255, .5), transparent 70%)',
    card: 'radial-gradient(45% 22% at 30% 30%, rgba(255, 255, 255, .55), transparent 70%), radial-gradient(35% 18% at 75% 70%, rgba(255, 255, 255, .45), transparent 70%), linear-gradient(180deg, #a9d6dd, #d7eef1)',
    stripe: 'linear-gradient(90deg, transparent, #2b525a 15% 85%, transparent)',
    corner: 'none', clip: 'none', sprite: 'hue-rotate(-10deg) saturate(.9)',
  },
  'ss-elegies': {
    radius: '0',
    face: 'linear-gradient(90deg, transparent, rgba(232, 207, 146, .55)) right center / .34rem 100% no-repeat',
    grain: 'radial-gradient(50% 40% at 50% 0%, rgba(201, 174, 114, .06), transparent 70%)',
    card: 'radial-gradient(50% 40% at 50% 0%, rgba(201, 174, 114, .22), transparent 70%), radial-gradient(70% 50% at 50% 110%, rgba(43, 56, 123, .5), transparent 70%)',
    stripe: 'linear-gradient(90deg, transparent, #c9ae72 20% 80%, transparent)',
    corner: DIAMONDS('#c9ae72'), clip: 'none', sprite: 'sepia(.4) hue-rotate(190deg) saturate(.7)',
  },
};

const SERIF_KR = { q: 'family=Noto+Serif+KR:wght@600;700', family: "'Noto Serif KR'" };
const BRUSH = { q: 'family=Nanum+Myeongjo:wght@700;800', family: "'Nanum Myeongjo'" };
export const GUIDE_MAT = {
  'f-kjerag': { noise: { f: .9, o: 2, c: [220, 230, 255], a: .035 } },
  'f-yan': { noise: { f: .7, o: 4, c: [40, 46, 44], a: .06, size: '300px' }, font: BRUSH },
  'f-laterano': { noise: { f: 1.2, o: 2, c: [90, 108, 128], a: .025 }, font: SERIF_KR },
  'f-ursus': { noise: { f: .9, o: 5, c: [200, 195, 190], a: .07 } },
  'f-victoria': { noise: { f: .8, o: 3, c: [255, 220, 160], a: .035 }, font: SERIF_KR },
  'f-siracusa': { noise: { f: .9, o: 3, c: [255, 240, 220], a: .035 } },
  'f-aegir': { noise: { f: .6, o: 3, c: [95, 211, 208], a: .035 } },
  'f-kazimierz': { noise: { f: 1.1, o: 2, c: [255, 255, 255], a: .03 } },
  'f-leithanien': { noise: { f: .7, o: 3, c: [201, 163, 90], a: .03 } },
  'ss-adele': {},
  'ss-vultures': { noise: { f: 1, o: 3, c: [212, 217, 58], a: .03 } },
  'ss-lonetrail': {},
  'ss-mendacium': { noise: { f: .8, o: 4, c: [66, 55, 46], a: .06 }, font: SERIF_KR },
  'f-sargon': {},
  'ss-unrealized': { noise: { f: .5, o: 3, c: [255, 255, 255], a: .05 } },
  'ss-elegies': { noise: { f: .7, o: 3, c: [201, 174, 114], a: .035 }, font: SERIF_KR },
};

// ---- fonts: each theme's body (all text: --font-cjk) and display face (titles, buttons, labels: --font-display) ------
// Korean faces from Google Fonts, picked for the guide's tone; the body face always a readable text face.
const F = (q, body, display = body) => ({ q, body, display });
export const THEME_FONTS = {
  white: F('family=Noto+Sans+KR:wght@400;500;700', "'Noto Sans KR'"),
  space: F('family=Orbit&family=Noto+Sans+KR:wght@400;500;700', "'Noto Sans KR'", "'Orbit'"),
  rhine: F('family=IBM+Plex+Sans+KR:wght@400;500;700&family=IBM+Plex+Mono:wght@500', "'IBM Plex Sans KR'", "'IBM Plex Mono', 'IBM Plex Sans KR'"),
  cyber: F('family=Orbit&family=Nanum+Gothic+Coding:wght@400;700', "'Nanum Gothic Coding'", "'Orbit'"),
  'is-fungi': F('family=Gaegu:wght@700&family=Gowun+Dodum', "'Gowun Dodum'", "'Gaegu'"),
  'is-phantom': F('family=Cinzel:wght@700&family=Nanum+Myeongjo:wght@400;700;800', "'Nanum Myeongjo'", "'Cinzel', 'Nanum Myeongjo'"),
  'is-mizuki': F('family=Gowun+Dodum&family=Sunflower:wght@500;700', "'Gowun Dodum'", "'Sunflower'"),
  'is-frost': F('family=IBM+Plex+Sans+KR:wght@400;500;700', "'IBM Plex Sans KR'"),
  'is-sarkaz': F('family=Noto+Serif+KR:wght@400;600;800', "'Noto Serif KR'"),
  'is-sui': F('family=Gowun+Batang:wght@400;700&family=Song+Myung', "'Gowun Batang'", "'Song Myung'"),
  'is-blackflow': F('family=Hahmlet:wght@400;600;800', "'Hahmlet'"),
  'f-yan': F('family=Song+Myung&family=Gowun+Batang:wght@400;700', "'Gowun Batang'", "'Song Myung'"),
  'f-sargon': F('family=Jua&family=Gothic+A1:wght@400;600;800', "'Gothic A1'", "'Jua'"),
  'f-victoria': F('family=Hahmlet:wght@400;600;800', "'Hahmlet'"),
  'f-kjerag': F('family=IBM+Plex+Sans+KR:wght@400;500;700', "'IBM Plex Sans KR'"),
  'f-laterano': F('family=Gowun+Dodum&family=Noto+Serif+KR:wght@500;700', "'Gowun Dodum'", "'Noto Serif KR'"),
  'f-aegir': F('family=Orbit&family=IBM+Plex+Sans+KR:wght@400;500;700', "'IBM Plex Sans KR'", "'Orbit'"),
  'f-siracusa': F('family=Nanum+Myeongjo:wght@400;700;800&family=Noto+Serif+KR:wght@400;600', "'Noto Serif KR'", "'Nanum Myeongjo'"),
  'f-kazimierz': F('family=IBM+Plex+Sans+KR:wght@400;600;700', "'IBM Plex Sans KR'"),
  'f-ursus': F('family=Do+Hyeon&family=Nanum+Gothic:wght@400;700;800', "'Nanum Gothic'", "'Do Hyeon'"),
  'f-leithanien': F('family=Nanum+Myeongjo:wght@700;800&family=Gowun+Batang:wght@400;700', "'Gowun Batang'", "'Nanum Myeongjo'"),
  'ss-adele': F('family=Jua&family=Gowun+Dodum', "'Gowun Dodum'", "'Jua'"),
  'ss-vultures': F('family=Gothic+A1:wght@400;600;900&family=IBM+Plex+Sans+KR:wght@400;500', "'IBM Plex Sans KR'", "'Gothic A1'"),
  'ss-lonetrail': F('family=Lexend:wght@600;800&family=Gothic+A1:wght@400;600;800', "'Gothic A1'", "'Lexend', 'Gothic A1'"),
  'ss-mendacium': F('family=Diphylleia&family=Nanum+Myeongjo:wght@400;700', "'Nanum Myeongjo'", "'Diphylleia'"),
  'ss-unrealized': F('family=Sunflower:wght@500;700&family=Gowun+Dodum', "'Gowun Dodum'", "'Sunflower'"),
  'ss-elegies': F('family=Nanum+Myeongjo:wght@400;700;800&family=Noto+Serif+KR:wght@400;600', "'Noto Serif KR'", "'Nanum Myeongjo'"),
};

// the Latin face of each theme's small English labels (.micro: SOLO SIMULATION, MODE…), set with its Korean pair
const M = (q, family) => ({ q, family });
export const THEME_MICRO = {
  white: M('family=Rajdhani:wght@600', "'Rajdhani'"), space: M('family=Orbitron:wght@500', "'Orbitron'"),
  rhine: M('family=IBM+Plex+Mono:wght@500', "'IBM Plex Mono'"), cyber: M('family=Orbitron:wght@600', "'Orbitron'"),
  'is-fungi': M('family=Josefin+Slab:wght@600', "'Josefin Slab'"), 'is-phantom': M('family=Cinzel:wght@600', "'Cinzel'"),
  'is-mizuki': M('family=Quicksand:wght@600', "'Quicksand'"), 'is-frost': M('family=Exo+2:wght@600', "'Exo 2'"),
  'is-sarkaz': M('family=Marcellus+SC', "'Marcellus SC'"), 'is-sui': M('family=Cormorant+Garamond:wght@600', "'Cormorant Garamond'"),
  'is-blackflow': M('family=Cormorant+Garamond:wght@600', "'Cormorant Garamond'"),
  'f-yan': M('family=Noto+Serif:wght@600', "'Noto Serif'"), 'f-sargon': M('family=Fredoka:wght@600', "'Fredoka'"),
  'f-victoria': M('family=Cinzel:wght@600', "'Cinzel'"), 'f-kjerag': M('family=Rajdhani:wght@600', "'Rajdhani'"),
  'f-laterano': M('family=Cormorant+SC:wght@600', "'Cormorant SC'"), 'f-aegir': M('family=Exo+2:wght@600', "'Exo 2'"),
  'f-siracusa': M('family=Limelight', "'Limelight'"), 'f-kazimierz': M('family=Barlow+Condensed:wght@700', "'Barlow Condensed'"),
  'f-ursus': M('family=Oswald:wght@500', "'Oswald'"), 'f-leithanien': M('family=Cinzel:wght@600', "'Cinzel'"),
  'ss-adele': M('family=Fredoka:wght@600', "'Fredoka'"), 'ss-vultures': M('family=Saira+Condensed:wght@600', "'Saira Condensed'"),
  'ss-lonetrail': M('family=Lexend:wght@500', "'Lexend'"), 'ss-mendacium': M('family=Marcellus+SC', "'Marcellus SC'"),
  'ss-unrealized': M('family=Comfortaa:wght@700', "'Comfortaa'"), 'ss-elegies': M('family=Cinzel:wght@600', "'Cinzel'"),
};
