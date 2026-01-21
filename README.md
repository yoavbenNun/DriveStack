# Advanced System Programming - EX3

## Authors:
* Yoav Ben-Noon
* Lidor Ben David
* Omri Halfon

## Project Description
This project implements a fully containerized **Microservices Architecture** using Docker Compose. The system creates a distributed file storage solution with a clear separation of concerns:

* **Service A: Node.js API Gateway (Port 3000)**
    * Acts as the entry point for clients.
    * Manages **Authentication & Metadata** (Users, File IDs) using an **In-Memory Database**.
    * Communicates with the C++ server via a custom TCP protocol.
    * Implemented using Express.js.

* **Service B: C++ Storage Server (Internal Port 8080)**
    * Acts as the persistent storage engine.
    * Handles physical file I/O operations (Read/Write/Search) on the disk.
    * Utilizes a **Thread Pool** for handling multiple concurrent requests from the Node.js service.
    * Data is persisted using **Docker Volumes**.

### Supported API Flows:
1.  **User Management:** Register and Login (returns an access token/ID).
2.  **File Operations:** Create, Read, Delete files (Requests are routed from Node.js -> C++).
3.  **Search:** Search for text patterns inside files and in file's names stored on the C++ server.

---

## How to Run (Using Docker Compose)

Unlike the previous exercise, we use **Docker Compose** to orchestrate both services and the network simultaneously.

### 1. Build and Start the System
Open a terminal in the project root directory and run:
```
docker-compose up --build -d
```
### 2. Verify Containers are Running
Ensure both `node-server` and `cpp-server` are up and healthy:
```
docker-compose ps
```
<img width="1199" height="71" alt="image" src="https://github.com/user-attachments/assets/06272b22-f71f-4aae-a537-0962da94260b" />

## How to test (End-to-End)

You can verify the entire system flow (Register -> Login -> Create -> Search) by copying and pasting the following scripts directly into your PS terminal.

### 1. register a new user
```
$register = Invoke-RestMethod -Uri "http://localhost:3000/api/users" -Method Post -ContentType "application/json" -Body '{"username": "demo_user", "password": "123", "email": "demo@test.com"}'
Write-Host "User Registered: $($register.username)"
```
### 2. Login and capture the User ID automatically
```
$token = Invoke-RestMethod -Uri "http://localhost:3000/api/tokens" -Method Post -ContentType "application/json" -Body '{"username": "demo_user", "password": "123"}'
$userId = $token.id
Write-Host "Logged in! User ID: $userId"
```
### 3. Create a file on the C++ Storage Server
```
Invoke-RestMethod -Uri "http://localhost:3000/api/files" -Method Post -ContentType "application/json" -Headers @{"x-user-id"=$userId} -Body '{"name": "demo_script.txt", "content": "This text was created via automated script"}'
Write-Host "✅ File 'demo_script.txt' created successfully."
```
### 4. Search for content inside the file
```
$searchResult = Invoke-RestMethod -Uri "http://localhost:3000/api/search/automated" -Headers @{"x-user-id"=$userId}
Write-Host "✅ Search Result for 'automated': $($searchResult.results)"
```

<img width="1864" height="525" alt="image" src="https://github.com/user-attachments/assets/264c0f94-ad56-4dcb-afd2-1e0256cebde8" />

---
## Design & Architecture (SOLID & Microservices)
### Architectural Decisions (Retrospective)
### 1. From Monolith to Microservices

* **Evolution:** In EX2, the C++ server handled everything. In EX3, we decoupled the logic.

* **Benefit:** The **Node.js** service handles high-level logic (Auth, API routing) which is easier to implement in JavaScript, while the C++ service focuses on high-performance I/O and storage. This adheres to the Single Responsibility Principle (SRP) at the architectural level.

### 2. Communication Protocol

* **Implementation:** We designed a custom TCP protocol. The Node.js server opens a socket connection to the C++ server for every file operation.

* **Format:** `VERB <ID> <CONTENT>` (e.g., `POST 1234-5678 my_content`).

### 3. Persistence Strategy (The Hybrid Approach)

* **In-Memory (Node.js):** User data and file metadata are volatile. If the Node container restarts, this data is lost.

* **Persistent Volume (C++):** Physical files are stored in a mapped volume (`./cpp_data` on host -> `/app/data` in container).

* **Proof:** Restarting the containers (`docker-compose restart`) clears the users list, but the files physically remain in the `cpp_data` folder on your computer.

### Multi-Threading Strategy (Thread Pool)
* **Change from EX2:** Instead of spawning a thread per client (which can exhaust resources), the C++ server now uses a **Thread Pool**.

* **Mechanism:** A fixed number of worker threads wait for tasks. When the Node.js server sends a request, it is added to a queue and picked up by an available worker. This ensures stability under high load.
