# ================================
# Stage 1: Build Stage (The Builder)
# ================================
FROM gcc:latest AS builder

RUN apt-get update && apt-get install -y cmake && rm -rf /var/lib/apt/lists/*

WORKDIR /usr/src/app
COPY . .

RUN mkdir -p /usr/src/app/build
WORKDIR /usr/src/app/build
RUN cmake .. && make

# ================================
# Stage 2: Runtime Stage
# ================================
FROM ubuntu:24.04

RUN apt-get update && apt-get install -y libstdc++6 && rm -rf /var/lib/apt/lists/*

WORKDIR /app

COPY --from=builder /usr/src/app/build/cli_app .
COPY --from=builder /usr/src/app/build/server_app .

RUN mkdir -p /app/data
ENV CLI_SAVE_PATH="/app/data"

EXPOSE 8080
CMD ["./server_app", "8080"]
