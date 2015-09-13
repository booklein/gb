//Router.route('/', {
//    template: 'hello'
//});

Books = new Mongo.Collection("books");

BookSchema = new SimpleSchema({
  isbn: {
    type: String,
    label: "ISBN",
    max: 13
  },
  inventory: {
    type: Number,
    label: "Inventory",
    optional: true,
  },
  location: {
    type: String,
    label: "Location",
    optional: true,
  },
  source: {
    type: String,
    label: "Source",
    max: 13
  },
  booklePrice: {
    type: Number,
    label: "Amazon Price",
    optional: true,
  },
  azPrice: {
    type: Number,
    label: "Amazon Price",
    optional: true,
  },
  fkPrice: {
    type: Number,
    label: "FlipKart Price",
    optional: true,
  },
  amazon: {
    type: Object,
    label: "Amazon",
    optional: true,
    blackbox: true
  },
  google: {
    type: Object,
    label: "Google",
    optional: true,
    blackbox: true
  }
});

Books.attachSchema(BookSchema);


if (Meteor.isClient) {
  Meteor.startup(function() {
    Meteor.subscribe("books");
    Session.set("log", sl + " | Device ready")
  })
  Session.setDefault("location", "");

  Session.setDefault('log', "Log: ");
  sl = Session.get("log");

  Template.hello.helpers({
    log: function () {
      return Session.get('log');
    },
    text: function () {
      return Session.get("text");
    },
    format: function () {
      return Session.get("format") || "unknown"
    },
    error: function () {
      return Session.get("error");
    },    
    title: function () {
      var title = Books.findOne({"_id": Session.get("text")}) && Books.findOne({"_id": Session.get("text")}).amazon ? Books.findOne({"_id": Session.get("text")}).amazon.ItemAttributes.Title : "";
      return title;
    },
    booksinlocation: function () {
      return Books.find({"location": Session.get("location")}).count();
    }
  });

  Template.hello.events({
    'change #location1': function (e) {
        Session.set("location", e.currentTarget.value);
    },
    'change #input1': function (e) {
        Session.set("isbn1", e.currentTarget.value.toUpperCase());
    },
    'click #makecsv': function (e) {
      e.preventDefault();
      Meteor.call("makeCSV", function (error, result) {
        if (error) console.log ("Error making csv: " + error);
        else console.log("CSV ready");
      } );
    },
    'click #submit1': function (e) {
      e.preventDefault();
      Session.set("log", sl + "In submit1")
      var isbn1 = Session.get("isbn1"); //060303120x
      if (Books.findOne({"_id": isbn1})) {
        Books.update({"_id": isbn1}, {$inc: {"inventory": 1}});
      } 
      else {
        Books.insert({"_id": isbn1, "isbn": isbn1, "inventory": 1, "location": Session.get("location"), "source": "berkshire"});
      }
    },
    'click #submit2': function (e) {
      e.preventDefault();
      Session.set("log", sl + " | In submit2")
      var isbn = Session.get("text");
      if (Books.findOne({"_id": isbn})) {
        Session.set("log", sl + " | Updating " + isbn)
        Books.update({"_id": isbn}, {$inc: {"inventory": 1}}, function(err, id) {
          if(err) Session.set("log", sl + " | " + err);
          else Session.set("log", sl + " | " + id);
        });
      } 
      else {
        Session.set("log", sl + " | Inserting " + isbn)
        Books.insert({"_id": isbn, "isbn": isbn, "inventory": 1, "location": Session.get("location"), "source": "berkshire"}, function(err, id) {
          if(err) Session.set("log", sl + " | " + err);
          else Session.set("log", sl + " | " + id);
        });
      }
    },
    'click #scanner1': function () {
      cordova.plugins.barcodeScanner.scan(function (result) {
        Session.set("text", result.text);
        Session.set("format", result.format);
        Session.set("error", result.cancelled);
        Template.instance().$("#input1").val(result.text);
//        if (Books.findOne({"_id": result.text})) {
//          Books.update({"_id": result.text}, {$inc: {"inventory": 1}});
//        } 
//        else {
//          Books.insert({"_id": result.text, "isbn": result.text, "inventory": 1, "location": Session.get("location"), "source": "berkshire"});
//        }
      }, function (error) {
        Session.set("error", EJSON.stringify(error))
      });
    },    
  });
}

if (Meteor.isServer) {
  Meteor.publish("books", function () {
    return Books.find({"source": "berkshire"});
  });

  Books.allow({
    insert: function() {return true},
    update: function() {return true},
    remove: function() {return true}
  })

  aws = Meteor.npmRequire("aws-lib");
  prodAdv = aws.createProdAdvClient("AKIAJPMWFOT5T265V4GA", "RLP+EHGo4osaTRfLoPQ+sWj8QLsV8NQLEJucSZ52", "wooplaza-21");

  Gisbn = Meteor.npmRequire("gisbn");
  gisbn = new Gisbn("", "AIzaSyApUA3e3EG3kF5w_6aE2njw2FhEgfPS_Ng", "IN");

  cheerio = Meteor.npmRequire("cheerio");

  Meteor.startup(function () {
//    BrowserPolicy.content.allowOriginForAll("*");
//    BrowserPolicy.content.allowOriginForAll("http://meteor.local");
//    BrowserPolicy.content.allowOriginForAll("http://192.168.1.3");
//    BrowserPolicy.content.allowOriginForAll("http://192.168.1.5");
    // code to run on server at startup
    //_.each(isbns, function(isbn) {
    //  Books.insert({"isbn": isbn});
    //})
    //Books.remove({});
    //getFromAmazon();
    //makeCSV();
  });

  Meteor.methods({
    getFromAmazon: function () {
      var len = bn.length;
      var ix = 0;
      var hl = Meteor.setInterval(function() {
        if (ix >= len) {
          Meteor.clearInterval(hl);
          console.log("All Done!!");
        }
        else 
        {
          var browsenode = bn[ix];
          var page = 0;    
          var handle = Meteor.setInterval(function() {
            page++;
            if (page > 10) {
              console.log("Node Done: " + browsenode);
              Meteor.clearInterval(handle);
            }
            else {
              var options = {
                host: "webservices.amazon.in",
                version: "2013-08-01",
                region: "IN",
                ItemPage: page,
                BrowseNode: browsenode,
                SearchIndex: "Books", 
                ResponseGroup: "ItemIds"
              };
              prodAdv.call("ItemSearch", options, Meteor.bindEnvironment(function(err, results) {
                  if (err || !results.Items.Item || results.Items.Item.length == 0 || !results.Items.Item[0]) {
                    console.log("Error: " + err);
                  } else {
                      var count = results.Items.Item.length;
                      var idx = 0;
                      var h = Meteor.setInterval(function(){
                        if (idx >= count) {
                          Meteor.clearInterval(h);
                          console.log("Page done: " + browsenode + " " + page);
                        }
                        else {
                          var asin = results.Items.Item[idx].ASIN
                          if (Books.find({"_id": asin}).count() === 0) Books.insert({"_id": asin, "isbn": asin});
                        }
                        idx++;
                      }, 1500)
                  }
              }));
            }
          }, 30000)
        }
        ix++;
      },300000)
    },

    makeCSV: function () {
      var fs = Npm.require('fs');
  //    f = '/Users/aanchalsuri/Desktop/hari/products.csv'
      var files = fs.readdirSync('../../../../../public');
      console.log(files);
      f = '../../../../../public/products.csv'
      head = "sku,store,attribute_set,type,categories,_root_category,websites,author,binding,color,condition,cost,country_of_manufacture,creareseo_discontinued,creareseo_discontinued_product,created_at,custom_design,custom_design_from,custom_design_to,custom_layout_update,description,dimensions,featured,gallery,gift_message_available,has_options,image,image_label,isbn,manufacturer,media_gallery,meta_description,meta_keyword,meta_title,minimal_price,msrp,msrp_display_actual_price_type,msrp_enabled,name,news_from_date,news_to_date,options_container,pages,page_layout,price,publisher,publish_date,rating_filter,required_options,short_description,small_image,small_image_label,special_from_date,special_price,special_to_date,status,tax_class_id,thumbnail,thumbnail_label,updated_at,url_key,url_path,vesbrand,ves_color,ves_size,visibility,weight,qty,min_qty,use_config_min_qty,is_qty_decimal,backorders,use_config_backorders,min_sale_qty,use_config_min_sale_qty,max_sale_qty,use_config_max_sale_qty,is_in_stock,notify_stock_qty,use_config_notify_stock_qty,manage_stock,use_config_manage_stock,stock_status_changed_auto,use_config_qty_increments,qty_increments,use_config_enable_qty_inc,enable_qty_increments,is_decimal_divided,_links_related_sku,_links_related_position,_links_crosssell_sku,_links_crosssell_position,_links_upsell_sku,_links_upsell_position,_associated_sku,_associated_default_qty,_associated_position,_tier_price_website,_tier_price_customer_group,_tier_price_qty,_tier_price_price,_group_price_website,_group_price_customer_group,_group_price_price,_media_attribute_id,_media_image,_media_lable,_media_position,_media_is_disabled,_custom_option_store,_custom_option_type,_custom_option_title,_custom_option_is_required,_custom_option_price,_custom_option_sku,_custom_option_max_characters,_custom_option_sort_order,_custom_option_row_title,_custom_option_row_price,_custom_option_row_sku,_custom_option_row_sort,_super_products_sku,_super_attribute_code,_super_attribute_option,_super_attribute_price_corr\n";
      fs.appendFileSync(f, head);

      Books.find().forEach(function(book){
        if (book.amazon) {
          var b = book.amazon;
          var ia = b.ItemAttributes;
          var r = "";
          var category = _.map(b.BrowseNodes.BrowseNode, function(node) {
            return nodemap[node.BrowseNodeId] ? nodemap[node.BrowseNodeId].replace(" / ", "/").replace(" / ", "/") : "";
          });
          var categories = _.without(category,"").join(";;");
          var iad = ia.ItemDimensions;
          var h = iad && iad.Height ? iad.Height["#"] * .0254 : "0";
          var l = iad && iad.Length ? iad.Length["#"] * .0254 : "0";
          var w = iad && iad.Width ? iad.Width["#"] * .0254 : "0";
          var dim = h + " x " + l + " x " + w;
          //var price = ia.ListPrice ? ia.ListPrice.Amount * 0.6 *0.3 : 0;
          var price = b.booklePrice ? b.booklePrice : ia.ListPrice ? ia.ListPrice.Amount * 0.6 * 0.3 : 0;
          r = r.concat(
            c(b.ASIN), //sku
            c("admin"), //_store
            c("Books"), //_attribute_set
            c("simple"), //_type
            c(categories), //_categories
            c("Default Category"), //_root_category
            c("base"), //websites
            c(ia.Author ? JSON.stringify(ia.Author).replace(/["]+/g, '') : ""), //author
            c(ia.Binding ? ia.Binding.replace(/["]+/g, '') : ""), //binding
            c(""), //color
            c(""), //condition
            c(""), //cost
            c(""), //country_of_manufacture
            c(""), //creareseo_discontinued
            c(""), //creareseo_discontinued_product
            c(new Date()), //created_at
            c(""), //custom_design
            c(""), //custom_design_from
            c(""), //custom_design_to
            c(""), //custom_layout_update
  //          c(JSON.stringify(ia.Title).replace(/["]+/g, '')), //description --> Need to get
            c(book.google && book.google.volumeInfo && book.google.volumeInfo.description ? book.google.volumeInfo.description : JSON.stringify(ia.Title).replace(/["]+/g, '')), //description
            c(dim), //dimensions
  //          c(""), //ebizmarts_mark_visited
            c(""), //featured
            c(""), //gallery
            c(""), //gift_message_available
            c(""), //has_options
            c(b.LargeImage ? b.LargeImage.URL : ""), //image
            c(JSON.stringify(ia.Title).replace(/["]+/g, '')), //image_label
            c(ia.ISBN ? ia.ISBN : ""), //isbn
            c(""), //manufacturer
            c(""), //media_gallery
  //          c(JSON.stringify(ia.Title).replace(/["]+/g, '')), //meta_description -->
            c(book.google && book.google.volumeInfo && book.google.volumeInfo.description ? book.google.volumeInfo.description : JSON.stringify(ia.Title).replace(/["]+/g, '')), //description
            c(""), //meta_keyword
            c(JSON.stringify(ia.Title).replace(/["]+/g, '')), //meta_title
            c(""), //minimal_price
            c(""), //msrp
            c("Use config"), //msrp_display_actual_price_type
            c("Use config"), //msrp_enabled
            c(JSON.stringify(ia.Title).replace(/["]+/g, '')), //name
            c(""), //news_from_date
            c(""), //news_to_date
            c("Product Info Column"), //options_container
            c(ia.NumberOfPages ? ia.NumberOfPages : ""), //pages
            c(""), //page_layout
            c(price), //price
            c(ia.Publisher ? JSON.stringify(ia.Publisher).replace(/["]+/g, '') : ""), //publisher
            c(ia.PublicationDate ? ia.PublicationDate : ""), //publish_date
            c(""), //rating_filter
            c("0"), //required_options
  //          c(JSON.stringify(ia.Title).replace(/["]+/g, '')), //short_description --> Need to get
            c(book.google && book.google.volumeInfo && book.google.volumeInfo.description ? book.google.volumeInfo.description : JSON.stringify(ia.Title).replace(/["]+/g, '')), //description
            c(b.SmallImage ? b.SmallImage.URL : ""), //small_image
            c(JSON.stringify(ia.Title).replace(/["]+/g, '')), //small_image_label
            c(""), //special_from_date
            c(""), //special_price
            c(""), //special_to_date
            c("1"), //status
            c("2"), //tax_class_id
            c(b.SmallImage ? b.SmallImage.URL : ""), //thumbnail
            c(JSON.stringify(ia.Title).replace(/["]+/g, '')), //thumbnail_label
            c(new Date), //updated_at
            c(JSON.stringify(ia.Title).replace(/["]+/g, '').toLowerCase().replace(" ", "-")), //url_key
            c(JSON.stringify(ia.Title).replace(/["]+/g, '').toLowerCase().replace(" ", "-") + ".html"), //url_path
            c("--- None ---"), //vesbrand
            c(""), //ves_color
            c(""), //ves_size
            c("4"), //visibility
            c(""), //weight
            c("1"), //qty
            c("0"), //min_qty
            c("1"), //use_config_min_qty
            c("0"), //is_qty_decimal
            c("0"), //backorders
            c("1"), //use_config_backorders
            c("1"), //min_sale_qty
            c("1"), //use_config_min_sale_qty
            c("0"), //max_sale_qty
            c("1"), //use_config_max_sale_qty
            c("1"), //is_in_stock
            c(""), //notify_stock_qty
            c("1"), //use_config_notify_stock_qty
            c("0"), //manage_stock
            c("1"), //use_config_manage_stock
            c("0"), //stock_status_changed_auto
            c("1"), //use_config_qty_increments
            c("0"), //qty_increments
            c("1"), //use_config_enable_qty_inc
            c("0"), //enable_qty_increments
            c("0"), //is_decimal_divided
            c(""), //_links_related_sku
            c(""), //_links_related_position
            c(""), //_links_crosssell_sku
            c(""), //_links_crosssell_position
            c(""), //_links_upsell_sku
            c(""), //_links_upsell_position
            c(""), //_associated_sku
            c(""), //_associated_default_qty
            c(""), //_associated_position
            c(""), //_tier_price_website
            c(""), //_tier_price_customer_group
            c(""), //_tier_price_qty
            c(""), //_tier_price_price
            c(""), //_group_price_website
            c(""), //_group_price_customer_group
            c(""), //_group_price_price
            c("88"), //_media_attribute_id
            c(b.LargeImage ? b.LargeImage.URL : ""), //_media_image
            c(ia.Title ? JSON.stringify(ia.Title).replace(/["]+/g, '') : ""), //_media_lable
            c("1"), //_media_position
            c("0"), //_media_is_disabled
            c(""), //_custom_option_store
            c("checkbox"), //_custom_option_type
            c("Want to buy a new copy of the book instead?"), //_custom_option_title
            c("0"), //_custom_option_is_required
            c(""), //_custom_option_price
            c(""), //_custom_option_sku
            c(""), //_custom_option_max_characters
            c("0"), //_custom_option_sort_order
            c("Buy New"), //_custom_option_row_title
            c(ia.ListPrice ? ia.ListPrice.Amount * 0.6 : 0), //_custom_option_row_price
            c(""), //_custom_option_row_sku
            c("0"), //_custom_option_row_sort
            c(""), //_super_products_sku
            c(""), //_super_attribute_code
            c(""), //_super_attribute_option
            "", //_super_attribute_price_corr
            "\n"
          ); 
          fs.appendFileSync(f, r);

  /*
          category.splice(0,1);
          _.each(category, function(cat1) {
            if(cat1 != "") {
              var r1 = ",,,," + c(cat1) + c("Default Category") + "\n";
              fs.appendFileSync(f, r1);            
            }
          })
  */
        }
      })  
      console.log("CSV file created!!");
    }
  });

  function c (field) {
    return "\"" + field + "\","; 
  }

  Books.after.insert(function (userId, doc) {
//    console.log("Updating book " + doc._id)
    var options = {
      host: "webservices.amazon.in",
      version: "2013-08-01",
      region: "IN",
      SearchIndex: "Books", 
      IdType: "ISBN", 
      ItemId: doc._id, 
      ResponseGroup: "BrowseNodes,ItemAttributes,Offers,Images"};

//    Amazon data
    prodAdv.call("ItemLookup", options, Meteor.bindEnvironment(function(err, result) {
        if (err || !result.Items.Item) {
          console.log("Error: " + err);
        } else {
          console.log("Updated book " + result.Items.Item.ItemAttributes.Title);
          Books.update({"_id": doc._id}, {$set: {"amazon": result.Items.Item}});
        }
    }));

//    Google data
    var gUrl = "https://www.googleapis.com/books/v1/volumes?maxResults=1&printType=books&langRestrict=en&country=IN&key=AIzaSyApUA3e3EG3kF5w_6aE2njw2FhEgfPS_Ng&q=isbn:" + doc._id;
    HTTP.get(gUrl, function (err, result) {
      if (err || !result.items) {
        console.log("Error getting from google: " + err);
      } 
      else {
        var b = JSON.parse(result.content);
        //console.log(b.items[0]);
        Books.update({"_id": doc._id}, {$set: {"google": b.items[0]}});        
      }
    });


/*
    gisbn.setIsbn(doc._id);
    gisbn.fetch(Meteor.bindEnvironment(function (err, book) {
      if (err) {
        console.log("Error getting Google data for " + doc._id + " | " + err);
      }
      else {
        Books.update({"_id": doc._id}, {$set: {"google": book}});        
      }
    }));
*/
//    Amazon price
    var azUrl = "http://www.amazon.in/s/field-keywords=" + doc._id;
    HTTP.get(azUrl, function (err, result) {
      if (err) {
        console.log("Error getting from az: " + err);
      } 
      else {
        var az = cheerio.load(result.content);
        var azPrice = az("#result_0 > div > div > div > div.a-fixed-left-grid-col.a-col-right > div:nth-child(2) > div.a-column.a-span7 > div:nth-child(2) > a > span").text();
        console.log("az: " + azPrice + "  " + parseInt(azPrice));
        if (azPrice) {
          Books.update({"_id": doc._id}, {$set: {"azPrice": parseInt(azPrice), "booklePrice": parseInt(azPrice)/2}});
        }
      }
    });

//    FlipKart price
/*
    var fkUrl = "http://www.flipkart.com/search?q=" + doc._id;
    HTTP.get(fkUrl, function (err, result) {
      if (err) {
        console.log("Error getting from fk: " + err);
      }
      else {
        var fk = cheerio.load(result.content);
        var fkPrice = az("#fk-mainbody-id > div > div:nth-child(7) > div > div.right-col-wrap.lastUnit > div > div > div.shop-section-wrap > div > div.section-wrap.line.section > div.left-section-wrap.size2of5.unit > div > div.price-wrap > div > div.prices > div > span.selling-price.omniture-field").attr("data-evar48");
        console.log("fk: " + result.content + "  " + parseInt(fkPrice));
        if (fkPrice) {
          //Books.update({"_id": doc._id}, {$set: {"fkPrice": parseInt(fkPrice)}});        
        }
      }
    });
*/    
  });
}