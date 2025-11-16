import React, {
  useEffect,
  useState,
  useMemo,
  useCallback
} from "react";
import axios from "axios";
import Sidebar from "./Sidebar";
import { useParams, useNavigate } from "react-router-dom";
import {
  Image as ImageIcon,
  File as FileIcon,
  FileSpreadsheet,
  FileText,
  FileCode,
  FileArchive,
  FileSearch
} from "lucide-react";

// ---- Small reusable UI components ------------------------

const StatCard = ({ label, value, subLabel, className = "" }) => (
  <div
    className={
      "bg-white p-5 rounded-xl shadow-sm hover:shadow-md transition-shadow " +
      className
    }
  >
    <p className="text-xs uppercase tracking-wide text-gray-500 mb-1">
      {label}
    </p>
    <p className="text-2xl font-semibold text-gray-800">{value}</p>
    {subLabel && (
      <p className="text-xs text-gray-400 mt-1">{subLabel}</p>
    )}
  </div>
);

const ProgressCircle = ({ percent }) => {
  const radius = 18;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (percent / 100) * circumference;

  return (
    <div className="flex items-center gap-3 bg-white p-5 rounded-xl shadow-sm hover:shadow-md transition-shadow">
      <div className="relative w-10 h-10 flex items-center justify-center">
  <svg
    width="40"
    height="40"
    viewBox="0 0 40 40"
    className="-rotate-90"
  >
    <circle
      cx="20"
      cy="20"
      r="18"
      stroke="#E5E7EB"
      strokeWidth="4"
      fill="none"
    />
    <circle
      cx="20"
      cy="20"
      r="18"
      stroke="#4F46E5"
      strokeWidth="4"
      fill="none"
      strokeDasharray={2 * Math.PI * 18}
      strokeDashoffset={
        2 * Math.PI * 18 - (percent / 100) * (2 * Math.PI * 18)
      }
      strokeLinecap="round"
    />
  </svg>

  <span className="absolute text-xs font-semibold text-gray-700">
    {Math.round(percent)}%
  </span>
</div>

      
      <div>
        <p className="text-xs uppercase tracking-wide text-gray-500">
          Progress
        </p>
        <p className="text-sm text-gray-600">
          Based on completed tasks
        </p>
      </div>
    </div>
  );
};

// Simple tabs wrapper
const Tabs = ({ tabs, active, onChange }) => (
  <div className="flex gap-4 border-b mb-4 text-sm">
    {tabs.map((tab) => (
      <button
        key={tab}
        onClick={() => onChange(tab)}
        className={
          "pb-2 -mb-px border-b-2 transition-colors " +
          (active === tab
            ? "border-indigo-600 text-indigo-600 font-medium"
            : "border-transparent text-gray-500 hover:text-gray-700")
        }
      >
        {tab}
      </button>
    ))}
  </div>
);

// ---- Tasks Panel -----------------------------------------

const TasksPanel = ({
  tasks = [],
  newTask,
  setNewTask,
  onAddTask,
  onToggleTask
}) => {
  const [view, setView] = useState("Board"); // Board | List

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
    <section className="bg-white p-6 rounded-xl shadow-sm hover:shadow-md transition-shadow">
      <div className="flex justify-between items-center mb-3">
        <h3 className="text-lg font-semibold">Tasks</h3>
        <span className="text-xs text-gray-400">
          {tasks.length} total
        </span>
      </div>

      <form
        onSubmit={onAddTask}
        className="flex gap-2 mb-4"
      >
        <input
          type="text"
          value={newTask}
          onChange={(e) => setNewTask(e.target.value)}
          placeholder="Add a new task..."
          className="flex-grow px-3 py-2 border rounded-md text-sm"
        />
        <button
          type="submit"
          className="bg-indigo-600 text-white px-4 py-2 rounded-md hover:bg-indigo-700 text-sm"
        >
          Add
        </button>
      </form>

      <Tabs
        tabs={["Board", "List"]}
        active={view}
        onChange={setView}
      />

      {/* Board view */}
      {view === "Board" && (
        <div className="grid grid-cols-3 gap-4">
          {["To Do", "In Progress", "Done"].map((col) => (
            <div key={col}>
              <div className="flex items-center justify-between mb-2">
                <p className="text-xs font-semibold uppercase text-gray-500">
                  {col}
                </p>
                <span className="text-xs text-gray-400">
                  {grouped[col]?.length || 0}
                </span>
              </div>
              <div className="bg-gray-50 rounded-lg p-2 min-h-[120px] max-h-72 overflow-y-auto">
                {grouped[col] && grouped[col].length > 0 ? (
                  grouped[col].map((task) => (
                    <div
                      key={task.id}
                      className="flex items-center gap-2 p-2 mb-1 bg-white rounded-md shadow-sm"
                    >
                      <div
  key={task.id}
  className="flex items-center justify-between p-2 mb-1 bg-white rounded-md shadow-sm"
>
  <span
    className={
      "text-xs flex-grow " +
      (task.status === "Done"
        ? "line-through text-gray-400"
        : "text-gray-700")
    }
  >
    {task.description}
  </span>

  <button
    onClick={() => onToggleTask(task.id, task.status)}
    className={
      "text-[10px] px-2 py-1 ml-2 rounded-full border transition " +
      (task.status === "To Do"
        ? "bg-gray-100 text-gray-700 border-gray-300"
        : task.status === "In Progress"
        ? "bg-yellow-100 text-yellow-700 border-yellow-300"
        : "bg-green-100 text-green-700 border-green-300")
    }
  >
    {task.status}
  </button>
</div>

                    </div>
                  ))
                ) : (
                  <p className="text-xs text-gray-400 text-center py-4">
                    No tasks in this column.
                  </p>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* List view */}
      {view === "List" && (
        <ul className="space-y-2 max-h-72 overflow-y-auto">
          {tasks.length > 0 ? (
            tasks.map((task) => (
              <li
                key={task.id}
                className="flex items-center gap-3 p-2 rounded-md hover:bg-gray-50 text-sm"
              >
                <input
                  type="checkbox"
                  checked={task.status === "Done"}
                  onChange={() => onToggleTask(task.id, task.status)}
                  className="h-4 w-4 text-indigo-600 rounded border-gray-300"
                />
                <span
                  className={
                    "flex-grow " +
                    (task.status === "Done"
                      ? "line-through text-gray-400"
                      : "text-gray-700")
                  }
                >
                  {task.description}
                </span>
                <span className="text-xs px-2 py-1 rounded-full bg-gray-100 text-gray-500">
                  {task.status || "To Do"}
                </span>
              </li>
            ))
          ) : (
            <li className="text-center text-gray-400 italic py-4 text-sm">
              No tasks added yet.
            </li>
          )}
        </ul>
      )}
    </section>
  );
};

// ---- Expenses Panel --------------------------------------

const ExpensePanel = ({
  expenses = [],
  newExpense,
  setNewExpense,
  onAddExpense,
  formatCurrency
}) => {
  const totalExpenses = useMemo(
    () =>
      expenses.reduce(
        (sum, e) => sum + Number(e.amount || 0),
        0
      ),
    [expenses]
  );

  return (
    <section className="bg-white p-6 rounded-xl shadow-sm hover:shadow-md transition-shadow">
      <div className="flex justify-between items-center mb-3">
        <h3 className="text-lg font-semibold">Expenses</h3>
        <p className="text-xs text-gray-400">
          Total:{" "}
          <span className="font-semibold text-gray-700">
            {formatCurrency(totalExpenses)}
          </span>
        </p>
      </div>

      <form
        onSubmit={onAddExpense}
        className="grid grid-cols-2 gap-3 mb-4 text-sm"
      >
        <input
          type="text"
          value={newExpense.description}
          onChange={(e) =>
            setNewExpense((p) => ({
              ...p,
              description: e.target.value
            }))
          }
          placeholder="Description"
          required
          className="col-span-2 px-3 py-2 border rounded-md"
        />
        <input
          type="number"
          value={newExpense.amount}
          onChange={(e) =>
            setNewExpense((p) => ({
              ...p,
              amount: e.target.value
            }))
          }
          placeholder="Amount"
          required
          className="px-3 py-2 border rounded-md"
        />
        <input
          type="date"
          value={newExpense.expense_date}
          onChange={(e) =>
            setNewExpense((p) => ({
              ...p,
              expense_date: e.target.value
            }))
          }
          required
          className="px-3 py-2 border rounded-md"
        />
        <input
          type="text"
          value={newExpense.category}
          onChange={(e) =>
            setNewExpense((p) => ({
              ...p,
              category: e.target.value
            }))
          }
          placeholder="Category (e.g., Labor)"
          className="col-span-2 px-3 py-2 border rounded-md"
        />
        <button
          type="submit"
          className="col-span-2 bg-indigo-600 text-white py-2 rounded-md hover:bg-indigo-700"
        >
          Add Expense
        </button>
      </form>

      <ul className="space-y-2 max-h-64 overflow-y-auto text-sm">
        {expenses.length > 0 ? (
          expenses.map((expense) => (
            <li
              key={expense.id}
              className="flex justify-between items-start p-2 rounded-md hover:bg-gray-50"
            >
              <div>
                <p className="font-medium text-gray-800">
                  {expense.description}
                </p>
                <p className="text-xs text-gray-400">
                  {expense.category && `${expense.category} · `}
                  {new Date(
                    expense.expense_date
                  ).toLocaleDateString("en-GB")}
                </p>
              </div>
              <p className="font-semibold">
                {formatCurrency(expense.amount)}
              </p>
            </li>
          ))
        ) : (
          <li className="text-center text-gray-400 italic py-4">
            No expenses logged yet.
          </li>
        )}
      </ul>
    </section>
  );
};

// ---- Notes Feed ------------------------------------------

const NotesFeed = ({ notes = [], newNote, setNewNote, onAddNote }) => (
  <section className="bg-white p-6 rounded-xl shadow-sm hover:shadow-md transition-shadow">
    <div className="flex justify-between items-center mb-3">
      <h3 className="text-lg font-semibold">Project Notes</h3>
      <span className="text-xs text-gray-400">
        {notes.length} notes
      </span>
    </div>
    <form
      onSubmit={onAddNote}
      className="flex flex-col gap-2 mb-4"
    >
      <textarea
        value={newNote}
        onChange={(e) => setNewNote(e.target.value)}
        placeholder="Add a new note..."
        rows="3"
        className="w-full px-3 py-2 border rounded-md text-sm"
      />
      <button
        type="submit"
        className="bg-indigo-600 text-white px-4 py-2 rounded-md hover:bg-indigo-700 self-end text-sm"
      >
        Add Note
      </button>
    </form>

    <ul className="space-y-3 max-h-72 overflow-y-auto text-sm">
      {notes.length > 0 ? (
        notes.map((note) => (
          <li
            key={note.id}
            className="p-3 rounded-md bg-gray-50 border"
          >
            <p className="text-gray-700 whitespace-pre-wrap">
              {note.note}
            </p>
            <p className="text-xs text-gray-400 text-right mt-2">
              {new Date(note.createdAt).toLocaleString("en-GB")}
            </p>
          </li>
        ))
      ) : (
        <li className="text-center text-gray-400 italic py-4">
          No notes added yet.
        </li>
      )}
    </ul>
  </section>
);

// ---- Files Panel -----------------------------------------

const FilesPanel = ({ files = [], onFileUpload, onFileDelete }) => {
  // We need useRef to programmatically click the hidden file input
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
                  href={`http://localhost:3001/${file.file_path.replace(/\\/g, '/')}`}
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

  const [newTask, setNewTask] = useState("");
  const [newExpense, setNewExpense] = useState({
    description: "",
    amount: "",
    category: "",
    expense_date: new Date().toISOString().split("T")[0]
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
        `http://localhost:3001/api/v1/projects/${id}`,
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

  const taskProgress = useMemo(() => {
    const tasks = project?.tasks || [];
    if (tasks.length === 0) return 0;
    const done = tasks.filter((t) => t.status === "Done").length;
    return (done / tasks.length) * 100;
  }, [project?.tasks]);

  const formatCurrency = (amount) =>
    new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: "INR"
    }).format(amount || 0);

  const handleAddTask = async (e) => {
    e.preventDefault();
    if (!newTask.trim()) return;
    try {
      const token = localStorage.getItem("token");
      const res = await axios.post(
        `http://localhost:3001/api/v1/projects/${id}/tasks`,
        { description: newTask },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setProject((prev) => ({
        ...prev,
        tasks: [res.data, ...(prev.tasks || [])]
      }));
      setNewTask("");
    } catch (err) {
      console.error("Error adding task:", err);
      alert("Failed to add task.");
    }
  };

  const handleAddExpense = async (e) => {
    e.preventDefault();
    try {
      const token = localStorage.getItem("token");
      const res = await axios.post(
        `http://localhost:3001/api/v1/projects/${id}/expenses`,
        newExpense,
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
        expense_date: new Date()
          .toISOString()
          .split("T")[0]
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
        `http://localhost:3001/api/v1/projects/${id}/notes`,
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
        `http://localhost:3001/api/v1/projects/${id}/files`,
        formData,
        { headers: { Authorization: `Bearer ${token}`, "Content-Type": "multipart/form-data" } }
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
      await axios.delete(`http://localhost:3001/api/v1/files/${fileId}`, {
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
            `http://localhost:3001/api/v1/tasks/${taskId}`,
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
        `http://localhost:3001/api/v1/projects/${id}/status`,
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
      <div className="flex h-screen bg-gray-100 justify-center items-center">
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
    <div className="flex h-screen bg-gradient-to-br from-gray-100 via-white to-gray-50 text-gray-800">
      <Sidebar />
      <main className="flex-1 p-8 overflow-y-auto">
        {/* HEADER */}
        <header className="mb-6 border-b pb-4">
          <div className="flex justify-between items-start gap-4">
            <div>
              <h1 className="text-2xl font-semibold text-gray-900 tracking-tight">
                {project.name}
              </h1>
              <p className="text-sm text-gray-500 mt-1">
                Client: {project.client_name}
              </p>
              <p className="text-xs text-gray-400 mt-1">
                Project ID: {project.id}
              </p>
            </div>
            <div className="flex items-center gap-4">
              <button
                onClick={() => navigate("/projects")}
                className="bg-gray-700 text-white px-4 py-2 rounded-lg shadow hover:bg-gray-800 text-sm"
              >
                Back to Projects
              </button>
              <div className="flex flex-col">
                <label
                  htmlFor="project-status"
                  className="text-xs text-gray-500 mb-1"
                >
                  Status
                </label>
                <select
                  id="project-status"
                  value={project.status}
                  onChange={handleProjectStatusChange}
                  className={
                    "px-3 py-1 rounded-full text-xs font-medium border-transparent focus:border-gray-300 focus:ring-0 " +
                    ({
                      Completed:
                        "bg-green-100 text-green-700",
                      "On Hold":
                        "bg-red-100 text-red-700",
                      "Not Started":
                        "bg-gray-100 text-gray-600",
                      "In Progress":
                        "bg-yellow-100 text-yellow-700"
                    }[project.status] ||
                      "bg-gray-100 text-gray-600")
                  }
                >
                  <option value="Not Started">
                    Not Started
                  </option>
                  <option value="In Progress">
                    In Progress
                  </option>
                  <option value="On Hold">On Hold</option>
                  <option value="Completed">
                    Completed
                  </option>
                </select>
              </div>
            </div>
          </div>
        </header>

        {/* TOP STATS */}
        <section className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
          <StatCard
            label="Budget"
            value={formatCurrency(project.budget)}
          />
          <StatCard
            label="Spent"
            value={formatCurrency(totalExpenses)}
          />
          <StatCard
            label="Variance"
            value={formatCurrency(variance)}
            subLabel={
              variance >= 0
                ? "Under budget"
                : "Over budget"
            }
          />
          <ProgressCircle percent={taskProgress} />
        </section>

        {/* MAIN GRID */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
          {/* LEFT: Tasks + Timeline placeholder */}
          <div className="lg:col-span-2 space-y-6">
            <TasksPanel
              tasks={project.tasks}
              newTask={newTask}
              setNewTask={setNewTask}
              onAddTask={handleAddTask}
              onToggleTask={handleTaskStatusChange}
            />

            <PlaceholderCard
              title="Timeline & Milestones"
              description="Track major phases like Design, Procurement, Execution, and Handover. You can later connect this to real milestones in the database."
              actionLabel="(Coming soon) Plan milestones"
            />
          </div>

          {/* RIGHT: Expenses + Materials + Files */}
          <div className="space-y-6">
            <ExpensePanel
              expenses={project.expenses}
              newExpense={newExpense}
              setNewExpense={setNewExpense}
              onAddExpense={handleAddExpense}
              formatCurrency={formatCurrency}
            />

            <PlaceholderCard
              title="Materials"
              description="Link project to materials from your material library (tiles, paint, electrical, etc.)."
              actionLabel="(Coming soon) Add materials"
            />

           <FilesPanel
              files={project.files}
              onFileUpload={handleFileUpload}
              onFileDelete={handleFileDelete}
           />
          </div>
        </div>

        {/* NOTES (BOTTOM, FULL WIDTH) */}
        <NotesFeed
          notes={project.notes}
          newNote={newNote}
          setNewNote={setNewNote}
          onAddNote={handleAddNote}
        />
      </main>
    </div>
  );
};

export default ProjectDetail;
