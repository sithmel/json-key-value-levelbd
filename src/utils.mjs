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
