/**
 * Palm Manual v0.4 "Hand Observation" — PersonCore domain model.
 * HandObservation / HandFingerprint から連続値 rawPersonCore (0.00〜1.00) を算出し、
 * 最終表示用に ★1〜★5 (displayPersonCore) へ量子化します。
 */
(function (root, factory) {
  var api = factory();
  if (typeof module === 'object' && module.exports) module.exports = api;
  if (root) root.PalmPersonCore = api;
})(typeof globalThis !== 'undefined' ? globalThis : this, function () {
  'use strict';

  var AXIS_DEFINITIONS = [
    { id: 'core', label: '芯', category: 'direction', description: '自分の基準を保つ強さ' },
    { id: 'path', label: '道', category: 'direction', description: '進み方を組み替える強さ' },
    { id: 'curiosity', label: '好奇心', category: 'thinking', description: '未知へ手を伸ばす強さ' },
    { id: 'connection', label: 'つながり', category: 'thinking', description: '人や情報を結びつける強さ' },
    { id: 'depth', label: '深さ', category: 'thinking', description: 'ひとつを掘り下げる強さ' },
    { id: 'ignition', label: '初速', category: 'action', description: '動き始める速さ' },
    { id: 'persistence', label: '粘り', category: 'action', description: '続けて育てる強さ' },
    { id: 'sensor', label: 'センサー', category: 'sense', description: '小さな変化を受け取る強さ' }
  ];

  var CORE_AXIS_ORDER = [
    'core', 'path', 'curiosity', 'connection',
    'ignition', 'persistence', 'sensor', 'depth'
  ];

  var CATEGORIES = [
    { id: 'direction', label: '方向', axes: ['core', 'path'] },
    { id: 'thinking', label: '思考', axes: ['curiosity', 'connection', 'depth'] },
    { id: 'action', label: '行動', axes: ['ignition', 'persistence'] },
    { id: 'sense', label: '感覚', axes: ['sensor'] }
  ];

  var TYPE_IDS = ['WIND', 'PRISM', 'TIDE', 'ROOT', 'FORGE', 'VEIL'];

  var DEEP_KEYS = [
    { id: 'overview', label: 'あなたはこんな人' },
    { id: 'thinking', label: '考え方' },
    { id: 'action', label: '動き方' },
    { id: 'relations', label: '人との関わり' },
    { id: 'bug', label: 'バグが起きやすい時' },
    { id: 'restart', label: '再起動のヒント' },
    { id: 'misread', label: '誤解されやすいところ' },
    { id: 'hidden', label: '隠し機能' }
  ];

  function clamp(v, min, max) {
    return Math.max(min, Math.min(max, v));
  }

  function hashString(value) {
    var text = String(value || '');
    var hash = 0x811c9dc5;
    for (var i = 0; i < text.length; i += 1) {
      hash ^= text.charCodeAt(i);
      hash = Math.imul(hash, 0x01000193);
    }
    return hash >>> 0;
  }

  function normalizeInput(input) {
    var source = input || {};
    return {
      name: String(source.name || '').trim(),
      leftFileName: String(source.leftFileName || ''),
      leftSize: Number(source.leftSize) || 0,
      rightFileName: String(source.rightFileName || ''),
      rightSize: Number(source.rightSize) || 0,
      observation: source.observation || null
    };
  }

  function buildSeed(input) {
    var normalized = normalizeInput(input);
    var fpHash = '';
    if (normalized.observation && normalized.observation.fingerprint) {
      fpHash = normalized.observation.fingerprint.combinedHash || '';
    }
    return hashString([
      normalized.name,
      normalized.leftFileName,
      's' + normalized.leftSize,
      normalized.rightFileName,
      's' + normalized.rightSize,
      fpHash,
      'palm-manual-person-core-v04'
    ].join('|'));
  }

  function mulberry32(seed) {
    var state = seed >>> 0;
    return function () {
      state = (state + 0x6d2b79f5) | 0;
      var value = Math.imul(state ^ (state >>> 15), 1 | state);
      value = (value + Math.imul(value ^ (value >>> 7), 61 | value)) ^ value;
      return ((value ^ (value >>> 14)) >>> 0) / 4294967296;
    };
  }

  /** 0.00〜1.00 の連続値を ★1〜★5 の整数スコアへ量子化 */
  function quantizeScore(continuousValue) {
    var c = clamp(Number(continuousValue) || 0, 0, 1);
    if (c < 0.20) return 1;
    if (c < 0.40) return 2;
    if (c < 0.60) return 3;
    if (c < 0.80) return 4;
    return 5;
  }

  /**
   * HandObservationからSymbolic Mappingルールで連続値 PersonCore (rawPersonCore) を生成
   */
  function buildRawPersonCoreFromObservation(obs, seed) {
    var rng = mulberry32(seed);

    if (!obs || !obs.left || !obs.right) {
      // フォールバック: seed から連続値を生成
      var fallback = {};
      CORE_AXIS_ORDER.forEach(function (axis) {
        fallback[axis] = clamp(0.1 + rng() * 0.8, 0.05, 0.95);
      });
      return fallback;
    }

    var l = obs.left;
    var r = obs.right;
    var diff = obs.differences || {};

    var avgComplexity = (l.complexity + r.complexity) / 2;
    var avgEdgeDensity = (l.edgeDensity + r.edgeDensity) / 2;
    var avgOrientation = (l.orientationDiversity + r.orientationDiversity) / 2;
    var avgCenterDensity = (l.centerDensity + r.centerDensity) / 2;
    var avgOuterDensity = (l.outerEdgeDensity + r.outerEdgeDensity) / 2;

    var diffComp = diff.complexityDifference || Math.abs(l.complexity - r.complexity);
    var diffDens = diff.densityDifference || Math.abs(l.edgeDensity - r.edgeDensity);
    var diffOrient = diff.orientationDifference || Math.abs(l.orientationDiversity - r.orientationDiversity);

    // 微小Variation用 (±0.04)
    var varCore = (rng() - 0.5) * 0.08;
    var varPath = (rng() - 0.5) * 0.08;
    var varCur = (rng() - 0.5) * 0.08;
    var varConn = (rng() - 0.5) * 0.08;
    var varIgn = (rng() - 0.5) * 0.08;
    var varPers = (rng() - 0.5) * 0.08;
    var varSens = (rng() - 0.5) * 0.08;
    var varDep = (rng() - 0.5) * 0.08;

    // 象徴変換ルール（科学的性格診断ではなく、画像幾何構造から内面軸への変換）
    var raw = {
      core: clamp(0.25 + avgCenterDensity * 0.55 + (1 - diffComp) * 0.20 + varCore, 0.05, 0.95),
      path: clamp(0.20 + avgOrientation * 0.45 + diffOrient * 0.35 + varPath, 0.05, 0.95),
      curiosity: clamp(0.15 + avgOrientation * 0.40 + avgOuterDensity * 0.40 + varCur, 0.05, 0.95),
      connection: clamp(0.20 + avgComplexity * 0.45 + (1 - diffDens) * 0.30 + varConn, 0.05, 0.95),
      ignition: clamp(0.15 + l.verticalEdgeRatio * 0.40 + avgOuterDensity * 0.40 + varIgn, 0.05, 0.95),
      persistence: clamp(0.25 + l.horizontalEdgeRatio * 0.45 + (1 - diffOrient) * 0.30 + varPers, 0.05, 0.95),
      sensor: clamp(0.15 + avgEdgeDensity * 0.45 + diffDens * 0.35 + varSens, 0.05, 0.95),
      depth: clamp(0.20 + avgCenterDensity * 0.40 + avgComplexity * 0.40 + varDep, 0.05, 0.95)
    };

    return raw;
  }

  function generatePersonCore(seed, observation) {
    var raw = buildRawPersonCoreFromObservation(observation, seed);
    var display = {};
    CORE_AXIS_ORDER.forEach(function (axis) {
      display[axis] = quantizeScore(raw[axis]);
    });
    return {
      raw: raw,
      display: display
    };
  }

  function levelOf(value) {
    if (value <= 2) return 'low';
    if (value >= 4) return 'high';
    return 'mid';
  }

  function phrase(headline, text, tags) {
    return { headline: headline, text: text, tags: tags };
  }

  function corePath(a, b) {
    if (a === 'high' && b === 'high') return phrase('方向はぶれにくいが、行き方は増やし続ける', '譲れない目的を持ちながら、そこへ向かうルートは柔軟に選べます。', ['軸がある', '柔軟な進路']);
    if (a === 'high' && b === 'low') return phrase('決めた方向を、ひとつの道で進む', '自分の基準が明確です。納得した手順を大切にすると力を出しやすくなります。', ['一貫性', '一本道']);
    if (a === 'low' && b === 'high') return phrase('動きながら、自分の方向を見つける', '最初から答えを固定しません。いくつか試した先で、納得できる目的が見えてきます。', ['探索', '更新']);
    if (a === 'low' && b === 'low') return phrase('急いで決めず、足場から確かめる', '方向も方法も慎重に選びます。小さな確信ができると進みやすくなります。', ['慎重', '足場づくり']);
    return phrase('基準と進み方の釣り合いを取る', '状況に合わせて、守るものと変えるものを選べます。', ['調整', 'バランス']);
  }

  function curiosityPath(a, b) {
    if (a === 'high' && b === 'high') return phrase('気になるものを見つけるたび、道が増える', '未知への興味をすぐ次の選択肢へ変えられます。寄り道も大切な材料です。', ['探索', '選択肢']);
    if (a === 'high' && b === 'low') return phrase('ひとつの道で、新しい発見を集める', '進路は絞りながら、その中にある違いや面白さを見つけます。', ['集中探索', '発見']);
    if (a === 'low' && b === 'high') return phrase('必要に応じて、静かにルートを変える', '新しさだけを追いません。目的に合う道なら、落ち着いて切り替えられます。', ['実用的', '切り替え']);
    if (a === 'low' && b === 'low') return phrase('慣れた道を、確かめながら進む', '見通しの立つ方法で安心して力を使えます。変化には準備時間が役立ちます。', ['安定', '準備']);
    return phrase('興味と現実的な道筋を結ぶ', '面白さだけで終わらせず、今できる進み方へ落とし込めます。', ['実行可能性', '好奇心']);
  }

  function curiosityPersistence(a, b) {
    if (a === 'high' && b === 'high') return phrase('面白い問いを、答えが出るまで追いかける', '新しい入口を見つける力と、深く続ける力の両方があります。', ['探究', '継続']);
    if (a === 'high' && b === 'low') return phrase('多くを試し、手応えのあるものを選ぶ', '興味の入口は広めです。短い実験を重ねると、自分に合うテーマが見つかります。', ['試作', '選別']);
    if (a === 'low' && b === 'high') return phrase('選んだものを、静かに育て続ける', '話題の新しさより、積み重ねる価値を大切にします。', ['育成', '長期']);
    if (a === 'low' && b === 'low') return phrase('必要な分だけ試し、区切りよく終える', '関心や負担を見ながら、無理なく手を動かします。', ['省エネ', '区切り']);
    return phrase('興味の波を、続けられる形に整える', '気になる気持ちと持続できる量の間で、ちょうどよいペースを作れます。', ['ペース', '探究']);
  }

  function connectionDepth(a, b) {
    if (a === 'high' && b === 'high') return phrase('相手と深くつながり、背景まで理解する', '言葉の表面だけでなく、その人が大切にしている理由にも目を向けます。', ['対話', '理解']);
    if (a === 'high' && b === 'low') return phrase('軽やかにつながり、場を動かす', '多くの人と接点を作るのが得意です。短い会話から流れを生みます。', ['社交', '橋渡し']);
    if (a === 'low' && b === 'high') return phrase('少ない関係を、深く大切にする', '広く知り合うより、信頼できる相手やテーマに時間を使います。', ['少数精鋭', '信頼']);
    if (a === 'low' && b === 'low') return phrase('必要な距離を保ち、気楽に関わる', '関係を重くしすぎません。ひとりの時間も自然に守れます。', ['自立', '軽さ']);
    return phrase('相手に合わせて、距離と深さを選ぶ', '場面ごとに、広く話すか深く聞くかを切り替えられます。', ['距離感', '適応']);
  }

  function ignitionPersistence(a, b) {
    if (a === 'high' && b === 'high') return phrase('すぐ始めて、そのまま走り続ける', '初動の速さと継続力があります。休む場所を先に作ると安定します。', ['推進', '持続']);
    if (a === 'high' && b === 'low') return phrase('始めるのは速い。短い勝負で光る', '最初の一歩に迷いが少なく、試作や立ち上げで力を発揮します。', ['瞬発', '試作']);
    if (a === 'low' && b === 'high') return phrase('始動は慎重だが、一度始まると長く続く', '納得できるまで準備します。動き出した後は、簡単には手放しません。', ['熟考', '継続']);
    if (a === 'low' && b === 'low') return phrase('小さく始め、短い区切りで進む', '大きな勢いより、負担の少ない一歩が合います。終点が見えると動きやすくなります。', ['小刻み', '省エネ']);
    return phrase('始め時と続け方を、その都度選ぶ', '急ぐ場面と腰を据える場面を見分け、力の配分を変えられます。', ['配分', '調整']);
  }

  function coreSensor(a, b) {
    if (a === 'high' && b === 'high') return phrase('自分の軸を持ちながら、小さな変化も拾う', '周囲をよく感じ取りますが、最後は自分の基準で選べます。', ['感知', '自律']);
    if (a === 'high' && b === 'low') return phrase('周りに流されず、自分の基準で決める', '細かな空気より、はっきりした目的を頼りに動きます。', ['自律', '明快']);
    if (a === 'low' && b === 'high') return phrase('空気を受け取りながら、自分の答えを探す', '周囲の変化によく気づきます。静かな場所で気持ちを整理すると判断しやすくなります。', ['感受性', '整理']);
    if (a === 'low' && b === 'low') return phrase('決めつけず、目の前の事実から考える', '強い思い込みや空気に寄りかからず、必要な情報を集めて選びます。', ['中立', '確認']);
    return phrase('自分の感覚と周囲のサインを見比べる', '内側の基準と外から来る情報を、どちらも判断材料にできます。', ['比較', '判断']);
  }

  function curiosityConnection(a, b) {
    if (a === 'high' && b === 'high') return phrase('人との会話から、新しい世界を広げる', '知らない考えを歓迎し、別々の話題や人をつなげます。', ['交流', '発見']);
    if (a === 'high' && b === 'low') return phrase('ひとりでも、未知をどんどん探索する', '誰かの反応がなくても興味を育てられます。自分のペースの調査が得意です。', ['自走', '探索']);
    if (a === 'low' && b === 'high') return phrase('新しさより、身近な人とのつながりを育てる', '知識を増やすことより、今ある関係を丁寧に扱います。', ['関係', '安心']);
    if (a === 'low' && b === 'low') return phrase('自分の領域を守り、必要な時につながる', '広げすぎず、落ち着ける範囲で人や情報と関わります。', ['境界', '自立']);
    return phrase('面白さを、人と分かち合える形にする', '自分の興味を相手にも届く言葉へ変えられます。', ['共有', '翻訳']);
  }

  function ignitionDepth(a, b) {
    if (a === 'high' && b === 'high') return phrase('飛び込みながら、核心まで掘り進む', '動く速さと集中の深さがあります。重要なテーマへ一気に入れます。', ['没頭', '突破']);
    if (a === 'high' && b === 'low') return phrase('まず動いて、全体の形をつかむ', '考え込む前に試せます。短い経験から次の判断材料を集めます。', ['行動', '俯瞰']);
    if (a === 'low' && b === 'high') return phrase('深く考えてから、確かな一歩を出す', '準備中は静かでも、内側では理解を積み上げています。', ['熟考', '確実']);
    if (a === 'low' && b === 'low') return phrase('重く考えすぎず、動ける範囲から始める', '深い集中や勢いを前提にせず、日常へなじむ方法を選べます。', ['日常', '軽量']);
    return phrase('考える深さに合わせて、始める速さを変える', '大切なテーマは準備し、軽い試みはすぐ動くという切り替えができます。', ['切り替え', '判断']);
  }

  var COMBINATION_DEFINITIONS = [
    { id: 'core_path', axes: ['core', 'path'], resolve: corePath },
    { id: 'curiosity_path', axes: ['curiosity', 'path'], resolve: curiosityPath },
    { id: 'curiosity_persistence', axes: ['curiosity', 'persistence'], resolve: curiosityPersistence },
    { id: 'connection_depth', axes: ['connection', 'depth'], resolve: connectionDepth },
    { id: 'ignition_persistence', axes: ['ignition', 'persistence'], resolve: ignitionPersistence },
    { id: 'core_sensor', axes: ['core', 'sensor'], resolve: coreSensor },
    { id: 'curiosity_connection', axes: ['curiosity', 'connection'], resolve: curiosityConnection },
    { id: 'ignition_depth', axes: ['ignition', 'depth'], resolve: ignitionDepth }
  ];

  function interpretCombinations(coreDisplay) {
    return COMBINATION_DEFINITIONS.map(function (definition) {
      var firstLevel = levelOf(coreDisplay[definition.axes[0]]);
      var secondLevel = levelOf(coreDisplay[definition.axes[1]]);
      var copy = definition.resolve(firstLevel, secondLevel);
      return {
        id: definition.id,
        axes: definition.axes.slice(),
        levels: [firstLevel, secondLevel],
        values: [coreDisplay[definition.axes[0]], coreDisplay[definition.axes[1]]],
        headline: copy.headline,
        text: copy.text,
        tags: copy.tags
      };
    });
  }

  function calculateTypeScores(coreDisplay) {
    var scores = {
      WIND: coreDisplay.curiosity * 1.15 + coreDisplay.path + coreDisplay.ignition * 0.85,
      PRISM: coreDisplay.connection * 1.1 + coreDisplay.curiosity + coreDisplay.depth * 0.9,
      TIDE: coreDisplay.sensor * 1.7 + coreDisplay.connection * 0.7 + coreDisplay.depth * 0.6,
      ROOT: coreDisplay.core * 1.25 + coreDisplay.persistence * 1.35 + coreDisplay.sensor * 0.4,
      FORGE: coreDisplay.ignition * 1.2 + coreDisplay.persistence + coreDisplay.core * 0.8,
      VEIL: coreDisplay.depth * 1.2 + coreDisplay.sensor + coreDisplay.connection * 0.8
    };
    var ranking = TYPE_IDS.slice().sort(function (a, b) {
      if (scores[b] !== scores[a]) return scores[b] - scores[a];
      return TYPE_IDS.indexOf(a) - TYPE_IDS.indexOf(b);
    });
    return { scores: scores, ranking: ranking, primaryId: ranking[0], secondaryId: ranking[1] };
  }

  var TYPE_TITLES = {
    WIND: '道を増やす旅人', PRISM: '光を結ぶ案内人', TIDE: '気配を読む航海士',
    ROOT: '時間を育てる庭師', FORGE: '一歩を灯す鍛冶師', VEIL: '奥行きを探す観測者'
  };

  var TYPE_SUMMARIES = {
    WIND: '新しい道を見つける人です。変化を味方にしながら、自分らしい進み方を作ります。',
    PRISM: '人や考えをつなぐ人です。違うものの間に、まだ見えていない共通点を作ります。',
    TIDE: '小さな変化を受け取る人です。場の空気を感じ、無理のない流れを見つけます。',
    ROOT: '大切なものを育てる人です。急がず積み重ね、長く使える土台を作ります。',
    FORGE: '物事を前へ動かす人です。思いを行動へ変え、手応えのある形にします。',
    VEIL: '見えにくい奥行きを探す人です。表面で終わらず、意味や背景を丁寧に読みます。'
  };

  function axisLabel(id) {
    var match = AXIS_DEFINITIONS.find(function (axis) { return axis.id === id; });
    return match ? match.label : id;
  }

  function buildDeepCopy(coreDisplay, combinations, primaryId, secondaryId) {
    var byId = {};
    combinations.forEach(function (item) { byId[item.id] = item; });
    return {
      overview: TYPE_SUMMARIES[primaryId] + ' さらに' + TYPE_SUMMARIES[secondaryId],
      thinking: byId.curiosity_path.headline + '。' + byId.curiosity_persistence.text,
      action: byId.ignition_persistence.headline + '。' + byId.ignition_depth.text,
      relations: byId.connection_depth.headline + '。' + byId.curiosity_connection.text,
      bug: coreDisplay.sensor >= 4 ? '周囲の変化を受け取りすぎると、何を優先するか見失いやすくなります。情報を減らす時間が必要です。' : '目的や終わりが見えないまま動き続けると、力の使いどころが分からなくなります。小さな区切りが必要です。',
      restart: coreDisplay.persistence >= 4 ? 'やることをひとつに絞り、短い休憩の後で続きを再開してください。積み上げたものが、戻る場所になります。' : '五分で終わる一歩を決めてください。勢いではなく、再開しやすい小ささが助けになります。',
      misread: coreDisplay.ignition <= 2 ? '動き出すまでが静かなため、迷っているように見えることがあります。実際は、納得できる入口を探している時間です。' : '反応が速いため、考えずに動いているように見えることがあります。実際は、動きながら必要な情報を集めています。',
      hidden: '「' + axisLabel(CORE_AXIS_ORDER.slice().sort(function (a, b) { return coreDisplay[b] - coreDisplay[a]; })[0]) + '」の強さが、普段は別々に見える力をつなぎます。得意な場面だけでなく、困った時の戻り道としても使えます。'
    };
  }

  /**
   * 観察した画像特徴の日本語見出し（3〜5件）を生成
   */
  function buildObservationHighlights(obs) {
    if (!obs || !obs.left || !obs.right) return [];

    var highlights = [];
    var avgComplexity = (obs.left.complexity + obs.right.complexity) / 2;
    var avgOrientation = (obs.left.orientationDiversity + obs.right.orientationDiversity) / 2;
    var diff = obs.differences || {};

    // 1. 中央・全体のエッジ複雑さ
    if (avgComplexity > 0.6) {
      highlights.push({ label: '手のひらの線情報', value: '繊細で細やか' });
    } else if (avgComplexity < 0.3) {
      highlights.push({ label: '手のひらの線情報', value: '明快ですっきりとしている' });
    } else {
      highlights.push({ label: '手のひらの線情報', value: 'バランスよく整っている' });
    }

    // 2. 線の方向の広がり
    if (avgOrientation > 0.65) {
      highlights.push({ label: '線の方向のばらつき', value: '多方向へ伸びている' });
    } else {
      highlights.push({ label: '線の方向のばらつき', value: '一定の規則に沿っている' });
    }

    // 3. 左右差
    var diffComp = diff.complexityDifference || Math.abs(obs.left.complexity - obs.right.complexity);
    if (diffComp > 0.25) {
      highlights.push({ label: '左右の手の特徴差', value: '変化が大きい（左右で動きが異なる）' });
    } else if (diffComp < 0.1) {
      highlights.push({ label: '左右の手の特徴差', value: '極めて揃っている' });
    } else {
      highlights.push({ label: '左右の手の特徴差', value: 'ほどよく協調している' });
    }

    // 4. 領域密度（中央と周辺）
    var avgCenter = (obs.left.centerDensity + obs.right.centerDensity) / 2;
    if (avgCenter > 0.5) {
      highlights.push({ label: '中心部の密度', value: '中心軸に引き締まりがある' });
    } else {
      highlights.push({ label: '中心部の密度', value: 'ゆったりと広がっている' });
    }

    return highlights;
  }

  function buildResultData(input) {
    var normalized = normalizeInput(input);
    var seed = buildSeed(normalized);
    var generated = generatePersonCore(seed, normalized.observation);
    var rawCore = generated.raw;
    var displayCore = generated.display;

    var combinations = interpretCombinations(displayCore);
    var typeResult = calculateTypeScores(displayCore);
    var title = TYPE_TITLES[typeResult.primaryId] + ' × ' + TYPE_TITLES[typeResult.secondaryId];

    var highlights = buildObservationHighlights(normalized.observation);

    var qualityNote = null;
    if (normalized.observation && normalized.observation.left && normalized.observation.left.quality) {
      var q = normalized.observation.left.quality;
      if (q.status !== 'ok') {
        qualityNote = q.message;
      }
    }

    var howToRead = normalized.observation
      ? 'v0.4では、左右の手画像から読み取った線の密度、方向の広がり、中心軸の収まり、左右差などの画像特徴を、Palm Manual独自の象徴ルールでPersonCoreへ変換しています。本物の手相鑑定や医学的・科学的分析ではありません。'
      : 'v0.2/v0.3互換のモックシードをもとにPersonCoreを生成しています。手画像を入力するとより詳細な画像特徴が反映されます。';

    return {
      version: '0.4',
      seed: seed,
      name: normalized.name,
      rawPersonCore: rawCore,
      personCore: displayCore, // 既存ビュー互換（1〜5の整数値）
      observation: normalized.observation || null,
      observationHighlights: highlights,
      qualityNote: qualityNote,
      coreAxes: CORE_AXIS_ORDER.map(function (id) {
        var definition = AXIS_DEFINITIONS.find(function (axis) { return axis.id === id; });
        return {
          id: id,
          label: definition.label,
          category: definition.category,
          description: definition.description,
          value: displayCore[id],
          rawValue: rawCore[id]
        };
      }),
      categories: CATEGORIES.map(function (category) {
        return { id: category.id, label: category.label, axes: category.axes.slice() };
      }),
      combinations: combinations,
      typeScores: typeResult.scores,
      primary: { id: typeResult.primaryId },
      secondary: { id: typeResult.secondaryId },
      title: title,
      summary: TYPE_SUMMARIES[typeResult.primaryId],
      deepKeys: DEEP_KEYS,
      deep: buildDeepCopy(displayCore, combinations, typeResult.primaryId, typeResult.secondaryId),
      howToRead: howToRead
    };
  }

  return {
    AXIS_DEFINITIONS: AXIS_DEFINITIONS,
    CORE_AXIS_ORDER: CORE_AXIS_ORDER,
    CATEGORIES: CATEGORIES,
    COMBINATION_DEFINITIONS: COMBINATION_DEFINITIONS,
    TYPE_IDS: TYPE_IDS,
    DEEP_KEYS: DEEP_KEYS,
    hashString: hashString,
    buildSeed: buildSeed,
    quantizeScore: quantizeScore,
    buildRawPersonCoreFromObservation: buildRawPersonCoreFromObservation,
    generatePersonCore: generatePersonCore,
    interpretCombinations: interpretCombinations,
    calculateTypeScores: calculateTypeScores,
    buildResultData: buildResultData
  };
});
