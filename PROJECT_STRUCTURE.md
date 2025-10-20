# Project Structure

```
cheatsheet-creator/
│
├── 📁 backend/                          # Backend API (Python FastAPI)
│   ├── main.py                          # Main FastAPI application
│   ├── requirements.txt                 # Python dependencies
│   ├── Dockerfile                       # Docker container config
│   └── 📁 data/                         # Data storage (created at runtime)
│       └── cheatsheets.json             # All cheatsheets saved here
│
├── 📁 frontend/                         # Frontend UI (React TypeScript)
│   ├── 📁 src/
│   │   ├── 📁 components/               # React components
│   │   │   ├── Sidebar.tsx              # Cheatsheet list sidebar
│   │   │   ├── Editor.tsx               # Main editor view
│   │   │   ├── Section.tsx              # Section with grid layout
│   │   │   └── Block.tsx                # Individual block types
│   │   │
│   │   ├── App.tsx                      # Main app component
│   │   ├── main.tsx                     # Entry point
│   │   ├── types.ts                     # TypeScript interfaces
│   │   ├── api.ts                       # Backend API client
│   │   └── index.css                    # Global styles + Tailwind
│   │
│   ├── index.html                       # HTML template
│   ├── package.json                     # Node dependencies
│   ├── vite.config.ts                   # Vite build config
│   ├── tsconfig.json                    # TypeScript config
│   ├── tailwind.config.js               # Tailwind CSS config
│   ├── postcss.config.js                # PostCSS config
│   ├── nginx.conf                       # Nginx config for Docker
│   └── Dockerfile                       # Docker container config
│
├── 📁 venv/                             # Python virtual environment (gitignored)
├── 📁 node_modules/                     # Node dependencies (gitignored)
│
├── docker-compose.yml                   # Docker orchestration
├── .gitignore                           # Git ignore rules
│
├── 📄 README.md                         # Full documentation
├── 📄 QUICK_START.md                    # Beginner's guide
├── 📄 PROJECT_STRUCTURE.md              # This file
│
├── 🚀 setup.bat                         # Windows setup script
└── 🚀 start-dev.bat                     # Windows dev start script
```

## Component Hierarchy

```
App
├── Sidebar
│   └── CheatsheetItem (multiple)
│
└── Editor
    └── Section (multiple)
        └── GridLayout
            └── Block (multiple)
                ├── TextBlock
                ├── CodeBlock
                ├── TableBlock
                ├── ListBlock
                ├── CheckboxBlock
                └── CalculationBlock
```

## Data Flow

```
User Interface (React)
        ↓
    API Client (axios)
        ↓
    FastAPI Backend
        ↓
    JSON File Storage
```

## API Endpoints

```
Backend Server (http://localhost:8000)
│
├── GET  /                          # API info
├── GET  /api/cheatsheets          # Get all cheatsheets
├── GET  /api/cheatsheets/{id}     # Get specific cheatsheet
├── POST /api/cheatsheets          # Create new cheatsheet
├── PUT  /api/cheatsheets/{id}     # Update cheatsheet
└── DELETE /api/cheatsheets/{id}   # Delete cheatsheet
```

## Port Usage

- **Frontend (Development)**: http://localhost:5173
- **Backend (Development)**: http://localhost:8000
- **Frontend (Docker)**: http://localhost:80
- **Backend (Docker)**: http://localhost:8000

## Key Technologies

### Backend
- **FastAPI**: Modern Python web framework
- **Pydantic**: Data validation
- **Uvicorn**: ASGI server

### Frontend
- **React 18**: UI library
- **TypeScript**: Type-safe JavaScript
- **Vite**: Fast build tool
- **TailwindCSS**: Utility CSS framework
- **react-grid-layout**: Drag & drop grid
- **react-markdown**: Markdown rendering
- **react-syntax-highlighter**: Code highlighting
- **axios**: HTTP client
- **lucide-react**: Icon library

### DevOps
- **Docker**: Containerization
- **Nginx**: Web server (production)

## File Explanations

### Configuration Files

- **package.json**: Defines Node.js dependencies and scripts
- **requirements.txt**: Defines Python dependencies
- **tsconfig.json**: TypeScript compiler options
- **vite.config.ts**: Vite bundler configuration
- **tailwind.config.js**: Tailwind CSS customization
- **docker-compose.yml**: Multi-container Docker configuration

### Application Files

- **main.py**: FastAPI routes and data storage logic
- **App.tsx**: Main React component, state management
- **types.ts**: TypeScript interfaces for type safety
- **api.ts**: API client for backend communication
- **Sidebar.tsx**: Cheatsheet list and navigation
- **Editor.tsx**: Main editor with sections
- **Section.tsx**: Section with grid layout for blocks
- **Block.tsx**: Individual block component with different types

## Development Workflow

1. **Install Dependencies**
   - Backend: `pip install -r requirements.txt`
   - Frontend: `npm install`

2. **Start Development Servers**
   - Backend: `python main.py` (port 8000)
   - Frontend: `npm run dev` (port 5173)

3. **Make Changes**
   - Both servers support hot reload
   - Changes appear immediately

4. **Build for Production**
   - Frontend: `npm run build`
   - Creates optimized bundle in `dist/`

5. **Deploy with Docker**
   - `docker-compose up --build`
   - Access at http://localhost

## Adding New Features

### Add a New Block Type

1. Update `BlockType` in `frontend/src/types.ts`
2. Add rendering in `frontend/src/components/Block.tsx`
3. Add to block menu in `frontend/src/components/Section.tsx`

### Add a New API Endpoint

1. Add route in `backend/main.py`
2. Add function in `frontend/src/api.ts`
3. Use in React components

### Modify Styling

1. Use Tailwind classes in components
2. Or add custom CSS in `frontend/src/index.css`
3. Modify theme in `frontend/tailwind.config.js`
