class TelegramBot {
  constructor(token, webhookUrl) {
    this.token = token;
    this.apiUrl = `https://api.telegram.org/bot${token}`;
    this.webhookUrl = webhookUrl;
  }

  // Webhook सेट करें
  setWebhook() {
    const url = `${this.apiUrl}/setWebhook?url=${this.webhookUrl}`;
    try {
      const response = UrlFetchApp.fetch(url);
      Logger.log(response.getContentText());
    } catch (error) {
      Logger.log("Error setting webhook: " + error.message);
    }
  }

  // Webhook की जानकारी प्राप्त करें
  checkWebhook() {
    const url = `${this.apiUrl}/getWebhookInfo`;
    try {
      const response = UrlFetchApp.fetch(url);
      Logger.log("Webhook info: " + response.getContentText());
    } catch (error) {
      Logger.log("Error checking webhook: " + error.message);
    }
  }

  // Message भेजें
  sendMessage(chatId, text) {
    const url = `${this.apiUrl}/sendMessage`;
    const payload = {
      chat_id: chatId,
      text: text,
    };
    const options = {
      method: "post",
      contentType: "application/json",
      payload: JSON.stringify(payload),
    };

    try {
      const response = UrlFetchApp.fetch(url, options);
      Logger.log("Message sent: " + response.getContentText());
    } catch (error) {
      Logger.log("Error sending message: " + error.message);
    }
  }

  // Pin Code से लोकेशन प्राप्त करें (India Post API)
  getLocationByPin(pinCode) {
    const url = `https://api.postalpincode.in/pincode/${pinCode}`;
    try {
      const response = UrlFetchApp.fetch(url);
      const data = JSON.parse(response.getContentText());

      if (data[0].Status === "Success" && data[0].PostOffice.length > 0) {
        return {
          district: data[0].PostOffice[0].District.toLowerCase(),
          state: data[0].PostOffice[0].State.toLowerCase(),
        };
      }
      return null;
    } catch (error) {
      Logger.log("Error fetching location: " + error.message);
      return null;
    }
  }

  // Fuzzy Matching (2 Strings के बीच Similarity चेक करता है)
  fuzzyMatch(str1, str2) {
    str1 = str1.toLowerCase();
    str2 = str2.toLowerCase();
    let matches = 0;
    for (let char of str1) {
      if (str2.includes(char)) matches++;
    }
    return (matches / Math.max(str1.length, str2.length)) * 100 >= 60;
  }

  // Order डेटा प्रोसेस करें
  processOrder(chatId, text) {
    const orderDetails = this.parseOrderData(text);
    Logger.log("Parsed Order Details: " + JSON.stringify(orderDetails));

    const apiLocation = this.getLocationByPin(orderDetails.pincode);
    let matchedDistrict = null;

    if (apiLocation && this.fuzzyMatch(orderDetails.district, apiLocation.district)) {
      orderDetails.district = apiLocation.district;
      orderDetails.state = apiLocation.state;
    } else {
      this.sendMessage(chatId, "API से District match नहीं हुआ, fallback mapping उपयोग कर रहे हैं...");
    }

    if (!apiLocation || !this.fuzzyMatch(orderDetails.district, apiLocation.district)) {
      for (const district in this.districtGroupMap) {
        if (this.fuzzyMatch(orderDetails.district, district)) {
          matchedDistrict = district;
          orderDetails.district = matchedDistrict;
          break;
        }
      }

      if (!matchedDistrict) {
        this.sendMessage(chatId, "आपका जिला नहीं मिला, कृपया पुनः प्रयास करें।");
        return;
      }
    }

    this.saveOrderToSheet(orderDetails);
    this.sendOrderToDistrictGroup(orderDetails, chatId);
    this.sendMessage(chatId, "ऑर्डर प्राप्त हुआ और संबंधित समूह में भेज दिया गया!");
  }

  // Order को Google Sheet में सेव करें
  saveOrderToSheet(orderDetails) {
    const sheet = SpreadsheetApp.getActiveSpreadsheet().getActiveSheet();
    if (sheet.getLastRow() === 0) {
      sheet.appendRow(["Name", "Address", "Pincode", "District", "State", "Phone Number", "Order Details"]);
    }
    sheet.appendRow([
      orderDetails.name,
      orderDetails.address,
      orderDetails.pincode,
      orderDetails.district,
      orderDetails.state,
      orderDetails.phone,
      orderDetails.orderDetails,
    ]);
  }

  // Order को District Group में भेजें
  sendOrderToDistrictGroup(orderDetails, chatId) {
    const groupChatId = this.districtGroupMap[orderDetails.district.toLowerCase()];
    if (!groupChatId) {
      this.sendMessage(chatId, "Sorry, we don't have a group for your district yet.");
      return;
    }
    const message = `New Order:\n👤Name: ${orderDetails.name}\n📍Address: ${orderDetails.address}\n📌Pincode: ${orderDetails.pincode}\n🏙District: ${orderDetails.district}\n🏛State: ${orderDetails.state}\n📞Phone: ${orderDetails.phone}\n📝Order: ${orderDetails.orderDetails}`;
    this.sendMessage(groupChatId, message);
  }

  // ऑर्डर डेटा पार्स करें (Recursive)
  parseOrderData(text) {
    const fieldNames = Object.keys(this.FIELD_SYNONYMS);
    return this.parseOrderDataRecursive(text, fieldNames);
  }

  // ऑर्डर डेटा को Recursive तरीके से प्रोसेस करें
  parseOrderDataRecursive(text, fieldNames, result = {}) {
    if (!text.trim() || fieldNames.length === 0) return result;
    const [currentField, ...remainingFields] = fieldNames;
    const { value, updatedText } = this.extractField(text, currentField, fieldNames);
    if (value) result[currentField] = value;
    return this.parseOrderDataRecursive(updatedText, remainingFields, result);
  }
}

// **बॉट इनिशियलाइज़ करें**
const bot = new TelegramBot("your_bot_token", "your_webhook_url");

// Webhook सेट करें
bot.setWebhook();

// doPost API (Telegram Webhook Handle करने के लिए)
function doPost(e) {
  const data = JSON.parse(e.postData.contents);
  const chatId = data.message.chat.id;
  const text = data.message.text;

  if (text.toLowerCase() === "/start") {
    bot.sendMessage(chatId, "Welcome to the order bot! Send your order details.");
    return;
  }

  bot.processOrder(chatId, text);
}
