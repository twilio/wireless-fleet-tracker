global.Authorization = {
  auth: function (context, username, pincode) {
    var pincodes = JSON.parse(context.PINCODES);
    return pincodes[username] === pincode;
  }
};
