/* Tableau de bord d'un serveur.
   Attend de l'API :
     GET  /guilds/{id}  -> { id, name, iconUrl, memberCount,
                             channels:[{id,name,category,disabled}],
                             voiceChannels:[…], categories:[…],
                             roles:[{id,name,position}], botRolePosition,
                             permissions:[{channel,view,write,manage,state}],
                             missingPermissions:[…], presets:[…],
                             settings:{ "mmr.start":1000, … } }
     PATCH /guilds/{id}/settings  <- { "clé": "valeur", … }
   Sans API, la page reste navigable et affiche ses états vides.

   Aucune valeur de style dans ce fichier : tout passe par une classe de
   app.css. Les seules propriétés écrites en JS sont des MESURES
   (hauteur et position de l'indicateur du rail, couleur d'équipe choisie
   par l'utilisateur), jamais des choix de design.                       */
(function () {
  'use strict';
  var t = CYQ.t, esc = CYQ.esc, icon = CYQ.icon;

  var guildId = new URLSearchParams(location.search).get('guild') || '';
  document.body.setAttribute('data-guild', guildId);
  CYQ.data = { channels: [], voiceChannels: [], categories: [], roles: [] };

  var $ = function (s, r) { return (r || document).querySelector(s); };
  var $$ = function (s, r) { return Array.prototype.slice.call((r || document).querySelectorAll(s)); };

  /* Les durées du mouvement vivent dans le :root de app.css. On les relit
     ici plutôt que de les recopier : une seule source de vérité. */
  function ms(name, dflt) {
    var v = getComputedStyle(document.documentElement).getPropertyValue(name).trim();
    var n = parseFloat(v);
    return isNaN(n) ? dflt : (v.indexOf('ms') !== -1 ? n : n * 1000);
  }

  /* ---------------------------------------------------- rendu synchrone --
     Ces blocs doivent exister avant que app.js ne câble la page.        */

  var LOG_TYPES = ['voice', 'messages', 'queue', 'match', 'duel', 'clan', 'commands', 'joins', 'moderation', 'server'];

  (function renderLogs() {
    var host = $('#logs-list');
    if (!host) return;
    host.innerHTML = LOG_TYPES.map(function (k) {
      return '<div class="row">' +
        '<span class="row__label"><span data-i18n="lo.' + k + '"></span>' +
          '<span class="row__desc mono">log.' + k + '</span></span>' +
        '<div class="row__control log-control">' +
          '<div class="combo" data-combo data-source="channels">' +
            '<input type="hidden" data-setting="log.' + k + '.channel" data-label="' + k + '">' +
            '<button class="combo__button" type="button"><span class="combo__sigil">#</span>' +
            '<span class="combo__value" data-i18n="ch.pickChannel"></span>' +
            '<span class="caret">' + icon('caret', 12) + '</span></button>' +
          '</div>' +
          '<label class="switch"><input type="checkbox" data-setting="log.' + k + '.enabled" ' +
            'data-label="' + k + '" data-log-toggle><span class="state"></span><span class="track"></span></label>' +
        '</div></div>';
    }).join('');
  })();

  var TEAM_COLORS = ['#E05A4E', '#4E8FE0', '#3FA66B', '#D98324', '#9B6BD6', '#4EC1C1', '#C9CDD3', '#E0D24E'];

  (function renderTeams() {
    var host = $('#q-teams-list');
    if (!host) return;
    var html = '';
    for (var i = 0; i < 6; i++) {
      var c = TEAM_COLORS[i];
      html += '<div class="row" data-team="' + i + '"' + (i >= 2 ? ' hidden' : '') + '>' +
        '<input class="field field--sans field--w4" type="text" maxlength="32" value="Équipe ' + (i + 1) + '" ' +
          'data-setting="queue.team' + i + '.name" data-label="Équipe ' + (i + 1) + '" ' +
          'aria-label="' + esc(t('q.teamName', { n: i + 1 })) + '">' +
        '<div class="swatch-wrap">' +
          '<button class="swatch-btn" type="button" data-color-open="' + i + '" aria-expanded="false" ' +
            'aria-label="' + esc(t('q.color', { n: i + 1 })) + '">' +
            '<span class="swatch" style="background:' + c + '"></span>' +
            '<span class="mono">' + c + '</span></button>' +
          '<input type="hidden" value="' + c + '" data-setting="queue.team' + i + '.color" ' +
            'data-label="Couleur ' + (i + 1) + '">' +
          '<div class="combo__panel color-panel" data-color-panel="' + i + '">' +
            '<div class="minilabel" data-i18n="q.palette"></div>' +
            '<div class="palette">' + TEAM_COLORS.map(function (col) {
              return '<button type="button" style="background:' + col + '" data-pick-color="' + col + '" ' +
                'aria-label="' + col + '" aria-pressed="' + (col === c) + '"></button>';
            }).join('') + '</div>' +
            '<p class="hint" data-i18n="q.colorNote"></p>' +
          '</div>' +
        '</div>' +
        '<span class="spacer"></span>' +
        '<span class="team-pill" style="--team:' + c + '" data-team-pill="' + i + '">Équipe ' + (i + 1) + '</span>' +
      '</div>';
    }
    host.innerHTML = html;
  })();

  /* ------------------------------------------------------------- démarrage */

  document.addEventListener('DOMContentLoaded', function () {

    /* --- couleurs d'équipe --- */
    document.addEventListener('click', function (e) {
      var open = e.target.closest('[data-color-open]');
      $$('[data-color-panel]').forEach(function (p) {
        if (!open || p.getAttribute('data-color-panel') !== open.getAttribute('data-color-open')) {
          p.removeAttribute('data-open');
        }
      });
      if (open) {
        var panel = $('[data-color-panel="' + open.getAttribute('data-color-open') + '"]');
        var isOpen = panel.hasAttribute('data-open');
        if (isOpen) panel.removeAttribute('data-open');
        else panel.setAttribute('data-open', 'true');
        open.setAttribute('aria-expanded', String(!isOpen));
      }
      var pick = e.target.closest('[data-pick-color]');
      if (pick) {
        var col = pick.getAttribute('data-pick-color');
        var row = pick.closest('[data-team]');
        var idx = row.getAttribute('data-team');
        $('input[type="hidden"]', pick.closest('[data-color-panel]').parentNode).value = col;
        $('.swatch', row).style.background = col;
        $('.swatch-btn .mono', row).textContent = col;
        $$('[data-pick-color]', pick.parentNode).forEach(function (b) {
          b.setAttribute('aria-pressed', String(b === pick));
        });
        $('[data-team-pill="' + idx + '"]').style.setProperty('--team', col);
        $('[data-color-panel="' + idx + '"]').removeAttribute('data-open');
        row.dispatchEvent(new CustomEvent('cyq:change', { bubbles: true }));
        renderQueuePreview();
      }
    });

    /* --- format de queue --- */
    function segValue(id) {
      var b = $('#' + id + ' button[aria-pressed="true"]');
      return b ? Number(b.textContent.trim()) : null;
    }
    function setSeg(id, val) {
      $$('#' + id + ' button').forEach(function (b) {
        b.setAttribute('aria-pressed', String(Number(b.textContent.trim()) === Number(val)));
      });
    }
    function syncFormat() {
      var teams = segValue('seg-teams') || 2;
      var players = segValue('seg-players') || 5;
      $('#q-teams').value = teams;
      $('#q-players').value = players;
      var req = $('#q-required');
      if (req) req.textContent = t('q.required', { teams: teams, players: players, total: teams * players });
      $$('[data-team]').forEach(function (row, i) { row.hidden = i >= teams; });
      renderQueuePreview();
    }
    ['seg-teams', 'seg-players'].forEach(function (id) {
      var el = $('#' + id);
      if (el) el.addEventListener('click', function () { setTimeout(syncFormat, 0); });
    });

    /* --- aperçu de la queue --- */
    function renderQueuePreview() {
      var name = ($('#q-name') || {}).value || '';
      var teams = Number(($('#q-teams') || {}).value || 2);
      var players = Number(($('#q-players') || {}).value || 5);
      var typeSel = $('#q-type');
      var sessSel = $('#q-session');
      var time = ($('#q-time') || {}).value || '';

      var n = $('#q-prev-name'); if (n) n.textContent = name;
      var m = $('#q-prev-meta');
      if (m) {
        var typeLabel = typeSel && typeSel.selectedOptions[0] ? typeSel.selectedOptions[0].textContent : '';
        var scheduled = sessSel && sessSel.value === 'scheduled';
        m.textContent = [typeLabel, scheduled ? time : t('q.sessionOnDemand'),
          t('q.required', { teams: teams, players: players, total: teams * players })]
          .filter(Boolean).join(' · ');
      }
      var tl = $('#q-prev-teams');
      if (tl) {
        var out = '';
        for (var i = 0; i < teams; i++) {
          var row = $('[data-team="' + i + '"]');
          if (!row) continue;
          var tn = $('input[type="text"]', row).value;
          var col = $('input[type="hidden"]', row).value;
          out += '<div class="qteam" style="--team:' + esc(col) + '">' +
            '<span class="qteam__name">' + esc(tn) + '</span>' +
            '<span class="qteam__slots mono">0/' + players + '</span></div>';
        }
        tl.innerHTML = out;
      }
      var tags = $('#q-prev-tags');
      if (tags) {
        var cv = $('[data-setting="queue.captainVote"]');
        var pw = $('[data-setting="queue.password"]');
        var list = [];
        if (cv && cv.checked) list.push(t('q.captainVote'));
        list.push(pw && pw.checked ? t('q.password') : t('q.noPassword'));
        tags.innerHTML = list.map(function (x) { return '<span class="tag">' + esc(x) + '</span>'; }).join('');
      }
      // l'heure ne sert que si la session est programmée
      var tr = $('#q-time-row');
      if (tr && sessSel) tr.hidden = sessSel.value !== 'scheduled';
    }
    CYQ._queuePreview = renderQueuePreview;
    window.renderQueuePreview = renderQueuePreview;

    ['#q-name', '#q-type', '#q-session', '#q-time'].forEach(function (sel) {
      var el = $(sel); if (el) el.addEventListener('input', renderQueuePreview);
      if (el) el.addEventListener('change', renderQueuePreview);
    });
    $$('[data-team] input[type="text"]').forEach(function (el) {
      el.addEventListener('input', function () {
        var row = el.closest('[data-team]');
        var pill = $('[data-team-pill="' + row.getAttribute('data-team') + '"]');
        if (pill) pill.textContent = el.value;
        renderQueuePreview();
      });
    });
    $$('[data-setting="queue.captainVote"],[data-setting="queue.password"]').forEach(function (el) {
      el.addEventListener('change', renderQueuePreview);
    });

    /* --- simulation MMR --- */
    function num(id, dflt) {
      var el = $(id);
      var v = el ? Number(el.value) : NaN;
      return isNaN(v) ? dflt : v;
    }
    function line(label, delta, total, dir) {
      return '<div class="simrow">' +
        '<span class="simrow__label">' + esc(label) + '</span>' +
        (delta === null ? '' : '<span class="simrow__delta simrow__delta--' + dir + '">' +
          (delta > 0 ? '+' : '') + delta + '</span>') +
        '<span class="spacer"></span>' +
        '<span class="simrow__total">' + total + '</span></div>';
    }
    function renderSim() {
      var host = $('#mmr-sim'); if (!host) return;
      var start = num('#f-start', 1000), win = num('#f-win', 25), loss = num('#f-loss', -18);
      var mvpOn = ($('[data-setting="mmr.mvpEnabled"]') || {}).checked;
      var mvp = mvpOn ? num('#f-mvp', 0) : 0;
      var a = start, b = a + win, c = b + win + mvp, d = c + loss;
      var ratio = loss === 0 ? null : Math.abs(win / loss);
      var bad = ratio === null || ratio > 5;
      host.innerHTML =
        line(t('mm.first'), null, a, 'up') +
        line(t('mm.aWin'), win, b, 'up') +
        line(t('mm.aWinMvp'), win + mvp, c, 'up') +
        line(t('mm.aLoss'), loss, d, 'down') +
        '<div class="simrow simrow--total">' +
          '<span class="simrow__label">' + esc(t('mm.ratio')) + '</span>' +
          '<span class="spacer"></span>' +
          '<span class="simrow__total' + (bad ? ' simrow__total--warn' : '') + '">' +
          (ratio === null ? '∞' : ratio.toFixed(1) + ' : 1') + '</span></div>';
      var w = $('#mmr-warn'); if (w) w.hidden = !bad;
    }
    ['#f-start', '#f-win', '#f-loss', '#f-mvp'].forEach(function (s) {
      var el = $(s); if (el) el.addEventListener('input', renderSim);
    });
    var mvpSw = $('[data-setting="mmr.mvpEnabled"]');
    if (mvpSw) mvpSw.addEventListener('change', renderSim);

    /* --- nom traduit de l'interrupteur qui verrouille une ligne -----------
       app.js écrit « Inactif : l'interrupteur « X » est désactivé » avec
       la valeur brute de data-name, qui est en français dans le HTML.
       On pose la traduction dans l'attribut ET dans la note, après son
       repeint, pour qu'aucune chaîne visible n'échappe à l'i18n. */
    function paintLockedNames() {
      $$('[data-controls][data-name-i18n]').forEach(function (cb) {
        var name = t(cb.getAttribute('data-name-i18n'));
        cb.setAttribute('data-name', name);
        (cb.getAttribute('data-controls') || '').split(',').forEach(function (sel) {
          $$(sel.trim()).forEach(function (row) {
            var note = $('[data-locked-note]', row);
            if (note && !note.hidden) note.textContent = t('mm.lockedBy', { name: name });
          });
        });
      });
    }
    $$('[data-controls][data-name-i18n]').forEach(function (cb) {
      cb.addEventListener('change', function () { setTimeout(paintLockedNames, 0); });
    });

    /* --- compteur de logs --- */
    function countLogs() {
      var on = $$('[data-log-toggle]').filter(function (c) { return c.checked; }).length;
      var el = $('#logs-count'); if (el) el.textContent = t('lo.enabledCount', { n: on });
      var nav = $('#nav-logs'); if (nav) nav.textContent = on + '/10';
    }
    $$('[data-log-toggle]').forEach(function (c) { c.addEventListener('change', countLogs); });

    /* --- presets --- */
    function renderPresets(presets) {
      var host = $('#presets-list'); if (!host) return;
      var cnt = $('#presets-count'), nav = $('#nav-presets');
      presets = presets || [];
      if (cnt) cnt.textContent = presets.length + '/10';
      if (nav) nav.textContent = presets.length + '/10';

      if (!presets.length) {
        host.innerHTML = '<div class="empty"><h3>' + esc(t('p.emptyTitle')) + '</h3>' +
          '<p>' + esc(t('p.emptyBody')) + '</p>' +
          '<div class="willsave">' +
            '<span class="minilabel">' + esc(t('p.willSave')) + '</span>' +
            '<span class="willsave__val" id="p-summary"></span></div>' +
          '<button class="btn btn--primary" type="button">' + esc(t('p.saveCurrent')) + '</button></div>';
        var sum = $('#p-summary');
        if (sum) {
          var teams = Number(($('#q-teams') || {}).value || 2);
          var players = Number(($('#q-players') || {}).value || 5);
          sum.textContent = (($('#q-name') || {}).value || '') + ' — ' + teams + ' × ' + players;
        }
        return;
      }
      host.innerHTML = presets.map(function (p, i) {
        return '<div class="row row--inline">' +
          '<span class="row__label row__label--grow">' + esc(p.name) + '</span>' +
          '<span class="preset-meta mono">' +
            esc((p.teams || '?') + ' × ' + (p.players || '?')) + '</span>' +
          (i === 0 ? '<span class="preset-meta mono">' + esc(t('p.active')) + '</span>'
                   : '<button class="btn btn--ghost btn--sm" type="button">' + esc(t('p.load')) + '</button>') +
          '</div>';
      }).join('');
    }

    /* --- table des permissions --- */
    function permIcon(v) {
      if (v === true)  return '<span class="pico--ok">' + icon('check', 13) + '</span>';
      if (v === false) return '<span class="pico--err">' + icon('x', 13) + '</span>';
      if (v === 'warn') return '<span class="pico--warn">' + icon('warn', 13) + '</span>';
      return '<span class="pico--none">—</span>';
    }
    function renderPerms(rows) {
      var body = $('#perm-body'); if (!body) return;
      if (!rows || !rows.length) {
        body.innerHTML = '<tr><td colspan="4"><span class="hint">' +
          esc(CYQ.api.configured ? t('st.loadingChannels') : t('d.noApi')) + '</span></td></tr>';
        return;
      }
      body.innerHTML = rows.map(function (r) {
        var cls = r.state === 'deleted' ? ' class="is-err"' : r.state === 'warn' ? ' class="is-warn"' : '';
        return '<tr' + cls + '><td><span class="sigil">#</span>' + esc(r.channel) +
          (r.state === 'deleted' ? ' <span class="faint">(' + esc(t('ch.deleted')) + ')</span>' : '') +
          '</td><td class="c">' + permIcon(r.view) + '</td><td class="c">' + permIcon(r.write) +
          '</td><td class="c">' + permIcon(r.manage) + '</td></tr>';
      }).join('');
    }

    /* --- hiérarchie des rôles --- */
    function renderHierarchy(roles, botPos) {
      var host = $('#role-hierarchy'); if (!host) return;
      if (!roles || !roles.length) {
        host.innerHTML = '<div class="hier__pad"><span class="hint">' +
          esc(CYQ.api.configured ? t('c.loading') : t('d.noApi')) + '</span></div>';
        return;
      }
      host.innerHTML = roles.slice(0, 6).map(function (r, i) {
        var isBot = r.isBot;
        var above = botPos != null && r.position > botPos && !isBot;
        return '<div class="hier__row' + (above ? ' is-above' : '') + '">' +
          '<span class="hier__n">' + (i + 1) + '</span>' +
          '<span class="hier__name' + (above ? ' hier__name--above' : '') + '">@' + esc(r.name) + '</span>' +
          (above ? '<span class="pico--warn">' + icon('warn', 11) + '</span>' : '') +
          (isBot ? '<span class="hier__tag">' + esc(t('rl.theBot')) + '</span>' : '') +
          '</div>';
      }).join('');
    }

    /* ===================================================================
       LE RAIL : un indicateur unique qui glisse
       Un seul élément, posé en absolu, jamais recréé — c'est pour ça
       qu'il ne clignote pas. Tant que .is-ready n'est pas posée, il est
       invisible ET sans transition : la première mise en place ne
       s'anime donc pas.
       =================================================================== */

    var nav = $('.side__nav');
    var mark = $('.side__mark');
    var navlinks = $$('.navlink[data-goto]');

    function activeLink() {
      return navlinks.filter(function (l) { return l.hasAttribute('aria-current'); })[0] || navlinks[0];
    }
    function markTo(link) {
      if (!mark || !link) return;
      // Deux mesures, pas deux choix de design : on suit l'entrée.
      mark.style.height = link.offsetHeight + 'px';
      mark.style.transform = 'translateY(' + link.offsetTop + 'px)';
    }
    function placeMark() { markTo(activeLink()); }

    if (nav && mark && navlinks.length) {
      placeMark();
      requestAnimationFrame(function () { nav.classList.add('is-ready'); });
      window.addEventListener('resize', placeMark);
      document.addEventListener('cyq:lang', function () { setTimeout(placeMark, 0); });
    }

    /* ===================================================================
       LE CHANGEMENT DE SECTION
       On n'remplace pas le routeur de app.js : on l'enveloppe. Le clic
       est capté avant que son propre gestionnaire ne s'exécute, on joue
       la sortie, puis on lui passe la main (CYQ.showSection fait le
       hidden, aria-current, le fil d'Ariane, le focus, le défilement et
       la fermeture du tiroir), puis on joue l'entrée.

       Budget : sortie 70 ms + décalage 3 × 28 ms + entrée 200 ms,
       soit 354 ms du clic au dernier bloc posé. Seuls transform et
       opacity sont animés : jamais la mise en page.
       =================================================================== */

    var REDUCE = window.matchMedia('(prefers-reduced-motion: reduce)');
    var T_LEAVE = ms('--t-leave', 70);
    var MAX_STAG = 3;

    function visibleSection() {
      return $$('[data-section]').filter(function (s) { return !s.hidden; })[0] || null;
    }

    /* Les blocs de premier niveau de la section. Une .stack est un
       conteneur, pas un bloc : on prend ses enfants. La barre
       d'enregistrement est écartée — sous 900 px elle est en position
       fixed, et un transform sur un ancêtre la décrocherait. */
    function blocksOf(section) {
      var out = [];
      Array.prototype.forEach.call(section.children, function (child) {
        if (child.classList.contains('section__head')) { out.push(child); return; }
        if (child.classList.contains('cols') || child.classList.contains('one')) {
          Array.prototype.forEach.call(child.children, function (k) {
            if (k.classList.contains('savebar')) return;
            if (k.classList.contains('stack')) {
              Array.prototype.forEach.call(k.children, function (c) {
                if (!c.classList.contains('savebar')) out.push(c);
              });
            } else out.push(k);
          });
        }
      });
      return out;
    }

    function cleanBlocks(section) {
      $$('.blk-in', section).forEach(function (b) {
        b.classList.remove('blk-in', 'is-on', 'blk-in--d1', 'blk-in--d2', 'blk-in--d3');
      });
    }

    function playEnter(section) {
      if (!section) return;
      cleanBlocks(section);
      if (REDUCE.matches) return;
      var blocks = blocksOf(section);
      if (!blocks.length) return;
      blocks.forEach(function (b, i) {
        var d = Math.min(i, MAX_STAG);
        b.classList.add('blk-in');
        if (d) b.classList.add('blk-in--d' + d);
      });
      // Un calcul forcé plutôt qu'un requestAnimationFrame : l'état de
      // départ est posé tout de suite, donc la transition démarre dans
      // la même image et on ne perd pas 16 ms au passage.
      void blocks[0].offsetHeight;
      blocks.forEach(function (b) { b.classList.add('is-on'); });
      clearTimeout(section._cyqAnim);
      section._cyqAnim = setTimeout(function () { cleanBlocks(section); },
        MAX_STAG * ms('--t-stag', 28) + ms('--t-enter', 200) + 40);
    }

    function playExit(section, done) {
      if (!section || REDUCE.matches) { done(); return; }
      section.classList.add('is-leaving');
      setTimeout(function () { section.classList.remove('is-leaving'); done(); }, T_LEAVE);
    }

    /* Le clic est capté en phase de capture, donc avant le gestionnaire
       que app.js a posé sur le lien. On arrête là sa propagation : c'est
       aussi ce qui ferme les menus flottants d'ordinaire, alors on le
       fait nous-mêmes. */
    function closePopovers() {
      $$('[data-open="true"]').forEach(function (el) { el.removeAttribute('data-open'); });
      $$('[aria-expanded="true"]').forEach(function (b) {
        if (!b.hasAttribute('data-drawer-open')) b.setAttribute('aria-expanded', 'false');
      });
    }

    var switching = false;

    if (nav && typeof CYQ.showSection === 'function') {
      nav.addEventListener('click', function (e) {
        var link = e.target.closest ? e.target.closest('.navlink[data-goto]') : null;
        if (!link) return;
        e.preventDefault();
        e.stopPropagation();
        closePopovers();

        var id = link.getAttribute('data-goto');
        var cur = visibleSection();
        if (switching) {   // un changement est déjà en vol : on coupe court
          switching = false;
          if (cur) cur.classList.remove('is-leaving');
          markTo(link);
          CYQ.showSection(id, true, true);
          playEnter($('[data-section="' + id + '"]'));
          return;
        }
        if (cur && cur.getAttribute('data-section') === id) {
          if (window.innerWidth <= 900 && CYQ.closeDrawer) CYQ.closeDrawer();
          return;
        }
        // L'indicateur part tout de suite : il glisse PENDANT la
        // transition, pas après.
        markTo(link);
        switching = true;
        playExit(cur, function () {
          switching = false;
          CYQ.showSection(id, true, true);
          playEnter($('[data-section="' + id + '"]'));
        });
      }, true);

      // Retour / avance du navigateur : app.js a déjà basculé la section
      // quand on arrive ici ; il reste l'entrée à jouer et l'indicateur
      // à déplacer.
      window.addEventListener('popstate', function () {
        placeMark();
        playEnter(visibleSection());
      });
    }

    /* ===================================================================
       LA PASTILLE DE MODIFICATION NON ENREGISTRÉE
       app.js émet cyq:dirty avec le nombre de champs modifiés, mais
       seulement tant qu'il en reste au moins un : l'événement ne dit
       jamais « c'est revenu propre ». Le signal fiable, c'est la barre
       d'enregistrement elle-même — masquée, ou passée en savebar--ok
       après un enregistrement réussi. On observe donc les deux.
       =================================================================== */

    (function wireDirty() {
      var byId = {};
      navlinks.forEach(function (l) { byId[l.getAttribute('data-goto')] = l; });

      $$('[data-section]').forEach(function (section) {
        var bar = $('.savebar', section);
        var link = byId[section.getAttribute('data-section')];
        if (!bar || !link) return;

        var flag = document.createElement('span');
        flag.className = 'navlink__dirty';
        flag.hidden = true;
        flag.innerHTML = '<i aria-hidden="true"></i><span data-dirty-n></span><span class="sr-only"></span>';
        link.appendChild(flag);
        var nEl = $('[data-dirty-n]', flag);
        var srEl = $('.sr-only', flag);
        var last = 0;

        function paint(n) {
          if (typeof n === 'number' && n > 0) last = n;
          var clean = bar.hidden || bar.classList.contains('savebar--ok');
          link.classList.toggle('is-dirty', !clean);
          flag.hidden = clean;
          if (!clean) {
            nEl.textContent = last || '';
            srEl.textContent = t('d.unsaved');
          }
        }

        section.addEventListener('cyq:dirty', function (e) { paint(e.detail); });
        new MutationObserver(function () { paint(); })
          .observe(bar, { attributes: true, attributeFilter: ['hidden', 'class'] });
        document.addEventListener('cyq:lang', function () { paint(); });
        paint();
      });
    })();

    /* --- chargement --- */
    function fill(settings) {
      if (!settings) return;
      Object.keys(settings).forEach(function (k) {
        var f = document.querySelector('[data-setting="' + CSS.escape(k) + '"]');
        if (!f) return;
        if (f.type === 'checkbox') f.checked = !!settings[k];
        else f.value = settings[k];
        f.dispatchEvent(new Event('change', { bubbles: true }));
      });
      if (settings['queue.teams']) setSeg('seg-teams', settings['queue.teams']);
      if (settings['queue.players']) setSeg('seg-players', settings['queue.players']);
    }

    function load() {
      if (!CYQ.api.configured) {
        $('#noapi').hidden = false;
        renderPerms(null); renderHierarchy(null); renderPresets([]);
        CYQ.refreshCombos();
        return;
      }
      CYQ.api.get('/guilds/' + encodeURIComponent(guildId)).then(function (g) {
        $('#g-name').textContent = g.name || '—';
        $('#g-name').setAttribute('title', g.name || '');
        $('#crumb-guild').textContent = g.name || '—';
        document.title = (g.name ? g.name + ' — ' : '') + 'CreateYourQueue';
        $('#g-members').textContent = g.memberCount == null ? '—' : Number(g.memberCount).toLocaleString(CYQ.lang);
        if (g.iconUrl) {
          $('#g-icon').outerHTML = '<img class="gicon gicon--sm" id="g-icon" src="' + esc(g.iconUrl) +
            '" alt="" width="32" height="32">';
        }
        if (g.me && g.me.name) $('#me-name').textContent = g.me.name;
        var od = $('#open-discord');
        if (od && g.id) od.setAttribute('href', 'https://discord.com/channels/' + encodeURIComponent(g.id));
        var rl = $('#roles-link');
        if (rl && g.id) rl.setAttribute('href', 'https://discord.com/channels/' + encodeURIComponent(g.id));

        CYQ.data.channels      = g.channels || [];
        CYQ.data.voiceChannels = g.voiceChannels || [];
        CYQ.data.categories    = g.categories || [];
        CYQ.data.roles         = g.roles || [];
        CYQ.refreshCombos();

        renderPerms(g.permissions);
        renderHierarchy(g.roles, g.botRolePosition);
        renderPresets(g.presets);
        fill(g.settings);

        var warn = $('#nav-roles-warn');
        if (warn) warn.hidden = !(g.missingPermissions && g.missingPermissions.length);

        syncFormat(); renderSim(); countLogs(); renderQueuePreview();
        placeMark();
      }).catch(function (err) {
        if (err.code === 'UNAUTHORIZED') { location.href = CYQ.loginUrl() || 'index.html'; return; }
        $('#noapi').hidden = false;
        $('#noapi .notice__title').textContent = t('sv.loadErr');
        $('#noapi .hint').textContent = t('sv.loadErrBody');
        renderPerms(null); renderHierarchy(null); renderPresets([]);
      });
    }

    syncFormat(); renderSim(); countLogs(); renderQueuePreview(); paintLockedNames();
    load();
    // Première section : elle arrive comme les suivantes, pas d'un bloc.
    playEnter(visibleSection());
    document.addEventListener('cyq:lang', function () {
      syncFormat(); renderSim(); countLogs(); renderQueuePreview(); paintLockedNames();
    });
  });
})();
