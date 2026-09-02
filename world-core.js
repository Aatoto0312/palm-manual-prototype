/**
 * Palm Manual v0.3 — PersonCoreを世界表現へ翻訳する純粋関数群。
 * 写真入力は受け取らず、同じ診断結果から常に同じWorldSpecを返す。
 */
(function (root, factory) {
  var api = factory();
  if (typeof module === 'object' && module.exports) module.exports = api;
  if (root) root.PalmWorldCore = api;
})(typeof globalThis !== 'undefined' ? globalThis : this, function () {
  'use strict';

  var PROFILE_KEYS = [
    'openness', 'branching', 'destinationClarity', 'connectivity',
    'motion', 'persistence', 'sensitivity', 'depth', 'complexity',
    'warmth', 'mystery', 'socialDensity', 'natureUrbanBlend', 'verticality'
  ];

  var AFFINITIES = {
    WIND: {
      motif: ['風を受ける高台', '遠くへ続く雲の道', '軽い布の標'],
      palette: ['空色', '薄金'], material: '風と遠景'
    },
    PRISM: {
      motif: ['光を渡す橋', '色を映す結晶窓', '領域を結ぶ灯り'],
      palette: ['虹白', '淡い珊瑚'], material: '光と接続'
    },
    TIDE: {
      motif: ['静かな水路', '波紋の広場', '人の灯る岸辺'],
      palette: ['水青', '乳白'], material: '水と柔らかな境界'
    },
    ROOT: {
      motif: ['年輪の大樹', '緑に包まれた集落', '根が支える回廊'],
      palette: ['若葉色', '土の琥珀'], material: '森と積み重なり'
    },
    FORGE: {
      motif: ['火を運ぶ導管', '小さな工房群', '脈動する動力塔'],
      palette: ['灯火色', '鉄紺'], material: '熱と動力'
    },
    VEIL: {
      motif: ['霧に沈む庭', '月を映す深層窓', '静かな地下回廊'],
      palette: ['月白', '宵紫'], material: '霧と深層'
    }
  };

  var PROMPT_AFFINITIES = {
    WIND: { motif: 'wind-shaped highlands, distant cloudways', palette: 'sky blue and pale gold' },
    PRISM: { motif: 'luminous bridges, prismatic windows', palette: 'pearl white and soft coral' },
    TIDE: { motif: 'quiet waterways, rippling shores', palette: 'water blue and warm ivory' },
    ROOT: { motif: 'ancient trees, rooted green arcades', palette: 'leaf green and amber earth' },
    FORGE: { motif: 'glowing conduits, compact workshops', palette: 'ember orange and iron navy' },
    VEIL: { motif: 'moonlit mist, silent deep arcades', palette: 'moon white and twilight violet' }
  };

  function clamp(value) {
    return Math.max(0, Math.min(1, Math.round(value * 1000) / 1000));
  }

  function n(value) {
    return clamp((Number(value) - 1) / 4);
  }

  function mix() {
    var total = 0;
    for (var i = 0; i < arguments.length; i++) total += arguments[i];
    return clamp(total / arguments.length);
  }

  function buildVisualProfile(personCore) {
    var core = n(personCore.core);
    var path = n(personCore.path);
    var curiosity = n(personCore.curiosity);
    var connection = n(personCore.connection);
    var ignition = n(personCore.ignition);
    var persistence = n(personCore.persistence);
    var sensor = n(personCore.sensor);
    var depth = n(personCore.depth);

    return {
      openness: mix(curiosity, 1 - depth, 1 - core * 0.35),
      branching: mix(path, curiosity * 0.7, connection * 0.3),
      destinationClarity: mix(core, 1 - path * 0.25, persistence * 0.4),
      connectivity: mix(connection, path * 0.5),
      motion: mix(ignition, curiosity * 0.35, 1 - depth * 0.2),
      persistence: persistence,
      sensitivity: sensor,
      depth: depth,
      complexity: mix(path, curiosity, connection, sensor, depth),
      warmth: mix(connection, sensor * 0.45, ignition * 0.25),
      mystery: mix(depth, sensor * 0.45, 1 - core * 0.2),
      socialDensity: mix(connection, ignition * 0.35, persistence * 0.25),
      natureUrbanBlend: mix(connection, curiosity, 1 - core * 0.25),
      verticality: mix(depth, core * 0.55, persistence * 0.35)
    };
  }

  function level(value, low, middle, high) {
    if (value < 0.36) return low;
    if (value > 0.66) return high;
    return middle;
  }

  function selectProfileKey(profile, keys) {
    return keys.slice().sort(function (a, b) {
      return Math.abs(profile[b] - 0.5) - Math.abs(profile[a] - 0.5);
    })[0];
  }

  function describeFeature(key, value) {
    var descriptions = {
      openness: ['ひとつの場所を丁寧に味わう', '内と外がほどよく開く', '空と遠景が大きく広がる'],
      branching: ['一本の道が景色を貫く', '道が要所で選べる', '橋や水路がいくつも分岐する'],
      destinationClarity: ['複数の中心がゆるく共存する', '景色の中に目印がある', '遠くの光が世界の中心を示す'],
      connectivity: ['それぞれの領域が静かに独立する', '隣り合う場所が自然につながる', '離れた領域まで光と橋で結ばれる'],
      motion: ['朝靄のように時間がゆっくり流れる', '穏やかな流れが景色を動かす', '風と光跡が世界を駆け抜ける'],
      persistence: ['季節とともに軽やかに移ろう', '新旧の景色が同居する', '長い道と積層した歴史が残る'],
      sensitivity: ['大きな形と明快な輪郭で見せる', '形と細部のバランスを取る', '水面や草木の小さな変化まで映す'],
      depth: ['広い空の下で全体を見渡せる', '手前と奥がなだらかに続く', '地下・森・高低差が奥へ重なる'],
      complexity: ['少ない要素が美しく整う', '要素同士がほどよく響き合う', '発見できる場所が何層にも重なる'],
      warmth: ['涼しく澄んだ空気に包まれる', 'やわらかな灯りが点在する', '人の気配と温かな灯りが満ちる'],
      mystery: ['輪郭が明るく開かれている', '少しだけ霧が余白を残す', '月と霧が見えない奥行きを作る'],
      socialDensity: ['一人で歩ける静かな余白がある', '小さな集いの場所が点在する', '遠くの窓にも暮らしの灯りが見える'],
      natureUrbanBlend: ['一つの景観テーマを深く保つ', '自然と建物が隣り合う', '森・水・都市が境界なく混ざる'],
      verticality: ['水平線を中心に広がる', '丘と谷が緩やかに重なる', '塔・浮島・地下が上下へ伸びる']
    };
    return level(value, descriptions[key][0], descriptions[key][1], descriptions[key][2]);
  }

  function buildTitle(profile) {
    var first = level(profile.destinationClarity, '巡る', '灯る', '遥かな');
    var secondKey = selectProfileKey(profile, ['branching', 'depth', 'openness', 'connectivity']);
    var second = {
      branching: level(profile.branching, '一本道', '橋庭', '千路'),
      depth: level(profile.depth, '空原', '丘層', '深森'),
      openness: level(profile.openness, '静庭', '窓野', '天原'),
      connectivity: level(profile.connectivity, '離島', '回廊', '連環')
    }[secondKey];
    var ending = level(profile.mystery, 'の朝', 'の庭', 'の月');
    return first + second + ending;
  }

  function buildEnvironment(profile) {
    return {
      primaryBiome: level(profile.openness, '密度のある庭と森', '丘と水辺の境界', '広い空と草原'),
      secondaryBiome: level(profile.depth, '開けた湖畔', '谷と木立', '深い森と地下水路'),
      architecture: level(profile.natureUrbanBlend, '景色に溶ける小さな目印', '植物と石造りの回廊', '森と都市が組み合う積層建築'),
      sky: level(profile.mystery, '澄んだ大きな空', '薄雲が流れる空', '月と淡い霧の空'),
      lighting: level(profile.warmth, '涼しい拡散光', 'やわらかな斜光', '窓と道に灯る温かな光'),
      weather: level(profile.motion, '静かな朝靄', '穏やかな風', '流れる雲と強い風'),
      timeOfDay: level(profile.mystery, '朝', '夕暮れ前', '月の出る薄明')
    };
  }

  function buildComposition(profile) {
    return {
      focalPoint: level(profile.destinationClarity, '複数の小さな中心', '中景の灯る目印', '遠景の明確な光塔'),
      horizon: level(profile.openness, '建物と木々で囲まれた近い地平', '丘越しに見える地平', '画面を大きく横切る遠い地平線'),
      pathStructure: level(profile.branching, '一本の大きな道', '要所で分かれる道', '橋・階段・水路が分岐する道網'),
      depthLayers: level(profile.depth, '見渡せる三層', '手前・中景・遠景の四層', '地下から空まで続く六層'),
      density: level(profile.complexity, '余白を生かした低密度', '発見点を散らした中密度', '細部が重なる高密度'),
      movement: level(profile.motion, '静止に近い穏やかな構図', '水と雲がゆっくり導く構図', '風・光跡・流れが斜めに走る構図'),
      camera: level(profile.openness, 'eye-level intimate view', 'slightly elevated wide view', 'wide panoramic elevated view')
    };
  }

  function unique(items) {
    return items.filter(function (item, index) { return items.indexOf(item) === index; });
  }

  function buildReasoning(profile, combinations) {
    var sourceLabels = {
      core_path: '芯 × 道',
      curiosity_path: '好奇心 × 道',
      curiosity_persistence: '好奇心 × 粘り',
      connection_depth: 'つながり × 深さ',
      ignition_persistence: '初速 × 粘り',
      core_sensor: '芯 × センサー',
      curiosity_connection: '好奇心 × つながり',
      ignition_depth: '初速 × 深さ'
    };
    var effects = {
      core_path: '中心の見え方と、そこへ向かう道の本数に変換しました。',
      curiosity_path: '遠景の発見点と、そこへ寄り道できる経路に変換しました。',
      curiosity_persistence: '新しい景色と、長く育った場所が同居する構造にしました。',
      connection_depth: '奥の領域まで橋や光でつながる構造にしました。',
      ignition_persistence: '風や流れの速さと、道や建物が続く長さに変換しました。',
      core_sensor: '大きな中心軸と細かな灯りのバランスに変換しました。',
      curiosity_connection: '異なる環境が出会う場所と発見点に変換しました。',
      ignition_depth: '静けさや動きと、空間の高低差を組み合わせました。'
    };
    var ranked = (combinations || []).map(function (item, index) {
      var values = item.values || item.levels || [3, 3];
      return { item: item, index: index, score: values.reduce(function (sum, value) { return sum + Math.abs(Number(value) - 3); }, 0) };
    }).sort(function (a, b) { return b.score - a.score || a.index - b.index; });

    return ranked.slice(0, 3).map(function (entry) {
      var item = entry.item;
      return {
        source: item.label || sourceLabels[item.id] || item.id,
        interpretation: item.text || item.headline,
        visualEffect: effects[item.id] || describeFeature(selectProfileKey(profile, PROFILE_KEYS), profile[selectProfileKey(profile, PROFILE_KEYS)])
      };
    });
  }

  function buildImagePrompt(profile, primaryId, secondaryId) {
    var primary = PROMPT_AFFINITIES[primaryId] || PROMPT_AFFINITIES.WIND;
    var secondary = PROMPT_AFFINITIES[secondaryId] || PROMPT_AFFINITIES.VEIL;
    var environment = level(profile.openness,
      'an intimate enclosed garden and dense grove',
      'a boundary of rolling hills and calm water',
      'an expansive grassland beneath a vast sky');
    var depthEnvironment = level(profile.depth,
      'an open lakeside with a clear overview',
      'layered valleys and wooded slopes',
      'a deep forest joined to underground waterways');
    var architecture = level(profile.natureUrbanBlend,
      'a few simple landmarks integrated into one landscape theme',
      'plant-covered stone arcades',
      'layered architecture where forest, water, and city merge');
    var focalPoint = level(profile.destinationClarity,
      'several balanced minor focal points',
      'one softly illuminated landmark in the middle distance',
      'one unmistakable luminous tower on the far horizon');
    var paths = level(profile.branching,
      'one broad continuous path',
      'a main path with a few deliberate choices',
      'a branching network of bridges, stairs, and waterways');
    var layers = level(profile.depth,
      'three open readable depth layers',
      'four gradual foreground-to-horizon layers',
      'six vertical layers spanning underground space to floating heights');
    var density = level(profile.complexity,
      'low density with generous negative space and bold silhouettes',
      'medium density with several quiet discovery points',
      'rich layered density with many coherent discoveries');
    var movement = level(profile.motion,
      'still air and a meditative composition',
      'gentle currents in water and clouds',
      'dynamic diagonal wind, flowing light trails, and moving clouds');
    var detail = level(profile.sensitivity,
      'large clean shapes and strong silhouettes',
      'balanced silhouettes and fine surface detail',
      'delicate lights, water reflections, foliage, and atmospheric detail');
    return [
      'A symbolic inner-world landscape, no character portrait.',
      'Environment: ' + environment + '; ' + depthEnvironment + '; ' + architecture + '.',
      'Composition: ' + focalPoint + '; ' + paths + '; ' + layers + '; ' + density + '; ' + movement + '.',
      'Motifs: ' + primary.motif + '; ' + secondary.motif + '; ' + detail + '.',
      'Atmosphere: ' + level(profile.mystery, 'clear and open', 'gentle and slightly mysterious', 'quiet, layered, and misty') + ', ' + level(profile.warmth, 'cool calm air', 'soft welcoming air', 'warm inhabited glow') + '.',
      'Lighting: ' + level(profile.warmth, 'cool diffused morning light', 'soft angled late-afternoon light', 'warm lights along windows and paths') + '.',
      'Camera: ' + level(profile.openness, 'eye-level intimate view', 'slightly elevated wide view', 'wide panoramic elevated view') + ', vertical mobile card composition, strong readable silhouette.',
      'Palette: ' + primary.palette + '; ' + secondary.palette + '; ' + (profile.warmth > 0.58 ? 'warm luminous gold' : 'soft mist white') + '.',
      'Constraints: no text, no letters, no labels, no UI, no palm photo, no hands, no photorealistic person; express only the specified environment and composition.'
    ].join(' ');
  }

  function buildWorldSpec(visualProfile, primaryId, secondaryId, combinations) {
    var primary = AFFINITIES[primaryId] || AFFINITIES.WIND;
    var secondary = AFFINITIES[secondaryId] || AFFINITIES.VEIL;
    var environment = buildEnvironment(visualProfile);
    var composition = buildComposition(visualProfile);
    var motifs = unique([
      primary.motif[level(visualProfile.motion, 0, 1, 2)],
      secondary.motif[level(visualProfile.depth, 0, 1, 2)],
      describeFeature(selectProfileKey(visualProfile, ['branching', 'connectivity', 'persistence', 'sensitivity']), visualProfile[selectProfileKey(visualProfile, ['branching', 'connectivity', 'persistence', 'sensitivity'])])
    ]);
    var palette = unique([primary.palette[0], secondary.palette[0], visualProfile.warmth > 0.58 ? '灯りの金' : '霧の白']);
    var reasoning = buildReasoning(visualProfile, combinations);
    var title = buildTitle(visualProfile);
    var tagline = describeFeature(selectProfileKey(visualProfile, ['destinationClarity', 'branching', 'openness', 'depth']), visualProfile[selectProfileKey(visualProfile, ['destinationClarity', 'branching', 'openness', 'depth'])]);
    var summary = describeFeature('openness', visualProfile.openness) + '世界です。' + describeFeature('branching', visualProfile.branching) + '。' + describeFeature('depth', visualProfile.depth) + 'ため、歩くほど景色の見え方が変わります。';

    return {
      version: '0.3',
      title: title,
      tagline: tagline,
      summary: summary,
      affinities: { primary: primaryId, secondary: secondaryId },
      environment: environment,
      composition: composition,
      motifs: motifs,
      palette: palette,
      symbolicElements: motifs.map(function (motif, index) {
        return { element: motif, reason: index < 2 ? '属性の美術方向を軽く反映' : 'PersonCoreの特徴量を反映' };
      }),
      features: [
        { label: '世界の広がり', value: describeFeature('openness', visualProfile.openness) },
        { label: '道の形', value: describeFeature('branching', visualProfile.branching) },
        { label: '時間の流れ', value: describeFeature('motion', visualProfile.motion) },
        { label: '奥行き', value: describeFeature('depth', visualProfile.depth) },
        { label: '景色の密度', value: describeFeature('complexity', visualProfile.complexity) },
        { label: '人の気配', value: describeFeature('socialDensity', visualProfile.socialDensity) }
      ],
      reasoning: reasoning,
      imagePrompt: buildImagePrompt(visualProfile, primaryId, secondaryId)
    };
  }

  function buildWorldData(result) {
    if (!result || !result.personCore) throw new Error('PersonCore result is required');
    var primaryId = typeof result.primary === 'string' ? result.primary : result.primary.id;
    var secondaryId = typeof result.secondary === 'string' ? result.secondary : result.secondary.id;
    var visualProfile = buildVisualProfile(result.personCore);
    return {
      visualProfile: visualProfile,
      worldSpec: buildWorldSpec(visualProfile, primaryId, secondaryId, result.combinations || [])
    };
  }

  return {
    PROFILE_KEYS: PROFILE_KEYS.slice(),
    buildVisualProfile: buildVisualProfile,
    buildWorldSpec: buildWorldSpec,
    buildWorldData: buildWorldData
  };
});
