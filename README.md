# Advanced System Programming

Authors:
Yoav Ben-Noon
Lidor Ben David
Omri Halfon

A C++ Command Line Interface (CLI) application designed for file compression and management using the **Run-Length Encoding (RLE)** algorithm.

This project was built using **TDD (Test-Driven Development)** methodology and strictly adheres to **SOLID** design principles to ensure loose coupling and scalability.

## 🚀 Features

The application runs in a continuous loop and supports the following commands:

* **`add [file name] [text]`**: Compresses the input text using RLE and saves it to a new file.
* **`get [file name]`**: Reads a compressed file from the storage, decompresses it, and displays the original content.
* **`search [content]`**: Searches for a specific text pattern within all compressed files and lists the matching filenames.

How to run (Using Docker):
1. Build the Image
Run the following command in the project root directory:
docker build --no-cache -t my_cli_app .

2. Run the Application:
docker run -it my_cli_app
<img width="1003" height="610" alt="image" src="https://github.com/user-attachments/assets/605e7302-5972-4e8c-9f4e-95d5f34ebc98" />

Usage Example:
Here is an example of a session running the app:
1. Add a file: add my "AABB"
2. Get the content: get my (Output: AABB)
3. Search for text: search "A" (Output: my)
<img width="1905" height="1005" alt="image" src="https://github.com/user-attachments/assets/6b12f314-9a03-4235-9382-cdad3f6d2d40" />

# *** Multi-Threading Design (Ex2)
## * Architecture
* The project contains two executables:
1. cli_app: local REPL CLI that parses and executes commands.
2. server_app: TCP server that accepts clients and executes the same commands remotely.

## * Server Concurrency Model
* The server uses a thread-per-client approach: 
acceptClient() returns a connected client socket.
For each client, the server spawns a std::thread that handles the client session.
The main thread continues accepting new clients.
* Each client thread reads requests in a line-based protocol (\n terminated):
The server reads bytes until \n, trims optional \r (CRLF).
The line is parsed using CommandParser.
The produced command is executed and a response is sent back (also line-based).

## * Synchronization / Thread Safety
1. Multiple client threads may access the same storage concurrently.
2. To prevent race conditions (e.g., ADD vs GET / DELETE on the same file), storage access is protected with a single global lock:
Read operations (GET, SEARCH) use std::shared_lock<std::shared_mutex> (multiple readers allowed).
Write operations (ADD, DELETE) use std::unique_lock<std::shared_mutex> (exclusive access).
3. This guarantees consistency of file I/O and avoids partial reads/writes.

## * Platform Notes (Windows)
On Windows, the TCP layer uses Winsock2 and links against Ws2_32.
Client sockets are closed using shutdown(..., SD_BOTH) and closesocket(...).