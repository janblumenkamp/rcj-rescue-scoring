// -*- tab-width: 2 -*-
//========================================================================
//                          Libraries
//========================================================================

var env = require('node-env-file')
env('process.env')

var express = require('express')
var path = require('path')
var fs = require('fs')
var favicon = require('serve-favicon')
var logger = require('./config/logger').mainLogger
var cookieParser = require('cookie-parser')
var bodyParser = require('body-parser')
var async = require('async')

// db
var db = require('./config/db')
var mongoose = require('mongoose')

// auth
var pass = require('./config/pass')
var passport = require('passport')
// session
var session = require('express-session')
var connectMongo = require('connect-mongo')(session)

//========================================================================
//                          Routes require
//========================================================================

//========================================================================
//                          Static routes
//========================================================================

var homeRoute = require('./routes/home')
var loginRoute = require('./routes/login')
var adminRoute = require('./routes/admin')

//========================================================================
//                          Api routes
//========================================================================

var apiAuthRoute = require('./routes/api/auth')
var apiMapsRoutePublic = require('./routes/api/maps').public
var apiMapsRoutePrivate = require('./routes/api/maps').private
var apiMapsRouteAdmin = require('./routes/api/maps').admin
var apiTeamsRoutePublic = require('./routes/api/teams').public
var apiTeamsRoutePrivate = require('./routes/api/teams').private
var apiTeamsRouteAdmin = require('./routes/api/teams').admin
var apiCompetitionsRoutePublic = require('./routes/api/competitions').public
var apiCompetitionsRoutePrivate = require('./routes/api/competitions').private
var apiCompetitionsRouteAdmin = require('./routes/api/competitions').admin

//========================================================================
//                          Configuration
//========================================================================

var app = express()

/** Setting up the correct view engine - we are using jade */
app.set('views', path.join(__dirname, 'views'))
app.set('view engine', 'jade')

/*
 * Config
 */
// uncomment after placing your favicon in /public
//app.use(favicon(__dirname + '/public/favicon.ico'))
//app.use(logger('dev'))
app.use(bodyParser.json())
app.use(bodyParser.urlencoded({extended: false}))
app.use(cookieParser())
app.use(express.static(path.join(__dirname, 'public')))

/*
 * Session and passport for auth
 */
// init passport and session
app.use(session({
  store: new connectMongo({mongooseConnection: mongoose.connection}),
  secret: 'rcjscoring'
}))
app.use(passport.initialize())
app.use(passport.session())


//========================================================================
//                          Route configuration
//========================================================================

//========================================================================
//                          API Calls
//========================================================================

app.use('/api/auth', apiAuthRoute)
app.use('/api/maps', [apiMapsRoutePublic, pass.ensureLoginApi, apiMapsRoutePrivate, pass.ensureAdminApi, apiMapsRouteAdmin])
app.use('/api/teams', [apiTeamsRoutePublic, pass.ensureLoginApi, apiTeamsRoutePrivate, pass.ensureAdminApi, apiTeamsRouteAdmin])
app.use('/api/competitions', [apiCompetitionsRoutePublic, pass.ensureLoginApi, apiCompetitionsRoutePrivate, pass.ensureAdminApi, apiCompetitionsRouteAdmin])

//========================================================================
//                          Website static pages(ish)
//========================================================================

app.use('/login', pass.ensureNotAuthenticated, loginRoute)
app.use('/logout', pass.ensureAuthenticated, function (req, res, next) {
  req.logout()
  res.redirect('login')
})
app.use('/home', pass.ensureAuthenticated, homeRoute)

app.use('/admin', pass.ensureAdmin, adminRoute)

//========================================================================
//                          Custom routes
//========================================================================

//Simple logout (noting more neeeded)
app.get('/logout', function (req, res) {
  req.logout()
  res.redirect('/')
})

/*
 * This is called last in the routing config, therefor it'll take care of 404s
 */
app.use(function (req, res, next) {
  var err = new Error('Not Found')
  err.status = 404
  next(err)
})

//========================================================================
//                          Error handling
//========================================================================

app.use(function (err, req, res, next) {

  // is at base, send to login
  if (req.originalUrl === "/") {
    res.redirect("login")
  }

  /*
   *  Check if it is an api or static page miss (404)
   *
   * One of the big things to do for scalability is to separate tcp server,static server and application server (api).
   *
   * Right now they are mixed and running on a single core togeather. To be able to use Node.js to 100% the  application
   * part of the server should run alone on an own process. And the static files (CSS, HTML and Javascript(frontend)) should
   * for performance reasons not run on Node.js but on nginx (http://nginx.org/). One of the fastest static servers out there used
   * by many companies. Also it can work as a reverse proxy to support multi Node.js clusters.
   *
   */
  else {

    // since we are running api and static website on same we need to hack the different custom routes
    var stringSplit = req.originalUrl.split("/")
    res.status(err.status || 500)
    if (stringSplit[1] !== undefined && stringSplit[1] === "api") {
      res.send({error: "Error 404"})
    }

    else {

      // in in development show stacktrace
      if (app.get('env') === 'development') {
        res.render('error', {
          message: err.message,
          error: err
        })
      }

      // in production :(
      else {
        res.status(err.status || 500)
        res.render('error', {
          message: err.message,
          error: {}
        })
      }
    }
  }
})

module.exports = app
