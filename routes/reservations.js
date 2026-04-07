// Đặt hàng từ Giỏ hàng)
var express = require("express");
var router = express.Router();
let mongoose = require('mongoose');
const { CheckLogin, CheckRole } = require("../utils/authHandler");
let cartModel = require('../schemas/carts');
let inventoryModel = require('../schemas/inventories');
let reservationModel = require('../schemas/reservation');
let productModel = require('../schemas/products');

// Tạo đơn hàng từ giỏ hàng hiện tại (Checkout)
router.post('/checkout', CheckLogin, async function (req, res, next) {
    let session = await mongoose.startSession();
    session.startTransaction();
    try {
        let user = req.user;
        let { shippingAddress, paymentMethod } = req.body;

        let cart = await cartModel.findOne({ user: user.id });
        if (!cart || cart.products.length === 0) {
            throw new Error("Giỏ hàng trống");
        }

        let orderProducts = [];
        let totalAmount = 0;

        // Kiểm tra tồn kho và tính tiền
        for (let item of cart.products) {
            let inventory = await inventoryModel.findOne({ product: item.product }).session(session);
            let product = await productModel.findById(item.product).session(session);

            if (inventory.stock < item.quantity) {
                throw new Error(`Sản phẩm ${product.title} không đủ tồn kho`);
            }

            // Trừ stock, cộng vào reserved
            inventory.stock -= item.quantity;
            inventory.reserved += item.quantity;
            await inventory.save({ session });

            orderProducts.push({
                product: product._id,
                title: product.title,
                quantity: item.quantity,
                price: product.price
            });
            totalAmount += (product.price * item.quantity);
        }

        // Tạo đơn hàng
        let newReservation = new reservationModel({
            user: user.id,
            products: orderProducts,
            totalAmount: totalAmount,
            shippingAddress: shippingAddress,
            paymentMethod: paymentMethod || "COD"
        });
        await newReservation.save({ session });

        // Xóa giỏ hàng sau khi đặt thành công
        cart.products = [];
        await cart.save({ session });

        await session.commitTransaction();
        session.endSession();
        res.send(newReservation);
    } catch (error) {
        await session.abortTransaction();
        session.endSession();
        res.status(400).send({ message: error.message });
    }
});

// Lấy danh sách đơn hàng của User
router.get('/my-orders', CheckLogin, async function (req, res, next) {
    let orders = await reservationModel.find({ user: req.user.id }).sort({ createdAt: -1 });
    res.send(orders);
});

// Admin duyệt/hoàn thành đơn hàng
router.put('/:id/complete', CheckLogin, CheckRole("ADMIN", "MODERATOR"), async function (req, res, next) {
    let session = await mongoose.startSession();
    session.startTransaction();
    try {
        let order = await reservationModel.findById(req.params.id).session(session);
        if (order.status !== "pending") throw new Error("Chỉ xử lý đơn pending");

        order.status = "completed";
        await order.save({ session });

        // Chuyển reserved thành soldCount
        for (let item of order.products) {
            let inventory = await inventoryModel.findOne({ product: item.product }).session(session);
            inventory.reserved -= item.quantity;
            inventory.soldCount += item.quantity;
            await inventory.save({ session });
        }

        await session.commitTransaction();
        session.endSession();
        res.send(order);
    } catch (error) {
        await session.abortTransaction();
        session.endSession();
        res.status(400).send({ message: error.message });
    }
});

module.exports = router;