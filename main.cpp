#include <iostream>
#include <string>
#include <vector>
#include "src/CommandParser.h"
#include "src/AddCommand.h"
#include "src/GetCommand.h"    
#include "src/SearchCommand.h" 
int main() {
    // 1. Setup the helper objects
    CommandParser parser;
    AddCommand addCmd;
    GetCommand getCmd;       
    SearchCommand searchCmd; 
    
    // 2. Infinite Loop
    while (true) {
        
        // 3. Read Input
        std::string line;
        if (!std::getline(std::cin, line)) {
            // If standard input is closed (EOF), break the loop gracefully
            break;
        }

        // 4. Parse the input using our Parser
        std::vector<std::string> args = parser.parse(line);

        // If line was empty or parse failed, ignore
        if (args.empty()) {
            continue;
        }

        // 5. Dispatch (Routing)
        std::string commandName = args[0];

        if (commandName == "add") {
            // usage: add [file name] [text]
            if (args.size() >= 3) {
                addCmd.execute(args[1], args[2]);
            }
        }
        else if (commandName == "get") {
            // usage: get [file name]
            if (args.size() >= 2) {
                getCmd.get(args[1]); 
            }
        }
        else if (commandName == "search") {
             // usage: search [text]
             if (args.size() >= 2) {
                 // SearchCommand returns a vector, main is responsible for printing
                 std::vector<std::string> results = searchCmd.execute(args[1]);
                 
                 for (const auto& filename : results) {
                     std::cout << filename << std::endl;
                 }
             }
        }
        
        // Any other command is ignored silently
    }

    return 0;
}