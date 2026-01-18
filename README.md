EX3 - Unified Docker System (C++ Server + Node Server)

This project contains:
- cpp-server: C++ backend service (runs on port 8080 inside the container)
- node-server: Node.js service that proxies/communicates with the C++ server (runs on port 3000)

Run with Docker Compose:
docker compose up --build -d

Health Check:
curl http://localhost:3000/health

Expected output:
{"status":"ok","service":"node-server","cpp":"cpp-server:8080"}

Ports:
Node server: http://localhost:3000
C++ server: http://localhost:8081 (mapped from port 8080 inside the container)

Integration Test:
./scripts/integration_test.sh

Stop and Clean Up:
docker compose down
