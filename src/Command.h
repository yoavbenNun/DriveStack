#ifndef COMMAND_H
#define COMMAND_H

#include <string>
#include <vector>

/**
 * Abstract base class for all commands (Command Pattern).
 * Ensures all commands share the same interface for the server to use.
 */
class Command {
public:
    virtual ~Command() = default;

    /**
     * Executes the command logic.
     * @param args - A vector of string arguments (e.g., filename, data).
     * @return A string representing the response to be sent back to the client.
     */
    virtual std::string execute(const std::vector<std::string>& args) = 0;
};

#endif // COMMAND_H