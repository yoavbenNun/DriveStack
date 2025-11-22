#ifndef COMMAND_PARSER_H
#define COMMAND_PARSER_H

#include <string>
#include <vector>

class CommandParser {
public:
    /**
     * @brief Parses a command line string into a vector of arguments.
     * Handles quotes correctly (e.g., 'add file "hello world"' -> ["add", "file", "hello world"])
     */
    std::vector<std::string> parse(const std::string& line);
};

#endif // COMMAND_PARSER_H