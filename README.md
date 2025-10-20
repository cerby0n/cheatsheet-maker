# Cheatsheet Creator

A modern, full-stack web application for creating, managing, and organizing cheatsheets with a beautiful, customizable interface.

## Features

### Core Functionality
- 📝 **Create & Manage Cheatsheets** - Organize your knowledge in structured sections and blocks
- 🎨 **Rich Text & Code Support** - Description/Code view with syntax highlighting
- 🔍 **Smart Search** - Full-text search across all cheatsheets
- 📤 **Import/Export** - JSON and Markdown format support
- 💾 **Auto-save** - Changes are automatically persisted
- 🎯 **Drag & Drop** - Rearrange sections and blocks with ease

### Productivity
- ⌨️ **Keyboard Shortcuts** - Fully customizable shortcuts
  - `Alt + N` - Create new cheatsheet
  - `Ctrl + B` - Add new section
  - `Ctrl + S` - Save block (when editing)
  - `Ctrl + K` - Search
  - `Ctrl + /` - Show keyboard shortcuts help
  - `Escape` - Close modals
- 🎛️ **Edit/Reader Modes** - Toggle between editing and viewing
- 🚀 **Elegant Navigation** - Dropdown cheatsheet selector in header (no sidebar clutter)

## Quick Start (Docker Only)

### Prerequisites
- [Docker](https://www.docker.com/get-started)
- [Docker Compose](https://docs.docker.com/compose/install/)

### Installation & Running

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd cheatsheet
   ```

2. **Start the application**
   ```bash
   docker-compose up -d
   ```

   This will:
   - Build the backend (FastAPI) and frontend (React) containers
   - Start both services
   - Create the data directory for persistence

3. **Access the application**
   - **Frontend**: http://localhost
   - **Backend API**: http://localhost:8000
   - **API Documentation**: http://localhost:8000/docs

### Managing the Application

**Stop the application:**
```bash
docker-compose down
```

**View logs:**
```bash
# All services
docker-compose logs -f

# Specific service
docker-compose logs -f frontend
docker-compose logs -f backend
```

**Rebuild after code changes:**
```bash
docker-compose up -d --build
```

**Restart services:**
```bash
docker-compose restart
```

## Project Structure

```
cheatsheet/
├── backend/                 # FastAPI backend
│   ├── main.py             # API endpoints & application logic
│   ├── Dockerfile          # Backend container definition
│   └── requirements.txt    # Python dependencies
├── frontend/               # React + TypeScript frontend
│   ├── src/
│   │   ├── components/     # React components
│   │   │   ├── CheatsheetSelector.tsx  # Dropdown navigation
│   │   │   ├── Editor.tsx              # Main editor view
│   │   │   ├── Section.tsx             # Section component
│   │   │   ├── Block.tsx               # Block component
│   │   │   ├── SettingsModal.tsx       # Settings UI
│   │   │   └── ...
│   │   ├── contexts/       # React contexts
│   │   │   └── SettingsContext.tsx     # Settings state
│   │   ├── types.ts        # TypeScript type definitions
│   │   ├── api.ts          # Backend API client
│   │   ├── App.tsx         # Main application component
│   │   └── main.tsx        # Application entry point
│   ├── Dockerfile          # Frontend container definition
│   ├── package.json        # Node.js dependencies
│   ├── tailwind.config.js  # Tailwind CSS configuration
│   └── vite.config.ts      # Vite build configuration
├── data/                   # Persistent data (auto-created by Docker)
│   ├── cheatsheets.json   # Main data file
│   └── index.json         # Search index
├── docker-compose.yml      # Multi-container orchestration
├── .gitignore             # Git ignore rules
└── README.md              # This file
```

## Tech Stack

### Frontend
- **React 18** - UI framework
- **TypeScript** - Type-safe JavaScript
- **Vite** - Lightning-fast build tool
- **Tailwind CSS** - Utility-first CSS framework
- **React Grid Layout** - Drag & drop grid system
- **React Syntax Highlighter** - Code syntax highlighting
- **React Markdown** - Markdown rendering
- **Lucide React** - Beautiful icon library

### Backend
- **FastAPI** - Modern, high-performance Python web framework
- **Uvicorn** - Lightning-fast ASGI server
- **Pydantic** - Data validation using Python type hints
- **Python 3.11** - Python runtime

### Infrastructure
- **Docker** - Containerization platform
- **Docker Compose** - Multi-container orchestration
- **Nginx** - High-performance web server for frontend

## Usage Guide

### Navigation
- Use the **dropdown selector** in the header to switch between cheatsheets
- Click **+ Create New Cheatsheet** in the dropdown
- Hover over cheatsheets in dropdown to see **Edit** and **Delete** buttons

### Creating Content
1. **Add Section**: Click the blue `+` button or press `Ctrl + B`
2. **Add Block**: Click `Add Block` button in any section
3. **Edit Block**: Click the edit icon, make changes, and save
4. **Switch Modes**: Toggle between Edit and Reader mode using the button in header

### Customization
1. **Settings**: Click the gear icon in the header
2. **Themes**: Choose dark/light mode and customize colors
3. **Fonts**: Adjust font sizes for different text types
4. **Shortcuts**: Customize all keyboard shortcuts
5. **Custom CSS**: Write custom styles or load the Nord theme template

### Import/Export
- **Import**: Click upload icon → Choose JSON or Markdown files
- **Export**: Click download icon → Export current sheet or all sheets
- **Bulk Import**: Import multiple JSON files at once

### Search
- Press `Ctrl + K` or click search icon
- Search across all cheatsheets
- Click results to jump to content

## Data Persistence

All data is stored in the `data/` directory, which is mounted as a Docker volume:
- `data/cheatsheets.json` - All cheatsheet content
- `data/index.json` - Search index

**Backup your data:**
```bash
# Copy data directory
cp -r data/ backup-$(date +%Y%m%d)/

# Or just copy the JSON file
cp data/cheatsheets.json backup-cheatsheets-$(date +%Y%m%d).json
```

## Keyboard Shortcuts

All shortcuts are customizable in Settings → Shortcuts:

| Shortcut | Action |
|----------|--------|
| `Alt + N` | Create new cheatsheet |
| `Ctrl + B` | Add new section |
| `Ctrl + S` | Save block (when editing) |
| `Ctrl + K` | Open search |
| `Ctrl + /` | Show keyboard shortcuts |
| `Escape` | Close modal/dialog |

## Troubleshooting

### Containers won't start
```bash
# Check Docker is running
docker ps

# View logs
docker-compose logs

# Rebuild containers
docker-compose down
docker-compose up -d --build
```

### Port conflicts
If ports 80 or 8000 are in use, edit `docker-compose.yml`:
```yaml
ports:
  - "8080:80"    # Frontend (change 8080 to your preferred port)
  - "8001:8000"  # Backend (change 8001 to your preferred port)
```

### Data not persisting
Ensure the data directory has correct permissions:
```bash
chmod -R 755 data/
```

### Frontend can't connect to backend
Check that both containers are running:
```bash
docker-compose ps
```

## Contributing

Contributions are welcome! Please:
1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Submit a pull request

## License

MIT License - Feel free to use and modify as needed.

## Support

For issues and questions, please open an issue on GitHub.

---

**Enjoy creating beautiful cheatsheets! 🚀**
