const jwt = require('jsonwebtoken');
const bcrypt = require('bcrypt'); // הוספנו את ספריית ההצפנה
const UserModel = require('../models/user.model'); // כעת זה מצביע למודל המונגו שלנו

const SECRET_KEY = 'my_secret_key_123';
const DEFAULT_AVATAR = "https://upload.wikimedia.org/wikipedia/commons/7/7c/Profile_avatar_placeholder_large.png";

// הוספנו async
exports.register = async (req, res) => {
    const { username, password, name, email, image } = req.body;

    if (!username || !password || !email) {
        return res.status(400).json({ error: "Username, password, and email are required" });
    }

    try {
        const existingUser = await UserModel.findOne({ $or: [{ username }, { email }] });
        
        if (existingUser) {
            if (existingUser.username === username) {
                return res.status(409).json({ error: "User already exists" }); 
            }
            if (existingUser.email === email) {
                return res.status(409).json({ error: "Email already in use" });
            }
        }

        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, salt);

        const newUser = new UserModel({
            username,
            password: hashedPassword, 
            name,
            email,
            image: image || DEFAULT_AVATAR
        });
        
        await newUser.save(); 

        console.log(`New user registered: ${username} (ID: ${newUser.id}) Email: ${email}`);

        res.status(201).json({ id: newUser.id, username: newUser.username, email: newUser.email, image: newUser.image });

    } catch (error) {
        console.error('Register Error:', error);
        res.status(500).json({ error: 'Failed to register user' });
    }
};

exports.getUser = async (req, res) => {
    try {
        const userId = req.params.id; 
        
        const user = await UserModel.findById(userId).select('-password');

        if (!user) {
            return res.status(404).json({ error: 'User not found' });
        }

        res.json(user);

    } catch (error) {
        console.error('Get User Error:', error);
        res.status(500).json({ error: 'Failed to fetch user' });
    }
};

exports.login = async (req, res) => {
    const { username, password } = req.body;

    if (!username || !password) {
        return res.status(400).json({ error: "Username and password are required" });
    }

    try {
        const user = await UserModel.findOne({ username });

        if (!user) {
            return res.status(404).json({ error: "Invalid username or password" });
        }

        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) {
            return res.status(404).json({ error: "Invalid username or password" });
        }

        const token = jwt.sign(
            { id: user.id, username: user.username }, 
            SECRET_KEY, 
            { expiresIn: '1h' }
        );

        res.json({ 
            message: "Login successful",
            id: user.id,
            username: user.username,
            name: user.name,
            email: user.email,
            image: user.image,
            token: token 
        });

    } catch (error) {
        console.error('Login Error:', error);
        res.status(500).json({ error: 'Login failed' });
    }
};

exports.updateProfileImage = async (req, res) => {
    const { id } = req.params;
    const { image } = req.body;

    if (!image) {
        return res.status(400).json({ error: "Image data is required" });
    }

    try {
        const user = await UserModel.findByIdAndUpdate(
            id, 
            { image: image },
            { new: true }
        );
        
        if (!user) {
            return res.status(404).json({ error: "User not found" });
        }

        res.json({ message: "Profile image updated successfully", image: user.image });
    } catch (error) {
        console.error('Update Image Error:', error);
        res.status(500).json({ error: 'Failed to update profile image' });
    }
};

exports.deleteProfileImage = async (req, res) => {
    const { id } = req.params;

    try {
        const user = await UserModel.findByIdAndUpdate(
            id,
            { image: DEFAULT_AVATAR },
            { new: true }
        );
        
        if (!user) {
            return res.status(404).json({ error: "User not found" });
        }

        res.json({ message: "Profile image deleted successfully", image: user.image });
    } catch (error) {
        console.error('Delete Image Error:', error);
        res.status(500).json({ error: 'Failed to delete profile image' });
    }
};