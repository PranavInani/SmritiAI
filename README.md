# SmritiAI 🧠
[🦊Get on Firefox store](https://addons.mozilla.org/en-US/firefox/addon/smritiai/)

**Search Your Browser History with AI**

SmritiAI is a Firefox browser extension that uses AI-powered semantic search to help you find web pages from your browsing history. Instead of remembering exact keywords, you can search using natural language descriptions and find relevant pages based on their content.

## ✨ Features

- **🔍 AI-Powered Semantic Search**: Search your browsing history using natural language queries
- **🌐 Domain Filtering**: Filter search results by specific domains or exclude unwanted sites
- **📄 Content Analysis**: Automatically extracts and analyzes webpage content using Mozilla's Readability
- **⚡ Fast Vector Search**: Uses HNSW (Hierarchical Navigable Small World) algorithm for efficient similarity search
- **🎨 Modern UI**: Clean, responsive sidebar interface with dark/light theme support
- **📊 Index Management**: Tools to rebuild, export, and manage your search index
- **📈 Browser History Processing**: Process your existing browser history to make it searchable with AI
- **⚙️ Customizable Settings**: Adjust search parameters and indexing behavior
- **🔒 Privacy-First**: All processing happens locally in your browser

## 🏗️ Architecture

### Core Components

1. **Background Script** (`src/background/`)
   - **background.js**: Main entry point and AI pipeline management
   - **handlers/**: Specialized message handlers for different operations
     - `message-router.js`: Routes messages to appropriate handlers
     - `search-handler.js`: Processes search queries and returns results
     - `page-processor.js`: Handles new page indexing and content processing
     - `history-processor.js`: Batch processes browser history
     - `data-handler.js`: Manages data export/import operations
     - `settings-handler.js`: Handles settings updates and retrieval
   - **services/**: Core business logic services
     - `embedding-service.js`: AI model management and embedding generation
      - **utils/**: Shared utility functions
     - `message-helpers.js`: Async message handling wrappers
     - `domain-filter.js`: Domain filtering logic and utilities

2. **User Interface** (`src/sidebar/`)
   - **sidebar.js**: Main UI entry point and initialization
   - **components/**: Modular UI components
     - `chat-interface.js`: Search interface and message display
     - `command-system.js`: Slash command processing
     - `domain-filter.js`: Domain filtering UI and functionality
     - `settings-modal.js`: Settings configuration UI
     - `confirmation-modal.js`: Action confirmation dialogs
     - `header-dropdown.js`: Main navigation dropdown
     - `theme-manager.js`: Dark/light theme management
   - **handlers/**: UI-specific handlers
     - `first-time-handler.js`: Welcome experience for new users
     - `stats-handler.js`: Index statistics display
     - `data-handler.js`: Data export/import UI logic
   - **services/**: UI services
     - `message-service.js`: Communication with background script
   - **utils/**: UI utility functions for DOM and storage operations

3. **Content Script** (`src/content.js`)
   - Extracts readable content from web pages using Mozilla Readability
   - Sends processed content to background script for indexing

4. **Database Layer** (`src/db.js`)
   - Uses Dexie (IndexedDB wrapper) for local data storage
   - Stores page metadata and embeddings
   - Handles unique URL constraints and updates

5. **Search Engine** (`src/search.js`)
   - Implements HNSW vector search algorithm
   - Provides semantic similarity search capabilities
   - Handles index management and rebuilding

### Technology Stack

- **AI/ML**: @xenova/transformers (Transformer.js) with all-MiniLM-L6-v2 model
- **Vector Search**: hnswlib-wasm for efficient similarity search
- **Database**: Dexie (IndexedDB) for local storage
- **Content Extraction**: @mozilla/readability
- **Build Tool**: Vite with web extension plugin
- **UI**: Vanilla JavaScript with modern CSS
- **Architecture**: Modular ES6 modules with clear separation of concerns

### Modular Architecture Benefits

- **Maintainability**: Each module has a single responsibility and clear interface
- **Testability**: Components can be tested in isolation
- **Scalability**: Easy to add new features without touching existing code
- **Code Organization**: Related functionality grouped together
- **Performance**: Only load required modules when needed

## 🚀 Installation

### Prerequisites

- Node.js (v16 or higher)
- npm or yarn
- Firefox browser

### Development Setup

1. **Clone the repository**
   ```bash
   git clone https://github.com/PranavInani/SmritiAI.git
   cd SmritiAI
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Build the extension**
   ```bash
   npm run build
   ```

4. **Load in Firefox**
   - Open Firefox
   - Go to `about:debugging`
   - Click "This Firefox"
   - Click "Load Temporary Add-on"
   - Select the `manifest.json` file from the `dist` folder

### Development Mode

For development with hot reload:
```bash
npm run dev
```

## 📖 Usage

### Basic Search

1. Click the SmritiAI icon in your browser toolbar or use `Ctrl+E`
2. Type your search query in natural language
3. View results with clickable links to your previously visited pages

### First-Time Setup

When you first install SmritiAI, you'll see a welcome message offering to process your existing browser history. This will:

- Generate AI embeddings for your past browsing history
- Make your entire browsing history searchable with semantic search
- Allow you to choose how far back to process (last week, month, year, etc.)

You can skip this step and process your history later from the settings.

### Slash Commands

- `/clear` - Clear chat history
- `/stats` - Show index statistics
- `/settings` - Open settings panel
- `/domain` - Show current domain filter status
- `/domain:example.com` - Filter results to specific domain
- `/domain:clear` - Clear domain filters

### Domain Filtering

SmritiAI supports powerful domain filtering to help you focus on specific websites or exclude unwanted results:

#### **Filter Syntax**
- **Include domains**: `github.com,stackoverflow.com`
- **Exclude domains**: `-ads.com,-tracker.com`
- **Mixed filtering**: `github.com,wikipedia.org,-ads.com,-spam.com`

#### **Usage Methods**

**1. UI Method:**
1. Click the "🌐 Domain Filter" button in the sidebar
2. Enter your filter criteria in the input field
3. Click "Apply" to activate the filter

**2. Slash Commands:**
```
/domain:github.com                    # Include only GitHub
/domain:github.com,stackoverflow.com  # Include GitHub and StackOverflow
/domain:-ads.com,-tracker.com         # Exclude ads and trackers
/domain:github.com,-ads.com           # Include GitHub, exclude ads
/domain:clear                         # Clear all filters
```

#### **Examples**

- **Research without distractions**: `/domain:-ads.com,-marketing.com,-spam.com`
- **Academic sources only**: `/domain:wikipedia.org,arxiv.org,scholar.google.com`
- **Development resources**: `/domain:github.com,stackoverflow.com,developer.mozilla.org`

#### **Features**
- **Auto-complete**: Suggests domains from your browsing history
- **Visual feedback**: Button highlights when filters are active
- **Smart search**: Automatically searches 3x more results when filtering to ensure relevant matches
- **Session-based**: Filters persist during your session but reset on reload

### Settings

Access settings through the dropdown menu or `/settings` command:

- **Search Results**: Configure number of results returned
- **HNSW Parameters**: Adjust search quality and performance
- **Index Management**: Rebuild search index
- **Browser History Processing**: Process existing browser history to make it searchable
- **Data Export/Import**: Backup and restore your data

## 🔧 Configuration

### HNSW Parameters

- **ef** (200): Search quality parameter (higher = better accuracy, slower search)
- **M** (16): Number of connections (higher = better accuracy, more memory)
- **maxElements** (10000): Maximum pages that can be indexed

### Search Settings

- **searchResultCount** (5): Number of search results to return
- **autoIndex** (true): Automatically index new pages

## 📁 Project Structure

```
SmritiAI/
├── src/
│   ├── background/              # Background script modules
│   │   ├── background.js        # Main entry point and AI pipeline
│   │   ├── handlers/            # Message handlers
│   │   │   ├── message-router.js
│   │   │   ├── search-handler.js
│   │   │   ├── page-processor.js
│   │   │   ├── history-processor.js
│   │   │   ├── data-handler.js
│   │   │   └── settings-handler.js
│   │   ├── services/            # Core services
│   │   │   └── embedding-service.js
│   │   └── utils/               # Utility functions
│   │       └── message-helpers.js
│   ├── sidebar/                 # UI modules
│   │   ├── sidebar.js           # Main UI entry point
│   │   ├── components/          # UI components
│   │   │   ├── chat-interface.js
│   │   │   ├── command-system.js
│   │   │   ├── settings-modal.js
│   │   │   ├── confirmation-modal.js
│   │   │   ├── header-dropdown.js
│   │   │   └── theme-manager.js
│   │   ├── handlers/            # UI handlers
│   │   │   ├── first-time-handler.js
│   │   │   ├── stats-handler.js
│   │   │   └── data-handler.js
│   │   ├── services/            # UI services
│   │   │   └── message-service.js
│   │   └── utils/               # UI utilities
│   │       ├── dom-helpers.js
│   │       └── storage-helpers.js
│   ├── content.js               # Content extraction script
│   ├── db.js                    # Database layer with Dexie
│   ├── search.js                # HNSW search implementation
│   ├── sidebar.html             # Main UI HTML
│   └── sidebar.css              # Styling and themes
├── public/
│   └── icon/                    # Extension icons
├── manifest.json                # Extension manifest
├── package.json                 # Dependencies and scripts
└── vite.config.ts               # Build configuration
```

## 🛠️ Development

### Building

- **Development build**: `npm run dev`
- **Production build**: `npm run build`
- **Package for store**: `npm run package` - Creates a zip file ready for Firefox Add-ons store upload

### Code Organization

The codebase follows a modular architecture with clear separation of concerns:

- **Background modules**: Handle AI processing, message routing, and data management
- **Sidebar modules**: Manage UI components, user interactions, and state
- **Shared modules**: Provide common functionality for database and search operations
- **ES6 modules**: All code uses modern JavaScript import/export syntax
- **Single responsibility**: Each module has one clear purpose and well-defined interface

### Development Guidelines

- Keep modules focused and small (< 100 lines when possible)
- Use clear naming conventions for files and functions
- Document public interfaces and complex logic
- Test modules independently before integration
- Follow the established patterns for message passing and error handling

### Key Dependencies

- **@xenova/transformers**: Transformer.js for AI embeddings
- **hnswlib-wasm**: WebAssembly HNSW implementation
- **dexie**: IndexedDB wrapper for data storage
- **@mozilla/readability**: Content extraction
- **vite-plugin-web-extension**: Build tool for extensions

## 🔒 Privacy & Security

- All data processing happens locally in your browser
- No data is sent to external servers
- Embeddings and search index are stored locally
- Browser history access is limited to extension functionality

## 🐛 Known Issues

- Large pages may take longer to process
- Initial model loading requires internet connection
- Maximum index size is limited by browser storage

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## 📝 License

This project is licensed under the MIT License.

## 🙏 Acknowledgments

- Mozilla Readability for content extraction
- Xenova for Transformer.js
- HNSW algorithm implementation
- Vite ecosystem for build tools

---

**Note**: This extension requires Firefox and uses Manifest V2. Future versions may include Chrome support with Manifest V3.
