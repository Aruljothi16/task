from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import List, Optional, Dict, Any
import random
from datetime import datetime, date, timedelta

# ── MySQL connector ──────
import pymysql
import pymysql.cursors

# ── Sentence-Transformers for semantic NLP ──────
from sentence_transformers import SentenceTransformer, util
import torch

# ─────────────────────────────────────────────────────────────────
app = FastAPI(title="TMS AI Service – Hyper-Live Role-Scoped Edition")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ── Model ──────
print("Loading semantic NLP model (all-MiniLM-L6-v2) …")
_model = SentenceTransformer("all-MiniLM-L6-v2")
print("Model ready.")

# ── DB Config ──────
DB_CONFIG = {
    "host":     "localhost",
    "user":     "root",
    "password": "",
    "database": "task_management_system",
    "charset":  "utf8mb4",
    "cursorclass": pymysql.cursors.DictCursor,
}

def get_db():
    return pymysql.connect(**DB_CONFIG)

def db_query(sql: str, args=None) -> List[Dict]:
    try:
        conn = get_db()
        with conn.cursor() as cur:
            cur.execute(sql, args or ())
            rows = cur.fetchall()
        conn.close()
        return rows
    except Exception as e:
        print(f"[DB ERROR] {e}")
        return []

# ─────────────────────────────────────────────────────────────────
# DATA HELPERS (Strict Role-Based Scoping)
# ─────────────────────────────────────────────────────────────────

def get_live_tasks(user_id: Optional[int], role: str) -> List[Dict]:
    """Fetch tasks strictly scoped to role."""
    if role == "admin":
        return db_query("SELECT t.*, p.name as project_name FROM tasks t LEFT JOIN projects p ON t.project_id = p.id ORDER BY t.created_at DESC")
    elif role == "manager":
        return db_query(
            "SELECT t.*, p.name as project_name FROM tasks t "
            "JOIN projects p ON t.project_id = p.id "
            "WHERE p.manager_id = %s OR t.assigned_to = %s "
            "ORDER BY t.created_at DESC", 
            (user_id, user_id)
        )
    return db_query(
        "SELECT t.*, p.name as project_name FROM tasks t "
        "LEFT JOIN projects p ON t.project_id = p.id "
        "WHERE t.assigned_to = %s "
        "ORDER BY t.created_at DESC", 
        (user_id,)
    )

def get_live_projects(user_id: Optional[int], role: str) -> List[Dict]:
    """Fetch projects strictly scoped to role."""
    if role == "admin":
        return db_query("SELECT * FROM projects ORDER BY created_at DESC")
    elif role == "manager":
        return db_query("SELECT * FROM projects WHERE manager_id = %s ORDER BY created_at DESC", (user_id,))
    return db_query(
        "SELECT DISTINCT p.* FROM projects p "
        "JOIN tasks t ON t.project_id = p.id "
        "WHERE t.assigned_to = %s "
        "ORDER BY p.created_at DESC", 
        (user_id,)
    )

# ─────────────────────────────────────────────────────────────────
# DATE & STATUS HELPERS
# ─────────────────────────────────────────────────────────────────

def fmt_date(d) -> str:
    if not d: return "no deadline"
    try:
        if isinstance(d, (datetime, date)): return d.strftime("%d %b %Y").lstrip("0")
        p = datetime.strptime(str(d), "%Y-%m-%d")
        return p.strftime("%d %b %Y").lstrip("0")
    except: return str(d)

def check_overdue(d) -> bool:
    if not d: return False
    try:
        t = d if isinstance(d, date) else datetime.strptime(str(d), "%Y-%m-%d").date()
        return t < datetime.now().date()
    except: return False

def check_near_due(d, days=7) -> bool:
    if not d: return False
    try:
        t = d if isinstance(d, date) else datetime.strptime(str(d), "%Y-%m-%d").date()
        today = datetime.now().date()
        return today <= t <= (today + timedelta(days=days))
    except: return False

# ─────────────────────────────────────────────────────────────────
# NLP INTENTS
# ─────────────────────────────────────────────────────────────────

INTENTS = [
    {"id": "summary", "examples": ["summary report", "status overview", "how am i doing", "panel dashboard status"]},
    {"id": "tasks_all", "examples": ["show all tasks", "list my work", "view my tasks", "task list"]},
    {"id": "tasks_overdue", "examples": ["show overdue tasks", "late tasks list", "missed task deadlines", "what tasks are late"]},
    {"id": "tasks_near_due", "examples": ["tasks ending soon", "tasks due this week", "upcoming deadlines for tasks"]},
    {"id": "tasks_high_priority", "examples": ["high priority tasks", "critical tasks", "urgent task list"]},
    {"id": "projects_all", "examples": ["list projects", "view all projects", "show my projects"]},
    {"id": "projects_overdue", "examples": ["overdue projects", "late projects overview", "missed project deadlines"]},
    {"id": "projects_near_due", "examples": ["projects ending soon", "projects due soon", "upcoming project deadlines"]},
    {"id": "projects_high_priority", "examples": ["high priority projects", "critical project list", "urgent projects"]},
    {"id": "team", "examples": ["team list", "show members", "who is on the system"]},
    {"id": "greeting", "examples": ["hi", "hello", "good morning"]},
    {"id": "help", "examples": ["help", "commands", "what can you do"]}
]

_intent_embeddings = []
for it in INTENTS:
    _intent_embeddings.append({"id": it["id"], "embeddings": _model.encode(it["examples"], convert_to_tensor=True)})

def detect_live_intent(message: str, threshold: float = 0.35) -> Optional[str]:
    low_msg = message.lower().strip()
    msg_emb = _model.encode(low_msg, convert_to_tensor=True)
    
    best_id, best_score = None, 0.0
    for it in _intent_embeddings:
        score = float(util.cos_sim(msg_emb, it["embeddings"]).max())
        if score > best_score:
            best_score, best_id = score, it["id"]
    
    # ── KEYWORD DISAMBIGUATION (Project vs Task) ──
    if "project" in low_msg and "task" not in low_msg:
        if "overdue" in low_msg or "late" in low_msg: return "projects_overdue"
        if "soon" in low_msg or "near" in low_msg or "end" in low_msg: return "projects_near_due"
        if "high" in low_msg or "urgent" in low_msg: return "projects_high_priority"
        return "projects_all"
    elif "task" in low_msg and "project" not in low_msg:
        if "overdue" in low_msg or "late" in low_msg: return "tasks_overdue"
        if "soon" in low_msg or "near" in low_msg or "end" in low_msg: return "tasks_near_due"
        if "high" in low_msg or "urgent" in low_msg: return "tasks_high_priority"
        return "tasks_all"
            
    return best_id if best_score >= threshold else None

# ─────────────────────────────────────────────────────────────────
# RESPONSE ENGINE
# ─────────────────────────────────────────────────────────────────

def build_reply(intent: str, uid: int, role: str, uname: str) -> str:
    tasks = get_live_tasks(uid, role)
    projects = get_live_projects(uid, role)
    
    # Summary intent
    if intent == "summary":
        overdue_t = [t for t in tasks if check_overdue(t.get('due_date')) and t.get('status','').lower() != 'completed']
        near_t    = [t for t in tasks if check_near_due(t.get('due_date')) and t.get('status','').lower() != 'completed']
        overdue_p = [p for p in projects if check_overdue(p.get('due_date')) and p.get('status','').lower() != 'completed']
        near_p    = [p for p in projects if check_near_due(p.get('due_date')) and p.get('status','').lower() != 'completed']
        
        lines = [
            f"📊 **{role.upper()} PANEL OVERVIEW**",
            f"Hello **{uname}**! All data shown is fetched live from your panel.\n",
            f"📁 **Projects:** {len(projects)} total",
            f"📋 **Tasks:** {len(tasks)} total\n",
            "**Critical Items:**"
        ]
        if overdue_p: lines.append(f"  - � **{len(overdue_p)}** Overdue Projects")
        if overdue_t: lines.append(f"  - � **{len(overdue_t)}** Overdue Tasks")
        if near_p:    lines.append(f"  - ⌛ **{len(near_p)}** Projects finishing within 7 days")
        if near_t:    lines.append(f"  - ⚡ **{len(near_t)}** Tasks due within 7 days")
        
        if not (overdue_p or overdue_t or near_p or near_t):
            lines.append("  - ✅ No urgent project or task deadlines detected! You're all caught up.")
            
        return "\n".join(lines)

    # Task Intents
    if intent == "tasks_all":
        if not tasks: return "You don't have any tasks assigned in this panel."
        lines = [f"📋 **Your Task List ({len(tasks)})**"]
        for i, t in enumerate(tasks[:10], 1):
            lines.append(f"{i}. **{t['title']}** — {t.get('status','pending')}")
        return "\n".join(lines)

    if intent == "tasks_overdue":
        ov = [t for t in tasks if check_overdue(t.get('due_date')) and t.get('status','').lower() != 'completed']
        if not ov: return "✅ No overdue tasks! Keep up the good work."
        lines = [f"⚠️ **Overdue Tasks ({len(ov)})**"]
        for i, t in enumerate(ov[:10], 1): lines.append(f"{i}. **{t['title']}**\n   📅 Due: {fmt_date(t.get('due_date'))}")
        return "\n".join(lines)

    if intent == "tasks_near_due":
        nr = [t for t in tasks if check_near_due(t.get('due_date')) and t.get('status','').lower() != 'completed']
        if not nr: return "✅ No tasks are due in the next 7 days."
        lines = [f"⚡ **Tasks Due Soon ({len(nr)})**"]
        for i, t in enumerate(nr[:10], 1): lines.append(f"{i}. **{t['title']}**\n   ⏰ Deadline: {fmt_date(t.get('due_date'))}")
        return "\n".join(lines)

    if intent == "tasks_high_priority":
        hp = [t for t in tasks if str(t.get('priority')).lower() == 'high']
        if not hp: return "No high-priority tasks found."
        lines = [f"🔥 **High Priority Tasks ({len(hp)})**"]
        for i, t in enumerate(hp[:10], 1): lines.append(f"{i}. **{t['title']}** — {t.get('status')}")
        return "\n".join(lines)

    # Project Intents
    if intent == "projects_all":
        if not projects: return "You don't have any projects in this panel."
        lines = [f"� **Project List ({len(projects)})**"]
        for i, p in enumerate(projects[:10], 1): lines.append(f"{i}. **{p.get('name')}** — {p.get('status')}")
        return "\n".join(lines)

    if intent == "projects_overdue":
        ovp = [p for p in projects if check_overdue(p.get('due_date')) and p.get('status','').lower() != 'completed']
        if not ovp: return "✅ No overdue projects in this panel."
        lines = [f"� **Overdue Projects ({len(ovp)})**"]
        for i, p in enumerate(ovp[:10], 1): lines.append(f"{i}. **{p.get('name')}**\n   ⚠️ Deadline: {fmt_date(p.get('due_date'))}")
        return "\n".join(lines)

    if intent == "projects_near_due":
        nrp = [p for p in projects if check_near_due(p.get('due_date')) and p.get('status','').lower() != 'completed']
        if not nrp: return "✅ No projects are finishing within the next 7 days."
        lines = [f"⌛ **Projects Ending Soon ({len(nrp)})**"]
        for i, p in enumerate(nrp[:10], 1): lines.append(f"{i}. **{p.get('name')}**\n   🏁 Due: {fmt_date(p.get('due_date'))}")
        return "\n".join(lines)

    if intent == "projects_high_priority":
        hp = [p for p in projects if str(p.get('priority')).lower() == 'high']
        if not hp: return "No high-priority projects found."
        lines = [f"🏢 **Critical Projects ({len(hp)})**"]
        for i, p in enumerate(hp[:10], 1): lines.append(f"{i}. **{p.get('name')}**")
        return "\n".join(lines)

    if intent == "team":
        members = db_query("SELECT full_name, role, designation FROM users ORDER BY full_name")
        lines = [f"👥 **Team Members ({len(members)})**"]
        for i, m in enumerate(members[:12], 1): lines.append(f"{i}. **{m['full_name']}** — {m['role']} ({m.get('designation','')})")
        return "\n".join(lines)

    return "I found the data you requested, but I'm having trouble displaying it. Try asking for a 'summary'."

# ─────────────────────────────────────────────────────────────────
# ENDPOINTS
# ─────────────────────────────────────────────────────────────────

class ChatRequest(BaseModel):
    message: str
    role: str
    user_id: Optional[int] = None
    user_name: Optional[str] = None

@app.post("/chat")
def chat(req: ChatRequest):
    intent = detect_live_intent(req.message)
    role = req.role.lower()
    uid = req.user_id
    uname = req.user_name or "User"

    if intent == "greeting":
        return {"response": f"Hi {uname}! I'm your TMS Assistant. I provide live, role-specific data for your {role} panel.", "is_live": False}
    
    if intent == "help":
        return {"response": "I can monitor your panel in real-time. Try:\n- 'Show overdue tasks'\n- 'List projects ending soon'\n- 'Summary report'\n- 'High priority work'", "is_live": False}

    if intent:
        reply = build_reply(intent, uid, role, uname)
        return {"response": reply, "is_live": True}

    return {"response": "I'm not sure how to handle that. Try asking for 'overdue tasks' or 'summary'. I fetch all data live from your panel.", "is_live": False}

# LEGACY ML REPLACEMENT - Hyper-Live AI Logic
class PriorityRequest(BaseModel):
    title: str
    description: Optional[str] = ""
    project_id: Optional[Any] = None
    due_date: Optional[str] = None
    estimated_hours: Optional[Any] = None
    task_type: Optional[str] = None
    dependencies: Optional[List[str]] = []

class WorkloadRequest(BaseModel):
    members: List[Dict[str, Any]]
    tasks: List[Dict[str, Any]]

class DelayRequest(BaseModel):
    tasks_count: int
    complexity: str = "medium"

class SubtaskRequest(BaseModel):
    title: str
    description: Optional[str] = ""

# --- SUBTASK KNOWLEDGE BASE ---
SUBTASK_TEMPLATES = {
    "frontend": ["Design UI components", "Implement responsive layout", "Connect to API", "Add validation", "Unit test components"],
    "backend": ["Design database schema", "Create API endpoints", "Implement business logic", "Add authentication", "Test with Postman"],
    "bug": ["Reproduce the issue", "Identify root cause", "Implement fix", "Verify with regression tests", "Deploy fix"],
    "testing": ["Write test cases", "Setup test environment", "Execute manual tests", "Automate critical paths", "Generate report"],
    "documentation": ["Research topic", "Write draft content", "Review with stakeholders", "Format and styles", "Publish documentation"],
    "deployment": ["Configure environment", "Run migrations", "Build production assets", "Deploy to server", "Health check"],
    "research": ["Define objectives", "Gather resources", "Analyze findings", "Create summary report", "Present conclusions"],
    "authentication": ["Design login/signup flow", "Implement JWT/Token auth", "Setup password encryption", "Add social login", "Verify session management"],
    "database": ["Refine SQL queries", "Apply indexing for performance", "Run database migrations", "Setup backup strategy", "Test data integrity"],
    "uiux": ["Create mockups", "Review accessibility", "Optimize asset loading", "Setup themes", "Cross-browser check"],
    "api": ["Document with Swagger", "Implement rate limiting", "Add error handling", "CORS support", "Stress test"],
    "security": ["Vulnerability scan", "Sanitize inputs", "Audit permissions", "Encrypt sensitive data", "OWASP check"],
    "performance": ["Optimize queries", "Implement caching (Redis)", "Minify assets", "Profile execution", "Image optimization"],
    "mobile": ["Test on iOS/Android", "Optimize touch UI", "Adjust mobile layout", "Battery check", "Platform submission"],
    "cloud": ["Setup AWS/Azure", "Configure Docker", "Setup CI/CD pipeline", "Monitor logs (CloudWatch)", "Scale resources"],
    "refactor": ["Identify code smells", "Simplify logic", "Improve naming", "Extract modules", "Verify regression"]
}

_template_keys = list(SUBTASK_TEMPLATES.keys())
_template_embeddings = _model.encode(_template_keys, convert_to_tensor=True)

@app.post("/generate/subtasks")
def gen_sub(req: SubtaskRequest):
    title = req.title.strip()
    title_desc = f"{title} {req.description}".lower()
    title_emb = _model.encode(title_desc, convert_to_tensor=True)
    
    # Extract potential object from title (e.g. "Login", "Profile", "Chat")
    # Very simple heuristic: first 1-2 words if they are nouns/important
    words = title.split()
    obj_context = words[0] if words else ""
    if len(words) > 1 and len(words[0]) < 4: obj_context = f"{words[0]} {words[1]}"
    
    # Semantic matching for template
    scores = util.cos_sim(title_emb, _template_embeddings)[0]
    
    # Get top 2 categories
    threshold = 0.22
    matches = []
    for idx, score in enumerate(scores):
        if float(score) > threshold:
            matches.append((idx, float(score)))
    
    matches.sort(key=lambda x: x[1], reverse=True)
    
    suggested = []
    if matches:
        # Take up to top 2 categories
        for m_idx, _ in matches[:2]:
            category_subtasks = SUBTASK_TEMPLATES[_template_keys[m_idx]]
            # Add context to some subtasks to make them feel dynamic
            for i, s in enumerate(category_subtasks):
                if i < 2 and obj_context and obj_context.lower() not in s.lower():
                    suggested.append(f"{s} for {obj_context}")
                else:
                    suggested.append(s)
        
        # Unique subtasks, limited to 7
        seen = set()
        suggested = [x for x in suggested if not (x in seen or seen.add(x))][:7]
    else:
        suggested = [
            f"Initial Research on {obj_context}" if obj_context else "Initial Research",
            "Detailed Design", 
            f"Implementation of {obj_context}" if obj_context else "Implementation Phase",
            "Final Testing", 
            "Documentation Update"
        ]

    return {"subtasks": suggested}

@app.post("/predict/priority")
def predict_priority(req: PriorityRequest):
    text = f"{req.title} {req.description}".lower()
    
    # 1. Keyword-based base score (-1 to 1)
    score = 0
    high_keywords = ["urgent", "critical", "blocking", "broken", "security", "emergency", "fix", "error", "api", "crash", "deploy"]
    low_keywords = ["typo", "minor", "chore", "documentation", "optional", "low", "improvement", "style", "ui"]
    
    if any(k in text for k in high_keywords): score += 0.5
    if any(k in text for k in low_keywords): score -= 0.5
    
    # 2. Deadline Pressure
    if req.due_date:
        try:
            due = datetime.strptime(req.due_date, "%Y-%m-%d").date()
            days_left = (due - date.today()).days
            if days_left <= 2: score += 0.6
            elif days_left <= 5: score += 0.2
        except: pass
        
    # 3. Complexity/Hours
    try:
        if req.estimated_hours and float(req.estimated_hours) > 10:
            score += 0.3
    except: pass
        
    # 4. Past Similar Tasks (Semantic DB Check)
    pid = None
    try:
        if req.project_id and str(req.project_id).strip():
            pid = int(req.project_id)
    except: pass

    if pid:
        past_tasks = db_query("SELECT title, description, priority FROM tasks WHERE project_id = %s LIMIT 50", (pid,))
        if past_tasks:
            current_emb = _model.encode(text, convert_to_tensor=True)
            past_texts = [f"{t['title']} {t['description'] or ''}".lower() for t in past_tasks]
            past_embs = _model.encode(past_texts, convert_to_tensor=True)
            
            similarities = util.cos_sim(current_emb, past_embs)[0]
            max_sim_idx = int(torch.argmax(similarities))
            max_sim = float(similarities[max_sim_idx])
            
            if max_sim > 0.75:
                # Strong historical match found! Align with its priority
                hist_p = past_tasks[max_sim_idx]['priority'].lower()
                if hist_p == 'high': score += 0.7
                elif hist_p == 'low': score -= 0.7
                # Boost confidence reason
                reason = f"Based on match with past task '{past_tasks[max_sim_idx]['title']}'"
            else:
                reason = "Based on task keywords and deadline"
    else:
        reason = "Based on task keywords"

    # Final mapping
    if score >= 0.4: prediction = "high"
    elif score <= -0.4: prediction = "low"
    else: prediction = "medium"
    
    return {"prediction": prediction, "reason": reason, "debug_score": round(score, 2)}

@app.post("/analyze/workload")
def analyze_workload(req: WorkloadRequest):
    if not req.members:
        return {"suggested_member_ids": [], "reason": "No members provided"}
    
    # Count pending tasks for each member (Use string keys for robustness)
    workload = {str(m['id']): 0 for m in req.members}
    for t in req.tasks:
        uid = str(t.get('assigned_to'))
        if uid in workload:
            workload[uid] += 1
            
    # Find minimum task count
    if not workload:
         return {"suggested_member_ids": [], "reason": "No valid members for workload calculation"}

    min_tasks = min(workload.values())
    # Find all members with that count
    best_member_ids = [int(uid) for uid, count in workload.items() if count == min_tasks]
    
    return {
        "suggested_member_ids": best_member_ids,
        "workload_score": min_tasks,
        "reason": f"Members have the lowest current workload ({min_tasks} active tasks)."
    }

@app.post("/predict/delay")
def predict_delay(req: DelayRequest):
    count = req.tasks_count
    complexity = req.complexity.lower()
    
    # Base risk
    if count <= 2: risk, reason = "low", "Manageable workload."
    elif count <= 5: risk, reason = "medium", "Moderate number of active tasks."
    else: risk, reason = "high", "High number of concurrent tasks may cause delays."
    
    # Complexity adjustment
    if complexity == "high" and risk != "high":
        risk = "high" if risk == "medium" else "medium"
        reason += " Added risk due to task complexity."
        
    return {"risk": risk, "reason": reason}

@app.post("/analyze/complexity")
def analyze_complexity(req: PriorityRequest):
    # Reuse PriorityRequest schema (title/description)
    text = f"{req.title} {req.description}".lower()
    word_count = len(text.split())
    
    if word_count > 50 or any(k in text for k in ["architect", "design", "implement", "complex", "integration"]):
        return {"complexity": "high", "score": 0.8}
    if word_count > 20:
        return {"complexity": "medium", "score": 0.5}
    return {"complexity": "low", "score": 0.2}

@app.post("/analyze/inertia")
def analyze_inertia(req: Dict[str, Any]):
    # Expects list of projects
    projects = req.get("projects", [])
    if not projects: return {"inertia": "unknown", "message": "No projects to analyze"}
    
    # Simple inertia: project count vs progress
    return {
        "inertia": "low" if len(projects) < 5 else "medium",
        "message": f"Analyzing momentum across {len(projects)} active projects.",
        "momentum_score": 0.75
    }

@app.post("/analyze/sentiment")
def analyze_sentiment(req: Dict[str, Any]):
    # Expects list of comments
    comments = req.get("comments", [])
    if not comments: return {"sentiment": "neutral", "score": 0}
    
    positive_words = ["good", "great", "done", "fixed", "thanks", "excellent", "proceed"]
    negative_words = ["bad", "error", "fail", "slow", "hard", "issue", "block"]
    
    score = 0
    all_text = " ".join(comments).lower()
    for w in positive_words: score += all_text.count(w)
    for w in negative_words: score -= all_text.count(w)
    
    sentiment = "positive" if score > 0 else "negative" if score < 0 else "neutral"
    return {"sentiment": sentiment, "score": score}

if __name__ == "__main__":
    import uvicorn
    # Changed port to 8000 to match backend AIService.php config
    print("Starting TMS AI Service on port 8000...")
    uvicorn.run(app, host="127.0.0.1", port=8000)
