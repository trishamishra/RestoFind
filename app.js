// This requires (i.e. imports) the Express module and creates an Express
// server.
// The (commonly named) app object has methods for routing incoming HTTP
// requests, rendering HTML pages as HTTP responses, etc.
const express = require("express");
const app = express();

// This adds the properties defined in the .env file to the process.env object
// if the current mode is not production, i.e. if the value of the NODE_ENV
// environment variable has not been set to "production".
// In production mode, environment variables are added directly to the
// environment, and not via a .env file.
if (process.env.NODE_ENV !== "production") {
    require("dotenv").config();
}

const mongoose = require("mongoose");

// The path module provides utilities for working with file and directory paths.
const path = require("path");

const ejs_mate = require("ejs-mate");
const method_override = require("method-override");
const session = require("express-session");
const flash = require("connect-flash");
const passport = require("passport");
const local_strategy = require("passport-local");
const User = require("./models/user");
const ExpressError = require("./utils/express-error");

// These allow the routes defined in the restaurants.js, reviews.js and the
// users.js files to be used in this file.
const restaurant_routes = require("./routes/restaurants");
const review_routes = require("./routes/reviews");
const user_routes = require("./routes/users");

// This connects Mongoose to the MongoDB database called resto-find.
// There is no need to await mongoose.connect() because Mongoose buffers the
// function calls related to Mongoose models internally.
mongoose.connect("mongodb://127.0.0.1:27017/resto-find");

// Instead of using mongoose.connection, we can now use db.
const db = mongoose.connection;

// This is used to know whether the connection to MongoDB was successfully
// established.
db.on("error", console.error.bind(console, "connection error:"));
db.once("open", () => {
    console.log("Database Connected!");
});

// This allows you to render HTML pages (using ejs templates) as HTTP responses.
// Also, this causes express to import the ejs module internally, and you can
// omit the extension (for eg., home instead of home.ejs).
app.set("view engine", "ejs");

// This tells express that the view (ejs template) files are located in the
// views directory within RestoFind.
app.set("views", path.join(__dirname, "views"));

// ejs-mate allows you to reuse the same ejs partial template across multiple
// views. This is similar to ejs partials, and both (ejs-mate and ejs partials)
// can be used simultaneously.
app.engine("ejs", ejs_mate);

// This is used to populate the req.body object according to the incoming HTTP
// POST/PUT/etc. request's data when the corresponding enctype is
// application/x-www-form-urlencoded (the default value).
app.use(express.urlencoded({ extended: true }));

// This lets you use HTTP verbs such as PUT or DELETE in places where the client
// doesn't support it. For eg., you can only send a GET request or a POST
// request via an HTML form.
app.use(method_override("_method"));

// This allows static assets (images, JavaScript files, etc.) within the public
// directory to be served to the client.
app.use(express.static(path.join(__dirname, "public")));

app.use(session({
    // A secret message is used to sign the session id (which will be stored
    // using a cookie on the client-side) via hashing in order to make session
    // hijacking very difficult, as a bad actor cannot easily pretend to be
    // another user by changing the session id, as any tampering with the
    // session id will get detected, unless the bad actor changes the session id
    // in a way such that the new session id also represents a valid, signed
    // session id corresponding to another user, which is very difficult to do.
    // This is the same thing that is done by cookie-parser when signing cookies
    // in order to identify whether the cookies have been tampered with.
    secret: "this-should-be-a-better-secret-message",

    resave: false,
    saveUninitialized: true,
    cookie: {
        httpOnly: true,
        expires: Date.now() + (1000 * 60 * 60 * 24 * 7),
        maxAge: 1000 * 60 * 60 * 24 * 7
    }
}));

// This is used to display flash messages, for eg., Successfully registered!,
// etc., using sessions.
app.use(flash());

app.use(passport.initialize());
app.use(passport.session());
passport.use(new local_strategy(User.authenticate()));
passport.serializeUser(User.serializeUser());
passport.deserializeUser(User.deserializeUser());

// app.use() is generally used for introducing middleware functions, and can
// handle all types of HTTP requests.
// On the other hand, for eg., app.get() can only handle HTTP GET requests.

// If no path is specified as the first argument of an app.use(), then the
// specified middleware function gets called for every HTTP request.
// However, if a path is specified as the first argument of an app.use(),
// for eg., "/book", then the corresponding middleware function gets called for
// every request with a path starting with "/book" relative to the website's
// root, for eg., "/book", "/book/1", "/book/page/index", etc.
// So, in other words, if no path is specified as the first argument of an
// app.use(), then "/" becomes the default value for the path argument.
// On the other hand, for eg., app.get() only calls the corresponding middleware
// function for those HTTP GET requests with a path exactly matching its first
// argument.

// // This calls the specified middleware function whenever there is an HTTP GET
// // request with a path "/".
// // The middleware function takes multiple arguments, commonly named as req,
// // res, etc., which are all provided by Express.
// // req is an object containing information about the corresponding incoming
// // HTTP, request, and res is an object which can be used to send back the
// // desired HTTP response.
// app.get("/", (req, res) => {
//     // // This sends back the specified string as the HTTP response.
//     // res.send("HELLO FROM RESTO FIND!");
//
//     // This renders and sends back the specified HTML page (home.ejs) as the
//     // HTTP response.
//     res.render("home");
// });

// Within a middleware function which does not end the request-response cycle
// (for eg., by using res.send(), res.render(), res.redirect(), etc.), we use
// the next() function (without any arguments) to execute the next middleware
// function in line.
// However, if an error argument is passed to next(), for eg., next(err), then
// all remaining middleware functions in the chain will get skipped except for
// those which are correspondingly set up to handle that error.

// To handle an error within an asynchronous function, we must catch and pass it
// to the next() function, where the next middleware function in line which is
// correspondingly set up to handle that error will get executed.
// However, an error that occurs within a synchronous function requires no extra
// work. Express will automatically catch and pass it to the next middleware
// function in line which is correspondingly set up to handle that error.
// In both cases, if no middleware function has been correspondingly set up to
// handle an error, then Express' built-in error handling middleware function
// will get executed, which is present at the end of the middleware function
// stack.

// app.get("/makerestaurant", async (req, res, next) => {
//     try {
//         // This creates a new Mongoose document.
//         const restaurant = new Restaurant({
//             title: "Bobby Snacks",
//             description: "Best Paneer Chilli in Asansol"
//         });

//         // This saves the specified Mongoose document to MongoDB as a MongoDB
//         // document within the restaurants MongoDB collection.
//         await restaurant.save();

//         res.send(restaurant);
//     } catch (err) {
//         next(err);
//     }
// });

app.use((req, res, next) => {
    // req.flash("success") returns an array containing the currently available
    // success flash messages with respect to the current session.
    // This makes that array available in every middleware function as the
    // res.locals.success variable and in every ejs file as the success
    // variable only for the current request-response cycle.
    res.locals.success = req.flash("success");

    res.locals.error = req.flash("error");

    // Passport checks the req.session object and assigns the currently
    // authenticated (logged in) user's details as an object to req.user with
    // respect to the current session.
    // req.user remains undefined if no user is currently logged in with respect
    // to the current session.
    res.locals.current_user = req.user;

    next();
});

// This is used to break up the routes into multiple files.
// So, instead of defining routes like app.get("/restaurants/", ...) in this
// file, we can define routes like router.get("/", ...) in a separate file
// (restaurants.js), and attach a prefix of "/restaurants" to every route
// defined in that file.
app.use("/restaurants", restaurant_routes);

// Similarly, we can attach a prefix of "/restaurants/:id/reviews" to every
// route defined in the reviews.js file.
app.use("/restaurants/:id/reviews", review_routes);

app.use(user_routes);

// app.all() calls the specified middleware function whenever there is any HTTP
// request with the specified path. "*" is a wildcard path which matches every
// path.
// There is no meaningful difference between app.use(fn) (or app.use("/", fn))
// and app.all("*", fn). However, for other paths, as described above, app.use()
// matches any path that starts with the specified path, whereas app.all() only
// matches exact paths.
app.all("*", (req, res, next) => {
    next(new ExpressError(404, "Page Not Found!"));
});

// Error-handling middleware functions have four arguments: err, req, res and
// next.
app.use((err, req, res, next) => {
    // This sets the default value for statusCode when destructuring, in case
    // it's undefined.
    const { statusCode = 500 } = err;

    // This is different from above where the statusCode variable, and not the
    // err object's statusCode property, gets the default value, as here the err
    // object's message property gets a value, in case it's undefined.
    if (!(err.message)) {
        err.message = "Oh No, Something Went Wrong!";
    }

    res.status(statusCode);
    res.render("error", { err });
});

// This starts up the server on port 3000 and calls the specified callback
// function.
app.listen(3000, () => {
    console.log("Serving on port 3000!");
});
