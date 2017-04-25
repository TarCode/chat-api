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
import cloudinary from 'cloudinary'
import multer from 'multer'
const upload = multer({ dest: 'uploads/' })

const parseString = xml2js.parseString

const app = express()

const server = require('http').Server(app);
const io = require('socket.io')(server);

let transporter = nodemailer.createTransport({
    host: 'smtp.mailgun.org',
    port: 587,
    auth: {
        user: 'testapi@react.technology',
        pass: 'ccCrkkfDmJVjBWLQ'
    }
})

cloudinary.config({
  cloud_name: 'codingtest',
  api_key: '341898513945715',
  api_secret: 'IRXRSWKMeA_gxBoN15O9rMw1omg'
})

app.use( cookieParser());
app.use( bodyParser.json());
app.use( bodyParser.urlencoded({
	extended: true
}))

app.use(cors({
    origin: (origin, cb) => {
      return cb(null, true) // always allow, compare http://stackoverflow.com/questions/29531521/req-headers-origin-is-undefined
    },
    // credentials: true,
    // allowedHeaders: [ 'Content-Type', 'Authorization' ]
  }))


io.of('/messages')
.on('connection', (socket) => {
   socket.on('send', () => {
     console.log('message received from client');
     socket.broadcast.emit('receive')
   })
 })

app.get('/', (req, res) => {
  res.send('Hello Logged in person')
})

app.post('/login', (req, res) => {
  FindMany('users', req.body)
  .then(result => {
    console.log('login result', result);
    if(result && result[0] && result[0].password === req.body.password) {
      console.log('successfully authorized');
      let dataToSend = result[0]
      delete dataToSend.password
      res.send(dataToSend)
    } else {
      console.log('unauthorized');
      res.send({ err: 'unauthorized' })
    }
  })
  .catch(err => {
    res.send(err)
  })
})

app.get('/messages/:groupId', (req, res) => {
  FindMany('messages', { groupId: req.params.groupId})
  .then((results) => (
    res.send(results)
  ))
  .catch(err => {
    res.send(err)
  })
})

app.post('/message', (req, res) => {
  Insert('messages', req.body)
  .then(result => {
    console.log('result from add group', result.ops[0]._id);
    const groupId = result.ops[0]._id
    res.send(result)
  })
  .catch(err => {
    res.send(err)
  })
})

app.post('/check-sentiment', (req, res) => {
  console.log('req body sentiment', req.body);
  request
  .post('http://sentiment.vivekn.com/api/text/')
  .set('Accept', 'application/json')
  .send("txt="+ req.body.txt)
  .end((err, result) => {
    if(err) {
      console.log('sentiment err', err);
      res.send(err)
    } else {
      res.send(result)
    }
  })
})

app.post('/set-password', (req, res) => {
  FindMany('users', { email: req.body.email })
  .then(result => {
    if(result.length === 0) {
      Insert('users', req.body)
      .then(insResult => {
        console.log('result from insert user', insResult);
        res.send(insResult)
      })
      .catch(err => {
        res.send(err)
      })
    } else {
      Update('users', { email: req.body.email }, { password: req.body.password })
      .then(updatePassResult => {
        delete updatePassResult.password;
        res.send(updatePassResult)
      })
      .catch(err => {
        res.send(err)
      })
    }
  })
})

app.post('/groups', (req, res) => {
  const { groupName, email, firstname, surname } = req.body
  const members = [{
    email,
    firstname,
    surname,
    isAdmin: true
  }]
  if(groupName && groupName.length > 0 && email && email.length > 0) {
    Insert('groups', { groupName, members: members })
    .then(result => {
      console.log('result from add group', result.ops[0]._id);
      const groupId = result.ops[0]._id
      res.send({groupId})
    })
  } else {
    res.send({ err: "Please enter a valid name" })
  }
})

app.post('/groups/update', (req, res) => {
  const { groupId, groupName, members } = req.body
  Update('groups', { _id: ObjectID(groupId)}, groupName, members)
  .then(result => {
    console.log('result from update group');
    res.send(result)
  })
  .catch(err => {
    res.send(err)
  })
})

app.post('/upload', upload.single('file'), (req, res) => {
  console.log('upload file', req.file.path);
  console.log('group name', req.body);
  const groupName = req.body.name
  cloudinary.uploader.upload(req.file.path, result => {
    console.log(result)
    Update('groups', { groupName }, { img_url: result.url})
    .then(updateRes => {
      res.send(updateRes)
    })
    .catch(err => {
      res.send(err)
    })
  })
})

app.get('/users', (req, res) => {
  request
  .get('https://testapi.react.technology/users/?email=tarcode33@gmail.com')
  .end((err, result) => {
    if(err) {
      res.send(err)
    }
    res.send(result)
  })
})

app.get('/groups', (req, res) => {
  FindMany('groups')
  .then((results) => (
    res.send(results)
  ))
  .catch(err => {
    res.send(err)
  })
})

app.get('/group/:groupId', (req, res) => {
  FindMany('groups', { _id: ObjectID(req.params.groupId)})
  .then((results) => (
    res.send(results)
  ))
  .catch(err => {
    res.send(err)
  })
})

// Serve the app/server on port 3000
server.listen(3000, () => {
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
          FindMany('users', { email: u.email })
          .then(result => {
            if(result && result[0].email) {
              console.log('successfully found');
            } else {
              Insert('users', u)
              .then(insResult => {
                console.log('result from insert user', insResult);
              })
              .catch(err => {
                console.log('error ', err);
              })
            }
          })

          let mailOptions = {
              from: '"Test Foo 👻" <testapi@react.technology>', // sender address
              to: u.email, // list of receivers
              subject: 'Set Password For Chat', // Subject line
              text: 'Set Password', // plain text body
              html: '<b><a href="http://localhost:8080/set-password?email=' + u.email + '">Set Password</a></b> to chat' // html body
          };
          console.log('found you!!!!!!')
          // transporter.sendMail(mailOptions, (error, info) => {
          //     if (error) {
          //         return console.log(error);
          //     }
          //     console.log('Message %s sent: %s', info.messageId, info.response);
          // })
        }
      })
    })
  })
  console.log('App listening on port 3000')
})
