const studentModel = require("../models/studentModel");
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const courseModel = require("../models/courseModel");
const examModel = require("../models/examModel");
const { default: mongoose } = require("mongoose");
const userModel = require("../models/userModel");


const JWT_SECRET = process.env.JWT_SECRET;

const registerStudent = async ({ firstName, lastName, studentNumber, parentNumber, city, year, password, rePassword, email }) => {
    try {
        const phoneConditions = [
            { studentNumber },
            { parentNumber },
            { studentNumber: parentNumber },
            { parentNumber: studentNumber },
        ];

        const [studentExists, userExists] = await Promise.all([
            studentModel.findOne({ $or: phoneConditions }),
            userModel.findOne({ phone: { $in: [studentNumber, parentNumber] } }),
        ]);

        if (studentExists || userExists) {
            return { message: "The Phone Is Used", statusCode: 400, data: {} };
        }


        if (password !== rePassword) {
            return { message: "Please Match the password", statusCode: 400, data: {} };
        }

        const existingEmailStudent = await studentModel.findOne({ email });
        const existingEmailUser = await userModel.findOne({ email });
        if (existingEmailUser || existingEmailStudent) {
            return { message: "Email already exists", statusCode: 400, data: {} };
        }

        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, salt);

        const newStudent = new studentModel({
            firstName,
            lastName,
            studentNumber,
            parentNumber,
            userName: "Hussien-Amgad.com@" + studentNumber,
            rol: "student",
            city,
            year,
            email,
            password: hashedPassword,
            createdAt: new Date()
        });

        const result = await newStudent.save();

        const token = jwt.sign(
            { rol: result.rol, userId: result._id, email: email, name: firstName + " " + lastName, phone: studentNumber },
            JWT_SECRET,
            { expiresIn: '7h' }
        );

        return {
            message: "User registered successfully", statusCode: 201, data: {
                token,
                year,
                decoded: { rol: result.rol, userId: result._id, email: result.email, name: result.firstName + " " + result.lastName, phone: result.studentNumber }
            }
        };
    } catch (err) {
        console.error(err);
        return { message: "Server Error", statusCode: 500, data: {} };
    }
}

const loginPhoneStudent = async ({ phone, password }) => {
    try {
        const [student, user] = await Promise.all([
            studentModel.findOne({ studentNumber: phone }),
            userModel.findOne({ phone }),
        ]);

        if (student && user) {
            console.error("Phone conflict between student & user", phone);
            return { message: "حدث خطأ، تواصل مع الدعم الفني", statusCode: 500, data: {} };
        }

        const account = student || user;
        if (!account) {
            return { message: "رقم الهاتف غير صحيح", statusCode: 401, data: {} };
        }

        const isMatch = await bcrypt.compare(password, account.password);
        if (!isMatch) {
            return { message: "كلمة المرور غير صحيحة", statusCode: 401, data: {} };
        }
        const payload = {
            rol: account.rol,
            userId: account._id,
            email: account.email,
            name: `${account.firstName} ${account.lastName}`,
            phone: student ? account.studentNumber : account.phone,
        };

        const token = jwt.sign(payload, JWT_SECRET, { expiresIn: "1h" });

        return {
            message: "تم تسجيل الدخول بنجاح",
            statusCode: 200,
            data: {
                token,
                year: student ? student.year : null,
                decoded: payload,
            },
        };

    } catch (err) {
        console.error(err);
        return { message: "خطأ في السيرفر", statusCode: 500, data: {} };
    }
};


const loginEmailStudent = async ({ email, password }) => {
    try {
        const [student, user] = await Promise.all([
            studentModel.findOne({ email }),
            userModel.findOne({ email }),
        ]);

        if (student && user) {
            return { message: "حدث خطأ، تواصل مع الدعم الفني", statusCode: 500, data: {} };
        }

        const account = student || user;
        if (!account) {
            return { message: "الأيميل غير صحيح", statusCode: 401, data: {} };
        }

        const isMatch = await bcrypt.compare(password, account.password);
        if (!isMatch) {
            return { message: "كلمة المرور غير صحيحة", statusCode: 401, data: {} };
        }
        const payload = {
            rol: account.rol,
            userId: account._id,
            email: account.email,
            name: `${account.firstName} ${account.lastName}`,
            phone: student ? account.studentNumber : account.phone,
        };

        const token = jwt.sign(payload, JWT_SECRET, { expiresIn: "1h" });

        return {
            message: "تم تسجيل الدخول بنجاح",
            statusCode: 200,
            data: {
                token,
                year: student ? student.year : null,
                decoded: payload,
            },
        };


    } catch (err) {
        console.error(err);
        return { message: 'خطأ في السيرفر', statusCode: 500, data: {} };
    }
}

const studentTransactions = async ({ token }) => {
    try {
        if (!token) {
            return { message: "يجب ارسال التوكن", statusCode: 400, data: { success: false } };
        }

        let decoded;
        try {
            decoded = jwt.verify(token, JWT_SECRET);
        } catch (err) {
            return { message: "توكن غير صالح", statusCode: 401, data: { success: false } };
        }

        const userId = decoded.userId; // موجود فعلاً في التوكن

        const user = await studentModel.findById(
            userId,
            "transactions" // projection الصحيح لمكتبة Mongoose
        );

        if (!user) {
            return { message: "المستخدم غير موجود", statusCode: 404, data: { success: false } };
        }

        return {
            message: "تم جلب المعاملات بنجاح",
            statusCode: 200,
            data: { success: true, transactions: user.transactions || [] }
        };

    } catch (err) {
        console.error(err);
        return { message: "خطأ في السيرفر", statusCode: 500, data: {} };
    }
};

const studentExam = async ({ courseId, sectionId, examId, user }) => {
    try {
        console.log(user);

        if (!user || !user.userId) {
            return { message: "المستخدم غير موجود", statusCode: 404, data: {} };
        }

        const userFind = await studentModel.findById(user.userId);

        if (!userFind) {
            return { message: "المستخدم غير موجود", statusCode: 404, data: {} };
        }

        const examFindInUser = userFind.exams.find(ex => ex.examId.toString() === examId);

        if (examFindInUser) {

            const now = Date.now();
            const openedAt = new Date(examFindInUser.openedAt).getTime();
            const durationMs = examFindInUser.duration * 60 * 1000;
            const expectedClose = openedAt + durationMs;

            /* ===== 1️⃣ الامتحان مقفول ===== */
            if (examFindInUser.closedAt) {
                return {
                    message: "تم غلق الامتحان",
                    statusCode: 200,
                    data: examFindInUser
                };
            }

            /* ===== 2️⃣ الوقت خلص ولسه ما اتقفلش ===== */
            if (now >= expectedClose) {

                // قفل الامتحان
                examFindInUser.closedAt = now;

                // حساب النتيجة
                let result = 0;
                examFindInUser.questions.forEach(q => {
                    const selectedAnswer = q.answers[q.currentAnswer];
                    if (selectedAnswer == q.correct_answer) {
                        result++;
                    }
                });

                examFindInUser.result = result;

                userFind.markModified("exams");
                await userFind.save();

                return {
                    message: "تم غلق الامتحان وحساب النتيجة",
                    statusCode: 200,
                    data: examFindInUser
                };
            }

            /* ===== 3️⃣ لسه جوه المدة ===== */
            const remainingMs = expectedClose - now;
            const remainingMinutes = Math.ceil(remainingMs / 60000);

            return {
                message: "الامتحان مازال مفتوح",
                statusCode: 200,
                data: {
                    ...examFindInUser.toObject(),
                    duration: remainingMinutes // بالدقايق
                }
            };
        }


        const course = await courseModel.findOne({ id: courseId });
        if (!course) {
            return { message: "لم يتم العثور علي الكورس", statusCode: 404, data: {} };
        }

        const week = course.sections.find(section => Number(section.id) === Number(sectionId));
        if (!week) {
            return { message: "لم يتم العثور علي الاسبوع", statusCode: 404, data: {} };
        }

        const sectionable = week.sectionables.find(s => Number(s.sectionable_id) === Number(examId));
        if (!sectionable) {
            return { message: "لم يتم العثور علي محتوي القسم", statusCode: 404, data: {} };
        }

        const exam = await examModel.findOne({ id: examId });
        if (!exam) {
            return { message: "لم يتم العثور علي امتحان", statusCode: 404, data: {} };
        }

        const questionsWithFlags = exam.questions.map(q => {
            const obj = q.toObject ? q.toObject() : q;
            return {
                ...obj,
                isopen: false,
                currentAnswer: ""
            };
        });

        const createExam = {
            courseId,
            sectionId,
            sectionableId: sectionable.sectionable_id,
            examId,
            examType: sectionable.sectionable_type,
            result: 0,
            exam: exam._id,
            duration: exam.duration,
            openedAt: Date.now(),
            closedAt: null,
            questions: questionsWithFlags
        };


        userFind.exams.push(createExam);
        await userFind.save();

        return { message: "تم اضافه الامتحان", statusCode: 201, data: createExam };

    } catch (err) {
        console.error(err);
        return { message: "خطأ في السيرفر", statusCode: 500, data: {} };
    }
};

const updateAnswer = async ({ courseId, sectionId, examId, userId, answers, open }) => {
    try {
        if (!userId) {
            return { message: "المستخدم غير موجود", statusCode: 401, data: {} };
        }

        const userFind = await studentModel.findById(userId);
        if (!userFind) {
            return { message: "المستخدم غير موجود", statusCode: 404, data: {} };
        }

        const examObj = userFind.exams.find(
            ex =>
                Number(ex.courseId) === Number(courseId) &&
                Number(ex.sectionId) === Number(sectionId) &&
                Number(ex.examId) === Number(examId)
        );

        if (!examObj) {
            return { message: "لم يتم العثور علي الامتحان", statusCode: 404, data: {} };
        }

        const now = Date.now();
        if (examObj.closedAt && now >= examObj.closedAt) {
            return { message: "تم غلق الامتحان", statusCode: 403, data: examObj };
        }

        /* ===== تحديث الإجابات ===== */
        if (answers && typeof answers === "object") {
            Object.entries(answers).forEach(([questionId, answerIndex]) => {
                const q = examObj.questions.find(
                    q => Number(q.id) === Number(questionId)
                );
                if (q) {
                    q.currentAnswer = answerIndex;
                    q.isopen = true;
                }
            });
        }

        /* ===== تحديث الفتح والغلق ===== */
        if (Array.isArray(open)) {
            open.forEach(({ id, isopen }) => {
                const q = examObj.questions.find(
                    q => Number(q.id) === Number(id)
                );
                if (q) {
                    q.isopen = Boolean(isopen);
                }
            });
        }

        userFind.markModified("exams");
        await userFind.save();

        return { message: "تم تحديث الامتحان", statusCode: 200, data: examObj };

    } catch (err) {
        console.error(err);
        return { message: "خطأ في السيرفر", statusCode: 500, data: {} };
    }
};

const get_waching = async (userId, courseId, sectionId, sectionableId) => {
    try {
        const course = await courseModel.findOne({ id: courseId });
        if (!course) return { message: "Course not found", statusCode: 404 };

        const section = course.sections.find(s => s.id === sectionId);
        if (!section) return { message: "Section not found", statusCode: 404 };

        const sectionable = section.sectionables.find(
            s => s.id === sectionableId && s.sectionable_type === "video"
        );
        if (!sectionable) return { message: "Video not found", statusCode: 404 };

        const limitValue =
            sectionable.sectionable.view_limit *
            sectionable.sectionable.duration;

        const student = await studentModel.findById(userId);
        if (!student) return { message: "Student not found", statusCode: 404 };

        const existingView = student.views.find(v =>
            v.courseId === courseId &&
            v.sectionId === sectionId &&
            v.sectionableId === sectionableId
        );

        return {
            message: "get successfully",
            statusCode: 200,
            data: {
                success: true,
                view: existingView || null,
                limitValue
            }
        };
    } catch (err) {
        console.error(err);
        return { message: "Error get watch time", statusCode: 500 };
    }
};

const updateVideoWatch = async (userId, courseId, sectionId, sectionableId, seconds) => {
    try {
        console.log("intoUpdateVideo");

        // 1️⃣ تحقق أن الفيديو موجود داخل الكورس والsection
        const course = await courseModel.findOne({ id: courseId });
        if (!course) return { success: false, message: "Course not found" };

        const section = course.sections.find(s => s.id === sectionId);
        if (!section) return { success: false, message: "Section not found" };

        const sectionable = section.sectionables.find(s => s.id === sectionableId && s.sectionable_type === "video");
        if (!sectionable) return { success: false, message: "Video not found in this section" };

        // 2️⃣ احصل على الطالب
        const student = await studentModel.findById(userId);
        if (!student) return { success: false, message: "Student not found" };

        // 2️⃣ محاولة التحديث (لو السجل موجود)
        const updateResult = await studentModel.updateOne(
            {
                _id: userId,
                "views.courseId": courseId,
                "views.sectionId": sectionId,
                "views.sectionableId": sectionableId,
            },
            {
                $inc: { "views.$.timewhatching": seconds },
            }
        );

        // 3️⃣ لو لم يتم التحديث → السجل غير موجود → أنشئه مرة واحدة
        if (updateResult.matchedCount === 0) {
            await studentModel.updateOne(
                {
                    _id: userId,
                    views: {
                        $not: {
                            $elemMatch: {
                                courseId,
                                sectionId,
                                sectionableId,
                            },
                        },
                    },
                },
                {
                    $push: {
                        views: {
                            courseId,
                            sectionId,
                            sectionableId,
                            timewhatching: seconds,
                            video: sectionable
                        },
                    },
                }
            );
        }


        // const existingView = student.views.find(v =>
        //     Number(v.courseId) === Number(courseId) &&
        //     Number(v.sectionId) === Number(sectionId) &&
        //     Number(v.sectionableId) === Number(sectionableId)
        // );


        // if (existingView) {
        //     // حدث عدد الثواني فقط لو الجديد أكبر من القديم
        //     existingView.timewhatching = (existingView.timewhatching || 0) + 5;
        // } else {
        //     // أضف سجل جديد
        //     student.views.push({
        //         courseId,
        //         sectionId,
        //         sectionableId,
        //         timewhatching: seconds
        //     });
        // }

        return { success: true, message: "Watch time updated successfully" };
    } catch (err) {
        console.error(err);
        return { success: false, message: "Error updating watch time" };
    }
};

const getProfileStudent = async (user) => {
    try {
        const student = await studentModel.findById(user.user.userId);

        if (!student)
            return { message: "Student not found", statusCode: 404, data: {} };

        const courses = await Promise.all(
            student.enrolledCourses.map(async (courseId) => {
                const course = await courseModel.findOne({ id: courseId });
                return course ? course.toObject() : null;
            })
        );

        const exams = await Promise.all(
            student.exams.map(async (examEntry) => {
                const examDoc = await examModel.findById(examEntry.exam);
                return {
                    ...examEntry.toObject(), // إذا examEntry document من mongoose
                    exam: examDoc ? examDoc.toObject() : null
                };
            })
        );

        const formattedCourses = courses.map(course => ({
            ...course,
            sections: []
        }));

        const response = {
            ...student.toObject(),
            enrolledCourses: formattedCourses,
            exams: exams
        };

        return { message: "Success", statusCode: 200, data: response };

    } catch (err) {
        console.error(err);
        return { message: "خطأ في السيرفر", statusCode: 500, data: {} };
    }
};



module.exports = { getProfileStudent, updateAnswer, studentExam, get_waching, updateVideoWatch, registerStudent, loginPhoneStudent, loginEmailStudent, studentTransactions };