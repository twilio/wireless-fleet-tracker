require("../views/vehicle.html");

var $ = require("jquery");

var map;
var infowindows = {};
var vehicleId;

var vehicleView = {
  init: function ($scope) {
    vehicleId = $scope.id;
    map = vehicleView.initMapElement('map');
    $scope.vehicle.driving_data.forEach(function (data) {
      vehicleView.onVehicleData($scope.vehicle, data);
    });
  },

  onVehicleData: function (vehicle, data) {
    console.log("vehicle.info", vehicle.info);
    if (vehicle.info.id != vehicleId) return;
    vehicleView.addDataToMap(map, infowindows, data);
  },

  onVehicleStats: function (vehicle, stats) {
    vehicleView.updateStats('vehicle', stats);
  },

  /* static */ initMapElement: function (mapElementName) {
    var map = new google.maps.Map(document.getElementById(mapElementName), {
      zoom: 14
    });
    return map;
  },

  /* static */ addDataToMap: function (map, infowindows, data) {
    var latLon = { lat: data.lat, lng: data.lon}
    var marker = new google.maps.Marker({
      position: latLon,
      map: map,
      title: String(data.id)
    });

    var content_string = '<div class="infowindow-label"> \
                            <h1>Point data</h1>' +
                            (!!data.miles ? '<p><span class="label label-default">Distance:</span> <span class="value">'+data.miles.toFixed(0)+' Miles</span></p>' : '') +
                            (!!data.speed ? '<p><span class="label label-default">Speed:</span> <span class="value">'+data.speed.toFixed(0)+' mph</span></p>' : '') +
                            (!!data.fuel ? '<p><span class="label label-default">Fuel:</span> <span class="value">'+data.fuel.toFixed(0)+'%</span></p>' : '') +
                          '</div>';

    var infowindow = new google.maps.InfoWindow({
      content: content_string,
    });
    infowindows[data.id] = infowindow;
    map.panTo(marker.getPosition());

    google.maps.event.addListener(marker, 'click', function(e) {
      if('_current' in infowindows) {
        infowindows['_current'].close();
      }
      infowindows[this.getTitle()].open(map, this);
      infowindows['_current'] = infowindows[this.getTitle()];
    });
  },

  /* static */ updateStats: function (vehicleElemementName, stats) {
    if (!stats) return;

    $('.' + vehicleElemementName + ' .miles span').text(stats.miles);
    $('.' + vehicleElemementName + ' .speed span').text(stats.avg_speed);
    $('.' + vehicleElemementName + ' .fuel span').text(stats.fuel);
    $('.' + vehicleElemementName + ' .brake span').text(stats.brake);

    var runtime_string;
    if(stats.runtime < 60) {
      runtime_string = stats.runtime+' seconds';
    } else if(stats.runtime < 3600) {
      runtime_string = (stats.runtime/60).toFixed(0)+" minutes";
    } else {
      var hours = Math.floor(runtime/3600);
      var minutes = ((runtime - (hours*3600))/60).toFixed(0);
      runtime_string = hours+" hours and "+minutes+" minutes";
    }

    $('.' + vehicleElemementName + ' .runtime').text(runtime_string);    
  },
};

module.exports = vehicleView;
