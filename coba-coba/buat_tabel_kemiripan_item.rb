require 'CSV'
require './recommendations.rb'

file_csv, mulai = ARGV
mulai = mulai.to_i

preferensi = {}

puts "menyusun preferensi..."

CSV.foreach(file_csv, headers: true) do |baris|
  userId  = baris["userId"].to_i
  movieId = baris["movieId"].to_i
  preferensi[userId] ||= {}
  preferensi[userId][movieId] = baris["rating"].to_f
end
  
puts "transformasi preferensi..."
films = transform_prefs(preferensi)

puts "menyusun tabel kemiripan (mulai #{mulai})..."
CSV.open(file_csv.gsub(".csv", "-kemiripan-pearson.csv"), "a") do |io|
  io << ["id_film", "id_film_lain", "kemiripan"] if mulai.zero?
  c = 0
  films.keys.each do |item|
    c += 1
    next if c < mulai
    skor = top_matches(films, item, 10, :sim_pearson)
    skor.each do |kemiripan, item_lain|
      io << [item, item_lain, kemiripan]
    end
    print "\r#{c} / #{films.length}"
  end
end