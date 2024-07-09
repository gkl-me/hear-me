const mongoose = require('mongoose')

const schema = new mongoose.Schema({
    productId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'product',
        required: true
    },
    userId:{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'user',
        required: true
    },
    rating:{
        type: Number,
        min: 1,
        max:5,
        required: true
    },
    comment:{
        type: String,
        required: true
    }
},{timestamps: true})

module.exports = mongoose.model('review',schema)