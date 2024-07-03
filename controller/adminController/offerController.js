const offerSchema = require('../../model/offer.modal')
const collectionSchema= require('../../model/collection.model')
const productSchema = require('../../model/product.model')


// render offer page
const renderOfferPage = async (req,res)=>{

    try {

        const offers = await offerSchema.find().sort({createdAt : -1}).populate('referenceId')

        const products = await productSchema.find({isActive: true}).sort({createdAt: -1})

        const collections = await collectionSchema.find({isActive: true}).sort({createdAt: -1})

        res.render('admin/offer',{
            title: "Offers",
            offers,
            products,
            collections,
        })

        
    } catch (error) {
        console.log(`error from renderOfferPage ${error}`)
    }

}


const addOffer = async(req,res)=>{

    try {

        const {offerType,referenceId,discountPercent} = req.body

        const offerExists = await offerSchema.findOne({referenceId})
        
        console.log(offerExists)

        if(offerExists){
            req.flash('error','Offer Already Exists')
            return res.redirect('/admin/offer')
        }
            
            const newOffer = new offerSchema({
              offerType,
              referenceId,
              discountPercent,
            });

            await newOffer.save();

            req.flash("success", "Offer successfully added");
            res.redirect("/admin/offer");
        
        
    } catch (error) {
        console.log(`error from addOffer ${error}`)
    }

}

const editOffer = async(req,res)=>{

    try {

        const offerId = req.body.offerId 

        const discountPercent = req.body.discountPercent;

        const offer = await offerSchema.findByIdAndUpdate(offerId,{discountPercent:discountPercent})

        if(offer != null){
            req.flash('success',"Offer successfully edited"),
            res.redirect('/admin/offer')
        }else{
            req.flash('error','Offer unable to edit')
            res.redirect('/admin/offer')
        }

        
    } catch (error) {
        console.log(`error from editOffer ${error}`)
    }

}

const offerStatus = async (req,res)=>{

    try {

        const offerId = req.query.id
        const status = !(req.query.status === 'true')

        const offer = await offerSchema.findByIdAndUpdate(offerId,{isActive: status})

        res.redirect('/admin/offer')
        
    } catch (error) {
        console.log(`error from orderStatus ${error}`)
    }

}

const deleteOffer = async (req,res)=>{

    try {
        
        const offerId = req.params.id

        const offer = await offerSchema.findByIdAndDelete(offerId)

        if(offer != null){
            req.flash('success','Offer successfully deleted'),
            res.redirect('/admin/offer')
        }else{
            req.flash('error','Offer unable to delete'),
            res.redirect('/admin/offer')
        }

    } catch (error) {
        console.log(`error from deleteOffer ${error}`)
    }

}


module.exports= {
    renderOfferPage,
    addOffer,
    offerStatus,
    editOffer,
    deleteOffer
}