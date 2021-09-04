const mongoose = require("mongoose");
const Schema = mongoose.Schema;
//mongoose.Schema.Types.Mixed
const withdrawSchema = new mongoose.Schema({
  id: {type: String},
  // status: {type: String, enum:["requested", "rejected", "approved"]},
  money: {type: Number, default: 0},
  type: {type: String, enum:["site", "bookmaker", "wallet"]},
  user: {type: Schema.Types.ObjectId, ref: 'User'},
  approval: {type: Schema.Types.ObjectId, ref: 'Approval'}
},{
  timestamps: true
})

// withdrawSchema.statics.open = async function(data){
//   data.approval = await Approval.open({
//     title: "벳삼 출금 요청",
//     detail: `<span class="text-warning">${data.money}</span>`,
//     type: "withdraw",
//     user: data.user
//   })
//   return this.create(data);
// }

// withdrawSchema.methods.requestWithdraw = async function(){
//   let ap = await Approval.open({
//     title: "벳삼 출금 요청",
//     detail: `출금을 요청합니다.`,
//     type: "deposit",
//     user: user._id,
//     account: this._id
//   })
//   this.approval = ap;
//   return this.save();
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

module.exports = mongoose.models.Withdraw || mongoose.model("Withdraw", withdrawSchema);
