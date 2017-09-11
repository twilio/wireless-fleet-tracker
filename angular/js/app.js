'use strict';

const MOMENT_FORMAT = "MMM DD YYYY @ hh:mm";

var moment = require("moment");

module.exports = function(callbacks) {
  var $ = require("jquery");
  var SyncClient = require("twilio-sync").Client;
  var syncClient;
  var token;
  var auth;

  var vehicles = {};


  function initVehicleExtraInfo(id, extraInfo) {
    return syncClient.document("vehicle-" + id + "-info").then(function (document) {
      console.log("initVehicleExtraInfo", id, extraInfo);
      return document.set(extraInfo);
    });
  }

  function fetchVehicleExtraInfo(id) {
    return syncClient.document("vehicle-" + id + "-info").then(function (document) {
      console.log("fetchVehicleExtraInfo", id, document.value);
      return document.value;
    });
  };

  function subscribeToVehicleData(id) {
    syncClient.list("vehicle-" + id + "-data").then(function (list) {
      list.getItems({ limit: 100 }).then(function (page) {
        console.info("items arrived", id, page.items.length);
        vehicles[id].driving_data = page.items.map(function (item) {
          item.data.value.id = item.index;
          callbacks.onVehicleData(vehicles[id], item.data.value);
          return item.data.value;
        });
      });
      list.on("itemAdded", function (item) {
        console.info("itemAdded", id, item);
        item.data.value.id = item.index;
        vehicles[id].driving_data.push(item.data.value);
        callbacks.onVehicleData(vehicles[id], item.data.value);
      });
    });
  };

	return {
    vehicles: vehicles,

    updateToken: function (cb) {
      var that = this;
      return $.get("/authenticate?" + auth, function (result) {
        if (result.success) {
          console.log("token updated:", result);
          if (cb) {
            cb(result.sync_token, result.twiml_app_token);
          } else {
            syncClient.updateToken(result.sync_token);
            Twilio.Device.setup(result.twiml_app_token);
          }
          setTimeout(that.updateToken.bind(that), result.ttl*1000 * 0.96); // update token slightly in adance of ttl
        } else {
          console.error("failed to authenticate the user: ", result.error);
          auth="";
          callbacks.authFailed(result.error);
        }
      }).fail(function (jqXHR, textStatus, error) {
        console.error("failed to send authentication request:", textStatus, error);
        auth="";
        callbacks.authFailed(error);
      });
    },

    refreshVehicleList: function () {
      $.get("/fleetmanager?"+ auth + "&op=list", function (result) {
        if (result.success) {
          $.when.apply($, $.map(result.vehicles, function (vehicle) {
            var id = vehicle.unique_name;
            vehicles[id] = {
              info: {
                id: id,
                name: vehicle.friendly_name,
                created_at: moment(vehicle.date_created).format(MOMENT_FORMAT)
              },
              driving_data: []
            };
            return fetchVehicleExtraInfo(id).then(function (extraInfo) {
              vehicles[id].info = $.extend(vehicles[id].info, extraInfo);
              subscribeToVehicleData(vehicle.unique_name);
            });
          })).done(function () {
            callbacks.refresh();
          });
        } else {
          console.error("failed to list vehicles:", result);
        }
      }).fail(function (jqXHR, textStatus, error) {
        console.error("failed to send list vehicles request:", textStatus, error);
      });
    },

    addVehicle: function (newVehicle, callback) {
      if (!newVehicle.id) {
        return callback({success: false, error: "Vehicle id should not be empty"});
      }
      $.get("/fleetmanager?" + auth + "&op=add&vehicle_id="+newVehicle.id.toUpperCase()+"&vehicle_name="+(newVehicle.name||""), function (result) {
        if (result.success) {
          var extraInfo = {
            type: newVehicle.type,
            mobile: newVehicle.mobile,
          };
          var vehicleAdded = {
            info: $.extend({
              id: result.vehicle.unique_name,
              name: result.vehicle.friendly_name,
              created_at: moment(result.vehicle.date_created).format(MOMENT_FORMAT),
              key: result.key.sid,
              secret: result.key.secret
            }, extraInfo),
            driving_data: []
          };
          vehicles[result.vehicle.unique_name] = vehicleAdded;          
          initVehicleExtraInfo(result.vehicle.unique_name, extraInfo)
          .then(function () {
            subscribeToVehicleData(result.vehicle.unique_name);
            callback(null, vehicleAdded);
          });
        } else {
          callback(result);
        }
      }).fail(function (jqXHR, textStatus, error) {
        callback({success: false, error: error});
        console.error("failed to send add vehicle request:", textStatus, error);
      });
    },

    deleteVehicle: function (vehicleId) {
      $.get("/fleetmanager?"+ auth + "&op=delete&vehicle_id="+vehicleId, function (result) {
        if (result.success) {
          delete vehicles[vehicleId];
          callbacks.refresh();
        } else {
          console.error("failed to delete vehicle", result);
        }
      }).fail(function (jqXHR, textStatus, error) {
        console.error("failed to send delete vehicle request:", textStatus, error);
      });
    },

    generateKey: function (vehicleId) {
      $.get("/fleetmanager?"+ auth + "&op=genkey&vehicle_id="+vehicleId, function (result) {
        if (result.success) {
          vehicles[vehicleId].info.key = result.key.sid;
          vehicles[vehicleId].info.secret = result.key.secret;
          callbacks.refresh();
        } else {
          console.error("failed to generate key", result);
        }
      }).fail(function (jqXHR, textStatus, error) {
        console.error("failed to send generate key request:", textStatus, error);
      });
    },

    call: function (vehicle, currentTarget) {
      var activeConnection = Twilio.Device.activeConnection();
      console.log("call", vehicle);
      if (!vehicle.voiceConnection) {
        $(".btn-call").prop('disabled', true);
        $(currentTarget).prop('disabled', false);
        if (!activeConnection) {
          console.log("call.connect");
          $(currentTarget).addClass('btn-danger');
          $(currentTarget).html("End Call");
          Twilio.Device.disconnect(function () {
            console.log("call.disconnected");
            $(".btn-call").prop('disabled', false);
            $(currentTarget).removeClass('btn-danger');
            $(currentTarget).html("Call");
          });
          vehicle.voiceConnection = Twilio.Device.connect({ number: vehicle.info.mobile });
        } else {
          console.log("call.incall");
        }
      } else {
        console.log("call.disconnect");
        vehicle.voiceConnection.disconnect();
        vehicle.voiceConnection = null;
        $(".btn-call").prop('disabled', false);
      }
    },

    checkLoggedIn: function () {
      if (!auth) {
        callbacks.authRequired();
      }
    },

    login: function (username, password) {
      var that = this;
      auth = "username=" + username + "&pincode=" + password;
      this.updateToken(function (syncToken, twimlAppToken) {
        syncClient = new SyncClient(syncToken);
        Twilio.Device.setup(twimlAppToken);
        that.refreshVehicleList();
        callbacks.onAuthenticated();
      });
    },

    init: function () {
      this.checkLoggedIn();
      //this.login("trump", "2016");
    }
	};
};
