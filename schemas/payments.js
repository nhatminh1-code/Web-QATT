let mongoose = require('mongoose')

let paymentSchema = mongoose.Schema({
    reservation: { type: mongoose.Types.ObjectId, ref: 'reservation', required: true },
    user: { type: mongoose.Types.ObjectId, ref: 'user', required: true },
    method: { type: String, enum: ["COD", "ZALO_PAY", "ATM"], default: "COD" },
    transactionID: { type: String },
    amount: { type: Number, required: true },
    status: { type: String, enum: ["pending", "paid", "failed", "refunded"], default: "pending" },
    providerResponse: { type: String },
    paidAt: { type: Date },
    failedAt: { type: Date }
}, { timestamps: true })

module.exports = new mongoose.model('payment', paymentSchema)