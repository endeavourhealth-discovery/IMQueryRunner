
/**
 * Client
**/

import * as runtime from './runtime/library.js';
import $Types = runtime.Types // general types
import $Public = runtime.Types.Public
import $Utils = runtime.Types.Utils
import $Extensions = runtime.Types.Extensions
import $Result = runtime.Types.Result

export type PrismaPromise<T> = $Public.PrismaPromise<T>


/**
 * Model QueueItem
 * 
 */
export type QueueItem = $Result.DefaultSelection<Prisma.$QueueItemPayload>

/**
 * ##  Prisma Client ʲˢ
 *
 * Type-safe database client for TypeScript & Node.js
 * @example
 * ```
 * const prisma = new PrismaClient()
 * // Fetch zero or more QueueItems
 * const queueItems = await prisma.queueItem.findMany()
 * ```
 *
 *
 * Read more in our [docs](https://www.prisma.io/docs/reference/tools-and-interfaces/prisma-client).
 */
export class PrismaClient<
  ClientOptions extends Prisma.PrismaClientOptions = Prisma.PrismaClientOptions,
  const U = 'log' extends keyof ClientOptions ? ClientOptions['log'] extends Array<Prisma.LogLevel | Prisma.LogDefinition> ? Prisma.GetEvents<ClientOptions['log']> : never : never,
  ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs
> {
  [K: symbol]: { types: Prisma.TypeMap<ExtArgs>['other'] }

    /**
   * ##  Prisma Client ʲˢ
   *
   * Type-safe database client for TypeScript & Node.js
   * @example
   * ```
   * const prisma = new PrismaClient()
   * // Fetch zero or more QueueItems
   * const queueItems = await prisma.queueItem.findMany()
   * ```
   *
   *
   * Read more in our [docs](https://www.prisma.io/docs/reference/tools-and-interfaces/prisma-client).
   */

  constructor(optionsArg ?: Prisma.Subset<ClientOptions, Prisma.PrismaClientOptions>);
  $on<V extends U>(eventType: V, callback: (event: V extends 'query' ? Prisma.QueryEvent : Prisma.LogEvent) => void): PrismaClient;

  /**
   * Connect with the database
   */
  $connect(): $Utils.JsPromise<void>;

  /**
   * Disconnect from the database
   */
  $disconnect(): $Utils.JsPromise<void>;

/**
   * Executes a prepared raw query and returns the number of affected rows.
   * @example
   * ```
   * const result = await prisma.$executeRaw`UPDATE User SET cool = ${true} WHERE email = ${'user@email.com'};`
   * ```
   *
   * Read more in our [docs](https://www.prisma.io/docs/reference/tools-and-interfaces/prisma-client/raw-database-access).
   */
  $executeRaw<T = unknown>(query: TemplateStringsArray | Prisma.Sql, ...values: any[]): Prisma.PrismaPromise<number>;

  /**
   * Executes a raw query and returns the number of affected rows.
   * Susceptible to SQL injections, see documentation.
   * @example
   * ```
   * const result = await prisma.$executeRawUnsafe('UPDATE User SET cool = $1 WHERE email = $2 ;', true, 'user@email.com')
   * ```
   *
   * Read more in our [docs](https://www.prisma.io/docs/reference/tools-and-interfaces/prisma-client/raw-database-access).
   */
  $executeRawUnsafe<T = unknown>(query: string, ...values: any[]): Prisma.PrismaPromise<number>;

  /**
   * Performs a prepared raw query and returns the `SELECT` data.
   * @example
   * ```
   * const result = await prisma.$queryRaw`SELECT * FROM User WHERE id = ${1} OR email = ${'user@email.com'};`
   * ```
   *
   * Read more in our [docs](https://www.prisma.io/docs/reference/tools-and-interfaces/prisma-client/raw-database-access).
   */
  $queryRaw<T = unknown>(query: TemplateStringsArray | Prisma.Sql, ...values: any[]): Prisma.PrismaPromise<T>;

  /**
   * Performs a raw query and returns the `SELECT` data.
   * Susceptible to SQL injections, see documentation.
   * @example
   * ```
   * const result = await prisma.$queryRawUnsafe('SELECT * FROM User WHERE id = $1 OR email = $2;', 1, 'user@email.com')
   * ```
   *
   * Read more in our [docs](https://www.prisma.io/docs/reference/tools-and-interfaces/prisma-client/raw-database-access).
   */
  $queryRawUnsafe<T = unknown>(query: string, ...values: any[]): Prisma.PrismaPromise<T>;


  /**
   * Allows the running of a sequence of read/write operations that are guaranteed to either succeed or fail as a whole.
   * @example
   * ```
   * const [george, bob, alice] = await prisma.$transaction([
   *   prisma.user.create({ data: { name: 'George' } }),
   *   prisma.user.create({ data: { name: 'Bob' } }),
   *   prisma.user.create({ data: { name: 'Alice' } }),
   * ])
   * ```
   * 
   * Read more in our [docs](https://www.prisma.io/docs/concepts/components/prisma-client/transactions).
   */
  $transaction<P extends Prisma.PrismaPromise<any>[]>(arg: [...P], options?: { isolationLevel?: Prisma.TransactionIsolationLevel }): $Utils.JsPromise<runtime.Types.Utils.UnwrapTuple<P>>

  $transaction<R>(fn: (prisma: Omit<PrismaClient, runtime.ITXClientDenyList>) => $Utils.JsPromise<R>, options?: { maxWait?: number, timeout?: number, isolationLevel?: Prisma.TransactionIsolationLevel }): $Utils.JsPromise<R>


  $extends: $Extensions.ExtendsHook<"extends", Prisma.TypeMapCb<ClientOptions>, ExtArgs, $Utils.Call<Prisma.TypeMapCb<ClientOptions>, {
    extArgs: ExtArgs
  }>>

      /**
   * `prisma.queueItem`: Exposes CRUD operations for the **QueueItem** model.
    * Example usage:
    * ```ts
    * // Fetch zero or more QueueItems
    * const queueItems = await prisma.queueItem.findMany()
    * ```
    */
  get queueItem(): Prisma.QueueItemDelegate<ExtArgs, ClientOptions>;
}

export namespace Prisma {
  export import DMMF = runtime.DMMF

  export type PrismaPromise<T> = $Public.PrismaPromise<T>

  /**
   * Validator
   */
  export import validator = runtime.Public.validator

  /**
   * Prisma Errors
   */
  export import PrismaClientKnownRequestError = runtime.PrismaClientKnownRequestError
  export import PrismaClientUnknownRequestError = runtime.PrismaClientUnknownRequestError
  export import PrismaClientRustPanicError = runtime.PrismaClientRustPanicError
  export import PrismaClientInitializationError = runtime.PrismaClientInitializationError
  export import PrismaClientValidationError = runtime.PrismaClientValidationError

  /**
   * Re-export of sql-template-tag
   */
  export import sql = runtime.sqltag
  export import empty = runtime.empty
  export import join = runtime.join
  export import raw = runtime.raw
  export import Sql = runtime.Sql



  /**
   * Decimal.js
   */
  export import Decimal = runtime.Decimal

  export type DecimalJsLike = runtime.DecimalJsLike

  /**
   * Metrics
   */
  export type Metrics = runtime.Metrics
  export type Metric<T> = runtime.Metric<T>
  export type MetricHistogram = runtime.MetricHistogram
  export type MetricHistogramBucket = runtime.MetricHistogramBucket

  /**
  * Extensions
  */
  export import Extension = $Extensions.UserArgs
  export import getExtensionContext = runtime.Extensions.getExtensionContext
  export import Args = $Public.Args
  export import Payload = $Public.Payload
  export import Result = $Public.Result
  export import Exact = $Public.Exact

  /**
   * Prisma Client JS version: 6.14.0
   * Query Engine version: 717184b7b35ea05dfa71a3236b7af656013e1e49
   */
  export type PrismaVersion = {
    client: string
  }

  export const prismaVersion: PrismaVersion

  /**
   * Utility Types
   */


  export import JsonObject = runtime.JsonObject
  export import JsonArray = runtime.JsonArray
  export import JsonValue = runtime.JsonValue
  export import InputJsonObject = runtime.InputJsonObject
  export import InputJsonArray = runtime.InputJsonArray
  export import InputJsonValue = runtime.InputJsonValue

  /**
   * Types of the values used to represent different kinds of `null` values when working with JSON fields.
   *
   * @see https://www.prisma.io/docs/concepts/components/prisma-client/working-with-fields/working-with-json-fields#filtering-on-a-json-field
   */
  namespace NullTypes {
    /**
    * Type of `Prisma.DbNull`.
    *
    * You cannot use other instances of this class. Please use the `Prisma.DbNull` value.
    *
    * @see https://www.prisma.io/docs/concepts/components/prisma-client/working-with-fields/working-with-json-fields#filtering-on-a-json-field
    */
    class DbNull {
      private DbNull: never
      private constructor()
    }

    /**
    * Type of `Prisma.JsonNull`.
    *
    * You cannot use other instances of this class. Please use the `Prisma.JsonNull` value.
    *
    * @see https://www.prisma.io/docs/concepts/components/prisma-client/working-with-fields/working-with-json-fields#filtering-on-a-json-field
    */
    class JsonNull {
      private JsonNull: never
      private constructor()
    }

    /**
    * Type of `Prisma.AnyNull`.
    *
    * You cannot use other instances of this class. Please use the `Prisma.AnyNull` value.
    *
    * @see https://www.prisma.io/docs/concepts/components/prisma-client/working-with-fields/working-with-json-fields#filtering-on-a-json-field
    */
    class AnyNull {
      private AnyNull: never
      private constructor()
    }
  }

  /**
   * Helper for filtering JSON entries that have `null` on the database (empty on the db)
   *
   * @see https://www.prisma.io/docs/concepts/components/prisma-client/working-with-fields/working-with-json-fields#filtering-on-a-json-field
   */
  export const DbNull: NullTypes.DbNull

  /**
   * Helper for filtering JSON entries that have JSON `null` values (not empty on the db)
   *
   * @see https://www.prisma.io/docs/concepts/components/prisma-client/working-with-fields/working-with-json-fields#filtering-on-a-json-field
   */
  export const JsonNull: NullTypes.JsonNull

  /**
   * Helper for filtering JSON entries that are `Prisma.DbNull` or `Prisma.JsonNull`
   *
   * @see https://www.prisma.io/docs/concepts/components/prisma-client/working-with-fields/working-with-json-fields#filtering-on-a-json-field
   */
  export const AnyNull: NullTypes.AnyNull

  type SelectAndInclude = {
    select: any
    include: any
  }

  type SelectAndOmit = {
    select: any
    omit: any
  }

  /**
   * Get the type of the value, that the Promise holds.
   */
  export type PromiseType<T extends PromiseLike<any>> = T extends PromiseLike<infer U> ? U : T;

  /**
   * Get the return type of a function which returns a Promise.
   */
  export type PromiseReturnType<T extends (...args: any) => $Utils.JsPromise<any>> = PromiseType<ReturnType<T>>

  /**
   * From T, pick a set of properties whose keys are in the union K
   */
  type Prisma__Pick<T, K extends keyof T> = {
      [P in K]: T[P];
  };


  export type Enumerable<T> = T | Array<T>;

  export type RequiredKeys<T> = {
    [K in keyof T]-?: {} extends Prisma__Pick<T, K> ? never : K
  }[keyof T]

  export type TruthyKeys<T> = keyof {
    [K in keyof T as T[K] extends false | undefined | null ? never : K]: K
  }

  export type TrueKeys<T> = TruthyKeys<Prisma__Pick<T, RequiredKeys<T>>>

  /**
   * Subset
   * @desc From `T` pick properties that exist in `U`. Simple version of Intersection
   */
  export type Subset<T, U> = {
    [key in keyof T]: key extends keyof U ? T[key] : never;
  };

  /**
   * SelectSubset
   * @desc From `T` pick properties that exist in `U`. Simple version of Intersection.
   * Additionally, it validates, if both select and include are present. If the case, it errors.
   */
  export type SelectSubset<T, U> = {
    [key in keyof T]: key extends keyof U ? T[key] : never
  } &
    (T extends SelectAndInclude
      ? 'Please either choose `select` or `include`.'
      : T extends SelectAndOmit
        ? 'Please either choose `select` or `omit`.'
        : {})

  /**
   * Subset + Intersection
   * @desc From `T` pick properties that exist in `U` and intersect `K`
   */
  export type SubsetIntersection<T, U, K> = {
    [key in keyof T]: key extends keyof U ? T[key] : never
  } &
    K

  type Without<T, U> = { [P in Exclude<keyof T, keyof U>]?: never };

  /**
   * XOR is needed to have a real mutually exclusive union type
   * https://stackoverflow.com/questions/42123407/does-typescript-support-mutually-exclusive-types
   */
  type XOR<T, U> =
    T extends object ?
    U extends object ?
      (Without<T, U> & U) | (Without<U, T> & T)
    : U : T


  /**
   * Is T a Record?
   */
  type IsObject<T extends any> = T extends Array<any>
  ? False
  : T extends Date
  ? False
  : T extends Uint8Array
  ? False
  : T extends BigInt
  ? False
  : T extends object
  ? True
  : False


  /**
   * If it's T[], return T
   */
  export type UnEnumerate<T extends unknown> = T extends Array<infer U> ? U : T

  /**
   * From ts-toolbelt
   */

  type __Either<O extends object, K extends Key> = Omit<O, K> &
    {
      // Merge all but K
      [P in K]: Prisma__Pick<O, P & keyof O> // With K possibilities
    }[K]

  type EitherStrict<O extends object, K extends Key> = Strict<__Either<O, K>>

  type EitherLoose<O extends object, K extends Key> = ComputeRaw<__Either<O, K>>

  type _Either<
    O extends object,
    K extends Key,
    strict extends Boolean
  > = {
    1: EitherStrict<O, K>
    0: EitherLoose<O, K>
  }[strict]

  type Either<
    O extends object,
    K extends Key,
    strict extends Boolean = 1
  > = O extends unknown ? _Either<O, K, strict> : never

  export type Union = any

  type PatchUndefined<O extends object, O1 extends object> = {
    [K in keyof O]: O[K] extends undefined ? At<O1, K> : O[K]
  } & {}

  /** Helper Types for "Merge" **/
  export type IntersectOf<U extends Union> = (
    U extends unknown ? (k: U) => void : never
  ) extends (k: infer I) => void
    ? I
    : never

  export type Overwrite<O extends object, O1 extends object> = {
      [K in keyof O]: K extends keyof O1 ? O1[K] : O[K];
  } & {};

  type _Merge<U extends object> = IntersectOf<Overwrite<U, {
      [K in keyof U]-?: At<U, K>;
  }>>;

  type Key = string | number | symbol;
  type AtBasic<O extends object, K extends Key> = K extends keyof O ? O[K] : never;
  type AtStrict<O extends object, K extends Key> = O[K & keyof O];
  type AtLoose<O extends object, K extends Key> = O extends unknown ? AtStrict<O, K> : never;
  export type At<O extends object, K extends Key, strict extends Boolean = 1> = {
      1: AtStrict<O, K>;
      0: AtLoose<O, K>;
  }[strict];

  export type ComputeRaw<A extends any> = A extends Function ? A : {
    [K in keyof A]: A[K];
  } & {};

  export type OptionalFlat<O> = {
    [K in keyof O]?: O[K];
  } & {};

  type _Record<K extends keyof any, T> = {
    [P in K]: T;
  };

  // cause typescript not to expand types and preserve names
  type NoExpand<T> = T extends unknown ? T : never;

  // this type assumes the passed object is entirely optional
  type AtLeast<O extends object, K extends string> = NoExpand<
    O extends unknown
    ? | (K extends keyof O ? { [P in K]: O[P] } & O : O)
      | {[P in keyof O as P extends K ? P : never]-?: O[P]} & O
    : never>;

  type _Strict<U, _U = U> = U extends unknown ? U & OptionalFlat<_Record<Exclude<Keys<_U>, keyof U>, never>> : never;

  export type Strict<U extends object> = ComputeRaw<_Strict<U>>;
  /** End Helper Types for "Merge" **/

  export type Merge<U extends object> = ComputeRaw<_Merge<Strict<U>>>;

  /**
  A [[Boolean]]
  */
  export type Boolean = True | False

  // /**
  // 1
  // */
  export type True = 1

  /**
  0
  */
  export type False = 0

  export type Not<B extends Boolean> = {
    0: 1
    1: 0
  }[B]

  export type Extends<A1 extends any, A2 extends any> = [A1] extends [never]
    ? 0 // anything `never` is false
    : A1 extends A2
    ? 1
    : 0

  export type Has<U extends Union, U1 extends Union> = Not<
    Extends<Exclude<U1, U>, U1>
  >

  export type Or<B1 extends Boolean, B2 extends Boolean> = {
    0: {
      0: 0
      1: 1
    }
    1: {
      0: 1
      1: 1
    }
  }[B1][B2]

  export type Keys<U extends Union> = U extends unknown ? keyof U : never

  type Cast<A, B> = A extends B ? A : B;

  export const type: unique symbol;



  /**
   * Used by group by
   */

  export type GetScalarType<T, O> = O extends object ? {
    [P in keyof T]: P extends keyof O
      ? O[P]
      : never
  } : never

  type FieldPaths<
    T,
    U = Omit<T, '_avg' | '_sum' | '_count' | '_min' | '_max'>
  > = IsObject<T> extends True ? U : T

  type GetHavingFields<T> = {
    [K in keyof T]: Or<
      Or<Extends<'OR', K>, Extends<'AND', K>>,
      Extends<'NOT', K>
    > extends True
      ? // infer is only needed to not hit TS limit
        // based on the brilliant idea of Pierre-Antoine Mills
        // https://github.com/microsoft/TypeScript/issues/30188#issuecomment-478938437
        T[K] extends infer TK
        ? GetHavingFields<UnEnumerate<TK> extends object ? Merge<UnEnumerate<TK>> : never>
        : never
      : {} extends FieldPaths<T[K]>
      ? never
      : K
  }[keyof T]

  /**
   * Convert tuple to union
   */
  type _TupleToUnion<T> = T extends (infer E)[] ? E : never
  type TupleToUnion<K extends readonly any[]> = _TupleToUnion<K>
  type MaybeTupleToUnion<T> = T extends any[] ? TupleToUnion<T> : T

  /**
   * Like `Pick`, but additionally can also accept an array of keys
   */
  type PickEnumerable<T, K extends Enumerable<keyof T> | keyof T> = Prisma__Pick<T, MaybeTupleToUnion<K>>

  /**
   * Exclude all keys with underscores
   */
  type ExcludeUnderscoreKeys<T extends string> = T extends `_${string}` ? never : T


  export type FieldRef<Model, FieldType> = runtime.FieldRef<Model, FieldType>

  type FieldRefInputType<Model, FieldType> = Model extends never ? never : FieldRef<Model, FieldType>


  export const ModelName: {
    QueueItem: 'QueueItem'
  };

  export type ModelName = (typeof ModelName)[keyof typeof ModelName]


  export type Datasources = {
    pgdb?: Datasource
  }

  interface TypeMapCb<ClientOptions = {}> extends $Utils.Fn<{extArgs: $Extensions.InternalArgs }, $Utils.Record<string, any>> {
    returns: Prisma.TypeMap<this['params']['extArgs'], ClientOptions extends { omit: infer OmitOptions } ? OmitOptions : {}>
  }

  export type TypeMap<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs, GlobalOmitOptions = {}> = {
    globalOmitOptions: {
      omit: GlobalOmitOptions
    }
    meta: {
      modelProps: "queueItem"
      txIsolationLevel: Prisma.TransactionIsolationLevel
    }
    model: {
      QueueItem: {
        payload: Prisma.$QueueItemPayload<ExtArgs>
        fields: Prisma.QueueItemFieldRefs
        operations: {
          findUnique: {
            args: Prisma.QueueItemFindUniqueArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$QueueItemPayload> | null
          }
          findUniqueOrThrow: {
            args: Prisma.QueueItemFindUniqueOrThrowArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$QueueItemPayload>
          }
          findFirst: {
            args: Prisma.QueueItemFindFirstArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$QueueItemPayload> | null
          }
          findFirstOrThrow: {
            args: Prisma.QueueItemFindFirstOrThrowArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$QueueItemPayload>
          }
          findMany: {
            args: Prisma.QueueItemFindManyArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$QueueItemPayload>[]
          }
          create: {
            args: Prisma.QueueItemCreateArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$QueueItemPayload>
          }
          createMany: {
            args: Prisma.QueueItemCreateManyArgs<ExtArgs>
            result: BatchPayload
          }
          createManyAndReturn: {
            args: Prisma.QueueItemCreateManyAndReturnArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$QueueItemPayload>[]
          }
          delete: {
            args: Prisma.QueueItemDeleteArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$QueueItemPayload>
          }
          update: {
            args: Prisma.QueueItemUpdateArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$QueueItemPayload>
          }
          deleteMany: {
            args: Prisma.QueueItemDeleteManyArgs<ExtArgs>
            result: BatchPayload
          }
          updateMany: {
            args: Prisma.QueueItemUpdateManyArgs<ExtArgs>
            result: BatchPayload
          }
          updateManyAndReturn: {
            args: Prisma.QueueItemUpdateManyAndReturnArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$QueueItemPayload>[]
          }
          upsert: {
            args: Prisma.QueueItemUpsertArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$QueueItemPayload>
          }
          aggregate: {
            args: Prisma.QueueItemAggregateArgs<ExtArgs>
            result: $Utils.Optional<AggregateQueueItem>
          }
          groupBy: {
            args: Prisma.QueueItemGroupByArgs<ExtArgs>
            result: $Utils.Optional<QueueItemGroupByOutputType>[]
          }
          count: {
            args: Prisma.QueueItemCountArgs<ExtArgs>
            result: $Utils.Optional<QueueItemCountAggregateOutputType> | number
          }
        }
      }
    }
  } & {
    other: {
      payload: any
      operations: {
        $executeRaw: {
          args: [query: TemplateStringsArray | Prisma.Sql, ...values: any[]],
          result: any
        }
        $executeRawUnsafe: {
          args: [query: string, ...values: any[]],
          result: any
        }
        $queryRaw: {
          args: [query: TemplateStringsArray | Prisma.Sql, ...values: any[]],
          result: any
        }
        $queryRawUnsafe: {
          args: [query: string, ...values: any[]],
          result: any
        }
      }
    }
  }
  export const defineExtension: $Extensions.ExtendsHook<"define", Prisma.TypeMapCb, $Extensions.DefaultArgs>
  export type DefaultPrismaClient = PrismaClient
  export type ErrorFormat = 'pretty' | 'colorless' | 'minimal'
  export interface PrismaClientOptions {
    /**
     * Overwrites the datasource url from your schema.prisma file
     */
    datasources?: Datasources
    /**
     * Overwrites the datasource url from your schema.prisma file
     */
    datasourceUrl?: string
    /**
     * @default "colorless"
     */
    errorFormat?: ErrorFormat
    /**
     * @example
     * ```
     * // Shorthand for `emit: 'stdout'`
     * log: ['query', 'info', 'warn', 'error']
     * 
     * // Emit as events only
     * log: [
     *   { emit: 'event', level: 'query' },
     *   { emit: 'event', level: 'info' },
     *   { emit: 'event', level: 'warn' }
     *   { emit: 'event', level: 'error' }
     * ]
     * 
     * / Emit as events and log to stdout
     * og: [
     *  { emit: 'stdout', level: 'query' },
     *  { emit: 'stdout', level: 'info' },
     *  { emit: 'stdout', level: 'warn' }
     *  { emit: 'stdout', level: 'error' }
     * 
     * ```
     * Read more in our [docs](https://www.prisma.io/docs/reference/tools-and-interfaces/prisma-client/logging#the-log-option).
     */
    log?: (LogLevel | LogDefinition)[]
    /**
     * The default values for transactionOptions
     * maxWait ?= 2000
     * timeout ?= 5000
     */
    transactionOptions?: {
      maxWait?: number
      timeout?: number
      isolationLevel?: Prisma.TransactionIsolationLevel
    }
    /**
     * Global configuration for omitting model fields by default.
     * 
     * @example
     * ```
     * const prisma = new PrismaClient({
     *   omit: {
     *     user: {
     *       password: true
     *     }
     *   }
     * })
     * ```
     */
    omit?: Prisma.GlobalOmitConfig
  }
  export type GlobalOmitConfig = {
    queueItem?: QueueItemOmit
  }

  /* Types for Logging */
  export type LogLevel = 'info' | 'query' | 'warn' | 'error'
  export type LogDefinition = {
    level: LogLevel
    emit: 'stdout' | 'event'
  }

  export type CheckIsLogLevel<T> = T extends LogLevel ? T : never;

  export type GetLogType<T> = CheckIsLogLevel<
    T extends LogDefinition ? T['level'] : T
  >;

  export type GetEvents<T extends any[]> = T extends Array<LogLevel | LogDefinition>
    ? GetLogType<T[number]>
    : never;

  export type QueryEvent = {
    timestamp: Date
    query: string
    params: string
    duration: number
    target: string
  }

  export type LogEvent = {
    timestamp: Date
    message: string
    target: string
  }
  /* End Types for Logging */


  export type PrismaAction =
    | 'findUnique'
    | 'findUniqueOrThrow'
    | 'findMany'
    | 'findFirst'
    | 'findFirstOrThrow'
    | 'create'
    | 'createMany'
    | 'createManyAndReturn'
    | 'update'
    | 'updateMany'
    | 'updateManyAndReturn'
    | 'upsert'
    | 'delete'
    | 'deleteMany'
    | 'executeRaw'
    | 'queryRaw'
    | 'aggregate'
    | 'count'
    | 'runCommandRaw'
    | 'findRaw'
    | 'groupBy'

  // tested in getLogLevel.test.ts
  export function getLogLevel(log: Array<LogLevel | LogDefinition>): LogLevel | undefined;

  /**
   * `PrismaClient` proxy available in interactive transactions.
   */
  export type TransactionClient = Omit<Prisma.DefaultPrismaClient, runtime.ITXClientDenyList>

  export type Datasource = {
    url?: string
  }

  /**
   * Count Types
   */



  /**
   * Models
   */

  /**
   * Model QueueItem
   */

  export type AggregateQueueItem = {
    _count: QueueItemCountAggregateOutputType | null
    _avg: QueueItemAvgAggregateOutputType | null
    _sum: QueueItemSumAggregateOutputType | null
    _min: QueueItemMinAggregateOutputType | null
    _max: QueueItemMaxAggregateOutputType | null
  }

  export type QueueItemAvgAggregateOutputType = {
    pid: number | null
  }

  export type QueueItemSumAggregateOutputType = {
    pid: number | null
  }

  export type QueueItemMinAggregateOutputType = {
    id: string | null
    query_iri: string | null
    query_name: string | null
    user_id: string | null
    user_name: string | null
    queued_at: Date | null
    started_at: Date | null
    pid: number | null
    finished_at: Date | null
    killed_at: Date | null
    status: string | null
    error: string | null
  }

  export type QueueItemMaxAggregateOutputType = {
    id: string | null
    query_iri: string | null
    query_name: string | null
    user_id: string | null
    user_name: string | null
    queued_at: Date | null
    started_at: Date | null
    pid: number | null
    finished_at: Date | null
    killed_at: Date | null
    status: string | null
    error: string | null
  }

  export type QueueItemCountAggregateOutputType = {
    id: number
    query_iri: number
    query_name: number
    query_request: number
    user_id: number
    user_name: number
    queued_at: number
    started_at: number
    pid: number
    finished_at: number
    killed_at: number
    status: number
    error: number
    _all: number
  }


  export type QueueItemAvgAggregateInputType = {
    pid?: true
  }

  export type QueueItemSumAggregateInputType = {
    pid?: true
  }

  export type QueueItemMinAggregateInputType = {
    id?: true
    query_iri?: true
    query_name?: true
    user_id?: true
    user_name?: true
    queued_at?: true
    started_at?: true
    pid?: true
    finished_at?: true
    killed_at?: true
    status?: true
    error?: true
  }

  export type QueueItemMaxAggregateInputType = {
    id?: true
    query_iri?: true
    query_name?: true
    user_id?: true
    user_name?: true
    queued_at?: true
    started_at?: true
    pid?: true
    finished_at?: true
    killed_at?: true
    status?: true
    error?: true
  }

  export type QueueItemCountAggregateInputType = {
    id?: true
    query_iri?: true
    query_name?: true
    query_request?: true
    user_id?: true
    user_name?: true
    queued_at?: true
    started_at?: true
    pid?: true
    finished_at?: true
    killed_at?: true
    status?: true
    error?: true
    _all?: true
  }

  export type QueueItemAggregateArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Filter which QueueItem to aggregate.
     */
    where?: QueueItemWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of QueueItems to fetch.
     */
    orderBy?: QueueItemOrderByWithRelationInput | QueueItemOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the start position
     */
    cursor?: QueueItemWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` QueueItems from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` QueueItems.
     */
    skip?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Count returned QueueItems
    **/
    _count?: true | QueueItemCountAggregateInputType
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Select which fields to average
    **/
    _avg?: QueueItemAvgAggregateInputType
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Select which fields to sum
    **/
    _sum?: QueueItemSumAggregateInputType
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Select which fields to find the minimum value
    **/
    _min?: QueueItemMinAggregateInputType
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Select which fields to find the maximum value
    **/
    _max?: QueueItemMaxAggregateInputType
  }

  export type GetQueueItemAggregateType<T extends QueueItemAggregateArgs> = {
        [P in keyof T & keyof AggregateQueueItem]: P extends '_count' | 'count'
      ? T[P] extends true
        ? number
        : GetScalarType<T[P], AggregateQueueItem[P]>
      : GetScalarType<T[P], AggregateQueueItem[P]>
  }




  export type QueueItemGroupByArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    where?: QueueItemWhereInput
    orderBy?: QueueItemOrderByWithAggregationInput | QueueItemOrderByWithAggregationInput[]
    by: QueueItemScalarFieldEnum[] | QueueItemScalarFieldEnum
    having?: QueueItemScalarWhereWithAggregatesInput
    take?: number
    skip?: number
    _count?: QueueItemCountAggregateInputType | true
    _avg?: QueueItemAvgAggregateInputType
    _sum?: QueueItemSumAggregateInputType
    _min?: QueueItemMinAggregateInputType
    _max?: QueueItemMaxAggregateInputType
  }

  export type QueueItemGroupByOutputType = {
    id: string
    query_iri: string
    query_name: string
    query_request: JsonValue
    user_id: string
    user_name: string
    queued_at: Date | null
    started_at: Date | null
    pid: number
    finished_at: Date | null
    killed_at: Date | null
    status: string
    error: string | null
    _count: QueueItemCountAggregateOutputType | null
    _avg: QueueItemAvgAggregateOutputType | null
    _sum: QueueItemSumAggregateOutputType | null
    _min: QueueItemMinAggregateOutputType | null
    _max: QueueItemMaxAggregateOutputType | null
  }

  type GetQueueItemGroupByPayload<T extends QueueItemGroupByArgs> = Prisma.PrismaPromise<
    Array<
      PickEnumerable<QueueItemGroupByOutputType, T['by']> &
        {
          [P in ((keyof T) & (keyof QueueItemGroupByOutputType))]: P extends '_count'
            ? T[P] extends boolean
              ? number
              : GetScalarType<T[P], QueueItemGroupByOutputType[P]>
            : GetScalarType<T[P], QueueItemGroupByOutputType[P]>
        }
      >
    >


  export type QueueItemSelect<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetSelect<{
    id?: boolean
    query_iri?: boolean
    query_name?: boolean
    query_request?: boolean
    user_id?: boolean
    user_name?: boolean
    queued_at?: boolean
    started_at?: boolean
    pid?: boolean
    finished_at?: boolean
    killed_at?: boolean
    status?: boolean
    error?: boolean
  }, ExtArgs["result"]["queueItem"]>

  export type QueueItemSelectCreateManyAndReturn<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetSelect<{
    id?: boolean
    query_iri?: boolean
    query_name?: boolean
    query_request?: boolean
    user_id?: boolean
    user_name?: boolean
    queued_at?: boolean
    started_at?: boolean
    pid?: boolean
    finished_at?: boolean
    killed_at?: boolean
    status?: boolean
    error?: boolean
  }, ExtArgs["result"]["queueItem"]>

  export type QueueItemSelectUpdateManyAndReturn<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetSelect<{
    id?: boolean
    query_iri?: boolean
    query_name?: boolean
    query_request?: boolean
    user_id?: boolean
    user_name?: boolean
    queued_at?: boolean
    started_at?: boolean
    pid?: boolean
    finished_at?: boolean
    killed_at?: boolean
    status?: boolean
    error?: boolean
  }, ExtArgs["result"]["queueItem"]>

  export type QueueItemSelectScalar = {
    id?: boolean
    query_iri?: boolean
    query_name?: boolean
    query_request?: boolean
    user_id?: boolean
    user_name?: boolean
    queued_at?: boolean
    started_at?: boolean
    pid?: boolean
    finished_at?: boolean
    killed_at?: boolean
    status?: boolean
    error?: boolean
  }

  export type QueueItemOmit<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetOmit<"id" | "query_iri" | "query_name" | "query_request" | "user_id" | "user_name" | "queued_at" | "started_at" | "pid" | "finished_at" | "killed_at" | "status" | "error", ExtArgs["result"]["queueItem"]>

  export type $QueueItemPayload<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    name: "QueueItem"
    objects: {}
    scalars: $Extensions.GetPayloadResult<{
      id: string
      query_iri: string
      query_name: string
      query_request: Prisma.JsonValue
      user_id: string
      user_name: string
      queued_at: Date | null
      started_at: Date | null
      pid: number
      finished_at: Date | null
      killed_at: Date | null
      status: string
      error: string | null
    }, ExtArgs["result"]["queueItem"]>
    composites: {}
  }

  type QueueItemGetPayload<S extends boolean | null | undefined | QueueItemDefaultArgs> = $Result.GetResult<Prisma.$QueueItemPayload, S>

  type QueueItemCountArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> =
    Omit<QueueItemFindManyArgs, 'select' | 'include' | 'distinct' | 'omit'> & {
      select?: QueueItemCountAggregateInputType | true
    }

  export interface QueueItemDelegate<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs, GlobalOmitOptions = {}> {
    [K: symbol]: { types: Prisma.TypeMap<ExtArgs>['model']['QueueItem'], meta: { name: 'QueueItem' } }
    /**
     * Find zero or one QueueItem that matches the filter.
     * @param {QueueItemFindUniqueArgs} args - Arguments to find a QueueItem
     * @example
     * // Get one QueueItem
     * const queueItem = await prisma.queueItem.findUnique({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findUnique<T extends QueueItemFindUniqueArgs>(args: SelectSubset<T, QueueItemFindUniqueArgs<ExtArgs>>): Prisma__QueueItemClient<$Result.GetResult<Prisma.$QueueItemPayload<ExtArgs>, T, "findUnique", GlobalOmitOptions> | null, null, ExtArgs, GlobalOmitOptions>

    /**
     * Find one QueueItem that matches the filter or throw an error with `error.code='P2025'`
     * if no matches were found.
     * @param {QueueItemFindUniqueOrThrowArgs} args - Arguments to find a QueueItem
     * @example
     * // Get one QueueItem
     * const queueItem = await prisma.queueItem.findUniqueOrThrow({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findUniqueOrThrow<T extends QueueItemFindUniqueOrThrowArgs>(args: SelectSubset<T, QueueItemFindUniqueOrThrowArgs<ExtArgs>>): Prisma__QueueItemClient<$Result.GetResult<Prisma.$QueueItemPayload<ExtArgs>, T, "findUniqueOrThrow", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Find the first QueueItem that matches the filter.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {QueueItemFindFirstArgs} args - Arguments to find a QueueItem
     * @example
     * // Get one QueueItem
     * const queueItem = await prisma.queueItem.findFirst({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findFirst<T extends QueueItemFindFirstArgs>(args?: SelectSubset<T, QueueItemFindFirstArgs<ExtArgs>>): Prisma__QueueItemClient<$Result.GetResult<Prisma.$QueueItemPayload<ExtArgs>, T, "findFirst", GlobalOmitOptions> | null, null, ExtArgs, GlobalOmitOptions>

    /**
     * Find the first QueueItem that matches the filter or
     * throw `PrismaKnownClientError` with `P2025` code if no matches were found.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {QueueItemFindFirstOrThrowArgs} args - Arguments to find a QueueItem
     * @example
     * // Get one QueueItem
     * const queueItem = await prisma.queueItem.findFirstOrThrow({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findFirstOrThrow<T extends QueueItemFindFirstOrThrowArgs>(args?: SelectSubset<T, QueueItemFindFirstOrThrowArgs<ExtArgs>>): Prisma__QueueItemClient<$Result.GetResult<Prisma.$QueueItemPayload<ExtArgs>, T, "findFirstOrThrow", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Find zero or more QueueItems that matches the filter.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {QueueItemFindManyArgs} args - Arguments to filter and select certain fields only.
     * @example
     * // Get all QueueItems
     * const queueItems = await prisma.queueItem.findMany()
     * 
     * // Get first 10 QueueItems
     * const queueItems = await prisma.queueItem.findMany({ take: 10 })
     * 
     * // Only select the `id`
     * const queueItemWithIdOnly = await prisma.queueItem.findMany({ select: { id: true } })
     * 
     */
    findMany<T extends QueueItemFindManyArgs>(args?: SelectSubset<T, QueueItemFindManyArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$QueueItemPayload<ExtArgs>, T, "findMany", GlobalOmitOptions>>

    /**
     * Create a QueueItem.
     * @param {QueueItemCreateArgs} args - Arguments to create a QueueItem.
     * @example
     * // Create one QueueItem
     * const QueueItem = await prisma.queueItem.create({
     *   data: {
     *     // ... data to create a QueueItem
     *   }
     * })
     * 
     */
    create<T extends QueueItemCreateArgs>(args: SelectSubset<T, QueueItemCreateArgs<ExtArgs>>): Prisma__QueueItemClient<$Result.GetResult<Prisma.$QueueItemPayload<ExtArgs>, T, "create", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Create many QueueItems.
     * @param {QueueItemCreateManyArgs} args - Arguments to create many QueueItems.
     * @example
     * // Create many QueueItems
     * const queueItem = await prisma.queueItem.createMany({
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     *     
     */
    createMany<T extends QueueItemCreateManyArgs>(args?: SelectSubset<T, QueueItemCreateManyArgs<ExtArgs>>): Prisma.PrismaPromise<BatchPayload>

    /**
     * Create many QueueItems and returns the data saved in the database.
     * @param {QueueItemCreateManyAndReturnArgs} args - Arguments to create many QueueItems.
     * @example
     * // Create many QueueItems
     * const queueItem = await prisma.queueItem.createManyAndReturn({
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     * 
     * // Create many QueueItems and only return the `id`
     * const queueItemWithIdOnly = await prisma.queueItem.createManyAndReturn({
     *   select: { id: true },
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * 
     */
    createManyAndReturn<T extends QueueItemCreateManyAndReturnArgs>(args?: SelectSubset<T, QueueItemCreateManyAndReturnArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$QueueItemPayload<ExtArgs>, T, "createManyAndReturn", GlobalOmitOptions>>

    /**
     * Delete a QueueItem.
     * @param {QueueItemDeleteArgs} args - Arguments to delete one QueueItem.
     * @example
     * // Delete one QueueItem
     * const QueueItem = await prisma.queueItem.delete({
     *   where: {
     *     // ... filter to delete one QueueItem
     *   }
     * })
     * 
     */
    delete<T extends QueueItemDeleteArgs>(args: SelectSubset<T, QueueItemDeleteArgs<ExtArgs>>): Prisma__QueueItemClient<$Result.GetResult<Prisma.$QueueItemPayload<ExtArgs>, T, "delete", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Update one QueueItem.
     * @param {QueueItemUpdateArgs} args - Arguments to update one QueueItem.
     * @example
     * // Update one QueueItem
     * const queueItem = await prisma.queueItem.update({
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: {
     *     // ... provide data here
     *   }
     * })
     * 
     */
    update<T extends QueueItemUpdateArgs>(args: SelectSubset<T, QueueItemUpdateArgs<ExtArgs>>): Prisma__QueueItemClient<$Result.GetResult<Prisma.$QueueItemPayload<ExtArgs>, T, "update", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Delete zero or more QueueItems.
     * @param {QueueItemDeleteManyArgs} args - Arguments to filter QueueItems to delete.
     * @example
     * // Delete a few QueueItems
     * const { count } = await prisma.queueItem.deleteMany({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     * 
     */
    deleteMany<T extends QueueItemDeleteManyArgs>(args?: SelectSubset<T, QueueItemDeleteManyArgs<ExtArgs>>): Prisma.PrismaPromise<BatchPayload>

    /**
     * Update zero or more QueueItems.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {QueueItemUpdateManyArgs} args - Arguments to update one or more rows.
     * @example
     * // Update many QueueItems
     * const queueItem = await prisma.queueItem.updateMany({
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: {
     *     // ... provide data here
     *   }
     * })
     * 
     */
    updateMany<T extends QueueItemUpdateManyArgs>(args: SelectSubset<T, QueueItemUpdateManyArgs<ExtArgs>>): Prisma.PrismaPromise<BatchPayload>

    /**
     * Update zero or more QueueItems and returns the data updated in the database.
     * @param {QueueItemUpdateManyAndReturnArgs} args - Arguments to update many QueueItems.
     * @example
     * // Update many QueueItems
     * const queueItem = await prisma.queueItem.updateManyAndReturn({
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     * 
     * // Update zero or more QueueItems and only return the `id`
     * const queueItemWithIdOnly = await prisma.queueItem.updateManyAndReturn({
     *   select: { id: true },
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * 
     */
    updateManyAndReturn<T extends QueueItemUpdateManyAndReturnArgs>(args: SelectSubset<T, QueueItemUpdateManyAndReturnArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$QueueItemPayload<ExtArgs>, T, "updateManyAndReturn", GlobalOmitOptions>>

    /**
     * Create or update one QueueItem.
     * @param {QueueItemUpsertArgs} args - Arguments to update or create a QueueItem.
     * @example
     * // Update or create a QueueItem
     * const queueItem = await prisma.queueItem.upsert({
     *   create: {
     *     // ... data to create a QueueItem
     *   },
     *   update: {
     *     // ... in case it already exists, update
     *   },
     *   where: {
     *     // ... the filter for the QueueItem we want to update
     *   }
     * })
     */
    upsert<T extends QueueItemUpsertArgs>(args: SelectSubset<T, QueueItemUpsertArgs<ExtArgs>>): Prisma__QueueItemClient<$Result.GetResult<Prisma.$QueueItemPayload<ExtArgs>, T, "upsert", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>


    /**
     * Count the number of QueueItems.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {QueueItemCountArgs} args - Arguments to filter QueueItems to count.
     * @example
     * // Count the number of QueueItems
     * const count = await prisma.queueItem.count({
     *   where: {
     *     // ... the filter for the QueueItems we want to count
     *   }
     * })
    **/
    count<T extends QueueItemCountArgs>(
      args?: Subset<T, QueueItemCountArgs>,
    ): Prisma.PrismaPromise<
      T extends $Utils.Record<'select', any>
        ? T['select'] extends true
          ? number
          : GetScalarType<T['select'], QueueItemCountAggregateOutputType>
        : number
    >

    /**
     * Allows you to perform aggregations operations on a QueueItem.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {QueueItemAggregateArgs} args - Select which aggregations you would like to apply and on what fields.
     * @example
     * // Ordered by age ascending
     * // Where email contains prisma.io
     * // Limited to the 10 users
     * const aggregations = await prisma.user.aggregate({
     *   _avg: {
     *     age: true,
     *   },
     *   where: {
     *     email: {
     *       contains: "prisma.io",
     *     },
     *   },
     *   orderBy: {
     *     age: "asc",
     *   },
     *   take: 10,
     * })
    **/
    aggregate<T extends QueueItemAggregateArgs>(args: Subset<T, QueueItemAggregateArgs>): Prisma.PrismaPromise<GetQueueItemAggregateType<T>>

    /**
     * Group by QueueItem.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {QueueItemGroupByArgs} args - Group by arguments.
     * @example
     * // Group by city, order by createdAt, get count
     * const result = await prisma.user.groupBy({
     *   by: ['city', 'createdAt'],
     *   orderBy: {
     *     createdAt: true
     *   },
     *   _count: {
     *     _all: true
     *   },
     * })
     * 
    **/
    groupBy<
      T extends QueueItemGroupByArgs,
      HasSelectOrTake extends Or<
        Extends<'skip', Keys<T>>,
        Extends<'take', Keys<T>>
      >,
      OrderByArg extends True extends HasSelectOrTake
        ? { orderBy: QueueItemGroupByArgs['orderBy'] }
        : { orderBy?: QueueItemGroupByArgs['orderBy'] },
      OrderFields extends ExcludeUnderscoreKeys<Keys<MaybeTupleToUnion<T['orderBy']>>>,
      ByFields extends MaybeTupleToUnion<T['by']>,
      ByValid extends Has<ByFields, OrderFields>,
      HavingFields extends GetHavingFields<T['having']>,
      HavingValid extends Has<ByFields, HavingFields>,
      ByEmpty extends T['by'] extends never[] ? True : False,
      InputErrors extends ByEmpty extends True
      ? `Error: "by" must not be empty.`
      : HavingValid extends False
      ? {
          [P in HavingFields]: P extends ByFields
            ? never
            : P extends string
            ? `Error: Field "${P}" used in "having" needs to be provided in "by".`
            : [
                Error,
                'Field ',
                P,
                ` in "having" needs to be provided in "by"`,
              ]
        }[HavingFields]
      : 'take' extends Keys<T>
      ? 'orderBy' extends Keys<T>
        ? ByValid extends True
          ? {}
          : {
              [P in OrderFields]: P extends ByFields
                ? never
                : `Error: Field "${P}" in "orderBy" needs to be provided in "by"`
            }[OrderFields]
        : 'Error: If you provide "take", you also need to provide "orderBy"'
      : 'skip' extends Keys<T>
      ? 'orderBy' extends Keys<T>
        ? ByValid extends True
          ? {}
          : {
              [P in OrderFields]: P extends ByFields
                ? never
                : `Error: Field "${P}" in "orderBy" needs to be provided in "by"`
            }[OrderFields]
        : 'Error: If you provide "skip", you also need to provide "orderBy"'
      : ByValid extends True
      ? {}
      : {
          [P in OrderFields]: P extends ByFields
            ? never
            : `Error: Field "${P}" in "orderBy" needs to be provided in "by"`
        }[OrderFields]
    >(args: SubsetIntersection<T, QueueItemGroupByArgs, OrderByArg> & InputErrors): {} extends InputErrors ? GetQueueItemGroupByPayload<T> : Prisma.PrismaPromise<InputErrors>
  /**
   * Fields of the QueueItem model
   */
  readonly fields: QueueItemFieldRefs;
  }

  /**
   * The delegate class that acts as a "Promise-like" for QueueItem.
   * Why is this prefixed with `Prisma__`?
   * Because we want to prevent naming conflicts as mentioned in
   * https://github.com/prisma/prisma-client-js/issues/707
   */
  export interface Prisma__QueueItemClient<T, Null = never, ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs, GlobalOmitOptions = {}> extends Prisma.PrismaPromise<T> {
    readonly [Symbol.toStringTag]: "PrismaPromise"
    /**
     * Attaches callbacks for the resolution and/or rejection of the Promise.
     * @param onfulfilled The callback to execute when the Promise is resolved.
     * @param onrejected The callback to execute when the Promise is rejected.
     * @returns A Promise for the completion of which ever callback is executed.
     */
    then<TResult1 = T, TResult2 = never>(onfulfilled?: ((value: T) => TResult1 | PromiseLike<TResult1>) | undefined | null, onrejected?: ((reason: any) => TResult2 | PromiseLike<TResult2>) | undefined | null): $Utils.JsPromise<TResult1 | TResult2>
    /**
     * Attaches a callback for only the rejection of the Promise.
     * @param onrejected The callback to execute when the Promise is rejected.
     * @returns A Promise for the completion of the callback.
     */
    catch<TResult = never>(onrejected?: ((reason: any) => TResult | PromiseLike<TResult>) | undefined | null): $Utils.JsPromise<T | TResult>
    /**
     * Attaches a callback that is invoked when the Promise is settled (fulfilled or rejected). The
     * resolved value cannot be modified from the callback.
     * @param onfinally The callback to execute when the Promise is settled (fulfilled or rejected).
     * @returns A Promise for the completion of the callback.
     */
    finally(onfinally?: (() => void) | undefined | null): $Utils.JsPromise<T>
  }




  /**
   * Fields of the QueueItem model
   */
  interface QueueItemFieldRefs {
    readonly id: FieldRef<"QueueItem", 'String'>
    readonly query_iri: FieldRef<"QueueItem", 'String'>
    readonly query_name: FieldRef<"QueueItem", 'String'>
    readonly query_request: FieldRef<"QueueItem", 'Json'>
    readonly user_id: FieldRef<"QueueItem", 'String'>
    readonly user_name: FieldRef<"QueueItem", 'String'>
    readonly queued_at: FieldRef<"QueueItem", 'DateTime'>
    readonly started_at: FieldRef<"QueueItem", 'DateTime'>
    readonly pid: FieldRef<"QueueItem", 'Int'>
    readonly finished_at: FieldRef<"QueueItem", 'DateTime'>
    readonly killed_at: FieldRef<"QueueItem", 'DateTime'>
    readonly status: FieldRef<"QueueItem", 'String'>
    readonly error: FieldRef<"QueueItem", 'String'>
  }
    

  // Custom InputTypes
  /**
   * QueueItem findUnique
   */
  export type QueueItemFindUniqueArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the QueueItem
     */
    select?: QueueItemSelect<ExtArgs> | null
    /**
     * Omit specific fields from the QueueItem
     */
    omit?: QueueItemOmit<ExtArgs> | null
    /**
     * Filter, which QueueItem to fetch.
     */
    where: QueueItemWhereUniqueInput
  }

  /**
   * QueueItem findUniqueOrThrow
   */
  export type QueueItemFindUniqueOrThrowArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the QueueItem
     */
    select?: QueueItemSelect<ExtArgs> | null
    /**
     * Omit specific fields from the QueueItem
     */
    omit?: QueueItemOmit<ExtArgs> | null
    /**
     * Filter, which QueueItem to fetch.
     */
    where: QueueItemWhereUniqueInput
  }

  /**
   * QueueItem findFirst
   */
  export type QueueItemFindFirstArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the QueueItem
     */
    select?: QueueItemSelect<ExtArgs> | null
    /**
     * Omit specific fields from the QueueItem
     */
    omit?: QueueItemOmit<ExtArgs> | null
    /**
     * Filter, which QueueItem to fetch.
     */
    where?: QueueItemWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of QueueItems to fetch.
     */
    orderBy?: QueueItemOrderByWithRelationInput | QueueItemOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the position for searching for QueueItems.
     */
    cursor?: QueueItemWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` QueueItems from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` QueueItems.
     */
    skip?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/distinct Distinct Docs}
     * 
     * Filter by unique combinations of QueueItems.
     */
    distinct?: QueueItemScalarFieldEnum | QueueItemScalarFieldEnum[]
  }

  /**
   * QueueItem findFirstOrThrow
   */
  export type QueueItemFindFirstOrThrowArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the QueueItem
     */
    select?: QueueItemSelect<ExtArgs> | null
    /**
     * Omit specific fields from the QueueItem
     */
    omit?: QueueItemOmit<ExtArgs> | null
    /**
     * Filter, which QueueItem to fetch.
     */
    where?: QueueItemWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of QueueItems to fetch.
     */
    orderBy?: QueueItemOrderByWithRelationInput | QueueItemOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the position for searching for QueueItems.
     */
    cursor?: QueueItemWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` QueueItems from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` QueueItems.
     */
    skip?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/distinct Distinct Docs}
     * 
     * Filter by unique combinations of QueueItems.
     */
    distinct?: QueueItemScalarFieldEnum | QueueItemScalarFieldEnum[]
  }

  /**
   * QueueItem findMany
   */
  export type QueueItemFindManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the QueueItem
     */
    select?: QueueItemSelect<ExtArgs> | null
    /**
     * Omit specific fields from the QueueItem
     */
    omit?: QueueItemOmit<ExtArgs> | null
    /**
     * Filter, which QueueItems to fetch.
     */
    where?: QueueItemWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of QueueItems to fetch.
     */
    orderBy?: QueueItemOrderByWithRelationInput | QueueItemOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the position for listing QueueItems.
     */
    cursor?: QueueItemWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` QueueItems from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` QueueItems.
     */
    skip?: number
    distinct?: QueueItemScalarFieldEnum | QueueItemScalarFieldEnum[]
  }

  /**
   * QueueItem create
   */
  export type QueueItemCreateArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the QueueItem
     */
    select?: QueueItemSelect<ExtArgs> | null
    /**
     * Omit specific fields from the QueueItem
     */
    omit?: QueueItemOmit<ExtArgs> | null
    /**
     * The data needed to create a QueueItem.
     */
    data: XOR<QueueItemCreateInput, QueueItemUncheckedCreateInput>
  }

  /**
   * QueueItem createMany
   */
  export type QueueItemCreateManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * The data used to create many QueueItems.
     */
    data: QueueItemCreateManyInput | QueueItemCreateManyInput[]
    skipDuplicates?: boolean
  }

  /**
   * QueueItem createManyAndReturn
   */
  export type QueueItemCreateManyAndReturnArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the QueueItem
     */
    select?: QueueItemSelectCreateManyAndReturn<ExtArgs> | null
    /**
     * Omit specific fields from the QueueItem
     */
    omit?: QueueItemOmit<ExtArgs> | null
    /**
     * The data used to create many QueueItems.
     */
    data: QueueItemCreateManyInput | QueueItemCreateManyInput[]
    skipDuplicates?: boolean
  }

  /**
   * QueueItem update
   */
  export type QueueItemUpdateArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the QueueItem
     */
    select?: QueueItemSelect<ExtArgs> | null
    /**
     * Omit specific fields from the QueueItem
     */
    omit?: QueueItemOmit<ExtArgs> | null
    /**
     * The data needed to update a QueueItem.
     */
    data: XOR<QueueItemUpdateInput, QueueItemUncheckedUpdateInput>
    /**
     * Choose, which QueueItem to update.
     */
    where: QueueItemWhereUniqueInput
  }

  /**
   * QueueItem updateMany
   */
  export type QueueItemUpdateManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * The data used to update QueueItems.
     */
    data: XOR<QueueItemUpdateManyMutationInput, QueueItemUncheckedUpdateManyInput>
    /**
     * Filter which QueueItems to update
     */
    where?: QueueItemWhereInput
    /**
     * Limit how many QueueItems to update.
     */
    limit?: number
  }

  /**
   * QueueItem updateManyAndReturn
   */
  export type QueueItemUpdateManyAndReturnArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the QueueItem
     */
    select?: QueueItemSelectUpdateManyAndReturn<ExtArgs> | null
    /**
     * Omit specific fields from the QueueItem
     */
    omit?: QueueItemOmit<ExtArgs> | null
    /**
     * The data used to update QueueItems.
     */
    data: XOR<QueueItemUpdateManyMutationInput, QueueItemUncheckedUpdateManyInput>
    /**
     * Filter which QueueItems to update
     */
    where?: QueueItemWhereInput
    /**
     * Limit how many QueueItems to update.
     */
    limit?: number
  }

  /**
   * QueueItem upsert
   */
  export type QueueItemUpsertArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the QueueItem
     */
    select?: QueueItemSelect<ExtArgs> | null
    /**
     * Omit specific fields from the QueueItem
     */
    omit?: QueueItemOmit<ExtArgs> | null
    /**
     * The filter to search for the QueueItem to update in case it exists.
     */
    where: QueueItemWhereUniqueInput
    /**
     * In case the QueueItem found by the `where` argument doesn't exist, create a new QueueItem with this data.
     */
    create: XOR<QueueItemCreateInput, QueueItemUncheckedCreateInput>
    /**
     * In case the QueueItem was found with the provided `where` argument, update it with this data.
     */
    update: XOR<QueueItemUpdateInput, QueueItemUncheckedUpdateInput>
  }

  /**
   * QueueItem delete
   */
  export type QueueItemDeleteArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the QueueItem
     */
    select?: QueueItemSelect<ExtArgs> | null
    /**
     * Omit specific fields from the QueueItem
     */
    omit?: QueueItemOmit<ExtArgs> | null
    /**
     * Filter which QueueItem to delete.
     */
    where: QueueItemWhereUniqueInput
  }

  /**
   * QueueItem deleteMany
   */
  export type QueueItemDeleteManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Filter which QueueItems to delete
     */
    where?: QueueItemWhereInput
    /**
     * Limit how many QueueItems to delete.
     */
    limit?: number
  }

  /**
   * QueueItem without action
   */
  export type QueueItemDefaultArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the QueueItem
     */
    select?: QueueItemSelect<ExtArgs> | null
    /**
     * Omit specific fields from the QueueItem
     */
    omit?: QueueItemOmit<ExtArgs> | null
  }


  /**
   * Enums
   */

  export const TransactionIsolationLevel: {
    ReadUncommitted: 'ReadUncommitted',
    ReadCommitted: 'ReadCommitted',
    RepeatableRead: 'RepeatableRead',
    Serializable: 'Serializable'
  };

  export type TransactionIsolationLevel = (typeof TransactionIsolationLevel)[keyof typeof TransactionIsolationLevel]


  export const QueueItemScalarFieldEnum: {
    id: 'id',
    query_iri: 'query_iri',
    query_name: 'query_name',
    query_request: 'query_request',
    user_id: 'user_id',
    user_name: 'user_name',
    queued_at: 'queued_at',
    started_at: 'started_at',
    pid: 'pid',
    finished_at: 'finished_at',
    killed_at: 'killed_at',
    status: 'status',
    error: 'error'
  };

  export type QueueItemScalarFieldEnum = (typeof QueueItemScalarFieldEnum)[keyof typeof QueueItemScalarFieldEnum]


  export const SortOrder: {
    asc: 'asc',
    desc: 'desc'
  };

  export type SortOrder = (typeof SortOrder)[keyof typeof SortOrder]


  export const JsonNullValueInput: {
    JsonNull: typeof JsonNull
  };

  export type JsonNullValueInput = (typeof JsonNullValueInput)[keyof typeof JsonNullValueInput]


  export const QueryMode: {
    default: 'default',
    insensitive: 'insensitive'
  };

  export type QueryMode = (typeof QueryMode)[keyof typeof QueryMode]


  export const JsonNullValueFilter: {
    DbNull: typeof DbNull,
    JsonNull: typeof JsonNull,
    AnyNull: typeof AnyNull
  };

  export type JsonNullValueFilter = (typeof JsonNullValueFilter)[keyof typeof JsonNullValueFilter]


  export const NullsOrder: {
    first: 'first',
    last: 'last'
  };

  export type NullsOrder = (typeof NullsOrder)[keyof typeof NullsOrder]


  /**
   * Field references
   */


  /**
   * Reference to a field of type 'String'
   */
  export type StringFieldRefInput<$PrismaModel> = FieldRefInputType<$PrismaModel, 'String'>
    


  /**
   * Reference to a field of type 'String[]'
   */
  export type ListStringFieldRefInput<$PrismaModel> = FieldRefInputType<$PrismaModel, 'String[]'>
    


  /**
   * Reference to a field of type 'Json'
   */
  export type JsonFieldRefInput<$PrismaModel> = FieldRefInputType<$PrismaModel, 'Json'>
    


  /**
   * Reference to a field of type 'QueryMode'
   */
  export type EnumQueryModeFieldRefInput<$PrismaModel> = FieldRefInputType<$PrismaModel, 'QueryMode'>
    


  /**
   * Reference to a field of type 'DateTime'
   */
  export type DateTimeFieldRefInput<$PrismaModel> = FieldRefInputType<$PrismaModel, 'DateTime'>
    


  /**
   * Reference to a field of type 'DateTime[]'
   */
  export type ListDateTimeFieldRefInput<$PrismaModel> = FieldRefInputType<$PrismaModel, 'DateTime[]'>
    


  /**
   * Reference to a field of type 'Int'
   */
  export type IntFieldRefInput<$PrismaModel> = FieldRefInputType<$PrismaModel, 'Int'>
    


  /**
   * Reference to a field of type 'Int[]'
   */
  export type ListIntFieldRefInput<$PrismaModel> = FieldRefInputType<$PrismaModel, 'Int[]'>
    


  /**
   * Reference to a field of type 'Float'
   */
  export type FloatFieldRefInput<$PrismaModel> = FieldRefInputType<$PrismaModel, 'Float'>
    


  /**
   * Reference to a field of type 'Float[]'
   */
  export type ListFloatFieldRefInput<$PrismaModel> = FieldRefInputType<$PrismaModel, 'Float[]'>
    
  /**
   * Deep Input Types
   */


  export type QueueItemWhereInput = {
    AND?: QueueItemWhereInput | QueueItemWhereInput[]
    OR?: QueueItemWhereInput[]
    NOT?: QueueItemWhereInput | QueueItemWhereInput[]
    id?: StringFilter<"QueueItem"> | string
    query_iri?: StringFilter<"QueueItem"> | string
    query_name?: StringFilter<"QueueItem"> | string
    query_request?: JsonFilter<"QueueItem">
    user_id?: StringFilter<"QueueItem"> | string
    user_name?: StringFilter<"QueueItem"> | string
    queued_at?: DateTimeNullableFilter<"QueueItem"> | Date | string | null
    started_at?: DateTimeNullableFilter<"QueueItem"> | Date | string | null
    pid?: IntFilter<"QueueItem"> | number
    finished_at?: DateTimeNullableFilter<"QueueItem"> | Date | string | null
    killed_at?: DateTimeNullableFilter<"QueueItem"> | Date | string | null
    status?: StringFilter<"QueueItem"> | string
    error?: StringNullableFilter<"QueueItem"> | string | null
  }

  export type QueueItemOrderByWithRelationInput = {
    id?: SortOrder
    query_iri?: SortOrder
    query_name?: SortOrder
    query_request?: SortOrder
    user_id?: SortOrder
    user_name?: SortOrder
    queued_at?: SortOrderInput | SortOrder
    started_at?: SortOrderInput | SortOrder
    pid?: SortOrder
    finished_at?: SortOrderInput | SortOrder
    killed_at?: SortOrderInput | SortOrder
    status?: SortOrder
    error?: SortOrderInput | SortOrder
  }

  export type QueueItemWhereUniqueInput = Prisma.AtLeast<{
    id?: string
    AND?: QueueItemWhereInput | QueueItemWhereInput[]
    OR?: QueueItemWhereInput[]
    NOT?: QueueItemWhereInput | QueueItemWhereInput[]
    query_iri?: StringFilter<"QueueItem"> | string
    query_name?: StringFilter<"QueueItem"> | string
    query_request?: JsonFilter<"QueueItem">
    user_id?: StringFilter<"QueueItem"> | string
    user_name?: StringFilter<"QueueItem"> | string
    queued_at?: DateTimeNullableFilter<"QueueItem"> | Date | string | null
    started_at?: DateTimeNullableFilter<"QueueItem"> | Date | string | null
    pid?: IntFilter<"QueueItem"> | number
    finished_at?: DateTimeNullableFilter<"QueueItem"> | Date | string | null
    killed_at?: DateTimeNullableFilter<"QueueItem"> | Date | string | null
    status?: StringFilter<"QueueItem"> | string
    error?: StringNullableFilter<"QueueItem"> | string | null
  }, "id">

  export type QueueItemOrderByWithAggregationInput = {
    id?: SortOrder
    query_iri?: SortOrder
    query_name?: SortOrder
    query_request?: SortOrder
    user_id?: SortOrder
    user_name?: SortOrder
    queued_at?: SortOrderInput | SortOrder
    started_at?: SortOrderInput | SortOrder
    pid?: SortOrder
    finished_at?: SortOrderInput | SortOrder
    killed_at?: SortOrderInput | SortOrder
    status?: SortOrder
    error?: SortOrderInput | SortOrder
    _count?: QueueItemCountOrderByAggregateInput
    _avg?: QueueItemAvgOrderByAggregateInput
    _max?: QueueItemMaxOrderByAggregateInput
    _min?: QueueItemMinOrderByAggregateInput
    _sum?: QueueItemSumOrderByAggregateInput
  }

  export type QueueItemScalarWhereWithAggregatesInput = {
    AND?: QueueItemScalarWhereWithAggregatesInput | QueueItemScalarWhereWithAggregatesInput[]
    OR?: QueueItemScalarWhereWithAggregatesInput[]
    NOT?: QueueItemScalarWhereWithAggregatesInput | QueueItemScalarWhereWithAggregatesInput[]
    id?: StringWithAggregatesFilter<"QueueItem"> | string
    query_iri?: StringWithAggregatesFilter<"QueueItem"> | string
    query_name?: StringWithAggregatesFilter<"QueueItem"> | string
    query_request?: JsonWithAggregatesFilter<"QueueItem">
    user_id?: StringWithAggregatesFilter<"QueueItem"> | string
    user_name?: StringWithAggregatesFilter<"QueueItem"> | string
    queued_at?: DateTimeNullableWithAggregatesFilter<"QueueItem"> | Date | string | null
    started_at?: DateTimeNullableWithAggregatesFilter<"QueueItem"> | Date | string | null
    pid?: IntWithAggregatesFilter<"QueueItem"> | number
    finished_at?: DateTimeNullableWithAggregatesFilter<"QueueItem"> | Date | string | null
    killed_at?: DateTimeNullableWithAggregatesFilter<"QueueItem"> | Date | string | null
    status?: StringWithAggregatesFilter<"QueueItem"> | string
    error?: StringNullableWithAggregatesFilter<"QueueItem"> | string | null
  }

  export type QueueItemCreateInput = {
    id?: string
    query_iri: string
    query_name: string
    query_request: JsonNullValueInput | InputJsonValue
    user_id?: string
    user_name: string
    queued_at?: Date | string | null
    started_at?: Date | string | null
    pid: number
    finished_at?: Date | string | null
    killed_at?: Date | string | null
    status: string
    error?: string | null
  }

  export type QueueItemUncheckedCreateInput = {
    id?: string
    query_iri: string
    query_name: string
    query_request: JsonNullValueInput | InputJsonValue
    user_id?: string
    user_name: string
    queued_at?: Date | string | null
    started_at?: Date | string | null
    pid: number
    finished_at?: Date | string | null
    killed_at?: Date | string | null
    status: string
    error?: string | null
  }

  export type QueueItemUpdateInput = {
    id?: StringFieldUpdateOperationsInput | string
    query_iri?: StringFieldUpdateOperationsInput | string
    query_name?: StringFieldUpdateOperationsInput | string
    query_request?: JsonNullValueInput | InputJsonValue
    user_id?: StringFieldUpdateOperationsInput | string
    user_name?: StringFieldUpdateOperationsInput | string
    queued_at?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
    started_at?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
    pid?: IntFieldUpdateOperationsInput | number
    finished_at?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
    killed_at?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
    status?: StringFieldUpdateOperationsInput | string
    error?: NullableStringFieldUpdateOperationsInput | string | null
  }

  export type QueueItemUncheckedUpdateInput = {
    id?: StringFieldUpdateOperationsInput | string
    query_iri?: StringFieldUpdateOperationsInput | string
    query_name?: StringFieldUpdateOperationsInput | string
    query_request?: JsonNullValueInput | InputJsonValue
    user_id?: StringFieldUpdateOperationsInput | string
    user_name?: StringFieldUpdateOperationsInput | string
    queued_at?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
    started_at?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
    pid?: IntFieldUpdateOperationsInput | number
    finished_at?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
    killed_at?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
    status?: StringFieldUpdateOperationsInput | string
    error?: NullableStringFieldUpdateOperationsInput | string | null
  }

  export type QueueItemCreateManyInput = {
    id?: string
    query_iri: string
    query_name: string
    query_request: JsonNullValueInput | InputJsonValue
    user_id?: string
    user_name: string
    queued_at?: Date | string | null
    started_at?: Date | string | null
    pid: number
    finished_at?: Date | string | null
    killed_at?: Date | string | null
    status: string
    error?: string | null
  }

  export type QueueItemUpdateManyMutationInput = {
    id?: StringFieldUpdateOperationsInput | string
    query_iri?: StringFieldUpdateOperationsInput | string
    query_name?: StringFieldUpdateOperationsInput | string
    query_request?: JsonNullValueInput | InputJsonValue
    user_id?: StringFieldUpdateOperationsInput | string
    user_name?: StringFieldUpdateOperationsInput | string
    queued_at?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
    started_at?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
    pid?: IntFieldUpdateOperationsInput | number
    finished_at?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
    killed_at?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
    status?: StringFieldUpdateOperationsInput | string
    error?: NullableStringFieldUpdateOperationsInput | string | null
  }

  export type QueueItemUncheckedUpdateManyInput = {
    id?: StringFieldUpdateOperationsInput | string
    query_iri?: StringFieldUpdateOperationsInput | string
    query_name?: StringFieldUpdateOperationsInput | string
    query_request?: JsonNullValueInput | InputJsonValue
    user_id?: StringFieldUpdateOperationsInput | string
    user_name?: StringFieldUpdateOperationsInput | string
    queued_at?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
    started_at?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
    pid?: IntFieldUpdateOperationsInput | number
    finished_at?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
    killed_at?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
    status?: StringFieldUpdateOperationsInput | string
    error?: NullableStringFieldUpdateOperationsInput | string | null
  }

  export type StringFilter<$PrismaModel = never> = {
    equals?: string | StringFieldRefInput<$PrismaModel>
    in?: string[] | ListStringFieldRefInput<$PrismaModel>
    notIn?: string[] | ListStringFieldRefInput<$PrismaModel>
    lt?: string | StringFieldRefInput<$PrismaModel>
    lte?: string | StringFieldRefInput<$PrismaModel>
    gt?: string | StringFieldRefInput<$PrismaModel>
    gte?: string | StringFieldRefInput<$PrismaModel>
    contains?: string | StringFieldRefInput<$PrismaModel>
    startsWith?: string | StringFieldRefInput<$PrismaModel>
    endsWith?: string | StringFieldRefInput<$PrismaModel>
    mode?: QueryMode
    not?: NestedStringFilter<$PrismaModel> | string
  }
  export type JsonFilter<$PrismaModel = never> =
    | PatchUndefined<
        Either<Required<JsonFilterBase<$PrismaModel>>, Exclude<keyof Required<JsonFilterBase<$PrismaModel>>, 'path'>>,
        Required<JsonFilterBase<$PrismaModel>>
      >
    | OptionalFlat<Omit<Required<JsonFilterBase<$PrismaModel>>, 'path'>>

  export type JsonFilterBase<$PrismaModel = never> = {
    equals?: InputJsonValue | JsonFieldRefInput<$PrismaModel> | JsonNullValueFilter
    path?: string[]
    mode?: QueryMode | EnumQueryModeFieldRefInput<$PrismaModel>
    string_contains?: string | StringFieldRefInput<$PrismaModel>
    string_starts_with?: string | StringFieldRefInput<$PrismaModel>
    string_ends_with?: string | StringFieldRefInput<$PrismaModel>
    array_starts_with?: InputJsonValue | JsonFieldRefInput<$PrismaModel> | null
    array_ends_with?: InputJsonValue | JsonFieldRefInput<$PrismaModel> | null
    array_contains?: InputJsonValue | JsonFieldRefInput<$PrismaModel> | null
    lt?: InputJsonValue | JsonFieldRefInput<$PrismaModel>
    lte?: InputJsonValue | JsonFieldRefInput<$PrismaModel>
    gt?: InputJsonValue | JsonFieldRefInput<$PrismaModel>
    gte?: InputJsonValue | JsonFieldRefInput<$PrismaModel>
    not?: InputJsonValue | JsonFieldRefInput<$PrismaModel> | JsonNullValueFilter
  }

  export type DateTimeNullableFilter<$PrismaModel = never> = {
    equals?: Date | string | DateTimeFieldRefInput<$PrismaModel> | null
    in?: Date[] | string[] | ListDateTimeFieldRefInput<$PrismaModel> | null
    notIn?: Date[] | string[] | ListDateTimeFieldRefInput<$PrismaModel> | null
    lt?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    lte?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    gt?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    gte?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    not?: NestedDateTimeNullableFilter<$PrismaModel> | Date | string | null
  }

  export type IntFilter<$PrismaModel = never> = {
    equals?: number | IntFieldRefInput<$PrismaModel>
    in?: number[] | ListIntFieldRefInput<$PrismaModel>
    notIn?: number[] | ListIntFieldRefInput<$PrismaModel>
    lt?: number | IntFieldRefInput<$PrismaModel>
    lte?: number | IntFieldRefInput<$PrismaModel>
    gt?: number | IntFieldRefInput<$PrismaModel>
    gte?: number | IntFieldRefInput<$PrismaModel>
    not?: NestedIntFilter<$PrismaModel> | number
  }

  export type StringNullableFilter<$PrismaModel = never> = {
    equals?: string | StringFieldRefInput<$PrismaModel> | null
    in?: string[] | ListStringFieldRefInput<$PrismaModel> | null
    notIn?: string[] | ListStringFieldRefInput<$PrismaModel> | null
    lt?: string | StringFieldRefInput<$PrismaModel>
    lte?: string | StringFieldRefInput<$PrismaModel>
    gt?: string | StringFieldRefInput<$PrismaModel>
    gte?: string | StringFieldRefInput<$PrismaModel>
    contains?: string | StringFieldRefInput<$PrismaModel>
    startsWith?: string | StringFieldRefInput<$PrismaModel>
    endsWith?: string | StringFieldRefInput<$PrismaModel>
    mode?: QueryMode
    not?: NestedStringNullableFilter<$PrismaModel> | string | null
  }

  export type SortOrderInput = {
    sort: SortOrder
    nulls?: NullsOrder
  }

  export type QueueItemCountOrderByAggregateInput = {
    id?: SortOrder
    query_iri?: SortOrder
    query_name?: SortOrder
    query_request?: SortOrder
    user_id?: SortOrder
    user_name?: SortOrder
    queued_at?: SortOrder
    started_at?: SortOrder
    pid?: SortOrder
    finished_at?: SortOrder
    killed_at?: SortOrder
    status?: SortOrder
    error?: SortOrder
  }

  export type QueueItemAvgOrderByAggregateInput = {
    pid?: SortOrder
  }

  export type QueueItemMaxOrderByAggregateInput = {
    id?: SortOrder
    query_iri?: SortOrder
    query_name?: SortOrder
    user_id?: SortOrder
    user_name?: SortOrder
    queued_at?: SortOrder
    started_at?: SortOrder
    pid?: SortOrder
    finished_at?: SortOrder
    killed_at?: SortOrder
    status?: SortOrder
    error?: SortOrder
  }

  export type QueueItemMinOrderByAggregateInput = {
    id?: SortOrder
    query_iri?: SortOrder
    query_name?: SortOrder
    user_id?: SortOrder
    user_name?: SortOrder
    queued_at?: SortOrder
    started_at?: SortOrder
    pid?: SortOrder
    finished_at?: SortOrder
    killed_at?: SortOrder
    status?: SortOrder
    error?: SortOrder
  }

  export type QueueItemSumOrderByAggregateInput = {
    pid?: SortOrder
  }

  export type StringWithAggregatesFilter<$PrismaModel = never> = {
    equals?: string | StringFieldRefInput<$PrismaModel>
    in?: string[] | ListStringFieldRefInput<$PrismaModel>
    notIn?: string[] | ListStringFieldRefInput<$PrismaModel>
    lt?: string | StringFieldRefInput<$PrismaModel>
    lte?: string | StringFieldRefInput<$PrismaModel>
    gt?: string | StringFieldRefInput<$PrismaModel>
    gte?: string | StringFieldRefInput<$PrismaModel>
    contains?: string | StringFieldRefInput<$PrismaModel>
    startsWith?: string | StringFieldRefInput<$PrismaModel>
    endsWith?: string | StringFieldRefInput<$PrismaModel>
    mode?: QueryMode
    not?: NestedStringWithAggregatesFilter<$PrismaModel> | string
    _count?: NestedIntFilter<$PrismaModel>
    _min?: NestedStringFilter<$PrismaModel>
    _max?: NestedStringFilter<$PrismaModel>
  }
  export type JsonWithAggregatesFilter<$PrismaModel = never> =
    | PatchUndefined<
        Either<Required<JsonWithAggregatesFilterBase<$PrismaModel>>, Exclude<keyof Required<JsonWithAggregatesFilterBase<$PrismaModel>>, 'path'>>,
        Required<JsonWithAggregatesFilterBase<$PrismaModel>>
      >
    | OptionalFlat<Omit<Required<JsonWithAggregatesFilterBase<$PrismaModel>>, 'path'>>

  export type JsonWithAggregatesFilterBase<$PrismaModel = never> = {
    equals?: InputJsonValue | JsonFieldRefInput<$PrismaModel> | JsonNullValueFilter
    path?: string[]
    mode?: QueryMode | EnumQueryModeFieldRefInput<$PrismaModel>
    string_contains?: string | StringFieldRefInput<$PrismaModel>
    string_starts_with?: string | StringFieldRefInput<$PrismaModel>
    string_ends_with?: string | StringFieldRefInput<$PrismaModel>
    array_starts_with?: InputJsonValue | JsonFieldRefInput<$PrismaModel> | null
    array_ends_with?: InputJsonValue | JsonFieldRefInput<$PrismaModel> | null
    array_contains?: InputJsonValue | JsonFieldRefInput<$PrismaModel> | null
    lt?: InputJsonValue | JsonFieldRefInput<$PrismaModel>
    lte?: InputJsonValue | JsonFieldRefInput<$PrismaModel>
    gt?: InputJsonValue | JsonFieldRefInput<$PrismaModel>
    gte?: InputJsonValue | JsonFieldRefInput<$PrismaModel>
    not?: InputJsonValue | JsonFieldRefInput<$PrismaModel> | JsonNullValueFilter
    _count?: NestedIntFilter<$PrismaModel>
    _min?: NestedJsonFilter<$PrismaModel>
    _max?: NestedJsonFilter<$PrismaModel>
  }

  export type DateTimeNullableWithAggregatesFilter<$PrismaModel = never> = {
    equals?: Date | string | DateTimeFieldRefInput<$PrismaModel> | null
    in?: Date[] | string[] | ListDateTimeFieldRefInput<$PrismaModel> | null
    notIn?: Date[] | string[] | ListDateTimeFieldRefInput<$PrismaModel> | null
    lt?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    lte?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    gt?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    gte?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    not?: NestedDateTimeNullableWithAggregatesFilter<$PrismaModel> | Date | string | null
    _count?: NestedIntNullableFilter<$PrismaModel>
    _min?: NestedDateTimeNullableFilter<$PrismaModel>
    _max?: NestedDateTimeNullableFilter<$PrismaModel>
  }

  export type IntWithAggregatesFilter<$PrismaModel = never> = {
    equals?: number | IntFieldRefInput<$PrismaModel>
    in?: number[] | ListIntFieldRefInput<$PrismaModel>
    notIn?: number[] | ListIntFieldRefInput<$PrismaModel>
    lt?: number | IntFieldRefInput<$PrismaModel>
    lte?: number | IntFieldRefInput<$PrismaModel>
    gt?: number | IntFieldRefInput<$PrismaModel>
    gte?: number | IntFieldRefInput<$PrismaModel>
    not?: NestedIntWithAggregatesFilter<$PrismaModel> | number
    _count?: NestedIntFilter<$PrismaModel>
    _avg?: NestedFloatFilter<$PrismaModel>
    _sum?: NestedIntFilter<$PrismaModel>
    _min?: NestedIntFilter<$PrismaModel>
    _max?: NestedIntFilter<$PrismaModel>
  }

  export type StringNullableWithAggregatesFilter<$PrismaModel = never> = {
    equals?: string | StringFieldRefInput<$PrismaModel> | null
    in?: string[] | ListStringFieldRefInput<$PrismaModel> | null
    notIn?: string[] | ListStringFieldRefInput<$PrismaModel> | null
    lt?: string | StringFieldRefInput<$PrismaModel>
    lte?: string | StringFieldRefInput<$PrismaModel>
    gt?: string | StringFieldRefInput<$PrismaModel>
    gte?: string | StringFieldRefInput<$PrismaModel>
    contains?: string | StringFieldRefInput<$PrismaModel>
    startsWith?: string | StringFieldRefInput<$PrismaModel>
    endsWith?: string | StringFieldRefInput<$PrismaModel>
    mode?: QueryMode
    not?: NestedStringNullableWithAggregatesFilter<$PrismaModel> | string | null
    _count?: NestedIntNullableFilter<$PrismaModel>
    _min?: NestedStringNullableFilter<$PrismaModel>
    _max?: NestedStringNullableFilter<$PrismaModel>
  }

  export type StringFieldUpdateOperationsInput = {
    set?: string
  }

  export type NullableDateTimeFieldUpdateOperationsInput = {
    set?: Date | string | null
  }

  export type IntFieldUpdateOperationsInput = {
    set?: number
    increment?: number
    decrement?: number
    multiply?: number
    divide?: number
  }

  export type NullableStringFieldUpdateOperationsInput = {
    set?: string | null
  }

  export type NestedStringFilter<$PrismaModel = never> = {
    equals?: string | StringFieldRefInput<$PrismaModel>
    in?: string[] | ListStringFieldRefInput<$PrismaModel>
    notIn?: string[] | ListStringFieldRefInput<$PrismaModel>
    lt?: string | StringFieldRefInput<$PrismaModel>
    lte?: string | StringFieldRefInput<$PrismaModel>
    gt?: string | StringFieldRefInput<$PrismaModel>
    gte?: string | StringFieldRefInput<$PrismaModel>
    contains?: string | StringFieldRefInput<$PrismaModel>
    startsWith?: string | StringFieldRefInput<$PrismaModel>
    endsWith?: string | StringFieldRefInput<$PrismaModel>
    not?: NestedStringFilter<$PrismaModel> | string
  }

  export type NestedDateTimeNullableFilter<$PrismaModel = never> = {
    equals?: Date | string | DateTimeFieldRefInput<$PrismaModel> | null
    in?: Date[] | string[] | ListDateTimeFieldRefInput<$PrismaModel> | null
    notIn?: Date[] | string[] | ListDateTimeFieldRefInput<$PrismaModel> | null
    lt?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    lte?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    gt?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    gte?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    not?: NestedDateTimeNullableFilter<$PrismaModel> | Date | string | null
  }

  export type NestedIntFilter<$PrismaModel = never> = {
    equals?: number | IntFieldRefInput<$PrismaModel>
    in?: number[] | ListIntFieldRefInput<$PrismaModel>
    notIn?: number[] | ListIntFieldRefInput<$PrismaModel>
    lt?: number | IntFieldRefInput<$PrismaModel>
    lte?: number | IntFieldRefInput<$PrismaModel>
    gt?: number | IntFieldRefInput<$PrismaModel>
    gte?: number | IntFieldRefInput<$PrismaModel>
    not?: NestedIntFilter<$PrismaModel> | number
  }

  export type NestedStringNullableFilter<$PrismaModel = never> = {
    equals?: string | StringFieldRefInput<$PrismaModel> | null
    in?: string[] | ListStringFieldRefInput<$PrismaModel> | null
    notIn?: string[] | ListStringFieldRefInput<$PrismaModel> | null
    lt?: string | StringFieldRefInput<$PrismaModel>
    lte?: string | StringFieldRefInput<$PrismaModel>
    gt?: string | StringFieldRefInput<$PrismaModel>
    gte?: string | StringFieldRefInput<$PrismaModel>
    contains?: string | StringFieldRefInput<$PrismaModel>
    startsWith?: string | StringFieldRefInput<$PrismaModel>
    endsWith?: string | StringFieldRefInput<$PrismaModel>
    not?: NestedStringNullableFilter<$PrismaModel> | string | null
  }

  export type NestedStringWithAggregatesFilter<$PrismaModel = never> = {
    equals?: string | StringFieldRefInput<$PrismaModel>
    in?: string[] | ListStringFieldRefInput<$PrismaModel>
    notIn?: string[] | ListStringFieldRefInput<$PrismaModel>
    lt?: string | StringFieldRefInput<$PrismaModel>
    lte?: string | StringFieldRefInput<$PrismaModel>
    gt?: string | StringFieldRefInput<$PrismaModel>
    gte?: string | StringFieldRefInput<$PrismaModel>
    contains?: string | StringFieldRefInput<$PrismaModel>
    startsWith?: string | StringFieldRefInput<$PrismaModel>
    endsWith?: string | StringFieldRefInput<$PrismaModel>
    not?: NestedStringWithAggregatesFilter<$PrismaModel> | string
    _count?: NestedIntFilter<$PrismaModel>
    _min?: NestedStringFilter<$PrismaModel>
    _max?: NestedStringFilter<$PrismaModel>
  }
  export type NestedJsonFilter<$PrismaModel = never> =
    | PatchUndefined<
        Either<Required<NestedJsonFilterBase<$PrismaModel>>, Exclude<keyof Required<NestedJsonFilterBase<$PrismaModel>>, 'path'>>,
        Required<NestedJsonFilterBase<$PrismaModel>>
      >
    | OptionalFlat<Omit<Required<NestedJsonFilterBase<$PrismaModel>>, 'path'>>

  export type NestedJsonFilterBase<$PrismaModel = never> = {
    equals?: InputJsonValue | JsonFieldRefInput<$PrismaModel> | JsonNullValueFilter
    path?: string[]
    mode?: QueryMode | EnumQueryModeFieldRefInput<$PrismaModel>
    string_contains?: string | StringFieldRefInput<$PrismaModel>
    string_starts_with?: string | StringFieldRefInput<$PrismaModel>
    string_ends_with?: string | StringFieldRefInput<$PrismaModel>
    array_starts_with?: InputJsonValue | JsonFieldRefInput<$PrismaModel> | null
    array_ends_with?: InputJsonValue | JsonFieldRefInput<$PrismaModel> | null
    array_contains?: InputJsonValue | JsonFieldRefInput<$PrismaModel> | null
    lt?: InputJsonValue | JsonFieldRefInput<$PrismaModel>
    lte?: InputJsonValue | JsonFieldRefInput<$PrismaModel>
    gt?: InputJsonValue | JsonFieldRefInput<$PrismaModel>
    gte?: InputJsonValue | JsonFieldRefInput<$PrismaModel>
    not?: InputJsonValue | JsonFieldRefInput<$PrismaModel> | JsonNullValueFilter
  }

  export type NestedDateTimeNullableWithAggregatesFilter<$PrismaModel = never> = {
    equals?: Date | string | DateTimeFieldRefInput<$PrismaModel> | null
    in?: Date[] | string[] | ListDateTimeFieldRefInput<$PrismaModel> | null
    notIn?: Date[] | string[] | ListDateTimeFieldRefInput<$PrismaModel> | null
    lt?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    lte?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    gt?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    gte?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    not?: NestedDateTimeNullableWithAggregatesFilter<$PrismaModel> | Date | string | null
    _count?: NestedIntNullableFilter<$PrismaModel>
    _min?: NestedDateTimeNullableFilter<$PrismaModel>
    _max?: NestedDateTimeNullableFilter<$PrismaModel>
  }

  export type NestedIntNullableFilter<$PrismaModel = never> = {
    equals?: number | IntFieldRefInput<$PrismaModel> | null
    in?: number[] | ListIntFieldRefInput<$PrismaModel> | null
    notIn?: number[] | ListIntFieldRefInput<$PrismaModel> | null
    lt?: number | IntFieldRefInput<$PrismaModel>
    lte?: number | IntFieldRefInput<$PrismaModel>
    gt?: number | IntFieldRefInput<$PrismaModel>
    gte?: number | IntFieldRefInput<$PrismaModel>
    not?: NestedIntNullableFilter<$PrismaModel> | number | null
  }

  export type NestedIntWithAggregatesFilter<$PrismaModel = never> = {
    equals?: number | IntFieldRefInput<$PrismaModel>
    in?: number[] | ListIntFieldRefInput<$PrismaModel>
    notIn?: number[] | ListIntFieldRefInput<$PrismaModel>
    lt?: number | IntFieldRefInput<$PrismaModel>
    lte?: number | IntFieldRefInput<$PrismaModel>
    gt?: number | IntFieldRefInput<$PrismaModel>
    gte?: number | IntFieldRefInput<$PrismaModel>
    not?: NestedIntWithAggregatesFilter<$PrismaModel> | number
    _count?: NestedIntFilter<$PrismaModel>
    _avg?: NestedFloatFilter<$PrismaModel>
    _sum?: NestedIntFilter<$PrismaModel>
    _min?: NestedIntFilter<$PrismaModel>
    _max?: NestedIntFilter<$PrismaModel>
  }

  export type NestedFloatFilter<$PrismaModel = never> = {
    equals?: number | FloatFieldRefInput<$PrismaModel>
    in?: number[] | ListFloatFieldRefInput<$PrismaModel>
    notIn?: number[] | ListFloatFieldRefInput<$PrismaModel>
    lt?: number | FloatFieldRefInput<$PrismaModel>
    lte?: number | FloatFieldRefInput<$PrismaModel>
    gt?: number | FloatFieldRefInput<$PrismaModel>
    gte?: number | FloatFieldRefInput<$PrismaModel>
    not?: NestedFloatFilter<$PrismaModel> | number
  }

  export type NestedStringNullableWithAggregatesFilter<$PrismaModel = never> = {
    equals?: string | StringFieldRefInput<$PrismaModel> | null
    in?: string[] | ListStringFieldRefInput<$PrismaModel> | null
    notIn?: string[] | ListStringFieldRefInput<$PrismaModel> | null
    lt?: string | StringFieldRefInput<$PrismaModel>
    lte?: string | StringFieldRefInput<$PrismaModel>
    gt?: string | StringFieldRefInput<$PrismaModel>
    gte?: string | StringFieldRefInput<$PrismaModel>
    contains?: string | StringFieldRefInput<$PrismaModel>
    startsWith?: string | StringFieldRefInput<$PrismaModel>
    endsWith?: string | StringFieldRefInput<$PrismaModel>
    not?: NestedStringNullableWithAggregatesFilter<$PrismaModel> | string | null
    _count?: NestedIntNullableFilter<$PrismaModel>
    _min?: NestedStringNullableFilter<$PrismaModel>
    _max?: NestedStringNullableFilter<$PrismaModel>
  }



  /**
   * Batch Payload for updateMany & deleteMany & createMany
   */

  export type BatchPayload = {
    count: number
  }

  /**
   * DMMF
   */
  export const dmmf: runtime.BaseDMMF
}