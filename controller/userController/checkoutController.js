const productSchema = require('../../model/product.model')
const cartSchema = require('../../model/cart.modal')
const userSchema = require('../../model/user.modal')
const orderSchema = require('../../model/order.modal')
const walletSchema = require('../../model/wallet.modal')
const couponSchema = require('../../model/coupon.modal')
const Razorpay = require('razorpay')
const { json } = require('express')


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
            req.flash('error','Product in the cart out of stock')
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

const checkoutProceed = async (req, res) => {
    try {
        const userId = req.session.user;
        let { name, email, phone, address, paymentMethod, razorpayOrderId, paymentId, couponCode } = req.body;

        const cart = await cartSchema.findOne({ userId }).populate('products.productId');

        if (!cart || cart.products.length === 0) {
            return res.status(404).send('Cart is empty or not found');
        }

        // Calculate total price and initialize order products
        let totalPrice = Math.round(cart.totalPrice  * 100) / 100;
        console.log(typeof totalPrice)
        let orderProducts = JSON.parse(JSON.stringify(cart.products));
        let couponDiscount = 0;

        // Convert the string address to an object
        address = eval('(' + address + ')');

        // Function to apply coupon if applicable
        const applyCoupon = async () => {
            if (couponCode) {
                const coupon = await couponSchema.findOne({ name: couponCode });
                const couponUsed = await orderSchema.findOne({ userId, couponCode });
                if (coupon && !couponUsed) {
                    const discount = coupon.discount / 100;
                    couponDiscount = totalPrice * discount;
                    totalPrice = (totalPrice * (1 - discount)).toFixed(2)
                } else {
                    couponDiscount = 0;
                }
            } else {
                couponCode = '';
            }
        };

        // Function to decrement product quantities
        const decrementProductQuantities = async () => {
            for (let product of orderProducts) {
                await productSchema.findByIdAndUpdate(product.productId, {
                    $inc: { productQuantity: -product.quantity }
                });
            }
        };

        // Function to create a new order
        const createOrder = async (paymentDetails = {}) => {
            const order = new orderSchema({
                userId,
                contactInfo: { name, email, phone },
                address,
                products: orderProducts,
                totalPrice,
                couponDiscount,
                couponCode,
                paymentMethod,
                ...paymentDetails,
                status: 'processing',
            });
            await order.save();
            return order;
        };

        // Apply coupon if applicable
        await applyCoupon();

        if (paymentMethod === 'wallet') {
            const order = await createOrder();
            const wallet = await walletSchema.findOne({ userId });

            if (wallet) {
                wallet.balance = Math.round((wallet.balance - totalPrice) * 100)/100 
                console.log(wallet.balance)
                console.log(totalPrice);
                wallet.transaction.push({
                    typeOfPayment: 'debit',
                    date: Date.now(),
                    amount: totalPrice,
                    orderId: order.id
                });
                await wallet.save();
            }

            await decrementProductQuantities();
            cart.products = [];
            await cart.save();

            return res.status(200).json(order);

        } else if (paymentMethod === 'cod') {
            const order = await createOrder();
            await decrementProductQuantities();
            cart.products = [];
            await cart.save();

            return res.status(200).json(order);

        } else if (paymentMethod === 'razor-pay' && razorpayOrderId) {
            const order = await createOrder({
                paymentDetail: {
                    razorpayOrderId,
                    paymentId,
                    paymentStatus: 'Success',
                }
            });

            await decrementProductQuantities();
            cart.products = [];
            await cart.save();

            return res.status(200).json(order);

        } else if (paymentMethod === 'razor-pay') {
            const razorpayOrder = await razorpay.orders.create({
                amount: Math.round(totalPrice * 100),
                currency: "INR",
                receipt: "receipt#1",
            });

            return res.status(200).json({ razorpayOrderId: razorpayOrder.id });
        }

    } catch (error) {
        console.log(`Error from checkoutProceed: ${JSON.stringify(error)}`);
        res.status(500).send('Cannot proceed with checkout');
    }
}


const paymentFailed = async (req,res)=>{

    try {

        const userId = req.session.user
    
    let{name,email,phone,address,paymentMethod,razorpayOrderId,couponCode} = req.body

    // console.log(couponCode)

    const cart = await cartSchema.findOne({userId}).populate('products.productId');

    if(!cart || cart.products.length === 0 ){
        return res.status(404).send('Cart is empty or not found ')
    }

    let totalPrice = cart.totalPrice;
    let couponDiscount = 0;
    const orderProducts =  JSON.parse(JSON.stringify(cart.products))

    // check if coupon code is applied
    if(couponCode){
        const coupon = await couponSchema.findOne({name:couponCode})
        // check if coupon already used
        const couponUsed = await orderSchema.findOne({userId,couponCode})
        if(couponUsed){
            couponDiscount =0 ;
        }else{
            //find discount amount
            const discount = (coupon.discount / 100)
            couponDiscount = totalPrice*discount;
            totalPrice = totalPrice * (1 - discount);
        }
    }else{
        couponCode = '';
    }


    address = eval('(' + address + ')')

    const order = new orderSchema({
        userId,
        contactInfo: {name, email, phone},
        address,
        products: orderProducts,
        totalPrice,
        couponDiscount,
        couponCode,
        paymentMethod : paymentMethod,
        paymentDetail : {
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

        // coupon name from fetch
        const name = req.body.couponCode
        const userId = req.session.user
        
        // find coupon using the name
        const coupon = await couponSchema.findOne({name})

        // if coupon not found , error sent back
        if(coupon === null){
            return res.status(404).send('Invaild Coupon code')
        }

        // find the car of user
        const cart = await cartSchema.findOne({userId})

        // total price from cart 
        let totalPrice = cart.totalPrice;

        // check if coupon already used
        const alreadyUsed  = await orderSchema.findOne({userId:userId,couponCode:name})
        // const alreadyUsed = coupon.appliedUser.includes(userId);

        // if already used return an error
        if(alreadyUsed){
            return res.status(404).send(`Coupon Already Used`)
        }

        // Apply the discount
        const discount = coupon.discount / 100;
        const discountAmount = totalPrice*discount
        totalPrice = totalPrice * (1 - discount);

        res.status(200).json({totalPrice,discountAmount,discount})

        

    } catch (error) {
        console.log(`error form apply coupon ${error}`)
    }

}





module.exports = {renderCheckout,addAddress,checkoutProceed,paymentFailed,applyCoupon}