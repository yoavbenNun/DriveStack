#include "AddCommand.h"
#include <fstream>
#include <iostream>
#include <filesystem>
#include <cstdlib> // For std::getenv
#include "RLE.h"
#include "Storage/FileStorage.h"
#include <shared_mutex>
#include <mutex>

namespace fs = std::filesystem;

std::string AddCommand::execute(const std::vector<std::string>& args) {
    // 1. Thread Safety (from Server merge)
    auto& storage = FileStorage::instance();
    std::unique_lock lock(storage.mutex());
    
    // 2. Basic validation
    if (args.size() < 2) {
        return "400 Bad Request\n";
    }

    std::string filename;
    size_t contentStartIndex = 0;

    if (args[0] == "POST") {
        if (args.size() < 2) return "400 Bad Request\n";
        filename = args[1];
        contentStartIndex = 2;
    } else {
        if (args.size() < 2) return "400 Bad Request\n";
        filename = args[0];
        contentStartIndex = 1;
    }

    std::string content = "";
    for (size_t i = contentStartIndex; i < args.size(); ++i) {
        if (i > contentStartIndex) {
            content += " "; 
        }
        content += args[i];
    }

    // 3. Validation: Search for invalid chars in file name + Directory Traversal
    const std::string invalidChars = " <>:\"/\\|?*,";
    if (filename.find_first_of(invalidChars) != std::string::npos) {
        return "400 Bad Request\n";
    }
    if (filename.find("..") != std::string::npos) {
    return "400 Bad Request\n";
    }


    // 4. Perform compression
    std::string compressedData = RLE::compress(content);
  
  
    // 5. DOCKER FIX: Get the correct path (Hybrid Solution)
    const char* envPath = std::getenv("CLI_SAVE_PATH");
    std::string storageDir = (envPath != nullptr) ? envPath : ".";
    std::string fullPath = storageDir + "/" + filename; 

    // 6. Prevent Overwrite (Check if file exists using FULL PATH)
    std::ifstream checkFile(fullPath);
    if (checkFile.good()) {
        checkFile.close();
        // Return error if file already exists
        return "404 Not Found\n"; 
    }
    checkFile.close();

    // 7. Create the file (using fullPath)
    std::ofstream outFile(fullPath);
    
    if (!outFile.is_open()) {
        return "400 Bad Request\n";
    }

    outFile << compressedData;
    outFile.close();

    // 8. Return success
    return "201 Created\n";
}