# Project Report: Online Examination and Assessment Management System

## 1. Cover Page and Team Details
**Project:** Online Examination and Assessment Management System  
**Subject:** Backend Development  
**Technology Stack:** Node.js, Express.js, MongoDB, Mongoose, JWT, Socket.IO  
**Team Members:** Add your actual names, roll numbers and contributions.  
**Institution:** Add your institution name.  
**Academic Session:** Add your session.

## 2. Abstract
The Online Examination and Assessment Management System is a backend application that supports question-bank management, examination scheduling, student attempts, automatic evaluation of multiple-choice questions and performance reporting. It uses a REST API architecture with role-based access for administrators, faculty and students. MongoDB stores users, questions, exams and attempts. JWT-based authentication and bcrypt password hashing protect user accounts, while Socket.IO supports real-time examination updates.

## 3. Problem Statement
Manual examination workflows require separate processes for question preparation, scheduling, answer collection, evaluation and result preparation. The project provides a centralized backend to manage these activities while enforcing server-side timing, access and evaluation rules.

## 4. Objectives
- Create and maintain a reusable MCQ question bank.
- Schedule examinations and assign them to students or sections.
- Allow eligible students to attempt and submit examinations.
- Evaluate objective answers on the server.
- Provide result summaries and performance analytics.
- Protect application resources through authentication and RBAC.

## 5. Scope and Limitations
The current implementation covers MCQ assessments, scheduling, single attempts, automatic grading and basic analytics. Payment processing is not relevant. Descriptive-answer evaluation, advanced proctoring, file uploads, background auto-submission and production-grade audit logging are outside the current implementation and may be future enhancements.

## 6. Functional and Non-Functional Requirements
**Functional:** user authentication; role management; CRUD question bank; exam scheduling and assignment; attempt start/save/submit; automatic grading; reports; live notifications.  
**Non-functional:** maintainability, secure password storage, validation, consistent JSON responses, database indexing and reasonable API response performance.

## 7. System Architecture
The application follows a layered MVC-style structure:
- Routes define HTTP endpoints.
- Middleware handles authentication, authorization and validation.
- Controllers implement request workflows.
- Mongoose models define schemas and persistence.
- MongoDB stores application records.
- Socket.IO sends real-time updates.
- EventEmitter handles internal application events.

## 8. Database Design
Collections:
1. **users** – identity, password hash, role and section.
2. **questions** – question text, options, correct option, marks and topic metadata.
3. **exams** – schedule, duration, creator, question references and assignment details.
4. **attempts** – student answers, timing, status and calculated score.

Important relationships: Exam → Questions (many references); Attempt → Exam (one reference); Attempt → Student (one reference). A unique compound index on exam and student prevents multiple attempts for one exam.

## 9. REST API Documentation
Refer to the route table and example request payloads in `README.md`. Protected endpoints require a Bearer access token. Expected status codes include 200 (success), 201 (created), 400 (validation error), 401 (unauthenticated), 403 (forbidden), 404 (not found) and 409 (conflict).

## 10. Authentication and Authorization
Passwords are hashed with bcrypt before storage. Login returns a short-lived access token and refresh token. Protected routes verify the access token and load the active user. Role middleware restricts administrator, faculty and student operations. Refresh-token invalidation increments the user's token version.

## 11. Implementation Details
The project uses Express for REST endpoints and Mongoose for schema validation and database queries. Examination start checks assignment and schedule. Answer saving validates question and option IDs. Submission loads correct answers on the server and calculates marks. Student result responses hide scores until faculty releases results.

## 12. Testing Strategy and Test Cases
| Test | Expected result |
|---|---|
| Valid login | 200 and tokens |
| Wrong password | 401 |
| Register with missing fields | 400 |
| Faculty creates question | 201 |
| Student creates question | 403 |
| Student starts assigned exam in window | 201 |
| Student starts unassigned exam | 403 |
| Duplicate attempt | 409 |
| Submit valid answers | 200 with submission status |
| Request protected route without token | 401 |
| Invalid resource ID | 400 |
| Faculty requests report | 200 |

Run these tests using Postman and attach screenshots of actual responses from your local environment.

## 13. Screenshots / Demonstration Evidence
Insert your own screenshots:
- Server running and MongoDB connected.
- Successful faculty login.
- Question creation response.
- Exam creation response.
- Student attempt and submission.
- Analytics endpoint responses.
- Unauthorized and validation-failure tests.
- Socket.IO event received by a connected client.

## 14. Conclusion and Future Enhancements
The project demonstrates REST API development, MVC organization, MongoDB data modelling, authentication, authorization, validation, aggregation, event-driven programming and real-time communication. Future enhancements may include descriptive questions, audit logs, timed background submission, a frontend dashboard, randomized per-student question sets and more comprehensive automated tests.

## 15. References
- Node.js documentation: https://nodejs.org/docs/
- Express documentation: https://expressjs.com/
- MongoDB documentation: https://www.mongodb.com/docs/
- Mongoose documentation: https://mongoosejs.com/docs/
- Socket.IO documentation: https://socket.io/docs/v4/
- JSON Web Token: https://jwt.io/introduction
