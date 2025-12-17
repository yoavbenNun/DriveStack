#include "gtest/gtest.h"
#include <fstream>
#include <cstdio>
#include <cstdlib>
#include "../src/SearchCommand.h"
#include "../src/RLE.h"

// Helper to set environment variable cross-platform
static void setEnvVar(const char* name, const char* value) {
#ifdef _WIN32
    std::string envStr = std::string(name) + "=" + (value ? value : "");
    _putenv(envStr.c_str());
#else
    if (value) setenv(name, value, 1);
    else unsetenv(name);
#endif
}

class SearchCommandTest : public ::testing::Test {
protected:
    const char* testFile1 = "search_test_match.txt";
    const char* testFile2 = "search_test_no_match.txt";
    const char* testFile3 = "filename_match_query.txt";

    void SetUp() override {
        setEnvVar("CLI_SAVE_PATH", "./");
        
        // Ensure clean state
        std::remove(testFile1);
        std::remove(testFile2);
        std::remove(testFile3);

        // Create a file with content match (RLE encoded)
        // "HELLO" -> compressed
        std::ofstream out1(testFile1);
        out1 << RLE::compress("HELLO WORLD"); 
        out1.close();

        // Create a file with no match
        std::ofstream out2(testFile2);
        out2 << RLE::compress("JUST SOME DATA");
        out2.close();
    }

    void TearDown() override {
        std::remove(testFile1);
        std::remove(testFile2);
        std::remove(testFile3);
    }
};

// TEST 1: Finds file by content
TEST_F(SearchCommandTest, BasicSearchFindsFile) {
    SearchCommand cmd;
    // Search for "WORLD" which is inside testFile1
    std::string output = cmd.execute({"WORLD"});

    // Expect 200 Ok (Small 'k' per assignment)
    EXPECT_NE(output.find("200 Ok"), std::string::npos);
    EXPECT_NE(output.find(testFile1), std::string::npos);
}

// TEST 2: Finds file by filename
TEST_F(SearchCommandTest, FindsFileByFilename) {
    // Create the file that has the query in its name
    std::ofstream out3(testFile3);
    out3 << "data";
    out3.close();

    SearchCommand cmd;
    // Search for "query" which is in "filename_match_query.txt"
    std::string output = cmd.execute({"query"});

    EXPECT_NE(output.find("200 Ok"), std::string::npos);
    EXPECT_NE(output.find(testFile3), std::string::npos);
}

// TEST 3: Returns 404 when nothing matches
TEST_F(SearchCommandTest, SearchNoMatches) {
    SearchCommand cmd;
    // Search for a string that definitely doesn't exist
    std::string output = cmd.execute({"NON_EXISTENT_STRING_12345"});

    EXPECT_EQ(output, "404 Not Found\n");
}

// TEST 4: Invalid input (empty query) -> 400
TEST_F(SearchCommandTest, IgnoreInvalidInput) {
    SearchCommand cmd;
    
    // Case A: Empty vector
    std::string output1 = cmd.execute({});
    EXPECT_EQ(output1, "400 Bad Request\n");

    // Case B: Empty string argument (Fixed in SearchCommand.cpp)
    std::string output2 = cmd.execute({""});
    EXPECT_EQ(output2, "400 Bad Request\n");
}