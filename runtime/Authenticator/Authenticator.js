const AccessToken = Twilio.jwt.AccessToken;
const ClientCapability = Twilio.jwt.ClientCapability;
const SyncGrant = AccessToken.SyncGrant;

function getSyncToken(context, username) {
  // Create a "grant" which enables a client to use Sync as a given user,
  // on a given device
  let syncGrant = new SyncGrant({
    serviceSid: context.SYNC_SERVICE_SID
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

  return token.toJwt();
}

function getTwimlAppToken(context) {
  const capability = new ClientCapability({
    accountSid: context.ACCOUNT_SID,
    authToken: context.AUTH_TOKEN,
    ttl : parseInt(context.TOKEN_TTL)
  });

  capability.addScope(
    new ClientCapability.OutgoingClientScope({
      applicationSid: context.TWIML_APP_SID})
  );

	return capability.toJwt();
}

exports.handler = function(context, event, callback) {
  let username = event.username;
  let pincode = event.pincode;

  if (!username) return callback(null, { success: false, error: "username is not defined in event" });
  if (!pincode) return callback(null, { success: false, error: "pincode is not defined in event" });

  if (!Authorization.auth(context, username, pincode)) return callback(null, { success: false, error: "username or token provided is invalid" });

  // Serialize the token to a JWT string and include it in a JSON response
  callback(null, {
    success: true,
    username: username,
    ttl: context.TOKEN_TTL,
    sync_token: getSyncToken(context, username),
    twiml_app_token: getTwimlAppToken(context),
  });
};
