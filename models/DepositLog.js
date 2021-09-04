const mongoose = require("mongoose");
// const autoIncrement = require('mongoose-auto-increment');
const Schema = mongoose.Schema;
//mongoose.Schema.Types.Mixed
const depositLogSchema = new mongoose.Schema({
  // 돈 지급 대상
  user: {type: Schema.Types.ObjectId, ref: 'User'},

  // 시행자 (master or system)
  from: {type: String},

  money: {type: Number},

  memo: {type: String},

  type: {type: String}, //"withdraw", "deposit"

  moneyName: {type: String} //"money", "wallet"
},{
  timestamps: true
})

// autoIncrement.initialize(mongoose.connection);
// betDataSchema.plugin(autoIncrement.plugin, {
//   model : 'Setting',
//   field : 'number',
//   startAt : 0, //시작
//   increment : 1 // 증가
// });

// depositLogSchema.statics.create = function(payload){
//   const p = new this(payload);
//   return p.save();
// }

// optionSchema.statics.find = function(_id){
//   return this.find(_id?{_id}:undefined);
//   // if(_id){
//   // }
// }
//
// optionSchema.statics.findOne = function(_id){
//   return this.findOne({_id});
// }

// settingSchema.statics.updateOne = function(_id, data){
//   return this.updateOne({_id}, data);
// }

module.exports = mongoose.models.DepositLog || mongoose.model("DepositLog", depositLogSchema);
