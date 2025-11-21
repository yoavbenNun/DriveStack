cmake_minimum_required(VERSION 3.14)

project(MyCliProject VERSION 1.0)

set(CMAKE_CXX_STANDARD 17)
set(CMAKE_CXX_STANDARD_REQUIRED ON)

# all the files in -src
file(GLOB SRC_FILES CONFIGURE_DEPENDS "src/*.cpp")

# --- the main app (CLI) ---
add_executable(cli_app
    main.cpp
    ${SRC_FILES}
)

target_include_directories(cli_app PRIVATE src)

# --- test with GoogleTest ---
option(BUILD_TESTING "Build tests" ON)

if(BUILD_TESTING)
    include(FetchContent)

    FetchContent_Declare(
        googletest
        URL https://github.com/google/googletest/archive/refs/tags/v1.14.0.zip
    )

    # for dont have problems in vs / CRT
    set(gtest_force_shared_crt ON CACHE BOOL "" FORCE)

    FetchContent_MakeAvailable(googletest)

    enable_testing()

    # all the tests files in the file tests
    file(GLOB TEST_FILES CONFIGURE_DEPENDS "tests/*.cpp")

    add_executable(runTests
        ${TEST_FILES}
        ${SRC_FILES}   #the src file themselves (RLE.cpp, AddCommand.cpp)
    )

    target_include_directories(runTests PRIVATE src)

    target_link_libraries(runTests
        PRIVATE
        GTest::gtest_main
    )

    include(GoogleTest)
    gtest_discover_tests(runTests)
endif()
