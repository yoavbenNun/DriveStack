#include "gtest/gtest.h"
#include <fstream>
#include <cstdio>
#include <cstdlib>
#include <iostream>

#include "../src/GetCommand.h"
#include "../src/RLE.h"

class GetCommandTest : public ::testing::Test {
protected:
    const char* validFilename = "test_file.txt";
    const char* invalidFilename = "my test file.txt";  //if contains space so ignored

    void SetUp() override {
        // Set working directory to the current folder
        _putenv("CLI_SAVE_PATH=./");

        // Clean the files before each test
        std::remove(validFilename);
        std::remove(invalidFilename);
    }

    void TearDown() override {
        // Clean the files after each test
        std::remove(validFilename);
        std::remove(invalidFilename);
    }

    // helper: write compressed content (file)
    void writeCompressedFile(const char* filename, const std::string& content) {
        std::string compressed = RLE::compress(content);
        std::ofstream out(filename);
        out << compressed << std::endl;
        out.close();
    }
};

// TEST 1: Reading an existing file works
TEST_F(GetCommandTest, PrintsDecompressedContent) {
    std::string original = "AAABBC";  // what we expect after decompress
    writeCompressedFile(validFilename, original);

    testing::internal::CaptureStdout();
    GetCommand(validFilename);
    std::string output = testing::internal::GetCapturedStdout();

    EXPECT_EQ(output, original + "\n");
}

// TEST 2: File does not exist have no output
TEST_F(GetCommandTest, NonExistingFileProducesNoOutput) {
    testing::internal::CaptureStdout();
    GetCommand(validFilename);   // file not created
    std::string output = testing::internal::GetCapturedStdout();

    EXPECT_TRUE(output.empty());
}

// TEST 3: Filename with spaces do ignored command
TEST_F(GetCommandTest, FilenameWithSpacesIsIgnored) {
    // even if such a file exists, get MUST ignore
    std::ofstream out(invalidFilename);
    out << "SOMEDATA";
    out.close();

    testing::internal::CaptureStdout();
    GetCommand(invalidFilename);
    std::string output = testing::internal::GetCapturedStdout();

    EXPECT_TRUE(output.empty());
}

// TEST 4: When CLI_SAVE_PATH is missing so use "./"
TEST(GetCommandStandaloneTest, WorksWithoutEnvironmentVariable) {
    // unset the var
    _putenv("CLI_SAVE_PATH=");

    const char* filename = "no_env_test.txt";
    std::remove(filename);

    std::string original = "HELLO";
    std::string compressed = RLE::compress(original);

    //write compressed file into "./"
    std::ofstream out(filename);
    out << compressed << std::endl;
    out.close();

    testing::internal::CaptureStdout();
    GetCommand(filename);
    std::string output = testing::internal::GetCapturedStdout();

    EXPECT_EQ(output, original + "\n");

    std::remove(filename);
}

// TEST 5: Ensure only ONE line is read
TEST_F(GetCommandTest, ReadsOnlyFirstLine) {
    // Create file with two lines — only the first should be read
    std::ofstream out(validFilename);
    out << RLE::compress("FIRST") << std::endl;
    out << RLE::compress("SECOND") << std::endl;
    out.close();

    testing::internal::CaptureStdout();
    GetCommand(validFilename);
    std::string output = testing::internal::GetCapturedStdout();

    EXPECT_EQ(output, "FIRST\n");
}
