import React, { useEffect, useMemo, useState } from 'react';
import { v4 as uuidv4 } from 'uuid';
import { dbService } from '../services/dbService';
import { AppSettings } from '../types';

type NoteColor = 'yellow' | 'blue' | 'green' | 'pink' | 'purple' | 'gray';
type NotePriority = 'high' | 'medium' | 'low';

interface TodoItem {
  id: string;
  text: string;
  completed: boolean;
}

interface Course {
  id: string;
  name: string;
  color: string;
}

interface StudyNote {
  id: string;
  title: string;
  content: string;
  color: NoteColor;
  pinned: boolean;
  priority: NotePriority;
  dueDate?: string | null;
  reminder?: string | null;
  courseId?: string | null;
  todoItems?: TodoItem[];
  updatedAt: number;
  createdAt: number;
}

interface StoredNotes {
  notes: StudyNote[];
  courses: Course[];
  selectedCourseId?: string;
}

interface StudyNotesProps {
  currentUser: string;
  settings: AppSettings;
  initialDraft?: { title?: string; content?: string };
}

const COLORS: { key: NoteColor; label: string; bg: string }[] = [
  { key: 'yellow', label: 'Yellow', bg: 'bg-yellow-100 text-yellow-900' },
  { key: 'blue', label: 'Blue', bg: 'bg-blue-100 text-blue-900' },
  { key: 'green', label: 'Green', bg: 'bg-green-100 text-green-900' },
  { key: 'pink', label: 'Pink', bg: 'bg-pink-100 text-pink-900' },
  { key: 'purple', label: 'Purple', bg: 'bg-purple-100 text-purple-900' },
  { key: 'gray', label: 'Gray', bg: 'bg-gray-200 text-gray-900' }
];

const PRIORITIES: { key: NotePriority; label: string; badge: string }[] = [
  { key: 'high', label: 'High', badge: 'bg-red-100 text-red-800' },
  { key: 'medium', label: 'Medium', badge: 'bg-yellow-100 text-yellow-800' },
  { key: 'low', label: 'Low', badge: 'bg-green-100 text-green-800' }
];

const StudyNotes: React.FC<StudyNotesProps> = ({ currentUser, settings, initialDraft }) => {
  const [notes, setNotes] = useState<StudyNote[]>([]);
  const [courses, setCourses] = useState<Course[]>([]);
  const [selectedCourseId, setSelectedCourseId] = useState<string>('all');
  const [search, setSearch] = useState('');
  const [filterColor, setFilterColor] = useState<'all' | NoteColor>('all');
  const [showPinnedOnly, setShowPinnedOnly] = useState(false);
  const [editing, setEditing] = useState<StudyNote | null>(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [todoDraft, setTodoDraft] = useState('');
  const [noteTheme, setNoteTheme] = useState<'auto' | 'light' | 'dark' | 'tron' | 'matrix'>('auto');

  const isTron = settings.theme === 'tron';
  const isMatrix = settings.matrixMode;

  const storageKey = useMemo(() => `study_notes_${currentUser}`, [currentUser]);

  useEffect(() => {
    const load = async () => {
      try {
        const stored = await dbService.getSetting(storageKey);
        if (Array.isArray(stored)) {
          setNotes(stored);
          setCourses([]);
          setSelectedCourseId('all');
        } else if (stored && typeof stored === 'object') {
          const data = stored as StoredNotes;
          setNotes(Array.isArray(data.notes) ? data.notes : []);
          setCourses(Array.isArray(data.courses) ? data.courses : []);
          setSelectedCourseId(data.selectedCourseId || 'all');
        } else {
          setNotes([]);
          setCourses([]);
          setSelectedCourseId('all');
        }
      } catch (e) {
        console.warn('Failed to load study notes', e);
        setNotes([]);
        setCourses([]);
        setSelectedCourseId('all');
      }
    };
    load();
  }, [storageKey]);

  useEffect(() => {
    const loadTheme = async () => {
      const storedTheme = await dbService.getSetting(`${storageKey}_theme`);
      if (storedTheme && typeof storedTheme === 'string') {
        setNoteTheme(storedTheme as any);
      }
    };
    loadTheme();
  }, [storageKey]);

  useEffect(() => {
    if (initialDraft && (initialDraft.title || initialDraft.content)) {
      setEditing({
        id: '',
        title: initialDraft.title || '',
        content: initialDraft.content || '',
        color: 'yellow',
        pinned: false,
        priority: 'medium',
        reminder: null,
        courseId: selectedCourseId === 'all' ? null : selectedCourseId,
        todoItems: [],
        createdAt: Date.now(),
        updatedAt: Date.now()
      });
      setModalOpen(true);
    }
  }, [initialDraft, selectedCourseId]);

  const persist = async (next: StudyNote[], nextCourses = courses, selected = selectedCourseId) => {
    setNotes(next);
    setCourses(nextCourses);
    setSelectedCourseId(selected);
    const payload: StoredNotes = { notes: next, courses: nextCourses, selectedCourseId: selected };
    await dbService.saveSetting(storageKey, payload);
  };

  const openNew = () => {
    setEditing({
      id: '',
      title: '',
      content: '',
      color: 'yellow',
      pinned: false,
      priority: 'medium',
      reminder: null,
      courseId: selectedCourseId === 'all' ? null : selectedCourseId,
      todoItems: [],
      createdAt: Date.now(),
      updatedAt: Date.now()
    });
    setModalOpen(true);
    setError(null);
    setTodoDraft('');
  };

  const openEdit = (note: StudyNote) => {
    setEditing({ ...note, todoItems: note.todoItems || [] });
    setModalOpen(true);
    setError(null);
    setTodoDraft('');
  };

  const saveNote = async () => {
    if (!editing) return;
    if (!editing.title.trim() && !editing.content.trim()) {
      setError('Add a title or content before saving.');
      return;
    }
    const payload: StudyNote = {
      ...editing,
      id: editing.id || uuidv4(),
      updatedAt: Date.now(),
      createdAt: editing.id ? editing.createdAt : Date.now(),
      todoItems: editing.todoItems || []
    };
    const next = notes.some(n => n.id === payload.id)
      ? notes.map(n => (n.id === payload.id ? payload : n))
      : [payload, ...notes];
    await persist(next);
    setModalOpen(false);
  };

  const deleteNote = async (id: string) => {
    const next = notes.filter(n => n.id !== id);
    await persist(next);
  };

  const togglePin = async (id: string) => {
    const next = notes.map(n => (n.id === id ? { ...n, pinned: !n.pinned, updatedAt: Date.now() } : n));
    await persist(next);
  };

  const exportNotes = () => {
    const blob = new Blob([JSON.stringify({ notes, courses, selectedCourseId }, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'study_notes_backup.json';
    a.click();
    URL.revokeObjectURL(url);
  };

  const importNotes = async (file: File) => {
    try {
      const text = await file.text();
      const parsed = JSON.parse(text);
      let nextNotes: StudyNote[] = [];
      let nextCourses: Course[] = courses;
      let nextSelected = selectedCourseId;

      if (Array.isArray(parsed)) {
        nextNotes = parsed as StudyNote[];
      } else if (parsed && typeof parsed === 'object') {
        nextNotes = Array.isArray(parsed.notes) ? parsed.notes : [];
        nextCourses = Array.isArray(parsed.courses) ? parsed.courses : courses;
        nextSelected = parsed.selectedCourseId || 'all';
      } else {
        throw new Error('Invalid import format');
      }

      const normalized: StudyNote[] = nextNotes.map((n: any) => ({
        id: n.id || uuidv4(),
        title: n.title || '',
        content: n.content || '',
        color: (COLORS.find(c => c.key === n.color)?.key ?? 'yellow') as NoteColor,
        pinned: Boolean(n.pinned),
        priority: (['high', 'medium', 'low'].includes(n.priority) ? n.priority : 'medium') as NotePriority,
        dueDate: n.dueDate || null,
        reminder: n.reminder || null,
        courseId: n.courseId || null,
        todoItems: Array.isArray(n.todoItems) ? n.todoItems.map((t: any) => ({
          id: t.id || uuidv4(),
          text: t.text || '',
          completed: Boolean(t.completed)
        })) : [],
        createdAt: n.createdAt || Date.now(),
        updatedAt: n.updatedAt || Date.now()
      }));
      await persist(normalized, nextCourses, nextSelected);
      setModalOpen(false);
    } catch (e: any) {
      setError(e.message || 'Import failed');
    }
  };

  const visibleNotes = useMemo(() => {
    let result = [...notes];
    if (search.trim()) {
      const term = search.toLowerCase();
      result = result.filter(n => n.title.toLowerCase().includes(term) || n.content.toLowerCase().includes(term));
    }
    if (filterColor !== 'all') result = result.filter(n => n.color === filterColor);
    if (selectedCourseId !== 'all') result = result.filter(n => (n.courseId || null) === selectedCourseId);
    if (showPinnedOnly) result = result.filter(n => n.pinned);
    result.sort((a, b) => {
      if (a.pinned !== b.pinned) return Number(b.pinned) - Number(a.pinned);
      return b.updatedAt - a.updatedAt;
    });
    return result;
  }, [notes, search, filterColor, showPinnedOnly, selectedCourseId]);

  const cardColor = (note: StudyNote) => {
    switch (note.color) {
      case 'yellow': return 'bg-yellow-100 text-yellow-900';
      case 'blue': return 'bg-blue-100 text-blue-900';
      case 'green': return 'bg-green-100 text-green-900';
      case 'pink': return 'bg-pink-100 text-pink-900';
      case 'purple': return 'bg-purple-100 text-purple-900';
      default: return 'bg-gray-200 text-gray-900';
    }
  };

  const addCourse = () => {
    const name = prompt('Course/Topic name?')?.trim();
    if (!name) return;
    const course: Course = { id: uuidv4(), name, color: '#3b82f6' };
    persist(notes, [...courses, course], course.id);
  };

  const deleteCourse = (id: string) => {
    const nextCourses = courses.filter(c => c.id !== id);
    const nextNotes = notes.map(n => n.courseId === id ? { ...n, courseId: null } : n);
    const nextSelected = selectedCourseId === id ? 'all' : selectedCourseId;
    persist(nextNotes, nextCourses, nextSelected);
  };

  const courseLabel = (id: string | null | undefined) => {
    if (!id) return 'Unassigned';
    return courses.find(c => c.id === id)?.name || 'Unassigned';
  };

  const courseColor = (id: string | null | undefined) => {
    const c = courses.find(c => c.id === id);
    return c ? c.color : '#9ca3af';
  };

  const toggleTodo = (todoId: string) => {
    if (!editing) return;
    const items = editing.todoItems || [];
    const updated = items.map(t => t.id === todoId ? { ...t, completed: !t.completed } : t);
    setEditing({ ...editing, todoItems: updated });
  };

  const addTodo = () => {
    if (!editing || !todoDraft.trim()) return;
    const items = editing.todoItems || [];
    const next = [...items, { id: uuidv4(), text: todoDraft.trim(), completed: false }];
    setEditing({ ...editing, todoItems: next });
    setTodoDraft('');
  };

  const deleteTodo = (todoId: string) => {
    if (!editing) return;
    const items = editing.todoItems || [];
    const next = items.filter(t => t.id !== todoId);
    setEditing({ ...editing, todoItems: next });
  };

  const saveTheme = async (theme: 'auto' | 'light' | 'dark' | 'tron' | 'matrix') => {
    setNoteTheme(theme);
    await dbService.saveSetting(`${storageKey}_theme`, theme);
  };

  const resolvedTheme = noteTheme === 'auto' ? (isTron ? 'tron' : settings.theme === 'dark' ? 'dark' : settings.theme === 'tron' ? 'tron' : settings.matrixMode ? 'matrix' : 'light') : noteTheme;
  const inputClass = resolvedTheme === 'tron'
    ? 'bg-black text-tron-cyan border-tron-cyan/40'
    : resolvedTheme === 'matrix'
      ? 'bg-black text-green-300 border-green-500/40'
      : resolvedTheme === 'dark'
        ? 'bg-zinc-800 text-zinc-100 border-zinc-700'
        : 'bg-white text-gray-900 border-gray-300';
  const panelClass = resolvedTheme === 'tron'
    ? 'bg-black/80 border-tron-cyan text-tron-cyan'
    : resolvedTheme === 'matrix'
      ? 'bg-black/85 border-green-500 text-green-300'
      : resolvedTheme === 'dark'
        ? 'bg-zinc-900 border-zinc-700 text-zinc-100'
        : 'bg-white border-gray-200 text-gray-900';

  return (
    <div className={`flex flex-col h-full ${isTron ? 'font-tron text-tron-cyan' : ''}`}>
      <div className="flex items-center justify-between p-4">
        <div className="flex items-center gap-3">
          <h2 className="text-xl font-bold">Study Notes</h2>
          <span className="text-xs px-2 py-1 rounded bg-gray-200 dark:bg-zinc-800 text-gray-700 dark:text-zinc-200">
            {notes.length} saved
          </span>
        </div>
        <div className="flex items-center gap-2 flex-wrap justify-end">
          <div className="relative">
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search notes..."
              className={`pl-8 pr-3 py-2 rounded border text-sm ${inputClass}`}
            />
            <i className="fa-solid fa-search absolute left-2 top-2.5 text-gray-400 text-sm"></i>
          </div>
          <button
            onClick={openNew}
            className="bg-yellow-400 hover:bg-yellow-500 text-gray-900 px-3 py-2 rounded text-sm font-semibold flex items-center gap-1"
          >
            <i className="fa-solid fa-plus"></i> New
          </button>
          <select
            value={noteTheme}
            onChange={(e) => saveTheme(e.target.value as any)}
            className={`text-sm rounded px-2 py-2 border ${inputClass}`}
            title="Notes Theme"
          >
            <option value="auto">Auto</option>
            <option value="light">Light</option>
            <option value="dark">Dark</option>
            <option value="tron">Tron</option>
            <option value="matrix">Matrix</option>
          </select>
          <button
            onClick={exportNotes}
            className="px-3 py-2 rounded text-sm border border-gray-300 dark:border-zinc-700 hover:bg-gray-100 dark:hover:bg-zinc-800"
          >
            Export
          </button>
          <label className="px-3 py-2 rounded text-sm border border-gray-300 dark:border-zinc-700 hover:bg-gray-100 dark:hover:bg-zinc-800 cursor-pointer">
            Import
            <input
              type="file"
              accept="application/json"
              className="hidden"
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (file) importNotes(file);
              }}
            />
          </label>
        </div>
      </div>

      <div className="flex items-center gap-2 px-4 pb-2 overflow-x-auto">
        <button
          onClick={() => setSelectedCourseId('all')}
          className={`px-3 py-1 rounded-full text-xs border ${selectedCourseId === 'all' ? 'bg-amber-300 text-amber-900' : 'bg-gray-200 dark:bg-zinc-800 text-gray-700 dark:text-zinc-200'}`}
        >
          All
        </button>
        {courses.map(c => (
          <div key={c.id} className="flex items-center gap-1">
            <button
              onClick={() => setSelectedCourseId(c.id)}
              className="px-3 py-1 rounded-full text-xs border"
              style={{ backgroundColor: selectedCourseId === c.id ? c.color : undefined, color: selectedCourseId === c.id ? '#000' : undefined }}
            >
              {c.name}
            </button>
            <button onClick={() => deleteCourse(c.id)} className="text-[10px] text-red-500 hover:text-red-600">
              <i className="fa-solid fa-xmark"></i>
            </button>
          </div>
        ))}
        <button
          onClick={addCourse}
          className="px-2 py-1 rounded-full text-xs border border-gray-300 dark:border-zinc-700 hover:bg-gray-100 dark:hover:bg-zinc-800"
        >
          <i className="fa-solid fa-plus"></i> Course
        </button>
      </div>

      <div className="flex flex-wrap gap-3 px-4">
        <div className="flex items-center gap-2 flex-wrap justify-end">
          <span className="text-xs uppercase tracking-wide text-gray-500">Color</span>
          <button
            onClick={() => setFilterColor('all')}
            className={`w-6 h-6 rounded-full border ${filterColor === 'all' ? 'ring-2 ring-teal-500' : ''} bg-gray-200`}
            title="All colors"
          ></button>
          {COLORS.map(c => (
            <button
              key={c.key}
              onClick={() => setFilterColor(c.key)}
              className={`w-6 h-6 rounded-full border ${filterColor === c.key ? 'ring-2 ring-teal-500' : ''} ${c.bg}`}
              title={c.label}
            ></button>
          ))}
        </div>
        <label className="flex items-center gap-2 text-sm">
          <input type="checkbox" checked={showPinnedOnly} onChange={(e) => setShowPinnedOnly(e.target.checked)} className="accent-teal-500" />
          Pinned only
        </label>
      </div>

      <div className="flex-1 overflow-y-auto p-4">
        {visibleNotes.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center text-center opacity-70">
            <i className="fa-regular fa-note-sticky text-4xl mb-2"></i>
            <p className="text-sm">No notes match your filters. Start a new one!</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
            {visibleNotes.map(note => (
              <div
                key={note.id}
                className={`relative rounded-lg shadow-sm p-3 border border-gray-200 dark:border-zinc-700 ${cardColor(note)} ${isTron ? 'backdrop-blur-sm' : ''}`}
              >
                <div className="flex items-start justify-between mb-1">
                  <h3 className="font-bold text-sm truncate">{note.title || 'Untitled Note'}</h3>
                  <div className="flex items-center gap-2">
                    <button onClick={() => togglePin(note.id)} className="text-xs text-gray-700 hover:text-amber-500">
                      <i className={`${note.pinned ? 'fa-solid' : 'fa-regular'} fa-thumbtack`}></i>
                    </button>
                    <button onClick={() => openEdit(note)} className="text-xs text-gray-700 hover:text-blue-600">
                      <i className="fa-solid fa-pen"></i>
                    </button>
                    <button onClick={() => deleteNote(note.id)} className="text-xs text-gray-700 hover:text-red-600">
                      <i className="fa-solid fa-trash"></i>
                    </button>
                  </div>
                </div>
                <div className="text-xs line-clamp-4 mb-2 whitespace-pre-wrap">
                  {note.content || 'No content'}
                </div>
                <div className="flex items-center justify-between text-[11px] mt-auto pt-2 border-t border-gray-300/60 gap-2">
                  <div className={`px-2 py-1 rounded ${PRIORITIES.find(p => p.key === note.priority)?.badge}`}>
                    {PRIORITIES.find(p => p.key === note.priority)?.label}
                  </div>
                  <div className="flex items-center gap-2 text-gray-700">
                    {note.reminder && <i className="fa-regular fa-bell"></i>}
                    <span>{note.dueDate ? new Date(note.dueDate).toLocaleDateString() : ''}</span>
                  </div>
                </div>
                <div className="flex items-center justify-between text-[11px] mt-1">
                  <span className="flex items-center gap-1">
                    <span className="inline-block w-2 h-2 rounded-full" style={{ backgroundColor: courseColor(note.courseId) }}></span>
                    {courseLabel(note.courseId)}
                  </span>
                  {note.todoItems && note.todoItems.length > 0 && (
                    <span className="text-xs">
                      <i className="fa-solid fa-list-check mr-1"></i>
                      {note.todoItems.filter(t => t.completed).length}/{note.todoItems.length}
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {modalOpen && editing && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className={`w-full max-w-xl rounded-xl border shadow-2xl p-6 ${panelClass}`}>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-bold">{editing.id ? 'Edit Note' : 'New Note'}</h3>
              <button onClick={() => setModalOpen(false)} className="text-gray-400 hover:text-white">
                <i className="fa-solid fa-xmark"></i>
              </button>
            </div>
            {error && <div className="mb-3 text-sm text-red-500">{error}</div>}
            <div className="space-y-3">
              <input
                value={editing.title}
                onChange={(e) => setEditing({ ...editing, title: e.target.value })}
                placeholder="Title"
                className={`w-full px-3 py-2 rounded border ${inputClass}`}
              />
              <textarea
                value={editing.content}
                onChange={(e) => setEditing({ ...editing, content: e.target.value })}
                placeholder="Content"
                rows={6}
                className={`w-full px-3 py-2 rounded border ${inputClass}`}
              />
              <div className="flex flex-wrap gap-3 items-center">
                <div className="flex items-center gap-2">
                  <span className="text-xs uppercase tracking-wide">Color</span>
                  {COLORS.map(c => (
                    <button
                      key={c.key}
                      onClick={() => setEditing({ ...editing, color: c.key })}
                      className={`w-6 h-6 rounded-full border ${editing.color === c.key ? 'ring-2 ring-teal-500' : ''} ${c.bg}`}
                    ></button>
                  ))}
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-xs uppercase tracking-wide">Priority</span>
                  <select
                    value={editing.priority}
                    onChange={(e) => setEditing({ ...editing, priority: e.target.value as NotePriority })}
                    className={`text-sm rounded px-2 py-1 border ${inputClass}`}
                  >
                    {PRIORITIES.map(p => <option key={p.key} value={p.key}>{p.label}</option>)}
                  </select>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-xs uppercase tracking-wide">Due</span>
                  <input
                    type="date"
                    value={editing.dueDate ? editing.dueDate.slice(0, 10) : ''}
                    onChange={(e) => setEditing({ ...editing, dueDate: e.target.value || null })}
                    className={`text-sm rounded px-2 py-1 border ${inputClass}`}
                  />
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-xs uppercase tracking-wide">Reminder</span>
                  <input
                    type="datetime-local"
                    value={editing.reminder ? editing.reminder.slice(0, 16) : ''}
                    onChange={(e) => setEditing({ ...editing, reminder: e.target.value || null })}
                    className={`text-sm rounded px-2 py-1 border ${inputClass}`}
                  />
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-xs uppercase tracking-wide">Course</span>
                  <select
                    value={editing.courseId || 'none'}
                    onChange={(e) => setEditing({ ...editing, courseId: e.target.value === 'none' ? null : e.target.value })}
                    className={`text-sm rounded px-2 py-1 border ${inputClass}`}
                  >
                    <option value="none">Unassigned</option>
                    {courses.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                  </select>
                </div>
                <label className="flex items-center gap-2 text-sm">
                  <input
                    type="checkbox"
                    checked={editing.pinned}
                    onChange={(e) => setEditing({ ...editing, pinned: e.target.checked })}
                    className="accent-teal-500"
                  />
                  Pin to top
                </label>
              </div>
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <input
                    value={todoDraft}
                    onChange={(e) => setTodoDraft(e.target.value)}
                    onKeyDown={(e) => { if (e.key === 'Enter') addTodo(); }}
                    placeholder="Add todo item"
                    className={`flex-1 px-3 py-2 rounded border text-sm ${inputClass}`}
                  />
                  <button onClick={addTodo} className="px-3 py-2 rounded bg-blue-500 hover:bg-blue-600 text-white text-sm">
                    Add
                  </button>
                </div>
                {editing.todoItems && editing.todoItems.length > 0 && (
                  <div className="space-y-1">
                    {editing.todoItems.map(item => (
                      <div key={item.id} className="flex items-center justify-between text-sm bg-gray-100 dark:bg-zinc-800 rounded px-2 py-1">
                        <label className="flex items-center gap-2">
                          <input type="checkbox" checked={item.completed} onChange={() => toggleTodo(item.id)} className="accent-teal-500" />
                          <span className={item.completed ? 'line-through opacity-60' : ''}>{item.text}</span>
                        </label>
                        <button onClick={() => deleteTodo(item.id)} className="text-red-500 hover:text-red-600 text-xs">
                          <i className="fa-solid fa-xmark"></i>
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
            <div className="flex justify-between items-center mt-5">
              <button
                onClick={() => setModalOpen(false)}
                className="px-4 py-2 text-sm rounded border border-gray-300 dark:border-zinc-700 hover:bg-gray-100 dark:hover:bg-zinc-800"
              >
                Cancel
              </button>
              <div className="flex gap-2">
                {editing.id && (
                  <button
                    onClick={() => deleteNote(editing.id)}
                    className="px-4 py-2 text-sm rounded bg-red-500 hover:bg-red-600 text-white"
                  >
                    Delete
                  </button>
                )}
                <button
                  onClick={saveNote}
                  className="px-4 py-2 text-sm rounded bg-yellow-400 hover:bg-yellow-500 text-gray-900 font-semibold"
                >
                  Save
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default StudyNotes;
