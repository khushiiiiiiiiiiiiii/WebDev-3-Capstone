# Online Examination and Assessment Management System
**Backend Development Capstone – Project Option 2**

## 1. Overview
A REST API backend for question-bank management, examination scheduling, student attempts, automatic MCQ evaluation and performance reports. It uses Node.js, Express, MongoDB, Mongoose, bcrypt, JWT and Socket.IO.

## 2. Requirements
- Node.js 18+
- npm
- MongoDB Community Server or MongoDB Atlas
- Postman (for API testing)

## 3. Installation
```bash
npm install
cp .env.example .env
```
Edit `.env` and set `MONGO_URI`, `JWT_ACCESS_SECRET`, and `JWT_REFRESH_SECRET` to your own values. Never commit `.env`.

## 4. Run
```bash
npm run seed
npm run dev
```
API base URL: `http://localhost:5000/api`  
Health check: `GET http://localhost:5000/health`

Demo accounts created by seed:
- Admin: `admin@example.com` / `Admin@12345`
- Faculty: `faculty@example.com` / `Faculty@123`
- Student: `student@example.com` / `Student@123`

Change these demo passwords before any deployment. Seed deletes existing users/questions/exams in the configured database; use only a development database.

## 5. Main API routes
All protected routes use `Authorization: Bearer <accessToken>`.

| Method | Endpoint | Role | Purpose |
|---|---|---|---|
| POST | `/auth/register` | Public | Register student |
| POST | `/auth/login` | Public | Login |
| POST | `/auth/refresh` | Public | Rotate access/refresh token |
| POST | `/auth/logout` | Authenticated | Invalidate refresh tokens |
| GET | `/users/me` | Any | Current profile |
| GET/POST | `/users` | Admin | List/create users |
| PATCH/DELETE | `/users/:id` | Admin | Update/delete user |
| GET/POST | `/questions` | Faculty/Admin | List/create question |
| PATCH/DELETE | `/questions/:id` | Faculty/Admin | Update/delete question |
| GET/POST | `/exams` | Authenticated / Faculty/Admin | List/create exams |
| GET | `/exams/:id` | Authenticated | Exam details (answer key excluded) |
| PATCH/DELETE | `/exams/:id` | Faculty/Admin | Update/delete exam |
| POST | `/exams/:examId/attempts` | Student | Start attempt |
| PUT | `/attempts/:attemptId/answers` | Student | Save answers |
| POST | `/attempts/:attemptId/submit` | Student | Submit and auto-grade |
| GET | `/results/me` | Student | Own released results |
| GET | `/reports/exams` | Faculty/Admin | Exam analytics |
| GET | `/reports/students` | Faculty/Admin | Student performance |

### Example question payload
```json
{
  "text": "Which runtime executes JavaScript outside the browser?",
  "options": [{"id":"a","text":"Node.js"},{"id":"b","text":"CSS"}],
  "correctOptionId": "a",
  "marks": 2,
  "subject": "Backend Development",
  "topic": "Node.js",
  "difficulty": "easy"
}
```

### Example exam payload
```json
{
  "title": "Backend Test",
  "instructions": "Select one option per question.",
  "questions": ["QUESTION_ID"],
  "durationMinutes": 30,
  "startAt": "2027-01-10T09:00:00.000Z",
  "endAt": "2027-01-10T10:00:00.000Z",
  "assignedStudents": ["STUDENT_ID"],
  "assignedSections": [],
  "randomizeQuestions": true,
  "isPublished": true
}
```

### Save answers payload
```json
{
  "answers": [
    {"question":"QUESTION_ID","selectedOptionId":"a"}
  ]
}
```

## 6. Socket.IO
Connect to the server with Socket.IO and pass the access token:
```js
const socket = io("http://localhost:5000", {
  auth: { token: accessToken }
});
socket.emit("exam:join", { examId: "EXAM_ID" });
socket.on("exam:created", data => console.log(data));
socket.on("exam:submission", data => console.log(data));
socket.on("result:released", data => console.log(data));
```
The server authenticates sockets and joins users to private user rooms. Exam-room joining is checked server-side. Events:
- `exam:created` – a new exam is created.
- `exam:submission` – a student submits an attempt.
- `result:released` – faculty releases results.
- `app:error` – socket authorization error.

## 7. EventEmitter
`src/events/appEvents.js` defines internal `exam.created` and `result.published` events. These decouple business actions from logging/other internal listeners. Socket.IO is used for client-facing live notifications.

## 8. Database design
- **User**: name, unique email, bcrypt password hash, role, section, active status, token version.
- **Question**: author, text, options, hidden correct option, marks, subject, topic and difficulty.
- **Exam**: creator, question references, schedule, duration, assignments, publication/result flags.
- **Attempt**: exam/student references, selected answers, grading, score, timing and status.

Relationships: one faculty can create many questions/exams; an exam references many questions; a student can have one attempt per exam. A unique compound index on `{ exam, student }` prevents duplicate attempts.

Indexes include User email/role, Question subject+difficulty, Exam schedule/publication, Attempt exam/student and unique `{ exam, student }`.

## 9. Aggregation pipelines
1. `GET /reports/exams`: groups attempts by exam and calculates count, average, highest and lowest score; joins exam title.
2. `GET /reports/students`: groups attempts by student and calculates exams attempted, total and average scores; joins user details.

## 10. Security and validation
- bcrypt password hashing (12 salt rounds).
- JWT access and refresh tokens with separate secrets.
- Refresh-token invalidation through `tokenVersion`.
- Role-based protected routes.
- Student registration cannot self-assign faculty/admin role.
- Correct answers are excluded from student-facing exam/question responses.
- Server validates schedule, duration, assignment, question IDs and option IDs.
- Server computes marks; client-submitted scores are ignored.
- Helmet, CORS, request-size limit, rate limiting and centralized error handling.

## 11. Suggested Postman test sequence
1. Login as faculty; copy `accessToken`.
2. Create a question; save its returned ID.
3. Create an exam with that question ID and a student ID.
4. Login as student; copy the student's access token.
5. List exams and start the assigned exam.
6. Save answers and submit.
7. Login as faculty/admin and call both report endpoints.
8. Test a missing token (401), wrong role (403), invalid body (400), duplicate attempt (409), and unknown ID (404).

## 12. Important academic notes / extension checklist
This is a runnable backend foundation, not a production examination service. Before final submission, test it on your own MongoDB version and review the business rules with your faculty. For a stronger final evaluation, consider adding database transactions for attempt creation, strict ownership checks for all exam updates, automatic timed submission via a background job, descriptive-question marking, audit logs, a formal Postman collection and automated tests. Do not claim these extensions are implemented unless you add and test them.

## 13. Viva preparation
Be ready to explain:
- Route → middleware → controller → model → MongoDB → JSON response.
- Why passwords are hashed and why access/refresh tokens are separate.
- How role middleware enforces RBAC.
- Why the correct answer is selected only inside server-side grading.
- How the unique compound index prevents duplicate attempts.
- What each aggregation stage does.
- Difference between EventEmitter (internal process event) and Socket.IO (client/server real-time event).
