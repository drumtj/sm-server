const mongoose = require("mongoose");
const autoIncrement = require('mongoose-auto-increment');
// const deepPopulate = require('mongoose-deep-populate')(mongoose);
const Schema = mongoose.Schema;
//mongoose.Schema.Types.Mixed
const schema = new mongoose.Schema({
  number: {type: Number},
  proxyHttp: {type: String},
  expire: {type: Date},
  browser: {type: Schema.Types.ObjectId, ref:'Browser'},
  user: {type: Schema.Types.ObjectId, ref: 'User'},
  removed: {type: Boolean, default: false},
  trash: {type: Boolean, default: false},
  country: {type: String, default: "KR"},
  historyOfUse: {type: Boolean, default: false},
  price: {type: Number, default: 0}
},{
  timestamps: true
})

autoIncrement.initialize(mongoose.connection);

// schema.plugin(deepPopulate);
schema.plugin(autoIncrement.plugin, {
  model : 'Proxy',
  field : 'number',
  startAt : 0, //시작
  increment : 1 // 증가
});

// schema.methods.disconnectBrowser = async function(){
//   console.error("?", this.browser);
//   if(this.browser){
//     if(this.browser instanceof mongoose.Types.ObjectId){
//       throw new Error("'browser변수를' populate 하자");
//       // this.browser = await Browser.findOne({_id:this.browser});
//     }
//     // if(!this.populated('browser')){
//     //   this.browser = await this.populate('browser');
//     //   console.log("!!", this.browser);
//     // }
//     console.error("#1");
//     this.browser.proxy = null;
//     await this.browser.save();
//     this.browser = null;
//     console.error("#2");
//     return this.save();
//   }
// }

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

module.exports = mongoose.models.Proxy || mongoose.model("Proxy", schema);
