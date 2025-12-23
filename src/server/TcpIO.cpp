#include "server/TcpIO.h"

#ifndef _WIN32
  #include <sys/socket.h>
  #include <unistd.h>
#else
  #include <errno.h>
#endif

bool sendAll(SocketT s, const std::string& data) {
    const char* buf = data.c_str();
    int total = 0;
    int len = static_cast<int>(data.size());

    while (total < len) {
#ifdef _WIN32
        int sent = ::send(s, buf + total, len - total, 0);
        if (sent == SOCKET_ERROR || sent == 0) return false;
#else
        ssize_t sent = ::send(s, buf + total, len - total, 0);
        if (sent <= 0) return false;
#endif
        total += static_cast<int>(sent);
    }
    return true;
}

void closeSocket(SocketT s) {
#ifdef _WIN32
    ::shutdown(s, SD_BOTH);
    ::closesocket(s);
#else
    ::shutdown(s, SHUT_RDWR);
    ::close(s);
#endif
}
