#include "CommandParser.h"
#include "AddCommand.h"
#include "GetCommand.h"
#include "DeleteCommand.h"
#include "SearchCommand.h"
#include <sstream>
#include <algorithm> 
#include <iostream>

// Helper function to convert string to lowercase
std::string toLowerCase(const std::string& str) {
    std::string lowerStr = str;
    std::transform(lowerStr.begin(), lowerStr.end(), lowerStr.begin(),
                   [](unsigned char c){ return std::tolower(c); });
    return lowerStr;
}

std::pair<std::unique_ptr<Command>, std::vector<std::string>> CommandParser::parse(const std::string& input) {
    std::istringstream iss(input);
    std::string commandName;
    
    // FIX: Explicitly construct the pair elements to avoid ambiguity errors
    if (!(iss >> commandName)) {
        return { std::unique_ptr<Command>(nullptr), std::vector<std::string>() };
    }

    std::string commandNameLower = toLowerCase(commandName);

    std::vector<std::string> args;
    std::string arg;
    while (iss >> arg) {
        args.push_back(arg);
    }

    // These should work fine as make_unique returns the correct type
    if (commandNameLower == "post") {
        return {std::make_unique<AddCommand>(), args};
    }
    else if (commandNameLower == "get") {
        return {std::make_unique<GetCommand>(), args};
    }
    else if (commandNameLower == "delete") {
        return {std::make_unique<DeleteCommand>(), args};
    }
    else if (commandNameLower == "search") {
        return {std::make_unique<SearchCommand>(), args};
    }

    // FIX: Explicitly construct unique_ptr(nullptr) here as well
    return { std::unique_ptr<Command>(nullptr), args };
}