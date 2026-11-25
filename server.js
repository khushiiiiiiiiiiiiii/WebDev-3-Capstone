require("dotenv").config();
const http = require("http");
const app = require("./src/app");
const connectDB = require("./src/config/db");
const { Server } = require("socket.io");
const jwt = require("jsonwebtoken");
const Exam = require("./src/models/Exam");

const PORT = process.env.PORT || 5000;

async function start() {
  await connectDB();
  const server = http.createServer(app);
  const io = new Server(server, {
    cors: { origin: process.env.CLIENT_ORIGIN || "*", methods: ["GET", "POST"] }
  });

  // Socket authentication: clients connect with { auth: { token: accessToken } }.
  io.use((socket, next) => {
    try {
      const token = socket.handshake.auth?.token;
      if (!token) return next(new Error("Authentication required"));
      socket.user = jwt.verify(token, process.env.JWT_ACCESS_SECRET);
      next();
    } catch {
      next(new Error("Invalid or expired token"));
    }
  });

  io.on("connection", socket => {
    socket.join(`user:${socket.user.id}`);
    socket.on("exam:join", async ({ examId } = {}) => {
      if (!examId) return;
      const exam = await Exam.findById(examId).select("assignedStudents assignedSections");
      if (!exam) return socket.emit("app:error", { message: "Exam not found" });
      const allowed = socket.user.role === "admin" ||
        (socket.user.role === "student" &&
         (exam.assignedStudents.some(id => String(id) === socket.user.id)));
      if (allowed) socket.join(`exam:${examId}`);
      else socket.emit("app:error", { message: "Not authorized for this exam room" });
    });
  });

  app.set("io", io);
  server.listen(PORT, () => console.log(`API running on http://localhost:${PORT}`));
}
start().catch(err => { console.error("Startup failed:", err); process.exit(1); });
