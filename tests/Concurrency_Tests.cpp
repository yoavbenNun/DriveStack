#include <gtest/gtest.h>
#include <thread>
#include <vector>
#include <cstdlib>

#include "AddCommand.h"
#include "GetCommand.h"
#include "DeleteCommand.h"

static void setTestPath() {
#ifdef _WIN32
    _putenv("CLI_SAVE_PATH=./test_storage");
#else
    setenv("CLI_SAVE_PATH", "./test_storage", 1);
#endif
}

TEST(Concurrency, AddGetDeleteSameFile) {
    setTestPath();

    AddCommand add;
    GetCommand get;
    DeleteCommand del;

    const std::string fname = "race.txt";

    auto writer = [&]() {
        for (int i = 0; i < 50; ++i) {
            add.execute({fname, "hello"});
        }
    };

    auto reader = [&]() {
        for (int i = 0; i < 50; ++i) {
            get.execute({fname});
        }
    };

    auto deleter = [&]() {
        for (int i = 0; i < 20; ++i) {
            del.execute({fname});
        }
    };

    std::vector<std::thread> threads;
    threads.emplace_back(writer);
    threads.emplace_back(writer);
    threads.emplace_back(reader);
    threads.emplace_back(reader);
    threads.emplace_back(deleter);

    for (auto& t : threads) t.join();

    // if there no exception → pass
    SUCCEED();
}
