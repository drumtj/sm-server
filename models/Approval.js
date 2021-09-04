const mongoose = require("mongoose");
const deepPopulate = require('mongoose-deep-populate')(mongoose);
const autoIncrement = require('mongoose-auto-increment');
const Schema = mongoose.Schema;
//mongoose.Schema.Types.Mixed
// const Account = require('./Account');

const approvalSchema = new mongoose.Schema({
  number: {type: Number},
  title: {type: String},
  detail: {type: String},

  //[{com,data}]
  tasks: [{type: mongoose.Schema.Types.Mixed}],
  type: {type: String, enum: ["none", "deposit", "withdraw"], default:"none"},
  //요청자
  user: {type: Schema.Types.ObjectId, ref: 'User'},
  account: {type: Schema.Types.ObjectId, ref: 'Account'},
  data: {type:mongoose.Schema.Types.Mixed, default:{}},
  // 승인요청시작시 open, 마스터 승인시 approval, 마스터 반려시 reject
  status: {type: String, enum: ["open", "approval", "reject"], default:"open"},
  child: {type: Schema.Types.ObjectId, ref: 'Approval'},
  parent: {type: Schema.Types.ObjectId, ref: 'Approval'},
  level: {type: Number, default: 0}
},{
  timestamps: true
})

autoIncrement.initialize(mongoose.connection);
approvalSchema.plugin(deepPopulate);
approvalSchema.plugin(autoIncrement.plugin, {
  model : 'Approval',
  field : 'number',
  startAt : 0, //시작
  increment : 1 // 증가
});

// approvalSchema.statics.create = async function(payload){
//   const p = new this(payload);
//   await p.save();
//   return p;
// }

approvalSchema.statics.open = function(params){
  //name, detail, type, user
  return this.create(params);
}

approvalSchema.methods.next = async function({title, detail, tasks, user, data}){
  this.child = await mongoose.models.Approval.open({
    title: title || this.title,
    detail: detail || this.detail,
    tasks: tasks,
    parent: this,
    level: this.level + 1,
    account: this.account,
    user: user || this.user,
    type: this.type,
    data: data || this.data
  })
  await this.save();
  return this.child;
}

// remove
approvalSchema.methods.cancel = async function(){

  // account로부터 호출되므로 그곳에서 처리하자
  // if(this.account){
  //   if(this.account instanceof mongoose.Types.ObjectId){
  //     throw new Error("'account변수를' populate 하자");
  //     // this.account = await Account.findOne({_id:this.account});
  //   }
  //   this.account.depositApproval = null;
  //   await this.account.save();
  //   this.account = null;
  // }
  // this.account = null;
  if(this.child){
    if(!this.populated('child')){
      await this.populate('child');
    }
    // if(this.child instanceof mongoose.Types.ObjectId){
    //   this.child = await mongoose.models.Approval.findOne({_id:this.child});
    // }
    return this.child.cancel();
  }
  // if(this.parent){
  //   if(typeof this.parent === "string"){
  //     this.parent = await approvalSchema.findOne({_id:this.parent});
  //   }
  //   await this.child.cancel();
  // }
  return this.remove();
}

approvalSchema.methods.approval = async function(taskCallback){
  if(this.status == 'open'){
    if(this.parent){
      if(!this.populated('parent')){
        await this.populate('parent');
      }
      // if(this.parent instanceof mongoose.Types.ObjectId){
      //   this.parent = await mongoose.models.Approval.findOne({_id:this.parent}).populate("account");
      // }
      await this.parent.approval(taskCallback);
    }
    this.status = 'approval';

    if(Array.isArray(this.tasks)){
      for(let i=0; i<this.tasks.length; i++){
        let task = this.tasks[i];
        await taskCallback(task.com, task.data);
      }
    }
    this.tasks.length = 0;
  }
  return this.save();
}

// approvalSchema.methods.approval = function(){
//   this.status = 'approval';
//   return this.save();
// }

approvalSchema.methods.reject = async function(){
  if(this.status == 'open'){
    // if(this.child){
    //   if(this.child instanceof mongoose.Types.ObjectId){
    //     this.child = await mongoose.models.Approval.findOne({_id:this.child}).populate("account");
    //   }
    //   await this.child.reject();
    // }
    this.status = 'reject';
    // 승인대기중을 출금 요청중으로
    // if(this.account){
    //   if(this.account instanceof mongoose.Types.ObjectId){
    //     // throw new Error("'account변수를' populate 하자");
    //     this.account = await mongoose.models.Account.findOne({_id:this.account}).populate("depositApproval");;
    //   }
    //   await this.account.rejectDeposit();
    // }
  }
  return this.save();
}





// userSchema.statics.find = function(id){
//   return this.findOne({socketId:id});
// }

// userSchema.statics.updateOne = function(socketId, data){
//   return this.findOneAndUpdate({socketId}, data, {new:true});
// }

module.exports = mongoose.models.Approval || mongoose.model("Approval", approvalSchema);
