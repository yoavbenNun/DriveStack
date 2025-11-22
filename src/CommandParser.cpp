#include "CommandParser.h"

std::vector<std::string> CommandParser::parse(const std::string& line) {
    std::vector<std::string> args;
    std::string currentArg;
    bool inQuotes = false;

    for (size_t i = 0; i < line.length(); ++i) {
        char c = line[i];

        if (c == '"') {
            // If we see a quote, we toggle the state
            inQuotes = !inQuotes;
        } 
        else if (c == ' ' && !inQuotes) {
            // If we see a space AND we are NOT in quotes, it's the end of a word
            if (!currentArg.empty()) {
                args.push_back(currentArg);
                currentArg.clear();
            }
        } 
        else {
            // Otherwise, just add the character to the current word
            currentArg += c;
        }
    }

    // Don't forget to add the last argument if there is one
    if (!currentArg.empty()) {
        args.push_back(currentArg);
    }

    return args;
}