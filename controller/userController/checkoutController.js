const productSchema = require('../../model/product.model')
const cartSchema = require('../../model/cart.modal')
const userSchema = require('../../model/user.modal')
const orderSchema = require('../../model/order.modal')



const renderCheckout = async (req,res)=>{

    const userId = req.session.user

    const user = await userSchema.findById(userId)

    const cart = await cartSchema.findOne({userId}).populate('products.productId')

    if(cart.products.length === 0){
        res.redirect('/user/cart')
    }else{
        res.render('user/checkOut',{title: 'Checkout',user,cart})
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
    
    let{name,email,phone,address,paymentMethod} = req.body

    const cart = await cartSchema.findOne({userId}).populate('products.productId');

    if(!cart || cart.products.length === 0 ){
        return res.status(404).send('Cart is empty or not found ')
    }

    let totalPrice = 0;
    const orderProducts =  cart.products.map(product => {
        const price = product.price;
        totalPrice += price * product.quantity
        return {
            productId : product.productId._id,
            quantity: product.quantity,
            price: price
        }
    })

    address = eval('(' + address + ')')



    const order = new orderSchema({
        userId,
        contactInfo: {name, email, phone},
        address,
        products: orderProducts,
        totalPrice,
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

    } catch (error) {
        console.log(`error from checkoutproceed ${error}`)
        res.status(404).send('cannot procceed checkout')
    }

}


module.exports = {renderCheckout,addAddress,checkoutProceed}