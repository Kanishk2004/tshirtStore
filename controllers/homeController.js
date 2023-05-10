const BigPromise = require('../middlewares/bigPromise');

exports.home = BigPromise((req, res) => {
    res.status(200).json({
        success: true,
        greetings: "Hello from API"
    });
})