const userSchema = require('../../model/user.modal')
const bycrpt = require('bcrypt')

const profile = async (req,res)=>{
    
    try {
        
        const user = await userSchema.findById(req.session.user)
        if(user){
            res.render('user/profile',{title: 'Profile',user})
        }else{
            req.flash('error','Couldnt find user')
            res.redirect('/user/home')
        }


    } catch (error) {
        console.log(`error while loading profile ${error}`)
    }
}

// update the user info like name and phone

const updateProfile = async (req,res)=>{
    try {
        
        const name = req.body.name
        const phone = req.body.phone

        const update = await userSchema.findByIdAndUpdate(req.session.user,{name:name,phone:phone})

        if(update){
            req.flash('success','profile updated')
        }else{
            req.flash('error','error while updating')
        }

        res.redirect('/user/profile')

    } catch (error) {
        console.log(`error while updating the user info ${error}`)
    }
}

const addAddress = async (req,res)=>{
    try {
        
        const address = {
            addressType : req.body.addressType,
            addressLine : req.body.addressLine,
            city : req.body.city,
            state: req.body.state,
            pincode: req.body.pincode
        }
        
        const user = await userSchema.findById(req.session.user)

        user.address.push(address)
        await user.save();

        res.status(200).json();

        req.flash('success','New Address Added')
        res.redirect('/user/profile')

    } catch (error) {
        console.log(`error while adding new address ${error}`)
    }
}


const editAddress = async (req,res)=>{

    try {

    const index = req.params.id
    const address = {
        addressType : req.body.addressType,
        addressLine : req.body.addressLine,
        city: req.body.city,
        state: req.body.state,
        pincode: req.body.pincode
    }

    const user = await userSchema.findById(req.session.user)

    user.address[index] = address
    await user.save();

    req.flash('success','Address successfully edited')
    res.redirect('/user/profile')
        
    } catch (error) {
        console.log(`error while editing the address ${error}`)
    }


}


// change the password in profile 


const changePassword = async(req,res)=>{

   try {

    // get the user id from session

    const user = await userSchema.findById(req.session.user)

    // check if the password match  

    const verify = await bycrpt.compare(req.body.currentPass, user.password)

    //if match changing the password

    if (verify) {
        user.password = await bcrypt.hash(req.body.password, 10);
        await user.save();
        req.flash('success', 'Password successfully changed');
        return res.redirect('/user/profile');
    } else {
        req.flash('error', 'Invalid current password');
        return res.redirect('/user/profile');
    }

    
   } catch (error) {

         console.log(`error while change password in profile ${error}`)

   }

}


const deleteAddress = async (req,res)=>{

    try {
        const index = req.params.id

        const user = await userSchema.findById(req.session.user)

        user.address.splice(index,1)
        
        if(await user.save()){

            res.status(200).json();
        }

        
    } catch (error) {
        console.log(`error delete address ${error}`)
        res.status(404).text('not able to delete address')
    }

}


module.exports = {profile,addAddress,editAddress,changePassword,updateProfile,deleteAddress}

