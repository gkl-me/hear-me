const couponSchema = require('../../model/coupon.modal')
const voucherCode = require('voucher-code-generator')


// coupon page render admin side
const renderCouponPage = async (req,res)=> {

    try {
        
        const coupons = await couponSchema.find({})

        res.render('admin/coupons',{title: "Coupons", coupons})

    } catch (error) {
        console.log(`error from coupon page render ${error}`)
    }

}

// coupon add in admin
const addCoupon = async (req,res)=>{

    try {
        
        let { name,discount,expiryDate, } = req.body

        // generates a coupon code
        name = name.trim().toUpperCase();
        const code = voucherCode.generate({
            length: 9,
            count: 1,
            charset: "alphanumeric"
        })

        const coupon = couponSchema.findOne({name:name})
        if(coupon){
            req.flash('error',"Coupon already exists")
            return res.redirect('/admin/coupons')
        }

        const newCoupon = new couponSchema({
            name,
            discount,
            expiryDate,
            code:code[0],
        })

        await newCoupon.save();

        req.flash('success','new coupon successfully added')
        res.redirect('/admin/coupons')
        



    } catch (error) {
        console.log(`error while adding coupon ${error}`)
    }

}


const deleteCoupon = async (req,res) =>{

    try {
        
        const couponId = req.params.id;

        if(!couponId){
            req.flash('error','Unable to delete')
            res.redirect('/admin/coupons')
        }

        const coupon = await couponSchema.findByIdAndDelete(couponId)

        if(coupon){
            req.flash('success',"coupon successfully deleted")
            res.redirect('/admin/coupons')
        }else{
            req.flash('error','Unable to delete')
            res.redirect('/admin/coupons')
        }


    } catch (error) {
        console.log(`error while deleting coupon ${error}`)
    }

} 


const status = async (req,res)=> {

    try {

        const couponId = req.query.id;
        const status = !(req.query.status === 'true');
        const coupon = await couponSchema.findByIdAndUpdate(couponId,{status: status})

        res.redirect('/admin/coupons')

    } catch (error) {
        console.log(`error from status change ${error}`)
    }

}


const editCoupon = async (req,res)=> {

    try {

        // const couponId = req.params.id

        const {couponId,name,discount} = req.body

        let coupon = await couponSchema.findOne({_id:couponId})

        coupon.name = name,
        coupon.discount = discount,

        await coupon.save();

        req.flash('success','Coupon succefully edited')
        res.redirect('/admin/coupons')


    } catch (error) {
        console.log(`error from edit coupon ${error}`)
    }

}


module.exports = {
     renderCouponPage,
     editCoupon,
     deleteCoupon,
     status,
     addCoupon
}