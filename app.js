let express = require('express');
let app = express();

app.use(express.static('public'));

app.set('view engine', 'pug');

let mysql = require('mysql');

app.use(express.json());

const nodemailer = require('nodemailer');

let con = mysql.createConnection({
    host: 'localhost',
    user: 'root',
    password: 'altair01',
    database: 'darello'
})

app.listen(3000, function() {
    console.log('нода работает на 3000');
});

app.get('/', function(req, res) {
    let category = new Promise(function(resolve, reject) {
        con.query(
            "select id, name, cost, image, category from (select id, name, cost, image, category, if(if(@curr_category != category, @curr_category := category, '') != '', @k := 0, @k := @k + 1) as ind from goods, (select @curr_category := '') v) goods where ind < 3",
            function (error, result, field) {
                if (error) return reject(error);
                resolve(result);
            }
        )
    })
    let categoryDescription = new Promise(function(resolve, reject) {
        con.query(
            "SELECT * FROM category",
            function (error, result, field) {
                if (error) return reject(error);
                resolve(result);
            }
        )
    })
    Promise.all([category, categoryDescription]).then(function (value) {
        res.render('index', {
            goods: JSON.parse(JSON.stringify(value[0])),
            cat: JSON.parse(JSON.stringify(value[1]))
        })
    })
})

app.get('/category', function (req, res) {
    let catId = req.query.id;
    let category = new Promise(function (resolve, reject) {
        con.query(
            'SELECT * FROM category WHERE id=' + catId,
            function(error, result) {
                if (error) reject(error);
                resolve(result);
            }
        )
    })
    let goods = new Promise(function (resolve, reject) {
        con.query(
            'SELECT * FROM goods WHERE category=' + catId,
            function(error, result) {
                if (error) reject(error);
                resolve(result);
            }
        )
    })
    Promise.all([category, goods]).then(function(value) {
        res.render('category', {
            category: JSON.parse(JSON.stringify(value[0])),
            goods: JSON.parse(JSON.stringify(value[1]))
        });
    });
});

app.get('/goods', function(req, res) {
    con.query('SELECT * FROM goods WHERE id=' + req.query.id, function(error, result, fields) {
        if (error) throw error;
        res.render('goods', {goods: JSON.parse(JSON.stringify(result))});
    })
})

app.get('/constructor', function(req, res) {
    let category = new Promise(function(resolve, reject) {
        con.query(
            "SELECT * FROM goods",
            function (error, result, field) {
                if (error) return reject(error);
                resolve(result);
            }
        )
    })
    Promise.all([category]).then(function (value) {
        res.render('constructor', {
            goods: JSON.parse(JSON.stringify(value[0]))
        })
    })
})

app.get('/order', function(req, res) {
        res.render('order');
})

app.post('/get-category-list', function (req, res){
    con.query('SELECT id, category FROM category', function(error, result, fields) {
        if (error) throw error;
        res.json(result);
    })
})

app.post('/get-goods-info', function (req, res){
    if (req.body.key.length != 0) {
        con.query('SELECT id,name,cost FROM goods WHERE id IN ('+req.body.key.join(',')+')', function (error, result, fields) {
            if (error) throw error;
            let goods = {};
            for (let i = 0; i < result.length; i++) {
                goods[result[i]['id']] = result[i];
            }
            res.json(goods);
        })
    } else {
        res.send('0');
    }
})

app.post('/finish-order', function (req, res) {
  if (req.body.key.length != 0) {
    let key = Object.keys(req.body.key);
    con.query(
      'SELECT id,name,cost FROM goods WHERE id IN (' + key.join(',') + ')',
      function (error, result, fields) {
        if (error) throw error;
        sendMail(req.body, result).catch(console.error);
        res.send('1');
      });
  }
  else {
    res.send('0');
  }
});


async function sendMail(data, result) {
  let res = '<h2>Order in lite shop</h2>';
  let total = 0;
  for (let i = 0; i < result.length; i++) {
    res += `<p>${result[i]['name']} - ${data.key[result[i]['id']]} - ${result[i]['cost'] * data.key[result[i]['id']]} uah</p>`;
    total += result[i]['cost'] * data.key[result[i]['id']];
  }
  res += '<hr>';
  res += `Total ${total} rub`;
  res += `<hr>Phone: ${data.phone}`;
  res += `<hr>Username: ${data.username}`;
  res += `<hr>Wishes: ${data.address}`;
  res += `<hr>Email: ${data.email}`;

  let testAccount = await nodemailer.createTestAccount();

  let transporter = nodemailer.createTransport({
    host: "smtp.ethereal.email",
    port: 587,
    secure: false, // true for 465, false for other ports
    auth: {
      user: testAccount.user, // generated ethereal user
      pass: testAccount.pass // generated ethereal password
    }
  });

  let mailOption = {
    from: '<skywalkeraltair@gmail.com>',
    to: "skywalkeraltair@gmail.com," + data.email,
    subject: "Darello shop order",
    text: 'Order has passed',
    html: res
  };

  let info = await transporter.sendMail(mailOption);
  console.log("MessageSent: %s", info.messageId);
  console.log("PreviewSent: %s", nodemailer.getTestMessageUrl(info));
  return true;
}