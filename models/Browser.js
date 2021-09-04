const mongoose = require("mongoose");
const deepPopulate = require('mongoose-deep-populate')(mongoose);
const Schema = mongoose.Schema;
// const config = require('../config');
//mongoose.Schema.Types.Mixed
const browserSchema = new mongoose.Schema({
  account: {type: Schema.Types.ObjectId, ref: 'Account'},
  user: {type: Schema.Types.ObjectId, ref: 'User'},
  program: {type: Schema.Types.ObjectId, ref: 'Program'},
  option: {type: Schema.Types.ObjectId, ref: 'Option'},
  used: {type: Boolean},
  // proxy ip 적용
  // ex) "124.198.111.32:11959"
  proxy: {type: Schema.Types.ObjectId, ref: 'Proxy'}
  // logs: [mongoose.Schema.Types.Mixed]
  // logs: [new Schema({
  //   data: {type: mongoose.Schema.Types.Mixed, required:true},
  //   createdAt: {type: Date},
  //   updatedAt: {type: Date}
  // },{_id:false})]
  // logs: [{type: Schema.Types.ObjectId, ref: 'Log'}]
},{
  timestamps: true
})

browserSchema.plugin(deepPopulate);

// browserSchema.statics.create = async function(payload){
//   const p = new this(payload);
//   await p.save();
//   return p;
// }

// browserSchema.methods.test = function(){
//   console.log("????", this.logs);
// }

// browserSchema.methods.log = async function(data){
//   // console.log(this.account.id, msg);
//   if(!data) return;
//   if(!this.logs){
//     console.log("@@@ new array");
//     this.logs = [];
//   }
//   if(data.isSame && this.logs.length > 0){
//     console.log("@@@ update log");
//     let last = this.logs[this.logs.length-1];
//     last.data = data;
//     last.updatedAt = new Date();
//   }else{
//     console.log("@@@ push log");
//     this.logs.push({
//       data,
//       createdAt: new Date(),
//       updatedAt: new Date()
//     })
//   }
//   if(this.logs.length+1 == config.MAX_LOG_LENGTH){
//     console.log("@@@ shift");
//     this.logs.shift();
//   }else if(this.logs.length+1 > config.MAX_LOG_LENGTH){
//     console.log("@@@ slice");
//     this.logs = this.logs.slice(0, config.MAX_LOG_LENGTH);
//   }
//   // this.markModified('logs');
//   await this.save();
// }




// userSchema.statics.find = function(id){
//   return this.findOne({socketId:id});
// }

// userSchema.statics.updateOne = function(socketId, data){
//   return this.findOneAndUpdate({socketId}, data, {new:true});
// }

module.exports = mongoose.models.Browser || mongoose.model("Browser", browserSchema);
