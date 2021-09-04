const mongoose = require("mongoose");
const Schema = mongoose.Schema;
// mongoose.Schema.Types.Mixed
// user: {type: Schema.Types.ObjectId, ref: 'User'}
const schema = new mongoose.Schema({
  name: String,
  name_kor: String,
  sports: String,
  country: String
})

module.exports = mongoose.models.League || mongoose.model("League", schema);
