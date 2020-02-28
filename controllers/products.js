const PouchDB = require('pouchdb');
PouchDB.plugin(require('pouchdb-find'));
const path = require('path');
const fs = require('fs');
const config = require(path.resolve(__dirname, './../config.json'))
const Validate = require(path.resolve(__dirname, './modelsDB'));

class Product {
    constructor() {
        this.db = new PouchDB(path.resolve(__dirname, './../db/products'));
        this.validate = new Validate();
    }

    getAll = () => this.db.allDocs({ include_docs: true });

    getProduct = (id) => this.db.get(id)

    filterProperty = (propertyObject) => this.db.find({ selector: propertyObject })

    addProduct = (data) => this._validate(data).then(response => this.db.post({ ...response }))

    async changeProduct(id, data) {
        const product = await this.getProduct(id);
        data['image'] = `${config.SERVER}/${data.name}.png`;

        if (data.name !== product.name) {
            const pathImg = path.resolve(__dirname, `../static/${product.name}.png`);
            const newPath = path.resolve(__dirname, `../static/${data.name}.png`);
            try {
                fs.rename(pathImg, newPath, (err) => { if (err) console.log("błąd podczas usuwania pliku") })
            } catch{
                console.log('błąd podczas usuwania pliku')
            }
        }
        return this._updateProduct(product, data);
    }

    _updateProduct = (product, data) => this.db.put({ ...product, ...data })

    async deleteProduct(id) {
        const product = await this.getProduct(id)

        const pathImg = path.join(__dirname, `../static/${product.name}.png`);
        try {
            fs.unlinkSync(pathImg, (err) => console.log("błąd podczas usuwania pliku"))
        } catch{
            console.log('błąd podczas usuwania pliku')
        }
        return this.db.remove(product)
    }

    async buy(productList) {
        const response = await Promise.all(productList.map(element => {
            element.product.count -= element.countBought;
            const product = element.product;
            return this.db.put({ ...product })
        }))
        return response
    }
    searchProduct = (name) => this.db.find({ selector: { name }, fields: ['name'] }).then(response => response.docs);

    _validate = (data) => this.validate.validateProduct(data)

}

module.exports = Product;
