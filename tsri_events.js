/**
 * Created by tobiasba on 12/3/16.
 */
var request = require('superagent');

request.get('https://tsri.ch/api/v0/agenda/').auth('tobias.s.bachmann@gmail.com', 'figgdi13').end(function(err,res){
    console.log(res.body)
});