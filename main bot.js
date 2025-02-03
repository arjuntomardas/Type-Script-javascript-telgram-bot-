// TELEGRAM_TOKEN और TELEGRAM_API_URL को केवल एक बार डिक्लेयर करें
const TELEGRAM_TOKEN = "your_bot_token"; // अपने बॉट का टोकन यहां डालें
const TELEGRAM_API_URL = `https://api.telegram.org/bot${TELEGRAM_TOKEN}`; // API URL

// Webhook सेट करने का फंक्शन
function setWebhook() {
  const webhookUrl = "https://script.google.com/macros/s/AKfycbxIUWVK7n8njqd4fsgyq7JzBBKfzTjfQcWydDvtBS9pe02hQluGHYnFF2q2j98z0VgH/exec"; // अपना Web App URL यहां डालें
  const url = `${TELEGRAM_API_URL}/setWebhook?url=${webhookUrl}`;

  try {
    const response = UrlFetchApp.fetch(url);
    Logger.log(response.getContentText()); // Response को लॉग करें
  } catch (error) {
    Logger.log("Error setting webhook: " + error.message); // Error को लॉग करें
  }
}

// Webhook चेक करने का फंक्शन
function checkWebhook() {
  const url = `${TELEGRAM_API_URL}/getWebhookInfo`;
  try {
    const response = UrlFetchApp.fetch(url);
    Logger.log("Webhook info: " + response.getContentText());
  } catch (error) {
    Logger.log("Error checking webhook: " + error.message);
  }
}

// India Post API से लोकेशन डिटेल्स प्राप्त करने का फंक्शन
function getLocationByPin(pinCode) {
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
    return null; // अगर डेटा उपलब्ध नहीं है
  } catch (error) {
    Logger.log("Error fetching location: " + error.message);
    return null;
  }
}

// Fuzzy Matching का उपयोग करने वाला फंक्शन
function fuzzyMatch(str1, str2) {
  str1 = str1.toLowerCase();
  str2 = str2.toLowerCase();
  let matches = 0;
  for (let char of str1) {
    if (str2.includes(char)) matches++;
  }
  const similarity = (matches / Math.max(str1.length, str2.length)) * 100;
  return similarity >= 60; // 60% या उससे अधिक समानता के लिए True लौटाएं
}

// Message प्रोसेस करने का फंक्शन
function doPost(e) {
  try {
    const data = JSON.parse(e.postData.contents);
    Logger.log("Received data: " + JSON.stringify(data));

    const chatId = data.message.chat.id;
    const text = data.message.text;

    // /start कमांड की चेकिंग
    if (text.toLowerCase() === "/start") {
      sendMessage(chatId, "Welcome to the order bot! Please provide your order details in the following format:\nName: your name\nAddress: your address\nPincode: your pincode\nDistrict: your district\nState: your state\nPhone Number: your phone number\nOrder Details: your order");
      return;
    }

    // ऑर्डर डिटेल्स पार्स करें
    const orderDetails = parseOrderData(text);
    // **Console me parsed data print karna**
    Logger.log("Parsed Order Details: " + JSON.stringify(orderDetails));

    // District fallback logic
    const districtGroupMap = {
      'bhind': '-1002413173548',
      'morena': '-1002270975638',
      'gwalior': '-1002420457309',
      'shivpuri': '-1009876543210',
      // अन्य जिलों के लिए जोड़ें
    };

    let matchedDistrict = null;

    // API से लोकेशन प्राप्त करें
    const apiLocation = getLocationByPin(orderDetails.pincode);

    if (apiLocation) {
      // API से fuzzy match का प्रयास करें
      const fuzzyMatchResult = fuzzyMatch(orderDetails.district, apiLocation.district);

      if (fuzzyMatchResult) {
        orderDetails.district = apiLocation.district;
        orderDetails.state = apiLocation.state;
      } else {
        sendMessage(chatId, "API से मिला जिला आपके द्वारा दिए गए जिले से मेल नहीं खाता। District mapping का उपयोग कर रहे हैं...");
      }
    } else {
      sendMessage(chatId, "API से लोकेशन डेटा नहीं मिल सका। District mapping का उपयोग कर रहे हैं...");
    }

    // Fallback: अगर API fuzzy match नहीं कर पाई या API से डेटा नहीं मिला तो districtGroupMap से fuzzy match करें
    if (!apiLocation || !fuzzyMatch(orderDetails.district, apiLocation.district)) {
      for (const district in districtGroupMap) {
        if (fuzzyMatch(orderDetails.district, district)) {
          matchedDistrict = district;
          orderDetails.district = matchedDistrict; // Match हुआ जिला अपडेट करें
          break;
        }
      }

      if (!matchedDistrict) {
        sendMessage(chatId, "आपके द्वारा दिया गया जिला हमारे सिस्टम में नहीं पाया गया। कृपया पुनः प्रयास करें।");
        return;
      }
    }

    // Order को Google Sheet में सेव करें
    saveOrderToSheet(orderDetails);

    // Order को संबंधित District Group में भेजें
    sendOrderToDistrictGroup(orderDetails, chatId);
    sendMessage(chatId, "ऑर्डर प्राप्त हुआ और संबंधित समूह में भेज दिया गया!\nOrder received and sent to the relevant group.");

  } catch (error) {
    Logger.log("Error in doPost: " + error.message);
    sendMessage(data.message.chat.id, "Sorry, an error occurred while processing your order.");
  }
}

// Order को Google Sheets में सेव करें
function saveOrderToSheet(orderDetails) {
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

// Order को संबंधित District Group में भेजें
function sendOrderToDistrictGroup(orderDetails, chatId) {
  const districtGroupMap = {
    'bhind': '-1002413173548',
    'morena': '-1002270975638',
    'gwalior': '-1002420457309',
    'shivpuri': '-1009876543210',
    // अन्य जिलों के लिए जोड़ें
  };

  const groupChatId = districtGroupMap[orderDetails.district.toLowerCase()];
  if (!groupChatId) {
    sendMessage(chatId, "Sorry, we don't have a group for your district yet.");
    return;
  }

  const message = `New Order:\n👤Name: ${orderDetails.name}\n📍Address: ${orderDetails.address}\n📌Pincode: ${orderDetails.pincode}\n🏙District: ${orderDetails.district}\n🏛State: ${orderDetails.state}\n📞Phone: ${orderDetails.phone}\n📝Order: ${orderDetails.orderDetails}`;
  sendMessage(groupChatId, message);
}

// Message भेजने का फंक्शन
function sendMessage(chatId, text) {
  const url = `${TELEGRAM_API_URL}/sendMessage`;
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

// Field mapping ke liye synonyms
const FIELD_SYNONYMS = {
  /* name: ["naam","name", "nam", "mera naam", "mere naam","मेरा नाम", "मेरे नाम", "नाम", "मेरा शुभ नाम", "शुभनाम", 
    "my name", "my name is", "नाम क्या है", "अपना नाम"], // Name ke keywords */

   address: ["address","my address", "adress","my address is", "add", "पता", "मेरा पता","पूरा पता", "फुल एड्रेस", "full address", "poora pta", 
    "घर का पता", "address detail","pata", "पता लिखें"], // Address ke keywords

  pincode: ["pincode", "pin code", "pin","post code", "postal code", "postcode", "zip","पिन", "पिनकोड", "zip code", "डाक कोड", "पोस्ट कोड"], // Pincode ke keywords

  district: ["my district name is", "district","my district is", "district is", "mera jila", "jila", "dist", "zilla", "जिला", "ज़िला","डिस्ट्रिक्ट", "डिस्ट्रिक", "zila", "mera zilla hai"], // District ke keywords

  state: ["state", "rajya", "state name", "राज्य","स्टेट", "स्टेट नेम"], // State ke keywords

  phone: ["phone number", "phone", "mobile", "mob","mob no","ph no", "mobile number","contact", "contact number", "फोन नंबर", "मोबाइल","मोबाइल नंबर", "संपर्क", "संपर्क नंबर", "मोबाइल फोन"], // Phone number ke keywords

  orderDetails: ["order details", "order", "details", "आदेश","आदेश विवरण", "ऑर्डर", "ऑर्डर डिटेल्स", "विवरण","ऑर्डर क्या है", "ऑर्डर जानकारी", "order info","order information"], // Order Details ke keywords

  name: ["naam","name", "nam", "mera naam", "mere naam","मेरा नाम", "मेरे नाम", "नाम", "मेरा शुभ नाम", "शुभनाम", 
    "my name", "my name is", "नाम क्या है", "अपना नाम"], // Name ke keywords 

  pgaaaali: ["lopaaadff", "ladaaaiss"]

};

const regexCache = {};

// Function to create regex pattern for each field with boundaries
function createFieldRegex(fieldName, allFields) {
  if (!regexCache[fieldName]) {
    // Sort synonyms by length (longest first)
    const synonyms = FIELD_SYNONYMS[fieldName].sort((a, b) => b.length - a.length);

    // Create boundary pattern for all fields (excluding the current field)
    const boundaryFields = allFields.filter(f => f !== fieldName);
    const boundaryPattern = boundaryFields
      .map(f => `(?:${FIELD_SYNONYMS[f].join('|').replace(/\s+/g, '\\s*')})`)
      .join('|');

    // Updated Regex to capture multiple values
    regexCache[fieldName] = new RegExp(
      `(?:${synonyms.join('|').replace(/\s+/g, '\\s*')})\\s*[:\\-]*\\s*([\\s\\S]*?)(?=\\s*(?:${boundaryPattern}|$))`,
      'gi' // 'i' -> case insensitive, 'g' -> global search for multiple occurrences
    );
  }

  console.log(`Regex for ${fieldName}:`, regexCache[fieldName]);
  return regexCache[fieldName];
}

// Function to extract multiple values for a field
function extractField(text, fieldName, allFields) {
  const regex = createFieldRegex(fieldName, allFields);
  const matches = [...text.matchAll(regex)]; // Extract all occurrences

  if (matches.length > 0) {
    const extractedValues = matches.map(match => match[1].trim()).filter(Boolean); // Remove empty matches
    const updatedText = matches.reduce((txt, match) => txt.replace(match[0], '').trim(), text); // Remove matched text

    console.log(`Field ${fieldName} matched with values:`, extractedValues);
    console.log('Remaining text after extraction:', updatedText);

    return { value: extractedValues.join(', '), updatedText }; // Store all values in a single string
  }

  console.log(`Field ${fieldName} not found.`);
  return { value: "", updatedText: text };
}

// Recursive Parsing Logic to process fields
function parseOrderDataRecursive(text, fieldNames, result = {}) {
  if (!text.trim() || fieldNames.length === 0) return result;

  console.log('Current text:', text);
  console.log('Remaining fields:', fieldNames);

  const [currentField, ...remainingFields] = fieldNames;

  const { value, updatedText } = extractField(text, currentField, fieldNames);

  if (value) {
    result[currentField] = value;
  }

  return parseOrderDataRecursive(updatedText, remainingFields, result);
}

// Main Parsing Function
function parseOrderData(text) {
  const fieldNames = Object.keys(FIELD_SYNONYMS);
  return parseOrderDataRecursive(text, fieldNames);
};

// Test Input (Multiple Values for Same Field)
const testText = `
order:
Name: your name 
Address: 123 st nagar indore 
Pincode: 452010
District: indore 
State: Madhya Pradesh
Phone: 9876543210
Order: 2 Pizza
`; 

// Parse the text
console.log('Starting parsing process...');
const parsedData = parseOrderData(testText);
console.log('Parsed data:', parsedData);
