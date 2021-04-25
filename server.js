const express = require('express')
const app = express()
const cors = require('cors')
const mongoose = require('mongoose');
const {Schema} = mongoose;
const bodyParser = require('body-parser');
require('dotenv').config()

mongoose.connect(process.env.MONGO_URI, { useNewUrlParser: true, useUnifiedTopology: true });

const userSchema = new Schema ({
  username: String,
  log: [{"description": String, "duration": Number, "date": Date}]
})

const User = mongoose.model("User", userSchema);

app.use(cors())
app.use(express.static('public'))
app.get('/', (req, res) => {
  res.sendFile(__dirname + '/views/index.html')
});

const listener = app.listen(process.env.PORT || 3000, () => {
  console.log('Your app is listening on port ' + listener.address().port)
})

// deletes all previously created users for testing
User.remove().exec()

// creates a new user
app.use("/api/users", bodyParser.urlencoded({extended: false}))

app.post("/api/users", (req, res, done) => {
  let userName = req.body.username
  
  let newUser = new User({
    username: userName
  })
  console.log(newUser._id)

  newUser.save((err, data) => {
    if (err) {
      return console.log(err)
    } else {
      done(null, data)
    }
  })

  res.json({
    "username": newUser.username, 
    "_id": newUser._id
  })
})

// requests all existing users
app.get("/api/users", (req, res, done) => {
  User.find(null, "_id username", (err, data) => {
    if (err) {
      return console.log(err)
    } else {
      console.log(data)
      res.send(data)
      done(null, data)
    }
  })
})

// add exercises
app.use("/api/users/:_id/exercises", bodyParser.urlencoded({extended: false}))

app.post("/api/users/:_id/exercises", (req, res, done) => {
  User.findById(req.params._id, (err, data) => {
    if (err) {
      return console.log(error)
    } else {
      let description = req.body.description
      let duration = parseInt(req.body.duration)
      let date

      if (req.body.date == undefined) {
        let now = new Date()
        date = now.toDateString()
      } else {
        date = new Date(req.body.date).toDateString()
      }

      data.log.push({"description": description, "duration": duration, "date": date})

      data.save((err) => {
        if (err) {
          return console.log(error)
        }
      })

      res.send({
        "username": data.username,
        "_id": data._id,
        "description": description,
        "duration": duration,
        "date": date
      })
      done(null, data)
    }
  })
})

// request user logs
app.use("/api/users/:_id/logs", bodyParser.urlencoded({extended: false}))

app.get("/api/users/:_id/logs", (req, res, done) => {
  User.findById(req.params._id, (err, data) => {
    if (err) {
      return console.log(error)
    } else {
      let log

      // checks if queries are present
      if (req.query.from == undefined || req.query.to == undefined) {
        log = data.log
        // checks for limit query
        if (req.query.limit != undefined) {
          log = log.slice(0, req.query.limit)
        }
      } else {
        // creates variables that store to and from queries as a Date object
        let fromQuery = new Date(req.query.from)
        let toQuery = new Date(req.query.to)
        // filters through log array and removes dates out of range
        log = data.log
        .filter((item) => {
          if (item.date >= fromQuery && item.date <= toQuery) {
            return true
          } else {
            return false
          }
        })

        if (req.query.limit != undefined) {
          log = log.slice(0, req.query.limit)
        }
      }

      res.send({
        "username": data.username,
        "_id": data._id,
        "count": data.log.length,
        "log": log
      })
    done(null, data)
    }
  })
})