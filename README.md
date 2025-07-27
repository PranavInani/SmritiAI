# SmritiAI 🧠
[🦊Get on Firefox store](https://addons.mozilla.org/en-US/firefox/addon/smritiai/)

**Search Your Browser History with AI**

SmritiAI is a Firefox browser extension that uses AI-powered semantic search to help you find web pages from your browsing history. Instead of remembering exact keywords, you can search using natural language descriptions and find relevant pages based on their content.

## ✨ Features

- **🔍 AI-Powered Semantic Search**: Search your browsing history using natural language queries
- **📄 Content Analysis**: Automatically extracts and analyzes webpage content using Mozilla's Readability
- **⚡ Fast Vector Search**: Uses HNSW (Hierarchical Navigable Small World) algorithm for efficient similarity search
- **🎨 Modern UI**: Clean, responsive sidebar interface with dark/light theme support
- **📊 Index Management**: Tools to rebuild, export, and manage your search index
- **📈 Browser History Processing**: Process your existing browser history to make it searchable with AI
- **⚙️ Customizable Settings**: Adjust search parameters and indexing behavior
- **🔒 Privacy-First**: All processing happens locally in your browser

## 🏗️ Architecture

### Core Components

1. **Background Script** (`background.js`)
   - Manages AI model loading and embedding generation
   - Handles message passing between components
   - Processes webpage content and generates embeddings
   - Manages search index operations

2. **Content Script** (`content.js`)
   - Extracts readable content from web pages using Mozilla Readability
   - Sends processed content to background script for indexing

3. **Database Layer** (`db.js`)
   - Uses Dexie (IndexedDB wrapper) for local data storage
   - Stores page metadata and embeddings

4. **Search Engine** (`search.js`)
   - Implements HNSW vector search algorithm
   - Provides semantic similarity search capabilities
   - Handles index management and rebuilding

5. **User Interface** (`sidebar.html`, `sidebar.js`, `sidebar.css`)
   - Chat-like interface for search queries
   - Settings management
   - Dark/light theme support
   - Command system with slash commands

### Technology Stack

- **AI/ML**: @xenova/transformers (Transformer.js) with all-MiniLM-L6-v2 model
- **Vector Search**: hnswlib-wasm for efficient similarity search
- **Database**: Dexie (IndexedDB) for local storage
- **Content Extraction**: @mozilla/readability
- **Build Tool**: Vite with web extension plugin
- **UI**: Vanilla JavaScript with modern CSS

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
│   ├── background.js      # Background script with AI processing
│   ├── content.js         # Content extraction script
│   ├── db.js             # Database layer with Dexie
│   ├── search.js         # HNSW search implementation
│   ├── sidebar.html      # Main UI HTML
│   ├── sidebar.js        # UI logic and interactions
│   └── sidebar.css       # Styling and themes
├── public/
│   └── icon/            # Extension icons
├── manifest.json        # Extension manifest
├── package.json        # Dependencies and scripts
└── vite.config.ts      # Build configuration
```

## 🛠️ Development

### Building

- **Development build**: `npm run dev`
- **Production build**: `npm run build`
- **Package for store**: `npm run package` - Creates a zip file ready for Firefox Add-ons store upload

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
