const productSchema = require('../model/product.model')
const collectionSchema = require('../model/collection.model')
const offerSchema = require('../model/offer.modal')

const findOffer = async (productId) =>{

    try {
        
        // find the product document
        const productFound = await productSchema.findById(productId);

        // check product offer present
        const offerPresent = await offerSchema.findOne({
          referenceId: productId,isActive:true
        });

        const collectionFound = await collectionSchema.findOne({
            collectionName: productFound.productCollection,
        });

        // check if collection offer present
        const collectionOffer = await offerSchema.findOne({
          referenceId: collectionFound.id,
          isActive: true
        });

        // offer percent returned
        if (offerPresent) {
          return offerPresent.discountPercent;
        } else if (collectionOffer) {
          return collectionOffer.discountPercent;
        }else {
            return 0;
        }

    } catch (error) {
        console.log(`error from findOffer ${error}`)
    }

}

module.exports = findOffer;