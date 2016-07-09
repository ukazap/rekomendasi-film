# A dictionary of movie critics and their ratings of a small
# set of movies
@critics = {
  'Lisa Rose' => {
    'Lady in the Water' => 2.5,
    'Snakes on a Plane' => 3.5,
    'Just My Luck' => 3.0,
    'Superman Returns' => 3.5,
    'You, Me and Dupree' => 2.5,
    'The Night Listener' => 3.0 },
  'Gene Seymour' => {
    'Lady in the Water' => 3.0,
    'Snakes on a Plane' => 3.5,
    'Just My Luck' => 1.5,
    'Superman Returns' => 5.0,
    'The Night Listener' => 3.0,
    'You, Me and Dupree' => 3.5 },
  'Michael Phillips' => {
    'Lady in the Water' => 2.5,
    'Snakes on a Plane' => 3.0,
    'Superman Returns' => 3.5,
    'The Night Listener' => 4.0 },
  'Claudia Puig' => {
    'Snakes on a Plane' => 3.5,
    'Just My Luck' => 3.0,
    'The Night Listener' => 4.5,
    'Superman Returns' => 4.0,
    'You, Me and Dupree' => 2.5 },
  'Mick LaSalle' => {
    'Lady in the Water' => 3.0,
    'Snakes on a Plane' => 4.0,
    'Just My Luck' => 2.0,
    'Superman Returns' => 3.0,
    'The Night Listener' => 3.0,
    'You, Me and Dupree' => 2.0 },
  'Jack Matthews' => {
    'Lady in the Water' => 3.0,
    'Snakes on a Plane' => 4.0,
    'The Night Listener' => 3.0,
    'Superman Returns' => 5.0,
    'You, Me and Dupree' => 3.5 },
  'Toby' => {
    'Snakes on a Plane' => 4.5,
    'You, Me and Dupree' => 1.0,
    'Superman Returns' => 4.0 }
}


# Returns a distance-based similarity score for person1 and person2
def sim_distance(prefs, person1, person2)
  # Get the list of shared_items
  si = prefs[person1].keys & prefs[person2].keys

  # if they have no ratings in common, return 0
  return 0 if si.empty?

  # Add up the squares of all the differences
  sum_of_squares = 0
  si.each {|item| sum_of_squares += ((prefs[person1][item] - prefs[person2][item]) ** 2) }
  return 1 / (1 + sum_of_squares)
end

# Returns the Pearson correlation coefficient for p1 and p2
def sim_pearson(prefs, p1, p2)
  # Get the list of mutually rated items
  si = prefs[p1].keys & prefs[p2].keys

  # Find the number of elements
  n = si.length

  # if they are no ratings in common, return 0
  return 0 if n.zero?

  # Add up all the preferences
  sum1 = si.inject(0) { |sum, it| sum + prefs[p1][it] }
  sum2 = si.inject(0) { |sum, it| sum + prefs[p2][it] }

  # Sum up the squares
  sum1Sq = si.inject(0) { |sum, it| sum + (prefs[p1][it] ** 2) }
  sum2Sq = si.inject(0) { |sum, it| sum + (prefs[p2][it] ** 2) }

  # Sum up the products
  pSum = si.inject(0) { |sum, it| sum + (prefs[p1][it] * prefs[p2][it]) }

  # Calculate Pearson score
  num = pSum - (sum1 * sum2 / n)
  den = Math.sqrt((sum1Sq - (sum1 ** 2) / n) * (sum2Sq - (sum2 ** 2) / n))
  return 0 if den.zero?

  r = num / den
end

# Returns the best matches for person from the prefs dictionary.
# Number of results and similarity function are optional params.
def top_matches(prefs, person, n=5, similarity=:sim_pearson)
  others = prefs.keys - [person]
  scores = others.map { |o| [method(similarity).call(prefs, person, o), o] }
  scores.sort.reverse[0,n]
end

# Gets recommendations for a person by using a weighted average
# of every other user's rankings
def get_recommendations(prefs, person, similarity=:sim_pearson)
  totals = {}
  sim_sums = {}
  prefs.keys.each do |other|
    # don't compare me to myself
    next if other == person
    sim = method(similarity).call(prefs, person, other)

    # ignore scores of zero or lower
    next if sim <= 0
    prefs[other].keys.each do |item|
      # only score movies I haven't seen yet
      if !prefs[person].keys.include?(item) or prefs[person][item].zero?
        # Similarity * Score
        totals[item] ||= 0
        totals[item] += prefs[other][item] * sim
        # Sum of similarities
        sim_sums[item] ||= 0
        sim_sums[item] += sim
      end
    end
  end

  # Create the normalized list
  rankings = totals.map.each do |item, total| 
    [total / sim_sums[item], item]
  end
  # Return the sorted list
  rankings.sort.reverse
end