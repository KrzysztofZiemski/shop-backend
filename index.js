const express = require('express');
const path = require('path');
const cors = require('cors');
const AppRouters = require('./routers');
const bodyParser = require('body-parser');
const jsonParser = bodyParser.json();
require('dotenv').config();

class App {
    constructor() {
        this.httpApp = express();
        this.httpApp.use(cors());
        this.httpApp.use(express.static(path.join(__dirname, 'static')));
        this.httpApp.use(jsonParser)

        this.stratServer(process.env.PORT).then(() => {
            console.log(`server runned on port ${process.env.PORT}`);
        })

        this.httpApp.use('/server', new AppRouters().router);
    }

    stratServer(port) {
        return new Promise((resolve) => {
            this.httpApp.listen(port, () => {
                resolve();
            })
        });
    }
}

const app = new App();



