# Code Blocks

You can create fenced code blocks by placing triple backticks <code>```</code> before and after the code block. We recommend placing a blank line before and after code blocks to make the raw formatting easier to read.

    ```
    function test() {
        console.log('Hello, world.');
    }
    ```

```
function test() {
    console.log('Hello, world.');
}
```

## Syntax highlighting

You can add an optional language identifier to enable syntax highlighting in your fenced code block.

Syntax highlighting changes the color and style of source code to make it easier to read.

For example, to syntax highlight Python code:

    ```python
    #!/usr/bin/env python3

    def main():
        name = 'Bob'
        print(f'Hello, {name}')

    if __name__ == '__main__':
        main()
    ```

This will display the code block with syntax highlighting:

```python
#!/usr/bin/env python3

def main():
    name = 'Bob'
    print(f'Hello, {name}')

if __name__ == '__main__':
    main()
```
