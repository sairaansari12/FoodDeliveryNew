const db = require('./db');
module.exports = {
	db: db.development,
	PORT:9062,
	mediapath: 'public/company/',
	dirnames : ['images', 'thumbnails', 'audios', 'videos','documents'],
	jwtToken: 'PGSGFUISBHS=^$#*(%^#',
	saltRounds: 10,
	authTokenExpiration: '7d',
	refreshTokenExpiration: '30d',
	MAIL_USERNAME:'',
	MAIL_PASSWORD:'',
	FCM_KEY:'sfnsvdfvs',
	UPLOAD_DIRECTORY:'public/',
	// IMAGE_APPEND_URL:'http://51.79.40.224:9061/',
	IMAGE_APPEND_URL:'http://51.79.40.224:9075/',
	NOTIFICATION_KEY:'',
	NOTIFICATION_EMP_KEY:'',
	REMINDER_MAIL:'info@homeservices',
	EMAIL_HOST :'',
	EMAIL_KEY :'apikey',
	INVOICE_SUBJECT:'Info Message',
	FOROGT_SUBJECT:'Reset Password request',
	EMAIL_PASS :''  , 
	APP_NAME:'Home Services'
};
