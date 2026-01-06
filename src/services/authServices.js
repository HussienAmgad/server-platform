const jwt = require("jsonwebtoken");
const { ObjectId } = require("mongodb");
const studentModel = require("../models/studentModel");
const courseModel = require("../models/courseModel");

const JWT_SECRET = process.env.JWT_SECRET;

const checkAccess = async ({ token, courseId }) => {
  try {
    if (!token) {
      return { message: "token required", statusCode: 400, data: {} };
    }

    const numericCourseId = Number(courseId);
    if (isNaN(numericCourseId)) {
      return { statusCode: 400, message: "رقم الكورس غير صالح", data: {} };
    }

    if (!numericCourseId) {
      return { message: "courseId required", statusCode: 400, data: {} };
    }

    let decoded;
    try {
      decoded = jwt.verify(token, JWT_SECRET);
    } catch (err) {
      return {
        message: "Invalid token",
        statusCode: 401,
        data: { error: err.message }
      };
    }

    const userId = decoded.userId;

    const user = await studentModel.findOne({
      _id: new ObjectId(userId)
    });

    if (!user) {
      return { message: "User not found", statusCode: 404, data: {} };
    }

    const course = await courseModel.findOne({
      id: numericCourseId
    });

    if (!course) {
      return { message: "Course not found", statusCode: 404, data: {} };
    }

    const hasCourse = user.transactions?.some(
      tx =>
        tx.courseId === numericCourseId &&
        tx.status === "paid"
    );

    return {
      message: "Check finished",
      statusCode: 200,
      data: { hasAccess: !!hasCourse }
    };

  } catch (err) {
    console.error("Service Error:", err);
    return {
      message: "Server Error",
      statusCode: 500,
      data: { error: err.message }
    };
  }
}

const verifyToken = async ({ token }) => {
  try {
    if (!token) {
      return { message: "Token is required", statusCode: 400, data: { valid: false } };
    }

    try {
      const decoded = jwt.verify(token, JWT_SECRET);

      return {
        message: "Token is valid",
        statusCode: 200,
        data: {
          valid: true,
          decoded
        }
      };

    } catch (err) {
      return {
        message: "Invalid token",
        statusCode: 401,
        data: {
          valid: false
        }
      };
    }

  } catch (err) {
    console.error("Service Error:", err);
    return {
      message: "Server Error",
      statusCode: 500,
      data: { valid: false }
    };
  }
}

module.exports = { checkAccess, verifyToken };
