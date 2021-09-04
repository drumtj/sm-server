const mongoose = require("mongoose");
const Schema = mongoose.Schema;
//mongoose.Schema.Types.Mixed
const withdrawSchema = new mongoose.Schema({
  // id: {type: String},
  // status: {type: String, enum:["requested", "rejected", "approved"]},
  // 출금요청 금액
  withdraw: {type: Number, default: 0},
  // 환전 수수료
  commission: {type: Number, default: 0},
  account: {type: Schema.Types.ObjectId, ref: 'Account'},
  user: {type: Schema.Types.ObjectId, ref: 'User'},
  // 관리자의 실제 돈 확인여부
  // check: {type: Boolean, default: false},
  checker: {type: Schema.Types.ObjectId, ref: 'User'},
  checkDate: {type: Date}
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

module.exports = mongoose.models.AccountWithdraw || mongoose.model("AccountWithdraw", withdrawSchema);
