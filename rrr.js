class TelegramBot {
  constructor(t) {
    this.API = `https://api.telegram.org/bot${t}`;
    this.token = t;
  }
  webhook(u, a) { this._call(`/setWebhook?url=${u}`, a); }
  getWebhook() { this._call('/getWebhookInfo'); }
  send(c, t) { this._call('/sendMessage', {chat_id:c, text:t}); }
  _call(e, d) {
    try {
      const r = UrlFetchApp.fetch(this.API+e, d && {method:'post', contentType:'application/json', payload:JSON.stringify(d)});
      Logger.log(d ? 'Sent' : 'Result:', r.getContentText());
    } catch(e) { Logger.log(`Error${d?' sending':''}: ${e}`); }
  }
}

class OrderParser {
  constructor() {
    this.fields = {
      name: /(naam|name|नाम|my name)(\s*[:-]?\s*)(.+?)(?=\s*(?:address|pincode|district|state|phone|order|$))/gi,
      address: /(address|पता|adress)(\s*[:-]?\s*)(.+?)(?=\s*(?:pincode|district|state|phone|order|$))/gi,
      pincode: /(pincode|pin|पिन)(\s*[:-]?\s*)(\d+)/gi,
      district: /(district|जिला|zilla)(\s*[:-]?\s*)(.+?)(?=\s*(?:state|phone|order|$))/gi,
      state: /(state|राज्य)(\s*[:-]?\s*)(.+?)(?=\s*(?:phone|order|$))/gi,
      phone: /(phone|mobile|फोन)(\s*[:-]?\s*)(\d+)/gi,
      orderDetails: /(order|ऑर्डर)(\s*[:-]?\s*)([\s\S]*)/gi
    };
  }
  
  parse(t) {
    return Object.entries(this.fields).reduce((o,[k,r]) => 
      (([,,[v]] = t.match(r) || []) ? (o[k] = v?.trim(), t=t.replace(r,'')) : null, o), {});
  }
}

class OrderHandler {
  constructor() {
    this.bot = new TelegramBot("BOT_TOKEN");
    this.groups = {bhind:'-1002413173548', morena:'-1002270975638', gwalior:'-1002420457309'};
  }

  process(e) {
    const d = JSON.parse(e.postData.contents).message;
    if (!d.text) return;
    
    const [cid, txt] = [d.chat.id, d.text.toLowerCase()];
    if (txt === '/start') return this.bot.send(cid, "Format: Name:...\nAddress:...\nPincode:...etc");
    
    const order = new OrderParser().parse(d.text);
    const loc = this._getLocation(order.pincode);
    order.district = this._matchDistrict(order.district, loc?.district);
    
    SpreadsheetApp.getActiveSheet().appendRow(Object.values(order));
    this.bot.send(this.groups[order.district] || cid, 
      `New Order:\n👤${order.name}\n📍${order.address}\n📌${order.pincode}\n🏙${order.district}\n📞${order.phone}\n📝${order.orderDetails}`);
  }

  _getLocation(p) {
    try {
      const r = UrlFetchApp.fetch(`https://api.postalpincode.in/pincode/${p}`);
      return JSON.parse(r)[0]?.PostOffice?.[0];
    } catch(e) { return null; }
  }

  _matchDistrict(u, a) {
    return Object.keys(this.groups).find(d => 
      d === a?.toLowerCase() || 
      (d.includes(u) || u.includes(d))) || u;
  }
}

// Global Instance
const handler = new OrderHandler();

function doPost(e) { handler.process(e); }
function setWebhook() { new TelegramBot("BOT_TOKEN").webhook("WEBAPP_URL"); }