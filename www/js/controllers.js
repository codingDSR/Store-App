var hostname = "http://codingflag.com/store/backend/parsers/";

angular.module('starter.controllers', [])

.service("core",function($http,$rootScope){
  this.ajax = function(url,type,data,success_f,error_f){
    var requestData = "";
    for(var key in data){
      requestData += `${key}=${data[key]}&`;
    }
    requestData = requestData.substring(0,requestData.length-1);
    console.log(requestData);
    $http({
      url: hostname+url,
      method: type,
      headers : { 'Content-Type': 'application/x-www-form-urlencoded' },
      data:requestData
    }).success(function(response){
      console.log(response);
      success_f(response);
    }).error(function(response){
      console.log("error");
      error_f(response);
    });
  };

  this.alert = function($scope,$ionicPopup,title,msg,afterExec){
    $scope.showAlert = function() {
       var alertPopup = $ionicPopup.alert({
         title: title,
         template: msg
       });
       alertPopup.then(function(res) {
         afterExec(res);
       });
    };
    $scope.showAlert();
  };
  this.unexpectedError = function(msg){
    if(msg == undefined || msg == null) {
      alert("Unexpedted error occured. Please try again.");
    } else {
      alert(msg);
    }
  };


  this.sort = function(property){
    var sortOrder = 1;
    if(property[0] === "-") {
        sortOrder = -1;
        property = property.substr(1);
    }
    return function (a,b) {
        var result = (a[property] < b[property]) ? -1 : (a[property] > b[property]) ? 1 : 0;
        return result * sortOrder;
    }
  };

  this.validateEmail = function(email) {
    var re = /^(([^<>()[\]\\.,;:\s@\"]+(\.[^<>()[\]\\.,;:\s@\"]+)*)|(\".+\"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/;
    return re.test(email);
  };

})


.service("user",function(){
  var username = undefined;
  var auth_token = undefined;

  var db;
  this.getUser = function(){
    return {
      "e":this.username,
      "a":this.auth_token
    }
  };
  this.login = function(name,token){
    this.username = name;
    this.auth_token = token;
    localStorage.setItem("store_user",JSON.stringify(this.getUser()));
  };
  this.logout = function(){
    this.username = undefined;
    this.auth_token = undefined;
    localStorage.removeItem("store_user");  
    window.location.assign("#/app/index");
  };
  this.prepare = function(){
    var data = {}
    try {
      data = JSON.parse(localStorage.getItem("store_user"));
      if(data == null) {
        throw "NULL";
      }
    } catch(msg) {
      data = {
        username:undefined,
        auth_token:undefined
      }
    }
    console.log(data);
    this.username = data.e;
    this.auth_token = data.a;
    console.log("prepared",this.getUser(),this.isLoggedIn());
  };
  this.isLoggedIn = function(){
    if(this.username != undefined && this.auth_token != undefined) {
      return true;
    } else {
      return false;
    }
  }
  this.prepare();
})


.controller('AppCtrl', function($scope, $rootScope, $ionicPopup, $ionicModal, $timeout, user, core, $window) {



  user.prepare();
  console.log("paaa",user.isLoggedIn());
  if(user.isLoggedIn()){
    $rootScope.loggedIn = true;
  } else {
    $rootScope.loggedIn = false;
  }

  //load-catagory
  $scope.catagory = {};
  $scope.load_catagory = function(){
    core.ajax("getCatagory.php","GET",{},function(response){
      $scope.catagory = response.cats;
      //alert(response);
    },function(error){

    });
  };
  $scope.load_catagory();


  //login
  $scope.loginData = {};
  $ionicModal.fromTemplateUrl('templates/login.html', {
    scope: $scope
  }).then(function(modal) {
    $scope.loginModal = modal;
  });
  $scope.closeLogin = function() {
    $scope.loginModal.hide();
  };
  $scope.login = function() {
    $scope.loginModal.show();
  };
  $scope.doLogin = function() {
    if(typeof $scope.loginData.e == undefined || typeof $scope.loginData.e == null){
      return;
    }
    if(typeof $scope.loginData.p == undefined || typeof $scope.loginData.p == null){
      return;
    }
    core.ajax("login.php","POST",$scope.loginData,function(response){
      if(response.status == "ok"){
        user.login($scope.loginData.e,response.auth_token);
        $timeout(function() {
          $scope.closeLogin();
          $window.location.reload();
        }, 500);
        $rootScope.loggedIn = true;
      } else if(response.status == "error"){
        core.alert($scope,$ionicPopup,"Says","Invalid credentials.",function(){
        });        
      } else if(response.status == "no_data"){
        core.alert($scope,$ionicPopup,"Says","Enter email address & password.",function(){
        });
      } else {
        core.alert($scope,$ionicPopup,"Says","Unexpedted error occured. Please try again.",function(){
        }); 
      }
    },function(error){

    });


  };

  //signup
  $scope.signupData = {
    "u":"",
    "e":"",
    "p":""
  };
  $ionicModal.fromTemplateUrl('templates/signup.html', {
    scope: $scope
  }).then(function(modal) {
    $scope.signupModal = modal;
  });
  $scope.closeSignup = function() {
    $scope.signupModal.hide();
  };
  $scope.signup = function() {
    $scope.signupModal.show();
  };
  $scope.doSignup = function() {
    if($scope.signupData.u.length < 3){
      core.alert($scope,$ionicPopup,"Says","Enter proper name.",function(){
      });  
      return;
    }
    if(!core.validateEmail($scope.signupData.e)){
      core.alert($scope,$ionicPopup,"Says","Enter valid email address.",function(){
      });
      return; 
    }
    if($scope.signupData.p.length < 6){
      core.alert($scope,$ionicPopup,"Says","Enter password with minumum 6 characters.",function(){
      });  
      return;
    }
    core.ajax("signup.php","POST",$scope.signupData,function(response){
      if(response.status == "ok"){
        core.alert($scope,$ionicPopup,"Says","Signup successful. Login to continue.",function(){
          $timeout(function() {
            $scope.closeSignup();
          }, 300);
          $timeout(function() {
            $scope.login();
          }, 600);
        });
      } else if(response.status == "activation_pending"){

      } else if(response.status == "exist"){
        core.alert($scope,$ionicPopup,"Says","Account with specified email already exist. <br>Please enter other email address.",function(){
        }); 
      } else if(response.status == "error"){
        core.alert($scope,$ionicPopup,"Says","Unexpedted error occured. Please try again.",function(){
        });
      } else if(response.status == "no_data"){

      } else {

      }
    },function(error){

    });
  };


  //logout
  $scope.logout = function() {
    core.ajax("logout.php","POST",user.getUser(),function(response){
      if(response.status == "ok") {
        user.logout();
        $rootScope.loggedIn = false;
        $window.location.reload();
      } else if(response.status == "error"){
        core.alert($scope,$ionicPopup,"Says","Invalid Auth Token.",function(){
        });
      } else if(response.status == "no_data"){
      }
    },function(error){

    });
  };

  


})

.controller('PlaylistsCtrl', function($scope) {
  $scope.playlists = [
    { title: 'Reggae', id: 1 },
    { title: 'Chill', id: 2 },
    { title: 'Dubstep', id: 3 },
    { title: 'Indie', id: 4 },
    { title: 'Rap', id: 5 },
    { title: 'Cowbell', id: 6 }
  ];
})

.controller('ProductsCtrl', function($scope, $stateParams, core, $ionicModal, $rootScope) {
  //loading
  $scope.loading = true;


  $scope.pid = $stateParams.pid;
  $scope.products = [];
  $scope.backup_products = [];
  $scope.load_products = function(){
    core.ajax("products.php","POST",{"pid":$scope.pid},function(response){
      $scope.loading = false;
      if(typeof response.products != undefined){
        $scope.products = response.products;
        $scope.backup_products = Object.create(response.products);
      }
      console.log("products",response.products);
    },function(error){

    });
  };
  $scope.load_products();


  //sort
  $scope.sortchoices = [
    {
      "id":'A',
      "name":"Relevance"
    },{
      "id":'B',
      "name":"Name: (A-Z)"
    },{
      "id":'C',
      "name":"Name: (Z-A)"
    },{
      "id":'D',
      "name":"Price: (Low to High)"
    },{
      "id":'E',
      "name":"Price: (High to Low)"
    }
  ];
  $scope.sortchoice = {
    "id":'A'
  };
  $ionicModal.fromTemplateUrl('templates/sort.html', {
    scope: $scope
  }).then(function(modal) {
    $scope.sortModal = modal;
  });
  $scope.closeSort = function() {
    $scope.sortModal.hide();
  };
  $scope.sortProduct = function() {
    $scope.sortModal.show();
  };
  $scope.sort = function() {
    console.log("Before",$scope.sortchoice,$scope.products,$scope.backup_products);
    if($scope.sortchoice.id == "A"){
      $scope.products = $scope.backup_products;
    } else if($scope.sortchoice.id == "B"){
      $scope.products =   $scope.backup_products.sort(core.sort("name"));
    } else if($scope.sortchoice.id == "C"){
      $scope.products =   $scope.backup_products.sort(core.sort("-name"));
    } else if($scope.sortchoice.id == "D") {
      $scope.products = $scope.backup_products.sort(core.sort("price"));
    } else {
      $scope.products = $scope.backup_products.sort(core.sort("-price"));
    }
    console.log("After",$scope.sortchoice,$scope.products,$scope.backup_products);
    $scope.closeSort();

  };



})



.controller('ProductCtrl', function($scope, $stateParams, core, $location, user, $ionicPopup, $rootScope) {
  $scope.loading = true;

  $scope.pid = $stateParams.pid;
  $scope.product = [];
  $scope.related_products = [];
  $scope.cart = {
    "status":"ADD TO CART",
    "type":0
  };
  $scope.load_product = function(){
    var usr = user.getUser();
    if(usr.e == undefined || usr.e.length < 2){
      usr = {
        "pid":$scope.pid
      }
    } else {
      usr.pid = $scope.pid;
    }
    
    core.ajax("product.php","POST",usr,function(response){
      if(response.status == "ok"){
        
        $scope.related_products = response.related_products;
        $scope.product = response.products[0];
        $scope.cart.type = response.cart_status;
        if(response.cart_status == 2){
          $scope.cart.status = "GO TO CART";
        }
        $scope.product.imgs = [response.products[0].img1];
        if(response.products[0].img2.length > 44){
          $scope.product.imgs.push(response.products[0].img2);
        }
        if(response.products[0].img3.length > 44){
          $scope.product.imgs.push(response.products[0].img3);
        }
        if(response.products[0].img4.length > 44){
          $scope.product.imgs.push(response.products[0].img4);
        }
        $scope.loading = false;
        console.log("products",$scope.product);
      }
    },function(error){

    });
  };
  $scope.load_product();


  $scope.addToCart = function(){
    if($scope.cart.type == 0){
      var usr = user.getUser();
      if(usr.e == undefined || usr.e.length < 2){
        core.alert($scope,$ionicPopup,"Says","Login first.",function(){
        });
        return;
      }
      $scope.cart.type = 1;
      usr.pid = $scope.pid;
      console.log("usr",usr);
      core.ajax("addToCart.php","POST",usr,function(response){
        if(response.status == "ok"){
          $scope.cart.type = 2;
          $scope.cart.status = "GO TO CART";
        } else if(response.status == "error"){

        } else if(response.status == "logout"){
          user.logout();
          $rootScope.loggedIn = false;
        } else {

        }
      },function(error){

      });
    } else if($scope.cart.type == 2) {
      $location.path("/app/cart");
    } else {
      return;
    }
  };

  $scope.buy = function(){
    $location.path("/app/buy/"+$scope.pid);
  };


})


.controller('CartCtrl', function($scope, $stateParams, user, core, $location, $ionicPopup, $rootScope) {
  $scope.loading = true;

  $scope.products = [];
  $scope.totalprice = 0;
  $scope.load_products = function(){
    var usr = user.getUser();
    if(usr.e == undefined || usr.e.length < 2){
      core.alert($scope,$ionicPopup,"Says","Login first.",function(){
        $scope.login();
      });
      return;
    }
    core.ajax("cartProducts.php","POST",usr,function(response){
      $scope.loading = false;
      if(response.status == "ok"){
        console.log("cart",response);
        $scope.products = response.products;
        if(response.products.length > 0){
          for(var p in response.products){
            $scope.totalprice += parseInt(response.products[p].price);
          }
        }
      } else if(response.status == "error"){

      } else if(response.status == "logout"){
        user.logout();
        $rootScope.loggedIn = false;
      } else if(response.status == "no_cart"){
        $scope.products = [];
      } else {

      }
      
      console.log("products",response.products);
    },function(error){

    });
  };
  $scope.load_products();


  $scope.remove = function(pid){
    var totalprice = $scope.totalprice;
    var usr = user.getUser();
    if(usr.e == undefined || usr.e.length < 2){
      core.alert($scope,$ionicPopup,"Says","Login first.",function(){
      });
      return;
    }
    usr.pid = pid;
    console.log("r",usr);
    core.ajax("removeCartProduct.php","POST",usr,function(response){
      if(response.status == "ok"){
        $scope.totalprice = 0;
        $scope.load_products();
      } else if(response.status == "error"){

      } else if(response.status == "logout"){
        user.logout();
        $rootScope.loggedIn = false;
      } else {

      }
    },function(error){

    });
  };

  $scope.buy = function(){
    $location.path("/app/buy/0");
  };

})


.controller('BuyCtrl', function($scope, $stateParams, user, core, $ionicPopup, $ionicModal, $timeout, $location, $rootScope) {
  $scope.loading = true;
  $scope.pid = $stateParams.pid;
  $scope.products = [];
  $scope.totalprice = 0;
  $scope.load_products = function(){
    //console.log(typeof $scope.pid);
    var usr = user.getUser();
    if(usr.e == undefined || usr.e.length < 2){
      core.alert($scope,$ionicPopup,"Says","Login first.",function(){
        $scope.login();
      });
      return;
    }
    var url = "cartProducts.php";
    if($scope.pid != "0"){
      url = "product.php";
      usr.pid = $scope.pid;
    }
    usr.typereq = "buy";
    console.log(url);
    core.ajax(url,"POST",usr,function(response){
      console.log("buy",response,usr);
      $scope.loading = false;
      if(response.status == "ok"){
        $scope.products = response.products;
        if($scope.pid == "0") {
          if(response.products.length > 0){
            for(var p in response.products){
              $scope.totalprice += parseInt(response.products[p].price);
            }
          }
        } else {
          $scope.totalprice += parseInt(response.products[0].price);
        }

      } else if(response.status == "error"){

      } else if(response.status == "logout"){
        user.logout();
        $rootScope.loggedIn = false;
      } else if(response.status == "no_cart"){
        $scope.products = [];
      } else {

      }
      
      console.log("products",response.products);
    },function(error){

    });
  };
  $scope.load_products();



  //address module
  $scope.address = {
    "addr1":"",
    "addr2":"",
    "landmark":"",
    "city":"",
    "zipcode":"",
    "contact":""
  };
  $ionicModal.fromTemplateUrl('templates/address.html', {
    scope: $scope
  }).then(function(modal) {
    $scope.addressModal = modal;
  });
  $scope.closeAddress = function() {
    $scope.addressModal.hide();
  };
  $scope.fillAddress = function() {
    $scope.addressModal.show();
  };
  $scope.submitAddress = function() {

    if($scope.address.addr1.length < 4 || $scope.address.addr2.length < 4){
      core.alert($scope,$ionicPopup,"Says","Enter proper address information in address1 and address2 box.",function(){
      });
    } else if($scope.address.city.length < 3){
      core.alert($scope,$ionicPopup,"Says","Enter proper city name.",function(){
      });
    } else if(typeof $scope.address.zipcode == undefined || $scope.address.zipcode.length != 6){
      core.alert($scope,$ionicPopup,"Says","Enter proper zipcode.",function(){
      });
    } else if(typeof $scope.address.contact == undefined || $scope.address.contact.length != 10){
      core.alert($scope,$ionicPopup,"Says","Enter proper contact number.",function(){
      });
    } else {
      $timeout(function() {
        $scope.closeAddress();
      }, 300);
    }
  };


  // Order
  $scope.processing = 0;
  $scope.order = function(){
    if($scope.processing != 0){
      return;
    }
    if($scope.address.addr1.length < 4 || $scope.address.city.length < 3){
      core.alert($scope,$ionicPopup,"Says","Please fill out shipping address information.",function(){
      });
      return;
    }
    var usr = user.getUser();
    if(usr.e == undefined || usr.e.length < 2){
      core.alert($scope,$ionicPopup,"Says","Login first.",function(){
        $location.path("/app/index");
      });
      return;
    }
    usr.pid = $scope.pid;
    usr.addr1 = $scope.address.addr1;
    usr.addr2 = $scope.address.addr2;
    usr.landmark = $scope.address.landmark;
    usr.city = $scope.address.city;
    usr.zipcode = $scope.address.zipcode;
    usr.contact = $scope.address.contact;

    $scope.processing = 1;
    core.ajax("order.php","POST",usr,function(response){
      $scope.processing = 0;
      console.log("order",response,usr);
      if(response.status == "ok"){
        $location.path("/app/ordered/"+response.oid);
      } else if(response.status == "error"){

      } else if(response.status == "logout"){
        user.logout();
        $rootScope.loggedIn = false;
      } else if(response.status == "no_cart"){
        $scope.products = [];
      } else {

      }
    },function(error){

    });
  };


})


.controller('OrderedCtrl', function($scope, $stateParams, user, core, $ionicPopup, $ionicModal, $timeout, $location, $rootScope) {
  $scope.loading = true;
  $scope.oid = $stateParams.oid;
  $scope.products = [];
  $scope.load_products = function(){
    var usr = user.getUser();
    if(usr.e == undefined || usr.e.length < 2){
      core.alert($scope,$ionicPopup,"Says","Login first.",function(){
        $location.path("/app/index");
      });
      return;
    }
    usr.oid = $scope.oid;
    core.ajax("orderedProducts.php","POST",usr,function(response){
      console.log("cart",response);
      $scope.loading = false;
      if(response.status == "ok"){
        $scope.products = response.products;
      } else if(response.status == "error"){

      } else if(response.status == "logout"){
        user.logout();
        $rootScope.loggedIn = false;
      } else if(response.status == "no_cart"){
        $scope.products = [];
      } else {

      }
    },function(error){

    });
  };
  $scope.load_products();

  $scope.home = function(){
    $location.path("/app/playlists");
  }
})


.controller('OrdersCtrl', function($scope, $stateParams, user, core, $ionicPopup, $ionicModal, $timeout, $location) {
  $scope.loading = true;

  $scope.products = [];
  $scope.load_products = function(){
    var usr = user.getUser();
    if(usr.e == undefined || usr.e.length < 2){
      core.alert($scope,$ionicPopup,"Says","Login first.",function(){
        $location.path("/app/index");
      });
      return;
    }
    core.ajax("getOrders.php","POST",usr,function(response){
      console.log("cart",response);
      $scope.loading = false;
      if(response.status == "ok"){
        $scope.products = response.products;
      } else if(response.status == "error"){

      } else if(response.status == "logout"){
        user.logout();
        $rootScope.loggedIn = false;
      } else if(response.status == "no_cart"){
        $scope.products = [];
      } else {

      }
    },function(error){

    });
  };
  $scope.load_products();  

  $scope.showConfirm = function(afterexec) {
   var confirmPopup = $ionicPopup.confirm({
     title: 'Says',
     template: 'Do you want to cancel order?'
   });

   confirmPopup.then(function(res) {
     if(res) {
       afterexec();
     } else {
       return;
     }
   });
  };
  $scope.cancelOrder = function(id,oid){
    var usr = user.getUser();
    if(usr.e == undefined || usr.e.length < 2){
      core.alert($scope,$ionicPopup,"Says","Login first.",function(){
        $location.path("/app/index");
      });
      return;
    }


    $scope.showConfirm(function(){
      usr.odid = id;
      usr.oid = oid;
      core.ajax("cancelOrder.php","POST",usr,function(response){
        console.log("cart",response);
        $scope.loading = false;
        if(response.status == "ok"){
          $scope.loading = true;
          $scope.products = [];
          $scope.load_products();
        } else if(response.status == "error"){

        } else if(response.status == "logout"){
          user.logout();
          $rootScope.loggedIn = false;
        } else if(response.status == "no_cart"){
          $scope.products = [];
        } else {

        }
      },function(error){

      });
    });


  };
})


.controller('PlaylistCtrl', function($scope, $stateParams) {
})





var dropdown = function(ev){
  ev.target.children[0].classList.toggle('active');
  ev.target.children[1].classList.toggle('active');
};  