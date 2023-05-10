const express = require('express');
const router = express.Router();
const {isLoggedIn, customRole} = require('../middlewares/user');
const { addProduct, getAllProduct, adminGetAllProducts, getOneProduct, adminUpdateOneProduct, adminDeleteOneProduct, addReview, deleteReview, getOnlyReviewsForOneProduct } = require('../controllers/productController');

// user routes
router.route("/product").get(getAllProduct);
router.route("/product/:id").get(getOneProduct);
router.route("/review").put(isLoggedIn, addReview).delete(isLoggedIn, deleteReview);
router.route("/reviews").get(isLoggedIn, getOnlyReviewsForOneProduct);


// admin routes
router.route("/admin/product/add").post(isLoggedIn, customRole('admin'), addProduct);
router.route("/admin/product").get(isLoggedIn, customRole('admin'), adminGetAllProducts);
router.route("/admin/product/:id").put(isLoggedIn, customRole('admin'), adminUpdateOneProduct).delete(isLoggedIn, customRole('admin'), adminDeleteOneProduct);

module.exports = router;