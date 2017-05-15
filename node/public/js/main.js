var Main = function() {
	return {
    all_maps: {},
    datapoint_totals: {},
    current_infowindow: null,
    infowindows: {},
    next_id: 0,
    init: function (data) {
      Main.initSockets();
      $('.add-vehicle-show').click(function() {
        $(this).hide();
        $('.add-vehicle').fadeIn(333);
      });
      $('.add-vehicle-cancel').click(function() {
        $('.add-vehicle').hide();
        $('.add-vehicle-show').fadeIn(333);
      });

      $('.add-driver-show').click(function() {
        $(this).hide();
        $('.add-driver').fadeIn(333);
      });
      $('.add-driver-cancel').click(function() {
        $('.add-driver').hide();
        $('.add-driver-show').fadeIn(333);
      });
    },
    initActive: function(vehicles) {

      var map = new google.maps.Map(document.getElementById('map'+vehicles[0].info.id), {
        center: {lat: (vehicles[0].driving_data[0].lat), lng: (vehicles[0].driving_data[0].lon)},
        zoom: 14
      });

      Main.all_maps['map'+vehicles[0].info.id] = map;
      Main.datapoint_totals['vehicle'+vehicles[0].info.id] = vehicles[0].driving_data.length;

      var total_speed = 0
      var total_driver_scores = 0;
      for(var i=0; i<vehicles[0].driving_data.length; i++) {
        var latLon = { lat: vehicles[0].driving_data[i].lat, lng: vehicles[0].driving_data[i].lon}
        var marker = new google.maps.Marker({
          position: latLon,
          map: map,
          title: (vehicles[0].driving_data[i].id).toString()
        });

        var content_string = '<div class="infowindow-label"> \
                                <h1>Point data</h1> \
                                <p><span class="label label-default">Distance:</span> <span class="value">'+(vehicles[0].driving_data[i].miles).toFixed(0)+' Miles</span></p> \
                                <p><span class="label label-default">Speed:</span> <span class="value">'+(vehicles[0].driving_data[i].speed).toFixed(0)+' mph</span></p> \
                                <p><span class="label label-default">Fuel:</span> <span class="value">'+(vehicles[0].driving_data[i].fuel).toFixed(0)+'%</span></p> \
                              </div>';

        var infowindow = new google.maps.InfoWindow({
          content: content_string,
        });
        Main.infowindows[vehicles[0].driving_data[i].id] = infowindow;
        Main.next_id = (vehicles[0].driving_data[i].id)+1;
        map.panTo(marker.getPosition());

        google.maps.event.addListener(marker, 'click', function(e) {
          if(Main.current_infowindow) {
            Main.current_infowindow.close();
          }
          Main.infowindows[this.getTitle()].open(map, this);
          Main.current_infowindow = Main.infowindows[this.getTitle()];
        })

        total_speed = total_speed+vehicles[0].driving_data[i].speed;
        total_driver_scores = total_driver_scores+vehicles[0].driving_data[i].avgT;
      }

       var miles = (vehicles[0].driving_data[(vehicles[0].driving_data.length)-1].miles).toFixed(0);
       var avg_speed = (total_speed/vehicles[0].driving_data.length).toFixed(0);
       var driver_score = (total_driver_scores/vehicles[0].driving_data.length).toFixed(0);
       var fuel = (vehicles[0].driving_data[(vehicles[0].driving_data.length)-1].fuel).toFixed(0);
       var brake = (vehicles[0].driving_data[(vehicles[0].driving_data.length)-1].brake).toFixed(0);
       var runtime = vehicles[0].driving_data[(vehicles[0].driving_data.length)-1].runtime;
       var runtime_string = '';
       if(runtime < 60) {
        runtime_string = runtime+' seconds';
       } else if(runtime < 3600) {
          runtime_string = (runtime/60).toFixed(0)+" minutes";
       } else {
         var hours = Math.floor(runtime/3600);
         var minutes = ((runtime - (hours*3600))/60).toFixed(0);
          runtime_string = hours+" hours and "+minutes+" minutes";
       }

       $('.vehicle1 .miles span').text(miles);
       $('.vehicle1 .speed span').text(avg_speed);
       $('.vehicle1 .driver_score span').text(100-driver_score);
       $('.vehicle1 .fuel span').text(fuel);
       $('.vehicle1 .brake span').text(brake);
       $('.runtime').text(runtime_string);
    },
    initTrip: function(trip) {

      var map = new google.maps.Map(document.getElementById('map'), {
        center: {lat: (trip[0].lat), lng: (trip[0].lon)},
        zoom: 14
      });

      var total_speed = 0
      var total_driver_scores = 0;
      for(var i=0; i<trip.length; i++) {
        var latLon = { lat: trip[i].lat, lng: trip[i].lon}
        var marker = new google.maps.Marker({
          position: latLon,
          map: map,
          title: (trip[i].id).toString()
        });

        var content_string = '<div class="infowindow-label"> \
                                <h1>Point data</h1> \
                                <p><span class="label label-default">Distance:</span> <span class="value">'+(trip[i].miles).toFixed(0)+' Miles</span></p> \
                                <p><span class="label label-default">Speed:</span> <span class="value">'+(trip[i].speed).toFixed(0)+' mph</span></p> \
                                <p><span class="label label-default">Fuel:</span> <span class="value">'+(trip[i].fuel).toFixed(0)+'%</span></p> \
                              </div>';

        var infowindow = new google.maps.InfoWindow({
          content: content_string,
        });
        Main.infowindows[trip[i].id] = infowindow;
        Main.next_id = (trip[i].id)+1;
        map.panTo(marker.getPosition());

        google.maps.event.addListener(marker, 'click', function(e) {
          if(Main.current_infowindow) {
            Main.current_infowindow.close();
          }
          Main.infowindows[this.getTitle()].open(map, this);
          Main.current_infowindow = Main.infowindows[this.getTitle()];
        })

        total_speed = total_speed+trip[i].speed;
        total_driver_scores = total_driver_scores+trip[i].avgT;
      }

      var miles = (trip[(trip.length)-1].miles).toFixed(0);
      var avg_speed = (total_speed/trip.length).toFixed(0);
      var driver_score = (total_driver_scores/trip.length).toFixed(0);
      var fuel = (trip[(trip.length)-1].fuel).toFixed(0);
      var brake = (trip[(trip.length)-1].brake).toFixed(0);
      var runtime = trip[(trip.length)-1].runtime;
      var runtime_string = '';
      if(runtime < 60) {
      runtime_string = runtime+' seconds';
      } else if(runtime < 3600) {
        runtime_string = (runtime/60).toFixed(0)+" minutes";
      } else {
       var hours = Math.floor(runtime/3600);
       var minutes = ((runtime - (hours*3600))/60).toFixed(0);
        runtime_string = hours+" hours and "+minutes+" minutes";
      }

      $('.vehicle1 .miles span').text(miles);
      $('.vehicle1 .speed span').text(avg_speed);
      $('.vehicle1 .driver_score span').text(100-driver_score);
      $('.vehicle1 .fuel span').text(fuel);
      $('.vehicle1 .brake span').text(brake);
      $('.runtime').text(runtime_string);

    },
  	initSockets: function () {
      Main.socket = io.connect('/copilot');
      Main.socket.on("connect", function(){});

      Main.socket.on("new:driving-data", function(data) {
        var map = Main.all_maps["map"+data.id];
        var latLon = { lat: parseFloat(data.lat), lng: parseFloat(data.lon) };
        var marker = new google.maps.Marker({
          position: latLon,
          map: map,
          title: (Main.next_id).toString()
        });
        map.panTo(marker.getPosition());

        var content_string = '<div class="infowindow-label"> \
                                <h1>Point data</h1> \
                                <p><span class="label label-default">Distance:</span> <span class="value">'+(parseFloat(data.miles)).toFixed(0)+' Miles</span></p> \
                                <p><span class="label label-default">Speed:</span> <span class="value">'+(parseFloat(data.speed)).toFixed(0)+' mph</span></p> \
                                <p><span class="label label-default">Fuel:</span> <span class="value">'+(parseFloat(data.fuel)).toFixed(0)+'%</span></p> \
                              </div>';
        var infowindow = new google.maps.InfoWindow({
          content: content_string
        });
        Main.infowindows[Main.next_id] = infowindow;
        Main.next_id = Main.next_id+1;

        google.maps.event.addListener(marker, 'click', function(e) {
          if(Main.current_infowindow) {
            Main.current_infowindow.close();
          }
          Main.infowindows[this.getTitle()].open(map, this);
          Main.current_infowindow = Main.infowindows[this.getTitle()];
        });

        data.avgT = 100-(parseFloat(data.avgT));
        var totals = Main.datapoint_totals['vehicle'+data.id];
        var current_speed = parseFloat($('.vehicle'+data.id+' .speed span').text());
        var current_score = parseFloat($('.vehicle'+data.id+' .driver_score span').text());
        var runtime = parseFloat(data.runtime);
        var runtime_string = '';
        console.log(runtime);
        if(runtime < 60) {
          runtime_string = runtime+' seconds';
         } else if(runtime < 3600) {
            runtime_string = (runtime/60).toFixed(0)+" minutes";
         } else {
           var hours = Math.floor(runtime/3600);
           var minutes = ((runtime - (hours*3600))/60).toFixed(0);
            runtime_string = hours+" hours and "+minutes+" minutes";
         }
        $('.vehicle'+data.id+' .miles span').text((parseFloat(data.miles)).toFixed(0));
        $('.vehicle'+data.id+' .speed span').text((((current_speed*totals) + parseFloat(data.speed)) / (totals+1)).toFixed(0));
        $('.vehicle'+data.id+' .driver_score span').text((((current_score*totals) + data.avgT) / (totals+1)).toFixed(0));
        $('.vehicle'+data.id+' .fuel span').text((parseFloat(data.fuel)).toFixed(0));
        $('.vehicle'+data.id+' .brake span').text((parseFloat(data.brake)).toFixed(0));
        $('.runtime').text(runtime_string);
        Main.datapoint_totals['vehicle'+data.id]++;

      });
    }

	};
}();