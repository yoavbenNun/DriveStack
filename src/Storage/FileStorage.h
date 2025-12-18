#pragma once
#include <string>
#include <shared_mutex>

class FileStorage {
public:
    static FileStorage& instance();

    std::string basePath() const;

    // locks
    std::shared_mutex& mutex();

private:
    FileStorage() = default;
    FileStorage(const FileStorage&) = delete;
    FileStorage& operator=(const FileStorage&) = delete;

    mutable std::shared_mutex mtx_;
};
