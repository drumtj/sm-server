const mongoose = require("mongoose");
const deepPopulate = require('mongoose-deep-populate')(mongoose);
const autoIncrement = require('mongoose-auto-increment');
const Schema = mongoose.Schema;
// const Program = require('../models/Program');
// const config = require('../config');
//mongoose.Schema.Types.Mixed
const userSchema = new mongoose.Schema({
  number: {type: Number},
  name: {type: String},
  password: {type: String},
  birthday: {type: String},
  phone: {type: String},
  files: [{type: mongoose.Schema.Types.Mixed}],
  email: {type: String, required: true, unique:true},
  bank: {type: String},
  bankAccount: {type: String},
  // fromEmail: {type: String},
  recommender: {type: Schema.Types.ObjectId, ref: 'EventMember'},
  ip: {type: String},
  approved: {type: Boolean, default: false},
  approvedAt: {type: Date},
  removed: {type: Boolean, default: false},
  paid: {type: Boolean, default: false},
  paidAt: {type: Date},
  payCode: {type: String},
  recommenderPaid: {type: Boolean, default: false},
  recommenderPaidAt: {type: Date},
  recommenderPayCode: {type: String},
  sentOpentalk: {type: Boolean, default: false}
},{
  timestamps: true
})

userSchema.plugin(deepPopulate);

autoIncrement.initialize(mongoose.connection);
userSchema.plugin(autoIncrement.plugin, {
  model : 'EventMember',
  field : 'number',
  startAt : 0, //시작
  increment : 1 // 증가
});

// userSchema.plugin(deepPopulate, {
//   populate: {
//     'programs.browsers.logs': {
//       options: {
//         limit: 1000
//       }
//     }
//   }
// });



module.exports = mongoose.models.EventMember || mongoose.model("EventMember", userSchema);
