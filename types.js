/** ============================================================
 *  Palm Manual Prototype v0.1
 *  types.js — 6属性システム（PersonCoreアーキタイプ相当）
 * ============================================================ */

/**
 * 属性ごとの基本情報。
 * UX上は日本語名(dict(日本語))と意味(meaning)を優先して表示する。
 */
const PALM_TYPES = {
  WIND: {
    id: 'WIND',
    nameEn: 'WIND',
    nameJa: '風',
    glyph: '❋',
    meaning: '世界を広げる人',
    keywords: '探索・自由・好奇心・変化',
    color: ['#2dd4bf', '#a7f3d0'],
    theme: 'wind'
  },
  PRISM: {
    id: 'PRISM',
    nameEn: 'PRISM',
    nameJa: '光',
    glyph: '◈',
    meaning: '世界をつなぐ人',
    keywords: '創造・統合・異分野接続',
    color: ['#fbbf24', '#fde68a'],
    theme: 'prism'
  },
  TIDE: {
    id: 'TIDE',
    nameEn: 'TIDE',
    nameJa: '水',
    glyph: '≈',
    meaning: '人を感じる人',
    keywords: '共感・感受性・柔軟性',
    color: ['#60a5fa', '#bae6fd'],
    theme: 'tide'
  },
  ROOT: {
    id: 'ROOT',
    nameEn: 'ROOT',
    nameJa: '樹',
    glyph: '♆',
    meaning: '世界を育てる人',
    keywords: '安定・継続・育成',
    color: ['#4ade80', '#bbf7d0'],
    theme: 'root'
  },
  FORGE: {
    id: 'FORGE',
    nameEn: 'FORGE',
    nameJa: '火',
    glyph: '▲',
    meaning: '世界を動かす人',
    keywords: '行動・突破・実行',
    color: ['#fb7185', '#fecdd3'],
    theme: 'forge'
  },
  VEIL: {
    id: 'VEIL',
    nameEn: 'VEIL',
    nameJa: '月',
    glyph: '☾',
    meaning: '世界を深く見る人',
    keywords: '内省・洞察・想像',
    color: ['#a78bfa', '#ddd6fe'],
    theme: 'veil'
  }
};

/** 属性IDのリスト */
const TYPE_IDS = ['WIND', 'PRISM', 'TIDE', 'ROOT', 'FORGE', 'VEIL'];
