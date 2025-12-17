#include "gtest/gtest.h"
#include <fstream>
#include <cstdio>
#include <cstdlib>
#include <iostream>

#include "../src/GetCommand.h"
#include "../src/RLE.h"

// --- Cross-platform environment setter ---
static void setEnvVar(const char* name, const char* value) {
#ifdef _WIN32
    // Windows uses "_putenv" and expects NAME=VALUE
    std::string envStr = std::string(name) + "=" + (value ? value : "");
    _putenv(envStr.c_str());
#else
    if (value)
        setenv(name, value, 1);
    else
        unsetenv(name);
#endif
}

class GetCommandTest : public ::testing::Test {
protected:
    const char* validFilename = "test_file.txt";
    const char* invalidFilename = "my test file.txt";

    void SetUp() override {
        setEnvVar("CLI_SAVE_PATH", "./");

        // Clean the files before each test
        std::remove(validFilename);
        std::remove(invalidFilename);
    }

    void TearDown() override {
        // Clean the files after each test
        std::remove(validFilename);
        std::remove(invalidFilename);
    }

    // Helper to write compressed content using the RLE logic
    void writeCompressedFile(const char* filename, const std::string& content) {
        std::ofstream out(filename);
        out << RLE::compress(content);
        out.close();
    }
};

// TEST 1: Reading an existing file works
// Expects the "200 Ok" header followed by two newlines and the content
TEST_F(GetCommandTest, PrintsDecompressedContentWithHeader) {
    std::string original = "AAABBC";
    writeCompressedFile(validFilename, original);

    GetCommand cmd;
    // REFACTOR UPDATE: calling execute with a vector
    std::string output = cmd.execute({validFilename});

    // The logic in GetCommand.cpp returns: "200 Ok\n\n" + decompressed
    std::string expected = "200 Ok\n\n" + original; 
    EXPECT_EQ(output, expected);
}

// TEST 2: Non-existing file -> Expects 404
TEST_F(GetCommandTest, NonExistingFileProduces404) {
    GetCommand cmd;
    // File does not exist
    std::string output = cmd.execute({validFilename});

    // Requirement: Should return "404 Not Found"
    EXPECT_EQ(output, "404 Not Found\n");
}

// TEST 3: Filename with spaces -> Expects 400
TEST_F(GetCommandTest, FilenameWithSpacesProduces400) {
    GetCommand cmd;
    // Even if file existed, spaces are invalid in this protocol
    std::string output = cmd.execute({invalidFilename}); 

    // Requirement: Should return "400 Bad Request"
    EXPECT_EQ(output, "400 Bad Request\n");
}

// TEST 4: Environment variable missing -> fallback to "./"
TEST(GetCommandStandaloneTest, WorksWithoutEnvironmentVariable) {
    setEnvVar("CLI_SAVE_PATH", nullptr); // Unset the environment variable

    const char* filename = "no_env_test.txt";
    std::remove(filename); // Ensure clean state

    std::string original = "HELLO";
    std::ofstream out(filename);
    out << RLE::compress(original);
    out.close();

    GetCommand cmd;
    std::string output = cmd.execute({filename});

    std::string expected = "200 Ok\n\n" + original;
    EXPECT_EQ(output, expected);

    std::remove(filename);
}

// TEST 5: Ensure only FIRST line is read (if logic dictates line-by-line reading)
TEST_F(GetCommandTest, ReadsOnlyFirstLine) {
    std::ofstream out(validFilename);
    // Write two lines of compressed data
    out << RLE::compress("FIRST") << std::endl;
    out << RLE::compress("SECOND") << std::endl;
    out.close();

    GetCommand cmd;
    std::string output = cmd.execute({validFilename});

    // Expect header + first line only
    std::string expected = "200 Ok\n\nFIRST";
    EXPECT_EQ(output, expected);
}