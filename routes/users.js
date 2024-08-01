const express = require("express");
const router = express.Router();

const passport = require("passport");
const User = require("../models/user");

const { store_return_to } = require("../utils/middleware-functions");

router.get("/register", (req, res) => {
    res.render("users/register");
});

router.post("/register", async (req, res, next) => {
    try {
        const { username, email, password } = req.body;

        // To use Passport, we create a new user without the password property,
        // and then call User.register() with the password.
        // Passport will hash the password using a salt and then save the
        // document to the collection.
        const user = new User({ username, email });
        const registered_user = await User.register(user, password);

        // req.login(), which is provided by Passport, manipulates the
        // req.session object to log a user in with respect to the current
        // session.
        req.login(registered_user, err => {
            if (err) {
                next(err);
            } else {
                req.flash("success",
                    "Successfully created a new user! Welcome to RestoFind!");
                res.redirect("/restaurants");
            }
        });
    } catch (err) {
        // This code will be reached, for eg., when either username or email is
        // not unique.
        req.flash("error", err.message);
        res.redirect("/register");
    }
});

router.get("/login", (req, res) => {
    res.render("users/login");
});

// passport.authenticate(), which is provided by Passport, invokes req.login(),
// which is also provided by Passport.
router.post("/login", store_return_to,
    passport.authenticate("local", {
        // This causes a "Password or username is incorrect" error flash message
        // to get displayed upon a login failure.
        failureFlash: true,

        // This redirects to "/login" upon a login failure.
        failureRedirect: "/login"
    }), (req, res) => {
        req.flash("success",
            "Successfully logged you in! Welcome back to RestoFind!");
        res.redirect(res.locals.return_to || "/restaurants");
    });

router.get("/logout", (req, res, next) => {
    // req.logout(), which is provided by Passport, manipulates the req.session
    // object to log a user out with respect to the current session.
    req.logout(err => {
        if (err) {
            next(err);
        } else {
            req.flash("success", "Successfully logged you out!");
            res.redirect("/restaurants");
        }
    });
});

module.exports = router;
