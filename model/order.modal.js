const mongoose = require('mongoose')

const orderSchema = mongoose.Schema({

    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'user',
        required: true
    },

    contactInfo : {
        name:String,
        email:String,
        phone:Number
    },

    address : {
        type: Object,
        required: true
    },

    products : [{
        productId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'product',
            required: true
        },
        quantity: {
            type: Number,
            default: 1,
        },
        price:{
            type: Number ,
            required: true
        }
    }],
    totalPrice: {
        type: Number,
        required: true
    },

    status : {
        type: String,
        enum: ['processing','cancelled','shipped','delivered','returned'],
        default : 'processing'
    },

    paymentMethod : {
        type: String,
        required: true
    }

},{timestamps: true})

module.exports = mongoose.model('order',orderSchema)