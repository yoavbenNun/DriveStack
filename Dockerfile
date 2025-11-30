# 1. Base Image: Start with a Linux system that has GCC installed
FROM gcc:latest

# 2. Install CMake (required to build the project)
RUN apt-get update && apt-get install -y cmake

# 3. Set the working directory inside the container
WORKDIR /usr/src/app

# 4. Copy all project files into the container
COPY . .

# 5. Create a build directory and enter it
WORKDIR /usr/src/app/build

# 6. Configure and Build the project
# We run cmake to generate makefiles, then make to compile
RUN cmake .. && make

# 7. Define the environment variable for file storage
# We create a specific folder for data so it doesn't mix with code
RUN mkdir -p /usr/src/app/data
ENV CLI_SAVE_PATH="/usr/src/app/data"

# 8. Default command: Run the CLI app when the container starts
CMD ["./cli_app"]