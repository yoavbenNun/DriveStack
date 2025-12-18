#include "GetCommand.h"
#include "RLE.h"
#include <fstream>
#include <cstdlib>
#include <iostream>
#include "storage/FileStorage.h"
#include <shared_mutex>

std::string GetCommand::execute(const std::vector<std::string>& args) {
    // 1. Validation
    auto& storage = FileStorage::instance();
    std::shared_lock lock(storage.mutex());  
    if (args.empty()) {
        return "400 Bad Request\n";
    }
    std::string filename = args[0]; // Assuming args[0] is filename based on standard execute call
    // If called from main with {filename}, args[0] is filename.

    if (filename.find(' ') != std::string::npos) {
        return "400 Bad Request\n";
    }

    // 2. Path Logic
    const char* savePathEnv = std::getenv("CLI_SAVE_PATH");
    std::string savePath = "./";
    if (savePathEnv != nullptr) {
        savePath = savePathEnv;
        if (!savePath.empty() && savePath.back() != '/' && savePath.back() != '\\') {
            savePath += "/";
        }
    }
    std::string fullPath = savePath + filename;

    // 3. Open File
    std::ifstream file(fullPath);
    if (!file.is_open()) {
        return "404 Not Found\n";
    }

    std::string compressedText;
    if (!std::getline(file, compressedText)) {
        compressedText = "";
    }
    file.close();

    // 4. Decompress
    std::string decompressed = RLE::decompress(compressedText);

    // 5. Return formatted string
    return "200 Ok\n\n" + decompressed; 
}