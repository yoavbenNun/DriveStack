# ================================
# Stage 1: Build Stage (The Builder)
# ================================
FROM gcc:latest AS builder

# Install CMake
RUN apt-get update && apt-get install -y cmake

WORKDIR /usr/src/app

# Copy source code
COPY . .

# Build the project
WORKDIR /usr/src/app/build
RUN cmake .. && make

# ================================
# Stage 2: Runtime Stage (The Final Product)
# ================================
# ubuntu:24.04 to support the latest GLIBC version
FROM ubuntu:24.04

# Install only the necessary runtime library for C++ (No compiler needed)
RUN apt-get update && apt-get install -y libstdc++6 && rm -rf /var/lib/apt/lists/*

WORKDIR /app

# COPY ONLY the executable FROM the builder stage
# (Assuming your executable is named 'cli_app' in CMakeLists.txt)
COPY --from=builder /usr/src/app/build/cli_app .
COPY --from=builder /usr/src/app/build/server_app .

# Create data directory and set permissions
RUN mkdir -p /app/data
ENV CLI_SAVE_PATH="/app/data"

# Default command
CMD ["./server_app", "3000"]