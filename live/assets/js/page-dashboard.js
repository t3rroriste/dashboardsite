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
   Sans API, la page reste navigable et affiche ses états vides.          */
(function () {
  'use strict';
  var t = CYQ.t, esc = CYQ.esc, icon = CYQ.icon;

  var guildId = new URLSearchParams(location.search).get('guild') || '';
  document.body.setAttribute('data-guild', guildId);
  CYQ.data = { channels: [], voiceChannels: [], categories: [], roles: [] };

  var $ = function (s, r) { return (r || document).querySelector(s); };
  var $$ = function (s, r) { return Array.prototype.slice.call((r || document).querySelectorAll(s)); };

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
        '<div class="row__control" style="display:flex;align-items:center;gap:10px">' +
          '<div class="combo" data-combo data-source="channels" style="flex:1 1 auto">' +
            '<input type="hidden" data-setting="log.' + k + '.channel" data-label="' + k + '">' +
            '<button class="combo__button" type="button"><span style="color:var(--fg-3)">#</span>' +
            '<span style="flex:1 1 auto" data-i18n="ch.pickChannel"></span>' +
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
        '<input class="field field--sans" type="text" maxlength="32" value="Équipe ' + (i + 1) + '" ' +
          'data-setting="queue.team' + i + '.name" data-label="Équipe ' + (i + 1) + '" ' +
          'style="width:210px" aria-label="' + esc(t('q.teamName', { n: i + 1 })) + '">' +
        '<div style="position:relative">' +
          '<button class="swatch-btn" type="button" data-color-open="' + i + '" aria-expanded="false" ' +
            'aria-label="' + esc(t('q.color', { n: i + 1 })) + '">' +
            '<span class="swatch" style="background:' + c + '"></span>' +
            '<span class="mono">' + c + '</span></button>' +
          '<input type="hidden" value="' + c + '" data-setting="queue.team' + i + '.color" ' +
            'data-label="Couleur ' + (i + 1) + '">' +
          '<div class="combo__panel" data-color-panel="' + i + '" style="width:216px;left:0;right:auto;padding:10px;top:36px">' +
            '<div class="mono" style="font-size:9.5px;letter-spacing:.1em;color:var(--fg-3);margin-bottom:8px" data-i18n="q.palette"></div>' +
            '<div class="palette">' + TEAM_COLORS.map(function (col) {
              return '<button type="button" style="background:' + col + '" data-pick-color="' + col + '" ' +
                'aria-label="' + col + '" aria-pressed="' + (col === c) + '"></button>';
            }).join('') + '</div>' +
            '<p class="hint" style="margin-top:8px;font-size:10.5px" data-i18n="q.colorNote"></p>' +
          '</div>' +
        '</div>' +
        '<span style="flex:1 1 auto"></span>' +
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
          p.style.display = 'none';
        }
      });
      if (open) {
        var panel = $('[data-color-panel="' + open.getAttribute('data-color-open') + '"]');
        var isOpen = panel.style.display === 'block';
        panel.style.display = isOpen ? 'none' : 'block';
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
        $('[data-color-panel="' + idx + '"]').style.display = 'none';
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
          out += '<div style="display:flex;align-items:center;gap:8px;height:24px;padding:0 8px;border-radius:2px;' +
            'border-left:2px solid ' + esc(col) + ';background:color-mix(in srgb,' + esc(col) + ' 13%,transparent)">' +
            '<span style="flex:1 1 auto;font:500 12px var(--sans)">' + esc(tn) + '</span>' +
            '<span class="mono" style="font-size:11px;color:var(--fg-3)">0/' + players + '</span></div>';
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
    function line(label, delta, total, color) {
      return '<div style="display:flex;align-items:center;gap:9px;padding:6px 0;border-bottom:1px solid var(--line)">' +
        '<span class="mono" style="font-size:11.5px;color:var(--fg-2);width:120px">' + esc(label) + '</span>' +
        (delta === null ? '' : '<span class="mono" style="font-size:11.5px;color:' + color + '">' +
          (delta > 0 ? '+' : '') + delta + '</span>') +
        '<span style="flex:1 1 auto"></span>' +
        '<span class="mono" style="font-size:13px">' + total + '</span></div>';
    }
    function renderSim() {
      var host = $('#mmr-sim'); if (!host) return;
      var start = num('#f-start', 1000), win = num('#f-win', 25), loss = num('#f-loss', -18);
      var mvpOn = ($('[data-setting="mmr.mvpEnabled"]') || {}).checked;
      var mvp = mvpOn ? num('#f-mvp', 0) : 0;
      var a = start, b = a + win, c = b + win + mvp, d = c + loss;
      var ratio = loss === 0 ? null : Math.abs(win / loss);
      host.innerHTML =
        line(t('mm.first'), null, a) +
        line(t('mm.aWin'), win, b, 'var(--ok)') +
        line(t('mm.aWinMvp'), win + mvp, c, 'var(--ok)') +
        line(t('mm.aLoss'), loss, d, 'var(--err)') +
        '<div style="display:flex;align-items:center;gap:9px;padding:6px 0">' +
          '<span class="mono" style="font-size:11.5px;color:var(--fg-2);width:120px">' + esc(t('mm.ratio')) + '</span>' +
          '<span style="flex:1 1 auto"></span><span class="mono" style="font-size:13px;color:' +
          (ratio === null || ratio > 5 ? 'var(--warn)' : 'var(--fg)') + '">' +
          (ratio === null ? '∞' : ratio.toFixed(1) + ' : 1') + '</span></div>';
      var w = $('#mmr-warn'); if (w) w.hidden = !(ratio === null || ratio > 5);
    }
    ['#f-start', '#f-win', '#f-loss', '#f-mvp'].forEach(function (s) {
      var el = $(s); if (el) el.addEventListener('input', renderSim);
    });
    var mvpSw = $('[data-setting="mmr.mvpEnabled"]');
    if (mvpSw) mvpSw.addEventListener('change', renderSim);

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
          '<div style="border:1px dashed var(--line-2);border-radius:2px;padding:9px 10px;margin-bottom:12px">' +
            '<span class="mono" style="font-size:10.5px;color:var(--fg-3);display:block;margin-bottom:5px">' +
            esc(t('p.willSave')).toUpperCase() + '</span>' +
            '<span class="mono" style="font-size:11px;color:var(--fg-2)" id="p-summary"></span></div>' +
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
          '<span class="mono" style="font-size:10.5px;color:var(--fg-3)">' +
            esc((p.teams || '?') + ' × ' + (p.players || '?')) + '</span>' +
          (i === 0 ? '<span class="mono" style="font-size:10.5px;color:var(--fg-3)">' + esc(t('p.active')) + '</span>'
                   : '<button class="btn btn--ghost btn--sm" type="button">' + esc(t('p.load')) + '</button>') +
          '</div>';
      }).join('');
    }

    /* --- table des permissions --- */
    function permIcon(v) {
      if (v === true)  return '<span style="color:var(--ok)">' + icon('check', 13) + '</span>';
      if (v === false) return '<span style="color:var(--err)">' + icon('x', 13) + '</span>';
      if (v === 'warn') return '<span style="color:var(--warn)">' + icon('warn', 13) + '</span>';
      return '<span class="mono" style="color:var(--fg-3)">—</span>';
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
        return '<tr' + cls + '><td><span style="color:var(--fg-3)">#</span>' + esc(r.channel) +
          (r.state === 'deleted' ? ' <span style="color:var(--fg-3)">(' + esc(t('ch.deleted')) + ')</span>' : '') +
          '</td><td class="c">' + permIcon(r.view) + '</td><td class="c">' + permIcon(r.write) +
          '</td><td class="c">' + permIcon(r.manage) + '</td></tr>';
      }).join('');
    }

    /* --- hiérarchie des rôles --- */
    function renderHierarchy(roles, botPos) {
      var host = $('#role-hierarchy'); if (!host) return;
      if (!roles || !roles.length) { host.innerHTML = '<div style="padding:10px"><span class="hint">' +
        esc(CYQ.api.configured ? t('c.loading') : t('d.noApi')) + '</span></div>'; return; }
      host.innerHTML = roles.slice(0, 6).map(function (r, i) {
        var isBot = r.isBot;
        var above = botPos != null && r.position > botPos && !isBot;
        return '<div style="display:flex;align-items:center;gap:8px;height:26px;padding:0 9px;' +
          'border-bottom:1px solid var(--line)' + (above ? ';background:var(--warn-bg)' : '') + '">' +
          '<span class="mono" style="font-size:11px;flex:1 1 auto' + (above ? ';color:var(--warn)' : '') + '">@' +
          esc(r.name) + '</span>' +
          (above ? '<span style="color:var(--warn)">' + icon('warn', 11) + '</span>' : '') +
          (isBot ? '<span class="mono" style="font-size:9.5px;color:var(--fg-3)">' + esc(t('rl.theBot')) + '</span>' : '') +
          '</div>';
      }).join('');
    }

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
          $('#g-icon').outerHTML = '<img class="gicon" id="g-icon" src="' + esc(g.iconUrl) +
            '" alt="" width="32" height="32" style="width:32px;height:32px">';
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
      }).catch(function (err) {
        if (err.code === 'UNAUTHORIZED') { location.href = CYQ.loginUrl() || 'index.html'; return; }
        $('#noapi').hidden = false;
        $('#noapi .notice__title').textContent = t('sv.loadErr');
        $('#noapi .hint').textContent = t('sv.loadErrBody');
        renderPerms(null); renderHierarchy(null); renderPresets([]);
      });
    }

    syncFormat(); renderSim(); countLogs(); renderQueuePreview();
    load();
    document.addEventListener('cyq:lang', function () {
      syncFormat(); renderSim(); countLogs(); renderQueuePreview();
    });
  });
})();
