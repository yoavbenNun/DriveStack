const mongoose = require('mongoose');
const { v4: uuidv4 } = require('uuid');

const permissionSchema = new mongoose.Schema({
    pId: { type: String, default: uuidv4 }, 
    type: { type: String, required: true },
    holderId: { type: String, required: true }
}, { _id: false });

const fileSchema = new mongoose.Schema({
    ownerId: { type: String, required: true },
    name: { type: String, required: true },
    type: { type: String, required: true }, // 'file' or 'dir'
    parentId: { type: String, default: null },
    
    shared: { type: Boolean, default: false },
    starred: { type: Boolean, default: false },
    trashed: { type: Boolean, default: false },
    deletedAt: { type: Date, default: null },
    
    permissions: [permissionSchema]
}, { 
    timestamps: true 
});

fileSchema.set('toJSON', {
    virtuals: true,
    transform: (doc, ret) => {
        ret.id = ret._id;
        delete ret._id;
        delete ret.__v;
    }
});

module.exports = mongoose.model('File', fileSchema);