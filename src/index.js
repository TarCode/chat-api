import express from 'express'
import bodyParser from 'body-parser'
import cookieParser from 'cookie-parser'
import { FindMany, FindOrCreate } from './db-ops'
const ObjectID = require('mongodb').ObjectID
import session from 'express-session'
import ConnectMongo from 'connect-mongo'
import request from 'superagent'
import cors from 'cors'
const MongoStore = ConnectMongo(session)
import xml2js from 'xml2js'

const parseString = xml2js.parseString
// create an instance of an express server/app
const app = express()
app.use( cookieParser());
app.use( bodyParser.json());
app.use( bodyParser.urlencoded({
	extended: true
}));

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

app.get('/categories/:shopId', (req, res) => {
  FindMany('menuCategories', { shopId: ObjectID(req.params.shopId)})
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
      console.log('parsed xml', userJson);
    })

  })
  console.log('App listening on port 3000')
})
