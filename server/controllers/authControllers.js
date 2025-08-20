const User = require('../models/user');
const Survivor = require('../models/survivors');
const { hashPassword, comparePassword, generateVerificationToken } = require('../helpers/auth');
const jwt = require('jsonwebtoken');
const { sendVerificationEmail, sendWelcomeEmail, sendPasswordResetEmail, sendRestSuccessEmail } = require('../resend/email');

//Register endpoint
const registerUser = async (req, res) => {
    try {
        const {name, email, password} = req.body;
        // Check if name was entered
        if(!name) {
            return res.json({
                error: 'name is required'
            });
        }
        //Check if password is good
        if(!password || password.length < 6) {
            return res.json({
                error: 'Password is required and should be at least six characters long'
            });
        }
        // Check email
        const exist = await User.findOne({email})
        if(exist) {
            return res.json({
                error: 'Email is taken already'
            });
        }

        const survivors = await Survivor.find();

        const portfolio = {};

        survivors.forEach(survivor => {
            portfolio[survivor.name] = 0;
        });

        const hashedPassword = await hashPassword(password)
        const verificationToken = generateVerificationToken();
        console.log(verificationToken)
        //Create user in database
        const user = await User.create({
            name,
            email, 
            password: hashedPassword,
            verificationToken,
            verificationTokenExpiresAt: Date.now() + 24 * 60 * 60 * 1000,
            portfolio,
            role: 'user'
        });
        jwt.sign({sub: user._id}, process.env.JWT_SECRET, {}, (err, token) => {
            if(err) throw err;
            res.cookie('token', token).json(user)
        })

        await sendVerificationEmail(user.email, verificationToken);
    } catch (error) {
        console.log(error)
    }
};

//Login endpoint
const loginUser = async (req, res) => {
    try {
        const {email, password} = req.body;

        //Check if user exists
        const user = await User.findOne({email});
        if(!user) {
            return res.json({
                error: 'No user found'
            });
        }

        //Check if passwords match
        const match = await comparePassword(password, user.password)

        if(!match) {
            res.json({
                error: 'Passwords do not match'
            })
        }

        // const isVerified = user.isVerified;
        const isVerified = true

        // if(!isVerified) {
        //     res.json({
        //         error: 'Email is not verified'
        //     })
        // }
        if(match && isVerified) {
            jwt.sign({sub: user._id}, process.env.JWT_SECRET, {}, (err, token) => {
                if(err) throw err;
                res.cookie('token', token).json(user)
            })
        }
        

    } catch (error) {
        console.log(error)
    }
}


const getProfile = async (req, res) => {
  const token = req.cookies?.token;
  if (!token) return res.status(200).json(null);

  try {
    const payload = jwt.verify(token, process.env.JWT_SECRET);
    const user = await User.findById(payload.sub)
      .select('_id name email role') 
      .lean();

    if (!user) return res.status(200).json(null);

    return res.json({
      id: user._id,
      name: user.name,
      email: user.email,
      role: user.role,
    });
  } catch (e) {
    return res.status(401).json({ error: 'Invalid or expired token' });
  }
}

const logoutUser = async (req, res) => {
    res.clearCookie("token");
    res.status(200).json({success: true, message: "Logged out successfully"})
}

const verifyEmail = async (req, res) => {
    const { code } = req.body;
    console.log(code)
    try {
        const user = await User.findOne({
            verificationToken: code,
            verificationTokenExpiresAt: { $gt: Date.now() },
        })
        if(!user) {
            return res.status(400).json({ success: false, message: "Invalid or expired verification code"})
        }
        user.isVerified = true;
        user.verificationToken = undefined;
        user.verificationTokenExpiresAt = undefined;
        await user.save();

        await sendWelcomeEmail(user.email, user.name)
        res.status(200).json({ success: true, message: "Verification successful and email sent"})
    } catch (error) {

    }
}

const forgotPassword = async (req, res) => {
    const { email } = req.body;
    try {
        const user = await User.findOne({email});
        if (!user) {
            return res.status(400).json({success: false, message: "User not found"})
        }
        const resetPasswordToken = crypto.randomBytes(32).toString("hex")
        const resetPasswordExpiresAt = Date.now() + 1 * 60 * 60 * 1000;

        user.resetPasswordToken = resetPasswordToken;
        user.resetPasswordExpiresAt = resetPasswordExpiresAt;

        await user.save();

        await sendPasswordResetEmail(user.email, `survivorstockexhange.com/reset-password/${resetPasswordToken}`);

        res.status(200).json({success: true, message: "Reset password email sent successfully"})
    } catch (error) {
        console.log("error sending password reset email", error)
        res.status(400).json({success: false, message: error.message})
    }
}

const resetPassword = async (req, res) => {
    try {
        const { token } = req.params;
        const { password } = req.body;
        const user = await User.findOne({
            resetPasswordToken: token,
            resetPasswordExpiresAt: { $gt: Date.now() }
        })
        if (!user) {
            return res.status(400).json({success: false, message: "Invalid or expired reset token"});
        }
        const hashedPassword = await hashPassword(password)
        user.password = hashedPassword;
        user.resetPasswordToken = undefined;
        user.resetPasswordExpiresAt = undefined;
        await user.save();

        await sendRestSuccessEmail(user.email)

        res.status(200).json({ success: true, message: "Password reset successfully"});
    } catch (error) {
        console.log("error reseting password", error);
        res.status(400).json({ success: false, message: error.message});
    }
}

const resetUsername = async (req, res) => {
    try {
        const { newUsername, id } = req.body;
        const user = await User.findOne({ _id: id })
        user.name = newUsername;
        await user.save();
        res.status(200).json({ success: true, message: "Username reset successfully"})
    } catch (error) {
        console.log("error resetting username", error)
        res.status(400).json({ success: false, message: error.message})
    }
}



module.exports = {
    registerUser,
    loginUser,
    getProfile,
    logoutUser,
    verifyEmail,
    forgotPassword,
    resetPassword,
    resetUsername
}