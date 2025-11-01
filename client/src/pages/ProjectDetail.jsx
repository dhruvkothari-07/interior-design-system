import React, { useEffect, useState, useMemo, useCallback } from 'react';
import axios from 'axios'; // Ensure axios is imported
import Sidebar from './Sidebar';
import { useParams, useNavigate } from 'react-router-dom';

const ProjectDetail = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const [project, setProject] = useState(null);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState(null);

    // State for new entries
    const [newTask, setNewTask] = useState('');
    const [newExpense, setNewExpense] = useState({ description: '', amount: '', category: '', expense_date: new Date().toISOString().split('T')[0] });
    const [newNote, setNewNote] = useState('');

    const fetchProjectDetails = useCallback(async () => {
        try {
            setIsLoading(true);
            const token = localStorage.getItem("token");
            if (!token) { navigate('/signin'); return; }

            const res = await axios.get(`http://localhost:3001/api/v1/projects/${id}`, {
                headers: { Authorization: `Bearer ${token}` },
            });
            setProject(res.data);
        } catch (err) {
            console.error("Error fetching project details:", err);
            setError("Failed to load project details.");
        } finally {
            setIsLoading(false);
        }
    }, [id, navigate]);

    useEffect(() => {
        fetchProjectDetails();
    }, [fetchProjectDetails]);

    const totalExpenses = useMemo(() => {
        return project?.expenses?.reduce((sum, expense) => sum + Number(expense.amount), 0) || 0;
    }, [project?.expenses]);

    const formatCurrency = (amount) => new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR' }).format(amount);

    const handleAddTask = async (e) => {
        e.preventDefault();
        if (!newTask.trim()) return;
        try {
            const token = localStorage.getItem("token");
            const res = await axios.post(`http://localhost:3001/api/v1/projects/${id}/tasks`, { description: newTask }, { headers: { Authorization: `Bearer ${token}` } });
            setProject(prev => ({ ...prev, tasks: [res.data, ...(prev.tasks || [])] }));
            setNewTask('');
        } catch (err) { console.error("Error adding task:", err); alert("Failed to add task."); }
    };

    const handleAddExpense = async (e) => {
        e.preventDefault();
        try {
            const token = localStorage.getItem("token");
            const res = await axios.post(`http://localhost:3001/api/v1/projects/${id}/expenses`, newExpense, { headers: { Authorization: `Bearer ${token}` } });
            setProject(prev => ({ ...prev, expenses: [res.data, ...(prev.expenses || [])] }));
            setNewExpense({ description: '', amount: '', category: '', expense_date: new Date().toISOString().split('T')[0] });
        } catch (err) { console.error("Error adding expense:", err); alert("Failed to add expense."); }
    };

    const handleAddNote = async (e) => {
        e.preventDefault();
        if (!newNote.trim()) return;
        try {
            const token = localStorage.getItem("token");
            const res = await axios.post(`http://localhost:3001/api/v1/projects/${id}/notes`, { note: newNote }, { headers: { Authorization: `Bearer ${token}` } });
            setProject(prev => ({ ...prev, notes: [res.data, ...(prev.notes || [])] }));
            setNewNote('');
        } catch (err) { console.error("Error adding note:", err); alert("Failed to add note."); }
    };

    const handleTaskStatusChange = async (taskId, currentStatus) => {
        const newStatus = currentStatus === 'Done' ? 'To Do' : 'Done';
        try {
            const token = localStorage.getItem("token");
            await axios.put(`http://localhost:3001/api/v1/tasks/${taskId}`, { status: newStatus }, { headers: { Authorization: `Bearer ${token}` } });
            setProject(prev => ({
                ...prev,
                tasks: prev.tasks.map(task => task.id === taskId ? { ...task, status: newStatus } : task)
            }));
        } catch (err) { console.error("Error updating task:", err); alert("Failed to update task status."); }
    };

    const handleProjectStatusChange = async (e) => {
        const newStatus = e.target.value;
        if (!window.confirm(`Are you sure you want to change the project status to "${newStatus}"?`)) {
            e.target.value = project.status; // Revert dropdown if user cancels
            return;
        }
        try {
            const token = localStorage.getItem("token");
            await axios.put(`http://localhost:3001/api/v1/projects/${id}/status`, { status: newStatus }, { headers: { Authorization: `Bearer ${token}` } });
            setProject(prev => ({ ...prev, status: newStatus }));
            alert("Project status updated successfully!");
        } catch (err) {
            console.error("Error updating project status:", err);
            alert("Failed to update project status.");
        }
    };

    if (isLoading) return <div className="flex h-screen bg-gray-100 justify-center items-center"><p>Loading project...</p></div>;
    if (error) return <div className="flex h-screen bg-gray-100 justify-center items-center"><p className="text-red-500">{error}</p></div>;
    if (!project) return <div className="flex h-screen bg-gray-100 justify-center items-center"><p>Project not found.</p></div>;
    
    const variance = project.budget - totalExpenses;

    return (
        <div className="flex h-screen bg-gray-100 text-gray-800">
            <Sidebar />
            <main className="flex-1 p-8 overflow-y-auto">
                <header className="mb-8 border-b pb-4">
                    <div className="flex justify-between items-start">
                        <div>
                            <h2 className="text-3xl font-semibold">{project.name}</h2>
                            <p className="text-gray-600">Client: {project.client_name}</p>
                        </div>
                        <div className="flex items-center gap-4">
                            <button
                                onClick={() => navigate('/projects')}
                                className="bg-gray-600 text-white px-5 py-2 rounded-lg shadow hover:bg-gray-700 transition"
                            >
                                Back to Projects
                            </button>
                            <label htmlFor="project-status" className="block text-xs text-gray-500 mb-1">Status</label>
                            <select
                                id="project-status"
                                value={project.status}
                                onChange={handleProjectStatusChange}
                                className={`px-3 py-1 text-sm font-semibold rounded-full border-transparent focus:border-gray-300 focus:ring-0 ${project.status === 'Completed' ? 'bg-green-100 text-green-800' : 'bg-blue-100 text-blue-800'}`}
                            >
                                <option value="Not Started">Not Started</option>
                                <option value="In Progress">In Progress</option>
                                <option value="On Hold">On Hold</option>
                                <option value="Completed">Completed</option>
                            </select>
                        </div>
                    </div>
                </header>

                {/* Financial Summary */}
                <section className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                    <div className="bg-white p-6 rounded-lg shadow-md text-center">
                        <h3 className="text-gray-500 text-sm font-medium mb-2">Budget</h3>
                        <p className="text-3xl font-semibold text-green-600">{formatCurrency(project.budget)}</p>
                    </div>
                    <div className="bg-white p-6 rounded-lg shadow-md text-center">
                        <h3 className="text-gray-500 text-sm font-medium mb-2">Actuals (Expenses)</h3>
                        <p className="text-3xl font-semibold text-red-600">{formatCurrency(totalExpenses)}</p>
                    </div>
                    <div className="bg-white p-6 rounded-lg shadow-md text-center">
                        <h3 className="text-gray-500 text-sm font-medium mb-2">Variance</h3>
                        <p className={`text-3xl font-semibold ${variance >= 0 ? 'text-blue-600' : 'text-yellow-500'}`}>
                            {formatCurrency(variance)}
                        </p>
                    </div>
                </section>

                {/* Main Content Grid */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                    {/* Tasks Section */}
                    <section className="bg-white p-6 rounded-lg shadow-md">
                        <h3 className="text-xl font-semibold mb-4">Tasks</h3>
                        <form onSubmit={handleAddTask} className="flex gap-2 mb-4">
                            <input type="text" value={newTask} onChange={e => setNewTask(e.target.value)} placeholder="Add a new task..." className="flex-grow px-3 py-2 border rounded-md" />
                            <button type="submit" className="bg-indigo-600 text-white px-4 py-2 rounded-md hover:bg-indigo-700">+</button>
                        </form>
                        <ul className="space-y-2 max-h-96 overflow-y-auto">
                            {project.tasks && project.tasks.length > 0 ? project.tasks.map(task => (
                                <li key={task.id} className="flex items-center gap-3 p-2 rounded-md hover:bg-gray-50">
                                    <input type="checkbox" checked={task.status === 'Done'} onChange={() => handleTaskStatusChange(task.id, task.status)} className="h-5 w-5 rounded text-indigo-600 focus:ring-indigo-500" />
                                    <span className={`flex-grow ${task.status === 'Done' ? 'line-through text-gray-400' : ''}`}>{task.description}</span>
                                </li>
                            )) : (
                                <li className="text-center text-gray-400 italic py-4">
                                    No tasks added yet.
                                </li>
                            )}
                        </ul>
                    </section>

                    {/* Expenses Section */}
                    <section className="bg-white p-6 rounded-lg shadow-md">
                        <h3 className="text-xl font-semibold mb-4">Expenses</h3>
                        <form onSubmit={handleAddExpense} className="grid grid-cols-2 gap-4 mb-4">
                            <input type="text" value={newExpense.description} onChange={e => setNewExpense(p => ({ ...p, description: e.target.value }))} placeholder="Description" required className="col-span-2 px-3 py-2 border rounded-md" />
                            <input type="number" value={newExpense.amount} onChange={e => setNewExpense(p => ({ ...p, amount: e.target.value }))} placeholder="Amount" required className="px-3 py-2 border rounded-md" />
                            <input type="date" value={newExpense.expense_date} onChange={e => setNewExpense(p => ({ ...p, expense_date: e.target.value }))} required className="px-3 py-2 border rounded-md" />
                            <input type="text" value={newExpense.category} onChange={e => setNewExpense(p => ({ ...p, category: e.target.value }))} placeholder="Category (e.g., Labor)" className="col-span-2 px-3 py-2 border rounded-md" />
                            <button type="submit" className="col-span-2 bg-indigo-600 text-white py-2 rounded-md hover:bg-indigo-700">Add Expense</button>
                        </form>
                        <ul className="space-y-2 max-h-80 overflow-y-auto">
                            {project.expenses && project.expenses.length > 0 ? project.expenses.map(expense => (
                                <li key={expense.id} className="flex justify-between p-2 rounded-md hover:bg-gray-50">
                                    <div>
                                        <span className="font-medium">{expense.description}</span>
                                        <span className="text-sm text-gray-500 ml-2">({new Date(expense.expense_date).toLocaleDateString('en-GB')})</span>
                                    </div>
                                    <span className="font-semibold">{formatCurrency(expense.amount)}</span>
                                </li>
                            )) : (
                                <li className="text-center text-gray-400 italic py-4">
                                    No expenses logged yet.
                                </li>
                            )}
                        </ul>
                    </section>

                    {/* Notes Section */}
                    <section className="bg-white p-6 rounded-lg shadow-md lg:col-span-2">
                        <h3 className="text-xl font-semibold mb-4">Project Notes</h3>
                        <form onSubmit={handleAddNote} className="flex flex-col gap-2 mb-4">
                            <textarea value={newNote} onChange={e => setNewNote(e.target.value)} placeholder="Add a new note..." rows="3" className="w-full px-3 py-2 border rounded-md"></textarea>
                            <button type="submit" className="bg-indigo-600 text-white px-4 py-2 rounded-md hover:bg-indigo-700 self-end">Add Note</button>
                        </form>
                        <ul className="space-y-4 max-h-96 overflow-y-auto">
                            {project.notes && project.notes.length > 0 ? project.notes.map(note => (
                                <li key={note.id} className="p-3 rounded-md bg-gray-50 border">
                                    <p className="text-gray-700">{note.note}</p>
                                    <p className="text-xs text-gray-400 text-right mt-2">{new Date(note.createdAt).toLocaleString('en-GB')}</p>
                                </li>
                            )) : (
                                <li className="text-center text-gray-400 italic py-4">
                                    No notes added yet.
                                </li>
                            )}
                        </ul>
                    </section>
                </div>
            </main>
        </div>
    );
};

export default ProjectDetail;
