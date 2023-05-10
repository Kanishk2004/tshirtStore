const express = require('express');
const router = express.Router();

const {signUp, login, logout, forgotPassword, passwordReset, getLoggedInUserDetails, changePassword, updateUserDetails, adminAllUser, managerAllUser, adminGetOneUser, adminUpdateUserDetails, adminDeleteUser} = require('../controllers/userController');

const {isLoggedIn, customRole} = require('../middlewares/user');

router.route('/signup').post(signUp);
router.route('/login').post(login);
router.route('/logout').post(logout);
router.route('/forgotpassword').post(forgotPassword);
router.route('/password/reset/:token').post(passwordReset);
router.route('/userdashboard').get(isLoggedIn, getLoggedInUserDetails);
router.route('/password/update').post(isLoggedIn, changePassword);
router.route('/userdashboard/update').post(isLoggedIn, updateUserDetails);

// admin only route
router.route('/admin/users').get(isLoggedIn, customRole('admin') , adminAllUser);
router.route('/admin/user/:id').get(isLoggedIn, customRole('admin') , adminGetOneUser).put(isLoggedIn, customRole('admin'), adminUpdateUserDetails).delete(isLoggedIn, customRole('admin'), adminDeleteUser);

// manager only route
router.route('/manager/users').get(isLoggedIn, customRole('manager') , managerAllUser);


module.exports = router;