#include "SearchCommand.h"
#include "RLE.h"

#include <filesystem>
#include <fstream>
#include <iostream>
#include <cstdlib>

std::vector<std::string> SearchCommand::execute(const std::string& content) {
    std::vector<std::string> results;

    // Invalid input → return empty
    if (content.empty())
        return results;

    // Directory of stored files (set by the environment variable)
    const char* env = std::getenv("CLI_SAVE_PATH");
    if (!env) {
        std::cerr << "CLI_SAVE_PATH not set.\n";
        return results;
    }

    std::string dirPath = env;

    // Iterate through all files in CLI_SAVE_PATH
    for (const auto& entry : std::filesystem::directory_iterator(dirPath)) {
        if (!entry.is_regular_file())
            continue;

        std::string filename = entry.path().filename().string();

        // Read and decompress file content
        std::string decompressed = readDecompressed(filename);

        // If the file contains the substring → add to results
        if (decompressed.find(content) != std::string::npos) {
            results.push_back(filename);
        }
    }

    return results;
}

std::string SearchCommand::readDecompressed(const std::string& filename) {
    const char* env = std::getenv("CLI_SAVE_PATH");
    std::string fullPath = std::string(env) + "/" + filename;

    std::ifstream file(fullPath);
    if (!file.is_open()) {
        return "";
    }

    std::string compressedContent;
    std::getline(file, compressedContent);
    file.close();

    // Use RLE namespace — correct!
    return RLE::decompress(compressedContent);
}
