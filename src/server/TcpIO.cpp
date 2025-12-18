#include "TcpIO.h"

#ifdef _WIN32
#include <winsock2.h>
#endif

bool sendAll(SocketT s, const std::string& data) {
    const char* buf = data.c_str();
    int total = 0;
    int len = (int)data.size();

    while (total < len) {
        int sent = send(s, buf + total, len - total, 0);
        if (sent <= 0) return false;
        total += sent;
    }
    return true;
}
