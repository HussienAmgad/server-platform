const express = require("express");
const router = express.Router();
const { verifyToken, checkAccess } = require("../services/authServices");
const requireBodyFields = require("../middlewares/requireBodyFields");

router.post(
  "/check-access-course",
  requireBodyFields(["token", "courseId"]),
  async (req, res) => {
    try {
      const { token, courseId } = req.body;

      const result = await checkAccess({ token, courseId });

      return res.status(result.statusCode).json({
        message: result.message,
        data: result.data,
      });
    } catch (err) {
      console.error("Router Error /check-access-course:", err);
      return res.status(500).json({
        message: "Server Error",
        data: {},
      });
    }
  }
);

// POST /verify-token
router.post("/verify-token", requireBodyFields(["token"]), async (req, res) => {
  try {
    const { token } = req.body;

    const result = await verifyToken({ token });

    return res.status(result.statusCode).json({
      message: result.message,
      data: result.data,
    });
  } catch (err) {
    console.error("Router Error /verify-token:", err);
    return res.status(500).json({
      message: "Server Error",
      data: { valid: false },
    });
  }
});

module.exports = router;
