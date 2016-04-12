angular.module("TeamAdmin", []).controller("TeamAdminController", function ($scope, $http) {

  updateTeamList()

  $http.get("/api/teams/leagues").then(function(response) {
    $scope.leagues = response.data
    console.log($scope.leagues)
  })

  $scope.addTeam = function() {
    var team = {name : $scope.teamName, league : $scope.teamLeague}

    $http.post("/api/teams/createteam", team).then(function (response) {
      console.log(response)
      updateTeamList()
    }, function (error) {
      console.log(error)
    })
  }

  $scope.removeTeam = function(team) {
    if (confirm("Are you sure you want to remove the team: " + team.name + '?')) {
      $http.get("/api/teams/" + team._id + "/delete").then(function (response) {
        console.log(response)
        updateTeamList()
      }, function (error) {
        console.log(error)
      })
    }
  }

  function updateTeamList() {
    $http.get("/api/teams").then(function(response) {
      $scope.teams = response.data
      console.log($scope.teams)
    })
  }
})