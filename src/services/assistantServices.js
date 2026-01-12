const userModel = require("../models/userModel");
const studentModel = require("../models/studentModel");

const AddAssistant = async ({
  firstName,
  lastName,
  password,
  email,
  phone
}) => {
  try {
    const phoneConditions = [{ studentNumber: phone }, { parentNumber: phone }];

    const [studentExists, userExists] = await Promise.all([
      studentModel.findOne({ $or: phoneConditions }),
      userModel.findOne({ phone: { $in: phone } }),
    ]);

    if (studentExists || userExists) {
      return { message: "The Phone Is Used", statusCode: 400, data: {} };
    }

    if (password !== rePassword) {
      return {
        message: "Please Match the password",
        statusCode: 400,
        data: {},
      };
    }

    const existingEmailStudent = await studentModel.findOne({ email });
    const existingEmailUser = await userModel.findOne({ email });
    if (existingEmailUser || existingEmailStudent) {
      return { message: "Email already exists", statusCode: 400, data: {} };
    }

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    const newUser = new userModel({
      firstName,
      lastName,
      phone,
      userName: "Hussien-Amgad.com@" + phone,
      rol: "assistant",
      email,
      password: hashedPassword,
      createdAt: new Date(),
    });

    const result = await newUser.save();

    return {
      message: "User registered successfully",
      statusCode: 201,
      data: {
        result,
      },
    };
  } catch (err) {
    console.error(err);
    return { message: "Server Error", statusCode: 500, data: {} };
  }
};

const EditAssistant = async ({
  id,
  firstName,
  lastName,
  password,
  email,
  phone
}) => {
  try {
    const user = await userModel.findById(id);
    if (!user) {
      return { message: "User not found", statusCode: 404, data: {} };
    }

    const updateData = {};

    // firstName
    if (firstName && firstName !== user.firstName) {
      updateData.firstName = firstName;
    }

    // lastName
    if (lastName && lastName !== user.lastName) {
      updateData.lastName = lastName;
    }

    // phone (check uniqueness only if changed)
    if (phone && phone !== user.phone) {
      const phoneConditions = [
        { studentNumber: phone },
        { parentNumber: phone },
      ];

      const [studentExists, userExists] = await Promise.all([
        studentModel.findOne({ $or: phoneConditions }),
        userModel.findOne({ phone }),
      ]);

      if (studentExists || userExists) {
        return { message: "The Phone Is Used", statusCode: 400, data: {} };
      }

      updateData.phone = phone;
      updateData.userName = "Hussien-Amgad.com@" + phone;
    }

    // email (check uniqueness only if changed)
    if (email && email !== user.email) {
      const [studentEmailExists, userEmailExists] = await Promise.all([
        studentModel.findOne({ email }),
        userModel.findOne({ email }),
      ]);

      if (studentEmailExists || userEmailExists) {
        return { message: "Email already exists", statusCode: 400, data: {} };
      }

      updateData.email = email;
    }

    // password
    if (password && password.trim() !== "") {
      const salt = await bcrypt.genSalt(10);
      updateData.password = await bcrypt.hash(password, salt);
    }

    const updatedUser = await userModel.findByIdAndUpdate(
      id,
      { $set: updateData },
      { new: true }
    );

    return {
      message: "User updated successfully",
      statusCode: 200,
      data: updatedUser,
    };
  } catch (err) {
    console.error(err);
    return { message: "خطأ في السيرفر", statusCode: 500, data: {} };
  }
};

const DeleteAssistant = async ({ id }) => {
  try {
    const deleteAssistant = await userModel.findOneAndDelete({
      _id: id,
      rol: "assistant",
    });

    if (!deleteAssistant) {
      return { message: "يرجي اختيار اسستنت صالح", statusCode: 500, data: {} };
    }

    return { message: "تم حذف الأسستنت بنجاح", statusCode: 200, data: {} };
  } catch (err) {
    console.error(err);
    return { message: "خطأ في السيرفر", statusCode: 500, data: {} };
  }
};

const GetAllAssistant = async () => {
  try {
    const getAll = await userModel.find({ rol: "assistant" }).lean();

    return { message: "تم جلب جميع الاسستنت", statusCode: 200, data: getAll };
  } catch (err) {
    console.error(err);
    return { message: "خطأ في السيرفر", statusCode: 500, data: {} };
  }
};

module.exports = {
  AddAssistant,
  DeleteAssistant,
  GetAllAssistant,
  EditAssistant,
};
