# Set the minimum required version of CMake
cmake_minimum_required(VERSION 3.14)

# Set the project name
project(MyCliProject VERSION 1.0)

# Set the C++ standard (e.g., C++17)
set(CMAKE_CXX_STANDARD 17)
set(CMAKE_CXX_STANDARD_REQUIRED True)

# --- Include Directories ---
# Tell CMake where to find our header files (e.g., RLE.h)
include_directories(src)

# --- Build the Main Application (Your CLI) ---
file(GLOB SRC_FILES "src/*.cpp")
add_executable(cli_app main.cpp ${SRC_FILES})

# --- Setup Testing (gtest) ---
enable_testing()

# Download and configure gtest automatically
include(FetchContent)

# This is the NEW FIX:
# Force gtest to use the dynamic runtime library (/MD or /MDd)
# This will match our project's default and fix the LNK2038 error.
set(gtest_force_shared_crt ON CACHE BOOL "Force gtest to use shared CRT" FORCE)

FetchContent_Declare(
  googletest
  GIT_REPOSITORY https://github.com/google/googletest.git
  GIT_TAG        main  # <-- Use the main branch
)
FetchContent_MakeAvailable(googletest)

# --- Build the Test Executable ---
# Find ALL .cpp files in the 'tests' directory
file(GLOB TEST_FILES "tests/*.cpp")

# Create a separate executable from ALL our test files
add_executable(
  runTests
  ${TEST_FILES} # <-- Use the new variable for all test files
  ${SRC_FILES}  # <-- Also compile our src code (like RLE.cpp)
)

# Link our test runner against gtest
target_link_libraries(
  runTests
  GTest::gtest_main
)

# Include Google Test in our test executable
include(GoogleTest)
gtest_discover_tests(runTests)