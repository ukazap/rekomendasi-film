var lokasi_dataset = "dataset/ml-latest-small/";
var links, movies, ratings, tags, titles;
var req1 = $.get(lokasi_dataset+"links.csv", function(data){ links = $.csv.toObjects(data); });
var req2 = $.get(lokasi_dataset+"ratings.csv", function(data){ ratings = $.csv.toObjects(data); });
var req3 = $.get(lokasi_dataset+"tags.csv", function(data){ tags = $.csv.toObjects(data); });
var req4 = $.get(lokasi_dataset+"movies.csv", function(data){ movies = $.csv.toObjects(data); });

$.when(req1, req2, req3, req4).done(function() {
  titles = movies.map(function(movie) { return movie.title; });
  $("#input-judul").autocomplete({
    source: [titles],
    limit: 15
  });
  $("#loading").fadeOut();
  $("#input-judul").removeAttr("disabled");
  $("#button-tambah").removeAttr("disabled");
  $("#input-judul").val("");
});

function hapus(nomorItem) {
  $("#item"+nomorItem).remove();
}

$("#button-tambah").click(function() {
  $(".list-group-item .judul[text='Sabrina (1995)']")
  var nomor;
  if ($(".list-group-item").length == 0) {
    nomor = "0";
  }
  else {
    nomor = Number($(".list-group-item").last().attr("id").replace("item", "")) + 1;
  }

  var inputJudul = $("#input-judul").val().trim();
  if (inputJudul != "" && $(".judul:contains('"+inputJudul+"')").length == 0) {
    $("#film-pengguna").append("<li class='list-group-item' id='item"+nomor+"'><span class='judul'>"+inputJudul+"</span><div class='pull-xs-right'><input type='number' class='rating form-control' min='0' value='0' max='5' step='0.1'><button class='btn btn-sm btn-danger' onclick='hapus("+nomor+");'>x</button>");
  }

  $("#input-judul").val("");
});