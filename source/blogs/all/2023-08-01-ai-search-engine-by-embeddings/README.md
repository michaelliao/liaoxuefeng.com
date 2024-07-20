# 设计AI驱动的搜索引擎：基于语义的问答系统

传统的搜索引擎，本质上就是一个倒排索引。当用户搜索若干关键字时，搜索引擎根据倒排索引给出包含关键字的网页，搜索结果依赖于用户给出的关键字，如站内搜索`java`、`撮合引擎`，则给出结果[Java教程/设计撮合引擎](../../../books/java/springcloud/engine/match/index.html)、[证券交易系统撮合引擎的设计](../2021-12-10-exchange-match-engine/index.html)等页面。

随着大模型的出现，用户可以直接以自然语言提问并获得结果，这种交互方式，将来会逐步取代基于关键字的搜索。

例如，用户使用GPT提问：用Java实现一个证券交易系统的撮合引擎，应该如何设计架构？

以下是GPT-3.5返回的结果：

> 设计一个证券交易系统的撮合引擎时，可以考虑以下几个方面的架构设计：
> 
> 1. 消息队列：使用消息队列来处理订单的流动和交易的撮合过程。消息队列可以是Kafka、RabbitMQ或者ActiveMQ等，用于接收和分发订单信息。
> 2. 订单管理：设计一个订单管理模块，用于接收和处理用户提交的订单请求。该模块应包括验证订单的有效性、委托订单的处理和存储等功能。
> 3. 撮合引擎：设计一个撮合引擎模块，用于撮合订单。该模块应根据订单的价格和数量等特征，匹配相应的买单和卖单，并生成交易成交信息。
> 4. 数据存储：使用数据库或者其他数据存储方式存储订单信息、成交信息和交易市场数据等。
> 5. 规则引擎：考虑引入一个规则引擎，用于处理复杂的交易规则和策略。规则引擎可以根据预定的规则对订单进行匹配和撮合。
> 6. 自动化机制：设计一个自动化机制来监控交易系统的运行状态和风险控制。可以包括流控机制、防止恶意交易的规则等。
> 7. 实时报告和余额管理：设计实时报告和余额管理模块，用于生成交易成交信息的报告和管理用户的余额信息。
> 8. 可扩展性：考虑系统的可扩展性，可以将撮合引擎设计为分布式系统，允许多个撮合引擎实例并行处理订单流。
> 9. 安全性：确保系统的安全性，包括数据加密、身份验证、权限控制以及防止恶意攻击等。
> 10. 监控和日志：设计监控和日志模块，用于记录系统的运行状态和交易记录，便于故障排除和系统性能优化。
> 
> 除了以上的基本架构设计，还可以根据具体需求和业务规则进行调整和优化，以满足系统的性能、可靠性和易用性等方面的要求。

这个回答非常的“GPT”，即什么都说了，但也等于什么都没说。你问它如何实现一个在线聊天系统，如何实现一个在线商城，上述答案也基本适用。

因为大模型训练使用的是大量的“通识”知识，对于不包含在它的训练数据里的特定行业知识、专业文档的内容，大模型只能给出泛泛的回答。

因此，参考《[使用基于Embedding的搜索来实现问答](../2023-08-01-ai-search-engine-by-embeddings/index.html)》，我们在提问时嵌入《[设计撮合引擎](../../../books/java/springcloud/engine/match/index.html)》一文的内容：

```plain
用Java实现一个证券交易系统的撮合引擎，应该如何设计架构？

请参考下文回答上述问题：

"""
在证券交易系统中，撮合引擎是实现买卖盘成交的关键组件。我们先分析撮合引擎的工作原理，然后设计并实现一个最简化的撮合引擎。

...

下一步是实现订单簿OrderBook的表示。一个直观的想法是使用List<Order>，并对订单进行排序。但是，在证券交易中，使用List会导致两个致命问题：

插入新的订单时，必须从头扫描List<Order>，以便在合适的地方插入Order，平均耗时O(N)；
取消订单时，也必须从头扫描List<Order>，平均耗时O(N)。
更好的方法是使用红黑树，它是一种自平衡的二叉排序树，插入和删除的效率都是O(logN)，对应的Java类是TreeMap。

所以我们定义OrderBook的结构就是一个TreeMap<OrderKey, OrderEntity>，它的排序根据OrderKey决定。由业务规则可知，负责排序的OrderKey只需要sequenceId和price即可：

...

本文讨论并实现了一个可工作的撮合引擎核心。实现撮合引擎的关键在于将业务模型转换为高效的数据结构。只要保证核心数据结构的简单和高效，撮合引擎的业务逻辑编写是非常容易的。
"""
```

根据我们给出的参考文档，GPT回答如下：

> 根据给出的设计原则，可以设计一个证券交易系统的撮合引擎的架构如下：
> 
> 1. 定义核心数据结构：撮合引擎的核心数据结构是OrderBook（买卖盘），其中包含一个买盘（BuyBook）和一个卖盘（SellBook）。买盘按价格从高到低排序，卖盘按价格从低到高排序。
> 2. 使用TreeMap实现OrderBook：为了保证插入、删除和查找操作的效率，可以使用TreeMap作为OrderBook的底层数据结构。TreeMap是一种自平衡的二叉排序树，插入和删除的效率都是O(logN)。
> 3. 定义OrderKey和Comparator：为了对OrderBook进行排序，可以定义OrderKey作为排序的依据，OrderKey包含sequenceId（全局唯一的订单ID）和price（价格）。为了实现不同的排序，可以编写两个Comparator分别用于排序买盘和卖盘。
> 4. 实现OrderBook的插入、删除和查找操作：通过OrderKey和Comparator，可以实现OrderBook的插入、删除和查找操作。可以提供以下方法：
>     - getFirst(): 获取买卖盘的第一个订单。
>     - remove(order): 从买卖盘中删除指定的订单。
>     - add(order): 添加新的订单到买卖盘。
> 5. 设计MatchEngine：MatchEngine是撮合引擎的核心组件，包含一个买盘和一个卖盘的OrderBook，以及一个最新成交价。处理订单的流程如下：
>    - 根据订单的方向（买入或卖出），选择买盘或卖盘作为MakerBook，另一个作为TakerBook。
>    - 从MakerBook中按价格优先的顺序匹配价格合适的挂单（Maker）。如果匹配成功，则成交并更新挂单的数量，直到成交双方有一方完全成交或成交条件不满足。
>    - 如果Taker订单未完全成交，则将其作为新的Maker挂到TakerBook中。
> 6. 定义MatchResult：MatchResult包含撮合结果的信息，包括Taker订单、匹配的Maker订单、成交价格、成交数量等。
> 7. 实现撮合引擎的处理方法：根据订单的方向，选择合适的买盘或卖盘作为MakerBook，然后调用MatchEngine的处理方法。处理方法根据价格匹配挂单，直到成交双方有一方完全成交或成交条件不满足。如果Taker订单未完全成交，则将其作为新的Maker挂到买盘或卖盘中。
> 8. 实现多个交易对：如果需要实现多个交易对，可以创建一个MatchEngineGroup来管理多个MatchEngine实例，每个MatchEngine实例处理一个交易对。在处理订单时，根据订单的交易对ID选择合适的MatchEngine实例进行处理。
> 
> 通过以上架构设计，可以实现一个简化的证券交易系统的撮合引擎。根据具体需求，还可以进一步优化和扩展该架构。

把专业的文档内容连同提问喂给GPT，我们得到的回答质量就有了质的提升。

现在只剩下一个问题需要解决：当用户提问“用Java实现一个证券交易系统的撮合引擎，应该如何设计架构？”，我们就把《[设计撮合引擎](../../../books/java/springcloud/engine/match/index.html)》的内容连同提问扔给GPT，下次用户提问“如何用Java实现一个证券交易系统的清算系统？”，我们应该扔啥文档给GPT？

这个需求其实就是：

当用户提问：“如何实现xyz？”，我们怎么根据`xyz`查找到关联度最高的文档比如“xyz设计指南”？这就要用到Embedding和Vector数据库。

### Embedding问答系统架构

一个预训练的大模型包含通识知识，但它无法访问很多不对外公开的专业文档、实时更新的数据等，因此，为了让大模型根据专业内容回答用户提问，我们需要使用Vector Embedding（向量嵌入）。

什么是Vector？Vector是一个由若干浮点数表示的数组，可以将任意的文本、图片、视频等转换为Vector，无论输入的数据是啥，Vector输出为固定大小，这一点有点像哈希，但与哈希不同的是，通过比较Vector的相似度，我们就可以找到与指定输入最相似的若干文本。

所以，Vector DB最近很火，我们要使用Vector Embedding，就需要使用一个Vector DB。

OpenAI官方列出了如下Vector DB：

- [AnalyticDB](https://www.alibabacloud.com/help/en/analyticdb-for-postgresql/latest/get-started-with-analyticdb-for-postgresql)
- [Chroma](https://docs.trychroma.com/getting-started)
- [Hologres](https://www.alibabacloud.com/help/en/hologres/latest/procedure-to-use-hologres)
- [Kusto](https://learn.microsoft.com/en-us/azure/data-explorer/web-query-data)
- [Milvus](https://milvus.io/docs/example_code.md)
- [MyScale](https://docs.myscale.com/en/quickstart/)
- [Pinecone](https://docs.pinecone.io/docs/quickstart)
- [PolarDB](https://www.alibabacloud.com/help/en/polardb/latest/quick-start)
- [Qdrant](https://qdrant.tech/documentation/quick-start/)
- [Redis](https://github.com/RedisVentures/simple-vecsim-intro)
- [SingleStoreDB](https://www.singlestore.com/blog/how-to-get-started-with-singlestore/)
- [Typesense](https://typesense.org/docs/guide/)
- [Weaviate](https://weaviate.io/developers/weaviate/quickstart)
- [Zilliz](https://docs.zilliz.com/docs/quick-start-1)

我们使用Redis作为Vector DB来存储和比较Vector。

### 创建Vector

使用Embedding之前，我们要为现有的每一个文档创建对应的Vector。假设存储文档的数据库表如下：

| doc_id | doc_title  | doc_content |
|--------|------------|----------------------------|
| 123    | 设计撮合引擎 | 在证券交易系统中，撮合引擎是... |
| 456    | 设计清算系统 | 清算系统就是处理撮合结果... |
| 789    | 安装JDK     | Install JDK我们第一件事情就是安装JDK... |

如果关系数据库支持Vector，那么我们可以直接加一个存储Vector的列：

| doc_id | doc_title  | doc_content | doc_vector |
|--------|------------|----------------------------|-------|
| 123    | 设计撮合引擎 | 在证券交易系统中，撮合引擎是... | [-0.02809206, -0.00365088, -0.00299650, ...] |
| 456    | 设计清算系统 | 清算系统就是处理撮合结果... | [-0.00990966, 0.00471535, -0.00117799, ...] |
| 789    | 安装JDK     | Install JDK我们第一件事情就是安装JDK... | [0.00966310, -0.01571467, 0.00255492, ...] |

只是现在关系数据库还没有对Vector的支持，而我们选择Redis存储Vector，所以先准备Redis环境：

### 启动Redis Stack

Redis Stack包含的[Redisearch](https://redis.io/docs/interact/search-and-query/)支持Vector，使用Redis Stack最简单的方法是通过docker启动：

```plain
$ docker run -d --name redis-stack -p 6379:6379 -p 8001:8001 redis/redis-stack:latest
```

### 创建Vector索引

用Python通过`redis`库创建索引的代码如下：

```python
from redis import Redis
from redis.exceptions import ResponseError

from redis.commands.search.field import VectorField, TagField
from redis.commands.search.indexDefinition import IndexDefinition, IndexType

# redis连接:
redis = Redis('127.0.0.1', 6379)

def create_index(redis, index_name, vector_dim):
    tag_field = TagField('doc_id')
    embedding_field = VectorField('embedding', 'FLAT', {
        'TYPE': 'FLOAT32',
        'DIM': vector_dim,
        'DISTANCE_METRIC': 'COSINE',
    })
    try:
        redis.ft(index_name).create_index(
            fields=[tag_field, embedding_field],
            definition=IndexDefinition(
                prefix=['doc:'],
                index_type=IndexType.HASH
            )
        )
    except ResponseError as err:
        if str(err) == 'Index already exists':
            pass
        else:
            raise err

create_index(redis, 'idx_doc', 1536)
```

我们创建的索引包含一个`TagField`和一个名为`embedding`的`VectorField`，`VectorField`有很多选项，其中，`DIM`是Vector数组的大小，这里传入`1536`，是因为GPT返回的Vector大小就是`1536`。

上述代码对应的Redis命令如下：

```plain
127.0.0.1:6379> FT.CREATE idx_doc ON HASH PREFIX 1 doc: SCORE 1.0 SCHEMA doc_id TAG SEPARATOR , embedding VECTOR FLAT 6 TYPE FLOAT32 DIM 1536 DISTANCE_METRIC COSINE
```

### 将文档内容转换为Vector

紧接着，我们用OpenAI提供的Embedding API把文档内容转换为Vector。假定我们要转换以下3个文档，均以字符串表示：

```python
docMatchEngine = '在证券交易系统中，撮合引擎是实现买卖盘成交的关键组件...'
docClearing = '...要把撮合结果最终实现为买卖双方的资产交换，就需要清算...'
docInstallJDK = '因为Java程序必须运行在JVM之上，所以，我们第一件事情就是安装JDK...'
```

调用API获得Vector结果并打印：

```python
import openai

for doc in [docMatchEngine, docClearing, docInstallJDK]:
    resp = openai.Embedding.create(input=doc, model='text-embedding-ada-002')
    embedding = resp['data'][0]['embedding']
    print(embedding)
```

我们得到3组Embedding：

```python
[-0.028092065826058388, -0.003650880651548505, -0.002996509661898017, ...]
[-0.00990966334939003, 0.004715353716164827, -0.0011779952328652143, ...]
[0.009663100354373455, -0.015714673325419426, 0.002554928883910179, ...]
```

### 索引文档的Vector

当我们获得了文档对应的Vector后，就可以将它们添加到Redis的索引：

```python
from redis import Redis
import numpy as np

# 上一步获得的Vector:
vecMatchEngine = [-0.028092065826058388, -0.003650880651548505, -0.002996509661898017, ...]
vecClearing = [-0.00990966334939003, 0.004715353716164827, -0.0011779952328652143, ...]
vecInstallJDK = [0.009663100354373455, -0.015714673325419426, 0.002554928883910179, ...]

def add_doc(redis, doc_id, embedding):
     key = f'doc:{doc_id}'
     obj = dict(doc_id=doc_id, embedding=np.array(embedding, dtype=np.float32).tobytes())
     redis.hset(key, mapping=obj)

add_doc(redis, 'id_123_match_engine', vecMatchEngine)
add_doc(redis, 'id_456_clearing', vecClearing)
add_doc(redis, 'id_789_install_jdk', vecInstallJDK)
```

其中，`hset()`命令指定的key必须以`doc:`开头，因为创建索引时指定了`prefix=doc:`，只有以`doc:`开头的数据才会被加入索引。`doc_id`可视为文档在数据库中的主键，这里用类似`id_123_match_engine`这样的字符串表示是为了后续查看较方便。

上述代码对应的Redis命令如下：

```plain
127.0.0.1:6379> HSET doc:id_123_match_engine doc_id id_123_match_engine embedding U!\xe6\xbc\x9dCo\xbb...\xea\xbb
```

其中，`embedding`字段需要用`numpy`将数组转换为字节再传入。

### 搜索相关文档

当我们准备好Redis的索引后，就可以根据用户提问搜索相似度最高的文档。这个过程分两步：

1. 将用户提问转换成Vector；
2. 根据此Vector在Redis中搜索相关文档。

Python代码如下：

```python
def query_doc(redis, q):
    print(q)
    # 把q转换成Vector:
    q_resp = openai.Embedding.create(input=q, model=EMBEDDING_MODEL)
    q_embedding = q_resp['data'][0]['embedding']
    # 返回文档数量:
    q_results = 2
    # 检索的VectorField名称:
    q_vector_field = 'embedding'
    # 检索的Vector参数:
    q_params={'vec': np.array(q_embedding, dtype=np.float32).tobytes()}
    # 构造Query:
    str_query = f'*=>[KNN {q_results} @{q_vector_field} $vec AS score]'
    query = Query(str_query).sort_by('score').return_fields('doc_id', 'score').paging(0, q_results).dialect(2)
    # 执行Query:
    results = redis.ft('idx_doc').search(query, query_params=q_params)
    for doc in results.docs:
        print(doc)

query_doc(redis, '如何用Java实现撮合引擎？')
```

当用户提问“如何用Java实现撮合引擎？”时，返回结果如下：

```plain
如何用Java实现撮合引擎？
[-0.019103992730379105, -0.008535079658031464, -0.011284259147942066, ...]
Document {'id': 'doc:id_123_match_engine', 'payload': None, 'score': '0.171741425991', 'doc_id': 'id_123_match_engine'}
Document {'id': 'doc:id_789_install_jdk', 'payload': None, 'score': '0.212927222252', 'doc_id': 'id_789_install_jdk'}
```

首先将提问转换为Vector，然后，我们根据KNN相似度算法搜索，得到相关度最高的两个文档`doc:id_123_match_engine`和`doc:id_789_install_jdk`（注意score越小说明相关度越高），根据返回的`doc_id`从数据库中读出文档内容，后续流程就是将文档内容嵌入到提问中发给GPT获得回答了。

上述Python代码对应的Redis命令如下：

```plain
127.0.0.1:6379> FT.SEARCH idx_doc *=>[KNN 2 @embedding $vec AS score] RETURN 2 doc_id score SORTBY score ASC DIALECT 2 LIMIT 0 2 params 2 vec \xaf\x9a\xb2...\xd1M\xe0
```

如果SQL数据库支持Vector，那么上述整个流程其实就相当于一个SQL查询：

```sql
SELECT doc_id, doc_content FROM docs WHERE doc_vector LIKE text2vec(?) ORDER BY doc_vector LIMIT ?
```

以上就是使用Embedding实现一个AI驱动的基于语义的问答系统的步骤。后续工程开发需要考虑的要点如下：

1. 文档在数据库中创建、修改、删除时，要相应地更新Redis的索引；
2. 受GPT输入限制，一个非常大的文档需要先分割成若干块，给每一个文本块生成Vector并索引；
3. 对用户请求做限流等。

通过大模型的Embedding实现语义搜索功能十分强大，因为Vector存储的是语义相关性，即使用户使用另一种语言提问，也可以轻松根据语义找出相关性最高的文档：

```plain
>>> query_doc(redis, '環境変数を設定するにはどうすればよいですか?')
環境変数を設定するにはどうすればよいですか?
[0.01713828556239605, -0.012635081075131893, 0.00681354571133852...]
Document {'id': 'doc:id_789_install_jdk', 'payload': None, 'score': '0.217503964901', 'doc_id': 'id_789_install_jdk'}
Document {'id': 'doc:id_456_clearing', 'payload': None, 'score': '0.322280108929', 'doc_id': 'id_456_clearing'}
```

如果我们选择其他大模型，例如ChatGLM或LLaMa，那么就把OpenAI提供的Embedding API替换为其他大模型的接口即可。

### 小结

使用Embedding能轻松实现基于语义的问答系统，非常适合检索内部文档、用于客服系统等。
