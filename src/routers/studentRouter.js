const express = require("express");
const { registerStudent, loginPhoneStudent, loginEmailStudent, studentTransactions, get_waching, studentExam, getProfileStudent } = require("../services/studentServices");
const { verifyTokenStudent } = require("../middlewares/verifyTokenStudent");

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

router.post("/loginphone", async (req, res) => {
  try {
    const { phone, password } = req.body;
    const response = await loginPhoneStudent({ phone, password });
    res.status(response.statusCode).json({
      message: response.message,
      data: response.data,
    });
  } catch (error) {
    res.status(500).json({ message: "Internal Server Error", error: error.message });
  }
});

router.post("/loginemail", async (req, res) => {
  try {
    const { email, password } = req.body;
    const response = await loginEmailStudent({ email, password });
    res.status(response.statusCode).json({
      message: response.message,
      data: response.data,
    });
  } catch (error) {
    res.status(500).json({ message: "Internal Server Error", error: error.message });
  }
});

router.post("/transactions", async (req, res) => {
  try {
    const { token } = req.body;
    const response = await studentTransactions({ token });
    res.status(response.statusCode).json({
      message: response.message,
      data: response.data,
    });
  } catch (error) {
    res.status(500).json({ message: "Internal Server Error", error: error.message });
  }
});

router.post("/get_views", async (req, res) => {
  try {
    const { userId, courseId, sectionId, sectionableId } = req.body;
    const response = await get_waching(userId, courseId, sectionId, sectionableId);
    res.status(response.statusCode).json({
      message: response.message,
      data: response.data,
    });
  } catch (error) {
    res.status(500).json({ message: "Internal Server Error", error: error.message });
  }
});

router.get("/exam/:courseId/:sectionId/:examId", verifyTokenStudent, async (req, res) => {
  try {
    const { courseId, sectionId, examId } = req.params;
    const response = await studentExam({ courseId, sectionId, examId, user: req.user });
    res.status(response.statusCode).json({
      message: response.message,
      data: response.data,
    });
  } catch (error) {
    res.status(500).json({ message: "Internal Server Error", error: error.message });
  }
});

router.get("/profile", verifyTokenStudent, async (req, res) => {
  try {
    const response = await getProfileStudent({ user: req.user });
    res.status(response.statusCode).json({
      message: response.message,
      data: response.data,
    });
  } catch (error) {
    res.status(500).json({ message: "Internal Server Error", error: error.message });
  }
});



module.exports = router;
