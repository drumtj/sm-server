const mongoose = require("mongoose");
const Schema = mongoose.Schema;
//mongoose.Schema.Types.Mixed
const benEventSchema = new mongoose.Schema({
  // bet365Id: {type: String},
  betburgerEventId: {type: String},
  key: {type: String},
  expire: {type: Date, default:null},
  msg: {type: String},
  dataType: {type:String}
  //BK, EK
  // type: {type: String},
  // count: {type: Number, default: 0},
  // maxCount: {type: Number, default: 0}
},{
  timestamps: true
})

// optionSchema.statics.create = function(payload){
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

// optionSchema.statics.updateOne = function(_id, data){
//   return this.updateOne({_id}, data);
// }

module.exports = mongoose.models.BenEvent || mongoose.model("BenEvent", benEventSchema);
