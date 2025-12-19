#include "SearchCommand.h"
#include "RLE.h"
#include <iostream>
#include <fstream>
#include <filesystem>
#include <cstdlib>
#include <algorithm>
#include <stdexcept>
#include "Storage/FileStorage.h"
#include <shared_mutex>

namespace fs = std::filesystem;

std::string SearchCommand::execute(const std::vector<std::string>& args) {
    auto& storage = FileStorage::instance();
    std::shared_lock lock(storage.mutex());
    // 1. Validation: Ensure a search query is provided AND is not empty strings
    // FIX: Added check for args[0].empty() to prevent matching everything
    if (args.empty() || args[0].empty()) {
        return "400 Bad Request\n";
    }
    std::string query = args[0];

    // 2. Path Setup
    const char* savePathEnv = std::getenv("CLI_SAVE_PATH");
    std::string savePath = "./";
    if (savePathEnv != nullptr) {
        savePath = savePathEnv;
        if (!savePath.empty() && savePath.back() != '/' && savePath.back() != '\\') {
            savePath += "/";
        }
    }

    // 3. Directory Check
    if (!fs::exists(savePath)) {
        return "404 Not Found\n";
    }

    std::string results = "";
    bool firstMatch = true;
    bool foundAny = false;

    // 4. Iterate Files
    for (const auto& entry : fs::directory_iterator(savePath)) {
        if (!entry.is_regular_file()) {
            continue;
        }

        std::string filename = entry.path().filename().string();
        bool isMatch = false;

        // A. Search in Filename
        if (filename.find(query) != std::string::npos) {
            isMatch = true;
        }
        
        // B. Search in Content
        if (!isMatch) {
            std::ifstream file(entry.path());
            if (file.is_open()) {
                std::string encodedLine;
                if (std::getline(file, encodedLine)) {
                    try {
                        std::string decodedContent = RLE::decompress(encodedLine);
                        if (decodedContent.find(query) != std::string::npos) {
                            isMatch = true;
                        }
                    } catch (const std::exception&) {
                        // Ignore binary/corrupt files
                        isMatch = false;
                    }
                }
                file.close();
            }
        }

        if (isMatch) {
            if (!firstMatch) {
                results += "\n";
            }
            results += filename;
            firstMatch = false;
            foundAny = true;
        }
    }

    // 5. Final Result
    if (!foundAny) {
        return "404 Not Found\n";
    }

    return "200 Ok\n\n" + results;
}