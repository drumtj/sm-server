//const axios = require('axios');
// const {API_BASEURL, EMAIL} = require('./config.js');
const axios = require('axios');
// const Buffer = require('Buffer');
const placeBetErrorMap = {
  ALL_BETTING_CLOSED: "현재 베팅이 허용되지 않습니다. 이는 시스템 유지 관리 중에 발생할 수 있습니다.",
  ALL_LIVE_BETTING_CLOSED: "현재 라이브 베팅은 허용되지 않습니다. 이는 시스템 유지 관리 중에 발생할 수 있습니다.",
  ABOVE_EVENT_MAX: "고객이 라인에서 허용 된 최대 위험을 초과했기 때문에 베팅을 할 수 없습니다.",
  ABOVE_MAX_BET_AMOUNT: "지분이 허용 된 최대 금액을 초과합니다.",
  BELOW_MIN_BET_AMOUNT: "판돈이 허용 된 최소 금액 미만입니다.",
  BLOCKED_BETTING: "클라이언트에 대한 베팅이 중단되었습니다.",
  BLOCKED_CLIENT: "클라이언트가 더 이상 활성 상태가 아닙니다.",
  INSUFFICIENT_FUNDS: "자금이 부족한 고객이 베팅을 제출했습니다.",
  INVALID_COUNTRY: "고객 국가는 베팅이 허용되지 않습니다.",
  INVALID_EVENT: "잘못된 이벤트 ID",
  INVALID_ODDS_FORMAT: "클라이언트에게 허용되지 않는 배당률 형식으로 베팅이 제출 된 경우",
  LINE_CHANGED: "변경된 라인에 베팅이 제출 됨",
  LISTED_PITCHERS_SELECTION_ERROR: "허용되지 않는 값이있는 위치 베팅 요청에서 pitcher1MustStart 및 / 또는 pitcher2MustStart 매개 변수로 베팅을 제출 한 경우",
  OFFLINE_EVENT: "오프라인 이벤트에 베팅이 제출되었거나 포인트 / 핸디캡 변경으로 인해 제출 된 라인이 현재 제공되지 않았거나 제출 된 베팅 유형이 현재 제공되지 않았습니다.",
  PAST_CUTOFFTIME: "베팅 마감 시간 이후에 게임에 베팅이 제출되었습니다.",
  RED_CARDS_CHANGED: "레드 카드 수가 변경된 라이브 축구 이벤트에 베팅이 제출되었습니다.",
  SCORE_CHANGED: "점수가 변경된 라이브 축구 이벤트에 베팅이 제출되었습니다.",
  TIME_RESTRICTION: "이전에 고객이 베팅 한 동일한 베팅에서 너무 짧은 기간 내에 베팅이 제출 된 경우",
  DUPLICATE_UNIQUE_REQUEST_ID: "동일한 uniqueRequestId를 가진 요청이 이미 처리되었습니다. 요청을 계속 처리하려면 새 값을 설정하십시오.",
  INCOMPLETE_CUSTOMER_BETTING_PROFILE: "시스템 구성 문제",
  INVALID_CUSTOMER_PROFILE: "시스템 구성 문제",
  LIMITS_CONFIGURATION_ISSUE: "시스템 구성 문제",
  RESPONSIBLE_BETTING_LOSS_LIMIT_EXCEEDED: "고객이 총 손실 한도에 도달했습니다.",
  RESPONSIBLE_BETTING_RISK_LIMIT_EXCEEDED: "고객이 총 위험 한도에 도달했습니다.",
  SYSTEM_ERROR_3: "예상치 못한 오류"
}

module.exports = class PAPI {
  constructor(authCode){
    // this.setup(id, pw);
    this.setup(authCode);
  }

  setup(authCode){//id, pw){
    // if(!(id&&pw)){
    //   throw new Error("id, pw가 빈값입니다.");
    // }

    this.net = axios.create({
      baseURL: "https://api.pinnacle.com",
      headers: {
        'Authorization': 'Basic ' + authCode
      }
    })

    // console.log("?", Base64.encode(id+':'+pw));
  }

  _ax(url, data, method='GET', headers){
    if(!this.net){
      console.error('setup()을 먼저 해주세요.');
      return Promise.reject();
    }

    let obj = {method, url, headers};
    if(method == "GET"){
      obj.params = data;
    }else{
      obj.data = data;
    }

    // startLoading();
    return this.net(obj)
    .then(res=>{
      // stopLoading();
      return res.data;
    })
    .catch(e=>{
      // stopLoading();
      // console.dir(e);
      if(e.response){
        return e.response.data;
      }else{
        return e;
      }
    });
  }

  getBalance(){
    // response example
    // {
    // "availableBalance": 0,
    // "outstandingTransactions": 0,
    // "givenCredit": 0,
    // "currency": "string"
    // }
    return this._ax("/v1/client/balance");
  }


  // sportId
  // required
  // integer <int32>
  // The sport id to retrieve the fixtures for.
  //
  // leagueIds
  // Array of integers <int32>
  // The leagueIds array may contain a list of comma separated league ids.
  //
  // isLive
  // boolean
  // To retrieve ONLY live events set the value to 1 (isLive=1). Missing or any other value will result in retrieval of events regardless of their Live status.
  //
  // since
  // integer <int64>
  // This is used to receive incremental updates. Use the value of last from previous fixtures response. When since parameter is not provided, the fixtures are delayed up to 1 minute to encourage the use of the parameter.
  //
  // eventIds
  // Array of integers <int32>
  // Comma separated list of event ids to filter by
  getEvents(params){
    return this._ax("/v1/fixtures", params);
    // {
    //   "sportId": 0,
    //   "last": 0,
    //   "league": [
    //     {
    //       "id": 0,
    //       "name": "string",
    //       "events": [
    //         {
    //           "id": 0,
    //           "parentId": 0,
    //           "starts": "2021-01-05T21:27:43Z",
    //           "home": "string",
    //           "away": "string",
    //           "rotNum": "string",
    //           "liveStatus": 0,
    //           "homePitcher": "string",
    //           "awayPitcher": "string",
    //           "status": "O",
    //           "parlayRestriction": 0,
    //           "altTeaser": true,
    //           "resultingUnit": "string"
    //         }
    //       ]
    //     }
    //   ]
    // }
  }


  // sportId
  // required
  // integer <int32>
  // leagueIds
  // Array of integers <int32>
  // since
  // integer <int32>
  getSettledEvents(params){
    return this._ax("/v1/fixtures/settled", params);
    // {
    //   "sportId": 0,
    //   "last": 0,
    //   "leagues": [
    //     {
    //       "id": 0,
    //       "events": [
    //         {
    //           "id": 0,
    //           "periods": [
    //             {
    //               "number": 0,
    //               "status": 0,
    //               "settlementId": 0,
    //               "settledAt": "2017-09-03T18:21:22.3846289-07:00",
    //               "team1Score": 0,
    //               "team2Score": 0,
    //               "cancellationReason": {
    //                 "code": "string",
    //                 "details": {
    //                   "correctTeam1Id": "string",
    //                   "correctTeam2Id": "string",
    //                   "correctListedPitcher1": "string",
    //                   "correctListedPitcher2": "string",
    //                   "correctSpread": "0.0",
    //                   "correctTotalPoints": "0.0",
    //                   "correctTeam1TotalPoints": "0.0",
    //                   "correctTeam2TotalPoints": "0.0",
    //                   "correctTeam1Score": "0",
    //                   "correctTeam2Score": "0",
    //                   "correctTeam1TennisSetsScore": "0",
    //                   "correctTeam2TennisSetsScore": "0"
    //                 }
    //               }
    //             }
    //           ]
    //         }
    //       ]
    //     }
    //   ]
    // }
  }

  // sportId
  // required
  // integer <int32>
  // The sportid for which to retrieve the odds.
  //
  // leagueIds
  // Array of integers <int32>
  // The leagueIds array may contain a list of comma separated league ids.
  //
  // oddsFormat
  // string
  // Enum: "American" "Decimal" "HongKong" "Indonesian" "Malay"
  // Format in which we return the odds. Default is American. [American, Decimal, HongKong, Indonesian, Malay]
  //
  // since
  // integer <int64>
  // This is used to receive incremental updates. Use the value of last from previous odds response. When since parameter is not provided, the odds are delayed up to 1 min to encourage the use of the parameter. Please note that when using since parameter you will get in the response ONLY changed periods. If a period did not have any changes it will not be in the response.
  //
  // isLive
  // boolean
  // To retrieve ONLY live odds set the value to 1 (isLive=1). Otherwise response will have all odds.
  //
  // eventIds
  // Array of integers <int64>
  // Filter by EventIds
  //
  // toCurrencyCode
  // string
  // 3 letter currency code as in the /currency response. Limits will be returned in the requested currency. Default is USD.
  getOdds(params){
    return this._ax("/v1/odds", params);
    // {
    //   "sportId": 0,
    //   "last": 0,
    //   "leagues": [
    //     {
    //       "id": 0,
    //       "events": [
    //         {
    //           "id": 0,
    //           "awayScore": 0,
    //           "homeScore": 0,
    //           "awayRedCards": 0,
    //           "homeRedCards": 0,
    //           "periods": [
    //             {
    //               "lineId": 0,
    //               "number": 0,
    //               "cutoff": "2021-01-05T21:27:43Z",
    //               "status": 1,
    //               "maxSpread": 0,
    //               "maxMoneyline": 0,
    //               "maxTotal": 0,
    //               "maxTeamTotal": 0,
    //               "spreads": [
    //                 {
    //                   "altLineId": 0,
    //                   "hdp": 0,
    //                   "home": 0,
    //                   "away": 0
    //                 }
    //               ],
    //               "moneyline": {
    //                 "home": 0,
    //                 "away": 0,
    //                 "draw": 0
    //               },
    //               "totals": [
    //                 {
    //                   "altLineId": 0,
    //                   "points": 0,
    //                   "over": 0,
    //                   "under": 0
    //                 }
    //               ],
    //               "teamTotal": {
    //                 "home": {
    //                   "points": 0,
    //                   "over": 0,
    //                   "under": 0
    //                 },
    //                 "away": {
    //                   "points": 0,
    //                   "over": 0,
    //                   "under": 0
    //                 }
    //               }
    //             }
    //           ]
    //         }
    //       ]
    //     }
    //   ]
    // }
  }

  // leagueId
  // required
  // integer <int32>
  // League Id.
  //
  // handicap
  // required
  // number <double>
  // This is needed for SPREAD, TOTAL_POINTS and TEAM_TOTAL_POINTS bet types
  //
  // oddsFormat
  // required
  // string
  // Enum: "American" "Decimal" "HongKong" "Indonesian" "Malay"
  // Format in which we return the odds. Default is American.
  //
  // sportId
  // required
  // integer <int32>
  // Sport identification
  //
  // eventId
  // required
  // integer <int64>
  // Event identification
  //
  // periodNumber
  // required
  // integer <int32>
  // This represents the period of the match. For example, for soccer we have 0 (Game), 1 (1st Half) & 2 (2nd Half)
  //
  // betType
  // required
  // string
  // Enum: "SPREAD" "MONEYLINE" "TOTAL_POINTS" "TEAM_TOTAL_POINTS"
  // Bet Type
  //
  // team
  // string
  // Enum: "Team1" "Team2" "Draw"
  // Chosen team type. This is needed only for SPREAD, MONEYLINE and TEAM_TOTAL_POINTS bet types
  //
  // side
  // string
  // Enum: "OVER" "UNDER"
  // Chosen side. This is needed only for TOTAL_POINTS and TEAM_TOTAL_POINTS
  getLine(params){
    return this._ax("/v1/line", params);
    // {
    // "status": "SUCCESS",
    // "price": 0,
    // "lineId": 0,
    // "altLineId": 0,
    // "team1Score": 0,
    // "team2Score": 0,
    // "team1RedCards": 0,
    // "team2RedCards": 0,
    // "maxRiskStake": 0,
    // "minRiskStake": 0,
    // "maxWinStake": 0,
    // "minWinStake": 0,
    // "effectiveAsOf": "string"
    // }
  }

  // Get running bets by time range:
  // https://api.pinnacle.com/v3/bets?betlist=RUNNING&fromDate=2017-11-21T00:00:00Z&toDate=2017-11-29T00:00:00Z
  //
  // Get settled bets by time range:
  // https://api.pinnacle.com/v3/bets?betlist=SETTLED&fromDate=2015-12-28T00:00:00Z&toDate=2015-12-29T00:00:00Z
  //
  // Get settled cancelled bets by time range:
  // https://api.pinnacle.com/v3/bets?betList=SETTLED&fromDate=2018-03-01&toDate=2018-03-28&betStatuses=CANCELLED
  //
  // Get bets by bet ids:
  // https://api.pinnacle.com/v3/bets?betIds=775856112,775856113,775856114
  //
  // Get bets by uniqueRequestIds:
  // https://api.pinnacle.com/v3/bets?uniqueRequestIds=62335222-dae4-479a-8c05-46440ccdd3bb,42335222-dae4-479a-8c05-46440ccdd3bb
  getBets(params){
    return this._ax("/v3/bets", params).then(data=>{
      if(data.betStatus == "PROCESSED_WITH_ERROR"){
        console.error("getBets의 betStatus PROCESSED_WITH_ERROR 확인. errorCode가 나온지 확인하고, 있으면 message 매칭시켜주자");
        // data.errorMessage = placeBetErrorMap[data.errorCode];
      }
      return data;
    });
  //   {
  //   "moreAvailable": true,
  //   "pageSize": 0,
  //   "fromRecord": 0,
  //   "toRecord": 0,
  //   "straightBets": [
  //     {
  //       "betId": 759629245,
  //       "wagerNumber": 1,
  //       "placedAt": "2017-09-05T01:32:59Z",
  //       "betStatus": "ACCEPTED",
  //       "betStatus2": "ACCEPTED",
  //       "betType": "MONEYLINE",
  //       "win": 1,
  //       "risk": 1.5,
  //       "winLoss": null,
  //       "oddsFormat": "DECIMAL",
  //       "customerCommission": null,
  //       "cancellationReason": {
  //         "code": "FBS_CW_227",
  //         "details": [
  //           {
  //             "key": "correctSpread",
  //             "value": "-1.5"
  //           }
  //         ]
  //       },
  //       "updateSequence": 111548915,
  //       "sportId": 29,
  //       "leagueId": 2462,
  //       "eventId": 757064557,
  //       "handicap": null,
  //       "price": -155,
  //       "teamName": "Crvena Zvezda",
  //       "side": null,
  //       "pitcher1": null,
  //       "pitcher2": null,
  //       "pitcher1MustStart": false,
  //       "pitcher2MustStart": false,
  //       "team1": "Crvena Zvezda",
  //       "team2": "Partizan",
  //       "periodNumber": 0,
  //       "team1Score": null,
  //       "team2Score": null,
  //       "ftTeam1Score": null,
  //       "ftTeam2Score": null,
  //       "pTeam1Score": null,
  //       "pTeam2Score": null,
  //       "isLive": false,
  //       "eventStartTime": "2017-10-05T01:32:59Z"
  //     }
  //   ],
  //   "parlayBets": [
  //     {
  //       "betId": 760404490,
  //       "uniqueRequestId": "10924E23-A2FE-4317-BFFD-80504675F554",
  //       "wagerNumber": 1,
  //       "placedAt": "2017-09-08T00:55:11Z",
  //       "betStatus": "ACCEPTED",
  //       "betStatus2": "ACCEPTED",
  //       "betType": "PARLAY",
  //       "win": 6.82,
  //       "risk": 1,
  //       "winLoss": null,
  //       "oddsFormat": "DECIMAL",
  //       "customerCommission": null,
  //       "cancellationReason": {
  //         "code": "FBS_CW_227",
  //         "details": [
  //           {
  //             "key": "correctSpread",
  //             "value": "-1.5"
  //           }
  //         ]
  //       },
  //       "updateSequence": 112839436,
  //       "legs": [
  //         {
  //           "sportId": 29,
  //           "legBetType": "MONEYLINE",
  //           "legBetStatus": "CANCELLED",
  //           "legBetStatus2": "CANCELLED",
  //           "leagueId": 1766,
  //           "eventId": 758024079,
  //           "eventStartTime": "2017-10-05T01:32:59Z",
  //           "handicap": null,
  //           "price": 193,
  //           "teamName": "Adelaide United",
  //           "side": null,
  //           "pitcher1": null,
  //           "pitcher2": null,
  //           "pitcher1MustStart": false,
  //           "pitcher2MustStart": false,
  //           "team1": "string",
  //           "team2": "string",
  //           "periodNumber": 0,
  //           "ftTeam1Score": null,
  //           "ftTeam2Score": null,
  //           "pTeam1Score": null,
  //           "pTeam2Score": null,
  //           "cancellationReason": {
  //             "code": "FBS_CW_227",
  //             "details": [
  //               {
  //                 "key": "correctSpread",
  //                 "value": "-1.5"
  //               }
  //             ]
  //           }
  //         }
  //       ],
  //       "price": 682,
  //       "finalPrice": 0
  //     }
  //   ],
  //   "teaserBets": [
  //     {
  //       "betId": 0,
  //       "uniqueRequestId": "10924E23-A2FE-4317-BFFD-80504675F554",
  //       "wagerNumber": 0,
  //       "placedAt": "2021-01-07T17:28:31Z",
  //       "betStatus": "ACCEPTED",
  //       "betType": "TEASER",
  //       "win": 0,
  //       "risk": 0,
  //       "winLoss": 0,
  //       "oddsFormat": "DECIMAL",
  //       "customerCommission": 0,
  //       "cancellationReason": {
  //         "code": "FBS_CW_227",
  //         "details": [
  //           {
  //             "key": "correctSpread",
  //             "value": "-1.5"
  //           }
  //         ]
  //       },
  //       "updateSequence": 0,
  //       "teaserName": "string",
  //       "isSameEventOnly": true,
  //       "minPicks": 0,
  //       "maxPicks": 0,
  //       "price": 682,
  //       "finalPrice": 0,
  //       "teaserId": 0,
  //       "teaserGroupId": 0,
  //       "legs": [
  //         {
  //           "sportId": 0,
  //           "legBetType": "SPREAD",
  //           "legBetStatus": "CANCELLED",
  //           "leagueId": 0,
  //           "eventId": 0,
  //           "eventStartTime": "2017-10-05T01:32:59Z",
  //           "handicap": 0,
  //           "teamName": "string",
  //           "side": "OVER",
  //           "team1": "string",
  //           "team2": "string",
  //           "periodNumber": 0
  //         }
  //       ]
  //     }
  //   ],
  //   "specialBets": [
  //     {
  //       "betId": 760748770,
  //       "uniqueRequestId": "10924E23-A2FE-4317-BFFD-80504675F554",
  //       "wagerNumber": 1,
  //       "placedAt": "2017-09-09T01:49:43Z",
  //       "betStatus": "ACCEPTED",
  //       "betType": "SPECIAL",
  //       "win": 1,
  //       "risk": 1.51,
  //       "winLoss": null,
  //       "oddsFormat": "DECIMAL",
  //       "customerCommission": null,
  //       "cancellationReason": {
  //         "code": "FBS_CW_227",
  //         "details": [
  //           {
  //             "key": "correctSpread",
  //             "value": "-1.5"
  //           }
  //         ]
  //       },
  //       "updateSequence": 113214135,
  //       "specialId": 726397620,
  //       "specialName": "Denver Broncos Regular Season Wins?",
  //       "contestantId": 726397622,
  //       "contestantName": "Under",
  //       "price": -151,
  //       "handicap": 8.5,
  //       "units": "Regular Season Wins",
  //       "sportId": 15,
  //       "leagueId": 889,
  //       "eventId": null,
  //       "periodNumber": null,
  //       "team1": null,
  //       "team2": null,
  //       "eventStartTime": "2017-10-05T01:32:59Z"
  //     }
  //   ],
  //   "manualBets": [
  //     {
  //       "betId": 760063588,
  //       "wagerNumber": 1,
  //       "placedAt": "2017-09-06T14:56:27Z",
  //       "betStatus": "ACCEPTED",
  //       "betType": "MANUAL",
  //       "win": 15000,
  //       "risk": 500,
  //       "winLoss": 0,
  //       "updateSequence": 112472310,
  //       "description": "Soccer Props - Partizan vs Crvena Zvezda - Partizan @ +3000",
  //       "referenceBetId": null
  //     }
  //   ]
  // }
  }

  // oddsFormat
  // string (OddsFormat)
  // Enum: "AMERICAN" "DECIMAL" "HONGKONG" "INDONESIAN" "MALAY"
  // Bet odds format.
  // AMERICAN = American odds format,
  // DECIMAL = Decimal (European) odds format,
  // HONGKONG = Hong Kong odds format,
  // INDONESIAN = Indonesian odds format,
  // MALAY = Malaysian odds format
  //
  // uniqueRequestId
  // string <uuid>
  // This is a Unique ID for PlaceBet requests. This is to support idempotent requests.
  //
  // acceptBetterLine
  // boolean
  // Whether or not to accept a bet when there is a line change in favor of the client.
  //
  // stake
  // number <double>
  // amount in client’s currency.
  //
  // winRiskStake
  // string
  // Enum: "WIN" "RISK"
  // Whether the stake amount is risk or win amount.
  //
  // lineId
  // integer <int64>
  // Line identification.
  //
  // altLineId
  // integer <int64> Nullable
  // Alternate line identification.
  //
  // pitcher1MustStart
  // boolean
  // Baseball only. Refers to the pitcher for Team1. This applicable only for MONEYLINE bet type, for all other bet types this has to be TRUE.
  //
  // pitcher2MustStart
  // boolean
  // Baseball only. Refers to the pitcher for Team2. This applicable only for MONEYLINE bet type, for all other bet types this has to be TRUE.
  //
  // fillType
  // string
  // Default: "NORMAL"
  // Enum: "NORMAL" "FILLANDKILL" "FILLMAXLIMIT"
  // NORMAL - bet will be placed on specified stake.
  // FILLANDKILL - If the stake is over the max limit, bet will be placed on max limit, otherwise it will be placed on specified stake.
  // FILLMAXLIMIT - bet will be places on max limit, stake amount will be ignored. Please note that maximum limits can change at any moment, which may result in risking more than anticipated. This option is replacement of isMaxStakeBet from v1/bets/place'
  //
  // sportId
  // integer <int32>
  // eventId
  // integer <int64>
  // periodNumber
  // integer <int32>
  // betType
  // string
  // Enum: "MONEYLINE" "TEAM_TOTAL_POINTS" "SPREAD" "TOTAL_POINTS"
  // Bet type.
  //
  // team
  // string
  // Enum: "TEAM1" "TEAM2" "DRAW"
  // Team type.
  //
  // side
  // string Nullable
  // Enum: "OVER" "UNDER"
  // Side type.
  placeBet(params){
    return this._ax("/v2/bets/straight", params, "POST").then(data=>{
      if(data.status == "PROCESSED_WITH_ERROR"){
        data.errorMessage = placeBetErrorMap[data.errorCode];
      }
      return data;
    });
    // {
    //   "oddsFormat": "DECIMAL",
    //   "uniqueRequestId": "D5CC50E4-284D-4D50-8D49-429BDC4F2A48",
    //   "acceptBetterLine": true,
    //   "stake": 10.5,
    //   "winRiskStake": "RISK",
    //   "lineId": 420921914,
    //   "altLineId": null,
    //   "pitcher1MustStart": true,
    //   "pitcher2MustStart": true,
    //   "fillType": "NORMAL",
    //   "sportId": 29,
    //   "eventId": 757504261,
    //   "periodNumber": 0,
    //   "betType": "MONEYLINE",
    //   "team": "TEAM1",
    //   "side": null
    // }
  }

  getSports(){
    return this._ax("/v2/sports");
    // {
    // "sports": [
    // {
    // "id": 0,
    // "name": "string",
    // "hasOfferings": true,
    // "leagueSpecialsCount": 0,
    // "eventSpecialsCount": 0,
    // "eventCount": 0
    // }
    // ]
    // }
  }

  // sportId
  // required
  // string
  // Sport id for which the leagues are requested.
  getLeagues(params){
    return this._ax("/v2/leagues", params);
    // {
    // "leagues": [
    // {
    // "id": 0,
    // "name": "string",
    // "homeTeamType": "string",
    // "hasOfferings": true,
    // "container": "string",
    // "allowRoundRobins": true,
    // "leagueSpecialsCount": 0,
    // "eventSpecialsCount": 0,
    // "eventCount": 0
    // }
    // ]
    // }
  }


  // await bet({
  //   sportId: 29,
  //   eventId: 1238947666,
  //   periodNumber: 0,
  //   betType: "TOTAL_POINTS",
  //   side: "UNDER",
  //   handicap: 2.75,
  //   stake: 1
  // })

  // async test(sportId, eventId, )

  async scGetLine({sportId, leagueId, eventId, isLive, betType, team, side, periodNumber, handicap}){
    // console.error("@@@@@", arguments);
    let data;
    try{
      if(!leagueId){
        data = await this.getEvents({sportId, isLive, eventIds:eventId});
        console.error("event", data);
        if(!data){
          console.error("loading event fail");
          return;
        }

        if(data.code){
          console.error(data);
          return;
        }

      	leagueId = data.league[0].id;
      	// let starts = data.league[0].events[0].starts;

        console.error({leagueId});
      }

      //let periodNumber = 0;
      //let betType = "MONEYLINE";
      let oddsFormat = "Decimal";
      //let handicap = null;
      //let team = "Team2";
      //let side = null;
    	let line = await this.getLine({
        leagueId,
        sportId,
        handicap,
        oddsFormat,
        eventId,
        periodNumber,
        betType,
        team,
        side
      });
      console.error("line", line);

      let obj = arguments[0];
      obj.leagueId = leagueId;
      obj.lineData = line;
      obj.oddsFormat = oddsFormat;
      if(data){
        obj.eventData = data;
      }
      return obj;
    }catch(e){
      console.error(e);
      return null;
    }
  }

  async scMinPlaceBet(scLine){
    console.error("scMinPlaceBet", scLine);
    try{
      if(scLine && scLine.lineData && scLine.lineData.status == "SUCCESS"){
        let {sportId, eventId, betType, team, side, periodNumber, handicap, oddsFormat, lineData} = scLine;
        let winRiskStake = "RISK";//WIN, RISK
        let bets, {minRiskStake, minWinStake, price, lineId, altLineId} = lineData;
        bets = await this.placeBet({
          uniqueRequestId: uuid.v4(),
          sportId,
          lineId,
          eventId,
          periodNumber,
          stake: minRiskStake,
          // stake: minWinStake,
          winRiskStake,
          betType,
          oddsFormat: oddsFormat.toUpperCase(),
          team: team ? team.toUpperCase() : undefined,
          side,
          altLineId,
          acceptBetterLine: true,
          fillType: "NORMAL",
          pitcher1MustStart: true,
          pitcher2MustStart: true
        })
        console.error("bet", bets);
        scLine.betData = bets;
        return scLine;
      // if(bets.status == "ACCEPTED"){
      //   let result = await this.getBets({betIds:bets.straightBet.betId});
      //   console.error("result", result);
      // }
      }
    }catch(e){
      console.error(e);
      return null;
    }
  }

  // async scGetResult(scLine){
  //   if(scLine && scLine.betData && scLine.betData.status == "ACCEPTED"){
  //     let result = await this.getBets({betIds:scLine.betData.straightBet.betId});
  //     console.error("result", result);
  //     scLine.resultData = result;
  //     return scLine;
  //   }
  // }



  // async minBet({sportId, eventId, betType, team, side, periodNumber, handicap}){
  //   let data = await this.getEvents({sportId, eventIds:eventId});
  //   console.error("event", data);
  //   if(!data){
  //     console.error("loading event fail");
  //     return;
  //   }
  //
  //   if(data.code){
  //     console.error(data);
  //     return;
  //   }
  //
  // 	let leagueId = data.league[0].id;
  // 	let starts = data.league[0].events[0].starts;
  //
  //   console.error({leagueId});
  //
  // 	let toDate = "";
  //   //let periodNumber = 0;
  //   //let betType = "MONEYLINE";
  //   let oddsFormat = "Decimal";
  //   //let handicap = null;
  //   //let team = "Team2";
  //   //let side = null;
  //   //let stake = 1;
  //   let winRiskStake = "RISK";//WIN, RISK
  // 	let line = await this.getLine({
  //     leagueId,
  //     sportId,
  //     handicap,
  //     oddsFormat,
  //     eventId,
  //     periodNumber,
  //     betType,
  //     team,
  //     side
  //   });
  //   console.error("line", line);
  //   let bets, {minRiskStake, minWinStake, price, status, lineId, altLineId} = line;
  //   if(status == "SUCCESS"){
  //     bets = await this.placeBet({
  //       uniqueRequestId: uuid.v4(),
  //       sportId,
  //       lineId,
  //       eventId,
  //       periodNumber,
  //       stake: minRiskStake,
  //       winRiskStake,
  //       betType,
  //       oddsFormat: oddsFormat.toUpperCase(),
  //       team: team ? team.toUpperCase() : undefined,
  //       side,
  //       altLineId,
  //       acceptBetterLine: true,
  //       fillType: "NORMAL",
  //       pitcher1MustStart: true,
  //       pitcher2MustStart: true
  //     })
  //     console.error("bet", bets);
  //     if(bets.status == "ACCEPTED"){
  //       let result = await this.getBets({betIds:bets.straightBet.betId});
  //       console.error("result", result);
  //     }
  //   }
  // }
}
