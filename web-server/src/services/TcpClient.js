const net = require('net');

class TcpClient {
    constructor(port, host) {
        this.port = port;
        this.host = host || '127.0.0.1'; // default host
    }

    /**
     * Sends a command to the C++ server and returns the response.
     * @param {string} command - The command string (e.g., "SEARCH query")
     * @returns {Promise<string>} - The server's response
     */
    send(command) {
        return new Promise((resolve, reject) => {
            const client = new net.Socket();
            let responseBuffer = '';

            // Server connection
            client.connect(this.port, this.host, () => {
                client.write(command + '\n');
            });

            // getting information
            let timer = null;

            client.on('data', (data) => {
            responseBuffer += data.toString();

            // wait briefly for more chunks
            if (timer) clearTimeout(timer);
            timer = setTimeout(() => {
                client.end();
            }, 30);
            });

            // close connection
            client.on('close', () => {
                resolve(responseBuffer.trim()); // return valid answer
            });

            // error handling
            client.on('error', (err) => {
                reject(new Error(`TCP Connection Error: ${err.message}`));
            });

            // Timeout exception handling
            client.setTimeout(5000); // 5 seconds
            client.on('timeout', () => {
                client.destroy();
                reject(new Error('TCP Connection Timed Out'));
            });
        });
    }
}

module.exports = TcpClient;