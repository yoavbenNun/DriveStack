// web-server/src/services/TcpClient.js
const net = require("net");

class TcpClient {
  constructor(port, host) {
    this.port = port;
    this.host = host || "127.0.0.1";
  }

  send(command) {
    return new Promise((resolve, reject) => {
      const client = new net.Socket();
      const chunks = [];
      let settled = false;

      const finishResolve = (buf) => {
        if (settled) return;
        settled = true;
        resolve(buf.toString("utf8"));
      };

      const finishReject = (err) => {
        if (settled) return;
        settled = true;
        reject(err);
      };

      client.connect(this.port, this.host, () => {
        // 
        client.write(command + "\n");
        client.end();
      });

      client.on("data", (data) => {
        chunks.push(data); // 
      });

      client.on("end", () => {
        finishResolve(Buffer.concat(chunks));
      });

      client.on("error", (err) => {
        finishReject(new Error(`TCP Connection Error: ${err.message}`));
      });

      client.setTimeout(30000);
      client.on("timeout", () => {
        client.destroy();
        finishReject(new Error("TCP Connection Timed Out"));
      });
    });
  }
}

module.exports = TcpClient;
