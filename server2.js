import express from 'express';
import bodyParser from 'body-parser';
import cors from 'cors'; 
import bcrypt from'bcrypt';
import knex from 'knex';

const db = knex({
    client: 'pg',
    connection:{
        host: '127.0.0.1',
        // connectionString: process.env.DATABASE_URL,y
        user: 'postgres',
        password: '',
        database: 'great_brain',
        // ssl: true, 
    }

});

const app = express();
app.use(bodyParser.json());
app.use(cors());

app.get('/', (req, res) => {
     res.send('it is running fine') 
})

app.post('/signin', (req, res) => {
    const { email, password } = req.body;

    if (!email || !password) {
        return res.status(400).json('incorrect form submission');
      }
  db.select('email', 'hash').from('login')
    .where('email', '=', req.body.email)
    .then(data => {
const isValid = bcrypt.genSalt().then(salt => {
    // console.log(isValid);
   bcrypt.compare(req.body.password, data[0].hash); 
           
      if (isValid) {
          return  db.select('*').from('users').where('email', '=', req.body.email)
            .then(user => {
                console.log(user) 
                res.json(user[0])
            }).catch(err => res.status(400).json('unable to get user'))
        }
        else {
            res.status(400).json('wrong credential') 
        }
            }).catch(err => res.status(400).json('wrong credentials'))
        })
    })

app.post('/register', (req, res) => {
    const { email, name, password} = req.body;
    if (!email || !name || !password) {
        return res.status(400).json('incorrect form submission');
      }
   const saltRounds = 10;
var salt = bcrypt.genSaltSync(saltRounds);
var hash = bcrypt.hashSync(password, salt);
// Store hash in your password DB.
//    const hash = bcrypt.hashSync(password, saltRounds);

  db.transaction(trx => {
        trx.insert({
            hash: hash,
            email: email
        }).into('login')
        .returning('email')
        .then(loginEmail => {
            return trx('users')
            .returning('*')
            .insert({
                email: loginEmail[0].email,
                name: name,
                joined: new Date()
            })
            .then(user => {
                res.json(user[0])
            })
        }).then(trx.commit).catch(trx.rollback)
    })
    .catch(err => res.status(400).json('unable to register!'));
})

app.get('/profile/:id', (req, res) => {
    const {id} = req.params;
    // let found = false;
 db.select('*').from('users').where({id})
 .then(user => {
    // console.log(user)
    if (user.length) {
        res.json(user[0])
    }else {
        res.status(400).json('not found')
    }  
 })
 .catch(err =>res.status(400).json('erro getting user'))

})

app.put('/image', (req, res) => {
    
    const { id } = req.body;
    db('users').where('id', '=', id)
    .increment('entries', 1)
    .returning('entries')
    .then(entries => {
         res.json(entries[0].entries)
    }).catch(err =>res.status(400).json('unable to get entry'))
    
})


app.listen(process.env.PORT || 3000, () =>{
    console.log(`app is running on port 3000 ${process.env.PORT}`)
});
