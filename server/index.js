const express = require('express');
const app = express();
const path = require('path');
const sqlite = require('sqlite3').verbose();
const bodyParser = require('body-parser');
const bcrypt = require('bcrypt');
const { createBrotliCompress } = require('zlib');
const saltRounds = 10;
const jwt = require('jsonwebtoken');
const cookieParser = require('cookie-parser');


app.use(express.static(path.join(__dirname,'/build')));
app.use(bodyParser.urlencoded({extended: true}));
app.use(bodyParser.json());
app.use(cookieParser());


let db = new sqlite.Database('./Products.sqlite', (err) => {
    if(err) {
        console.error(err.message);
    } else {
        console.log("Connected to the Products database.");
    }
})

// app.get('/',(req, res) => {
//     res.sendFile(path.join(__dirname,'build/index.html'));
// })

app.post('/register',(req,res) => {
    const newUser = req.body;
    let Password = null;
    bcrypt.genSalt(saltRounds, (err,salt) => {
        if(err){ console.log(err.message);}

        bcrypt.hash(newUser.Password,salt,(err,hash) => {
            Password = hash;
            const query = `INSERT INTO Users (ID,Password) VALUES('${newUser.accountId}','${Password}')`;
            db.run(query,(err) => {
                if(err) {
                    return console.log(err.message);
                }

                console.log(`New user added: ${newUser.accountId}`);
            })
            res.json({success:true});
        })
    })
        
    
})

app.post('/login', (req,res) => {
    const accountId = req.body.accountId;
    const Password = req.body.Password;
    const query = `SELECT * FROM Users WHERE ID = '${accountId}' `;
    db.all(query,(err,row) => {
        console.log(row[0].ID);
        bcrypt.compare(Password,row[0].Password,(err,isMatch) => {
            if(err){
                console.log(err.message);
                res.json({success: false});
            }
            let token = jwt.sign(row[0].ID,'something');
            const query = `UPDATE Users SET Token = '${token}' WHERE ID = '${row[0].ID}'`;
            db.run(query,(err) => {
                res.cookie("x_auth",token).json({loginSuccess: true});
            })
            
        })
    })
})

app.get('/images/:imgsrc',(req, res) => {
    res.sendFile(path.join(__dirname,`images/${req.params.imgsrc}`));
})
app.get('/Products/images/:imgsrc',(req,res) => {
    res.sendFile(path.join(__dirname,`images/${req.params.imgsrc}`));
})
app.get('/Products/Details/:param1/:param2/:imgsrc', (req, res) => {
    res.sendFile(path.join(__dirname,`images/${req.params.imgsrc}`));
})

app.get('/api/goods/:category', (req,res) => {
    const query = `SELECT * FROM ${req.params.category}`;
    db.all(query, (err, row) => {
        res.json({data:row});
    })
})

app.get('/api/goods/:category/:name', (req,res) => {
    const query = `SELECT * FROM ${req.params.category} WHERE Name="${req.params.name}"`;
    db.all(query, (err,row) => {
        res.json({data:row});
    })
})

app.get('*',(req,res) => {
    res.sendFile(path.join(__dirname,'build/index.html'));
})

app.listen(80);