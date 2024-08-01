const express = require("express");
const router = express.Router();

// This imports the Mongoose model exported in the restaurant.js file.
const Restaurant = require("../models/restaurant");

const { is_logged_in, validate_restaurant, is_existing_restaurant,
    is_restaurant_author } = require("../utils/middleware-functions");

// This is used to populate the req.body and the req.file/req.files objects
// according to the incoming HTTP POST/PUT/etc. request's data when the
// corresponding enctype is multipart/form-data, which is mainly used for
// uploading files.
// To access req.body and req.file/req.files within a middleware function for a
// route, use upload.single(), upload.array(), etc.
const multer = require("multer");

// This is used to upload images to Cloudinary using multer.
const { storage } = require("../utils/multer-and-cloudinary");
const upload = multer({ storage });

router.get("/", async (req, res, next) => {
    try {
        const restaurants = await Restaurant.find({});

        // This makes the restaurants variable (which refers to the array
        // containing every restaurant document (object)) available in the
        // index.ejs file.
        res.render("restaurants/index", { restaurants });
    } catch (err) {
        next(err);
    }
});

// Multiple middleware functions can be chained one after another.
router.get("/new", is_logged_in, (req, res) => {
    res.render("restaurants/new");
});

// Currently, there are no restrictions on the quantity, sizes, resolutions,
// etc. of the images which are to be uploaded to Cloudinary.
router.post("/", is_logged_in, upload.array("images"), validate_restaurant,
    async (req, res, next) => {
        try {
            const restaurant = new Restaurant(req.body.restaurant);
            restaurant.author = req.user._id;

            // req.files is an array of objects with each object having a path
            // property and a filename property corresponding to the
            // Cloudinary url and the Cloudinary file name, respectively, of the
            // corresponding uploaded image.
            // This creates a new array of objects with each object having only
            // a url property and a file_name property.
            // The parentheses after => are required because otherwise the
            // contents between the braces will be treated as the function body.
            restaurant.images =
                req.files.map(f => ({ url: f.path, file_name: f.filename }));

            await restaurant.save();

            req.flash("success", "Successfully created a new restaurant!");

            // This redirects to the specified path. The method may be either
            // GET or POST, depending upon the situation.
            res.redirect(`/restaurants/${restaurant._id}`);
        } catch (err) {
            next(err);
        }
    });

// The order in which these routes have been defined matters.
router.get("/:id", is_existing_restaurant, async (req, res, next) => {
    try {
        // populate("author") populates the author in the document (object) from
        // the restaurants collection with the corresponding data from the users
        // collection.
        await res.locals.restaurant.populate("author");

        // This populates the reviews array in the document (object) from the
        // restaurants collection with the corresponding data from the reviews
        // collection, and also populates the author of every review in that
        // array.
        await res.locals.restaurant.populate({
            path: "reviews",
            populate: {
                path: "author"
            }
        });

        res.render("restaurants/show", { restaurant: res.locals.restaurant });
    } catch (err) {
        next(err);
    }
});

router.get("/:id/edit", is_logged_in, is_existing_restaurant,
    is_restaurant_author, (req, res) => {
        res.render("restaurants/edit", { restaurant: res.locals.restaurant });
    });

router.put("/:id", is_logged_in, is_existing_restaurant, is_restaurant_author,
    validate_restaurant, async (req, res, next) => {
        try {
            await Restaurant.findByIdAndUpdate(req.params.id,
                req.body.restaurant);

            req.flash("success", "Successfully updated the restaurant!");
            res.redirect(`/restaurants/${req.params.id}`);
        } catch (err) {
            next(err);
        }
    });

router.delete("/:id", is_logged_in, is_existing_restaurant,
    is_restaurant_author, async (req, res, next) => {
        try {
            await Restaurant.findByIdAndDelete(req.params.id);

            req.flash("success", "Successfully deleted the restaurant!");
            res.redirect("/restaurants");
        } catch (err) {
            next(err);
        }
    });

module.exports = router;
