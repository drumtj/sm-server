console.log('connect.js');

(async ()=>{
  let myip = ip();
  console.log("ip", myip);
  sendData("sendIP", myip);
})()
