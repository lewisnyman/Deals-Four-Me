  $(document).ready(function() {
    main(); 
    $('#more-results').click(dealios.display);  
    $('.deal .why').live('click', function() {
      var $this = $(this);
      var parent = $this.parents('.deal');
      var reasoning = $('.reasoning', parent);
      if(reasoning.is('.fadeIn')){
        reasoning.removeClass('fadeIn').addClass('fadeOut');
         $this.text('Why?');
      }
      else {
        reasoning.show().addClass('animated fadeIn');
         $this.text('Oh ok');
      }
    });    
  }); 

 /* GLOBALS*/
 var lat; 
 var lng;
 
 templates = {
  category : "<div class='category {{times}}-times'>{{name}} - {{times}} times</div>",
  testdeals : "<div class='deal row-fluid'><h4><a href='{{deal_url}}'>{{short_title}}</a></h4><h5>Rating = {{dealRating}}</h5><p>We recommended this deal because you have been to:</p><ul class='reasons'>{{#reasoning}}<li>{{.}}</li>{{/reasoning}}</ul><a href='{{deal_url}}'><img src='{{image_link}}' /></a><h5>Categories</h5><ul class='categories'>{{#categories}}<li>{{name}}</li>{{/categories}}</ul><h5>Tags</h5><ul class='tags'>{{#tags}}<li> {{name}}</li>{{/tags}}</ul></div>",
  deals : "<div class='deal row-fluid animated fadeInRightBig'><h2><a href='{{deal_url}}'>{{short_title}}</a></h2><div class='span3 image'><a href='{{deal_url}}'><img src='{{image_link}}' /></a></div><div class='span3 prices'><p><strong><del>&pound;{{value}}</del></strong></p><p><strong>&pound;{{price}}</strong></p></div><div class='span3 actions'><p><a class='why'>Why?</a></p><p><a href='{{deal_url}}' target='_blank' class='btn btn-large go'>Deal me!</a></p></div><div class='span3 reasoning'><p>We recommended this deal because you have been to:</p><ul class='reasons'>{{#reasoning}}<li>{{.}}</li>{{/reasoning}}</ul></div></div>",
 }
 
  foursquare = {
    client_id : 'HLNUKNXPPKCLD4NOYSFLCPO24KL153BHL2CFBVUYFZNLKOLU',
    callback_url : 'http://froupon.lewisnyman.co.uk',
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
 
  dealios = {
    client_id : '3b49314ecba04335e16aefb6d3b74295',
    api : {
      base : 'http://www.dealzippy.co.uk/api/',
      dev : 'http://www.dealzippy.co.uk/dev-api/',
      deals : 'deals',
    },
    ready : false,
    counter : 0,
    get : function (callback) {
        $.getJSON(this.api.dev + this.api.deals + '/?city=' + dealios.city.short_name + '&key=' + this.client_id, {},function(data) {
          dealios.deals = data.response.deals;
          callback();
        })
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
      var i = dealios.counter;
      var end = i+4; 
      var noMore = false;
      var deals = dealios.deals;
      if(end > deals.length) {
        end = deals.length;
        noMore = true;
      }
      for (i; i < end; i++) {
        var deal = dealios.deals[i];
        if(deal.dealRating > 0){
          output += Mustache.render(templates.deals, deal);
        }
        else {
          dealios.deals[i].remove();
        }
      }
      if(noMore) {
        $('body').removeClass('moretoload');
      }
      else {
        $('body').addClass('moretoload');
      }
      dealios.counter = i;
      $('#results').append(output);
      },
    exclude : new Array("restaurants", "and"), 
  };
  
  function main() {
    foursquare.auth( function() {
    toggleLoading('Getting your location');
      getgeo( function () {
        toggleLoading('Finding your city');
        findCity(function() {
          toggleLoading('Grabbing Foursquare Checkins');
          foursquare.get( function() {//GET FOURSQUARE
            toggleLoading('Calculating suitable deals');
            foursquare.categories.sort( function(a,b) {
              return b.times - a.times;
            });
            if(areWeThereYet(foursquare)) {
              wordForWord(dealios.sort, dealios.display);
            }
          });
          dealios.get( function() {//GET DEALIOS
            if(areWeThereYet(dealios)) {
              wordForWord(dealios.sort, dealios.display);
            }
          });
        });
      });
    });
  }
  
  function wordForWord(callback1, callback2) {
    for (var i = 0; i < dealios.deals.length; i++) {//Deals
      var deal = dealios.deals[i];
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
      dealios.deals[i] = deal;
    }
    callback1(callback2);
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
  
  function findCity(callback) {
  var geocoder = new google.maps.Geocoder();
  var latLng = new google.maps.LatLng(window.lat,window.lng);
  if (geocoder) {
        geocoder.geocode({ 'latLng': latLng }, function (results, status) {
           if (status == google.maps.GeocoderStatus.OK) {
              var address = results[0].address_components;
              console.log(address);
              dealios.city = address[2];
              callback();
           }
           else {
              console.log("Geocoding failed: " + status);
           }
        });
     }    
   }
  
  function getgeo(callback) {
      /* HTML 5 geolocation. */
    navigator.geolocation.getCurrentPosition(function(data) {
      window.lat = data['coords']['latitude'];
      window.lng = data['coords']['longitude'];
      callback();
    });
  }
  
  // Array Remove - By John Resig (MIT Licensed)
  Array.prototype.remove = function(from, to) {
    var rest = this.slice((to || from) + 1 || this.length);
    this.length = from < 0 ? this.length + from : from;
    return this.push.apply(this, rest);
  };
  