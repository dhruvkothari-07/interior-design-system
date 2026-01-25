import React, {
  useEffect,
  useState,
  useMemo,
  useCallback,
  useRef
} from "react";
import axios from "axios";
import Sidebar from "./Sidebar";
import { useParams, useNavigate } from "react-router-dom";
import {
  LayoutDashboard,
  CheckSquare,
  Palette,
  DollarSign,
  FolderOpen,
  Clock,
  AlertTriangle,
  Plus,
  X,
  Trash2,
  UploadCloud,
  Image as ImageIcon,
  Eye,
  File as FileIcon,
  FileSpreadsheet,
  FileText,
  FileCode,
  FileArchive,
  FileSearch,
  MoreHorizontal,
  Calendar
} from "lucide-react";
import { API_URL, SERVER_URL } from '../config';

// ---- UI Components ---------------------------------------

const StatCard = ({ label, value, subLabel, progress, className = "" }) => (
  <div
    className={
      "bg-white p-6 rounded-xl shadow-sm border border-slate-100 " +
      className
    }
  >
    <p className="text-xs uppercase tracking-wider text-slate-500 mb-2 font-medium">
      {label}
    </p>
    <p className="text-3xl font-sans font-semibold text-slate-800 mb-2">{value}</p>
    {subLabel && (
      <p className="text-xs text-slate-400">{subLabel}</p>
    )}
    {progress !== undefined && (
      <div className="mt-3 h-1.5 w-full bg-slate-100 rounded-full overflow-hidden">
        <div 
          className={`h-full rounded-full ${progress > 100 ? 'bg-red-500' : 'bg-emerald-600'}`} 
          style={{ width: `${Math.min(progress, 100)}%` }} 
        />
      </div>
    )}
  </div>
);

const PhaseStepper = ({ currentStatus }) => {
  const phases = ["Concept", "Design", "Procurement", "Execution", "Handover"];
  
  // Map backend status to a visual phase index
  const statusMap = {
    "Not Started": 0,
    "On Hold": 1,
    "In Progress": 3, // Assuming execution is the main active state
    "Completed": 4
  };
  
  const activeIndex = statusMap[currentStatus] ?? 0;

  return (
    <div className="w-full py-6 px-4 bg-white rounded-xl shadow-sm border border-slate-100 mb-6 overflow-x-auto">
      <div className="flex items-center justify-between relative">
        {/* Connecting Line */}
        <div className="absolute left-0 top-4 transform w-full h-0.5 bg-slate-100 -z-10" />
        
        {phases.map((phase, index) => {
          const isCompleted = index <= activeIndex;
          const isCurrent = index === activeIndex;
          
          return (
            <div key={phase} className="flex flex-col items-center gap-3 bg-white px-2">
              <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold transition-all ${
                isCurrent ? "bg-slate-800 text-white ring-4 ring-slate-100 scale-110" :
                isCompleted ? "bg-emerald-600 text-white" : "bg-slate-200 text-slate-400"
              }`}>
                {index + 1}
              </div>
              <span className={`text-xs font-medium uppercase tracking-wide ${isCurrent ? "text-slate-800" : "text-slate-400"}`}>
                {phase}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
};

// ---- Task Modal Component --------------------------------

const TaskModal = ({ isOpen, onClose, onSubmit, newTaskData, setNewTaskData }) => {
  if (!isOpen) return null;

  const trades = ['General', 'Carpentry', 'Painting', 'Electrical', 'Plumbing', 'Civil Work', 'HVAC/AC'];
  const priorities = ['High', 'Medium', 'Low'];

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex justify-center items-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-md overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-100 flex justify-between items-center bg-slate-50">
          <h3 className="font-serif text-lg text-slate-800">Add New Task</h3>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600 transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>
        
        <form onSubmit={onSubmit} className="p-6 space-y-4">
          <div>
            <label className="block text-xs font-medium text-slate-500 mb-1">Task Title <span className="text-red-500">*</span></label>
            <input
              type="text"
              value={newTaskData.description}
              onChange={(e) => setNewTaskData({ ...newTaskData, description: e.target.value })}
              placeholder="e.g., Install Kitchen Backsplash"
              required
              className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-emerald-500 focus:outline-none"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-slate-500 mb-1">Trade Category <span className="text-red-500">*</span></label>
              <select
                value={newTaskData.trade_category}
                onChange={(e) => setNewTaskData({ ...newTaskData, trade_category: e.target.value })}
                className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm bg-white focus:ring-2 focus:ring-emerald-500 focus:outline-none"
              >
                {trades.map(t => <option key={t} value={t}>{t}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-500 mb-1">Priority</label>
              <select
                value={newTaskData.priority}
                onChange={(e) => setNewTaskData({ ...newTaskData, priority: e.target.value })}
                className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm bg-white focus:ring-2 focus:ring-emerald-500 focus:outline-none"
              >
                {priorities.map(p => <option key={p} value={p}>{p}</option>)}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-slate-500 mb-1">Due Date <span className="text-red-500">*</span></label>
              <input
                type="date"
                value={newTaskData.due_date}
                onChange={(e) => setNewTaskData({ ...newTaskData, due_date: e.target.value })}
                required
                className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-emerald-500 focus:outline-none"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-500 mb-1">Description (Optional)</label>
            <textarea
              value={newTaskData.details}
              onChange={(e) => setNewTaskData({ ...newTaskData, details: e.target.value })}
              placeholder="Add measurements, specific instructions, or material references..."
              rows="3"
              className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-emerald-500 focus:outline-none resize-none"
            />
          </div>

          <div className="pt-2">
            <button type="submit" className="w-full bg-slate-800 text-white py-2.5 rounded-lg text-sm font-medium hover:bg-slate-700 transition-colors shadow-sm">
              Create Task
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

// ---- Tasks Panel -----------------------------------------

const TasksPanel = ({
  tasks = [],
  onOpenAddTask,
  onToggleTask,
  activeFilter,
  onClearFilter
}) => {
  const grouped = useMemo(() => {
    const groups = {
      "To Do": [],
      "In Progress": [],
      Done: []
    };
    tasks.forEach((t) => {
      const key = t.status || "To Do";
      if (!groups[key]) groups[key] = [];
      groups[key].push(t);
    });
    return groups;
  }, [tasks]);

  return (
    <div className="h-full flex flex-col">
      <div className="flex justify-between items-center mb-6">
        <h3 className="text-xl font-serif text-slate-800">Task Board</h3>
        <button
          onClick={onOpenAddTask}
          className="bg-slate-800 text-white px-4 py-2 rounded-lg hover:bg-slate-700 text-sm font-medium transition-colors flex items-center gap-2 shadow-sm"
        >
          <Plus className="w-4 h-4" /> New Task
        </button>
      </div>

      {activeFilter && (
        <div className="bg-indigo-50 border border-indigo-100 text-indigo-700 px-4 py-3 rounded-lg mb-4 flex justify-between items-center text-sm shadow-sm">
          <span className="flex items-center gap-2">
             <span className="w-2 h-2 rounded-full bg-indigo-500"></span>
             Filtering by: <strong>{activeFilter === 'high' ? 'High Priority' : 'Overdue Tasks'}</strong>
             <span className="text-indigo-400">({tasks.length} found)</span>
          </span>
          <button onClick={onClearFilter} className="text-indigo-800 hover:text-indigo-950 font-medium hover:underline">
            Clear Filter
          </button>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 h-auto md:h-full md:overflow-hidden">
        {["To Do", "In Progress", "Done"].map((col) => (
          <div key={col} className="flex flex-col h-auto md:h-full">
            <div className="flex items-center justify-between mb-3 px-1">
              <p className="text-xs font-bold uppercase tracking-wider text-slate-500">
                {col}
              </p>
              <span className="bg-slate-100 text-slate-600 text-[10px] px-2 py-0.5 rounded-full">
                {grouped[col]?.length || 0}
              </span>
            </div>
            <div className="bg-slate-50/50 rounded-xl p-3 flex-1 md:overflow-y-auto border border-slate-100 min-h-[150px]">
              {grouped[col] && grouped[col].length > 0 ? (
                grouped[col].map((task) => (
                  <div
                    key={task.id}
                    className="group bg-white p-4 mb-3 rounded-lg shadow-sm border border-slate-100 hover:shadow-md transition-all cursor-pointer"
                    onClick={() => onToggleTask(task.id, task.status)}
                  >
                    <p className={`text-sm font-medium mb-2 ${task.status === "Done" ? "text-slate-400 line-through" : "text-slate-700"}`}>
                      {task.description}
                    </p>
                    {task.details && (
                      <p className="text-xs text-slate-500 mb-3 line-clamp-2">{task.details}</p>
                    )}
                    <div className="flex items-center justify-between mt-2">
                      <div className="flex gap-1">
                         <span className="text-[10px] bg-slate-100 text-slate-600 px-2 py-0.5 rounded border border-slate-200">
                           {task.trade_category || 'General'}
                         </span>
                         <span className={`text-[10px] px-2 py-0.5 rounded border ${
                           (task.priority || 'Medium') === 'High' ? 'bg-red-50 text-red-600 border-red-100' :
                           (task.priority || 'Medium') === 'Medium' ? 'bg-orange-50 text-orange-600 border-orange-100' :
                           'bg-slate-50 text-slate-500 border-slate-200'
                         }`}>{task.priority || 'Medium'}</span>
                      </div>
                      {task.due_date && (
                        <div className={`flex items-center gap-1 text-[10px] ${new Date(task.due_date) < new Date() && task.status !== 'Done' ? 'text-red-500 font-medium' : 'text-slate-400'}`}>
                          <Clock className="w-3 h-3" />
                          {new Date(task.due_date).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
                        </div>
                      )}
                    </div>
                  </div>
                ))
              ) : (
                <div className="h-full flex flex-col items-center justify-center text-slate-300 border-2 border-dashed border-slate-200 rounded-lg m-2">
                  <p className="text-xs">Empty</p>
                </div>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

// ---- Materials Panel (Mock Data) -------------------------

const MaterialsPanel = () => {
  // Mock data since backend doesn't support materials yet
  const [materials] = useState([
    { id: 1, name: "Carrara Marble", type: "Flooring", status: "Ordered", price: "₹450/sqft", img: "https://images.unsplash.com/photo-1618221381711-42ca8ab6e908?auto=format&fit=crop&w=300&q=80" },
    { id: 2, name: "Teak Wood Veneer", type: "Carpentry", status: "Selected", price: "₹120/sqft", img: "https://images.unsplash.com/photo-1545060894-5b45870f191d?auto=format&fit=crop&w=300&q=80" },
    { id: 3, name: "Brass Handles", type: "Hardware", status: "Delivered", price: "₹850/pc", img: "https://images.unsplash.com/photo-1601058268499-e52642d15d39?auto=format&fit=crop&w=300&q=80" },
    { id: 4, name: "Sage Green Paint", type: "Paint", status: "In Stock", price: "₹2,500/gal", img: "https://images.unsplash.com/photo-1562184552-e0a53972f06b?auto=format&fit=crop&w=300&q=80" },
  ]);

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h3 className="text-xl font-serif text-slate-800">Design & Materials</h3>
        <button className="text-sm bg-slate-800 text-white px-4 py-2 rounded-lg hover:bg-slate-700">
          + Add Material
        </button>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {materials.map((m) => (
          <div key={m.id} className="bg-white rounded-xl shadow-sm border border-slate-100 overflow-hidden hover:shadow-md transition-shadow group">
            <div className="h-40 overflow-hidden relative">
              <img src={m.img} alt={m.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
              <span className="absolute top-2 right-2 bg-white/90 backdrop-blur-sm text-[10px] font-bold px-2 py-1 rounded-full uppercase tracking-wide text-slate-700">
                {m.status}
              </span>
            </div>
            <div className="p-4">
              <p className="text-xs text-slate-400 uppercase tracking-wider mb-1">{m.type}</p>
              <h4 className="font-medium text-slate-800 mb-2">{m.name}</h4>
              <p className="text-sm font-semibold text-emerald-600">{m.price}</p>
            </div>
          </div>
        ))}
        <div className="border-2 border-dashed border-slate-200 rounded-xl flex flex-col items-center justify-center text-slate-400 p-6 hover:border-emerald-400 hover:text-emerald-600 transition-colors cursor-pointer">
          <Plus className="w-8 h-8 mb-2" />
          <span className="text-sm font-medium">Add New Item</span>
        </div>
      </div>
    </div>
  );
};

// ---- Expenses Panel --------------------------------------

const ExpensePanel = ({
  expenses = [],
  newExpense,
  setNewExpense,
  onAddExpense,
  formatCurrency,
  budget,
  totalExpenses
}) => {
  const fileInputRef = useRef(null);
  
  const remaining = (Number(budget) || 0) - totalExpenses;
  const isOverBudget = remaining < 0;

  // Reset file input when newExpense.receipt is null (after submission)
  useEffect(() => {
    if (!newExpense.receipt && fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  }, [newExpense.receipt]);

  const categories = [
    'Material Purchase', 
    'FFE (Furniture & Fixtures)', 
    'Contractor Payment', 
    'Daily Labor Payout (Cash)', 
    'Design Fees', 
    'Permits/Official', 
    'Miscellaneous'
  ];

  return (
    <div className="flex flex-col h-full">
      <div className="flex flex-col gap-4 mb-6 bg-white p-5 rounded-xl shadow-sm border border-slate-100">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center border-b border-slate-100 pb-4">
          <h3 className="text-xl font-serif text-slate-800">Financials</h3>
          <div className="text-sm mt-2 md:mt-0 flex flex-wrap gap-2 md:gap-0">
            <span className="text-slate-500">Total Budget: <span className="font-semibold text-slate-700">{formatCurrency(budget)}</span></span>
            <span className="hidden md:inline mx-2 text-slate-300">|</span>
            <span className="text-slate-500">Total Spent: <span className="font-semibold text-slate-700">{formatCurrency(totalExpenses)}</span></span>
            <span className="hidden md:inline mx-2 text-slate-300">|</span>
            <span className={`font-semibold ${isOverBudget ? 'text-red-600' : 'text-emerald-600'}`}>
              Remaining: {formatCurrency(remaining)} {isOverBudget && "(Over Budget)"}
            </span>
          </div>
        </div>
        
        {/* Add Expense Form - Grid Layout */}
        <form onSubmit={onAddExpense} className="grid grid-cols-1 md:grid-cols-12 gap-4 items-end">
          <div className="md:col-span-3">
            <label className="block text-xs font-medium text-slate-500 mb-1">Description</label>
            <input
              type="text"
              value={newExpense.description}
              onChange={(e) => setNewExpense(p => ({ ...p, description: e.target.value }))}
              placeholder="Item description"
              required
              className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-emerald-500 focus:outline-none"
            />
          </div>
          
          <div className="md:col-span-2">
            <label className="block text-xs font-medium text-slate-500 mb-1">Category</label>
            <select
              value={newExpense.category}
              onChange={(e) => setNewExpense(p => ({ ...p, category: e.target.value }))}
              className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm bg-white focus:ring-2 focus:ring-emerald-500 focus:outline-none"
            >
              <option value="">Select...</option>
              {categories.map(c => <option key={c} value={c}>{c}</option>)}
            </select>
          </div>

          <div className="md:col-span-2">
            <label className="block text-xs font-medium text-slate-500 mb-1">Amount</label>
            <input
              type="number"
              value={newExpense.amount}
              onChange={(e) => setNewExpense(p => ({ ...p, amount: e.target.value }))}
              placeholder="0.00"
              required
              className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-emerald-500 focus:outline-none"
            />
          </div>

          <div className="md:col-span-2">
            <label className="block text-xs font-medium text-slate-500 mb-1">Date</label>
            <div className="relative">
              <input
                type="text"
                readOnly
                value={newExpense.expense_date ? newExpense.expense_date.split('-').reverse().join('/') : ""}
                className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-emerald-500 focus:outline-none bg-white"
              />
              <Calendar className="absolute right-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input
                type="date"
                value={newExpense.expense_date}
                onChange={(e) => setNewExpense(p => ({ ...p, expense_date: e.target.value }))}
                required
                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
              />
            </div>
          </div>

          <div className="md:col-span-2">
            <label className="block text-xs font-medium text-slate-500 mb-1">Receipt Proof</label>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*,.pdf"
              onChange={(e) => setNewExpense(p => ({ ...p, receipt: e.target.files[0] }))}
              className="w-full text-xs text-slate-500 file:mr-2 file:py-1.5 file:px-3 file:rounded-full file:border-0 file:text-xs file:font-medium file:bg-slate-100 file:text-slate-700 hover:file:bg-slate-200"
            />
          </div>

          <div className="md:col-span-1">
            <button type="submit" className="w-full bg-emerald-600 text-white py-2 rounded-lg text-sm hover:bg-emerald-700 font-medium transition-colors">
              Add
            </button>
          </div>
        </form>
      </div>

      {/* Desktop Table */}
      <div className="hidden md:block bg-white rounded-xl shadow-sm border border-slate-100 overflow-hidden">
        <table className="min-w-full divide-y divide-slate-100">
          <thead className="bg-slate-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">Date</th>
              <th className="px-6 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">Description</th>
              <th className="px-6 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">Category</th>
              <th className="px-6 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">Receipt</th>
              <th className="px-6 py-3 text-right text-xs font-semibold text-slate-500 uppercase tracking-wider">Amount</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-slate-100">
            {expenses.length > 0 ? (
              expenses.map((expense) => (
                <tr key={expense.id} className="hover:bg-slate-50 transition-colors">
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-500">
                    {new Date(expense.expense_date).toLocaleDateString("en-GB")}
                  </td>
                  <td className="px-6 py-4 text-sm font-medium text-slate-800">
                    {expense.description}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-500">
                    <span className="px-2 py-1 bg-slate-100 rounded-full text-xs">
                      {expense.category || 'General'}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-500">
                    {expense.receipt_path ? (
                      <a 
                        href={`${SERVER_URL}/${expense.receipt_path.replace(/\\/g, '/')}`} 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="flex items-center gap-1 text-emerald-600 hover:underline hover:text-emerald-700"
                      >
                        <Eye className="w-3 h-3" /> View
                      </a>
                    ) : <span className="text-slate-300 text-xs">-</span>}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-right font-semibold text-slate-700">
                    {formatCurrency(expense.amount)}
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan="4" className="px-6 py-12 text-center text-slate-400 italic text-sm">
                  No expenses recorded yet.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Mobile Cards */}
      <div className="md:hidden space-y-4">
        {expenses.length > 0 ? (
          expenses.map((expense) => (
            <div key={expense.id} className="bg-white p-4 rounded-xl shadow-sm border border-slate-100">
              <div className="flex justify-between items-start mb-2">
                <div>
                  <p className="text-sm font-medium text-slate-800">{expense.description}</p>
                  <p className="text-xs text-slate-500">{new Date(expense.expense_date).toLocaleDateString("en-GB")}</p>
                </div>
                <span className="font-semibold text-slate-700">{formatCurrency(expense.amount)}</span>
              </div>
              <div className="flex justify-between items-center mt-2">
                <span className="px-2 py-1 bg-slate-100 rounded-full text-xs text-slate-600">{expense.category || 'General'}</span>
                {expense.receipt_path && (
                  <a href={`${SERVER_URL}/${expense.receipt_path.replace(/\\/g, '/')}`} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1 text-xs text-emerald-600 hover:underline">
                    <Eye className="w-3 h-3" /> View Receipt
                  </a>
                )}
              </div>
            </div>
          ))
        ) : (
          <p className="text-center text-slate-400 italic py-8 text-sm">No expenses recorded yet.</p>
        )}
      </div>
    </div>
  );
};

// ---- Notes Feed ------------------------------------------

const NotesFeed = ({ notes = [], newNote, setNewNote, onAddNote }) => (
  <section className="bg-white p-6 rounded-xl shadow-sm border border-slate-100 h-full flex flex-col">
    <div className="flex justify-between items-center mb-4">
      <h3 className="text-lg font-serif text-slate-800">Activity & Notes</h3>
    </div>
    
    <div className="flex-1 overflow-y-auto space-y-4 mb-4 pr-2">
      {notes.length > 0 ? (
        notes.map((note) => (
          <div key={note.id} className="flex gap-3">
            <div className="mt-1 w-2 h-2 rounded-full bg-slate-300 flex-shrink-0" />
            <div>
              <p className="text-sm text-slate-700 whitespace-pre-wrap">{note.note}</p>
              <p className="text-[10px] text-slate-400 mt-1">
                {new Date(note.createdAt).toLocaleString("en-GB", { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
              </p>
            </div>
          </div>
        ))
      ) : (
        <p className="text-center text-slate-400 italic py-4 text-sm">
          No notes added yet.
        </p>
      )}
    </div>

    <form onSubmit={onAddNote} className="mt-auto">
      <div className="relative">
        <input
          type="text"
          value={newNote}
          onChange={(e) => setNewNote(e.target.value)}
          placeholder="Type a note..."
          className="w-full pl-4 pr-12 py-3 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
        />
        <button
          type="submit"
          className="absolute right-2 top-1/2 transform -translate-y-1/2 text-emerald-600 hover:text-emerald-700 p-1"
        >
          <Plus className="w-5 h-5" />
        </button>
      </div>
    </form>
  </section>
);

// ---- Files Panel -----------------------------------------

const FilesPanel = ({ files = [], onFileUpload, onFileDelete }) => {
  const fileInputRef = React.useRef(null);
  const [isUploading, setIsUploading] = useState(false);

  const handleUploadAreaClick = () => {
    fileInputRef.current.click();
  };
  
  const handleFileChange = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    setIsUploading(true);
    try {
      await onFileUpload(file);
    } catch (error) {
      console.error("Upload failed in panel:", error);
      // The parent component will show the alert
    } finally {
      setIsUploading(false);
      e.target.value = null; // Reset file input to allow re-uploading the same file
    }
  };

  const getFileIcon = (fileType) => {
  if (!fileType) return FileIcon;

  if (fileType.startsWith("image/")) return ImageIcon;
  if (fileType === "application/pdf") return FileText;
  if (fileType.includes("spreadsheet") || fileType.includes("excel"))
    return FileSpreadsheet;
  if (fileType.includes("word") || fileType.includes("document"))
    return FileText;

  return FileIcon;
};

  return (
    <section className="bg-white p-6 rounded-xl shadow-sm hover:shadow-md transition-shadow">
      <h3 className="text-lg font-semibold mb-3">Files & Photos</h3>

      <div className="mb-4">
        {/* This is now a button that triggers the hidden input */}
        <button
          type="button"
          onClick={handleUploadAreaClick}
          disabled={isUploading}
          className="cursor-pointer w-full flex items-center justify-center px-4 py-6 bg-gray-50 border-2 border-dashed border-gray-300 rounded-lg text-sm text-gray-500 hover:bg-gray-100 hover:border-indigo-400 transition disabled:opacity-50 disabled:cursor-wait"
        >
          {isUploading ? (
            <span>Uploading...</span>
          ) : (
            <span>+ Click to upload a file</span>
          )}
        </button>
        {/* The actual file input is now completely hidden and controlled by the ref */}
        <input ref={fileInputRef} type="file" className="hidden" onChange={handleFileChange} disabled={isUploading} />
      </div>

      <div className="space-y-2 max-h-64 overflow-y-auto text-sm">
        {files.length > 0 ? (
          files.map((file) => {
            const Icon = getFileIcon(file.file_type);
            return (
              <div key={file.id} className="flex items-center justify-between p-2 rounded-md hover:bg-gray-50">
                <a
                  href={`${SERVER_URL}/${file.file_path.replace(/\\/g, '/')}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-3 group min-w-0" // Added min-w-0 for truncation
                >
                  <Icon className="h-5 w-5 text-gray-500 flex-shrink-0" />
                  <span className="font-medium text-gray-700 group-hover:text-indigo-600 group-hover:underline truncate" title={file.file_name}>
                    {file.file_name}
                  </span>
                </a>
                <button onClick={() => onFileDelete(file.id, file.file_name)} className="text-red-500 hover:text-red-700 text-xs ml-2">
                  Delete
                </button>
              </div>
            );
          })
        ) : (
          <div className="text-center text-gray-400 italic py-4">
            No files uploaded yet.
          </div>
        )}
      </div>
    </section>
  );
};

// ---- Placeholder cards -----------------------------------

const PlaceholderCard = ({ title, description, actionLabel }) => (
  <section className="bg-white p-6 rounded-xl shadow-sm hover:shadow-md transition-shadow">
    <h3 className="text-lg font-semibold mb-2">{title}</h3>
    <p className="text-xs text-gray-500 mb-3">
      {description}
    </p>
    <button
      type="button"
      className="text-xs px-3 py-2 rounded-md border border-dashed border-gray-300 text-gray-500 hover:border-indigo-400 hover:text-indigo-600"
    >
      {actionLabel}
    </button>
  </section>
);

// =========================================================
// MAIN PAGE COMPONENT
// =========================================================

const ProjectDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [project, setProject] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeTab, setActiveTab] = useState("overview");
  const [taskFilter, setTaskFilter] = useState(null);

  const [isTaskModalOpen, setIsTaskModalOpen] = useState(false);
  const [newTaskData, setNewTaskData] = useState({
    description: "",
    details: "",
    due_date: "",
    priority: "Medium",
    trade_category: "General"
  });

  const [newExpense, setNewExpense] = useState({
    description: "",
    amount: "",
    category: "",
    expense_date: new Date().toISOString().split("T")[0],
    receipt: null
  });
  const [newNote, setNewNote] = useState("");

  const fetchProjectDetails = useCallback(async () => {
    try {
      setIsLoading(true);
      const token = localStorage.getItem("token");
      if (!token) {
        navigate("/signin");
        return;
      }

      const res = await axios.get(
        `${API_URL}/projects/${id}`,
        {
          headers: { Authorization: `Bearer ${token}` }
        }
      );
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

  const totalExpenses = useMemo(
    () =>
      project?.expenses?.reduce(
        (sum, expense) => sum + Number(expense.amount),
        0
      ) || 0,
    [project?.expenses]
  );

  const visibleTasks = useMemo(() => {
    const allTasks = project?.tasks || [];
    if (taskFilter === 'high') {
      return allTasks.filter(t => t.priority === 'High');
    }
    if (taskFilter === 'overdue') {
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      return allTasks.filter(t => {
        if (t.status === 'Done' || !t.due_date) return false;
        return new Date(t.due_date) < today;
      });
    }
    return allTasks;
  }, [project?.tasks, taskFilter]);

  const taskProgress = useMemo(() => {
    const tasks = project?.tasks || [];
    if (tasks.length === 0) return 0;
    const done = tasks.filter((t) => t.status === "Done").length;
    return (done / tasks.length) * 100;
  }, [project?.tasks]);

  const highPriorityCount = useMemo(() => {
    return (project?.tasks || []).filter(
      (t) => t.priority === "High" && t.status !== "Done"
    ).length;
  }, [project?.tasks]);

  const overdueCount = useMemo(() => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return (project?.tasks || []).filter((t) => {
      if (t.status === "Done" || !t.due_date) return false;
      const dueDate = new Date(t.due_date);
      return dueDate < today;
    }).length;
  }, [project?.tasks]);

  const tradeStats = useMemo(() => {
    const tasks = project?.tasks || [];
    const stats = {};

    tasks.forEach((task) => {
      const trade = task.trade_category || "General";
      if (!stats[trade]) {
        stats[trade] = { total: 0, completed: 0 };
      }
      stats[trade].total += 1;
      if (task.status === "Done") {
        stats[trade].completed += 1;
      }
    });

    return Object.entries(stats)
      .map(([trade, data]) => ({
        trade,
        ...data,
        percent: data.total > 0 ? Math.round((data.completed / data.total) * 100) : 0,
      }))
      .sort((a, b) => b.total - a.total); // Sort by volume of tasks
  }, [project?.tasks]);

  const formatCurrency = (amount) =>
    new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: "INR"
    }).format(amount || 0);

  const handleAddTask = async (e) => {
    e.preventDefault();
    if (!newTaskData.description.trim()) return;
    try {
      const token = localStorage.getItem("token");
      const res = await axios.post(
        `${API_URL}/projects/${id}/tasks`,
        newTaskData,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setProject((prev) => ({
        ...prev,
        tasks: [res.data, ...(prev.tasks || [])]
      }));
      setIsTaskModalOpen(false);
      setNewTaskData({
        description: "",
        details: "",
        due_date: "",
        priority: "Medium",
        trade_category: "General"
      });
    } catch (err) {
      console.error("Error adding task:", err);
      alert("Failed to add task.");
    }
  };

  const handleAddExpense = async (e) => {
    e.preventDefault();
    try {
      const token = localStorage.getItem("token");
      
      const formData = new FormData();
      formData.append("description", newExpense.description);
      formData.append("amount", newExpense.amount);
      formData.append("category", newExpense.category);
      formData.append("expense_date", newExpense.expense_date);
      if (newExpense.receipt) formData.append("receipt", newExpense.receipt);

      const res = await axios.post(
        `${API_URL}/projects/${id}/expenses`,
        formData,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setProject((prev) => ({
        ...prev,
        expenses: [res.data, ...(prev.expenses || [])]
      }));
      setNewExpense({
        description: "",
        amount: "",
        category: "",
        expense_date: new Date().toISOString().split("T")[0],
        receipt: null
      });
    } catch (err) {
      console.error("Error adding expense:", err);
      alert("Failed to add expense.");
    }
  };

  const handleAddNote = async (e) => {
    e.preventDefault();
    if (!newNote.trim()) return;
    try {
      const token = localStorage.getItem("token");
      const res = await axios.post(
        `${API_URL}/projects/${id}/notes`,
        { note: newNote },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setProject((prev) => ({
        ...prev,
        notes: [res.data, ...(prev.notes || [])]
      }));
      setNewNote("");
    } catch (err) {
      console.error("Error adding note:", err);
      alert("Failed to add note.");
    }
  };

  const handleFileUpload = async (file) => {
    const formData = new FormData();
    formData.append("file", file);

    try {
      const token = localStorage.getItem("token");
      const res = await axios.post(
        `${API_URL}/projects/${id}/files`,
        formData,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setProject((prev) => ({
        ...prev,
        files: [res.data, ...(prev.files || [])]
      }));
    } catch (err) {
      console.error("Error uploading file:", err);
      alert("File upload failed.");
      throw err; // Re-throw to notify the panel
    }
  };

  const handleFileDelete = async (fileId, fileName) => {
    if (!window.confirm(`Are you sure you want to delete "${fileName}"?`)) return;

    try {
      const token = localStorage.getItem("token");
      await axios.delete(`${API_URL}/files/${fileId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setProject((prev) => ({ ...prev, files: prev.files.filter(f => f.id !== fileId) }));
    } catch (err) {
      console.error("Error deleting file:", err);
      alert("Failed to delete file.");
    }
  };

  const handleTaskStatusChange = async (taskId, currentStatus) => {
    // Cycle status: To Do → In Progress → Done → To Do
    const nextStatus =
        currentStatus === "To Do"
            ? "In Progress"
            : currentStatus === "In Progress"
            ? "Done"
            : "To Do";

    try {
        const token = localStorage.getItem("token");

        await axios.put(
            `${API_URL}/tasks/${taskId}`,
            { status: nextStatus },
            { headers: { Authorization: `Bearer ${token}` } }
        );

        // Update local state
        setProject(prev => ({
            ...prev,
            tasks: prev.tasks.map(task =>
                task.id === taskId ? { ...task, status: nextStatus } : task
            )
        }));
    } catch (err) {
        console.error("Error updating task:", err);
        alert("Failed to update task status.");
    }
};


  const handleProjectStatusChange = async (e) => {
    const newStatus = e.target.value;
    if (
      !window.confirm(
        `Are you sure you want to change the project status to "${newStatus}"?`
      )
    ) {
      e.target.value = project.status;
      return;
    }
    try {
      const token = localStorage.getItem("token");
      await axios.put(
        `${API_URL}/projects/${id}/status`,
        { status: newStatus },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setProject((prev) => ({ ...prev, status: newStatus }));
      alert("Project status updated successfully!");
    } catch (err) {
      console.error("Error updating project status:", err);
      alert("Failed to update project status.");
    }
  };

  if (isLoading)
    return (
      <div className="flex h-screen bg-stone-50 justify-center items-center">
        <p>Loading project...</p>
      </div>
    );
  if (error)
    return (
      <div className="flex h-screen bg-gray-100 justify-center items-center">
        <p className="text-red-500">{error}</p>
      </div>
    );
  if (!project)
    return (
      <div className="flex h-screen bg-gray-100 justify-center items-center">
        <p>Project not found.</p>
      </div>
    );

  const variance = project.budget - totalExpenses;

  return (
    <div className="flex h-screen bg-stone-50 text-slate-800 font-sans">
      <Sidebar />
      <main className="flex-1 overflow-y-auto pt-16 md:pt-0">
        
        {/* HERO HEADER */}
        <div className="relative h-64 w-full bg-slate-900">
          <div 
            className="absolute inset-0 bg-cover bg-center opacity-40"
            style={{ backgroundImage: 'url("https://images.unsplash.com/photo-1618221195710-dd6b41faaea6?auto=format&fit=crop&q=80&w=2000")' }}
          />
          <div className="absolute inset-0 bg-gradient-to-t from-slate-900 via-transparent to-transparent" />
          
          <div className="absolute bottom-0 left-0 w-full p-4 md:p-8 flex flex-col md:flex-row justify-between items-start md:items-end gap-4">
            <div className="text-white">
              <div className="flex items-center gap-3 mb-2">
                <span className="px-3 py-1 rounded-full bg-white/20 backdrop-blur-sm text-xs font-medium border border-white/10">
                  {project.status}
                </span>
                <span className="text-slate-300 text-sm">ID: #{project.id}</span>
              </div>
              <h1 className="text-4xl font-serif font-medium tracking-tight mb-1">{project.name}</h1>
              <p className="text-slate-300 text-lg font-light">Client: {project.client_name}</p>
            </div>
            
            <div className="flex gap-3">
               <select
                  value={project.status}
                  onChange={handleProjectStatusChange}
                  className="bg-white/10 backdrop-blur-md text-white border border-white/20 rounded-lg px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 [&>option]:text-slate-800"
                >
                  <option value="Not Started">Not Started</option>
                  <option value="In Progress">In Progress</option>
                  <option value="On Hold">On Hold</option>
                  <option value="Completed">Completed</option>
                </select>
                <button onClick={() => navigate("/projects")} className="bg-white text-slate-900 px-4 py-2 rounded-lg text-sm font-medium hover:bg-slate-100 transition-colors">
                  Back to List
                </button>
            </div>
          </div>
        </div>

        {/* TABS NAVIGATION */}
        <div className="px-0 md:px-8 border-b border-slate-200 bg-white sticky top-0 z-10 overflow-x-auto no-scrollbar">
          <div className="flex justify-between md:justify-start md:gap-8 min-w-full md:min-w-max px-1 md:px-0">
            {[
              { id: "overview", label: "Overview", mobileLabel: "Overview", icon: LayoutDashboard },
              { id: "tasks", label: "Task Board", mobileLabel: "Tasks", icon: CheckSquare },
              { id: "design", label: "Design & Materials", mobileLabel: "Design", icon: Palette },
              { id: "financials", label: "Financials", mobileLabel: "Finance", icon: DollarSign },
              { id: "files", label: "Docs & Media", mobileLabel: "Files", icon: FolderOpen },
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex flex-col md:flex-row items-center justify-center gap-1 md:gap-2 py-2 md:py-4 text-[10px] md:text-sm font-medium border-b-2 transition-colors flex-1 md:flex-none ${
                  activeTab === tab.id
                    ? "border-emerald-600 text-emerald-700"
                    : "border-transparent text-slate-500 hover:text-slate-700"
                }`}
              >
                <tab.icon className="w-4 h-4 md:w-4 md:h-4" />
                <span className="hidden md:inline">{tab.label}</span>
                <span className="md:hidden">{tab.mobileLabel}</span>
              </button>
            ))}
          </div>
        </div>

        {/* TAB CONTENT */}
        <div className="p-4 md:p-8 min-h-[calc(100vh-300px)]">
          
          {activeTab === "overview" && (
            <div className="space-y-8">
              <PhaseStepper currentStatus={project.status} />
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <StatCard
                  label="Total Budget"
                  value={formatCurrency(project.budget)}
                  subLabel="Allocated for this project"
                />
                <StatCard
                  label="Budget Spent"
                  value={formatCurrency(totalExpenses)}
                  subLabel={`${((totalExpenses / project.budget) * 100).toFixed(1)}% utilized`}
                  progress={(totalExpenses / project.budget) * 100}
                />
                <StatCard
                  label="Remaining"
                  value={formatCurrency(variance)}
                  subLabel={variance >= 0 ? "Currently under budget" : "Over budget alert"}
                />
              </div>

              {/* Urgency Row */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div 
                  onClick={() => { setActiveTab('tasks'); setTaskFilter('high'); }}
                  className="bg-white p-6 rounded-xl border border-slate-100 shadow-sm flex items-center gap-4 relative overflow-hidden cursor-pointer hover:shadow-md transition-all hover:scale-[1.01]"
                >
                  <div className="absolute left-0 top-0 bottom-0 w-1 bg-red-500"></div>
                  <div className="p-3 bg-red-50 rounded-full text-red-600">
                    <AlertTriangle className="w-6 h-6" />
                  </div>
                  <div>
                    <p className="text-3xl font-sans font-semibold text-slate-800">{highPriorityCount}</p>
                    <p className="text-xs uppercase tracking-wider text-slate-500 font-medium">High Priority Tasks Remaining</p>
                  </div>
                </div>

                <div 
                  onClick={() => { setActiveTab('tasks'); setTaskFilter('overdue'); }}
                  className="bg-white p-6 rounded-xl border border-slate-100 shadow-sm flex items-center gap-4 relative overflow-hidden cursor-pointer hover:shadow-md transition-all hover:scale-[1.01]"
                >
                  <div className="absolute left-0 top-0 bottom-0 w-1 bg-red-500"></div>
                  <div className="p-3 bg-red-50 rounded-full text-red-600">
                    <Clock className="w-6 h-6" />
                  </div>
                  <div>
                    <p className="text-3xl font-sans font-semibold text-slate-800">{overdueCount}</p>
                    <p className="text-xs uppercase tracking-wider text-slate-500 font-medium">Tasks Overdue</p>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 h-96">
                <div className="lg:col-span-2 bg-white p-6 rounded-xl shadow-sm border border-slate-100 overflow-y-auto">
                   <h3 className="text-lg font-serif text-slate-800 mb-4">Progress by Trade</h3>
                   <div className="space-y-5">
                     {tradeStats.length > 0 ? (
                       tradeStats.map((stat) => (
                         <div key={stat.trade}>
                           <div className="flex justify-between items-end mb-1">
                             <span className="text-sm font-medium text-slate-700">{stat.trade}</span>
                             <span className="text-xs text-slate-500 font-medium">
                               {stat.percent}% ({stat.completed}/{stat.total})
                             </span>
                           </div>
                           <div className="w-full bg-slate-100 rounded-full h-2">
                             <div 
                               className={`h-2 rounded-full transition-all duration-500 ${stat.percent === 100 ? 'bg-emerald-500' : 'bg-slate-800'}`} 
                               style={{ width: `${stat.percent}%` }} 
                             />
                           </div>
                         </div>
                       ))
                     ) : (
                       <div className="text-center py-8 text-slate-400 text-sm italic">
                         No tasks tracked yet. Add tasks with trade categories to see progress here.
                       </div>
                     )}
                   </div>
                </div>
                <NotesFeed notes={project.notes} newNote={newNote} setNewNote={setNewNote} onAddNote={handleAddNote} />
              </div>
            </div>
          )}

          {activeTab === "tasks" && (
            <TasksPanel 
              tasks={visibleTasks} 
              onOpenAddTask={() => setIsTaskModalOpen(true)} 
              onToggleTask={handleTaskStatusChange} 
              activeFilter={taskFilter}
              onClearFilter={() => setTaskFilter(null)}
            />
          )}

          {activeTab === "design" && (
            <MaterialsPanel />
          )}

          {activeTab === "financials" && (
            <ExpensePanel 
              expenses={project.expenses} 
              newExpense={newExpense} 
              setNewExpense={setNewExpense} 
              onAddExpense={handleAddExpense} 
              formatCurrency={formatCurrency} 
              budget={project.budget}
              totalExpenses={totalExpenses}
            />
          )}

          {activeTab === "files" && (
            <FilesPanel files={project.files} onFileUpload={handleFileUpload} onFileDelete={handleFileDelete} />
          )}

        </div>
      </main>

      <TaskModal 
        isOpen={isTaskModalOpen} 
        onClose={() => setIsTaskModalOpen(false)} 
        onSubmit={handleAddTask}
        newTaskData={newTaskData}
        setNewTaskData={setNewTaskData}
      />
    </div>
  );
};

export default ProjectDetail;
