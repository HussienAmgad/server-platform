const express = require("express");
const requireBodyFields = require("../middlewares/requireBodyFields");
const {
  addCode,
  updateCode,
  getAllDiscounts,
  deleteCode,
} = require("../services/discountServices");
const { requireAdminAuth } = require("../middlewares/requireAdminAuth");
const validateDiscountPermission = require("../middlewares/validateDiscountPermission");
const { default: requireParams } = require("../middlewares/requireParams");

const router = express.Router();

router.post(
  "/addCode",
  requireAdminAuth,
  validateDiscountPermission,
  requireBodyFields(["code", "type", "value", "permission", "limit"]),
  async (req, res) => {
    try {
      const { code, type, value, permission, limit, expireDate } = req.body;
      const response = await addCode({
        code,
        type,
        value,
        permission,
        limit,
        expireDate,
      });

      return res.status(response.statusCode).json({
        message: response.message,
        data: response.data,
      });
    } catch (error) {
      console.error("Router Error /addCode:", error);
      return res.status(500).json({
        message: "Internal Server Error",
      });
    }
  }
);

router.post(
  "/editCode",
  requireAdminAuth,
  validateDiscountPermission,
  requireBodyFields([
    "discountId",
    "code",
    "type",
    "value",
    "permission",
    "limit",
  ]),
  async (req, res) => {
    try {
      const { code, type, value, permission, limit, expireDate, discountId } =
        req.body;
      const response = await updateCode({
        discountId,
        code,
        type,
        value,
        permission,
        limit,
        expireDate,
      });

      return res.status(response.statusCode).json({
        message: response.message,
        data: response.data,
      });
    } catch (error) {
      console.error("Router Error /updateCode:", error);
      return res.status(500).json({
        message: "Internal Server Error",
      });
    }
  }
);

router.delete("/deleteCode/:discountId", requireAdminAuth, requireParams(["discountId"]), async (req, res) => {
  try {
    const { discountId } = req.params
    const response = await deleteCode({discountId});

    return res.status(response.statusCode).json({
      message: response.message,
      data: response.data,
    });
  } catch (error) {
    console.error("Router Error /getAllCode:", error);
    return res.status(500).json({
      message: "Internal Server Error",
    });
  }
});

router.get("/getAllCodes", requireAdminAuth, async (req, res) => {
  try {
    const response = await getAllDiscounts();

    return res.status(response.statusCode).json({
      message: response.message,
      data: response.data,
    });
  } catch (error) {
    console.error("Router Error /getAllCode:", error);
    return res.status(500).json({
      message: "Internal Server Error",
    });
  }
});

module.exports = router;
