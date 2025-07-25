"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const cors_1 = __importDefault(require("cors"));
const mongoose_1 = __importDefault(require("mongoose"));
const schema_1 = require("./schema");
const bcrypt_1 = __importDefault(require("bcrypt"));
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const nodemailer_1 = __importDefault(require("nodemailer"));
const dotenv_1 = __importDefault(require("dotenv"));
dotenv_1.default.config();
const app = (0, express_1.default)();
const PORT = process.env.PORT || 5000;
const JWT_SECRET = process.env.JWT_SECRET || "mySecretKey"; // ضعها في .env
const url = process.env.MONGO_URL || "mongodb://localhost:27017/users"; // استخدم MONGO_URL من .env أو افتراضي
mongoose_1.default
    .connect(url)
    .then(() => console.log("✅ Connected to DB"))
    .catch((err) => console.error("❌ DB Connection Error:", err));
app.use(express_1.default.json());
app.use((0, cors_1.default)());
// ✅ إحضار كل البيانات
app.get("/all", async (req, res) => {
    try {
        const data = await schema_1.schema.find();
        return res.status(200).json({ success: true, data });
    }
    catch (err) {
        console.error(err);
        return res.status(500).json({ success: false, message: "Server Error" });
    }
});
// ✅ إحضار بيانات حسب الـ ID
app.get("/:id", async (req, res) => {
    try {
        const _id = req.params.id;
        const data = await schema_1.schema.findById(_id);
        if (!data) {
            return res.status(404).json({ success: false, message: "Not Found" });
        }
        return res.status(200).json({ success: true, data });
    }
    catch (err) {
        console.error(err);
        return res.status(400).json({ success: false, message: "Invalid ID" });
    }
});
// ✅ تسجيل مستخدم جديد
app.post("/register", async (req, res) => {
    try {
        const { username, email, password, address, phone, temp } = req.body;
        // تحقق إذا كان المستخدم موجود مسبقاً
        const existingUser = await schema_1.schema.findOne({ email });
        if (existingUser) {
            return res
                .status(400)
                .json({ success: false, message: "User already exists" });
        }
        // تشفير كلمة السر
        const hashedPassword = await bcrypt_1.default.hash(password, 10);
        // حفظ البيانات في قاعدة البيانات
        const newUser = new schema_1.schema({
            username,
            email,
            password: hashedPassword,
            address,
            phone,
            temp
        });
        await newUser.save();
        // إنشاء توكن JWT
        const token = jsonwebtoken_1.default.sign({ id: newUser._id, email: newUser.email }, JWT_SECRET, {
            expiresIn: "7d",
        });
        return res.status(201).json({
            success: true,
            message: "User registered successfully",
            token,
            user: {
                id: newUser._id,
                username: newUser.username,
                email: newUser.email,
                address: newUser.address,
                phone: newUser.phone,
                temp: newUser.temp
            },
        });
    }
    catch (err) {
        console.error(err);
        return res.status(500).json({ success: false, message: "Server Error" });
    }
});
app.post("/login", async (req, res) => {
    const { email, password } = req.body;
    if (!email || !password) {
        return res.status(400).json({ success: false, message: "Bad Request" });
    }
    const findUser = await schema_1.schema.findOne({ email: req.body.email });
    if (!findUser) {
        return res.status(404).json({ success: false, message: "User Not Found" });
    }
    const isMatch = bcrypt_1.default.compare(password, findUser.password);
    if (!isMatch) {
        return res.status(401).json({ success: false, message: "Unauthorized" });
    }
    const token = jsonwebtoken_1.default.sign({ id: findUser._id, email: findUser.email }, JWT_SECRET, {
        expiresIn: "7d",
    });
    return res
        .status(200)
        .json({ success: true, token, id: findUser._id, email: findUser.email });
});
app.patch("/update/:id", async (req, res) => {
    try {
        const _id = req.params.id;
        const data = await schema_1.schema.findByIdAndUpdate(_id, req.body);
        return res.status(200).json({ success: true, data });
    }
    catch (error) {
        return res.status(500).json({ success: false, message: "Server Error" });
    }
});
//Email
// لا تضع كلمة المرور مباشرة في الكود (استخدم .env)
let transporter = nodemailer_1.default.createTransport({
    service: "gmail",
    auth: {
        user: process.env.EMAIL_USER, // "sensosafee@gmail.com"
        pass: process.env.EMAIL_PASS, // كلمة مرور التطبيق (وليس كلمة مرور الإيميل العادية)
    },
});
app.post("/email", async (req, res) => {
    try {
        const { email, phone, address, username } = req.body;
        // تحقق من وجود المستخدم
        const mailOptions = {
            from: `"SensoSafe" <${process.env.EMAIL_USER}>`,
            to: "ak7055864@gmail.com", // البريد الذي سترسل له البلاغ
            subject: "بلاغ عاجل: تسرب غاز",
            text: `يوجد تسرب غاز في الموقع التالي:
العنوان:${address}]
رقم الهاتف للتواصل:${phone}يرجى سرعة التدخل حفاظًا على السلامة العامة.`,
            html: `
    <h2 style="color:red;">🚨 بلاغ عاجل: تسرب غاز</h2>
    <p>يوجد تسرب غاز في الموقع التالي:</p>
    <p><b>العنوان:</b> ${address}</p>
    <p><b>رقم الهاتف للتواصل:</b> ${phone}</p>
    <p style="color:red;"><b>يرجى سرعة التدخل حفاظًا على السلامة العامة.</b></p>
  `,
        };
        await transporter.sendMail(mailOptions);
        return res
            .status(200)
            .json({ success: true, message: "Email sent successfully" });
    }
    catch (error) {
        console.error(error);
        return res.status(500).json({ success: false, message: "Server Error" });
    }
});
const twilio = require("twilio");
const client = twilio(process.env.TWILIO_ACCOUNT_SID, process.env.TWILIO_AUTH_TOKEN);
// API لطلب الاتصال
app.post("/call", async (req, res) => {
    try {
        const { phone } = req.body; // رقم الهاتف بصيغة دولية مثل +2010XXXXXXXX
        const call = await client.calls.create({
            url: "http://demo.twilio.com/docs/voice.xml",
            to: phone,
            from: process.env.TWILIO_PHONE,
        });
        res.json({ success: true, message: "تم الاتصال بنجاح", callSid: call.sid });
    }
    catch (err) {
        console.error(err);
        res.status(500).json({ success: false, message: "خطأ أثناء الاتصال" });
    }
});
app.listen(PORT, () => console.log(`🚀 Server started at http://localhost:${PORT}`));
