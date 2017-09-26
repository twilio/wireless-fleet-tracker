global.Authorization = {
  auth: function (context, username, pincode) {
    var pincodes = JSON.parse(context.PINCODES);
    return pincodes[username] === pincode;
  }
};

var AccessToken = Twilio.jwt.AccessToken;

exports.handler = function(context, event, callback) {
  //let client = context.getTwilioClient(); // this returns a wrong version of Twilio, waiting for the fix
  let client = new Twilio(context.ACCOUNT_SID, context.AUTH_TOKEN);
  let DeployedDevices = client.preview.deployed_devices;
  let username = event.username;
  let pincode = event.pincode;

  if (!username) return callback(null, { success: false, error: "username is not defined in event" });
  if (!pincode) return callback(null, { success: false, error: "pincode is not defined in event" });
  if (!Authorization.auth(context, username, pincode)) return callback(null, { success: false, error: "username or token provided is invalid" });

  let op = event.op;

  switch (op) {
    case 'list': {
      DeployedDevices.fleets(context.FLEET_SID).devices.list()
      .then(function (response) {
          callback(null, { success: true, vehicles: response });
      })
      .catch(function (error) {
          callback(null, { success: false, error: error.toString() });
      });
    }
    break;
    case 'add': {
      let vehicle_id = event.vehicle_id;
      if (!vehicle_id) return callback(null, { success: false, error: "vehicle_id is not defined in event" });
      if (!vehicle_id.match(/^[a-zA-Z0-9-]+$/)) return callback(null, { success: false, error: "Invalid vehicle id (use english alphabet and numbers only): " + vehicle_id });
      let vehicle_name = event.vehicle_name;
      if (!vehicle_name) return callback(null, { success: false, error: "vehicle_name is not defined in event" });
      let result = { success: true };
      DeployedDevices.fleets(context.FLEET_SID).devices.create({
          friendlyName: vehicle_name,
          uniqueName: vehicle_id
      })
      .then(function (response) {
          result.vehicle = response;
          return DeployedDevices.fleets(context.FLEET_SID).keys.create({
            deviceSid: response.sid
          })
      })
      .then(function (response) {
          result.key = response;
          callback(null, result);
      })
      .catch(function (error) {
          if (error) return callback(null, { success: false, error: error.toString() });
      });
    }
    break;
    case 'delete': {
      let vehicle_id = event.vehicle_id;
      if (!vehicle_id) return callback(null, { success: false, error: "vehicle_id is not defined in event" });
      DeployedDevices.fleets(context.FLEET_SID).devices(vehicle_id).remove()
      .then(function () {
        callback(null, { success: true });      
      })
      .catch(function (error) {
        callback(null, { success: false, error: error.toString() });
      });
    }
    break;
    case 'genkey': {
      let vehicle_id = event.vehicle_id;
      if (!vehicle_id) return callback(null, { success: false, error: "vehicle_id is not defined in event" });
      DeployedDevices.fleets(context.FLEET_SID).devices(vehicle_id).fetch()
      .then(function (response) {
        return DeployedDevices.fleets(context.FLEET_SID).keys.create({
          deviceSid: response.sid
        });        
      })
      .then(function (response) {
        callback(null, { success: true, vehicle_id: vehicle_id, key: response });      
      })
      .catch(function (error) {
        callback(null, { success: false, error: error.toString() });
      });      
    }
    break;
    default:
      return callback(null, {
          success: false,
          error: "Unknown operation request: " + op
      });
  }
}
