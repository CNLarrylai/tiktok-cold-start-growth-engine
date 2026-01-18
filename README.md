<div align="center">
<img width="1200" height="475" alt="GHBanner" src="https://github.com/user-attachments/assets/0aa67016-6eaf-458a-adb2-6e31a0763ed6" />
</div>

# ServiceGrow - TikTok Cold Start Growth Engine

This is a full-stack application with a React frontend and a Node.js/SQLite backend for local persistence and securely handling AI API calls.

## Prerequisites

You MUST have **Node.js** installed to run this application.
- [Download Node.js](https://nodejs.org/) (LTS version recommended)

To verify installation, open a terminal and run `node -v`.

## Quick Start Guide

### 1. Setup Backend (The Server)

The backend handles the database (saving your bios/hooks) and connects to Gemini AI.

1.  Open a terminal and navigate to the `server` folder:
    ```bash
    cd server
    ```
2.  Install dependencies:
    ```bash
    npm install
    ```
3.  **Important**: Create/Edit the `.env` file in the `server` folder.
    - Set your `API_KEY` to your actual Google Gemini API key.
    - `PORT=3000` (default)
4.  Start the server:
    ```bash
    npm start
    ```
    *Keep this terminal window open!*

### 2. Setup Frontend (The User Interface)

1.  Open a **new** terminal window (do not close the server one).
2.  Navigate to the project root folder (where `package.json` and this README are).
3.  Install dependencies:
    ```bash
    npm install
    ```
4.  Start the frontend:
    ```bash
    npm run dev
    ```
5.  Open the link shown in the terminal (usually `http://localhost:5173`) in your browser.

## Features implemented

-   **Backend API**: Securely handles Gemini calls.
-   **Local Persistence**: Your generated Bios and Hooks are saved automatically.
    -   If you refresh the page or come back later (on the same computer), your data will be there.
    -   Uses a generated Device ID stored in LocalStorage to identify you.
