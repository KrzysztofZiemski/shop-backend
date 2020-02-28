const express = require('express');
const path = require('path');
const Validate = require(path.resolve(__dirname, '../controllers/modelsDB'));
const Product = require(path.resolve(__dirname, '../controllers/products.js'));
const Transactions = require(path.resolve(__dirname, '../controllers/transactions.js'));

class Buy {
    constructor(data) {
        this.userId = data.userId;
        this.products = data.products;
        this.fulName = data.fulName;
        this.adress = data.adress;
        this.mail = data.mail;
        this.date = new Date();
        this.transactions = new Transactions();
        this.validate = new Validate();
        this.api = new Product();

    }
    async start() {
        try {
            let { products, fulName, adress, userId } = this;
            const productsDB = await this.getProductsById(products).then(products => this.checkAvaible(products)).catch(e => new Error('Product not enought'));
            if (!productsDB) return

            const sumPrice = this.sumPrice(productsDB);

            const date = new Date().toISOString().slice(0, 10);

            const data = {
                products, userId, fulName, adress, sumPrice, date
            }

            const isOkTransaction = await this.validate.validateTransaction(data);

            if (!isOkTransaction) return false;

            const resultAddTransacion = await this.transactions.add(isOkTransaction.products);
            if (!resultAddTransacion.id) return false;
            return {
                idTransacion: resultAddTransacion.id,
                buyedProducts: productsDB,
                sumPrice: sumPrice
            }

        } catch (e) {
            new Error('error server')
        }

    }
    checkAvaible(products) {
        return new Promise((resolve, reject) => {
            products.forEach(item => {
                parseInt(item.product.count) - parseInt(item.countBought) < 0 ? reject() : resolve(products);
            })
        });
    }

    async getProductsById(products) {
        return Promise.all(products.map(async product => {
            const response = await this.api.getProduct(product.id);
            return {
                countBought: product.count,
                product: response
            }
        }))
    }

    sumPrice(arrProducts) {
        let sum = 0;
        arrProducts.forEach(product => {
            sum += parseInt(product.product.price) * parseInt(product.countBought);
        });
        return sum
    }

}

module.exports = Buy;