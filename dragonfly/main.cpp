/** Dragonfly Cellular HTTP Example
 * Configures the cellular radio, brings up the cellular link, and does HTTP GET and POST requests.
 *
 * NOTE: This example changes the baud rate of the debug port to 115200 baud!
 **/

#include "mbed.h"
#include "mtsas.h"

#define DEVICE_ID 0
#define TOKEN "xxxx"
#define SERVER_URL "http://xxxx.localtunnel.me"
#define POLLING_ITERATIONS 400
// km/hr drop in one second exceeding this value will cause a hard braking event to be counted
#define HARD_BRAKE_THRESHOLD 10

// This line controls the regulator's battery charger.
// BC_NCE = 0 enables the battery charger
// BC_NCE = 1 disables the battery charger
DigitalOut bc_nce(PB_2);

DigitalOut ledCell(D3);
DigitalOut ledOBD(D6);
DigitalOut ledGPS(D8);
DigitalOut ledPacket(D5);
DigitalOut ledActivity(D4);
DigitalOut ledDebug(D7);

MTSSerial obd(D1, D0);
Ticker carPolling;

bool init_mtsas();
char* httpResToStr(HTTPResult res);

// The MTSSerialFlowControl object represents the physical serial link between the processor and the cellular radio.
mts::MTSSerialFlowControl* io;
// The Cellular object represents the cellular radio.
mts::Cellular* radio;

// An APN is required for GSM radios.
static const char apn[] = "wireless.twilio.com";

bool radio_ok = false;

mts::Cellular::gpsData gpsValues;
double longitudeVal = -1000;
double latitudeVal = -1000;
int packetSuccessCount = 0;

void gpsPollStatus() {
    int i;
    char c;
    //mts::Cellular::gpsData data;

    if( !radio->GPSenabled() ) {
        logInfo("GPS: enabling");
        radio->GPSenable();
        while( !radio->GPSenabled() ) {
            logInfo("...");
            wait(5);
        }
    }

    logInfo("GPS");
    gpsValues = radio->GPSgetPosition();
    if(gpsValues.fix < 2) {
        ledGPS = 1;
        latitudeVal = -1000.0;
        longitudeVal = -1000.0;
    } else {
        ledGPS = 0;
        sscanf(gpsValues.latitude.c_str(), "%2d%lf%c", &i, &latitudeVal, &c);
        //logInfo("i=%d,lat=%f,c=%c", i, latitudeVal ,c);
        latitudeVal /= 60.0;
        latitudeVal += i;
        if(c == 'S')
            latitudeVal = 0.0 - latitudeVal;
        sscanf(gpsValues.longitude.c_str(), "%3d%lf%c", &i, &longitudeVal, &c);
        //logInfo("i=%d,lon=%f,c=%c", i, longitudeVal ,c);
        longitudeVal /= 60.0;
        longitudeVal += i;
        if(c == 'W')
            longitudeVal = 0.0 - longitudeVal;
        //logInfo("GPS: success: %d, sats: %d, fix: %d, %s, %s, %s, %f, %f", gpsValues.success, gpsValues.satellites, gpsValues.fix, gpsValues.timestamp, gpsValues.latitude, gpsValues.longitude, latitudeVal, longitudeVal);
    }
}

int ObdInit() {
    char out[64], in[64];
    int i;
    obd.format(8, Serial::None, 1);
    obd.baud(38400);

    sprintf(out, "ATZ\r");
    logInfo("sending command %s", out);
    obd.write(out, strlen(out));
    wait(1);
    i = obd.readable();
    logInfo("OBD: %d bytes readable", i);
    obd.read(in, i);
    in[i]=0;
    logInfo("OBD: in=%s", in);
    if( strncmp("OBDUART v", in, 9) != 0) {
        logError("OBD: unexpected response to ATZ command: %s", in);
        return -1;
    }

    sprintf(out, "ATSP0\r");
    logInfo("sending command %s", out);
    obd.write(out, strlen(out));
    wait(1);
    i = obd.readable();
    logInfo("OBD: %d bytes readable", i);
    obd.read(in, i);
    in[i]=0;
    logInfo("OBD: in=%s", in);
    if( strncmp("OK", in, 2) != 0) {
        logError("OBD: unexpected response to ATSP0 command: %s", in);
        return -1;
    }

    ledOBD = 0;
    return 0;
}

int ObdReadPid(int PID, int dataBytes, uint8_t *data) {
    char out[64], in[64];
    int i, j=0;
    sprintf(out, "01%02X\r", PID);
    //logInfo("sending PID request %s", out);
    obd.write(out, strlen(out));
    wait(.1);
    i = obd.readable();
    //logInfo("OBD: %d bytes readable", i);
    obd.read(in, i);
    in[i]=0;
    //logInfo("OBD: in=%s", in);

    if(i < (dataBytes * 3 + 5) )
        return -1;
    for(i = 0; i < (dataBytes+2); i++) {
        sscanf(in+i*3, "%02X", data + i );
    }
    /*for(i = 0; i < (dataBytes+2); i++) {
        logInfo("byte[%d]=%d", i, data[i]);
    }*/
    return i;
}

int httpPost(int id, int miles, float speed, float minT, float avgT, float maxT, float fuel, int brake, int runtime) {
    char http_rx_buf[1024];
    HTTPClient http;
    HTTPResult res;

    logInfo("building http post string");

    char http_tx_buf[1024];

    sprintf(http_tx_buf, "{\r\n"
                         "\"id\":%d,\r\n"
                         "\"miles\":%d,\r\n"
                         "\"lat\":%f,\r\n"
                         "\"lon\":%f,\r\n"
                         "\"speed\":%f,\r\n"
                         "\"minT\":%f,\r\n"
                         "\"avgT\":%f,\r\n"
                         "\"maxT\":%f,\r\n"
                         "\"fuel\":%f,\r\n"
                         "\"brake\":%d,\r\n"
                         "\"runtime\":%d,\r\n"
                         "\"token\":%s\r\n"
                         "}\r\n", id, miles, latitudeVal, longitudeVal, speed, minT, avgT, maxT, fuel, brake, runtime, TOKEN);

    logInfo("http post string: %s", http_tx_buf);

    // IHTTPDataIn object - will contain data received from server.
    HTTPText http_rx(http_rx_buf, sizeof(http_rx_buf));

    // IHTTPDataOut object - contains data to be posted to server.
    // HTTPJson automatically adds the JSON content-type header to the request.
    //HTTPJson http_tx(http_tx_buf, sizeof(http_tx_buf));
    HTTPJson http_tx(http_tx_buf, strlen(http_tx_buf));

    // Make a HTTP POST request to http://httpbin.org/
    logInfo("post start");
    res = http.post(SERVER_URL, http_tx, &http_rx);
    logInfo("post complete");
    if (res != HTTP_OK) {
        logError("HTTP POST failed [%d][%s]", res, httpResToStr(res));
        ledPacket = 1;
        return -1;
    } else {
        logInfo("HTTP POST succeeded [%d]\r\n%s", http.getHTTPResponseCode(), http_rx_buf);
        ledPacket = 0;
        ledActivity = packetSuccessCount & 1;
        packetSuccessCount++;
        return 0;
    }
}

float avgSpeed = 0;
float minimumThrottle = 0;
float avgThrottle = 0;
float maximumThrottle = 0;
bool dataReady = false;
int hardBrakeCount = 0;
bool hardBrakeState = false;

unsigned int brakeEventCount[32] = {0,0,0,0, 0,0,0,0, 0,0,0,0, 0,0,0,0,
                                     0,0,0,0, 0,0,0,0, 0,0,0,0, 0,0,0,0};
int carUpdatesCount = 0;

void carUpdate() {
    static int speed = 0;
    static int minT = 0;
    static int avgT = 0;
    static int maxT = 0;
    static int speedSamples = 0;
    static int throttleSamples = 0;
    static int calls = 0;
    static int speedHist[10] = {0,0,0,0,0,0,0,0,0,0};
    static int speedHistPtr = 0;
    int speedDiff;

    //logInfo("calls=%d", calls);
    if( (calls++ & 0x1) == 0 ) {
        // on even samples we will process speed readings and request throttle readings
        char buf[64];
        uint8_t data[8];
        int i = obd.readable(); // how much is available to read
        obd.read(buf, i);
        buf[i] = 0;  // null terminate the string
        //logInfo("OBD: in=%s", buf);
        if(i >= 8) {
            for(i = 0; i < 3; i++)
                sscanf(buf+i*3, "%02X", data + i);
            if(data[0] != 0x41 || data[1] != 0x0D) {
                logError("error reading PID 0x0D: %s", buf);
            } else {
                speed += data[2];
                speedSamples++;
                speedDiff = speedHist[speedHistPtr] - data[2];
                if(speedHist[speedHistPtr] - data[2] > HARD_BRAKE_THRESHOLD) {
                    if(!hardBrakeState) {
                        hardBrakeCount++;
                        hardBrakeState = true;
                    }
                } else {
                    hardBrakeState = false;
                }
                speedHistPtr = (speedHistPtr + 1) % 10;
                speedHist[speedHistPtr] = data[2];
                // this is just for counting to see what braking looks like during a drive
                if(speedDiff > 0) {
                    if(speedDiff > 31) speedDiff = 31;
                    brakeEventCount[speedDiff]++;
                }
            }
        } else {
            logError("not enough bytes reading PID 0x0D");
        }
        // now request the throttle to be processed next time
        obd.write("0111\r", 5);
    } else {
        // on odd samples we will process throttle readings and request speed readings
        char buf[64];
        uint8_t data[8];
        int i = obd.readable(); // how much is available to read
        obd.read(buf, i);
        buf[i] = 0;  // null terminate the string
        //logInfo("OBD: in=%s", buf);
        if(i >= 8) {
            for(i = 0; i < 3; i++)
                sscanf(buf+i*3, "%02X", data + i);
            if(data[0] != 0x41 || data[1] != 0x11) {
                logError("error reading PID 0x11: %s",buf);
            } else {
                if(data[2] < minT) minT = data[2];
                if(data[2] > maxT) maxT = data[2];
                avgT += data[2];
                throttleSamples++;
            }
        } else {
            logError("not enough bytes reading PID 0x11");
        }
        // now request the throttle to be processed next time
        obd.write("010D\r", 5);
    }
    if(calls >= POLLING_ITERATIONS) {
        avgSpeed = (float)speed*0.62137119f/(float)speedSamples;
        minimumThrottle = (float)minT*0.39215686f;
        avgThrottle = (float)avgT*0.39215686f/(float)throttleSamples;
        maximumThrottle = (float)maxT*0.39215686f;
        speed = 0; minT = 255; avgT = 0; maxT = 0;
        calls = 0;
        dataReady = true;
        carPolling.detach();
        carUpdatesCount++;
    }
}

int main() {
    int result;
    uint8_t obdData[16];
    int initialDistance = -1;
    int distance = 0;
    int fuel = 0;
    int runtime = 0;
    float speed, minT, avgT, maxT;
    int i;

    // Disable the battery charger unless a battery is attached.
    bc_nce = 1;

    // Change the baud rate of the debug port from the default 9600 to 115200.
    Serial debug(USBTX, USBRX);
    debug.baud(115200);

    ledCell = 1;
    ledGPS = 1;
    ledOBD = 1;
    ledPacket = 1;
    ledActivity = 1;
    ledDebug = 1;

    //Sets the log level to INFO, higher log levels produce more log output.
    //Possible levels: NONE, FATAL, ERROR, WARNING, INFO, DEBUG, TRACE
    mts::MTSLog::setLogLevel(mts::MTSLog::INFO_LEVEL);

    //myGpsTest();
    //myObdTest();
    //myMtsObdTest();

    logInfo("initializing cellular radio");
    //radio->init(NULL);

    radio_ok = init_mtsas();
    if (! radio_ok) {
        while (true) {
            logError("failed to initialize cellular radio");
            wait(1);
        }
    }

    logInfo("setting APN");
    if (radio->setApn(apn) != MTS_SUCCESS)
        logError("failed to set APN to \"%s\"", apn);

    logInfo("bringing up the link");
    if (! radio->connect()) {
        logError("failed to bring up the link");
    } else {
        ledCell = 0;
        logInfo("Connected.  Starting OBD process");
        //myGpsTest();

        ObdInit();
        gpsPollStatus();
        wait(1);
        obd.write("010D\r", 5); // prime the system since the periodic handler reads before requesting
        carPolling.attach(&carUpdate, .05); // start polling every tenth of a second
        while(1) {
            while(!dataReady)
                wait(.01);
            // flush out old data
            wait(.05);
            i = obd.readable();
            obd.read((char*)obdData,i);

            // Read distance since Malfunction Indicator Lamp reset as a way to get miles traveled
            result = ObdReadPid(0x31, 2, obdData);
            if(result != 4 || obdData[0] != 0x41 || obdData[1] != 0x31) {
                logError("error reading PID 0x31");
            } else {
                if(initialDistance < 0)
                    initialDistance =  obdData[2]*256 + obdData[3];
                distance = obdData[2]*256 + obdData[3] - initialDistance;
                //logInfo("initialDistance=%d, distance=%d", initialDistance, distance);
            }
            // Get the fuel take level sensor percentage
            result = ObdReadPid(0x2F, 1, obdData);
            if(result != 3 || obdData[0] != 0x41 || obdData[1] != 0x2F) {
                logError("error reading PID 0x2F");
            } else {
                fuel = obdData[2];
            }
            // Get the engine on time since start
            result = ObdReadPid(0x1F, 2, obdData);
            if(result != 4 || obdData[0] != 0x41 || obdData[1] != 0x1F) {
                logError("error reading PID 0x1F");
            } else {
                runtime = obdData[2]*256 + obdData[3];
                //logInfo("runtime=%d", runtime);
            }

            // prime the system for the next round of samples
            obd.write("010D\r", 5);

            speed=avgSpeed;
            minT=minimumThrottle;
            avgT=avgThrottle;
            maxT=maximumThrottle;
            dataReady = false;

            logInfo("carUpdatesCount=%d", carUpdatesCount);
            for(i = 0; i < 32; i += 8)
                logInfo("%02d:%04d %02d:%04d %02d:%04d %02d:%04d %02d:%04d %02d:%04d %02d:%04d %02d:%04d", i, brakeEventCount[i], i+1, brakeEventCount[i+1], i+2, brakeEventCount[i+2], i+3, brakeEventCount[i+3], i+4, brakeEventCount[i+4], i+5, brakeEventCount[i+5], i+6, brakeEventCount[i+6], i+7, brakeEventCount[i+7]);

            // restart the polling loop
            carPolling.attach(&carUpdate, .05);

            // update latitude and logitude numbers
            gpsPollStatus();

            httpPost( DEVICE_ID, distance*0.62137119f, speed, minT, avgT, maxT, (float)fuel*0.39215686f, hardBrakeCount, runtime );
        }
    }

    logInfo("finished - bringing down link");
    radio->disconnect();

    return 0;
}

bool init_mtsas() {
    io = new mts::MTSSerialFlowControl(RADIO_TX, RADIO_RX, RADIO_RTS, RADIO_CTS);
    if (! io)
        return false;

    // radio default baud rate is 115200
    io->baud(115200);
    radio = mts::CellularFactory::create(io);
    if (! radio)
        return false;

    // Transport must be set properly before any TCPSocketConnection or UDPSocket objects are created
    Transport::setTransport(radio);

    return true;
}

char* httpResToStr(HTTPResult res) {
    switch(res) {
        case HTTP_PROCESSING:
            return "HTTP_PROCESSING";
        case HTTP_PARSE:
            return "HTTP_PARSE";
        case HTTP_DNS:
            return "HTTP_DNS";
        case HTTP_PRTCL:
            return "HTTP_PRTCL";
        case HTTP_NOTFOUND:
            return "HTTP_NOTFOUND";
        case HTTP_REFUSED:
            return "HTTP_REFUSED";
        case HTTP_ERROR:
            return "HTTP_ERROR";
        case HTTP_TIMEOUT:
            return "HTTP_TIMEOUT";
        case HTTP_CONN:
            return "HTTP_CONN";
        case HTTP_CLOSED:
            return "HTTP_CLOSED";
        case HTTP_REDIRECT:
            return "HTTP_REDIRECT";
        case HTTP_OK:
            return "HTTP_OK";
        default:
            return "HTTP Result unknown";
    }
}
