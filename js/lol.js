$(function(){
  
  var Streamer = Backbone.Model.extend({
    defaults: function() {
      return {
        name: "",
        stream: "",
        viewers: 0,
        online: false
      };
    },
    
    initialize: function() {
      // console.log('streamer initialize');
      if (!this.get("name")) {
        this.set({"name": this.defaults.name});
      }
    },
    
    toggle: function() {
      this.save({online: !this.get('online')});
    },
    
    clear: function() {
      this.destroy();
    }
  });
  
  var StreamerList = Backbone.Collection.extend({
    model: Streamer,
    localStorage: new Store("streamers-backbone"),
    online: function() {
      return new Backbone.Collection(this.filter(function(streamer){ return streamer.get('online'); }));
    },
    offline: function() {
      return new Backbone.Collection(this.filter(function(streamer){ return !streamer.get('online'); }));
    }
  });
  
  // var Streamers = new StreamerList;
  
  var StreamerView = Backbone.View.extend({
    tagName: "li",
    template: _.template($('#streamer-template').html()),
    events: {
      "click .toggle"     : "toggleOnline",
      "dblclick .view"    : "edit",
      "click a.remove"    : "clear",
      "keypress .edit"    : "updateOnEnter",
      "blur .edit"        : "close"
    },
    
    initialize: function(options) {
      // console.log('streamerview intialize');
      this.model.bind('change', this.render, this);
      this.model.bind('destroy', this.remove, this);
      this.model.bind('change:online', this.unrender, this);
      this.toggle_unrender = false || options.toggle_unrender;
    },
    
    render: function() {
      // console.log('streamerview render');
      this.$el.html(this.template(this.model.toJSON()));
      this.$el.toggleClass('online', this.model.get('online'));
      this.$el.toggleClass('offline', !this.model.get('online'));
      this.input = this.$('.edit');
      return this;
    },
    
    toggleOnline: function() {
      this.model.toggle();
    },
    
    edit: function() {
      this.$el.addClass("editing");
      this.input.focus();
    },
    
    close: function() {
      var value = this.input.val();
      if (!value) this.clear();
      this.model.save({name: value});
      this.$el.removeClass("editing");
    },
    
    updateOnEnter: function(e) {
      if (e.keyCode == 13) this.close();
    },
    
    clear: function() {
      console.log('clear streamer');
      this.model.clear();
    },
    
    unrender: function() {
      if (this.toggle_unrender) {
        console.log('unrender');
        this.remove();
      }
    }
  });
  
  var StreamerGroupView = Backbone.View.extend({
    el: $('#group-all'),
    events: {
      "click    .toggle-group"    : "toggleGroup"
    },
    
    initialize: function(options) {
      console.log('streamer group initialize');
      _.bindAll(this, 'addStreamer', 'addAllStreamers', 'render');
      
      // initialize option el
      this.el = this.options.el;
      
      this.header = this.$('.header', this.el);
      this.count = this.$('.count', this.el);
      this.toggle = this.$('.toggle-group', this.el);
      this.list = this.$('ul.list', this.el);
      this.collection = this.options.collection;
      this.filter = '' || this.options.filter;
      
      console.log('filter:'+this.filter);

      this.collection.bind('add', this.addStreamer, this);
      this.collection.bind('reset', this.addAllStreamers, this);
      this.collection.bind('all', this.render, this);
    },
    
    render: function() {
      console.log('streamer group render');
      var streamer_count = (this.filter == 'online' ? this.collection.online() 
      : this.filter == 'offline' ? this.collection.offline() 
      : this.collection).length;
      
      this.count.html(streamer_count);
    },
    
    addStreamer: function(streamer) {
      if (this.filter != '' && ( (this.filter == 'online' && streamer.get('online')) || (this.filter == 'offline' && !streamer.get('online'))  )) {
        console.log('add streamer filter ' + this.filter);
        var view = new StreamerView({model: streamer, toggle_unrender: true});
        this.$('ul', this.el).append(view.render().el);
      }
      else if(this.filter == '') {
        console.log('add streamer none');
        var view_all = new StreamerView({model: streamer});
        this.$('ul', this.el).append(view_all.render().el);
      }
    },
    
    addAllStreamers: function() {
      console.log('add all streamers');
      if (this.filter == 'online') {
        console.log('add streamers online');
        // _.each(this.collection.online(), this.addStreamer);
        this.collection.online().each(this.addStreamer);
      }
      else if (this.filter == 'offline') {
        console.log('add streamers offline');
        // _.each(this.collection.offline(), this.addStreamer);
        this.collection.offline().each(this.addStreamer);
      }
      else {
        console.log('add streamers none');
        this.collection.each(this.addStreamer);
      }
    },
    
    toggleGroup: function() {
      this.$el.toggleClass("collapsed");
    }
  });
  
  var LoLAppView = Backbone.View.extend({
    el: $('#lolapp'),
    statsTemplate: _.template($('#stats-template').html()),
    events: {
      "keypress #new-streamer"    : "createOnEnter",
    },
    
    initialize: function() {
      // console.log('appview intialize');
      this.input = this.$("#new-streamer");
      
      this.Streamers = new StreamerList;
      
      //Streamers.bind('add', this.addOne, this);
      //Streamers.bind('reset', this.addAll, this);
      //Streamers.bind('all', this.render, this);
      this.Streamers.bind('change:online', this.updateList, this);
      
      this.footer = this.$('footer');
      this.main = $('#main');
      this.group_all = $('#group-all');
      
      this.all_streamers = new StreamerGroupView({ el: this.$('#group-all'), collection: this.Streamers, filter: '' });
      this.offline_streamers = new StreamerGroupView({ el: this.$('#group-offline'), collection: this.Streamers, filter: 'offline' });
      this.online_streamers = new StreamerGroupView({ el: this.$('#group-online'), collection: this.Streamers, filter: 'online' });

      this.Streamers.fetch();
    },
    
    render: function() {
      // console.log('appview render');
      var online = Streamers.online().length;
      var offline = Streamers.offline().length
      var all = Streamers.length;
      
      if(Streamers.length) {
        this.main.show();
        this.footer.show();
        this.footer.html(this.statsTemplate({online: online, offline: offline}));
        $('.count', this.group_all).html(all);
      } else {
        this.main.hide();
        this.footer.hide();
      }
    },
    
    addOne: function(streamer) {
      console.log('addone');
      var view_all = new StreamerView({model: streamer});
      // this.$('#streamer-list').append(view_all.render().el);
    },
    
    addAll: function() {
      console.log('addall');
      // Populate all list
      // Streamers.each(this.addOne);
      
      // Populate online/offline list
      // Streamers.each(this.updateList);
    },
    
    updateList: function(streamer) {
      console.log('app update list:'+streamer.get('name'));
      var view = new StreamerView({model: streamer});
      if(streamer.get('online') === true) {
        this.online_streamers.addStreamer(streamer);
      } else {
        this.offline_streamers.addStreamer(streamer);
      }
    
      //this.$('#offline-list li.online').remove();
      //this.$('#online-list li.offline').remove();
    },
    
    createOnEnter: function(e) {
      if (e.keyCode != 13) return;
      if (!this.input.val()) return;
      
      this.Streamers.create({name: this.input.val()});
      this.input.val('');
    },

  });
  
  var App = new LoLAppView;
  
});