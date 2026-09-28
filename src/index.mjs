//@ts-check
import {
  PathConverter,
  stringToPathExp,
  SequenceToObject,
  ObjectToSequence,
} from "json-key-value"
import { pathExpToMinMaxKeys, sortAndCompactIntervals } from "./utils.mjs"
export default class LevelJSON {
  /**
   * DB object
   * @param {import("level").Level<string, import("json-key-value/types/baseTypes").JSONValueType>} db
   * @param {{separator: string|undefined, numberPrefix: string|undefined}} options
   */
  constructor(db, options = { separator: undefined, numberPrefix: undefined }) {
    this.options = options
    this.db = db
    this.pathConverter = new PathConverter(
      options.separator,
      options.numberPrefix,
    )
  }

  /**
   * load a sequence from an iterable to the db
   * @param {AsyncIterable<[import("json-key-value/types/baseTypes").JSONPathType, import("json-key-value/types/baseTypes").JSONValueType]>|Iterable<[import("json-key-value/types/baseTypes").JSONPathType, import("json-key-value/types/baseTypes").JSONValueType]>} iterable
   * @return {Promise<void>}
   */
  async loadSequence(iterable, batchSize = 100) {
    /** @type {import("level").BatchOperation<import("level").Level<string, import("json-key-value/types/baseTypes").JSONValueType>, any, import("json-key-value/types/baseTypes").JSONValueType>[]} */
    let batch = []
    let promise = Promise.resolve()
    for await (const [path, value] of iterable) {
      const key = this.pathConverter.pathToString(path)

      batch.push({
        type: "put",
        key,
        value,
      })
      if (batch.length === batchSize) {
        await promise
        promise = this.db.batch(batch, {
          valueEncoding: "json",
          keyEncoding: "utf8",
        })
        batch = []
      }
    }
    if (batch.length > 0) {
      await promise
      promise = this.db.batch(batch, {
        valueEncoding: "json",
        keyEncoding: "utf8",
      })
    }
    return promise
  }

  /**
   * Clean the db completely
   * @return {Promise<void>}
   */
  async clearAll() {
    await this.db.clear()
  }

  /**
   * @param {Array<import("json-key-value/types/baseTypes").MatchPathType> | string | null} pathExpOrString
   * @return {Array<[string, string]>}
   */
  _pathExpToMinMaxKeys(pathExpOrString) {
    const pairs = stringToPathExp(pathExpOrString).map((pe) => {
      const [minPath, maxPath] = pathExpToMinMaxKeys(pe)
      /** @type {[string, string]} */
      const strPair = [
        this.pathConverter.pathToString(minPath),
        this.pathConverter.pathToString(maxPath) + "\uffff",
      ]
      return strPair
    })
    return sortAndCompactIntervals(pairs)
  }

  /**
   * @param {Array<import("json-key-value/types/baseTypes").MatchPathType> | string | null} pathExpOrString
   * @return {Promise<void>}
   */
  async del(pathExpOrString) {
    for (const [minKey, maxKey] of this._pathExpToMinMaxKeys(pathExpOrString)) {
      await this.db.clear({
        gte: minKey,
        lt: maxKey,
      })
    }
  }

  /**
   * @param {Array<import("json-key-value/types/baseTypes").MatchPathType> | string | null} pathExpOrString
   * @return {AsyncIterable<[import("json-key-value/types/baseTypes").JSONPathType, import("json-key-value/types/baseTypes").JSONValueType]>}
   */
  async *getSequence(pathExpOrString) {
    for (const [minKey, maxKey] of this._pathExpToMinMaxKeys(pathExpOrString)) {
      for await (const [key, value] of this.db.iterator({
        gte: minKey,
        lt: maxKey,
      })) {
        const path = this.pathConverter.stringToPath(key)
        yield [path, value]
      }
    }
  }

  /**
   * @param {Array<import("json-key-value/types/baseTypes").MatchPathType> | string | null} pathExpOrString
   * @param {Object} options
   * @return {Promise<import("json-key-value/types/baseTypes").JSONValueType|undefined>}
   */
  async getObject(pathExpOrString, options) {
    const seqToObj = new SequenceToObject(options)
    for await (const [path, value] of this.getSequence(pathExpOrString)) {
      seqToObj.add(path, value)
    }
    return seqToObj.object
  }

  /**
   * @param {Object} obj
   * @return {Promise<void>}
   */
  async setObject(obj) {
    const objToSeq = new ObjectToSequence()
    await this.loadSequence(objToSeq.iter(obj))
  }
}
