# Type-Script-javascript-Based-telegram-Bot-
Telegram Advance Order Processing Bot
It has been explained in both the languages, first in Hindi and then in English.

Hindi Explanation:

Telegram Advance Order Processing Bot
यह बॉट बहुत ही एडवांस और इंटेलिजेंट है। बॉट उपयोगकर्ताओं से आदेश प्राप्त करता है, उसे पार्स करता है, संबंधित समूह में भेजता है, और Google Sheets में सेव करता है।

Features:
Webhook सेटअप और चेकिंग
पिनकोड के आधार पर जिले और राज्य की जानकारी प्राप्त की जाती है। लेकिन ऑर्डर में जिला का नाम होना आवश्यक है। बॉट API से प्राप्त जिले और ऑर्डर में दिए गए जिले की Fuzzy Matching करता है। यदि दोनों में समानता पाई जाती है, तो बॉट ऑर्डर में दिए गए जिले को API से प्राप्त जिले से प्रतिस्थापित (replace) कर देता है, जिससे यूजर द्वारा दी गई जिले की स्पेलिंग स्वतः ठीक हो जाती है। इसके बाद, बॉट आदेश को संबंधित समूह में भेजता है।

यदि पिन कोड गलत है, fuzzy matching विफल होती है, या API से डेटा प्राप्त नहीं होता है, तो बॉट केवल ऑर्डर में दिए गए जिला नाम के आधार पर आदेश को संबंधित समूह में भेजता है। और अगर जिले के नाम की स्पेलिंग में कोई गलती है, तो बॉट खुद ही उसे सही करके आदेश को समूह में भेजेगा।

फिर आदेश को Google Sheets में सेव करना।
जिला आधारित समूहों में आदेश भेजना।
फज़ी मैचिंग (Fuzzy Matching) का उपयोग।
Functions:
setWebhook(): Webhook सेट करने के लिए।
checkWebhook(): Webhook की स्थिति चेक करने के लिए।
getLocationByPin(pinCode): पिनकोड के आधार पर स्थान की जानकारी प्राप्त करने के लिए।
fuzzyMatch(str1, str2): दो स्ट्रिंग्स के बीच समानता की जांच करने के लिए।
doPost(e): प्राप्त संदेश को प्रोसेस करने के लिए।
saveOrderToSheet(orderDetails): आदेश को Google Sheets में सेव करने के लिए।
sendOrderToDistrictGroup(orderDetails, chatId): आदेश को संबंधित जिले के समूह में भेजने के लिए।
sendMessage(chatId, text): उपयोगकर्ता को संदेश भेजने के लिए।
FIELD_SYNONYMS: विभिन्न क्षेत्रों के समानार्थक शब्द।
createFieldRegex(fieldName, allFields): प्रत्येक क्षेत्र के लिए regex पैटर्न बनाने के लिए।
extractField(text, fieldName, allFields): एक विशेष क्षेत्र की जानकारी निकालने के लिए।
parseOrderDataRecursive(text, fieldNames, result = {}): आदेश डेटा को रीकर्सिव रूप से पार्स करने के लिए।
parseOrderData(text): आदेश डेटा को पार्स करने के लिए।


Example:
javascript:

const testText = `
New Order:
Name: mr your name  
Address: your address  
Pincode: xxxxxx
District: indore // this is an example 
State: madhya pradesh
Phone: xxxxxxxxx
Order: 2 Pizza
`;

const parsedData = parseOrderData(testText);
console.log('Parsed data:', parsedData);


Setup Instructions:
Google Sheets में सेटअप:

Telegram पर अपने बॉट को बनाएँ।
समूहों में बॉट को जोड़ें और उसे admin बनाएं।
बॉट को order भेजने के लिए तैयार करें। बॉट प्रतिक्रिया देना शुरू कर देगा।
Google Sheets में सेटअप:
Google Sheets में जाएं:

Google Sheets खोलें।
ऊपर मेनू में "Extensions" पर क्लिक करें और फिर "Apps Script" को चुनें।
Google Apps Script में स्क्रिप्ट पेस्ट करें:

Google Apps Script एडिटर में, स्क्रिप्ट पेस्ट करने के लिए एक नया फ़ाइल बनाएं।
पेस्ट किए गए कोड में, निम्नलिखित पंक्ति को ढूंढें:

const TELEGRAM_TOKEN = "7731835843:AAE9FCDDtbHaAClf2MSM18EfzySba6ebocg"; // अपने बॉट का टोकन यहां डालें
यहां अपने बॉट का सही टोकन पेस्ट करें। टोकन आपको BotFather से मिलेगा, जब आपने अपना Telegram bot बनाया होगा।

फिर, "Run" बटन दबाकर स्क्रिप्ट को चलाएं, ताकि Webhook सेट हो जाए और आपका बॉट सक्रिय हो जाए।

English Explanation:

TypeScript/JavaScript-Based Telegram Bot
Telegram Advance Order Processing Bot
This bot is highly advanced and intelligent. It receives orders from users, parses them, sends them to the relevant group, and saves them in Google Sheets.

Features:
✅ Webhook setup and checking.
✅ Location detection based on pin code. If the pin code is incorrect, the bot will send the order to the relevant group based on the district name. If there is a spelling mistake in the district name, the bot will automatically correct it and send the order to the group.
✅ Saves orders in Google Sheets.
✅ Sends orders to district-based groups.
✅ Uses Fuzzy Matching to correct input errors.

Functions:
setWebhook() → To set up the webhook.
checkWebhook() → To check the webhook status.
getLocationByPin(pinCode) → Retrieves location details based on pin code.
fuzzyMatch(str1, str2) → Checks similarity between two strings.
doPost(e) → Processes the received message.
saveOrderToSheet(orderDetails) → Saves the order to Google Sheets.
sendOrderToDistrictGroup(orderDetails, chatId) → Sends the order to the relevant district group.
sendMessage(chatId, text) → Sends a message to the user.
FIELD_SYNONYMS → Contains synonyms for different fields.
createFieldRegex(fieldName, allFields) → Creates regex patterns for each field.
extractField(text, fieldName, allFields) → Extracts specific field information.
parseOrderDataRecursive(text, fieldNames, result = {}) → Recursively parses order data.
parseOrderData(text) → Parses order data.
Example Usage:
javascript
Copy
Edit
const testText = `
New Order:
Name: Mr. Your Name  
Address: Your Address  
Pincode: xxxxxx
District: Indore // this is an example  
State: Madhya Pradesh  
Phone: xxxxxxxxx  
Order: 2 Pizza
`;

const parsedData = parseOrderData(testText);
console.log('Parsed data:', parsedData);
Setup Instructions:
1. Setting up Google Sheets:
1️⃣ Open Google Sheets.
2️⃣ Go to Extensions → Apps Script.
3️⃣ In the Google Apps Script editor, create a new file and paste the script.
4️⃣ Locate the following line:

javascript
Copy
Edit
const TELEGRAM_TOKEN = "YOUR_BOT_TOKEN"; // Replace with your bot token  
Replace "YOUR_BOT_TOKEN" with the actual token received from BotFather on Telegram.

5️⃣ Click on Run to activate the script and set up the webhook.

2. Setting up the Telegram Bot:
1️⃣ Create a bot using BotFather and get the token.
2️⃣ Add the bot to your Telegram groups and make it an admin.
3️⃣ Start sending orders to the bot, and it will begin responding automatically.

Now your Telegram Advance Order Processing Bot is ready to process orders, correct errors, and store data efficiently! 🚀


