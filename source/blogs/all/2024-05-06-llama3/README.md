# 本地快速安装运行史上最强开源LLaMa3大模型

史上最强开源AI大模型——Meta的LLaMa3一经发布，各项指标全面逼近GPT-4。它提供了8B和70B两个版本，8B版本最低仅需4G显存即可运行，可以说是迄今为止能在本地运行的最强LLM。

虽然LLaMa3对中文支持不算好，但HuggingFace上很快出现了各种针对中文的微调模型，本文将从零开始介绍如何在本地运行发布在HuggingFace上的各种LLaMa3大模型。

### 准备环境

本文的演示环境是Mac M1 16G内存，自备科学上网工具，使用开源Ollama运行大模型，使用Open WebUI作为前端访问界面，通过浏览器访问，体验十分接近GPT：

![llama3-ui-chat](llama3-ui.png)

### 安装软件

首先安装Ollama，它可以让我们非常方便地运行各种LLM。从[Ollama官网](https://ollama.com/)下载，运行，点击安装Ollama命令行，然后在命令行测试Ollama是否已正常运行：

```plain
$ ollama -v
ollama version is 0.1.32
```

### 下载模型

Ollama可以直接下载内置的几种模型，但选择有限。我们更希望从[HuggingFace](https://huggingface.co/)下载以便方便地评估各种模型，所以，这里我们并不从Ollama直接下载，而是从HuggingFace下载。

在HuggingFace搜索`llama3`，设置`Languages`为`Chinese`，可以看到若干基于LLaMa3的中文模型：

![llama3-search](download.png)

我们选择一个GGUF格式的模型，GGUF格式是llama.cpp团队搞的一种模型存储格式，一个模型就是一个文件，方便下载：

![llama3-download](download2.png)

点击`Files`，可以看到若干GGUF文件，其中，q越大说明模型质量越高，同时文件也更大，我们选择q6，直接点击下载按钮，把这个模型文件下载到本地。

### 导入模型

下载到本地的模型文件不能直接导入到Ollama，需要编写一个配置文件，随便起个名字，如`config.txt`，配置文件内容如下：

```plain
FROM "/Users/liaoxuefeng/llm/llama3-8b-cn-q6/Llama3-8B-Chinese-Chat.q6_k.GGUF"

TEMPLATE """{{- if .System }}
<|im_start|>system {{ .System }}<|im_end|>
{{- end }}
<|im_start|>user
{{ .Prompt }}<|im_end|>
<|im_start|>assistant
"""

SYSTEM """"""

PARAMETER stop <|im_start|>
PARAMETER stop <|im_end|>
```

第一行`FROM "..."`指定了模型文件路径，需要修改为实际路径，后面的模板内容是网上复制的，无需改动。

然后，使用以下命令导入模型：

```plain
$ ollama create llama3-cn -f ./config.txt
```

`llama3-cn`是我们给模型起的名字，成功导入后可以用`list`命令查看：

```plain
$ ollama list
NAME              ID            SIZE    MODIFIED
llama3-cn:latest  f3fa01629cab  6.6 GB  2 minutes ago
```

可以下载多个模型，给每个模型写一个配置文件（仅需修改路径），导入时起不同的名字，我们就可以用Ollama方便地运行各种模型。

### 运行模型

使用Ollama的`run`命令可以直接运行模型。我们输入命令`ollama run llama3-cn`：

![llama3-run](ollama-cli.png)

出现`>>>`提示符时就可以输入问题与模型交互。输入`/exit`退出。

### 搭建Web环境

使用命令行交互不是很方便，所以我们需要另一个开源的[Open WebUI](https://github.com/open-webui/open-webui)，搭建一个能通过浏览器访问的界面。

运行Open WebUI最简单的方式是直接以Docker运行。我们安装[Docker Desktop](https://www.docker.com/products/docker-desktop/)，输入以下命令启动Open WebUI：

```plain
$ docker run -p 8080:8080 -e OLLAMA_BASE_URL=http://host.docker.internal:11434 --name open-webui --restart always -v open-webui-data:/app/backend/data ghcr.io/open-webui/open-webui:main
```

参数`-p 8080:8080`将Open WebUI的端口映射到本机。参数`-e OLLAMA_BASE_URL=http://host.docker.internal:11434`告诉Open WebUI通过本机的11434访问Ollama，注意地址必须写`host.docker.internal`，不能写`127.0.0.1`。

打开浏览器我们就可以访问[http://127.0.0.1:8080](http://127.0.0.1:8080)，第一次访问需要注册，注册和登录是完全基于本地环境的，登录后就可以看到类似GPT的UI。

我们在聊天界面点击右上角配置按钮，点击`Connections`，点击刷新按钮，如果一切无误，会显示`Server connection verified`：

![llama3-connection](config.png)

在聊天界面的顶部选择一个模型，就可以愉快地开始和LLaMa3聊天了：

![llama3-ui-chat](llama3-ui.png)

### API

Open WebUI还提供了与OpenAI类似的API，使用前先点击设置 - Account，生成一个API Key，然后在命令行用curl测试：

```plain
$ curl -X POST -H "Authorization: Bearer sk-959c8b27a48145bfb83bdb396ff3eeae" -H "Content-Type: application/json" http://localhost:8080/ollama/api/generate -d '{"model":"llama3-cn:latest","stream":false,"prompt":"廖雪峰老师的网站提供了哪些教程？"}'

{"model":"llama3-cn:latest","created_at":"2024-05-01T14:42:28.009353Z","response":"廖雪峰老师是一位知名的技术专家和作家，他的网站提供了一系列关于编程、技术和个人成长的教程和资源。这些教程涵盖了广泛的主题，包括...
```

由于模型是运行在本地，Open WebUI也将数据存储在本地，所以隐私性可谓拉满。如果对一个模型不满意，还可以从HuggingFace下载更多的模型来评估，非常方便。
