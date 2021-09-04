const mongoose = require("mongoose");
const deepPopulate = require('mongoose-deep-populate')(mongoose);
const autoIncrement = require('mongoose-auto-increment');
const Schema = mongoose.Schema;
const Program = require('../models/Program');
// const config = require('../config');
//mongoose.Schema.Types.Mixed
const userSchema = new mongoose.Schema({
  number: {type: Number},
  email: {type: String, required: true, unique:true},
  password: {type: Object, required: true},
  allowed: {type: Boolean, default: false},
  master: {type: Boolean, default: false},
  authority: {type: mongoose.Schema.Types.Mixed, default:null},
  // authority: {type: Object, default:null},
  money: {type: Number, default: 0},
  wallet: {type: Number, default: 0},
  bet365Money: {type: Number, default: 0},
  programs: [{type: Schema.Types.ObjectId, ref: 'Program'}],
  ip: {type: String},
  // 프로그램 수 제한
  programCount: {type: Number, default: 0},
  // 브라우져 수 제한
  browserCount: {type: Number, default: 0}
},{
  timestamps: true
})

userSchema.plugin(deepPopulate);

autoIncrement.initialize(mongoose.connection);
userSchema.plugin(autoIncrement.plugin, {
  model : 'User',
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

// userSchema.statics.create = async function(payload){
//   const p = new this(payload);
//   await p.save();
//   return p;
// }

userSchema.methods.addProgram = async function(p){
  // console.log('add program');
  if(!p){
    p = await Program.create({user:this._id});
  }
  this.programs.push(p);
  await this.save();
  return p;
}

userSchema.methods.removeProgram = async function(pid){
  this.programs.pull({_id:pid});
  try{
    let program = await Program.findOne({_id:pid});
    if(program){
      await program.removeBrowserAll();
    }
    await Program.deleteOne({_id:pid});
    // let program = await Program.findOne({_id:pid});
    // if(program){
    //   program.remove();
    // }
  }catch(e){
    console.error(e);
  }
  return this.save();
}

// userSchema.statics.find = function(id){
//   return this.findOne({socketId:id});
// }

// userSchema.statics.updateOne = function(socketId, data){
//   return this.findOneAndUpdate({socketId}, data, {new:true});
// }

module.exports = mongoose.models.User || mongoose.model("User", userSchema);
