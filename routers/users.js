const express = require('express');
const path = require('path');
const Users = require(path.resolve(__dirname, '../controllers/users.js'));
const AuthController = require(path.resolve(__dirname, '../controllers/authentication.js'));

class UsersRouter {
    constructor() {
        this.auth = new AuthController();
        this.router = express.Router();
        this.routes();
        this.users = new Users();
    }

    // /server/users
    routes() {
        this.router.get('/', this.auth.checkAdminToken, this._getAllUser.bind(this));
        this.router.get('/user', this.auth.checkUserToken, this._getUserByToken.bind(this));
        this.router.post('/', this._addUser.bind(this));
        this.router.put('/password', this.auth.checkAdminToken, this._changePassword.bind(this));
        this.router.put('/permission', this._addPermission.bind(this));
        this.router.delete('/:id', this.auth.checkAdminToken, this._deleteUser.bind(this));
        this.router.get('/:id', this.auth.checkAdminToken, this._getUser.bind(this));
        this.router.put('/basket', this.auth.checkUserToken, this._updateBasket.bind(this));
    }
    async _updateBasket(req, res) {
        try {
            const activeBasket = req.body;
            const user = await this.users.getUserById(req.token.sub);
            user.activeBasket = activeBasket;
            const response = await this.users.updateUser(user);
        } catch (e) {
            res.status(500);
        }
        res.status(200).send();
    }

    _addPermission(req, res) {
        //tutaj weryfikację i logi
        const { login, permission } = req.body
        this.users.addPermission(login, permission)
            .then(response => res.status(200).send(`permission is changed to ${permission}`))
            .catch(err => res.status(500).send('error during change permission'))
    }
    _getUser(req, res) {
        const login = req.body.login;
        this.users.getUser(login)
            .then(response => res.status(200).send(response))
            .catch(err => res.status(400).send('znaleziono więcej niż jednego użytkownika pasującego do podanych kryteriów'))
    }
    async _getUserByToken(req, res) {
        try {
            const token = req.token;
            const user = await this.users.getUserById(token.sub)
            const { login, mail, historyTransactions, activeBasket, _id, } = user;
            const responseData = {
                login,
                mail,
                activeBasket,
                _id,
                historyTransactions,
            }
            res.json(responseData);
        } catch (err) {
            console.log(err)
            res.status(500).json(err)
        }
    }

    _getAllUser(req, res) {
        this.users.getAllUser().then(response => {
            res.status(200).send(response)
        }).catch(err => {
            console.log('błąd pobrania użytkowników')
        })
    }
    _addUser(req, res) {
        const user = req.body;
        if (user.login === undefined || user.password === undefined || user.mail === undefined) return res.status(400).send('put required data');
        this.users.addUser(user)
            .then(result => {
                if (result === "exist") {
                    return res.status(400).json('Podany login już istnieje');
                }
                if (user.login === 'admin') this.users.addPermission(user.login, 'admin')//aby od razu admin stworzyło do testów
                res.status(200).json('Dokonano rejestracji, zapraszamy do zalogowania')
            })
            .catch(err => res.status(500).json(err));
    }
    _changePassword(req, res) {
        const { login, password } = req.body
        if (login === undefined || password === undefined) res.status(400).json('hasło nie zostało zmienione')
        try {
            this.users.changePassword(login, password)
                .then(response => res.status(200).json('hasło zmienione'))
                .catch(err => res.status(err.status).json('hasło nie zostało zmienione'))
        } catch (e) {
            res.status(e).json('hasło nie zostało zmienione')
        }
    }

    _deleteUser(req, res) {
        const id = req.params.id
        this.users.deleteUser(id).then(response => res.status(200).send('użytkownik usunięty'))
            .catch(err => res.status(err.status).send(err))
    }
}

module.exports = UsersRouter;