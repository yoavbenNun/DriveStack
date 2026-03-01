import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';

const BASE_URL = 'http://10.0.2.2:3000/api';

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

export async function getFiles(parentId = null) {
  //  filter by parentId
  const res = await api.get('/files', { params: parentId ? { parentId } : {} });
  return res.data;
}

// bring specific item
export async function getFileById(id) {
  const res = await api.get(`/files/${id}`);
  return res.data;
}

export async function createFolder(name, parentId = null) {
  const res = await api.post("/files", {
    name,
    type: "folder",
    parentId,
  });
  return res.data;
}