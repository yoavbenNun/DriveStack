#include <gtest/gtest.h>
#include "DeleteCommand.h" // We will create this soon
#include <fstream>
#include <cstdio> // For std::remove

class DeleteCommandTest : public ::testing::Test {
protected:
    std::string testFile = "garbage_file.txt";

    void SetUp() override {
        // Create a dummy file before testing delete
        std::ofstream outfile(testFile);
        outfile << "delete me";
        outfile.close();
    }

    void TearDown() override {
        // Ensure cleanup if test fails
        std::remove(testFile.c_str());
    }
};

TEST_F(DeleteCommandTest, Returns204AndDeletesFile) {
    DeleteCommand cmd;
    std::vector<std::string> args = {testFile};

    // Act
    std::string response = cmd.execute(args);

    // Assert 1: Check protocol response 
    EXPECT_EQ(response, "204 No Content\n");

    // Assert 2: Verify file is actually gone from disk
    std::ifstream f(testFile);
    EXPECT_FALSE(f.good()); 
}

TEST_F(DeleteCommandTest, Returns404IfFileDoesNotExist) {
    DeleteCommand cmd;
    std::vector<std::string> args = {"non_existent_file.txt"};

    // Act
    std::string response = cmd.execute(args);

    // Assert: Check error response 
    EXPECT_EQ(response, "404 Not Found\n");
}