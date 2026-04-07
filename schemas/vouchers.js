let mongoose = require('mongoose')

let voucherSchema = mongoose.Schema({
    code: { type: String, required: true, unique: true },
    discountValue: { type: Number, required: true }, // Số tiền giảm
    minOrderValue: { type: Number, default: 0 },
    expirationDate: { type: Date, required: true },
    isActive: { type: Boolean, default: true },
    isDeleted: { type: Boolean, default: false }
}, { timestamps: true })

module.exports = new mongoose.model('voucher', voucherSchema)