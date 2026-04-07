let mongoose = require('mongoose')

let orderItemSchema = mongoose.Schema({
    product: { type: mongoose.Types.ObjectId, ref: 'product', required: true },
    quantity: { type: Number, required: true, min: 1 },
    price: { type: Number, required: true },
    title: { type: String }
}, { _id: false })

let reservationSchema = mongoose.Schema({
    user: { type: mongoose.Types.ObjectId, ref: 'user', required: true },
    products: [orderItemSchema],
    status: {
        type: String,
        enum: ["pending", "actived", "cancelled", "completed"],
        default: "pending"
    },
    totalAmount: { type: Number, required: true, default: 0 },
    shippingAddress: { type: String, required: true },
    paymentMethod: { type: String, enum: ["COD", "ZALO_PAY", "ATM"], default: "COD" }
}, { timestamps: true })

module.exports = new mongoose.model('reservation', reservationSchema)