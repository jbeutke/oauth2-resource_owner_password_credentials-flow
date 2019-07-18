//Modules
const express = require('express'),
    bunyan = require('bunyan'),
    bodyParser = require('body-parser'),
    fetch = require("node-fetch"),
    querystring = require('querystring');

//Load values from .env file
require('dotenv').config();

const app = express();
const log = bunyan.createLogger({ name: 'Authorization Code Flow' });

app.use(express.static('public'));

// parse application/x-www-form-urlencoded
app.use(bodyParser.urlencoded({ extended: false }));

app.set('view engine', 'ejs');

app.get('/', (req, res) => {
    res.render('index');
});

//Step 1: Get the access token
app.get('/get/the/token', (req, res) => {

    const Token_Endpoint = `http://localhost:8080/v1/oauth/tokens`;
    const Grant_Type = 'password';
    const UserName = process.env.USERNAME;
    const Password = process.env.PASSWORD;
    const Scope = 'read';

    let body = `grant_type=${Grant_Type}&username=${UserName}&password=${Password}&scope=${encodeURIComponent(Scope)}`;

    log.info(`Endpoint: ${Token_Endpoint}`);

    log.info(`Body: ${body}`);

    fetch(Token_Endpoint, {
        method: 'POST',
        body: body,
        headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
            'Authorization': 'Basic ' + new Buffer(querystring.escape(process.env.CLIENT_ID) + ':' + querystring.escape(process.env.CLIENT_SECRET)).toString('base64')
        }
    }).then(async response => {

        let json = await response.json();
        res.render('access-token', { token: JSON.stringify(json, undefined, 2) }); //you shouldn't share the access token with the client-side

    }).catch(error => {
        log.error(error.message);
    });
});

//Step 2: Call the protected API
app.post('/call/protected/api', (req, res) => {

    let access_token = JSON.parse(req.body.token).access_token;

    const API_Host = 'http://localhost:9002';
    const API_Path = '/favorites';

    //Call the protected API with your access token
    fetch(`${API_Host}${API_Path}`, {
        headers: {
            'Authorization': `Bearer ${access_token}`
        }
    }).then(async response => {

        let json = await response.json();
        res.render('calling-protected-api', { response: JSON.stringify(json, undefined, 2) });
    });
});

app.listen(8000);
