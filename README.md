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
1. Add a file: add hello.txt "AAABBBCCC"
2. Get the content: get hello.txt (Output: 3A3B3C)
3. Search for text: search "B" (Output: hello.txt)
<img width="1905" height="1005" alt="image" src="https://github.com/user-attachments/assets/6b12f314-9a03-4235-9382-cdad3f6d2d40" />


י



