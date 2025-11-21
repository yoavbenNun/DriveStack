#include "GetCommand.h" // Include the contract
#include "RLE.h"        // We need the RLE module to compress
#include <fstream>      // For writing to files (std::ofstream)
#include <cstdlib>      // For getting environment variables (getenv)
#include <string>       // For std::string manipulation
#include <iostream>

/**
 * @brief Executes the get command logic.
 * @param filename The name of the file to read and decompress.
 * @return The decompressed content of the file.
 */

 void get(const std::string& filename ){
    if(filename.find(' ') != std::string::npos){
        return;
    } // Ignore the command by doing nothing


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

    //3. open the file 
    std::ifstream file(fullPath);
        if (!file.is_open())
        {
            return; //file doesnt exist so ignore it qeutly
        }
        
    std::string compressedText;
    std::getline(file, compressedText);  // read only one line from the file
    file.close();                        

    //4. decompress the RLE compress from ADD.
    std::string decompressed = RLE::decompress(compressedText);

    //5. print the decompressed string to the user.
    std::cout << decompressed << std::endl;
 }