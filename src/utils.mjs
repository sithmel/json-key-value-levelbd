//@ts-check

/**
 * @param {import("json-key-value/types/baseTypes").MatchPathType} pathExp
 * @return {[import("json-key-value/types/baseTypes").JSONPathType, import("json-key-value/types/baseTypes").JSONPathType]}
 */
export function pathExpToMinMaxKeys(pathExp) {
  const minPath = []
  const maxPath = []
  for (const segment of pathExp) {
    if (segment.type === "match") {
      minPath.push(segment.match)
      maxPath.push(segment.match)
    } else if (segment.type === "slice") {
      minPath.push(segment.sliceFrom)
      maxPath.push(segment.sliceTo === Infinity ? 999999999 : segment.sliceTo)
    }
  }
  return [minPath, maxPath]
}

/**
 * @param {Array<[string, string]>} pairs
 * @return {Array<[string, string]>}
 */

export function sortAndCompactIntervals(pairs) {
  if (pairs.length === 0) {
    return []
  }
  pairs.sort((pair1, pair2) => {
    if (pair1[0] > pair2[0]) {
      return 1
    } else if (pair1[0] < pair2[0]) {
      return -1
    }
    return 0
  })
  let [currentPair, ...rest] = pairs
  const compactedPairs = []
  for (const newPair of rest) {
    if (newPair[0] > currentPair[1]) {
      // there is an interval between the 2 pairs
      // they are 2 distinct pairs
      compactedPairs.push(currentPair)
      currentPair = newPair
    } else {
      // the pairs overlaps: merging into 1
      currentPair = [
        currentPair[0],
        newPair[1] > currentPair[1] ? newPair[1] : currentPair[1],
      ]
    }
  }
  compactedPairs.push(currentPair)

  return compactedPairs
}
