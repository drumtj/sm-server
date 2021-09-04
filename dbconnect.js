const mongoose = require("mongoose");
const config = require("./config");
mongoose.Promise = require("bluebird");//global.Promise;
module.exports = mongoose.connect(config.DB_URI, {useNewUrlParser: true, useUnifiedTopology : true});
//
// .then(()=>console.log("Successfully connected to mongodb"))
// .catch(e=>console.error(e));
