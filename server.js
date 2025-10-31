const express = require("express");
const cors = require("cors");
const task_router = require("./src/routes/tasks_routes");

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());
app.use("/tasks", task_router);

app.listen(PORT, () => {
  console.log(`✅ Server running on port ${PORT}`);
});
