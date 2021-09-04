const mongoose = require("mongoose");
// const autoIncrement = require('mongoose-auto-increment');
const Schema = mongoose.Schema;
//mongoose.Schema.Types.Mixed
const eventSchema = new mongoose.Schema({
  // number: {type: Number},
  // uniqueRequestId
  _id: {type: String},// unique:true, required:true},
  betburger: {type: Schema.Types.Mixed, default: null},
  // bet365 page event info
  bookmaker: {type: Schema.Types.Mixed, default: null},

  pncLine: {type: Schema.Types.Mixed, default: null},
  // //peid + ':' + beid
  // matchId: {type: String},
  // //pinnacle betburger event id
  // peId: {type: String},
  // //bet365 betburger event id
  // beId: {type: String}

  // checker browser id
  bid: {type: String},

  betId: {type: Number},//1234563

  // "ACCEPTED" "CANCELLED" "LOSE" "PENDING_ACCEPTANCE" "REFUNDED" "NOT_ACCEPTED" "WON"
  // 베팅이 수락되었습니다.
  // ACCEPTED = Bet was accepted,
  // 피나클 베팅 규칙에 따라 베팅이 취소됩니다.
  // CANCELLED = Bet is cancelled as per Pinnacle betting rules,
  // 베팅은 패배로 정산됩니다.
  // LOSE = The bet is settled as lose,
  // 이 상태는 라이브 베팅에만 예약됩니다. 라이브 베팅이 위험 구역에 걸렸거나 라이브 지연이 적용되면 PENDING_ACCEPTANCE가되고 그렇지 않으면 ACCEPTED 상태가됩니다. 이 상태에서 베팅은 ACCEPTED 또는 NOT_ACCEPTED 상태로 이동할 수 있습니다
  // PENDING_ACCEPTANCE = This status is reserved only for live bets. If a live bet is placed during danger zone or live delay is applied, it will be in PENDING_ACCEPTANCE , otherwise in ACCEPTED status. From this status bet can go to ACCEPTED or NOT_ACCEPTED status,
  // 이벤트가 취소되거나 베팅이 푸시로 정산되면 베팅은 REFUNDED 상태가됩니다
  // REFUNDED = When an event is cancelled or when the bet is settled as push, the bet will have REFUNDED status,
  // 베팅이 수락되지 않았습니다. 베팅이 이전에 PENDING_ACCEPTANCE 상태였던 경우에만이 상태가 될 수 있습니다.
  // NOT_ACCEPTED = Bet was not accepted. Bet can be in this status only if it was previously in PENDING_ACCEPTANCE status,
  // 베팅은 승리로 정산됩니다.
  // WON = The bet is settled as won
  betStatus: {type: String},//"WON"
  betStatus2: {type: String},//"WON"
  betType: {type: String},//"SPREAD"
  eventId: {type: Number},//1246144415
  eventStartTime: {type: Date},//"2021-01-20T16:00:00Z"

  handicap: {type: Number},//-1.5
  isLive: {type: Boolean},//true
  leagueId: {type: Number},//149037
  leagueName: {type: String},//"Russia - Junior Hockey League (MHL)"
  oddsFormat: {type: String},//"DECIMAL"
  periodNumber: {type: Number},//0
  placedAt: {type: Date},//"2021-01-20T17:48:52Z"
  price: {type: Number},//1.819

  // Pitcher name of team1. Only for bets on baseball.
  // 팀 1의 투수 이름. 야구 베팅에만 해당됩니다.
  pitcher1: {type: String},
  pitcher2: {type: String},

  // Enum: true false
  // Whether the team1 pitcher must start. Only for bets on baseball.
  // 1 팀 투수가 시작해야하는지 여부. 야구 베팅에만 해당됩니다.
  pitcher1MustStart: {type: Boolean},
  pitcher2MustStart: {type: Boolean},

  // .End of period team 1 score, only for settled bets. If the bet was placed on Game period (periodNumber =0) , this will be null .
  // 기간 종료 팀 1 점수, 정산 된 베팅에 대해서만. 게임 기간 (periodNumber = 0)에 베팅을 한 경우 이는 null이됩니다.
  pTeam1Score: {type: Number},
  pTeam2Score: {type: Number},

  risk: {type: Number},//1.22
  settledAt: {type: Date},//"2021-01-20T18:35:42Z"
  sportId: {type: Number},//19
  sportName: {type: String},//"Hockey"
  side: {type: String},
  team1: {type: String},//"Mikhaylov Academy U20"
  team2: {type: String},//"Kapitan Stupino U21"
  teamName: {type: String},//"Mikhaylov Academy U20"

  // Team 1 score that the bet was placed on, only for live bets.
  // 라이브 베팅에 대해서만 베팅이 이루어진 팀 1 점수.
  team1Score: {type: Number},
  team2Score: {type: Number},

  uniqueRequestId: {type: String},//"3e8d4e43-65fc-4503-a9e5-368edc15b0cd"
  updateSequence: {type: Number},//880070731
  wagerNumber: {type: Number},//1
  win: {type: Number},//1

  ftTeam1Score: {type: Number},//4
  ftTeam2Score: {type: Number},//2
  // Win-Loss for settled bets.
  winLoss: {type: Number},//1
  // Client’s commission on the bet.
  // 베팅에 대한 고객의 커미션.
  customerCommission: {type: Number},
  cancellationReason: {type: Schema.Types.Mixed}

},{
  timestamps: true,
  _id: false
})

// autoIncrement.initialize(mongoose.connection);
// eventSchema.plugin(autoIncrement.plugin, {
//   model : 'Setting',
//   field : 'number',
//   startAt : 0, //시작
//   increment : 1 // 증가
// });

// eventSchema.statics.create = function(payload){
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

// settingSchema.statics.updateOne = function(_id, data){
//   return this.updateOne({_id}, data);
// }

module.exports = mongoose.models.Event || mongoose.model("Event", eventSchema);
