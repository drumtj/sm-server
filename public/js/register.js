console.log('register.js');
(()=>{
  let $email = $("#form-email");
  let $password = $("#form-pw");
  let $password2 = $("#form-pw2");
  let spinner = Ladda.create($("#btn-register").get(0));

  async function init(){
    // console.log("wait socketReady");
    // await socketReady;
    // setupSocket();

    $password2.on("input", e=>{
      let password = $password.val();
      let password2 = $password2.val();

      if(!password || password !== password2){
        $password2.removeClass("border-success").addClass("border-danger");
      }else{
        $password2.toggleClass("border-danger").addClass("border-success");
      }
    })

    if($email.val()){
      $password.focus();
    }else{
      $email.focus();
    }



    $password2.on("keydown", e=>{
      if(e.keyCode == 13){
        register();
      }
    })

    $("#btn-register").on("click", e=>{
      register();
    })
  }

  function register(){
    let email = $email.val();
    let password = $password.val();
    let password2 = $password2.val();

    if(!email){
      modal("알림", "Email을 입력해주세요");
      return;
    }

    if(!password){
      modal("알림", "password를 입력해주세요");
      return;
    }

    if(!password2){
      modal("알림", "password2를 입력해주세요");
      return;
    }

    if(password !== password2){
      modal("알림", "비밀번호확인이 틀립니다.");
      return;
    }

    if(!expgen('&email').test(email)){
      modal("알림", "Email형식이 아닙니다");
      return;
    }

    // console.error({email, password});
    spinner.start();
    axios.post('/user/register', {email, password}).then(res=>{
      if(res.data.status == "success"){
        modal("알림", "가입신청이 완료됐습니다. 승인이 완료돼야 사용가능합니다.").then(()=>{
          spinner.stop();
          window.location.href = '/login';
        })
      }else{
        modal("알림", res.data.message).then(()=>{
          spinner.stop();
        });
        console.error(res);
      }
    })
  }

  // function setupSocket(){
  //   // socket.on("", ()=>{
  //   //
  //   // })
  //
  // }

  init();
  // appReadyResolve();
})()
