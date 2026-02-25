# Advanced System Programming - EX4 

## Authors:
* Yoav Ben-Noon
* Lidor Ben David
* Omri Halfon

## Project Description
This project implements a fully functional, responsive, and interactive frontend clone of **Google Drive**, built using **React**. It serves as the client-side interface for the Microservices architecture developed in EX3.

The application strictly follows modern web development standards, featuring a dynamic UI, secure routing, and real-time state management. It communicates with the Node.js API Gateway to manage users, directories, and physical file storage.

---

## Key Features & UI/UX

* **Modern React Architecture:** Built using functional components, React Hooks (`useState`, `useEffect`, `useRef`), and Context API for global state management (Auth & Theme).
* **JWT Authentication & Security:** Complete registration and login flows with strict input validation. Protected routes ensure that unauthenticated users are seamlessly redirected to the login screen.
* **Dynamic Theming:** Built-in Light/Dark mode toggle that dynamically updates the entire application's color palette.
* **User Profile Management:** Users can upload, view, and delete their profile pictures. The UI features a polished Google-style popover menu for account actions.
* **File & Directory Management:** Real-time integration with the EX3 backend to display, create, search, and manage files and folders seamlessly without page reloads.

<img width="1915" height="910" alt="image" src="https://github.com/user-attachments/assets/4e8a37e8-bfc9-4c15-9196-9bfa061669e6" />


---



## How to Run (Using Docker Compose)

The entire system (Frontend + Node.js API + C++ Storage Server) is containerized and orchestrated via Docker Compose.

### 1. Build the System
Open a terminal in the project root directory and run:
```
docker-compose up --build -d
```
### 2. Start the system
Open a terminal in the project root directory and run:
```
docker-compose up 
```
### 3. Access the Application
Once the containers are up and running, the services will be available at: http://localhost

<img width="1276" height="155" alt="image" src="https://github.com/user-attachments/assets/b9992ba8-23cf-4e19-ae56-54d09ac0211a" />


## System Architecture & Client-Server Flow
### 1. Component Modularity
The React application is highly modular. Instead of a monolithic structure, the UI is divided into reusable components (e.g., `TopBar`, `SideMenu`, `FileGrid`, `AuthForm`), keeping the codebase clean and maintainable.

### 2. Single Page Application (SPA)
Routing is handled entirely on the client side using `react-router-dom`. The application loads exactly once, and navigation between the Dashboard, Login, and Registration pages happens instantly without refreshing the browser.

### 3. API Communication
All backend interactions (e.g., fetching the file tree, updating profiles, searching) are handled asynchronously via `fetch` API. Requests to protected endpoints automatically attach the user's JWT in the Authorization header to maintain session security.
