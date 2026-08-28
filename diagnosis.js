/** ============================================================
 *  Palm Manual Prototype v0.1
 *  diagnosis.js — モック診断ロジック
 * ============================================================
 *  v0.1では画像内容は解析しない。
 *  名前・画像ファイル名・サイズ等からシード(seed)を作り、
 *  そこから決定的に結果パターンを選ぶ。
 *  同じ入力なら比較的同じ結果が出る。
 * ============================================================ */

/** 取扱説明書の見出しキー（表示順） */
const MANUAL_KEYS = [
  '起動スイッチ',
  '得意な環境',
  'コミュニケーション仕様',
  'バグ発生条件',
  '再起動方法'
];

/**
 * 結果パターン。
 * type     : 分かりやすい名前
 * primary  : 第一属性 (WIND / PRISM / TIDE / ROOT / FORGE / VEIL)
 * secondary: 第二属性
 * title    : 固有愛称
 * traits   : 特徴 [{label, star}]  star: 1〜5
 * manual   : 取扱説明書5項目 (MANUAL_KEYS と対応)
 */
const RESULT_PATTERNS = [
  {
    type: 'WIND_PRISM',
    primary: 'WIND',
    secondary: 'PRISM',
    title: 'まだ見ぬ道の探索者',
    traits: [
      { label: '好奇心', star: 5 },
      { label: '想像力', star: 4 },
      { label: '適応力', star: 4 }
    ],
    manual: [
      '知らないものを見つけたとき',
      '自由に試せる場所',
      '結論より、面白い途中経過を共有すると喜びます',
      '選択肢を完全に塞がれること',
      '別ルートを一つ見つけること'
    ]
  },
  {
    type: 'ROOT_TIDE',
    primary: 'ROOT',
    secondary: 'TIDE',
    title: '静かな園丁',
    traits: [
      { label: '誠実さ', star: 5 },
      { label: '共感力', star: 4 },
      { label: '継続力', star: 4 }
    ],
    manual: [
      '誰かの成長を手伝うとき',
      'ゆっくり育てられる穏やかな場所',
      '穏やかで丁寧な言葉で接すると距離が縮まります',
      '急かされること・一方的な指示',
      '自分のペースを一度取り戻すこと'
    ]
  },
  {
    type: 'FORGE_WIND',
    primary: 'FORGE',
    secondary: 'WIND',
    title: '風を起こす開拓者',
    traits: [
      { label: '行動力', star: 5 },
      { label: '度胸', star: 4 },
      { label: '発想力', star: 4 }
    ],
    manual: [
      '新しいことを始めるとき',
      '挑戦を歓迎する場所',
      '「とにかくやってみよう」と前向きな言葉がよく伝わります',
      '退屈なルーティンに閉じ込められること',
      '小さな新しい冒険をひとつ始めること'
    ]
  },
  {
    type: 'VEIL_PRISM',
    primary: 'VEIL',
    secondary: 'PRISM',
    title: '夜を編む幻視者',
    traits: [
      { label: '洞察力', star: 5 },
      { label: '独創性', star: 4 },
      { label: '集中力', star: 4 }
    ],
    manual: [
      '静かに考え込んでいるとき',
      '一人になれる落ち着いた場所',
      '深い話やアイデアの議論で心が開きます',
      '急な中断・表面的な会話の連続',
      '一度静かな時間を確保すること'
    ]
  },
  {
    type: 'TIDE_WIND',
    primary: 'TIDE',
    secondary: 'WIND',
    title: '寄せて還す渡り鳥',
    traits: [
      { label: '共感力', star: 5 },
      { label: '適応力', star: 4 },
      { label: '好奇心', star: 4 }
    ],
    manual: [
      '誰かと気持ちを分かち合うとき',
      '人も場所も多様な環境',
      '感情に寄り添う言葉かけが喜ばれます',
      '否定や無視、閉ざされた空気',
      '大切な人と穏やかに話すこと'
    ]
  },
  {
    type: 'ROOT_FORGE',
    primary: 'ROOT',
    secondary: 'FORGE',
    title: '据わる火守',
    traits: [
      { label: '責任感', star: 5 },
      { label: '実行力', star: 4 },
      { label: '粘り強さ', star: 4 }
    ],
    manual: [
      '任されたことをやり遂げるとき',
      '結果を評価してくれる場所',
      '「頼りにしてる」と言葉で示すと力が湧きます',
      '約束や努力が無視されること',
      '達成済みの実績を数え直すこと'
    ]
  },
  {
    type: 'PRISM_ROOT',
    primary: 'PRISM',
    secondary: 'ROOT',
    title: '架け橋の樹',
    traits: [
      { label: '発想力', star: 5 },
      { label: '応用力', star: 4 },
      { label: '安定感', star: 4 }
    ],
    manual: [
      'バラバラなものを結びつけるとき',
      'アイデアを支えてくれる仲間のいる場所',
      '「それ、面白い」と反応があると深くつながります',
      'アイデアの否定・画一的な指示',
      '作りたいものを一度書き出すこと'
    ]
  },
  {
    type: 'FORGE_TIDE',
    primary: 'FORGE',
    secondary: 'TIDE',
    title: '熱を持つ波',
    traits: [
      { label: '情熱', star: 5 },
      { label: '感受性', star: 4 },
      { label: '行動力', star: 4 }
    ],
    manual: [
      '自分の思いを形にできるとき',
      '情熱を歓迎してくれる場所',
      '熱意をそのまま受け止めると一番輝きます',
      '熱中を冷まされる・急停止させられること',
      '好きなことに再び火をつけること'
    ]
  },
  {
    type: 'WIND_TIDE',
    primary: 'WIND',
    secondary: 'TIDE',
    title: '明け方の陽だまり',
    traits: [
      { label: '明朗さ', star: 5 },
      { label: '共感力', star: 4 },
      { label: '自由心', star: 4 }
    ],
    manual: [
      '気分が軽く、誰かを気遣えるとき',
      '明るく自由な雰囲気の場所',
      '飾らない明るい言葉が心地よいです',
      '暗い重たい空気に長く置かれること',
      '好きな景色や音楽で空気を入れ替えること'
    ]
  },
  {
    type: 'VEIL_FORGE',
    primary: 'VEIL',
    secondary: 'FORGE',
    title: '静火の伴走者',
    traits: [
      { label: '洞察力', star: 5 },
      { label: '決断力', star: 4 },
      { label: '胆力', star: 4 }
    ],
    manual: [
      'じっくり考えて行動に移すとき',
      '信頼関係のある落ち着いた場所',
      '本音を短い言葉で告げると信頼が深まります',
      '急かされて浅い決断を迫られること',
      '一度立ち止まり材料を整理すること'
    ]
  },
  {
    type: 'PRISM_FORGE',
    primary: 'PRISM',
    secondary: 'FORGE',
    title: '灯を掲げる創始者',
    traits: [
      { label: '独創性', star: 5 },
      { label: '推進力', star: 4 },
      { label: '先見性', star: 4 }
    ],
    manual: [
      '新しい価値を生み出せるとき',
      '自由な発想が通る場所',
      '「もっとこうしたら？」と提案されると喜びます',
      '「無理だ」と最初に断定されること',
      '未来の自分の姿を思い描くこと'
    ]
  },
  {
    type: 'TIDE_ROOT',
    primary: 'TIDE',
    secondary: 'ROOT',
    title: '潤いの庭守',
    traits: [
      { label: '思いやり', star: 5 },
      { label: '安定感', star: 4 },
      { label: '慎重さ', star: 4 }
    ],
    manual: [
      '大切な人を守れるとき',
      '安心できる馴染みの場所',
      '安心を届ける言動で最もうれしくなります',
      '信頼を裏切られたり急変したりすること',
      '「大丈夫」を実感できる身近な存在と過ごすこと'
    ]
  },
  {
    type: 'WIND_ROOT',
    primary: 'WIND',
    secondary: 'ROOT',
    title: '根を張る旅人',
    traits: [
      { label: '好奇心', star: 5 },
      { label: '誠実さ', star: 4 },
      { label: '持続力', star: 4 }
    ],
    manual: [
      '行動と育成の両方に手を出せるとき',
      '経験値が積める自由な場所',
      '新しい話と丁寧な言葉を両方歓迎します',
      '可能性が最初から制限されること',
      '行きたい場所を地図に書き出すこと'
    ]
  },
  {
    type: 'FORGE_PRISM',
    primary: 'FORGE',
    secondary: 'PRISM',
    title: '火花を散らす結晶',
    traits: [
      { label: '突破力', star: 5 },
      { label: '独創性', star: 4 },
      { label: '機敏さ', star: 4 }
    ],
    manual: [
      '壁をこじ開けて答えを出すとき',
      '刺激的で競争のある場所',
      '率直で鋭いやりとりが心地よいです',
      '停滞とマンネリ',
      '新しい刺激をひとつ取り入れること'
    ]
  },
  {
    type: 'VEIL_TIDE',
    primary: 'VEIL',
    secondary: 'TIDE',
    title: '深い凪',
    traits: [
      { label: '共感力', star: 5 },
      { label: '洞察力', star: 4 },
      { label: '静けさ', star: 4 }
    ],
    manual: [
      '静かに誰かを理解できるとき',
      '静かで落ち着いた場所',
      '沈黙を許し、ゆっくり話せる相手が安心です',
      '感情を急かされたり軽く扱われたりすること',
      '静かな場所で心の波を凪がすこと'
    ]
  },
  {
    type: 'ROOT_PRISM',
    primary: 'ROOT',
    secondary: 'PRISM',
    title: '実りを結ぶ器',
    traits: [
      { label: '創造性', star: 5 },
      { label: '安定感', star: 4 },
      { label: '調整力', star: 4 }
    ],
    manual: [
      '長く続けて形にするところまで行くとき',
      '育てたものをちゃんと受け取ってくれる場所',
      '「続けてきてよかった」と伝えると深く響きます',
      '成果が途中で無駄にされること',
      'これまで積んだものを振り返り直すこと'
    ]
  },
  {
    type: 'TIDE_FORGE',
    primary: 'TIDE',
    secondary: 'FORGE',
    title: '満ちる呼び水',
    traits: [
      { label: '鼓舞力', star: 5 },
      { label: '行動力', star: 4 },
      { label: '共感力', star: 4 }
    ],
    manual: [
      '誰かを動かせたとき',
      '感情と行動が両方肯定される場所',
      '熱意と気遣いの両方で伝えると響きます',
      '感情を無視されて走らされること',
      'やりたい理由を仲間と共有すること'
    ]
  },
  {
    type: 'WIND_VEIL',
    primary: 'WIND',
    secondary: 'VEIL',
    title: '白夜の吟遊者',
    traits: [
      { label: '想像力', star: 5 },
      { label: '自由心', star: 4 },
      { label: '深慮', star: 4 }
    ],
    manual: [
      '思いのまま世界に浸るとき',
      '自由でありながら静かな場所',
      '現実と空想の話の両方に寄り添うと喜びます',
      '妙に現実的で夢がない空気',
      '好きな物語や映像で世界を広げ直すこと'
    ]
  },
  {
    type: 'PRISM_TIDE',
    primary: 'PRISM',
    secondary: 'TIDE',
    title: '虹を映す水面',
    traits: [
      { label: '感受性', star: 5 },
      { label: '発想力', star: 4 },
      { label: '調和力', star: 4 }
    ],
    manual: [
      'アイデアと気持ちを結びつけるとき',
      '美しさを自然に感じられる場所',
      'センスを褒めると心がほどけます',
      '乱雑で騒がしいだけの環境',
      '好きなデザインや音楽に触れること'
    ]
  },
  {
    type: 'FORGE_VEIL',
    primary: 'FORGE',
    secondary: 'VEIL',
    title: '焔に沈む月',
    traits: [
      { label: '実行力', star: 5 },
      { label: '洞察力', star: 4 },
      { label: '集中力', star: 4 }
    ],
    manual: [
      '深く考えてから早く動くとき',
      '静かで深く、かつ熱が通る場所',
      '要点だけを鋭く伝える合うと通じ合えます',
      '浅い会話と八方ふさがり',
      '深めるテーマをひとつに絞ること'
    ]
  }
];

/**
 * 文字列から整数シードを作る (FNV-1a)
 */
function hashString(str) {
  let h = 0x811c9dc5;
  const s = String(str || '');
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i);
    h = (h >>> 0) * 0x01000193;
  }
  return h >>> 0;
}

/**
 * シードから決定的な擬似乱数列 (mulberry32)
 */
function mulberry32(seed) {
  let a = seed >>> 0;
  return function () {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/**
 * 入力からシードを組み立てる。
 * 同じ入力なら同じシード → 同じ結果。
 */
function buildSeed(input) {
  const parts = [
    input.name || '',
    input.leftFileName || '',
    input.rightFileName || '',
    's' + (input.leftSize || 0),
    's' + (input.rightSize || 0),
    'palm-manual-v1'
  ];
  return hashString(parts.join('|'));
}

/**
 * モック診断を実行する (v0.1: 画像解析はしない)
 * @param {object} input { name, leftFileName, leftSize, rightFileName, rightSize }
 * @returns 結果オブジェクト
 */
function diagnose(input) {
  const seed = buildSeed(input);
  const rng = mulberry32(seed);

  const idx = Math.floor(rng() * RESULT_PATTERNS.length) % RESULT_PATTERNS.length;
  const pattern = RESULT_PATTERNS[idx];

  const primary = PALM_TYPES[pattern.primary];
  const secondary = PALM_TYPES[pattern.secondary];

  return {
    seed: seed,
    pattern: pattern.type,
    name: String(input.name || '').trim(),
    primary: primary,
    secondary: secondary,
    title: pattern.title,
    traits: pattern.traits,
    manualKeys: MANUAL_KEYS,
    manual: pattern.manual
  };
}

/** 属性テーブル（UIやデバッグ用に公開） */
window.PalmDiagnosis = {
  diagnose,
  buildSeed,
  PALM_TYPES,
  TYPE_IDS,
  RESULT_PATTERNS,
  MANUAL_KEYS
};
