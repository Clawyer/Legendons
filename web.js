const express = require('express');
const cookieParser = require('cookie-parser')
const bodyParser = require('body-parser');
const {
    Client
} = require('pg');

const pgsql = new Client({
    connectionString: process.env.DATABASE_URL,
    ssl: {
        rejectUnauthorized: false
    }
});

pgsql.connect();

let cookies = new Map();

const app = express();

// CONFIGURATION ==================================
app.use(cookieParser());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({extended: true}));

app.set('view engine', 'pug');
app.set('views', 'views/')

// ROUTES =========================================

require('./app/webpages.js')(app, pgsql, __dirname, cookies);
require('./app/getAPI.js')(app, pgsql, __dirname, cookies);
require('./app/postAPI.js')(app, pgsql, __dirname, cookies);
require('./app/static.js')(app, __dirname);

// LAUNCH ========================================
app.listen(process.env.PORT, function () {
    console.log("Serveur démarré sur le port " + process.env.PORT);
});