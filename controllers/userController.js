const User = require('../models/user');
const BigPromise = require('../middlewares/bigPromise');
const CustomError = require('../utils/customError');
const cookieToken = require('../utils/cookieToken');
const cloudinary = require('cloudinary');
const mailHelper = require('../utils/emailhelper');
const crypto = require('crypto');

exports.signUp = BigPromise(async (req, res, next) => {

    const {name, email, password} = req.body;

    if (!email || !name || !password) {
        return next(new CustomError('Name, email and password are required!', 400));
    };

    let result;

    if (req.files) {
        let file = req.files.photo
        result = await cloudinary.v2.uploader.upload(file.tempFilePath, {
            folder: "users",
            width: 150,
            crop: "scale"
        });
    };

    const user = await User.create({
        name,
        email,
        password,
        photo: {
            id: result.public_id,
            secure_url: result.secure_url
        },
    });

    cookieToken(user, res); 

} );

exports.login = BigPromise(async (req, res, next) => {
    const {email, password} = req.body;

    // check for email and password
    if (!email || !password) {
        return next(new CustomError('Please provide email and password', 400));
    };

    // get user from db
    const user = await User.findOne({email}).select("+password");

    // if user not found in db
    if (!user) {
        return next(new CustomError('No user found!', 400));
    };

    // matching the password
    const isPasswordCorrect = await user.isValidatedPassword(password);

    // if password do not match
    if (!isPasswordCorrect) {
        return next(new CustomError('Email or password does not match!', 400));
    };

    // if all goes good we provide token
    cookieToken(user, res); 

});

exports.logout = BigPromise(async (req, res, next) => {
    res.cookie('token', null, {
        expires: new Date(Date.now()),
        httpOnly: true,
    });
    res.status(200).json({
        success: true,
        message: "Logout success",
    });
});

exports.forgotPassword = BigPromise(async (req, res, next) => {
    const {email} = req.body;

    const user = await User.findOne({email});

    // if user not found in db
    if (!user) {
        return next(new CustomError('Email not found!', 400));
    };

    // get forgot password token from user model
    const forgotToken = user.getForgotPasswordToken();

    await user.save({validateBeforeSave: false});

    // creating forgot password URL
    const myUrl = `${req.protocol}://${req.get("host")}/api/v1/password/reset/${forgotToken}`;

    const message = `Copy and paste this link to your URL and hit enter---> ${myUrl}`;

    // try catch for checking if email was sent successfully
    try {

        await mailHelper({
            email: user.email,
            subject: "Mista - Password reset email",
            message,
        });
        res.status(200).json({
            success: true,
            message: "Email sent successfully!"
        });

    } catch (error) {

        // very importtant part
        user.forgotPasswordToken = undefined
        user.forgotPasswordExpiry = undefined

        await user.save({validateBeforeSave: false});

        return next(new CustomError(error.message, 500))
    }

});

// ------------------------------------------> forgot password expiry isn't working <------------------------------------------
exports.passwordReset = BigPromise(async (req, res, next) => {
    const token = req.params.token;

    const encryToken = crypto.createHash("sha256").update(token).digest("hex");

    const currentDate = new Date().toISOString();

    const user = await User.findOne({
        encryToken,
        forgotPasswordExpiry: { $gte: currentDate },
    });

    if (!user) {
        return next(new CustomError('Token is invalid or expired', 400));
    };

    if (req.body.password !== req.body.confirmPassword) {
        return next(new CustomError('Password and confirm password do not match!'), 400)
    }

    user.password = req.body.password;

    user.forgotPasswordToken = undefined;
    user.forgotPasswordExpiry = undefined;

    await user.save();

    // send a json response OR send a token

    cookieToken(user, res);

});

exports.getLoggedInUserDetails = BigPromise(async (req, res, next) => {
    //req.user will be added by middleware
    // find user by id
    const user = await User.findById(req.user.id);

    //send response and user data
    res.status(200).json({
        success: true,
        user,
    });
});

exports.changePassword = BigPromise(async (req, res, next) => {
    const userId = req.user.id

    const user = await User.findById(userId).select("+password");

    const isCorrectOldPassword = await user.isValidatedPassword(req.body.oldPassword);

    if (!isCorrectOldPassword) {
        return next(new CustomError('old password is incorrect', 400))
    }

    user.password = req.body.password

    await user.save();

    cookieToken(user, res);
});

exports.updateUserDetails = BigPromise(async (req, res, next) => {

    const newData = {
        name: req.body.name,
        email: req.body.email
    };

    if (req.files) {
        const user = await User.findById(req.user.id);

        const imageId = user.photo.id;

        const resp = await cloudinary.v2.uploader.destroy(imageId);

        const result = await cloudinary.v2.uploader.upload(req.files.photo.tempFilePath, {
            folder: "users",
            width: 150,
            crop: "scale"
        });

        newData.photo = {
            id: result.public_id,
            secure_url: result.secure_url,
        };

    };

    const user = await User.findByIdAndUpdate(req.user.id, newData, {
        new: true,
        runValidators: true,
        useFindAndmodify: false
    });

    res.status(200).json({
        success: true
    });
});

exports.adminAllUser = BigPromise(async (req, res, next) => {
    const users = await User.find();
    res.status(200).json({
        success: true,
        users
    });
});

exports.adminGetOneUser = BigPromise(async (req, res, next) => {
    const user = await User.findById(req.params.id);

    if (!user) {
        return next(new CustomError('No user found!', 400))
    }

    res.status(200).json({
        success: true,
        user
    })
});

exports.adminUpdateUserDetails = BigPromise(async (req, res, next) => {

    const newData = {
        name: req.body.name,
        email: req.body.email,
        role: req.body.role
    };

    const user = await User.findByIdAndUpdate(req.params.id, newData, {
        new: true,
        runValidators: true,
        useFindAndmodify: false
    });

    res.status(200).json({
        success: true
    });
});

exports.adminDeleteUser = BigPromise(async (req, res, next) => {
    const user = await User.findById(req.params.id);

    if (!user) {
        return next(new CustomError('No such user found!', 401))
    }

    const imageId = user.photo.id;

    await cloudinary.v2.uploader.destroy(imageId);

    await user.deleteOne();

    res.status(200).json({
        success: true
    });
});



exports.managerAllUser = BigPromise(async (req, res, next) => {
    const users = await User.find({role: 'user'});
    res.status(200).json({
        success: true,
        users
    });
});

