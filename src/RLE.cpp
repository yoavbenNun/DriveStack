#include "RLE.h"
#include <string>
#include <sstream>

namespace RLE {

    std::string compress(const std::string& text) {
        if (text.empty()) {
            return "";
        }

        std::stringstream result;
        int count = 1;
        
        for (size_t i = 0; i < text.length(); ++i) {
            
            // This is the NEW logic:
            // We split if the next char is different OR if the count hits 9
            if (i + 1 < text.length() && text[i] == text[i + 1] && count < 9) {
                // If same char AND count is less than 9, just increment
                count++;
            } else {
                // Otherwise (char changed OR count hit 9), append the run
                result << count << text[i];
                
                // Reset counter for the next run
                count = 1;
            }
        }
        
        return result.str();
    }

    /**
     * @brief Decompresses an RLE encoded string.
     * Assumes the format is always [Single Digit][Character] (e.g., "3A2B").
     */
    std::string decompress(const std::string& compressedText) {
        std::string result = "";
        
        // Iterate through the string in steps of 2 (since each pair is 2 chars long)
        for (size_t i = 0; i < compressedText.length(); i += 2) {
            
            // 1. Get the count.
            // Since we ensured count is 1-9 during compression, it's always a single digit.
            // Subtracting '0' converts the char '9'-'0' to the integer 9-0.
            int count = compressedText[i] - '0';

            // 2. Get the character to repeat.
            // We verify i+1 exists to be safe (though valid RLE should always have pairs).
            if (i + 1 < compressedText.length()) {
                char charToRepeat = compressedText[i + 1];
                
                // Append the character 'count' times to the result string
                result.append(count, charToRepeat);
            }
        }
        
        return result;
    }
    
} // namespace RLE