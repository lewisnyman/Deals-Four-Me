  $(document).ready(function() {
    main(); 
    $('#more-results').click(dealios.display);  
    $('.deal .why').live('click', function(event) {
      event.preventDefault();
      var $this = $(this);
      var parent = $this.parents('.deal');
      var reasoning = $('.reasoning', parent);
      if(reasoning.is('.fadeIn')){
        reasoning.removeClass('fadeIn').addClass('animated fadeOut');
         $this.text('Why?');
      }
      else {
        reasoning.show().removeClass('fadeOut').addClass('animated fadeIn');
         $this.text('Oh ok');
      }
    });    
  }); 

 /* GLOBALS*/
 var geo = false;
 var lat; 
 var lng;
 var currenturl = 'www.dealsfourme.com';
 
 templates = {
  category : "<div class='category {{times}}-times'>{{name}} - {{times}} times</div>",
  testdeals : "<div class='deal row-fluid'><h4><a href='{{deal_url}}'>{{short_title}}</a></h4><h5>Rating = {{dealRating}}</h5><p>We recommended this deal because you have been to:</p><ul class='reasons'>{{#reasoning}}<li>{{.}}</li>{{/reasoning}}</ul><a href='{{deal_url}}'><img src='{{image_link}}' /></a><h5>Categories</h5><ul class='categories'>{{#categories}}<li>{{name}}</li>{{/categories}}</ul><h5>Tags</h5><ul class='tags'>{{#tags}}<li> {{name}}</li>{{/tags}}</ul></div>",
  deals : "<div data-rating='{{dealRating}}' class='deal animated fadeInRightBig'><h2><a target='_blank' href='{{deal_url}}'>{{short_title}}</a></h2><div class='row-fluid'><div class='span3 image'><a target='_blank' href='{{deal_url}}'><img src='{{image_link}}' /></a></div><div class='span3 prices'><p><strong><del>&pound;{{value}}</del></strong></p><p><strong>&pound;{{price}}</strong></p></div><div class='span3 actions'><p><a class='why'>Why?</a></p><p><a href='{{deal_url}}' target='_blank' class='btn btn-large go'>Deal me!</a></p></div><div class='span3 reasoning'><p>I recommend this deal because you have been to:</p><ul class='reasons'>{{#reasoning}}<li>{{.}}</li>{{/reasoning}}</ul></div></div></div>",
  cities : '<a class="btn" href="#">{{city}}</a><a class="btn dropdown-toggle" data-toggle="dropdown" href="#"><span class="caret"></span></a><ul class="dropdown-menu">{{#cities}}<li><a href="#">{{name}}</a></li>{{/cities}}</ul>',
 }
 
  foursquare = {
    client_id : 'HLNUKNXPPKCLD4NOYSFLCPO24KL153BHL2CFBVUYFZNLKOLU',
    callback_url : window.currenturl,
    auth_url : 'https://foursquare.com/oauth2/authenticate',
    token : '',
    ready : false,
    api : {
      base : 'https://api.foursquare.com/v2/',
      venues : 'venues/explore',
      user : 'users',
      checkins : 'users/self/checkins',
    },
    auth : function(callback){
      /* Attempt to retrieve access token from URL. */
      if ($.bbq.getState('access_token')) {
        toggleLoading('Authenticating with Foursquare');
        this.token = $.bbq.getState('access_token');
        $.bbq.pushState({}, 2)
        callback();
      } else if ($.bbq.getState('error')) {
      } else {
        /* Redirect for foursquare authentication. */
        $('#foursquare-auth').attr('href', this.auth_url + '?client_id=' + this.client_id
        + '&response_type=token&redirect_uri=' + this.callback_url).show();
      }    
    },
    display : function() {
     toggleLoading();
      var output = "<h3>Foursquare Categories</h3>"; 
      for (var i = 0; i < foursquare.categories.length; i++) {
          output += Mustache.render(templates.category,foursquare.categories[i]);
      }
      $('#main').append(output);
    },
    get : function(callback) {
      /* Query foursquare API for venue recommendations near the current location. */
      $.getJSON(this.api.base + this.api.checkins + '?limit=250' + '&oauth_token=' + this.token, {}, function(data) {
        checkins = data['response']['checkins']['items']; 
        var list = new Array();
        for (var i = 0; i < checkins.length; i++) {//For every checkin
          var checkin = checkins[i];
          if(checkin.type == 'checkin') {
            var entryCategories = checkin['venue']['categories'];
            for (var j = 0; j < entryCategories.length; j++) {//For every venue category in a checkin
              var found = -1;
              var category = entryCategories[j];
              var name = category.pluralName;
              for (var k = 0; k < list.length; k++) {//Check to see if this category already exists in the list
                var listitem = list[k];
                if(listitem.name == name) {
                  found = k;
                }
              }
              if(found >= 0) {//If already in list increment times
                var listitem = list[found];
                listitem.times++;
                list[found] = listitem;
              }
              else {
                var category = new Object; 
                category.name = name;
                category.times = 1;
                list.push(category);
              }              
            }
          }
        }
        foursquare.categories = list;
        callback();
      });
    },
  };
  
  function dealProvider(client_id, api, exclude) {
    this.client_id = 'client_id';
    this.api = api;
    this.ready = false;
    this.counter = 0;
    this.get = function (callback) {
       $.getJSON(this.api.dev + this.api.deals + '/?city=' + this.city.short_name + '&key=' + this.client_id, {},function(data) {
         this.deals = data.response.deals;
         callback();
       })
   };
   this.sort = function(callback) {
     this.deals.sort ( function (a,b) {
       return b.dealRating - a.dealRating;
     });
     callback();
   };
   this.display = function() {
    toggleLoading();
    var output = "";
    var i = this.counter;
    var end = i+4; 
    var noMore = false;
    var deals = this.deals;
    if(end > deals.length) {
      end = deals.length;
      noMore = true;
    }
    for (i; i < end; i++) {
      var deal = this.deals[i];
      if(deal.dealRating > 0){
        output += Mustache.render(templates.deals, deal);
      }
      else {
        this.deals[i].remove();
      }
    }
    if(noMore) {
      $('body').removeClass('moretoload');
    }
    else {
      $('body').addClass('moretoload');
    }
    this.counter = i;
    $('#results').append(output);
    };
  this.exclude = exclude; 
};
   
  dealios = {
    client_id : '3b49314ecba04335e16aefb6d3b74295',
    api : {
      base : 'http://www.dealzippy.co.uk/api/',
      dev : 'http://www.dealzippy.co.uk/dev-api/',
      deals : 'deals',
      cities : 'cities',
    },
    ready : false,
    counter : 0,
    getCities : function(callback) {
      $.getJSON(this.api.dev + this.api.cities + '/?key=' + this.client_id, {},function(data) {
        dealios.cities = data.response.cities;
        callback();
      })
    },
    findCity : function(callback) {
      if(window.geo){
        var geocoder = new google.maps.Geocoder();
        var latLng = new google.maps.LatLng(window.lat,window.lng);
        if (geocoder) {
              geocoder.geocode({ 'latLng': latLng }, function (results, status) {
                 if (status == google.maps.GeocoderStatus.OK) {
                    var address = results[0].address_components;
                    var found = false;
                    for (var i = 0; i < address.length; i++) {
                      if(found) {
                        break;
                      }
                      var component = address[i];
                      var componentname = component.short_name;
                      for(var j = 0; j < dealios.cities.length; j++) {
                        if(found) {
                          break;
                        }
                        var city = dealios.cities[j];
                        var cityname = city.name;
                          if(componentname === cityname){
                            dealios.city = cityname;
                            found = true;
                          }
                      }
                    }
                    if(!found) {
                      dealios.city = "Unknown";
                    }
                    dealios.address = address;
                    callback();
                 }
                 else {
                   dealios.city = "Unknown";
                    callback();            
                 }
              });
           }
       }    
     },
     displayCities : function() {
       var output = "";
       if($('#cities').length == 0) {
         output += '<div id="cities" class="span btn-group">';
         output += Mustache.render(templates.cities, dealios);
         output += '</div';
        $('.hero-unit p:last').append(output);
       }else {
         output += Mustache.render(templates.cities, dealios);
        $('#cities').html(output);
       }
     },
    getDeals : function (callback) {
      if(dealios.city != "Unknown") {
        $.getJSON(this.api.dev + this.api.deals + '/?city=' + dealios.city + '&key=' + this.client_id, {},function(data) {
          dealios.counter = 0;
          dealios.deals = data.response.deals;
          callback();
        })
      }
      else {
       error('I can not find your city. Please choose a city manually.');
       tidy();   
       toggleLoading();     
      }
    },
    sort : function(callback) {
      dealios.deals.sort ( function (a,b) {
        return b.dealRating - a.dealRating;
      });
      callback();
    }, 
    display : function() {
      toggleLoading();
      var output = "";
      var number = 3;
      var count = 0; 
      var noMore = false;
      var deals = dealios.deals;
      var lastknowndeal;
      var results = $('#results');
      for (var i = 0; i < deals.length; i++) {
        if(i > dealios.counter && count <= number){
          var deal = dealios.deals[i];
          if(deal.dealRating > 0) {
            output += Mustache.render(templates.deals, deal);
            count++;
            lastknowndeal = i;
          }
        }
      }
      if(count < number) {
        $('body').removeClass('moretoload');
      }
      else {
        $('body').addClass('moretoload');
      }
      dealios.counter = lastknowndeal;
      if(output === "") {
        output = "<p class='alert'>I'm sorry, there are no good deals in your area based on your check-in history. Come back in a few days for a fresh batch.</p>"
      }
      if($('.deal', '#results').length == 0) {
        results.append(output);
        var position = results.offset();
        console.log(position);
        window.scrollTo(position.left,position.top);
      }
      else {
        results.append(output);
      }
      
      },
      redisplay : function() {
        $('.alert').remove();
        $('#results').html('');
        dealios.displayCities();
        toggleLoading('Calculating suitable deals');
        dealios.getDeals( function() {//GET DEALIOS
          if(areWeThereYet(dealios)) {
            wordForWord(dealios.sort, dealios.display);
          }
        });
        
      },
    exclude : new Array("restaurants", "and"), 
  };
  
  function main() {
    foursquare.auth( function() {
      toggleLoading('Getting your location');
      getgeo( function () {
        toggleLoading('Finding possible cities');
       dealios.getCities ( function() {
          toggleLoading('Finding your city');
          dealios.findCity(function() {
            dealios.displayCities();
            toggleLoading('Grabbing Foursquare Checkins');
            foursquare.get( function() {//GET FOURSQUARE
              foursquare.categories.sort( function(a,b) {
                return b.times - a.times;
              });
              if(areWeThereYet(foursquare)) {
                wordForWord(dealios.sort, dealios.display);
                tidy();
              }
            });//foursquare.get
            dealios.getDeals( function() {//GET DEALIOS
              if(areWeThereYet(dealios)) {
                wordForWord(dealios.sort, dealios.display);
                tidy();
              }
            });//dealios.getDeals
          });//findCity
        });/*dealios.getCities*/
      });//getgeo
    });//foursquare.auth
  }
  
  function wordForWord(callback1, callback2) {
    toggleLoading('Calculating suitable deals');
    var deals = dealios.deals;
    for (var i = 0; i < deals.length; i++) {//Deals
      var deal = deals[i];
      var dealRating = 0;
      var reasoning = new Array;
      var tags = deal.tags;
      if (typeof tags === "undefined") {//No tags? Use categories instead
        tags = deal.categories;
      }
        for (var j = 0; j < tags.length; j++) {//Deal tag
          var tag = tags[j];
          var name = tag.name;
          var words = name.split(' ');
            for (var k = 0; k < words.length; k++) {//Tag word
              var word = words[k].toLowerCase();
              for(var l = 0; l < foursquare.categories.length; l++) {//4square cateogry
                var category = foursquare.categories[l];
                var categoryName = category.name;
                var categoryWords = categoryName.split(' ');
                var rating = 0;
                  for(var m = 0; m < categoryWords.length; m++) {//Category word
                    var categoryWord = categoryWords[m].toLowerCase();
                    if((word === categoryWord) && (jQuery.inArray(word, dealios.exclude) == -1)) {
                      var categoryValue = category.times;
                      rating += categoryValue;//Add to times
                    }
                  }
                if(rating >0) {
                  dealRating += rating;
                  var sentence = categoryName + ' ' + categoryValue + ' times';
                  if(jQuery.inArray(sentence, reasoning) == -1) {
                    reasoning.push(sentence);//Add category to reasons
                  }
                }
              }
            }
        }

      deal.reasoning = reasoning;
      deal.dealRating = dealRating;
      deals[i] = deal;
    }
    for (var z = 0; z < deals.length; z++) {
      var deal = deals[z];
      if(deal.dealRating < 1) {
        dealios.deals.remove(z);
      }
    }
    console.log(deals);
    window.dealios.deals = deals;
    callback1(callback2);
  }
  
  function sendFeedback() {
    var feedback = {
      data : collectData(),
      intro : "Thanks for posting your feedback. Would you be happy to include a copy of the data displayed on the page so I can debug the output?",
      buttontext : "Send",
    }
    var output = Mustache.render(templates.feedback, feedback);
    
  }  
  
  function collectData() {
        var output;
        output = jQuery.param(foursquare);
        ouput += dealios;
  }

  
  function areWeThereYet(object){
    object.ready = true;
    if(foursquare.ready && dealios.ready) {
      return true;
    }
  }
  
  function toggleLoading(message){
    console.log(message);
    if(typeof message === "undefined") {
      $('body').removeClass('loading');
    }
    else {
       $('body').addClass('loading');
       $('#load .info').text(message);
    }
  }
  
  function tidy() {
    $('#foursquare-auth').click( function() {
      var $this = $('a:first','#cities');
      var text = $this.text();
      dealios.city = text;
      dealios.redisplay();
    });
    $('a', '#cities').live('click', function (){
      var $this = $(this);
      var text = $this.text();
      dealios.city = text;
      dealios.redisplay();
    });
  }
  
  function error(message) {
    var container = $('.hero-unit');
    var output = '<p class="alert alert-error">' + message + '</p>';
    container.after(output);
  }
  
  function getgeo(callback) {
      /* HTML 5 geolocation. */
    navigator.geolocation.getCurrentPosition(function(data) {
      window.lat = data['coords']['latitude'];
      window.lng = data['coords']['longitude'];
      /*Fake Maimi data*/
      //window.lat = 25.7614;
      //window.lng = -80.1791; 
      window.geo = true;
      callback();
    });
  }
  
  var eightcoupons;
  
  function usaProvider(){
    var api = new Array('http://api.8coupons.com/v1/', 'dev', 'deals');
    window.eightcoupons = new dealProvider('0e00393ea8080ec38d0be25ebbbc445682cb751e7551d2e55b2f3d0750f4cf97bcb94ecc5761350d5046d039b4ff9ace', api);
  }
  
  // Array Remove - By John Resig (MIT Licensed)
  Array.prototype.remove = function(from, to) {
    var rest = this.slice((to || from) + 1 || this.length);
    this.length = from < 0 ? this.length + from : from;
    return this.push.apply(this, rest);
  };
  