# Quick Start Guide

This guide will help you get the Cheatsheet Creator up and running in minutes.

## Prerequisites

Before you begin, make sure you have:

1. **Python 3.11+** - [Download here](https://www.python.org/downloads/)
   - During installation, check "Add Python to PATH"
   - Verify: Open terminal and type `python --version`

2. **Node.js 18+** - [Download here](https://nodejs.org/)
   - Download the LTS version
   - Verify: Open terminal and type `node --version`

3. **A Code Editor** (Optional) - [VS Code](https://code.visualstudio.com/) recommended

## Installation Steps

### Windows

1. **Run the Setup Script**
   - Double-click `setup.bat`
   - Wait for all dependencies to install (this may take a few minutes)

2. **Start the Application**
   - Double-click `start-dev.bat`
   - Two windows will open (Backend and Frontend)
   - Wait for both to finish starting (you'll see "Application startup complete")

3. **Open Your Browser**
   - Navigate to `http://localhost:5173`
   - You should see the Cheatsheet Creator interface!

### Manual Installation (Windows/Mac/Linux)

1. **Install Backend Dependencies**
   ```bash
   cd backend
   pip install -r requirements.txt
   ```

2. **Install Frontend Dependencies**
   ```bash
   cd frontend
   npm install
   ```

3. **Start Backend** (Terminal 1)
   ```bash
   cd backend
   python main.py
   ```

4. **Start Frontend** (Terminal 2 - open a new terminal)
   ```bash
   cd frontend
   npm run dev
   ```

5. **Open Browser**
   - Go to `http://localhost:5173`

## First Steps

### 1. Create Your First Cheatsheet

- Click the **+** button in the sidebar
- A new cheatsheet will appear
- Click on it to select it

### 2. Add a Section

- Click the **Add Section** button
- Your section appears with a default title
- Click the edit icon to rename it

### 3. Add Blocks

- Click **Add Block** in the section
- Choose a block type (e.g., "Text")
- Click the edit icon to add content
- Click **Save** when done

### 4. Try Different Block Types

#### Text Block (📝)
```markdown
# This is a heading
**Bold text** and *italic text*
- Bullet point 1
- Bullet point 2
```

#### Code Block (💻)
```javascript
function hello() {
  console.log("Hello, World!");
}
```

#### Table Block (📊)
```markdown
| Name | Age | City |
|------|-----|------|
| John | 30  | NYC  |
| Jane | 25  | LA   |
```

#### Checklist Block (✅)
```
[ ] Task 1
[x] Task 2 (completed)
[ ] Task 3
```

#### Calculation Block (🧮)
```
10 + 20 =
50 * 2 =
100 / 4 =
```

### 5. Arrange Your Layout

- **Drag blocks**: Click and hold the grip icon (≡) in the block header
- **Resize blocks**: Drag the bottom-right corner
- **Move sections**: Use the up/down arrows in section headers

## Common Commands Explained

### Backend Commands

```bash
# Install Python dependencies
pip install -r requirements.txt

# Start the backend server
python main.py

# The backend runs on port 8000
# You can test it by opening http://localhost:8000 in your browser
```

### Frontend Commands

```bash
# Install Node dependencies (only needed once)
npm install

# Start development server (with hot reload)
npm run dev

# Build for production
npm run build

# Preview production build
npm run preview
```

### Docker Commands

```bash
# Build and start containers
docker-compose up

# Build and start in background
docker-compose up -d

# View logs
docker-compose logs

# Stop containers
docker-compose down

# Rebuild containers (after code changes)
docker-compose up --build
```

## Understanding the File Structure

```
cheatsheet/
├── backend/                 # Python FastAPI backend
│   ├── main.py             # Main application code
│   ├── requirements.txt    # Python dependencies
│   ├── data/               # Where your cheatsheets are saved (created on first run)
│   └── Dockerfile          # Docker configuration
│
├── frontend/               # React TypeScript frontend
│   ├── src/
│   │   ├── components/    # UI components (Sidebar, Editor, Section, Block)
│   │   ├── App.tsx        # Main application
│   │   ├── types.ts       # TypeScript type definitions
│   │   └── api.ts         # Backend API communication
│   ├── package.json       # Node dependencies
│   └── Dockerfile         # Docker configuration
│
├── docker-compose.yml     # Docker orchestration
├── setup.bat              # Windows setup script
├── start-dev.bat          # Windows development start script
└── README.md              # Full documentation
```

## Troubleshooting

### "Python is not recognized"
- Reinstall Python and check "Add Python to PATH"
- Or manually add Python to your system PATH

### "Node is not recognized"
- Reinstall Node.js
- Restart your terminal/computer

### "Port 8000 is already in use"
- Another application is using port 8000
- Find and stop that application, or change the port in `backend/main.py`

### "Port 5173 is already in use"
- Another Vite application might be running
- Stop it or change the port in `frontend/vite.config.ts`

### Frontend can't connect to backend
- Make sure the backend is running on port 8000
- Check `http://localhost:8000` - you should see a JSON response
- Check for firewall blocking the connection

### Changes not appearing
- Make sure you saved your changes (click the Save button)
- The app auto-saves to `backend/data/cheatsheets.json`
- Check browser console for errors (F12)

## Where is my data stored?

- **Development**: `backend/data/cheatsheets.json`
- **Docker**: In a Docker volume that persists between restarts

To backup your data, simply copy the `cheatsheets.json` file!

## Next Steps

- Read the full [README.md](README.md) for advanced features
- Experiment with different block types
- Try the drag-and-drop functionality
- Create multiple cheatsheets for different topics
- Deploy with Docker for a production setup

## Getting Help

If you encounter issues:
1. Check the [README.md](README.md) troubleshooting section
2. Look at the browser console for errors (F12 → Console tab)
3. Check the backend terminal for error messages
4. Make sure all dependencies installed correctly

## Tips for Beginners

1. **Start Simple**: Create one cheatsheet with one section and one text block
2. **Save Often**: Click save after editing blocks
3. **Experiment**: Try different block types to see what they do
4. **Use Markdown**: The text blocks support [Markdown syntax](https://www.markdownguide.org/cheat-sheet/)
5. **Backup**: Regularly copy your `cheatsheets.json` file

Enjoy creating your cheatsheets! 🎉
