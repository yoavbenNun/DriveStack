#include "AddCommand.h"
#include <fstream>
#include <iostream>
#include "RLE.h" 

std::string AddCommand::execute(const std::vector<std::string>& args) {
    // 1. Basic validation: ensure we have at least filename and content
    if (args.size() < 2) {
        return "400 Bad Request\n";
    }

    std::string filename;
    std::string content;

    if (args.size() == 3) {
        filename = args[1];
        content = args[2];
    } else {
        filename = args[0];
        content = args[1];
    }

    // search for space in file name
    if (filename.find(' ') != std::string::npos) {
        return "400 Bad Request\n";
    }

    // 2. Perform compression
    std::string compressedData = RLE::compress(content);

    // 3. Write to file
    // Note: In a real scenario, handle full paths or directory logic here
    std::ofstream outFile(filename);
    if (!outFile.is_open()) {
        // Return 400 or 404 depending on why it failed
        return "400 Bad Request\n";
    }

    outFile << compressedData;
    outFile.close();

    // 4. Return success response according to Ex2 protocol [cite: 50-52] 
    return "201 Created\n";
}