const { set } = require('mongoose')
const reviewSchema = require('../../model/review.modal')

const getReview = async (req,res)=>{

    try {

        const {productId} = req.params
        const userId = req.session.user

        const review = await reviewSchema.findOne({productId,userId})
        if(review){
            res.status(200).json(review)
        }else{
            res.status(500).send('No review found')
        }

    } catch (error) {
        res.status(500).send('No review found')
    }

}

const setReview = async(req,res)=>{

    try {
        
        const {productId,rating,comment} = req.body;
        const userId = req.session.user

        let review = await reviewSchema.findOne({productId,userId})

        if(review){
            review.rating = rating,
            review.comment = comment
        }else{
            review = new reviewSchema({
                productId,userId,rating,comment
            })
        }

        await review.save();
        res.status(200).json(review)

    } catch (error) {
        res.status(500).send(`Adding review failed ${error} `)
    }

}


const renderRatings = async (req,res)=>{

    try {

        const {productId} = req.params;
        const userId = req.session.user;

        const reviews = await reviewSchema.find({productId})
        const totalRatings = reviews.length;

        if (totalRatings === 0) {
            return res.status(200).json({
                averageRating: 0,
                totalRatings: 0,
                ratingPercentages: [0, 0, 0, 0, 0],
            });
        }

        const ratingCounts = [0, 0, 0, 0, 0];
        let totalRatingSum = 0;

        reviews.forEach(review => {
            totalRatingSum += review.rating;
            ratingCounts[review.rating - 1]++;
        });

        const averageRating = (totalRatingSum / totalRatings).toFixed(1);
        const ratingPercentages = ratingCounts.map(count => ((count / totalRatings) * 100).toFixed(2));

        res.status(200).json({
            averageRating,
            totalRatings,
            ratingPercentages,
        });
        
    } catch (error) {
        res.status(500).send(error)
        console.log(`error from render rating ${error}`)
    }

}

module.exports = {getReview,setReview,renderRatings}