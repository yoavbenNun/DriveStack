#include "Storage/FileStorage.h"
#include <cstdlib>

FileStorage& FileStorage::instance() {
    static FileStorage inst;
    return inst;
}

std::string FileStorage::basePath() const {
    const char* p = std::getenv("CLI_SAVE_PATH");
    return p ? std::string(p) : std::string(".");
}

std::shared_mutex& FileStorage::mutex() {
    return mtx_;
}
