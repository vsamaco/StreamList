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