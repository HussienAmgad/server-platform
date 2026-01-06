const express = require("express");
const courseModel = require("../models/courseModel");
const examModel = require("../models/examModel");
const router = express.Router();
const { v4: uuidv4 } = require('uuid');
const path = require('path');
const fs = require('fs');
const multer = require('multer');

const uploadDir_exams = path.join(__dirname, '../img-exams');
if (!fs.existsSync(uploadDir_exams)) {
  fs.mkdirSync(uploadDir_exams);
}
const storage_img_exams = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadDir_exams);
  },
  filename: (req, file, cb) => {
    const uniqueName = `${uuidv4()}${path.extname(file.originalname)}`;
    cb(null, uniqueName);
  }
});

const upload_img_exams = multer({ storage: storage_img_exams });


router.post('/add-exam/:courseId/:weekId/:sectionableId', upload_img_exams.any(), async (req, res) => {
    try {
        const courseId = parseInt(req.params.courseId);
        const weekId = parseInt(req.params.weekId);
        const sectionableId = parseInt(req.params.sectionableId);

        const course = await courseModel.findOne({ id: courseId });
        if (!course) return res.status(404).json({ message: 'Course not found' });

        const week = course.sections.find(sec => sec.id === weekId);
        if (!week) return res.status(404).json({ message: 'Week not found' });

        const sectionableWrapper = week.sectionables.find(sec => sec.sectionable_id === sectionableId);
        if (!sectionableWrapper) return res.status(404).json({ message: 'Sectionable not found' });

        // تحويل الأسئلة من JSON string لكائن
        let questions = [];
        try {
            questions = req.body.questions ? JSON.parse(req.body.questions) : [];
        } catch (err) {
            return res.status(400).json({ message: "Invalid JSON format for questions" });
        }

        // طباعة بيانات req.files و questions للمراجعة
        console.log("Files uploaded:", req.files);
        console.log("Questions before processing:", questions);

        // تعديل الأسئلة وربط الصور بالملفات المرفوعة
        questions = questions.map(q => {
            if (q.pictureName) {
                const matchedFile = req.files.find(f => f.originalname.toLowerCase() === q.pictureName.toLowerCase());
                if (matchedFile) {
                    q.picture = `img-exams/${matchedFile.filename}`;
                } else {
                    console.log(`No matching file found for pictureName: ${q.pictureName}`);
                    q.picture = null;
                }
            }
            return q;
        });


        // تجهيز الأسئلة بصيغة الحفظ المطلوبة
        const processedQuestions = questions.map((q, index) => {
            return {
                id: index + 1,
                title: q.title || '',
                picture: q.picture || null,
                correct_answer: q.correct_answer || '',
                answers: q.answers || [] // ✅ مباشرة مصفوفة، جاهزة للـ map في React
            };
        });

        const sectionableType = req.body.type === 'hm' ? 'hm' : 'ex';
        const updatedExam = {
            id: sectionableId,
            courseid: courseId,
            weekid: weekId,
            sectionable_type: sectionableType,
            sectionable_id: sectionableId,
            question_quantity: processedQuestions.length,
            duration: parseInt(req.body.duration) || 0,
            name: req.body.name || '',
            description: req.body.description || '',
            questions: processedQuestions,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
            deleted_at: null,
            isdeleted: false
        };

        // إدخال الامتحان في قاعدة البيانات
        await examModel.insertOne(updatedExam);

        // تحديث بيانات القسم في courses
        await courseModel.updateOne(
            {
                id: courseId,
                'sections.id': weekId,
                'sections.sectionables.sectionable_id': sectionableId
            },
            {
                $set: {
                    'sections.$[week].sectionables.$[sec].sectionable.question_quantity': processedQuestions.length,
                    'sections.$[week].sectionables.$[sec].sectionable.updated_at': new Date().toISOString()
                }
            },
            {
                arrayFilters: [
                    { 'week.id': weekId },
                    { 'sec.sectionable_id': sectionableId }
                ]
            }
        );

        res.status(200).json({ message: 'Exam added successfully with questions', exam: updatedExam });
    } catch (error) {
        console.error('Error while adding exam:', error);
        res.status(500).json({ message: 'Server error', error: error.message });
    }
});



module.exports = router;
