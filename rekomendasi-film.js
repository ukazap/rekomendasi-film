var lokasi_dataset = "dataset/ml-latest-small/";
var links, movies, ratings, tags;
var req1 = $.get(lokasi_dataset+"links.csv", function(data){ links = $.csv.toObjects(data); });
var req2 = $.get(lokasi_dataset+"ratings.csv", function(data){ ratings = $.csv.toObjects(data); });
var req3 = $.get(lokasi_dataset+"tags.csv", function(data){ tags = $.csv.toObjects(data); });
var req4 = $.get(lokasi_dataset+"movies.csv", function(data){ movies = $.csv.toObjects(data); });

$.when(req1, req2, req3, req4).done(function() {
  $("#input-judul").autocomplete({
    source: [movies.map(function(movie) { return movie.title; })],
    limit: 15
  });
  $("#loading").fadeOut();
  $("#input-judul").removeAttr("disabled");
  $("#button-tambah").removeAttr("disabled");
  $("#input-judul").val("");
});