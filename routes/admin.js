// -*- tab-width: 2 -*-
var express = require('express')
var router = express.Router()

/* GET home page. */
router.get('/', function (req, res) {
  res.render('admin_home',{user: req.user})
})

router.get('/:competitionid', function (req, res) {
  res.render('competition_admin', {id : req.params.competitionid , user: req.user})
})

router.get('/:competitionid/teams', function (req, res) {
  res.render('team_admin', {id : req.params.competitionid , user: req.user})
})

router.get('/:competitionid/runs', function (req, res) {
  res.render('run_admin', {id : req.params.competitionid , user: req.user})
})

router.get('/:competitionid/rounds', function (req, res) {
  res.render('round_admin', {id : req.params.competitionid , user: req.user})
})

router.get('/:competitionid/fields', function (req, res) {
  res.render('field_admin', {id : req.params.competitionid , user: req.user})
})

module.exports = router
