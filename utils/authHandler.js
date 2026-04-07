let userController = require('../controllers/users')
let jwt = require('jsonwebtoken')
const fs = require('fs')
const path = require('path')

// Đọc khóa công khai (Public Key)
const publicKey = fs.readFileSync(
    path.join(__dirname, '../public.pem'), 'utf8'
)

module.exports = {
    CheckLogin: async function (req, res, next) {
        try {
            let token;
            if (!req.headers.authorization || !req.headers.authorization.startsWith("Bearer")) {
                if (req.cookies.NNPTUD_S4) {
                    token = req.cookies.NNPTUD_S4;
                } else {
                    res.status(401).send({
                        message: "ban chua dang nhap"
                    })
                    return;
                }
            } else {
                token = req.headers.authorization.split(" ")[1];
            }

            // QUAN TRỌNG: Phải dùng publicKey và chỉ định thuật toán RS256
            let result = jwt.verify(token, publicKey, { algorithms: ['RS256'] })

            if (result.exp * 1000 < Date.now()) {
                res.status(401).send({
                    message: "token da het han"
                })
                return;
            }
            
            let user = await userController.GetAnUserById(result.id);
            if (!user) {
                res.status(401).send({
                    message: "nguoi dung khong ton tai"
                })
                return;
            }
            
            req.user = user;
            next()
        } catch (error) {
            // Đã hợp nhất: Báo lỗi chính xác từ JWT (rất hữu ích để fix lỗi RS256)
            res.status(401).send({
                message: "Invalid Token: " + error.message
            })
        }
    },
    CheckRole: function (...requiredRole) {
        return async function (req, res, next) {
            let user = req.user;
            let currentRole = user.role.name;
            if (requiredRole.includes(currentRole)) {
                next()
            } else {
                res.status(403).send({ message: "ban khong co quyen" });
            }
        }
    }
}