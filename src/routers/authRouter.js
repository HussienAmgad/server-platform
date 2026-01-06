const express = require("express");
const router = express.Router();
const { verifyToken, checkAccess } = require("../services/authServices");


router.post("/check-access-course", async (req, res) => {
  try {
    const { token, courseId } = req.body;

    const result = await checkAccess({
      token,
      courseId
    });

    return res.status(result.statusCode).json({
      message: result.message,
      data: result.data
    });

  } catch (err) {
    console.error("Router Error:", err);
    return res.status(500).json({
      message: "Server Error",
      data: {}
    });
  }
});

router.post("/verify-token", async (req, res) => {
  try {
    const { token } = req.body;

    const response = await verifyToken({ token });

    return res.status(response.statusCode).json({
      message: response.message,
      data: response.data
    });

  } catch (err) {
    console.error("Router Error:", err);
    return res.status(500).json({
      message: "Server Error",
      data: { valid: false }
    });
  }
});

module.exports = router;
