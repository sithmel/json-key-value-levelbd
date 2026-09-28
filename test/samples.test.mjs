//@ts-check
import assert from "assert"
import pkg from "zunit"

import fs from "fs"
import path from "path"

import LevelJSON from "../src/index.mjs"
import { StreamToSequence } from "json-key-value"

import { Level } from "level"
const { describe, it, oit, beforeEach, before, after } = pkg

/**
 * load a sequence from an iterable to the db
 * @param {string} pathname
 * @return {AsyncIterable<[import("json-key-value/types/baseTypes").JSONPathType, import("json-key-value/types/baseTypes").JSONValueType]>}
 */
async function* streamFile(pathname) {
  const readStream = fs.createReadStream(pathname, { encoding: "utf-8" })
  const parser = new StreamToSequence()
  for await (const chunk of readStream) {
    for (const [path, value] of parser.iter(chunk)) {
      yield [path, value]
    }
  }
  readStream.destroy()
}

describe("Samples", () => {
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
  })
  it("works with a file", async () => {
    const iterable = streamFile(path.join("test", "samples", "creationix.json"))
    await levelJSON.loadSequence(iterable)
    // const obj = await levelJSON.getObject('"2kenizer".description')
    const obj = await levelJSON.getObject("1.image.0.x", {
      compactArrays: true,
    })
    assert.deepEqual(obj, [
      {
        image: [
          {
            x: 0.5,
          },
        ],
      },
    ])
    const obj2 = await levelJSON.getObject('1.corners."1"', {
      compactArrays: true,
    })
    assert.deepEqual(obj2, [
      {
        corners: {
          1: true,
        },
      },
    ])
  })
  oit("works with a file", async () => {
    const iterable = streamFile(path.join("test", "samples", "npm.json"))
    await levelJSON.loadSequence(iterable)
    const obj = await levelJSON.getObject('"2kenizer".description')
    assert.deepEqual(obj, [
      {
        image: [
          {
            x: 0.5,
          },
        ],
      },
    ])
  })
})
