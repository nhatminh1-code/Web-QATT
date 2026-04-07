//Đánh giá
var express = require("express");
var router = express.Router();
const { CheckLogin } = require("../utils/authHandler");
let reviewModel = require('../schemas/reviews');
let productModel = require('../schemas/products');

// Đăng review
router.post('/', CheckLogin, async function (req, res, next) {
    try {
        let { product, rating, comment } = req.body;
        let checkProduct = await productModel.findById(product);
        if(!checkProduct) return res.status(404).send({message: "Sản phẩm không tồn tại"});

        let newReview = new reviewModel({
            user: req.user.id,
            product: product,
            rating: rating,
            comment: comment
        });
        await newReview.save();
        await newReview.populate('user', 'username fullName avatarUrl');
        res.send(newReview);
    } catch (error) {
        res.status(400).send({ message: error.message });
    }
});

// Xem review của 1 sản phẩm
router.get('/product/:productId', async function (req, res, next) {
    let reviews = await reviewModel.find({ product: req.params.productId })
        .populate('user', 'username fullName avatarUrl')
        .sort({ createdAt: -1 });
    res.send(reviews);
});

module.exports = router;