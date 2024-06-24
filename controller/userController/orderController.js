const orderSchema = require('../../model/order.modal')
const walletSchema = require('../../model/wallet.modal')
const productSchema = require('../../model/product.model')


const order = async (req,res)=>{

    const userId = req.session.user

    const order = await orderSchema.find({userId}).populate('products.productId')


    res.render('user/order',{title:'Orders',user:userId,order})
}


const cancelOrder = async (req,res)=>{
    
    try {

        const orderId = req.params.id
        const userId = req.session.user

        const order = await orderSchema.findByIdAndUpdate(orderId, { status: 'cancelled'})
        let balance = (order.totalPrice - (order.couponAmount || 0))

        
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

        const order = await orderSchema.findByIdAndUpdate(orderId,{status: 'returned'})

        const wallet = await walletSchema.findOne({userId})

        let balance = order.totalPrice - (order.couponAmount || 0)

        if(wallet){
            wallet.balance += balance;
            wallet.transaction.push({
                typeOfPayment: 'credit',
                amount: balance,
                date: Date.now(),
                orderId: order._id,
            });

            await wallet.save();

        }else{

            const walletNew = new walletSchema({
                userId,
                balance,
                transaction: [{
                    typeOfPayment: 'credit',
                    amount: balance,
                    date:Date.now(),
                    orderId: order._id,
                }],
            });

            await walletNew.save();

        }

        for(product of order.products) {
            
            await productSchema.findByIdAndUpdate(product.productId,{$inc :{productQuantity : product.quantity}})

        }


        if(order){
            req.flash('success','order returned successfully')
            res.redirect('/user/orders')
        }else{
            req.flash('error','order unable to return ')
            res.redirect('/user/orders')
        }

    } catch (error) {
        console.log(`error from return order${error}`)
    }
}

const orderSucces = (req,res)=>{
    res.render('user/orderSuccess',{title:'Order Success'})
}

const orderFailure = (req,res)=>{
    res.render('user/orderFailure',{title: 'Payment Failed'})
}




module.exports = {order,cancelOrder,returnOrder,orderSucces,orderFailure}