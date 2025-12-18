#pragma once
#include <string>

#ifdef _WIN32
#include <winsock2.h>
using SocketT = SOCKET;
#else
using SocketT = int;
#endif

bool sendAll(SocketT s, const std::string& data);
