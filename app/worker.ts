import handler from "./.open-next/worker.js";

export {
  BucketCachePurge,
  DOQueueHandler,
  DOShardedTagCache,
} from "./.open-next/worker.js";

export default {
  fetch: handler.fetch,
} satisfies ExportedHandler<CloudflareEnv>;
