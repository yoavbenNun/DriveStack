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

} // namespace RLE