const axios = require("axios");
const CronJob = require('cron').CronJob;

const BOOKMAKERS = {1: "Pinnacle", 3: "Sbobet", 4: "Marathon", 5: "188bet", 7: "LSBet", 9: "Bwin", 10: "Bet365", 11: "Betfair", 12: "DafabetOW", 13: "WilliamHill", 14: "Expekt", 17: "PariMatch", 19: "Unibet", 20: "DafaSports", 21: "1xbet", 22: "Favbet", 23: "BetAtHome", 24: "10bet", 26: "Totogaming", 28: "Retabet", 29: "Tipico", 30: "Leon", 31: "Matchbook", 32: "Ladbrokes", 33: "Jetbull", 34: "Vbet", 37: "GGBet", 38: "Betdaq", 39: "Tipsport", 41: "Rivalo", 42: "SportpesaIT", 43: "Betflag", 45: "Betfred", 46: "BookMaker", 47: "Tipbet", 48: "Betsson", 50: "Smarkets", 52: "Boylesports", 53: "PaddyPower", 54: "PlanetWin365", 56: "BetOnline", 57: "Cashpoint", 60: "Interwetten", 61: "Goldenpalace", 63: "Goalbet", 65: "Betvictor", 70: "Superbet", 73: "Bodog", 74: "TonyBet", 76: "Stoiximan", 78: "Betway", 79: "BFSportsbook", 83: "Novibet", 85: "Wplay", 86: "Skybet", 87: "STS", 92: "Cloudbet", 94: "Pamestoixima", 95: "888Sport", 97: "Kirolbet", 99: "Pokerstars", 100: "Codere", 102: "Snai", 103: "Sisal", 105: "Sportmarket", 106: "Eurobet", 107: "Lottomatica", 109: "Goldbetshop", 110: "JoyCasino", 119: "BetinAsia", 126: "ImSports", 127: "FortuneJack", 128: "Meridianbet", 129: "Betaland", 130: "Tempobet", 131: "Sportsbet", 134: "MerkurWin"};

const SPORTS = {1: "Baseball", 2: "Basketball", 4: "Futsal", 5: "Handball", 6: "Hockey", 7: "Soccer", 8: "Tennis", 9: "Volleyball", 10: "Am. Football", 11: "Snooker", 12: "Darts", 13: "Table Tennis", 14: "Badminton", 15: "Rugby League", 16: "Water Polo", 17: "Bandy", 18: "Martial arts", 19: "Field Hockey", 20: "AFL", 21: "E-Sports", 22: "Chess", 23: "Gaelic Sport", 24: "Cricket", 25: "Formula 1", 29: "Beach Volley", 30: "Horse Racing", 31: "Biathlon", 32: "Curling", 33: "Squash", 34: "Netball", 35: "Beach Soccer", 36: "Floorball", 37: "Hurling", 38: "Kung Volleyball", 39: "E-Soccer", 40: "E-Hockey", 41: "E-Basketball", 42: "E-Tennis", 43: "Rugby Union", 44: "Boxing", 45: "MMA"};

const BET_TYPES = {"1":"Team1 Win","2":"Team2 Win","3":"Asian Handicap1(0.0)/Draw No Bet","4":"Asian Handicap2(0.0)/Draw No Bet","5":"European Handicap1(%s)","6":"European HandicapX(%s)","7":"European Handicap2(%s)","8":"Both to score","9":"One scoreless","10":"Only one to score","11":"1","12":"X","13":"2","14":"1X","15":"X2","16":"12","17":"Asian Handicap1(%s)","18":"Asian Handicap2(%s)","19":"Total Over(%s)","20":"Total Under(%s)","21":"Total Over(%s) for Team1","22":"Total Under(%s) for Team1","23":"Total Over(%s) for Team2","24":"Total Under(%s) for Team2","25":"Odd","26":"Even","27":"1 - Yellow Cards","28":"X - Yellow Cards","29":"2 - Yellow Cards","30":"1X - Yellow Cards","31":"12 - Yellow Cards","32":"X2 - Yellow Cards","33":"Asian Handicap1(%s) - Yellow Cards","34":"Asian Handicap2(%s) - Yellow Cards","35":"Total Over(%s) - Yellow Cards","36":"Total Under(%s) - Yellow Cards","37":"Total Under(%s) for Team1 - Yellow Cards","38":"Total Over(%s) for Team1 - Yellow Cards","39":"Total Under(%s) for Team2 - Yellow Cards","40":"Total Over(%s) for Team2 - Yellow Cards","41":"Even - Yellow Cards","42":"Odd - Yellow Cards","43":"1 - Corners","44":"X - Corners","45":"2 - Corners","46":"1X - Corners","47":"12 - Corners","48":"X2 - Corners","49":"Asian Handicap1(%s) - Corners","50":"Asian Handicap2(%s) - Corners","51":"Total Over(%s) - Corners","52":"Total Under(%s) - Corners","53":"Total Under(%s) for Team1 - Corners","54":"Total Over(%s) for Team1 - Corners","55":"Total Under(%s) for Team2 - Corners","56":"Total Over(%s) for Team2 - Corners","57":"Odd - Corners","58":"Even - Corners","63":"Red card - yes","64":"No red card","65":"Penalty - yes","66":"No penalty","67":"Score (%s)","68":"Total Over(%s) - Tie Break","69":"Total Under(%s) - Tie Break","70":"Score (%s) - not","71":"Any substitute to score a goal - yes","72":"Any substitute to score a goal - no","73":"Team1 to win by exactly 1 goal - yes","74":"Team1 to win by exactly 1 goal - no","75":"Team2 to win by exactly 1 goal - yes","76":"Team2 to win by exactly 1 goal - no","77":"Team1 to win by exactly 2 goals - yes","78":"Team1 to win by exactly 2 goals - no","79":"Team1 to win by exactly 3 goals - yes","80":"Team1 to win by exactly 3 goals - no","81":"Team2 to win by exactly 2 goals - yes","82":"Team2 to win by exactly 2 goals - no","83":"Team2 to win by exactly 3 goals - yes","84":"Team2 to win by exactly 3 goals - no","85":"Team1 to win to Nil - yes","86":"Team1 to win to Nil - no","87":"Team2 to win to Nil - yes","88":"Team2 to win to Nil - no","89":"Team1 to win either halves - yes","90":"Team1 to win either halves - no","91":"Team2 to win either halves - yes","92":"Team2 to win either halves - no","93":"Draw in either half - yes","94":"Draw in either half - no","95":"Team1 to win in both halves - yes","96":"Team1 to win in both halves - no","97":"Team2 to win in both halves - yes","98":"Team2 to win in both halves - no","99":"Team1 to win and Total Over 2.5 - yes","100":"Team1 to win and Total Over 2.5 - no","101":"Team1 to win and Total Under 2.5 - yes","102":"Team1 to win and Total Under 2.5 - no","103":"Team2 to win and Total Over 2.5 - yes","104":"Team2 to win and Total Over 2.5 - no","105":"Team2 to win and Total Under 2.5 - yes","106":"Team2 to win and Total Under 2.5 - no","107":"Draw in both half - yes","108":"Draw in both half - no","109":"Draw and Total Over 2.5 - yes","110":"Draw and Total Over 2.5 - no","111":"Draw and Total Under 2.5 - yes","112":"Draw and Total Under 2.5 - no","113":"Goals in both halves - yes","114":"Goals in both halves - no","115":"Team1 to score in both halves - yes","116":"Team1 to score in both halves - no","117":"Team2 to score in both halves - yes","118":"Team2 to score in both halves - no","119":"Double - yes","120":"Double - no","121":"Hattrick - yes","122":"Hattrick - no","123":"Own goal - yes","124":"Own goal - no","125":"Both halves > 1.5 goals - yes","126":"Both halves > 1.5 goals - no","127":"Both halves < 1.5 goals - yes","128":"Both halves < 1.5 goals - no","129":"Sets (%s)","130":"Sets (%s) - not","131":"Asian Handicap1(%s) - Sets","132":"Asian Handicap2(%s) - Sets","133":"Total Over(%s) - Sets","134":"Total Under(%s) - Sets","135":"Team1/Team1","136":"Team1/Team1 - no","137":"Team1/Draw","138":"Team1/Draw - no","139":"Team1/Team2","140":"Team1/Team2 - no","141":"Draw/Team1","142":"Draw/Team1 - no","143":"Draw/Draw","144":"Draw/Draw - no","145":"Draw/Team2","146":"Draw/Team2 - no","147":"Team2/Team1","148":"Team2/Team1 - no","149":"Team2/Draw","150":"Team2/Draw - no","151":"Team2/Team2","152":"Team2/Team2 - no","153":"Exact (%s)","154":"Exact (%s) - no","155":"Exact (%s) for Team1","156":"Exact (%s) for Team1 - no","157":"Exact (%s) for Team2","158":"Exact (%s) for Team2 - no","159":"More goals in the 1st half","160":"Equal goals in halves","161":"More goals in the 2nd half","162":"1 half most goals (draw no bet)","163":"2 half most goals (draw no bet)","164":"Team1 - 1st goal","165":"No goal","166":"Team2 - 1st goal","167":"Team1 - 1st goal (draw no bet)","168":"Team2 - 1st goal (draw no bet)","169":"Team1 - Last goal","170":"No goal","171":"Team2 - Last goal","172":"Team1 - Last goal (draw no bet)","173":"Team2 - Last goal (draw no bet)","174":"Total Over(%s) - Aces","175":"Total Under(%s) - Aces","176":"Total Over(%s) for Team1 - Aces","177":"Total Under(%s) for Team1 - Aces","178":"Total Over(%s) for Team2 - Aces","179":"Total Under(%s) for Team2 - Aces","180":"Total Over(%s) - Double Faults","181":"Total Under(%s) - Double Faults","182":"Total Over(%s) for Team1 - Double Faults","183":"Total Under(%s) for Team1 - Double Faults","184":"Total Over(%s) for Team2 - Double Faults","185":"Total Under(%s) for Team2 - Double Faults","186":"Total Over(%s) for Team1 - 1st Serve","187":"Total Under(%s) for Team1 - 1st Serve","188":"Total Over(%s) for Team2 - 1st Serve","189":"Total Under(%s) for Team2 - 1st Serve","190":"Asian Handicap1(%s) - Aces","191":"Asian Handicap2(%s) - Aces","192":"Asian Handicap1(%s) - Double Faults","193":"Asian Handicap2(%s) - Double Faults","194":"Asian Handicap1(%s) - 1st Serve","195":"Asian Handicap2(%s) - 1st Serve","196":"Player1 - 1st Ace","197":"Player2 - 1st Ace","198":"Player1 - 1st Double Fault","199":"Player2 - 1st Double Fault","200":"Player1 - 1st Break","201":"Player2 - 1st Break","202":"Player1 - 1st Break","203":"No break - 1st Break","204":"Player2 - 1st Break","205":"6-0 Set - yes","206":"6-0 Set - no","207":"Win From Behind - yes","208":"Win From Behind - no","209":"Exact (%s) - Sets","210":"Exact (%s) - Sets - no","211":"Team1 - 1st corner","212":"No corners","213":"Team2 - 1st corner","214":"Team1 - Last corner","215":"No corners","216":"Team2 - Last corner","217":"Team1 - 1st Yellow Card","218":"No Yellow Card","219":"Team2 - 1st Yellow Card","220":"Team1 - Last Yellow Card","221":"No Yellow Card","222":"Team2 - Last Yellow Card","223":"Team1 - 1st offside","224":"No offsides","225":"Team2 - 1st offside","226":"Team1 - Last offside","227":"No offsides","228":"Team2 - Last offside","229":"1st substitution - 1 half","230":"1st substitution - intermission","231":"1st substitution - 2 half","232":"1st goal - 1 half","233":"No goal","234":"1st goal - 2 half","235":"Team1 - 1st subs","236":"Team2 - 1st subs","237":"Team1 - Last subs","238":"Team2 - Last subs","239":"1 - Shots on goal","240":"X - Shots on goal","241":"2 - Shots on goal","242":"1X - Shots on goal","243":"12 - Shots on goal","244":"X2 - Shots on goal","245":"Asian Handicap1(%s) - Shots on goal","246":"Asian Handicap2(%s) - Shots on goal","247":"Total Over(%s) - Shots on goal","248":"Total Under(%s) - Shots on goal","249":"Total Over(%s) for Team1 - Shots on goal","250":"Total Under(%s) for Team1 - Shots on goal","251":"Total Over(%s) for Team2 - Shots on goal","252":"Total Under(%s) for Team2 - Shots on goal","253":"Odd - Shots on goal","254":"Even - Shots on goal","255":"1 - Fouls","256":"X - Fouls","257":"2 - Fouls","258":"1X - Fouls","259":"12 - Fouls","260":"X2 - Fouls","261":"Asian Handicap1(%s) - Fouls","262":"Asian Handicap2(%s) - Fouls","263":"Total Over(%s) - Fouls","264":"Total Under(%s) - Fouls","265":"Total Over(%s) for Team1 - Fouls","266":"Total Under(%s) for Team1 - Fouls","267":"Total Over(%s) for Team2 - Fouls","268":"Total Under(%s) for Team2 - Fouls","269":"Odd - Fouls","270":"Even - Fouls","271":"1 - Offsides","272":"X - Offsides","273":"2 - Offsides","274":"1X - Offsides","275":"12 - Offsides","276":"X2 - Offsides","277":"Asian Handicap1(%s) - Offsides","278":"Asian Handicap2(%s) - Offsides","279":"Total Over(%s) - Offsides","280":"Total Under(%s) - Offsides","281":"Total Over(%s) for Team1 - Offsides","282":"Total Under(%s) for Team1 - Offsides","283":"Total Over(%s) for Team2 - Offsides","284":"Total Under(%s) for Team2 - Offsides","285":"Odd - Offsides","286":"Even - Offsides","287":"Team1 to Win From Behind - yes","288":"Team1 to Win From Behind - no","289":"Team2 to Win From Behind - yes","290":"Team2 to Win From Behind - no","291":"Both To Score and W1 - yes","292":"Both To Score and W1 - no","293":"Both To Score and W2 - yes","294":"Both To Score and W2 - no","295":"Both To Score and Draw - yes","296":"Both To Score and Draw - no","297":"Exact (%s) - Added time","298":"Exact (%s) - Added time - no","299":"Total Over(%s) - Added time","300":"Total Under(%s) - Added time","301":"Home No Bet - W2","302":"Home No Bet - Draw","303":"Home No Bet - No Draw","304":"Away No Bet - W1","305":"Away No Bet - Draw","306":"Away No Bet - No Draw","307":"Total Over(%s) - Subs","308":"Total Under(%s) - Subs","309":"Total Over(%s) for Team1 - Subs","310":"Total Under(%s) for Team1 - Subs","311":"Total Over(%s) for Team2 - Subs","312":"Total Under(%s) for Team1 - Subs","313":"1 - Ball possession","314":"X - Ball possession","315":"2 - Ball possession","316":"1X - Ball possession","317":"12 - Ball possession","318":"X2 - Ball possession","319":"Asian Handicap1(%s) - Ball possession","320":"Asian Handicap2(%s) - Ball possession","321":"Total Over(%s) for Team1 - Ball possession","322":"Total Under(%s) for Team1 - Ball possession","323":"Total Over(%s) for Team2 - Ball possession","324":"Total Under(%s) for Team2 - Ball possession","325":"Team1 - 1st corner","326":"Team2 - 1st corner","327":"Team1 - Last corner","328":"Team2 - Last corner","329":"Team1 - 1st Yellow Card","330":"Team2 - 1st Yellow Card","331":"Team1 - Last Yellow Card","332":"Team2 - Last Yellow Card","333":"Team1 - 1st offside","334":"Team2 - 1st offside","335":"Team1 - Last offside","336":"Team2 - Last offside","337":"Home No Bet - No W2","338":"Away No Bet - No W1","339":"1X and Total Over 2.5 - yes","340":"1X and Total Over 2.5 - no","341":"1X and Total Under 2.5 - yes","342":"1X and Total Under 2.5 - no","343":"X2 and Total Over 2.5 - yes","344":"X2 and Total Over 2.5 - no","345":"X2 and Total Under 2.5 - yes","346":"X2 and Total Under 2.5 - no","348":"Overtime - yes","351":"Overtime - no","354":"Score Draw - yes","357":"Score Draw - no","360":"Race to 2 - Team1","363":"Race to 2 - Team2","366":"Race to 2 - Team1","369":"Race to 2 - neither","372":"Race to 2 - Team2","375":"Race to 3 - Team1","378":"Race to 3 - Team2","381":"Race to 3 - Team1","384":"Race to 3 - neither","387":"Race to 3 - Team2","390":"Race to 4 - Team1","393":"Race to 4 - Team2","396":"Race to 4 - Team1","399":"Race to 4 - neither","402":"Race to 4 - Team2","405":"Race to 5 - Team1","408":"Race to 5 - Team2","411":"Race to 5 - Team1","414":"Race to 5 - neither","417":"Race to 5 - Team2","420":"Race to 10 - Team1","423":"Race to 10 - Team2","426":"Race to 10 - Team1","429":"Race to 10 - neither","432":"Race to 10 - Team2","435":"Race to 15 - Team1","438":"Race to 15 - Team2","441":"Race to 15 - Team1","444":"Race to 15 - neither","447":"Race to 15 - Team2","450":"Race to 20 - Team1","453":"Race to 20 - Team2","456":"Race to 20 - Team1","459":"Race to 20 - neither","462":"Race to 20 - Team2","467":"Team1 - Next goal (draw no bet)","470":"Team2 - Next goal (draw no bet)","473":"Team1 - Next goal","476":"No next goal","479":"Team2 - Next goal","481":"1st - yes","484":"1st - no","487":"1st-3rd - yes","490":"1st-3rd - no","493":"W1","496":"W2","499":"TO(%s) - Hits","502":"TU(%s) - Hits","505":"TO(%s) for Team1 - Hits","508":"TU(%s) for Team1 - Hits","511":"TO(%s) for Team2 - Hits","514":"TU(%s) for Team2 - Hits","517":"TO(%s) - Errors","520":"TU(%s) - Errors","523":"TO(%s) - Hits+Errors+Runs","526":"TU(%s) - Hits+Errors+Runs","529":"AH1(%s) - Hits","532":"AH2(%s) - Hits","535":"1 - Hits","538":"X - Hits","541":"2 - Hits","546":"Team1 Win - Kills","549":"Team2 Win - Kills","552":"Asian Handicap1(%s) - Kills","555":"Asian Handicap2(%s) - Kills","558":"Total Over(%s) - Kills","561":"Total Under(%s) - Kills","564":"Total Over(%s) for Team1 - Kills","567":"Total Under(%s) for Team1 - Kills","570":"Total Over(%s) for Team2 - Kills","573":"Total Under(%s) for Team2 - Kills","574":"W1 - 1st blood","575":"W2 - 1st blood","576":"W1 - 1st tower","577":"W2 - 1st tower","578":"W1 - 1st dragon","579":"W2 - 1st dragon","580":"W1 - 1st baron","581":"W2 - 1st baron","582":"W1 - 1st inhibitor","583":"W2 - 1st inhibitor","584":"W1 - 1st roshan","585":"W2 - 1st roshan","586":"Win pistol rounds - Yes","587":"Win pistol rounds - No","588":"TO(%s) - Duration","589":"TU(%s) - Duration","590":"TO(%s) - Barons","591":"TU(%s) - Barons","592":"TO(%s) - Inhibitors","593":"TU(%s) - Inhibitors","594":"TO(%s) - Towers","595":"TU(%s) - Towers","596":"TO(%s) - Dragons","597":"TU(%s) - Dragons","598":"TO(%s) - Roshans","599":"TU(%s) - Roshans","600":"TO(%s) for Team1 - Sets","601":"TO(%s) for Team1 - Sets","602":"TO(%s) for Team2 - Sets","603":"TO(%s) for Team2 - Sets","604":"W1 - Longest TD","605":"W2 - Longest TD","606":"W1 - Longest FG","607":"W2 - Longest FG","608":"Touchdown - Yes","609":"Touchdown - No","610":"Safety - Yes","611":"Safety - No","612":"First score TD - Yes","613":"First score TD - No","614":"Both teams 10 pts - Yes","615":"Both teams 10 pts - No","616":"Both teams 15 pts - Yes","617":"Both teams 15 pts - No","618":"Both teams 20 pts - Yes","619":"Both teams 20 pts - No","620":"Both teams 25 pts - Yes","621":"Both teams 25 pts - No","622":"Both teams 30 pts - Yes","623":"Both teams 30 pts - No","624":"Both teams 35 pts - Yes","625":"Both teams 35 pts - No","626":"Both teams 40 pts - Yes","627":"Both teams 40 pts - No","628":"Both teams 45 pts - Yes","629":"Both teams 45 pts - No","630":"Both teams 50 pts - Yes","631":"Both teams 50 pts - No","632":"Highest Scoring Quarter - 1st","633":"Highest Scoring Quarter - 2nd","634":"Highest Scoring Quarter - 3rd","635":"Highest Scoring Quarter - 4th","636":"Highest Scoring Quarter - Tie","637":"TO(%s) - Field Goals","638":"TU(%s) - Field Goals","639":"TO(%s) - Touchdowns","640":"TU(%s) - Touchdowns","641":"TO(%s) - Longest TD, distance","642":"TU(%s) - Longest TD, distance","643":"TO(%s) - Longest FG, distance","644":"TU(%s) - Longest FG, distance","645":"TO(%s) for Team1 - Field Goals","646":"TU(%s) for Team1 - Field Goals","647":"TO(%s) for Team2 - Field Goals","648":"TU(%s) for Team2 - Field Goals","649":"TO(%s) for Team1 - Touchdowns","650":"TU(%s) for Team1 - Touchdowns","651":"TO(%s) for Team2 - Touchdowns","652":"TU(%s) for Team2 - Touchdowns","653":"AH1(%s) - Maps","654":"AH2(%s) - Maps","655":"TO(%s) - Maps","656":"TU(%s) - Maps","657":"TO(%s) for Team1 - Maps","658":"TU(%s) for Team1 - Maps","659":"TO(%s) for Team2 - Maps","660":"TU(%s) for Team2 - Maps","661":"Maps (%s)","662":"Maps (%s) - not","663":"Exact (%s) - Maps","664":"Exact (%s) - Maps - no","665":"Win both pistol rounds - Yes","666":"Win both pistol rounds - No","667":"Team1 to win both pistol rounds - Yes","668":"Team1 to win both pistol rounds - No","669":"Team2 to win both pistol rounds - Yes","670":"Team1 to win both pistol rounds - No","671":"Team1 to win at least 1 set - Yes","672":"Team1 to win at least 1 set - No","673":"Team2 to win at least 1 set - Yes","674":"Team1 to win at least 1 set - No","675":"Team1 to win at least 1 map - Yes","676":"Team1 to win at least 1 map - No","677":"Team2 to win at least 1 map - Yes","678":"Team1 to win at least 1 map - No","679":"Both teams kill a dragon - Yes","680":"Both teams kill a dragon - No","681":"Both teams kill a baron - Yes","682":"Both teams kill a baron - No","683":"W1 - 1st Barracks","684":"W2 - 1st Barracks","685":"W1 - 1st Double Kill","686":"W2 - 1st Double Kill","687":"TO(%s) - Barracks","688":"TU(%s) - Barracks","689":"TO(%s) - Double Kills","690":"TU(%s) - Double Kills","691":"AH1(%s) - Barons","692":"AH2(%s) - Barons","693":"AH1(%s) - Dragons","694":"AH2(%s) - Dragons","695":"AH1(%s) - Towers/Turrets","696":"AH2(%s) - Towers/Turrets","697":"1 - 3-points","698":"X - 3-points","699":"2 - 3-points","700":"1 - Rebounds","701":"X - Rebounds","702":"2 - Rebounds","703":"1 - Assists","704":"X - Assists","705":"2 - Assists","706":"1X - 3-points","707":"X2 - 3-points","708":"12 - 3-points","709":"1X - Rebounds","710":"X2 - Rebounds","711":"12 - Rebounds","712":"1X - Assists","713":"X2 - Assists","714":"12 - Assists","715":"AH1(%s) - 3-points","716":"AH2(%s) - 3-points","717":"AH1(%s) - Rebounds","718":"AH2(%s) - Rebounds","719":"AH1(%s) - Assists","720":"AH2(%s) - Assists","721":"TO(%s) - 3-points","722":"TU(%s) - 3-points","723":"TO(%s) - Rebounds","724":"TU(%s) - Rebounds","725":"TO(%s) - Assists","726":"TU(%s) - Assists","727":"TO(%s) for Team1 - 3-points","728":"TU(%s) for Team1 - 3-points","729":"TO(%s) for Team1 - Rebounds","730":"TU(%s) for Team1 - Rebounds","731":"TO(%s) for Team1 - Assists","732":"TU(%s) for Team1 - Assists","733":"TO(%s) for Team2 - 3-points","734":"TU(%s) for Team2 - 3-points","735":"TO(%s) for Team2 - Rebounds","736":"TU(%s) for Team2 - Rebounds","737":"TO(%s) for Team2 - Assists","738":"TU(%s) for Team2 - Assists"};

const PERIODS = {1: "match (pairs)", 2: "with OT and SO", 3: "with OT", 4: "regular time", 5: "1st", 6: "2nd", 7: "3rd", 8: "4th", 9: "5th", 10: "1st half", 13: "2nd half", 14: "1 set, 01 game", 15: "1 set, 02 game", 16: "1 set, 03 game", 17: "1 set, 04 game", 18: "1 set, 05 game", 19: "1 set, 06 game", 20: "1 set, 07 game", 21: "1 set, 08 game", 22: "1 set, 09 game", 23: "1 set, 10 game", 24: "1 set, 11 game", 25: "1 set, 12 game", 26: "1 set, 13 game", 44: "2 set, 01 game", 45: "2 set, 02 game", 46: "2 set, 03 game", 47: "2 set, 04 game", 48: "2 set, 05 game", 49: "2 set, 06 game", 50: "2 set, 07 game", 51: "2 set, 08 game", 52: "2 set, 09 game", 53: "2 set, 10 game", 54: "2 set, 11 game", 55: "2 set, 12 game", 56: "2 set, 13 game", 57: "3 set, 01 game", 58: "3 set, 02 game", 59: "3 set, 03 game", 60: "3 set, 04 game", 61: "3 set, 05 game", 62: "3 set, 06 game", 63: "3 set, 07 game", 64: "3 set, 08 game", 65: "3 set, 09 game", 66: "3 set, 10 game", 67: "3 set, 11 game", 68: "3 set, 12 game", 71: "3 set, 13 game", 76: "6th", 78: "7th", 86: "regular time", 92: "regular time", 93: "1st half", 95: "to qualify", 96: "8th", 97: "9th", 113: "4 set, 01 game", 114: "4 set, 02 game", 115: "4 set, 03 game", 116: "4 set, 04 game", 117: "4 set, 05 game", 118: "4 set, 06 game", 119: "4 set, 07 game", 120: "4 set, 08 game", 121: "4 set, 09 game", 122: "4 set, 10 game", 123: "4 set, 11 game", 124: "4 set, 12 game", 125: "5 set, 01 game", 126: "5 set, 02 game", 127: "5 set, 03 game", 128: "5 set, 04 game", 129: "5 set, 05 game", 130: "5 set, 06 game", 131: "5 set, 07 game", 132: "5 set, 08 game", 133: "5 set, 09 game", 134: "5 set, 10 game", 156: "4 set, 13 game", 159: "5 set, 11 game", 161: "5 set, 12 game", 169: "5 set, 13 game", 223: "regular time", 243: "1st half", 245: "2nd half", 246: "2nd half", 317: "1st half", 318: "2nd half", 4091: "regular time", 4094: "1st half"};




// let BASE_URL = "https://rest-api-lv.betburger.com";
const ax = axios.create({
  baseURL: "https://rest-api-lv.betburger.com",
  headers: {
    'Content-Type': 'application/x-www-form-urlencoded',
    'Accept' : 'application/json'
  }
  // timeout: 1000,
});

const ax2 = axios.create({
  baseURL: "https://rest-api-pr.betburger.com",
  headers: {
    'Content-Type': 'application/x-www-form-urlencoded',
    'Accept' : 'application/json'
  }
  // timeout: 1000,
});

module.exports = MD=>{
  let {
    getEventKeyNames,
    getEventKeys,
    getEventKey,
    setGameData,
    pullGameData,
    util,
    setRedis,
    getRedis,
    room_checker,
    room_bettor,
    argv,
    redisClient,
    io,
    mongoose,
    sendDataToMain,
    sendDataToBg,
    sendDataToBet365,
    emitToMember,
    emitToAdmin,
    emitToProgram,
    emitToProgramPromise,
    socketResolveList,
    config,
    comma,
    router,
    User,
    Program,
    Browser,
    BetData,
    Event,
    Log,
    BenEvent,
    Proxy,
    Withdraw,
    AccountWithdraw,
    Account,
    Option,
    Approval,
    Setting,
    DepositLog,
    Data,
    BackupHistory,
    authAdmin,
    authMaster,
    task,
    deposit,
    approvalTask,
    refreshTab,
    refreshMoney,
    refreshBet365Money,
    refreshBet365TotalMoney,
    updateBet365Money,
    updateBet365TotalMoney,
    getSetting,
    calc,
    MoneyManager,
    uuidv4
  } = MD;

  let job1, job2;

  if(argv[0] == "master" || process.env.NODE_ENV === undefined){
    // init();
  }


  // router.get("/test", async (req, res)=>{
  //   // let list = await loadArbs("betburger1", "Live", 10);
  //
  //
  //   // let list = await betburgerEventProcess("betburger1");
  //   // res.json(list);
  //
  //
  //
  //   // let ben = await BenEvent.create({
  //   //   key: "test",
  //   //   expire: null,
  //   //   msg: "test1",
  //   //   betburgerEventId: 12345,
  //   //   dataType: "test1"
  //   // })
  //   //
  //   // res.json(ben);
  //
  //   // let ben = await BenEvent.count({
  //   //   $and: [
  //   //     {key:"test"},
  //   //     {createdAt: {$gte: new Date(Date.now()-1000*60*60)}}
  //   //   ]
  //   // })
  //   //
  //   // res.json(ben);
  //
  //
  //   // let list = await Promise.all([
  //   //   // loadArbs("betburger1", true, 10),
  //   //   null,
  //   //   loadArbs("betburger1", false, 10, [244183721])
  //   // ]);
  //   //
  //   // list.forEach((a,i)=>{
  //   //   console.log(['live', 'prematch'][i], a?a.length:0);
  //   // })
  //   //
  //   // list = list.filter(a=>!!a).flat();
  //   //
  //   // // console.error(list);
  //   // console.error(list.length);
  //   //
  //   // res.json(list);
  //
  //   // io.to("admin").emit("sound", {name:"refreshToken", loop:1});
  // })


  function stopJob(){
    if(job1){
      job1.stop();
    }
    if(job2){
      job2.stop();
    }
  }

  function init(){
    job1 = new CronJob('*/3 * * * * *', function() {
      let dataType = "betburger1";
      betburgerEventProcess(dataType);
    });
    job1.start();

    job2 = new CronJob('*/3 * * * * *', function() {
      let dataType = "betburger2";
      betburgerEventProcess(dataType);
    })
    job2.start();
  }

  function haveToRefreshToken(list){
    // console.log(list);
    for(let i=0; i<list.length; i++){
      let bets = list[i];
      if(!(bets[0].bookmaker_id == 1 || bets[0].bookmaker_id == 10)){
        return true;
      }
      if(!(bets[1].bookmaker_id == 1 || bets[1].bookmaker_id == 10)){
        return true;
      }
    }
  }

  async function betburgerEventProcess(dataType){
    let list = await Promise.all([

      loadArbs(dataType, true, 10),
      // null,
      loadArbs(dataType, false, 10)
    ]);

    list.forEach((a,i)=>{
      console.log(dataType, ['live', 'prematch'][i], a?a.length:0);
    })

    list = list.filter(a=>!!a).flat();

    if(haveToRefreshToken(list)){
      console.log("!!!!! have to change betburger api token !!!!!")
      list = null;
      io.to("admin").emit("sound", {name:"refreshToken", loop:1});
    }

    if(list && list.length){
      // let temp = JSON.stringify(list);


      list = list.map(bets=>{
        /// test
        let l;
        try{
          l = calcProfit(bets.map((data,i)=>{
            return makeData(wrapData(data), i);
          }))
        }catch(e){
          // stopJob();
          // console.log(temp);
          console.error(e);
        }

        return l;
      })
      .filter(a=>!!a)
      .filter(check)
      .sort(sort)
      .map(bets=>{
        return bets.reduce((r,bet)=>{
          r[bet.bookmaker] = bet;
          return r;
        }, {});
      })


      console.log(`receive gamedata ${dataType}: ` + list.length, (new Date()).toLocaleTimeString());
      await setGameData(JSON.stringify(list), dataType);
    }else{
      await setGameData('empty', dataType);
    }
    return list;
    // io.to(room_checker).emit("gamedata", list);
  }

  function calcProfit(bets){
    let p = calc.profitP(bets[0].odds, bets[1].odds, 1);
    bets[0].profitP = p;
    bets[1].profitP = p;
    return bets;
  }

  function profitSort(a,b){
    return b.profitP - a.profitP;
  }

  function wrapData(data){
    data.sports = SPORTS[data.sport_id]||'';
    data.bookmaker = (BOOKMAKERS[data.bookmaker_id]||'').toLowerCase();
    data.bet_type = BET_TYPES[data.market_and_bet_type]||'';
    if(data.market_and_bet_type_param){
      data.bet_type = data.bet_type.replace('%s', data.market_and_bet_type_param);
    }
    data.period = PERIODS[data.period_id]||'';
    return data;
  }

  function makeData(data, index){
    let betType, team, side, handicap;
    let homeAway = index%2==0 ? "home" : "away";
    /// test
    // if(data.swap_teams){
    //   homeAway = index%2==0 ? "away" : "home";
    // }else{
    //   homeAway = index%2==0 ? "home" : "away";
    // }

    if(data.bet_type.indexOf("Total") > -1){
      betType = "TOTAL_POINTS";
      side = data.bet_type.indexOf("Over") > -1 ? "OVER" : "UNDER";
      handicap = data.market_and_bet_type_param || 0;
    }else{
      if(data.bet_type.indexOf("Handicap") > -1){
        betType = "SPREAD";
        handicap = data.market_and_bet_type_param || 0;
      }else{
        betType = "MONEYLINE";
      }
      if(data.bet_type.indexOf("Handicap1") > -1){
        homeAway == "home";
        team = "Team1";
      }else if(data.bet_type.indexOf("Handicap2") > -1){
        homeAway == "away";
        team = "Team2";
      }else{
        team = homeAway == "home" ? "Team1" : "Team2";
      }
    }

    let type = {
      code: data.bet_type,
      set: data.period
    }

    let periodNumber = 0;
    if(data.period.indexOf("1st") > -1){
      periodNumber = 1;
    }else if(data.period.indexOf("2nd") > -1){
      periodNumber = 2;
    }

    let betLink;
    if(data.bookmaker == "bet365"){
      let dlink = data.direct_link.split('|');
      betLink = `https://www.bet365.com/dl/sportsbookredirect/?bs=${dlink[2]}-${dlink[0]}~${data.koef}&bet=1#${data.bookmaker_event_direct_link}`;
    }

    return {
      betType, team, side, homeAway, handicap, periodNumber, type, betLink,
      // origin: data,
      id: data.id,
      eventId: data.direct_link.split('|')[0].split('/')[0],
      betburgerEventId: data.event_id,
      arbHash: data.arbHash,
      directLink: data.direct_link,
      bookmakerDirectLink: data.bookmaker_event_direct_link,
      bookmaker: data.bookmaker,
      home: data.home,
      away: data.away,
      homeScore: data.home_score,
      awayScore: data.away_score,
      sports: data.sports,
      odds: data.koef,
      score: data.current_score ? data.current_score.replace("-", ":") : data.current_score,
      corner: data.corner,
      isLive: data.is_live,
      leagueName: data.bookmaker_league_name,
      eventName: data.bookmaker_event_name,
      periodName: data.period,
      swapTeams: data.swap_teams
    }
  }

  function check(bets){
    // console.error("bets", bets);
    if(!bets || bets.length < 2) return;
    if(bets[0].bookmaker == bets[1].bookmaker){
      console.log("!! same bookmaker");
      return;
    }

    // 타입이 다를수있넹. 주석처리한다.
    // if(bets[0].betType !== bets[1].betType){
    //   console.log("!! not same betType");
    //   return;
    // }

    // if(!(bets[0].bookmaker == "bet365" || bets[0].bookmaker == "pinnacle")){
    //   console.log("!! another bookmaker", bets[0].bookmaker);
    //   return;
    // }
    // if(!(bets[1].bookmaker == "bet365" || bets[1].bookmaker == "pinnacle")){
    //   console.log("!! another bookmaker", bets[1].bookmaker);
    //   return;
    // }
    if((!bets[0].team && !bets[0].side) || (!bets[1].team && !bets[1].side)){
      console.log("!! not found team or side");
      return;
    }
    if(bets[0].sports == "E-Sports") return;

    if(bets[0].swapTeams || bets[1].swapTeams){
      console.log("!! swap teams");
      return;
    }

    if(bets[0].handicap && (Math.abs(bets[0].handicap) % 1 == 0.25 || Math.abs(bets[0].handicap) % 1 == 0.75)){
      console.log("!! 0.25 0.75 handicap");
      return;
    }
    if(bets[1].handicap && (Math.abs(bets[1].handicap) % 1 == 0.25 || Math.abs(bets[1].handicap) % 1 == 0.75)){
      console.log("!! 0.25 0.75 handicap");
      return;
    }
    if(bets[0].betburgerEventId !== bets[1].betburgerEventId){
      console.log("!! not same betburger event id");
      return;
    }

    return true;
  }

  // bets
  function sort(a, b){
    if(a[0].betType == b[0].betType){
      return b[0].profitP - a[0].profitP;
    }else{
      if(a[0].betType == "MONEYLINE") return 1;
      if(b[0].betType == "MONEYLINE") return -1;
      return b[0].profitP - a[0].profitP;
    }
  }

  function makeBetsGroup(data){
    if(data){
      // console.log(data.arbs);
      // console.log(data.bets);
      return data.arbs.map(a=>{
        let arr = [
          data.bets.find(b=>b.id==a.bet1_id),
          data.bets.find(b=>b.id==a.bet2_id)
        ];
        arr.forEach(bet=>{
          if(bet){
            bet.arbHash = a.arb_hash;
          }
        })

        return arr;
      }).filter(bets=>{
        return (bets[0] && bets[1]) && bets[0].event_id == bets[1].event_id;
      })
      // console.log(l);
      // return l;
    }
  }



  async function loadArbs(dataType, isLive=true, perPage=20, exclude){
    let setting = await getSetting();
    let filterId, token;//, count;
    let arbsType = isLive ? "Live" : "Prematch";
    if(setting){
      filterId = setting[dataType+arbsType+'FilterId'];
      // console.log(dataType, filterId);
      token = setting.betburgerApiToken;
      // count = setting.betburgerPerPage;
    }

    // console.error(dataType, arbsType, perPage, filterId);

    if(!filterId){
      return null;
    }

    if(!token){
      console.error("wrong betburger settings");
      return null;
    }
    // console.log({filterId});
    let data = {
      access_token: token,
      search_filter: filterId,
      // per_page: forcePerPage || count || 20,
      per_page: perPage,
      grouped: 1,
      show_event_arbs: true,
      sort_by: "percent"
    }
    // if(exclude){
    //   data["excluded_events"] = exclude;
    // }
    // data['search_filter%5B%5D'] = filterId;
    // data['excluded_events%5B%5D'] = ;

    const params = new URLSearchParams();
    for(let o in data){
      params.append(o, data[o]);

      // if(Array.isArray(data[o])){
      //   for(let i in data[o]){
      //     params.append(o, data[o][i]);
      //   }
      // }else{
      //   params.append(o, data[o]);
      // }
    }

    let a = arbsType=="Live"?ax:ax2;
    return a.post("/api/v1/arbs/bot_pro_search", params)
    .then(res=>{
      // return res.data?res.data.bets:null
      return makeBetsGroup(res.data);
    })
    .catch(e=>{
      console.error(e);
      return null;
    })
  }

}
