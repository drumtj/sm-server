const router = require("express").Router();
const User = require('../models/User');
const Setting = require('../models/Setting');
const config = require('../config');
const {
  generateSalt,
  hash,
  compare
} = require('../hash');

async function getSetting(){
  let data = await Setting.findOne().sort({createdAt:-1});
  if(data){
    return data.value;
  }
}

module.exports = (io, store)=>{

  // io.on('connection', socket=>{
  //   console.log("@@@@@socket connected", socket.id);
  // })

  let salt = generateSalt(10);

  router.post("/register", async (req, res) => {
    try {
      let {
        email,
        password
      } = req.body;
      let user = await User.findOne({
        email: email
      })
      if(user){
        let message;
        if(user.allowed){
          message = "이미 가입된 계정입니다.";
        }else{
          message = "가입승인 대기중인 계정입니다.";
        }
        return res.status(200).json({
          status: "fail",
          message
        })
      }
      let setting = await getSetting();
      user = new User({
        // name: req.body.name,
        ip: req.clientIp.replace('::ffff:', ''),//req.connection.remoteAddress,
        email: req.body.email,
        password: await hash(req.body.password, salt), // dont remove the await
        programCount: setting?setting.programLimit:config.PROGRAM_COUNT,
        browserCount: setting?setting.browserLimit:config.BROWSER_COUNT
      })
      let response = await user.save();
      io.to('admin').emit('requestUserRegist');
      // io.$.emit('admin', 'requestUserRegist');
      // console.error(io.to('admin'));
      return res.status(200).json({
        status: "success",
        user: response
      })
      // 가입후 승인전에는 사용 못하여야하므로 주석
      // req.session.email = req.body.email;
      // return req.session.save(()=>{
      //   res.status(200).json({
      //     status: "success",
      //     data: response
      //   })
      // })
    } catch (err) {
      //handle error
      console.error(err);
      res.status(500);
    }
  })

  router.post('/login', async (req, res) => {
    try {
      let {
        email,
        password
      } = req.body;
      let user = await User.findOne({
        email: email
      });//.select(["email", "allowed", "authority", "password", "master"]);

      if (!user) {
        return res.status(200).json({
          status: "fail",
          message: "가입되지 않은 이메일입니다."
        })
      }
      if(!user.allowed){
        return res.status(200).json({
          status: "fail",
          message: "승인 대기중인 계정입니다."
        })
      }
      let match = await compare(password, user.password);
      // console.log(password, user.password, match);
      if (match) {

        ////////////// 중복 로그인 체크
        // console.log("@@@@@@@@@SESSION CHECK");
        store.all((_, sessions) => {
          sessions.forEach( e=> {
            // 세션에 사용자 정보가 담겨있고, 담겨있는 사용자의 아이디와 현재 세션의 사용자 아이디가 같지만
            // 세션의 ID가 다른 경우 다른 디바이스에서 접속한걸로 간주하고 이전에 등록된 세션을 파괴한다.
            if (e.user && e.user.email == user.email && e.id != req.session.id) {
              console.log("destroy session", e.user.email);
              if(e.socketId){
                // console.log("SOCKET CLOSE!!!!", e.socketId);
                if(io.sockets.sockets[e.socketId]){
                  try{
                    io.sockets.sockets[e.socketId].close();
                  }catch(e){}
                }
                // e._socket.close();
              }
              store.destroy(e.id, error=> {
                /* redis 오류로 인한 에러 핸들링 */
                if(error){
                  console.error("session destroy error", error);
                  return;
                }
                io.to(user.email).emit("destroyedSession");
              });
            }
          });
        });
        ///////////////////

        // console.error(user);
        let isAdmin = !!user.authority || user.master;
        delete user.password;
        req.session.user = user;
        req.session.admin = isAdmin;
        req.session.master = user.master;
        // console.log("## admin", isAdmin);
        // console.log("## user", user);
        // console.log("??", req.app.locals);
        // 로긴할때 한번만 유저 권한에 따른 pages리스트를 구성해준다
        req.session.pages = req.app.locals.pages.filter(page=>{
          // console.log(user.authority, page.link);
          return !page.admin||(user.authority&&user.authority[page.link])||user.master
        })
        // console.log("## pages", req.session.pages);
        req.session.save(()=>{
          res.status(200).json({
            status: "success",
            message: "로그인 완료",
            admin: isAdmin
          })
        })

        // console.log(user);
        // req.session.email = user.email;
        // return req.session.save(()=>{
        //   res.redirect('/');
        // })

      }else{
        res.status(200).json({
          status: "fail",
          message: "비밀번호가 일치하지 않습니다."
        })
      }
    } catch (err) {
      // handle error
      console.error(err);
      res.status(500);
    }
  })



  // router.post("/load_chunks", (req, res)=>{
  //   // console.error("!load_chunks");
  //   // res.sendStatus(200);
  //   Chunk.findAll(req.body.chunks)
  //     .then(chunks=>{
  //       // console.log("chunks", chunks);
  //       // let data = [];
  //       // chunks.forEach(c=>data.push(c.map));
  //       // res.send(...data);
  //       let data = {};
  //       chunks.forEach(c=>{
  //         data[c.hash] = c.map;
  //       })
  //       // console.error("result", data);
  //       res.status(200).send(data);
  //     })
  //     .catch(err=>res.status(500).send(err));
  //     // console.error("!!load_chunks", req.params.hashs);
  // })

  return router;
}
