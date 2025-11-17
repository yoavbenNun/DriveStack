#include "gtest/gtest.h"

// compilation error excpected. RLE.h yet to exist(TDD).
#include "../src/RLE.h" 

//according to RLE algorithm - the function getting AAA and should return 3A
TEST(RLETest, HandlesBasicCompression) {
    EXPECT_EQ(RLE::compress("AAA"), "3A");
}

//Test 2
TEST(RLETest, HandlesMixedString) {

    EXPECT_EQ(RLE::compress("AAABBC"), "3A2B1C");
}

//Test 3
TEST(RLETest, HandlesSingleCharacters) {
    EXPECT_EQ(RLE::compress("ABC"), "1A1B1C");
}

//Test 4: if the empty string is handled. 
TEST(RLETest, HandlesEmptyString) {
    EXPECT_EQ(RLE::compress(""), "");
}

// TEST 5: The most critical edge case - long runs
TEST(RLETest, HandlesRunsLongerThanNine) {
    // 12 A's should be split into a run of 9 and a run of 3
    EXPECT_EQ(RLE::compress("AAAAAAAAAAAA"), "9A3A"); 
}

// TEST 6: Input containing numbers
TEST(RLETest, HandlesInputWithNumbers) {
    EXPECT_EQ(RLE::compress("A111BCC2"), "1A311B2C12");
}

// TEST 7: Input with whitespace
TEST(RLETest, HandlesInputWithWhitespace) {
    EXPECT_EQ(RLE::compress("  A  "), "2 1A2 ");
}