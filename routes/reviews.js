const express = require("express");
const router = express.Router({ mergeParams: true });

// Setting mergeParams to true allows, for eg., the :id specified in the prefix
// in app.js to be used in this file.

const Restaurant = require("../models/restaurant");
const Review = require("../models/review");

const { is_logged_in, validate_review, is_existing_restaurant,
    is_existing_review,
    is_review_author } = require("../utils/middleware-functions");

router.post("/", is_logged_in, is_existing_restaurant, validate_review,
    async (req, res, next) => {
        try {
            const review = new Review(req.body.review);
            review.author = req.user._id;

            // Even though it looks like the entire review gets pushed, only the
            // object id of the review actually gets pushed, as the
            // RestaurantSchema has been defined in this way.
            res.locals.restaurant.reviews.push(review);

            await res.locals.restaurant.save();
            await review.save();

            req.flash("success", "Successfully created a new review!");
            res.redirect(`/restaurants/${req.params.id}`)
        } catch (err) {
            next(err);
        }
    });

router.delete("/:review_id", is_logged_in, is_existing_restaurant,
    is_existing_review, is_review_author, async (req, res, next) => {
        try {
            // This deletes all occurrences of review_id from the reviews array
            // within the corresponding restaurants document.
            await Restaurant.findByIdAndUpdate(req.params.id,
                { $pull: { reviews: req.params.review_id } });

            await Review.findByIdAndDelete(req.params.review_id);

            req.flash("success", "Successfully deleted the review!");
            res.redirect(`/restaurants/${req.params.id}`);
        } catch (err) {
            next(err);
        }
    });

module.exports = router;
