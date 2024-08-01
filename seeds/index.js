// This file is used to clear the resto-find database and to seed it with sample
// restaurants in the beginning.

const mongoose = require("mongoose");
const Restaurant = require("../models/restaurant");
const cities = require("./cities");
const { prefixes, suffixes } = require("./helper");

mongoose.connect("mongodb://127.0.0.1:27017/resto-find");

const db = mongoose.connection;
db.on("error", console.error.bind(console, "connection error:"));
db.once("open", () => {
    console.log("Database Connected!");
});

const rand_element = array => array[Math.floor(Math.random() * array.length)];

const seed_db = async () => {
    await Restaurant.deleteMany({});

    for (let i = 0; i < 50; ++i) {
        // Because there are 1000 cities in cities.js.
        const rand = Math.floor(Math.random() * 1000);

        const restaurant = new Restaurant({
            title: `${rand_element(prefixes)} ${rand_element(suffixes)}`,
            location: `${cities[rand].city}, ${cities[rand].state}`,
            price: Math.floor(Math.random() * 900) + 100,
            description: "Lorem ipsum dolor sit amet consectetur adipisicing elit. Sit fuga praesentium recusandae, provident ex aut libero quaerat.Maxime sint nulla amet nesciunt officiis earum, laudantium hic consectetur ducimus fugit dolores.",

            // This is the id of the user "kushagrj", found by using mongosh.
            author: "6620362e9c1f3b028c5d36b3",

            // These are images which have already been uploaded to Cloudinary.
            images: [
                {
                    url: 'https://res.cloudinary.com/dyhzti25i/image/upload/v1715628238/RestoFind/wedknifopioh7wgziizk.jpg',
                    file_name: 'RestoFind/wedknifopioh7wgziizk'
                },
                {
                    url: 'https://res.cloudinary.com/dyhzti25i/image/upload/v1715628242/RestoFind/uraxzjldirylppsdsy14.jpg',
                    file_name: 'RestoFind/uraxzjldirylppsdsy14'
                }
            ]
        });

        await restaurant.save();
    }
};

// Since an async function returns a promise, therefore this closes the
// connection to MongoDB after the seed_db() function returns and the returned
// promise is resolved.
seed_db().then(() => {
    db.close();
});
