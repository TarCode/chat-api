import express from 'express'
import bodyParser from 'body-parser'
import cookieParser from 'cookie-parser'
import { FindMany, FindOrCreate, Insert, Update } from './db-ops'
const ObjectID = require('mongodb').ObjectID
import session from 'express-session'
import ConnectMongo from 'connect-mongo'
import request from 'superagent'
import cors from 'cors'
const MongoStore = ConnectMongo(session)
import xml2js from 'xml2js'
import nodemailer from 'nodemailer'
const parseString = xml2js.parseString
// create an instance of an express server/app
const app = express()
app.use( cookieParser());
app.use( bodyParser.json());
app.use( bodyParser.urlencoded({
	extended: true
}));

// create reusable transporter object using the default SMTP transport
let transporter = nodemailer.createTransport({
    host: 'smtp.mailgun.org',
    port: 587,
    auth: {
        user: 'testapi@react.technology',
        pass: 'ccCrkkfDmJVjBWLQ'
    }
});


app.use(cors({
    origin: (origin, cb) => {
      return cb(null, true) // always allow, compare http://stackoverflow.com/questions/29531521/req-headers-origin-is-undefined
    },
    // credentials: true,
    // allowedHeaders: [ 'Content-Type', 'Authorization' ]
  }))

app.get('/', (req, res) => {
  res.send('Hello Logged in person')
})

app.post('/login', (req, res) => {
  FindMany('users', req.body)
  .then(result => {
    console.log('login result', result);
    if(result && result[0] && result[0].password === req.body.password) {
      console.log('successfully authorized');
      res.send({user: req.body.email})
    } else {
      console.log('unauthorized');
    }
  })
})

app.post('/set-password', (req, res) => {
  console.log('Password received', req.body);
  FindMany('users', { email: req.body.email })
  .then(result => {
    console.log('result from finding email for pass', result);
    if(result.length === 0) {
      Insert('users', req.body)
      .then(insResult => {
        console.log('result from insert user', insResult);
      })
    } else {
      Update('users', { email: req.body.email }, { password: req.body.password })
      .then(updatePassResult => {
        console.log('updatePassResult', updatePassResult);
      })
    }
  })
})

app.get('/users', (req, res) => {
  request
  .get('https://testapi.react.technology/users/?email=tarcode33@gmail.com')
  .end((err, result) => {
    res.send(result)
  })

  // FindMany('shops')
  // .then((results) => (
  //   res.send(results)
  // ))
})

app.get('/groups/:groupId', (req, res) => {
  FindMany('groups', { _id: ObjectID(req.params.groupId)})
  .then((results) => (
    res.send(results)
  ))
})

app.get('/items/:catId', (req, res) => {
  FindMany('menuItems', { menuCategoryId: ObjectID(req.params.catId)})
  .then((results) => (
    res.send(results)
  ))
})

// Serve the app/server on port 3000
app.listen(3000, () => {
  request
  .get('https://testapi.react.technology/users/?email=tarcode33@gmail.com')
  .end((err, result) => {
    var userdata = result.text
    var users = userdata
    parseString(users, (err, parsed) => {
      const userJson = parsed.Users.User.map(i => ({
        firstname: i.Name[0],
        surname: i.Surname[0],
        email: i.Email[0]
      }))
      // console.log('parsed xml', userJson);

      userJson && userJson.map(u => {
        if(u.email === 'tarcode33@gmail.com') {
          let mailOptions = {
              from: '"Test Foo 👻" <testapi@react.technology>', // sender address
              to: u.email, // list of receivers
              subject: 'Set Password For Chat', // Subject line
              text: 'Set Password', // plain text body
              html: '<b><a href="http://localhost:8080/set-password?email=' + u.email + '">Set Password</a></b> to chat' // html body
          };
          console.log('found you!!!!!!')
          transporter.sendMail(mailOptions, (error, info) => {
              if (error) {
                  return console.log(error);
              }
              console.log('Message %s sent: %s', info.messageId, info.response);
          })
        }
      })
    })

  })
  console.log('App listening on port 3000')
})
