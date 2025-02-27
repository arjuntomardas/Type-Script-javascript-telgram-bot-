// Telegram Bot Class
class TelegramBot {
  constructor(token) {
    this.TELEGRAM_TOKEN = token;
    this.TELEGRAM_API_URL = `https://api.telegram.org/bot${this.TELEGRAM_TOKEN}`;
  }

  setWebhook(webhookUrl) {
    const url = `${this.TELEGRAM_API_URL}/setWebhook?url=${webhookUrl}`;
    try {
      const response = UrlFetchApp.fetch(url);
      Logger.log(response.getContentText());
    } catch (error) {
      Logger.log("Error setting webhook: " + error.message);
    }
  }

  checkWebhook() {
    const url = `${this.TELEGRAM_API_URL}/getWebhookInfo`;
    try {
      const response = UrlFetchApp.fetch(url);
      Logger.log("Webhook info: " + response.getContentText());
    } catch (error) {
      Logger.log("Error checking webhook: " + error.message);
    }
  }

  sendMessage(chatId, text) {
    const url = `${this.TELEGRAM_API_URL}/sendMessage`;
    const payload = {
      chat_id: chatId,
      text: text
    };
    const options = {
      method: "post",
      contentType: "application/json",
      payload: JSON.stringify(payload)
    };
    try {
      const response = UrlFetchApp.fetch(url, options);
      Logger.log("Message sent: " + response.getContentText());
    } catch (error) {
      Logger.log("Error sending message: " + error.message);
    }
  }
}

// Location Service Class
class LocationService {
  getLocationByPin(pinCode) {
    const url = `https://api.postalpincode.in/pincode/${pinCode}`;
    try {
      const response = UrlFetchApp.fetch(url);
      const data = JSON.parse(response.getContentText());
      if (data[0].Status === "Success" && data[0].PostOffice && data[0].PostOffice.length > 0) {
        const postOffice = data[0].PostOffice[0];
        return {
          district: postOffice.District.toLowerCase(),
          state: postOffice.State.toLowerCase()
        };
      }
      return null;
    } catch (error) {
      Logger.log("Error fetching location: " + error.message);
      return null;
    }
  }
}

// Fuzzy Matcher Class
class FuzzyMatcher {
  static match(str1, str2) {
    str1 = str1.toLowerCase();
    str2 = str2.toLowerCase();
    let matches = 0;
    for (let char of str1) {
      if (str2.includes(char)) matches++;
    }
    const similarity = (matches / Math.max(str1.length, str2.length)) * 100;
    return similarity >= 60;
  }
}

// Order Parser Class
class OrderParser {
  constructor() {
    this.FIELD_SYNONYMS = {
      name: ["naam","name", "nam", "mera naam", "mere naam","मेरा नाम", "मेरे नाम", "नाम", "मेरा शुभ नाम", "शुभनाम", 
        "my name", "my name is", "नाम क्या है", "अपना नाम"],
      address: ["address","my address", "adress","my address is", "add", "पता", "मेरा पता","पूरा पता", "फुल एड्रेस", "full address", "poora pta", 
        "घर का पता", "address detail","pata", "पता लिखें"],
      pincode: ["pincode", "pin code", "pin","post code", "postal code", "postcode", "zip","पिन", "पिनकोड", "zip code", "डाक कोड", "पोस्ट कोड"],
      district: ["my district name is", "district","my district is", "district is", "mera jila", "jila", "dist", "zilla", "जिला", "ज़िला","डिस्ट्रिक्ट", "डिस्ट्रिक", "zila", "mera zilla hai"],
      state: ["state", "rajya", "state name", "राज्य","स्टेट", "स्टेट नेम"],
      phone: ["phone number", "phone", "mobile", "mob","mob no","ph no", "mobile number","contact", "contact number", "फोन नंबर", "मोबाइल","मोबाइल नंबर", "संपर्क", "संपर्क नंबर", "मोबाइल फोन"],
      orderDetails: ["order details", "order", "details", "आदेश","आदेश विवरण", "ऑर्डर", "ऑर्डर डिटेल्स", "विवरण","ऑर्डर क्या है", "ऑर्डर जानकारी", "order info","order information"]
    };
    this.regexCache = {};
  }

  createFieldRegex(fieldName, allFields) {
    if (!this.regexCache[fieldName]) {
      const synonyms = this.FIELD_SYNONYMS[fieldName].sort((a, b) => b.length - a.length);
      const boundaryFields = allFields.filter(f => f !== fieldName);
      const boundaryPattern = boundaryFields
        .map(f => `(?:${this.FIELD_SYNONYMS[f].join('|').replace(/\s+/g, '\\s*')})`)
        .join('|');

      this.regexCache[fieldName] = new RegExp(
        `(?:${synonyms.join('|').replace(/\s+/g, '\\s*')})\\s*[:\\-]*\\s*([\\s\\S]*?)(?=\\s*(?:${boundaryPattern}|$))`,
        'gi'
      );
    }
    return this.regexCache[fieldName];
  }

  extractField(text, fieldName, allFields) {
    const regex = this.createFieldRegex(fieldName, allFields);
    const matches = [...text.matchAll(regex)];
    if (matches.length > 0) {
      const extractedValues = matches.map(match => match[1].trim()).filter(Boolean);
      const updatedText = matches.reduce((txt, match) => txt.replace(match[0], '').trim(), text);
      return { value: extractedValues.join(', '), updatedText };
    }
    return { value: "", updatedText: text };
  }

  parseOrderDataRecursive(text, fieldNames, result = {}) {
    if (!text.trim() || fieldNames.length === 0) return result;
    const [currentField, ...remainingFields] = fieldNames;
    const { value, updatedText } = this.extractField(text, currentField, fieldNames);
    if (value) result[currentField] = value;
    return this.parseOrderDataRecursive(updatedText, remainingFields, result);
  }

  parseOrderData(text) {
    const fieldNames = Object.keys(this.FIELD_SYNONYMS);
    return this.parseOrderDataRecursive(text, fieldNames);
  }
}

// Sheet Manager Class
class SheetManager {
  saveOrder(orderDetails) {
    const sheet = SpreadsheetApp.getActiveSpreadsheet().getActiveSheet();
    if (sheet.getLastRow() === 0) {
      sheet.appendRow(['Name', 'Address', 'Pincode', 'District', 'State', 'Phone Number', 'Order Details']);
    }
    sheet.appendRow([ 
      orderDetails.name,
      orderDetails.address,
      orderDetails.pincode,
      orderDetails.district,
      orderDetails.state,
      orderDetails.phone,
      orderDetails.orderDetails
    ]);
  }
}

// Main Processor Class
class OrderProcessor {
  constructor() {
    this.bot = new TelegramBot("your_bot_token");
    this.locationService = new LocationService();
    this.orderParser = new OrderParser();
    this.sheetManager = new SheetManager();
    this.districtGroupMap = {
      'bhind': '-1002413173548',
      'morena': '-1002270975638',
      'gwalior': '-1002420457309',
      'shivpuri': '-1009876543210'
    };
  }

  processRequest(e) {
    try {
      const data = JSON.parse(e.postData.contents);
      const chatId = data.message.chat.id;
      const text = data.message.text;

      if (text.toLowerCase() === "/start") {
        this.bot.sendMessage(chatId, "Welcome to the order bot! Please provide your order details...");
        return;
      }

      const orderDetails = this.orderParser.parseOrderData(text);
      const apiLocation = this.locationService.getLocationByPin(orderDetails.pincode);

      if (apiLocation) {
        if (!FuzzyMatcher.match(orderDetails.district, apiLocation.district)) {
          this.bot.sendMessage(chatId, "District mismatch. Using manual mapping...");
        }
      }

      this.processDistrict(orderDetails, chatId, apiLocation);
      this.sheetManager.saveOrder(orderDetails);
      this.sendToGroup(orderDetails, chatId);
      this.bot.sendMessage(chatId, "Order processed successfully!");
      
    } catch (error) {
      Logger.log("Error: " + error.message);
      this.bot.sendMessage(chatId, "Error processing your request.");
    }
  }

  processDistrict(orderDetails, chatId, apiLocation) {
    if (apiLocation) {
      orderDetails.district = apiLocation.district;
      orderDetails.state = apiLocation.state;
    } else {
      this.fallbackDistrictMapping(orderDetails, chatId);
    }
  }

  fallbackDistrictMapping(orderDetails, chatId) {
    let matched = false;
    for (const [district, groupId] of Object.entries(this.districtGroupMap)) {
      if (FuzzyMatcher.match(orderDetails.district, district)) {
        orderDetails.district = district;
        matched = true;
        break;
      }
    }
    if (!matched) throw new Error("District not found");
  }

  sendToGroup(orderDetails, chatId) {
    const groupId = this.districtGroupMap[orderDetails.district];
    if (!groupId) throw new Error("Group not found");
    
    const message = `New Order:\n👤Name: ${orderDetails.name}\n📍Address: ${orderDetails.address}\n📌Pincode: ${orderDetails.pincode}\n🏙District: ${orderDetails.district}\n🏛State: ${orderDetails.state}\n📞Phone: ${orderDetails.phone}\n📝Order: ${orderDetails.orderDetails}`;
    this.bot.sendMessage(groupId, message);
  }
}

// Global Functions
const processor = new OrderProcessor();

function doPost(e) {
  processor.processRequest(e);
}

function setWebhook() {
  const bot = new TelegramBot("your_bot_token");
  bot.setWebhook("your_webhook_url");
}

function checkWebhook() {
  const bot = new TelegramBot("your_bot_token");
  bot.checkWebhook();
}