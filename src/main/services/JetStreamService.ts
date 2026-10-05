import { NatsConnection, JetStreamManager, JetStreamClient, StringCodec, AckPolicy, DeliverPolicy, RetentionPolicy, StorageType, DiscardPolicy, StreamInfo as NatsStreamInfo, ConsumerInfo as NatsConsumerInfo, headers as createHeaders } from 'nats';
import { StreamConfig, StreamInfo, ConsumerConfig, ConsumerInfo, JetStreamPublishAck, BrowseMessagesOptions, StoredMessage } from '../../shared/types';

class JetStreamService {
  private sc = StringCodec();

  /** Create a new JetStream stream */
  async createStream(nc: NatsConnection, config: StreamConfig): Promise<void> {
    const jsm = await nc.jetstreamManager();
    await jsm.streams.add({
      name: config.name,
      subjects: config.subjects,
      retention: this.mapRetention(config.retention),
      storage: this.mapStorage(config.storage),
      max_msgs: config.maxMsgs,
      max_bytes: config.maxBytes,
      max_age: config.maxAge,
      max_msg_size: config.maxMsgSize,
      discard: this.mapDiscard(config.discard),
      num_replicas: config.replicas,
      description: config.description,
    });
  }

  /** List all streams */
  async listStreams(nc: NatsConnection): Promise<StreamInfo[]> {
    const jsm = await nc.jetstreamManager();
    const streamsResult = await jsm.streams.list().next();
    
    return streamsResult.map((si: NatsStreamInfo) => ({
      config: {
        name: si.config.name,
        subjects: si.config.subjects,
        retention: si.config.retention.toString() as any,
        storage: si.config.storage.toString() as any,
        maxMsgs: si.config.max_msgs,
        maxBytes: si.config.max_bytes,
        maxAge: si.config.max_age,
        maxMsgSize: si.config.max_msg_size,
        discard: si.config.discard.toString() as any,
        replicas: si.config.num_replicas,
        description: si.config.description,
      },
      state: {
        messages: si.state.messages,
        bytes: si.state.bytes,
        firstSeq: si.state.first_seq,
        firstTs: typeof (si.state as any).first_ts === 'number' ? new Date((si.state as any).first_ts / 1000000).toISOString() : String((si.state as any).first_ts || ''),
        lastSeq: si.state.last_seq,
        lastTs: typeof (si.state as any).last_ts === 'number' ? new Date((si.state as any).last_ts / 1000000).toISOString() : String((si.state as any).last_ts || ''),
        consumerCount: si.state.consumer_count
      }
    }));
  }

  /** Delete a stream */
  async deleteStream(nc: NatsConnection, name: string): Promise<void> {
    const jsm = await nc.jetstreamManager();
    await jsm.streams.delete(name);
  }

  /** Purge all messages from a stream */
  async purgeStream(nc: NatsConnection, name: string): Promise<void> {
    const jsm = await nc.jetstreamManager();
    await jsm.streams.purge(name);
  }

  /** Publish a message via JetStream (with ack) */
  async publish(nc: NatsConnection, subject: string, payload: string, headers?: Record<string, string>): Promise<JetStreamPublishAck> {
    const js = nc.jetstream();
    const pubHeaders = createHeaders();
    if (headers) {
      for (const [k, v] of Object.entries(headers)) {
        pubHeaders.append(k, v);
      }
    }
    const ack = await js.publish(subject, this.sc.encode(payload), { headers: pubHeaders });
    return {
      stream: ack.stream,
      seq: ack.seq,
      duplicate: ack.duplicate
    };
  }

  /** List consumers for a stream */
  async listConsumers(nc: NatsConnection, streamName: string): Promise<ConsumerInfo[]> {
    const jsm = await nc.jetstreamManager();
    const consumersResult = await jsm.consumers.list(streamName).next();
    return consumersResult.map((ci: NatsConsumerInfo) => ({
      name: ci.name,
      config: {
        durableName: ci.config.durable_name,
        deliverPolicy: ci.config.deliver_policy.toString() as any,
        ackPolicy: ci.config.ack_policy.toString() as any,
        replayPolicy: ci.config.replay_policy.toString() as any,
        filterSubject: ci.config.filter_subject,
        description: ci.config.description,
        maxDeliver: ci.config.max_deliver,
        ackWait: ci.config.ack_wait,
        maxAckPending: ci.config.max_ack_pending,
      },
      numPending: ci.num_pending,
      numAckPending: ci.num_ack_pending,
      numRedelivered: ci.num_redelivered,
      delivered: { streamSeq: ci.delivered.stream_seq, consumerSeq: ci.delivered.consumer_seq },
      ackFloor: { streamSeq: ci.ack_floor.stream_seq, consumerSeq: ci.ack_floor.consumer_seq }
    }));
  }

  /** Create a consumer */
  async createConsumer(nc: NatsConnection, streamName: string, config: ConsumerConfig): Promise<void> {
    const jsm = await nc.jetstreamManager();
    await jsm.consumers.add(streamName, {
      durable_name: config.durableName,
      filter_subject: config.filterSubject,
      ack_policy: config.ackPolicy as AckPolicy,
      ack_wait: config.ackWait,
      max_deliver: config.maxDeliver,
      deliver_policy: config.deliverPolicy as DeliverPolicy,
      max_ack_pending: config.maxAckPending,
    });
  }

  /** Delete a consumer */
  async deleteConsumer(nc: NatsConnection, streamName: string, consumerName: string): Promise<void> {
    const jsm = await nc.jetstreamManager();
    await jsm.consumers.delete(streamName, consumerName);
  }

  /** Browse stored messages in a stream */
  async browseMessages(nc: NatsConnection, streamName: string, opts: BrowseMessagesOptions): Promise<StoredMessage[]> {
    const jsm = await nc.jetstreamManager();
    const js = nc.jetstream();
    const batchSize = opts.batchSize || 50;
    
    const cInfo = await jsm.consumers.add(streamName, {
      deliver_policy: opts.startSequence ? DeliverPolicy.StartSequence : DeliverPolicy.All,
      opt_start_seq: opts.startSequence,
      filter_subject: opts.filterSubject,
      ack_policy: AckPolicy.None,
    });
    
    const consumer = await js.consumers.get(streamName, cInfo.name);
    const msgs = await consumer.fetch({ max_messages: batchSize, expires: 1000 });
    
    const result: StoredMessage[] = [];
    for await (const m of msgs) {
      let payload = '';
      try { payload = this.sc.decode(m.data); } catch { payload = `[Binary: ${m.data.length} bytes]`; }
      
      const hdrs: Record<string, string> = {};
      if (m.headers) {
         for (const [k, v] of m.headers) {
            hdrs[k] = Array.isArray(v) ? v.join(', ') : String(v);
         }
      }
      
      const ts = m.info?.timestampNanos ? Math.floor(m.info.timestampNanos / 1000000) : Date.now();
      result.push({
        sequence: m.seq,
        subject: m.subject,
        payload: payload,
        timestamp: new Date(ts).toISOString(),
        headers: hdrs
      });
    }
    await jsm.consumers.delete(streamName, cInfo.name);
    return result;
  }

  // Helper mappers for enum types
  private mapRetention(r?: string): RetentionPolicy {
    switch (r?.toLowerCase()) {
      case 'limits': return RetentionPolicy.Limits;
      case 'interest': return RetentionPolicy.Interest;
      case 'workqueue': return RetentionPolicy.Workqueue;
      default: return RetentionPolicy.Limits;
    }
  }

  private mapStorage(s?: string): StorageType {
    switch (s?.toLowerCase()) {
      case 'memory': return StorageType.Memory;
      case 'file': return StorageType.File;
      default: return StorageType.File;
    }
  }

  private mapDiscard(d?: string): DiscardPolicy {
    switch (d?.toLowerCase()) {
      case 'old': return DiscardPolicy.Old;
      case 'new': return DiscardPolicy.New;
      default: return DiscardPolicy.Old;
    }
  }
}

export const jetStreamService = new JetStreamService();
export default jetStreamService;
