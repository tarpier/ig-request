const rp = require("request-promise");
const cheerio = require("cheerio");
const R = require("ramda");
const express = require("express");
const app = express();
const apiRoutes = express.Router();
const bodyParser = require("body-parser");
const morgan = require("morgan");
const jwt = require("jsonwebtoken");
const writeToDatabase = require("./helpers/writeToDatabase");
const User = require("./models/User");

app.use(function(req, res, next) {
  res.header("Access-Control-Allow-Origin", "*");
  res.header(
    "Access-Control-Allow-Headers",
    "Origin, X-Requested-With, Content-Type, Accept"
  );
  next();
});

app.set("superSecret", process.env.SECRET);
// use body parser so we can get info from POST and/or URL parameters
app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());

// use morgan to log requests to the console
app.use(morgan("dev"));

apiRoutes.use(function(req, res, next) {
  // check header or url parameters or post parameters for token
  var token =
    req.body.token || req.query.token || req.headers["x-access-token"];

  // decode token
  if (token) {
    // verifies secret and checks exp
    jwt.verify(token, app.get("superSecret"), function(err, decoded) {
      if (err) {
        return res.json({
          success: false,
          message: "Failed to authenticate token."
        });
      } else {
        // if everything is good, save to request for use in other routes
        req.decoded = decoded;
        next();
      }
    });
  } else {
    // if there is no token
    // return an error
    return res.status(403).send({
      success: false,
      message: "No token provided."
    });
  }
});

// =================
// Routes
// =================

// PROTECTED API ROUTES --------------------
apiRoutes.get("/", function(req, res) {
  res.json({ message: "nothing to see here" });
});

apiRoutes.get("/users", function(req, res) {
  User.find({}, (err, users) => {
    res.json(users);
  });
});

apiRoutes.get("/getinfo/:username", function(req, res) {
  const userName = req.params.username;
  const options = {
    uri: `https://www.instagram.com/${userName}`
  };

  getProfileScriptData = options => {
    return new Promise((resolve, reject) => {
      rp(options.uri)
        .then(html => {
          const $ = cheerio.load(html, {
            ignoreWhitespace: true,
            xmlMode: false
          });

          //cut the script so that an data objcet comes out TODO: needs to be hardened
          script = $("body").children("script");
          const rawData = script[0].children[0].data;
          const dataObj = JSON.parse(rawData.slice(21, -1));

          resolve(dataObj);
        })
        .catch(err => {
          // Crawling failed or Cheerio choked...
          reject(Error(err));
        });
    });
  };

  const extractMediaInfo = object => {
    let returnVal = [];
    const media = object.entry_data.ProfilePage[0].user.media.nodes;
    media.map(item => {
      returnVal.push({
        id: item.id,
        likes: item.likes.count,
        comments: item.comments.count,
        thumbnail: item.thumbnail_src,
        isVideo: item.is_video
      });
    });

    return returnVal;
  };

  const extractUserInfo = object => {
    const objectPath = object.entry_data.ProfilePage[0].user;

    let bio = "";
    if (
      typeof objectPath.biography !== "undefined" ||
      objectPath.biography !== null
    ) {
      bio = objectPath.biography.toString();
    }

    const userInfo = {
      id: objectPath.id,
      fullName: objectPath.full_name,
      userName: objectPath.username,
      follows: objectPath.follows.count,
      followedBy: objectPath.followed_by.count,
      bio: bio,
      totalMedia: objectPath.media.count
    };

    return userInfo;
  };

  getProfileScriptData(options).then(data => {
    let likeCount = 0;
    let commentsCount = 0;
    let counter = 0;

    const mediaData = extractMediaInfo(data);
    mediaData.map(image => {
      counter++;
      likeCount += image.likes;
      commentsCount += image.comments;
    });

    const result = {
      ...extractUserInfo(data),
      amount: counter,
      like: likeCount,
      comments: commentsCount,
      media: mediaData
    };

    writeToDatabase(result);
    res.send(result);
    console.log("scrape successful");
  });
});

app.use("/api", apiRoutes);

// UNPROTECTED PUBLIC ROUTES ----------------
app.get("/", function(req, res) {
  res.json({ message: "nothing to see here" });
});

app.post("/authenticate", function(req, res) {
  // find the user
  User.findOne(
    {
      name: req.body.name
    },
    function(err, user) {
      if (err) throw err;

      if (!user) {
        res.json({
          success: false,
          message: "Authentication failed. User not found."
        });
      } else if (user) {
        // check if password matches
        if (user.password != req.body.password) {
          res.json({
            success: false,
            message: "Authentication failed. Wrong password."
          });
        } else {
          // if user is found and password is right
          // create a token with only our given payload
          // we don't want to pass in the entire user since that has the password
          const payload = {
            admin: user.admin
          };
          var token = jwt.sign(payload, app.get("superSecret"));

          // return the information including token as JSON
          res.json({
            success: true,
            message: "Enjoy your token!",
            token: token
          });
        }
      }
    }
  );
});

/* app.get("/setup", function(req, res) {
  // create a sample user
  var nick = new User({
    name: "Nick Cerminara",
    password: "password",
    admin: true
  });

  // save the sample user
  nick.save(function(err) {
    if (err) throw err;

    console.log("User saved successfully");
    res.json({ success: true });
  });
}); */

module.exports = app;
