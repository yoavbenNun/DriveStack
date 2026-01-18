#!/bin/bash
set -e

echo "Starting containers..."
docker compose down --remove-orphans || true
docker compose up --build -d

echo "Waiting for node /health..."
for i in {1..40}; do
  if curl -s --fail http://localhost:3000/health >/dev/null; then
    echo "Health OK ✅"
    break
  fi
  echo "Not ready yet... ($i/40)"
  sleep 1
done

# final check (if still failing -> exit with error)
curl -s --fail http://localhost:3000/health >/dev/null

echo ""
echo "Containers:"
docker compose ps

echo ""
echo "Done. Cleaning up..."
docker compose down
echo "Integration test passed ✅"
