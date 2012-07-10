$(function(){
  
  window.Streamer = Backbone.Model.extend({
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
      this.save({online: !this.get('online'), viewers: 0});
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
  
  var StreamerView = Backbone.View.extend({
    tagName: "li",
    template: _.template($('#streamer-template').html()),
    events: {
      "click .toggle"     : "toggleOnline",
      "dblclick .view"    : "edit",
      "click a.remove"    : "clear",
      "click .sync"       : "sync",
      "click .close"      : "close",
      "click .save"       : "save"
    },
    
    initialize: function() {
      _.bindAll(this,'sync');
      // console.log('streamerview intialize');
      this.model.bind('change', this.render, this);
      this.model.bind('destroy', this.remove, this);
      this.model.bind('change:online', this.unrender, this);
      this.toggle_unrender = false || this.options.toggle_unrender;
    },
    
    render: function() {
      // console.log('streamerview render');
      this.$el.html(this.template(this.model.toJSON()));
      this.$el.toggleClass('online', this.model.get('online'));
      this.$el.toggleClass('offline', !this.model.get('online'));
      this.inputName = this.$('.editName');
      this.inputViewers = this.$('.editViewers');
      this.closeButton = this.$('.close');
      this.saveButton = this.$('.save');
      return this;
    },
    
    toggleOnline: function() {
      this.model.toggle();
    },
    
    edit: function() {
      this.$el.addClass("editing");
      this.inputName.focus();
    },
    
    close: function() {
      this.$el.removeClass("editing");
    },
    
    save: function() {
      var name_value = this.inputName.val();
      var viewer_value = this.inputViewers.val();
      
      if (!name_value) this.clear();
      
      this.model.save({name: name_value, viewers: viewer_value});
      
      this.close();
    },
    
    sync: function() {
      var self = this;
      console.log('sync');
      var pageUrl = 'http://api.justin.tv/api/stream/list.json?jsonp=syncStreamer&channel=' + this.model.get('name');
      
      $.ajax({
        url: pageUrl,
        dataType: "jsonp",
        jsonpCallback: 'syncStreamer',
        success: function(data) {
          console.log('ajax success');
          var count = data[0].channel_count;
          self.inputViewers.val(count);
        },
        error: function(error) {
          console.log('ajax error');
          self.inputViewers.val(0);
        }
      });
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
    tagName: 'section',
    className: 'group',
    template: _.template($('#streamer-group').html()),
    events: {
      "click    .toggle-group"    : "toggleGroup"
    },
    
    initialize: function() {
      // console.log('streamer group initialize');
      _.bindAll(this, 'addStreamer', 'addAllStreamers', 'render');

      this.title = this.options.title;
      this.header = this.$('.header');
      this.count = this.$('.count');
      this.toggle = this.$('.toggle-group');
      this.list = this.$('ul.list');

      this.collection.bind('add', this.addStreamer);
      this.collection.bind('reset', this.addAllStreamers);
      this.collection.bind('all', this.render);
    },
    
    render: function() {
      // console.log('streamer group render');
      var streamer_count = this.collection.length;
      
      $(this.el).html(this.template({title: this.title}));
      
      this.$(".count").html(streamer_count);
      
      this.collection.each(this.addStreamer);
      
      return this;
    },
    
    addStreamer: function(streamer) {
      // console.log('add streamer none');
      var view_all = new StreamerView({model: streamer});
      this.$('ul').append(view_all.render().el);
    },
    
    addAllStreamers: function() {
      // console.log('add all');
      this.collection.each(this.addStreamer);
    },
    
    toggleGroup: function() {
      this.$el.toggleClass("collapsed");
    }
  });
  
  var FilteredStreamerGroupView = StreamerGroupView.extend({
    initialize: function() {
      _.bindAll(this, 'addStreamer', 'render');
      
      this.collection.bind('change:online', this.addStreamer);
      
      this.online = this.options.online;
      
      StreamerGroupView.prototype.initialize.apply(this, this.options);
    },
    
    render: function() {
      var streamer_count = (this.online === true ? this.collection.online() 
      : this.collection.offline()).length;
      
      $(this.el).html(this.template({title: this.title}));
      
      this.$(".count").html(streamer_count);
      
      this.collection.each(this.addStreamer);
      
      return this;
    },
    
    addStreamer: function(streamer) {
      if(this.online === streamer.get('online')) {
        var view = new StreamerView({model: streamer, toggle_unrender: true});
        this.$('ul').append(view.render().el);
      }
    }
  });
  
  
  var Playlist = Backbone.Collection.extend({
    model: Streamer
  });
  
  window.Player = Backbone.Model.extend({
    defaults: {
      'currentStreamerIndex': 0,
      'state':  'stop'
    },
    initialize: function() {
      this.playlist = new Playlist();
    },
    play: function() {
      
    },
    stop: function() {
      
    },
    isPlaying: function() {
      
    },
    isStopped: function() {
      
    },
    currentStream: function() {
      
    }
  });
  
  var PlaylistStreamerView = Backbone.View.extend({
    tagName: 'li',
    className: 'streamer',
    template: ''
  });
  
  var PlaylistView = Backbone.View.extend({
    tagName: 'section',
    className: 'playlist',
    template: _.template($('#playlist-template').html()),
    
    events: {
      'click .play' : '',
      'click .pause': '',
      'click .next' : '',
      'click .prev' : '',
    },
    
    initialize: function() {
      this.player = this.options.player;
      this.collection = this.options.collection;
      
      this.collection.bind('reset', this.render);
      this.collection.bind('add', this.renderStreamer);
    },
    
    render: function() {
      $(this.el).html(this.template(this.player.toJSON()));
      this.collection.each(this.renderStreamer);
      
      return this;
    },
    
    renderStreamer: function() {
      var view = new PlaylistStreamerView({
        model: streamer,
        player: this.player,
        playlist: this.collection
      });
      
      this.$("ul").append(view.render().el);
    }
  });
  
  var LibraryView = Backbone.View.extend({
    el: $('#lolapp'),
    template: _.template($("#library-template").html()),
    statsTemplate: _.template($('#stats-template').html()),
    events: {
      "keypress #new-streamer"    : "createOnEnter"
    },
    
    initialize: function() {
      // console.log('appview intialize');
      _.bindAll(this, 'render');
      this.collection.bind('reset', this.render);
      
      this.footer = this.$('footer');
      this.main = $('#main');
      this.group_all = $('#group-all');
      
      //this.all_streamers = new StreamerGroupView({ el: this.$('#group-all'), collection: this.collection, filter: '' });
      //this.offline_streamers = new FilteredStreamerGroupView({ el: this.$('#group-offline'), collection: this.collection, filter: 'offline', online: false });
      //this.online_streamers = new FilteredStreamerGroupView({ el: this.$('#group-online'), collection: this.collection, filter: 'online', online: true });
      
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

      $(this.el).html(this.template({}));
      var all_view = new StreamerGroupView({ id: 'group-all', collection: this.collection, title: 'All', filter: '' });
      this.$('#main').append(all_view.render().el);
      
      var online_view = new FilteredStreamerGroupView({ id: 'group-online', collection: this.collection, title: 'Online', filter: 'online', online: true });
      this.$('#main').append(online_view.render().el);
      
      var offline_view = new FilteredStreamerGroupView({ id: 'group-offline', collection: this.collection, title: 'Offline', filter: 'offline', online: false });
      this.$('#main').append(offline_view.render().el);
      
      return this;
    },
    
    createOnEnter: function(e) {
      $input = this.$('#new-streamer');
      
      if (e.keyCode != 13) return;
      if (!$input.val()) return;
      
      this.collection.create({name: $input.val()});
      $input.val('');
    },

  });
  
  var Streamers = new StreamerList;
  var App = new LibraryView({collection: Streamers});
  Streamers.fetch();
  
});

function syncStreamer(data) {
  console.log('sync callback');
}
