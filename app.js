/** ============================================================
 *  Palm Manual Prototype v0.1.1
 *  app.js — SPA画面遷移・写真プレビュー・診断演出・結果描画
 * ============================================================ */

(function () {
  'use strict';

  var SCREENS = ['top', 'name', 'left', 'right', 'analyzing', 'result', 'world'];

  var el = {};
  var state = {
    name: '',
    left: null,   // { url, name, size, file }
    right: null,  // { url, name, size, file }
    analyzingToken: 0,
    imageFeatures: null,
    result: null,
    world: null
  };

  var analyzingTexts = [
    '手のひらを読み解いています…',
    '特徴をつないでいます…',
    'あなたの取扱説明書を作成中…'
  ];

  document.addEventListener('DOMContentLoaded', init);

  function $(id) { return document.getElementById(id); }

  function init() {
    cacheElements();

    // 初期画面
    show('top');

    // ボタン: 画面遷移
    bindNav();

    // 名前: Enterで次へ
    el.inputName.addEventListener('input', clearNameError);
    el.inputName.addEventListener('keydown', onNameKeydown);
    el.btnNameNext.addEventListener('click', goRightFromName);

    // 写真: 左手
    bindPhoto('left');
    // 写真: 右手
    bindPhoto('right');

    // 診断開始
    el.btnLeftNext.addEventListener('click', goRight);
    el.btnRightNext.addEventListener('click', startAnalyzing);

    // 結果ボタン
    el.btnWorld.addEventListener('click', openWorld);
    el.btnWorldBack.addEventListener('click', function () { show('result'); });
    el.btnFriends.addEventListener('click', function () { showToast('この機能は次のバージョンで追加予定です'); });
    el.btnRetry.addEventListener('click', resetAll);
  }

  function cacheElements() {
    el.top = $('screen-top');
    el.screens = {};
    SCREENS.forEach(function (s) {
      el.screens[s] = $('screen-' + s);
    });

    el.inputName = $('inputName');
    el.nameError = $('nameError');
    el.btnNameNext = $('btnNameNext');

    // 左手
    el.inputLeft = $('inputLeft');
    el.leftPreview = $('leftPreview');
    el.leftDropZone = $('leftDropZone');
    el.btnLeftRetake = $('btnLeftRetake');
    el.btnLeftNext = $('btnLeftNext');

    // 右手
    el.inputRight = $('inputRight');
    el.rightPreview = $('rightPreview');
    el.rightDropZone = $('rightDropZone');
    el.btnRightRetake = $('btnRightRetake');
    el.btnRightNext = $('btnRightNext');

    el.analyzeText = $('analyzeText');

    el.resultName = $('resultName');
    el.resultPrimaryCard = $('resultPrimaryCard');
    el.resultSecondaryCard = $('resultSecondaryCard');
    el.primaryGlyph = $('primaryGlyph');
    el.primaryNameJa = $('primaryNameJa');
    el.primaryNameEn = $('primaryNameEn');
    el.primaryMeaning = $('primaryMeaning');
    el.secondaryGlyph = $('secondaryGlyph');
    el.secondaryNameJa = $('secondaryNameJa');
    el.secondaryNameEn = $('secondaryNameEn');
    el.resultTitle = $('resultTitle');
    el.resultSummary = $('resultSummary');
    el.personCoreGrid = $('personCoreGrid');
    el.featuredCombinationList = $('featuredCombinationList');
    el.moreCombinationList = $('moreCombinationList');
    el.moreCombinations = $('moreCombinations');
    el.deepList = $('deepList');
    el.howToReadText = $('howToReadText');

    el.btnWorld = $('btnWorld');
    el.btnFriends = $('btnFriends');
    el.btnRetry = $('btnRetry');

    el.worldCard = $('worldCard');
    el.worldVisual = $('worldVisual');
    el.worldTitle = $('worldTitle');
    el.worldTagline = $('worldTagline');
    el.worldSummary = $('worldSummary');
    el.worldAffinity = $('worldAffinity');
    el.worldFeatureList = $('worldFeatureList');
    el.worldMotifList = $('worldMotifList');
    el.worldReasonList = $('worldReasonList');
    el.worldBuildings = $('worldBuildings');
    el.worldLights = $('worldLights');
    el.btnWorldBack = $('btnWorldBack');

    el.toast = $('toast');
    el.toastText = $('toastText');
  }

  /* ===================== 画面遷移 ===================== */
  function show(id) {
    var next = el.screens[id];
    if (!next) return;

    for (var i = 0; i < SCREENS.length; i++) {
      var key = SCREENS[i];
      var s = el.screens[key];
      s.classList.remove('is-active');
      s.setAttribute('aria-hidden', 'true');
    }
    next.classList.add('is-active');
    next.setAttribute('aria-hidden', 'false');

    // 画面切替時は必ず上端へ戻す（長文画面のアクセス時対策）
    window.scrollTo(0, 0);

    if (id === 'name') {
      setTimeout(function () { el.inputName.focus(); }, 120);
    } else if (id === 'left') {
      focusFirstNav('left');
    }
  }

  function focusFirstNav(which) {
    var btn = which === 'left' ? el.btnLeftNext : el.btnRightNext;
    if (btn && !btn.disabled) {
      setTimeout(function () { btn.focus(); }, 120);
    }
  }

  function bindNav() {
    // data-goto ボタン
    var gotoButtons = document.querySelectorAll('[data-goto]');
    Array.prototype.forEach.call(gotoButtons, function (btn) {
      btn.addEventListener('click', function () {
        show(btn.getAttribute('data-goto'));
      });
    });

    // data-back ボタン
    var backButtons = document.querySelectorAll('[data-back]');
    Array.prototype.forEach.call(backButtons, function (btn) {
      btn.addEventListener('click', goBack);
    });
  }

  function goBack() {
    var active = getActiveScreen();
    switch (active) {
      case 'name': show('top'); break;
      case 'left': show('name'); break;
      case 'right': show('left'); break;
      case 'analyzing': show('right'); break;
      case 'result': show('top'); break;
      case 'world': show('result'); break;
      default: show('top');
    }
  }

  function getActiveScreen() {
    for (var i = 0; i < SCREENS.length; i++) {
      var s = el.screens[SCREENS[i]];
      if (s.classList.contains('is-active')) return SCREENS[i];
    }
    return 'top';
  }

  /* ===================== 名前 ===================== */
  function onNameKeydown(e) {
    if (e.key === 'Enter') {
      e.preventDefault();
      goRightFromName();
    }
  }

  function goRightFromName() {
    var val = el.inputName.value.trim();
    if (!val) {
      el.nameError.textContent = '名前またはニックネームを入力してください';
      el.inputName.focus();
      return;
    }
    state.name = val;
    el.nameError.textContent = '';
    show('left');
  }

  function clearNameError() {
    if (el.nameError.textContent) el.nameError.textContent = '';
  }

  /* ===================== 写真 ===================== */
  function bindPhoto(which) {
    var input = which === 'left' ? el.inputLeft : el.inputRight;
    var preview = which === 'left' ? el.leftPreview : el.rightPreview;
    var dropZone = which === 'left' ? el.leftDropZone : el.rightDropZone;
    var retake = which === 'left' ? el.btnLeftRetake : el.btnRightRetake;
    var next = which === 'left' ? el.btnLeftNext : el.btnRightNext;

    input.addEventListener('change', function () {
      var file = input.files && input.files[0];
      if (!file) {
        clearPhoto(which);
        return;
      }
      if (!file.type || file.type.indexOf('image/') === 0) {
        setPhoto(which, file);
      }
      input.value = '';
    });

    // ドロップゾーンをタップ可能にするためラベルはそのまま。
    // 撮り直しはinputを再開放。
    retake.addEventListener('click', function () {
      clearPhoto(which);
      input.click();
    });
  }

  function setPhoto(which, file) {
    var url = URL.createObjectURL(file);
    var preview = which === 'left' ? el.leftPreview : el.rightPreview;
    var dropZone = which === 'left' ? el.leftDropZone : el.rightDropZone;
    var retake = which === 'left' ? el.btnLeftRetake : el.btnRightRetake;
    var next = which === 'left' ? el.btnLeftNext : el.btnRightNext;

    // 古いURL解放
    var before = which === 'left' ? state.left : state.right;
    if (before && before.url) URL.revokeObjectURL(before.url);

    var rec = { url: url, name: file.name || '', size: file.size || 0, file: file };
    if (which === 'left') state.left = rec; else state.right = rec;

    preview.src = url;
    preview.hidden = false;
    dropZone.hidden = true;
    retake.hidden = false;
    next.disabled = false;
    next.removeAttribute('disabled');
  }

  function clearPhoto(which) {
    var preview = which === 'left' ? el.leftPreview : el.rightPreview;
    var dropZone = which === 'left' ? el.leftDropZone : el.rightDropZone;
    var retake = which === 'left' ? el.btnLeftRetake : el.btnRightRetake;
    var next = which === 'left' ? el.btnLeftNext : el.btnRightNext;

    if (which === 'left' ? state.left : state.right) {
      var before = which === 'left' ? state.left : state.right;
      if (before.url) URL.revokeObjectURL(before.url);
    }
    if (which === 'left') state.left = null; else state.right = null;

    preview.removeAttribute('src');
    preview.hidden = true;
    dropZone.hidden = false;
    retake.hidden = true;
    next.disabled = true;
    next.setAttribute('disabled', 'disabled');
  }

  function goRight() {
    if (!state.left) return;
    show('right');
  }

  /* ===================== ANALYZING ===================== */
  function startAnalyzing() {
    if (!state.right) return;
    state.imageFeatures = null;
    show('analyzing');

    var token = ++state.analyzingToken;

    // 演出テキストを順に表示
    analyzingTexts.forEach(function (txt, i) {
      setTimeout(function () {
        if (token !== state.analyzingToken) return;
        el.analyzeText.textContent = txt;
      }, 900 * i);
    });

    // 非同期で画像特徴(PalmImageFeatures v1)を抽出
    var leftSrc = state.left ? (state.left.file || state.left.url) : null;
    var rightSrc = state.right ? (state.right.file || state.right.url) : null;

    var featPromise = window.PalmImageFeatures
      ? window.PalmImageFeatures.extractPairFeatures(leftSrc, rightSrc)
      : Promise.resolve(null);

    featPromise.then(function (features) {
      if (token !== state.analyzingToken) return;
      state.imageFeatures = features;
    }).catch(function () {
      if (token !== state.analyzingToken) return;
      state.imageFeatures = null;
    });

    // 2.7秒後に結果へ
    setTimeout(function () {
      if (token !== state.analyzingToken) return;
      renderResult();
      show('result');
    }, 2700 + 400);
  }

  /* ===================== RESULT ===================== */
  function renderResult() {
    var input = {
      name: state.name,
      leftFileName: state.left ? state.left.name : '',
      leftSize: state.left ? state.left.size : 0,
      rightFileName: state.right ? state.right.name : '',
      rightSize: state.right ? state.right.size : 0,
      imageFeatures: state.imageFeatures
    };

    var r = window.PalmDiagnosis.diagnose(input);
    state.result = r;
    state.world = null;

    el.resultName.textContent = r.name + 'の取扱説明書';

    // Primary
    el.resultPrimaryCard.setAttribute('data-type', r.primary.id);
    el.primaryGlyph.textContent = r.primary.glyph;
    el.primaryNameJa.textContent = r.primary.nameJa;
    el.primaryNameEn.textContent = r.primary.nameEn + ' · ' + r.primary.keywords;
    el.primaryMeaning.textContent = r.primary.meaning;

    // Secondary
    el.resultSecondaryCard.setAttribute('data-type', r.secondary.id);
    el.secondaryGlyph.textContent = r.secondary.glyph;
    el.secondaryNameJa.textContent = r.secondary.nameJa;
    el.secondaryNameEn.textContent = r.secondary.nameEn;

    // 固有愛称
    el.resultTitle.textContent = '《' + r.title + '》';
    el.resultSummary.textContent = r.summary;

    // PersonCore 8軸
    el.personCoreGrid.innerHTML = '';
    r.categories.forEach(function (category) {
      var group = document.createElement('section');
      group.className = 'core-category';
      group.setAttribute('data-category', category.id);

      var heading = document.createElement('h4');
      heading.className = 'core-category-title';
      heading.textContent = category.label;
      group.appendChild(heading);

      var axes = document.createElement('div');
      axes.className = 'core-axis-list';
      r.coreAxes.forEach(function (axis) {
        if (axis.category !== category.id) return;
        var presentation = window.PalmResultView.getAxisPresentation(axis.id, axis.value);
        var item = document.createElement('div');
        item.className = 'core-axis';

        var copy = document.createElement('div');
        copy.className = 'core-axis-copy';
        var label = document.createElement('strong');
        label.textContent = axis.label;
        var description = document.createElement('span');
        description.textContent = axis.description;
        var strength = document.createElement('span');
        strength.className = 'core-strength-label';
        strength.textContent = '傾向：' + presentation.strength;
        copy.appendChild(label);
        copy.appendChild(strength);

        var stars = document.createElement('span');
        stars.className = 'core-stars';
        stars.setAttribute('aria-label', axis.label + 'の傾向：' + presentation.strength);
        var filled = document.createElement('span');
        filled.textContent = '★'.repeat(axis.value);
        var empty = document.createElement('span');
        empty.className = 'empty';
        empty.textContent = '☆'.repeat(5 - axis.value);
        stars.appendChild(filled);
        stars.appendChild(empty);

        var typeLabel = document.createElement('p');
        typeLabel.className = 'core-type-label';
        typeLabel.textContent = '「' + presentation.typeLabel + '」';

        item.appendChild(copy);
        item.appendChild(stars);
        item.appendChild(typeLabel);
        item.title = description.textContent;
        axes.appendChild(item);
      });
      group.appendChild(axes);
      el.personCoreGrid.appendChild(group);
    });

    // 組み合わせ解釈
    el.featuredCombinationList.innerHTML = '';
    el.moreCombinationList.innerHTML = '';
    el.moreCombinations.open = false;
    var rankedCombinations = window.PalmResultView.rankCombinations(r.combinations);

    function createCombinationCard(combination) {
      var item = document.createElement('article');
      item.className = 'combination-card';

      var axes = document.createElement('p');
      axes.className = 'combination-axes';
      axes.textContent = combination.axes.map(function (id) {
        var axis = r.coreAxes.find(function (candidate) { return candidate.id === id; });
        return axis ? axis.label : id;
      }).join(' × ');

      var heading = document.createElement('h4');
      heading.textContent = combination.headline;
      var body = document.createElement('p');
      body.className = 'combination-body';
      body.textContent = combination.text;

      item.appendChild(axes);
      item.appendChild(heading);
      item.appendChild(body);
      return item;
    }

    rankedCombinations.featured.forEach(function (combination) {
      el.featuredCombinationList.appendChild(createCombinationCard(combination));
    });
    rankedCombinations.more.forEach(function (combination) {
      el.moreCombinationList.appendChild(createCombinationCard(combination));
    });

    // 詳しい取扱説明書
    el.deepList.innerHTML = '';
    r.deepKeys.forEach(function (key, index) {
      var body = r.deep[key.id] || '';
      if (!body) return;

      var item = document.createElement('details');
      item.className = 'deep-item';
      item.open = index === 0;

      var title = document.createElement('summary');
      title.className = 'deep-item-summary';
      title.textContent = key.label;

      var p = document.createElement('p');
      p.className = 'deep-item-body';
      p.textContent = body;

      item.appendChild(title);
      item.appendChild(p);
      el.deepList.appendChild(item);
    });

    el.howToReadText.textContent = r.howToRead;
  }

  /* ===================== WORLD ===================== */
  function openWorld() {
    if (!state.result) return;
    state.world = window.PalmWorldCore.buildWorldData(state.result);
    renderWorld(state.world);
    show('world');
  }

  function renderWorld(worldData) {
    var profile = worldData.visualProfile;
    var spec = worldData.worldSpec;

    el.worldTitle.textContent = spec.title;
    el.worldTagline.textContent = spec.tagline;
    el.worldSummary.textContent = spec.summary;
    el.worldAffinity.textContent = spec.affinities.primary + ' × ' + spec.affinities.secondary;

    var style = el.worldVisual.style;
    style.setProperty('--world-open', profile.openness);
    style.setProperty('--world-branch', profile.branching);
    style.setProperty('--world-focus', profile.destinationClarity);
    style.setProperty('--world-connect', profile.connectivity);
    style.setProperty('--world-motion', profile.motion);
    style.setProperty('--world-history', profile.persistence);
    style.setProperty('--world-detail', profile.sensitivity);
    style.setProperty('--world-depth', profile.depth);
    style.setProperty('--world-density', profile.complexity);
    style.setProperty('--world-warmth', profile.warmth);
    style.setProperty('--world-mystery', profile.mystery);
    style.setProperty('--world-social', profile.socialDensity);
    style.setProperty('--world-blend', profile.natureUrbanBlend);
    style.setProperty('--world-vertical', profile.verticality);
    el.worldCard.setAttribute('data-primary', spec.affinities.primary);
    el.worldCard.setAttribute('data-secondary', spec.affinities.secondary);

    renderRepeatedLayer(el.worldBuildings, 'world-building', 2 + Math.round(profile.socialDensity * 6));
    renderRepeatedLayer(el.worldLights, 'world-light', 3 + Math.round(profile.sensitivity * 9));

    el.worldFeatureList.innerHTML = '';
    spec.features.forEach(function (feature) {
      var term = document.createElement('dt');
      term.textContent = feature.label;
      var description = document.createElement('dd');
      description.textContent = feature.value;
      el.worldFeatureList.appendChild(term);
      el.worldFeatureList.appendChild(description);
    });

    el.worldMotifList.innerHTML = '';
    spec.motifs.forEach(function (motif) {
      var chip = document.createElement('span');
      chip.textContent = motif;
      el.worldMotifList.appendChild(chip);
    });

    el.worldReasonList.innerHTML = '';
    spec.reasoning.forEach(function (reason) {
      var item = document.createElement('article');
      item.className = 'world-reason';
      var source = document.createElement('h4');
      source.textContent = reason.source;
      var interpretation = document.createElement('p');
      interpretation.textContent = reason.interpretation;
      var arrow = document.createElement('span');
      arrow.className = 'world-reason-arrow';
      arrow.setAttribute('aria-hidden', 'true');
      arrow.textContent = '↓';
      var effect = document.createElement('p');
      effect.className = 'world-reason-effect';
      effect.textContent = reason.visualEffect;
      item.appendChild(source);
      item.appendChild(interpretation);
      item.appendChild(arrow);
      item.appendChild(effect);
      el.worldReasonList.appendChild(item);
    });
  }

  function renderRepeatedLayer(container, className, count) {
    container.innerHTML = '';
    for (var i = 0; i < count; i++) {
      var part = document.createElement('span');
      part.className = className;
      part.style.setProperty('--item-index', i);
      part.style.setProperty('--item-count', count);
      container.appendChild(part);
    }
  }

  /* ===================== トースト ===================== */
  var toastTimer = null;
  function showToast(msg) {
    el.toastText.textContent = msg;
    el.toast.hidden = false;
    el.toast.classList.add('show');
    if (toastTimer) clearTimeout(toastTimer);
    toastTimer = setTimeout(function () {
      el.toast.classList.remove('show');
      el.toast.hidden = true;
    }, 2400);
  }

  /* ===================== リセット ===================== */
  function resetAll() {
    state.name = '';
    state.analyzingToken++;

    if (state.left && state.left.url) URL.revokeObjectURL(state.left.url);
    if (state.right && state.right.url) URL.revokeObjectURL(state.right.url);
    state.left = null;
    state.right = null;
    state.result = null;
    state.world = null;

    el.inputName.value = '';
    clearNameError();
    clearPhoto('left');
    clearPhoto('right');

    show('top');
  }
})();
