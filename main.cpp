#include <iostream>
#include <string>
#include <vector>
#include "src/CommandParser.h"
#include "src/AddCommand.h"

// Note: We will include GetCommand.h and SearchCommand.h later when they are merged

int main() {
    // 1. Setup the helper objects
    CommandParser parser;
    AddCommand addCmd;
    
    // 2. Infinite Loop
    while (true) {
        
        // 3. Read Input
        std::string line;
        if (!std::getline(std::cin, line)) {
            // If standard input is closed (EOF), break the loop gracefully
            break;
        }

        // 4. Parse the input using our new Parser
        std::vector<std::string> args = parser.parse(line);

        // If line was empty or parse failed, ignore
        if (args.empty()) {
            continue;
        }

        // 5. Dispatch (Routing)
        std::string commandName = args[0];

        if (commandName == "add") {
            // "add [file name] [text]"
            // We need at least 3 arguments: command, filename, text
            if (args.size() >= 3) {
                addCmd.execute(args[1], args[2]);
            }
            // If args are missing, we ignore (per instructions to ignore invalid commands) 
        }
        else if (commandName == "get") {
            // TODO: Implement GetCommand integration here once merged
            // if (args.size() >= 2) {
            //     getCmd.get(args[1]);
            // }
        }
        else if (commandName == "search") {
             // TODO: Implement SearchCommand integration later
        }
        
        // Any other command is ignored silently
    }

    return 0;
}