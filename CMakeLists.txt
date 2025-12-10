cmake_minimum_required(VERSION 3.14)

project(MyCliProject VERSION 2.0)

set(CMAKE_CXX_STANDARD 17)
set(CMAKE_CXX_STANDARD_REQUIRED ON)

# === NEW: Required for multi-threading support in Ex2 (Server) ===
find_package(Threads REQUIRED)

# Collect all source files from the src directory
# Note: Since we use GLOB, adding new files usually requires reloading CMake
file(GLOB SRC_FILES CONFIGURE_DEPENDS "src/*.cpp")

# --- The Main Application (Server) ---
add_executable(cli_app
    main.cpp
    ${SRC_FILES}
)

target_include_directories(cli_app PRIVATE src)

# Link the threading library to the main application
target_link_libraries(cli_app PRIVATE Threads::Threads)

# --- Testing with GoogleTest ---
option(BUILD_TESTING "Build tests" ON)

if(BUILD_TESTING)
    include(FetchContent)

    FetchContent_Declare(
        googletest
        URL https://github.com/google/googletest/archive/refs/tags/v1.14.0.zip
    )

    # Force shared CRT to avoid runtime conflicts on Windows/VS
    set(gtest_force_shared_crt ON CACHE BOOL "" FORCE)

    FetchContent_MakeAvailable(googletest)

    enable_testing()

    # Collect all test files from the tests directory
    file(GLOB TEST_FILES CONFIGURE_DEPENDS "tests/*.cpp")

    add_executable(runTests
        ${TEST_FILES}
        ${SRC_FILES}   # Link the source logic (RLE, Commands, etc.)
    )

    target_include_directories(runTests PRIVATE src)

    # Link GTest and Threads to the test executable
    target_link_libraries(runTests
        PRIVATE
        GTest::gtest_main
        Threads::Threads
    )

    include(GoogleTest)
    gtest_discover_tests(runTests)
endif()