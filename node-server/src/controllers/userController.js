const jwt = require('jsonwebtoken');
const UserModel = require('../models/user.model');

const SECRET_KEY = 'my_secret_key_123';

exports.register = (req, res) => {
    const { username, password, name, email, image } = req.body;

    if (!username || !password || !email) {
        return res.status(400).json({ error: "Username, password, and email are required" });
    }

    try {
        // check if user is exist
        if (UserModel.exists(username)) {
            return res.status(409).json({ error: "User already exists" }); 
        }

        //check if email is in use
        if (UserModel.findByEmail(email)) {
            return res.status(409).json({ error: "Email already in use" });
        }

        // create new user
        const newUser = new UserModel(username, password, name, email, image);
        newUser.save();

        console.log(`New user registered: ${username} (ID: ${newUser.id}) Email: ${email}`);

        res.status(201).json({ id: newUser.id, username: newUser.username });

    } catch (error) {
        console.error('Register Error:', error);
        res.status(400).json({ error: 'Failed to register user' });
    }
};

exports.getUser = (req, res) => {
    try {
        const userId = req.params.id; 
        const user = UserModel.findById(userId);

        if (!user) {
            return res.status(404).json({ error: 'User not found' });
        }

        // retrun details without password
        const { password, ...userWithoutPassword } = user;
        res.json(userWithoutPassword);

    } catch (error) {
        console.error('Get User Error:', error);
        res.status(404).json({ error: 'Failed to fetch user' });
    }
};

exports.login = (req, res) => {
    const { username, password } = req.body;

    if (!username || !password) {
        return res.status(400).json({ error: "Username and password are required" });
    }

    try {
        // search user by name
        const user = UserModel.findByUsername(username);

        // check if user exist and if password match
        if (!user || user.password !== password) {
            return res.status(404).json({ error: "Invalid username or password" });
        }

        // creat token
        const token = jwt.sign(
            { id: user.id, username: user.username }, 
            SECRET_KEY, 
            { expiresIn: '1h' }
        );

        res.json({ 
            message: "Login successful",
            id: user.id,
            token: token 
        });

    } catch (error) {
        console.error('Login Error:', error);
        res.status(500).json({ error: 'Login failed' });
    }
};