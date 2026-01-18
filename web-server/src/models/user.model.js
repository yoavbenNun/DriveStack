const { v4: uuidv4 } = require('uuid');

const users = []; 

class UserModel {
    constructor(username, password, name) {
        this.id = uuidv4();
        this.username = username;
        this.password = password; 
        this.name = name || '';
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
}

module.exports = UserModel;