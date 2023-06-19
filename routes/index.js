var express = require('express');
var router = express.Router();
const path = require('path');

/* Get home page. */
router.get('/connectfour', function(req, res) {
  res.sendFile(path.join(__dirname, '../public/index.html'));
});

module.exports = router;
