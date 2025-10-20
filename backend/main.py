"""
Cheatsheet Creator - FastAPI Backend
This is the main entry point for the backend API
"""
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import List, Optional, Literal
from datetime import datetime
import json
import os
from pathlib import Path

app = FastAPI(title="Cheatsheet Creator API")

# CORS middleware to allow frontend to communicate with backend
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:5173",  # Vite dev server
        "http://localhost:3000",  # Alternative dev port
        "http://localhost",       # Docker/Nginx
        "http://localhost:80",    # Docker/Nginx with port
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Data directory path - each cheatsheet gets its own JSON file
DATA_DIR = Path("data/cheatsheets")
DATA_DIR.mkdir(parents=True, exist_ok=True)

# Index file to track all cheatsheets
INDEX_FILE = Path("data/index.json")
INDEX_FILE.parent.mkdir(exist_ok=True)

# ============== Data Models ==============

class ReferenceCardRow(BaseModel):
    """Represents a row in a reference card"""
    description: str
    code: str

class Block(BaseModel):
    """Represents a content block within a section"""
    id: str
    type: Literal["text", "code", "table", "calculation", "list", "checkbox", "reference"]
    title: Optional[str] = None
    content: str
    # Layout properties for grid system
    x: int  # Column position
    y: int  # Row position
    w: int  # Width in grid units
    h: int  # Height in grid units
    language: Optional[str] = None  # For code blocks
    referenceData: Optional[List[ReferenceCardRow]] = None  # For reference card blocks

class Section(BaseModel):
    """Represents a section containing multiple blocks"""
    id: str
    title: str
    titleColor: Optional[str] = None  # Hex color for title
    titleSize: Optional[Literal["sm", "md", "lg", "xl"]] = None  # Title size
    blocks: List[Block] = []

class Cheatsheet(BaseModel):
    """Represents a complete cheatsheet"""
    id: str
    name: str
    sections: List[Section] = []
    created: str
    updated: str

class CheatsheetCreate(BaseModel):
    """Model for creating a new cheatsheet"""
    name: str

class CheatsheetUpdate(BaseModel):
    """Model for updating a cheatsheet"""
    name: Optional[str] = None
    sections: Optional[List[Section]] = None

# ============== Data Storage Functions ==============

def get_cheatsheet_path(cheatsheet_id: str) -> Path:
    """Get the file path for a specific cheatsheet"""
    return DATA_DIR / f"{cheatsheet_id}.json"

def load_index() -> dict:
    """Load the index of all cheatsheets"""
    if not INDEX_FILE.exists():
        return {}
    with open(INDEX_FILE, "r", encoding="utf-8") as f:
        return json.load(f)

def save_index(index: dict):
    """Save the index of all cheatsheets"""
    with open(INDEX_FILE, "w", encoding="utf-8") as f:
        json.dump(index, f, indent=2, ensure_ascii=False)

def load_cheatsheet(cheatsheet_id: str) -> Optional[Cheatsheet]:
    """Load a single cheatsheet from its file"""
    filepath = get_cheatsheet_path(cheatsheet_id)
    if not filepath.exists():
        return None
    with open(filepath, "r", encoding="utf-8") as f:
        data = json.load(f)
        return Cheatsheet(**data)

def save_cheatsheet(cheatsheet: Cheatsheet):
    """Save a single cheatsheet to its file"""
    filepath = get_cheatsheet_path(cheatsheet.id)
    with open(filepath, "w", encoding="utf-8") as f:
        json.dump(cheatsheet.model_dump(), f, indent=2, ensure_ascii=False)

    # Update index
    index = load_index()
    index[cheatsheet.id] = {
        "id": cheatsheet.id,
        "name": cheatsheet.name,
        "created": cheatsheet.created,
        "updated": cheatsheet.updated
    }
    save_index(index)

def delete_cheatsheet_file(cheatsheet_id: str):
    """Delete a cheatsheet file and remove from index"""
    filepath = get_cheatsheet_path(cheatsheet_id)
    if filepath.exists():
        filepath.unlink()

    # Update index
    index = load_index()
    if cheatsheet_id in index:
        del index[cheatsheet_id]
        save_index(index)

def load_all_cheatsheets() -> List[Cheatsheet]:
    """Load all cheatsheets"""
    index = load_index()
    cheatsheets = []
    for cheatsheet_id in index.keys():
        cs = load_cheatsheet(cheatsheet_id)
        if cs:
            cheatsheets.append(cs)
    return cheatsheets

def parse_markdown_to_cheatsheet(markdown_content: str, name: str) -> Cheatsheet:
    """Parse markdown content and convert to cheatsheet structure"""
    import re

    cheatsheet_id = f"cs_{int(datetime.now().timestamp() * 1000)}"
    sections = []
    current_section = None
    current_block = None
    block_counter = 0

    lines = markdown_content.split('\n')
    i = 0

    while i < len(lines):
        line = lines[i]

        # H2 headers become sections
        if line.startswith('## '):
            if current_section and current_block:
                current_section.blocks.append(current_block)
                current_block = None

            if current_section:
                sections.append(current_section)

            section_id = f"sec_{int(datetime.now().timestamp() * 1000)}_{len(sections)}"
            current_section = Section(
                id=section_id,
                title=line[3:].strip(),
                blocks=[]
            )

        # H3 headers become block titles
        elif line.startswith('### '):
            if current_block and current_section:
                current_section.blocks.append(current_block)

            block_title = line[4:].strip()
            block_counter += 1
            current_block = {
                "id": f"block_{cheatsheet_id}_{block_counter}",
                "title": block_title,
                "content": "",
                "type": "text",
                "x": 0,
                "y": block_counter - 1,
                "w": 6,
                "h": 2
            }

        # Code blocks
        elif line.startswith('```'):
            if current_block and current_section:
                current_section.blocks.append(current_block)

            lang_match = re.match(r'```(\w+)?', line)
            language = lang_match.group(1) if lang_match and lang_match.group(1) else "text"

            code_lines = []
            i += 1
            while i < len(lines) and not lines[i].startswith('```'):
                code_lines.append(lines[i])
                i += 1

            block_counter += 1
            current_block = Block(
                id=f"block_{cheatsheet_id}_{block_counter}",
                type="code",
                content='\n'.join(code_lines),
                language=language,
                x=0,
                y=block_counter - 1,
                w=6,
                h=3
            )

            if current_section:
                current_section.blocks.append(current_block)
            current_block = None

        # Regular text
        elif line.strip():
            if not current_section:
                # Create default section if none exists
                section_id = f"sec_{int(datetime.now().timestamp() * 1000)}_0"
                current_section = Section(
                    id=section_id,
                    title="Imported Content",
                    blocks=[]
                )

            if not current_block:
                block_counter += 1
                current_block = {
                    "id": f"block_{cheatsheet_id}_{block_counter}",
                    "content": line,
                    "type": "text",
                    "x": 0,
                    "y": block_counter - 1,
                    "w": 6,
                    "h": 2
                }
            else:
                current_block["content"] += "\n" + line if isinstance(current_block, dict) else ""

        i += 1

    # Add remaining block and section
    if current_block and current_section:
        if isinstance(current_block, dict):
            current_section.blocks.append(Block(**current_block))
        else:
            current_section.blocks.append(current_block)

    if current_section:
        sections.append(current_section)

    # If no sections were created, create a default one
    if not sections:
        sections.append(Section(
            id=f"sec_{int(datetime.now().timestamp() * 1000)}_0",
            title="Imported Content",
            blocks=[]
        ))

    return Cheatsheet(
        id=cheatsheet_id,
        name=name,
        sections=sections,
        created=datetime.now().isoformat(),
        updated=datetime.now().isoformat()
    )

# ============== API Endpoints ==============

@app.get("/")
def root():
    """Root endpoint"""
    return {"message": "Cheatsheet Creator API", "version": "1.0.0"}

@app.get("/api/cheatsheets", response_model=List[Cheatsheet])
def get_cheatsheets():
    """Get all cheatsheets"""
    return load_all_cheatsheets()

@app.get("/api/cheatsheets/{cheatsheet_id}", response_model=Cheatsheet)
def get_cheatsheet(cheatsheet_id: str):
    """Get a specific cheatsheet by ID"""
    cs = load_cheatsheet(cheatsheet_id)
    if cs:
        return cs
    raise HTTPException(status_code=404, detail="Cheatsheet not found")

@app.post("/api/cheatsheets", response_model=Cheatsheet)
def create_cheatsheet(cheatsheet: CheatsheetCreate):
    """Create a new cheatsheet"""
    # Generate unique ID
    new_id = f"cs_{int(datetime.now().timestamp() * 1000)}"

    new_cheatsheet = Cheatsheet(
        id=new_id,
        name=cheatsheet.name,
        sections=[],
        created=datetime.now().isoformat(),
        updated=datetime.now().isoformat()
    )

    save_cheatsheet(new_cheatsheet)
    return new_cheatsheet

@app.put("/api/cheatsheets/{cheatsheet_id}", response_model=Cheatsheet)
def update_cheatsheet(cheatsheet_id: str, update: CheatsheetUpdate):
    """Update a cheatsheet"""
    cs = load_cheatsheet(cheatsheet_id)
    if not cs:
        raise HTTPException(status_code=404, detail="Cheatsheet not found")

    if update.name is not None:
        cs.name = update.name
    if update.sections is not None:
        cs.sections = update.sections
    cs.updated = datetime.now().isoformat()

    save_cheatsheet(cs)
    return cs

@app.delete("/api/cheatsheets/{cheatsheet_id}")
def delete_cheatsheet(cheatsheet_id: str):
    """Delete a cheatsheet"""
    cs = load_cheatsheet(cheatsheet_id)
    if not cs:
        raise HTTPException(status_code=404, detail="Cheatsheet not found")

    delete_cheatsheet_file(cheatsheet_id)
    return {"message": "Cheatsheet deleted successfully"}

@app.post("/api/import/json", response_model=Cheatsheet)
def import_json(data: dict):
    """Import a cheatsheet from JSON data"""
    try:
        # Generate new ID if not provided or if it already exists
        original_id = data.get("id", "")
        if not original_id or load_cheatsheet(original_id):
            data["id"] = f"cs_{int(datetime.now().timestamp() * 1000)}"

        # Update timestamps
        data["created"] = datetime.now().isoformat()
        data["updated"] = datetime.now().isoformat()

        # Validate and create cheatsheet
        cheatsheet = Cheatsheet(**data)
        save_cheatsheet(cheatsheet)
        return cheatsheet
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Invalid JSON format: {str(e)}")

@app.post("/api/import/markdown", response_model=Cheatsheet)
def import_markdown(data: dict):
    """Import a cheatsheet from Markdown content"""
    try:
        markdown_content = data.get("content", "")
        name = data.get("name", "Imported from Markdown")

        if not markdown_content:
            raise HTTPException(status_code=400, detail="No markdown content provided")

        # Parse markdown and create cheatsheet
        cheatsheet = parse_markdown_to_cheatsheet(markdown_content, name)
        save_cheatsheet(cheatsheet)
        return cheatsheet
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Failed to parse markdown: {str(e)}")

@app.post("/api/import/bulk")
def import_bulk(files: List[dict]):
    """Import multiple cheatsheets from JSON data"""
    results = {
        "success": [],
        "failed": []
    }

    for file_data in files:
        try:
            # Generate new ID
            file_data["id"] = f"cs_{int(datetime.now().timestamp() * 1000)}"

            # Update timestamps
            file_data["created"] = datetime.now().isoformat()
            file_data["updated"] = datetime.now().isoformat()

            # Validate and create cheatsheet
            cheatsheet = Cheatsheet(**file_data)
            save_cheatsheet(cheatsheet)
            results["success"].append({"name": cheatsheet.name, "id": cheatsheet.id})

            # Small delay to ensure unique IDs
            import time
            time.sleep(0.001)
        except Exception as e:
            results["failed"].append({
                "name": file_data.get("name", "Unknown"),
                "error": str(e)
            })

    return results

@app.get("/api/cheatsheets/{cheatsheet_id}/export")
def export_cheatsheet_markdown(cheatsheet_id: str):
    """Export a cheatsheet as Markdown"""
    cs = load_cheatsheet(cheatsheet_id)
    if not cs:
        raise HTTPException(status_code=404, detail="Cheatsheet not found")

    # Generate Markdown
    md_lines = [f"# {cs.name}\n"]

    for section in cs.sections:
        md_lines.append(f"\n## {section.title}\n")

        for block in section.blocks:
            if block.title:
                md_lines.append(f"\n### {block.title}\n")

            if block.type == "text":
                md_lines.append(f"\n{block.content}\n")
            elif block.type == "code":
                lang = block.language or "text"
                md_lines.append(f"\n```{lang}\n{block.content}\n```\n")
            elif block.type == "table":
                md_lines.append(f"\n{block.content}\n")
            elif block.type == "list":
                md_lines.append(f"\n{block.content}\n")
            elif block.type == "checkbox":
                md_lines.append(f"\n{block.content}\n")
            elif block.type == "calculation":
                md_lines.append(f"\n```\n{block.content}\n```\n")
            elif block.type == "reference":
                if block.referenceData:
                    md_lines.append("\n| Description | Code |\n")
                    md_lines.append("|-------------|------|\n")
                    for row in block.referenceData:
                        md_lines.append(f"| {row.description} | `{row.code}` |\n")

    markdown_content = "\n".join(md_lines)

    from fastapi.responses import Response
    return Response(
        content=markdown_content,
        media_type="text/markdown",
        headers={
            "Content-Disposition": f'attachment; filename="{cs.name}.md"'
        }
    )

@app.get("/api/cheatsheets/{cheatsheet_id}/export/json")
def export_cheatsheet_json(cheatsheet_id: str):
    """Export a single cheatsheet as JSON"""
    cs = load_cheatsheet(cheatsheet_id)
    if not cs:
        raise HTTPException(status_code=404, detail="Cheatsheet not found")

    from fastapi.responses import Response
    json_content = json.dumps(cs.model_dump(), indent=2, ensure_ascii=False)

    return Response(
        content=json_content,
        media_type="application/json",
        headers={
            "Content-Disposition": f'attachment; filename="{cs.name}.json"'
        }
    )

@app.get("/api/cheatsheets/export/bulk")
def export_all_cheatsheets_json():
    """Export all cheatsheets as a single JSON file"""
    cheatsheets = load_all_cheatsheets()

    from fastapi.responses import Response
    json_content = json.dumps(
        [cs.model_dump() for cs in cheatsheets],
        indent=2,
        ensure_ascii=False
    )

    return Response(
        content=json_content,
        media_type="application/json",
        headers={
            "Content-Disposition": 'attachment; filename="all_cheatsheets.json"'
        }
    )

@app.get("/api/search")
def search_cheatsheets(q: str):
    """Search across all cheatsheets"""
    if not q or len(q) < 2:
        return []

    query = q.lower()
    results = []
    cheatsheets = load_all_cheatsheets()

    for cs in cheatsheets:
        # Search in cheatsheet name
        if query in cs.name.lower():
            results.append({
                "cheatsheet_id": cs.id,
                "cheatsheet_name": cs.name,
                "type": "cheatsheet",
                "match": cs.name
            })

        # Search in sections and blocks
        for section in cs.sections:
            # Search in section title
            if query in section.title.lower():
                results.append({
                    "cheatsheet_id": cs.id,
                    "cheatsheet_name": cs.name,
                    "section_title": section.title,
                    "type": "section",
                    "match": section.title
                })

            # Search in blocks
            for block in section.blocks:
                if query in block.content.lower() or (block.title and query in block.title.lower()):
                    # Get context snippet
                    content_lower = block.content.lower()
                    match_index = content_lower.find(query)
                    start = max(0, match_index - 50)
                    end = min(len(block.content), match_index + len(query) + 50)
                    snippet = block.content[start:end]
                    if start > 0:
                        snippet = "..." + snippet
                    if end < len(block.content):
                        snippet = snippet + "..."

                    results.append({
                        "cheatsheet_id": cs.id,
                        "cheatsheet_name": cs.name,
                        "section_title": section.title,
                        "block_type": block.type,
                        "block_title": block.title,
                        "type": "block",
                        "match": snippet
                    })

    return results

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000, reload=True)
