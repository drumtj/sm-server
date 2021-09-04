const mongoose = require("mongoose");
// const autoIncrement = require('mongoose-auto-increment');
const Schema = mongoose.Schema;

//mongoose.Schema.Types.Mixed
const betDataSchema = new mongoose.Schema({
  // 배팅완료시 입력할요소들
  // bet365id
  account: {type: Schema.Types.ObjectId, ref: 'Account'},
  // member
  user: {type: Schema.Types.ObjectId, ref: 'User'},
  // uniqueRequestId
  event: {type: String, ref: 'Event'},



  betId: {type: Number},
  betType: {type: String},
  sportName: {type: String},
  eventName: {type: String},

  //site(pinnacle) odds
  siteOdds: {type: Number},
  //site stake
  siteStake: {type: Number},
  //bet365 odds
  bookmakerOdds: {type: Number},
  //bet365 stake
  bookmakerStake: {type: Number},
  // profit: {type: Number},
  // profitP: {type: Number},



  // 피나클 결과처리시 채워넣을 요소들

  betStatus: {type: String, default: "ACCEPTED"}//"WON"
  // ftTeam1Score: {type: Number},//4
  // ftTeam2Score: {type: Number},//2
  // // Win-Loss for settled bets.
  // winLoss: {type: Number},//1
  // // Client’s commission on the bet.
  // // 베팅에 대한 고객의 커미션.
  // customerCommission: {type: Number},
  // cancellationReason: {type: Schema.Types.Mixed}
},{
  timestamps: true
})



// autoIncrement.initialize(mongoose.connection);
// betDataSchema.plugin(autoIncrement.plugin, {
//   model : 'Setting',
//   field : 'number',
//   startAt : 0, //시작
//   increment : 1 // 증가
// });

// betDataSchema.statics.create = function(payload){
//   const p = new this(payload);
//   return p.save();
// }

betDataSchema.methods.resultProcess = async function(MoneyManager, betStatus){
  betStatus = betStatus || this.betStatus;
  if(this.user){
    if(betStatus == "WON"){
      console.log(`---- Settled Bet: WON ----`);
      // console.log(`-- user: ${this.user.email}`);
      // console.log(`-- account: ${betData.account.id}`);
      console.log(`-- result: ${this.siteOdds * this.siteStake}`);
      // betData.user.money += bets.price * betData.siteStake;
      await MoneyManager.depositMoney(this.user._id, this.siteOdds * this.siteStake, `bet <span class="text-info">WON</span> result (odds:${this.siteOdds}, stake:${this.siteStake})`);
    }else if(betStatus == "REFUNDED" || betStatus == "CANCELLED"){
      console.log(`---- Settled Bet: ${betStatus} ----`)
      // console.log(`-- user: ${betData.user.email}`);
      // console.log(`-- account: ${betData.account.id}`);
      console.log(`-- result: ${this.siteStake}`);
      // console.log("TEST:", bets.betStatus, betData.user.money, '+', betData.siteStake);
      // betData.user.money += betData.siteStake;
      await MoneyManager.depositMoney(this.user._id, this.siteStake, `bet <span class="text-warning">${this.betStatus}</span> result`);
    }
  }
  this.betStatus = betStatus;
  return this.save();
}

betDataSchema.methods.refundProcess = async function(MoneyManager){
  if(this.user){
    if(this.betStatus == "WON"){
      await MoneyManager.withdrawMoney(this.user._id, this.siteOdds * this.siteStake, `결과처리 수정으로 인한 반환 <span class="text-info">WON</span> result (odds:${this.siteOdds}, stake:${this.siteStake})`);
    }else if(this.betStatus == "REFUNDED" || this.betStatus == "CANCELLED"){
      await MoneyManager.withdrawMoney(this.user._id, this.siteStake, `결과처리 수정으로 인한 반환 <span class="text-warning">${this.betStatus}</span> result`);
    }
  }
}
//
// optionSchema.statics.findOne = function(_id){
//   return this.findOne({_id});
// }

// settingSchema.statics.updateOne = function(_id, data){
//   return this.updateOne({_id}, data);
// }

module.exports = mongoose.models.BetData || mongoose.model("BetData", betDataSchema);
