#include "TcpServer.h"
#include <stdexcept>
#include <string>

#include <winsock2.h>
#include <ws2tcpip.h>

#pragma comment(lib, "Ws2_32.lib")

static void die(const char* msg) {
    throw std::runtime_error(std::string(msg) + " (WSA error=" + std::to_string(WSAGetLastError()) + ")");
}

TcpServer::TcpServer(uint16_t port)
    : port_(port), serverFd_(-1) {}

void TcpServer::start() {
    WSADATA wsaData{};
    if (WSAStartup(MAKEWORD(2, 2), &wsaData) != 0) die("WSAStartup failed");

    SOCKET s = socket(AF_INET, SOCK_STREAM, IPPROTO_TCP);
    if (s == INVALID_SOCKET) die("socket failed");
    serverFd_ = (int)s;

    sockaddr_in addr{};
    addr.sin_family = AF_INET;
    addr.sin_addr.s_addr = htonl(INADDR_ANY);
    addr.sin_port = htons(port_);

    if (bind((SOCKET)serverFd_, (sockaddr*)&addr, sizeof(addr)) == SOCKET_ERROR) die("bind failed");
    if (listen((SOCKET)serverFd_, SOMAXCONN) == SOCKET_ERROR) die("listen failed");
}

int TcpServer::acceptClient() {
    SOCKET c = accept((SOCKET)serverFd_, nullptr, nullptr);
    if (c == INVALID_SOCKET) die("accept failed");
    return (int)c;
}
