var rq = require('request');

const FLEET_URL = "https://preview.twilio.com/DeployedDevices/Fleets/";

var AccessToken = Twilio.jwt.AccessToken;

exports.handler = function(context, event, callback) {
  let username = event.username;
  let pincode = event.pincode;

  if (!username) return callback(null, { success: false, error: "username is not defined in event" });
  if (!pincode) return callback(null, { success: false, error: "pincode is not defined in event" });
  if (!Authorization.auth(context, username, pincode)) return callback(null, { success: false, error: "username or token provided is invalid" });

  let op = event.op;
  let fleetUrl = FLEET_URL + context.FLEET_SID;

  switch (op) {
    case 'list': {
      // WARNING!! only support up to 50 devices for simplicity, improve it using pagination API
      rq.get(fleetUrl + "/Devices", function (error, response, body) {
          if (error) return callback(null, { success: false, error: error });
          if (response.statusCode !== 200) return callback(null, { success: false, error: body });
          callback(null, { success: true, vehicles: JSON.parse(body).devices });
      }).auth(context.API_KEY, context.API_SECRET);
    }
    break;
    case 'add': {
      let vehicle_id = event.vehicle_id;
      if (!vehicle_id) return callback(null, { success: false, error: "vehicle_id is not defined in event" });
      if (!vehicle_id.match(/^[a-zA-Z0-9]+$/)) return callback("Invalid vehicle id (use english alphabet and numbers only): " + vehicle_id);      
      let vehicle_name = event.vehicle_name;
      if (!vehicle_name) return callback(null, { success: false, error: "vehicle_name is not defined in event" });
      rq.post(fleetUrl + "/Devices",  {form: {
          FriendlyName: vehicle_name,
          UniqueName: vehicle_id
        }}, function (error, response, body) {
          if (error) return callback(null, { success: false, error: error });
          if (response.statusCode !== 201) return callback(null, { success: false, error: body });
          let vehicle = JSON.parse(body);
          rq.post(fleetUrl + "/Keys", {form:{
            DeviceSid: vehicle.sid
          }}, function (error, response, body) {
            if (response.statusCode !== 201) return callback(null, { success: false, error: body });
            callback(null, { success: true, vehicle: vehicle, key: JSON.parse(body) });
          }).auth(context.API_KEY, context.API_SECRET);
      }).auth(context.API_KEY, context.API_SECRET);
    }
    break;
    case 'delete': {
      let vehicle_id = event.vehicle_id;
      if (!vehicle_id) return callback(null, { success: false, error: "vehicle_id is not defined in event" });
      rq.delete(fleetUrl + "/Devices/" + encodeURIComponent(vehicle_id), function (error, response, body) {
        if (response.statusCode !== 204) return callback(null, { success: false, error: body });
        callback(null, { success: true });
      }).auth(context.API_KEY, context.API_SECRET);
    }
    break;
    case 'genkey': {
      let vehicle_id = event.vehicle_id;
      if (!vehicle_id) return callback(null, { success: false, error: "vehicle_id is not defined in event" });
      rq.get(fleetUrl + "/Devices/" + vehicle_id, function (error, response, body) {
        if (error) return callback(null, { success: false, error: error });
        let vehicle = JSON.parse(body);
        rq.post(fleetUrl + "/Keys", {form:{
          DeviceSid: vehicle.sid
        }}, function (error, response, body) {
          if (response.statusCode !== 201) return callback(null, { success: false, error: body });
          callback(null, { success: true, vehicle_id: vehicle_id, key: JSON.parse(body) });
        }).auth(context.API_KEY, context.API_SECRET);
      }).auth(context.API_KEY, context.API_SECRET);
    }
    break;
    default:
      return callback(null, {
          success: false,
          error: "Unknown operation request: " + op
      });
  }
}
