#include "server/TcpServer.h"
#include <stdexcept>
#include <string>

#ifdef _WIN32
  #include <ws2tcpip.h>
#else
  #include <sys/types.h>
  #include <sys/socket.h>
  #include <arpa/inet.h>
  #include <netinet/in.h>
  #include <unistd.h>
  #include <cerrno>
  #include <cstring>
#endif

static std::runtime_error dieErr(const std::string& msg) {
#ifdef _WIN32
    return std::runtime_error(msg + " (WSA error=" + std::to_string(WSAGetLastError()) + ")");
#else
    return std::runtime_error(msg + " (errno=" + std::to_string(errno) + "): " + std::strerror(errno));
#endif
}

TcpServer::TcpServer(uint16_t port)
    : port_(port)
#ifdef _WIN32
    , serverFd_(INVALID_SOCKET)
#else
    , serverFd_(-1)
#endif
{}

void TcpServer::start() {
#ifdef _WIN32
    WSADATA wsaData{};
    if (WSAStartup(MAKEWORD(2, 2), &wsaData) != 0) {
        throw dieErr("WSAStartup failed");
    }
#endif

    serverFd_ = ::socket(AF_INET, SOCK_STREAM, 0);
#ifdef _WIN32
    if (serverFd_ == INVALID_SOCKET) throw dieErr("socket failed");
#else
    if (serverFd_ < 0) throw dieErr("socket failed");
#endif

    // allow fast restart (docker tests love this)
    int opt = 1;
#ifdef _WIN32
    ::setsockopt(serverFd_, SOL_SOCKET, SO_REUSEADDR, (const char*)&opt, sizeof(opt));
#else
    ::setsockopt(serverFd_, SOL_SOCKET, SO_REUSEADDR, &opt, sizeof(opt));
#endif

    sockaddr_in addr{};
    addr.sin_family = AF_INET;
    addr.sin_addr.s_addr = htonl(INADDR_ANY);
    addr.sin_port = htons(port_);

    if (::bind(serverFd_, (sockaddr*)&addr, sizeof(addr)) < 0) throw dieErr("bind failed");
    if (::listen(serverFd_, SOMAXCONN) < 0) throw dieErr("listen failed");
}

SocketT TcpServer::acceptClient() {
    SocketT c = ::accept(serverFd_, nullptr, nullptr);
#ifdef _WIN32
    if (c == INVALID_SOCKET) throw dieErr("accept failed");
#else
    if (c < 0) throw dieErr("accept failed");
#endif
    return c;
}
