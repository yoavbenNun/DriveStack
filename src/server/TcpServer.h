#pragma once
#include <cstdint>

class TcpServer {
public:
    explicit TcpServer(uint16_t port);

    void start();  // socket + bind + listen
    int  acceptClient(); // accept()
    void stop();

private:
    uint16_t port_;
    int serverFd_;
};
