#ifndef GET_COMMAND_H
#define GET_COMMAND_H

#include "Command.h"
#include <string>
#include <vector>

class GetCommand : public Command {
public:
    std::string execute(const std::vector<std::string>& args) override;
};

#endif // GET_COMMAND_H