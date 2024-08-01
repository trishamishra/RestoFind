const Joi = require("joi");

// This will check whether the argument of RestaurantValidationSchema.validate()
// is an object (required by default), and that it has a property called
// restaurant which is also an object (required), and so on.
module.exports.RestaurantValidationSchema = Joi.object({
    restaurant: Joi.object({
        title: Joi.string().required(),
        location: Joi.string().required(),
        price: Joi.number().required().min(0),
        description: Joi.string().required()
    }).required()
});

module.exports.ReviewValidationSchema = Joi.object({
    review: Joi.object({
        rating: Joi.number().required().min(1).max(5),
        body: Joi.string().required()
    }).required()
});
