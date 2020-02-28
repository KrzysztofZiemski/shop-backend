const PouchDB = require('pouchdb');
PouchDB.plugin(require('pouchdb-find'));
const path = require('path');

class TransacionController {
    constructor() {
        this.db = new PouchDB(path.resolve(__dirname, '../db/transactions'));
        this.statuses = ['awaiting for payment', 'payed', 'in progress', 'sent', 'closed', 'canseled']
    }

    getAll() {
        return this.db.allDocs({ include_docs: true });
    }
    getTransactionById(id) {
        return this.db.get(id)
    }
    //czy pobiera wszystkie??
    getStatusAll(status) {
        return this.db.find({ selector: { status: status } })
            .then(response => {
                if (response.docs.length !== 1) return null;
                return response
            }).catch(err => console.log(err))
    }
    add(data) {
        return this.db.post({ ...data })
    }
    update(transaction, change) {
        return this.db.put({ ...transaction, ...change })
    }
}



module.exports = TransacionController;