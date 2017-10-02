require("../views/vehicle_list.html");

var $ = require("jquery");

var vehicleListView = {
  init: function () {
    $('.add-vehicle-show').click(function() {
      $(this).hide();
      $('.add-vehicle').fadeIn(333);
      $('#id').val('');
      $('#name').val('');
      $('#sim_sid').val('');
    });
    $('.add-vehicle-cancel').click(function() {
      $('.add-vehicle').hide();
      $('.add-vehicle-show').fadeIn(333);
    });
  },

  onVehicleAddingFailed: function (err) {
    $('#add-vehicle-failed').text(JSON.stringify(err));
  },

  onVehicleAdded: function () {
    $('.add-vehicle').hide();
    $('.add-vehicle-show').fadeIn(333);
  }
}

module.exports = vehicleListView;
