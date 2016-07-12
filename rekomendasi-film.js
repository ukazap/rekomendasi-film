// AMBIL DATA
// ==========
var lokasiDataset = "dataset/ml-latest-small/";
var pakaiEuclidean = window.location.hash.contains("#euclidean");
var movies, tags, links, autocompleteTitles;
var kemiripanItem = [];
var preferensi = {};
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
  $("#input-judul").removeAttr("disabled");
  $("#button-tambah").removeAttr("disabled");
  $("#loading").remove();

  // baca localStorage
  if (localStorage.getItem("preferensi") != null) {
    preferensi = JSON.parse(localStorage.getItem("preferensi"));
    for (nomor in preferensi) {
      var inputJudul = movies.find(function(m){ return m[0] == nomor })[1];
      tambahFilmPengguna(inputJudul);
    }
    $("#button-cari").click();
  }
});

// TAMBAH & HAPUS FILM
// ===================
function tambahFilmPengguna(inputJudul) {
  var judulnyaIni = $(".judul:contains(\""+inputJudul+"\")");
  if (inputJudul != "" && autocompleteTitles.indexOf(inputJudul) != -1 && judulnyaIni.length == 0) {
    var f = movies.find(function(m){ return m[1] == inputJudul });
    var nomor = f[0], genre = f[2].replace(/\|/g, ", ");
    var idImdb = links.find(function(l){ return l[0] == nomor })[1];
    $("#film-pengguna").append("\
      <li class='list-group-item' id='item"+nomor+"'>\
        <div class='form-inline'>\
          <a class='judul' href='http://www.imdb.com/title/"+idImdb+"/' target='_blank'>"+inputJudul+"</a>\
          <div class='pull-xs-right'>\
            <input class='form-control' id='rating"+nomor+"' min='0.5' value='0.5' max='5' step='0.5' onchange='ubahRating("+nomor+")' type='number'>\
            <button class='btn btn-sm btn-danger' onclick='hapus("+nomor+")'>x</button>\
          </div>\
        </div>\
        <small>"+genre+"</small>\
      </li>");
    preferensi[nomor] = 0.5;
    localStorage.setItem("preferensi", JSON.stringify(preferensi));
    $("#film-pengguna").change();
    return true;
  }
  return false;
}

$("#button-tambah").click(function() {
  var inputJudul  = $("#input-judul").val().trim();
  if (tambahFilmPengguna(inputJudul)) {
    $("#input-judul").val("");
  } else {
    alert("Isi judul yang benar!");
    $("#input-judul").focus();
  }
});

function tambahDariRekomendasi(id) {
  var inputJudul = movies.find(function(m){ return m[0] == id })[1];
  tambahFilmPengguna(inputJudul);
}

function ubahRating(nomorItem, rating) {
  preferensi[nomorItem] = Number($("#rating"+nomorItem).val());
  localStorage.setItem("preferensi", JSON.stringify(preferensi));
}

function hapus(nomorItem) {
  $("#item"+nomorItem).remove();
  delete preferensi[nomorItem];
  $("#film-pengguna").change();
}

$("#button-reset").click(function() {
  if (confirm("Hapus semua film?")) {
    if (confirm("YAKIN?")) {
      $("#input-judul").val("");
      $("#film-pengguna").empty();
      $("#film-pengguna").change();
    }
  }
});

$("#film-pengguna").change(function() {
  if ($("#film-pengguna li").length == 0) {
    $("#film-rekomendasi").empty();
    preferensi = {};
    localStorage.removeItem("preferensi");
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
  scores = {};
  totalKemiripan = {};
  // Looping item2 yang di-rating oleh pengguna
  for (r in ratingPengguna) {
    var item = r, rating = ratingPengguna[r];
    // Looping item2 yang mirip
    kemiripanItem[item].forEach(function(k) {
      var item2 = k[0], kemiripan = k[1];
      // Abaikan bila pengguna sudah me-rating item ini
      if (!ratingPengguna.hasOwnProperty(item2)) {
        // Jumlah bobot kemiripan dikali kemiripan
        scores[item2] || (scores[item2] = 0);
        scores[item2] += kemiripan * rating;
        // Jumlah seluruh kemiripan
        totalKemiripan[item2] || (totalKemiripan[item2] = 0);
        totalKemiripan[item2] += kemiripan;
      }
    });
  }

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
  var rekomendasi = cariRekomendasi(preferensi, kemiripanItem);
  rekomendasi.forEach(function(item) {
    var film = movies.find(function(m){ return m[0] == item[0] });
    var idImdb = links.find(function(l){ return l[0] == item[0] })[1];
    var judul = film[1], genre = film[2].replace(/\|/g, ", ");
    $("#film-rekomendasi").append("<li class='list-group-item'><button class='btn btn-primary form-inline pull-xs-right' onclick='tambahDariRekomendasi("+film[0]+")'>+</button><a href='http://www.imdb.com/title/tt"+idImdb+"/' target='_blank'>"+judul+"</a><br><small>"+genre+"</small></li>");
  });
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