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

    // helper to write compressed content
    void writeCompressedFile(const char* filename, const std::string& content) {
        std::ofstream out(filename);
        out << RLE::compress(content) << std::endl;
    }
};

// TEST 1: Reading an existing file works
TEST_F(GetCommandTest, PrintsDecompressedContent) {
    std::string original = "AAABBC";
    writeCompressedFile(validFilename, original);

    testing::internal::CaptureStdout();
    GetCommand cmd;
    cmd.get(validFilename);
    std::string output = testing::internal::GetCapturedStdout();

    EXPECT_EQ(output, original + "\n");
}

// TEST 2: non-existing file → no output
TEST_F(GetCommandTest, NonExistingFileProducesNoOutput) {
    testing::internal::CaptureStdout();
    GetCommand cmd;
    cmd.get(validFilename); // file doesn't exist
    std::string output = testing::internal::GetCapturedStdout();

    EXPECT_TRUE(output.empty());
}

// TEST 3: filename with spaces → ignored
TEST_F(GetCommandTest, FilenameWithSpacesIsIgnored) {
    std::ofstream out(invalidFilename);
    out << "SOMEDATA";
    out.close();

    testing::internal::CaptureStdout();
    GetCommand cmd;
    cmd.get(invalidFilename); // ignored
    std::string output = testing::internal::GetCapturedStdout();

    EXPECT_TRUE(output.empty());
}

// TEST 4: environment variable missing → fallback to "./"
TEST(GetCommandStandaloneTest, WorksWithoutEnvironmentVariable) {
    setEnvVar("CLI_SAVE_PATH", nullptr); // unset

    const char* filename = "no_env_test.txt";
    std::remove(filename);

    std::string original = "HELLO";
    std::string compressed = RLE::compress(original);

    // write simple compressed file in current directory
    std::ofstream out(filename);
    out << compressed << std::endl;
    out.close();

    testing::internal::CaptureStdout();
    GetCommand cmd;
    cmd.get(filename);
    std::string output = testing::internal::GetCapturedStdout();

    EXPECT_EQ(output, original + "\n");

    std::remove(filename);
}

// TEST 5: ensure only FIRST line is read
TEST_F(GetCommandTest, ReadsOnlyFirstLine) {
    std::ofstream out(validFilename);
    out << RLE::compress("FIRST") << std::endl;
    out << RLE::compress("SECOND") << std::endl;
    out.close();

    testing::internal::CaptureStdout();
    GetCommand cmd;
    cmd.get(validFilename);
    std::string output = testing::internal::GetCapturedStdout();

    EXPECT_EQ(output, "FIRST\n");
}
