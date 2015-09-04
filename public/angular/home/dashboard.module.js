angular.module('tripleT.dashboard', ['ngResource', 'ngRoute'])
.config(function($routeProvider) {
  $routeProvider.when('/', {
    templateUrl: '/angular/home/dashboard.html',
    controller: 'HomeCtrl'
  });
})

.controller('HomeCtrl',
  function($scope, $location, $http, $timeout, Elections, Dining, Pm, AuthService, dateFilter) {
    // ELECTION
    Elections.query({}, function(elections) {
      $scope.elections = _.takeRight(elections,10);
    }, function(err) {
      console.log(err);
    });

    $scope.redirect = function(route) {
      $location.path(route);
    }

    $scope.getWinner = function(election) {
      $http.get('/voting/' + election._id + '/results')
      .success(function(winner) {
        election.winner = winner;
        election.show = true;
      })
      .error(function(err) {
        console.log(err);
      })
    }

    /**
     * DINING
     */

    // set variables
    $scope.daysOfWeek = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday"];
    $scope.abbrevDOW = ["Sun", "Mon", "Tues", "Wed", "Thurs"];
    $scope.diningEditMode = false;
    var diningID;

    // get current dining week ID
    Dining.get({diningID: ''}, function(week) {
      diningID = week._id;
    }, function() {
      // create a new dining week
      Dining.save({diningID: ''}, {}, function(week) {
        diningID = week._id;
      });
    });

    // set dining week
    $scope.hasLatePlate = {};
    Dining.get({diningID: diningID}, function(week) {
      $scope.diningWeek = {};
      _.forEach($scope.daysOfWeek, function(day) {
        $scope.diningWeek[day] = week[day];
      });

      _.forEach($scope.diningWeek, function(dayInfo, dayofweek) {
        $scope.hasLatePlate[dayofweek] =
          _.includes(dayInfo.latePlates, AuthService.user.kerberos);
      });
    }, function(err) {
      console.log(err);
    });

    // set the active tab to the current day
    var day = new Date();
    $scope.currentDayOfWeek = dateFilter(day, 'EEEE');
    // if current day is not a school night, display Sunday's menu
    if ( !_.includes($scope.daysOfWeek, $scope.currentDayOfWeek) ) {
      $scope.currentDayOfWeek = "Sunday";
    }

    $scope.toggleEditMode = function() {
      $scope.diningEditMode = !$scope.diningEditMode;
    }

    $scope.submitDiningMenu = function() {
      Dining.update({diningID: diningID}, {updatedWeek: $scope.diningWeek},
        function(week) {
          console.log(week);
          $scope.diningWeek = week;
          $scope.toggleEditMode();
        });
    }

    $scope.clearLatePlates = function() {
      _.forEach($scope.diningWeek, function(dayInfo, dayofweek) {
        $scope.diningWeek[dayofweek].latePlates = [];
      })
    }

    $scope.addLatePlate = function(dayofweek) {
      $http.put('/dining/' + diningID + '/latePlate/add',
        { dayofweek: dayofweek })
        .success(function(week) {
          $scope.diningWeek[dayofweek].latePlates.push(AuthService.user.kerberos);
          $scope.hasLatePlate[dayofweek] = true;
        })
        .error(function(err) {
          console.error(err);
        })
    }

    $scope.removeLatePlate = function(dayofweek) {
      $http.put('/dining/' + diningID + '/latePlate/remove',
        { dayofweek: dayofweek })
        .success(function(week) {
          _.pull($scope.diningWeek[dayofweek].latePlates, AuthService.user.kerberos);
          $scope.hasLatePlate[dayofweek] = false;
        })
        .error(function(err) {
          console.error(err);
        })
    }

    // PM REQUESTS
    var pmReqID;
    $http.get('/pm').success(function(pmReqID) {
        pmReqID = pmReqID._id;
        console.log('got the id!!');
    });

  //   var pmRequests = {};
  //   Pm.get({pmID: pmID}, function(requests) {
  //     pmRequests = requests;
  //   });

    Pm.get({}, function(pmRequests) {
      $scope.pmRequests = pmRequests.requests;
      console.log($scope.pmRequests);
    });

    $scope.makeRequest = function(pmRequest) {
      var newReq = {
        author: $scope.currentUser.name,
        item: pmRequest.item,
        reason: pmRequest.reason,
      }
      Pm.save(newReq, function(res){
        $scope.pmRequests.push(newReq);
        console.log(res);
      });
    }

   })

.factory('Dining', function($resource) {
  return $resource('dining/:diningID', null,
    {
      'update': {method: 'PUT'}
    });
})

.factory('Pm', function($resource) {
  return $resource('pm/', null);
})