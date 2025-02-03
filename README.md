# Type-Script-javascript-Based-telgram-bot-
Telegram Advance Order Processing Bot

Telegram Advance Order Processing Bot
यह बॉट बहुत ही एडवांस और इंटेलिजेंट है। बॉट उपयोगकर्ताओं से आदेश प्राप्त करता है, उसे पार्स करता है, संबंधित समूह में भेजता है, और Google Sheets में सेव करता है।

Features:
Webhook सेटअप और चेकिंग
पिनकोड के आधार पर स्थान का पता लगाना। अगर पिनकोड गलत है, तो बॉट जिला नाम के आधार पर आदेश को संबंधित समूह में भेजेगा। और अगर जिले के नाम की स्पेलिंग में कोई गलती है, तो बॉट खुद ही उसे सही करके आदेश को समूह में भेजेगा।
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
