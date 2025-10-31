const express = require("express");
const db = require("../db/db");
const task_router = express.Router();

// 🟢 GET all tasks (with filtering and sorting)
task_router.get("/", (req, res) => {
  const { status, priority, sort } = req.query;
  let query = "SELECT * FROM tasks WHERE 1=1";
  const params = [];

  if (status) {
    query += " AND status = ?";
    params.push(status);
  }
  if (priority) {
    query += " AND priority = ?";
    params.push(priority);
  }

  if (sort === "due_date_asc") query += " ORDER BY due_date ASC";
  else if (sort === "due_date_desc") query += " ORDER BY due_date DESC";
  else query += " ORDER BY created_at DESC";

  const rows = db.prepare(query).all(...params);
  res.json(rows);
});

// 🟢 POST new task
task_router.post("/", (req, res) => {
  const { title, description, priority, dueDate, status } = req.body;
  if (!title || !priority || !dueDate)
    return res.status(400).json({ status: "error", message: "Missing required fields" });

  const stmt = db.prepare(
    "INSERT INTO tasks (title, description, priority, due_date, status) VALUES (?, ?, ?, ?, ?)"
  );
  stmt.run(title, description, priority, dueDate, status);
  res.json({ status: "success", message: "Task added successfully" });
});

// 🟢 PATCH task by ID
task_router.patch("/:id", (req, res) => {
  const { id } = req.params;
  const { title, description, priority, dueDate, status } = req.body;
  db.prepare(
    "UPDATE tasks SET title=?, description=?, priority=?, due_date=?, status=? WHERE id=?"
  ).run(title, description, priority, dueDate, status, id);
  res.json({ status: "success", message: `Task ${id} updated successfully` });
});

// 🧠 GET insights
task_router.get("/insight", (req, res) => {
  const total = db.prepare("SELECT COUNT(*) as count FROM tasks").get().count;
  const open = db.prepare("SELECT COUNT(*) as count FROM tasks WHERE status='Open'").get().count;
  const inProgress = db
    .prepare("SELECT COUNT(*) as count FROM tasks WHERE status='In Progress'")
    .get().count;
  const done = db.prepare("SELECT COUNT(*) as count FROM tasks WHERE status='Done'").get().count;

  const highPriority = db
    .prepare("SELECT COUNT(*) as count FROM tasks WHERE priority='High'")
    .get().count;
  const dueSoon = db
    .prepare(
      "SELECT COUNT(*) as count FROM tasks WHERE julianday(due_date) - julianday('now') <= 3 AND status != 'Done'"
    )
    .get().count;

  let message = `You have ${total} tasks — ${open} open, ${inProgress} in progress, and ${done} done.`;
  if (highPriority > total * 0.5) message += " ⚠️ Most of your tasks are high priority!";
  if (dueSoon > 0) message += ` ⏰ ${dueSoon} tasks are due soon.`;
  if (done === total && total > 0) message += " 🎉 All tasks are complete!";

  res.json({ status: "success", message });
});

module.exports = task_router;
