#include <iostream>
#include <regex>
#include <string>
#include <map>
#include <vector>
#include <algorithm>

// Define field synonyms
std::map<std::string, std::vector<std::string>> FIELD_SYNONYMS = {
    {"Name", {"Name", "naam"}},
    {"Address", {"Address"}},
    {"Pincode", {"Pincode"}},
    {"District", {"District"}},
    {"State", {"State"}},
    {"Phone", {"Phone"}},
    {"Order", {"Order"}}
};

// Cache for compiled regex
std::map<std::string, std::regex> regexCache;

// Function to create regex pattern for a field
std::regex createFieldRegex(const std::string& fieldName, const std::vector<std::string>& allFields) {
    if (regexCache.find(fieldName) == regexCache.end()) {
        auto synonyms = FIELD_SYNONYMS[fieldName];
        std::sort(synonyms.begin(), synonyms.end(), [](const std::string& a, const std::string& b){
            return a.size() > b.size();
        });

        std::vector<std::string> boundaryFields;
        for (const auto& f : allFields) {
            if (f != fieldName) {
                boundaryFields.insert(boundaryFields.end(), FIELD_SYNONYMS[f].begin(), FIELD_SYNONYMS[f].end());
            }
        }

        std::string synonymsPattern;
        for (size_t i = 0; i < synonyms.size(); ++i) {
            synonymsPattern += std::regex_replace(synonyms[i], std::regex("\\s+"), "\\s*");
            if (i != synonyms.size() - 1) synonymsPattern += "|";
        }

        std::string boundaryPattern;
        for (size_t i = 0; i < boundaryFields.size(); ++i) {
            boundaryPattern += "(?:" + std::regex_replace(boundaryFields[i], std::regex("\\s+"), "\\s*") + ")";
            if (i != boundaryFields.size() - 1) boundaryPattern += "|";
        }

        // Fixed pattern for C++ std::regex (remove (?i) and *? non-greedy)
        std::string finalPattern = "(?:" + synonymsPattern + ")\\s*[:\\-]*\\s*(.*?)(?=\\s*(?:" + boundaryPattern + "|$))";

        // Compile regex with case-insensitive flag
        regexCache[fieldName] = std::regex(finalPattern, std::regex_constants::ECMAScript | std::regex_constants::icase);
    }
    return regexCache[fieldName];
}

// Extract field values from text
std::pair<std::string, std::string> extractField(const std::string& text, const std::string& fieldName, const std::vector<std::string>& allFields) {
    std::regex fieldRegex = createFieldRegex(fieldName, allFields);
    std::sregex_iterator begin(text.begin(), text.end(), fieldRegex);
    std::sregex_iterator end;

    std::vector<std::string> values;
    std::string updatedText = text;

    for (auto it = begin; it != end; ++it) {
        std::string val = (*it)[1].str();
        // Trim spaces
        val.erase(val.find_last_not_of(" \n\r\t")+1);
        val.erase(0, val.find_first_not_of(" \n\r\t"));
        if (!val.empty()) values.push_back(val);

        // Remove matched portion from updatedText
        updatedText.replace(it->position(0), it->length(0), "");
    }

    std::string joinedValues;
    for (size_t i = 0; i < values.size(); ++i) {
        joinedValues += values[i];
        if (i != values.size() - 1) joinedValues += ", ";
    }

    return {joinedValues, updatedText};
}

// Recursive parsing function
void parseOrderDataRecursive(std::string text, const std::vector<std::string>& fieldNames, std::map<std::string, std::string>& result, size_t index = 0) {
    if (index >= fieldNames.size() || text.empty()) return;

    const std::string& currentField = fieldNames[index];
    auto [value, updatedText] = extractField(text, currentField, fieldNames);
    if (!value.empty()) result[currentField] = value;

    parseOrderDataRecursive(updatedText, fieldNames, result, index + 1);
}

// Main parsing function
std::map<std::string, std::string> parseOrderData(const std::string& text) {
    std::vector<std::string> fieldNames;
    for (const auto& kv : FIELD_SYNONYMS) fieldNames.push_back(kv.first);

    std::map<std::string, std::string> result;
    parseOrderDataRecursive(text, fieldNames, result);
    return result;
}

int main() {
    std::string testText = R"(
Address: 123 st nagar indore
Pincode: 452010
District: indore
State: Madhya Pradesh
Phone: 9876543210
Order: 2 Pizza
Naam Randu
)";

    std::cout << "Starting parsing process..." << std::endl;
    auto parsedData = parseOrderData(testText);

    std::cout << "Parsed data:" << std::endl;
    for (const auto& kv : parsedData) {
        std::cout << kv.first << ": " << kv.second << std::endl;
    }

    return 0;
}
