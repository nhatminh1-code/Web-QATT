var express = require("express");
var router = express.Router();
let userController = require('../controllers/users')
let bcrypt = require('bcrypt')
let jwt = require('jsonwebtoken')
let crypto = require('crypto')
const { CheckLogin } = require("../utils/authHandler");
let mongoose = require('mongoose')
let cartModel = require('../schemas/carts')
const { ChangePasswordValidator, validatedResult } = require("../utils/validateHandler");
const fs = require('fs')
const path = require('path')
const privateKey = fs.readFileSync(
    path.join(__dirname, '../private.pem'), 'utf8'
)

router.post('/register', async function (req, res, next) {
    let session = await mongoose.startSession();
    session.startTransaction()
    try {
        let { username, password, email } = req.body;
        
        let roleModel = require('../schemas/roles');
        let userRole = await roleModel.findOne({ name: 'USER' });
        if (!userRole) throw new Error("Hệ thống chưa khởi tạo Role USER");

        let newUser = await userController.CreateAnUser(
            username, password, email, userRole._id, session
        );
        let newCart = new cartModel({
            user: newUser._id
        })
        await newCart.save({ session })
        await newCart.populate('user')
        await session.commitTransaction()
        await session.endSession()
        res.send(newCart)

    } catch (error) {
        await session.abortTransaction()
        await session.endSession()
        res.status(404).send(error.message)
    }
})

router.post('/login', async function (req, res, next) {
    try {
        let { username, password } = req.body;
        let user = await userController.GetAnUserByUsername(username);
        if (!user) {
            return res.status(404).send({
                message: "thong tin dang nhap sai"
            })
        }
        if (user.lockTime > Date.now()) {
            return res.status(404).send({
                message: "ban dang bi ban"
            })
        }
        if (bcrypt.compareSync(password, user.password)) {
            user.loginCount = 0;                           // FIXED: was loginCount = 0 (global var bug)
            await user.save()

            let token = jwt.sign(
                { id: user._id, role: user.role },         // UPDATED: added role to payload
                privateKey,
                { algorithm: 'RS256', expiresIn: '1h' }
            )

            res.cookie('NNPTUD_S4', token, {
                maxAge: 30 * 24 * 3600 * 1000,
                httpOnly: true,
                secure: false
            })
            res.send({ token })                            // UPDATED: send as object { token }
        } else {
            user.loginCount++;
            if (user.loginCount == 3) {
                user.loginCount = 0;
                user.lockTime = Date.now() + 3600 * 1000
            }
            await user.save()
            return res.status(404).send({
                message: "thong tin dang nhap sai"
            })
        }
    } catch (error) {
        res.status(404).send({
            message: error.message
        })
    }
})

router.get('/me', CheckLogin, function (req, res, next) {
    res.send(req.user)
})

router.post('/logout', CheckLogin, function (req, res, next) {
    res.cookie('NNPTUD_S4', "", {
        maxAge: 0,
        httpOnly: true,
        secure: false
    })
    res.send({
        message: "logout"
    })
})

router.post('/changepassword', CheckLogin, ChangePasswordValidator, validatedResult, async function (req, res, next) {
    let { oldpassword, newpassword } = req.body;
    let user = req.user;
    if (bcrypt.compareSync(oldpassword, user.password)) {
        user.password = newpassword;
        await user.save();
        res.send({ message: "da cap nhat" });
    } else {
        res.send({ message: "old password k dung" })
    }
})

router.post('/forgotpassword', async function (req, res, next) {
    let email = req.body.email;
    let user = await userController.GetAnUserByEmail(email);
    if (user) {
        user.forgotPasswordToken = crypto.randomBytes(32).toString('hex');
        user.forgotPasswordTokenExp = Date.now() + 10 * 60000;
        let url = "http://localhost:3000/api/v1/auth/resetpassword/" + user.forgotPasswordToken
        await user.save();
        console.log(url);
    }
    res.send({
        message: "check mail"
    })
})

router.post('/resetpassword/:token', async function (req, res, next) {
    let token = req.params.token;
    let password = req.body.password
    let user = await userController.GetAnUserByToken(token);
    if (user) {
        user.password = password;
        user.forgotPasswordToken = null;
        user.forgotPasswordTokenExp = null;
        await user.save();
        res.send({
            message: "update thanh cong"
        })
    }
})

module.exports = router;