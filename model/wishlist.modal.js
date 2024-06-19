const mongoose = require('mongoose')

const schema = mongoose.Schema({

    userId: {
        type:mongoose.Schema.Types.ObjectId,
        ref: 'user',
        required:true
    },
    products: [{

        productId:{
            type:mongoose.Schema.Types.ObjectId,
            ref: 'product',
            required: true
        }

    }]

},{timestamps: true})

module.exports = mongoose.model('wishlist',schema)