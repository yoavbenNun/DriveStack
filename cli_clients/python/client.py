import socket
import sys

MAX_LINE = 8192

def recv_line(sock) -> str:
    data = b""
    while len(data) < MAX_LINE:
        ch = sock.recv(1)
        if not ch:
            return ""  # closed
        if ch == b"\n":
            break
        data += ch
    return data.decode("utf-8", errors="replace").rstrip("\r")

def main():
    if len(sys.argv) != 3:
        print("Usage: python3 client.py <host> <port>")
        sys.exit(1)

    host = sys.argv[1]
    port = int(sys.argv[2])

    with socket.create_connection((host, port)) as s:
        print(f"Connected to {host}:{port}")
        while True:
            try:
                line = input().strip()
            except EOFError:
                break

            if not line:
                continue

            cmd = line.split()[0].upper()

            s.sendall((line + "\n").encode("utf-8"))

            status = recv_line(s)
            if status == "":
                print("Server closed connection.")
                break
            print(status)

            # Only GET/SEARCH are expected to return payload
            if cmd in ("GET", "SEARCH") and status.startswith("200"):
                recv_line(s)      
                print("")         
                print(recv_line(s))
                
if __name__ == "__main__":
    main()
