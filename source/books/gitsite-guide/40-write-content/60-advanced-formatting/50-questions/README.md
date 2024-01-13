# Questions

## Creating Questions

You can create a question form by add identifier `question` and subtype with a code block.

## Creating single selection

Use `question type=radio` to create a single selection form:

    ```question type=radio
    Which is the first browser that support **JavaScript**?
    ---
        Internet Explorer
    [x] Netscape Navigator
        Mozilla Firefox
        Google Chrome
    ```

The question and anwsers are seperated by `---`, and use `[x]` to mark the correct answer.

```question type=radio
Which is the first browser that support **JavaScript**?
---
    Internet Explorer
[x] Netscape Navigator
    Mozilla Firefox
    Google Chrome
```

## Creating multiple selections

Use `question type=checkbox` to create a multiple selection form:

    ```question type=checkbox
    The planets that in the solar system:
    ---
    [x] Earth
    [x] Mercury
        Moon
        Halley
    [x] Jupiter
    ```

```question type=checkbox
The planets that in the solar system:
---
[x] Earth
[x] Mercury
    Moon
    Halley
[x] Jupiter
```

## Creating text input

Use `question type=text` to create a text input form:

    ```question type=text
    The largest planet in the solar system is:
    ----
    Jupiter
    ```

```question type=text
The largest planet in the solar system is:
----
Jupiter
```

Add `ignorecase` to ignore the case of answer:

    ```question type=text ignorecase
    The largest planet in the solar system is (ignore case):
    ----
    Jupiter
    ```

Both `Jupiter` and `jupiter` are correct answer:

```question type=text ignorecase
The largest planet in the solar system is (ignore case):
----
Jupiter
```

## Creating date input

Use `question type=date` to create a date input form:

    ```question type=date
    When were the first modern Olympic Games held? (July 6, 1896)
    ----
    1896-04-06
    ```

The provided answer must be [ISO-8601](https://en.wikipedia.org/wiki/ISO_8601) date format `yyyy-MM-dd`.

```question type=date
When were the first modern Olympic Games held? (July 6, 1896)
----
1896-04-06
```

## Customizing labels

You can also specify the label of submit, correct and wrong:

    ```question type=radio submit=Validate correct="Yes, it is correct!" wrong="Sorry, it is wrong!"
    Which is the first browser that support **JavaScript**?
    ---
        Internet Explorer
    [x] Netscape Navigator
        Mozilla Firefox
        Google Chrome
    ```

```question type=radio submit=Validate correct="Yes, it is correct!" wrong="Sorry, it is wrong!"
Which is the first browser that support **JavaScript**?
---
    Internet Explorer
[x] Netscape Navigator
    Mozilla Firefox
    Google Chrome
```
