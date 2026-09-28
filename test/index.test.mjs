//@ts-check
import assert from "assert"
import pkg from "zunit"

import LevelJSON from "../src/index.mjs"
import { ObjectToSequence, SequenceToObject } from "json-key-value"

import { Level } from "level"
const { describe, it, oit, beforeEach, before, after } = pkg

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

  before(() => {
    /** @type {Level<string, import("json-key-value/types/baseTypes").JSONValueType, string>} */
    db = new Level("./testdb", { valueEncoding: "json" })
  })
  after(() => {
    db.close()
  })
  beforeEach(async () => {
    levelJSON = new LevelJSON(db)
    await db.clear()
    await levelJSON.setObject(testObj)
  })

  it("loads", async () => {
    const value = await levelJSON.db.get("owner//firstName")
    assert.equal(value, "Bruce")
  })

  it("gets a sequence", async () => {
    const seq = []
    for await (const [path, value] of levelJSON.getSequence(
      "owner.firstName",
    )) {
      seq.push([path, value])
    }

    assert.deepEqual(seq, [[["owner", "firstName"], "Bruce"]])
  })

  it("gets a fragment of file", async () => {
    const obj = await levelJSON.getObject("owner", { compactArrays: true })
    assert.deepEqual(obj, {
      owner: { firstName: "Bruce", lastName: "Wayne" },
    })
  })

  it("gets nothing", async () => {
    const obj = await levelJSON.getObject("not_exist", { compactArrays: true })
    assert.deepEqual(obj, undefined)
  })

  it("gets an array item", async () => {
    const obj = await levelJSON.getObject("collection[2]", {
      compactArrays: true,
    })
    assert.deepEqual(obj, {
      collection: [{ brand: "Rolls Royce", number: 8 }],
    })
  })

  it("gets an object", async () => {
    const obj = await levelJSON.getObject("collection[2],owner.lastName", {
      compactArrays: true,
    })
    assert.deepEqual(obj, {
      owner: { lastName: "Wayne" },
      collection: [{ brand: "Rolls Royce", number: 8 }],
    })
  })
  it("removes keys", async () => {
    await levelJSON.del("collection[2],owner.lastName")
    const obj = await levelJSON.getObject("collection,owner", {
      compactArrays: true,
    })
    assert.deepEqual(obj, {
      collection: [
        {
          brand: "Bugatti",
          number: 3,
        },
        {
          brand: "Ferrari",
          number: 2,
        },
      ],
      owner: {
        firstName: "Bruce",
      },
    })
  })
})
