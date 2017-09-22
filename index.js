exports.handler = function (event, context, callback) {
  var t = process.hrtime();
  var request = require('request');
  var email = require('emailjs');
  var async = require('async');

  var server = email.server.connect({
    user: '',
    password: '',
    host: 'email-smtp.eu-west-1.amazonaws.com',
    ssl: true
  });

  var tasks = [];
  var count = 0;
  var goods = {
    'https://e-dostavka.by/catalog/item_632603.html': {name: 'Филе'},
    'https://e-dostavka.by/catalog/item_632605.html': {name: 'Филе малое'},
    'https://e-dostavka.by/catalog/item_632609.html': {name: 'Бедро'},
    'https://e-dostavka.by/catalog/item_632611.html': {name: 'Кусковое мясо бедра'},
    'https://e-dostavka.by/catalog/item_632614.html': {name: 'Голень'},
  };

  var generateFunction = function (k) {
    return function (cb) {
      console.log('Running task');
      request(k, function (error, response, body) {
        if (error) return cb(error, response);
        if (body.indexOf('Скоро в продаже') === -1) {
          count++;
          goods[k].online = true;
        }
        cb(null, goods[k]);
      });
    }
  };

  for (var k in goods) {
    tasks.push(generateFunction(k));
  }

  async.parallel(tasks, function (err, results) {
    if (err) return callback(err, results);
    if (count === 0) return callback(err, count);

    var text = '';
    for (var k in goods) {
      if (goods[k].online) {
        text += goods[k].name + ' доступно ' + k + "\n";
      }
    }

    server.send({
      text: text,
      from: '',
      to: '',
      subject: 'Доступные продукты'
    }, function (err, message) {
      console.log(t[0]);
      callback(err, message);
    });

    callback(null, text);
  });
};
