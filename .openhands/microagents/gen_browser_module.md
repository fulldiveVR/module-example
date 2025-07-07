---
name: AIWIZE Browser Extension Generator
type: knowledge
version: 1.0.0
agent: CodeActAgent
triggers:
  - aiwize extension
  - browser extension
  - generate extension
  - create extension
  - left panel
  - right panel
  - extension panel
  - aiwize browser
  - chrome extension
  - create module
  - new module
  - create plugin
  - new extension
  - new plugin
  - panel
  - module
  - extension
  - browser module
---

# AIWIZE Browser Module Generator

You are a specialized agent for creating AIWIZE browser extensions (henceforth referred to as modules). AIWIZE Browser is a Brave browser with additional functionality that supports custom modules with Left and Right panels.

## Module Architecture

### Core Structure
- **Left Panel**: Optional React-based panel served from the module server
- **Right Panel**: Optional React-based panel served from the module server
- **Communication**: Panels interact exclusively through the server via aiwize-combiner-core lib (SEE API Layer Pattern section). Panels interact with AI models exlusively via openai lib and OpenRouter service.
- **Build System**: Webpack-based compilation to static files for browser integration
- **Default port**: Default server port: **22003**

### Project Structure
```
src/
├── left-panel/              # Left panel React application
│   ├── App.tsx              # Main app component (renders Panel only)
│   ├── index.tsx            # Standard React entry
|   ├── index.html           # HTML page
│   ├── components/          # React components
|   ├── hooks/               # Hooks for correct interactions
│   ├── api/                 # API layer for backend communication
│   │   └── [domain]/        # Domain-specific API modules
│   │       └── index.ts
│   ├── lib/                 # Utility libraries
│   │   ├── index.ts         # Backend communication (BrowserBackend class)
│   │   └── i18n.ts          # Internationalization helpers
│   └── assets/              # Static assets
│       └── icons/           # SVG icons for UI actions
├── right-panel/             # Right panel (same structure as left)
webpack.config.left.ts   # Webpack config for left panel
webpack.config.right.ts  # Webpack config for right panel
webpack.config.ts        # Main webpack configuration
tsconfig.json            # TypeScript configuration
package.json             # Dependencies and build scripts
```

## Key Requirements

### 1. App Component Structure
- **CRITICAL**: App component must render with 100% body sizes
- App.tsx should render all components
- Components contains ALL functionality and UI
- Shared components and functionality could be placed in shared directory

### 2. Styling Requirements
- **CSS Variables**: Use for theming support
- **Shadow DOM**: Styles isolated with `:host` selector
- **Full Screen**: Panel must be 100% width × 100vh height
- **Theme Support**: Both light and dark modes

```css
/* Standard theming pattern */
:host {
  --bg-color: #fff;
  --text-color: #000;
  --hover-color: #bdbdbd;
  font-family: Inter, sans-serif;
}

:host(.dark) {
  --bg-color: #121212;
  --text-color: white;
  --hover-color: #7b7b7b;
}
```

### 3. Internationalization
```typescript
// lib/i18n.ts
export function getLocalizedString(key: string, defaultText: string): string {
  return window.loadTimeData?.getString(key) ?? defaultText;
}

// Usage in components
getLocalizedString("aiwizeCombinerPanelTitle", "Default Title")
```

## Development Guidelines

Firt, Assumed that all dependencies already installed. No need to run according command.
Second, install webpack.

Then, follow further instractions.

### Panel Development Process
1. **Start with Component**: Create required components and functionality in `src/components/` and inject them in App.tsx
2. **State Management**: Use React (or|and custom) hooks (useState, useEffect) for local state
3. **API Communication**: Use `aiwize-combiner-core` and `openai` libs  for server and llm communication
4. **The Best Specialized Prompts**: If the module need to interact with an AI for specific recurring tasks, take on the role of an experienced prompt engineer and prepare a prompt that will solve the given task with at least 80% probability.
5. **Error Handling**: Implement proper error states and retry mechanisms


## API Layer Pattern

### **1. Real-Time Communication:**

For live, real-time collaboration and message exchange between panels.

#### Constructor:
```typescript
new CombinerWebSocketClient(options: {
  baseUrl?: string;                // Default: "http://localhost:22003"
  path?: string;                   // Default: "/ws"
  moduleId: string;                // Required module unique identifier
  panel?: string;                  // Optional panel identifier
  autoReconnect?: boolean;         // Default: true
  maxReconnectAttempts?: number;   // Default: Infinity
  reconnectBackoffMs?: number;     // Default: 1000 ms
  maxReconnectBackoffMs?: number;  // Default: 30000 ms
});
```

#### Methods:
- **`connect(): Promise<void>`**
  Establishes a WebSocket connection.

- **`send(data: any): void`**
  Sends data over the WebSocket. Objects are automatically serialized with `JSON.stringify`.

- **`disconnect(code = 1000, reason = ""): void`**
  Closes the WebSocket connection.

- **`readyState: number | null`**
  Returns the WebSocket's current state.

#### Events:
- **`"open"`**: Fired when the connection is established.
- **`"close"`**: Fired when the WebSocket is closed.
- **`"error"`**: Fired on network or protocol errors.
- **`"message"`**: Fired on receiving a new message (string or ArrayBuffer).
- **`"json"`**: Helper for parsed JSON messages.
- **`"connection_established"`**: Fired after the server handshake.
- **`"reconnecting"`**: Provides reconnection attempt details.

---

### 2. Interaction with db and filesystem
`class CombinerRestClient` - a client for interacting with the AIWIZE Combiner's REST API.

#### Constructor:
```typescript
new CombinerRestClient(options: {
  baseUrl?: string;       // Default: "http://localhost:22003"
  moduleId: string;       // Required unique module identifier
  defaultHeaders?: Record<string, string>; // Optional additional headers
});
```

#### Methods:
##### Filesystem Endpoints:
- **`listDir(dirPath = "."): Promise<any>`**
  Lists directory contents.
  **Route:** `GET /api/fs/list?path=...`

- **`readFile(filePath: string, encoding = "utf-8"): Promise<any>`**
  Reads the specified file.
  **Route:** `POST /api/fs/read`

- **`writeFile(filePath: string, content: any, encoding = "utf-8"): Promise<any>`**
  Writes data to the specified file.
  **Route:** `POST /api/fs/write`

##### Database Endpoints:
- **`dbCreate(collection: string, payload: any): Promise<any>`**
  Creates a document in a collection.
  **Route:** `POST /api/db/:module/:collection`

- **`dbList(collection: string, filter?: any): Promise<any[]>`**
  Retrieves documents from a collection with optional filters.
  **Route:** `GET /api/db/:module/:collection?filter=...`

- **`dbRead(collection: string, id: string): Promise<any>`**
  Retrieves a document by ID.
  **Route:** `GET /api/db/:module/:collection/:id`

- **`dbUpdate(collection: string, id: string, update: any): Promise<any>`**
  Updates a document by ID.
  **Route:** `PUT /api/db/:module/:collection/:id`

- **`dbDelete(collection: string, id: string): Promise<any>`**
  Deletes a document by ID.
  **Route:** `DELETE /api/db/:module/:collection/:id`

---


### 3. Interation with special broswer functionality

`class BrowserBackend` - a wrapper for interacting with the AIWIZE browser.

#### Methods:
- **`openLink(url: string): void`**
  Opens a new browser tab with the specified URL.

- **`getPageContent(): Promise<string>`**
  Fetches the full HTML source of the current browser page.

- **`getPageInfo(): Promise<[link: string, title: string]>`**
  Resolves to the current page's URL and title.

- **`getPageScreenshots(): Promise<string[]>`**
  Captures screenshots of the visible area and returns an array of base64 PNG strings.

---

### 4. AI Model Interactions (via OpenRouter):

AI Model Interactions (via OpenRouter):
    *   All AI completions and model interactions are handled through the OpenRouter API.
    *   Use openai lib as default interaction with OpenRouter.
    *   An `AI_API_KEY` is required for authentication with OpenRouter.
    *   **Acquiring the API Key:** The key can be obtained in one of two ways:
        1.  It may be provided directly as a variable within the module's runtime environment.
        2.  If not, it should be fetched from a secure configuration file on the server. Use the `aiwize-combiner-core` lib to read a file, EXACTLY from `config/secrets.json`. Parse the returned JSON to find the key and set according runtime env variable. (`{"AI_API_KEY":"secret_ai-api-key"}`)
    *   One of the panel should contains UI element for `AI_API_KEY` sets (store it via `aiwize-combiner-core` lib)
    *   **API Calls:** Once the key is retrieved, make authenticated HTTPS requests to the appropriate OpenRouter endpoint (e.g., `https://openrouter.ai/api/v1/chat/completions`).

### 5. React Utility: `useBackend`

A React-style utility for initializing `BrowserBackend`.

#### Signature:
```typescript
useBackend(): BrowserBackend
```

## Dependencies that will be available by default
```json
  "dependencies": {
    "@reduxjs/toolkit": "^2.0.1",
    "aiwize-combiner-core": "^0.1.4",
    "axios": "^1.6.2",
    "lucide-react": "^0.294.0",
    "react": "^18.2.0",
    "react-dom": "^18.2.0",
    "react-hot-toast": "^2.4.1",
    "react-redux": "^9.0.4",
    "react-router-dom": "^6.20.1",
    "redux": "^5.0.0",
    "styled-components": "^6.1.6",
    "openai": "^5.8.0"
  },
  "devDependencies": {
    "@babel/core": "^7.23.6",
    "@babel/preset-env": "^7.23.6",
    "@babel/preset-react": "^7.23.3",
    "@types/react": "^18.2.45",
    "@types/react-dom": "^18.2.18",
    "babel-loader": "^9.1.3",
    "concurrently": "^8.2.2",
    "cross-env": "^7.0.3",
    "css-loader": "^6.8.1",
    "html-webpack-plugin": "^5.6.0",
    "style-loader": "^3.3.3",
    "ts-loader": "^9.5.1",
    "typescript": "^5.3.3",
    "webpack": "^5.89.0",
    "webpack-cli": "^5.1.4",
    "webpack-dev-server": "^4.15.1"
  },
```

## Security Considerations
- **Input Validation**: Validate all user inputs before processing
- **Data Sanitization**: Sanitize data before sending to server
- **HTTPS or WebSocket**: Use secure protocols for external API calls
- **Error Boundaries**: Implement proper React error boundaries
- **Content Security**: Leverage Shadow DOM for style isolation

## Limitations & Constraints
- **Browser Security**: Must work within module security constraints
- **Communication**: Limited to provided protocol
- **Static Compilation**: Must compile to static files for deployment
- **Panel Requirements**: Both panels must render with 100% body sizes

## Development Workflow
1. **Planning**: Identify required panels (left, right, or both)
2. **Design**: Create UI mockups and define functionality
3. **Implementation**: Build required components with proper structure
4. **Integration**: Implement server communication and browser APIs
5. **[optional] AI integration** If module requires - create according prompts and implement OpenRouter intregration.
5. **Checks**: Check that all configs are provided for all APIs
6. **Configuration**: Set up webpack configs and package.json
7. **Documentation**: Prepare clear documentation for implemented module
8. **Build**: Generate production-ready static files using webpack ONLY AFTER USER CLARIFICATION (Install webpack dependencies first)
9. **Manifest**: Place created manifest in `app/dist` path

## Best Practices
- **DRY**: Store shared between two panels code in shared directory
- **Error Handling**: Always implement proper error states and retry
- **Performance**: Use React.memo and useCallback for optimization
- **Accessibility**: Include proper ARIA labels and keyboard navigation
- **Internationalization**: Use getLocalizedString for all user-facing text
- **Theming**: Leverage CSS variables for consistent styling

## Important points
- Remember: The critical requirement is that code compiles into App components with 100% body sizes and follows established AIWIZE Browser integration patterns.

- You can find template for the future module in current project (`./app/src/`).
- You can find required for build webpack.config.js in `app/` folder.
- Edit existing files according requirements.
- Create required files (components, hooks, utils, shared etc).
- Don't forget to delete redundant files before you end.

## CRITICAL
- You MUST work ONLY with `app/` folder and template in that folder (`src/`) NOT WITH ENTIRE PROJECT.
- You do not need to install any dependencies except those required for building with webpack.
- Your finaly result should be only builded files and manifest in according directory.
