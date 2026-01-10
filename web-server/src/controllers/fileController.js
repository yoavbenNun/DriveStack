const TcpClient = require('../services/TcpClient');

// has to be the same port as we ran in C++ server
const CPP_PORT = 5555; 
const CPP_HOST = '127.0.0.1';

exports.searchFiles = async (req, res) => {
    // creare client
    const query = req.query.q;

    if (!query) {
        return res.status(400).json({ error: "Query parameter 'q' is required" });
    }

    const client = new TcpClient(CPP_PORT, CPP_HOST);

    try {
        console.log(`[FileController] Searching for: ${query}`);

        // send command to C++ Server
        const command = `SEARCH ${query}`; 
        const response = await client.send(command);

        console.log('[FileController] C++ Responded');

        // return call as JSON
        res.status(200).json({ 
            success: true, 
            query: query,
            data: response 
        });

    } catch (error) {
        console.error('[FileController] Error:', error.message);
        res.status(404).json({ 
            error: 'Failed to communicate with C++ Server',
            details: error.message 
        });
    }
};