const mongoose = require("mongoose");


const stockHistorySchema = new mongoose.Schema(
    {
        name: {
            type: String,
        },
        quantity: {
            type: Number,
        },
        status: {
            type: String,
        },
        by: {
            type: String,
        },
    },
    {
        timestamps: true,
    }
);

const productSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true,
    },
    description: {
        type: String,
        default: "",
    },
    price: {
        type: Number,
        required: true,
    },
    images: [{
        public_id: {
            type: String,
            required: true,
        },
        url: {
            type: String,
            required: true,
        },
    }],
    stock: {
        type: Number,
        default: 0,
    },
    ratings: {
        type: Number,
        default: 0,
    },
    numOfReviews: {
        type: Number,
        default: 0,
    },
    reviews: [
        {
            user: {
                type: mongoose.Schema.ObjectId,
                ref: "User",
                required: true,
            },
            name: {
                type: String,
            
            },
            rating: {
                type: Number,
                required: true,
            },
            comment: {
                type: String,
                required: true,
            },
            date: {
                type: Date,
                default: Date.now
            }
        },
    ],
    createdAt: {
        type: Date,
        default: Date.now,
    },

    stockLogs: [stockHistorySchema],

});

module.exports = mongoose.model('Product', productSchema);