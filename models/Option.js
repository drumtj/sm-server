const mongoose = require("mongoose");
const Schema = mongoose.Schema;
//mongoose.Schema.Types.Mixed
const optionSchema = new mongoose.Schema({
  name: {type: String, required: true},
  permission: {type: String},
  data: {type: Schema.Types.Mixed, default:{}}
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

module.exports = mongoose.models.Option || mongoose.model("Option", optionSchema);
