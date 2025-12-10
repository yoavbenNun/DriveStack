#ifndef DELETE_COMMAND_H
#define DELETE_COMMAND_H

#include "Command.h"

/**
 * Implements the DELETE logic.
 * Deletes a specific file from the storage.
 */
class DeleteCommand : public Command {
public:
    std::string execute(const std::vector<std::string>& args) override;
};

#endif // DELETE_COMMAND_H