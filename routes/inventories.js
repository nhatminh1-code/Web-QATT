var express = require("express");
var router = express.Router();
let inventoryModel = require('../schemas/inventories');

router.get('/', async (req, res) => {
    let invs = await inventoryModel.find().populate('product');
    res.send(invs);
});

router.post('/add_stock', async (req, res) => {
    let { product, quantity } = req.body;
    let inv = await inventoryModel.findOneAndUpdate(
        { product: product }, { $inc: { stock: quantity } }, { new: true }
    );
    res.send(inv);
});

router.post('/remove_stock', async (req, res) => {
    let { product, quantity } = req.body;
    let inv = await inventoryModel.findOneAndUpdate(
        { product: product }, { $inc: { stock: -quantity } }, { new: true }
    );
    res.send(inv);
});

// ĐÃ CẬP NHẬT: Nghiệp vụ Giữ hàng (Reservation)
router.post('/reservation', async (req, res) => {
    let { product, quantity } = req.body;
    
    // Dùng $inc để cộng/trừ số lượng nguyên tử (Atomic update)
    // stock: { $gte: quantity } -> Chỉ thực hiện trừ kho nếu số lượng trong kho >= số lượng muốn giữ
    let updateInv = await inventoryModel.findOneAndUpdate(
        { product: product, stock: { $gte: quantity } }, 
        { 
            $inc: { stock: -quantity, reserved: quantity } 
        },
        { new: true }
    );
    
    // Nếu updateInv là null => Không tìm thấy sản phẩm hoặc kho không đủ hàng
    if (!updateInv) {
        return res.status(400).send({ message: "Không đủ hàng trong kho hoặc sản phẩm không tồn tại" });
    }
    
    res.send(updateInv);
});

// ĐÃ CẬP NHẬT: Nghiệp vụ Xác nhận đã bán (Sold)
router.post('/sold', async (req, res) => {
    let { product, quantity } = req.body;
    
    // reserved: { $gte: quantity } -> Chỉ thực hiện bán nếu số lượng giữ (reserved) >= số lượng bán
    let updateInv = await inventoryModel.findOneAndUpdate(
        { product: product, reserved: { $gte: quantity } },
        { 
            $inc: { reserved: -quantity, soldCount: quantity } 
        },
        { new: true }
    );

    if (!updateInv) {
        return res.status(400).send({ message: "Số lượng hàng đang giữ (reserved) không đủ để bán" });
    }

    res.send(updateInv);
});

module.exports = router;