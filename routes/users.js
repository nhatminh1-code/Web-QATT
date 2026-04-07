var express = require("express");
var router = express.Router();
let userModel = require("../schemas/users");
let { CreateAnUserValidator, validatedResult, ModifyAnUser } = require('../utils/validateHandler')
let userController = require('../controllers/users')
let { CheckLogin, CheckRole } = require('../utils/authHandler')

const crypto = require('crypto');
const mailHandler = require('../utils/mailHandler');

// API Import User & Gửi Email co the xoa de xem
router.post('/import', CheckLogin, CheckRole("ADMIN"), async function (req, res, next) {
    try {
        let { username, email, fullName, role } = req.body;

        // 1. Sinh ngẫu nhiên mật khẩu 16 ký tự (chuỗi hex)
        let generatedPassword = crypto.randomBytes(8).toString('hex');
        
        // 2. In ra Terminal theo đúng yêu cầu đồ án
        console.log("==========================================");
        console.log(`[SYSTEM INFO] Đã tạo tài khoản mới!`);
        console.log(`Email: ${email}`);
        console.log(`Mật khẩu khởi tạo: ${generatedPassword}`);
        console.log("==========================================");

        // 3. Tạo User mới trong DB
        let newUser = new userModel({
            username: username,
            email: email,
            password: generatedPassword, // Mongoose Pre-save hook sẽ tự động băm password này
            fullName: fullName,
            role: role,
            status: true // Import xong cho phép xài luôn
        });
        await newUser.save();

        // 4. Gửi email cho người dùng
        let mailSubject = "Thông tin tài khoản hệ thống Sport Shop";
        let mailBody = `Chào ${fullName},\n\nTài khoản của bạn đã được tạo thành công.\nUsername: ${username}\nMật khẩu đăng nhập: ${generatedPassword}\n\nVui lòng đổi mật khẩu sau khi đăng nhập.`;
        
        // Gọi hàm sendMail từ utils/mailHandler.js
        let isMailSent = await mailHandler.sendMail(email, mailSubject, mailBody);

        res.send({
            message: "Import thành công",
            user: { username: newUser.username, email: newUser.email },
            emailSent: isMailSent
        });

    } catch (error) {
        res.status(400).send({ message: "Lỗi Import: " + error.message });
    }
});

// UPDATED: Added username search query
router.get("/", CheckLogin, CheckRole("ADMIN"), async function (req, res, next) {
    let query = { isDeleted: false };
    if (req.query.username) {
        query.username = { $regex: req.query.username, $options: 'i' }
    }
    let users = await userModel.find(query);
    res.send(users);
});

router.get("/:id", CheckLogin, CheckRole("ADMIN", "MODERATOR"), async function (req, res, next) {
    try {
        let result = await userModel
            .find({ _id: req.params.id, isDeleted: false })
        if (result.length > 0) {
            res.send(result);
        } else {
            res.status(404).send({ message: "id not found" });
        }
    } catch (error) {
        res.status(404).send({ message: "id not found" });
    }
});

router.post("/", CreateAnUserValidator, validatedResult, async function (req, res, next) {
    try {
        let newItem = await userController.CreateAnUser(
            req.body.username, req.body.password, req.body.email, req.body.role,
            req.body.fullName, req.body.avatarUrl, req.body.status, req.body.loginCount
        )
        let saved = await userModel.findById(newItem._id)
        res.send(saved);
    } catch (err) {
        res.status(400).send({ message: err.message });
    }
});

router.put("/:id", ModifyAnUser, validatedResult, async function (req, res, next) {
    try {
        let id = req.params.id;
        let updatedItem = await userModel.findByIdAndUpdate(id, req.body, { new: true });

        if (!updatedItem) return res.status(404).send({ message: "id not found" });

        let populated = await userModel.findById(updatedItem._id)
        res.send(populated);
    } catch (err) {
        res.status(400).send({ message: err.message });
    }
});

router.delete("/:id", async function (req, res, next) {
    try {
        let id = req.params.id;
        let updatedItem = await userModel.findByIdAndUpdate(
            id,
            { isDeleted: true },
            { new: true }
        );
        if (!updatedItem) {
            return res.status(404).send({ message: "id not found" });
        }
        res.send(updatedItem);
    } catch (err) {
        res.status(400).send({ message: err.message });
    }
});

// ADD  Enable User
router.post("/enable", async function (req, res, next) {
    let { email, username } = req.body;
    let user = await userModel.findOneAndUpdate(
        { email, username },
        { status: true },
        { new: true }
    );
    if (!user) return res.status(404).send({ message: "User not found" });
    res.send(user);
});

// ADD Disable User
router.post("/disable", async function (req, res, next) {
    let { email, username } = req.body;
    let user = await userModel.findOneAndUpdate(
        { email, username },
        { status: false },
        { new: true }
    );
    if (!user) return res.status(404).send({ message: "User not found" });
    res.send(user);
});

module.exports = router;