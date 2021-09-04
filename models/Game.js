const mongoose = require("mongoose");
const Schema = mongoose.Schema;
// mongoose.Schema.Types.Mixed
// user: {type: Schema.Types.ObjectId, ref: 'User'}
const schema = new mongoose.Schema({
  // dateStr+time+sports++leagueName+home+away
  key: String,
  // dateStr+sports++leagueName+home+away
  key2: String,
  settled: {type:Boolean, default:false},
  live: {type:Boolean, default:false},
  league: {type: Schema.Types.ObjectId, ref: 'League'},
  home: {type: Schema.Types.ObjectId, ref: 'Team'},
  away: {type: Schema.Types.ObjectId, ref: 'Team'},
  sports: String,
  // 1x2
  result: String,
  time: String,
  liveTime: String,
  dateStr: String,
  date: Date,
  homeScore: {type: Number, default: 0},
  awayScore: {type: Number, default: 0},
  cancelMemo: {type:String, default: ""}
})

module.exports = mongoose.models.Game || mongoose.model("Game", schema);
