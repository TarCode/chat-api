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

export const Insert = (collection, data) => {
  return mongo().then(db => {
    return new Promise((resolve, reject) => {
      db.collection(collection).insert(data, (err, docs) => {
        if (!err) {
          resolve(docs)
        }
        return reject(err);
      })
    })
  })
}

export const Update = (collection, query, args) => {
  return mongo().then(db => {
    return new Promise((resolve, reject) => {
      return db.collection(collection).findOneAndUpdate(query, { $set: args }, { returnOriginal: false })
      .then(({ value }) => resolve(value))
      .catch(error => reject(err))
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
