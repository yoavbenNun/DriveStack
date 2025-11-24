#ifndef GET_COMMAND_H
#define GET_COMMAND_H

#include <string>

/**
 * @class GetCommand
 * @brief Handles the logic for the "get" command.
 * It compresses content and saves it to a new file.
 */
class GetCommand {
public:
    /**
     * @brief Executes the get command logic.
     * @param filename The name of the file to read and decompress.
     * @return The decompressed content of the file.
    **/
    void get(const std::string& filename);
};

#endif // GET_COMMAND_H