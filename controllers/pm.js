'use strict';

var mongoose = require('mongoose');
var _        = require('lodash');
var xss      = require('xss');

var PmRequestContainer = mongoose.model('PmRequestContainer');
var PmRequest = mongoose.model('PmRequest');

/**
 * Like dining, should only have one requestContainer object stored.
 */
function getPmRequests(req, res) {
  PmRequestContainer.findOne({}, function(err, pmRequests) {
    if (pmRequests) {
      res.status(200).json(pmRequests);
    } else {
      res.status(400).send(err);
    }
  });
}

function getMostRecentPmRequestContainer(req, res) {
  PmRequestContainer.find({}, function(err, pmRequestContainers) {
    if (pmRequestContainers.length == 0){
      pmRequestContainers.push(createNewRequestContainer());
    }
    var mostRecent = pmRequestContainers[0];
    _.forEach(pmRequestContainers, function(pmRequestContainer) {
      if (pmRequestContainer.date > mostRecent.date)
        mostRecent = pmRequestContainer;
    });
    return res.status(200).json(mostRecent);
  });
}

function createNewRequestContainer() {
  PmRequestContainer.find().remove().exec();
  var newContainer = new PmRequestContainer({date: new Date(), requests: []});
  newContainer.save();
  return newContainer
}

function addRequest(req, res){
  PmRequestContainer.findOne({}, function(err, pmRequests) {
    if (!pmRequests)
      res.status(400).send(NO_PM_REQUEST_CONTAINER_MSG);
    if (err) {
      res.status(400).send(err);
    }
    else {
      var author = xss(req.body.author),
          item   = xss(req.body.item),
          reason = xss(req.body.reason);

      if (!_.findWhere(pmRequests.requests, {author: author, item: item})) {
        var newReq = new PmRequest({author: author, item: item, reason: reason, date: new Date()});
        pmRequests.addRequest(newReq);
      }
      res.status(200).send();
    }
  });
}

function removeRequests(req, res){
  PmRequestContainer.findOne({}, function(err, pmRequestContainer) {
    if (!pmRequestContainer)
      res.status(400).send(NO_PM_REQUEST_CONTAINER_MSG);
    if (err)
      res.status(400).send(err);
    else {
      var pmRequests = JSON.parse(xss(req.query.pmRequests));
      pmRequestContainer.removeRequests(pmRequests);
    res.status(200).send();
    }
  }); // Double check status code is smart
}

module.exports.addRequest                      = addRequest;
module.exports.getMostRecentPmRequestContainer = getMostRecentPmRequestContainer;
module.exports.removeRequests                  = removeRequests;