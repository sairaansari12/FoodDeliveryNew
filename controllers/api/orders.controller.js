
const express = require('express');
const app = express();
const Op = require('sequelize').Op;
var dateFormat = require('dateformat');
var moment = require('moment');
const { companyId } = require('../../helpers/common');

ORDERS=db.models.orders
const COUPAN= db.models.coupan;
const CART=db.models.cart
const SUBORDERS=db.models.suborders

const SERVICES = db.models.services
const SCHEDULE = db.models.schedule

//Relations
SUBORDERS.belongsTo(SERVICES,{foreignKey: 'serviceId'})
ORDERS.belongsTo(ADDRESS,{foreignKey: 'addressId'})
ORDERS.belongsTo(COMPANY,{foreignKey: 'companyId'})
ORDERS.hasMany(SUBORDERS,{foreignKey: 'orderId'})
ORDERS.belongsTo(ORDERSTATUS,{foreignKey: 'progressStatus'})




app.post('/create',checkAuth,async (req, res, next) => {
  const params = req.body;
  var days=['sun','mon','tue','wed','thu','fri','sat']

var promoCodeApplied=""
  let responseNull=  commonMethods.checkParameterMissing([params.serviceDateTime,params.addressId,params.deliveryType,params.serviceCharges,params.companyId])
  if(responseNull) return responseHelper.post(res, appstrings.required_field,null,400);
   
  
  try{
		const findData = await PAYMENT.findOne({where: {userId: req.id,transactionStatus: 2},order: [
      ['createdAt','DESC']
    ],})  
      
     if(findData)
{
  ORDERS.destroy({where:{id: findData.dataValues.orderId}})
  SUBORDERS.destroy({where:{orderId: findData.dataValues.orderId}})
  PAYMENT.destroy({where:{orderId: findData.dataValues.orderId}})


}
   


   //else{
      var date1=new Date(params.serviceDateTime)
      var dayCount=days[date1.getDay()]
    var schedules = await SCHEDULE.findOne({where :{companyId: params.companyId,dayParts:dayCount}})
    var slotdata=JSON.parse(schedules.dataValues.slots)
    var day=dateFormat(new Date(params.serviceDateTime), "hh:MM");
    var startDate = moment(day, 'hh:mm')
   var slotsBookingsAlowed=0

    for(var t=0;t<slotdata.length;t++)
    {

var endDate = moment(slotdata[t].slot, 'hh:mm')
var minsDiff = endDate.diff(startDate, 'minutes')
if(minsDiff==0)   
{
  slotsBookingsAlowed=slotdata[t].bookings
}  

    }

    var cartData = await CART.findAll({ where :{companyId: params.companyId, userId : req.id }});
    if(cartData && cartData.length>0) 
   {


  //  console.log(">>>>>>>>>>>>>",cartData)
    var countDataq = await CART.findOne({
      attributes: ['id','promoCode','userId',
        [sequelize.fn('sum', sequelize.col('orderTotalPrice')), 'totalSum'],
        [sequelize.fn('sum', sequelize.col('quantity')), 'totalQuantity'],

      ],
  
    where :{companyId: params.companyId, userId : req.id
     
    }
});




cartData=JSON.parse(JSON.stringify(cartData))
countDataq=JSON.parse(JSON.stringify(countDataq))

if(parseInt(slotsBookingsAlowed)==0)
//if(parseInt(countDataq.slotsBookingsAlowed)>0)
return responseHelper.post(res, appstrings.all_slots_full, null, 400);



var orderPrice=countDataq.totalSum
var discountPrice=0
var serviceCharges=(params.serviceCharges && params.serviceCharges!="") ? params.serviceCharges :0
var totalPrice=parseFloat(orderPrice)+parseFloat(serviceCharges)

if(params.tip && params.tip!="")
totalPrice=totalPrice+parseFloat(params.tip)


// Write APPLY PROMO CODE HERE//

const coupanDetails = await COUPAN.findOne({
  attributes: ['id','code','discount'],
   where: {
     code: cartData[0].promoCode,
     status :1

   }
 });

 if(coupanDetails)
 {
   
   let per   = parseFloat(coupanDetails.dataValues.discount);
   discountPrice = (totalPrice/100)*per;        // Get Percentage Amount
   totalPrice  = totalPrice - discountPrice;  //Payable Amount
   promoCodeApplied=coupanDetails.dataValues.code
 }


 //const cOrderData=null
    const cOrderData = await ORDERS.create({
	
      addressId: params.addressId,
      serviceDateTime: params.serviceDateTime,
      orderPrice :orderPrice ,
      serviceCharges :serviceCharges,
      offerPrice: discountPrice,
      promoCode: promoCodeApplied,
      totalOrderPrice:totalPrice,
      userId: req.id,
      companyId: params.companyId,
      deliveryType: params.deliveryType,
      tip: params.tip,
      cookingInstructions: params.cookingInstructions,
      deliveryInstructions: params.deliveryInstructions,
      pickupInstructions: params.pickupInstructions,



      })  
      
      if(cOrderData) 
      {

        subOrdersEntry(cartData,cOrderData.dataValues.id,req.id,async function(data,error)
        {

  if(data)
  
  {
    paymentEntry(req.id,params.companyId,cOrderData.dataValues.id,totalPrice)
    subtractBookingsCount(slotdata,countDataq.totalQuantity,params.serviceDateTime,dayCount,params.companyId)
     sendNotification(req,params,totalPrice,cOrderData.dataValues.id)
     updateUserTye(req.id)
    return responseHelper.post(res, appstrings.order_success, cOrderData);}
    else  return responseHelper.post(res, error, null,400);
 
         })

 }
 else return responseHelper.post(res, appstrings.oops_something, null,400);





}
else return responseHelper.post(res, appstrings.no_item_cart,null, 204);




 }
catch (e) {
  console.log(e)
  return responseHelper.error(res, e.message, 400);
}
  
}) 

async function sendNotification(req,params,totalPrice,orderId)
{
  
   
var userData=await USER.findOne({where:{id:req.id}});
var countryCode="",phoneNumber=""
if(userData &&userData.dataValues)
{
phoneNumber=userData.dataValues.phoneNumber
countryCode=userData.dataValues.countryCode

}

var notifData={title:appstrings.new_order_title+" "+commonMethods.formatAMPM(new Date(params.serviceDateTime)),
      description:appstrings.new_order_description +" " +commonMethods.formatAMPM(new Date(params.serviceDateTime)) + " Contact : +"+countryCode+" "+phoneNumber,
      userId:params.companyId,
      orderId:orderId,
      role:2}

 var notifUserData={title:appstrings.order_placed+" "+commonMethods.formatAMPM(new Date(params.serviceDateTime)),
      description:appstrings.order_placed +" " +commonMethods.formatAMPM(new Date(params.serviceDateTime)) + " Rs : "+totalPrice,
      userId:req.id,
      orderId:orderId,
      role:3}

 var notifPushUserData={title:appstrings.order_placed+" "+commonMethods.formatAMPM(new Date(params.serviceDateTime)),
      description:appstrings.order_placed +" " +commonMethods.formatAMPM(new Date(params.serviceDateTime)) + " Rs : "+totalPrice,
      token:userData.dataValues.deviceToken, 
      orderId:orderId,
           platform:userData.dataValues.platform,notificationType:"ORDER_PLACED",status:0,
}

 commonNotification.insertNotification(notifData)   
 commonNotification.insertNotification(notifUserData)   
 commonNotification.sendNotification(notifPushUserData)   

}

async function updateUserTye(userId)
{
  var type=1
 ORDERS.findAll({where:{userId:userId}}).then(data=>
 {
if(data && (data.length>0 && data.length<6)) type=2 
if(data && (data.length>=6 && data.length<15)) type=3 

USER.update({userType:type},{where:{id:userId}})

 }).catch(err=>{
console.log(err)
 })
 


}

app.post('/status',checkAuth,async(req,res,next) => { 
    
  var params=req.body
  try{
      let responseNull=  commonMethods.checkParameterMissing([params.id,params.status])
      if(responseNull) return responseHelper.post(res, appstrings.required_field,null,400);
     
    

     var userData = await ORDERS.findOne({
       where: {
         id: params.id }
     });
     
     
     if(userData)
     {
     
if(params.status=="5" && userData.dataValues.trackStatus<3 )
return responseHelper.post(res, appstrings.job_not_completed,null,400);


  const updatedResponse = await ORDERS.update({
       progressStatus: params.status,

     },
     {
       where : {
       id: userData.dataValues.id
     }
     });
     
     if(updatedResponse)
           {
  if(params.status==5)
  {
    userData=JSON.parse(JSON.stringify(userData))
            var findData=await USER.findOne({where:{id:userData.userId}});
       var notifPushUserData={title:userData.orderNo +appstrings.order_mark_complete+ ' on ' +commonMethods.formatAMPM(new Date),
            description:userData.orderNo +appstrings.order_mark_complete + ' on ' +commonMethods.formatAMPM(new Date),
            token:findData.dataValues.deviceToken,  
                platform:findData.dataValues.platform,
                userId :userData.userId, role :3,
                notificationType:"ORDER_STATUS",status:5,
      }
      
commonNotification.insertNotification(notifPushUserData)   
 commonNotification.sendNotification(notifPushUserData)
    }
         return responseHelper.post(res, appstrings.success,null);
           }
           else{
             return responseHelper.post(res, appstrings.oops_something,400);
  
           }
     
     }

     else{
      return responseHelper.post(res, appstrings.no_record,204);

    }

       }
         catch (e) {
           return responseHelper.error(res, e.message, 400);
         }
  
  
  
});

app.post('/paymentStatus',checkAuth,async(req,res,next) => { 
    
  var params=req.body
  var paymentState=0
  try{
      let responseNull=  commonMethods.checkParameterMissing([params.orderId,params.status])
      if(responseNull) return responseHelper.post(res, appstrings.required_field,null,400);
     
    if(params.status=="1") {paymentState=1
      CART.destroy({where:{userId: req.id}})
    }

     const userData = await PAYMENT.findOne({
       where: {
         orderId: params.orderId,
         userId: req.id,
        }
     });
     
     
     if(userData)
     {
     

   
  const updatedResponse = await PAYMENT.update({
    userId: req.id,
    orderId:params.orderId ,
    transactionStatus:params.status ,
    paymentMode:params.paymentMode ,
    transactionId:params.transactionId ,
    paymentState:paymentState,
    updatedAt: new Date()

     },
     {
       where : {
       id: userData.dataValues.id
     }
     });
     
     if(updatedResponse)return responseHelper.post(res, appstrings.success,null);
     return responseHelper.post(res, appstrings.oops_something,400);
  
          
     
     }

     else{

var orderData=await ORDERS.findOne({
  where: {
    id: params.orderId,
   }
});

      const createdResponse = await PAYMENT.create({
        userId: req.id,
        companyId: orderData.dataValues.companyId,
        orderId:params.orderId ,
        transactionStatus:params.status,
        paymentMode:params.paymentMode,
        transactionId:params.transactionId,
        paymentState:paymentState,
        amount:params.amount

    
         });
         if(createdResponse)return responseHelper.post(res, appstrings.success,null);
         return responseHelper.post(res, appstrings.oops_something,400);
    
        }
       }
         catch (e) {
           return responseHelper.error(res, e.message, 400);
         }
  
  
  
});


function paymentEntry(userId,companyId,orderId,amount)
{

  try{
   PAYMENT.create({
    
    userId: userId,
    companyId: companyId,
    orderId:orderId ,
    amount:amount

   
    })  
  }
  catch(e)
  {console.log(e)}



}


 function subtractBookingsCount(slotdata,quantity,serviceDateTime,dayCount,companyId)

{
  var day=dateFormat(new Date(serviceDateTime), "hh:MM");
  var startDate = moment(day, 'hh:mm')
  for(var t=0;t<slotdata.length;t++)
  {

var endDate = moment(slotdata[t].slot, 'hh:mm')
var minsDiff = endDate.diff(startDate, 'minutes')
if(minsDiff==0)   
{
//slotsBookingsAlowed=slotdata[t].bookings
var quantity=parseInt(slotdata[t].bookings)-parseInt(quantity)
slotdata[t].bookings=quantity.toString()
}  

  }


  //console.log("SLOTS are>>>>",JSON.stringify(slotdata))
   SCHEDULE.update({slots : JSON.stringify(slotdata)}, {where :{companyId:companyId,dayParts:dayCount}})


}


async function subOrdersEntry(orderData,id,userId,callback)
{
  try{
  for(var t=0;t<orderData.length;t++)
  {
   

    await SUBORDERS.create({
    
      serviceId: orderData[t].serviceId,
      quantity: orderData[t].quantity,
      orderId :id ,
      userId :userId 

     
      })  

      if(t==orderData.length-1)
      callback("Success",null)
  }

}
catch(error)
{
callback(null,error.message)

}
}

app.get('/list',checkAuth,async (req, res) => {
   
    var params=req.query
    var pStatus= await ORDERSTATUS.findAll({companyId:req.parentCompany});

    // var progressStatus =  ['0','1','2','3','4','5']
  var progressStatus = pStatus

    
    var page =1
    var limit =20
    if(params.page) page=params.page
    if(params.limit) limit=parseInt(params.limit)
    if(params.progressStatus && params.progressStatus!="")  progressStatus=params.progressStatus.split(",")


    //console.log(">>>>>>>>",progressStatus)
 
    var offset=(page-1)*limit

   
    try {
      var user = await ORDERS.findAll({
      where :{userId : req.id,
        progressStatus: { [Op.or]: progressStatus},

      },
      order: [
        ['createdAt', 'DESC']],
      offset: offset, limit: limit,
       
      include: [
        {model: db.models.address , attributes: ['id','addressName','addressType','houseNo','latitude','longitude','town','landmark','city'] } ,
        {model: COMPANY , attributes: ['address1LatLong'],required:true},
        {model: ORDERSTATUS , attributes: ['statusName','id']},
        {model: SUBORDERS , attributes: ['id','serviceId','quantity'],
        include: [{
          model: SERVICES,
          attributes: ['id','name','description','productType','price','icon','thumbnail','type','price','duration'],
          required: false
        }],

} ,
      
      
       
    ],


      });
user=JSON.parse(JSON.stringify(user))
      for(var t=0;t<user.length;t++)
      {

  var orderDate=new Date(user[t].createdAt)
var today=new Date()
var diffMins = diff_mins(today,orderDate); // milliseconds between now & Christmas

console.log("diffMins>>>>",diffMins)
if( diffMins<30 && user[t].progressStatus<5)  user[t].cancellable=true 
else  user[t].cancellable=false
 


if(user[t].company && user[t].company.address1LatLong!=null)      user[t].companyAddress=JSON.parse(user[t].company.address1LatLong)
else  user[t].companyAddress=null
delete  user[t]['company'];


}
      
        return responseHelper.post(res,appstrings.detail,user);
    } catch (e) {
      return responseHelper.error(res, e.message, 400);
    }
  });


  


app.get('/detail/:orderId',checkAuth,async (req, res) => {
  var orderId=req.params.orderId
  
  let responseNull=  commonMethods.checkParameterMissing([orderId])
  if(responseNull) return responseHelper.post(res, appstrings.required_field,null,400);
   
    try {
      const orderData = await ORDERS.findOne({
      where :{id :orderId},      
      include: [
        {model: db.models.address , attributes: ['id','addressName','addressType','houseNo','latitude','longitude','town','landmark','city'] } ,
        {model: ORDERSTATUS , attributes: ['statusName','id']},
        {model: SUBORDERS , attributes: ['id','serviceId','quantity'],
        include: [{
          model: SERVICES,
          attributes: ['id','name','productType','description','price','icon','thumbnail','type','price','duration'],
          required: false
        }]        
 
        
    } ,

    {model: ASSIGNMENT , attributes: ['id','jobStatus'],
    where:{jobStatus :1},
    required: false,
    include: [{
      model: EMPLOYEE,
      attributes: ['id','firstName','lastName','countryCode','phoneNumber','image'],
      required: false
    }]
    }
      
      ]

      });
     if(orderData) 
     
     {
     
    
      return responseHelper.post(res,appstrings.detail,orderData);


     }
      else return responseHelper.post(res,appstrings.no_record,null,204);
    } catch (e) {
      return responseHelper.error(res, e.message, 400);
    }
  });



  app.get('/instructions',checkAuth,async (req, res) => {
    var deliveryType=req.query.deliveryType
    var companyId=req.query.companyId

    let responseNull=  commonMethods.checkParameterMissing([deliveryType,companyId])
    if(responseNull) return responseHelper.post(res, appstrings.required_field,null,400);
     
      try {
        const orderData = await INSTRUCTIONS.findOne({
        where :{status :1},      
        });
       if(orderData) 
       
       {
       if(deliveryType=="0")
       {orderData.tips=null
       }

        return responseHelper.post(res,appstrings.detail,orderData);
  

       }
        else return responseHelper.post(res,appstrings.no_record,null,204);
      } catch (e) {
        return responseHelper.error(res, e.message, 400);
      }
    });
  


  app.post('/cancel',checkAuth,async (req, res, next) => {
    const params = req.body;
  
  
    let responseNull=  commonMethods.checkParameterMissing([params.orderId])
    if(responseNull) return responseHelper.post(res, appstrings.required_field,null,400);
    
    try{
      const orderData = await ORDERS.findOne({
      where: {
        id: params.orderId,
        userId: req.id
        
      }
      })  
        
      if(orderData)
     {
  

var orderDate=new Date(orderData.dataValues.createdAt)
var today=new Date()
var diffMins = diff_mins(today,orderDate);
if(orderData.progressStatus>=1 &&  diffMins>30)
return responseHelper.post(res, appstrings.order_not_cancel, null,400);


else
{
 
  const updatedResponse = await ORDERS.update({
    progressStatus: 2,
    cancellationReason:params.cancellationReason
  },
  {
    where : {
    id: orderData.dataValues.id
  }
  });
  
        
        if(updatedResponse) 
  {
       orderData.dataValues.progressStatus=3
       orderData.dataValues.cancellationReason=params.cancellationReason

        return responseHelper.post(res, appstrings.cancel_success, orderData);
  }
        else return responseHelper.post(res, appstrings.oops_something, null,400);
  
  }
}

  else return responseHelper.post(res, appstrings.no_record, null,204);


   }
  catch (e) {
    console.log(e)
    return responseHelper.error(res, e.message, 400);
  }
    
  })
  

  app.delete('/delete',checkAuth,async(req,res, next) => {
    const params = req.query;
    
    let responseNull=  common.checkParameterMissing([params.orderId])
    if(responseNull) return responseHelper.error(res, appstrings.required_field, 400);
  
    try{
      const orderData = await ORDERS.findOne({
      where: {
        id: params.orderId,
        userId: req.id
        
      }
      })  
        
      if(orderData)
     {


if(orderData.progressStatus>=1)
return responseHelper.post(res, appstrings.order_not_delete, null,400);
    

const numAffectedRows = await ORDERS.destroy({
    where: {
      id: params.orderId
  
    }
    })  
      
    if(numAffectedRows>0)
    return responseHelper.post(res, appstrings.order_delete_success,null);
   
  }
  else
  return responseHelper.error(res, appstrings.no_record, 404);
  }
  catch (e) {
    return responseHelper.error(res, e.message, 400);
  }
      
     });



     function diff_mins(dt2, dt1) 
 {

  var diff =(dt2.getTime() - dt1.getTime()) / 1000;
  diff /= (60 * 60);
  return Math.abs(Math.round(diff*60));
  
 }
     
module.exports = app;



//Edit User Profile
