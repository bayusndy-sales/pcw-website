// Outgoing email: send through the pcwfreight.com mail relay (From noreply@pcwfreight.com).
// Falls back to MailApp (script owner's Gmail) if the relay is not paired or fails.
var MAIL_RELAY_URL = 'https://pcwfreight.com/mailrelay.php';
var MAIL_REPLY_TO = 'info@pcwfreight.com';

function mailHex_(bytes) { return bytes.map(function (b) { return ('0' + (b & 0xff).toString(16)).slice(-2); }).join(''); }

function sendMail_(o) {
  var key = PropertiesService.getScriptProperties().getProperty('MAIL_KEY');
  var reply = o.replyTo || MAIL_REPLY_TO;
  if (key) {
    try {
      var body = JSON.stringify({ to: o.to, subject: o.subject, body: o.body, name: o.name || 'PCW Freight', replyTo: reply, ts: Date.now(),
        att: (o.attachments || []).map(function (b) { return { n: b.getName(), t: b.getContentType(), d: Utilities.base64Encode(b.getBytes()) }; }) });
      var res = UrlFetchApp.fetch(MAIL_RELAY_URL, { method: 'post', contentType: 'application/json', payload: body,
        headers: { 'X-PCW-Sig': mailHex_(Utilities.computeHmacSha256Signature(body, key, Utilities.Charset.UTF_8)) }, muteHttpExceptions: true });
      if (res.getResponseCode() === 200 && /"ok":true/.test(res.getContentText())) return 'relay';
      console.error('mail relay failed', res.getResponseCode(), res.getContentText().slice(0, 200));
    } catch (e) { console.error('mail relay error', e); }
  }
  var m = { to: o.to, subject: o.subject, body: o.body, name: o.name || 'PCW Freight', replyTo: reply };
  if (o.attachments) m.attachments = o.attachments;
  MailApp.sendEmail(m);
  return 'gmail';
}

/** Run once from the editor: creates MAIL_KEY and registers it with the relay (first pairing only). */
function mailPair() {
  var pr = PropertiesService.getScriptProperties();
  var k = pr.getProperty('MAIL_KEY');
  if (!k) { k = (Utilities.getUuid() + Utilities.getUuid() + Utilities.getUuid()).replace(/-/g, ''); pr.setProperty('MAIL_KEY', k); }
  var r = UrlFetchApp.fetch(MAIL_RELAY_URL + '?pair=1', { method: 'post', contentType: 'application/json', payload: JSON.stringify({ key: k }), muteHttpExceptions: true });
  var out = r.getResponseCode() + ' ' + r.getContentText();
  console.log(out); return out;
}

/** Run from the editor: sends one test email to the notification address via the relay. */
function mailTest() {
  var to = settings_().Notify_Email;
  var via = sendMail_({ to: to, subject: 'PCW mail relay test ' + new Date().toISOString(), body: 'Test from noreply@pcwfreight.com via the website mail relay.\nReplies go to ' + MAIL_REPLY_TO + '.' });
  console.log('sent to ' + to + ' via ' + via); return via;
}
