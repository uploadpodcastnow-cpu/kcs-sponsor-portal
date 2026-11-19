/* Kirk Cameron Show — Sponsorship Portal
   One file, no build step. The Assembly embed (or index.html) loads this from GitHub via jsDelivr.
   Settings the embed can set before loading this file:
     window.KCS_API_URL  — the Google Apps Script web-app URL that stores the shared data (see apps-script/Code.gs)
     window.KCS_API_KEY  — the shared key set in that script
     window.KCS_SEED     — optional starting data (used only when there is no API URL and nothing saved yet)
   With no KCS_API_URL the portal runs in "this browser only" mode and saves to localStorage. */
(function () {
'use strict';
if (window.__kcsPortalLoaded) return; window.__kcsPortalLoaded = true;

/* ------------------------------------------------------------------ constants */
var SLOTS = [
  { id: 'early', label: 'Early roll', short: 'E' },
  { id: 'mid1', label: 'Mid roll 1', short: 'M1' },
  { id: 'mid2', label: 'Mid roll 2', short: 'M2' },
  { id: 'late', label: 'Late roll', short: 'L' }
];
var SLOT_GROUP = { early: 'early', mid1: 'mid', mid2: 'mid', late: 'late' };
var STATUSES = ['Prospecting', 'Contracted', 'Active', 'Completed'];
var FORMATS = ['Both', 'Video', 'Audio'];
var SPONSOR_COLORS = ['#2F7D5B', '#B3261E', '#C88A12', '#2E6DA4', '#7B4FB0', '#C2477A', '#1F8A8A', '#8A5A2B', '#5B6B2E', '#D0612C', '#3F51B5', '#6D6D6D', '#A0336B', '#2B7A3D'];
var TEAM_COLORS = ['#B9862E', '#4C8368', '#4D6C8C', '#B85878', '#8161B8', '#2E9678', '#C99A46', '#96469B'];
var DEFAULT_TEAM = [
  { id: 'caleb', name: 'Caleb', title: 'Sales' },
  { id: 'james', name: 'James', title: 'Producer / Scripts' },
  { id: 'jack', name: 'Jack', title: 'Editor' },
  { id: 'olivia', name: 'Olivia', title: "Kirk's socials + email" },
  { id: 'kaylee', name: 'Kaylee', title: 'Show socials' }
];
var DEFAULT_TYPES = [
  { id: 'story_kirk', name: 'Story — Kirk Cameron (FB + IG)', owner: 'olivia', proof: 'screenshot' },
  { id: 'story_show', name: 'Story — Show (FB + IG)', owner: 'kaylee', proof: 'screenshot' },
  { id: 'fb_collab_kirk', name: 'Facebook Collab Post — Kirk Cameron', owner: 'olivia', proof: 'link' },
  { id: 'fb_collab_show', name: 'Facebook Collab Post — Show', owner: 'kaylee', proof: 'link' },
  { id: 'ig_collab_kirk', name: 'Instagram Collab Post — Kirk Cameron', owner: 'olivia', proof: 'link' },
  { id: 'ig_collab_show', name: 'Instagram Collab Post — Show', owner: 'kaylee', proof: 'link' },
  { id: 'fb_reel_kirk', name: 'Facebook Reel — Kirk Cameron', owner: 'olivia', proof: 'link' },
  { id: 'fb_reel_show', name: 'Facebook Reel — Show', owner: 'kaylee', proof: 'link' },
  { id: 'ig_reel_kirk', name: 'Instagram Reel — Kirk Cameron', owner: 'olivia', proof: 'link' },
  { id: 'ig_reel_show', name: 'Instagram Reel — Show', owner: 'kaylee', proof: 'link' },
  { id: 'yt_collab_show', name: 'YouTube Collab — Show', owner: 'kaylee', proof: 'link' },
  { id: 'email_cfu', name: 'Email — Cameron Family Update', owner: 'olivia', proof: 'screenshot' },
  { id: 'website_partner', name: 'Website Partner listing', owner: 'caleb', proof: 'link' }
];
var SETUP_TASKS = [
  { title: 'Read-in script', owner: 'james' },
  { title: 'Ad copy / talking points', owner: 'james' },
  { title: 'Graphics from sponsor', owner: 'caleb' }
];

/* ------------------------------------------------------------------ utils */
function uid(p) { return (p || 'id') + '_' + Math.random().toString(36).slice(2, 9) + Date.now().toString(36).slice(-3); }
function esc(s) { return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]; }); }
function pad(n) { return (n < 10 ? '0' : '') + n; }
function ymd(d) { return d.getFullYear() + '-' + pad(d.getMonth() + 1) + '-' + pad(d.getDate()); }
function parseD(s) { var p = String(s).split('-'); return new Date(+p[0], (+p[1] || 1) - 1, +p[2] || 1); }
function today() { return ymd(new Date()); }
function monthOf(s) { return String(s || '').slice(0, 7); }
function thisMonth() { return today().slice(0, 7); }
function addMonths(m, n) { var d = parseD(m + '-01'); d.setMonth(d.getMonth() + n); return ymd(d).slice(0, 7); }
function addDays(s, n) { var d = parseD(s); d.setDate(d.getDate() + n); return ymd(d); }
function monthName(m, short) { var d = parseD(m + '-01'); return d.toLocaleDateString('en-US', { month: short ? 'short' : 'long', year: 'numeric' }); }
function fmtDate(s, withDay) { if (!s) return ''; var d = parseD(s); return d.toLocaleDateString('en-US', withDay ? { weekday: 'short', month: 'short', day: 'numeric' } : { month: 'short', day: 'numeric' }); }
function daysUntil(s) { return Math.round((parseD(s) - parseD(today())) / 864e5); }
function monthEnd(m) { var d = parseD(m + '-01'); d.setMonth(d.getMonth() + 1); d.setDate(0); return ymd(d); }
function isUrl(s) { return /^https?:\/\/\S+$/i.test(String(s || '').trim()); }
function clone(o) { return JSON.parse(JSON.stringify(o)); }
function num(v) { var n = parseInt(v, 10); return isNaN(n) || n < 0 ? 0 : n; }
function by(k) { return function (a, b) { return a[k] < b[k] ? -1 : a[k] > b[k] ? 1 : 0; }; }

/* ------------------------------------------------------------------ data */
function blankData() {
  return { schema: 1, team: DEFAULT_TEAM.map(function (t, i) { return Object.assign({ color: TEAM_COLORS[i % TEAM_COLORS.length] }, t); }),
    types: clone(DEFAULT_TYPES), sponsors: [], days: {}, placements: [], tasks: [], archive: null, importedAt: null };
}
function normalize(d) {
  d = d && typeof d === 'object' ? d : blankData();
  var b = blankData();
  ['team', 'types', 'sponsors', 'placements', 'tasks'].forEach(function (k) { if (!Array.isArray(d[k])) d[k] = b[k]; });
  if (!d.days || typeof d.days !== 'object') d.days = {};
  d.sponsors.forEach(function (s, i) {
    s.pkg = s.pkg || {}; s.pkg.extras = s.pkg.extras || [];
    ['episodesPerMonth', 'early', 'mid', 'late'].forEach(function (k) { s.pkg[k] = num(s.pkg[k]); });
    if (!s.color) s.color = SPONSOR_COLORS[i % SPONSOR_COLORS.length];
    if (!s.status) s.status = 'Prospecting';
  });
  d.team.forEach(function (t, i) { if (!t.color) t.color = TEAM_COLORS[i % TEAM_COLORS.length]; });
  d.schema = 1;
  return d;
}

var D = blankData();      // shared data
var version = 0;          // server version for conflict checks
var UI = {
  tab: 'month', month: thisMonth(), sponsorId: null, search: '', statusFilter: 'current',
  owner: 'all', taskView: 'open', overdueAll: false, endingOnly: false, showQuiet: false, modal: null
};
try { var savedUi = JSON.parse(localStorage.getItem('kcs_portal_ui') || '{}'); if (savedUi.tab) UI.tab = savedUi.tab; if (savedUi.owner) UI.owner = savedUi.owner; } catch (e) {}
function keepUi() { try { localStorage.setItem('kcs_portal_ui', JSON.stringify({ tab: UI.tab, owner: UI.owner })); } catch (e) {} }

function team(id) { for (var i = 0; i < D.team.length; i++) if (D.team[i].id === id) return D.team[i]; return null; }
function sponsor(id) { for (var i = 0; i < D.sponsors.length; i++) if (D.sponsors[i].id === id) return D.sponsors[i]; return null; }
function typeById(id) { for (var i = 0; i < D.types.length; i++) if (D.types[i].id === id) return D.types[i]; return null; }
function placementsFor(sid, m) { return D.placements.filter(function (p) { return p.sponsorId === sid && (!m || monthOf(p.date) === m); }); }
function tasksFor(sid, m) { return D.tasks.filter(function (t) { return (!sid || t.sponsorId === sid) && (!m || t.month === m); }); }
function isOverdue(t) { return t.status !== 'done' && t.due && t.due < today(); }
function endingSoon(s) { return s.endDate && !s.autoRenews && s.status !== 'Completed' && daysUntil(s.endDate) >= 0 && daysUntil(s.endDate) <= 30; }
function inTerm(s, m) {
  if (s.status === 'Prospecting' || s.status === 'Completed') return false;
  if (s.startDate && monthOf(s.startDate) > m) return false;
  if (s.endDate && monthOf(s.endDate) < m && !s.autoRenews) return false;
  return true;
}
function activeIn(s, m) { return inTerm(s, m) || placementsFor(s.id, m).length > 0 || tasksFor(s.id, m).length > 0; }
function slotCounts(sid, m) {
  var c = { early: 0, mid: 0, late: 0, episodes: 0 }, dates = {};
  placementsFor(sid, m).forEach(function (p) { c[SLOT_GROUP[p.slot] || 'mid']++; dates[p.date] = 1; });
  c.episodes = Object.keys(dates).length; return c;
}
function isEpisodeDay(s) { var d = parseD(s).getDay(); return d === 1 || d === 3 || d === 5; }

/* ------------------------------------------------------------------ storage */
var API = window.KCS_API_URL || '', KEY = window.KCS_API_KEY || '';
var LS_DATA = 'kcs_portal_data_v1';
var saveState = 'idle', saveTimer = null, dirty = false, lastError = '';
function api(body) {
  return fetch(API, { method: 'POST', headers: { 'Content-Type': 'text/plain;charset=utf-8' }, body: JSON.stringify(Object.assign({ key: KEY }, body)) })
    .then(function (r) { if (!r.ok) throw new Error('HTTP ' + r.status); return r.json(); });
}
function load() {
  if (API) {
    return api({ action: 'load' }).then(function (r) {
      if (!r.ok) throw new Error(r.error || 'Could not load');
      D = normalize(r.data); version = r.version || 0;
    });
  }
  // Inside a Claude artifact: the shared database (also how Claude edits the board from chat).
  if (window.claude && typeof window.claude.use === 'function') {
    return window.claude.use('db').then(function (db) {
      if (db) { DBH = db; return dbStart(db); }
      loadLocal();
    }, function () { loadLocal(); });
  }
  loadLocal(); return Promise.resolve();
}
function loadLocal() {
  var raw = null; try { raw = localStorage.getItem(LS_DATA); } catch (e) {}
  if (raw) { try { D = normalize(JSON.parse(raw)); return; } catch (e) {} }
  D = normalize(window.KCS_SEED ? clone(window.KCS_SEED) : null);
}

/* ---- Claude artifact database ----
   board/meta        team, deliverable types, recorded days, general tasks
   sponsors/<id>     one sponsor with its own placements and tasks
   One document per sponsor keeps edits small and lets two people work on different sponsors at once. */
var DBH = null, dbDocs = {}, dbWriting = false, dbQueued = false, dbStash = null, needRender = false;
function bundle() {
  var out = {};
  out['board/meta'] = { schema: 1, team: D.team, types: D.types, days: D.days, assetsHubLink: D.assetsHubLink || '', importedAt: D.importedAt || '',
    generalTasks: D.tasks.filter(function (t) { return !t.sponsorId || !sponsor(t.sponsorId); }) };
  D.sponsors.forEach(function (sp) {
    var b = clone(sp);
    b.placements = D.placements.filter(function (p) { return p.sponsorId === sp.id; });
    b.tasks = D.tasks.filter(function (t) { return t.sponsorId === sp.id; });
    out['sponsors/' + sp.id] = b;
  });
  return out;
}
function assemble(meta, docs) {
  var d = { schema: 1, team: meta && meta.team, types: meta && meta.types, days: (meta && meta.days) || {}, assetsHubLink: (meta && meta.assetsHubLink) || '',
    importedAt: (meta && meta.importedAt) || null, sponsors: [], placements: [], tasks: ((meta && meta.generalTasks) || []).slice() };
  docs.forEach(function (x) {
    var b = clone(x.data); b.id = b.id || x.id;
    (b.placements || []).forEach(function (p) { p.sponsorId = b.id; d.placements.push(p); });
    (b.tasks || []).forEach(function (t) { t.sponsorId = b.id; d.tasks.push(t); });
    delete b.placements; delete b.tasks; d.sponsors.push(b);
  });
  return normalize(d);
}
function rememberDocs() { var b = bundle(); dbDocs = {}; Object.keys(b).forEach(function (k) { dbDocs[k] = JSON.stringify(b[k]); }); }
function applyRemote(meta, docs) {
  if (dirty || dbWriting) { dbStash = { meta: meta, docs: docs }; return; }
  D = assemble(meta, docs); rememberDocs();
  if (UI.modal) needRender = true; else if (root.querySelector('.k-top')) render();
}
function dbStart(db) {
  return new Promise(function (resolve) {
    var meta = null, docs = [], gotM = false, gotS = false, done = false;
    var timer = setTimeout(function () { if (!done) { done = true; resolve(); toast('The board is slow to load — it may be out of date for a moment.'); } }, 10000);
    function ready() {
      if (!gotM || !gotS) return;
      if (!done) {
        done = true; clearTimeout(timer);
        if (!meta && !docs.length) { D = blankData(); rememberDocs(); dbSeed(db).then(resolve, resolve); return; }
        D = assemble(meta, docs); rememberDocs(); resolve(); return;
      }
      applyRemote(meta, docs);
    }
    function fail(e) { saveState = 'error'; lastError = 'Live updates stopped (' + ((e && e.code) || 'error') + '). Reload the page.'; paintSave(); if (!done) { done = true; clearTimeout(timer); resolve(); } }
    db.doc('board/meta').onSnapshot(function (snap) { meta = snap.exists ? snap.data() : null; gotM = true; ready(); }, fail);
    db.collection('sponsors').onSnapshot(function (q) { docs = q.docs.map(function (x) { return { id: x.id, data: x.data() }; }); gotS = true; ready(); }, fail);
  });
}
// First open of an empty board: load the migrated data shipped beside the page (seed.json), once.
function dbSeed(db) {
  return fetch('seed.json').then(function (r) { if (!r.ok) throw 0; return r.json(); }).then(function (seed) {
    return db.doc('board/seedlock').acquire({ holder: uid('seed'), ttlMs: 120000 }).then(function (lease) {
      if (!lease.acquired) return;
      return db.doc('board/meta').get().then(function (m) {
        if (m.exists) return;
        D = normalize(seed); save(); setTimeout(function () { toast('Loaded everything from the old board.'); }, 300);
      });
    });
  }).catch(function () {});
}
function dbFlush() {
  if (dbWriting) { dbQueued = true; return; }
  dbWriting = true;
  var want = bundle(), ops = [];
  Object.keys(want).forEach(function (k) { var j = JSON.stringify(want[k]); if (dbDocs[k] !== j) ops.push([k, want[k], j]); });
  Object.keys(dbDocs).forEach(function (k) { if (!(k in want)) ops.push([k, null, null]); });
  var chain = Promise.resolve();
  ops.forEach(function (o) {
    chain = chain.then(function () {
      var ref = DBH.doc(o[0]);
      return (o[1] ? ref.set(o[1]) : ref.delete()).then(function () { if (o[1]) dbDocs[o[0]] = o[2]; else delete dbDocs[o[0]]; });
    });
  });
  chain.then(function () {
    dbWriting = false;
    if (dbQueued) { dbQueued = false; dbFlush(); return; }
    dirty = false; saveState = 'saved'; paintSave();
    if (dbStash) { var st2 = dbStash; dbStash = null; applyRemote(st2.meta, st2.docs); }
  }, function (e) {
    dbWriting = false;
    if (e && e.code === 'invalid_argument') { saveState = 'error'; lastError = 'Not saved — you have view-only access to this board.'; paintSave(); return; }
    if (e && e.code === 'quota_exceeded') { saveState = 'error'; lastError = 'Not saved — the board is full (' + e.message + ').'; paintSave(); return; }
    saveState = 'error'; lastError = 'Not saved — retrying…'; paintSave();
    clearTimeout(saveTimer); saveTimer = setTimeout(dbFlush, 5000);
  });
}
function save() {
  dirty = true; saveState = 'saving'; paintSave();
  clearTimeout(saveTimer); saveTimer = setTimeout(flush, 700);
}
function flush() {
  if (DBH) { dbFlush(); return; }
  if (!API) {
    try { localStorage.setItem(LS_DATA, JSON.stringify(D)); saveState = 'saved'; } catch (e) { saveState = 'error'; lastError = 'This browser would not save (storage full or blocked).'; }
    dirty = false; paintSave(); return;
  }
  var sent = JSON.stringify(D);
  api({ action: 'save', data: JSON.parse(sent), version: version }).then(function (r) {
    if (r.ok) { version = r.version; if (JSON.stringify(D) === sent) dirty = false; saveState = dirty ? 'saving' : 'saved'; if (dirty) flush(); }
    else if (r.conflict) {
      D = normalize(r.data); version = r.version; dirty = false; saveState = 'saved';
      toast('A teammate saved changes at the same time. You are now seeing the latest — please redo your last change.');
      render();
    } else throw new Error(r.error || 'Save failed');
    paintSave();
  }).catch(function (e) {
    saveState = 'error'; lastError = 'Not saved — ' + e.message + '. Retrying…'; paintSave();
    clearTimeout(saveTimer); saveTimer = setTimeout(flush, 5000);
  });
}
function refreshFromServer() {
  if (!API || dirty || UI.modal) return;
  api({ action: 'load' }).then(function (r) { if (r.ok && r.version !== version && !dirty) { D = normalize(r.data); version = r.version; render(); } }).catch(function () {});
}
window.addEventListener('beforeunload', function (e) { if (dirty) { e.preventDefault(); e.returnValue = ''; } });

function uploadImage(file) {
  return shrinkImage(file).then(function (dataUrl) {
    if (!API) return dataUrl;
    return api({ action: 'upload', name: file.name || 'proof.jpg', dataUrl: dataUrl }).then(function (r) {
      if (!r.ok) throw new Error(r.error || 'Upload failed'); return r.url;
    });
  });
}
function shrinkImage(file) {
  return new Promise(function (res, rej) {
    var fr = new FileReader();
    fr.onload = function () {
      var img = new Image();
      img.onload = function () {
        var max = 1400, w = img.width, h = img.height, s = Math.min(1, max / Math.max(w, h));
        var c = document.createElement('canvas'); c.width = Math.round(w * s); c.height = Math.round(h * s);
        c.getContext('2d').drawImage(img, 0, 0, c.width, c.height); res(c.toDataURL('image/jpeg', 0.78));
      };
      img.onerror = function () { rej(new Error('That file is not an image')); };
      img.src = fr.result;
    };
    fr.onerror = function () { rej(new Error('Could not read the file')); };
    fr.readAsDataURL(file);
  });
}

/* ------------------------------------------------------------------ styles */
var CSS = "\
#kcs{--ink:#151515;--muted:#66625c;--line:#e4e0d8;--soft:#f5f3ee;--card:#fff;--red:#B3261E;--green:#2E7D4F;--amber:#A86A0C;--blue:#2E6DA4;\
font-family:'Barlow',system-ui,-apple-system,'Segoe UI',sans-serif;font-size:15px;line-height:1.45;color:var(--ink);background:#fff;max-width:1280px;margin:0 auto;padding:0 0 40px;box-sizing:border-box}\
#kcs *{box-sizing:border-box;min-width:0}\
#kcs button{font:inherit;color:var(--ink)}#kcs input,#kcs select,#kcs textarea{font:inherit;color:inherit}\
#kcs .k-tab{color:var(--muted)}#kcs .k-tab:hover{color:var(--ink)}#kcs .k-tab[aria-selected=true],#kcs .k-btn.pri,#kcs .k-fchip[aria-pressed=true],#kcs .k-seg button[aria-pressed=true]{color:#fff}#kcs .k-btn.red{color:var(--red)}#kcs .k-link{color:var(--blue)}\
#kcs input.k-name{font-family:'Barlow Condensed',sans-serif;font-size:28px;font-weight:700;border-color:transparent;padding:2px 4px}#kcs input.k-name:hover{border-color:var(--line)}\
#kcs a{color:var(--blue)}\
.k-top{display:flex;flex-wrap:wrap;align-items:flex-end;justify-content:space-between;gap:16px;padding:22px 24px 16px;border-bottom:2px solid var(--ink)}\
.k-eyebrow{font-size:13px;color:var(--muted);font-weight:600}\
.k-title{font-family:'Barlow Condensed','Barlow',sans-serif;font-weight:800;font-size:clamp(26px,3.6vw,36px);line-height:1.02;margin:2px 0 0;text-transform:uppercase;letter-spacing:.01em}\
.k-stats{display:flex;flex-wrap:wrap;gap:6px}\
.k-stat{border:1px solid var(--line);background:#fff;border-radius:8px;padding:7px 12px;text-align:left;min-width:92px;cursor:default}\
button.k-stat{cursor:pointer}button.k-stat:hover{border-color:var(--ink)}\
.k-stat b{display:block;font-family:'Barlow Condensed',sans-serif;font-size:26px;line-height:1;font-weight:700}\
.k-stat span{font-size:12px;color:var(--muted)}\
.k-stat.bad b{color:var(--red)}.k-stat.warn b{color:var(--amber)}\
.k-bar{display:flex;flex-wrap:wrap;align-items:center;justify-content:space-between;gap:10px;padding:10px 24px;border-bottom:1px solid var(--line);position:sticky;top:0;background:#fff;z-index:5}\
.k-tabs{display:flex;gap:2px;flex-wrap:wrap}\
.k-tab{border:0;background:none;padding:9px 14px;border-radius:7px;cursor:pointer;font-weight:600;color:var(--muted)}\
.k-tab:hover{background:var(--soft);color:var(--ink)}\
.k-tab[aria-selected=true]{background:var(--ink);color:#fff}\
.k-month{display:flex;align-items:center;gap:4px}\
.k-month b{min-width:150px;text-align:center;font-family:'Barlow Condensed',sans-serif;font-size:20px;font-weight:700}\
.k-ibtn{border:1px solid var(--line);background:#fff;border-radius:7px;width:36px;height:36px;cursor:pointer;display:inline-grid;place-items:center;font-size:16px}\
.k-ibtn:hover{border-color:var(--ink)}\
.k-btn{border:1px solid var(--line);background:#fff;border-radius:7px;padding:8px 13px;cursor:pointer;font-weight:600;white-space:nowrap}\
.k-btn:hover{border-color:var(--ink)}\
.k-btn.pri{background:var(--ink);border-color:var(--ink);color:#fff}.k-btn.pri:hover{background:#333}\
.k-btn.red{color:var(--red)}.k-btn.sm{padding:5px 9px;font-size:13px}\
.k-btn:disabled{opacity:.45;cursor:default}\
.k-link{border:0;background:none;padding:0;color:var(--blue);cursor:pointer;text-decoration:underline;font-weight:600}\
.k-main{padding:18px 24px}\
.k-note{font-size:13px;color:var(--muted)}\
.k-h2{font-family:'Barlow Condensed',sans-serif;font-weight:700;font-size:22px;margin:0;text-transform:uppercase;letter-spacing:.02em}\
.k-h3{font-size:13px;font-weight:700;color:var(--muted);margin:0 0 8px;text-transform:uppercase;letter-spacing:.06em}\
.k-row{display:flex;flex-wrap:wrap;align-items:center;gap:8px}\
.k-sp{flex:1}\
.k-dot{display:inline-block;width:10px;height:10px;border-radius:50%;flex:none;vertical-align:middle}\
.k-pill{display:inline-flex;align-items:center;gap:5px;border-radius:999px;padding:2px 9px;font-size:12px;font-weight:600;background:var(--soft);white-space:nowrap}\
.k-pill.g{background:#e3f1e8;color:var(--green)}.k-pill.r{background:#f8e1df;color:var(--red)}.k-pill.a{background:#f8ecd6;color:var(--amber)}.k-pill.b{background:#e1ebf5;color:var(--blue)}\
.k-table{width:100%;border-collapse:collapse}.k-table.tasks{table-layout:fixed}.k-table.tasks th:nth-child(1){width:48px}.k-table.tasks th:nth-child(3){width:150px}.k-table.tasks th:nth-child(4){width:90px}.k-table.tasks th:nth-child(5){width:190px}\
.k-table th{font-size:12px;font-weight:700;color:var(--muted);text-align:left;padding:8px 10px;border-bottom:2px solid var(--ink);white-space:nowrap}\
.k-table td{padding:10px;border-bottom:1px solid var(--line);vertical-align:middle}\
.k-table tr.click{cursor:pointer}.k-table tr.click:hover td{background:var(--soft)}\
.k-num{text-align:center;font-variant-numeric:tabular-nums;font-weight:600;white-space:nowrap}\
.k-num.ok{color:var(--green)}.k-num.under{color:var(--amber)}.k-num.over{color:var(--ink)}.k-num.none{color:#b8b3aa;font-weight:400}\
.k-chips{display:flex;flex-wrap:wrap;gap:4px}\
.k-split{display:grid;grid-template-columns:300px minmax(0,1fr);gap:22px;align-items:start}\
.k-list{border:1px solid var(--line);border-radius:10px;overflow:hidden}\
.k-li{display:block;width:100%;text-align:left;border:0;border-bottom:1px solid var(--line);background:#fff;padding:11px 13px;cursor:pointer}\
.k-li:last-child{border-bottom:0}.k-li:hover{background:var(--soft)}\
.k-li[aria-current=true]{background:var(--soft);box-shadow:inset 4px 0 0 var(--ink)}\
.k-li .n{font-weight:700;display:flex;align-items:center;gap:8px}\
.k-li .m{font-size:12px;color:var(--muted);margin-top:3px;display:flex;gap:6px;flex-wrap:wrap}\
.k-card{border:1px solid var(--line);border-radius:10px;padding:16px;background:#fff;margin-bottom:14px}\
.k-card.soft{background:var(--soft);border-color:transparent}\
.k-grid{display:grid;grid-template-columns:repeat(auto-fit,minmax(150px,1fr));gap:12px}\
.k-field{display:flex;flex-direction:column;gap:4px}\
.k-field>span{font-size:12px;font-weight:700;color:var(--muted)}\
.k-in{border:1px solid #d6d1c7;background:#fff;border-radius:7px;padding:8px 10px;font-size:15px;width:100%}\
.k-in:focus,.k-btn:focus-visible,.k-tab:focus-visible,.k-ibtn:focus-visible,.k-li:focus-visible{outline:2px solid var(--blue);outline-offset:1px}\
textarea.k-in{min-height:84px;resize:vertical}\
.k-big{font-family:'Barlow Condensed',sans-serif;font-size:22px;font-weight:700}\
.k-track{display:flex;align-items:center;gap:10px;flex-wrap:wrap;border:2px solid var(--ink);border-radius:10px;padding:12px 14px;margin-bottom:14px}\
.k-track .lbl{font-size:12px;font-weight:700;color:var(--muted);text-transform:uppercase;letter-spacing:.06em}\
.k-track .url{font-weight:700;font-size:16px;overflow-wrap:anywhere;flex:1;min-width:180px}\
.k-counts{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:8px}\
.k-count{background:#fff;border-radius:8px;padding:10px 12px;border:1px solid var(--line)}\
.k-count b{font-family:'Barlow Condensed',sans-serif;font-size:28px;line-height:1;display:block}\
.k-count span{font-size:12px;color:var(--muted)}\
.k-count small{font-size:15px;color:var(--muted);font-weight:600}\
.k-cal{display:grid;gap:6px}\
.k-cal .hd{font-size:12px;font-weight:700;color:var(--muted);text-align:center;text-transform:uppercase}\
.k-day{min-height:96px;border:1px solid var(--line);border-radius:8px;padding:6px;text-align:left;background:#fff;cursor:pointer;display:flex;flex-direction:column;gap:3px}\
.k-day:hover{border-color:var(--ink)}\
.k-day.out{background:transparent;border-style:dashed;cursor:default;opacity:.45}\
.k-day.ep{background:#fbfaf7}\
.k-day.today{box-shadow:inset 0 0 0 2px var(--blue)}\
.k-day .dn{font-weight:700;font-size:13px;display:flex;justify-content:space-between;gap:4px}\
.k-rec{font-size:11px;font-weight:700;color:var(--green);white-space:nowrap}\
.k-rec.no{color:var(--red)}.k-rec.wait{color:#9a948a;font-weight:600}\
.k-chip{display:flex;align-items:center;gap:5px;font-size:12px;font-weight:600;border-radius:5px;padding:2px 6px;color:#fff;overflow:hidden;white-space:nowrap;text-overflow:ellipsis}\
.k-chip i{font-style:normal;opacity:.85;font-weight:700;font-size:11px;flex:none}.k-chip em{font-style:normal;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}\
.k-legend{display:flex;flex-wrap:wrap;gap:6px 14px;font-size:13px;margin:0 0 12px}\
.k-owner{display:inline-flex;align-items:center;gap:6px;font-size:13px;font-weight:600;white-space:nowrap}\
.k-seg{display:inline-flex;border:1px solid var(--line);border-radius:8px;overflow:hidden}\
.k-seg button{border:0;background:#fff;padding:7px 12px;cursor:pointer;font-weight:600;font-size:13px;border-right:1px solid var(--line)}\
.k-seg button:last-child{border-right:0}.k-seg button[aria-pressed=true]{background:var(--ink);color:#fff}\
.k-fchip{border:1px solid var(--line);background:#fff;border-radius:999px;padding:5px 11px;cursor:pointer;font-size:13px;font-weight:600;display:inline-flex;align-items:center;gap:6px}\
.k-fchip[aria-pressed=true]{border-color:var(--ink);background:var(--ink);color:#fff}\
.k-group{margin-bottom:18px}\
.k-group h4{margin:0 0 4px;display:flex;align-items:center;gap:8px;font-size:16px}\
.k-check{width:26px;height:26px;border-radius:6px;border:2px solid #bdb7ac;background:#fff;cursor:pointer;display:inline-grid;place-items:center;font-size:15px;font-weight:800;color:#fff;flex:none}\
.k-check.on{background:var(--green);border-color:var(--green)}\
.k-check:hover{border-color:var(--ink)}\
.k-proof{display:inline-flex;gap:6px;align-items:center;font-size:13px}\
.k-thumb{width:44px;height:30px;object-fit:cover;border-radius:4px;border:1px solid var(--line);cursor:pointer;vertical-align:middle}\
.k-modal-bg{position:fixed;inset:0;background:rgba(20,20,20,.45);display:flex;align-items:flex-start;justify-content:center;padding:4vh 12px;z-index:1000;overflow:auto}\
.k-modal{background:#fff;border-radius:12px;width:min(640px,100%);padding:20px;box-shadow:0 12px 40px rgba(0,0,0,.25)}\
.k-modal.wide{width:min(860px,100%)}\
.k-modal h3{margin:0 0 4px;font-family:'Barlow Condensed',sans-serif;font-size:24px;text-transform:uppercase}\
.k-mfoot{display:flex;justify-content:flex-end;gap:8px;margin-top:18px;flex-wrap:wrap}\
.k-choice{display:grid;grid-template-columns:1fr 1fr;gap:12px;margin-top:14px}\
.k-choice button{border:2px solid var(--line);background:#fff;border-radius:10px;padding:18px;text-align:left;cursor:pointer}\
.k-choice button:hover{border-color:var(--ink)}\
.k-choice b{display:block;font-size:17px;margin-bottom:4px}\
.k-toast{position:fixed;left:50%;bottom:20px;transform:translateX(-50%);background:var(--ink);color:#fff;padding:10px 16px;border-radius:8px;font-size:14px;z-index:1100;max-width:90vw;box-shadow:0 6px 20px rgba(0,0,0,.25)}\
.k-save{font-size:12px;color:var(--muted);white-space:nowrap}.k-save.err{color:var(--red);font-weight:700}\
.k-banner{background:#f8ecd6;color:#6b4708;border-radius:8px;padding:10px 14px;margin-bottom:14px;font-size:14px;display:flex;gap:10px;align-items:center;flex-wrap:wrap}\
.k-empty{padding:28px;text-align:center;color:var(--muted);border:1px dashed var(--line);border-radius:10px}\
.k-foot{padding:14px 24px;border-top:1px solid var(--line);display:flex;flex-wrap:wrap;gap:10px;align-items:center;justify-content:space-between;font-size:13px;color:var(--muted)}\
.k-swatches{display:flex;flex-wrap:wrap;gap:6px}\
.k-sw{width:26px;height:26px;border-radius:50%;border:2px solid #fff;box-shadow:0 0 0 1px var(--line);cursor:pointer}\
.k-sw[aria-pressed=true]{box-shadow:0 0 0 2px var(--ink)}\
.k-extra{display:grid;grid-template-columns:minmax(0,2.2fr) 70px 110px minmax(0,1fr) 36px;gap:6px;align-items:center;margin-bottom:6px}\
.k-mini{font-size:13px;display:flex;flex-wrap:wrap;gap:4px 10px}\
@media(max-width:860px){.k-split{grid-template-columns:1fr}.k-counts{grid-template-columns:repeat(2,minmax(0,1fr))}.k-choice{grid-template-columns:1fr}.k-top,.k-bar,.k-main,.k-foot{padding-left:14px;padding-right:14px}}\
@media(max-width:640px){.k-table.stack thead{display:none}.k-table.stack tr{display:block;border-bottom:1px solid var(--line);padding:8px 0}.k-table.stack td{display:flex;justify-content:space-between;gap:10px;border:0;padding:3px 4px}.k-table.stack td::before{content:attr(data-l);font-size:12px;color:var(--muted);font-weight:700}.k-day{min-height:70px}.k-chip{font-size:10px;padding:1px 4px}.k-extra{grid-template-columns:1fr 60px 1fr}}\
";

/* ------------------------------------------------------------------ mount */
var host = document.getElementById('kcs-portal');
if (!host) { host = document.createElement('div'); host.id = 'kcs-portal'; document.body.appendChild(host); }
if (!document.getElementById('kcs-fonts')) {
  var lk = document.createElement('link'); lk.id = 'kcs-fonts'; lk.rel = 'stylesheet';
  lk.href = 'https://fonts.googleapis.com/css2?family=Barlow+Condensed:wght@600;700;800&family=Barlow:wght@400;500;600;700&display=swap';
  document.head.appendChild(lk);
}
var st = document.createElement('style'); st.textContent = CSS; document.head.appendChild(st);
host.innerHTML = '<div id="kcs"><div class="k-main k-note">Loading the sponsorship board…</div></div>';
var root = document.getElementById('kcs');

function toast(msg) {
  var t = document.createElement('div'); t.className = 'k-toast'; t.textContent = msg; document.body.appendChild(t);
  setTimeout(function () { t.remove(); }, 4200);
}
function paintSave() {
  var el = root.querySelector('#k-save'); if (!el) return;
  el.className = 'k-save' + (saveState === 'error' ? ' err' : '');
  el.textContent = saveState === 'saving' ? 'Saving…' : saveState === 'error' ? lastError : saveState === 'saved' ? 'All changes saved' : (API || DBH ? 'Shared board — changes save for everyone' : 'Saved in this browser only');
}

/* ------------------------------------------------------------------ small renderers */
function ownerTag(id) {
  var t = team(id); if (!t) return '<span class="k-owner k-note">Unassigned</span>';
  return '<span class="k-owner"><span class="k-dot" style="background:' + esc(t.color) + '"></span>' + esc(t.name) + '</span>';
}
function ownerSelect(name, val, attrs) {
  return '<select class="k-in" name="' + name + '" ' + (attrs || '') + '><option value="">Unassigned</option>' +
    D.team.map(function (t) { return '<option value="' + esc(t.id) + '"' + (t.id === val ? ' selected' : '') + '>' + esc(t.name) + (t.title ? ' — ' + esc(t.title) : '') + '</option>'; }).join('') + '</select>';
}
function sponsorDot(s) { return '<span class="k-dot" style="background:' + esc(s.color) + '"></span>'; }
function statusPill(s) { var c = { Active: 'g', Contracted: 'b', Prospecting: '', Completed: '' }[s] || ''; return '<span class="k-pill ' + c + '">' + esc(s) + '</span>'; }
function countCell(have, want) {
  if (!want && !have) return '<td class="k-num none" data-l="">—</td>';
  var cls = !want ? 'over' : have === want ? 'ok' : have < want ? 'under' : 'over';
  return '<td class="k-num ' + cls + '"' + (cls === 'over' ? ' title="More than the package includes"' : '') + '>' + have + (want ? '<span class="k-note"> / ' + want + '</span>' : '') + '</td>';
}
function dueTag(t) {
  if (t.status === 'done') return '';
  if (!t.due) return '<span class="k-note">No due date</span>';
  var n = daysUntil(t.due);
  if (n < 0) return '<span class="k-pill r">Overdue ' + (-n) + 'd</span>';
  if (n <= 3) return '<span class="k-pill a">Due ' + (n === 0 ? 'today' : 'in ' + n + 'd') + '</span>';
  return '';
}
function taskTitle(t) { return t.title + (t.qty > 1 ? ' ×' + t.qty : ''); }

/* ------------------------------------------------------------------ shell */
function render() {
  var m = UI.month;
  var active = D.sponsors.filter(function (s) { return activeIn(s, m); });
  var pl = D.placements.filter(function (p) { return monthOf(p.date) === m; });
  var epDates = {}; pl.forEach(function (p) { epDates[p.date] = 1; });
  var openM = D.tasks.filter(function (t) { return t.month === m && t.status !== 'done'; }).length;
  var overdue = D.tasks.filter(isOverdue).length;
  var ending = D.sponsors.filter(endingSoon).length;
  var tabs = [['month', 'Month'], ['sponsors', 'Sponsors'], ['calendar', 'Calendar'], ['tasks', 'Tasks']];
  root.innerHTML =
    '<header class="k-top"><div><div class="k-eyebrow">Sponsorship board</div><h1 class="k-title">The Kirk Cameron Show</h1></div>' +
    '<div class="k-stats">' +
      '<div class="k-stat"><b>' + active.length + '</b><span>sponsors in ' + monthName(m, true).split(' ')[0] + '</span></div>' +
      '<div class="k-stat"><b>' + pl.length + '</b><span>placements on ' + Object.keys(epDates).length + ' episodes</span></div>' +
      '<button class="k-stat" data-act="go-open"><b>' + openM + '</b><span>open tasks</span></button>' +
      '<button class="k-stat ' + (overdue ? 'bad' : '') + '" data-act="go-overdue" title="See every overdue task"><b>' + overdue + '</b><span>overdue</span></button>' +
      '<button class="k-stat ' + (ending ? 'warn' : '') + '" data-act="go-ending" title="Deals ending in 30 days without auto-renew"><b>' + ending + '</b><span>ending soon</span></button>' +
    '</div></header>' +
    '<nav class="k-bar"><div class="k-tabs" role="tablist">' + tabs.map(function (t) {
      return '<button class="k-tab" role="tab" data-act="tab" data-v="' + t[0] + '" aria-selected="' + (UI.tab === t[0]) + '">' + t[1] + '</button>';
    }).join('') + '</div>' +
    '<div class="k-month"><button class="k-ibtn" data-act="month" data-v="-1" aria-label="Previous month">‹</button><b>' + monthName(m) + '</b>' +
    '<button class="k-ibtn" data-act="month" data-v="1" aria-label="Next month">›</button>' +
    (m !== thisMonth() ? '<button class="k-btn sm" data-act="month" data-v="0">This month</button>' : '') + '</div></nav>' +
    '<main class="k-main">' + view() + '</main>' +
    '<footer class="k-foot"><span id="k-save" class="k-save"></span><span class="k-row">' +
      '<button class="k-link" data-act="team">Team</button> · <button class="k-link" data-act="types">Deliverable types</button> · <button class="k-link" data-act="data">Backup &amp; import</button></span></footer>';
  paintSave();
  if (UI.modal) renderModal();
}
function view() {
  if (!D.sponsors.length && UI.tab !== 'tasks') {
    return '<div class="k-empty"><p class="k-big" style="margin:0 0 6px">No sponsors yet</p><p>Bring everything over from Caleb\'s old board, or add the first sponsor.</p>' +
      '<div class="k-row" style="justify-content:center"><button class="k-btn pri" data-act="data">Import old board backup</button><button class="k-btn" data-act="new-sponsor">New sponsor</button></div></div>';
  }
  if (UI.tab === 'sponsors') return viewSponsors();
  if (UI.tab === 'calendar') return viewCalendar();
  if (UI.tab === 'tasks') return viewTasks();
  return viewMonth();
}

/* ------------------------------------------------------------------ Month overview */
function viewMonth() {
  var m = UI.month;
  var rows = D.sponsors.filter(function (s) { return UI.showQuiet ? s.status !== 'Completed' || activeIn(s, m) : activeIn(s, m); })
    .sort(function (a, b) { return a.name.localeCompare(b.name); });
  var hidden = D.sponsors.filter(function (s) { return !activeIn(s, m) && s.status !== 'Completed'; }).length;
  var body = rows.map(function (s) {
    var c = slotCounts(s.id, m), p = s.pkg, inT = inTerm(s, m);
    var ts = tasksFor(s.id, m), done = ts.filter(function (t) { return t.status === 'done'; }).length, od = ts.filter(isOverdue).length;
    var others = {}; ts.forEach(function (t) { if (t.typeId) { var k = t.title; others[k] = others[k] || { n: 0, done: 0 }; others[k].n += (t.qty || 1); if (t.status === 'done') others[k].done += (t.qty || 1); } });
    var owners = {}; ts.forEach(function (t) { if (t.status !== 'done' && t.owner) owners[t.owner] = 1; });
    return '<tr class="click" data-act="open-sponsor" data-id="' + s.id + '">' +
      '<td data-l="Sponsor"><span class="k-row" style="flex-wrap:nowrap">' + sponsorDot(s) + '<b>' + esc(s.name) + '</b></span>' +
        (endingSoon(s) ? ' <span class="k-pill a">ends ' + fmtDate(s.endDate) + '</span>' : '') + '</td>' +
      '<td data-l="Status">' + statusPill(s.status) + '</td>' +
      countCell(c.episodes, inT ? p.episodesPerMonth : 0).replace('<td', '<td data-l="Episodes"') +
      countCell(c.early, inT ? p.early : 0).replace('<td', '<td data-l="Early"') +
      countCell(c.mid, inT ? p.mid : 0).replace('<td', '<td data-l="Mid"') +
      countCell(c.late, inT ? p.late : 0).replace('<td', '<td data-l="Late"') +
      '<td data-l="Other deliverables"><div class="k-chips">' + (Object.keys(others).map(function (k) {
        var o = others[k]; return '<span class="k-pill ' + (o.done >= o.n ? 'g' : '') + '">' + esc(k.replace(/ — .*$/, '')) + ' ×' + o.n + '</span>';
      }).join('') || '<span class="k-note">—</span>') + '</div></td>' +
      '<td data-l="Tasks">' + (ts.length ? '<span class="k-row" style="flex-wrap:nowrap"><b>' + done + '/' + ts.length + '</b>' +
        Object.keys(owners).map(function (o) { var t = team(o); return t ? '<span class="k-dot" title="' + esc(t.name) + '" style="background:' + esc(t.color) + '"></span>' : ''; }).join('') +
        (od ? '<span class="k-pill r">' + od + ' overdue</span>' : '') + '</span>' : '<span class="k-note">—</span>') + '</td>' +
      '<td style="width:20px;color:var(--muted)">›</td></tr>';
  }).join('');
  return '<div class="k-row" style="margin-bottom:10px"><h2 class="k-h2">' + monthName(UI.month) + ' at a glance</h2><span class="k-sp"></span>' +
    '<label class="k-row k-note"><input type="checkbox" data-act="toggle-quiet" ' + (UI.showQuiet ? 'checked' : '') + '> Show sponsors with nothing this month' + (hidden && !UI.showQuiet ? ' (' + hidden + ')' : '') + '</label>' +
    '<button class="k-btn pri" data-act="new-sponsor">+ New sponsor</button></div>' +
    '<p class="k-note" style="margin:0 0 10px">Placement counts are booked / bought. Green = on target, amber = still to book. Dates are on the Calendar.</p>' +
    (rows.length ? '<div style="overflow-x:auto"><table class="k-table stack"><thead><tr><th>Sponsor</th><th>Status</th><th style="text-align:center">Episodes</th><th style="text-align:center">Early</th><th style="text-align:center">Mid</th><th style="text-align:center">Late</th><th>Other deliverables</th><th>Tasks</th><th></th></tr></thead><tbody>' + body + '</tbody></table></div>'
      : '<div class="k-empty">Nothing booked for ' + monthName(m) + ' yet.</div>');
}

/* ------------------------------------------------------------------ Sponsors */
function viewSponsors() {
  var q = UI.search.toLowerCase();
  var list = D.sponsors.filter(function (s) {
    if (q && s.name.toLowerCase().indexOf(q) < 0) return false;
    if (UI.endingOnly) return endingSoon(s);
    if (UI.statusFilter === 'current') return s.status !== 'Completed';
    if (UI.statusFilter !== 'all') return s.status === UI.statusFilter;
    return true;
  }).sort(function (a, b) { return a.name.localeCompare(b.name); });
  if (!UI.sponsorId || !sponsor(UI.sponsorId)) UI.sponsorId = list[0] ? list[0].id : D.sponsors[0].id;
  var s = sponsor(UI.sponsorId);
  return '<div class="k-split"><aside>' +
    '<button class="k-btn pri" style="width:100%;margin-bottom:10px" data-act="new-sponsor">+ New sponsor</button>' +
    '<div class="k-row" style="margin-bottom:8px;flex-wrap:nowrap"><input class="k-in" type="search" placeholder="Search sponsors" value="' + esc(UI.search) + '" data-act="search" aria-label="Search sponsors">' +
    '<select class="k-in" style="width:auto;min-width:110px" data-act="status-filter" aria-label="Filter by status">' +
      [['current', 'Current'], ['all', 'All']].concat(STATUSES.map(function (x) { return [x, x]; })).map(function (o) { return '<option value="' + o[0] + '"' + (UI.statusFilter === o[0] ? ' selected' : '') + '>' + o[1] + '</option>'; }).join('') + '</select></div>' +
    (UI.endingOnly ? '<div class="k-banner">Showing deals ending within 30 days. <button class="k-link" data-act="clear-ending">Show all</button></div>' : '') +
    '<div class="k-list">' + (list.map(function (x) {
      var ts = tasksFor(x.id, UI.month), od = D.tasks.filter(function (t) { return t.sponsorId === x.id && isOverdue(t); }).length;
      return '<button class="k-li" data-act="pick-sponsor" data-id="' + x.id + '" aria-current="' + (x.id === UI.sponsorId) + '"><span class="n">' + sponsorDot(x) + esc(x.name) + '</span>' +
        '<span class="m">' + statusPill(x.status) + (x.tier ? '<span>' + esc(x.tier) + '</span>' : '') + (endingSoon(x) ? '<span class="k-pill a">ends soon</span>' : '') +
        (od ? '<span class="k-pill r">' + od + ' overdue</span>' : '') + '</span></button>';
    }).join('') || '<div class="k-empty" style="border:0">No matches</div>') + '</div></aside>' +
    '<section>' + sponsorDetail(s) + '</section></div>';
}
function sponsorDetail(s) {
  var m = UI.month, c = slotCounts(s.id, m), p = s.pkg, inT = inTerm(s, m);
  var pl = placementsFor(s.id, m).sort(by('date'));
  var byDate = {}; pl.forEach(function (x) { (byDate[x.date] = byDate[x.date] || []).push(x); });
  var ts = tasksFor(s.id, m).sort(by('due'));
  var setup = D.tasks.filter(function (t) { return t.sponsorId === s.id && !t.month; });
  function cnt(label, have, want) {
    return '<div class="k-count"><b>' + have + (want || !have ? '<small> / ' + (want || 0) + '</small>' : '') + '</b><span>' + label + '</span></div>';
  }
  return '' +
    '<div class="k-row" style="margin-bottom:12px"><span class="k-dot" style="width:18px;height:18px;background:' + esc(s.color) + '"></span>' +
      '<input class="k-in k-name" style="flex:1;min-width:200px" value="' + esc(s.name) + '" data-f="name" aria-label="Sponsor name">' +
      '<select class="k-in" style="width:auto" data-f="status" aria-label="Status">' + STATUSES.map(function (x) { return '<option' + (x === s.status ? ' selected' : '') + '>' + x + '</option>'; }).join('') + '</select>' +
      '<button class="k-btn sm" data-act="color">Color</button><button class="k-btn sm red" data-act="delete-sponsor">Delete</button></div>' +

    '<div class="k-track"><div style="flex:1;min-width:200px"><div class="lbl">Master tracking link</div>' +
      (s.trackingLink ? '<div class="url">' + (isUrl(s.trackingLink) ? '<a href="' + esc(s.trackingLink) + '" target="_blank" rel="noopener">' + esc(s.trackingLink) + '</a>' : esc(s.trackingLink)) + '</div>' : '<div class="url k-note">Not added yet — this is the one link we push listeners to.</div>') + '</div>' +
      (s.trackingLink ? '<button class="k-btn sm" data-act="copy" data-v="' + esc(s.trackingLink) + '">Copy</button>' : '') +
      '<button class="k-btn sm" data-act="edit-links">' + (s.trackingLink ? 'Edit' : 'Add link') + '</button>' +
      (s.driveLink ? '<a class="k-btn sm" style="text-decoration:none;color:inherit" href="' + esc(s.driveLink) + '" target="_blank" rel="noopener">Drive folder ↗</a>' : '') + '</div>' +

    '<div class="k-card soft"><div class="k-row" style="margin-bottom:10px"><h3 class="k-h3" style="margin:0">' + monthName(m) + '</h3><span class="k-sp"></span>' +
      '<button class="k-btn sm" data-act="apply-pkg">Apply package to ' + monthName(m, true).split(' ')[0] + '</button>' +
      '<button class="k-btn sm pri" data-act="add-booking">+ Add booking</button></div>' +
      (!inT && !pl.length && !ts.length ? '<p class="k-note" style="margin:0 0 10px">Outside this sponsor\'s contract term' + (s.status === 'Prospecting' ? ' (still prospecting)' : '') + '.</p>' : '') +
      '<div class="k-counts">' + cnt('Episodes', c.episodes, inT ? p.episodesPerMonth : 0) + cnt('Early rolls', c.early, inT ? p.early : 0) + cnt('Mid rolls', c.mid, inT ? p.mid : 0) + cnt('Late rolls', c.late, inT ? p.late : 0) + '</div>' +
      (pl.length ? '<div class="k-mini" style="margin-top:10px">' + Object.keys(byDate).map(function (d) {
        return '<span><b>' + fmtDate(d) + '</b> ' + byDate[d].map(function (x) { return slotLabel(x.slot) + (x.format && x.format !== 'Both' ? ' (' + x.format + ')' : ''); }).join(', ') + '</span>';
      }).join('') + ' <button class="k-link" data-act="tab" data-v="calendar">Calendar ›</button></div>' : '') +
      '<div style="margin-top:12px">' + (ts.length ? taskTable(ts, false) : '<p class="k-note" style="margin:0">No deliverables or tasks for this month yet.</p>') + '</div></div>' +

    '<div class="k-card"><div class="k-row" style="margin-bottom:10px"><h3 class="k-h3" style="margin:0">What they bought</h3><span class="k-sp"></span><span class="k-note">Deals are often custom — change anything.</span></div>' +
      '<div class="k-grid">' +
        fieldNum('Episodes / month', 'pkg.episodesPerMonth', p.episodesPerMonth) + fieldNum('Early rolls / month', 'pkg.early', p.early) +
        fieldNum('Mid rolls / month', 'pkg.mid', p.mid) + fieldNum('Late rolls / month', 'pkg.late', p.late) +
      '</div><div class="k-grid" style="margin-top:12px">' +
        '<label class="k-field"><span>Package name</span><input class="k-in" data-f="tier" value="' + esc(s.tier || '') + '" placeholder="Standard, Priority, custom…" list="k-tiers"><datalist id="k-tiers"><option>Standard</option><option>Priority</option><option>Premiere</option><option>Late Roll</option><option>Custom</option></datalist></label>' +
        '<label class="k-field"><span>Start date</span><input class="k-in" type="date" data-f="startDate" value="' + esc(s.startDate || '') + '"></label>' +
        '<label class="k-field"><span>End date</span><input class="k-in" type="date" data-f="endDate" value="' + esc(s.endDate || '') + '"></label>' +
        '<label class="k-field"><span>Renewal</span><select class="k-in" data-f="autoRenews"><option value="1"' + (s.autoRenews ? ' selected' : '') + '>Auto-renews</option><option value="0"' + (!s.autoRenews ? ' selected' : '') + '>Ends on end date</option></select></label>' +
      '</div>' +
      '<h3 class="k-h3" style="margin:16px 0 8px">Also included</h3>' +
      (p.extras.length ? p.extras.map(function (e) {
        return '<div class="k-extra"><select class="k-in" data-x="' + e.id + '" data-k="typeId">' + typeOptions(e.typeId) + '</select>' +
          '<input class="k-in" type="number" min="0" data-x="' + e.id + '" data-k="qty" value="' + num(e.qty) + '" aria-label="Quantity">' +
          '<select class="k-in" data-x="' + e.id + '" data-k="per"><option value="month"' + (e.per !== 'term' ? ' selected' : '') + '>per month</option><option value="term"' + (e.per === 'term' ? ' selected' : '') + '>whole deal</option></select>' +
          ownerSelect('o', e.owner, 'data-x="' + e.id + '" data-k="owner" aria-label="Owner"') +
          '<button class="k-ibtn" data-act="del-extra" data-id="' + e.id + '" aria-label="Remove">×</button></div>';
      }).join('') : '<p class="k-note" style="margin:0 0 8px">Nothing beyond episode placements.</p>') +
      '<button class="k-btn sm" data-act="add-extra">+ Add included item</button></div>' +

    (setup.length ? '<div class="k-card"><h3 class="k-h3">Deal setup tasks</h3>' + taskTable(setup, false) + '</div>' : '') +

    '<div class="k-card"><h3 class="k-h3">Contact &amp; notes</h3><div class="k-grid">' +
      '<label class="k-field"><span>Sponsor contact</span><input class="k-in" data-f="contactName" value="' + esc(s.contactName || '') + '"></label>' +
      '<label class="k-field"><span>Contact email</span><input class="k-in" type="email" data-f="contactEmail" value="' + esc(s.contactEmail || '') + '"></label></div>' +
      '<label class="k-field" style="margin-top:12px"><span>Notes</span><textarea class="k-in" data-f="notes">' + esc(s.notes || '') + '</textarea></label></div>';
}
function fieldNum(label, f, v) { return '<label class="k-field"><span>' + label + '</span><input class="k-in" type="number" min="0" data-f="' + f + '" value="' + num(v) + '"></label>'; }
function typeOptions(sel) { return D.types.map(function (t) { return '<option value="' + esc(t.id) + '"' + (t.id === sel ? ' selected' : '') + '>' + esc(t.name) + '</option>'; }).join(''); }
function slotLabel(id) { for (var i = 0; i < SLOTS.length; i++) if (SLOTS[i].id === id) return SLOTS[i].label; return id; }

/* ------------------------------------------------------------------ Calendar */
function viewCalendar() {
  var m = UI.month, first = parseD(m + '-01'), last = parseD(monthEnd(m));
  var pl = D.placements.filter(function (p) { return monthOf(p.date) === m; });
  var weekend = pl.some(function (p) { var d = parseD(p.date).getDay(); return d === 0 || d === 6; });
  var cols = weekend ? [0, 1, 2, 3, 4, 5, 6] : [1, 2, 3, 4, 5];
  var names = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  var used = {}; pl.forEach(function (p) { used[p.sponsorId] = 1; });
  var cells = [];
  var start = new Date(first); while (start.getDay() !== cols[0]) start.setDate(start.getDate() - 1);
  for (var d = new Date(start); d <= last || cells.length % cols.length; d.setDate(d.getDate() + 1)) {
    if (cols.indexOf(d.getDay()) < 0) continue;
    cells.push(ymd(d));
    if (cells.length > 42) break;
  }
  var td = today();
  var html = cells.map(function (ds) {
    if (monthOf(ds) !== m) return '<div class="k-day out" aria-hidden="true"><div class="dn">' + parseD(ds).getDate() + '</div></div>';
    var info = D.days[ds] || {}, ps = pl.filter(function (p) { return p.date === ds; }).sort(function (a, b) { return slotIdx(a.slot) - slotIdx(b.slot); });
    var ep = isEpisodeDay(ds) || ps.length || info.recorded;
    var rec = '';
    if (info.recorded) rec = '<span class="k-rec" title="Recorded' + (info.recordedOn ? ' on ' + fmtDate(info.recordedOn, true) : '') + '">✱ ' + (info.recordedOn ? 'Rec ' + (parseD(info.recordedOn).getMonth() + 1) + '/' + parseD(info.recordedOn).getDate() : 'Recorded') + '</span>';
    else if (ep && ds <= td) rec = '<span class="k-rec no">Not recorded</span>';
    else if (ep && ps.length) rec = '<span class="k-rec wait">Not rec.</span>';
    return '<button class="k-day' + (ep ? ' ep' : '') + (ds === td ? ' today' : '') + '" data-act="day" data-v="' + ds + '" aria-label="' + fmtDate(ds, true) + ', ' + ps.length + ' placements">' +
      '<div class="dn"><span>' + parseD(ds).getDate() + '</span>' + rec + '</div>' +
      ps.map(function (p) { var s = sponsor(p.sponsorId) || { name: 'Unknown', color: '#999' };
        return '<span class="k-chip" style="background:' + esc(s.color) + '" title="' + esc(slotLabel(p.slot) + ' — ' + s.name + (p.format !== 'Both' ? ' (' + p.format + ' only)' : '')) + '"><i>' + shortSlot(p.slot) + '</i><em>' + esc(s.name) + '</em>' + (p.format && p.format !== 'Both' ? ' <i>' + (p.format === 'Video' ? '▶' : '♪') + '</i>' : '') + '</span>';
      }).join('') + '</button>';
  }).join('');
  var legend = D.sponsors.filter(function (s) { return used[s.id]; }).sort(function (a, b) { return a.name.localeCompare(b.name); });
  return '<div class="k-row" style="margin-bottom:8px"><h2 class="k-h2">Calendar</h2><span class="k-sp"></span><span class="k-note">E = early · M1/M2 = mid · L = late · ▶ video only · ♪ audio only · ✱ recorded (date recorded)</span></div>' +
    (legend.length ? '<div class="k-legend">' + legend.map(function (s) { return '<span class="k-row" style="gap:6px">' + sponsorDot(s) + esc(s.name) + '</span>'; }).join('') + '</div>' : '<p class="k-note">No placements booked this month. Click an episode day to add one.</p>') +
    '<div class="k-cal" style="grid-template-columns:repeat(' + cols.length + ',minmax(0,1fr))">' + cols.map(function (c) { return '<div class="hd">' + names[c] + '</div>'; }).join('') + html + '</div>';
}
function slotIdx(id) { for (var i = 0; i < SLOTS.length; i++) if (SLOTS[i].id === id) return i; return 9; }
function shortSlot(id) { for (var i = 0; i < SLOTS.length; i++) if (SLOTS[i].id === id) return SLOTS[i].short; return '?'; }

/* ------------------------------------------------------------------ Tasks */
function taskTable(ts, showSponsor) {
  return '<table class="k-table stack' + (showSponsor ? '' : ' tasks') + '"><thead><tr><th></th><th>Task</th>' + (showSponsor ? '<th>Sponsor</th>' : '') + '<th>Owner</th><th>Due</th><th>Proof / notes</th></tr></thead><tbody>' +
    ts.map(function (t) {
      var s = sponsor(t.sponsorId);
      return '<tr><td data-l=""><button class="k-check' + (t.status === 'done' ? ' on' : '') + '" data-act="toggle-task" data-id="' + t.id + '" aria-label="' + (t.status === 'done' ? 'Mark not done' : 'Mark done') + '">' + (t.status === 'done' ? '✓' : '') + '</button></td>' +
        '<td data-l="Task"><button class="k-link" style="color:var(--ink);text-decoration:none;text-align:left" data-act="edit-task" data-id="' + t.id + '">' + esc(taskTitle(t)) + '</button> ' + dueTag(t) +
          (t.status === 'progress' ? ' <span class="k-pill b">In progress</span>' : '') + '</td>' +
        (showSponsor ? '<td data-l="Sponsor">' + (s ? '<span class="k-row" style="flex-wrap:nowrap;gap:6px">' + sponsorDot(s) + esc(s.name) + '</span>' : '—') + '</td>' : '') +
        '<td data-l="Owner">' + ownerTag(t.owner) + '</td>' +
        '<td data-l="Due" style="white-space:nowrap">' + (t.due ? fmtDate(t.due) : '<span class="k-note">—</span>') + '</td>' +
        '<td data-l="Proof">' + proofCell(t) + '</td></tr>';
    }).join('') + '</tbody></table>';
}
function proofCell(t) {
  var p = t.proof || {}, out = [];
  if (p.url) out.push('<a href="' + esc(p.url) + '" target="_blank" rel="noopener">Link ↗</a>');
  if (p.image) out.push(/^data:/.test(p.image) ? '<img class="k-thumb" alt="Screenshot proof" src="' + esc(p.image) + '" data-act="view-img" data-id="' + t.id + '">' : '<a href="' + esc(p.image) + '" target="_blank" rel="noopener">Screenshot ↗</a>');
  if (t.status === 'done' && !p.url && !p.image) out.push('<span class="k-pill a">No proof</span>');
  if (t.notes) out.push('<span class="k-note" title="' + esc(t.notes) + '">' + esc(t.notes.length > 40 ? t.notes.slice(0, 40) + '…' : t.notes) + '</span>');
  return '<span class="k-proof">' + (out.join(' ') || '<span class="k-note">—</span>') + '</span>';
}
function viewTasks() {
  var m = UI.month;
  var ts = UI.overdueAll ? D.tasks.filter(isOverdue) : D.tasks.filter(function (t) { return t.month === m; });
  if (UI.owner !== 'all') ts = ts.filter(function (t) { return UI.owner === 'none' ? !t.owner : t.owner === UI.owner; });
  var counts = { open: 0, overdue: 0, done: 0, all: ts.length };
  ts.forEach(function (t) { if (t.status === 'done') counts.done++; else counts.open++; if (isOverdue(t)) counts.overdue++; });
  if (!UI.overdueAll) ts = ts.filter(function (t) { return UI.taskView === 'all' ? true : UI.taskView === 'done' ? t.status === 'done' : UI.taskView === 'overdue' ? isOverdue(t) : t.status !== 'done'; });
  var groups = {}; ts.forEach(function (t) { (groups[t.sponsorId || '_'] = groups[t.sponsorId || '_'] || []).push(t); });
  var keys = Object.keys(groups).sort(function (a, b) { var x = sponsor(a), y = sponsor(b); return (x ? x.name : 'zzz').localeCompare(y ? y.name : 'zzz'); });
  return '<div class="k-row" style="margin-bottom:12px"><h2 class="k-h2">' + (UI.overdueAll ? 'Overdue — all months' : 'Tasks · ' + monthName(m)) + '</h2><span class="k-sp"></span>' +
      '<button class="k-btn pri" data-act="new-task">+ Add task</button></div>' +
    (UI.overdueAll ? '<div class="k-banner">Showing every overdue task, from any month. <button class="k-link" data-act="clear-overdue">Back to ' + monthName(m) + '</button></div>' : '') +
    '<div class="k-row" style="margin-bottom:10px">' +
      '<button class="k-fchip" data-act="owner" data-v="all" aria-pressed="' + (UI.owner === 'all') + '">Everyone</button>' +
      D.team.map(function (t) { return '<button class="k-fchip" data-act="owner" data-v="' + esc(t.id) + '" aria-pressed="' + (UI.owner === t.id) + '"><span class="k-dot" style="background:' + esc(t.color) + '"></span>' + esc(t.name) + '</button>'; }).join('') +
      '<button class="k-fchip" data-act="owner" data-v="none" aria-pressed="' + (UI.owner === 'none') + '">Unassigned</button></div>' +
    (UI.overdueAll ? '' : '<div class="k-row" style="margin-bottom:16px"><div class="k-seg" role="group" aria-label="Show">' +
      [['open', 'To do'], ['overdue', 'Overdue'], ['done', 'Done'], ['all', 'All']].map(function (o) {
        return '<button data-act="task-view" data-v="' + o[0] + '" aria-pressed="' + (UI.taskView === o[0]) + '">' + o[1] + ' <span style="opacity:.7">' + counts[o[0]] + '</span></button>';
      }).join('') + '</div></div>') +
    (keys.length ? keys.map(function (k) {
      var s = sponsor(k);
      return '<div class="k-group"><h4>' + (s ? sponsorDot(s) + '<button class="k-link" style="color:var(--ink);text-decoration:none;font-size:16px" data-act="open-sponsor" data-id="' + s.id + '">' + esc(s.name) + '</button>' : 'General') + '</h4>' +
        taskTable(groups[k].sort(function (a, b) { return (a.status === 'done') - (b.status === 'done') || (a.due || '9') .localeCompare(b.due || '9'); }), false) + '</div>';
    }).join('') : '<div class="k-empty">' + (UI.overdueAll ? 'Nothing overdue. Nice.' : 'No tasks match. Use “Apply package” on a sponsor to create this month\'s deliverables.') + '</div>');
}

/* ------------------------------------------------------------------ modals */
function openModal(kind, arg) { UI.modal = { kind: kind, arg: arg || {} }; renderModal(); }
function closeModal() { UI.modal = null; needRender = false; var bg = document.getElementById('k-modal'); if (bg) bg.remove(); render(); }
function renderModal() {
  var old = document.getElementById('k-modal'); if (old) old.remove();
  var md = UI.modal; if (!md) return;
  var html = MODALS[md.kind](md.arg);
  var bg = document.createElement('div'); bg.className = 'k-modal-bg'; bg.id = 'k-modal';
  bg.innerHTML = '<div class="k-modal' + (/wide/.test(html.slice(0, 20)) ? ' wide' : '') + '" role="dialog" aria-modal="true">' + html.replace(/^wide/, '') + '</div>';
  root.appendChild(bg);
  var f = bg.querySelector('[autofocus]') || bg.querySelector('input,select,textarea'); if (f) try { f.focus(); } catch (e) {}
}
function formVals(scope) {
  var o = {}; (scope || document.getElementById('k-modal')).querySelectorAll('[name]').forEach(function (el) { o[el.name] = el.type === 'checkbox' ? el.checked : el.value; }); return o;
}
var MODALS = {
  confirm: function (a) { return '<h3>' + esc(a.title) + '</h3><p>' + esc(a.body) + '</p><div class="k-mfoot"><button class="k-btn" data-act="close">Cancel</button><button class="k-btn pri" data-act="confirm-yes">' + esc(a.yes || 'Yes') + '</button></div>'; },
  color: function () {
    var s = sponsor(UI.sponsorId);
    return '<h3>Color for ' + esc(s.name) + '</h3><p class="k-note">Used on the calendar and everywhere this sponsor shows up.</p><div class="k-swatches">' +
      SPONSOR_COLORS.map(function (c) { return '<button class="k-sw" style="background:' + c + '" data-act="pick-color" data-v="' + c + '" aria-pressed="' + (c === s.color) + '" aria-label="' + c + '"></button>'; }).join('') +
      '</div><label class="k-field" style="margin-top:14px;max-width:200px"><span>Or any color</span><input type="color" class="k-in" style="height:40px;padding:2px" value="' + esc(s.color) + '" data-act="pick-color-any"></label><div class="k-mfoot"><button class="k-btn" data-act="close">Done</button></div>';
  },
  links: function () {
    var s = sponsor(UI.sponsorId);
    return '<h3>Links</h3><label class="k-field"><span>Master tracking link (the one link we push listeners to)</span><input class="k-in" name="trackingLink" value="' + esc(s.trackingLink || '') + '" placeholder="https://…" autofocus></label>' +
      '<label class="k-field" style="margin-top:12px"><span>Google Drive folder</span><input class="k-in" name="driveLink" value="' + esc(s.driveLink || '') + '" placeholder="https://drive.google.com/…"></label>' +
      '<div class="k-mfoot"><button class="k-btn" data-act="close">Cancel</button><button class="k-btn pri" data-act="save-links">Save</button></div>';
  },
  newSponsor: function () {
    return '<h3>New sponsor</h3><p class="k-note">How do you want to start?</p><div class="k-choice">' +
      '<button data-act="ns-guided"><b>Guided setup</b>Fill in the deal step by step. Good for custom deals.</button>' +
      '<button data-act="ns-import"><b>Import from contract</b>Paste the contract text and we pre-fill what we can find. You review before saving.</button></div>' +
      '<div class="k-mfoot"><button class="k-btn" data-act="close">Cancel</button></div>';
  },
  importContract: function () {
    return 'wide<h3>Import from contract</h3><p class="k-note">Open the contract (Word, PDF or Google Doc), select all, copy, and paste it here. A .txt file works too.</p>' +
      '<textarea class="k-in" name="text" style="min-height:240px" placeholder="Paste contract text…" autofocus></textarea>' +
      '<div class="k-row" style="margin-top:8px"><input type="file" accept=".txt,.md,text/plain" data-act="contract-file" aria-label="Load a .txt file"></div>' +
      '<div class="k-mfoot"><button class="k-btn" data-act="new-sponsor">Back</button><button class="k-btn pri" data-act="ns-parse">Read contract</button></div>';
  },
  guided: function (a) {
    var g = a.draft || { pkg: { extras: [] } }, pk = g.pkg || { extras: [] };
    return 'wide<h3>' + (a.fromContract ? 'Check what we found' : 'Guided setup') + '</h3>' +
      (a.found ? '<div class="k-banner">' + esc(a.found) + '</div>' : '') +
      '<h3 class="k-h3" style="margin-top:12px">1 · The sponsor</h3><div class="k-grid">' +
        '<label class="k-field"><span>Sponsor name *</span><input class="k-in" name="name" value="' + esc(g.name || '') + '" autofocus></label>' +
        '<label class="k-field"><span>Contact</span><input class="k-in" name="contactName" value="' + esc(g.contactName || '') + '"></label>' +
        '<label class="k-field"><span>Contact email</span><input class="k-in" name="contactEmail" value="' + esc(g.contactEmail || '') + '"></label>' +
        '<label class="k-field"><span>Status</span><select class="k-in" name="status">' + STATUSES.map(function (x) { return '<option' + (x === (g.status || 'Contracted') ? ' selected' : '') + '>' + x + '</option>'; }).join('') + '</select></label></div>' +
      '<label class="k-field" style="margin-top:12px"><span>Master tracking link</span><input class="k-in" name="trackingLink" value="' + esc(g.trackingLink || '') + '" placeholder="https://…"></label>' +
      '<h3 class="k-h3" style="margin-top:18px">2 · The deal</h3><div class="k-grid">' +
        '<label class="k-field"><span>Package name</span><input class="k-in" name="tier" value="' + esc(g.tier || '') + '" list="k-tiers2" placeholder="Standard, Priority, custom…"><datalist id="k-tiers2"><option>Standard</option><option>Priority</option><option>Premiere</option><option>Late Roll</option><option>Custom</option></datalist></label>' +
        '<label class="k-field"><span>Start date</span><input class="k-in" type="date" name="startDate" value="' + esc(g.startDate || '') + '"></label>' +
        '<label class="k-field"><span>Length (months)</span><input class="k-in" type="number" min="1" name="months" value="' + (g.months || 6) + '"></label>' +
        '<label class="k-field"><span>Renewal</span><select class="k-in" name="autoRenews"><option value="0">Ends after term</option><option value="1"' + (g.autoRenews ? ' selected' : '') + '>Auto-renews</option></select></label></div>' +
      '<div class="k-grid" style="margin-top:12px">' +
        ['episodesPerMonth|Episodes / month', 'early|Early rolls / month', 'mid|Mid rolls / month', 'late|Late rolls / month'].map(function (x) { var p = x.split('|');
          return '<label class="k-field"><span>' + p[1] + '</span><input class="k-in" type="number" min="0" name="' + p[0] + '" value="' + num(pk[p[0]]) + '"></label>'; }).join('') + '</div>' +
      '<h3 class="k-h3" style="margin-top:18px">3 · Anything else included</h3><div id="k-gx">' + (pk.extras.length ? pk.extras : []).map(extraRow).join('') + '</div>' +
      '<button class="k-btn sm" data-act="gx-add">+ Add item</button>' +
      '<label class="k-row" style="margin-top:14px"><input type="checkbox" name="setupTasks" checked> Create setup tasks (read-in script, ad copy, graphics)</label>' +
      '<label class="k-row" style="margin-top:6px"><input type="checkbox" name="applyFirst" checked> Create the first month\'s deliverables</label>' +
      '<div class="k-mfoot"><button class="k-btn" data-act="close">Cancel</button><button class="k-btn pri" data-act="ns-save">Add sponsor</button></div>';
  },
  booking: function (a) {
    var s = sponsor(a.sponsorId || UI.sponsorId), m = UI.month;
    var eps = []; for (var d = m + '-01'; monthOf(d) === m; d = addDays(d, 1)) if (isEpisodeDay(d)) eps.push(d);
    var kind = a.kind || 'placement';
    return '<h3>Add booking — ' + esc(s.name) + '</h3>' +
      '<label class="k-field"><span>Booking type</span><select class="k-in" name="kind" data-act="booking-kind">' +
        '<option value="placement"' + (kind === 'placement' ? ' selected' : '') + '>Episode ad placement</option>' +
        D.types.map(function (t) { return '<option value="' + esc(t.id) + '"' + (kind === t.id ? ' selected' : '') + '>' + esc(t.name) + '</option>'; }).join('') +
        '<option value="custom"' + (kind === 'custom' ? ' selected' : '') + '>Other / custom task</option></select></label>' +
      (kind === 'placement' ?
        '<div class="k-grid" style="margin-top:12px"><label class="k-field"><span>Episode date</span><input class="k-in" type="date" name="date" value="' + (a.date || eps[0] || m + '-01') + '" list="k-eps"><datalist id="k-eps">' + eps.map(function (e) { return '<option value="' + e + '">' + fmtDate(e, true) + '</option>'; }).join('') + '</datalist></label>' +
        '<label class="k-field"><span>Slot</span><select class="k-in" name="slot">' + SLOTS.map(function (x) { return '<option value="' + x.id + '">' + x.label + '</option>'; }).join('') + '</select></label>' +
        '<label class="k-field"><span>Runs on</span><select class="k-in" name="format">' + FORMATS.map(function (f) { return '<option value="' + f + '">' + (f === 'Both' ? 'Video + audio' : f + ' only') + '</option>'; }).join('') + '</select></label></div>' +
        '<label class="k-field" style="margin-top:12px"><span>Notes</span><input class="k-in" name="notes"></label>'
      :
        '<div class="k-grid" style="margin-top:12px">' + (kind === 'custom' ? '<label class="k-field" style="grid-column:1/-1"><span>Task</span><input class="k-in" name="title"></label>' : '') +
        '<label class="k-field"><span>Quantity</span><input class="k-in" type="number" min="1" name="qty" value="1"></label>' +
        '<label class="k-field"><span>Assigned to</span>' + ownerSelect('owner', kind !== 'custom' && typeById(kind) ? typeById(kind).owner : '') + '</label>' +
        '<label class="k-field"><span>Due</span><input class="k-in" type="date" name="due" value="' + monthEnd(m) + '"></label></div>' +
        '<label class="k-field" style="margin-top:12px"><span>Notes</span><input class="k-in" name="notes"></label>') +
      '<label class="k-row" style="margin-top:14px"><input type="checkbox" name="applyPkg"> Also add everything else in their package for ' + monthName(m) + '</label>' +
      '<div class="k-mfoot"><button class="k-btn" data-act="close">Cancel</button><button class="k-btn pri" data-act="booking-save">Add</button></div>';
  },
  day: function (a) {
    var ds = a.date, info = D.days[ds] || {};
    var ps = D.placements.filter(function (p) { return p.date === ds; }).sort(function (x, y) { return slotIdx(x.slot) - slotIdx(y.slot); });
    var opts = D.sponsors.filter(function (s) { return activeIn(s, monthOf(ds)) || s.status === 'Active' || s.status === 'Contracted'; }).sort(function (x, y) { return x.name.localeCompare(y.name); });
    return '<h3>' + fmtDate(ds, true) + '</h3>' +
      '<div class="k-card soft" style="margin:10px 0"><label class="k-row"><input type="checkbox" data-act="day-rec" ' + (info.recorded ? 'checked' : '') + '> <b>Episode recorded</b></label>' +
        (info.recorded ? '<label class="k-field" style="margin-top:8px;max-width:220px"><span>Date it was recorded</span><input class="k-in" type="date" data-act="day-rec-date" value="' + esc(info.recordedOn || '') + '"></label>' : '') + '</div>' +
      '<h3 class="k-h3">Sponsor placements</h3>' +
      (ps.length ? ps.map(function (p) { var s = sponsor(p.sponsorId) || { name: 'Unknown', color: '#999' };
        return '<div class="k-row" style="padding:6px 0;border-bottom:1px solid var(--line)">' + sponsorDot(s) + '<b>' + esc(s.name) + '</b><span class="k-pill">' + slotLabel(p.slot) + '</span>' +
          (p.format !== 'Both' ? '<span class="k-pill b">' + esc(p.format) + ' only</span>' : '') + (p.notes ? '<span class="k-note">' + esc(p.notes) + '</span>' : '') +
          '<span class="k-sp"></span><button class="k-btn sm red" data-act="del-placement" data-id="' + p.id + '">Remove</button></div>'; }).join('') : '<p class="k-note">None yet.</p>') +
      '<h3 class="k-h3" style="margin-top:16px">Add a placement</h3><div class="k-grid">' +
        '<label class="k-field"><span>Sponsor</span><select class="k-in" name="sponsorId">' + opts.map(function (s) { return '<option value="' + s.id + '">' + esc(s.name) + '</option>'; }).join('') + '</select></label>' +
        '<label class="k-field"><span>Slot</span><select class="k-in" name="slot">' + SLOTS.map(function (x) { var taken = ps.some(function (p) { return p.slot === x.id; }); return '<option value="' + x.id + '"' + (taken ? ' disabled' : '') + '>' + x.label + (taken ? ' (taken)' : '') + '</option>'; }).join('') + '</select></label>' +
        '<label class="k-field"><span>Runs on</span><select class="k-in" name="format">' + FORMATS.map(function (f) { return '<option value="' + f + '">' + (f === 'Both' ? 'Video + audio' : f + ' only') + '</option>'; }).join('') + '</select></label></div>' +
      '<div class="k-mfoot"><button class="k-btn" data-act="close">Close</button><button class="k-btn pri" data-act="day-add">Add placement</button></div>';
  },
  task: function (a) {
    var t = a.id ? D.tasks.filter(function (x) { return x.id === a.id; })[0] : { sponsorId: a.sponsorId || '', month: UI.month, status: 'open', qty: 1 };
    return '<h3>' + (a.id ? 'Edit task' : 'Add task') + '</h3><div class="k-grid">' +
      '<label class="k-field" style="grid-column:1/-1"><span>Task</span><input class="k-in" name="title" value="' + esc(t.title || '') + '" autofocus></label>' +
      '<label class="k-field"><span>Sponsor</span><select class="k-in" name="sponsorId"><option value="">General (no sponsor)</option>' + D.sponsors.slice().sort(function (x, y) { return x.name.localeCompare(y.name); }).map(function (s) { return '<option value="' + s.id + '"' + (s.id === t.sponsorId ? ' selected' : '') + '>' + esc(s.name) + '</option>'; }).join('') + '</select></label>' +
      '<label class="k-field"><span>Month</span><input class="k-in" type="month" name="month" value="' + esc(t.month || '') + '"></label>' +
      '<label class="k-field"><span>Assigned to</span>' + ownerSelect('owner', t.owner) + '</label>' +
      '<label class="k-field"><span>Due</span><input class="k-in" type="date" name="due" value="' + esc(t.due || '') + '"></label>' +
      '<label class="k-field"><span>Quantity</span><input class="k-in" type="number" min="1" name="qty" value="' + (t.qty || 1) + '"></label>' +
      '<label class="k-field"><span>Status</span><select class="k-in" name="status"><option value="open"' + (t.status === 'open' ? ' selected' : '') + '>Not started</option><option value="progress"' + (t.status === 'progress' ? ' selected' : '') + '>In progress</option><option value="done"' + (t.status === 'done' ? ' selected' : '') + '>Done</option></select></label></div>' +
      '<label class="k-field" style="margin-top:12px"><span>Notes</span><textarea class="k-in" name="notes">' + esc(t.notes || '') + '</textarea></label>' +
      (t.proof && (t.proof.url || t.proof.image) ? '<p style="margin:10px 0 0">Proof: ' + proofCell({ proof: t.proof, status: 'done' }) + ' <button class="k-link" data-act="clear-proof" data-id="' + t.id + '">Remove proof</button></p>' : '') +
      '<div class="k-mfoot">' + (a.id ? '<button class="k-btn red" data-act="del-task" data-id="' + t.id + '" style="margin-right:auto">Delete</button>' : '') +
      '<button class="k-btn" data-act="close">Cancel</button><button class="k-btn pri" data-act="task-save" data-id="' + (a.id || '') + '">Save</button></div>';
  },
  proof: function (a) {
    var t = D.tasks.filter(function (x) { return x.id === a.id; })[0], ty = t.typeId ? typeById(t.typeId) : null;
    var wantShot = ty && ty.proof === 'screenshot';
    return '<h3>Mark done</h3><p style="margin:0 0 12px"><b>' + esc(taskTitle(t)) + '</b>' + (sponsor(t.sponsorId) ? ' · ' + esc(sponsor(t.sponsorId).name) : '') + '</p>' +
      '<p class="k-note" style="margin:0 0 12px">Add proof it went out: a link to the post, or a screenshot for stories and email newsletters' + (wantShot ? ' (a screenshot is usual for this one)' : '') + '.</p>' +
      '<label class="k-field"><span>Link to the post or episode</span><input class="k-in" name="url" placeholder="https://…" value="' + esc((t.proof && t.proof.url) || '') + '"' + (wantShot ? '' : ' autofocus') + '></label>' +
      '<label class="k-field" style="margin-top:12px"><span>Screenshot</span><input class="k-in" type="file" accept="image/*" name="shot" data-act="proof-file"></label>' +
      '<div id="k-shot-prev" style="margin-top:8px">' + (a.image ? '<img src="' + esc(a.image) + '" style="max-width:100%;max-height:220px;border-radius:6px;border:1px solid var(--line)">' : '') + '</div>' +
      '<p class="k-note" style="margin:6px 0 0">Tip: you can also paste a screenshot straight into this box (Ctrl/⌘+V).</p>' +
      '<label class="k-field" style="margin-top:12px"><span>Note (optional)</span><input class="k-in" name="note"></label>' +
      '<div class="k-mfoot"><button class="k-btn" data-act="close">Cancel</button><button class="k-btn" data-act="proof-skip">Done without proof</button><button class="k-btn pri" data-act="proof-save"' + (a.uploading ? ' disabled' : '') + '>' + (a.uploading ? 'Uploading…' : 'Save proof &amp; mark done') + '</button></div>';
  },
  image: function (a) { return 'wide<img src="' + esc(a.src) + '" alt="Screenshot proof" style="max-width:100%;border-radius:6px"><div class="k-mfoot"><button class="k-btn" data-act="close">Close</button></div>'; },
  team: function () {
    return '<h3>Team</h3><p class="k-note">Who tasks can be assigned to.</p>' + D.team.map(function (t) {
      return '<div class="k-row" style="margin-bottom:6px;flex-wrap:nowrap"><input type="color" value="' + esc(t.color) + '" data-tm="' + t.id + '" data-k="color" style="width:40px;height:36px;border:0;background:none" aria-label="Color">' +
        '<input class="k-in" value="' + esc(t.name) + '" data-tm="' + t.id + '" data-k="name" aria-label="Name"><input class="k-in" value="' + esc(t.title || '') + '" data-tm="' + t.id + '" data-k="title" placeholder="Role" aria-label="Role">' +
        '<button class="k-ibtn" data-act="team-del" data-id="' + t.id + '" aria-label="Remove ' + esc(t.name) + '">×</button></div>';
    }).join('') + '<button class="k-btn sm" data-act="team-add">+ Add person</button><div class="k-mfoot"><button class="k-btn pri" data-act="close">Done</button></div>';
  },
  types: function () {
    return 'wide<h3>Deliverable types</h3><p class="k-note">The menu of things sponsors can buy besides episode placements, who usually owns each, and what proof is expected.</p>' + D.types.map(function (t) {
      return '<div class="k-row" style="margin-bottom:6px;flex-wrap:nowrap"><input class="k-in" value="' + esc(t.name) + '" data-ty="' + t.id + '" data-k="name" aria-label="Name">' +
        ownerSelect('o', t.owner, 'data-ty="' + t.id + '" data-k="owner" style="max-width:200px" aria-label="Default owner"') +
        '<select class="k-in" style="max-width:150px" data-ty="' + t.id + '" data-k="proof" aria-label="Proof"><option value="link"' + (t.proof !== 'screenshot' ? ' selected' : '') + '>Proof: link</option><option value="screenshot"' + (t.proof === 'screenshot' ? ' selected' : '') + '>Proof: screenshot</option></select>' +
        '<button class="k-ibtn" data-act="type-del" data-id="' + t.id + '" aria-label="Remove">×</button></div>';
    }).join('') + '<button class="k-btn sm" data-act="type-add">+ Add type</button><div class="k-mfoot"><button class="k-btn pri" data-act="close">Done</button></div>';
  },
  data: function (a) {
    return '<h3>Backup &amp; import</h3>' +
      '<h3 class="k-h3" style="margin-top:14px">Bring over the old board</h3><p class="k-note" style="margin-top:0">Choose the backup file downloaded from Caleb\'s Sponsorship Traffic Board (“Download backup”). Everything comes across — sponsors, deals, placements, recordings, bookings, tasks, team — and the original file is kept inside the portal too.</p>' +
      '<input type="file" accept=".json,application/json" data-act="import-file" aria-label="Old board backup file">' +
      (a.preview ? '<div class="k-card soft" style="margin-top:12px"><b>Found in that file:</b><div class="k-mini" style="margin-top:6px">' + a.preview + '</div>' +
        (D.sponsors.length ? '<p class="k-note">This replaces what is in the portal now (' + D.sponsors.length + ' sponsors).</p>' : '') +
        '<button class="k-btn pri" data-act="import-go">Import everything</button></div>' : '') +
      (a.error ? '<div class="k-banner" style="margin-top:10px">' + esc(a.error) + '</div>' : '') +
      '<h3 class="k-h3" style="margin-top:20px">Backup of this portal</h3><div class="k-row"><button class="k-btn" data-act="export">Download backup</button><button class="k-btn" data-act="export-copy">Copy backup to clipboard</button>' +
      (D.importedAt ? '<span class="k-note">Imported from the old board ' + esc(fmtDate(D.importedAt.slice(0, 10))) + '</span>' : '') + '</div>' +
      '<div class="k-mfoot"><button class="k-btn" data-act="close">Close</button></div>';
  }
};
function extraRow(e) {
  e = e || { typeId: D.types[0] && D.types[0].id, qty: 1, per: 'month' };
  return '<div class="k-extra gx"><select class="k-in" data-g="typeId">' + typeOptions(e.typeId) + '</select><input class="k-in" type="number" min="0" data-g="qty" value="' + num(e.qty || 1) + '" aria-label="Quantity">' +
    '<select class="k-in" data-g="per"><option value="month"' + (e.per !== 'term' ? ' selected' : '') + '>per month</option><option value="term"' + (e.per === 'term' ? ' selected' : '') + '>whole deal</option></select>' +
    ownerSelect('', e.owner || (typeById(e.typeId) || {}).owner, 'data-g="owner" aria-label="Owner"') + '<button class="k-ibtn" data-act="gx-del" aria-label="Remove">×</button></div>';
}

/* ------------------------------------------------------------------ actions */
var pendingConfirm = null;
function confirmThen(title, body, yes, fn) { pendingConfirm = fn; openModal('confirm', { title: title, body: body, yes: yes }); }

function applyPackage(s, m) {
  var made = 0;
  function has(title) { return D.tasks.some(function (t) { return t.sponsorId === s.id && t.month === m && t.title === title; }); }
  s.pkg.extras.forEach(function (e) {
    if (e.per === 'term') return;
    var ty = typeById(e.typeId); if (!ty || !num(e.qty)) return;
    var title = ty.name;
    if (has(title)) return;
    D.tasks.push({ id: uid('task'), sponsorId: s.id, month: m, typeId: ty.id, title: title, qty: num(e.qty), owner: e.owner || ty.owner || '', due: monthEnd(m), status: 'open', notes: '' });
    made++;
  });
  // one reminder to book the episode placements if they are short this month
  var c = slotCounts(s.id, m), p = s.pkg, need = Math.max(0, p.episodesPerMonth - c.episodes);
  if (need && !has('Book episode placements')) {
    D.tasks.push({ id: uid('task'), sponsorId: s.id, month: m, title: 'Book episode placements', qty: need, owner: 'james', due: addDays(m + '-01', -28), status: 'open', notes: 'Early ' + p.early + ' · Mid ' + p.mid + ' · Late ' + p.late + ' this month' });
    made++;
  }
  return made;
}

function handleClick(e) {
  var el = e.target.closest('[data-act]'); if (!el || !root.contains(el)) return;
  var act = el.getAttribute('data-act'), v = el.getAttribute('data-v'), id = el.getAttribute('data-id');
  if (el.tagName === 'INPUT' && (el.type === 'checkbox' || el.type === 'file' || el.type === 'color' || el.type === 'date' || el.type === 'search')) return;
  if (el.tagName === 'SELECT') return;
  var s = sponsor(UI.sponsorId);
  switch (act) {
    case 'tab': UI.tab = v; UI.overdueAll = false; keepUi(); if (UI.modal) UI.modal = null; render(); break;
    case 'month': UI.month = v === '0' ? thisMonth() : addMonths(UI.month, +v); render(); break;
    case 'go-open': UI.tab = 'tasks'; UI.overdueAll = false; UI.taskView = 'open'; render(); break;
    case 'go-overdue': UI.tab = 'tasks'; UI.overdueAll = true; UI.owner = 'all'; render(); break;
    case 'clear-overdue': UI.overdueAll = false; render(); break;
    case 'go-ending': UI.tab = 'sponsors'; UI.endingOnly = true; UI.sponsorId = null; render(); break;
    case 'clear-ending': UI.endingOnly = false; render(); break;
    case 'open-sponsor': UI.tab = 'sponsors'; UI.sponsorId = id; UI.endingOnly = false; render(); window.scrollTo && root.scrollIntoView({ block: 'start' }); break;
    case 'pick-sponsor': UI.sponsorId = id; render(); break;
    case 'owner': UI.owner = v; keepUi(); render(); break;
    case 'task-view': UI.taskView = v; render(); break;
    case 'new-sponsor': openModal('newSponsor'); break;
    case 'ns-guided': openModal('guided', {}); break;
    case 'ns-import': openModal('importContract'); break;
    case 'ns-parse': {
      var txt = formVals().text || '';
      if (txt.trim().length < 40) { toast('Paste the contract text first.'); break; }
      var r = parseContract(txt); openModal('guided', { draft: r.draft, found: r.found, fromContract: true }); break;
    }
    case 'gx-add': document.getElementById('k-gx').insertAdjacentHTML('beforeend', extraRow()); break;
    case 'gx-del': el.closest('.gx').remove(); break;
    case 'ns-save': {
      var f = formVals(); if (!f.name.trim()) { toast('Give the sponsor a name.'); break; }
      var start = f.startDate || '', months = Math.max(1, num(f.months) || 1);
      var ns = { id: uid('sp'), name: f.name.trim(), color: SPONSOR_COLORS[D.sponsors.length % SPONSOR_COLORS.length], status: f.status, tier: f.tier, contactName: f.contactName, contactEmail: f.contactEmail,
        trackingLink: f.trackingLink, driveLink: '', startDate: start, endDate: start ? addDays(addMonths(monthOf(start), months) + start.slice(7), -1) : '', autoRenews: f.autoRenews === '1', notes: '',
        pkg: { episodesPerMonth: num(f.episodesPerMonth), early: num(f.early), mid: num(f.mid), late: num(f.late), extras: [] } };
      document.querySelectorAll('#k-gx .gx').forEach(function (row) {
        var g = function (k) { return row.querySelector('[data-g="' + k + '"]').value; };
        if (num(g('qty'))) ns.pkg.extras.push({ id: uid('x'), typeId: g('typeId'), qty: num(g('qty')), per: g('per'), owner: g('owner') });
      });
      D.sponsors.push(ns);
      if (f.setupTasks) SETUP_TASKS.forEach(function (t) { D.tasks.push({ id: uid('task'), sponsorId: ns.id, month: '', title: t.title, owner: t.owner, due: start ? addDays(start, -28) : '', status: 'open', qty: 1, notes: '' }); });
      if (f.applyFirst) applyPackage(ns, start ? monthOf(start) : UI.month);
      UI.sponsorId = ns.id; UI.tab = 'sponsors'; UI.modal = null; save(); closeModal(); toast(ns.name + ' added.'); break;
    }
    case 'color': openModal('color'); break;
    case 'pick-color': s.color = v; save(); renderModal(); break;
    case 'edit-links': openModal('links'); break;
    case 'save-links': { var lf = formVals(); s.trackingLink = lf.trackingLink.trim(); s.driveLink = lf.driveLink.trim(); save(); closeModal(); break; }
    case 'copy': if (navigator.clipboard) navigator.clipboard.writeText(v).then(function () { toast('Link copied.'); }, function () { toast('Could not copy — select the link and copy it.'); }); break;
    case 'delete-sponsor':
      confirmThen('Delete ' + s.name + '?', 'This removes the sponsor, their ' + placementsFor(s.id).length + ' placements and ' + tasksFor(s.id).length + ' tasks. There is no undo (download a backup first if unsure).', 'Delete', function () {
        D.placements = D.placements.filter(function (p) { return p.sponsorId !== s.id; }); D.tasks = D.tasks.filter(function (t) { return t.sponsorId !== s.id; });
        D.sponsors = D.sponsors.filter(function (x) { return x.id !== s.id; }); UI.sponsorId = null; save();
      }); break;
    case 'confirm-yes': { var fn = pendingConfirm; pendingConfirm = null; UI.modal = null; if (fn) fn(); closeModal(); break; }
    case 'close': closeModal(); break;
    case 'add-extra': s.pkg.extras.push({ id: uid('x'), typeId: D.types[0] ? D.types[0].id : '', qty: 1, per: 'month', owner: D.types[0] ? D.types[0].owner : '' }); save(); render(); break;
    case 'del-extra': s.pkg.extras = s.pkg.extras.filter(function (x) { return x.id !== id; }); save(); render(); break;
    case 'apply-pkg': { var n = applyPackage(s, UI.month); save(); render(); toast(n ? n + ' item' + (n > 1 ? 's' : '') + ' added for ' + monthName(UI.month) + '.' : 'Everything in their package is already on ' + monthName(UI.month) + '.'); break; }
    case 'add-booking': openModal('booking', { sponsorId: s.id }); break;
    case 'booking-save': {
      var b = formVals(), bs = sponsor(UI.modal.arg.sponsorId || UI.sponsorId);
      if (b.kind === 'placement') {
        if (monthOf(b.date) !== UI.month && !b.date) { toast('Pick an episode date.'); break; }
        if (D.placements.some(function (p) { return p.date === b.date && p.slot === b.slot; })) { toast(slotLabel(b.slot) + ' on ' + fmtDate(b.date) + ' is already taken.'); break; }
        D.placements.push({ id: uid('pl'), sponsorId: bs.id, date: b.date, slot: b.slot, format: b.format, notes: b.notes });
      } else {
        var ty = typeById(b.kind), title = b.kind === 'custom' ? (b.title || '').trim() : ty.name;
        if (!title) { toast('Name the task.'); break; }
        D.tasks.push({ id: uid('task'), sponsorId: bs.id, month: UI.month, typeId: ty ? ty.id : '', title: title, qty: Math.max(1, num(b.qty)), owner: b.owner, due: b.due, status: 'open', notes: b.notes });
      }
      if (b.applyPkg) applyPackage(bs, UI.month);
      save(); closeModal(); break;
    }
    case 'day': openModal('day', { date: v }); break;
    case 'day-add': {
      var dv = formVals(), ds = UI.modal.arg.date;
      if (!dv.sponsorId) { toast('Add a sponsor first.'); break; }
      if (D.placements.some(function (p) { return p.date === ds && p.slot === dv.slot; })) { toast('That slot is taken.'); break; }
      D.placements.push({ id: uid('pl'), sponsorId: dv.sponsorId, date: ds, slot: dv.slot, format: dv.format, notes: '' }); save(); render(); break;
    }
    case 'del-placement': D.placements = D.placements.filter(function (p) { return p.id !== id; }); save(); render(); break;
    case 'toggle-task': {
      var t = D.tasks.filter(function (x) { return x.id === id; })[0];
      if (t.status === 'done') { t.status = 'open'; save(); render(); } else openModal('proof', { id: id });
      break;
    }
    case 'proof-skip': case 'proof-save': {
      var pt = D.tasks.filter(function (x) { return x.id === UI.modal.arg.id; })[0], pv = formVals();
      if (act === 'proof-save') {
        if (!pv.url.trim() && !UI.modal.arg.image) { toast('Add a link or a screenshot — or choose “Done without proof”.'); break; }
        if (pv.url.trim() && !isUrl(pv.url.trim())) { toast('That link should start with https://'); break; }
        pt.proof = { url: pv.url.trim(), image: UI.modal.arg.image || '', note: pv.note, at: new Date().toISOString() };
      }
      if (pv.note && act === 'proof-skip') pt.notes = (pt.notes ? pt.notes + ' · ' : '') + pv.note;
      pt.status = 'done'; pt.doneAt = new Date().toISOString(); save(); closeModal(); break;
    }
    case 'clear-proof': { var cp = D.tasks.filter(function (x) { return x.id === id; })[0]; cp.proof = null; save(); renderModal(); break; }
    case 'view-img': { var vt = D.tasks.filter(function (x) { return x.id === id; })[0]; openModal('image', { src: vt.proof.image }); break; }
    case 'new-task': openModal('task', {}); break;
    case 'edit-task': openModal('task', { id: id }); break;
    case 'task-save': {
      var tv = formVals(); if (!tv.title.trim()) { toast('Name the task.'); break; }
      var tk = id ? D.tasks.filter(function (x) { return x.id === id; })[0] : { id: uid('task') };
      Object.assign(tk, { title: tv.title.trim(), sponsorId: tv.sponsorId, month: tv.month, owner: tv.owner, due: tv.due, qty: Math.max(1, num(tv.qty)), status: tv.status, notes: tv.notes });
      if (!id) D.tasks.push(tk); save(); closeModal(); break;
    }
    case 'del-task': confirmThen('Delete this task?', 'This cannot be undone.', 'Delete', function () { D.tasks = D.tasks.filter(function (x) { return x.id !== id; }); save(); }); break;
    case 'team': openModal('team'); break;
    case 'team-add': D.team.push({ id: uid('tm'), name: 'New person', title: '', color: TEAM_COLORS[D.team.length % TEAM_COLORS.length] }); save(); renderModal(); break;
    case 'team-del': {
      var used = D.tasks.filter(function (t) { return t.owner === id; }).length;
      confirmThen('Remove ' + team(id).name + '?', used ? 'Their ' + used + ' tasks become unassigned.' : 'They have no tasks.', 'Remove', function () {
        D.tasks.forEach(function (t) { if (t.owner === id) t.owner = ''; }); D.team = D.team.filter(function (t) { return t.id !== id; }); save();
      }); break;
    }
    case 'types': openModal('types'); break;
    case 'type-add': D.types.push({ id: uid('ty'), name: 'New deliverable', owner: '', proof: 'link' }); save(); renderModal(); break;
    case 'type-del': D.types = D.types.filter(function (t) { return t.id !== id; }); save(); renderModal(); break;
    case 'data': openModal('data', {}); break;
    case 'import-go': {
      var imp = UI.modal.arg.result; D = normalize(imp); UI.sponsorId = null; UI.modal = null; save(); closeModal();
      toast('Imported ' + D.sponsors.length + ' sponsors, ' + D.placements.length + ' placements and ' + D.tasks.length + ' tasks.'); break;
    }
    case 'export': {
      var blob = new Blob([JSON.stringify(D, null, 1)], { type: 'application/json' }), a = document.createElement('a');
      a.href = URL.createObjectURL(blob); a.download = 'kcs-sponsor-portal-backup-' + today() + '.json'; document.body.appendChild(a); a.click(); a.remove();
      toast('If nothing downloaded, use “Copy backup to clipboard”.'); break;
    }
    case 'export-copy': if (navigator.clipboard) navigator.clipboard.writeText(JSON.stringify(D)).then(function () { toast('Backup copied. Paste it into a text file to keep it.'); }, function () { toast('Copy was blocked by the browser.'); }); break;
  }
}

function handleChange(e) {
  var el = e.target, act = el.getAttribute('data-act'), s = sponsor(UI.sponsorId);
  if (el.hasAttribute('data-f') && s) {
    var f = el.getAttribute('data-f'), val = el.value;
    if (f.indexOf('pkg.') === 0) s.pkg[f.slice(4)] = num(val);
    else if (f === 'autoRenews') s.autoRenews = val === '1';
    else if (f === 'name') s.name = val.trim() || s.name;
    else s[f] = val;
    save(); render(); return;
  }
  if (el.hasAttribute('data-x') && s) {
    var x = s.pkg.extras.filter(function (q) { return q.id === el.getAttribute('data-x'); })[0], k = el.getAttribute('data-k');
    x[k] = k === 'qty' ? num(el.value) : el.value;
    if (k === 'typeId' && typeById(el.value)) x.owner = typeById(el.value).owner;
    save(); render(); return;
  }
  if (el.hasAttribute('data-tm')) { var tm = team(el.getAttribute('data-tm')); tm[el.getAttribute('data-k')] = el.value; save(); return; }
  if (el.hasAttribute('data-ty')) { var ty = typeById(el.getAttribute('data-ty')); ty[el.getAttribute('data-k')] = el.value; save(); return; }
  if (el.hasAttribute('data-g') && el.getAttribute('data-g') === 'typeId') {
    var row = el.closest('.gx'), o = row.querySelector('[data-g="owner"]'), t2 = typeById(el.value); if (t2 && o) o.value = t2.owner || ''; return;
  }
  switch (act) {
    case 'status-filter': UI.statusFilter = el.value; UI.endingOnly = false; render(); break;
    case 'toggle-quiet': UI.showQuiet = el.checked; render(); break;
    case 'pick-color-any': s.color = el.value; save(); renderModal(); break;
    case 'booking-kind': UI.modal.arg.kind = el.value; renderModal(); break;
    case 'day-rec': {
      var ds = UI.modal.arg.date, info = D.days[ds] || {};
      info.recorded = el.checked; if (el.checked && !info.recordedOn) info.recordedOn = ds <= today() ? ds : today();
      D.days[ds] = info; save(); renderModal(); break;
    }
    case 'day-rec-date': { var d2 = UI.modal.arg.date; D.days[d2] = D.days[d2] || {}; D.days[d2].recordedOn = el.value; save(); break; }
    case 'proof-file': if (el.files[0]) takeShot(el.files[0]); break;
    case 'contract-file': if (el.files[0]) { var fr = new FileReader(); fr.onload = function () { document.querySelector('#k-modal textarea[name=text]').value = fr.result; }; fr.readAsText(el.files[0]); } break;
    case 'import-file': if (el.files[0]) readBackup(el.files[0]); break;
  }
}
function handleInput(e) {
  if (e.target.getAttribute('data-act') === 'search') {
    UI.search = e.target.value; var pos = e.target.selectionStart; render();
    var s2 = root.querySelector('[data-act=search]'); if (s2) { s2.focus(); try { s2.setSelectionRange(pos, pos); } catch (x) {} }
  }
}
function takeShot(file) {
  var arg = UI.modal.arg, keep = formVals(); arg.uploading = true; renderModal(); restore(keep);
  uploadImage(file).then(function (url) { arg.image = url; arg.uploading = false; renderModal(); restore(keep); })
    .catch(function (err) { arg.uploading = false; renderModal(); restore(keep); toast(err.message); });
}
function restore(vals) { var m = document.getElementById('k-modal'); if (!m) return; Object.keys(vals).forEach(function (k) { var el = m.querySelector('[name="' + k + '"]'); if (el && el.type !== 'file' && el.type !== 'checkbox') el.value = vals[k]; }); }
root.addEventListener('click', handleClick);
root.addEventListener('change', handleChange);
root.addEventListener('input', handleInput);
root.addEventListener('keydown', function (e) { if (e.key === 'Escape' && UI.modal) closeModal(); });
root.addEventListener('click', function (e) { if (e.target.id === 'k-modal') closeModal(); });
document.addEventListener('paste', function (e) {
  if (!UI.modal || UI.modal.kind !== 'proof') return;
  var items = (e.clipboardData || {}).items || [];
  for (var i = 0; i < items.length; i++) if (items[i].type.indexOf('image') === 0) { takeShot(items[i].getAsFile()); e.preventDefault(); return; }
});

/* ------------------------------------------------------------------ contract reader */
function parseContract(txt) {
  var t = txt.replace(/\r/g, ''), found = [], d = { pkg: { extras: [] }, status: 'Contracted' };
  var words = { one: 1, two: 2, three: 3, four: 4, five: 5, six: 6, seven: 7, eight: 8, nine: 9, ten: 10, eleven: 11, twelve: 12 };
  function n(s) { s = String(s).toLowerCase(); return words[s] || parseInt(s, 10) || 0; }
  var NUM = '(\\d+|one|two|three|four|five|six|seven|eight|nine|ten|eleven|twelve)';
  var mm;
  if ((mm = t.match(/sponsor(?:\s*name)?\s*[:\-–]\s*([^\n]{2,80})/i)) || (mm = t.match(/and\s+([A-Z][\w&.,' -]{2,60}?)\s*\(\s*[“"]?(?:sponsor|client|advertiser)/i))) { d.name = mm[1].trim().replace(/[,.;]$/, ''); found.push('name'); }
  if ((mm = t.match(/[\w.+-]+@[\w-]+\.[\w.]+/))) { d.contactEmail = mm[0]; found.push('email'); }
  if ((mm = t.match(/https?:\/\/[^\s)"']+/))) { d.trackingLink = mm[0].replace(/[.,;]$/, ''); found.push('link'); }
  if ((mm = t.match(new RegExp(NUM + '\\s*\\(?\\d*\\)?[\\s-]*months?', 'i')))) { d.months = n(mm[1]); found.push(d.months + ' months'); }
  if ((mm = t.match(/(?:start|begin|commenc)\w*[^\n\d]{0,30}((?:jan|feb|mar|apr|may|jun|jul|aug|sep|oct|nov|dec)\w*\.?\s+\d{1,2},?\s+\d{4}|\d{1,2}\/\d{1,2}\/\d{2,4})/i))) {
    var sd = new Date(mm[1]); if (!isNaN(sd)) { if (sd.getFullYear() < 2000) sd.setFullYear(sd.getFullYear() + 100); d.startDate = ymd(sd); found.push('start ' + fmtDate(d.startDate)); }
  }
  if ((mm = t.match(new RegExp(NUM + '\\s*(?:sponsored\\s+|full\\s+)?episodes?\\s*(?:per|each|a|\\/)\\s*month', 'i')))) { d.pkg.episodesPerMonth = n(mm[1]); found.push(d.pkg.episodesPerMonth + ' episodes/mo'); }
  function slot(re, key) {
    var r = t.match(new RegExp(NUM + '\\s*\\(?\\d*\\)?\\s*' + re, 'i')); if (!r) return;
    var c = n(r[1]), after = t.slice(r.index, r.index + r[0].length + 30);
    if (!/per\s+month|each\s+month|monthly|\/\s*mo/i.test(after) && d.months > 1 && c > 8) c = Math.round(c / d.months);
    d.pkg[key] = c; found.push(c + ' ' + key + '/mo');
  }
  slot('early[\\s-]*rolls?', 'early'); slot('mid[\\s-]*rolls?', 'mid'); slot('late[\\s-]*rolls?', 'late');
  if (!d.pkg.episodesPerMonth) d.pkg.episodesPerMonth = Math.max(d.pkg.early || 0, d.pkg.mid || 0, d.pkg.late || 0);
  D.types.forEach(function (ty) {
    var key = ty.name.split(' — ')[0].replace(/[()+]/g, '').trim();
    var r = t.match(new RegExp(NUM + '\\s*\\(?\\d*\\)?\\s*' + key.replace(/[.*?^${}|[\]\\]/g, '\\$&') + 's?', 'i'));
    if (r) { d.pkg.extras.push({ typeId: ty.id, qty: n(r[1]), per: /per\s+month|monthly/i.test(t.slice(r.index, r.index + 80)) ? 'month' : 'term', owner: ty.owner }); found.push(n(r[1]) + ' × ' + ty.name); }
  });
  if (/email|newsletter|family update/i.test(t) && !d.pkg.extras.some(function (e) { return e.typeId === 'email_cfu'; }) && typeById('email_cfu')) {
    var er = t.match(new RegExp(NUM + '\\s*\\(?\\d*\\)?\\s*(?:dedicated\\s+)?(?:emails?|newsletters?)', 'i'));
    if (er) { d.pkg.extras.push({ typeId: 'email_cfu', qty: n(er[1]), per: 'term', owner: 'olivia' }); found.push(n(er[1]) + ' emails'); }
  }
  d.autoRenews = /auto(?:matically)?[\s-]*renew/i.test(t) && !/not\s+auto/i.test(t);
  return { draft: d, found: found.length ? 'Found: ' + found.join(' · ') + '. Check everything below before saving.' : 'We could not find the usual terms in that text — fill in the details below.' };
}

/* ------------------------------------------------------------------ old-board importer */
function readBackup(file) {
  var fr = new FileReader();
  fr.onload = function () {
    var arg = UI.modal.arg;
    try {
      var raw = JSON.parse(fr.result), res = convertOldBoard(raw);
      arg.result = res.data; arg.preview = res.summary; arg.error = '';
    } catch (err) { arg.preview = ''; arg.error = 'That file could not be read: ' + err.message; }
    renderModal();
  };
  fr.readAsText(file);
}
function pick(o, keys) { for (var i = 0; i < keys.length; i++) if (o && o[keys[i]] != null && o[keys[i]] !== '') return o[keys[i]]; return ''; }
function convertOldBoard(raw) {
  if (raw && raw.schema === 1 && Array.isArray(raw.sponsors) && raw.pkg === undefined && raw.sponsors.every(function (s) { return s.pkg; })) {
    return { data: raw, summary: '<span>This is a backup from this new portal — it will be restored as-is.</span>' };
  }
  var src = raw && (raw.data || raw.board || raw.state || raw);
  if (typeof src === 'string') src = JSON.parse(src);
  var oldSponsors = src.sponsors || (Array.isArray(src) ? src : null);
  if (!Array.isArray(oldSponsors)) throw new Error('no sponsor list in it');
  var out = blankData(), slotMap = { 'early roll': 'early', 'early': 'early', 'mid roll 1': 'mid1', 'mid roll': 'mid1', 'mid': 'mid1', 'mid roll 2': 'mid2', 'late roll': 'late', 'late': 'late' };
  if (Array.isArray(src.teamMembers || src.team)) {
    out.team = (src.teamMembers || src.team).map(function (t, i) { return { id: t.id || uid('tm'), name: t.name || 'Team member', title: t.title || t.role || '', color: (t.color && (t.color.dot || t.color)) || TEAM_COLORS[i % TEAM_COLORS.length], legacy: t }; });
  }
  var invTypes = src.inventoryTypes || src.inventory || src.types;
  if (Array.isArray(invTypes)) {
    var keepTypes = invTypes.filter(function (t) { return t.id !== 'ad_spots'; }).map(function (t) {
      var def = DEFAULT_TYPES.filter(function (x) { return x.id === t.id; })[0];
      return { id: t.id || uid('ty'), name: t.name || 'Deliverable', owner: t.owner || '', proof: def ? def.proof : /story|email|newsletter/i.test(t.name || '') ? 'screenshot' : 'link', legacy: t };
    });
    var norm = function (x) { return String(x).toLowerCase().replace(/[^a-z]/g, '').replace(/listing$/, ''); };
    DEFAULT_TYPES.forEach(function (d) { if (!keepTypes.some(function (k) { return k.id === d.id || norm(k.name) === norm(d.name) || norm(k.name) === norm(d.name.replace(' — ', ' ')); })) keepTypes.push(clone(d)); });
    out.types = keepTypes;
  }
  function typeFor(idOrName) {
    var t = out.types.filter(function (x) { return x.id === idOrName || x.name === idOrName; })[0];
    if (!t && idOrName) { t = { id: String(idOrName).replace(/\W+/g, '_').toLowerCase(), name: String(idOrName), owner: '', proof: 'link' }; out.types.push(t); }
    return t;
  }
  var stat = { sp: 0, pl: 0, bk: 0, tk: 0, rec: 0 };
  oldSponsors.forEach(function (o, i) {
    var sid = o.id || uid('sp'), slots = (o.purchasedSlots || []).map(function (x) { return String(x).toLowerCase(); });
    var per = num(pick(o, ['adSpotsPerMonth', 'episodesPerMonth', 'spotsPerMonth']));
    var pkg = { episodesPerMonth: per, early: 0, mid: 0, late: 0, extras: [] };
    var groups = {}; slots.forEach(function (x) { groups[SLOT_GROUP[slotMap[x]] || (/early/.test(x) ? 'early' : /late/.test(x) ? 'late' : 'mid')] = 1; });
    Object.keys(groups).forEach(function (g) { pkg[g] = per; });
    if (!slots.length && per) pkg.mid = per;
    var start = pick(o, ['startDate', 'dealStartDate', 'contractStart']), months = num(o.contractMonths);
    var end = pick(o, ['dealEndDate', 'endDate']);
    if (!start && end && months) start = addMonths(monthOf(end), -(months - 1)) + '-01';
    var s = { id: sid, name: o.name || 'Sponsor ' + (i + 1), color: (o.color && (o.color.dot || o.color.bg || o.color)) || SPONSOR_COLORS[i % SPONSOR_COLORS.length],
      status: STATUSES.indexOf(o.status) >= 0 ? o.status : (o.status || 'Contracted'), tier: o.tier || '', contactName: o.contactName || '', contactEmail: o.contactEmail || '',
      trackingLink: pick(o, ['trackingLink', 'masterLink', 'link', 'promoLink']), driveLink: pick(o, ['assetsLink', 'driveLink', 'driveFolder']),
      startDate: start || '', endDate: end || '', contractMonths: months, autoRenews: o.autoRenews !== false && o.autoRenews != null ? !!o.autoRenews : false, notes: o.notes || '', pkg: pkg, legacy: {} };
    if (typeof s.color !== 'string') s.color = SPONSOR_COLORS[i % SPONSOR_COLORS.length];
    Object.keys(o).forEach(function (k) { if (['episodes', 'bookings', 'tasks'].indexOf(k) < 0) s.legacy[k] = o[k]; });
    out.sponsors.push(s); stat.sp++;
    (o.episodes || []).forEach(function (ep) {
      var date = pick(ep, ['date', 'airDate']); if (!date) return;
      var sl = slotMap[String(ep.placement || ep.slot || '').toLowerCase()] || 'mid1';
      out.placements.push({ id: ep.id || uid('pl'), sponsorId: sid, date: String(date).slice(0, 10), slot: sl, format: FORMATS.indexOf(ep.format) >= 0 ? ep.format : 'Both', notes: ep.notes || '', legacy: ep });
      if (ep.recorded || ep.isRecorded) { out.days[String(date).slice(0, 10)] = { recorded: true, recordedOn: ep.recordedDate || ep.recordedOn || '' }; }
      stat.pl++;
    });
    // Old bookings already point at the tasks they created (taskIds); remember that link so the task gets its month, type and quantity.
    var bookingOf = {};
    (o.bookings || []).forEach(function (b) {
      var ty = typeFor(b.inventoryTypeId || b.type || b.name); if (!ty) return;
      var ids = (b.taskIds || []).concat(b.taskId ? [b.taskId] : []);
      ids.forEach(function (tid) { bookingOf[tid] = { b: b, ty: ty }; });
      var known = (o.tasks || []).concat(o.bespokeTasks || []).some(function (t) { return ids.indexOf(t.id) >= 0; });
      if (b.month && ty.id !== 'ad_spots' && !known) {
        out.tasks.push({ id: b.id || uid('task'), sponsorId: sid, month: String(b.month).slice(0, 7), typeId: ty.id, title: ty.name, qty: num(b.quantity) || 1, owner: ty.owner || '', due: monthEnd(String(b.month).slice(0, 7)), status: 'open', notes: b.notes || '', legacy: b });
      }
      var ex = pkg.extras.filter(function (e) { return e.typeId === ty.id; })[0];
      if (!ex && ty.id !== 'ad_spots') pkg.extras.push({ id: uid('x'), typeId: ty.id, qty: num(b.quantity) || 1, per: 'month', owner: ty.owner || '' });
      stat.bk++;
    });
    // bespokeTasks repeat tasks already in o.tasks (same ids) — take each id once.
    var seenT = {}, bespokeIds = {};
    (o.bespokeTasks || []).forEach(function (t) { bespokeIds[t.id] = 1; });
    (o.tasks || []).concat(o.bespokeTasks || []).filter(function (t) { if (t.id && seenT[t.id]) return false; seenT[t.id] = 1; return true; }).forEach(function (t) {
      var title = pick(t, ['label', 'title', 'name', 'task']) || 'Task';
      var link = bookingOf[t.id];
      var due = String(pick(t, ['dueDate', 'due', 'date']) || '').slice(0, 10);
      var tm = title.match(/ — ([A-Z][a-z]+) (\d{4})\b/), fromTitle = '';
      if (tm) { var dt = new Date(tm[1] + ' 1, ' + tm[2]); if (!isNaN(dt)) fromTitle = ymd(dt).slice(0, 7); }
      var dm = title.match(/ — ([A-Z][a-z]{2}) (\d{1,2}), (\d{4})/), fromDay = '';
      if (dm) { var dd = new Date(dm[1] + ' ' + dm[2] + ', ' + dm[3]); if (!isNaN(dd)) fromDay = ymd(dd).slice(0, 7); }
      var mo = String(pick(t, ['dueMonth', 'month']) || '').slice(0, 7) || (link && link.b.month ? String(link.b.month).slice(0, 7) : '') || fromTitle || fromDay;
      var tyGuess = link ? link.ty : out.types.filter(function (x) { return title.indexOf(x.name + ' — ') === 0; })[0];
      var split = /\(\d+ of \d+\)\s*$/.test(title);
      var stv = String(t.status || '').toLowerCase(), status = /done|complete/.test(stv) || t.done === true ? 'done' : /progress/.test(stv) ? 'progress' : 'open';
      var proofUrl = pick(t, ['proofLink', 'proofUrl', 'proof', 'link', 'url']);
      out.tasks.push({ id: t.id || uid('task'), sponsorId: sid, month: mo, typeId: tyGuess ? tyGuess.id : '', title: title, qty: link && !split ? (num(link.b.quantity) || 1) : 1, owner: t.owner || '', due: due,
        status: status, doneAt: t.completedAt || '', notes: [t.notes, (proofUrl && typeof proofUrl === 'string' && !isUrl(proofUrl)) ? proofUrl : ''].filter(Boolean).join(' · '),
        proof: proofUrl && isUrl(proofUrl) ? { url: proofUrl, image: '', note: '', at: t.completedAt || '' } : null, custom: !!bespokeIds[t.id], legacy: t });
      stat.tk++;
    });
  });
  if (Array.isArray(src.recordedDates)) src.recordedDates.forEach(function (k) { out.days[String(k).slice(0, 10)] = { recorded: true, recordedOn: '' }; });
  if (src.assetsHubLink) out.assetsHubLink = src.assetsHubLink;
  if (src.recorded && typeof src.recorded === 'object') Object.keys(src.recorded).forEach(function (k) { var v = src.recorded[k]; out.days[k] = { recorded: !!v, recordedOn: typeof v === 'string' ? v : (v && v.date) || '' }; });
  if (src.days && typeof src.days === 'object') Object.keys(src.days).forEach(function (k) { var v = src.days[k]; if (v && v.recorded) out.days[k] = { recorded: true, recordedOn: v.recordedOn || v.recordedDate || '' }; });
  stat.rec = Object.keys(out.days).filter(function (k) { return out.days[k].recorded; }).length;
  out.archive = raw; out.importedAt = new Date().toISOString();
  return { data: out, summary: '<span><b>' + stat.sp + '</b> sponsors</span><span><b>' + stat.pl + '</b> episode placements</span><span><b>' + stat.bk + '</b> bookings</span><span><b>' + stat.tk + '</b> tasks</span><span><b>' + out.team.length + '</b> team members</span><span><b>' + stat.rec + '</b> recorded episodes</span>' };
}

/* ------------------------------------------------------------------ start */
load().then(function () { saveState = 'idle'; render(); if (API) setInterval(refreshFromServer, 45000); })
  .catch(function (err) {
    root.innerHTML = '<div class="k-main"><div class="k-banner">The sponsorship board could not load (' + esc(err.message) + '). <button class="k-btn sm" onclick="location.reload()">Try again</button></div></div>';
  });
window.KCSPortal = { data: function () { return D; }, convertOldBoard: convertOldBoard, parseContract: parseContract };
})();
