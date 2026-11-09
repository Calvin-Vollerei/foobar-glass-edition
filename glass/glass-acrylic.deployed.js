/* Glass skin for the foobar2000 WebView2 UI.
 *
 * Deliberately small. It does four things and nothing else:
 *   1. keeps the window material on Acrylic (the theme resets it on mount);
 *   2. dark mode only: makes the surfaces translucent and the capsule glassy;
 *   3. keeps the main content card frosted and dims + blurs the modal scrim.
 *      The card's blur lives on the theme's `_edge_` layer; the scrim is
 *      Fluent's DialogSurface backdrop.  Both run in BOTH colour modes;
 *   4. hides the 胶囊背景模糊 row and the 窗口背景 card (its 背景来源 chooser
 *      and 材质 row), because the capsule blur and the backdrop policy are
 *      owned here -- leaving those controls in the UI offers settings that
 *      cannot stick;
 *
 * It does NOT touch the colour-mode switch or any layout.
 * The translucent-surface alphas and the glassy capsule are dark-only on
 * purpose: those run over dark acrylic and wash out badly in light mode.
 *
 * Tuning: GLASS_BG / GLASS_CARD / CAPSULE_BLUR / CARD_BLUR / SCRIM_BLUR.
 */
(function () {
  'use strict';

  var GLASS_BG = 0.16;      // shell / background opacity
  var GLASS_CARD = 0.30;    // cards, lists, menus
  var CAPSULE_BLUR = 'blur(30px) saturate(175%)';
  var CARD_BLUR = 'blur(24px) saturate(150%) brightness(1.05)';
  var SCRIM_BLUR = 'blur(24px) saturate(130%)';
  /* One scrim spec, shared by both colour modes.  The card fill and the dialog
   * panel are painted surfaces and must follow the mode; the scrim must not --
   * a scrim that changes opacity per mode makes the same modal look dimmer in
   * one mode than the other, which is exactly the bug this constant prevents. */
  var SCRIM_COLOR = 'rgba(0,0,0,0.55)';
  var TOOLBAR_BLUR = 'blur(18px) saturate(140%)';

  var BACKDROP_KEY = 'default-theme.backdrop.v1';
  var busy = false;

  /* ---- material ---- */
  function applyMaterial() {
    if (busy || !window.fb2k) return;
    busy = true;
    window.fb2k.invoke('window.getBackdropPolicy').then(function (res) {
      var pol = res && res.backdropPolicy;
      /* This only ever exists to keep the *effect* on acrylic.  The colour mode
       * belongs to the theme: hardcoding darkMode here re-asserted it every
       * tick, the theme read the policy back and flipped, and light/dark
       * flapped mid-session.  Carry the fetched darkMode through unchanged. */
      if (!pol) { busy = false; return; }
      if (pol.activeEffect === 'acrylic' && pol.inactiveEffect === 'acrylic') {
        busy = false; return;
      }
      return window.fb2k.invoke('window.setBackdropPolicy', { backdropPolicy: {
        activeEffect: 'acrylic',
        inactiveEffect: 'acrylic',
        darkMode: pol.darkMode !== false
      } });
    }).catch(function () {
      /* host not ready (no policy read -> no set); the next tick retries */
    }).then(function () { busy = false; });
  }

  /* ---- light or dark? (the theme decides; we only read it) ---- */
  function isLight() {
    var prov = document.querySelector('[class*="fui-FluentProvider"]');
    if (!prov) return false;
    var fg = getComputedStyle(prov).getPropertyValue('--colorNeutralForeground1').trim();
    var r, g, b;
    var hex = fg.match(/^#([0-9a-f]{6})$/i);
    if (hex) {
      var v = parseInt(hex[1], 16);
      r = (v >> 16) & 255; g = (v >> 8) & 255; b = v & 255;
    } else {
      var nums = fg.match(/[\d.]+/g);
      if (!nums || nums.length < 3) return false;
      r = +nums[0]; g = +nums[1]; b = +nums[2];
    }
    return (r * 0.299 + g * 0.587 + b * 0.114) / 255 < 0.5;
  }

  function rgba(r, g, b, a) {
    return 'rgba(' + r + ',' + g + ',' + b + ',' + Math.max(0.03, a).toFixed(3) + ')';
  }

  /* Card glass + modal layer.  These two are the same *mechanism* in both
   * colour modes -- only the paint colour differs -- so they live outside the
   * dark-only block and are always emitted.  Everything colour-mode specific
   * about them is a value, not a rule.
   *
   * The theme's card is three layers: `_root_td4ka_1` (transparent frame),
   * `_edge_td4ka_*` (the frosted layer, it owns the backdrop-filter) and
   * `_fill_td4ka_*` (a 70%-opaque paint on top).  A `[class*="td4ka"]` fill was
   * matching the fill *and* everything else in that module and flattened the
   * card to 94% -- that is what killed the frost.  Keep the fill light and put
   * the blur on the layer that owns it.
   *
   * The modal scrim is Fluent's `fui-DialogSurface__backdrop`: a fixed,
   * full-viewport layer.  A `fui-DialogSurface` prefix also matches that
   * backdrop, so the surface rule must exclude it explicitly. */
  function buildGlassCss() {
    var light = isLight();
    var cardFill = light ? 'rgba(255,255,255,0.28)' : 'rgba(20,20,20,0.42)';
    var surface = light ? 'rgba(252,252,252,0.94)' : 'rgba(24,24,24,0.94)';
    var toolFill = light ? 'rgba(255,255,255,0.62)' : 'rgba(20,20,20,0.55)';
    var rules = [
      '[class*="_fill_td4ka"]{background-color:' + cardFill + ' !important;}',
      '[class*="_edge_td4ka"]{',
      '  -webkit-backdrop-filter:' + CARD_BLUR + ' !important;',
      '  backdrop-filter:' + CARD_BLUR + ' !important;',
      '}',
      '[class*="fui-DialogSurface__backdrop"]{',
      '  background-color:' + SCRIM_COLOR + ' !important;',
      '  -webkit-backdrop-filter:' + SCRIM_BLUR + ' !important;',
      '  backdrop-filter:' + SCRIM_BLUR + ' !important;',
      '}',
      '[class*="fui-DialogSurface"]:not([class*="__backdrop"]){',
      '  background-color:' + surface + ' !important;',
      '}',
      /* top bar controls: the theme leaves them fully transparent, so in dark
         mode the icons sit straight on the artwork behind them.  Two separate
         pills, because they are different shapes:
           `_tools_modh4`     = the 40x32 overflow button, square-ish -> 10px
           `_capsule_zmyg1`   = the chat/music toggle pair, already a pill
         NOT `_root_1ap9a_2`: measured at [817,0,138,48] it is the window
         control group (- □ x), and painting it puts a grey slab under the
         caption buttons. */
      '[class*="_tools_modh4"]{',
      '  background-color:' + toolFill + ' !important;',
      '  border-radius:10px !important;',
      '  -webkit-backdrop-filter:' + TOOLBAR_BLUR + ' !important;',
      '  backdrop-filter:' + TOOLBAR_BLUR + ' !important;',
      '}',
      '[class*="_capsule_zmyg1"]{',
      '  background-color:' + toolFill + ' !important;',
      '  border-radius:10000px !important;',
      '  -webkit-backdrop-filter:' + TOOLBAR_BLUR + ' !important;',
      '  backdrop-filter:' + TOOLBAR_BLUR + ' !important;',
      '}',
      /* `展开侧边栏` lives in its own ring, which ships as a solid
         rgb(255,255,255) circle: opaque, unblurred, and glaring in dark mode. */
      '[class*="_ring_zmyg1"]{',
      '  background-color:' + toolFill + ' !important;',
      '  border-radius:10000px !important;',
      '  -webkit-backdrop-filter:' + TOOLBAR_BLUR + ' !important;',
      '  backdrop-filter:' + TOOLBAR_BLUR + ' !important;',
      '}'
    ];
    /* Light mode: tint the OUTER shell only.  The `obom2` prefix matches six
       nested containers (root / body / sidebar / pane / content / card), so
       painting the whole family stacked four translucent whites inside the
       card and three outside it -- the card/frame boundary washed out and the
       panel read as if it had grown to the window edge.  One wash on the frame
       gives light mode the same relationship dark mode gets from its 0.16
       layer: frame slightly darker than the card.  Geometry is untouched.
       Keep this alpha low enough that the acrylic actually comes through: at
       0.88 the frame plus the 0.50 card fill composited to ~94% opaque and
       light mode read as a flat grey plate.  This rule and `cardFill` are the
       only light-mode page paints; button fills are the separate `toolFill`
       value and stay opaque on purpose. */
    if (light) {
      rules.push('[class*="_root_obom2"]{background-color:rgba(232,232,232,0.38) !important;}');
      /* Light mode never receives buildCss(), so without this the player capsule
         keeps the theme's own opaque white pill (measured rgb(255,255,255) with
         no backdrop-filter) while every surface around it is glass.  0.34 is the
         only alpha that lands between `_root_obom2` (0.38) and `_fill_td4ka`
         (0.28) -- the same "between" rule dark mode follows (0.16 / 0.42) -- and
         the blur is carried over so the low alpha reads as frosted glass instead
         of a clear hole in the bar.  Geometry, overflow and radius are untouched:
         the theme already owns those. */
      rules.push('[class~="_root_hmwti_4"]{' +
          'background-color:rgba(250,250,250,0.34) !important;' +
          '-webkit-backdrop-filter:' + CAPSULE_BLUR + ' !important;' +
          'backdrop-filter:' + CAPSULE_BLUR + ' !important;}');
    }
    return rules.join('\n');
  }

  function buildCss() {
    var c = GLASS_CARD;
    return [
      '[class*="fui-FluentProvider"]{',
      '  --colorNeutralBackground1: ' + rgba(41, 41, 41, c) + ' !important;',
      '  --colorNeutralBackground2: ' + rgba(31, 31, 31, c - 0.04) + ' !important;',
      '  --colorNeutralBackground3: ' + rgba(20, 20, 20, c - 0.06) + ' !important;',
      '  --colorNeutralBackground4: ' + rgba(10, 10, 10, c - 0.08) + ' !important;',
      '  --colorNeutralBackground1Hover: ' + rgba(61, 61, 61, c + 0.12) + ' !important;',
      '  --colorNeutralBackground1Pressed: ' + rgba(31, 31, 31, c + 0.18) + ' !important;',
      '  --colorNeutralBackgroundAlpha: ' + rgba(26, 26, 26, c - 0.02) + ' !important;',
      '  --colorNeutralBackgroundAlpha2: ' + rgba(31, 31, 31, c + 0.04) + ' !important;',
      '}',
      '[class*="obom2"]{',
      '  background-color:' + rgba(28, 28, 28, GLASS_BG) + ' !important;',
      '  background-image:none !important;',
      '}',
      '[class*="rxyze"]{background-color:' + rgba(51, 51, 51, GLASS_BG) + ' !important;}',
      /* player capsule */
      '[class*="hmwti"]{background-color:transparent !important;background-image:none !important;' +
          '-webkit-backdrop-filter:none !important;backdrop-filter:none !important;box-shadow:none !important;}',
      /* Leave `position` alone.  The theme keeps this capsule in
       * `position:absolute` with its own top/bottom; forcing `relative` pulled
       * its 64px height into the flow and shrank the settings scroll viewport
       * from 422px to 358px, so dark mode showed 64px less content than light
       * mode in the same window.  `overflow:hidden` clips fine on an absolute
       * box. */
      '[class~="_root_hmwti_4"]{',
      '  overflow:hidden !important;border-radius:10000px !important;',
      '  background-color:rgba(14,14,14,0.34) !important;background-image:none !important;',
      '  -webkit-backdrop-filter:' + CAPSULE_BLUR + ' !important;',
      '  backdrop-filter:' + CAPSULE_BLUR + ' !important;',
      '  box-shadow:0 10px 28px rgba(0,0,0,0.40), inset 0 1px 0 rgba(255,255,255,0.16) !important;',
      '}',
      /* card + modal rules are emitted for both colour modes by buildGlassCss() */
    ].join('\n');
  }

  function applySkin() {
    var st = document.getElementById('fb2k-glass-skin');
    /* the glass layer is mode-aware by value, so it is always applied */
    var css = buildGlassCss();
    if (!isLight()) css += '\n' + buildCss();
    if (!st) {
      st = document.createElement('style');
      st.id = 'fb2k-glass-skin';
      (document.head || document.documentElement).appendChild(st);
    }
    if (st.textContent !== css) st.textContent = css;
  }

  /* ---- layout guard (not glass) ----
   * The sidebar nav is a height:100% flex column: search / groups / library
   * section / playlists block / settings footer.  The playlists block is the
   * only flexible child (`flex:auto; min-height:0`), so when the sidebar panel
   * is shorter than the fixed rows it collapses to 0px.  The theme never clips
   * that block, so its 32px `播放列表` section header paints outside the empty
   * box and lands on the `设置` footer row -- the two labels end up drawn on
   * top of each other.  Clipping the block is all it takes: with enough room
   * the header sits inside its own box and nothing changes.
   *
   * Scoped to the sidebar's playlists block only; no other element in the
   * theme carries this class, and this is the only rule added here. */
  var LAYOUT_CSS = '[class*="_playlists_83tau"]{overflow:hidden !important;}';

  function applyLayoutGuard() {
    var st = document.getElementById('fb2k-glass-layout');
    if (!st) {
      st = document.createElement('style');
      st.id = 'fb2k-glass-layout';
      (document.head || document.documentElement).appendChild(st);
    }
    if (st.textContent !== LAYOUT_CSS) st.textContent = LAYOUT_CSS;
  }

  /* ---- hide the capsule-blur toggle (handled here now) ----
   * The toggle is a `_footer_...` row that is a DIRECT CHILD of a settings
   * group block (`_block_o3g21_...`).  That block also owns the group label
   * `播放栏位置` and its three-way control `窗口底部 / 标题栏 / 胶囊`, so hiding
   * `e.parentElement` removed the entire group -- 标题栏 / 胶囊 / 播放栏位置 all
   * disappeared from 外观 and looked like settings had been lost.
   *
   * `胶囊背景模糊` nests several levels deep (row > card > text > heading >
   * title), so climb to the OUTERMOST node that still contains nothing but
   * that text: that node is the row.  Hide the row only; its siblings stay. */
  function hideCapsuleBlurRow() {
    var nodes = document.querySelectorAll('div,span,label');
    for (var i = 0; i < nodes.length; i++) {
      var e = nodes[i];
      if ((e.textContent || '').trim() !== '胶囊背景模糊') continue;
      var row = e;
      while (row.parentElement &&
             (row.parentElement.textContent || '').trim() === '胶囊背景模糊') {
        row = row.parentElement;
      }
      if (row.getAttribute('data-fb2k-hidden') === '1') return;
      row.style.display = 'none';
      row.setAttribute('data-fb2k-hidden', '1');
      return;
    }
  }

  /* ---- hide the 窗口背景 card ----
   * The panel holds the 背景来源 chooser and the 材质 row.  The shim owns the
   * backdrop now (it re-asserts acrylic every tick), so leaving the chooser in
   * the UI only invites a setting that cannot stick.
   *
   * `_root_1m40a` is shared by 托盘 / 强调色 / 表面跟随背景色调 / 视图背景 /
   * 性能 / 致谢 ... -- and 视图背景 sits right next to it in name -- so the
   * card is selected by its own title, never by class or position.  Every node
   * whose whole text is `窗口背景` resolves to the same single card. */
  function hideWindowBackgroundCard() {
    var nodes = document.querySelectorAll('div,span,label');
    for (var i = 0; i < nodes.length; i++) {
      var e = nodes[i];
      if ((e.textContent || '').trim() !== '窗口背景') continue;
      var card = e.closest('[class*="_root_1m40a"]');
      if (!card) continue;
      if (card.getAttribute('data-fb2k-hidden-bg') === '1') return;
      card.style.display = 'none';
      card.setAttribute('data-fb2k-hidden-bg', '1');
      return;
    }
  }

  function start() {
    try {
      if (!localStorage.getItem(BACKDROP_KEY)) {
        localStorage.setItem(BACKDROP_KEY, JSON.stringify('acrylic'));
      }
    } catch (e) { /* storage unavailable */ }

    applySkin();
    applyLayoutGuard();
    applyMaterial();
    hideCapsuleBlurRow();
    hideWindowBackgroundCard();

    window.setInterval(function () {
      applySkin();       // follows light/dark switches
      applyLayoutGuard();
      applyMaterial();
      hideCapsuleBlurRow();
      hideWindowBackgroundCard();
    }, 900);

    document.addEventListener('visibilitychange', function () {
      if (!document.hidden) { applySkin(); applyMaterial(); hideCapsuleBlurRow(); hideWindowBackgroundCard(); }
    });
    window.addEventListener('focus', applyMaterial);
  }

  if (document.readyState === 'complete') start();
  else window.addEventListener('load', start);
})();
