# Advanced System Programming  - EX2

## Authors:

Yoav Ben-Noon

Lidor Ben David

Omri Halfon

## Project Description
This project implements a multi-threaded TCP Server-Client architecture.
* **Server:** Implemented in C++ (handling business logic, file management, and concurrency).
* **Clients:** Two client implementations are provided:
    1.  **C++ Client:** A console-based client running inside the Docker container.
    2.  **Python Client:** A script-based client running on the host machine.

The server supports the following commands over TCP:
* `POST <filename> <content>`: Creates a file (returns `201 Created`).
* `GET <filename>`: Retrieves file content (returns `200 Ok`).
* `DELETE <filename>`: Deletes a file (returns `204 No Content`).
* `SEARCH <string>`: Searches for files containing the string (returns `200 Ok`).


## How to run (Using Docker):
### 1. Build the Image
Open a terminal in the project root directory and run:
```
docker build -t final-app .
```
### 2. Run the Server
Run the server container mapping port 3000:
```
docker run -dp 3000:3000 final-app
```

### 3. Run the Clients
#### Option A: C++ Client (Inside Docker)
1. Get the container ID or name: 
   ```
   docker ps
   ```
     
3. Enter the container:
   ```
   docker exec -it <CONTAINER ID> /bin/bash
   ```

5. Run the client:
   ``` 
   ./cli_app 127.0.0.1 3000
   ```
            
<img width="1575" height="356" alt="Screenshot 2026-01-05 141044" src="https://github.com/user-attachments/assets/584c29d7-6673-45d1-821d-dfae3f4e49b3" />
    





#### Option B: Python Client (Inside docker)
    1. Get the container ID or name: 
   ```
   docker ps
   ```
     
2. Enter the container:
   ```
   docker exec -it 54251680dedd python3 clients/python/client.py 127.0.0.1 3000
   ```
    
    
<img width="1573" height="511" alt="Screenshot 2026-01-05 144056" src="https://github.com/user-attachments/assets/9c3f11e2-1438-4603-95da-abcce7ca8fce" />






## Design & Architecture (SOLID Principles)

### Handling Changes (Retrospective)
As requested, here is how our design adheres to the **Open/Closed Principle (OCP)** regarding the changes from Exercise 1 to Exercise 2:

**1. Command Name Changes (e.g., `add` to `POST`)**
* **Did it require modifying closed code?** No.
* **Explanation:** We utilized the **Factory/Command Pattern**. The mapping between command strings (e.g., "POST") and Command objects is decoupled from the logic itself. Changing the keyword only required updating the registration in the Factory, without altering the underlying logic of the `AddCommand` class.

**2. Adding New Commands (`DELETE`)**
* **Did it require modifying closed code?** No.
* **Explanation:** Thanks to the Command interface, adding `DELETE` was done by creating a new class `DeleteCommand` that implements the common interface. The server's main loop and parser did not need significant changes to accommodate this new feature, demonstrating the Open/Closed principle.

**3. Output Format Changes (HTTP-like status codes)**
* **Did it require modifying closed code?** No.
* **Explanation:** The command logic returns a response object/string. The formatting of the response was encapsulated. We updated the return values in the specific command classes to match the required protocol (`200 Ok`, `204 No Content`) without breaking the core execution flow.

**4. I/O Changes (Console to Socket)**
* **Did it require modifying closed code?** No.
* **Explanation:** We separated the **Business Logic** from the **Communication Layer**. The core logic (creating/deleting files) does not care where the input comes from. In Ex1, the input came from `std::cin`, and in Ex2, it comes from a socket buffer. This allowed us to reuse the entire business logic engine by simply swapping the I/O interface.

### Multi-Threading Strategy
* **Implementation:** We implemented a **Thread-per-Client** model. For every new connection accepted by the server, a new `std::thread` is spawned to handle that specific client's session.
* **Future Extensibility:** While we currently spawn a new thread per client, the architecture is designed so that the "Worker" logic is encapsulated. If we need to switch to a **Thread Pool** in the future, we would only need to change the connection acceptance loop to submit tasks to a queue managed by a pool, rather than spawning raw threads directly. The client handling logic itself would remain unchanged.

## Proof of Multi-Threading & Python Support
To demonstrate that the server can handle multiple clients simultaneously (including both C++ and Python clients), we ran a load test script while a C++ client was connected.


<img width="536" height="227" alt="image" src="https://github.com/user-attachments/assets/1cfa3c09-26b3-431a-8d67-55ad2784740b" />

