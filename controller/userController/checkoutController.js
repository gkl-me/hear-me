const productSchema = require('../../model/product.model')
const cartSchema = require('../../model/cart.modal')
const userSchema = require('../../model/user.modal')
const orderSchema = require('../../model/order.modal')
const walletSchema = require('../../model/wallet.modal')
const couponSchema = require('../../model/coupon.modal')
const Razorpay = require('razorpay')
const { disconnect } = require('mongoose')


const razorpay = new Razorpay({
    key_id: 'rzp_test_AIcpmo1LwYwWKt',
    key_secret: 'QPT0Jsbp3AsXrdVMy9tPG591'
})



const renderCheckout = async (req,res)=>{

    const userId = req.session.user

    const user = await userSchema.findById(userId)

    const cart = await cartSchema.findOne({userId}).populate('products.productId')

    const wallet = await walletSchema.findOne({userId})

    let balance = 0;

    if(wallet){
        balance = wallet.balance;
    }

    let total = 0;

    for(product of cart.products){

        let currentProduct = await productSchema.findById(product.productId)

        total += product.price * product.quantity

        if(currentProduct.productQuantity <= 0){
            return res.redirect('/user/cart')

        }
    }


    if(cart.products.length === 0){
        res.redirect('/user/cart')
    }else{
        res.render('user/checkOut',{title: 'Checkout',user,cart,balance,total})
    }


    


}


const addAddress = async (req,res)=>{

    try {
        
        const userId = req.session.user

        const { addressType,addressLine,city,state,pincode } = req.body
    
        const user = await userSchema.findById(req.session.user)
    
        user.address.push({
            addressType,
            addressLine,
            city,
            state,
            pincode
        })
        await user.save();

        res.redirect('/user/checkout')


    } catch (error) {
        console.log(`error from checkout address ${error}`)
        
    }

   
}

const checkoutProceed = async (req,res)=>{

    try {
        
        
    const userId = req.session.user
    
    let{name,email,phone,address,paymentMethod,razorpayOrderId,paymentId,couponCode} = req.body

    const cart = await cartSchema.findOne({userId}).populate('products.productId');

    if(!cart || cart.products.length === 0 ){
        return res.status(404).send('Cart is empty or not found ')
    }

    let totalPrice = 0;
    let discountAmount = 0;
    const orderProducts =  cart.products.map(product => {
        const price = product.price;
        totalPrice += price * product.quantity
        return {
            productId : product.productId._id,
            quantity: product.quantity,
            price: price
        }
    })

        console.log(couponCode);

        if(couponCode){
            const coupon = await couponSchema.findOne({name:couponCode})
            const discount = (coupon.discount / 100)
            discountAmount = totalPrice*discount;
            totalPrice = totalPrice * (1 - discount);
        }

        



    address = eval('(' + address + ')')

    if(paymentMethod === 'wallet'){


            const order = new orderSchema({
                userId,
                contactInfo: {name, email, phone},
                address,
                products: orderProducts,
                totalPrice,
                discountAmount,
                paymentMethod : paymentMethod,
                status: 'processing',
            })
        
        
            await order.save();

            const wallet = await walletSchema.findOne({userId})
        if (wallet) {
            wallet.balance -= totalPrice.toFixed(2);
            wallet.transaction.push({
                typeOfPayment: 'debit',
                date:Date.now(),
                amount: totalPrice.toFixed(2),
                orderId: order.id
            });

            await wallet.save(); }
        
            for(let product of orderProducts){
                await productSchema.findByIdAndUpdate(product.productId,{
                    $inc : { productQuantity: -product.quantity }
                })
            }
        
            cart.products = [];
            await cart.save();
        
            res.status(200).json(order);

        

    }else if(paymentMethod === 'cod'){
        const order = new orderSchema({
            userId,
            contactInfo: {name, email, phone},
            address,
            products: orderProducts,
            totalPrice,
            discountAmount,
            paymentMethod : paymentMethod,
            status: 'processing',
        })
    
    
        await order.save();
    
        for(let product of orderProducts){
            await productSchema.findByIdAndUpdate(product.productId,{
                $inc : { productQuantity: -product.quantity }
            })
        }
    
        cart.products = [];
        await cart.save();
    
        res.status(200).json(order);

        

    }else if (paymentMethod === 'razor-pay' && razorpayOrderId ){

        const order = new orderSchema({
            userId,
            contactInfo: {name, email, phone},
            address,
            products: orderProducts,
            totalPrice,
            discountAmount,
            paymentMethod : paymentMethod,
            paymentDetail : {
                razorpayOrderId: razorpayOrderId,
                paymentId: paymentId,
                paymentStatus: 'Success',
            },
            status: 'processing',
        })
    
    
        await order.save();

        for(let product of orderProducts){
            await productSchema.findByIdAndUpdate(product.productId,{
                $inc : { productQuantity: -product.quantity }
            })
        }
    
        cart.products = [];
        await cart.save();

        res.status(200).json(order);


        // if the payment method is razorpay then razorpay order is created and order id is sent back 

    }else if (paymentMethod === 'razor-pay'){

        const razorpayOrder = await razorpay.orders.create({
            amount: totalPrice * 100,
            currency: "INR",
            receipt: "receipt#1",
        })

        

        return res.status(200).json({razorpayOrderId : razorpayOrder.id})

    }

    

    } catch (error) {
        console.log(`error from checkoutproceed ${error}`)
        res.status(404).send('cannot procceed checkout')
    }

}

const payment = async (req,res)=>{

    try {

        const userId = req.session.user
    
    let{name,email,phone,address,paymentMethod,razorpayOrderId,couponCode} = req.body

    const cart = await cartSchema.findOne({userId}).populate('products.productId');

    if(!cart || cart.products.length === 0 ){
        return res.status(404).send('Cart is empty or not found ')
    }

    let totalPrice = 0;
    let discountAmount = 0;
    const orderProducts =  cart.products.map(product => {
        const price = product.price;
        totalPrice += price * product.quantity
        return {
            productId : product.productId._id,
            quantity: product.quantity,
            price: price
        }
    })

    if(couponCode){
        const coupon = await couponSchema.findOne({name:couponCode})
        const discount = coupon.discount / 100;
        discountAmount = totalPrice*discount
        totalPrice = totalPrice * (1 - discount);
    }


    address = eval('(' + address + ')')

    const order = new orderSchema({
        userId,
        contactInfo: {name, email, phone},
        address,
        products: orderProducts,
        totalPrice,
        discountAmount,
        paymentMethod : paymentMethod,
        paymentDetail : {
            razorpayOrderId: razorpayOrderId,
            paymentStatus: 'Pending',
        },
        status: 'pending',
    })


    await order.save();

    cart.products = [];
    await cart.save();

    res.status(200).json(order)

        
    } catch (error) {
        console.log(`error from payment route ${error}`)
    }

}


const applyCoupon = async (req,res)=>{

    try {

        const name = req.body.couponCode
        const userId = req.session.user
        
        const coupon = await couponSchema.findOne({name})

        const cart = await cartSchema.findOne({userId})

        let totalPrice = 0;
        cart.products.forEach(product => {
            totalPrice += product.price * product.quantity;
        });

        // Apply the discount
        const discount = coupon.discount / 100;
        const discountAmount = totalPrice*discount
        totalPrice = totalPrice * (1 - discount);

        res.status(200).json({totalPrice,discountAmount})

        

    } catch (error) {
        console.log(`error form apply coupon ${error}`)
    }

}





module.exports = {renderCheckout,addAddress,checkoutProceed,payment,applyCoupon}