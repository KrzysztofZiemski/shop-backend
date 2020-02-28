const express = require('express');
const path = require('path');
const TransacionController = require(path.resolve(__dirname, '../controllers/transactions.js'));
const Buy = require(path.resolve(__dirname, '../modules/Buy.js'));
const Users = require(path.resolve(__dirname, '../controllers/users.js'));
const Product = require(path.resolve(__dirname, '../controllers/products.js'));

class Transactions {
    constructor() {
        this.router = express.Router();
        this.transacions = new TransacionController();
        this.routes();
        this.user = new Users();
        this.products = new Product();
    }
    // /server/transactions
    routes() {
        this.router.get('/', this._getAll.bind(this))
        this.router.post('/buy', this._buy.bind(this));
    }
    _getAll(req, res) {
        this.transacions.getAll()
            .then(response => {
                res.status(200).json(response)
            }).catch(err => res.status(500).json(res))
    }
    async _buy(req, res) {

        try {
            const data = req.body;
            const responseTransaction = await new Buy(data).start();

            if (!responseTransaction) return res.status(500).json('nie udało się dokonać zakupu - spróbuj później');
            if (data.userId !== "") {
                const user = await this.user.getUserById(data.userId);
                user.historyTransactions.push({ id: responseTransaction.idTransacion, products: responseTransaction.buyedProducts })
                this.user.addUserTransaction(user);
            }

            const responseProduct = await this.products.buy(responseTransaction.buyedProducts);

            //zrobic wysyłke maili
            res.status(200).json('successed transaction')
        } catch (err) {
            res.status(500).json('error server')
        }
    }
}




module.exports = Transactions;