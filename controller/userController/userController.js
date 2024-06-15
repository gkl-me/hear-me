const userSchema = require("../../model/user.modal");
const bcrypt = require("bcrypt");

const sendOTP = require("../../services/emailSender");
const generateOTP = require("../../services/generateOTP");
const passport = require("passport");

const user = (req, res) => {
  try {
    res.redirect("/user/home");
  } catch (error) {
    console.log(`error while rendering user page ${error}`);
  }
};

const signup = (req, res) => {
  try {
    if (req.session.user) {
      res.redirect("/user/home");
    } else {
      res.render("user/signup", { title: "Signup",user: req.session.user });
    }
  } catch (error) {
    console.log(`error while rendering signup page ${error} `);
  }
};

const signgupPost = async (req, res) => {
  try {
    const details = {
      name: req.body.name,
      email: req.body.email,
      password: await bcrypt.hash(req.body.password, 10),
      phone: req.body.phone,
    };

    const check = await userSchema.findOne({ email: details.email });

    if (check) {
      req.flash("error", "User already exists");
      res.redirect("/user/signup");
    } else {
      const otp = generateOTP();

      sendOTP(details.email, otp);
      

      req.session.otp = otp;
      req.session.otpTime = Date.now();
      req.session.email = details.email;
      req.session.name = details.name;
      req.session.phone = details.phone;
      req.session.password = details.password;


      req.flash("success", `OTP sent to the ${details.email} `);
      res.redirect("/user/verify");
    }
  } catch (error) {
    console.log(`error while user signup post ${error}`);
  }
};

const verify = (req, res) => {
  try {
    res.render("user/verify", {
      title: "OTP verify",
      email: req.session.email,
      otpTime: req.session.otpTime,
      user : req.session.user
    });
  } catch (error) {
    console.log(`error while rendering verify page ${error}`);
  }
};

const verifyPost = async (req, res) => {
  try {
    if (req.session.otp !== undefined) {
      const details = {
        name: req.session.name,
        email: req.session.email,
        password: req.session.password,
        phone: req.session.phone,
      };

      if (req.body.otp === req.session.otp) {
        await userSchema
          .insertMany(details)
          .then(() => {
            console.log(`new user successfully registeres`);
            req.flash("success", "user signup successfull");
            res.redirect("/user/login");
          })
          .catch((err) => {
            console.log(`error while user signup ${err}`);
          });
      } else {
        req.flash("error", "Invaild OTP");
        res.redirect("/user/verify");
      }
    }
  } catch (error) {
    console.log(`error while verifying otp${error}`);
  }
};



const otpResend = (req, res) => {
  try {
    const email = req.params.email;

    const otp = generateOTP();

    sendOTP(email, otp);

    req.session.otp = otp;
    req.session.otpTime = Date.now();

    req.flash("success", "OTP resend successfully");
    res.redirect("/user/verify");
  } catch (error) {
    console.log(`error while resend otp ${error}`);
  }
};

const login = (req, res) => {
  if (req.session.user) {
    res.redirect("/user/home");
  } else {
    res.render("user/login", { title: "Login" , user: req.session.user });
  }
};

const loginPost = async (req, res) => {
  try {
    const check = await userSchema.findOne({ email: req.body.email });
    if (check) {
      if (!check.isActive) {
        req.flash("error", "User access is blocked by admin");
        res.redirect("/user/login");
      } else {
        const password = await bcrypt.compare(
          req.body.password,
          check.password
        );

        if (check && password) {
          req.session.user = check.id;
          res.redirect("/user/home");
        } else {
          req.flash("error", "Invalid credentails");
          res.redirect("/user/login");
        }
      }
    } else {
      req.flash("error", "Couldnt find user");
      res.redirect("/user/login");
    }
  } catch (error) {
    console.log(`error while login post ${error}`);
  }
};

const logout = (req, res) => {
  try {
    req.session.destroy((err) => {
      if (err) {
        console.log(err);
      } else {
        res.redirect("/user/home");
      }
    });
  } catch (error) {
    console.log(`error while logout user ${error}`);
  }
};

//auth controller

const auth = passport.authenticate("google", {
  scope: ["profile", "email"],
});

const authRedirect = (req, res) => {
  req.session.user = req.user.id;
  res.redirect("/");
};

module.exports = {
  user,
  signup,
  signgupPost,
  verify,
  verifyPost,
  otpResend,
  login,
  loginPost,
  logout,
  auth,
  authRedirect,
};
