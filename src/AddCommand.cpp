#include "AddCommand.h" // Include the contract
#include "RLE.h"        // We need the RLE module to compress
#include <fstream>      // For writing to files (std::ofstream)
#include <cstdlib>      // For getting environment variables (getenv)
#include <string>       // For std::string manipulation

/**
 * @brief Executes the add command logic.
 * @param filename The name of the file to create.
 * @param content The text content to compress and save.
 */
void AddCommand::execute(const std::string& filename, const std::string& content) {

    if (filename.find(' ') != std::string::npos) {
        return; // Ignore the command by doing nothing
    }


    // 1. Get save path from environment variable
    const char* savePathEnv = std::getenv("CLI_SAVE_PATH");

    std::string savePath = "./"; // Default path is current directory
    if (savePathEnv != nullptr) {
        savePath = savePathEnv;
        // Ensure the path ends with a slash (or backslash on Windows)
        if (savePath.back() != '/' && savePath.back() != '\\') {
            savePath += "/"; // Or use platform-specific separator
        }
    }

    // 2. Create the full path
    std::string fullPath = savePath + filename;

    // 3. Compress the content (using RLE::compress)
    std::string compressedContent = RLE::compress(content);

    // 4. Create and write the compressed content to the file
    std::ofstream outFile(fullPath);
    if (outFile.is_open()) {
        outFile << compressedContent;
        outFile.close();
    }
}