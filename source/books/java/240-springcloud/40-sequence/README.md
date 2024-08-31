# 设计定序系统

当系统通过API接收到所有交易员发送的订单请求后，就需要按接收顺序对订单请求进行定序。

定序的目的是在系统内部完成订单请求排序，排序的同时给每个订单请求一个全局唯一递增的序列号，然后将排序后的订单请求发送至交易引擎。

因此，定序系统的输入是上游发送的事件消息，输出是定序后的带Sequence ID的事件，这样，下游的交易引擎就可以由确定性的事件进行驱动。

除了对订单请求进行定序，定序系统还需要对撤消订单、转账请求进行定序，因此，输入的事件消息包括：

- OrderRequestEvent：订单请求；
- OrderCancelEvent：订单取消；
- TransferEvent：转账请求。

对于某些类型的事件，例如转账请求，它必须被处理一次且仅处理一次。而消息系统本质上也是一个分布式网络应用程序，它的内部也有缓存、重试等机制。一般来说，消息系统可以实现的消息传输模式有：

1. 消息保证至少发送成功一次，也就是可能会重复发送（At least once）；
2. 消息只保证最多发送一次，也就是要么成功，要么失败（At most once）；
3. 消息保证发送成功且仅发送成功一次（Exactly once）。

实际上，第3种理想情况基本不存在，没有任何基于网络的消息系统能实现这种模式，所以，大部分消息系统都是按照第1种方式来设计，也就是基于确认+重试的机制保证消息可靠到达。

而定序系统要处理的事件消息，例如转账请求，如果消息重复了多次，就会造成重复转账，所以，我们还需要对某些事件消息作特殊处理，让发送消息的客户端给这个事件消息添加一个全局唯一ID，定序系统根据全局唯一ID去重，而不是依赖消息中间件的能力。

此外，为了让下游系统，也就是交易引擎能一个不漏地按顺序接收定序后的事件消息，我们也不能相信消息中间件总是在理想状态下工作。

除了给每个事件消息设置一个唯一递增ID外，定序系统还同时给每个事件消息附带前一事件的ID，这样就形成了一个微型“区块链”：

```ascii
┌─────┐   ┌─────┐   ┌─────┐   ┌─────┐
│sid=1│   │sid=2│   │sid=3│   │sid=4│
│pid=0│──▶│pid=1│──▶│pid=2│──▶│pid=3│
│msg=A│   │msg=B│   │msg=C│   │msg=D│
└─────┘   └─────┘   └─────┘   └─────┘
```

由于下游接收方可以根据Sequence ID去重，因此，重复发送的消息会被忽略：

```ascii
┌─────┐┌─────┐┌─────┐┌ ─ ─ ┐┌ ─ ─ ┐┌─────┐
│sid=1││sid=2││sid=3│ sid=2  sid=3 │sid=4│
│pid=0││pid=1││pid=2││pid=1││pid=2││pid=3│
│msg=A││msg=B││msg=C│ msg=B  msg=C │msg=D│
└─────┘└─────┘└─────┘└ ─ ─ ┘└ ─ ─ ┘└─────┘
```

如果出现消息丢失：

```ascii
┌─────┐┌─────┐┌ ─ ─ ┐┌─────┐
│sid=1││sid=2│       │sid=4│
│pid=0││pid=1││     ││pid=3│
│msg=A││msg=B│       │msg=D│
└─────┘└─────┘└ ─ ─ ┘└─────┘
```

由于存在Previous ID，下游接收方可以检测到丢失，于是，接收方可以根据上次收到的ID去数据库查询，直到读取到最新的Sequence ID为止。只要定序系统先将定序后的事件消息落库，再发送给下游，就可以保证无论是消息重复还是丢失，接收方都可以正确处理：

```ascii
┌─────────┐   ┌─────────┐   ┌─────────┐
│Sequencer│──▶│   MQ    │──▶│ Engine  │
└─────────┘   └─────────┘   └─────────┘
     │        ┌─────────┐        │
     └───────▶│   DB    │◀───────┘
              └─────────┘
```

整个过程中，丢失极少量消息不会对系统的可用性造成影响，这样就极大地减少了系统的运维成本和线上排错成本。

最后，无论是接收方还是发送方，为了提高消息收发的效率，应该总是使用批处理方式。定序系统采用批量读+批量batch写入数据库+批量发送消息的模式，可以显著提高TPS。

下面我们一步一步地实现定序系统。

首先定义要接收的事件消息，它包含一个Sequence ID、上一个Sequence ID以及一个可选的用于去重的全局唯一ID：

```java
public class AbstractEvent extends AbstractMessage {
    // 定序后的Sequence ID:
    public long sequenceId;

    // 定序后的Previous Sequence ID:
    public long previousId;

    // 可选的全局唯一标识:
    @Nullable
    public String uniqueId;
}
```

定序系统接收的事件仅包含可选的`uniqueId`，忽略`sequenceId`和`previousId`。定序完成后，把`sequenceId`和`previousId`设置好，再发送给下游。

`SequenceService`用于接收上游消息、定序、发送消息给下游：

```java
@Component
public class SequenceService {
    @Autowired
    SequenceHandler sequenceHandler;

    // 全局唯一递增ID:
    private AtomicLong sequence;

    // 接收消息并定序再发送:
    synchronized void processMessages(List<AbstractEvent> messages) {
        // 定序后的事件消息:
        List<AbstractEvent> sequenced = null;
        try {
            // 定序:
            sequenced = this.sequenceHandler.sequenceMessages(this.messageTypes, this.sequence, messages);
        } catch (Throwable e) {
            // 定序出错时进程退出:
            logger.error("exception when do sequence", e);
            System.exit(1);
            throw new Error(e);
        }
        // 发送定序后的消息:
        sendMessages(sequenced);
    }
}
```

`SequenceHandler`是真正写入Sequence ID并落库的：

```java
@Component
@Transactional(rollbackFor = Throwable.class)
public class SequenceHandler {
    public List<AbstractEvent> sequenceMessages(MessageTypes messageTypes, AtomicLong sequence, List<AbstractEvent> messages) throws Exception {
        // 利用UniqueEventEntity去重:
        List<UniqueEventEntity> uniques = null;
        Set<String> uniqueKeys = null;
        List<AbstractEvent> sequencedMessages = new ArrayList<>(messages.size());
        List<EventEntity> events = new ArrayList<>(messages.size());
        for (AbstractEvent message : messages) {
            UniqueEventEntity unique = null;
            final String uniqueId = message.uniqueId;
            // 在数据库中查找uniqueId检查是否已存在:
            if (uniqueId != null) {
                if ((uniqueKeys != null && uniqueKeys.contains(uniqueId))
                        || db.fetch(UniqueEventEntity.class, uniqueId) != null) {
                    // 忽略已处理的重复消息:
                    logger.warn("ignore processed unique message: {}", message);
                    continue;
                }
                unique = new UniqueEventEntity();
                unique.uniqueId = uniqueId;
                if (uniques == null) {
                    uniques = new ArrayList<>();
                }
                uniques.add(unique);
                if (uniqueKeys == null) {
                    uniqueKeys = new HashSet<>();
                }
                uniqueKeys.add(uniqueId);
            }
            // 上次定序ID:
            long previousId = sequence.get();
            // 本次定序ID:
            long currentId = sequence.incrementAndGet();
            // 先设置message的sequenceId / previouseId，再序列化并落库:
            message.sequenceId = currentId;
            message.previousId = previousId;
            // 如果此消息关联了UniqueEvent，给UniqueEvent加上相同的sequenceId：
            if (unique != null) {
                unique.sequenceId = message.sequenceId;
            }
            // 准备写入数据库的Event:
            EventEntity event = new EventEntity();
            event.previousId = previousId;
            event.sequenceId = currentId;
            event.data = messageTypes.serialize(message);
            events.add(event);
            // 添加到结果集:
            sequencedMessages.add(message);
        }
        // 落库:
        if (uniques != null) {
            db.insert(uniques);
        }
        db.insert(events);
        // 返回定序后的消息:
        return sequencedMessages;
    }
}
```

在`SequenceService`中调用`SequenceHandler`是因为我们写入数据库时需要利用Spring提供的声明式数据库事务，而消息的接收和发送并不需要被包含在数据库事务中。

最后，我们来考虑其他一些细节问题。

### 如何在定序器重启后正确初始化下一个序列号？

正确初始化下一个序列号实际上就是要把一个正确的初始值给`AtomicLong sequence`字段。可以读取数据库获得当前最大的Sequence ID，这个Sequence ID就是上次最后一次定序的ID。

### 如何在定序器崩溃后自动恢复？

由于任何一个时候都只能有一个定序器工作，这样才能保证Sequence ID的正确性，因此，无法让两个定序器同时工作。

虽然无法让两个定序器同时工作，但可以让两个定序器以主备模式同时运行，仅主定序器工作。当主定序器崩溃后，备用定序器自动切换为主定序器接管后续工作即可。

为了实现主备模式，可以启动两个定序器，然后抢锁的形式确定主备。抢到锁的定序器开始工作，并定期刷新锁，未抢到锁的定序器定期检查锁。可以用数据库锁实现主备模式。

### 如何解决定序的性能瓶颈？

通常来说，消息系统的吞吐量远超数据库。定序的性能取决于批量写入数据库的能力。首先要提高数据库的性能，其次考虑按Sequence ID进行分库，但分库会提高定序的复杂度，也会使下游从数据库读取消息时复杂度增加。最后，可以考虑使用专门针对时序优化的数据库，但这样就不如MySQL这种数据库通用、易用。

### 参考源码

可以从[GitHub](https://github.com/michaelliao/warpexchange/tree/main/step-by-step/step-7)或[Gitee](https://gitee.com/liaoxuefeng/warpexchange/tree/main/step-by-step/step-7/)下载源码。

<a class="git-explorer" href="https://github.com/michaelliao/warpexchange/tree/main/step-by-step/step-7">GitHub</a>

### 小结

定序系统负责给每个事件一个唯一递增序列号。通过引用前一个事件的序列号，可以构造一个能自动检测连续性的事件流。
