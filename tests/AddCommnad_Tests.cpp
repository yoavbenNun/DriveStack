#include "gtest/gtest.h"
#include <fstream>      // Needed to read files
#include <cstdio>       // Needed for std::remove
#include <cstdlib>      // Needed for setenv/putenv depending on platform

#include "../src/AddCommand.h"
#include "../src/RLE.h"

// --- Cross-platform environment variable setter ---
static void setEnvVar(const char* name, const char* value) {
#ifdef _WIN32
    // Windows uses _putenv and requires "NAME=VALUE" format
    std::string envStr = std::string(name) + "=" + (value ? value : "");
    _putenv(envStr.c_str());
#else
    // macOS / Linux
    if (value)
        setenv(name, value, 1);
    else
        unsetenv(name);
#endif
}

// ---------------------- TEST FIXTURE ----------------------
class AddCommandTest : public ::testing::Test {
protected:
    const char* validFilename = "test_file.txt";
    const char* invalidFilename = "my test file.txt";

    void SetUp() override {
        setEnvVar("CLI_SAVE_PATH", "./");

        std::remove(validFilename);
        std::remove(invalidFilename);
    }

    void TearDown() override {
        std::remove(validFilename);
        std::remove(invalidFilename);
    }
};

// ---------------------- TEST 1 ----------------------
TEST_F(AddCommandTest, CreatesFileWithCompressedContent) {
    AddCommand cmd;
    std::string content = "AAABBC";
    std::string expected = "3A2B1C";

    cmd.execute({validFilename, content});

    std::ifstream file(validFilename);
    ASSERT_TRUE(file.good());

    std::string fileContent;
    file >> fileContent;

    ASSERT_EQ(fileContent, expected);
}

// ---------------------- TEST 2 ----------------------
TEST_F(AddCommandTest, IgnoresCommandWithSpacesInFilename) {
    AddCommand cmd;
    cmd.execute({invalidFilename, "AAA"});

    std::ifstream file(invalidFilename);
    ASSERT_FALSE(file.good());
}

// ---------------------- TEST 3 ----------------------
TEST(AddCommandStandaloneTest, SavesToCurrentDirIfEnvVarIsMissing) {
    setEnvVar("CLI_SAVE_PATH", nullptr); // unset var

    const char* filename = "test_no_env.txt";
    std::remove(filename);

    AddCommand cmd;
    cmd.execute({filename, "CCC"});

    std::ifstream file(filename);
    ASSERT_TRUE(file.good());

    std::string fileContent;
    file >> fileContent;

    ASSERT_EQ(fileContent, "3C");

    std::remove(filename);
}

// ---------------------- TEST 4 ----------------------
TEST_F(AddCommandTest, OverwritesExistingFile) {
    AddCommand cmd;

    // Old file content
    {
        std::ofstream f(validFilename);
        f << RLE::compress("AAA"); // 3A
    }

    cmd.execute({validFilename, "BBB"}); // should overwrite

    std::ifstream file(validFilename);
    ASSERT_TRUE(file.good());

    std::string fileContent;
    file >> fileContent;

    ASSERT_EQ(fileContent, "3B");
}
