const path = require("path");
const chai = require('chai');
const expect = chai.expect;
const assert = chai.assert;
const TwilioRuntimeHelper = require("TwilioRuntimeHelper");

// hard coded values required:
//  TOKEN_TTL = 3600
//  trump: 928462
const contextFile = path.resolve(__dirname, "../../context-test.yaml");
const descriptorFile = path.resolve(__dirname, "../descriptor.yaml");

function randomString() {
  return Math.random().toString(36).slice(2);
}

describe('FleetManager main test cases', function () {
    before(function (done) {
        TwilioRuntimeHelper.runTestDataJSON(contextFile, descriptorFile, {username: "trump", pincode: "928462", op: "list"})
            .then(function(data) {
                let promises = [];
                data.vehicles.forEach(function (v) {
                    console.log("deleting old vehicle: " + v.unique_name);
                    promises.push(TwilioRuntimeHelper.runTestDataJSON(contextFile, descriptorFile, {username: "trump", pincode: "928462", op: "delete", vehicle_id: v.unique_name}));
                });
                return Promise.all(promises);
            })
            .then(() => { console.log("done before()"); done(); })
            .catch(done);
    });

    it('add/list/genkey/delete ops', function (done) {
        let oldKey = null;
        let vehicleId = randomString();
        console.log("creating new vehicle: " + vehicleId);
        TwilioRuntimeHelper.runTestDataJSON(contextFile, descriptorFile, {username: "trump", pincode: "928462", op: "add", vehicle_id: vehicleId, vehicle_name: "BMW-" + vehicleId})
            .then((data) => {
                expect(data.success).to.be.true;
                expect(data.vehicle.unique_name).to.equal(vehicleId);
                expect(data.key.secret).to.be.a('string');
                oldKey = data.key;
                console.log("listing vehicles and find created one");
                return TwilioRuntimeHelper.runTestDataJSON(contextFile, descriptorFile, {username: "trump", pincode: "928462", op: "list"});
            })
            .then((data) => {
                expect(data.success).to.be.true;
                let vehicle = data.vehicles.find((v) => v.unique_name === vehicleId);
                expect(vehicle).to.not.be.an('undefined');
                console.log("generate new key for created vehicle");
                return TwilioRuntimeHelper.runTestDataJSON(contextFile, descriptorFile, {username: "trump", pincode: "928462", op: "genkey", vehicle_id: vehicleId});
            })
            .then((data) => {
                expect(data.success).to.be.true;
                expect(data.key.secret).to.be.a('string');
                expect(oldKey.sid).to.not.equal(data.key.sid);
                console.log("delete created vehicle");
                return TwilioRuntimeHelper.runTestDataJSON(contextFile, descriptorFile, {username: "trump", pincode: "928462", op: "delete", vehicle_id: vehicleId});
            })
            .then((data) => {
                expect(data.success).to.be.true;
                done();
            })
            .catch(done);
    });

    it('add with wrong pincode', function (done) {
        TwilioRuntimeHelper.runTestDataJSON(contextFile, descriptorFile, {username: "trump", pincode: "66666", op: "add", vehicle_id: "bogus", vehicle_name: "BMW-bogus"})
            .then((data) => {
                expect(data.success).to.be.false;
                done();
            })
            .catch(done);
    });
});
