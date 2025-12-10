#ifndef COMMANDPARSER_H
#define COMMANDPARSER_H

#include <string>
#include <vector>
#include <memory>
#include <utility> // Required for std::pair
#include "Command.h"

class CommandParser {
public:
    /**
     * Parses the input string into a Command object and a list of arguments.
     * @param input The raw input line from the user.
     * @return A pair containing the unique_ptr to the specific Command and a vector of string arguments.
     * If the command is unknown, the unique_ptr will be nullptr.
     */
    std::pair<std::unique_ptr<Command>, std::vector<std::string>> parse(const std::string& input);
};

#endif