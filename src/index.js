// require('dotenv').config({ path: '/home/ubuntu/.env' })
require("dotenv").config();
const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const studentRouter = require("./routers/studentRouter");
const courseRouter = require("./routers/courseRouter");
const authRouter = require("./routers/authRouter");
const checkoutRouter = require("./routers/checkoutRouter");
const examRouter = require("./routers/examRouter");
const path = require('path');
const WebSocket = require('ws');
const jwt = require('jsonwebtoken');
const courseModel = require("./models/courseModel");
const { updateVideoWatch, updateAnswer } = require("./services/studentServices");
const fs = require('fs');
const multer = require('multer');
const { v4: uuidv4 } = require('uuid');

const wss = new WebSocket.Server({ port: 8081 }, () => {
  console.log("WebSocket server running on port 8081");
});

const wssExam = new WebSocket.Server({ port: 8082 }, () => {
  console.log("WebSocket server running on port 8082");
});

const app = express();
const port = process.env.PORT || 5000;

const uploadDir = path.join(__dirname, 'uploads');
const uploadDir_exams = path.join(__dirname, 'img-exams');
const uploadDirBooks = path.join(__dirname, 'books');
const uploadDirphoto = path.join(__dirname, 'photos');
app.use('/books', express.static(uploadDirBooks));
app.use('/img-exams', express.static(uploadDir_exams));
app.use('/uploads', express.static(uploadDir));
app.use('/photos', express.static(uploadDirphoto));



if (!fs.existsSync(uploadDirphoto)) {
  fs.mkdirSync(uploadDirphoto);
}
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadDirphoto);
  },
  filename: (req, file, cb) => {
    const uniqueName = `${uuidv4()}${path.extname(file.originalname)}`;
    cb(null, uniqueName);
  },
});

const upload = multer({ storage });


app.use(
  cors()
);
app.use(express.json());

mongoose
  .connect(process.env.uri)
  .then(async () => {
    console.log("Connected!");
  })
  .catch((err) => console.log("Failed to connect", err));


wss.on('connection', (ws, req) => {
  console.log('Client connected');

  ws.on('message', async (message) => {
    try {
      // الرسالة هتيجي JSON
      const data = JSON.parse(message);

      console.log(data);

      const { userId, courseId, weekId, sectionableId, watchedSeconds } = data;

      const course = await courseModel.findOne({ id: courseId });
      if (!course) return ws.send(JSON.stringify({ error: 'Course not found' }));

      const week = course.sections.find(sec => sec.id === weekId);
      if (!week) return ws.send(JSON.stringify({ error: 'Week not found' }));

      const sectionable = week.sectionables.find(sec => sec.id === sectionableId && sec.sectionable_type === 'video');
      if (!sectionable) return ws.send(JSON.stringify({ error: 'Invalid sectionable id' }));

      const update = await updateVideoWatch(userId, courseId, weekId, sectionableId, watchedSeconds);
      console.log(update);

      // رد على العميل
      ws.send(JSON.stringify({ success: true, watchedSeconds }));

    } catch (err) {
      console.error(err);
      ws.send(JSON.stringify({ error: 'Invalid token or server error' }));
    }
  });

  ws.on('close', () => console.log('Client disconnected'));
});

wssExam.on('connection', (ws, req) => {
  console.log('Client connected Exam');

  ws.on('message', async (message) => {
    try {
      // الرسالة هتيجي JSON
      const { courseId, sectionId, examId, userId, answers, open } = JSON.parse(message);

      console.log({ courseId, sectionId, examId, userId, answers, open });

      const response = await updateAnswer({ courseId, sectionId, examId, userId, answers, open })

      console.log(response);


      ws.send(JSON.stringify({ success: true, login: true }));

    } catch (err) {
      console.error(err);
      ws.send(JSON.stringify({ error: 'Invalid token or server error' }));
    }
  });

  ws.on('close', () => console.log('Client disconnected'));
});

app.use("/student", studentRouter);
app.use("/course", courseRouter);
app.use("/auth", authRouter);
app.use("/checkout", checkoutRouter);
app.use("/exam", examRouter);

app.post("/photos", upload.array("pictures", 20), async (req, res) => {
  try {
    console.log(req.files); // هنا مصفوفة الصور
    res.status(200).json({
      message: "Multiple photos uploaded successfully",
      files: req.files
    });
  } catch (error) {
    res.status(500).json({ message: "Internal Server Error", error: error.message });
  }
});



// app.listen(port, '0.0.0.0', () => {
//   console.log("Running on port " + port);
// });
const os = require("os");

app.listen(port, "0.0.0.0", () => {
  const nets = os.networkInterfaces();
  const results = [];

  for (const name of Object.keys(nets)) {
    for (const net of nets[name]) {
      // IPv4 فقط + تجاهل loopback
      if (net.family === "IPv4" && !net.internal) {
        results.push(net.address);
      }
    }
  }

  console.log("Running on port:", port);
  console.log("Available IPs:", results);
});