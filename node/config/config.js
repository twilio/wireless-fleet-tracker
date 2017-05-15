module.exports = function() {
  var config;
  config = {
    "sqlite3" : "./config/copilot.sqlite",
    "twilio": {
      "account_sid": "AC55b7fcc248e6ff5e565858544de7f613",
      "auth_token": "e9e9d0742696be6424469bb631b79ae8"
    }
  };
  return config;
}();
