let express = require('express');
let app = express();

app.use(express.static('public'));
/* public - имя папки со статикой. */

app.set('view engine', 'pug');

let mysql = require('mysql');


let con = mysql.createConnection({
    host: 'localhost',
    user: 'root',
    password: 'altair01',
    database: 'darello_shop'
})

app.listen(3000, function() {
    console.log('нода работает на 3000');
});

app.get('/', function(req, res) {
    con.query(
        'SELECT * FROM goods',
        function(err, resu) {
            if (err) throw err;
            let goods = {};
            for (let i=0; i < resu.length; i++) {
                goods[resu[i]['id']] = resu[i];
            }
            res.render('main', {
                foo: 4,
                bar: 7,
                goods: JSON.parse(JSON.stringify(goods))
            });
        }
    );
})

app.get('/category', function (req, res) {
    let catId = req.query.id;
    let cat = new Promise(function (resolve, reject) {
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
    Promise.all([cat, goods]).then(function(value) {
        res.render('category', {
            cat: JSON.parse(JSON.stringify(value[0])),
            goods: JSON.parse(JSON.stringify(value[1]))
        });
    })
})