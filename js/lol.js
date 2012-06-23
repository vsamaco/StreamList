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
      return this.filter(function(streamer){ return streamer.get('online'); });
    },
    offline: function() {
      return this.filter(function(streamer){ return !streamer.get('online'); });
    }
  });
  
  var Streamers = new StreamerList;
  
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
    
    initialize: function() {
      // console.log('streamerview intialize');
      this.model.bind('change', this.render, this);
      this.model.bind('destroy', this.remove, this);
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
    }
  });
  
  var StreamerGroupView = Backbone.View.extend({
    el: $('#group-all'),
    events: {
      "click    .toggle-group"    : "toggleGroup"
    },
    
    initialize: function(options) {
      console.log('streamer group initialize');
      this.header = this.$('.header');
      this.count = this.$('.count');
      this.toggle = this.$('.toggle-group');
      this.list = this.$('ul.list');
      
      Streamers.bind('add', this.addStreamer, this);
      Streamers.bind('reset', this.addAllStreamers, this);
      Streamers.bind('all', this.render, this);
    },
    
    render: function() {
      console.log('streamer group render');
      var streamer_count = Streamers.length;
      
      this.count.html(streamer_count);
    },
    
    addStreamer: function(streamer) {
      console.log('add streamer');
      var view_all = new StreamerView({model: streamer});
      this.$('#streamer-list').append(view_all.render().el);
    },
    
    addAllStreamers: function() {
      Streamers.each(this.addStreamer);
    },
    
    toggleGroup: function() {
      this.$el.toggleClass("collapsed");
    }
  });
  
  var OfflineStreamerGroupView = StreamerGroupView.extend({
    el: $('group-offline'),
    addStreamer: function(streamer) {
      console.log('add offline streamer');
      var view = new StreamerView({model: streamer});
      this.$('#offline-list').append(view.render().el);
    },
    addAllStreamers: function() {
      _.each(Streamers.offline(), this.addStreamer);
    },
    updateList: function(streamer) {
      console.log('update list:'+ streamer.get('name'));
      if(streamer.get('online') === false) {
        this.addStreamer(streamer);
      }
      
      this.$('#offline-list li.online').remove();
    }
  });
  
  var OnlineStreamerGroupView = OfflineStreamerGroupView.extend({
    el: $('group-online'),
        
    addStreamer: function(streamer) {
      console.log('add online streamer');
      var view = new StreamerView({model: streamer});
      this.$('#online-list').append(view.render().el);
    },
    addAllStreamers: function() {
      _.each(Streamers.online(), this.addStreamer);
    },
    updateList: function(streamer) {
      console.log('update list:'+ streamer.get('name'));
      if(streamer.get('online') == true) {
        this.addStreamer(streamer);
      }
      
      this.$('#online-list li.offline').remove();
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
      
      //Streamers.bind('add', this.addOne, this);
      //Streamers.bind('reset', this.addAll, this);
      //Streamers.bind('all', this.render, this);
      Streamers.bind('change:online', this.updateList, this);
      
      this.footer = this.$('footer');
      this.main = $('#main');
      this.group_all = $('#group-all');
      
      this.all_streamers = new StreamerGroupView();
      this.offline_streamers = new OfflineStreamerGroupView();
      this.online_streamers = new OnlineStreamerGroupView();
      //this.offline_streamers = new StreamerGroupView({ el: this.$('#group-offline') });
      
      Streamers.fetch();
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
    
      this.$('#offline-list li.online').remove();
      this.$('#online-list li.offline').remove();
    },
    
    createOnEnter: function(e) {
      if (e.keyCode != 13) return;
      if (!this.input.val()) return;
      
      Streamers.create({name: this.input.val()});
      this.input.val('');
    },

  });
  
  var App = new LoLAppView;
  
});