import socket
import threading

HOST = "127.0.0.1"
PORT = 3000

def recv_line(sock):
    data = b""
    while True:
        ch = sock.recv(1)
        if not ch or ch == b"\n":
            break
        data += ch
    return data.decode()

def worker(i):
    s = socket.socket()
    s.connect((HOST, PORT))

    s.sendall(f"post f{i} AABB\n".encode())
    print(f"[{i}] post ->", recv_line(s))

    s.sendall(f"get f{i}\n".encode())

    status = recv_line(s)
    if status.startswith("200"):
        recv_line(s)     
        content = recv_line(s)
        print(f"[{i}] GET -> {status} | Content: {content}")
    else:
        print(f"[{i}] GET -> {status}")

    s.close()

threads = []
for i in range(5):
    t = threading.Thread(target=worker, args=(i,))
    t.start()
    threads.append(t)

for t in threads:
    t.join()

