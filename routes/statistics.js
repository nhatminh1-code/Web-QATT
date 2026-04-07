var express = require("express");
var router = express.Router();
const { CheckLogin, CheckRole } = require("../utils/authHandler");
let userModel = require('../schemas/users');
let reservationModel = require('../schemas/reservation');
let productModel = require('../schemas/products');

router.get('/', CheckLogin, CheckRole("ADMIN"), async function (req, res, next) {
    try {
        let totalUsers = await userModel.countDocuments({ isDeleted: false });
        let totalProducts = await productModel.countDocuments({ isDeleted: false });
        
        // Tính tổng doanh thu từ các đơn hàng đã completed
        let revenueData = await reservationModel.aggregate([
            { $match: { status: "completed" } },
            { $group: { _id: null, totalRevenue: { $sum: "$totalAmount" }, orderCount: { $sum: 1 } } }
        ]);

        let stats = {
            totalUsers,
            totalProducts,
            totalRevenue: revenueData.length > 0 ? revenueData[0].totalRevenue : 0,
            completedOrders: revenueData.length > 0 ? revenueData[0].orderCount : 0
        };

        res.send(stats);
    } catch (error) {
        res.status(500).send({ message: error.message });
    }
});

module.exports = router;