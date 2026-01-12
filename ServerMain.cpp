#include <iostream>
#include <string>
#include <thread>

#include "CommandParser.h"
#include "server/TcpServer.h"
#include "server/TcpIO.h"
#include "ThreadPool.h"

#ifdef _WIN32
  #include <winsock2.h>   // recv, shutdown, SD_BOTH
#else
  #include <sys/socket.h> // recv, shutdown
  #include <unistd.h>     // close
#endif

static bool readLine(SocketT s, std::string& outLine) {
    outLine.clear();
    constexpr size_t MAX_LINE = 8192;

    char ch;
    while (outLine.size() < MAX_LINE) {
        int n = recv(s, &ch, 1, 0);
        if (n == 0) return false;   // client closed
        if (n < 0) return false;    // error

        if (ch == '\n') break;
        outLine.push_back(ch);
    }

    if (!outLine.empty() && outLine.back() == '\r') {
        outLine.pop_back();
    }
    return true;
}

static void closeClient(SocketT client) {
#ifdef _WIN32
    shutdown(client, SD_BOTH);
    closesocket(client);
#else
    shutdown(client, SHUT_RDWR);
    close(client);
#endif
}


static void handleClient(SocketT client) {
    //Parser for each thread (no shared state)
    CommandParser parser;

    while (true) {
        std::string line;
        if (!readLine(client, line)) break;
        if (line.empty()) continue;

        auto result = parser.parse(line);

        std::string output = result.first
            ? result.first->execute(result.second)
            : "400 Bad Request\n";

        if (output.empty() || output.back() != '\n') output.push_back('\n');

        if (!sendAll(client, output)) break;
    }

    closeClient(client);
}

int main(int argc, char** argv) {
    if (argc != 2) {
        std::cerr << "Usage: server_app <port>\n";
        return 1;
    }

    int port = std::stoi(argv[1]);
    TcpServer server(static_cast<uint16_t>(port));
    server.start();

    //create the thread pool
    ThreadPool pool(5);

    std::cout << "Server started with ThreadPool of 5 workers." << std::endl;

    while (true) {
        SocketT client = server.acceptClient();
        // thread pool
        pool.enqueue([client] {
            handleClient(client);
        });
    }
    return 0;
}
