import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';

const BASE_URL = 'http://192.168.1.69:3000/api';

const api = axios.create({
  baseURL: BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add a request interceptor to attach the JWT token automatically
api.interceptors.request.use(
  async (config) => {
    try {
      // Retrieve the token from local storage
      const token = await AsyncStorage.getItem('userToken');
      
      if (token) {
        // Attach the token to the Authorization header
        config.headers.Authorization = `Bearer ${token}`;
      }
    } catch (error) {
      console.error('Error fetching token from storage', error);
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

export default api;

export async function getFiles(parentId = null, extraParams = {}) {
  const params = { ...extraParams };
  if (parentId) {
    params.parentId = parentId;
  }
  const res = await api.get('/files', { params });
  return res.data;
}

// bring specific item
export async function getFileById(id) {
  const res = await api.get(`/files/${id}`);
  return res.data;
}

//create Folder
export async function createFolder(name, parentId = null) {
  const res = await api.post("/files", {
    name,
    type: "folder",
    parentId,
  });
  return res.data;
}

// Rename
export async function renameItem(id, name) {
  const res = await api.patch(`/files/${id}`, { name });
  return res.data;
}

// Share 
export async function shareItem(id, shareWith) {
  const res = await api.post(`/files/${id}/permissions`, { email: shareWith });
  return res.data;
}

// Toggle star
export async function toggleStar(id, starred) {
  const res = await api.patch(`/files/${id}/star`, { starred });
  return res.data;
}

// Upload File (Document or Photo)
export async function uploadFile(file, parentId = null) {
  const formData = new FormData();
  
  formData.append('file', {
    uri: file.uri,
    name: file.name || file.fileName || `file_${Date.now()}`,
    type: file.mimeType || file.type || 'application/octet-stream',
  });

  if (parentId) {
    formData.append('parentId', parentId);
  }

  const res = await api.post('/files/upload', formData, {
    headers: {
      'Content-Type': 'multipart/form-data',
    },
  });
  
  return res.data;
}

export async function removeSharedAccess(id) {
  const res = await api.delete(`/files/${id}/shared`);
  return res.data;
}

// Restore file from trash
export async function restoreItem(id) {
  const res = await api.patch(`/files/${id}/trash`, { trashed: false }); 
  return res.data;
}

// Soft Delete (move to trash)
export async function deleteItem(id) {
  const res = await api.patch(`/files/${id}/trash`, { trashed: true });
  return res.data;
}

// Delete permanently
export async function deletePermanently(id) {
  const res = await api.delete(`/files/${id}`); 
  return res.data;
}

export async function searchFiles(query) {
  const res = await api.get(`/search/${encodeURIComponent(query)}`);
  return res.data;
}