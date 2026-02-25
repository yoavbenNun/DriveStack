const { v4: uuidv4 } = require('uuid');

const users = []; 

const DEFAULT_AVATAR = "https://upload.wikimedia.org/wikipedia/commons/7/7c/Profile_avatar_placeholder_large.png";

class UserModel {
    constructor(username, password, name, email, image) {
        this.id = uuidv4();
        this.username = username;
        this.password = password; 
        this.name = name || '';
        this.email = email || '';
        this.image = image || DEFAULT_AVATAR;
        this.created_at = new Date();
    }

    save() {
        users.push(this);
        return this;
    }

    static getAll() {
        return users;
    }

    static findById(id) {
        return users.find(u => u.id === id);
    }

    static findByUsername(username) {
        return users.find(u => u.username === username);
    }

    static exists(username) {
        return users.some(u => u.username === username);
    }

    static findByEmail(email) {
        return users.find(u => u.email === email);
    }
}

module.exports = UserModel;