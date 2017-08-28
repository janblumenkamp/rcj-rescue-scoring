"use strict"
const NAME = "Line"
module.exports.NAME = NAME

const mongoose = require('mongoose')
const timestamps = require('mongoose-timestamp')
const validator = require('validator')
const Schema = mongoose.Schema
const ObjectId = Schema.Types.ObjectId
const async = require('async')

const competitiondb = require('./competition')
const rundb = require('./run')
const lineMapdb = require('./lineMap')

const logger = require('../config/logger').mainLogger


const lineRunSchema = new Schema({
  map: {type: ObjectId, ref: 'LineMap', required: true, index: true},
  
  tiles             : [{
    isDropTile: {type: Boolean, default: false},
    scored    : {type: Boolean, default: false}
  }],
  evacuationLevel   : {
    type: Number, default: 1, validate: function (l) {
      return l == 1 || l == 2
    }
  },
  exitBonus         : {type: Boolean, default: false},
  rescuedLiveVictims: {type: Number, min: 0, default: 0},
  rescuedDeadVictims: {type: Number, min: 0, default: 0}
})

lineRunSchema.pre('save', function (next) {
  const self = this
  
  self.populate('map', "name finished", function (err, populatedRun) {
    if (err) {
      return next(err)
    } else if (!populatedRun.map.finished) {
      err = new Error('Map "' + populatedRun.map.name + '" is not finished!')
      return next(err)
    } else {
      
      if (self.isNew) {
        // Check that all references matches
        lineMapdb.lineMap.findById(self.map, function (err, dbMap) {
          if (err) {
            return next(err)
          } else if (!dbMap) {
            return next(new Error("No map with that id!"))
          } else {
            if (dbMap.competition.toString() != self.competition) {
              return next(new Error("Map does not match competition!"))
            } else {
              self.LoPs = new Array(dbMap.numberOfDropTiles).fill(0)
              self.tiles = new Array(dbMap.indexCount).fill({})
              return next()
            }
          }
        })
      } else {
        return next()
      }
    }
  })
})

const LineRun = rundb.run.discriminator(NAME, lineRunSchema, rundb.options)

/** Mongoose model {@link http://mongoosejs.com/docs/models.html} */
module.exports.lineRun = LineRun
