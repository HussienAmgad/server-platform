const express = require("express");
const { startCheckout, verifyCheckout, getAllCheckouts } = require("../services/checkoutServices");
const router = express.Router();


router.post("/", async (req, res) => {
  const result = await startCheckout({ 
    token: req.body.token, 
    courseId: req.body.courseId, 
    PaymentMethodType: req.body.PaymentMethodType,
  });
  res.status(result.statusCode).json({ message: result.message, data: result.data });
});

router.get("/verify", async (req, res) => {
  const result = await verifyCheckout({ session_id: req.query.session_id });
  res.status(result.statusCode).json({ message: result.message, data: result.data });
});

router.get("/", async (req, res) => {
  const result = await getAllCheckouts();
  res.status(result.statusCode).json({ message: result.message, data: result.data });
});




module.exports = router;