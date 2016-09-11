// in this file are all the settings for the app
// replace the env variables with your data or use env variables.
module.exports = {
    'web_port' : 3000,
    'web_ip' : '0.0.0.0',
    'db' : process.env.VHC3D_DB,
    'secret' : process.env.VHC3D_SECRET,
    'octo_addr' : process.env.VHC3D_OCTO_ADDR,
    'octo_key' : process.env.VHC3D_OCTO_KEY,
    'googleOauth' : {
        'clientID' : process.env.VHC3D_GOAUTH_CLIENTID,
        'clientSecret' : process.env.VHC3D_GOAUTH_CLIENTSECRET,
        'callbackURL' : 'http://127.0.0.1:3000/auth/google/callback'
    }
};
