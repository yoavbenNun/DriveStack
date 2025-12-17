#include "gtest/gtest.h"
#include "../src/CommandParser.h"

class CommandParserTest : public ::testing::Test {
protected:
    CommandParser parser;
};

// TEST 1: Simple parsing checks arguments are extracted correctly
TEST_F(CommandParserTest, ParsesSimpleLine) {
    // Check that POST command parses arguments correctly
    auto result = parser.parse("POST file.txt");
    
    // Assert that a command object was created
    EXPECT_NE(result.first, nullptr);
    
    // Assert that the argument list is correct
    ASSERT_EQ(result.second.size(), 1);
    EXPECT_EQ(result.second[0], "file.txt");
}

// TEST 2: Handling case insensitivity
TEST_F(CommandParserTest, HandlesCaseInsensitivity) {
    // "PoSt" should be recognized as "post" -> AddCommand
    auto result = parser.parse("PoSt file.txt");
    EXPECT_NE(result.first, nullptr);
}

// TEST 3: Handling empty input
TEST_F(CommandParserTest, HandlesEmptyLine) {
    auto result = parser.parse("");
    EXPECT_EQ(result.first, nullptr);
    EXPECT_TRUE(result.second.empty());
}

// TEST 4: Unknown command
TEST_F(CommandParserTest, ReturnsNullForUnknownCommand) {
    auto result = parser.parse("UNKNOWN_CMD arg1");
    
    // Command pointer should be null
    EXPECT_EQ(result.first, nullptr);
    
    // Arguments should still be parsed
    ASSERT_EQ(result.second.size(), 1);
    EXPECT_EQ(result.second[0], "arg1");
}