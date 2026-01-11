const discountModel = require("../models/discountModel");

const addCode = async ({
  code,
  type,
  value,
  permission,
  limit,
  expireDate,
}) => {
  try {
    const getDiscount = await discountModel.findOne({ code });
    if (getDiscount) {
      return { statusCode: 400, message: "الاسم مستخدم من قبل ", data: {} };
    }
    let expire;

    if (expireDate) {
      expire = new Date(expireDate);
    } else {
      expire = new Date();
      expire.setFullYear(expire.getFullYear() + 1);
    }

    let Data = {
      code,
      type,
      value,
      permission,
      limit,
      createdAt: Date.now(),
      expireDate: expire,
      deletedAt: "",
    };

    if (permission.scope === "global") {
      Data.permission = { scope: "global" };

      const newCode = new discountModel(Data);
      await newCode.save();
      return {
        statusCode: 201,
        message: "تم إضافه الكود بنجاح",
        data: newCode,
      };
    }

    if (permission.scope === "courses") {
      Data.permission = { scope: "courses", courses: permission.courses };
      const newCode = new discountModel(Data);
      await newCode.save();
      return {
        statusCode: 201,
        message: "تم إضافه الكود بنجاح",
        data: newCode,
      };
    }

    if (permission.scope === "years") {
      Data.permission = { scope: "years", years: permission.years };
      const newCode = new discountModel(Data);
      await newCode.save();
      return {
        statusCode: 201,
        message: "تم إضافه الكود بنجاح",
        data: newCode,
      };
    }
  } catch (err) {
    console.error("❌ Error Add code:", err);
    return { statusCode: 500, message: "خطأ في السيرفر", data: {} };
  }
};

const getAllDiscounts = async () => {
  try {
    const getAllCodes = await discountModel.find().lean();

    if (!getAllCodes) {
      return {
        statusCode: 200,
        message: "Get All Codes Successfully",
        data: [],
      };
    }
    return {
      statusCode: 200,
      message: "Get All Codes Successfully",
      data: getAllCodes,
    };
  } catch (err) {
    console.error("❌ Error get all code:", err);
    return { statusCode: 500, message: "خطأ في السيرفر", data: {} };
  }
};

const updateCode = async ({
  discountId,
  code,
  type,
  value,
  permission,
  limit,
  expireDate,
}) => {
  try {
    const discount = await discountModel.findById(discountId);
    if (!discount) {
      return {
        statusCode: 404,
        message: "الخصم غير موجود",
        data: {},
      };
    }

    if (code && code !== discount.code) {
      const usedCode = await discountModel.findOne({
        code,
        _id: { $ne: discountId },
      });

      if (usedCode) {
        return {
          statusCode: 400,
          message: "الاسم مستخدم من قبل",
          data: {},
        };
      }
    }

    let expire;
    if (expireDate) {
      expire = new Date(expireDate);
    } else {
      expire = discount.expireDate;
    }

    let permissionData;

    if (permission.scope === "global") {
      permissionData = { scope: "global" };
    }

    if (permission.scope === "courses") {
      permissionData = {
        scope: "courses",
        courses: permission.courses,
      };
    }

    if (permission.scope === "years") {
      permissionData = {
        scope: "years",
        years: permission.years,
      };
    }

    const updatedDiscount = await discountModel.findByIdAndUpdate(
      discountId,
      {
        code,
        type,
        value,
        permission: permissionData,
        limit,
        expireDate: expire,
      },
      {
        new: true,
        runValidators: true,
      }
    );

    return {
      statusCode: 200,
      message: "تم تعديل الكود بنجاح",
      data: updatedDiscount,
    };
  } catch (err) {
    console.error("❌ Error Update code:", err);
    return {
      statusCode: 500,
      message: "خطأ في السيرفر",
      data: {},
    };
  }
};

const deleteCode = async ({ discountId }) => {
  try {
    const deleteDiscount = await discountModel.findByIdAndDelete(discountId);

    if (!deleteDiscount) {
      return {
        statusCode: 404,
        message: "يرجي إختيار كود خصم صحيح",
        data: {},
      };
    }

    return {
      statusCode: 200,
      message: "تم حذف و تعطيل كود الخصم",
      data: {},
    };
  } catch (err) {
    console.error("❌ Error Update code:", err);
    return {
      statusCode: 500,
      message: "خطأ في السيرفر",
      data: {},
    };
  }
};

module.exports = { addCode, getAllDiscounts, updateCode, deleteCode };
