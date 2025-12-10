#ifndef SEARCH_COMMAND_H
#define SEARCH_COMMAND_H

#include "Command.h"
#include <string>
#include <vector>

class SearchCommand : public Command {
public:
    // This signature must match the one in SearchCommand.cpp
    std::string execute(const std::vector<std::string>& args) override;
};

#endif // SEARCH_COMMAND_H