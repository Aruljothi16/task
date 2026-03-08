import React, { useState, useRef, useEffect, useCallback } from 'react';
import { useAuth } from '../../context/AuthContext';
import {
    Send, X, Bot, User, Minus, Maximize2, Trash2, Sparkles,
    BarChart2, AlertTriangle, Clock, FolderOpen, Lightbulb, Zap, AlertCircle
} from 'lucide-react';
import {
    processMessage,
    detectDataIntent,
    formatLiveResponse,
    getTypingDelay,
    resetContext,
} from '../../services/chatEngine';
import api from '../../services/api';
import './ChatBot.css';

// ── Quick suggestions (no emojis — use lucide icons) ─────────────
const QUICK_SUGGESTIONS = [
    { Icon: BarChart2, label: 'Panel Summary', query: 'give me a summary' },
    { Icon: AlertCircle, label: 'Overdue Projects', query: 'show overdue projects' },
    { Icon: Clock, label: 'Projects Ending Soon', query: 'projects near due' },
    { Icon: AlertTriangle, label: 'Overdue Tasks', query: 'overdue tasks' },
    { Icon: Zap, label: 'Tasks Ending Soon', query: 'tasks near due' },
    { Icon: FolderOpen, label: 'List All Projects', query: 'list projects' },
];

// ── Fetch live data from DB ───────────────────────────────────────
async function fetchDataForIntent(intent) {
    try {
        switch (intent) {
            case 'projects':
            case 'projects_overdue':
            case 'projects_ending_soon': {
                const res = await api.get('/api/projects/list.php');
                return { projects: res.data?.projects || [] };
            }
            case 'tasks':
            case 'tasks_high_priority':
            case 'tasks_pending':
            case 'tasks_in_progress':
            case 'tasks_completed':
            case 'tasks_overdue':
            case 'tasks_ending_soon': {
                const res = await api.get('/api/tasks/list.php');
                return { tasks: res.data?.tasks || [] };
            }
            case 'summary': {
                const [tasksRes, projectsRes] = await Promise.allSettled([
                    api.get('/api/tasks/list.php'),
                    api.get('/api/projects/list.php'),
                ]);
                let members = [];
                try {
                    const membersRes = await api.get('/api/tasks/members.php');
                    members = membersRes.data?.members || membersRes.data?.users || [];
                } catch (_) { }
                return {
                    tasks: tasksRes.status === 'fulfilled' ? (tasksRes.value.data?.tasks || []) : [],
                    projects: projectsRes.status === 'fulfilled' ? (projectsRes.value.data?.projects || []) : [],
                    members,
                };
            }
            case 'team': {
                const res = await api.get('/api/tasks/members.php');
                return { members: res.data?.members || res.data?.users || [] };
            }
            default:
                return null;
        }
    } catch (err) {
        console.error('ChatBot fetch error:', err);
        return null;
    }
}

// ─────────────────────────────────────────────────────────────────
// CONFIRM DIALOG COMPONENT
// ─────────────────────────────────────────────────────────────────
const ConfirmDialog = ({ onConfirm, onCancel }) => (
    <div className="chat-confirm-overlay">
        <div className="chat-confirm-box">
            <div className="chat-confirm-icon">
                <Trash2 size={22} />
            </div>
            <h4 className="chat-confirm-title">Clear Chat History?</h4>
            <p className="chat-confirm-body">
                This will permanently remove all messages in this conversation. This action cannot be undone.
            </p>
            <div className="chat-confirm-actions">
                <button className="chat-confirm-cancel" onClick={onCancel}>Cancel</button>
                <button className="chat-confirm-ok" onClick={onConfirm}>Clear History</button>
            </div>
        </div>
    </div>
);

// ─────────────────────────────────────────────────────────────────
// MAIN CHATBOT COMPONENT
// ─────────────────────────────────────────────────────────────────
const ChatBot = () => {
    const { user } = useAuth();
    const [isOpen, setIsOpen] = useState(false);
    const [isMinimized, setIsMinimized] = useState(false);
    const [messages, setMessages] = useState([]);
    const [input, setInput] = useState('');
    const [isTyping, setIsTyping] = useState(false);
    const [isFetching, setIsFetching] = useState(false);
    const [showSuggestions, setShowSuggestions] = useState(true);
    const [showConfirm, setShowConfirm] = useState(false);
    const messagesEndRef = useRef(null);
    const inputRef = useRef(null);

    const historyKey = `tms_chat_history_${user?.id || 'guest'}`;

    // ── Load history ──────────────────────────────────────────────
    useEffect(() => {
        const saved = localStorage.getItem(historyKey);
        if (saved) {
            try {
                const parsed = JSON.parse(saved);
                const withDates = parsed.map(m => ({ ...m, time: new Date(m.time) }));
                setMessages(withDates);
                setShowSuggestions(withDates.length <= 1);
            } catch {
                setInitialMessage();
            }
        } else {
            setInitialMessage();
        }
    }, [user?.id]);

    // ── Build welcome message ─────────────────────────────────────
    const setInitialMessage = useCallback(() => {
        const hour = new Date().getHours();
        const greeting = hour < 12 ? 'Good morning' : hour < 17 ? 'Good afternoon' : 'Good evening';
        const name = user?.full_name?.split(' ')[0] || '';
        const panel = user?.role === 'admin' ? 'Admin' : user?.role === 'manager' ? 'Manager' : 'Member';
        setMessages([{
            id: Date.now(),
            text: `${greeting}${name ? ', ' + name : ''}! I am your TMS Assistant for the **${panel} Panel**.\n\nI can answer questions and retrieve information directly from the database. Use the quick actions below or type anything to get started.`,
            sender: 'ai',
            time: new Date(),
        }]);
        setShowSuggestions(true);
        resetContext();
    }, [user?.full_name, user?.role]);

    // ── Persist history ───────────────────────────────────────────
    useEffect(() => {
        if (messages.length > 0) {
            localStorage.setItem(historyKey, JSON.stringify(messages));
        }
    }, [messages, historyKey]);

    // ── Auto-focus input ─────────────────────────────────────────
    useEffect(() => {
        if (isOpen && !isMinimized) {
            setTimeout(() => inputRef.current?.focus(), 120);
        }
    }, [isOpen, isMinimized]);

    // ── Scroll to bottom ──────────────────────────────────────────
    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages, isTyping, isFetching, showConfirm, isOpen, isMinimized]);

    // ── Core send message handler ─────────────────────────────────
    const sendMessage = useCallback(async (text) => {
        if (!text?.trim()) return;
        const trimmed = text.trim();

        const userMsg = { id: Date.now(), text: trimmed, sender: 'user', time: new Date() };
        setMessages(prev => [...prev, userMsg]);
        setInput('');
        setShowSuggestions(false);

        const ctx = {
            userName: user?.full_name,
            role: user?.role,
            page: window.location.pathname,
            message: trimmed.toLowerCase(),
        };

        setIsFetching(true);

        // ── Step 1: Try the Python NLP server (real understanding + live DB) ──
        let pythonHandled = false;
        try {
            const res = await fetch('http://localhost:8001/chat', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    message: trimmed,
                    role: user?.role || 'member',
                    user_id: user?.id || null,
                    user_name: user?.full_name || '',
                    context: { page: window.location.pathname },
                }),
                signal: AbortSignal.timeout(8000),   // 8 s timeout
            });

            if (res.ok) {
                const data = await res.json();
                if (data?.response) {
                    pythonHandled = true;
                    setIsFetching(false);
                    setIsTyping(true);
                    await new Promise(r => setTimeout(r, 400 + Math.random() * 300));
                    setIsTyping(false);
                    setMessages(prev => [...prev, {
                        id: Date.now() + 1,
                        text: data.response,
                        sender: 'ai',
                        time: new Date(),
                        isLive: data.is_live === true,
                    }]);
                    return;
                }
            }
        } catch (_) {
            // Python server offline — silently fall through to local engine
        }

        // ── Step 2: Fallback A — local data intent fetch (offline DB) ─────
        if (!pythonHandled) {
            const dataIntent = detectDataIntent(trimmed);
            if (dataIntent) {
                let liveData = null;
                try {
                    liveData = await fetchDataForIntent(dataIntent);
                } catch (_) { }
                setIsFetching(false);

                if (liveData) {
                    const liveReply = formatLiveResponse(dataIntent, liveData, ctx);
                    setIsTyping(true);
                    await new Promise(r => setTimeout(r, 450 + Math.random() * 300));
                    setIsTyping(false);
                    setMessages(prev => [...prev, {
                        id: Date.now() + 1,
                        text: liveReply,
                        sender: 'ai',
                        time: new Date(),
                        isLive: true,
                    }]);
                    return;
                }

                // Fetch failed
                setMessages(prev => [...prev, {
                    id: Date.now() + 1,
                    text: 'I was unable to fetch data from the server right now. Please ensure the backend (XAMPP Apache and MySQL) is running, then try again.',
                    sender: 'ai',
                    time: new Date(),
                }]);
                return;
            }

            // ── Step 3: Fallback B — static built-in knowledge engine ────────
            setIsFetching(false);
            setIsTyping(true);
            const reply = processMessage(trimmed, ctx);
            await new Promise(r => setTimeout(r, getTypingDelay(reply)));
            setIsTyping(false);
            setMessages(prev => [...prev, {
                id: Date.now() + 2,
                text: reply,
                sender: 'ai',
                time: new Date(),
            }]);
        }
    }, [user]);

    const handleSubmit = (e) => { e.preventDefault(); sendMessage(input); };
    const handleChip = (s) => sendMessage(s.query);

    const confirmClear = () => {
        localStorage.removeItem(historyKey);
        setInitialMessage();
        setShowConfirm(false);
    };

    // ── Render **bold** markdown ──────────────────────────────────
    const formatText = (text) =>
        text.split('\n').map((line, i, arr) => {
            const parts = line.split(/\*\*(.*?)\*\*/g);
            const formatted = parts.map((p, j) => j % 2 === 1 ? <strong key={j}>{p}</strong> : p);
            return (
                <React.Fragment key={i}>
                    {formatted}
                    {i < arr.length - 1 && <br />}
                </React.Fragment>
            );
        });

    // ─────────────────────────────────────────────────────────────
    // TRIGGER BUTTON (chat closed)
    // ─────────────────────────────────────────────────────────────
    if (!isOpen) {
        return (
            <button onClick={() => setIsOpen(true)} className="chatbot-trigger" title="TMS AI Assistant" aria-label="Open AI Assistant">
                <div className="trigger-icon-wrapper">
                    <Bot size={26} />
                    <Sparkles size={12} className="sparkle-icon" />
                </div>
                <span className="chatbot-status-dot" />
            </button>
        );
    }

    // ─────────────────────────────────────────────────────────────
    // CHAT WINDOW
    // ─────────────────────────────────────────────────────────────
    return (
        <div className={`chatbot-container ${isMinimized ? 'minimized' : ''}`} role="dialog" aria-label="TMS AI Assistant">

            {/* Custom confirm dialog */}
            {showConfirm && (
                <ConfirmDialog
                    onConfirm={confirmClear}
                    onCancel={() => setShowConfirm(false)}
                />
            )}

            {/* ── HEADER ── */}
            <div className="chatbot-header">
                <div className="chatbot-header-info">
                    <div className="chatbot-avatar">
                        <Bot size={18} />
                    </div>
                    <div>
                        <h3>TMS Assistant</h3>
                        <span className="status-online">
                            <Zap size={8} style={{ marginRight: '3px' }} />
                            System Connected
                        </span>
                    </div>
                </div>
                <div className="chatbot-header-actions">
                    <button onClick={() => setShowConfirm(true)} title="Clear History" className="action-btn" aria-label="Clear history">
                        <Trash2 size={15} />
                    </button>
                    <button onClick={() => setIsMinimized(p => !p)} className="action-btn" aria-label={isMinimized ? 'Maximize' : 'Minimize'}>
                        {isMinimized ? <Maximize2 size={15} /> : <Minus size={15} />}
                    </button>
                    <button onClick={() => setIsOpen(false)} className="action-btn close" aria-label="Close">
                        <X size={15} />
                    </button>
                </div>
            </div>

            {/* ── MESSAGES + INPUT ── */}
            {!isMinimized && (
                <>
                    <div className="chatbot-messages">

                        {/* Render messages */}
                        {messages.map((msg) => (
                            <div key={msg.id} className={`message-wrapper ${msg.sender}`}>
                                <div className="message-icon">
                                    {msg.sender === 'ai' ? <Bot size={13} /> : <User size={13} />}
                                </div>
                                <div className={`message-content ${msg.isLive ? 'live-data' : ''}`}>
                                    {/* removed live badge */}
                                    <p>{formatText(msg.text)}</p>
                                    <span className="message-time">
                                        {(msg.time instanceof Date ? msg.time : new Date(msg.time))
                                            .toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                    </span>
                                </div>
                            </div>
                        ))}

                        {/* DB fetching indicator */}
                        {isFetching && (
                            <div className="message-wrapper ai">
                                <div className="message-icon"><Bot size={13} /></div>
                                <div className="message-content loading">
                                    <div className="fetching-indicator">
                                        <span>.....</span>
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* Typing dots */}
                        {isTyping && !isFetching && (
                            <div className="message-wrapper ai">
                                <div className="message-icon"><Bot size={13} /></div>
                                <div className="message-content loading">
                                    <div className="typing-dots">
                                        <div className="dot" /><div className="dot" /><div className="dot" />
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* Quick action chips */}
                        {showSuggestions && !isTyping && !isFetching && (
                            <div className="suggestion-chips">
                                <p className="suggestion-label">Quick actions</p>
                                {QUICK_SUGGESTIONS.map(({ Icon, label, query }, i) => (
                                    <button key={i} className="chip" onClick={() => handleChip({ query })}>
                                        <Icon size={13} className="chip-icon" />
                                        {label}
                                    </button>
                                ))}
                            </div>
                        )}

                        <div ref={messagesEndRef} />
                    </div>

                    {/* ── INPUT BAR ── */}
                    <form className="chatbot-input" onSubmit={handleSubmit}>
                        <div className="input-wrapper">
                            <input
                                ref={inputRef}
                                type="text"
                                placeholder={isFetching ? 'Fetching data from database...' : 'Ask me anything...'}
                                value={input}
                                onChange={(e) => setInput(e.target.value)}
                                disabled={isTyping || isFetching}
                                aria-label="Chat message"
                            />
                            <button
                                type="submit"
                                disabled={!input.trim() || isTyping || isFetching}
                                className="send-btn"
                                aria-label="Send"
                            >
                                <Send size={16} />
                            </button>
                        </div>
                    </form>
                </>
            )}
        </div>
    );
};

export default ChatBot;
