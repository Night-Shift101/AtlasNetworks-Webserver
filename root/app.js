const express = require('express');
const path = require('path');

const rootApp = express();

// configure rootApp however you like:
rootApp.use(express.static(path.join(__dirname, 'public_root')));
rootApp.set('views', path.join(__dirname, '/views'));
rootApp.set('view engine', 'ejs');
rootApp.get('/', (req, res) => {
  res.render('home');
});

module.exports = { app: rootApp };
