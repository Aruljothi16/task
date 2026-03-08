/**
 * TMS Built-in Chat Engine
 * A powerful, rule-based NLP engine that works entirely in the browser.
 * Supports both static knowledge responses AND live database data.
 */

// --- Helpers ---
const pick = (arr) => arr[Math.floor(Math.random() * arr.length)];
const includes = (text, ...terms) => terms.some(t => text.includes(t));

// --- Short-term context memory (per session) ---
let lastTopic = null;

// ─────────────────────────────────────────────────────────────────
// LIVE DATA INTENTS
// These are matched BEFORE static intents if DB data is provided.
// The ChatBot.jsx fetches data and injects it via liveData context.
// ─────────────────────────────────────────────────────────────────

/**
 * Detect if a message is asking for live database data.
 * Returns a data-intent key, or null if it's a general question.
 */
export function detectDataIntent(message) {
    const text = message.toLowerCase().trim();

    // ── Projects: Overdue ──────────────────────────────────────────
    if (includes(text, 'overdue projects', 'late projects', 'missed project deadline')) return 'projects_overdue';

    // ── Projects: Ending Soon ─────────────────────────────────────
    if (includes(text, 'projects near due', 'projects ending soon', 'projects due soon')) return 'projects_ending_soon';

    // ── Projects: All ─────────────────────────────────────────────
    if (includes(text,
        'my projects', 'list projects', 'show projects', 'all projects',
        'current projects', 'available projects', 'what projects', 'which projects',
        'how many projects', 'project list', 'projects i have'
    )) return 'projects';

    // ── Tasks: General ────────────────────────────────────────────
    if (includes(text,
        'my tasks', 'all tasks', 'list tasks', 'show tasks', 'show me tasks',
        'current tasks', 'available tasks', 'what tasks', 'task list',
        'tasks i have', 'how many tasks', 'tasks assigned'
    )) return 'tasks';

    // ── Tasks: High Priority ──────────────────────────────────────
    if (includes(text,
        'high priority', 'critical tasks', 'urgent tasks', 'priority tasks',
        'important tasks', 'top priority', 'critical priority', 'high priority tasks',
        'most urgent', 'urgent work', 'what is critical'
    )) return 'tasks_high_priority';

    // ── Tasks: Pending ────────────────────────────────────────────
    if (includes(text,
        'pending tasks', 'not started', 'todo tasks', 'to do tasks', 'backlog',
        'tasks not started', 'what is pending', 'incomplete tasks', 'open tasks'
    )) return 'tasks_pending';

    // ── Tasks: In Progress ────────────────────────────────────────
    if (includes(text,
        'in progress', 'ongoing tasks', 'active tasks', 'currently working',
        'tasks in progress', 'what is ongoing', 'being worked on', 'working on'
    )) return 'tasks_in_progress';

    // ── Tasks: Completed ─────────────────────────────────────────
    if (includes(text,
        'completed tasks', 'done tasks', 'finished tasks', 'what is completed',
        'tasks done', 'tasks finished', 'what have been completed'
    )) return 'tasks_completed';

    // ── Tasks: Overdue ────────────────────────────────────────────
    if (includes(text,
        'overdue', 'overdue tasks', 'late tasks', 'missed deadline', 'past deadline',
        'expired tasks', 'tasks due', 'missed tasks', 'tasks past due', 'delayed tasks'
    )) return 'tasks_overdue';

    // ── Tasks: Ending Soon ────────────────────────────────────────
    if (includes(text, 'tasks near due', 'tasks ending soon', 'tasks due soon')) return 'tasks_ending_soon';

    // ── Dashboard Summary ─────────────────────────────────────────
    if (includes(text,
        'my summary', 'my stats', 'give me summary', 'overall status', 'quick summary',
        'how are things', 'status update', 'whats going on', "what's going on",
        'show overview', 'show me overview', 'quick overview', 'dashboard data',
        'how many tasks do i have', 'how many projects do i have'
    )) return 'summary';

    // ── Team / Members ────────────────────────────────────────────
    if (includes(text,
        'team members', 'my team', 'list members', 'show members', 'all members',
        'who is on my team', 'who are my team', 'team list', 'members list'
    )) return 'team';

    return null; // not a data query
}

// ─────────────────────────────────────────────────────────────────
// LIVE DATA RESPONSE FORMATTERS
// Called from ChatBot.jsx after data is fetched from the API
// ─────────────────────────────────────────────────────────────────

// -- Helpers for formatting -------------------------------------------
function capitalize(str) {
    return str.charAt(0).toUpperCase() + str.slice(1);
}

function fmtDate(dateStr) {
    if (!dateStr) return 'No deadline';
    const d = new Date(dateStr);
    if (isNaN(d)) return dateStr;
    return d.toLocaleDateString([], { day: 'numeric', month: 'short', year: 'numeric' });
}

function isOverdue(dateStr) {
    if (!dateStr) return false;
    return new Date(dateStr) < new Date();
}

function isEndingSoon(dateStr) {
    if (!dateStr) return false;
    const dueDate = new Date(dateStr);
    const now = new Date();
    const sevenDaysFromNow = new Date();
    sevenDaysFromNow.setDate(now.getDate() + 7);
    return dueDate >= now && dueDate <= sevenDaysFromNow;
}

/**
 * Format a live DB response into a clean, emoji-free, role-aware chat message.
 */
export function formatLiveResponse(dataIntent, data, userCtx) {
    lastTopic = dataIntent;

    switch (dataIntent) {

        // ── PROJECTS ALL ───────────────────────────────────────────
        case 'projects': {
            const projects = data?.projects || data || [];
            const role = (userCtx?.role || '').toLowerCase();
            const titlePrefix = role === 'admin' ? 'System-Wide' : 'Your';

            if (!projects.length) return `${role === 'admin' ? 'No projects exist in the system' : "You don't have any projects yet"}.\n\nAdd one from the **Projects** section in the sidebar.`;

            const lines = projects.slice(0, 10).map((p, i) => {
                const deadline = p.end_date || p.deadline || p.due_date;
                const overdue = isOverdue(deadline);
                return `${i + 1}. **${p.name || p.title}**${overdue ? ' — Overdue' : ''}` +
                    `\n   Deadline: ${fmtDate(deadline)}` +
                    (p.status ? `\n   Status: ${p.status}` : '') +
                    (role === 'admin' && p.manager_name ? `\n   Manager: ${p.manager_name}` : '');
            });

            const extra = projects.length > 10 ? `\n\n...and **${projects.length - 10}** more projects.` : '';

            return `**${titlePrefix} Projects (${projects.length} total)**\n\n${lines.join('\n\n')}${extra}\n\nGo to **Projects** in the sidebar for full details.`;
        }

        // ── PROJECTS ENDING SOON ───────────────────────────────────
        case 'projects_ending_soon': {
            const projects = data?.projects || data || [];
            const endingSoon = projects.filter(p => isEndingSoon(p.end_date || p.deadline || p.due_date));

            if (!endingSoon.length) return `No projects are ending in the next 7 days — your schedule looks clear!`;

            const lines = endingSoon.slice(0, 10).map((p, i) => {
                const deadline = p.end_date || p.deadline || p.due_date;
                return `${i + 1}. **${p.name || p.title}**` +
                    `\n   Deadline: ${fmtDate(deadline)}` +
                    (p.status ? `\n   Status: ${p.status}` : '');
            });

            return `**Projects Ending Soon (${endingSoon.length})**\n\n${lines.join('\n\n')}\n\nPlease ensure these are on track for completion.`;
        }

        // ── PROJECTS OVERDUE ───────────────────────────────────────
        case 'projects_overdue': {
            const projects = data?.projects || data || [];
            const overdue = projects.filter(p => isOverdue(p.end_date || p.deadline || p.due_date));

            if (!overdue.length) return `No overdue projects — everything is on schedule! Great job managing your timelines.`;

            const lines = overdue.slice(0, 10).map((p, i) => {
                const deadline = p.end_date || p.deadline || p.due_date;
                return `${i + 1}. **${p.name || p.title}**` +
                    `\n   Overdue since: ${fmtDate(deadline)}` +
                    (p.status ? `\n   Status: ${p.status}` : '');
            });

            return `**Overdue Projects (${overdue.length})**\n\n${lines.join('\n\n')}\n\nImmediate attention required to update these project timelines.`;
        }

        // ── ALL TASKS ──────────────────────────────────────────────
        case 'tasks': {
            const tasks = data?.tasks || data || [];
            if (!tasks.length) return `You don't have any tasks assigned right now.\n\nCheck with your manager or visit the **Tasks** section.`;

            const byStatus = {};
            tasks.forEach(t => {
                const s = (t.status || 'pending').toLowerCase();
                byStatus[s] = (byStatus[s] || 0) + 1;
            });

            const statusSummary = Object.entries(byStatus)
                .map(([s, c]) => `  ${capitalize(s)}: **${c}**`)
                .join('\n');

            const lines = tasks.slice(0, 8).map((t, i) => {
                const s = (t.status || 'pending').toLowerCase();
                const overdue = isOverdue(t.due_date || t.deadline);
                return `${i + 1}. **${t.title}** — ${t.priority || 'Medium'} | ${t.status || 'Pending'}` +
                    (overdue && s !== 'done' && s !== 'completed' ? ' (Overdue)' : '') +
                    `\n   Due: ${fmtDate(t.due_date || t.deadline)}`;
            });

            const extra = tasks.length > 8 ? `\n\n...and **${tasks.length - 8}** more tasks.` : '';

            return `**Your Tasks (${tasks.length} total)**\n\n**Status Breakdown:**\n${statusSummary}\n\n**Task List:**\n${lines.join('\n\n')}${extra}\n\nVisit **Tasks** in the sidebar for full management.`;
        }

        // ── HIGH PRIORITY ──────────────────────────────────────────
        case 'tasks_high_priority': {
            const tasks = data?.tasks || data || [];
            const urgent = tasks.filter(t => {
                const p = (t.priority || '').toLowerCase();
                return p === 'critical' || p === 'high';
            });

            if (!urgent.length) return `No high-priority or critical tasks at the moment.\n\nYour current workload looks manageable — keep it up!`;

            const lines = urgent.slice(0, 10).map((t, i) => {
                const s = (t.status || 'pending').toLowerCase();
                const overdue = isOverdue(t.due_date || t.deadline);
                return `${i + 1}. **${t.title}** [${(t.priority || 'High').toUpperCase()}] — ${t.status || 'Pending'}` +
                    (overdue && s !== 'done' ? ' (Overdue)' : '') +
                    `\n   Due: ${fmtDate(t.due_date || t.deadline)}` +
                    (t.assigned_to_name ? `\n   Assigned to: ${t.assigned_to_name}` : '');
            });

            const extra = urgent.length > 10 ? `\n\n...and **${urgent.length - 10}** more.` : '';

            return `**High Priority and Critical Tasks (${urgent.length})**\n\n${lines.join('\n\n')}${extra}\n\nThese tasks require immediate attention. Make sure they are actively being worked on.`;
        }

        // ── PENDING TASKS ──────────────────────────────────────────
        case 'tasks_pending': {
            const tasks = data?.tasks || data || [];
            const pending = tasks.filter(t => (t.status || '').toLowerCase() === 'pending');

            if (!pending.length) return `No pending tasks right now. All your tasks are either in progress or completed. Great work!`;

            const lines = pending.slice(0, 10).map((t, i) =>
                `${i + 1}. **${t.title}** [${t.priority || 'Medium'}]` +
                `\n   Due: ${fmtDate(t.due_date || t.deadline)}` +
                (t.assigned_to_name ? `\n   Assigned to: ${t.assigned_to_name}` : '')
            );

            const extra = pending.length > 10 ? `\n\n...and **${pending.length - 10}** more.` : '';

            return `**Pending Tasks (${pending.length} not started)**\n\n${lines.join('\n\n')}${extra}\n\nPick the highest priority task and get started!`;
        }

        // ── IN PROGRESS TASKS ─────────────────────────────────────
        case 'tasks_in_progress': {
            const tasks = data?.tasks || data || [];
            const inProg = tasks.filter(t => (t.status || '').toLowerCase() === 'in progress');

            if (!inProg.length) return `No tasks are currently in progress.\n\nPick up a pending task and get started!`;

            const lines = inProg.slice(0, 10).map((t, i) => {
                const overdue = isOverdue(t.due_date || t.deadline);
                return `${i + 1}. **${t.title}** [${t.priority || 'Medium'}]` +
                    (overdue ? ' (Overdue)' : '') +
                    `\n   Due: ${fmtDate(t.due_date || t.deadline)}` +
                    (t.assigned_to_name ? `\n   Assigned to: ${t.assigned_to_name}` : '');
            });

            return `**In Progress (${inProg.length} active tasks)**\n\n${lines.join('\n\n')}\n\nKeep going — you are making progress!`;
        }

        // ── COMPLETED TASKS ────────────────────────────────────────
        case 'tasks_completed': {
            const tasks = data?.tasks || data || [];
            const done = tasks.filter(t => {
                const s = (t.status || '').toLowerCase();
                return s === 'completed' || s === 'done';
            });

            if (!done.length) return `No tasks have been completed yet.\n\nGet started on your pending tasks!`;

            const lines = done.slice(0, 8).map((t, i) =>
                `${i + 1}. **${t.title}**` +
                (t.assigned_to_name ? ` — ${t.assigned_to_name}` : '')
            );

            const extra = done.length > 8 ? `\n\n...and **${done.length - 8}** more.` : '';

            return `**Completed Tasks (${done.length})**\n\n${lines.join('\n')}${extra}\n\nGreat progress — keep up the momentum!`;
        }

        // ── OVERDUE TASKS ──────────────────────────────────────────
        case 'tasks_overdue': {
            const tasks = data?.tasks || data || [];
            const now = new Date();
            const overdue = tasks.filter(t => {
                const d = t.due_date || t.deadline;
                const s = (t.status || '').toLowerCase();
                return d && new Date(d) < now && s !== 'done' && s !== 'completed';
            });

            if (!overdue.length) return `No overdue tasks — everything is on schedule!\n\nGreat job staying on top of your deadlines.`;

            const lines = overdue.slice(0, 10).map((t, i) => {
                const d = t.due_date || t.deadline;
                const daysLate = Math.floor((Date.now() - new Date(d)) / 86400000);
                return `${i + 1}. **${t.title}** [${t.priority || 'Medium'}]` +
                    `\n   ${daysLate} day${daysLate !== 1 ? 's' : ''} overdue — was due ${fmtDate(d)}` +
                    `\n   Status: ${t.status || 'Pending'}` +
                    (t.assigned_to_name ? `\n   Assigned to: ${t.assigned_to_name}` : '');
            });

            const extra = overdue.length > 10 ? `\n\n...and **${overdue.length - 10}** more overdue.` : '';

            return `**Overdue Tasks (${overdue.length})**\n\n${lines.join('\n\n')}${extra}\n\nImmediate attention is needed. Reach out to your team or update the deadlines.`;
        }

        // ── TASKS ENDING SOON ─────────────────────────────────────
        case 'tasks_ending_soon': {
            const tasks = data?.tasks || data || [];
            const endingSoon = tasks.filter(t => {
                const s = (t.status || '').toLowerCase();
                return isEndingSoon(t.due_date || t.deadline) && s !== 'done' && s !== 'completed';
            });

            if (!endingSoon.length) return `No tasks are due in the next 7 days — you are well ahead of schedule!`;

            const lines = endingSoon.slice(0, 10).map((t, i) =>
                `${i + 1}. **${t.title}** [${t.priority || 'Medium'}]` +
                `\n   Due: ${fmtDate(t.due_date || t.deadline)}` +
                `\n   Status: ${t.status || 'Pending'}` +
                (t.assigned_to_name ? `\n   Assigned to: ${t.assigned_to_name}` : '')
            );

            const extra = endingSoon.length > 10 ? `\n\n...and **${endingSoon.length - 10}** more.` : '';

            return `**Tasks Due Soon (${endingSoon.length})**\n\n${lines.join('\n\n')}${extra}\n\nDon't let these deadlines sneak up on you!`;
        }

        // ── PANEL SUMMARY (role-aware) ─────────────────────────────
        case 'summary': {
            const tasks = data?.tasks || [];
            const projects = data?.projects || [];
            const teamMembers = data?.members || [];
            const role = (userCtx?.role || '').toLowerCase();
            const name = userCtx?.userName?.split(' ')[0] || '';

            const panelLabel = role === 'admin' ? 'Admin Panel'
                : role === 'manager' ? 'Manager Panel'
                    : 'Member Panel';

            const byStatus = {};
            let overdueCount = 0;
            const now = new Date();
            tasks.forEach(t => {
                const s = (t.status || 'pending').toLowerCase();
                byStatus[s] = (byStatus[s] || 0) + 1;
                const d = t.due_date || t.deadline;
                if (d && new Date(d) < now && s !== 'done' && s !== 'completed') overdueCount++;
            });

            const criticalCount = tasks.filter(t => (t.priority || '').toLowerCase() === 'critical').length;
            const highCount = tasks.filter(t => (t.priority || '').toLowerCase() === 'high').length;

            const statusLines = Object.entries(byStatus)
                .map(([s, c]) => `  ${capitalize(s)}: **${c}**`)
                .join('\n');

            let summary = `**${panelLabel} Overview${name ? ' — ' + name : ''}**\n\n`;

            if (role === 'admin') {
                summary += `You have full system access. Current state:\n\n`;
                if (projects.length) summary += `Projects: **${projects.length}** total\n`;
                if (teamMembers.length) summary += `Users / Team Members: **${teamMembers.length}**\n`;
                summary += `Total Tasks: **${tasks.length}**\n`;
            } else if (role === 'manager') {
                summary += `You are managing your team's workload. Current state:\n\n`;
                if (projects.length) summary += `Your Projects: **${projects.length}** total\n`;
                if (teamMembers.length) summary += `Team Members: **${teamMembers.length}**\n`;
                summary += `Total Tasks: **${tasks.length}**\n`;
            } else {
                summary += `Your personal work summary:\n\n`;
                summary += `Tasks assigned to you: **${tasks.length}**\n`;
            }

            summary += `\n**Task Breakdown:**\n${statusLines || '  No tasks yet'}\n\n`;

            const alerts = [];
            if (overdueCount > 0) alerts.push(`${overdueCount} overdue task${overdueCount !== 1 ? 's' : ''} require attention`);
            if (criticalCount > 0) alerts.push(`${criticalCount} critical task${criticalCount !== 1 ? 's' : ''} need immediate focus`);
            if (highCount > 0) alerts.push(`${highCount} high-priority task${highCount !== 1 ? 's' : ''} are pending action`);

            if (alerts.length) {
                summary += `**Alerts:**\n${alerts.map(a => `  - ${a}`).join('\n')}\n\n`;
            } else {
                summary += `Everything looks on track — no critical alerts.\n\n`;
            }

            summary += `Ask me "overdue tasks", "high priority tasks", or "my projects" for more details.`;
            return summary;
        }

        // ── TEAM MEMBERS ───────────────────────────────────────────
        case 'team': {
            const members = data?.members || data || [];
            if (!members.length) return `No team members found.\n\nAdmins can add members from **User Management** in the admin panel.`;

            const lines = members.slice(0, 15).map((m, i) =>
                `${i + 1}. **${m.full_name || m.name}**` +
                (m.designation ? ` — ${m.designation}` : '') +
                (m.email ? `\n   ${m.email}` : '')
            );

            const extra = members.length > 15 ? `\n\n...and **${members.length - 15}** more members.` : '';

            return `**Team Members (${members.length})**\n\n${lines.join('\n\n')}${extra}`;
        }

        default:
            return null;
    }
}

// ─────────────────────────────────────────────────────────────────
// STATIC INTENT DEFINITIONS
// ─────────────────────────────────────────────────────────────────

const intents = [

    // ─── GREETINGS ───────────────────────────────────────────────
    {
        id: 'greeting',
        patterns: ['hello', 'hi', 'hey', 'good morning', 'good afternoon', 'good evening', 'howdy', 'hiya', 'sup', "what's up"],
        respond: (ctx) => {
            const hour = new Date().getHours();
            const timeGreeting = hour < 12 ? 'Good morning' : hour < 17 ? 'Good afternoon' : 'Good evening';
            const name = ctx.userName ? `, ${ctx.userName.split(' ')[0]}` : '';
            return pick([
                `${timeGreeting}${name}! 👋 I'm your TMS Assistant. I can help you with tasks, projects, team data, and more. What can I do for you?`,
                `Hey there${name}! 😊 How can I assist you today? I can fetch your current tasks, projects, and team data on the fly!`,
                `Hi${name}! Great to hear from you. Ask me things like "show my tasks", "what is overdue", or "high priority tasks"!`,
            ]);
        }
    },

    // ─── FAREWELL ────────────────────────────────────────────────
    {
        id: 'farewell',
        patterns: ['bye', 'goodbye', 'see you', 'later', 'take care', 'cya', 'farewell', 'good night', 'night'],
        respond: (ctx) => pick([
            `Goodbye! 👋 Come back anytime you need help with your tasks or projects.`,
            `See you later! Stay productive! 💪`,
            `Take care! Remember, I'm always here if you need task management assistance. 😊`,
            `Goodbye! Have a great day${ctx.userName ? ', ' + ctx.userName.split(' ')[0] : ''}! 🌟`,
        ])
    },

    // ─── THANKS ──────────────────────────────────────────────────
    {
        id: 'thanks',
        patterns: ['thank', 'thanks', 'thank you', 'thx', 'ty', 'appreciate', 'helpful', 'nice', 'awesome', 'great', 'perfect', 'good job', 'well done'],
        respond: () => pick([
            `You're welcome! 😊 Is there anything else I can help you with?`,
            `Happy to help! Let me know if you need anything else. 🤝`,
            `Glad I could assist! Feel free to ask me anything anytime. Try "show my tasks" or "what is overdue"!`,
        ])
    },

    // ─── HOW ARE YOU ─────────────────────────────────────────────
    {
        id: 'how_are_you',
        patterns: ['how are you', 'how do you do', 'how have you been', "how's it going", "you doing", "you ok"],
        respond: () => pick([
            `I'm doing great, thanks for asking! 😊 Ready to help — try asking me "show my tasks" or "any overdue items?"`,
            `All systems operational! 🤖 I can fetch your project and task data anytime. What do you need?`,
            `Fantastic! Just waiting to help you be more productive. What's on your agenda?`,
        ])
    },

    // ─── IDENTITY ────────────────────────────────────────────────
    {
        id: 'identity',
        patterns: ['who are you', 'what are you', 'your name', 'what can you do', 'what do you do', 'your capabilities', 'help me', 'what can i ask', 'your features'],
        respond: () => `I'm your **TMS Assistant** — built-in AI for your Task Management System! 🤖\n\n**I can fetch information directly from the DB:**\n📋 "Show my tasks"\n📁 "List my projects"\n🔴 "High priority tasks"\n⏳ "What is pending?"\n🔄 "Tasks in progress"\n⚠️ "Any overdue tasks?"\n📊 "Give me a summary"\n👥 "Show my team"\n\n**I also know how to:**\n• Explain all TMS features\n• Give productivity tips\n• Help with settings, roles, AI features\n• Answer general questions\n\nJust ask — I'll do my best!`
    },

    // ─── TASK: CREATE ────────────────────────────────────────────
    {
        id: 'task_create',
        patterns: ['create task', 'add task', 'new task', 'make a task', 'how to create', 'how do i add a task', 'task creation', 'adding task'],
        respond: (ctx) => {
            lastTopic = 'task_create';
            return `To **create a new task**, follow these steps:\n\n1. Navigate to **Global Tasks** in the sidebar\n2. Click **"Create Task"** (top right)\n3. Fill in:\n   - **Title** — clear and descriptive\n   - **Description** — what needs to be done\n   - **Priority** — Low / Medium / High / Critical\n   - **Deadline** — when it must be done\n   - **Assignee** — the team member responsible\n4. Click **Save**\n\n💡 Use the **AI Priority Predictor** to auto-suggest the right priority!`;
        }
    },

    // ─── TASK: ASSIGN ────────────────────────────────────────────
    {
        id: 'task_assign',
        patterns: ['assign task', 'assigning', 'how to assign', 'who to assign', 'assign to member', 'assign to developer', 'assign to tester', 'task assignment'],
        respond: () => {
            lastTopic = 'task_assign';
            return `**Assigning a Task:**\n\n1. Open the task from the Tasks list\n2. Click **"Assign"** or **"Edit"**\n3. Select a **team member** from the dropdown\n4. Optionally update **status** (Pending → In Progress)\n5. Save changes\n\n**Role-based assignment:**\n👨‍💻 **Developers** — implementation work\n🧪 **Testers** — assigned after developer marks "Completed"\n\n💡 Use **Smart Member Assignment** AI for workload-based recommendations!`;
        }
    },

    // ─── TASK STATUS ─────────────────────────────────────────────
    {
        id: 'task_status',
        patterns: ['task status', 'status of task', 'update status', 'change status', 'mark as done', 'mark complete', 'status workflow'],
        respond: () => {
            lastTopic = 'task_status';
            return `**Task Status Workflow:**\n\n⏳ **Pending** → 🔄 **In Progress** → ✅ **Completed** → 🧪 **Under Testing** → 🎉 **Done**\n\n**To update a status:**\n1. Open the task\n2. Click the Status dropdown\n3. Select the new status\n4. Save\n\n💡 Ask me "show tasks in progress" or "what is completed" to see current information!`;
        }
    },

    // ─── TASK PRIORITY INFO ───────────────────────────────────────
    {
        id: 'task_priority_info',
        patterns: ['how to set priority', 'what is priority', 'priority levels', 'what does priority mean', 'priority explained'],
        respond: () => `**Task Priority Levels:**\n\n🔴 **Critical** — Blocks other work, do immediately\n🟠 **High** — Important, complete within 1-2 days\n🟡 **Medium** — Standard, complete this sprint\n🟢 **Low** — Nice to have, when time allows\n\n💡 Ask "high priority tasks" to see your current urgent items!\n🤖 Or use the **AI Priority Predictor** when creating tasks.`
    },

    // ─── PROJECTS INFO ────────────────────────────────────────────
    {
        id: 'project_general',
        patterns: ['create project', 'new project', 'manage project', 'how to create project', 'project management', 'what is a project', 'how projects work'],
        respond: (ctx) => {
            lastTopic = 'project';
            const roleSpecific = ctx.role === 'admin'
                ? '\n\n👑 **As Admin:** Create, edit, delete any project and assign managers.'
                : ctx.role === 'manager'
                    ? '\n\n📋 **As Manager:** View assigned projects, create tasks within them, manage your team.'
                    : '\n\n👤 **As Member:** View your projects and tasks assigned to you.';
            return `**Project Management in TMS:**\n\n📁 Projects organize tasks and team work.\n\n**Key features:**\n• Assign managers and members\n• Track overall progress\n• Organize tasks by project\n• Monitor deadlines${roleSpecific}\n\nGo to **Projects** in the sidebar. Or ask me "show my projects"!`;
        }
    },

    // ─── TEAM / MEMBERS ──────────────────────────────────────────
    {
        id: 'team_roles',
        patterns: ['what is a developer', 'what is a tester', 'role explained', 'user roles', 'member designation', 'admin role', 'manager role'],
        respond: () => `**Team Roles in TMS:**\n\n👑 **Admin** — Full system access, manages users and projects\n📋 **Manager** — Creates projects & tasks, manages team\n👨‍💻 **Developer** — Works on assigned tasks, updates status\n🧪 **Tester** — QA testing on completed dev tasks\n\n**Member Designations:**\n• Developer • Tester • Designer • Analyst\n\nAdmins add users from the **User Management** section. Ask "show my team" to see current team info!`
    },

    // ─── DASHBOARD ───────────────────────────────────────────────
    {
        id: 'dashboard_info',
        patterns: ['dashboard', 'how to view dashboard', 'what is dashboard', 'dashboard explained'],
        respond: (ctx) => {
            const roleSpecific = ctx.role === 'admin'
                ? 'total users, all projects, all tasks, and system-wide activity.'
                : ctx.role === 'manager'
                    ? 'your assigned projects, task progress, team workload, and activity logs.'
                    : 'your assigned tasks, deadlines, and personal activity.';
            return `**Your Dashboard** shows a real-time overview of ${roleSpecific}\n\n**Dashboard widgets:**\n📊 Stats Cards — numbers at a glance\n📈 Progress Charts — completion trends\n🕐 Activity Feed — recent actions\n⚠️ Overdue Alerts — missed deadlines\n\nTip: Ask me "give me a summary" for a summary right here!`;
        }
    },

    // ─── ACTIVITY ────────────────────────────────────────────────
    {
        id: 'activity',
        patterns: ['activity', 'activity log', 'audit', 'history', 'logs', 'who did', 'track changes'],
        respond: () => `**Activity Log:**\n\nTracks every important action in TMS:\n\n✏️ Task created, updated, deleted\n👤 User added, role changed\n📁 Project created\n🔐 Login / logout events\n🔑 Password changes\n\n• Click **Activity Log** in the sidebar\n• Unread activities appear highlighted\n\n💡 Admins see system-wide activity; managers and members see their own panel logs.`
    },

    // ─── SETTINGS ────────────────────────────────────────────────
    {
        id: 'settings',
        patterns: ['settings', 'setting', 'profile', 'change password', 'theme', 'dark mode', 'light mode', 'color', 'appearance', 'account', 'update profile'],
        respond: () => `**Settings & Profile:**\n\n⚙️ Go to **"My Settings"** in the sidebar:\n\n👤 **Profile:** Update name & email\n🔐 **Security:** Change password\n🎨 **Appearance:**\n• Toggle Dark / Light mode\n• Choose accent: Blue, Purple, Green, Orange\n• Saved per panel (Admin/Manager/Member)\n\nAll settings save automatically!`
    },

    // ─── NOTIFICATIONS ───────────────────────────────────────────
    {
        id: 'notifications',
        patterns: ['notification', 'notifications', 'notify', 'alert', 'unread', 'bell', 'remind'],
        respond: () => `**Notifications:**\n\n🔔 The bell icon in the navbar shows real-time alerts:\n\n• New task assigned\n• Task status updated\n• Project changes\n• System announcements\n\nUnread = bright/bold. Clicking marks as read.\nViewing in one panel doesn't mark read in another (Admin vs Manager panel).`
    },

    // ─── PRODUCTIVITY ─────────────────────────────────────────────
    {
        id: 'productivity',
        patterns: ['tip', 'tips', 'productive', 'productivity', 'best practice', 'advice', 'suggestion', 'efficiency', 'organize'],
        respond: () => pick([
            `**Productivity Tips for TMS:** 🚀\n\n1. **Prioritize daily:** Start by asking me "high priority tasks"\n2. **Update statuses promptly:** Your team depends on it\n3. **Always set deadlines:** Creates accountability\n4. **Break large tasks:** Use subtasks for complex work\n5. **Check for overdue:** Ask me "any overdue tasks?" every morning\n6. **Use AI features:** Priority prediction & smart assignment save time`,
            `**Best Practices:** 💡\n\n• Write clear task titles ("Fix login bug" not "Bug")\n• Assign to ONE owner — shared ownership = confusion\n• Set realistic deadlines with buffer time\n• Comment when blocked, don't let tasks sit idle\n• Review your summary daily: ask me "give me a summary"`,
        ])
    },

    // ─── AI FEATURES ─────────────────────────────────────────────
    {
        id: 'ai_features',
        patterns: ['ai feature', 'artificial intelligence', 'machine learning', 'predict priority', 'ai priority', 'risk assessment', 'subtask generator', 'team mood'],
        respond: () => `**AI-Powered Features in TMS:** 🤖✨\n\n🎯 **Priority Predictor** — Auto-suggests priority from task title\n👥 **Smart Member Assignment** — Recommends best member by workload\n🌿 **Risk Assessment** — Evaluates risk based on member history\n📝 **Subtask Generator** — Creates a checklist from description\n😊 **Team Mood Analyzer** — Gauges team sentiment from patterns\n\nAll in the **Create Task** panel. Click the AI icons!`
    },

    // ─── DEADLINE INFO ────────────────────────────────────────────
    {
        id: 'deadline_info',
        patterns: ['how to set deadline', 'what is a deadline', 'deadline management', 'due date management'],
        respond: () => `**Managing Deadlines:**\n\n📅 Set deadlines when creating or editing tasks.\n\nOverdue tasks:\n• Highlighted in task list\n• Flagged on dashboard\n• Date turns red\n\n**Best practices:**\n• Always set realistic deadlines\n• Break large tasks into shorter deadlines\n• Ask me "overdue tasks" every morning for a quick check!\n\n⚠️ If you'll miss a deadline, update the task with a note.`
    },

    // ─── IMPORT / EXPORT ─────────────────────────────────────────
    {
        id: 'import_export',
        patterns: ['import', 'export', 'csv', 'bulk upload', 'import tasks', 'import projects'],
        respond: () => `**Import / Export:**\n\n📥 **Import tasks/projects in bulk:**\n1. Go to Tasks or Projects section\n2. Click **"Import"** button\n3. Upload a CSV file\n4. Review and confirm\n\n📤 **Export:** Download your data for reporting.\n\n**CSV columns for tasks:**\ntitle, description, priority, deadline, assignee`
    },

    // ─── PASSWORD ────────────────────────────────────────────────
    {
        id: 'password',
        patterns: ['password', 'forgot password', 'reset password', 'cant login', "can't login", 'login issue'],
        respond: () => `**Password Management:**\n\n🔑 **To change password:**\n1. Go to **My Settings** → Security\n2. Enter current password\n3. Set and confirm new password\n4. Save\n\n🆘 **Forgot password?**\n• Contact your Admin to reset your account\n• Admins use **User Management** to manage accounts\n\n💡 Use uppercase, lowercase, numbers, and symbols for a strong password!`
    },

    // ─── DATE & TIME ─────────────────────────────────────────────
    {
        id: 'datetime',
        patterns: ["what time", "what's the time", "what date", "today's date", "current time", "current date", "what day"],
        respond: () => {
            const now = new Date();
            const time = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
            const date = now.toLocaleDateString([], { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });
            return `🕐 It's **${time}** on **${date}**.\n\nAsk me "any overdue tasks?" to check your deadlines!`;
        }
    },

    // ─── MATH ────────────────────────────────────────────────────
    {
        id: 'math',
        patterns: ['calculate', 'what is 2+', 'plus', 'minus', 'multiply', 'divide', 'percentage'],
        respond: (ctx) => {
            try {
                const expr = ctx.message.replace(/[^0-9+\-*/.() ]/g, '').trim();
                if (expr) {
                    const result = Function('"use strict"; return (' + expr + ')')();
                    if (typeof result === 'number' && isFinite(result)) {
                        return `🔢 **${expr} = ${result}**\n\nAnything else I can help with?`;
                    }
                }
            } catch (e) { }
            return `I can do basic math! Try:\n• "5 + 3"\n• "100 / 4"\n• "25 * 8"`;
        }
    },

    // ─── JOKE ────────────────────────────────────────────────────
    {
        id: 'joke',
        patterns: ['joke', 'funny', 'make me laugh', 'tell me a joke'],
        respond: () => pick([
            `😄 Why do programmers prefer dark mode?\n\nBecause light attracts bugs! 🐛`,
            `😂 Why did the task manager quit?\n\nBecause he had too many unresolved issues!`,
            `🤣 How many project managers does it take to change a light bulb?\n\nNone — it's the developer's problem, and they'll estimate 2 hours but take 2 weeks! 😄`,
            `🤓 A SQL query walks into a bar…\n\n"WHERE are my JOIN tables?"`,
        ])
    },

    // ─── WEATHER ────────────────────────────────────────────────
    {
        id: 'weather',
        patterns: ['weather', 'temperature', 'rain', 'sunny', 'forecast'],
        respond: () => `⛅ I can't check the weather — I'm focused on task management!\n\nRainy day? Perfect time to clear that pending task backlog! 😊\n\nAsk me "what is pending" to see your tasks.`
    },

    // ─── FRUSTRATION ─────────────────────────────────────────────
    {
        id: 'frustration',
        patterns: ['not working', 'broken', 'error', 'issue', 'problem', "doesn't work", "won't work", 'fail', 'crash'],
        respond: () => pick([
            `I'm sorry to hear that! 😔\n\n**Quick fixes:**\n1. Refresh the page (Ctrl+R)\n2. Clear browser cache (Ctrl+Shift+Delete)\n3. Log out and back in\n4. Check XAMPP Apache + MySQL are running\n\nIf it persists, contact your administrator.`,
            `That sounds frustrating! Let me help. 🔧\n\n• **Page not loading?** → Check XAMPP is running\n• **Can't save?** → Check network connection\n• **Data not showing?** → Hard refresh (Ctrl+F5)\n• **Login issues?** → Ask admin to check your account`,
        ])
    },

    // ─── COMPLIMENT ──────────────────────────────────────────────
    {
        id: 'compliment',
        patterns: ['you are great', 'you are amazing', 'you are smart', 'love you', "you're the best", 'smart bot'],
        respond: () => pick([
            `Aww, thank you! 😊 How can I make your day even better?`,
            `That means a lot! 🤖💙 I'm here to make your TMS experience smooth!`,
            `You just made my circuits light up! 😄 Ask me "give me a summary" to see your live dashboard data!`,
        ])
    },

    // ─── CREATOR ─────────────────────────────────────────────────
    {
        id: 'creator',
        patterns: ['who made you', 'who created you', 'who built you', 'made by'],
        respond: () => `I was built specifically for this **Task Management System** as a built-in AI assistant. 🛠️\n\nI can answer questions AND fetch real-time data from your database — projects, tasks, team info and more!\n\nIs there something I can help you with today?`
    },

    // ─── REPORT ──────────────────────────────────────────────────
    {
        id: 'report',
        patterns: ['report', 'weekly report', 'monthly report', 'performance', 'how are we doing', 'team performance', 'status report'],
        respond: () => `**Current Overview:**\n\nAsk me directly and I'll pull current information:\n\n• "Give me a summary" → full overview\n• "Show overdue tasks" → what's late\n• "High priority tasks" → urgent items\n• "Tasks in progress" → active work\n• "Show my team" → team roster\n\nFor full analytics, check your **Dashboard** in the sidebar!`
    },

    // ─── ADMIN HELP ──────────────────────────────────────────────
    {
        id: 'admin_help',
        patterns: ['admin panel', 'admin access', 'admin functions', 'super admin'],
        respond: () => `**Admin Functions in TMS:**\n\n👑 Admins have full access to:\n• **User Management** — Add, edit, deactivate users\n• **All Projects** — View and manage every project\n• **Task Tracking** — Monitor all tasks system-wide\n• **Activity Log** — System-wide audit trail\n\nAre you an admin looking for help with a specific function?`
    },
];

// ─────────────────────────────────────────────────────────────────
// FALLBACK RESPONSES
// ─────────────────────────────────────────────────────────────────
const fallbacks = [
    () => `I'm not quite sure I understood that. I can help with:\n\n• **DB Queries:** "show my tasks", "overdue tasks", "my projects"\n• **How-to guides:** "how to create a task", "how to assign"\n• **Tips:** "give me productivity tips"\n• **Summary:** "give me a summary"\n\nWhat are you looking for? 🤔`,
    () => `Hmm, could you rephrase that? I'm best at TMS-related topics.\n\nTry:\n• "Show high priority tasks"\n• "What projects do I have?"\n• "Any overdue items?"\n• "How do I create a task?"`,
    () => `I didn't catch that. As a TMS specialist, I can fetch live data and explain features.\n\nTry asking: "give me a summary" for a live overview right now!`,
];

// ─────────────────────────────────────────────────────────────────
// CONTEXT FOLLOW-UPS
// ─────────────────────────────────────────────────────────────────
const contextualFollowUps = {
    task_create: () => `**More on Task Creation:**\n\n📌 **Advanced fields:**\n• Subtasks — break into smaller steps\n• Notes — add comments/updates\n\n🤖 **AI features available:**\n• Auto-generate subtasks from description\n• AI priority suggestion\n• Smart member assignment by workload`,
    task_assign: () => `**After Assigning a Task:**\n\nThe assigned member sees it in their "My Tasks" view.\n\nThey can:\n• Update status as they progress\n• Add notes/comments\n• Mark as Complete\n\nYou can monitor from **Global Tasks** view.`,
    task_status: () => `**Status Flow Detail:**\n\nPending → In Progress → Completed → Under Testing → Done\n\nWhen a Developer marks "Completed", the Manager can assign to a Tester.\nThe tester marks "Done" or sends back for fixes.`,
    project: () => `**Project Best Practices:**\n\n1. Clear, meaningful project names\n2. Set a realistic overall deadline\n3. Create tasks immediately after creation\n4. Assign a dedicated manager\n5. Review weekly from the dashboard\n6. Archive completed projects`,
    tasks_overdue: () => `**Handling Overdue Tasks:**\n\n1. Open each overdue task\n2. Update the deadline if needed\n3. Add a note explaining the delay\n4. Reassign if the current owner is blocked\n5. Communicate with your team\n\nAlways keep overdue tasks at 0 for a healthy project!`,
    tasks_high_priority: () => `**Managing High Priority Tasks:**\n\n• Assign to your most available developer\n• Check status daily\n• Break into subtasks if too large\n• Set a near-term deadline\n• Escalate to admin if blocked`,
};

// ─────────────────────────────────────────────────────────────────
// MAIN ENGINE FUNCTION (for static/general queries)
// ─────────────────────────────────────────────────────────────────

export function processMessage(message, userContext = {}) {
    const text = message.toLowerCase().trim();
    const ctx = { ...userContext, message: text };

    // Handle follow-ups
    if (includes(text, 'yes', 'more', 'tell me more', 'go on', 'continue', 'elaborate', 'details', 'explain more', 'what else', 'and?')) {
        if (lastTopic && contextualFollowUps[lastTopic]) {
            return contextualFollowUps[lastTopic]();
        }
    }

    // Find best matching intent
    let bestMatch = null;
    let bestScore = 0;

    for (const intent of intents) {
        let score = 0;
        for (const pattern of intent.patterns) {
            if (text.includes(pattern)) {
                score += pattern.length;
            }
        }
        if (score > bestScore) {
            bestScore = score;
            bestMatch = intent;
        }
    }

    if (bestMatch && bestScore > 0) {
        lastTopic = bestMatch.id;
        return bestMatch.respond(ctx);
    }

    lastTopic = null;
    return pick(fallbacks)(ctx);
}

export function getTypingDelay(response) {
    const words = response.split(' ').length;
    return Math.min(words * 45, 2200) + Math.random() * 250;
}

export function resetContext() {
    lastTopic = null;
}
