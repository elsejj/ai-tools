# Project Overview

This project is `AiToolsCtrlQ`, an Electron-based desktop application designed to provide quick access to Large Language Models (LLMs) using a global shortcut (`Ctrl+Q`). The core idea is to allow users to select text or copy an image in any application, press the shortcut, and have the selected content processed by a configured LLM tool. The application runs in a small, non-intrusive window, displaying the LLM's response. It's particularly suited for single, context-free tasks like translation, answering questions, or extracting data (e.g., tables from images).

The application supports configuring multiple "tools", which are essentially predefined prompts with specific system instructions and post-processing actions (like copying the result to the clipboard or saving it to a file). It communicates with LLMs via an OpenAI-compatible API. It also integrates with Model Context Protocol (MCP) servers over HTTP to leverage their prompts and tools.

# Technology Stack

*   **Framework:** Electron (for building cross-platform desktop apps with web technologies)
*   **Frontend:**
    *   Vue 3 (JavaScript/TypeScript framework for the renderer process)
    *   PrimeVue (UI component library)
    *   Tailwind CSS (Utility-first CSS framework)
    *   Vite (Build tool and development server)
*   **Backend:** Electron Main Process (Node.js/TypeScript)
*   **State Management:** Pinia (for Vue)
*   **Database:** Dexie.js (IndexedDB wrapper for local data storage)
*   **LLM Interaction:** `openai` JavaScript SDK
*   **MCP:** `@modelcontextprotocol/sdk`
*   **Other:** `html-to-image`, `marked` (Markdown parser/renderer)

# Building, Running, and Testing

## Prerequisites

*   Node.js and npm installed.

## Commands

*   **Install Dependencies:** `npm install`
*   **Development Mode:** `npm run dev` (Starts the app in development mode with hot-reloading).
*   **Type Checking:** `npm run typecheck` (Checks types for both main and renderer processes).
*   **Build for Current Platform:** `npm run build:auto` (Builds the application for the current operating system).
*   **Build for Specific Platforms:**
    *   Windows: `npm run build:win`
    *   macOS: `npm run build:mac`
    *   Linux: `npm run build:linux`
*   **Build Unpacked:** `npm run build:unpack` (Creates an unpacked build directory).
*   **Preview Build:** `npm run start` (Previews a built version of the app).

# Development Conventions

*   **Structure:** The project follows a standard Electron structure with `src/main` for the main process, `src/renderer` for the frontend (renderer process), and `src/preload` for the preload script.
*   **TypeScript:** The project uses TypeScript for both main and renderer processes, with configuration files (`tsconfig.*.json`) defining the setups.
*   **Vite:** Vite is used for building and development. Configuration is in `electron.vite.config.ts`.
*   **UI Library:** PrimeVue components are used for the user interface.
*   **Styling:** Tailwind CSS is used for styling, configured via `tailwind.config.js` and plugins.
*   **Component Auto-Import:** Unplugin Vue Components is used to automatically import Vue components.
*   **Routing:** Vue Router is used for navigation within the renderer process.
*   **State Management:** Pinia is used for state management in the renderer process.
*   **Local Storage:** Dexie.js is used for storing local application data like tools and models.
*   **Keyboard Shortcut:** The application relies on a native `sendkey` module (located in the `sendkey` directory) to handle the global `Ctrl+Q` shortcut, especially on Linux where it uses `ydotool`.