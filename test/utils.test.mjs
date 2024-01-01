//@ts-check
import assert from "assert"
import pkg from "zunit"

import { pathExpToMinMaxKeys } from "../src/utils.mjs"

const { describe, it, oit, beforeEach } = pkg

describe("utils", () => {
  describe("pathExpToMinMaxKeys", () => {
    it("works with empty expressions", () => {
      const [minPath, maxPath] = pathExpToMinMaxKeys([])
      assert.deepEqual(minPath, [])
      assert.deepEqual(maxPath, [])
    })
    it("works with match", () => {
      const [minPath, maxPath] = pathExpToMinMaxKeys([
        { type: "match", match: "hello" },
      ])
      assert.deepEqual(minPath, ["hello"])
      assert.deepEqual(maxPath, ["hello"])
    })
    it("works with slice", () => {
      const [minPath, maxPath] = pathExpToMinMaxKeys([
        { type: "slice", sliceFrom: 3, sliceTo: 10 },
      ])
      assert.deepEqual(minPath, [3])
      assert.deepEqual(maxPath, [10])
    })
    it("works with slice (2)", () => {
      const [minPath, maxPath] = pathExpToMinMaxKeys([
        { type: "slice", sliceFrom: 0, sliceTo: Infinity },
      ])
      assert.deepEqual(minPath, [0])
      assert.deepEqual(maxPath, [999999999])
    })
    it("works in combination", () => {
      const [minPath, maxPath] = pathExpToMinMaxKeys([
        { type: "match", match: "hello" },
        { type: "match", match: 5 },
        { type: "slice", sliceFrom: 2, sliceTo: 3 },
      ])
      assert.deepEqual(minPath, ["hello", 5, 2])
      assert.deepEqual(maxPath, ["hello", 5, 3])
    })
  })
})
