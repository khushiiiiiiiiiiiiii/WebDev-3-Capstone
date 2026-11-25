require("dotenv").config();
const mongoose = require("mongoose");
const User = require("./src/models/User");
const Question = require("./src/models/Question");
const Exam = require("./src/models/Exam");

async function seed() {
  await mongoose.connect(process.env.MONGO_URI);
  await Promise.all([User.deleteMany({}), Question.deleteMany({}), Exam.deleteMany({})]);
  const admin = await User.create({ name: "System Admin", email: "admin@example.com", password: "Admin@12345", role: "admin" });
  const faculty = await User.create({ name: "Demo Faculty", email: "faculty@example.com", password: "Faculty@123", role: "faculty" });
  const student = await User.create({ name: "Demo Student", email: "student@example.com", password: "Student@123", role: "student", section: "BCA-A" });
  const questions = await Question.create([
    { createdBy: faculty._id, text: "Which runtime executes JavaScript outside the browser?", options: [{id:"a",text:"Node.js"},{id:"b",text:"HTML"},{id:"c",text:"CSS"},{id:"d",text:"Figma"}], correctOptionId: "a", marks: 2, subject: "Backend Development", topic: "Node.js", difficulty: "easy" },
    { createdBy: faculty._id, text: "Which method is used to define a Mongoose schema?", options: [{id:"a",text:"mongoose.Model"},{id:"b",text:"new mongoose.Schema"},{id:"c",text:"express.Router"},{id:"d",text:"http.createServer"}], correctOptionId: "b", marks: 2, subject: "Backend Development", topic: "MongoDB", difficulty: "easy" }
  ]);
  const now = Date.now();
  const exam = await Exam.create({
    title: "Backend Development Demo Test", instructions: "Choose one answer for each question.",
    createdBy: faculty._id, questions: questions.map(q => q._id), durationMinutes: 30,
    startAt: new Date(now - 60 * 60 * 1000), endAt: new Date(now + 7 * 24 * 60 * 60 * 1000),
    assignedStudents: [student._id], randomizeQuestions: false, isPublished: true
  });
  console.log("Seed complete:", { admin: admin.email, faculty: faculty.email, student: student.email, examId: exam._id });
  await mongoose.disconnect();
}
seed().catch(e => { console.error(e); process.exit(1); });
