const express = require('express');
const path = require('path');
const multer = require('multer');
const fs = require('fs');
const Product = require(path.resolve(__dirname, '../controllers/products.js'));
const AuthController = require(path.resolve(__dirname, '../controllers/authentication.js'));
const config = require(path.resolve(__dirname, './../config.json'));

const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, path.join(__dirname, '../static'));
    },
    filename: function (req, file, cb) {
        cb(null, `${req.body.name}.png`);
    }
})

const upload = multer({
    storage: storage,
    limits: {
        fileSize: 1024 * 1024 * 10//10MB
    },
    // fileFilter: filefilter
});

class ApiRouter {
    constructor() {
        this.router = express.Router();
        this.products = new Product();
        this.auth = new AuthController();
        this.routes();
    }
    // /server/api
    routes() {
        this.router.get('/', this._getAllProducts.bind(this));
        this.router.get('/filter', this._getCategory.bind(this));
        this.router.get('/:id', this._getProduct.bind(this));
        this.router.post('/', this.auth.checkAdminToken, upload.single('image'), this._addProduct.bind(this));
        this.router.put('/:id', this.auth.checkAdminToken, upload.single('image'), this._changeProduct.bind(this));
        this.router.delete('/:id', this.auth.checkAdminToken, this._deleteProduct.bind(this));
        this.router.put('/', this.auth.checkAdminToken, upload.single('image'), this._changeProduct.bind(this));
    }

    _getCategory(req, res) {
        const category = req.query;
        this.products.filterProperty(category)
            .then(response => res.json(response))
            .catch(err => {
                res.status(500).json(err)
            })
    }
    _getAllProducts(req, res) {
        this.products.getAll()
            .then(response => {
                res.status(200).json(response);
            })
            .catch(err => {
                res.status(500).json(err)
            })
    }

    _getProduct(req, res) {
        const id = req.params.id;
        this.products.getProduct(id)
            .then(response => {
                res.status(200).json(response)
            })
            .catch(err => {
                res.status(500).json(err)
            })
    }
    async _addProduct(req, res) {
        const data = req.body;
        data['image'] = `${config.SERVER}/${req.body.name}.png`;
        data['tags'] = data['tags'].length === 0 ? "" : data['tags'].split(',')
        data.count = Number(data.count);
        data.price = Number(data.price);

        const isOk = this._checkDataComplete(data, req.file);
        if (!isOk) res.status(400).json('brak wszystkich wymaganych informacji');

        const isExistSameNameProduct = await this.products.searchProduct(data.name);

        if (isExistSameNameProduct.length !== 0) {
            return res.status(400).json('produkt już istnieje');
        }
        this.products.addProduct(data).then(response => {
            return res.status(200).json('dodano produkt');
        }).catch(err => {
            res.status(500).json(err)
        })
    }
    _checkDataComplete(data, file) {
        const { name, description, category, count, price, image, tags } = data
        if (!file || !name || !description || !category || count === NaN || price === NaN || typeof tags !== 'object') {
            return false
        }
        return true
    }
    ///////błąd podczas zmiany - do dopracowania!!!!!!!!!
    _changeProduct(req, res, next) {
        const data = req.body;
        if (data['tags']) data['tags'] = data['tags'].length === 0 ? "" : data['tags'].split(',')

        const id = req.params.id;
        this.products.changeProduct(id, data)
            .then(response => {
                res.status(200).json(response);
            })
            .catch(err => {
                res.status(500)
            })
    }

    _deleteProduct(req, res) {
        const id = req.params.id;
        this.products.deleteProduct(id)
            .then(response => {
                res.status(200).json(response);
            })
            .catch(err => {
                res.status(500).json(err)
            })
    }

}

module.exports = ApiRouter;