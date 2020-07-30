const NOTIFICATION=db.models.notifications

const sequelize = require('sequelize')
const fs = require('fs');
var FCM = require('fcm-node');
 var apn = require('apn');
 var fcm = new FCM(config.NOTIFICATION_KEY);
 var cron = require('node-cron');
 var moment = require('moment')
 const Op = require('sequelize').Op;
 var dateFormat = require('dateformat');

 var nodemailer = require('nodemailer');
var transporter = nodemailer.createTransport({
    host: config.EMAIL_HOST,
    port: 465,
    secure: true, // use SSL
    //service: 'gmail',
    auth: {
        user: config.EMAIL_KEY,
        pass: config.EMAIL_PASS
    }
});



cron.schedule('30 06 * * *',  async() => {
   console.log('running a task every 6:30 AM ');
   var days=['sun','mon','tue','wed','thu','fri','sat']

   var dayCount=days[new Date().getDay()]
  try {
    var findData = await SCHEDULE.findAll({where: {dayParts:{[Op.not]: dayCount}}});
    findData=JSON.parse(JSON.stringify(findData))

for(var t=0;t<findData.length;t++)
{
  SCHEDULE.update(
     {slots: findData[t].permanentSlots},
      {where: {id:findData[t].id}});
 }


//Delete older Notifications

NOTIFICATION.destroy({where: {  createdAt: {[Op.lte]: moment().subtract(7, 'days').toDate()
}}
});


//UPDate Vendors rating
updateVendorsRating()

//Update Servcice RATINGS
updateServiceRating()




  } catch (e) {
    console.error(e.message)
  }

  });
   

  cron.schedule('* */360 * * *',  async() => {
    console.log('running a task every 360 Mins ');
    try{
      var newDate = moment(new Date()).format("YYYY/MM/DD hh:mm:ss");


      var services = await SERVICES.findAll({
        attributes: ['id','name','icon','thumbnail','validUpto','offer','offerName','price','originalPrice'],
        where: {
                 status: 1,
                 validupto: {
                  [Op.lt]: newDate
                },
               
        },
        order: [
          ['offer','DESC']
        ]
      })


      services=JSON.parse(JSON.stringify(services))
      for(var p=0;p<services.length;p++)
      {
      
        SERVICES.update( {price:services[p].originalPrice,
          offer: 0,offerName:'',validUpto:null},
          {where: {id: services[p].id}})
   
        }


    
   } catch (e) {
     console.error(e.message)
   }
 
   }); 


 


// cron.schedule('* * * * *', () => {
//   var newDate = moment(new Date()).subtract(10,'days');

//   console.log('Runing a job at 01:0`0 at America/Sao_Paulo timezone',newDate);
 
// }, {
//   scheduled: true,
//   timezone: "Asia/Kolkata"
// });


//Recent Added Company ande product Ratings
 

async function updateServiceRating()
{

  var products =  await SERVICERATINGS.findAll({
    attributes: ['serviceId'],
    group:['serviceId'],
  where: {
    createdAt: {[Op.gte]: moment().subtract(2, 'days').toDate()}}
  })
  
  
  
  
  if(products && products.length>0) 
    {
      products=JSON.parse(JSON.stringify(products))
  
  for(var k=0;k<products.length;k++)
        {
          var rating=0
          var count=0
  
  var dataRating= await commonMethods.getServiceAvgRating(products[k].serviceId)
  if(dataRating && dataRating.dataValues && dataRating.dataValues.totalRating) 
  {rating=dataRating.dataValues.totalRating
    count=dataRating.dataValues.totalNoRating
  
  
  }
   SERVICES.update({
    rating: rating,
    totalRatings: count,
  },
  {
    where : {
    id: products[k].serviceId
  }
  });
  
  
        }
  
    }
}
async function updateVendorsRating()
{
  //RECENT added Ratings
  var vendors =  await COMPANYRATING.findAll({
    attributes: ['companyId'],
    group:['companyId'],

  where: {
    createdAt: {[Op.gte]: moment().subtract(2, 'days').toDate()}}
  })
  

  if(vendors) 
  {
    vendors=JSON.parse(JSON.stringify(vendors))

for(var k=0;k<vendors.length;k++)
      {
        var rating=0
        var count=0

var dataRating= await commonMethods.getCompAvgRating(vendors[k].companyId)
if(dataRating && dataRating.dataValues && dataRating.dataValues.totalRating) 
{rating=dataRating.dataValues.totalRating
  count=dataRating.dataValues.totalNoRating


}
 COMPANY.update({
  rating: rating,
  totalRatings: count,
},
{
  where : {
  id: vendors[k].companyId
}
});


      }

  }






}

//PRODUCT RATINGS








