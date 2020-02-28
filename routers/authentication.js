const express = require('express');
const path = require('path');
const Users = require(path.resolve(__dirname, '../controllers/users.js'));
const AuthController = require(path.resolve(__dirname, '../controllers/authentication.js'));

const jwt = require('jsonwebtoken');


class AuthRouter {
    constructor() {
        this.router = express.Router();
        this.users = new Users();
        this.auth = new AuthController();
        this.routes();
    }
    // /server/auth
    routes() {
        this.router.post('/login', this.login.bind(this))
        this.router.put('/token', this.refreshToken.bind(this))
        this.router.post('/check', this.auth.checkAdminToken, this.checkPermission.bind(this))
    }


    checkPermission(req, res) {

        res.status(200).send('ok')
    }

    async refreshToken(req, res) {
        const refreshToken = req.body.refreshToken;

        if (!refreshToken) return res.status(401);
        const decoded = await jwt.verify(refreshToken, process.env.REFRESH_TOKEN_SECRET, (err, decoded) => {
            if (err) {
                res.status(403).json('unautorized');
                return false
            };
            return decoded;
        })
        if (!decoded) return
        try {

            const user = await this.users.getUserById(decoded.sub);
            const token = this.auth.generateTokens(user);
            res.json(token)
        } catch (e) {
            res.status(500).json('somethink problem, report a problem to us contact please')
        }
    }

    async login(req, res) {
        const response = await this.users.getUser(req.body.login);
        if (response === null) return res.status(401).json('błędny login lub hasło');
        if (response.docs.length !== 1 || req.body.password === undefined) res.json(401).send('błędne zapytanie do servera');
        const user = response.docs[0];
        const token = await this.auth.login(user, req.body.password);
        if (token === null) return res.status(401).json('błędny login lub hasło');
        res.json({ token, permission: user.permission });
    }

}

module.exports = AuthRouter;

