// in this file are all the settings for the app
// replace the env variables with your data or use env variables.
module.exports = {
    'web_port' : process.env.VHC3D_PORT || 3000,
    'web_ip' : process.env.VHC3D_IP|| '0.0.0.0',
    'db' : process.env.VHC3D_DB,
    'secret' : process.env.VHC3D_SECRET,
    'octo_addr' : process.env.VHC3D_OCTO_ADDR,
    'octo_key' : process.env.VHC3D_OCTO_KEY,
    'googleOauth' : {
        'clientID' : process.env.VHC3D_GOAUTH_CLIENTID,
        'clientSecret' : process.env.VHC3D_GOAUTH_CLIENTSECRET,
        'callbackURL' : process.env.VHC3D_GOAUTH_CALLBACKURL,
        'hd' : process.env.VHC3D_GOAUTH_HD
    },
    'googleAnalytics': process.env.VHC3D_ANALYTICS,
    'mail' : {
        'gmailAddr' : process.env.VHC3D_MAIL_GMAILADDR,
        'gmailAppPassword' : process.env.VHC3D_MAIL_GMAILAPPPASSWORD,
        'sysadmin' : process.env.VHC3D_MAIL_SYSADMIN
    }
};
