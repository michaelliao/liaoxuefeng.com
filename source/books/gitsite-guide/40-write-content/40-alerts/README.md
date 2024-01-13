# Alerts

Alerts are a Markdown extension based on the blockquote syntax that you can use to emphasize critical information. On GitHub, they are displayed with distinctive colors and icons to indicate the significance of the content.

Use alerts only when they are crucial for user success and limit them to one or two per article to prevent overloading the reader. Additionally, you should avoid placing alerts consecutively.

To add an alert, add text inside a fenced code block with the `alert type=note` identifier. This is **different** from GitHub which uses a special blockquote line to specify the alert type. Five types of alerts are available:

    ```alert type=note
    Useful information that users should know, even when skimming content.
    ```

    ```alert type=tip
    Helpful advice for doing things better or more easily.
    ```

    ```alert type=important
    Key information users need to know to achieve their goal.
    ```

    ```alert type=warning
    Urgent info that needs *immediate* user attention to avoid problems.
    ```

    ```alert type=caution
    Advises about **risks** or negative outcomes of certain actions.
    ```

```alert type=note
Useful information that users should know, even when skimming content.
```

```alert type=tip
Helpful advice for doing things better or more easily.
```

```alert type=important
Key information users need to know to achieve their goal.
```

```alert type=warning
Urgent info that needs *immediate* user attention to avoid problems.
```

```alert type=caution
Advises about **risks** or negative outcomes of certain actions.
```

To specify the alert title, use `title=Xyz`:

    ```alert type=caution title=Error
    There is an ERROR!
    ```

```alert type=caution title=Error
There is an ERROR!
```

Title that contains spaces must be quoted with `"`:

    ```alert type=tip title="Useful Tips"
    Helpful advice for doing things better or more easily.
    ```

```alert type=tip title="Useful Tips"
Helpful advice for doing things better or more easily.
```
