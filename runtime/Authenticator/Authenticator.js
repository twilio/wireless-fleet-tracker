const AccessToken = Twilio.jwt.AccessToken;
const SyncGrant = AccessToken.SyncGrant;

exports.handler = function(context, event, callback) {
  let username = event.username;
  let pincode = event.pincode;

  if (!username) return callback(null, { success: false, error: "username is not defined in event" });
  if (!pincode) return callback(null, { success: false, error: "pincode is not defined in event" });
  if (!Authorization.auth(context, username, pincode)) return callback(null, { success: false, error: "username or token provided is invalid" });

  // Create a "grant" which enables a client to use Sync as a given user,
  // on a given device
  let syncGrant = new SyncGrant({
    serviceSid: context.SERVICE_SID
  });

  // Create an access token which we will sign and return to the client,
  // containing the grant we just created
  let token = new AccessToken(
    context.ACCOUNT_SID,
    context.API_KEY,
    context.API_SECRET, {
        ttl : parseInt(context.TOKEN_TTL) // WARNING: int and string are different for AccessToken
    }
  );
  token.addGrant(syncGrant);
  token.identity = username;

  // Serialize the token to a JWT string and include it in a JSON response
  callback(null, {
    success: true,
    username: username,
    ttl: context.TOKEN_TTL,
    token: token.toJwt()
  });
};
