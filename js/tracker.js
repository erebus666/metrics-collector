/**
 * Encapsulate the tracking logic
 */

//Init the piwik queue
var _paq = _paq || [];
var ecommerce1 = {{ecommerce}};

console.log(ecommerce1);
//Asynchronous loading of the piwik tracking framework
(function(){
	var geo = null;
	var geoError = null;
	var geoLocation = false;
	if ( geoLocation && navigator.geolocation) {
        navigator.geolocation.getCurrentPosition( function( position ){
        	geo = position.coords;
        }, function( positionError ){
        	geoError = positionError;
        });
    }
	var customDataFn = function(){
		var ret = "";
		if ( geo ){
			ret += "&geo=" + JSON.stringify({lat:geo.latitude, long: geo.longitude});
		}else if ( geoError ){
			ret += "&message=" + (geoError.message || "Unable to retrieve client geo location");
		}
		
		if ( navigator.platform ){
			ret += "&uap=" + navigator.platform;
		}
		if ( navigator.userAgent){
			ret += "&uag=" + navigator.userAgent;
		}
		
		//date
		var d = new Date();
		ret += "&date=" + d.getUTCFullYear() + "-" + (d.getUTCMonth() + 1) + "-" + d.getUTCDate();
		return ret;
	}
	
	var extracturl = function( url ){
		var a =  document.createElement('a');
	    a.href = url;
	    return a.protocol + "//" + a.hostname + ":" + a.port;
	}
	
	//Get the site id from custom script data attribute
	var scripts = document.getElementsByTagName("script");
    var siteid = null;
	var defTrackerProtocol = "https";
	var defTrackerHost = "metrics-collector-loyalytics-1351.mybluemix.net";
	var trackerUrl = null;
	var src = null;
    if ( scripts && scripts.length > 0 ){
    	
    	trackerUrl = scripts[scripts.length - 1].getAttribute("trackerurl");
    	src = scripts[scripts.length-1].src;
    }
    if ( !trackerUrl ){
    	//Compute it from the current location
    	if ( src ){
    		trackerUrl = extracturl( src ) + "/tracker";
    	}else{
    		trackerUrl = defTrackerProtocol + "://" + defTrackerHost + "/tracker";
    	}
    }

	 var documenttitle = document.title;
    console.log(trackerUrl);
	_paq.push(['setSiteId', "Basicxx_site"]);
	_paq.push(['addPlugin', 'cds_custom_data', {'link': customDataFn, 'sitesearch':customDataFn, 'log': customDataFn}]);
	_paq.push(['setTrackerUrl', trackerUrl]);
	var ecomm = dataLayer[1].ecommerce;
	
	 var actions = [
	    "click",
	    "detail",
	    "add",
	    "remove",
	    "checkout",
	    "checkout_option",
	    "purchase",
	    "refund",
	    "promo_click",
	    "view"
	  ];

	console.log(ecommerce);

	if (ecomm) {
		if (ecomm.detail){
			_paq.push(['setEcommerceView',
			ecomm.detail.products[0].id, // (required) SKU: Product unique identifier
			ecomm.detail.products[0].name, // (optional) Product name
			ecomm.detail.products[0].category, // (optional) Product category, or array of up to 5 categories
			parseFloat(ecomm.detail.products[0].price)// (optional) Product Price as displayed on the page
			]);
			var documenttitle = "Product Detail";
		}

	}
	
	if (dataLayer[11]) {
		if (dataLayer[11].ecommerce) {
			var atc = dataLayer[11].ecommerce;
			console.log(atc);
			if (atc.add){
				_paq.push(['addEcommerceItem',
				atc.add.products[0].id, // (required) SKU: Product unique identifier
				atc.add.products[0].name, // (optional) Product name
				atc.add.products[0].category, // (optional) Product category, or array of up to 5 categories
				parseFloat(atc.add.products[0].price),
				parseFloat(atc.add.products[0].quantity)// (optional) Product Price as displayed on the page
				]);
				var documenttitle = "add";
			}
	
		}
	}

	console.log(document.title);
	console.log(documenttitle);
	_paq.push(['setDocumentTitle', documenttitle]);
	_paq.push(['trackPageView']);
	_paq.push(['enableLinkTracking']);
	
	var d=document, g=d.createElement('script'), s=d.getElementsByTagName('script')[0]; g.type='text/javascript'; 
	var index = src.lastIndexOf("/");
	g.defer=true; g.async=true; g.src= defTrackerProtocol + "://" + defTrackerHost +'/piwik.js';
	s.parentNode.insertBefore(g,s); 
	console.log(JSON.stringify(_paq));
	console.log(src.substr(0, index ));

})();

console.log(dataLayer[1].ecommerce.detail.products[0]);

//dynamically enable link tracking starting from provided DOM Element
var enableLinkTrackingForNode = function( node ){
  var _tracker = this;
  node.find('a,area').each(function(link){
      if ( _tracker.addClickListener) {
          _tracker.addClickListener($(this)[0], true);
      }
  });
};