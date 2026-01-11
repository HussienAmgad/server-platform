const courseModel = require("../models/courseModel");
const path = require('path');
const fs = require('fs');
const { ObjectId } = require("mongodb");

const axios = require("axios");
const FormData = require("form-data");
const Busboy = require("busboy");
const { PassThrough } = require("stream");
const studentModel = require("../models/studentModel");
const examModel = require("../models/examModel");

const addCourse = async ({ name, description, is_available_for_subscription, price, year, first_free_video, picture }) => {
  try {
    // دالة توليد id فريد
    async function generateUniqueId() {
      let id = 1;
      while (true) {
        const exists = await courseModel.findOne({ id });
        if (!exists) return id;
        id++;
      }
    }

    const newId = await generateUniqueId();

    const newCourse = courseModel({
      id: newId,
      name,
      description,
      is_available_for_subscription: is_available_for_subscription === "true",
      picture: `${picture}`,
      price: Number(price),
      year: Number(year),
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      first_free_video: first_free_video === "true",
      subscriptions_count: 0,
      deleted_at: null,
      is_deleted: false,
      sections: [],
    });

    await newCourse.save();

    const allCourses = await courseModel.find().lean()

    return {
      message: "تم إضافة الكورس بنجاح",
      statusCode: 201,
      data: allCourses,
    };
  } catch (err) {
    console.error(err);
    return { message: "خطأ في السيرفر", statusCode: 500, data: {} };
  }
};

const updateCourse = async (courseId, body, fileUrl) => {
  try {
    const course = await courseModel.findOne({ id: courseId });
    if (!course) {
      return { message: "Course not found", statusCode: 404, data: {} };
    }

    const updatedData = {};

    if (body.name !== undefined) updatedData.name = body.name;
    if (body.description !== undefined) updatedData.description = body.description;
    if (body.price !== undefined) updatedData.price = Number(body.price);
    if (body.year !== undefined) updatedData.year = Number(body.year);
    if (body.first_free_video !== undefined) updatedData.first_free_video = body.first_free_video === 'true' || body.first_free_video === true;
    if (body.is_available_for_subscription !== undefined) updatedData.is_available_for_subscription = body.is_available_for_subscription === 'true' || body.is_available_for_subscription === true;

    if (fileUrl) updatedData.picture = fileUrl;

    updatedData.updated_at = new Date().toISOString();

    await courseModel.updateOne({ id: courseId }, { $set: updatedData });

    const allCourses = await courseModel.find().lean()

    return {
      message: "تم تعديل الكورس بنجاح",
      statusCode: 200,
      data: allCourses
    };

  } catch (err) {
    console.error(err);
    return { message: "خطأ في السيرفر", statusCode: 500, data: {} };
  }
};

const getCourseById = async ({ courseId, userId }) => {
  try {
    const course = await courseModel.findOne({ id: courseId }).lean();

    if (!course) {
      return { message: "Course not found", statusCode: 404, data: {} };
    }

    // لو المستخدم مسجل دخول
    if (userId) {
      const student = await studentModel.findOne({
        _id: new ObjectId(userId)
      }).lean();

      if (student) {
        const hasCourse = student.transactions?.some(
          tx =>
            String(tx.courseId) === String(courseId) &&
            tx.status === "paid"
        );

        // مشترك → يرجع الكورس كامل
        if (hasCourse) {
          return {
            message: "Course fetched successfully",
            statusCode: 200,
            data: course
          };
        }
      }
    }

    // غير مشترك → حذف source
    if (course.sections?.length) {
      course.sections = course.sections.map(section => ({
        ...section,
        sectionables: section.sectionables?.map(item => {
          if (item.sectionable) {
            const { source, ...restSectionable } = item.sectionable;
            return {
              ...item,
              sectionable: restSectionable
            };
          }
          return item;
        })
      }));
    }

    return {
      message: "Course fetched successfully",
      statusCode: 200,
      data: course
    };

  } catch (err) {
    console.error("Service Error:", err);
    return { message: "خطأ في السيرفر", statusCode: 500, data: {} };
  }
};

const getAllCourses = async () => {
  try {
    const courses = await courseModel.find().lean();

    return {
      message: "تم جلب جميع الكورسات",
      statusCode: 200,
      data: courses,
    };
  } catch (err) {
    console.error(err);
    return { message: "خطأ في السيرفر", statusCode: 500, data: {} };
  }
};

const getCoursesByYear = async ({ year }) => {
  try {
    const courses = await courseModel.find({ year: Number(year) }).lean();

    const formattedCourses = courses.map(course => ({
      ...course,
      sections: []
    }));

    return {
      message: "تم جلب الكورسات حسب السنة",
      statusCode: 200,
      data: formattedCourses,
    };
  } catch (err) {
    console.error(err);
    return { message: "خطأ في السيرفر", statusCode: 500, data: {} };
  }
};

const addWeek = async (courseId, body) => {
  try {
    const course = await courseModel.findOne({ id: courseId });
    if (!course) {
      return { message: "Course not found", statusCode: 404, data: {} };
    }

    // Generate new week id
    const allWeeks = course.sections || [];
    const maxWeekId = allWeeks.reduce(
      (maxId, sec) => Math.max(maxId, sec.id || 0),
      0
    );
    const newWeekId = maxWeekId + 1;

    const newWeek = {
      id: newWeekId,
      name: body.name || "",
      description: body.description || "",
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      deleted_at: null,
      is_deleted: false,
      sectionables: []
    };

    await courseModel.updateOne(
      { id: courseId },
      {
        $push: { sections: newWeek },
        $set: { updated_at: new Date().toISOString() }
      }
    );

    const allCourses = await courseModel.find().lean()

    return { message: "تم الاضافه بنجاح", statusCode: 201, data: allCourses };
  } catch (err) {
    console.error(err);
    return { message: "خطأ في السيرفر", statusCode: 500, data: {} };
  }
}

const deleteweek = async (courseId, weekId) => {
  try {
    const course = await courseModel.findOne({ id: courseId });
    if (!course) {
      return { message: "Course not found", statusCode: 404, data: {} };
    }

    const section = course.sections.filter((week) => week.id === weekId)    

    if (section[0].sectionables.length != 0) {
      return {
        message: "من فضلك احذف الدروس الذي بداخل الأسبوع",
        statusCode: 400,
        data: {}
      };
    }

    course.sections = course.sections.filter((week) => week.id !== weekId);
    await course.save();

    const allCourses = await courseModel.find().lean();

    return {
      message: "تم تعديل الأسبوع بنجاح",
      statusCode: 200,
      data: allCourses
    };

  } catch (err) {
    console.error(err);
    return { message: "خطأ في السيرفر", statusCode: 500, data: {} };
  }
};

const deletecontent = async (courseId, weekId, sectionableId) => {
  try {
    const course = await courseModel.findOne({ id: courseId });
    if (!course) {
      return { message: "Course not found", statusCode: 404, data: {} };
    }

    let section = course.sections.find(section => section.id === weekId);
    if (!section) {
      return { message: "Week not found", statusCode: 404, data: {} };
    }

    let sectionable = section.sectionables.find(s => s.id === sectionableId);
    if (!sectionable) {
      return { message: "Content not found", statusCode: 404, data: {} };
    }

    // حذف الـ sectionable
    section.sectionables = section.sectionables.filter(sec => sec.id !== sectionableId);

    await course.save();

    const allCourses = await courseModel.find().lean()

    return {
      message: "تم حذف المحتوى بنجاح",
      statusCode: 200,
      data: allCourses
    };

  } catch (err) {
    console.error(err);
    return { message: "خطأ في السيرفر", statusCode: 500, data: {} };
  }
};

const updateWeek = async (courseId, weekId, body) => {
  try {
    const course = await courseModel.findOne({ id: courseId });
    if (!course) {
      return { message: "Course not found", statusCode: 404, data: {} };
    }

    const week = course.sections.find(sec => sec.id === weekId);
    if (!week) {
      return { message: "Week not found", statusCode: 404, data: {} };
    }

    await courseModel.updateOne(
      { id: courseId, "sections.id": weekId },
      {
        $set: {
          "sections.$.name": body.name || week.name,
          "sections.$.description": body.description || week.description,
          "sections.$.updated_at": new Date().toISOString()
        }
      }
    );

    const allCourses = await courseModel.find().lean()

    return {
      message: "تم تعديل الأسبوع بنجاح",
      statusCode: 200,
      data: allCourses
    };

  } catch (err) {
    console.error(err);
    return { message: "خطأ في السيرفر", statusCode: 500, data: {} };
  }
};

const addSectionableBook = async (courseId, weekId, body, fileName) => {
  try {
    const course = await courseModel.findOne({ id: courseId });
    if (!course) {
      return { message: "Course not found", statusCode: 404, data: {} };
    }

    const week = course.sections.find(sec => sec.id === weekId);
    if (!week) {
      return { message: "Week not found", statusCode: 404, data: {} };
    }

    const sectionables = week.sectionables || [];
    const maxId = sectionables.reduce((max, item) => Math.max(max, item.id || 0), 0);
    const newId = maxId + 1;

    const sectionableId = Date.now();

    const now = new Date();
    const visibleFrom = now.toISOString();
    const visibleTo = new Date(now.setFullYear(now.getFullYear() + 1)).toISOString();

    const sectionable = {
      id: sectionableId,
      name: body.name || "",
      description: body.description || "",
      source: `books/${fileName}`,
      division_id: 12,
      year: body.year || "",
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      deleted_at: null,
      is_deleted: false
    };

    const newSectionable = {
      id: newId,
      sectionable_type: "book",
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
      { id: courseId, "sections.id": weekId },
      {
        $push: { "sections.$.sectionables": newSectionable },
        $set: { updated_at: new Date().toISOString() }
      }
    );

    const allCourses = await courseModel.find().lean()

    return {
      message: "Sectionable added successfully",
      statusCode: 200,
      data: allCourses
    };

  } catch (err) {
    console.error("Service Error:", err);
    return { message: "خطأ في السيرفر", statusCode: 500, data: {} };
  }
}

const updateSectionableBook = async (courseId, weekId, sectionableId, body, fileName) => {
  try {
    const course = await courseModel.findOne({ id: courseId });
    if (!course) return { message: "Course not found", statusCode: 404, data: {} };

    const week = course.sections.find(sec => sec.id === weekId);
    if (!week) return { message: "Week not found", statusCode: 404, data: {} };

    const sectionable = week.sectionables.find(s => s.sectionable_id === sectionableId);
    if (!sectionable) return { message: "Sectionable not found", statusCode: 404, data: {} };

    const updateData = {
      "sections.$[week].sectionables.$[item].sectionable.name": body.name || sectionable.sectionable.name,
      "sections.$[week].sectionables.$[item].sectionable.description": body.description || sectionable.sectionable.description,
      "sections.$[week].sectionables.$[item].updated_at": new Date().toISOString()
    };

    if (fileName) {
      updateData["sections.$[week].sectionables.$[item].sectionable.source"] = `books/${fileName}`;
    }

    await courseModel.updateOne(
      { id: courseId },
      { $set: updateData },
      {
        arrayFilters: [
          { "week.id": weekId },
          { "item.sectionable_id": sectionableId }
        ]
      }
    );

    const allCourses = await courseModel.find().lean()

    return {
      message: "تم تعديل الكتاب بنجاح",
      statusCode: 200,
      data: allCourses
    };

  } catch (err) {
    console.error(err);
    return { message: "خطأ في السيرفر", statusCode: 500, data: {} };
  }
};

const get_book = async ({ courseId, weekId, sectionId, user }) => {
  try {

    if (user) {
      const student = await studentModel.findOne({
        _id: new ObjectId(user.userId)
      }).lean();

      if (student) {
        const hasCourse = student.transactions?.some(
          tx =>
            String(tx.courseId) === String(courseId) &&
            tx.status === "paid"
        );

        if (hasCourse) {
          const course = await courseModel.findOne({ id: parseInt(courseId) });
          if (!course) return { message: "Course not found", statusCode: 404, data: {} };

          const week = (course.sections || []).find(w => w.id === parseInt(weekId));
          if (!week) return { message: 'Week not found', statusCode: 404, data: {} };

          const sectionable = (week.sectionables || []).find(s =>
            s.id === parseInt(sectionId) && s.sectionable_type === 'book'
          );
          if (!sectionable) return { message: 'Book section not found', statusCode: 404, data: {} };

          const sourcePath = sectionable.sectionable.source;
          const filePath = path.join(__dirname, "../", sourcePath);
          console.log('🔍 Looking for:', filePath);

          if (!fs.existsSync(filePath)) {
            return { message: 'File not found on server', statusCode: 404, data: {} }
          }

          return {
            message: "File ready for download",
            statusCode: 200,
            data: {
              filePath: sourcePath,
            }
          };
        } else {
          return { message: 'Please Buy A Course', statusCode: 200, data: {} };
        }
      } else if (!student) {
        return { message: 'Please Login', statusCode: 401, data: {} };
      }
    }

    return { message: 'Please Login', statusCode: 401, data: {} };

  } catch (err) {
    console.error(err);
    return { message: 'Server error', statusCode: 500, data: {} };
  }
}

const get_video = async ({ videoId, courseId, sectionId, sectionableId, user }) => {
  try {
    if (!user?.userId) {
      return { message: "Please Login", statusCode: 401, data: {} };
    }

    const student = await studentModel.findOne({
      _id: new ObjectId(user.userId)
    }).lean();

    if (!student) {
      return { message: "Please Login", statusCode: 401, data: {} };
    }

    const hasCourse = student.transactions?.some(
      tx =>
        String(tx.courseId) === String(courseId) &&
        tx.status === "paid"
    );

    if (!hasCourse) {
      console.log(hasCourse, user.userId);

      return { message: "Please Buy A Course", statusCode: 403, data: {} };
    }

    const course = await courseModel.findOne({ id: parseInt(courseId) }).lean();
    if (!course) {
      return { message: "Course not found", statusCode: 404, data: {} };
    }

    const week = course.sections.find(
      s => s.id === parseInt(sectionId)
    );
    if (!week) {
      return { message: "Section not found", statusCode: 404, data: {} };
    }

    const sectionable = week.sectionables.find(
      s =>
        s.id === parseInt(sectionableId) &&
        s.sectionable_type === "video"
    );
    if (!sectionable) {
      return { message: "Video not found", statusCode: 404, data: {} };
    }

    const response = await axios.post(
      `https://dev.vdocipher.com/api/videos/${videoId}/otp`,
      { ttl: 300 },
      {
        headers: {
          Authorization: `Apisecret ${process.env.VDOCIPHER_API_SECRET2}`,
        },
      }
    );

    return {
      message: "Video access granted",
      statusCode: 200,
      data: {
        otp: response.data.otp,
        playbackInfo: response.data.playbackInfo,
      },
    };

  } catch (error) {
    console.error("get_video error:", error);
    return { message: "Server error", statusCode: 500, data: {} };
  }
};


module.exports = { deletecontent, deleteweek, get_video, get_book, addCourse, updateCourse, getCourseById, getCoursesByYear, getAllCourses, addWeek, updateWeek, addSectionableBook, updateSectionableBook };
