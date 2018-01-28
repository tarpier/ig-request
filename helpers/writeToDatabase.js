//const Profile = require("../models/Profile");

writeToDatabase = resultObj => {
  const newProfile = Profile({
    id: resultObj.id,
    fullName: resultObj.fullName,
    userName: resultObj.userName,
    follows: resultObj.follows,
    followedBy: resultObj.followedBy,
    bio: resultObj.bio,
    totalMedia: resultObj.totalMedia,
    amount: resultObj.amount,
    like: resultObj.like,
    comments: resultObj.comments,
    media: resultObj.media
  });

  newProfile.save(err => {
    if (err) throw err;

    console.log("result logged");
  });
};
module.exports = writeToDatabase;
