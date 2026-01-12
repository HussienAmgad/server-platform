const express = require("express");
const {
  GetAllAssistant,
  AddAssistant,
  EditAssistant,
  DeleteAssistant,
} = require("../services/assistantServices");
const { requireAdminAuth } = require("../middlewares/requireAdminAuth");
const requireBodyFields = require("../middlewares/requireBodyFields");
const { default: requireParams } = require("../middlewares/requireParams");

const router = express.Router();

router.post(
  "/add_assistant",
  requireAdminAuth,
  requireBodyFields(["firstName", "lastName", "password", "email", "phone"]),
  async (req, res) => {
    try {
      const { firstName, lastName, password, email, phone } = req.body;
      const result = await AddAssistant({
        firstName,
        lastName,
        password,
        email,
        phone,
      });

      return res.status(result.statusCode).json({
        message: result.message,
        data: result.data,
      });
    } catch (error) {
      console.error("Router Error /Add_Assistant:", error);
      return res.status(500).json({
        message: "Internal Server Error",
        data: {},
      });
    }
  }
);

router.post(
  "/edit_assistant",
  requireAdminAuth,
  requireBodyFields([
    "id",
    "firstName",
    "lastName",
    "password",
    "email",
    "phone",
  ]),
  async (req, res) => {
    try {
      const { id, firstName, lastName, password, email, phone } = req.body;
      const result = await EditAssistant({
        id,
        firstName,
        lastName,
        password,
        email,
        phone,
      });

      return res.status(result.statusCode).json({
        message: result.message,
        data: result.data,
      });
    } catch (error) {
      console.error("Router Error /Edit_Assistant:", error);
      return res.status(500).json({
        message: "Internal Server Error",
        data: {},
      });
    }
  }
);

router.delete(
  "/delete_assistant/:id",
  requireAdminAuth,
  requireParams(["id"]),
  async (req, res) => {
    try {
      const { id } = req.params;
      const result = await DeleteAssistant({ id });

      return res.status(result.statusCode).json({
        message: result.message,
        data: result.data,
      });
    } catch (error) {
      console.error("Router Error /delete_Assistant:", error);
      return res.status(500).json({
        message: "Internal Server Error",
        data: {},
      });
    }
  }
);

router.get("/get_All_Assistant", requireAdminAuth, async (req, res) => {
  try {
    const result = await GetAllAssistant();

    return res.status(result.statusCode).json({
      message: result.message,
      data: result.data,
    });
  } catch (error) {
    console.error("Router Error /get_All_Assistant:", error);
    return res.status(500).json({
      message: "Internal Server Error",
      data: {},
    });
  }
});

module.exports = router;
