//inventory
//cart
//reservation
//payments
var express = require('express');
var router = express.Router();
let slugify = require('slugify');
let productModel = require('../schemas/products')
let inventoryModel = require('../schemas/inventories')
let mongoose = require('mongoose')
const { CheckLogin, CheckRole } = require('../utils/authHandler'); // THÊM IMPORT NÀY ĐỂ CHECK QUYỀN

//R CUD
/* GET users listing. */
router.get('/', async function (req, res, next) {
  let queries = req.query;
  let titleQ = queries.title ? queries.title.toLowerCase() : '';
  let min = queries.minprice ? queries.minprice : 0;
  let max = queries.maxprice ? queries.maxprice : 999999999;
  console.log(queries);
  let data = await productModel.find({
    isDeleted: false,
    title: new RegExp(titleQ, 'i'),
    price: {
      $gte: min,
      $lte: max
    }
  }).populate({
    path: 'category',
    select: 'name'
  })
  res.send(data);
});

router.get('/:id', async function (req, res, next) {
  try {
    let id = req.params.id;
    let result = await productModel.find({
      isDeleted: false,
      _id: id
    })
    if (result.length > 0) {
      res.send(result[0])
    } else {
      res.status(404).send("ID NOT FOUND")
    }
  } catch (error) {
    res.status(404).send(error.message)
  }
});

// THAY THẾ ROUTER POST TẠI ĐÂY: Kết hợp cả Transaction cũ và logic kho mới
router.post('/', CheckLogin, CheckRole("ADMIN"), async function (req, res, next) {
  let session = await mongoose.startSession();
  session.startTransaction()
  try {
    // 1. Tạo sản phẩm mới với Slugify
    let newProduct = new productModel({
      sku: req.body.sku,
      title: req.body.title,
      slug: slugify(req.body.title,
        {
          replacement: '-',
          remove: undefined,
          lower: true,
          trim: true
        }
      ),
      price: req.body.price,
      images: req.body.images,
      description: req.body.description,
      category: req.body.category,
      
    })
    await newProduct.save({ session });

    // 2. TỰ ĐỘNG khởi tạo bản ghi kho cho sản phẩm này
    let newInventory = new inventoryModel({
      product: newProduct._id,
      stock: 0,       // Mặc định kho bằng 0
      reserved: 0,    // Chưa có ai đặt giữ hàng
      soldCount: 0    // Chưa bán được cái nào
    })
    await newInventory.save({ session });
    
    await session.commitTransaction()
    await session.endSession()
    
    // Trả về sản phẩm vừa tạo thành công
    res.status(201).send(newProduct)
  } catch (error) {
    await session.abortTransaction()
    await session.endSession()
    res.status(400).send({ message: error.message })
  }
})

router.put('/:id', async function (req, res, next) {
  try {
    let id = req.params.id;
    let result = await productModel.findByIdAndUpdate(
      id, req.body, {
      new: true
    })
    res.send(result)
  } catch (error) {
    res.status(404).send(error.message)
  }
})

router.delete('/:id', async function (req, res, next) {
  try {
    let id = req.params.id;
    let result = await productModel.findById(id)
    result.isDeleted = true;
    await result.save()
    res.send(result)
  } catch (error) {
    res.status(404).send(error.message)
  }
})

module.exports = router;