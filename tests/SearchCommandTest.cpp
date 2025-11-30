#include "gtest/gtest.h"
#include "../src/SearchCommand.h"
#include "../src/AddCommand.h"
#include "../src/RLE.h"
#include <algorithm> 
#include <filesystem>
#include <fstream>

// Cross-platform ENV setter
static void setEnvVar(const char* name, const char* value) {
#ifdef _WIN32
    std::string env = std::string(name) + "=" + (value ? value : "");
    _putenv(env.c_str());
#else
    if (value)
        setenv(name, value, 1);
    else
        unsetenv(name);
#endif
}

class SearchTest : public ::testing::Test {
protected:
    std::string tempDir = "./test_files/";

    void SetUp() override {
        std::filesystem::create_directory(tempDir);
        setEnvVar("CLI_SAVE_PATH", tempDir.c_str());
    }

    void TearDown() override {
        std::filesystem::remove_all(tempDir);
    }
};

TEST_F(SearchTest, BasicSearchFindsFile) {
    AddCommand add;
    add.execute("file1", "aaaaab");

    SearchCommand search;
    auto result = search.execute("aab");

    ASSERT_EQ(result.size(), 1);
    EXPECT_EQ(result[0], "file1");
}

TEST_F(SearchTest, SearchNoMatches) {
    AddCommand add;
    add.execute("file1", "hello");

    SearchCommand search;
    auto result = search.execute("xyz");

    ASSERT_TRUE(result.empty());
}

TEST_F(SearchTest, MultipleFilesMatching) {
    AddCommand add;
    add.execute("file1", "banana");
    add.execute("file2", "ban");
    add.execute("file3", "apple");

    SearchCommand search;
    auto result = search.execute("ban");

    ASSERT_EQ(result.size(), 2);
    EXPECT_TRUE(std::find(result.begin(), result.end(), "file1") != result.end());
    EXPECT_TRUE(std::find(result.begin(), result.end(), "file2") != result.end());
}

TEST_F(SearchTest, IgnoreInvalidInput) {
    SearchCommand search;
    auto result = search.execute("");

    ASSERT_TRUE(result.empty());
}
