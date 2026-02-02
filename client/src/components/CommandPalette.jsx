import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { API_URL } from '../config';
import {
    Search,
    FileText,
    FolderKanban,
    Users,
    Package,
    ArrowRight,
    Command,
    X,
    Clock,
    Sparkles
} from 'lucide-react';

const CommandPalette = ({ isOpen, onClose }) => {
    const navigate = useNavigate();
    const [query, setQuery] = useState('');
    const [results, setResults] = useState([]);
    const [isLoading, setIsLoading] = useState(false);
    const [selectedIndex, setSelectedIndex] = useState(0);
    const inputRef = useRef(null);

    const recentSearches = [
        { type: 'quotation', label: 'Recent Quotations', path: '/quotations' },
        { type: 'project', label: 'Active Projects', path: '/projects' },
        { type: 'client', label: 'All Clients', path: '/clients' },
    ];

    const quickActions = [
        { icon: FileText, label: 'New Quotation', path: '/quotations', action: 'new-quotation' },
        { icon: FolderKanban, label: 'New Project', path: '/projects', action: 'new-project' },
        { icon: Users, label: 'Add Client', path: '/clients', action: 'new-client' },
        { icon: Package, label: 'Add Material', path: '/materials', action: 'new-material' },
    ];

    useEffect(() => {
        if (isOpen && inputRef.current) {
            inputRef.current.focus();
            setQuery('');
            setResults([]);
            setSelectedIndex(0);
        }
    }, [isOpen]);

    useEffect(() => {
        const handleKeyDown = (e) => {
            if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
                e.preventDefault();
                if (!isOpen) {
                    document.dispatchEvent(new CustomEvent('open-command-palette'));
                }
            }
            if (e.key === 'Escape' && isOpen) {
                onClose();
            }
        };
        document.addEventListener('keydown', handleKeyDown);
        return () => document.removeEventListener('keydown', handleKeyDown);
    }, [isOpen, onClose]);

    const searchAll = useCallback(async (searchQuery) => {
        if (!searchQuery.trim()) {
            setResults([]);
            return;
        }

        setIsLoading(true);
        try {
            const token = localStorage.getItem('token');
            if (!token) return;

            const [quotationsRes, projectsRes, clientsRes, materialsRes] = await Promise.allSettled([
                axios.get(`${API_URL}/quotations`, { headers: { Authorization: `Bearer ${token}` } }),
                axios.get(`${API_URL}/projects`, { headers: { Authorization: `Bearer ${token}` } }),
                axios.get(`${API_URL}/clients`, { headers: { Authorization: `Bearer ${token}` } }),
                axios.get(`${API_URL}/materials`, { headers: { Authorization: `Bearer ${token}` } })
            ]);

            const allResults = [];
            const q = searchQuery.toLowerCase();

            if (quotationsRes.status === 'fulfilled') {
                quotationsRes.value.data
                    .filter(item => item.title?.toLowerCase().includes(q) || item.client_name?.toLowerCase().includes(q))
                    .slice(0, 3)
                    .forEach(item => allResults.push({
                        type: 'quotation',
                        icon: FileText,
                        label: item.title,
                        sublabel: item.client_name,
                        path: `/quotations/${item.id}`
                    }));
            }

            if (projectsRes.status === 'fulfilled') {
                projectsRes.value.data
                    .filter(item => item.name?.toLowerCase().includes(q) || item.client_name?.toLowerCase().includes(q))
                    .slice(0, 3)
                    .forEach(item => allResults.push({
                        type: 'project',
                        icon: FolderKanban,
                        label: item.name,
                        sublabel: item.client_name,
                        path: `/projects/${item.id}`
                    }));
            }

            if (clientsRes.status === 'fulfilled') {
                clientsRes.value.data
                    .filter(item => item.name?.toLowerCase().includes(q) || item.email?.toLowerCase().includes(q))
                    .slice(0, 3)
                    .forEach(item => allResults.push({
                        type: 'client',
                        icon: Users,
                        label: item.name,
                        sublabel: item.email,
                        path: `/clients/${item.id}`
                    }));
            }

            if (materialsRes.status === 'fulfilled') {
                materialsRes.value.data
                    .filter(item => item.name?.toLowerCase().includes(q) || item.category?.toLowerCase().includes(q))
                    .slice(0, 3)
                    .forEach(item => allResults.push({
                        type: 'material',
                        icon: Package,
                        label: item.name,
                        sublabel: item.category,
                        path: '/materials'
                    }));
            }

            setResults(allResults);
            setSelectedIndex(0);
        } catch (err) {
            console.error('Search error:', err);
        } finally {
            setIsLoading(false);
        }
    }, []);

    useEffect(() => {
        const timer = setTimeout(() => searchAll(query), 200);
        return () => clearTimeout(timer);
    }, [query, searchAll]);

    const handleSelect = (item) => {
        navigate(item.path);
        onClose();
    };

    const handleKeyNav = (e) => {
        const items = query ? results : quickActions;
        if (e.key === 'ArrowDown') {
            e.preventDefault();
            setSelectedIndex(prev => (prev + 1) % items.length);
        } else if (e.key === 'ArrowUp') {
            e.preventDefault();
            setSelectedIndex(prev => (prev - 1 + items.length) % items.length);
        } else if (e.key === 'Enter' && items[selectedIndex]) {
            handleSelect(items[selectedIndex]);
        }
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-[100] flex items-start justify-center pt-[15vh]" onClick={onClose}>
            <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" />

            <div
                className="relative w-full max-w-xl bg-white rounded-2xl shadow-2xl overflow-hidden animate-fade-in-up"
                onClick={e => e.stopPropagation()}
            >
                {/* Search Input */}
                <div className="flex items-center gap-3 px-5 py-4 border-b border-[var(--color-border)]">
                    <Search className="w-5 h-5 text-[var(--color-text-muted)]" />
                    <input
                        ref={inputRef}
                        type="text"
                        value={query}
                        onChange={e => setQuery(e.target.value)}
                        onKeyDown={handleKeyNav}
                        placeholder="Search quotations, projects, clients..."
                        className="flex-1 bg-transparent text-[var(--color-text-primary)] placeholder:text-[var(--color-text-muted)] focus:outline-none text-base"
                    />
                    <div className="flex items-center gap-1.5 text-xs text-[var(--color-text-muted)]">
                        <kbd className="px-1.5 py-0.5 bg-stone-100 rounded text-[10px] font-medium">ESC</kbd>
                    </div>
                </div>

                {/* Results */}
                <div className="max-h-[50vh] overflow-y-auto">
                    {isLoading ? (
                        <div className="p-8 text-center text-[var(--color-text-muted)]">
                            <div className="w-6 h-6 border-2 border-[var(--color-accent)] border-t-transparent rounded-full animate-spin mx-auto" />
                        </div>
                    ) : query && results.length > 0 ? (
                        <div className="p-2">
                            <p className="px-3 py-2 text-xs font-medium text-[var(--color-text-muted)] uppercase tracking-wider">
                                Results
                            </p>
                            {results.map((item, idx) => (
                                <button
                                    key={`${item.type}-${idx}`}
                                    onClick={() => handleSelect(item)}
                                    className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-left transition-colors ${selectedIndex === idx
                                        ? 'bg-[var(--color-accent)]/10 text-[var(--color-accent)]'
                                        : 'hover:bg-stone-50 text-[var(--color-text-primary)]'
                                        }`}
                                >
                                    <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${selectedIndex === idx ? 'bg-[var(--color-accent)] text-white' : 'bg-stone-100 text-stone-500'
                                        }`}>
                                        <item.icon className="w-4 h-4" />
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <p className="font-medium text-sm truncate">{item.label}</p>
                                        {item.sublabel && (
                                            <p className="text-xs text-[var(--color-text-muted)] truncate">{item.sublabel}</p>
                                        )}
                                    </div>
                                    <span className="text-[10px] px-2 py-0.5 bg-stone-100 rounded-full capitalize">
                                        {item.type}
                                    </span>
                                </button>
                            ))}
                        </div>
                    ) : query && results.length === 0 ? (
                        <div className="p-8 text-center text-[var(--color-text-muted)]">
                            <Search className="w-8 h-8 mx-auto mb-2 opacity-30" />
                            <p>No results for "{query}"</p>
                        </div>
                    ) : (
                        <div className="p-2">
                            <p className="px-3 py-2 text-xs font-medium text-[var(--color-text-muted)] uppercase tracking-wider">
                                Quick Actions
                            </p>
                            {quickActions.map((action, idx) => (
                                <button
                                    key={action.label}
                                    onClick={() => handleSelect(action)}
                                    className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-left transition-colors ${selectedIndex === idx
                                        ? 'bg-[var(--color-accent)]/10 text-[var(--color-accent)]'
                                        : 'hover:bg-stone-50 text-[var(--color-text-primary)]'
                                        }`}
                                >
                                    <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${selectedIndex === idx ? 'bg-[var(--color-accent)] text-white' : 'bg-stone-100 text-stone-500'
                                        }`}>
                                        <action.icon className="w-4 h-4" />
                                    </div>
                                    <span className="font-medium text-sm">{action.label}</span>
                                    <ArrowRight className="w-4 h-4 ml-auto opacity-30" />
                                </button>
                            ))}
                        </div>
                    )}
                </div>

                {/* Footer */}
                <div className="px-4 py-3 bg-stone-50 border-t border-[var(--color-border)] flex items-center justify-between text-xs text-[var(--color-text-muted)]">
                    <div className="flex items-center gap-3">
                        <span className="flex items-center gap-1">
                            <kbd className="px-1.5 py-0.5 bg-white rounded border text-[10px]">↑</kbd>
                            <kbd className="px-1.5 py-0.5 bg-white rounded border text-[10px]">↓</kbd>
                            Navigate
                        </span>
                        <span className="flex items-center gap-1">
                            <kbd className="px-1.5 py-0.5 bg-white rounded border text-[10px]">↵</kbd>
                            Select
                        </span>
                    </div>
                    <span className="flex items-center gap-1">
                        <Sparkles className="w-3 h-3" />
                        DesignFlow
                    </span>
                </div>
            </div>
        </div>
    );
};

export default CommandPalette;
