const orderSchema = require('../../model/order.modal')
const walletSchema = require('../../model/wallet.modal')
const productSchema = require('../../model/product.model')
const Razorpay = require('razorpay')
const PDFDocument = require('pdfkit')
const fs  = require('fs')

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

        console.log(order.totalPrice)
        console.log(typeof order.totalPrice)

        // razorpay order created

        const razorpayOrder = await razorpay.orders.create({
            amount: Math.round(order.totalPrice * 100),
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
        // console.log(`Error from Razorpay retry: ${error}`);
        console.log(`Error from Razorpay retry: ${JSON.stringify(error)}`);

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

const downloadInvoice = async (req, res) => {
    try {
        const order = await orderSchema.findById(req.params.id).populate('products.productId');

        const doc = new PDFDocument();
        
        res.setHeader('Content-Disposition', `attachment; filename=invoice_${order._id}.pdf`);
        res.setHeader('Content-Type', 'application/pdf');

        doc.pipe(res);

        // Header
        doc.fontSize(16)
           .text('HEAR ME', 50, 50)
           .fontSize(10)
           .text('Your Company Address', 50, 70)
           .text('City, State ZIP', 50, 85)
           .fontSize(20)
           .fontSize(10)
        
        doc.fontSize(16)
            .text('Invoice', 250, 50, { align: 'center' })

        // Invoice details
        doc.fontSize(10)
           .text(`INVOICE NO #: ${order._id}`, 50, 120)

        // Billing Info
        doc.text('BILL TO:', 50, 180)
           .text(order.contactInfo.name, 50, 195)
           .text(order.contactInfo.email, 50, 210)
           .text(order.contactInfo.phone, 50, 225)
           .text('SHIP TO:', 300, 180)
           .text(order.address.addressLine, 300, 195) // Adjust based on your address structure
           .text(order.address.city, 300, 210) // Adjust based on your address structure
           .text(order.address.state, 300, 225); // Adjust based on your address structure

        // Table header
        doc.moveTo(50, 260).lineTo(550, 260).stroke();
        doc.text('Product', 50, 270)
           .text('Qty', 300, 270)
           .text('Unit Price', 370, 270)
           .text('Amount', 470, 270);
        doc.moveTo(50, 285).lineTo(550, 285).stroke();

        // Table content
        let y = 300;
        order.products.forEach((item) => {
            doc.text(item.productId.productName, 50, y)
               .text(item.quantity.toString(), 300, y)
               .text(`${item.price.toFixed(2)}`, 370, y)
               .text(`${(item.quantity * item.price).toFixed(2)}`, 470, y);
            y += 20;
        });
        doc.moveTo(50, y).lineTo(550, y).stroke();

        // Totals
        const subtotal = order.products.reduce((sum, item) => sum + (item.quantity * item.price), 0);
        const discountMrp = order.products.reduce((sum, item) => sum + (item.discountMrp * item.quantity), 0);
        const couponDiscount = order.couponDiscount;
        // const total = subtotal - discountMrp - couponDiscount;

        y += 20;
        doc.text('Sub Total', 370, y)
           .text(`${subtotal.toFixed(2)}`, 470, y);
        y += 20;
        doc.text('Discount in MRP', 370, y).fillColor('red')
           .text(`-${(subtotal-discountMrp).toFixed(2)}`, 470, y);
        y += 20;
        doc.text('Coupon Discount', 370, y).fillColor('red')
           .text(`${couponDiscount.toFixed(2)}`, 470, y);
        y += 20;
        doc.rect(370, y, 180, 25).fill('#800000');
        doc.fillColor('#FFFFFF')
           .text('Total', 380, y + 7)
           .text(`${order.totalPrice.toFixed(2)}`, 470, y + 7);

        // Payment Method
        doc.fillColor('#000000')
           .text(`Payment Method: ${order.paymentMethod}`, 50, y + 40);

        // Note
        doc.text('Note:', 50, y + 60)
           .text('Thank you for your business!', 50, y + 75);

        doc.end();

    } catch (error) {
        console.log(`Error from download invoice: ${error}`);
        res.status(500).send('Error generating invoice');
    }
};


module.exports = {order,cancelOrder,returnOrder,orderSucces,orderFailure,retryPayment,removeOrder,retryRazorPay,orderDetails,downloadInvoice}