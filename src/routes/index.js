const router = require("express").Router();
const auth = require("../middleware/auth");
const { bodyRequired } = require("../middleware/validate");
const asyncHandler = require("../utils/asyncHandler");
const authC = require("../controllers/authController");
const users = require("../controllers/userController");
const questions = require("../controllers/questionController");
const exams = require("../controllers/examController");
const attempts = require("../controllers/attemptController");
const reports = require("../controllers/reportController");

router.post("/auth/register", authC.register);
router.post("/auth/login", bodyRequired("email", "password"), authC.login);
router.post("/auth/refresh", authC.refresh);
router.post("/auth/logout", auth.protect, authC.logout);
router.get("/users/me", auth.protect, authC.me);

router.get("/users", auth.protect, auth.allow("admin"), users.list);
router.post("/users", auth.protect, auth.allow("admin"), users.create);
router.patch("/users/:id", auth.protect, auth.allow("admin"), users.update);
router.delete("/users/:id", auth.protect, auth.allow("admin"), users.remove);

router.route("/questions")
  .get(auth.protect, auth.allow("admin", "faculty"), questions.list)
  .post(auth.protect, auth.allow("admin", "faculty"), questions.create);
router.patch("/questions/:id", auth.protect, auth.allow("admin", "faculty"), questions.update);
router.delete("/questions/:id", auth.protect, auth.allow("admin", "faculty"), questions.remove);

router.route("/exams")
  .get(auth.protect, exams.list)
  .post(auth.protect, auth.allow("admin", "faculty"), exams.create);
router.get("/exams/:id", auth.protect, exams.get);
router.patch("/exams/:id", auth.protect, auth.allow("admin", "faculty"), exams.update);
router.delete("/exams/:id", auth.protect, auth.allow("admin", "faculty"), exams.remove);

router.post("/exams/:examId/attempts", auth.protect, auth.allow("student"), attempts.start);
router.put("/attempts/:attemptId/answers", auth.protect, auth.allow("student"), attempts.saveAnswers);
router.post("/attempts/:attemptId/submit", auth.protect, auth.allow("student"), attempts.submit);
router.get("/results/me", auth.protect, auth.allow("student"), attempts.myResults);

router.get("/reports/exams", auth.protect, auth.allow("admin", "faculty"), reports.examSummary);
router.get("/reports/students", auth.protect, auth.allow("admin", "faculty"), reports.studentPerformance);

module.exports = router;
