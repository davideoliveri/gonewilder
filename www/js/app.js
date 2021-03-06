angular.module('starter', ['ionic', 'starter.controllers', 'starter.services', 'ngCordova', 'firebase', 'angularGeoFire'])

.run(function($ionicPlatform, Geolocation, Members, $geofire) {
    $ionicPlatform.ready(function() {
        // Hide the accessory bar by default (remove this to show the accessory bar above the keyboard
        // for form inputs)
        if (window.cordova && window.cordova.plugins && window.cordova.plugins.Keyboard) {
            cordova.plugins.Keyboard.hideKeyboardAccessoryBar(true);
        }
        if (window.StatusBar) {
            // org.apache.cordova.statusbar required
            StatusBar.styleLightContent();
        }


        Geolocation.get().then(function(success) {

            var locArray = [];
            locArray.push(success.latitude);
            locArray.push(success.longitude);
            console.log("setting event for nearby user")
            Geolocation.setEventForNearbyUsers(locArray, 300);
            Geolocation.pushLocationToDB();

            // setMemberInfo requires the userName and the info for that user in a form of Object.
            // this will add a new entry in 'https://gonewilder.firebaseio.com/members_profiles/'+<user>
            Members.setMemberInfo("da_video_live", {
                "da_video_live": {
                    pic: "http://lorempixel.com/300/300/people/4"
                }
            })
        });

    })
})

.config(function($stateProvider, $urlRouterProvider) {

  // Ionic uses AngularUI Router which uses the concept of states
  // Learn more here: https://github.com/angular-ui/ui-router
  // Set up the various states which the app can be in.
  // Each state's controller can be found in controllers.js
  $stateProvider

  // setup an abstract state for the tabs directive
    .state('login', {
        url: '/login',
        templateUrl: "templates/login.html",
        controller: "LoginCtrl"
    })

  // Each tab has its own nav history stack:
   .state('tab', {
   url: "/tab",
   abstract: true,
   templateUrl: "templates/tabs.html"
 })
  .state('tab.userlist', {
    url: '/userlist',
    views: {
      'tab-userlist': {
        templateUrl: 'templates/tab-userlist.html',
        controller: 'UserlistCtrl'
      }
    },
    resolve: {
        nearby: function(Geolocation) {
            return Geolocation.getListOfCloseMembers();
        },
        posts: function(MemberPosts){
          console.log(MemberPosts.getAll());
          return MemberPosts.getAll();
        }
    }
  })

  .state('tab.chats', {
      url: '/chats',
      views: {
        'tab-chats': {
          templateUrl: 'templates/tab-chats.html',
          controller: 'ChatsCtrl'
        }
      }
    })
    .state('tab.chat-detail', {
      url: '/chats/:chatId',
      views: {
        'tab-chats': {
          templateUrl: 'templates/chat-detail.html',
          controller: 'ChatDetailCtrl'
        }
      }
    })



  .state('tab.home', {
    url: '/home', 
    views: {
      'tab-home':{
        templateUrl: 'templates/tab-home.html', 
        controller: "HomeCtrl", 
        resolve: {
          latestPosts: function(GoWilderPost){
            return GoWilderPost.getLatest();
          }
        }
      }
    }
  })

.state('tab.settings', {
   url: '/settings',
   views: {
     'tab-settings': {
       templateUrl: 'templates/tab-settings.html',
       controller: 'SettingCtrl'
     }
   }
 })
  .state('tab.map', {
    url: '/map', 
    views: {
      'tab-map':{
        templateUrl: 'templates/tab-map.html', 
        controller: "MapCtrl", 
        resolve: {
          location: function(Geolocation){
            Geolocation.get(); // call this to be sure you have set the storedCoordinates array in the service (pretty dirty eh?)
            return Geolocation.getStored();
          }
        }
      }
    }
  });

  // if none of the above states are matched, use this as the fallback
    $urlRouterProvider.otherwise('/login');

});
