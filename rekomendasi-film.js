// AMBIL DATA
// ==========
var lokasiDataset = "dataset/ml-latest-small/";
var pakaiEuclidean = window.location.hash.contains("#euclidean");
var movies, tags, links, autocompleteTitles;
var kemiripanItem = [];
var req1 = $.get(lokasiDataset+"movies.csv", function(data){ movies = $.csv.toArrays(data); });
var req2 = $.get(lokasiDataset+"tags.csv", function(data){ tags = $.csv.toArrays(data); });
var req3 = $.get(lokasiDataset+"links.csv", function(data){ links = $.csv.toArrays(data); });
var req4 = $.get(lokasiDataset+(pakaiEuclidean ? "kemiripan-euclidean.csv" : "kemiripan.csv"), function(data){ 
  $.csv.toArrays(data).slice(1).forEach(function(row) {
    var idFilm = row[0];
    if (typeof(kemiripanItem[idFilm]) == "undefined") { kemiripanItem[idFilm] = []; }
    kemiripanItem[idFilm].push([row[1], row[2]]); // kemiripanItem[idFilm][idFilmLain][nilai]
  });
});

$.when(req1, req2, req3, req4).done(function() {
  autocompleteTitles = movies.slice(1).map(function(movie) { return movie[1]; });
  $("#input-judul").autocomplete({
    source: [autocompleteTitles],
    limit: 10
  });
  // loading selesai
  $("#loading").fadeOut();
  $("#input-judul").removeAttr("disabled");
  $("#button-tambah").removeAttr("disabled");
  $("#input-judul").val("");
});

// TAMBAH & HAPUS FILM
// ===================
function hapus(nomorItem) {
  $("#item"+nomorItem).remove();
  $("#film-pengguna").change();
}

$("#button-reset").click(function() {
  $("#input-judul").val("");
  $("#film-pengguna").empty();
  $("#film-pengguna").change();
});

$("#button-tambah").click(function() {
  var inputJudul  = $("#input-judul").val().trim();
  var judulnyaIni = $(".judul:contains(\""+inputJudul+"\")");
  if (inputJudul != "" && autocompleteTitles.indexOf(inputJudul) != -1 && judulnyaIni.length == 0) {
    var nomor = movies.find(function(m){ return m[1] == inputJudul })[0]
    $("#film-pengguna").append("<li class='list-group-item form-inline' id='item"+nomor+"'><span class='judul'>"+inputJudul+"</span><div class='pull-xs-right'><input type='number' id='rating"+nomor+"' class='form-control' min='0.5' value='0.5' max='5' step='0.5'><button class='btn btn-sm btn-danger form-control' onclick='hapus("+nomor+");'>x</button></li>");
  }
  $("#input-judul").val("");
  $("#film-pengguna").change();
});

$("#film-pengguna").change(function() {
  if ($("#film-pengguna li").length == 0) {
    $("#film-rekomendasi").empty();
    $("#button-reset").hide();
    $(".card-rekomendasi").hide();
  } else {
    $("#button-reset").show();
    $(".card-rekomendasi").show();
  }
});


// CARI REKOMENDASI
// ================
function cariRekomendasi(ratingPengguna, kemiripanItem) {
  scores = {}
  totalKemiripan = {}
  // Looping item2 yang di-rating oleh pengguna
  ratingPengguna.forEach(function(r) {
    var item = r[0], rating = r[1];
    // Looping item2 yang mirip
    kemiripanItem[item].forEach(function(k) {
      var item2 = k[0], kemiripan = k[1];
      // Abaikan bila pengguna sudah me-rating item ini
      if (ratingPengguna.find(function(ir){  return ir[0] == item2 }) != 1) {
        // Jumlah bobot kemiripan dikali kemiripan
        scores[item2] || (scores[item2] = 0)
        scores[item2] += kemiripan * rating;
        // Jumlah seluruh kemiripan
        totalKemiripan[item2] || (totalKemiripan[item2] = 0)
        totalKemiripan[item2] += kemiripan
      }
    });
  });
  // Bagi setiap total scores dengan total bobot kemiripan u/ memperoleh rata-rata
  var ranking = [];
  for (item in scores) {
    ranking.push([item, scores[item] / totalKemiripan[item]]);
  }
  // Return ranking (urut tinggi-rendah)
  return ranking.sort(function(r1,r2) { return r1[1] < r2[1] });
}

$("#button-cari").click(function() {
  $("#film-rekomendasi").empty();
  var preferensi = []
  $("#film-pengguna li").each(function() {
    var id = $(this).attr("id").replace("item","");
    var rating = $("#rating"+id).val();
    preferensi.push([id, rating]);
  });
  var rekomendasi = cariRekomendasi(preferensi, kemiripanItem);
  rekomendasi.forEach(function(item) {
    var film = movies.find(function(m){ return m[0] == item[0] });
    var idImdb = links.find(function(l){ return l[0] == item[0] })[1];
    var judul = film[1], genre = film[2].replace(/\|/g, ", ");
    $("#film-rekomendasi").append("<li class='list-group-item'><a href='http://www.imdb.com/title/tt"+idImdb+"/' target='_blank'>"+judul+"</a><div class='pull-xs-center'><small>"+genre+"</small></div></li>");
  })
});

$(document).ready(function(){
  if (window.location.protocol == "file:") {
    alert("APLIKASI HARUS DITARUH DI SERVER! (apache, apa lah, dsb.)");
  }
  else if (window.location.host != "localhost") {
    alert("DISCLAIMER:\nIni aplikasi asal-asalan."); // http://ukazap.js.org/rekomendasi-film
  }

  if (pakaiEuclidean) {
    $("#ganti-metode").attr("href", "#pearson");
    $("#metode").text("Euclidean Distance");
  } else {
    $("#metode").text("Pearson Correlation Coefficient");
  }
});