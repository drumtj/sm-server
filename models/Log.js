const mongoose = require("mongoose");
const deepPopulate = require('mongoose-deep-populate')(mongoose);
// const autoIncrement = require('mongoose-auto-increment');
const Schema = mongoose.Schema;
//mongoose.Schema.Types.Mixed
const logSchema = new mongoose.Schema({
  // number: {type: Number},
  browser: {type: Schema.Types.ObjectId, ref:'Browser'},
  bet365Id: {type: String},
  data: {type: mongoose.Schema.Types.Mixed, required:true}
},{
  timestamps: true
})

logSchema.plugin(deepPopulate);

// autoIncrement.initialize(mongoose.connection);
// logSchema.plugin(autoIncrement.plugin, {
//   model : 'Log',
//   field : 'number',
//   startAt : 0, //시작
//   increment : 1 // 증가
// });

// logSchema.statics.create = async function(payload){
//   const p = new this(payload);
//   await p.save();
//   return p;
// }

// logSchema.methods.

// userSchema.statics.find = function(id){
//   return this.findOne({socketId:id});
// }

// userSchema.statics.updateOne = function(socketId, data){
//   return this.findOneAndUpdate({socketId}, data, {new:true});
// }

module.exports = mongoose.models.Log || mongoose.model("Log", logSchema);
