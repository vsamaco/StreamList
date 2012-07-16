var streamerData = [{
  "name": "scarra",
  "online": false
}, {
  "name": "theoddone",
  "online": true
}];

describe("Streamer", function() {
  beforeEach(function() {
    this.streamer = new Streamer(streamerData[0]);
  });
  
  it("should create from data", function () {
    expect(this.streamer.get('name')).toEqual("scarra");
    expect(this.streamer.get('online')).toBeFalsy();
  });
  
});

describe("ExploreList", function() {
  beforeEach(function() {
    this.streamer1 = new Backbone.Model({"name": "dyrus", "viewers": 1000});
    this.streamer2 = new Backbone.Model({"name": "chaox", "viewers": 200});
    this.streamer3 = new Backbone.Model({"name": "theoddone", "viewers": 5000});
    
    this.list = new ExploreList;
  });
  
  it("should order models by viewer count descending", function() {
    this.list.add([this.streamer1, this.streamer2, this.streamer3]);
    this.list.sort();
    expect(this.list.at(0)).toBe(this.streamer3);
    expect(this.list.at(1)).toBe(this.streamer1);
    expect(this.list.at(2)).toBe(this.streamer2);
    
  });
})