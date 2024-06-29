# 如何用AI背英语单词

背英语单词是一个非常乏味的学习过程，各种App虽然多，但都是题库，灵活性太差。

如果利用AI背单词，则可以实现各种定制功能，比如，给出一个单词，让GPT输出音标、英文解释、中文解释，再顺便出道题考一考，针对个性化学习，就具备很强的可定制性。

以下是一个简单的命令行程序，它允许输入一个单词，给出格式化输出：

    #!/usr/bin/env python3
    
    '''
    Call ChatGPT and get result.
    '''
    
    import json
    import urllib
    import urllib.request
    
    def gpt_completion(api_key, model, prompt, content):
        url = 'https://api.openai.com/v1/chat/completions'
        headers = {
            'Content-Type': 'application/json',
            'Authorization': 'Bearer ' + api_key
        }
        body = {
            'model': model,
            'messages': [
                {
                    'role': 'system',
                    'content': prompt
                },
                {
                    'role': 'user',
                    'content': content
                }
            ]
        }
        data = bytes(json.dumps(body), encoding='utf-8')
        req = urllib.request.Request(url, data, headers)
        with urllib.request.urlopen(req) as resp:
            s = resp.read()
        output_json = json.loads(s)
        output_content = output_json['choices'][0]['message']['content']
        if output_content.startswith('```json\n'):
            output_content = output_content[8:len(output_content)-3]
        if output_content.startswith('```\n'):
            output_content = output_content[4:len(output_content)-3]
        return output_content
    
    if __name__ == '__main__':
        api_key = input('API key: ')
        word = input('English word: ')
        model = 'gpt-4'
        prompt = '你是一个高中英语老师'
        content = f'请给出英文单词"{word}"的音标、英文解释、中文解释，英文填空题、答案和中文翻译，并以如下JSON格式返回：'
        content = content + '''
    ```
    {
        "phonetic": 音标,
        "explain_english": 英文解释,
        "explain_chinese": 中文解释,
        "exam": {
            "question": 英文填空题,
            "answer": 答案,
            "translation": 中文翻译
        }
    }
    ```
    '''
        result = gpt_completion(api_key, model, prompt, content)
        print(result)

运行程序：

```plain
$ python3 gpt.py
```

输入：

```plain
API key: sk-GWlz...rFnW
English word: excellent
```

输出：

```json
{
    "phonetic": "/ˈɛksələnt/",
    "explain_english": "Extremely good; outstanding.",
    "explain_chinese": "极好的；出色的；卓越的",
    "exam": {
        "question": "The performance was __________, everyone appreciated it.",
        "answer": "excellent",
        "translation": "该表演非常出色，所有人都对此赞赏有加。"
    }
}
```

这样就可以在App或网页中继续使用生成的JSON数据。
