const { v4: uuidv4 } = require('uuid');

// In-Memory Database
const users = [];

exports.register = (req, res) => {
    const { username, password } = req.body;

    // basic validation
    if (!username || !password) {
        return res.status(400).json({ error: "Username and password are required" });
    }

    // scan array to check if user already exists.
    const existingUser = users.find(u => u.username === username);
    if (existingUser) {
        return res.status(409).json({ error: "User already exists" });
    }

    // create new user
    const newUser = {
        //create unique ID
        id: uuidv4(), 
        username,
        password 
    };

    // insert to array
    users.push(newUser);

    console.log(`New user registered: ${username} (ID: ${newUser.id})`);

    //print user's ID
    res.status(200).json({ id: newUser.id, username: newUser.username });
};