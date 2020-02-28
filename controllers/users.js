const PouchDB = require('pouchdb');
PouchDB.plugin(require('pouchdb-find'));
const path = require('path');
const bcrypt = require('bcryptjs');
const Validate = require(path.resolve(__dirname, './modelsDB.js'));


class Users {
    constructor() {
        this.db = new PouchDB(path.resolve(__dirname, '../db/users'));
        this.validate = new Validate();

    }

    getAllUser() {
        return this.db.allDocs({ include_docs: true })
    }
    getUserById(id) {
        return this.db.get(id)
    }
    getUser(login) {
        return this.db.find({ selector: { login } })
            .then(response => {
                if (response.docs.length !== 1) return null;
                return response
            }).catch(err => console.log(err))
    }

    async addUser(user) {
        const isExist = await this._isExist(user.login)
        if (isExist) {
            return new Promise('exist')
        }

        user.password = await bcrypt.hashSync(user.password, Number(process.env.HASH_ROUND));
        const userValidated = await this.validate.validateUser(user);
        //TODO add for easier tests - to removing
        if (user.login === 'admin') userValidated.permission = "admin";
        return this.db.post({ ...userValidated })
    }

    async addPermission(login, permission) {
        const responseUser = await this.getUser(login);
        const user = responseUser.docs[0]
        return this.db.put({ ...user, permission })

    }
    //do wykasowania? może zastąpić updateUser
    async changePassword(login, newPassword) {
        const response = await this.db.find({ selector: { login } });
        if (response.docs.length !== 1) {
            throw Error('znaleziono więcej niż jednego użytkownika o podanych kryteriach');
        }
        const user = response.docs[0];
        const password = await bcrypt.hashSync(newPassword, Number(process.env.HASH_ROUND));
        return this.db.put({ ...user, password });
    }

    // async updateUser(user, property) {
    //     return this.db.put({ ...user, ...property })
    // }

    updateUser(newUser) {
        return this.db.put(newUser)
    }
    async addUserTransaction(newUser) {
        return this.db.put(newUser)

    }
    deleteUser(id) {
        return this.db.get(id)
            .then(user => this.db.remove(user))
    }


    _isExist(login) {

        return this.db.find({ selector: { login }, fields: ['_id'], })
            .then(response => {
                if (response.docs.length !== 0) return true;
                return false;
            })
            .catch(err => new Error(err))
    }
}


module.exports = Users;