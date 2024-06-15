const orderSchema = require('../../model/order.modal')


const order = async (req,res)=>{

    const userId = req.session.user

    const order = await orderSchema.find({userId}).populate('products.productId')


    res.render('user/order',{title:'Orders',user:userId,order})
}


const cancelOrder = async (req,res)=>{
    
    try {

        const orderId = req.params.id

        const order = await orderSchema.findByIdAndUpdate(orderId, { status: 'cancelled'})
        if(order){
            req.flash('Order cancel success')
            res.redirect('/user/orders')
        }
        
    } catch (error) {
        console.log(`error from cancelOrder ${error}`)
    }

}


module.exports = {order,cancelOrder}