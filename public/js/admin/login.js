console.log('admin-login.js');
let $email = $("#form-email");
let $password = $("#form-pw");

let spinner = Ladda.create($('#btn-login').get(0));
$password.on("keydown", e=>{
  if(e.keyCode == 13){
    login();
  }
})

$("#btn-login").on("click", e=>{
  login();
})

$("#btn-register").on("click", e=>{
  window.location.href = "/register?email=" + $email.val();
})

function login(){
  let email = $email.val();
  let password = $password.val();

  if(!email){
    modal("알림", "Email을 입력해주세요");
    $email.select();
    return;
  }

  if(!password){
    modal("알림", "password를 입력해주세요");
    $password.select();
    return;
  }

  if(!expgen('&email').test(email)){
    modal("알림", "Email형식이 아닙니다");
    $email.select();
    return;
  }

  spinner.start();

  // console.error({email, password});
  axios.post('/user/login', {email, password}).then(res=>{
    spinner.stop();
    if(res.data.status == "success"){
      if(res.data.admin){
        window.location.href = '/admin';
      }else{
        modal("알림", "Admin계정이 아닙니다.");
      }
    }else{
      modal("알림", res.data.message);
      $password.select();
    }
  })
}
// $("#btn-login").onclick = function(){
//   let email = $("#form-email").value;
//   let password = $("#form-pw").value;
//
//   // console.error({email, password});
//   axios.post('/user/login', {email, password}).then(res=>{
//     if(res.data.status == "success"){
//       window.location.href = '/';
//     }else{
//       modal("알림", "로그인 실패");
//     }
//   })
// }
