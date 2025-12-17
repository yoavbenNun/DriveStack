#ifndef ADD_COMMAND_H
#define ADD_COMMAND_H

#include "Command.h"
#include <string>
#include <vector>

/**
 * Implements the POST logic (formerly 'add').
 * Compresses data using RLE and saves it to a file.
 */
class AddCommand : public Command {
public:
    std::string execute(const std::vector<std::string>& args) override;
};

#endif // ADD_COMMAND_H