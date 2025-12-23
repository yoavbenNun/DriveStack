#include <iostream>
#include <string>
#include <vector>
#include "CommandParser.h"

int main() {
    CommandParser parser;

    // Infinite Loop for REPL (Read-Eval-Print Loop)
    while (true) {
        std::string line;
        // Read line from stdin. If EOF (End Of File), break the loop.
        if (!std::getline(std::cin, line)) break;

        // Skip empty lines to prevent clutter
        if (line.empty()) continue;

        // 1. Parse the input using our updated Parser
        // Returns a pair: {unique_ptr<Command>, vector<string> arguments}
        auto result = parser.parse(line);

        // 2. Check if a valid command was returned
        if (result.first) {
            // Polymorphism: Execute the specific command (Add, Get, etc.)
            // We pass result.second which holds the arguments (filename, data, etc.)
            std::string output = result.first->execute(result.second);
            std::cout << output;
        } 
        else {
            // 3. Handle Invalid Command
            // According to requirements: "400 Bad Request" for unknown commands
            std::cout << "400 Bad Request\n";
        }
        
        std::cout.flush();
    }

    return 0;
}