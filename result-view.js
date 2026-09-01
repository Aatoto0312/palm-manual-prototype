/** Palm Manual v0.2.1 — result display helpers (diagnosis-independent). */
(function (root, factory) {
  var api = factory();
  if (typeof module === 'object' && module.exports) module.exports = api;
  if (root) root.PalmResultView = api;
})(typeof globalThis !== 'undefined' ? globalThis : this, function () {
  'use strict';

  var STRENGTH_LABELS = ['控えめ', 'やや控えめ', 'ほどよい', '強め', 'かなり強め'];

  var AXIS_TYPE_LABELS = {
    core: [
      '流れに合わせるタイプ', '状況に合わせるタイプ', '軸と柔軟さを使い分けるタイプ',
      '自分の基準を大切にするタイプ', '方向を守るタイプ'
    ],
    path: [
      'ひとつの道を確かめるタイプ', '慣れた道を育てるタイプ', '道を選び分けるタイプ',
      '別ルートを探せるタイプ', '道を増やすタイプ'
    ],
    curiosity: [
      '身近なものを味わうタイプ', '必要なことを選んで知るタイプ', '興味をほどよく広げるタイプ',
      '新しいものへ手を伸ばすタイプ', '未知を楽しむタイプ'
    ],
    connection: [
      '自分の時間を守るタイプ', '少人数を大切にするタイプ', '距離感を選べるタイプ',
      '人や情報を結ぶタイプ', 'つながりを広げるタイプ'
    ],
    ignition: [
      '準備してから動くタイプ', 'きっかけを確かめるタイプ', '頃合いを見て動くタイプ',
      'すぐ試してみるタイプ', '最初の一歩が速いタイプ'
    ],
    persistence: [
      '短い区切りで進むタイプ', '切り替えを大切にするタイプ', '無理なく続けるタイプ',
      'こつこつ育てるタイプ', '長く積み上げるタイプ'
    ],
    sensor: [
      '大きな変化をつかむタイプ', '必要なサインを選ぶタイプ', 'ほどよく気配を受け取るタイプ',
      '小さな変化に気づくタイプ', '空気を細やかに受け取るタイプ'
    ],
    depth: [
      'まず全体を見るタイプ', '広く見渡してから選ぶタイプ', '広さと深さを行き来するタイプ',
      'ひとつを掘り下げるタイプ', '核心まで深く見るタイプ'
    ]
  };

  function normalizeValue(value) {
    var numeric = Number(value);
    if (!Number.isFinite(numeric)) return 3;
    return Math.max(1, Math.min(5, Math.round(numeric)));
  }

  function getAxisPresentation(axisId, value) {
    var normalized = normalizeValue(value);
    var labels = AXIS_TYPE_LABELS[axisId] || [
      '穏やかに使うタイプ', '必要な時に使うタイプ', 'ほどよく使うタイプ',
      'よく使うタイプ', '自然に使いこなすタイプ'
    ];
    return {
      strength: STRENGTH_LABELS[normalized - 1],
      typeLabel: labels[normalized - 1]
    };
  }

  function rankCombinations(combinations) {
    var ranked = (combinations || []).map(function (item, index) {
      var values = Array.isArray(item.values) ? item.values : [];
      var distance = values.reduce(function (sum, value) {
        return sum + Math.abs(normalizeValue(value) - 3);
      }, 0);
      return { item: item, index: index, distance: distance };
    }).sort(function (a, b) {
      return b.distance - a.distance || a.index - b.index;
    }).map(function (entry) { return entry.item; });

    return { featured: ranked.slice(0, 3), more: ranked.slice(3) };
  }

  return {
    getAxisPresentation: getAxisPresentation,
    rankCombinations: rankCombinations
  };
});

