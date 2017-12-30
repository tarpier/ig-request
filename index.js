const rp = require("request-promise");
const cheerio = require("cheerio");
const R = require("ramda");
const express = require("express");
const app = express();

app.get("/getinfo/:username", function(req, res) {
  const userName = req.params.username;
  const options = {
    uri: `https://www.instagram.com/${userName}`
    //uri: "https://www.instagram.com/explore/tags/ichbingntm2018/"
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
    const userInfo = {
      id: objectPath.id,
      fullName: objectPath.full_name,
      userName: objectPath.username,
      follows: objectPath.follows.count,
      followedBy: objectPath.followed_by.count,
      bio: objectPath.biography.toString(),
      totalMedia: objectPath.media.count
    };

    return userInfo;
  };

  getProfileScriptData(options).then(data => {
    /* const profile = {
    user: extractUserInfo(data),
    media: extractMediaInfo(data)
  }; */

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
      user: extractUserInfo(data),
      amount: counter,
      like: likeCount,
      comments: commentsCount,
      media: mediaData
    };

    res.send(result);
    console.log(result);
  });
});

app.listen(3500, function() {
  console.log("Example app listening on port 3500!");
});
