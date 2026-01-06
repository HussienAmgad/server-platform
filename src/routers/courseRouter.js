const express = require("express");
const { addCourse, getAllCourses, getCoursesByYear, addWeek, addSectionableBook, updateSectionableBook, updateWeek, updateCourse, getCourseById, get_book, uploadVideoService, get_video } = require("../services/courseServices");
const fs = require('fs');
const path = require('path');
const multer = require('multer');
const { v4: uuidv4 } = require('uuid');
const { S3Client, PutObjectCommand } = require("@aws-sdk/client-s3");
const { Upload } = require('@aws-sdk/lib-storage');

const axios = require("axios");
const FormData = require("form-data");
const courseModel = require("../models/courseModel");
const { verifyTokenStudent } = require("../middlewares/verifyTokenStudent");
const { verifyTokenAssistant } = require("../middlewares/verifyTokenAssistant");

const router = express.Router();

const uploadDir = path.join(__dirname, '../uploads');
const uploadDirBook = path.join(__dirname, '../books');

const uploadVideoDir = path.join(__dirname, "../videos");
if (!fs.existsSync(uploadVideoDir)) fs.mkdirSync(uploadVideoDir);

const storageVideo = multer.diskStorage({
  destination: (req, file, cb) => cb(null, uploadVideoDir),
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname);
    cb(null, Date.now() + ext);
  },
});

const uploadVideo = multer({ storage: storageVideo });

if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir);
}

if (!fs.existsSync(uploadDirBook)) {
  fs.mkdirSync(uploadDirBook);
}

// إعداد التخزين مع multer
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const uniqueName = `${uuidv4()}${path.extname(file.originalname)}`;
    cb(null, uniqueName);
  },
});

const upload = multer({ storage });

const storagebook = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadDirBook);
  },
  filename: (req, file, cb) => {
    const uniqueName = `${uuidv4()}${path.extname(file.originalname)}`;
    cb(null, uniqueName);
  },
});

const uploadbook = multer({ storage: storagebook }); // تم التصحيح هنا

// const s3 = new S3Client({
//   region: "auto",
//   endpoint: process.env.ENDPOINT,
//   credentials: {
//     accessKeyId: process.env.CLOUDFLARE_ACCESS_KEY_ID,
//     secretAccessKey: process.env.CLOUDFLARE_SECRET_ACCESS_KEY
//   },
// });

// const uploadDir2 = path.join(__dirname, '../uploads');
// if (!fs.existsSync(uploadDir2)) {
//   fs.mkdirSync(uploadDir2, { recursive: true });
// }

// // إعداد التخزين مع multer
// const storage2 = multer.diskStorage({
//   destination: (req, file, cb) => cb(null, uploadDir2),
//   filename: (req, file, cb) => cb(null, `${uuidv4()}${path.extname(file.originalname)}`)
// });

// const upload2 = multer({ storage: storage2 });

// // إعداد S3Client لـ R2
// const s3 = new S3Client({
//   region: 'auto',
//   endpoint: process.env.ENDPOINT,
//   credentials: {
//     accessKeyId: process.env.CLOUDFLARE_ACCESS_KEY_ID,
//     secretAccessKey: process.env.CLOUDFLARE_SECRET_ACCESS_KEY
//   }
// });

// finished
router.post('/add-course', verifyTokenAssistant, upload.single('picture'), async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ message: 'يجب رفع صورة', data: {} });

    const key = `uploads/${req.file.filename}`;

    // هنا استمر في حفظ بيانات الكورس في قاعدة البيانات
    const { name, description, is_available_for_subscription, price, year, first_free_video } = req.body;

    const response = await addCourse({
      name,
      description,
      is_available_for_subscription,
      price,
      year,
      first_free_video,
      picture: key
    });

    res.status(response.statusCode).json({ message: response.message, data: response.data });

  } catch (err) {
    res.status(500).json({ message: 'Internal Server Error', error: err.message });
  }
});

router.put("/update-course/:courseId", verifyTokenAssistant, upload.single("picture"), async (req, res) => {
  const courseId = parseInt(req.params.courseId);

  try {

    let fileUrl = ``;
    if (req.file) {
      fileUrl = `uploads/${req.file.filename}`
    }

    const result = await updateCourse(courseId, req.body, fileUrl);

    res.status(result.statusCode).json({
      message: result.message,
      data: result.data
    });

  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "خطأ في السيرفر", error: err.message });
  }
});

router.get("/get_course/:id", verifyTokenStudent, async (req, res) => {
  try {
    const courseId = parseInt(req.params.id);

    if (isNaN(courseId) || !courseId) {
      return res.status(400).json({ message: "Course ID غير صالح", data: {} });
    }

    const result = await getCourseById({ courseId, user: req.user });

    return res.status(result.statusCode).json({
      message: result.message,
      data: result.data,
    });

  } catch (err) {
    console.error("Router Error:", err);
    res.status(500).json({
      message: "خطأ في السيرفر",
      data: {}
    });
  }
});

router.get("/get_all_courses", async (req, res) => {
  try {
    const response = await getAllCourses();
    res.status(response.statusCode).json({
      message: response.message,
      data: response.data,
    });
  } catch (err) {
    console.error("Router Error:", err);
    res.status(500).json({
      message: "خطأ في السيرفر",
      data: {}
    });
  }
});

router.get("/courses/:year", async (req, res) => {
  try {
    const { year } = req.params;

    if (isNaN(year)) {
      return res.status(400).json({
        message: "يجب إرسال رقم السنة بشكل صحيح",
        data: {},
      });
    }

    const response = await getCoursesByYear({ year });

    res.status(response.statusCode).json({
      message: response.message,
      data: response.data,
    });

  } catch (err) {
    console.error("Router Error:", err);
    res.status(500).json({
      message: "خطأ في السيرفر",
      data: {}
    });
  }
});

router.get("/get-book/:courseId/:weekId/:sectionId", verifyTokenStudent, async (req, res) => {
  try {
    const { courseId, weekId, sectionId } = req.params;

    const response = await get_book({ courseId, weekId, sectionId, user: req.user });

    res.status(response.statusCode).json({
      message: response.message,
      data: response.data,
    });
  } catch (err) {
    console.error("Router Error:", err);
    res.status(500).json({
      message: "خطأ في السيرفر",
      data: {}
    });
  }
});
// finished

router.post("/add-week/:courseId", verifyTokenAssistant, async (req, res) => {
  try {
    const courseId = parseInt(req.params.courseId);

    const response = await addWeek(courseId, req.body);

    res.status(response.statusCode).json({
      message: response.message,
      data: response.data,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server error" });
  }
});

router.put("/update-week/:courseId/:weekId", verifyTokenAssistant, async (req, res) => {
  const courseId = parseInt(req.params.courseId);
  const weekId = parseInt(req.params.weekId);

  const result = await updateWeek(courseId, weekId, req.body);

  res.status(result.statusCode).json({
    message: result.message,
    data: result.data
  });
});

router.post("/add-sectionable-book/:courseId/:weekId", verifyTokenAssistant, uploadbook.single("file"), async (req, res) => {
  try {
    const courseId = parseInt(req.params.courseId);
    const weekId = parseInt(req.params.weekId);

    if (!req.file) {
      return res.status(400).json({ message: "No file uploaded" });
    }

    const result = await addSectionableBook(courseId, weekId, req.body, req.file.filename);

    return res.status(result.statusCode).json({
      message: result.message,
      data: result.data
    });

  } catch (err) {
    console.error("Router Error:", err);
    res.status(500).json({
      message: "خطأ في السيرفر",
      data: {}
    });
  }
}
);

router.put("/update-sectionable-book/:courseId/:weekId/:sectionableId", verifyTokenAssistant, uploadbook.single("file"), async (req, res) => {

    const courseId = parseInt(req.params.courseId);
    const weekId = parseInt(req.params.weekId);
    const sectionableId = parseInt(req.params.sectionableId);

    const result = await updateSectionableBook(
      courseId,
      weekId,
      sectionableId,
      req.body,
      req.file ? req.file.filename : null
    );

    res.status(result.statusCode).json({
      message: result.message,
      data: result.data
    });
  }
);

router.post('/add-sectionable-video/:courseId/:weekId', verifyTokenAssistant, uploadVideo.single("file"), async (req, res) => {
  try {
    const courseId = parseInt(req.params.courseId);
    const weekId = parseInt(req.params.weekId);

    const course = await courseModel.findOne({ id: courseId });
    if (!course) return res.status(404).json({ message: 'Course not found' });

    const week = course.sections.find(sec => sec.id === weekId);
    if (!week) return res.status(404).json({ message: 'Week not found' });

    const sectionables = week.sectionables || [];
    const maxId = sectionables.reduce((max, item) => Math.max(max, item.id || 0), 0);
    const newId = maxId + 1;
    const sectionableId = Date.now();

    const now = new Date();
    const visibleFrom = now.toISOString();
    const visibleTo = new Date(now.setFullYear(now.getFullYear() + 1)).toISOString();

    const {
      name,
      description,
      duration,
      view_limit,
    } = req.body;

    const file = req.file;

    if (!name || !file) {
      return res.status(400).json({ error: "name and file are required" });
    }

    console.log(req.file)

    // 1️⃣ إنشاء فيديو جديد في VdoCipher
    const createVideoResponse = await axios.put(
      "https://dev.vdocipher.com/api/videos",
      null,
      {
        params: { title: name },
        headers: { Authorization: process.env.VDOCIPHER_API_SECRET },
      }
    );

    const { clientPayload, videoId } = createVideoResponse.data;

    // 2️⃣ تجهيز form-data للرفع إلى VdoCipher
    const form = new FormData();
    form.append("key", clientPayload.key);
    form.append("policy", clientPayload.policy);
    form.append("x-amz-signature", clientPayload["x-amz-signature"]);
    form.append("x-amz-algorithm", clientPayload["x-amz-algorithm"]);
    form.append("x-amz-date", clientPayload["x-amz-date"]);
    form.append("x-amz-credential", clientPayload["x-amz-credential"]);
    form.append("success_action_status", "201");
    form.append("success_action_redirect", "");
    form.append("file", fs.createReadStream(file.path), {
      filename: file.originalname,
      contentType: file.mimetype,
    });

    // 3️⃣ رفع الملف إلى VdoCipher
    await axios.post(clientPayload.uploadLink, form, {
      headers: form.getHeaders(),
      maxBodyLength: Infinity,
      maxContentLength: Infinity,
    });

    // 4️⃣ حذف الملف من السيرفر بعد الرفع
    fs.unlinkSync(file.path);


    const sectionable = {
      id: sectionableId,
      name: name || '',
      description: description || '',
      duration: parseInt(duration),
      source: videoId, // videoId
      view_limit: parseInt(view_limit) || 3,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      deleted_at: null,
      is_deleted: false
    };


    const newSectionable = {
      id: newId,
      sectionable_type: 'video',
      sectionable_id: sectionableId,
      section_id: weekId,
      visible_from: visibleFrom,
      visible_to: visibleTo,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      deleted_at: null,
      is_deleted: false,
      sectionable
    };

    await courseModel.updateOne(
      { id: courseId, 'sections.id': weekId },
      { $push: { 'sections.$.sectionables': newSectionable }, $set: { updated_at: new Date().toISOString() } }
    );

    res.status(200).json({ message: 'Sectionable video added successfully', data: newSectionable });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

// router.post("/upload-video", uploadVideo.single("file"), async (req, res) => {
//   const { title } = req.body;
//   const file = req.file;

//   if (!title || !file) {
//     return res.status(400).json({ error: "Title and file are required" });
//   }

//   console.log(req.file)

//   try {
//     // 1️⃣ إنشاء فيديو جديد في VdoCipher
//     const createVideoResponse = await axios.put(
//       "https://dev.vdocipher.com/api/videos",
//       null,
//       {
//         params: { title },
//         headers: { Authorization: process.env.VDOCIPHER_API_SECRET },
//       }
//     );

//     const { clientPayload, videoId } = createVideoResponse.data;

//     // 2️⃣ تجهيز form-data للرفع إلى VdoCipher
//     const form = new FormData();
//     form.append("key", clientPayload.key);
//     form.append("policy", clientPayload.policy);
//     form.append("x-amz-signature", clientPayload["x-amz-signature"]);
//     form.append("x-amz-algorithm", clientPayload["x-amz-algorithm"]);
//     form.append("x-amz-date", clientPayload["x-amz-date"]);
//     form.append("x-amz-credential", clientPayload["x-amz-credential"]);
//     form.append("success_action_status", "201");
//     form.append("success_action_redirect", "");
//     form.append("file", fs.createReadStream(file.path), {
//       filename: file.originalname,
//       contentType: file.mimetype,
//     });

//     // 3️⃣ رفع الملف إلى VdoCipher
//     await axios.post(clientPayload.uploadLink, form, {
//       headers: form.getHeaders(),
//       maxBodyLength: Infinity,
//       maxContentLength: Infinity,
//     });

//     // 4️⃣ حذف الملف من السيرفر بعد الرفع
//     fs.unlinkSync(file.path);

//     res.json({
//       message: "Video created and uploaded successfully",
//       videoId,
//     });
//   } catch (error) {
//     console.error(error.response?.data || error.message);
//     res.status(500).json({ error: "Failed to create or upload video" });
//   }
// });

router.get('/video/:courseId/:sectionId/:sectionableId/:videoId', verifyTokenStudent, async (req, res) => {
  
  try {
    const { videoId, courseId, sectionId, sectionableId } = req.params;
    
    console.log({ videoId, courseId, sectionId, sectionableId, user: req.user });
    
    const result = await get_video({ videoId, courseId, sectionId, sectionableId, user: req.user })
    res.status(result.statusCode).json({
      message: result.message,
      data: result.data
    });
  } catch (error) {
    console.error(error.response?.data || error.message);
    res.status(500).json({ error: 'Failed to get OTP & playback info' });
  }
});

// router.get('/video/:videoId', verifyTokenStudent, async (req, res) => {
//   const videoId = req.params.videoId;

//   try {
//     const response = await axios.post(
//       `https://dev.vdocipher.com/api/videos/${videoId}/otp`,
//       { ttl: 300 },
//       {
//         headers: {
//           Authorization: `Apisecret ${process.env.VDOCIPHER_API_SECRET2}`,
//         },
//       }
//     );

//     res.json({
//       data: {
//         otp: response.data.otp,
//         playbackInfo: response.data.playbackInfo,
//       }
//     });
//   } catch (error) {
//     console.error(error.response?.data || error.message);
//     res.status(500).json({ error: 'Failed to get OTP & playback info' });
//   }
// });

router.post('/add-sectionable-exam/:courseId/:weekId', verifyTokenAssistant, async (req, res) => {
  try {
    const courseId = parseInt(req.params.courseId);
    const weekId = parseInt(req.params.weekId);

    const course = await courseModel.findOne({ id: courseId });
    if (!course) return res.status(404).json({ message: 'Course not found' });

    const week = course.sections.find(sec => sec.id === weekId);
    if (!week) return res.status(404).json({ message: 'Week not found' });

    const sectionables = week.sectionables || [];
    const maxId = sectionables.reduce((max, item) => Math.max(max, item.id || 0), 0);
    const newId = maxId + 1;
    const sectionableId = Date.now();

    const now = new Date();
    const visibleFrom = now.toISOString();
    const visibleTo = new Date(now.setFullYear(now.getFullYear() + 1)).toISOString();

    const sectionableType = req.body.type === 'hm' ? 'hm' : 'ex';
    const sectionable = {
      id: sectionableId,
      name: req.body.name || '',
      description: req.body.description || '',
      duration: req.body.duration || 0,
      question_quantity: req.body.question_quantity || 0,
      sectionable_type: sectionableType,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      deleted_at: null,
      is_deleted: false
    };

    const newSectionable = {
      id: newId,
      sectionable_type: 'exam',
      sectionable_id: sectionableId,
      section_id: weekId,
      visible_from: visibleFrom,
      visible_to: visibleTo,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      deleted_at: null,
      is_deleted: false,
      sectionable
    };

    await courseModel.updateOne(
      { id: courseId, 'sections.id': weekId },
      {
        $push: { 'sections.$.sectionables': newSectionable },
        $set: { updated_at: new Date().toISOString() }
      }
    );

    res.status(200).json({ message: 'Exam metadata added successfully', sectionable_id: sectionableId });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;