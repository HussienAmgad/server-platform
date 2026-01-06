const studentModel = require("../models/studentModel");
const courseModel = require("../models/courseModel");
const checkoutModel = require("../models/checkoutModel");
const stripe = require("stripe")(process.env.STRIPE_SECRET_KEY); // تأكد إنك معرفه في .env
const jwt = require("jsonwebtoken");
const { ObjectId } = require('mongodb');

const JWT_SECRET = process.env.JWT_SECRET;


const startCheckout = async ({ token, courseId, PaymentMethodType }) => {
    try {
        const decoded = jwt.verify(token, JWT_SECRET);
        const userId = decoded.userId;

        const user = await studentModel.findOne({ _id: new ObjectId(userId) });
        if (!user) return { statusCode: 404, message: "المستخدم غير موجود", data: {} };

        const numericCourseId = Number(courseId);
        if (isNaN(numericCourseId)) {
            return { statusCode: 400, message: "رقم الكورس غير صالح", data: {} };
        }

        const course = await courseModel.findOne({ id: numericCourseId });
        if (!course) return { statusCode: 404, message: "الكورس غير موجود", data: {} };

        if (user.year !== course.year) {
            return { statusCode: 400, message: "الكورس ليس ضمن مستواك الدراسي", data: {} };
        }

        if (user.enrolledCourses?.includes(numericCourseId)) {
            return { statusCode: 400, message: "أنت بالفعل مشترك في هذا الكورس", data: {} };
        }

        const existing = await checkoutModel.findOne({
            "user.id": userId,
            "course.id": numericCourseId,
            isPaid: false
        });
        console.log("EXISTING CHECKOUT:", existing);

        if (existing) {
            return { statusCode: 200, message: "لديك جلسة دفع غير مكتملة", data: { paymentUrl: existing.paymentUrl } };
        }

        const coursefined = await courseModel.findOne({ id: numericCourseId }, { projection: { sections: 0 } });

        // إذا الكورس مجاني
        if (parseInt(course.price) === 0) {
            const transaction = {
                checkoutId: new ObjectId(),
                numericCourseId: coursefined.id,
                amount: 0,
                sessionId: null,
                course: coursefined,
                date: new Date(),
                paymentMethodType: "free",
                status: "paid"
            };

            const paymentUrl = `http://localhost:5174/payment-success?courseId=${numericCourseId}`;

            await studentModel.updateOne({ _id: new ObjectId(userId) }, {
                $addToSet: {
                    enrolledCourses: numericCourseId,
                    transactions: transaction
                }
            });
            await courseModel.updateOne({ id: numericCourseId }, { $inc: { subscriptions_count: 1 } });

            return { statusCode: 200, message: "تم الاشتراك في الكورس مجانًا", data: { paymentUrl, transaction } };
        }

        // إنشاء جلسة Stripe
        const session = await stripe.checkout.sessions.create({
            payment_method_types: [PaymentMethodType],
            line_items: [{
                price_data: {
                    currency: "egp",
                    product_data: { name: course.name, description: course.description },
                    unit_amount: parseInt(course.price) * 100
                },
                quantity: 1
            }],
            mode: "payment",
            customer_email: user.email,
            success_url: `http://localhost:5174/payment-success?session_id={CHECKOUT_SESSION_ID}&courseId=${numericCourseId}`,
            cancel_url: `http://localhost:5174/payment-cancel?courseId=${numericCourseId}`
        });

        const paymentUrl = session.url;

        const newCheckout = new checkoutModel({
            sessionId: session.id,
            user: { id: userId, email: user.email },
            course: coursefined,
            paymentUrl,
            isPaid: false,
            paymentMethodType: PaymentMethodType,
            createdAt: new Date()
        });

        await newCheckout.save();
        

        await studentModel.updateOne({ _id: new ObjectId(userId) }, {
            $push: {
                pendingPayments: {
                    numericCourseId,
                    course: coursefined,
                    sessionId: session.id,
                    paymentUrl,
                    paymentMethodType: PaymentMethodType,
                    createdAt: new Date()
                }
            }
        });

        return { statusCode: 201, message: "Checkout session created", data: { paymentUrl, sessionId: session.id } };

    } catch (err) {
        console.error(err);
        return { statusCode: 500, message: "خطأ في السيرفر", data: {} };
    }
};

const verifyCheckout = async ({ session_id }) => {
    try {
        if (!session_id) return { statusCode: 400, message: "يجب تقديم session_id", data: {} };

        const session = await stripe.checkout.sessions.retrieve(session_id);
        if (session.payment_status !== "paid") {
            return { statusCode: 200, message: "لم يتم الدفع", data: { status: false } };
        }

        const userEmail = session.customer_email;
        const user = await studentModel.findOne({ email: userEmail });
        if (!user) return { statusCode: 404, message: "المستخدم غير موجود", data: {} };

        const checkoutRecord = await checkoutModel.findOne({ sessionId: session_id });
        if (!checkoutRecord) return { statusCode: 404, message: "سجل الدفع غير موجود", data: {} };

        const course = await courseModel.findOne(
            { id: checkoutRecord.course.id },
            { projection: { sections: 0 } }
        );

        await checkoutModel.updateOne({ _id: checkoutRecord._id }, {
            $set: { isPaid: true, course },
            $unset: { paymentUrl: "" }
        });

        await studentModel.updateOne({ _id: user._id }, {
            $pull: { pendingPayments: { sessionId: session_id } }
        });

        if (!user.enrolledCourses?.includes(checkoutRecord.course.id)) {
            await studentModel.updateOne({ _id: user._id }, { $addToSet: { enrolledCourses: checkoutRecord.course.id } });
        }

        await courseModel.updateOne({ id: checkoutRecord.course.id }, { $inc: { subscriptions_count: 1 } });

        const transaction = {
            checkoutId: checkoutRecord._id,
            courseId: checkoutRecord.course.id,
            amount: checkoutRecord.course.price,
            sessionId: session_id,
            course,
            date: new Date(),
            paymentMethodType: checkoutRecord.paymentMethodType,
            status: "paid"
        };

        const existingTransaction = await studentModel.findOne({
            _id: user._id,
            "transactions.sessionId": session_id
        });

        if (!existingTransaction) {
            await studentModel.updateOne({ _id: user._id }, { $addToSet: { transactions: transaction } });
        }

        return { statusCode: 200, message: "تم الدفع بنجاح", data: {} };

    } catch (err) {
        console.error(err);
        return { statusCode: 500, message: "خطأ في السيرفر", data: {} };
    }
};

const getAllCheckouts = async () => {
    try {
        const courses = await checkoutModel.find().toArray();
        return { statusCode: 200, message: "تم جلب البيانات", data: courses };
    } catch (err) {
        console.error('❌ Error fetching courses:', err);
        return { statusCode: 500, message: "خطأ في السيرفر", data: {} };
    }
};

module.exports = { startCheckout, verifyCheckout, getAllCheckouts };
