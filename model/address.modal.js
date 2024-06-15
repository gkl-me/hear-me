const mongoose = require('mongoose')

const addressSchema = mongoose.Schema({

    addressType:{

        type: String
    },
    
    addressLine : {
        type : String,
    },

    city : {
        type : String
    },
    
    state : {
        type : String 
    },

    pincode: {
        type: Number
    }

},{_id:false})

module.exports = addressSchema