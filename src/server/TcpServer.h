#pragma once
#include <cstdint>

#ifdef _WIN32
  #include <winsock2.h>
  using SocketT = SOCKET;
#else
  using SocketT = int;
#endif

class TcpServer {
public:
    explicit TcpServer(uint16_t port);

    void start();              // socket + bind + listen
    SocketT acceptClient();    // accept()

private:
    uint16_t port_;
    SocketT serverFd_;
};
