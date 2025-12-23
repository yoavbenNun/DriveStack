#pragma once
#include <string>

#ifdef _WIN32
  #include <winsock2.h>
  using SocketT = SOCKET;
#else
  #include <sys/types.h>
  #include <sys/socket.h>
  #include <unistd.h>
  using SocketT = int;
#endif

bool sendAll(SocketT s, const std::string& data);

//close the socket
void closeSocket(SocketT s);
