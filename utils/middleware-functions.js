const { RestaurantValidationSchema, ReviewValidationSchema } =
    require("../utils/validation-schemas");
const ExpressError = require("../utils/express-error");

const Restaurant = require("../models/restaurant");
const Review = require("../models/review")

module.exports.is_logged_in = (req, res, next) => {
    // req.isAuthenticated(), which is provided by Passport, checks the
    // req.session object to know whether a user is authenticated (logged in)
    // with respect to the current session.
    if (!req.isAuthenticated()) {
        // It should be noted that req.session, like req.flash, persists across
        // multiple request-response cycles, whereas res.locals persists only
        // during the current request-response cycle.
        // req.originalUrl, as opposed to req.path, also contains the prefix
        // defined in the app.js file.
        req.session.return_to = req.originalUrl;

        req.flash("error", "You must be logged in!");
        res.redirect("/login");
    } else {
        next();
    }
};

// Since Passport clears the session after a successful login, therefore
// req.session.return_to will no longer exist after a successful login attempt
// has been made.
// So, before logging in (i.e. before the session gets cleared), this middleware
// function is executed to store the return_to url within res.locals, which will
// persist only during the current request-response cycle.
module.exports.store_return_to = (req, res, next) => {
    if (req.session.return_to) {
        res.locals.return_to = req.session.return_to;
    }

    next();
};

module.exports.validate_restaurant = (req, res, next) => {
    // If the validation is successful, then error will be undefined.
    const { error } = RestaurantValidationSchema.validate(req.body);

    if (error) {
        // error.details is an array of objects with each object having a
        // message property.
        // This creates a single message by joining them.
        const message = error.details.map(el => el.message).join(", ");

        throw new ExpressError(400, message);
    } else {
        next();
    }
};

module.exports.is_existing_restaurant = async (req, res, next) => {
    try {
        // The id in the path can be accessed using req.params.id.
        const restaurant = await Restaurant.findById(req.params.id);

        // If req.params.id is not a valid 12-byte hexadecimal string (since
        // MongoDB ObjectId's are 12-byte hexadecimal strings), then the above
        // findById() will throw an error and this code will not be reached.
        if (!restaurant) {
            // This code will be reached only when req.params.id is a valid
            // 12-byte hexadecimal string and it doesn't correspond to any
            // actual document, as in this case, Mongoose will not throw any
            // error and will simply assign null to restaurant.
            // When there are no matches, then, for eg., find() returns an empty
            // array, whereas, for eg., findById (which internally calls
            // findOne()) returns null.
            req.flash("error", "Couldn't find that restaurant!");
            res.redirect("/restaurants");
        } else {
            res.locals.restaurant = restaurant;
            next();
        }
    } catch (err) {
        next(err);
    }
};

module.exports.is_restaurant_author = (req, res, next) => {
    // We don't need the author of the restaurant populated, as we are comparing
    // by user id, and not by username.
    if ((!req.user) || (!res.locals.restaurant) ||
        (!res.locals.restaurant.author.equals(req.user._id))) {
        req.flash("error", "You do not have permission to do that!");
        res.redirect(`/restaurants/${res.locals.restaurant._id}`)
    } else {
        next();
    }
};

module.exports.validate_review = (req, res, next) => {
    const { error } = ReviewValidationSchema.validate(req.body);

    if (error) {
        const message = error.details.map(el => el.message).join(", ");
        throw new ExpressError(400, message);
    } else {
        next();
    }
};

module.exports.is_existing_review = async (req, res, next) => {
    try {
        const review = await Review.findById(req.params.review_id);

        if (!review) {
            req.flash("error", "Couldn't find that review!");
            res.redirect("/restaurants");
        } else {
            res.locals.review = review;
            next();
        }
    } catch (err) {
        next(err);
    }
};

module.exports.is_review_author = (req, res, next) => {
    if ((!req.user) || (!res.locals.review) ||
        (!res.locals.review.author.equals(req.user._id))) {
        req.flash("error", "You do not have permission to do that!");
        res.redirect(`/restaurants/${res.locals.restaurant._id}`)
    } else {
        next();
    }
};
