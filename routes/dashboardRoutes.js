const express                     = require('express');
const router                      = express.Router();

const authController              = require('../controllers/dashboard/dauth.controller');
const serviceController              = require('../controllers/dashboard/dservice.controller');
const categoryController              = require('../controllers/dashboard/dcategory.controller');
const subserviceCtrl              = require('../controllers/dashboard/dsubservice.controller');
const ordersCtrl              = require('../controllers/dashboard/dorders.controller');
const coupanCtrl              = require('../controllers/dashboard/dcoupan.controller');
const empCtrl              = require('../controllers/dashboard/demployees.controller');
const scheduleCtrl              = require('../controllers/dashboard/dschedule.controller');
const subCatCtrl              = require('../controllers/dashboard/dsubcategory.controller');
const ratingCtrl              = require('../controllers/dashboard/dratings.controller');
const profileCtrl              = require('../controllers/dashboard/dprofile.controller');
const documentCtrl              = require('../controllers/dashboard/ddocument.controller');
const faqCtrl              = require('../controllers/dashboard/dfaq.controller');
const bannerCtrl              = require('../controllers/dashboard/dbanner.controller');
const paymentCtrl              = require('../controllers/dashboard/dpayment.controller');
const notificationCtrl              = require('../controllers/dashboard/dnotification.controller');
const productCtrl = require('../controllers/dashboard/dproduct.controller');
const dealCtrl              = require('../controllers/dashboard/ddeal.controller');

const offerCtrl              = require('../controllers/dashboard/doffer.controller');

const settingCtrl = require('../controllers/dashboard/dsettings.controller');
const osettingCtrl = require('../controllers/dashboard/dinstruction.controller');

router.use('/',authController);
router.use('/category/',categoryController);
router.use('/subcategory/',subCatCtrl);
router.use('/service/',serviceController);
//router.use('/subservice/',subserviceCtrl);
router.use('/orders/',ordersCtrl);
router.use('/coupans/',coupanCtrl);
router.use('/employees/',empCtrl);
router.use('/schedule/',scheduleCtrl);
router.use('/ratings/',ratingCtrl);
router.use('/profile/',profileCtrl);
router.use('/document/',documentCtrl);
router.use('/faq/',faqCtrl);
router.use('/banner/',bannerCtrl);
router.use('/payment/',paymentCtrl);
router.use('/notification/',notificationCtrl);
router.use('/products/',productCtrl);
router.use('/deals/',dealCtrl);

router.use('/offers/',offerCtrl);

router.use('/settings/',settingCtrl);

router.use('/ordersetting/',osettingCtrl)

router.use((req, res, next) => {

   return res.render('admin/partials/404.ejs');

  // return responseHelper.error(res, 'Please again check the url,this path is not specified', 404);
});

module.exports = router;