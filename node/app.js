var express         = require('express');
var bodyParser      = require('body-parser');
var session         = require('express-session');
var partials        = require('express-partials');
var favicon         = require('serve-favicon');
var path            = require('path');
var http            = require('http');
var winston         = require('winston');
var sassMiddleware  = require('node-sass-middleware');
var bourbon         = require('node-bourbon');
var fs              = require('fs');
var sqlite3         = require('sqlite3').verbose();
var moment          = require('moment');
var hat             = require('hat');
var twilioLibrary   = require('twilio');
var async           = require('async');
var events          = require('events');
var event           = new events.EventEmitter();

// = Winston Setup =
winston.remove(winston.transports.Console);
winston.add(winston.transports.Console, {level: 'debug', colorize: true});
winston.addColors({ info: 'blue', error: 'red' });

// = Errors =
process.on('uncaughtException', function (err) {
  // Exit
  winston.error('Uncaught Error:', err);
  process.exit();
});

// = Config =
var config = require('./config/config');

// = Twilio =
var twilio = new twilioLibrary.Twilio(config.twilio.account_sid, config.twilio.auth_token);

// = DB connect
var db_exists = fs.existsSync(config.sqlite3);
if(!db_exists) {
  console.log("Creating DB file.");
  fs.openSync(config.sqlite3, "w");
}
var db = new sqlite3.Database(config.sqlite3);
if(!db_exists) {
  db.serialize(function() {
    db.run("CREATE TABLE vehicles (id INTEGER primary key autoincrement, name TEXT, twilio_sid TEXT, token TEXT, created_at TIMESTAMP)");
    db.run("CREATE TABLE driving_data (id integer primary key autoincrement, vehicle_id INTEGER, lat NUMERIC, lon NUMERIC, runtime NUMERIC, miles NUMERIC, speed NUMERIC, minT NUMERIC, avgT NUMERIC, maxT NUMERIC, fuel NUMERIC, brake NUMERIC, created_at TIMESTAMP, FOREIGN KEY(vehicle_id) REFERENCES vehicles(id))");
  });
}

// = Express =
var app = express();
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'ejs');
app.use(favicon(__dirname + '/public/imgs/favicon.ico'));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(partials());
app.use(require('express-session')({
  secret: '7jQ2EAyHKgTELxrp',
  cookie: { maxAge: 1000 * 60 * 60 * 24 * 7 }
}));
app.use(
  sassMiddleware({
    src: path.join(__dirname, 'public'),
    dest: path.join(__dirname, 'public'),
    outputStyle: 'nested',
    imagePath: path.join(__dirname, 'public', 'images'),
    includePaths: bourbon.with(path.join(__dirname, 'public', 'cssf'))
  })
);
app.use(express.static(path.join(__dirname, 'public')));

var server = http.createServer(app).listen(8000, function () {
  winston.info('Web | Ready | Port:', server.address().port);
});

// = Routes =
app.get('/', function(req, res) {
  // get all active vehicles and then the last few driver infos
  db.all("SELECT DISTINCT vehicle_id FROM driving_data WHERE datetime(created_at) > ( datetime('now', '-5 minutes') )",  function (error, rows) {
    if (error || typeof rows == 'undefined' || rows.length <= 0) {
      res.render('index', { vehicles: [] });
    } else {
      var driver_data_fns = [];
      for(var i=0; i<rows.length; i++) {
        var vehicle_id = rows[i].vehicle_id;
        driver_data_fns.push(function(callback) {
          db.all("SELECT * FROM vehicles WHERE id=?", [vehicle_id], function(error, v_rows) {
            if (error || typeof v_rows == 'undefined' || v_rows.length <= 0) {
              winston.debug("error 1");
              callback("database error");
            } else {
              var vehicle = v_rows[0];
              db.get("SELECT id FROM driving_data where vehicle_id=? and datetime(created_at) > ( datetime('now', '-5 minutes') ) ORDER BY created_at DESC", [vehicle.id], function(error, row) {
                if (error || typeof row == 'undefined') {
                  winston.debug("error 2");
                  callback("database error");
                } else {
                  var start_id = row.id;
                  db.get("SELECT * FROM (select * from driving_data order by datetime(created_at) ASC) AS d1 WHERE datetime(d1.created_at, '+5 minutes') < (SELECT datetime(created_at) FROM (select * from driving_data order by datetime(created_at) ASC) AS d2 WHERE d2.vehicle_id = d1.vehicle_id AND datetime(d2.created_at) > datetime(d1.created_at) LIMIT 1) ORDER BY datetime(d1.created_at) DESC", function(error, row) {
                    if (error || typeof row == 'undefined') {
                      var end_id = 0;
                    } else {
                      var end_id = row.id;
                    }
                    db.all("SELECT * FROM driving_data WHERE vehicle_id = ? AND id <= ? AND id > ?", [vehicle_id, start_id, end_id], function(error, d_rows) {
                      if (error || typeof d_rows == 'undefined' || d_rows.length <= 0) {
                        winston.debug("error 4");
                        callback("database error");
                      } else {
                        callback(null, { "info": vehicle, "driving_data": d_rows });
                      }
                    });
                  });
                }
              });
            }
          });
        });
      }

      async.parallel(driver_data_fns, function(err, results) {
        if(err) {
          winston.error(err);
          res.render('index', { vehicles: [] });
        } else {
          // build
          res.render('index', { vehicles: results, page: "active" });
        }
      });
    }
  });
});

app.get('/vehicle/:id', function(req, res) {
  var vehicle_id = req.params.id;
  db.all("SELECT * FROM vehicles WHERE id=?", [vehicle_id], function(error, v_rows) {
    if (error || typeof v_rows == 'undefined' || v_rows.length <= 0) {
      winston.error("database error: "+error);
      res.redirect('/')
    } else {
      var vehicle = v_rows[0];
      db.all("SELECT * FROM driving_data WHERE vehicle_id = ? order by datetime(created_at) ASC", [vehicle_id], function(error, rows) {
        if (error || typeof rows == 'undefined' || rows.length <= 0) {
          winston.error("database error: "+error);
          res.redirect('/');
        } else {
          var trips = [];
          var curr_trip = {
            start: rows[0],
            end: null
          }
          var last = rows[0];
          for(var i=0; i<rows.length; i++) {
            var curr_created = moment(rows[i].created_at);
            if(curr_created.diff(moment(last.created_at), 'minutes') > 5 || i+1 === rows.length) {
              curr_trip.end = rows[i-1];
              trips.push({start: curr_trip.start, end: curr_trip.end});
              curr_trip.start = rows[i];
            }
            last = rows[i];

          }
          res.render('vehicle_data', { page: "info", trips: trips, vehicle: vehicle, moment: moment });
        }
      });
    }
  });
});

app.get('/trip/:id/:start/:end', function(req, res) {
  var vehicle_id = parseInt(req.params.id);
  var start_id = parseInt(req.params.start);
  var end_id =parseInt(req.params.end);
  db.all("SELECT * FROM vehicles WHERE id=?", [vehicle_id], function(error, v_rows) {
    if(error || typeof v_rows == 'undefined' || v_rows.length <= 0) {
      winston.error("database error: "+error);
      res.redirect('/')
    } else {
      var vehicle = v_rows[0];
      db.all("SELECT * FROM driving_data WHERE vehicle_id = ? AND id >= ? AND id < ?", [vehicle_id, start_id, end_id], function(error, rows) {
        if (error || typeof rows == 'undefined' || rows.length <= 0) {
          winston.error("database error: "+error);
          res.redirect('/vehicles/'+vehicle.id)
        } else {
          res.render('trip', { page: "trip", trip: rows, vehicle: vehicle, moment: moment });
        }
      });
    }
  });
});

app.post('/vehicle/:id/edit', function(req, res) {
  var id = req.params.id
  var name = req.body.name.replace(/'/g, "\\'");
  var twilio_sid = req.body.twilio_sid;
  db.run("UPDATE vehicles SET name=?, twilio_sid=? WHERE id=?", [name, twilio_sid, id],  function (error) {
    if (error) {
      winston.error(error);
      res.redirect('/vehicles/'+id);
    } else {
      res.redirect('/vehicles/'+id);
    }
  });
});

app.get('/vehicles', function(req, res) {
  db.all("Select * from vehicles",  function (error, rows) {
    if (error || typeof rows == 'undefined') {
      winston.error(error);
      res.render('vehicle_list', { vehicles: [], error: "database error", page: "list" });
    } else {
      res.render('vehicle_list', { vehicles: rows, moment: moment, page: "list" });
    }
  });
});

app.post('/add-vehicle', function(req, res) {
  var name = req.body.name.replace(/'/g, "\\'");
  var twilio_sid = req.body.twilio_sid;
  var token = hat();
  // check twilio for SID correctness
  twilio.preview.wireless.sims(twilio_sid).fetch(function(err, device) {
    if(err) {
      winston.error(err);
      res.redirect('/vehicles');
    } else {
      // enter it
      db.run("INSERT INTO vehicles (name, twilio_sid, token, created_at) VALUES (?, ?, ?, ?)", [name, twilio_sid, token, moment().utc().format()],  function (error) {
        if (error) {
          winston.error(error);
          res.render('vehicle_list', { devices: [], error: "database error", page: "list" });
        } else {
          // change twilio alias to device name
          twilio.preview.wireless.sims(twilio_sid).update({
            "alias": name
          }, function(err, device) {});
          res.redirect('/vehicles');
        }
      });
    }
  });
});

app.get('/delete-vehicle/:id', function(req, res) {
  var id = req.params.id
  db.run("DELETE FROM driving_data where vehicle_id=?", [id],  function (error) {
    db.run("DELETE FROM vehicles where id=?", [id],  function (error) {
      if (error) {
        winston.error(error);
        res.redirect('/devices');
      } else {
        res.redirect('/devices');
      }
    });
  });
});

app.get('/test-data-send', function(req, res) {
  res.render('data_test', { layout: false });
});

app.post('/api/data', checkToken, function(req, res) {
  var full_obj = req.body;
  var vehicle_id = req.body.id;
  var lat = req.body.lat;
  var lon = req.body.lon;
  var runtime = req.body.runtime;
  var miles = req.body.miles;
  var speed = req.body.speed;
  var minT = req.body.minT;
  var avgT = req.body.avgT;
  var maxT = req.body.maxT;
  var fuel = req.body.fuel;
  var brake = req.body.brake;


  if(vehicle_id == null || lat == null || lon == null || speed == null || minT == null || avgT == null || maxT == null || fuel == null || brake == null) {
    return res.json({success: false, error: 'malformed data'});
  } else {
    db.run('INSERT INTO driving_data (vehicle_id, lat, lon, runtime, miles, speed, minT, avgT, maxT, fuel, brake, created_at) VALUES(?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)', [vehicle_id, lat, lon, runtime, miles, speed, minT, avgT, maxT, brake, fuel, moment().utc().format()], function (error) {
      if (error) {
        winston.debug(error);
        winston.debug("database insert error");
        res.json({ success: false, error: "database error" });
      } else {
        winston.debug("inserted driving data -- id:"+vehicle_id+" lat:"+lat+" lon:"+lon+" runtime:"+runtime+" miles:"+miles+" speed:"+speed+" minT:"+minT+" avgT:"+avgT+" maxT:"+maxT+" fuel:"+fuel+" brake:"+brake);
        app_socket.emit('new:driving-data', full_obj);
        res.json({ "success": true, "message": "Driving data entered" });
      }
    });
  }
});

// token per device
function checkToken(req, res, next) {
  winston.debug(req.body);
  var vehicle_id = req.body.id;
  var request_token = req.body.token;
  db.all("Select * from vehicles where id = ? limit 1", [vehicle_id],  function (error, rows) {
    if(rows && rows[0] && (rows[0].token == request_token)) {
      next();
    } else {
      winston.debug("permission denied");
      res.json({ "success": false, "error": "permission denied" });
    }
  });
}

// 404 Catch-all
app.use(function (req, res, next) {
  res.status(404);
  winston.error('Page not found:', req.url);
  res.redirect('/');
});

// = App Socket =
var io = require('socket.io')({
  'port': 8000,
  'heartbeat interval': 2000,
  'heartbeat timeout' : 3000
});

io.listen(server);

var app_socket = io.of('/copilot');
app_socket.on('connection', function(socket) {
  winston.info("=== SERVER ===", "SITE CONNECTED");

  socket.on('disconnect', function(){
    winston.info("=== SERVER ===", "APP DISCONNECTED");
  });
});