import { MongoClient } from 'mongodb'

let db

const waiting = []

export const mongo = () => {
  if (db) {
    return Promise.resolve(db)
  } else {
    if (!waiting.length) {
      const url = process.env.MONGO_URL || 'mongodb://localhost/chat-dev'
      MongoClient.connect(url, (err, database) => {
        if (err) return console.log('error while connecting to ' + url, err);
        db = database
        waiting.forEach(w => w(db))
        waiting.length = 0
      })
    }
    const p = new Promise((resolve, reject) => {
      waiting.push(resolve)
    })
    return p
  }
}
