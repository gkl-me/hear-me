const userSchema = require('../model/user.modal')
const passport = require('passport')

passport.serializeUser((user,done)=> {
    done(null,user.id);
})

passport.deserializeUser(async (id,done)=> {

    try {

    const user = await userSchema.findById(id)
    done(null,user);
        
    } catch (error) {
        done(error,null)
    }

})

const GoogleStrategy = require('passport-google-oauth20').Strategy;

passport.use(new GoogleStrategy({
    clientID: process.env.GOOGLE_CLIENT_ID,
    clientSecret: process.env.GOOGLE_CLIENT_SECRET,
    callbackURL: "http://localhost:8080/user/auth/google/redirect"
  },async (accessToken, refreshToken, profile, done)=> {

    try {
        let user = await userSchema.findOne({email: profile.emails[0].value})
        if(!user){
        user = new userSchema({
                name: profile.displayName,
                email:profile.emails[0].value,
                googleId: profile.id
            })
        await user.save();
        }done(null,user);
    } catch (error) {
        console.log(`${error}`)
    }
  }));
