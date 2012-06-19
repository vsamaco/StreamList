$(function(){
  
  var Streamer = Backbone.Model.extend({
    defaults: function() {
      return {
        name: "",
        stream: "",
        viewers: 0,
        online: true
      };
    },
    
    initialize: function() {
      console.log('streamer initialize');
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
    }
  });
  
  var Streamers = new StreamerList;
  
  var StreamerView = Backbone.View.extend({
    tagName: "li",
    template: _.template($('#streamer-template').html()),
    events: {
      "click .toggle"     : "toggleOnline",
      "dblclick .view"    : "edit",
      "click a.destroy"   : "clear",
      "keypress .edit"    : "updateOnEnter",
      "blur .edit"        : "close"
    },
    
    initialize: function() {
      console.log('streamerview intialize');
      this.model.bind('change', this.render, this);
      this.model.bind('destroy', this.remove, this);
    },
    
    render: function() {
      console.log('streamerview render');
      this.$el.html(this.template(this.model.toJSON()));
      this.$el.toggleClass('online', this.model.get('online'));
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
      this.model.clear();
    }
  });
  
  var LoLAppView = Backbone.View.extend({
    el: $('#lolapp'),
    statsTemplate: _.template($('#stats-template').html()),
    events: {
      "keypress #new-streamer"    : "createOnEnter"
    },
    
    initialize: function() {
      console.log('appview intialize');
      this.input = this.$("#new-streamer");
      
      Streamers.bind('add', this.addOne, this);
      Streamers.bind('reset', this.addAll, this);
      Streamers.bind('all', this.render, this);
      
      this.footer = this.$('footer');
      this.main = $('#main');
      
      Streamers.fetch();
    },
    
    render: function() {
      console.log('appview render');
      var online = Streamers.online().length;
      
      if(Streamers.length) {
        this.main.show();
        this.footer.show();
        this.footer.html(this.statsTemplate({online: online}));
      } else {
        this.main.hide();
        this.footer.hide();
      }
    },
    
    addOne: function(streamer) {
      console.log('addone');
      var view = new StreamerView({model: streamer});
      this.$('#streamer-list').append(view.render().el);
    },
    
    addAll: function() {
      Streamers.each(this.addOne);
    },
    
    createOnEnter: function(e) {
      if (e.keyCode != 13) return;
      if (!this.input.val()) return;
      
      Streamers.create({name: this.input.val()});
      this.input.val('');
    }
  });
  
  var App = new LoLAppView;
  
});