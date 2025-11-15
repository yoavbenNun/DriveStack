#ifndef RLE_H
#define RLE_H

#include <string> // We will use std::string

// We create a namespace 'RLE' to organize our code
// This helps prevent name conflicts and follows the Single Responsibility Principle
namespace RLE {

    /**
     * @brief Compresses a string using the Run-Length Encoding method.
     * @param text The original string (e.g., "AAABBC")
     * @return The compressed string (e.g., "3A2B1C")
     */
    std::string compress(const std::string& text);

    // TODO: We will add the declaration for the decompress function here later
    // std::string decompress(const std::string& compressedText);

} // namespace RLE

#endif // RLE_H