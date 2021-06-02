const functions = require('firebase-functions')
const express = require('express')
const expressLayouts = require('express-ejs-layouts')
const engines = require('consolidate')
const path = require('path')
const favicon = require('serve-favicon')
const cookieParser = require('cookie-parser')
const csrf = require('csurf')
const bodyParser = require('body-parser')
const cors = require('cors')
const firebase = require("firebase")
// const cookieSession = require('cookie-session')
const { setEnvironment } = require('./config/var')

const app = express()

app.use(cors({ origin:true }))

const admin = require("firebase-admin")
const serviceAccount = require("./config/exhct2004-firebase-adminsdk.json")

firebase.initializeApp({
    apiKey: "AIzaSyCsnmzIFaMRMNNuAPDrbAwDkWOkpuUT5no",
    authDomain: "exhct2004.firebaseapp.com",
    databaseURL: "https://exhct2004.firebaseio.com",
    projectId: "exhct2004",
    storageBucket: "exhct2004.appspot.com",
    messagingSenderId: "1077932241776",
    appId: "1:1077932241776:web:a77060932c8b12b73055b5",
    measurementId: "G-7WCNC0TMEM"
  })
  
admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
    databaseURL: "https://exhct2004.firebaseio.com"
 })

//firebase.analytics()
//set up views
app.use(expressLayouts)

// View Engine
app.engine('ejs', engines.ejs)
app.set('views', path.join(__dirname, 'views'))
app.set('view engine', 'ejs')
//app.use(express.static("./public"))
app.use(express.static(path.join(__dirname, 'public')))
//set favicon
//app.use(favicon(path.join(__dirname, 'public', 'favicon.ico')))
app.use(favicon("./public/favicon.ico"))
//the order here is very important
const csrfProtection = csrf({ cookie:true })

app.use(bodyParser.urlencoded({ extended: false }))
app.use(bodyParser.json())
app.use(cookieParser())

// app.use(csrfProtection)

//set the environment variables
setEnvironment()   

app.all( "*", async( req, res, next ) => {

    //set conditionals for navbar header   
    res.locals.admin = false
    res.locals.lead = false

    next()   
})  

//resource for commenting format - https://jsdoc.app/tags-param.html
// app.use(cookieSession({name: 'session', keys: ['key1']}))
// console.log('Before routes...')
app.use('/', require('./routes/site'))
app.use('/admin', require('./routes/admin'))
app.use('/auth', require('./routes/auth'))
app.use('/courses', require('./routes/course'))
app.use('/job', require('./routes/job'))
app.use('/students', require('./routes/student'))

//Get user info and set csurf cooke
const scheduler = require('./scheduler')

scheduler.alertDaily()
scheduler.alertWeekly()
//this is to alert employers about upcoming courses
//sends first and third Mondays of the month
scheduler.firstAndThirdMondayEmails()
//this is to alert employers to post job openings
//sends second and fourth Mondays of the month
scheduler.secondAndFourthMondayEmails()


exports.app = functions.https.onRequest(app)