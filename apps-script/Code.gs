/**
 * Kirk Cameron Show Sponsorship Portal — shared data store.
 *
 * Keeps the board in this script's own storage (Script Properties). It needs no access to Drive, Gmail or
 * anything else in the Google account, so Google does not block it.
 *
 * Setup: paste this file into a new Apps Script project, run setup() once (it prints the shared key in the
 * execution log), then Deploy → New deployment → Web app, set Execute as: Me and Who has access: Anyone.
 * Put the web-app URL and the key in the embed link: …/kcs-sponsor-portal/#api=<URL>&key=<KEY>
 *
 * The previous version is kept on every save, so one bad save can be undone with restorePrevious().
 * Storage limit is about 450 KB of board data (today's board is about 90 KB).
 */

var PROPS = PropertiesService.getScriptProperties();
var CHUNK = 6000;

function setup() {
  if (!PROPS.getProperty('KEY')) PROPS.setProperty('KEY', Utilities.getUuid().replace(/-/g, ''));
  if (!PROPS.getProperty('VERSION')) { PROPS.setProperty('VERSION', '1'); writeData_('DATA', JSON.stringify({ schema: 1, sponsors: [] })); }
  Logger.log('Setup done. KCS_API_KEY = ' + PROPS.getProperty('KEY'));
}

function readData_(prefix) {
  var n = +PROPS.getProperty(prefix + '_N') || 0, parts = [];
  for (var i = 0; i < n; i++) parts.push(PROPS.getProperty(prefix + '_' + i) || '');
  return parts.join('');
}
function writeData_(prefix, text) {
  var old = +PROPS.getProperty(prefix + '_N') || 0, props = {}, n = Math.ceil(text.length / CHUNK) || 1;
  for (var i = 0; i < n; i++) props[prefix + '_' + i] = text.slice(i * CHUNK, (i + 1) * CHUNK);
  props[prefix + '_N'] = String(n);
  PROPS.setProperties(props);
  for (var j = n; j < old; j++) PROPS.deleteProperty(prefix + '_' + j);
}

function restorePrevious() {
  var prev = readData_('PREV');
  if (!prev) { Logger.log('No previous version saved.'); return; }
  writeData_('DATA', prev);
  PROPS.setProperty('VERSION', String((+PROPS.getProperty('VERSION') || 1) + 1));
  Logger.log('Restored the previous version.');
}

function out_(o) { return ContentService.createTextOutput(JSON.stringify(o)).setMimeType(ContentService.MimeType.JSON); }

function doGet() { return out_({ ok: true, service: 'kcs-sponsor-portal' }); }

function doPost(e) {
  var body;
  try { body = JSON.parse(e.postData.contents); } catch (err) { return out_({ ok: false, error: 'Bad request' }); }
  if (!PROPS.getProperty('KEY') || body.key !== PROPS.getProperty('KEY')) return out_({ ok: false, error: 'Wrong key' });

  if (body.action === 'load') {
    return out_({ ok: true, data: JSON.parse(readData_('DATA') || '{}'), version: +PROPS.getProperty('VERSION') });
  }

  if (body.action === 'save') {
    var lock = LockService.getScriptLock();
    if (!lock.tryLock(20000)) return out_({ ok: false, error: 'Busy, try again' });
    try {
      var current = +PROPS.getProperty('VERSION');
      if (body.version !== current) {
        return out_({ ok: false, conflict: true, data: JSON.parse(readData_('DATA') || '{}'), version: current });
      }
      var text = JSON.stringify(body.data);
      if (text.length > 220000) return out_({ ok: false, error: 'The board is too large for this store' });
      writeData_('PREV', readData_('DATA'));
      writeData_('DATA', text);
      var next = current + 1;
      PROPS.setProperty('VERSION', String(next));
      return out_({ ok: true, version: next });
    } finally { lock.releaseLock(); }
  }

  return out_({ ok: false, error: 'Unknown action' });
}
