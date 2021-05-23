let express = require('express');
let app = express();

app.use(express.static('public'));
/* public - имя папки со статикой. */

app.set('view engine', 'pug');

app.listen(3000, function() {
    console.log('нода работает на 3000');
});

app.get('/', function(req, res) {
    res.render('main', {
        foo: 4,
        bar: 7
    });
})