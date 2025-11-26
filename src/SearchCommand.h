#ifndef SEARCH_COMMAND_H
#define SEARCH_COMMAND_H

#include <string>
#include <vector>

class SearchCommand {
public:
    // Executes a search for 'content' inside all stored files.
    // Returns a list of filenames that contain the substring.
    std::vector<std::string> execute(const std::string& content);

private:
    // Helper: read decompressed file content using RLE
    std::string readDecompressed(const std::string& filename);
};

#endif
