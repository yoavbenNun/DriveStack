# 📂 Drive Clone - Mobile Application

A mobile cloud storage solution (inspired by Google Drive) built with **React Native (Expo)** and **Node.js**. This application allows users to securely manage, upload, and organize their files with a modern, intuitive interface.

---
## Authors:
* Yoav Ben-Noon
* Lidor Ben David
---

## 🚀 Key Features

* **User Authentication:** Secure Sign-up and Login system with profile picture support.
* **Real-time Validation:** Advanced form validation for email formats, password complexity, and password matching.
* **File Management:** Upload, view, and manage files and images directly from your mobile device.
* **Modern UI/UX:** Clean design based on Material Design principles for a smooth user experience.
* **Camera Integration:** Take profile photos or upload existing ones from the gallery.

---

## 📸 Screenshots

<p align="center">
  <img src="https://github.com/user-attachments/assets/6377624b-1e73-4b56-b224-b23c807cf655" width="250" alt="Register Screen" />
  <img src="https://github.com/user-attachments/assets/e8488675-1e8c-402f-93e3-8d39be16a643" width="300" />
  <img src="https://github.com/user-attachments/assets/5766ec74-28ec-44bf-9e5e-e7c13921f782" width="300" />
  <img src="https://github.com/user-attachments/assets/baaf3a11-317b-4568-a04b-bdbbd4e06868" width="300" />
</p>

---

## 🛠 Tech Stack

### Frontend
- **React Native (Expo)**
- **React Navigation** (Stack & Tab navigation)
- **Axios** (API Communication)
- **Expo Image Picker** (Media handling)

### Backend
- **Node.js & Express**
- **Multer** (File upload middleware)
- **MongoDB** (Database)

---

## ⚙️ Installation & Setup

1. **Clone the repository:**
   ```
   git clone <Github_Link>
   ```
2. **Install dependencies:**
   ```
   npm install
   ```
3. **Build docker compose:**
   ```
   docker-compose up -d --build
   ```
4. **Configure api:**
  create `.env` file inside `mobile-app` folder:
   ```
    EXPO_PUBLIC_SERVER_URL=http://<YOUR_LOCAL_IP:3000
   ```
5. **Run the application:**
   ```
   npx expo start --clear --port 8888
   ```
