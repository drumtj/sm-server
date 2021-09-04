
module.exports = {
  DB_URI: "mongodb://localhost/sm",
  BACKUP_PATH: "./backup_db",
  
  MAX_LOG_LENGTH: 500,

  // 페이지당 계정 수
  ACCOUNT_LIST_COUNT_PER_PAGE: 10,
  // 페이지당 프록시 수
  PROXY_LIST_COUNT_PER_PAGE: 10,
  // 페이지 수
  PAGE_COUNT: 10,


  //// db setting에 정보가 없으면 이것을 쓴다.
  // 프로그램 기본 제한수
  PROGRAM_COUNT: 2,
  // 프로그램 당 기본 브라우져 제한수
  BROWSER_COUNT: 6
}
