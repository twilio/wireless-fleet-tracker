'use strict';

const MOMENT_FORMAT = "MMM DD YYYY @ hh:mm";

var moment = require("moment");

module.exports = function(callbacks) {
  var $ = require("jquery");
  var SyncClient = require("twilio-sync").Client;
  var syncClient;
  var token;
  var auth = "username=trump&pincode=928462";

  var vehicles = {};

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
          token = result.token;
          if (cb) cb(token);
          syncClient.updateToken(token);
          setTimeout(that.updateToken.bind(that), result.ttl*1000 * 0.96); // update token slightly in adance of ttl
        } else {
          console.error("failed to authenticate the user: ", result.error);
        }
      }).fail(function (jqXHR, textStatus, error) {
        console.error("failed to send authentication request:", textStatus, error);
        setTimeout(that.updateToken.bind(that), 10000); // retry in 10 seconds
      });
    },

    refreshVehicleList: function () {
      $.get("/fleetmanager?"+ auth + "&op=list", function (result) {
        if (result.success) {
          for (var i in result.vehicles) {
            var vehicle = result.vehicles[i];
            var id = vehicle.unique_name;
            vehicles[id] = {
              info: {
                id: id,
                name: vehicle.friendly_name,
                created_at: moment(vehicle.date_created).format(MOMENT_FORMAT)
              },
              driving_data: []
            };
            subscribeToVehicleData(id);
          }
          callbacks.refresh();
        } else {
          console.error("failed to list vehicles:", result);
        }
      }).fail(function (jqXHR, textStatus, error) {
        console.error("failed to send list vehicles request:", textStatus, error);
      });
    },

    addVehicle: function (newVehicle, callback) {
      $.get("/fleetmanager?" + auth + "&op=add&vehicle_id="+(newVehicle.id||"")+"&vehicle_name="+(newVehicle.name||""), function (result) {
        if (result.success) {
          var vehicleAdded = {
            info: {
              created_at: moment(result.vehicle.date_created).format(MOMENT_FORMAT),
              id: result.vehicle.unique_name,
              name: result.vehicle.friendly_name,
              key: result.key.sid,
              secret: result.key.secret
            },
            driving_data: []
          };
          vehicles[result.vehicle.unique_name] = vehicleAdded;          
          subscribeToVehicleData(result.vehicle.unique_name);
          callback(null, vehicleAdded);
        } else {
          callback(result);
        }
      }).fail(function (jqXHR, textStatus, error) {
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

    init: function () {
      var that = this;
      this.updateToken(function (token) {
        syncClient = new SyncClient(token);
        that.refreshVehicleList();
      });
    }
	};
};
