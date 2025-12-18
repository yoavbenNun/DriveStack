#include "DeleteCommand.h"
#include <cstdio>  // For std::remove
#include <fstream> // For std::ifstream (to check existence)
#include "storage/FileStorage.h"
#include <shared_mutex>
#include <mutex>


std::string DeleteCommand::execute(const std::vector<std::string>& args) {
    auto& storage = FileStorage::instance();
    std::unique_lock lock(storage.mutex()); 
    // 1. Validate arguments
    if (args.empty()) {
        return "400 Bad Request\n";
    }

    std::string filename = args[0];

    // 2. Check if file exists before trying to delete
    // (This is needed to return 404 correctly as per requirements)
    std::ifstream f(filename);
    if (!f.good()) {
        return "404 Not Found\n"; // [cite: 63]
    }
    f.close(); // Close before deleting!

    // 3. Perform deletion
    if (std::remove(filename.c_str()) == 0) {
        // Success
        return "204 No Content\n"; // [cite: 55]
    } else {
        // Failed to delete for some reason (permissions, etc.)
        return "400 Bad Request\n"; 
    }
}