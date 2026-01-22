// clients/cpp/main.cpp
#include <arpa/inet.h>
#include <netdb.h>
#include <sys/socket.h>
#include <sys/select.h>
#include <unistd.h>

#include <cctype>
#include <cstring>
#include <iostream>
#include <string>

// Send all bytes (handle partial sends)
static bool send_all(int sock, const char* buf, size_t len) {
    size_t sent = 0;
    while (sent < len) {
        ssize_t n = ::send(sock, buf + sent, len - sent, 0);
        if (n <= 0) return false;
        sent += static_cast<size_t>(n);
    }
    return true;
}

// Receive a single line ending with '\n' (without the '\n')
static bool recv_line(int sock, std::string& out) {
    out.clear();
    char ch;
    while (true) {
        ssize_t n = ::recv(sock, &ch, 1, 0);
        if (n == 0) return false;          // server closed
        if (n < 0) return false;           // error
        if (ch == '\n') break;
        if (ch != '\r') out.push_back(ch); // trim CR if exists
        if (out.size() > 8192) return false; // safety
    }
    return true;
}

// Non-blocking "is there data ready to read?" using select()
static bool sock_has_data(int sock, int timeout_ms) {
    fd_set rfds;
    FD_ZERO(&rfds);
    FD_SET(sock, &rfds);

    timeval tv;
    tv.tv_sec = timeout_ms / 1000;
    tv.tv_usec = (timeout_ms % 1000) * 1000;

    int rc = ::select(sock + 1, &rfds, nullptr, nullptr, &tv);
    return (rc > 0) && FD_ISSET(sock, &rfds);
}

// Connect using host + port (IPv4/IPv6)
static int connect_to(const char* host, const char* port) {
    addrinfo hints;
    std::memset(&hints, 0, sizeof(hints));
    hints.ai_family = AF_UNSPEC;      // IPv4 or IPv6
    hints.ai_socktype = SOCK_STREAM;

    addrinfo* res = nullptr;
    int rc = ::getaddrinfo(host, port, &hints, &res);
    if (rc != 0 || !res) return -1;

    int sock = -1;
    for (addrinfo* p = res; p; p = p->ai_next) {
        sock = ::socket(p->ai_family, p->ai_socktype, p->ai_protocol);
        if (sock < 0) continue;

        if (::connect(sock, p->ai_addr, p->ai_addrlen) == 0) {
            ::freeaddrinfo(res);
            return sock;
        }
        ::close(sock);
        sock = -1;
    }

    ::freeaddrinfo(res);
    return -1;
}

static std::string lower_copy(std::string s) {
    for (char& c : s) c = (char)std::tolower((unsigned char)c);
    return s;
}

static bool starts_with(const std::string& s, const char* prefix) {
    return s.rfind(prefix, 0) == 0;
}

int main(int argc, char** argv) {
    if (argc != 3) {
        std::cerr << "Usage: " << argv[0] << " <host> <port>\n";
        return 1;
    }

    int sock = connect_to(argv[1], argv[2]);
    if (sock < 0) {
        std::cerr << "Failed to connect to " << argv[1] << ":" << argv[2] << "\n";
        return 1;
    }

    std::cout << "Connected to " << argv[1] << ":" << argv[2] << "\n";
    std::cout << "Enter commands. Ctrl+D or 'exit' to quit.\n";

    std::string line;
    while (true) {
        std::cout << "> " << std::flush;

        if (!std::getline(std::cin, line)) break; // Ctrl+D
        if (line == "exit") break;
        if (line.empty()) continue;

        // send command line + newline (line-based protocol)
        std::string wire = line + "\n";
        if (!send_all(sock, wire.c_str(), wire.size())) {
            std::cerr << "Send failed (server closed?)\n";
            break;
        }

        // read status line
        std::string status;
        if (!recv_line(sock, status)) {
            std::cerr << "Server closed connection.\n";
            break;
        }
        std::cout << status << "\n";

        // If 200 Ok and the command is GET/SEARCH, read payload safely
        std::string cmd = lower_copy(line);
        bool is_get = starts_with(cmd, "get ");
        bool is_search = starts_with(cmd, "search ");
        bool is_200 = (status == "200 Ok");

        if (is_200 && (is_get || is_search)) {
            // Avoid blocking forever: only read if data is ready
            if (sock_has_data(sock, 200)) { // 200ms is enough locally
                std::string payload;

                // read next line (could be empty separator)
                if (!recv_line(sock, payload)) {
                    std::cerr << "Server closed connection.\n";
                    break;
                }

                // skip empty separator lines (if server sends blank line)
                while (payload.empty() && sock_has_data(sock, 50)) {
                    if (!recv_line(sock, payload)) {
                        std::cerr << "Server closed connection.\n";
                        break;
                    }
                }

                if (!payload.empty()) std::cout << payload << "\n";
            }
        }
    }

    // Graceful disconnect
    ::shutdown(sock, SHUT_RDWR);
    ::close(sock);
    std::cout << "Disconnected.\n";
    return 0;
}