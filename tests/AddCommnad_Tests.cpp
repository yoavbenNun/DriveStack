#include "gtest/gtest.h"
#include <fstream>      // Needed to read files from the file system
#include <cstdio>       // Needed for std::remove (to delete files)
#include <cstdlib>      // Needed for _putenv (to set environment variables)

// This is the "contract" for the command we are about to build.
// It will fail to compile because this file doesn't exist yet. THAT'S THE GOAL.
#include "../src/AddCommand.h"

// We also include RLE.h because we need its 'decompress' function
// to verify the file content (we'll add decompress to RLE.h later)
#include "../src/RLE.h" 


// This is the NEW, more robust test fixture
class AddCommandTest : public ::testing::Test {
protected:
    // Define all filenames we will use in our tests
    const char* validFilename = "test_file.txt";
    const char* invalidFilename = "my test file.txt";

    // This function runs automatically before each test
    void SetUp() override {
        // Set a temporary environment variable for our test
        _putenv("CLI_SAVE_PATH=./"); // Save files in the current directory
        
        // Clean up ALL files before EACH test begins
        // This ensures every test starts in a clean environment
        std::remove(validFilename);
        std::remove(invalidFilename);
    }

    // This function runs automatically after each test
    void TearDown() override {
        // Clean up ALL files after EACH test finishes
        std::remove(validFilename);
        std::remove(invalidFilename);
    }
};

// --- Our First Test ---
// Use TEST_F because we are using the "Fixture" (AddCommandTest)
TEST_F(AddCommandTest, CreatesFileWithCompressedContent) {
    // 1. ARRANGE
    AddCommand cmd;
    std::string content = "AAABBC";
    std::string expectedCompressedContent = "3A2B1C"; 

    // 2. ACT
    // We use the 'validFilename' defined in our fixture
    cmd.execute(validFilename, content);

    // 3. ASSERT
    std::ifstream createdFile(validFilename);
    ASSERT_TRUE(createdFile.good()); // Check if the file exists

    std::string fileContent;
    createdFile >> fileContent;
    createdFile.close();
    
    ASSERT_EQ(fileContent, expectedCompressedContent);
}

// TEST 2: Invalid command (spaces in filename)
TEST_F(AddCommandTest, IgnoresCommandWithSpacesInFilename) {
    // 1. ARRANGE
    AddCommand cmd;
    std::string content = "AAA";

    // 2. ACT
    // We use the 'invalidFilename' defined in our fixture
    cmd.execute(invalidFilename, content);

    // 3. ASSERT
    // Check that the file was NOT created
    std::ifstream createdFile(invalidFilename);
    ASSERT_FALSE(createdFile.good()); // We assert the file does NOT exist
}

// TEST 3: Handles missing environment variable
// We use TEST (not TEST_F) because we DON'T want the SetUp fixture
// which automatically sets the environment variable.
TEST(AddCommandStandaloneTest, SavesToCurrentDirIfEnvVarIsMissing) {
    // 1. ARRANGE
    // Ensure the environment variable is NOT set
    // Note: This is tricky; a robust way is complex.
    // For now, we rely on the test running in a clean environment
    // where CLI_SAVE_PATH is not globally set.
    
    // We must manually clean up before
    const char* filename = "test_no_env.txt";
    std::remove(filename); 
    
    AddCommand cmd;
    std::string content = "CCC";
    std::string expectedCompressedContent = "3C";

    // 2. ACT
    cmd.execute(filename, content);

    // 3. ASSERT
    // Check that the file was created in the CURRENT directory ("./")
    std::ifstream createdFile(filename);
    ASSERT_TRUE(createdFile.good()); // File exists

    std::string fileContent;
    createdFile >> fileContent;
    createdFile.close();
    
    ASSERT_EQ(fileContent, expectedCompressedContent);

    // Manual cleanup after
    std::remove(filename);
}

// TEST 4: Overwrites an existing file
TEST_F(AddCommandTest, OverwritesExistingFile) {
    // 1. ARRANGE
    AddCommand cmd;
    std::string contentV1 = "AAA"; // Old content
    std::string contentV2 = "BBB"; // New content
    std::string expectedCompressedContentV2 = "3B";

    // Create a "dummy" file first with V1 content
    // We use the 'validFilename' defined in our fixture
    std::ofstream oldFile(validFilename);
    oldFile << RLE::compress(contentV1); // "3A"
    oldFile.close();

    // 2. ACT
    // Run the command again on the *same file* but with V2 content
    cmd.execute(validFilename, contentV2);

    // 3. ASSERT
    // Check that the file content is now the V2 compressed content
    std::ifstream updatedFile(validFilename);
    ASSERT_TRUE(updatedFile.good()); // File still exists

    std::string fileContent;
    updatedFile >> fileContent;
    updatedFile.close();
    
    // We assert the content is "3B" (new) and not "3A" (old) or "3A3B" (appended)
    ASSERT_EQ(fileContent, expectedCompressedContentV2);
}
