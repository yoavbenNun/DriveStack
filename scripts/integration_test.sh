#!/bin/bash
set -e

echo "Starting containers..."
docker compose down --remove-orphans || true
docker compose up --build -d

echo "Waiting for node /health..."
curl --retry 20 --retry-delay 1 --fail http://localhost:3000/health

echo ""
echo "Health OK ✅"
echo ""
echo "Containers:"
docker compose ps

echo ""
echo "Done. Cleaning up..."
docker compose down
echo "Integration test passed ✅"
