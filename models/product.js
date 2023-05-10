const mongoose = require('mongoose');

const productSchema = new mongoose.Schema({
    name: {
        type: String,
        required: [true, 'Please provide product name!'],
        trim: true,
        maxlength: [120, 'Product name should not be more than 120 char!']
    },
    price: {
        type: Number,
        required: [true, 'Please provide product price!'],
        maxlength: [6, 'Product price should not be more than 5 digits!']
    },
    description: {
        type: String,
        required: [true, 'Please provide product discription!'],
    },
    photos: [
        {
            id: {
                type: String,
                required: true
            },
            secure_url: {
                type: String,
                required: true
            },
        }
    ],
    category: {
        type: String,
        required: [true, 'Please select category from- shortsleeves, longsleeves, sweatshirts, hoodies'],
        enum: {
            values: [
                'shortsleeves',
                'longsleeves',
                'sweatshirts',
                'hoodies'
            ],
            message: 'Please select category only from- short-sleeves, long-sleeves, sweat-shirts, hoodies'
        }
    },
    stock: {
        type: Number,
        required: true
    },
    brand: {
        type: String,
        required: [true, 'Please provide a brand name!'],
    },
    ratings: {
        type: Number,
        default: 0
    },
    numberOfReviews: {
        type: Number,
        default: 0
    },
    reviews: [
        {
            user: {
                type: mongoose.Schema.ObjectId,
                ref: 'User',
                required: true
            },
            name: {
                type: String,
                required: true
            },
            rating: {
                type: Number,
                required: true
            },
            comment: {
                type: String,
                required: true
            }
        }
    ],
    user: {
        type: mongoose.Schema.ObjectId,
        ref: 'User',
        required: true
    },
    createdAt: {
        type: Date,
        default: Date.now
    }
});


module.exports = mongoose.model('Product', productSchema);