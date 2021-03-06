angular.module('starter.services', [])
.service('LoginService', function($q, $http, $state) {
    var service = {
        login: login,
        isLogged : isLogged
    },
    authenticated = false;

    function login(username, password) {
        $http({
            method: 'GET',
            url: 'http://52.24.232.201/gone-wildr/auth/login.php?username='+username+'&password='+password,
            headers: {'Content-Type': 'application/x-www-form-urlencoded'}
        })
        .success(function(response){
            console.log('trying to login!')
            if (response.data) {
                console.log('SERVER RESPONSE:',response.data)
                $state.go('tab.home')
            }
        })
        .error(function(response){
            console.log(response.data.message);
        })
    }

    function isLogged() {
        return authenticated;
    }
    return service;
})

.service('Geolocation', ["$cordovaGeolocation", "$q", "$geofire", "$rootScope", function($cordovaGeolocation, $q, $geofire, $rootScope){
  
  var $geo = $geofire(new Firebase('https://gonewildr.firebaseio.com/members_location'));
  

  var storedCoordinates = [];
  var storedMembersCoordinates = [];
  var watch;
  var gotLocated = false;
   var deferredGetStored = $q.defer();
  function get(){
       var defer = $q.defer();
       $cordovaGeolocation.getCurrentPosition({timeout: 1000, maximumAge: 9000, enableHighAccuracy: true})
         .then(function(success){
           defer.resolve(success.coords);

           storedCoordinates = [success.coords.latitude, success.coords.longitude];
           deferredGetStored.resolve(storedCoordinates);

           gotLocated = true;
         }, function(fail){
             defer.reject(fail);
         });
       return defer.promise;
   }
  function getUpdatedPosition(){
     watch = $cordovaGeolocation.watchPosition({timeout: 1001, maximumAge: 9000, enableHighAccuracy: true}); 
      return watch; 
  }

  function pushLocationToDB(){
    console.log("pushong to firebase", storedCoordinates);
    // "da_video_live" will be replaced with the name of the authenticated user....
    $geo.$set("da_video_live", storedCoordinates)
      .catch(function(err) {
          $log.error(err);
      });
  }

  function clearWatch(){
    // this may not work if called, that's life....
    $cordovaGeolocation.clearWatch(watch);
  }

 
  function getStored(){
    return deferredGetStored.promise; //storedCoordinates;
  }

  function setEventForNearbyUsers(coords, r){
    // set a query to retrieve users whose location is close to the current one, which is the one of the authenticated user....
      var query = $geo.$query({
        center: coords, 
        radius: r
      });
      // this will broadcast an event whenever a new user is added into the db AND is close to me (the user of the app)
      var geoQueryCallback = query.on("key_entered", "SEARCH:KEY_ENTERED");

  }

  function getListOfCloseMembers(){
    return storedMembersCoordinates;
  }

    // $rootScope.$on("SEARCH:KEY_ENTERED", function (event, key, location, distance) {
    //     // Do something interesting with object
    //     storedMembersCoordinates.push({name: key, location: location, distance: Math.floor(distance)});
    //     console.log("ok, from service setEventForUsers");
    //     // $scope.nearbyUsers.push({name: key, location: location, distance: distance});
    //     // console.log(key, location, distance)
    // });

  function setTestMoreUsers(){
    // thsi function is just to create random user with semi-random coordinates, so that we can test realtime updates on the list of users... it works...
    var newUserName = "";
    var possible = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";

    for( var i=0; i < 5; i++ ){
      newUserName += possible.charAt(Math.floor(Math.random() * possible.length));
    }
    var lat = Math.random()+storedCoordinates[0]-Math.random();
    var lon = Math.random()+storedCoordinates[1]-Math.random();
     
      $geo.$set(newUserName, [lat, lon])
        .catch(function(err) {
            $log.error(err);
        });
  }

  return {
    get: get,
    getUpdatedPosition: getUpdatedPosition,
    pushLocationToDB: pushLocationToDB, 
    clearWatch: clearWatch,
    getStored: getStored,
    setEventForNearbyUsers: setEventForNearbyUsers,
    setTestMoreUsers: setTestMoreUsers, 
    getListOfCloseMembers: getListOfCloseMembers   
  }

}])

.service("GoWilderPost", function($http, $q){

  var latesGonewilderURL = "http://www.reddit.com/r/gonewild/new.json";
    return {
      getLatest: function(){
        var latestPostDeferred = $q.defer();
        $http.get(latesGonewilderURL).then(function(success){
          latestPostDeferred.resolve(success.data);
        })

        return latestPostDeferred.promise;
      }
    }
})

.factory("Members", ["$http", "$q", "$firebase", function($http, $q, $firebase){
   
  var firebaseObject = {};
  
  function initFirebaseForUser(user){
    firebaseObject = new Firebase('https://gonewildr.firebaseio.com/members_profiles/'+user);
  }

  function getMemberInfo(member){
    
  }

  function setMemberInfo(user, info){
    initFirebaseForUser(user);
    firebaseObject.set(info);
  }

  return {
    initFirebaseForUser: initFirebaseForUser,
    getMemberInfo: getMemberInfo, 
    setMemberInfo: setMemberInfo
  }

}])




.service('AuthenticationService', function() {

})

.service('RedditAPI', function($q, $http) {
    var service = {
        gonewild: gonewild
    }

    function gonewild() {
        var deferred = $q.defer();
        $http.get('http://www.reddit.com/r/gonewild/new.json')
        .success(function(response) {
            //console.log(extractImages(response.data))
            //return response.data
           deferred.resolve(extractImages(response.data));

        })
        .error(function(response) {
            console.log(response.data.message)
        })
        return deferred.promise;
    }

    function extractImages(data) {
        var images = [];

        data.children.forEach(function(element, index, array){
            var image = {};
            image.thumb = element.data.thumbnail;
            image.full = element.data.url;
            images.push(image);
        })
        return images
    }

    return service;

})

    .service("MemberPosts", [ "$http", "$q",  function($http, $q){
      return {
        getAll: function(){
          var deferred = $q.defer();

          $http.get("http://52.24.232.201/gone-wildr/test/test_images.php?limit=10").then(function(success){
            console.log(success.data.images)
            deferred.resolve(success.data.images);
          }, function(fail){
            deferred.resolve(fail)
          })
        // var latestPosts = []
        
        // for (var i = 0; i < 10; i++) {
        //   latestPosts.push({src: "http://lorempixel.com/400/300/nightlife/"+(i+1)})
        // };

        // setTimeout(function(){
        //   deferred.resolve(latestPosts);
        // })

          return deferred.promise
        }
      }
    }])
    .factory('Chats', function() {
        // Might use a resource here that returns a JSON array

        // Some fake testing data
        var chats = [{
            id: 0,
            name: 'Ben Sparrow',
            lastText: 'You on your way?',
            face: 'https://pbs.twimg.com/profile_images/514549811765211136/9SgAuHeY.png'
        }, {
            id: 1,
            name: 'Max Lynx',
            lastText: 'Hey, it\'s me',
            face: 'https://avatars3.githubusercontent.com/u/11214?v=3&s=460'
        },{
            id: 2,
            name: 'Adam Bradleyson',
            lastText: 'I should buy a boat',
            face: 'https://pbs.twimg.com/profile_images/479090794058379264/84TKj_qa.jpeg'
        }, {
            id: 3,
            name: 'Perry Governor',
            lastText: 'Look at my mukluks!',
            face: 'https://pbs.twimg.com/profile_images/598205061232103424/3j5HUXMY.png'
        }, {
            id: 4,
            name: 'Mike Harrington',
            lastText: 'This is wicked good ice cream.',
            face: 'https://pbs.twimg.com/profile_images/578237281384841216/R3ae1n61.png'
        }];

        return {
            all: function() {
                return chats;
            },
            remove: function(chat) {
                chats.splice(chats.indexOf(chat), 1);
            },
            get: function(chatId) {
                for (var i = 0; i < chats.length; i++) {
                    if (chats[i].id === parseInt(chatId)) {
                        return chats[i];
                    }
                }
                return null;
            }
        };
    })