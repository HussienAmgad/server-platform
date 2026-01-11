const express = require("express");
const { registerStudent, loginPhoneStudent, loginEmailStudent, studentTransactions, get_waching, studentExam, getProfileStudent, getAllStudents } = require("../services/studentServices");
const { requireStudentAuth } = require("../middlewares/requireStudentAuth");
const requireBodyFields = require("../middlewares/requireBodyFields");
const { default: requireParams } = require("../middlewares/requireParams");
const { verifyTokenAssistant } = require("../middlewares/verifyTokenAssistant");
const requireQueryParams = require("../middlewares/requireQueryParams");

const router = express.Router();

router.post("/register", async (req, res) => {
  try {
    const { firstName, lastName, studentNumber, parentNumber, city, year, password, rePassword, email } = req.body;
    const response = await registerStudent({ firstName, lastName, studentNumber, parentNumber, city, year, password, rePassword, email });
    res.status(response.statusCode).json({
      message: response.message,
      data: response.data,
    });
  } catch (error) {
    res.status(500).json({ message: "Internal Server Error", error: error.message });
  }
});

router.post(
  "/loginphone",
  requireBodyFields(["phone", "password"]),
  async (req, res) => {
    try {
      const { phone, password } = req.body;

      const response = await loginPhoneStudent({ phone, password });

      res.status(response.statusCode).json({
        message: response.message,
        data: response.data,
      });

    } catch (error) {
      console.error("Router Error /loginphone:", error);
      return res.status(500).json({
        message: "Internal Server Error"
      });
    }
  }
);

router.get(
  "/allstudents",
  verifyTokenAssistant,
  requireQueryParams(["counter", "limit"]),
  async (req, res) => {
    try {
      const counter = Number(req.query.counter)
      const limit = Number(req.query.limit)

      const response = await getAllStudents({ counter, limit });

      return res.status(response.statusCode).json({
        message: response.message,
        data: response.data,
        meta: response.meta
      });
    } catch (error) {
      console.error("Router Error /allstudents:", error);
      return res.status(500).json({
        message: "Internal Server Error"
      });
    }
  }
);

router.post(
  "/loginemail",
  requireBodyFields(["email", "password"]),
  async (req, res) => {
    try {
      const { email, password } = req.body;

      const response = await loginEmailStudent({ email, password });

      return res.status(response.statusCode).json({
        message: response.message,
        data: response.data
      });

    } catch (error) {
      console.error("Router Error /loginemail:", error);
      return res.status(500).json({
        message: "Internal Server Error"
      });
    }
  }
);

router.post(
  "/transactions",
  requireBodyFields(["token"]),
  async (req, res) => {
    try {
      const { token } = req.body;

      const response = await studentTransactions({ token });

      return res.status(response.statusCode).json({
        message: response.message,
        data: response.data
      });

    } catch (error) {
      console.error("Router Error /transactions:", error);
      return res.status(500).json({
        message: "Internal Server Error"
      });
    }
  }
);

router.post(
  "/get_views",
  requireBodyFields(["userId", "courseId", "sectionId", "sectionableId"]),
  async (req, res) => {
    try {
      const { userId, courseId, sectionId, sectionableId } = req.body;

      const response = await get_waching(
        userId,
        courseId,
        sectionId,
        sectionableId
      );

      return res.status(response.statusCode).json({
        message: response.message,
        data: response.data
      });

    } catch (error) {
      console.error("Router Error /get_views:", error);
      return res.status(500).json({
        message: "Internal Server Error"
      });
    }
  }
);

router.get(
  "/exam/:courseId/:sectionId/:examId",
  requireStudentAuth,
  requireParams(["courseId", "sectionId", "examId"]),
  async (req, res) => {
    try {
      const { courseId, sectionId, examId } = req.params;

      const response = await studentExam({
        courseId,
        sectionId,
        examId,
        user: req.user
      });

      return res.status(response.statusCode).json({
        message: response.message,
        data: response.data
      });

    } catch (error) {
      console.error("Router Error /exam:", error);
      return res.status(500).json({
        message: "Internal Server Error"
      });
    }
  }
);

router.get(
  "/profile",
  requireStudentAuth,
  async (req, res) => {
    try {
      const response = await getProfileStudent({
        user: req.user
      });

      return res.status(response.statusCode).json({
        message: response.message,
        data: response.data
      });

    } catch (error) {
      console.error("Router Error /profile:", error);
      return res.status(500).json({
        message: "Internal Server Error"
      });
    }
  }
);

module.exports = router;