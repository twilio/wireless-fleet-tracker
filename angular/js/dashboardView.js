require("../views/dashboard.html");

var vehicleView = require("./vehicleView");

var all_maps;
var infowindows_map;

var dashboardView = {
  init: function () {
    all_maps = {};
    infowindows_map = {};
  },

  onVehicleData: function (vehicle, data) {
    if (!infowindows_map[vehicle.info.id]) {
      var mapElementName = 'map-'+vehicle.info.id;
      var newMap = vehicleView.initMapElement(mapElementName);
      all_maps[vehicle.info.id] = newMap;  
      infowindows_map[vehicle.info.id] = {};
    }
    var map = all_maps[vehicle.info.id];
    var infowindows = infowindows_map[vehicle.info.id];
    vehicleView.addDataToMap(map, infowindows, data);
  },

  onVehicleStats: function (vehicle, stats) {
    if (!stats) return;

    var vehicleElemementName = 'vehicle'+vehicle.info.id;

    vehicleView.updateStats(vehicleElemementName, stats);
  }
};

module.exports = dashboardView;
