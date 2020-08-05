
const express = require('express');
const app     = express();

const Products = db.models.products;
const ProductSpecs = db.models.productSpecifications;
const CATEGORY = db.models.categories;

const { Validator } = require('node-input-validator');

// ProductSpecs.hasMany(Products,{foreign_key: 'productId'});
Products.hasMany(ProductSpecs,{foreignKey: 'productId'})

function isAdminAuth(req, res, next) {
    if(req.session.userData){
      return next();
    }
    return res.redirect('/company');
    // return next();
  }
/**
*@role Get Login Page
*@Method POST
*@author Saira Ansari
*/


app.get('/get',adminAuth,async(req,res,next) => {

    const products = await Products.findAll({
        include: [
            {
                model: ProductSpecs,
                attributes: ['productImages']
            }
        ]
    });
    const categories = await CATEGORY.findAll({ order: [['createdAt', 'DESC']] });

    return res.render('admin/products/viewproducts.ejs',{products,categories});

});

app.get('/add', adminAuth, async(req, res, next)=>{
    const categories = await CATEGORY.findAll({ order: [['createdAt', 'DESC']] });
    return res.render('admin/products/addproduct.ejs',{categories});

});

app.post('/add', adminAuth, async(req, res, next)=> {
    // try{

        let body = req.body;

        const v = new Validator(body, {
            brandname: 'required',
            name: 'required',
            description: 'required',
            price: 'required',
            status: 'required'
        });
    
        const matched = await v.check();

        if(!matched){
            return res.json({
                status: 201,
                message: v.errors
            })
        }

        let icon = "";
        let thumbnail = "";
        let thumbArray = new Array();

        if(req.files != null){

            if("icons" in req.files){

                let iconFile = req.files.icons;

                let name = Date.now() +iconFile.name;

                iconFile.mv('./public/assets/images/products/'+name, function(err) {
                    if (err)
                        console.log(err) 
                });

                icon = Date.now() +iconFile.name;

            }

            if("files" in req.files){

                let thumbnailFile = req.files.files;

                for(j=0;j<thumbnailFile.length;j++){
                    let name = Date.now() +thumbnailFile[j].name;
                    thumbnailFile[j].mv('./public/assets/images/products/'+name , function(err) {
                        if (err)
                            console.log(err) 
                    });

                    // thumbnail = thumbnailFile[j].name;
                    thumbArray.push(name);

                }

            }

            thumbnail = thumbArray.join();
        

        }


        const insertProduct = await Products.create(
            {
                categoryId: body.category,
                brandName: body.brandname,
                name: body.name,
                description: body.description,
                icon: icon,
                thumbnail: thumbnail,
                type: 'Fixed',
                originalPrice: body.price,
                price: body.d_price,
                status: body.status,
                companyId: req.companyId
            }
        );


        const insertSpecs = await ProductSpecs.create({
            productImages: thumbnail,
            productId: insertProduct.dataValues.id
        });


    return res.json({
        status: 200,
        message: "Product Added Successfully!"
    });

    // }catch(e){
    //     return res.json({status: 400, message: e});
    // }
});

app.get('/edit/:id', adminAuth, async(req, res, next)=>{

    const params = req.params;
    const product = await Products.findOne({ where: { id: params.id } });
    const categories = await CATEGORY.findAll({ order: [['createdAt', 'DESC']] });

    return res.render('admin/products/editproducts.ejs',{product,categories});

});

//Edit Post
app.post('/edit/:id',adminAuth, async(req, res, next)=>{
    // try{

        let id = req.params.id;
        let body = req.body;

        const selectProduct = await Products.findOne({
            where: {id: id}
        });

        let icon = selectProduct.icon;
        let thumbnail = selectProduct.thumbnail;
        let thumbArray = new Array();

        if(req.files != null){

            if("icons" in req.files){

                let iconFile = req.files.icons;

                let name = Date.now() +iconFile.name;

                iconFile.mv('./public/assets/images/products/'+name, function(err) {
                    if (err)
                        console.log(err) 
                });

                icon = Date.now() +iconFile.name;

            }

            if("files" in req.files){

                let thumbnailFile = req.files.files;

                for(j=0;j<thumbnailFile.length;j++){
                    let name = Date.now() +thumbnailFile[j].name;
                    thumbnailFile[j].mv('./public/assets/images/products/'+name , function(err) {
                        if (err)
                            console.log(err) 
                    });

                    // thumbnail = thumbnailFile[j].name;
                    thumbArray.push(name);

                }

            }

            thumbnail = thumbArray.join();
        

        }

        const updateProduct = await Products.update(
            {
                categoryId: body.category,
                brandName: body.brandname,
                name: body.name,
                description: body.description,
                icon: icon,
                thumbnail: thumbnail,
                type: body.type,
                price: body.price,
                status: body.status
            },
            { where: { id: id } }
        );

        const updateSpecs = await ProductSpecs.update(
            {
                productImages: thumbnail
            },
            { where: { productId: id } }
        );

        console.log("updatesoecs",updateSpecs)

    return res.json({
        status: 200,
        message: "Product Updated Successfully!"
    })

    // }catch(e){
    //     return res.json({status: 400, message: e});
    // }
});

module.exports = app;