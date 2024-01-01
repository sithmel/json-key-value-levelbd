//@ts-check
import { PathConverter, stringToPathExp } from "json-key-value"
import { pathExpToMinMaxKeys } from "./utils.mjs"
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
   * DB object
   * @param {Iterable<[import("json-key-value/types/baseTypes").JSONPathType, import("json-key-value/types/baseTypes").JSONValueType]>} iterable
   * @return {Promise<void>}
   */
  async load(iterable, batchSize = 100) {
    /** @type {import("level").BatchOperation<import("level").Level<string, import("json-key-value/types/baseTypes").JSONValueType>, any, import("json-key-value/types/baseTypes").JSONValueType>[]} */
    let batch = []
    for (const [path, value] of iterable) {
      const key = this.pathConverter.pathToString(path)
      batch.push({
        type: "put",
        key,
        value,
      })
      if (batch.length === batchSize) {
        await this.db.batch(batch, {
          valueEncoding: "json",
          keyEncoding: "utf8",
        })
        batch = []
      }
    }
    if (batch.length > 0) {
      await this.db.batch(batch, {
        valueEncoding: "json",
        keyEncoding: "utf8",
      })
    }
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
   * @return {Iterable<[string, string]>}
   */
  *_pathExpToMinMaxKeys(pathExpOrString) {
    const pathExp = stringToPathExp(pathExpOrString)
    for (const pe of pathExp) {
      const [minPath, maxPath] = pathExpToMinMaxKeys(pe)
      yield [
        this.pathConverter.pathToString(minPath),
        this.pathConverter.pathToString(maxPath) + +"\uffff",
      ]
    }
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
}
