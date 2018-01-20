const mongoose = require("mongoose");

const mongoDB = process.env.MONGODB_URI;
mongoose.connect(mongoDB, {
  useMongoClient: true
});

//mongoose.Promise = global.Promise;
const db = mongoose.connection;
db.on("error", console.error.bind(console, "MongoDB connection error:"));

//import models
//require("./models/Profile");

const app = require("./index.js");
app.listen(process.env.PORT || 3500, function() {
  console.log(
    "Example app listening on port " + process.env.PORT || 3500 + "!"
  );
});
