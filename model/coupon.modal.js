const mongoose = require('mongoose')

const schema = mongoose.Schema({

    name:{
        type: String,
        required: true
    },

    code:{
        type: String,
        required: true,
        unique: true
    },
    discount:{
        type: Number,
        required: true
    },
    appliedUser: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'user',
    }],
    status: {
        type: Boolean,
        required: true,
        default: true
    },
    expiryDate:{
        type: Date, 
    }


},{timestamps: true})

module.exports = mongoose.model('coupon',schema)