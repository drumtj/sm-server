const mongoose = require("mongoose");
const deepPopulate = require('mongoose-deep-populate')(mongoose);
const Schema = mongoose.Schema;
const Browser = require('../models/Browser');
const Account = require('../models/Account');
const Proxy = require('../models/Proxy');
const Log = require('../models/Log');
//mongoose.Schema.Types.Mixed
const programSchema = new mongoose.Schema({
  name: {type: String},
  user: {type: Schema.Types.ObjectId, ref: 'User'},
  browsers: [{type: Schema.Types.ObjectId, ref:'Browser'}]
},{
  timestamps: true
})

programSchema.plugin(deepPopulate);

// programSchema.statics.create = async function(payload){
//   // console.log('create program');
//   const p = new this(payload);
//   await p.save();
//   return p;
// }

programSchema.methods.addBrowser = async function(){//(bid){
  try {
    // if(bid){
    //   let account = await Account.findOne({id:bid})
    //   if(account){
    //     data.account = account._id;
    //   }
    // }
    let data = {user:this.user._id, program:this._id, logs:[]};
    let p = await Browser.create(data);
    this.browsers.push(p);
    this.save();
    return p;

  }catch(e){
    console.error(e);
  }
}

programSchema.methods.removeBrowserAll = async function(){
  for(let i=0; i<this.browsers.length; i++){
    await this.removeBrowser(this.browsers[i]._id);
  }
  this.browsers = [];
  await this.save();
}

programSchema.methods.removeBrowser = async function(_bid){
  this.browsers.pull({_id:_bid});
  try{
    // Browser. 제거
    await Browser.deleteOne({_id:_bid});
    // Account. 연결된 브라우져 정보를 없애야한다.
    await Account.updateOne({browser:_bid}, {browser:null});
    await Proxy.updateOne({browser:_bid}, {browser:null});
    // 브라우져에 해당하는 log를 제거
    await Log.deleteMany({browser:_bid});
  }catch(e){
    console.error(e);
  }
  // await Browser.findByIdAndRemove(_bid);
  return this.save();
}

// userSchema.statics.find = function(id){
//   return this.findOne({socketId:id});
// }

// userSchema.statics.updateOne = function(socketId, data){
//   return this.findOneAndUpdate({socketId}, data, {new:true});
// }

module.exports = mongoose.models.Program || mongoose.model("Program", programSchema);
