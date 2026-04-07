var express = require("express");
var router = express.Router();
let voucherModel = require('../schemas/vouchers');
const { CheckLogin, CheckRole } = require('../utils/authHandler');

// Tạo voucher
router.post('/', CheckLogin, CheckRole("ADMIN"), async (req, res) => {
    try {
        let { code, discountValue, minOrderValue, expirationDate } = req.body;
        let newVoucher = new voucherModel({
            code: code.toUpperCase(),
            discountValue,
            minOrderValue: minOrderValue || 0,
            expirationDate
        });
        await newVoucher.save();
        res.status(201).send(newVoucher);
    } catch (error) {
        res.status(400).send({ message: error.message });
    }
});

// Lấy tất cả voucher
router.get('/', CheckLogin, CheckRole("ADMIN"), async (req, res) => {
    let vouchers = await voucherModel.find({ isDeleted: false });
    res.send(vouchers);
});

// Áp dụng voucher (validate)
router.post('/apply', CheckLogin, async (req, res) => {
    try {
        let { code, orderTotal } = req.body;
        let voucher = await voucherModel.findOne({
            code: code.toUpperCase(),
            isActive: true,
            isDeleted: false,
            expirationDate: { $gte: new Date() }
        });
        if (!voucher) return res.status(404).send({ message: "Voucher không hợp lệ hoặc đã hết hạn" });
        if (orderTotal < voucher.minOrderValue) {
            return res.status(400).send({ 
                message: `Đơn hàng tối thiểu ${voucher.minOrderValue.toLocaleString()}đ` 
            });
        }
        res.send({
            voucher,
            originalTotal: orderTotal,
            discount: voucher.discountValue,
            finalTotal: orderTotal - voucher.discountValue
        });
    } catch (error) {
        res.status(400).send({ message: error.message });
    }
});

router.delete('/:id', CheckLogin, CheckRole("ADMIN"), async (req, res) => {
    let voucher = await voucherModel.findByIdAndUpdate(
        req.params.id, { isDeleted: true }, { new: true }
    );
    res.send(voucher);
});

module.exports = router;