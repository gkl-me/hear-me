const orderSchema = require('../../model/order.modal')
const walletSchema = require('../../model/wallet.modal')
const productSchema = require('../../model/product.model')
const Razorpay = require('razorpay')

const razorpay = new Razorpay({
    key_id: 'rzp_test_AIcpmo1LwYwWKt',
    key_secret: 'QPT0Jsbp3AsXrdVMy9tPG591'
})



const order = async (req,res)=>{

    const userId = req.session.user

    const order = await orderSchema.find({userId}).populate('products.productId')


    res.render('user/order',{title:'Orders',user:userId,order})
}

// cancel order controller
const cancelOrder = async (req,res)=>{
    
    try {

        const orderId = req.params.id
        const userId = req.session.user

        const order = await orderSchema.findByIdAndUpdate(orderId, { status: 'cancelled'})
        let balance = (order.totalPrice - (order.couponAmount || 0))

        // if the paymenthod nnot cod the amount added to wallet
        if(order.paymentMethod !=='cod'){
            
            const wallet = await walletSchema.findOne({userId})
            
        
            if (wallet) {
                wallet.balance += balance;
                wallet.transaction.push({
                    typeOfPayment: 'credit',
                    amount: balance,
                    date: Date.now(),
                    orderId: order._id,
                });

                await wallet.save();
    
            } else {
                // if wallet not found creates a new wallet
    
                const walletNew = new walletSchema({
                    userId,
                    balance,
                    transaction: [{
                        typeOfPayment: 'credit',
                        amount: balance,
                        date: Date.now(),
                        orderId: order._id,
                    }],
                });

                await walletNew.save();
    
            }
        }

        // products increment the quantity after cancelltion
        for(product of order.products) {
            
            await productSchema.findByIdAndUpdate(product.productId,{$inc :{productQuantity : product.quantity}})

        }

        if(order){
            req.flash('success','Order cancel success')
            res.redirect('/user/orders')
        }else{
            req.flash('error','order unable to cancel')
            res.redirect('/user/orders')
        }
        
    } catch (error) {
        console.log(`error from cancelOrder ${error}`)
    }

}


const returnOrder = async (req,res)=>{

    try {
        
        const userId = req.session.user

        const orderId = req.params.id

        const order = await orderSchema.findByIdAndUpdate(orderId,{status: 'returning'})

        if(order){
            req.flash('success','Order return order placed successfully')
            res.redirect('/user/orders')
        }else{
            req.flash('error','order unable to return ')
            res.redirect('/user/orders')
        }

    } catch (error) {
        console.log(`error from return order${error}`)
    }
}

// order success page
const orderSucces = (req,res)=>{
    res.render('user/orderSuccess',{title:'Order Success'})
}

// order payment failure page
const orderFailure = (req,res)=>{
    res.render('user/orderFailure',{title: 'Payment Failed'})
}


// payment retry with razorpay , 
const retryRazorPay = async (req,res)=>{
    try {

        let {orderId} = req.body
        // console.log(typeof order)

        const order = await orderSchema.findById(orderId)

        // console.log(order)

        // razorpay order created

        const razorpayOrder = await razorpay.orders.create({
            amount: order.totalPrice * 100,
            currency: "INR",
            receipt: "receipt#1",
        } )

    
        if(razorpayOrder){
            // console.log(razorpayOrder)
                return res.status(200).json({...order.toObject(),razorpayOrderId : razorpayOrder})
        }else{
            return res.status(404).send('Retry Payment Failed')
        }

        

    } catch (error) {
        console.log(`Error from Razorpay retry: ${error}`);
        // console.log(`Error from Razorpay retry: ${JSON.stringify(error)}`);

    }
}

// retry payment from order page

const retryPayment = async (req,res)=>{

    try {
        
        const {orderId,paymentId,razorpayOrderId}= req.body

        // update the status of the order

        const update = {
            'orderDetail.paymentId': paymentId,
            'orderDetail.razorpayOrderId': razorpayOrderId,
            'orderDetail.paymentStatus': 'Success',
            status: 'processing'
          };

        const order = await orderSchema.findByIdAndUpdate(orderId,update);

        for (let product of order.products) {
            await productSchema.findByIdAndUpdate(product.productId, {
                $inc: { productQuantity: -product.quantity }
            });
        }

        res.status(200).json(order)

    } catch (error) {
        console.log(`error from retry payment ${error}`)
    }

}

// remove the product after order payment failure

const removeOrder = async (req,res)=>{
    try {
        
        const orderId = req.params.id

        const order = await orderSchema.findByIdAndDelete(orderId)

        if(order){
            req.flash('success','Order Successfully removed')
            res.redirect('/user/orders')
        }

    } catch (error) {
        console.log(`error from remove order ${error}`)
    }
}


const orderDetails = async (req,res)=>{

    try {
        
        const orderId = req.params.id
        const order = await orderSchema.findById(orderId).populate('products.productId')

        res.render('user/orderDetails',{title:'Order Details',user:req.session.user,order})

    } catch (error) {
        console.log(`error from order details page ${error}`)
    }

}


module.exports = {order,cancelOrder,returnOrder,orderSucces,orderFailure,retryPayment,removeOrder,retryRazorPay,orderDetails}