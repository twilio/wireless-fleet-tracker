CREATE TABLE vehicles (
  id INTEGER primary key autoincrement,
  name TEXT,
  twilio_sid TEXT,
  token TEXT,
  created_at TIMESTAMP
)

CREATE TABLE driving_data (
  id integer primary key autoincrement,
  vehicle_id INTEGER,
  lat NUMERIC,
  lon NUMERIC,
  runtime NUMERIC,
  miles NUMERIC,
  speed NUMERIC,
  minT NUMERIC,
  avgT NUMERIC,
  maxT NUMERIC,
  fuel NUMERIC,
  brake NUMERIC,
  created_at TIMESTAMP,
  FOREIGN KEY(vehicle_id) REFERENCES vehicles(id)
)