/**
 * Kirk Cameron Show Sponsorship Portal — shared data store.
 *
 * Paste this whole file into a new Google Apps Script project (script.google.com, signed in to the
 * TPU Google account), then: Deploy → New deployment → type "Web app" →
 *   Execute as: Me    Who has access: Anyone
 * Copy the web-app URL into the Assembly embed as KCS_API_URL.
 *
 * Before deploying, run setup() once from the editor (choose setup in the toolbar, click Run, allow access).
 * It creates the data file and the proof-screenshot folder in your Drive and prints a shared key —
 * put that key in the Assembly embed as KCS_API_KEY.
 *
 * Data lives in one JSON file in Drive ("KCS Sponsor Portal — data.json"). Every save also keeps a dated
 * copy in the "KCS Sponsor Portal — history" folder (last 60 kept), so nothing is ever lost.
 */

var PROPS = PropertiesService.getScriptProperties();

function setup() {
  var root = DriveApp.getRootFolder();
  if (!PROPS.getProperty('DATA_FILE_ID')) {
    var f = root.createFile('KCS Sponsor Portal — data.json', JSON.stringify({ schema: 1, sponsors: [] }), 'application/json');
    PROPS.setProperty('DATA_FILE_ID', f.getId());
  }
  if (!PROPS.getProperty('PROOF_FOLDER_ID')) PROPS.setProperty('PROOF_FOLDER_ID', root.createFolder('KCS Sponsor Portal — proof screenshots').getId());
  if (!PROPS.getProperty('HISTORY_FOLDER_ID')) PROPS.setProperty('HISTORY_FOLDER_ID', root.createFolder('KCS Sponsor Portal — history').getId());
  if (!PROPS.getProperty('KEY')) PROPS.setProperty('KEY', Utilities.getUuid().replace(/-/g, ''));
  if (!PROPS.getProperty('VERSION')) PROPS.setProperty('VERSION', '1');
  Logger.log('Setup done. KCS_API_KEY = ' + PROPS.getProperty('KEY'));
}

function out_(o) { return ContentService.createTextOutput(JSON.stringify(o)).setMimeType(ContentService.MimeType.JSON); }

function doGet() { return out_({ ok: true, service: 'kcs-sponsor-portal' }); }

function doPost(e) {
  var body;
  try { body = JSON.parse(e.postData.contents); } catch (err) { return out_({ ok: false, error: 'Bad request' }); }
  if (!PROPS.getProperty('KEY') || body.key !== PROPS.getProperty('KEY')) return out_({ ok: false, error: 'Wrong key' });
  var file = DriveApp.getFileById(PROPS.getProperty('DATA_FILE_ID'));

  if (body.action === 'load') {
    return out_({ ok: true, data: JSON.parse(file.getBlob().getDataAsString() || '{}'), version: +PROPS.getProperty('VERSION') });
  }

  if (body.action === 'save') {
    var lock = LockService.getScriptLock();
    if (!lock.tryLock(20000)) return out_({ ok: false, error: 'Busy, try again' });
    try {
      var current = +PROPS.getProperty('VERSION');
      if (body.version !== current) {
        return out_({ ok: false, conflict: true, data: JSON.parse(file.getBlob().getDataAsString() || '{}'), version: current });
      }
      var text = JSON.stringify(body.data);
      file.setContent(text);
      var next = current + 1;
      PROPS.setProperty('VERSION', String(next));
      keepHistory_(text);
      return out_({ ok: true, version: next });
    } finally { lock.releaseLock(); }
  }

  if (body.action === 'upload') {
    var m = String(body.dataUrl || '').match(/^data:(image\/[\w.+-]+);base64,(.+)$/);
    if (!m) return out_({ ok: false, error: 'Not an image' });
    var blob = Utilities.newBlob(Utilities.base64Decode(m[2]), m[1], (new Date()).toISOString().slice(0, 10) + ' ' + String(body.name || 'proof').slice(0, 80));
    var img = DriveApp.getFolderById(PROPS.getProperty('PROOF_FOLDER_ID')).createFile(blob);
    img.setSharing(DriveApp.Access.ANYONE_WITH_LINK, DriveApp.Permission.VIEW);
    return out_({ ok: true, url: 'https://drive.google.com/file/d/' + img.getId() + '/view' });
  }

  return out_({ ok: false, error: 'Unknown action' });
}

// One copy per save, at most one per 10 minutes, newest 60 kept.
function keepHistory_(text) {
  var last = +PROPS.getProperty('LAST_HISTORY') || 0, now = Date.now();
  if (now - last < 10 * 60 * 1000) return;
  PROPS.setProperty('LAST_HISTORY', String(now));
  var folder = DriveApp.getFolderById(PROPS.getProperty('HISTORY_FOLDER_ID'));
  folder.createFile('data ' + new Date().toISOString().replace(/[:T]/g, '-').slice(0, 16) + '.json', text, 'application/json');
  var files = [], it = folder.getFiles();
  while (it.hasNext()) files.push(it.next());
  files.sort(function (a, b) { return b.getDateCreated() - a.getDateCreated(); });
  files.slice(60).forEach(function (f) { f.setTrashed(true); });
}
