import { mongo } from './db'

export const FindMany = (collection, query) => {
  return mongo().then(db => {
    return new Promise((resolve, reject) => {
      db.collection(collection).find(query).sort({createdAt: 1}).toArray((err, docs) => {
        if (err) return reject(err);
        resolve(docs)
      })
    })
  })
}

export const FindOrCreate = (collection, query) => {
  return mongo().then(db => {
    return new Promise((resolve, reject) => {
      db.collection(collection).findAndModify({
        query,
        update: {
          $setOnInsert: query
        },
        new: true,
        upsert: true
      })
    })
  })
}
