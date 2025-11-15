#ifndef ADD_COMMAND_H
#define ADD_COMMAND_H

#include <string>

/**
 * @class AddCommand
 * @brief Handles the logic for the "add" command.
 * It compresses content and saves it to a new file.
 */
class AddCommand {
public:
    /**
     * @brief Executes the add command logic.
     * @param filename The name of the file to create.
     * @param content The text content to compress and save.
     */
    void execute(const std::string& filename, const std::string& content);
};

#endif // ADD_COMMAND_H