const EventEmitter = require("events");
const appEvents = new EventEmitter();
appEvents.on("exam.created", data => console.log(`[EVENT] Exam created: ${data.title}`));
appEvents.on("result.published", data => console.log(`[EVENT] Result published for exam ${data.examId}`));
module.exports = appEvents;
