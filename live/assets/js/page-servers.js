/* Sélecteur de serveur.
   Attend de l'API : GET /guilds -> [{ id, name, iconUrl, memberCount,
   botPresent, configured, missingPermissions: [], canManage, updatedAt }]
   Sans API, la page affiche son état « aucune API » — jamais de faux serveurs. */
(function () {
  'use strict';
  var t = CYQ.t, esc = CYQ.esc, icon = CYQ.icon;

  var list   = document.getElementById('sv-list');
  var filter = document.getElementById('sv-filter');
  var hide   = document.getElementById('sv-hide');
  var count  = document.getElementById('sv-count');
  var guilds = null;
  var state  = 'loading';

  function initials(name) {
    return (name || '?').replace(/[^\p{L}\p{N} ]/gu, '').trim().split(/\s+/)
      .slice(0, 2).map(function (w) { return w[0]; }).join('').toUpperCase() || '?';
  }

  function skeleton() {
    var out = '';
    for (var i = 0; i < 4; i++) {
      out += '<div class="grow"><span class="sk sk--pulse" style="width:34px;height:34px;border-radius:4px"></span>' +
        '<span style="flex:1 1 auto"><span class="sk sk--pulse" style="width:44%;margin-bottom:6px"></span>' +
        '<span class="sk sk--pulse" style="width:28%;height:7px"></span></span>' +
        '<span class="sk sk--pulse" style="width:60px"></span></div>';
    }
    return out;
  }

  function panel(title, body, cta, href) {
    return '<div class="empty"><h3>' + esc(title) + '</h3><p>' + esc(body) + '</p>' +
      (cta ? '<a class="btn btn--primary" href="' + esc(href || '#') + '">' + esc(cta) + '</a>' : '') +
      '</div>';
  }

  function stateTag(g) {
    if (!g.canManage)
      return '<span class="tag">' + icon('lock', 11) + esc(t('sv.stRevoked')) + '</span>';
    if (g.missingPermissions && g.missingPermissions.length)
      return '<span class="tag tag--warn">' + icon('warn', 11) + esc(t('sv.stNoPerms')) + '</span>';
    if (!g.botPresent)
      return '<span class="tag">' + icon('x', 11) + esc(t('sv.stNoBot')) + '</span>';
    if (!g.configured)
      return '<span class="tag">' + icon('plus', 11) + esc(t('sv.stToConfigure')) + '</span>';
    return '<span class="tag tag--ok">' + icon('check', 11) + esc(t('sv.stConfigured')) + '</span>';
  }

  function action(g) {
    if (!g.canManage)
      return '<button class="btn" type="button" disabled>' + esc(t('sv.actConfigure')) + '</button>';
    if (g.missingPermissions && g.missingPermissions.length)
      return '<a class="btn" data-invite data-guild-id="' + esc(g.id) + '" href="#">' + esc(t('sv.actFix')) + '</a>';
    if (!g.botPresent)
      return '<a class="btn" data-invite data-guild-id="' + esc(g.id) + '" href="#">' +
        icon('plus', 13) + esc(t('sv.actInvite')) + '</a>';
    var href = 'dashboard.html?guild=' + encodeURIComponent(g.id);
    return '<a class="btn" href="' + href + '">' +
      esc(t(g.configured ? 'sv.actConfigure' : 'sv.actWizard')) + icon('chevron', 13) + '</a>';
  }

  function meta(g) {
    if (!g.canManage) return t('sv.revokedHelp');
    if (g.missingPermissions && g.missingPermissions.length)
      return g.missingPermissions.join(' · ');
    if (!g.configured) return g.id + ' · ' + t('sv.neverConfigured');
    return g.id + (g.updatedAt ? ' · ' + t('sv.modified', { date: new Date(g.updatedAt).toLocaleDateString(CYQ.lang) }) : '');
  }

  function row(g) {
    var clickable = g.canManage && g.botPresent && !(g.missingPermissions || []).length;
    var href = 'dashboard.html?guild=' + encodeURIComponent(g.id);
    var warn = (g.missingPermissions || []).length;
    return '<div class="grow' + (g.canManage ? '' : ' is-off') + '">' +
      (g.iconUrl
        ? '<img class="gicon" src="' + esc(g.iconUrl) + '" alt="" width="34" height="34" loading="lazy">'
        : '<span class="gicon" aria-hidden="true">' + esc(initials(g.name)) + '</span>') +
      '<span style="flex:1 1 auto;min-width:0">' +
        (clickable
          ? '<a class="gname" href="' + href + '" title="' + esc(g.name) + '">' + esc(g.name) + '</a>'
          : '<span class="gname" title="' + esc(g.name) + '">' + esc(g.name) + '</span>') +
        '<span class="gmeta"' + (warn ? ' style="color:var(--warn)"' : '') + '>' + esc(meta(g)) + '</span>' +
      '</span>' +
      '<span class="gcount">' + (g.memberCount == null ? '—' : Number(g.memberCount).toLocaleString(CYQ.lang)) + '</span>' +
      '<span class="gstate">' + stateTag(g) + '</span>' +
      '<span class="gact">' + action(g) + '</span>' +
    '</div>';
  }

  function render() {
    list.removeAttribute('aria-busy');

    if (state === 'loading') { list.setAttribute('aria-busy', 'true'); list.innerHTML = skeleton(); count.textContent = ''; return; }
    if (state === 'noapi')   { list.innerHTML = panel(t('d.noApi'), t('d.noApiBody')); count.textContent = ''; return; }
    if (state === 'auth')    { list.innerHTML = panel(t('sv.needLogin'), t('sv.needLoginBody'), t('h.loginBtn'), CYQ.loginUrl() || '#'); count.textContent = ''; return; }
    if (state === 'error')   {
      list.innerHTML = '<div class="empty"><h3>' + esc(t('sv.loadErr')) + '</h3><p>' + esc(t('sv.loadErrBody')) +
        '</p><button class="btn btn--primary" type="button" id="sv-retry">' + esc(t('c.retry')) + '</button></div>';
      document.getElementById('sv-retry').addEventListener('click', load);
      count.textContent = '';
      return;
    }

    var q = (filter.value || '').trim().toLowerCase();
    var rows = guilds.filter(function (g) {
      if (hide.checked && !g.botPresent) return false;
      return !q || (g.name || '').toLowerCase().indexOf(q) !== -1;
    });

    count.textContent = ' ' + t('sv.count', { n: rows.length, total: guilds.length });

    if (!guilds.length) {
      list.innerHTML = panel(t('sv.emptyTitle'), t('sv.emptyBody'), t('sv.emptyCta'), CYQ.inviteUrl() || '#');
      return;
    }
    if (!rows.length) {
      list.innerHTML = '<div class="empty"><h3>' + esc(t('sv.noFilterTitle')) + '</h3>' +
        '<p>' + esc(t('ch.noMatchBody')) + '</p>' +
        '<button class="btn" type="button" id="sv-clear">' + esc(t('c.clear')) + '</button></div>';
      document.getElementById('sv-clear').addEventListener('click', function () {
        filter.value = ''; hide.checked = false; render(); filter.focus();
      });
      return;
    }

    list.innerHTML = rows.map(row).join('');
    // (re)câble les liens d'invitation générés
    Array.prototype.forEach.call(list.querySelectorAll('[data-invite]'), function (a) {
      var u = CYQ.inviteUrl(a.getAttribute('data-guild-id'));
      if (u) a.setAttribute('href', u); else a.setAttribute('aria-disabled', 'true');
    });
  }

  function load() {
    state = 'loading';
    render();
    CYQ.api.get('/guilds').then(function (data) {
      guilds = Array.isArray(data) ? data : [];
      state = 'ready';
      render();
    }).catch(function (err) {
      state = err.code === 'NO_API' ? 'noapi' : err.code === 'UNAUTHORIZED' ? 'auth' : 'error';
      render();
    });
  }

  filter.addEventListener('input', function () { if (state === 'ready') render(); });
  hide.addEventListener('change', function () { if (state === 'ready') render(); });
  document.getElementById('sv-refresh').addEventListener('click', load);
  document.addEventListener('cyq:lang', render);

  /* Ce script s'exécute à l'analyse de la page, donc AVANT le démarrage de
     app.js, qui pose la langue sur `DOMContentLoaded`. Lancé tout de suite,
     le premier rendu se faisait donc en français quelle que soit la langue du
     visiteur — et comme les états vides contiennent du texte littéral et non
     des `data-i18n`, rien ne venait les retraduire ensuite. app.js ayant
     enregistré son démarrage en premier, il passera avant celui-ci. */
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', load);
  else load();
})();
