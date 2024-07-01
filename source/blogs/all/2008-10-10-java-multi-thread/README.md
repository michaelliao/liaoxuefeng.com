# Java多线程设计模式

Java语言已经内置了多线程支持，所有实现`Runnable`接口的类都可被启动一个新线程，新线程会执行该实例的`run()`方法，当`run()`方法执行完毕后，线程就结束了。一旦一个线程执行完毕，这个实例就不能再重新启动，只能重新生成一个新实例，再启动一个新线程。

`Thread`类是实现了`Runnable`接口的一个实例，它代表一个线程的实例，并且，启动线程的唯一方法就是通过`Thread`类的`start()`实例方法：

```java
Thread t = new Thread();
t.start();
```

`start()`方法是一个native方法，它将启动一个新线程，并执行`run()`方法。`Thread`类默认的`run()`方法什么也不做就退出了。注意：直接调用`run()`方法并不会启动一个新线程，它和调用一个普通的java方法没有什么区别。

因此，有两个方法可以实现自己的线程：

方法1：自己的类extend Thread，并复写`run()`方法，就可以启动新线程并执行自己定义的`run()`方法。例如：

```java
public class MyThread extends Thread {
    public void run() {
        System.out.println("MyThread.run()");
    }
}
```

在合适的地方启动线程：`new MyThread().start()`;

方法2：如果自己的类已经extends另一个类，就无法直接extends Thread，此时，必须实现一个`Runnable`接口：

```java
public class MyThread extends OtherClass implements Runnable {
    public void run() {
        System.out.println("MyThread.run()");
    }
}
```

为了启动`MyThread`，需要首先实例化一个`Thread`，并传入自己的`MyThread`实例：

```java
MyThread myt = new MyThread();
Thread t = new Thread(myt);
t.start();
```

事实上，当传入一个`Runnable`参数给`Thread`后，`Thread`的`run()`方法就会调用`target.run()`，参考JDK源代码：

```java
public void run() {
    if (target != null) {
        target.run();
    }
}
```

线程还有一些`Name`, `ThreadGroup`, `isDaemon`等设置，由于和线程设计模式关联很少，这里就不多说了。

### 线程的同步

由于同一进程内的多个线程共享内存空间，在Java中，就是共享实例，当多个线程试图同时修改某个实例的内容时，就会造成冲突，因此，线程必须实现共享互斥，使多线程同步。

最简单的同步是将一个方法标记为`synchronized`，对同一个实例来说，任一时刻只能有一个`synchronized`方法在执行。当一个方法正在执行某个`synchronized`方法时，其他线程如果想要执行这个实例的任意一个`synchronized`方法，都必须等待当前执行 `synchronized`方法的线程退出此方法后，才能依次执行。

但是，非`synchronized`方法不受影响，不管当前有没有执行`synchronized`方法，非`synchronized`方法都可以被多个线程同时执行。

此外，必须注意，只有同一实例的`synchronized`方法同一时间只能被一个线程执行，不同实例的`synchronized`方法是可以并发的。例如，class A定义了`synchronized`方法`sync()`，则不同实例`a1.sync()`和`a2.sync()`可以同时由两个线程来执行。

### Java锁机制

多线程同步的实现最终依赖锁机制。我们可以想象某一共享资源是一间屋子，每个人都是一个线程。当A希望进入房间时，他必须获得门锁，一旦A获得门锁，他进去后就立刻将门锁上，于是B,C,D...就不得不在门外等待，直到A释放锁出来后，B,C,D...中的某一人抢到了该锁（具体抢法依赖于 JVM的实现，可以先到先得，也可以随机挑选），然后进屋又将门锁上。这样，任一时刻最多有一人在屋内（使用共享资源）。

Java语言规范内置了对多线程的支持。对于Java程序来说，每一个对象实例都有一把“锁”，一旦某个线程获得了该锁，别的线程如果希望获得该锁，只能等待这个线程释放锁之后。获得锁的方法只有一个，就是`synchronized`关键字。例如：

```java
public class SharedResource {

    private int count = 0;

    public int getCount() { return count; }

    public synchronized void setCount(int count) { this.count = count; }
}
```

注意，如果将`synchronized`关键字标记在方法上，例如上面的：

```java
public synchronized void setCount(int count) { ... }
```

那么，锁住的是哪个对象呢？答案是*this*对象，因此，以上方法事实上完全等同于下面的写法：

```java
public void setCount(int count) {
    synchronized(this) { // 在此获得this锁
        this.count = count;
    } // 在此释放this锁
}
```

`synchronized {}`括号内的部分表示需要同步的代码段，该区域为“危险区域”，如果两个以上的线程同时执行，会引发冲突，因此，要更改`SharedResource`的内部状态，必须先获得`SharedResource`实例的锁。

退出`synchronized`块时，线程拥有的锁自动释放，于是，别的线程又可以获取该锁了。

为了提高性能，不一定要锁定`this`，例如，`SharedResource`有两个独立变化的变量：

```java
public class SharedResouce {

    private int a = 0;
    private int b = 0;

    public synchronized void setA(int a) { this.a = a; }

    public synchronized void setB(int b) { this.b = b; }
}
```

若同步整个方法，则`setA()`的时候无法`setB()`，`setB()`时无法`setA()`。为了提高性能，可以使用不同对象的锁：

```java
public class SharedResouce {

    private int a = 0;
    private int b = 0;

    private Object sync_a = new Object();
    private Object sync_b = new Object();

    public void setA(int a) {
        synchronized(sync_a) {
            this.a = a;
        }
    }

    public void setB(int b) {
        synchronized(sync_b) {
            this.b = b;
        }
    }
}
```

如果将`synchronized`关键字标记在静态方法上，由于静态方法不可能访问`this`实例，那么，锁住的是哪个对象呢？答案是*当前类的Class对象*，原因是每个对象的Class实例是唯一且不可变的。比如：

```java
public synchronized static void sync() { ... }
```

事实上完全等同于下面的写法：

```java
public static void sync() {
    synchronized(SharedResource.class) {
        ...
    }
}
```

### wait/notify机制

通常，多线程之间需要协调工作。例如，浏览器的一个显示图片的线程`displayThread`想要执行显示图片的任务，必须等待下载线程`downloadThread`将该图片下载完毕。如果图片还没有下载完，`displayThread`可以暂停，当`downloadThread`完成了任务后，再通知`displayThread`“图片准备完毕，可以显示了”，这时，`displayThread`继续执行。

以上逻辑简单的说就是：如果条件不满足，则等待。当条件满足时，等待该条件的线程将被唤醒。在Java中，这个机制的实现依赖于wait/notify。等待机制与锁机制是密切关联的。例如：

```java
synchronized(obj) {
    while(!condition) {
        obj.wait();
    }
    obj.doSomething();
}
```

当线程A获得了`obj`锁后，发现条件condition不满足，无法继续下一处理，于是线程A就`wait()`。

在另一线程B中，如果B更改了某些条件，使得线程A的condition条件满足了，就可以唤醒线程A：

```java
synchronized(obj) {
    condition = true;
    obj.notify();
}
```

需要注意的概念是：

* 调用`obj`的`wait()`, `notify()`方法前，必须获得`obj`锁，也就是必须写在`synchronized(obj) {...}`代码段内。
* 调用`obj.wait()`后，线程A就释放了`obj`的锁，否则线程B无法获得`obj`锁，也就无法在`synchronized(obj) {...}`代码段内唤醒A。
* 当`obj.wait()`方法返回后，线程A需要再次获得`obj`锁，才能继续执行。
* 如果A1,A2,A3都在`obj.wait()`，则B调用`obj.notify()`只能唤醒A1,A2,A3中的一个（具体哪一个由JVM决定）。
* `obj.notifyAll()`则能全部唤醒A1,A2,A3，但是要继续执行`obj.wait()`的下一条语句，必须获得obj锁，因此，A1,A2,A3只有一个有机会获得锁继续执行，例如A1，其余的需要等待A1释放obj锁之后才能继续执行。
* 当B调用`obj.notify()`/`obj.notifyAll()`的时候，B正持有`obj`锁，因此，A1,A2,A3虽被唤醒，但是仍无法获得`obj`锁。直到B退出`synchronized`块，释放`obj`锁后，A1,A2,A3中的一个才有机会获得锁继续执行。

### wait/sleep的区别

`Thread`还有一个`sleep()`静态方法，它也能使线程暂停一段时间。`sleep()`与`wait()`的不同点是：`sleep()`并不释放锁，并且`sleep()`的暂停和`wait()`暂停是不一样的。`obj.wait()`会使线程进入`obj`对象的等待集合中并等待唤醒。

但是`wait()`和`sleep()`都可以通过`interrupt()`方法打断线程的暂停状态，从而使线程立刻抛出`InterruptedException`。

如果线程A希望立即结束线程B，则可以对线程B对应的Thread实例调用interrupt方法。如果此刻线程B正在wait/sleep/join，则线程B会立刻抛出`InterruptedException`，在`catch() {}`中直接`return`即可安全地结束线程。

需要注意的是，`InterruptedException`是线程自己从内部抛出的，并不是`interrupt()`方法抛出的。对某一线程调用 `interrupt()`时，如果该线程正在执行普通的代码，那么该线程根本就不会抛出`InterruptedException`。但是，一旦该线程进入到`wait()`/`sleep()`/`join()`后，就会立刻抛出`InterruptedException`。

### Worker Pattern

前面谈了多线程应用程序能极大地改善用户相应。例如对于一个Web应用程序，每当一个用户请求服务器连接时，服务器就可以启动一个新线程为用户服务。

然而，创建和销毁线程本身就有一定的开销，如果频繁创建和销毁线程，CPU和内存开销就不可忽略，垃圾收集器还必须负担更多的工作。因此，线程池就是为了避免频繁创建和销毁线程。

每当服务器接受了一个新的请求后，服务器就从线程池中挑选一个等待的线程并执行请求处理。处理完毕后，线程并不结束，而是转为阻塞状态再次被放入线程池中。这样就避免了频繁创建和销毁线程。

Worker Pattern实现了类似线程池的功能。首先定义`Task`接口：

```java
public interface Task {
    void execute();
}
```

线程将负责执行`execute()`方法。注意到任务是由子类通过实现`execute()`方法实现的，线程本身并不知道自己执行的任务。它只负责运行一个耗时的`execute()`方法。

具体任务由子类实现，我们定义了一个`CalculateTask`和一个`TimerTask`：

```java
// CalculateTask.java
public class CalculateTask implements Task {
    private static int count = 0;
    private int num = count;

    public CalculateTask() {
        count++;
    }

    public void execute() {
        System.out.println("[CalculateTask " + num + "] start...");
        try {
            Thread.sleep(3000);
        }
        catch(InterruptedException ie) {}
        System.out.println("[CalculateTask " + num + "] done.");
    }
}

// TimerTask.java
public class TimerTask implements Task {
    private static int count = 0;
    private int num = count;

    public TimerTask() {
        count++;
    }

    public void execute() {
        System.out.println("[TimerTask " + num + "] start...");
        try {
            Thread.sleep(2000);
        }
        catch(InterruptedException ie) {}
        System.out.println("[TimerTask " + num + "] done.");
    }
}
```

以上任务均简单的`sleep()`若干秒。

`TaskQueue`实现了一个队列，客户端可以将请求放入队列，服务器线程可以从队列中取出任务：

```java
import java.util.*;

public class TaskQueue {
    private List queue = new LinkedList();

    public synchronized Task getTask() {
        while(queue.size()==0) {
            try {
                this.wait();
            }
            catch(InterruptedException ie) {
                return null;
            }
        }
        return (Task)queue.remove(0);
    }

    public synchronized void putTask(Task task) {
        queue.add(task);
        this.notifyAll();
    }
}
```

终于到了真正的`WorkerThread`，这是真正执行任务的服务器线程：

```java
public class WorkerThread extends Thread {
    private static int count = 0;
    private boolean busy = false;
    private boolean stop = false;
    private TaskQueue queue;

    public WorkerThread(ThreadGroup group, TaskQueue queue) {
        super(group, "worker-" + count);
        count++;
        this.queue = queue;
    }

    public void shutdown() {
        stop = true;
        this.interrupt();
        try {
            this.join();
        }
        catch(InterruptedException ie) {}
    }

    public boolean isIdle() {
        return !busy;
    }

    public void run() {
        System.out.println(getName() + " start.");
        while(!stop) {
            Task task = queue.getTask();
            if(task!=null) {
                busy = true;
                task.execute();
                busy = false;
            }
        }
        System.out.println(getName() + " end.");
    }
}
```

前面已经讲过，`queue.getTask()`是一个阻塞方法，服务器线程可能在此`wait()`一段时间。此外，`WorkerThread`还有一个`shutdown()`方法，用于安全结束线程。

最后是`ThreadPool`，负责管理所有的服务器线程，还可以动态增加和减少线程数：

```java
import java.util.*;

public class ThreadPool extends ThreadGroup {
    private List threads = new LinkedList();
    private TaskQueue queue;

    public ThreadPool(TaskQueue queue) {
        super("Thread-Pool");
        this.queue = queue;
    }

    public synchronized void addWorkerThread() {
        Thread t = new WorkerThread(this, queue);
        threads.add(t);
        t.start();
    }

    public synchronized void removeWorkerThread() {
        if(threads.size()>0) {
            WorkerThread t = (WorkerThread)threads.remove(0);
            t.shutdown();
        }
    }

    public synchronized void currentStatus() {
        System.out.println("-----------------------------------------------");
        System.out.println("Thread count = " + threads.size());
        Iterator it = threads.iterator();
        while(it.hasNext()) {
            WorkerThread t = (WorkerThread)it.next();
            System.out.println(t.getName() + ": " + (t.isIdle() ? "idle" : "busy"));
        }
        System.out.println("-----------------------------------------------");
    }
}
```

`currentStatus()`方法是为了方便调试，打印出所有线程的当前状态。

最后，`Main`负责完成`main()`方法：

```java
public class Main {
    public static void main(String[] args) {
        TaskQueue queue = new TaskQueue();
        ThreadPool pool = new ThreadPool(queue);
        for(int i=0; i<10; i++) {
            queue.putTask(new CalculateTask());
            queue.putTask(new TimerTask());
        }
        pool.addWorkerThread();
        pool.addWorkerThread();
        doSleep(8000);
        pool.currentStatus();
        pool.addWorkerThread();
        pool.addWorkerThread();
        pool.addWorkerThread();
        pool.addWorkerThread();
        pool.addWorkerThread();
        doSleep(5000);
        pool.currentStatus();
    }

    private static void doSleep(long ms) {
        try {
            Thread.sleep(ms);
        }
        catch(InterruptedException ie) {}
    }
}
```

`main()`一开始放入了20个`Task`，然后动态添加了一些服务线程，并定期打印线程状态，运行结果如下：

```plain
worker-0 start.
[CalculateTask 0] start...
worker-1 start.
[TimerTask 0] start...
[TimerTask 0] done.
[CalculateTask 1] start...
[CalculateTask 0] done.
[TimerTask 1] start...
[CalculateTask 1] done.
[CalculateTask 2] start...
[TimerTask 1] done.
[TimerTask 2] start...
[TimerTask 2] done.
[CalculateTask 3] start...
-----------------------------------------------
Thread count = 2
worker-0: busy
worker-1: busy
-----------------------------------------------
[CalculateTask 2] done.
[TimerTask 3] start...
worker-2 start.
[CalculateTask 4] start...
worker-3 start.
[TimerTask 4] start...
worker-4 start.
[CalculateTask 5] start...
worker-5 start.
[TimerTask 5] start...
worker-6 start.
[CalculateTask 6] start...
[CalculateTask 3] done.
[TimerTask 6] start...
[TimerTask 3] done.
[CalculateTask 7] start...
[TimerTask 4] done.
[TimerTask 7] start...
[TimerTask 5] done.
[CalculateTask 8] start...
[CalculateTask 4] done.
[TimerTask 8] start...
[CalculateTask 5] done.
[CalculateTask 9] start...
[CalculateTask 6] done.
[TimerTask 9] start...
[TimerTask 6] done.
[TimerTask 7] done.
-----------------------------------------------
Thread count = 7
worker-0: idle
worker-1: busy
worker-2: busy
worker-3: idle
worker-4: busy
worker-5: busy
worker-6: busy
-----------------------------------------------
[CalculateTask 7] done.
[CalculateTask 8] done.
[TimerTask 8] done.
[TimerTask 9] done.
[CalculateTask 9] done.
```

仔细观察：一开始只有两个服务器线程，因此线程状态都是忙，后来线程数增多，7个线程中的两个状态变成`idle`，说明处于`wait()`状态。

思考：本例的线程调度算法其实根本没有，因为这个应用是围绕`TaskQueue`设计的，不是以Thread Pool为中心设计的。因此，Task调度取决于`TaskQueue`的`getTask()`方法，你可以改进这个方法，例如使用优先队列，使优先级高的任务先被执行。

如果所有的服务器线程都处于`busy`状态，则说明任务繁忙，`TaskQueue`的队列越来越长，最终会导致服务器内存耗尽。因此，可以限制 `TaskQueue`的等待任务数，超过最大长度就拒绝处理。许多Web服务器在用户请求繁忙时就会拒绝用户：HTTP 503 SERVICE UNAVAILABLE

从JDK 5开始，`java.util.concurrent`包已经内置了Worker线程模式（即`java.util.concurrent.Executors`），无需我们手动编写上述代码。不过，理解Worker模式的原理非常重要。

### ReadWriteLock模式

多线程读写同一个对象的数据是很普遍的，通常，要避免读写冲突，必须保证任何时候仅有一个线程在写入，有线程正在读取的时候，写入操作就必须等待。简单说，就是要避免“写-写”冲突和“读-写”冲突。但是同时读是允许的，因为“读-读”不冲突，而且很安全。

要实现以上的`ReadWriteLock`，简单的使用`synchronized`就不行，我们必须自己设计一个`ReadWriteLock`类，在读之前，必须先获得“读锁”，写之前，必须先获得“写锁”。举例说明：

`DataHandler`对象保存了一个可读写的`char[]`数组：

```java
public class DataHandler {
    // store data:
    private char[] buffer = "AAAAAAAAAA".toCharArray();

    private char[] doRead() {
        char[] ret = new char[buffer.length];
        for(int i=0; i<buffer.length; i++) {
            ret[i] = buffer[i];
            sleep(3);
        }
        return ret;
    }

    private void doWrite(char[] data) {
        if(data!=null) {
            buffer = new char[data.length];
            for(int i=0; i<buffer.length; i++) {
                buffer[i] = data[i];
                sleep(10);
            }
        }
    }

    private void sleep(int ms) {
        try {
            Thread.sleep(ms);
        }
        catch(InterruptedException ie) {}
    }
}
```

`doRead()`和`doWrite()`方法是非线程安全的读写方法。为了演示，加入了`sleep()`，并设置读的速度大约是写的3倍，这符合通常的情况。

为了让多线程能安全读写，我们设计了一个`ReadWriteLock`：

```java
public class ReadWriteLock {
    private int readingThreads = 0;
    private int writingThreads = 0;
    private int waitingThreads = 0; // waiting for write
    private boolean preferWrite = true;

    public synchronized void readLock() throws InterruptedException {
        while(writingThreads>0 || (preferWrite && waitingThreads>0))
            this.wait();
        readingThreads++;
    }

    public synchronized void readUnlock() {
        readingThreads--;
        preferWrite = true;
        notifyAll();
    }

    public synchronized void writeLock() throws InterruptedException {
        waitingThreads++;
        try {
            while(readingThreads>0 || writingThreads>0)
                this.wait();
        }
        finally {
            waitingThreads--;
        }
        writingThreads++;
    }

    public synchronized void writeUnlock() {
        writingThreads--;
        preferWrite = false;
        notifyAll();
    }
}
```

`readLock()`用于获得读锁，`readUnlock()`释放读锁，`writeLock()`和`writeUnlock()`一样。由于锁用完必须释放，因此，必须保证lock和unlock匹配。我们修改`DataHandler`，加入`ReadWriteLock`：

```java
public class DataHandler {
    // store data:
    private char[] buffer = "AAAAAAAAAA".toCharArray();

    // lock:
    private ReadWriteLock lock = new ReadWriteLock();

    public char[] read(String name) throws InterruptedException {
        System.out.println(name + " waiting for read...");
        lock.readLock();
        try {
            char[] data = doRead();
            System.out.println(name + " reads data: " + new String(data));
            return data;
        }
        finally {
            lock.readUnlock();
        }
    }

    public void write(String name, char[] data) throws InterruptedException {
        System.out.println(name + " waiting for write...");
        lock.writeLock();
        try {
            System.out.println(name + " wrote data: " + new String(data));
            doWrite(data);
        }
        finally {
            lock.writeUnlock();
        }
    }

    private char[] doRead() {
        char[] ret = new char[buffer.length];
        for(int i=0; i<buffer.length; i++) {
            ret[i] = buffer[i];
            sleep(3);
        }
        return ret;
    }

    private void doWrite(char[] data) {
        if(data!=null) {
            buffer = new char[data.length];
            for(int i=0; i<buffer.length; i++) {
                buffer[i] = data[i];
                sleep(10);
            }
        }
    }

    private void sleep(int ms) {
        try {
            Thread.sleep(ms);
        }
        catch(InterruptedException ie) {}
    }
}
```

`public`方法`read()`和`write()`完全封装了底层的`ReadWriteLock`，因此，多线程可以安全地调用这两个方法：

```java
// ReadingThread不断读取数据：
public class ReadingThread extends Thread {
    private DataHandler handler;

    public ReadingThread(DataHandler handler) {
        this.handler = handler;
    }

    public void run() {
        for(;;) {
            try {
                char[] data = handler.read(getName());
                Thread.sleep((long)(Math.random()*1000+100));
            }
            catch(InterruptedException ie) {
                break;
            }
        }
    }
}

// WritingThread不断写入数据，每次写入的都是10个相同的字符：
public class WritingThread extends Thread {
    private DataHandler handler;

    public WritingThread(DataHandler handler) {
        this.handler = handler;
    }

    public void run() {
        char[] data = new char[10];
        for(;;) {
            try {
                fill(data);
                handler.write(getName(), data);
                Thread.sleep((long)(Math.random()*1000+100));
            }
            catch(InterruptedException ie) {
                break;
            }
        }
    }

    // 产生一个A-Z随机字符，填入char[10]:
    private void fill(char[] data) {
        char c = (char)(Math.random()*26+'A');
        for(int i=0; i<data.length; i++)
            data[i] = c;
    }
}
```

最后`Main`负责启动这些线程：

```java
public class Main {
    public static void main(String[] args) {
        DataHandler handler = new DataHandler();
        Thread[] ts = new Thread[] {
                new ReadingThread(handler),
                new ReadingThread(handler),
                new ReadingThread(handler),
                new ReadingThread(handler),
                new ReadingThread(handler),
                new WritingThread(handler),
                new WritingThread(handler)
        };
        for(int i=0; i<ts.length; i++) {
            ts[i].start();
        }
    }
}
```

我们启动了5个读线程和2个写线程，运行结果如下：

```plain
Thread-0 waiting for read...
Thread-1 waiting for read...
Thread-2 waiting for read...
Thread-3 waiting for read...
Thread-4 waiting for read...
Thread-5 waiting for write...
Thread-6 waiting for write...
Thread-4 reads data: AAAAAAAAAA
Thread-3 reads data: AAAAAAAAAA
Thread-2 reads data: AAAAAAAAAA
Thread-1 reads data: AAAAAAAAAA
Thread-0 reads data: AAAAAAAAAA
Thread-5 wrote data: EEEEEEEEEE
Thread-6 wrote data: MMMMMMMMMM
Thread-1 waiting for read...
Thread-4 waiting for read...
Thread-1 reads data: MMMMMMMMMM
Thread-4 reads data: MMMMMMMMMM
Thread-2 waiting for read...
Thread-2 reads data: MMMMMMMMMM
Thread-0 waiting for read...
Thread-0 reads data: MMMMMMMMMM
Thread-4 waiting for read...
Thread-4 reads data: MMMMMMMMMM
Thread-2 waiting for read...
Thread-5 waiting for write...
Thread-2 reads data: MMMMMMMMMM
Thread-5 wrote data: GGGGGGGGGG
Thread-6 waiting for write...
Thread-6 wrote data: AAAAAAAAAA
Thread-3 waiting for read...
Thread-3 reads data: AAAAAAAAAA
......
```

可以看到，每次读/写都是完整的原子操作，因为我们每次写入的都是10个相同字符。并且，每次读出的都是最近一次写入的内容。

如果去掉`ReadWriteLock`：

```java
public class DataHandler {
    // store data:
    private char[] buffer = "AAAAAAAAAA".toCharArray();

    public char[] read(String name) throws InterruptedException {
        char[] data = doRead();
        System.out.println(name + " reads data: " + new String(data));
        return data;
    }

    public void write(String name, char[] data) throws InterruptedException {
        System.out.println(name + " wrote data: " + new String(data));
        doWrite(data);
    }

    private char[] doRead() {
        char[] ret = new char[10];
        for(int i=0; i<10; i++) {
            ret[i] = buffer[i];
            sleep(3);
        }
        return ret;
    }

    private void doWrite(char[] data) {
        for(int i=0; i<10; i++) {
            buffer[i] = data[i];
            sleep(10);
        }
    }

    private void sleep(int ms) {
        try {
            Thread.sleep(ms);
        }
        catch(InterruptedException ie) {}
    }
}
```

运行结果如下：

```plain
Thread-5 wrote data: AAAAAAAAAA
Thread-6 wrote data: MMMMMMMMMM
Thread-0 reads data: AAAAAAAAAA
Thread-1 reads data: AAAAAAAAAA
Thread-2 reads data: AAAAAAAAAA
Thread-3 reads data: AAAAAAAAAA
Thread-4 reads data: AAAAAAAAAA
Thread-2 reads data: MAAAAAAAAA
Thread-3 reads data: MAAAAAAAAA
Thread-5 wrote data: CCCCCCCCCC
Thread-1 reads data: MAAAAAAAAA
Thread-0 reads data: MAAAAAAAAA
Thread-4 reads data: MAAAAAAAAA
Thread-6 wrote data: EEEEEEEEEE
Thread-3 reads data: EEEEECCCCC
Thread-4 reads data: EEEEEEEEEC
Thread-1 reads data: EEEEEEEEEE
```

从最后4行可以看到在Thread-6写入EEEEEEEEEE的过程中，3个线程读取的内容是不同的。

### 思考

Java的`synchronized`提供了最底层的物理锁，要在synchronized的基础上，实现自己的逻辑锁，就必须仔细设计`ReadWriteLock`。

Q: `lock.readLock()`为什么不放入`try { }`内？

A: 因为`readLock()`会抛出`InterruptedException`，导致`readingThreads++`不执行，而`readUnlock()`在`finally { }`中，导致`readingThreads--`执行，从而使`readingThread`状态出错。`writeLock()`也是类似的。

Q: `preferWrite`有用吗？

A: 如果去掉`preferWrite`，线程安全不受影响。但是，如果读取线程很多，上一个线程还没有读取完，下一个线程又开始读了，就导致写入线程长时间无法获得`writeLock`；如果写入线程等待的很多，一个接一个写，也会导致读取线程长时间无法获得`readLock`。`preferWrite`的作用是让读/写交替执行，避免由于读线程繁忙导致写无法进行和由于写线程繁忙导致读无法进行。

Q: `notifyAll()`换成`notify()`行不行？

A: 不可以。由于`preferWrite`的存在，如果一个线程刚读取完毕，此时`preferWrite=true`，再`notify()`，若恰好唤醒的是一个读线程，则`while(writingThreads>0 || (preferWrite && waitingThreads>0))`可能为`true`导致该读线程继续等待，而等待写入的线程也处于`wait()`中，结果所有线程都处于`wait()`状态，谁也无法唤醒谁。因此，`notifyAll()`比`notify()`要来得安全。程序验证`notify()`带来的死锁：

```plain
Thread-0 waiting for read...
Thread-1 waiting for read...
Thread-2 waiting for read...
Thread-3 waiting for read...
Thread-4 waiting for read...
Thread-5 waiting for write...
Thread-6 waiting for write...
Thread-0 reads data: AAAAAAAAAA
Thread-4 reads data: AAAAAAAAAA
Thread-3 reads data: AAAAAAAAAA
Thread-2 reads data: AAAAAAAAAA
Thread-1 reads data: AAAAAAAAAA
Thread-5 wrote data: CCCCCCCCCC
Thread-2 waiting for read...
Thread-1 waiting for read...
Thread-3 waiting for read...
Thread-0 waiting for read...
Thread-4 waiting for read...
Thread-6 wrote data: LLLLLLLLLL
Thread-5 waiting for write...
Thread-6 waiting for write...
Thread-2 reads data: LLLLLLLLLL
Thread-2 waiting for read...
（运行到此不动了）
```

注意到这种死锁是由于所有线程都在等待别的线程唤醒自己，结果都无法醒过来。这和两个线程希望获得对方已有的锁造成死锁不同。因此多线程设计的难度远远高于单线程应用。

从JDK 5开始，`java.util.concurrent`包就已经包含了`ReadWriteLock`，使用更简单，无需我们自行实现上述代码。但是，理解`ReadWriteLock`的原理仍非常重要。
