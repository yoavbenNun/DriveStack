const fs = require('fs').promises;
const path = require('path');
const { v4: uuidv4 } = require('uuid');
const jwt = require('jsonwebtoken');

// define user's data path
const DATA_DIR = path.join(__dirname, '../../data');
const USERS_FILE = path.join(DATA_DIR, 'users.json');
const SECRET_KEY = 'my_secret_key_123'; 

// check if folder exist. if not, create the folder.
const ensureDataDir = async () => {
    try {
        await fs.access(DATA_DIR);
    } catch {
        await fs.mkdir(DATA_DIR, { recursive: true });
    }
};

// read users from file
const readUsersFile = async () => {
    try {
        await ensureDataDir(); 
        const data = await fs.readFile(USERS_FILE, 'utf8');
        return JSON.parse(data);
    } catch (error) {
        return [];
    }
};

// write users to file
const writeUsersFile = async (users) => {
    await ensureDataDir();
    await fs.writeFile(USERS_FILE, JSON.stringify(users, null, 2));
};

exports.register = async (req, res) => {
    const { username, password } = req.body;

    if (!username || !password) {
        return res.status(400).json({ error: "Username and password are required" });
    }

    try {

        //read files
        const users = await readUsersFile();

        // check if user exist
        const existingUser = users.find(u => u.username === username);
        if (existingUser) {
            return res.status(400).json({ error: "User already exists" });
        }

        //create new user
        const newUser = {
            id: uuidv4(),
            username,
            password 
        };

        // write user to file
        users.push(newUser);
        await writeUsersFile(users);

        console.log(`New user registered: ${username} (ID: ${newUser.id})`);
        console.log(`Saved to: ${USERS_FILE}`); 

        res.status(200).json({ id: newUser.id, username: newUser.username });

    } catch (error) {
        console.error('Register Error:', error);
        res.status(500).json({ error: 'Failed to register user' });
    }
};

exports.getUser = async (req, res) => {
    try {
        const users = await readUsersFile();
        const userId = req.params.id; 

        const user = users.find(u => u.id === userId);

        if (!user) {
            return res.status(404).json({ error: 'User not found' });
        }

        const { password, ...userWithoutPassword } = user;
        res.json(userWithoutPassword);

    } catch (error) {
        console.error('Get User Error:', error);
        res.status(500).json({ error: 'Failed to fetch user' });
    }
};

exports.login = async (req, res) => {
    const { username, password } = req.body;

    if (!username || !password) {
        return res.status(404).json({ error: "Username and password are required" });
    }

    try {
        const users = await readUsersFile();

        // check if user exist and the paswwords match
        const user = users.find(u => u.username === username && u.password === password);

        if (!user) {
            return res.status(404).json({ error: "Invalid username or password" });
        }

        // create one hour valid token
        const token = jwt.sign(
            { id: user.id, username: user.username }, 
            SECRET_KEY, 
            { expiresIn: '1h' }
        );

        // giving token to client
        res.json({ token: token });

    } catch (error) {
        console.error('Login Error:', error);
        res.status(404).json({ error: 'Login failed' });
    }
};