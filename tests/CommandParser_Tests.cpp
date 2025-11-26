#include "gtest/gtest.h"
#include <vector>
#include <string>

// This header doesn't exist yet - this will cause the compilation error (Red phase)
#include "../src/CommandParser.h"

// TEST 1: Simple command without quotes
TEST(CommandParserTest, ParsesSimpleLine) {
    // 1. ARRANGE
    CommandParser parser;
    std::string line = "add my_file.txt 12345";
    
    // 2. ACT
    std::vector<std::string> args = parser.parse(line);

    // 3. ASSERT
    ASSERT_EQ(args.size(), 3);
    EXPECT_EQ(args[0], "add");
    EXPECT_EQ(args[1], "my_file.txt");
    EXPECT_EQ(args[2], "12345");
}

// TEST 2: Command with quotes (The hard part!)
TEST(CommandParserTest, ParsesLineWithQuotes) {
    // 1. ARRANGE
    CommandParser parser;
    // User input: add file.txt "hello world"
    std::string line = "add file.txt \"hello world\"";
    
    // 2. ACT
    std::vector<std::string> args = parser.parse(line);

    // 3. ASSERT
    ASSERT_EQ(args.size(), 3);
    EXPECT_EQ(args[0], "add");
    EXPECT_EQ(args[1], "file.txt");
    // The parser should strip the quotes but keep the space inside
    EXPECT_EQ(args[2], "hello world"); 
}

// TEST 3: Edge case - Empty line
TEST(CommandParserTest, HandlesEmptyLine) {
    CommandParser parser;
    std::vector<std::string> args = parser.parse("");
    ASSERT_TRUE(args.empty());
}