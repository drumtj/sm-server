const mongoose = require("mongoose");
const deepPopulate = require('mongoose-deep-populate')(mongoose);
const autoIncrement = require('mongoose-auto-increment');
const Schema = mongoose.Schema;

const Approval = require('./Approval');
const User = require('./User');
const {comma} = require('../utils');
// const Browser = require('./Browser');
//mongoose.Schema.Types.Mixed
const accountSchema = new mongoose.Schema({
  number: {type: Number},
  id: {type: String, required: true, unique: true},
  pw: {type: String, required: true},

  digit4: {type: String},
  skrillEmail: {type: String},
  skrillId: {type: String},
  skrillPw: {type: String},
  skrillCode: {type: String},

  country: {type: String},

  // 계정을 소유한 회원을 연결
  user: {type: Schema.Types.ObjectId, ref: 'User'},
  memo: {type: String},

  startBetCount: {type: Number, default: 0},
  betCount: {type: Number, default: 0},

  // money 업데이트시 startMoney가 0인경우 설정할것
  startMoney: {type: Number, default: 0},
  money: {type: Number, default: 0},
  // 짤짤이
  limited: {type: Boolean, default: false},
  // 졸업
  died: {type: Boolean, default: false},
  // 계정이 연결된 브라우져를 연결
  browser: {type: Schema.Types.ObjectId, ref: 'Browser'},
  // 유저가 제거하면 true
  trash: {type: Boolean, default: false},
  // 첫충전 완료여부
  firstCharged: {type: Boolean, default: false},
  // 관리페이지에서 제거할때 true
  removed: {type: Boolean, default: false},
  // 출금요청 -> 기본 null, 요청시 requested, 마스터승인대기시 outstanding, 마스터승인시 complete
  depositStatus: {type: String, enum:[null, 'requested', 'outstanding', 'complete'], default: null},
  depositMoney: {type: Number, default: 0},
  depositApproval: {type: Schema.Types.ObjectId, ref: 'Approval'},
  depositDate: {type: Date}
},{
  timestamps: true
})

autoIncrement.initialize(mongoose.connection);

accountSchema.plugin(deepPopulate);
accountSchema.plugin(autoIncrement.plugin, {
  model : 'Account',
  field : 'number',
  startAt : 0, //시작
  increment : 1 // 증가
});


// accountSchema.statics.create = async function(payload){
//   const p = new this(payload);
//   await p.save();
//   return p;
// }

accountSchema.methods.disconnectBrowser = async function(){
  if(this.browser){
    if(this.browser instanceof mongoose.Types.ObjectId){
      throw new Error("'browser변수를' populate 하자");
      // this.browser = await Browser.findOne({_id:this.browser});
    }
    // let pid = this.browser.program._id;
    // let bid = this.browser._id;

    this.browser.account = null;
    await this.browser.save();
    this.browser = null;
    this.save();
  }

  // return this.save();
  // return this;
}

// 관리자의 요청을 반려. 출금 요청중으로
accountSchema.methods.rejectDeposit = async function(){
  this.depositStatus = 'requested';
  // 반려한다고 지우는거아님.
  // if(this.depositApproval){
  //   if(this.depositApproval instanceof mongoose.Types.ObjectId){
  //     // throw new Error("'depositApproval변수를' populate 하자");
  //     console.log("@@@@@@@@@@@@@@@@@@@@@@@");
  //     this.depositApproval = await Approval.findOne({_id:this.depositApproval});
  //   }
  //   await this.depositApproval.cancel();
  //   // await account.depositApproval.remove();
  //   // account.depositApproval = null;
  // }
  return this.save();
}

//유저의 요청을 반려
accountSchema.methods.rejectRequestDeposit = async function(){
  this.depositStatus = null;
  // if(this.depositApproval){
  //   // console.log("@@@@@@@@@@2", this.depositApproval instanceof mongoose.Types.ObjectId);
  //   // console.log("@@@@@@@@@", this.depositApproval);
  //   if(this.depositApproval instanceof mongoose.Types.ObjectId){
  //     // throw new Error("'depositApproval변수를' populate 하자");
  //     this.depositApproval = await Approval.findOne({_id:this.depositApproval});
  //   }
  //   // console.log("@@@@@@@@@@3", this.depositApproval instanceof mongoose.Types.ObjectId);
  //   await this.depositApproval.cancel();
  //   this.depositApproval = null;
  //
  //   // await account.depositApproval.remove();
  //   // account.depositApproval = null;
  // }
  return this.save();
}

// 관리자가 마스터에게 요청
accountSchema.methods.requestApprovalDeposit = async function(money, user){
  this.depositMoney = money;
  this.depositStatus = 'outstanding';
  if(this.depositApproval){
    if(this.depositApproval instanceof mongoose.Types.ObjectId){
      throw new Error("'depositApproval변수를' populate 하자");
      // this.depositApproval = await Approval.findOne({_id:this.depositApproval});
    }
    if(this.user instanceof mongoose.Types.ObjectId){
      this.user = await mongoose.models.Account.findOne({_id:this.user});
    }
    await this.depositApproval.next({
      data: {
        bet365Id: this.id,
        receiverEmail: this.user.email,
        depositMoney: money
      },
      detail: `bet365 <span class="text-success">${this.id}</span>의 <span class="text-warning">$${comma(money)}</span>를 출금 처리하였고, <span class="text-info">${this.user.email}</span>의 지갑으로 송금 승인을 요청합니다.`,
      tasks: [
        {com:"deposit", data:{aid:this._id}}
        // {com:"refreshMoney", data:{uid:this.user._id}}
      ],
      // 요청자
      user: user._id
    })
  }
  return this.save();
}

// 마스터가 실제 deposit처리
// accountSchema.methods.deposit = async function(money){
//   if(money !== undefined){
//     this.depositMoney = money;
//   }else{
//     money = this.depositMoney;
//   }
//   this.depositStatus = 'complete';
//   //account.depositMoney = money
//   this.money = 0;
//   this.trash = true;
//   // updateData.money = 0;
//   await User.updateOne({_id:this.user}, {$inc:{wallet:money}});
//   return this.save();
// }

// 일반유저가 관리자에게 요청
accountSchema.methods.requestDeposit = async function(user){
  this.depositStatus = 'requested';
  this.depositDate = new Date();

  let ap = await Approval.open({
    title: "벳삼 출금 요청",
    detail: `출금을 요청합니다.`,
    type: "deposit",
    user: user._id,
    account: this._id
  })
  this.depositApproval = ap;

  return this.disconnectBrowser();
}



// userSchema.statics.find = function(id){
//   return this.findOne({socketId:id});
// }

// userSchema.statics.updateOne = function(socketId, data){
//   return this.findOneAndUpdate({socketId}, data, {new:true});
// }

module.exports = mongoose.models.Account || mongoose.model("Account", accountSchema);
