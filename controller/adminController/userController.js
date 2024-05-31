
const userSchema = require('../../model/user.modal')

const users = async (req,res)=> {

    try {
        
        const search = req.query.search || ''
        const user = await userSchema.find({name: {$regex: search, $options: 'i'}})

        res.render('admin/user',{title: 'Customers',user})

    } catch (error) {
        console.log(`Error while loading user in admin ${error}`)
    }

}

const status = async (req,res)=> {

    try {
        
        const {id,status} = req.query;
        const newStatus = !(status === 'true')

        await userSchema.findByIdAndUpdate(id,{isActive: newStatus})
        res.redirect('/admin/users')

    } catch (error) {
        console.log(`error while changing status of user ${error}`)
    }

}

module.exports ={ users,status};