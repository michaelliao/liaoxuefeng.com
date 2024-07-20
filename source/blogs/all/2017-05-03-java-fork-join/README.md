# Java的Fork/Join任务，你写对了吗？

当我们需要执行大量的小任务时，有经验的Java开发人员都会采用线程池来高效执行这些小任务。然而，有一种任务，例如，对超过1000万个元素的数组进行排序，这种任务本身可以并发执行，但如何拆解成小任务需要在任务执行的过程中动态拆分。这样，大任务可以拆成小任务，小任务还可以继续拆成更小的任务，最后把任务的结果汇总合并，得到最终结果，这种模型就是Fork/Join模型。

Java7引入了Fork/Join框架，我们通过`RecursiveTask`这个类就可以方便地实现Fork/Join模式。

例如，对一个大数组进行并行求和的`RecursiveTask`，就可以这样编写：

```java
class SumTask extends RecursiveTask<Long> {
    static final int THRESHOLD = 100;
    long[] array;
    int start;
    int end;

    SumTask(long[] array, int start, int end) {
    this.array = array;
        this.start = start;
        this.end = end;
    }

    @Override
    protected Long compute() {
        if (end - start <= THRESHOLD) {
            // 如果任务足够小,直接计算:
            long sum = 0;
            for (int i = start; i < end; i++) {
                sum += array[i];
            }
            try {
                Thread.sleep(1000);
            } catch (InterruptedException e) {
            }
            System.out.println(String.format("compute %d~%d = %d", start, end, sum));
            return sum;
        }
        // 任务太大,一分为二:
        int middle = (end + start) / 2;
        System.out.println(String.format("split %d~%d ==> %d~%d, %d~%d", start, end, start, middle, middle, end));
        SumTask subtask1 = new SumTask(this.array, start, middle);
        SumTask subtask2 = new SumTask(this.array, middle, end);
        invokeAll(subtask1, subtask2);
        Long subresult1 = subtask1.join();
        Long subresult2 = subtask2.join();
        Long result = subresult1 + subresult2;
        System.out.println("result = " + subresult1 + " + " + subresult2 + " ==> " + result);
        return result;
    }
}
```

编写这个Fork/Join任务的关键在于，在执行任务的`compute()`方法内部，先判断任务是不是足够小，如果足够小，就直接计算并返回结果（注意模拟了1秒延时），否则，把自身任务一拆为二，分别计算两个子任务，再返回两个子任务的结果之和。

最后写一个`main()`方法测试：

```java
public static void main(String[] args) throws Exception {
    // 创建随机数组成的数组:
    long[] array = new long[400];
    fillRandom(array);
    // fork/join task:
    ForkJoinPool fjp = new ForkJoinPool(4); // 最大并发数4
    ForkJoinTask<Long> task = new SumTask(array, 0, array.length);
    long startTime = System.currentTimeMillis();
    Long result = fjp.invoke(task);
    long endTime = System.currentTimeMillis();
    System.out.println("Fork/join sum: " + result + " in " + (endTime - startTime) + " ms.");
}
```

关键代码是`fjp.invoke(task)`来提交一个Fork/Join任务并发执行，然后获得异步执行的结果。

我们设置任务的最小阈值是100，当提交一个400大小的任务时，在4核CPU上执行，会一分为二，再二分为四，每个最小子任务的执行时间是1秒，由于是并发4个子任务执行，整个任务最终执行时间大约为1秒。

新手在编写Fork/Join任务时，往往用搜索引擎搜到一个例子，然后就照着例子写出了下面的代码：

```java
protected Long compute() {
    if (任务足够小?) {
        return computeDirect();
    }
    // 任务太大,一分为二:
    SumTask subtask1 = new SumTask(...);
    SumTask subtask2 = new SumTask(...);
    // 分别对子任务调用fork():
    subtask1.fork();
    subtask2.fork();
    // 合并结果:
    Long subresult1 = subtask1.join();
    Long subresult2 = subtask2.join();
    return subresult1 + subresult2;
}
```

很遗憾，这种写法是**错！误！的！**这样写没有正确理解Fork/Join模型的任务执行逻辑。

JDK用来执行Fork/Join任务的工作线程池大小等于CPU核心数。在一个4核CPU上，最多可以同时执行4个子任务。对400个元素的数组求和，执行时间应该为1秒。但是，换成上面的代码，执行时间却是两秒。

这是因为执行`compute()`方法的线程本身也是一个Worker线程，当对两个子任务调用`fork()`时，这个Worker线程就会把任务分配给另外两个Worker，但是它自己却停下来等待不干活了！这样就白白浪费了Fork/Join线程池中的一个Worker线程，导致了4个子任务至少需要7个线程才能并发执行。

打个比方，假设一个酒店有400个房间，一共有4名清洁工，每个工人每天可以打扫100个房间，这样，4个工人满负荷工作时，400个房间全部打扫完正好需要1天。

Fork/Join的工作模式就像这样：首先，工人甲被分配了400个房间的任务，他一看任务太多了自己一个人不行，所以先把400个房间拆成两个200，然后叫来乙，把其中一个200分给乙。

紧接着，甲和乙再发现200也是个大任务，于是甲继续把200分成两个100，并把其中一个100分给丙，类似的，乙会把其中一个100分给丁，这样，最终4个人每人分到100个房间，并发执行正好是1天。

如果换一种写法：

```java
// 分别对子任务调用fork():
subtask1.fork();
subtask2.fork();
```

这个任务就**分！错！了！**

比如甲把400分成两个200后，这种写法相当于甲把一个200分给乙，把另一个200分给丙，然后，甲成了监工，不干活，等乙和丙干完了他直接汇报工作。乙和丙在把200分拆成两个100的过程中，他俩又成了监工，这样，本来只需要4个工人的活，现在需要7个工人才能1天内完成，其中有3个是不干活的。

其实，我们查看JDK的`invokeAll()`方法的源码就可以发现，`invokeAll()`的`N`个任务中，其中`N-1`个任务会使用`fork()`交给其它线程执行，但是，它还会留一个任务自己执行，这样，就充分利用了线程池，保证没有空闲的不干活的线程。

Java多线程难度高，不容易掌握，但又必须学会正确使用，因此选择好的教程至关重要，可以让新手少走弯路。强烈推荐大家学习Java教程的“[多线程编程](../../../books/java/threading/index.html)”，由浅入深，全面理解并掌握多线程编程的知识点。
