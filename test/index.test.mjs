//@ts-check
import assert from "assert"
import pkg from "zunit"

import LevelJSON from "../src/index.mjs"
import { ObjectToSequence, SequenceToObject } from "json-key-value"

import { Level } from "level"
const { describe, it, oit, beforeEach, before } = pkg

const testObj = {
  owner: { firstName: "Bruce", lastName: "Wayne" },
  collection: [
    { brand: "Bugatti", number: 3 },
    { brand: "Ferrari", number: 2 },
    { brand: "Rolls Royce", number: 8 },
  ],
}

describe("LevelJSON", () => {
  let levelJSON
  let db
  let getObj

  before(() => {
    /** @type {Level<string, import("json-key-value/types/baseTypes").JSONValueType, string>} */
    db = new Level("./testdb", { valueEncoding: "json" })
  })
  beforeEach(async () => {
    levelJSON = new LevelJSON(db)
    const objToSeq = new ObjectToSequence()
    getObj = async (include) => {
      const seqToObj = new SequenceToObject({ compactArrays: true })
      for await (const [path, value] of levelJSON.getSequence(include)) {
        console.log(path, value)
        seqToObj.add(path, value)
      }
      return seqToObj.object
    }
    await db.clear()
    await levelJSON.load(objToSeq.iter(testObj))
  })

  it("loads", async () => {
    const value = await levelJSON.db.get("owner//firstName")
    assert.equal(value, "Bruce")
  })

  it("gets a fragment of file", async () => {
    const obj = await getObj("owner")
    assert.deepEqual(obj, {
      owner: { firstName: "Bruce", lastName: "Wayne" },
    })
  })

  it("gets nothing", async () => {
    const obj = await getObj("not_exist")
    assert.deepEqual(obj, undefined)
  })

  it("gets an array item", async () => {
    const obj = await getObj("collection[2]")
    assert.deepEqual(obj, {
      collection: [{ brand: "Rolls Royce", number: 8 }],
    })
  })
})
